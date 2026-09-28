/*
 * ============================================================================
 *  File        : SlotService.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Nodes, Slots & Map
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : Business rules for booking slots (time windows at a
 *                station): list, bookable slots (R9, R11), create, edit and
 *                delete (R8).
 * ============================================================================
 */
using MongoDB.Bson;
using MongoDB.Driver;
using SunShare.Api.Data;
using SunShare.Api.Dtos;
using SunShare.Api.Helpers;
using SunShare.Api.Models;

namespace SunShare.Api.Services;

// All slot rules live here (FAT service).
public class SlotService
{
    // A booking can be made at most this many days ahead (R9).
    private const int MaxDaysAhead = 7;

    private readonly MongoDbContext _db;
    private readonly StationService _stations;

    // Receives the database and the station service (to look up a slot's station).
    public SlotService(MongoDbContext db, StationService stations)
    {
        _db = db;
        _stations = stations;
    }

    // Lists one station's slots that start between "from" and "to", soonest first.
    // Default: from the start of today (UTC) for 14 days.
    public async Task<List<SlotResponse>> ListForStationAsync(string stationId, DateTime? from, DateTime? to)
    {
        SolarStation station = await _stations.FindOrThrowAsync(stationId);
        DateTime start = from.HasValue ? AsUtc(from.Value) : DateTime.UtcNow.Date;
        DateTime end = to.HasValue ? AsUtc(to.Value) : start.AddDays(14);

        List<EnergyBookingSlot> slots = await _db.EnergyBookingSlots
            .Find(s => s.StationId == station.Id && s.StartTime >= start && s.StartTime < end)
            .SortBy(s => s.StartTime)
            .ToListAsync();
        return slots.Select(s => SlotResponse.FromSlot(s, station.Name)).ToList();
    }

    // Slots a prosumer can book right now (optionally only at one station), soonest first.
    // RULE R11: the slot is active, has at least one free place, and its station is active.
    // RULE R9: it starts in the future and no more than 7 days from now.
    public async Task<List<SlotResponse>> GetAvailableAsync(string? stationId)
    {
        var stationFilter = Builders<SolarStation>.Filter.Eq(s => s.IsActive, true);
        if (!string.IsNullOrWhiteSpace(stationId))
        {
            SolarStation chosen = await _stations.FindOrThrowAsync(stationId);
            stationFilter &= Builders<SolarStation>.Filter.Eq(s => s.Id, chosen.Id);
        }
        List<SolarStation> activeStations = await _db.SolarStationInfo.Find(stationFilter).ToListAsync();
        Dictionary<string, string> stationNames = activeStations.ToDictionary(s => s.Id, s => s.Name);

        DateTime now = DateTime.UtcNow;
        DateTime latest = now.AddDays(MaxDaysAhead);
        var slotFilter = Builders<EnergyBookingSlot>.Filter.In(s => s.StationId, stationNames.Keys)
            & Builders<EnergyBookingSlot>.Filter.Where(s =>
                s.IsActive && s.AvailableSlots > 0 && s.StartTime > now && s.StartTime <= latest);

        List<EnergyBookingSlot> slots = await _db.EnergyBookingSlots.Find(slotFilter).SortBy(s => s.StartTime).ToListAsync();
        return slots.Select(s => SlotResponse.FromSlot(s, stationNames[s.StationId])).ToList();
    }

    // Gets one slot by id, with its station's name, or 404.
    public async Task<SlotResponse> GetAsync(string id)
    {
        EnergyBookingSlot slot = await FindOrThrowAsync(id);
        SolarStation station = await _stations.FindOrThrowAsync(slot.StationId);
        return SlotResponse.FromSlot(slot, station.Name);
    }

    // Staff add a time window to a station. All its places start free (availableSlots = totalSlots).
    public async Task<SlotResponse> CreateAsync(SlotRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.StationId))
        {
            throw new ApiException(400, "Please choose a station.");
        }
        SolarStation station = await _stations.FindOrThrowAsync(request.StationId);
        // RULE R8: slots can only be added to an active station.
        if (!station.IsActive)
        {
            throw new ApiException(400, "This station is deactivated, so it can't get new slots.");
        }

        DateTime start = AsUtc(request.StartTime);
        DateTime end = AsUtc(request.EndTime);
        ValidateTimes(start, end);
        ValidateTotal(request.TotalSlots, station, 0);

        DateTime now = DateTime.UtcNow;
        var slot = new EnergyBookingSlot
        {
            Id = ObjectId.GenerateNewId().ToString(),
            StationId = station.Id,
            StartTime = start,
            EndTime = end,
            TotalSlots = request.TotalSlots,
            AvailableSlots = request.TotalSlots,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };
        await _db.EnergyBookingSlots.InsertOneAsync(slot);
        return SlotResponse.FromSlot(slot, station.Name);
    }

    // Staff edit a slot's times, number of places, or open/closed state.
    // availableSlots is recalculated as the new total minus the places already booked.
    public async Task<SlotResponse> UpdateAsync(string id, SlotUpdateRequest request)
    {
        EnergyBookingSlot slot = await FindOrThrowAsync(id);
        SolarStation station = await _stations.FindOrThrowAsync(slot.StationId);
        int booked = slot.TotalSlots - slot.AvailableSlots;

        DateTime start = AsUtc(request.StartTime);
        DateTime end = AsUtc(request.EndTime);
        bool timeChanged = start != slot.StartTime || end != slot.EndTime;
        if (timeChanged)
        {
            // Booked prosumers chose this exact time, and their bookings keep a copy of it (used by R9/R10).
            if (booked > 0)
            {
                throw new ApiException(409, $"This slot already has {booked} booking(s), so its time can't be changed. Add a new slot instead.");
            }
            ValidateTimes(start, end);
        }
        ValidateTotal(request.TotalSlots, station, booked);

        slot.StartTime = start;
        slot.EndTime = end;
        slot.TotalSlots = request.TotalSlots;
        slot.AvailableSlots = request.TotalSlots - booked;
        slot.IsActive = request.IsActive;
        slot.UpdatedAt = DateTime.UtcNow;

        await _db.EnergyBookingSlots.ReplaceOneAsync(s => s.Id == slot.Id, slot);
        return SlotResponse.FromSlot(slot, station.Name);
    }

    // Staff delete a slot.
    public async Task DeleteAsync(string id)
    {
        EnergyBookingSlot slot = await FindOrThrowAsync(id);

        // RULE R8: a slot with active reservations (Pending/Approved, not started) can't be deleted.
        DateTime now = DateTime.UtcNow;
        long activeCount = await _db.EnergyReservations.CountDocumentsAsync(r =>
            r.SlotId == slot.Id
            && (r.Status == ReservationStatuses.Pending || r.Status == ReservationStatuses.Approved)
            && r.StartTime > now);
        if (activeCount > 0)
        {
            throw new ApiException(409, $"This slot has {activeCount} active reservation(s). Cancel them first, or close the slot instead.");
        }

        await _db.EnergyBookingSlots.DeleteOneAsync(s => s.Id == slot.Id);
    }

    // Loads a slot by id, or throws 404 (also for ids that aren't valid MongoDB ObjectIds).
    public async Task<EnergyBookingSlot> FindOrThrowAsync(string id)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            throw new ApiException(404, "Slot not found.");
        }
        EnergyBookingSlot? slot = await _db.EnergyBookingSlots.Find(s => s.Id == id).FirstOrDefaultAsync();
        if (slot == null)
        {
            throw new ApiException(404, "Slot not found.");
        }
        return slot;
    }

    // RULE R8: a slot must start in the future and end after it starts.
    private static void ValidateTimes(DateTime start, DateTime end)
    {
        if (start <= DateTime.UtcNow)
        {
            throw new ApiException(400, "The slot must start in the future.");
        }
        if (end <= start)
        {
            throw new ApiException(400, "The end time must be after the start time.");
        }
    }

    // RULE R8: places must be between 1 and the station's battery slots,
    // and can never be less than the places already booked.
    private static void ValidateTotal(int totalSlots, SolarStation station, int booked)
    {
        if (totalSlots < 1 || totalSlots > station.BatterySlots)
        {
            throw new ApiException(400, $"Total places must be between 1 and {station.BatterySlots} (the station's battery slots).");
        }
        if (totalSlots < booked)
        {
            throw new ApiException(400, $"{booked} places are already booked, so the total can't be less than {booked}.");
        }
    }

    // The API always works in UTC. A time sent with a zone ("...Z" or "...+05:30") is converted to UTC;
    // a time sent without one ("2026-09-30T08:00") is taken as UTC already.
    private static DateTime AsUtc(DateTime value)
    {
        if (value.Kind == DateTimeKind.Unspecified)
        {
            return DateTime.SpecifyKind(value, DateTimeKind.Utc);
        }
        return value.ToUniversalTime();
    }
}
