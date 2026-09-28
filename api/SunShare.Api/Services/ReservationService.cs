/*
 * ============================================================================
 *  File        : ReservationService.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : C - Reservations
 *  Author      : Malkith G W L (IT22630834)
 *  Created     : 2026-09-28
 *  Description : Business rules for creating, updating, cancelling and
 *                approving energy reservations (rules R9-R13, R15-R17).
 * ============================================================================
 */
using System.Security.Cryptography;
using MongoDB.Bson;
using MongoDB.Driver;
using SunShare.Api.Data;
using SunShare.Api.Dtos;
using SunShare.Api.Helpers;
using SunShare.Api.Models;

namespace SunShare.Api.Services;

// All booking rules live here (FAT service). Controllers only pass in the request and who is calling.
public class ReservationService
{
    // Bookings can be made at most this many days ahead (R9).
    private const int MaxDaysAhead = 7;

    // Largest energy amount for one booking, in kWh (R17).
    private const double MaxEnergyKwh = 100;

    private readonly MongoDbContext _db;
    private readonly SlotService _slots;
    private readonly StationService _stations;

    // Receives the database and the slot/station services (to look up and check the chosen slot).
    public ReservationService(MongoDbContext db, SlotService slots, StationService stations)
    {
        _db = db;
        _slots = slots;
        _stations = stations;
    }

    // Creates a booking. It starts Pending and takes one place from its slot.
    // Checks R16 (who it is for), R11 (active prosumer, bookable slot, no double booking), R9 (time), R17 (energy).
    public async Task<ReservationResponse> CreateAsync(CreateReservationRequest request, string callerNic, string callerRole)
    {
        // RULE R16: a prosumer always books for themselves (NIC from the token); staff must say which prosumer.
        string prosumerNic = callerRole == Roles.Prosumer ? callerNic : NicValidator.Normalize(request.ProsumerNic);
        if (prosumerNic == "")
        {
            throw new ApiException(400, "Please choose the prosumer this booking is for.");
        }
        User prosumer = await FindActiveProsumerAsync(prosumerNic);
        ValidateEnergyAndType(request.EnergyKwh, request.Type);
        var (slot, station) = await LoadBookableSlotAsync(request.SlotId);
        await CheckNotAlreadyBookedAsync(prosumer.Nic, slot.Id, null);

        // RULE R12: take one place from the slot (fails with 409 if someone just took the last one).
        await TakePlaceAsync(slot.Id);

        DateTime now = DateTime.UtcNow;
        var reservation = new EnergyReservation
        {
            Id = ObjectId.GenerateNewId().ToString(),
            ProsumerNic = prosumer.Nic,
            ProsumerName = prosumer.FullName,
            EnergyKwh = request.EnergyKwh,
            Type = request.Type,
            // RULE R13: every new booking starts Pending and needs staff approval.
            Status = ReservationStatuses.Pending,
            CreatedAt = now,
            UpdatedAt = now
        };
        CopySlotDetails(reservation, slot, station);

        await _db.EnergyReservations.InsertOneAsync(reservation);
        return ReservationMapper.ToResponse(reservation);
    }

    // Changes a booking's slot, energy amount or type.
    // Checks R16 (own booking), R15 + R10 (still changeable), R11 + R9 for a new slot, R17 (energy).
    public async Task<ReservationResponse> UpdateAsync(string id, UpdateReservationRequest request, string callerNic, string callerRole)
    {
        EnergyReservation reservation = await FindOrThrowAsync(id);
        CheckOwner(reservation, callerNic, callerRole);
        CheckCanChange(reservation);
        await FindActiveProsumerAsync(reservation.ProsumerNic);
        ValidateEnergyAndType(request.EnergyKwh, request.Type);

        bool moving = !string.IsNullOrWhiteSpace(request.SlotId) && request.SlotId != reservation.SlotId;
        bool changed = moving || request.EnergyKwh != reservation.EnergyKwh || request.Type != reservation.Type;
        if (!changed)
        {
            return ReservationMapper.ToResponse(reservation);
        }

        if (moving)
        {
            var (newSlot, newStation) = await LoadBookableSlotAsync(request.SlotId);
            await CheckNotAlreadyBookedAsync(reservation.ProsumerNic, newSlot.Id, reservation.Id);
            // RULE R12: moving = the new slot loses a place, the old slot gets one back.
            await TakePlaceAsync(newSlot.Id);
            await GivePlaceBackAsync(reservation.SlotId);
            CopySlotDetails(reservation, newSlot, newStation);
        }
        reservation.EnergyKwh = request.EnergyKwh;
        reservation.Type = request.Type;

        // RULE R13: an edited Approved booking must be approved again, and its old QR code stops working.
        if (reservation.Status == ReservationStatuses.Approved)
        {
            reservation.Status = ReservationStatuses.Pending;
            reservation.QrToken = null;
            reservation.ApprovedBy = null;
            reservation.ApprovedAt = null;
        }
        reservation.UpdatedAt = DateTime.UtcNow;

        await _db.EnergyReservations.ReplaceOneAsync(r => r.Id == reservation.Id, reservation);
        return ReservationMapper.ToResponse(reservation);
    }

    // Cancels a booking and gives its place back to the slot.
    // Checks R16 (own booking) and R15 + R10 (still changeable), then R12 (+1 place).
    public async Task<ReservationResponse> CancelAsync(string id, string callerNic, string callerRole)
    {
        EnergyReservation reservation = await FindOrThrowAsync(id);
        CheckOwner(reservation, callerNic, callerRole);
        CheckCanChange(reservation);

        DateTime now = DateTime.UtcNow;
        reservation.Status = ReservationStatuses.Cancelled;
        reservation.QrToken = null;
        reservation.CancelledBy = callerNic;
        reservation.CancelledAt = now;
        reservation.UpdatedAt = now;
        await _db.EnergyReservations.ReplaceOneAsync(r => r.Id == reservation.Id, reservation);

        // RULE R12: a cancelled booking frees its place.
        await GivePlaceBackAsync(reservation.SlotId);
        return ReservationMapper.ToResponse(reservation);
    }

    // Staff approve a Pending booking: it becomes Approved and gets a random QR token (R13).
    public async Task<ReservationResponse> ApproveAsync(string id, string callerNic)
    {
        EnergyReservation reservation = await FindOrThrowAsync(id);
        // RULE R13: only Pending bookings can be approved.
        if (reservation.Status != ReservationStatuses.Pending)
        {
            throw new ApiException(400, $"Only pending bookings can be approved. This one is {reservation.Status}.");
        }
        if (reservation.StartTime <= DateTime.UtcNow)
        {
            throw new ApiException(400, "This booking's time has already passed, so it can't be approved.");
        }

        DateTime now = DateTime.UtcNow;
        reservation.Status = ReservationStatuses.Approved;
        // RULE R13: a random 32-character token; the QR code is only valid with it (R14).
        reservation.QrToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(16)).ToLowerInvariant();
        reservation.ApprovedBy = callerNic;
        reservation.ApprovedAt = now;
        reservation.UpdatedAt = now;

        await _db.EnergyReservations.ReplaceOneAsync(r => r.Id == reservation.Id, reservation);
        return ReservationMapper.ToResponse(reservation);
    }

    // Loads a booking by id, or throws 404 (also for ids that aren't valid MongoDB ObjectIds).
    public async Task<EnergyReservation> FindOrThrowAsync(string id)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            throw new ApiException(404, "Reservation not found.");
        }
        EnergyReservation? reservation = await _db.EnergyReservations.Find(r => r.Id == id).FirstOrDefaultAsync();
        if (reservation == null)
        {
            throw new ApiException(404, "Reservation not found.");
        }
        return reservation;
    }

    // RULE R16: a prosumer may only touch their own bookings; staff may touch any.
    public static void CheckOwner(EnergyReservation reservation, string callerNic, string callerRole)
    {
        if (callerRole == Roles.Prosumer && reservation.ProsumerNic != callerNic)
        {
            throw new ApiException(403, "This booking belongs to someone else.");
        }
    }

    // RULE R15: Completed and Cancelled bookings can't be changed.
    // RULE R10: changes and cancellations need at least 12 hours' notice before the start.
    private static void CheckCanChange(EnergyReservation reservation)
    {
        if (reservation.Status == ReservationStatuses.Completed || reservation.Status == ReservationStatuses.Cancelled)
        {
            throw new ApiException(400, $"This booking is already {reservation.Status.ToLowerInvariant()} and can't be changed.");
        }
        if (reservation.StartTime - DateTime.UtcNow < ReservationMapper.MinChangeNotice)
        {
            throw new ApiException(400, "Changes and cancellations need at least 12 hours' notice before the booking starts.");
        }
    }

    // RULE R11: only an existing, Active prosumer can hold a booking.
    private async Task<User> FindActiveProsumerAsync(string nic)
    {
        User? user = await _db.Users.Find(u => u.Nic == nic).FirstOrDefaultAsync();
        if (user == null || user.Role != Roles.Prosumer)
        {
            throw new ApiException(404, "Prosumer not found.");
        }
        if (user.Status != UserStatuses.Active)
        {
            throw new ApiException(400, "Only active prosumers can hold bookings.");
        }
        return user;
    }

    // Loads the chosen slot and its station, and checks the slot can take a booking now.
    // RULE R11: the slot is open, its station is active and it has a free place.
    // RULE R9: it starts in the future and no more than 7 days from now.
    private async Task<(EnergyBookingSlot Slot, SolarStation Station)> LoadBookableSlotAsync(string slotId)
    {
        if (string.IsNullOrWhiteSpace(slotId))
        {
            throw new ApiException(400, "Please choose a slot.");
        }
        EnergyBookingSlot slot = await _slots.FindOrThrowAsync(slotId);
        SolarStation station = await _stations.FindOrThrowAsync(slot.StationId);

        if (!station.IsActive)
        {
            throw new ApiException(400, "This station is not taking bookings right now.");
        }
        if (!slot.IsActive)
        {
            throw new ApiException(400, "This slot is closed for booking.");
        }
        DateTime now = DateTime.UtcNow;
        if (slot.StartTime <= now)
        {
            throw new ApiException(400, "This slot has already started. Please pick a future slot.");
        }
        if (slot.StartTime > now.AddDays(MaxDaysAhead))
        {
            throw new ApiException(400, $"Bookings can be made at most {MaxDaysAhead} days ahead.");
        }
        if (slot.AvailableSlots <= 0)
        {
            throw new ApiException(409, "This slot is full. Please pick another one.");
        }
        return (slot, station);
    }

    // RULE R11: a prosumer can't have two live bookings in the same slot (a Cancelled one doesn't count).
    // exceptId = the booking being edited, so it doesn't count against itself.
    private async Task CheckNotAlreadyBookedAsync(string prosumerNic, string slotId, string? exceptId)
    {
        bool alreadyBooked = await _db.EnergyReservations
            .Find(r => r.ProsumerNic == prosumerNic && r.SlotId == slotId
                       && r.Status != ReservationStatuses.Cancelled && r.Id != exceptId)
            .AnyAsync();
        if (alreadyBooked)
        {
            throw new ApiException(409, "This prosumer already has a booking in this slot.");
        }
    }

    // RULE R17: energy must be more than 0 and at most 100 kWh; the type must be Sell or Buy.
    private static void ValidateEnergyAndType(double energyKwh, string type)
    {
        if (energyKwh <= 0 || energyKwh > MaxEnergyKwh)
        {
            throw new ApiException(400, $"Energy must be more than 0 and at most {MaxEnergyKwh} kWh.");
        }
        if (type != ReservationTypes.Sell && type != ReservationTypes.Buy)
        {
            throw new ApiException(400, "Type must be Sell or Buy.");
        }
    }

    // RULE R12: takes one free place from a slot. "Is a place free?" and "subtract 1" happen in ONE
    // database step (the filter only matches while availableSlots > 0), so two people can never both
    // get the last place.
    private async Task TakePlaceAsync(string slotId)
    {
        var takeOne = Builders<EnergyBookingSlot>.Update.Inc(s => s.AvailableSlots, -1);
        UpdateResult result = await _db.EnergyBookingSlots.UpdateOneAsync(
            s => s.Id == slotId && s.AvailableSlots > 0, takeOne);
        if (result.ModifiedCount == 0)
        {
            throw new ApiException(409, "This slot is full. Please pick another one.");
        }
    }

    // RULE R12: gives one place back to a slot (after a cancel, or when a booking moves to another slot).
    private async Task GivePlaceBackAsync(string slotId)
    {
        var giveOne = Builders<EnergyBookingSlot>.Update.Inc(s => s.AvailableSlots, 1);
        await _db.EnergyBookingSlots.UpdateOneAsync(s => s.Id == slotId, giveOne);
    }

    // Copies the slot's times and the station's id/name into the booking (MongoDB has no JOINs,
    // so bookings keep these copies for fast lists and the time rules).
    private static void CopySlotDetails(EnergyReservation reservation, EnergyBookingSlot slot, SolarStation station)
    {
        reservation.SlotId = slot.Id;
        reservation.StartTime = slot.StartTime;
        reservation.EndTime = slot.EndTime;
        reservation.StationId = station.Id;
        reservation.StationName = station.Name;
    }
}
