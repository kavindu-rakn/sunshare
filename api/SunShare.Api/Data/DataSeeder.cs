/*
 * ============================================================================
 *  File        : DataSeeder.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : Fills an EMPTY database with the sample data from
 *                docs/03-DATABASE.md §5: 6 test accounts, 5 stations, a week
 *                of slots and 5 reservations. Runs once at API start-up.
 * ============================================================================
 */
using System.Security.Cryptography;
using MongoDB.Bson;
using MongoDB.Driver;
using SunShare.Api.Models;

namespace SunShare.Api.Data;

// Builds the sample documents in memory first (so reservations can point at slot ids),
// then saves them. Dates are relative to "now", so re-seed the day before the viva.
public class DataSeeder
{
    // Sri Lanka time is UTC+5:30. Slot times are chosen in local time and stored in UTC.
    private static readonly TimeSpan SriLankaOffset = TimeSpan.FromHours(5.5);

    // The seeded Grid Operator (Kasun Silva), used as "approved by" / "completed by".
    private const string OperatorNic = "199845678912";

    private readonly MongoDbContext _db;
    private readonly DateTime _now = DateTime.UtcNow;

    // Receives the database context to write the sample data into.
    public DataSeeder(MongoDbContext db)
    {
        _db = db;
    }

    // Adds all sample data, but only when the Users collection is empty,
    // so it never overwrites real data.
    public async Task SeedAsync()
    {
        long userCount = await _db.Users.CountDocumentsAsync(FilterDefinition<User>.Empty);
        if (userCount > 0)
        {
            return;
        }

        List<User> users = BuildUsers();
        List<SolarStation> stations = BuildStations();
        List<EnergyBookingSlot> slots = BuildSlots(stations);
        List<EnergyReservation> reservations = BuildReservations(users, stations, slots);

        await _db.Users.InsertManyAsync(users);
        await _db.SolarStationInfo.InsertManyAsync(stations);
        await _db.EnergyBookingSlots.InsertManyAsync(slots);
        await _db.EnergyReservations.InsertManyAsync(reservations);
    }

    // The 6 fictional test accounts: one per role, plus a Pending and a Deactivated prosumer.
    private List<User> BuildUsers()
    {
        return
        [
            MakeUser("200012345678", "Dilani Fernando", "dilani.fernando@example.com", "0712345678", null, Roles.Backoffice, UserStatuses.Active, "Admin@123"),
            MakeUser("199845678912", "Kasun Silva", "kasun.silva@example.com", "0723456789", null, Roles.GridOperator, UserStatuses.Active, "Operator@123"),
            MakeUser("199712345678", "Nimal Perera", "nimal.perera@example.com", "0771234567", "12 Temple Road, Malabe", Roles.Prosumer, UserStatuses.Active, "Prosumer@123"),
            MakeUser("200156789123", "Ayesha Jayasinghe", "ayesha.jayasinghe@example.com", "0762345678", "45 Lake Drive, Kaduwela", Roles.Prosumer, UserStatuses.Active, "Prosumer@123"),
            MakeUser("200198765432", "Tharindu Wickramasinghe", "tharindu.w@example.com", "0753456789", "8 Station Road, Battaramulla", Roles.Prosumer, UserStatuses.Pending, "Prosumer@123"),
            MakeUser("981234567V", "Sanduni Rathnayake", "sanduni.r@example.com", "0704567890", "22 Flower Lane, Kottawa", Roles.Prosumer, UserStatuses.Deactivated, "Prosumer@123")
        ];
    }

    // Builds one user. The plain password is turned into a BCrypt hash here and is never stored.
    private User MakeUser(string nic, string fullName, string email, string phone, string? address,
        string role, string status, string password)
    {
        return new User
        {
            Nic = nic,
            FullName = fullName,
            Email = email,
            Phone = phone,
            Address = address,
            Role = role,
            Status = status,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            CreatedAt = _now,
            UpdatedAt = _now
        };
    }

    // The 5 stations around SLIIT Malabe, so the map looks right. The last one is deactivated.
    private List<SolarStation> BuildStations()
    {
        return
        [
            MakeStation("Malabe Solar Hub", "New Kandy Road, Malabe", 6.9147, 79.9730, 250, 10, "06:00", "18:00", true),
            MakeStation("Kaduwela Grid Node", "Kaduwela Road, Kaduwela", 6.9335, 79.9840, 180, 8, "06:00", "18:00", true),
            MakeStation("Battaramulla Microgrid", "Pannipitiya Road, Battaramulla", 6.9020, 79.9180, 300, 12, "07:00", "19:00", true),
            MakeStation("Kottawa Sun Park", "High Level Road, Kottawa", 6.8410, 79.9650, 150, 6, "06:00", "18:00", true),
            MakeStation("Nugegoda Rooftop Node", "Stanley Thilakaratne Mawatha, Nugegoda", 6.8649, 79.8997, 90, 4, "08:00", "17:00", false)
        ];
    }

    // Builds one station with a new MongoDB id.
    private SolarStation MakeStation(string name, string address, double latitude, double longitude,
        double capacityKw, int batterySlots, string openTime, string closeTime, bool isActive)
    {
        return new SolarStation
        {
            Id = ObjectId.GenerateNewId().ToString(),
            Name = name,
            Address = address,
            Latitude = latitude,
            Longitude = longitude,
            CapacityKw = capacityKw,
            BatterySlots = batterySlots,
            OpenTime = openTime,
            CloseTime = closeTime,
            IsActive = isActive,
            CreatedAt = _now,
            UpdatedAt = _now
        };
    }

    // For every active station: 3 windows a day (08:00, 11:00 and 14:00 Sri Lanka time) for the
    // next 7 days. Plus one slot 2 days ago at Malabe Solar Hub, so History has data.
    private List<EnergyBookingSlot> BuildSlots(List<SolarStation> stations)
    {
        var slots = new List<EnergyBookingSlot>();
        int[] startHours = [8, 11, 14];

        foreach (SolarStation station in stations.Where(s => s.IsActive))
        {
            for (int day = 1; day <= 7; day++)
            {
                foreach (int hour in startHours)
                {
                    slots.Add(MakeSlot(station.Id, day, hour));
                }
            }
        }

        slots.Add(MakeSlot(stations[0].Id, -2, 11));
        return slots;
    }

    // Builds one 2-hour slot with 4 free places, starting "today + dayOffset" at localHour Sri Lanka time.
    private EnergyBookingSlot MakeSlot(string stationId, int dayOffset, int localHour)
    {
        DateTime start = SriLankaTimeToUtc(dayOffset, localHour);
        return new EnergyBookingSlot
        {
            Id = ObjectId.GenerateNewId().ToString(),
            StationId = stationId,
            StartTime = start,
            EndTime = start.AddHours(2),
            TotalSlots = 4,
            AvailableSlots = 4,
            IsActive = true,
            CreatedAt = _now,
            UpdatedAt = _now
        };
    }

    // Turns "today + dayOffset days, at localHour o'clock in Sri Lanka" into the matching UTC time.
    // Example: tomorrow 08:00 in Sri Lanka = tomorrow 02:30 UTC.
    private DateTime SriLankaTimeToUtc(int dayOffset, int localHour)
    {
        DateTime todayInSriLanka = (_now + SriLankaOffset).Date;
        DateTime localTime = todayInSriLanka.AddDays(dayOffset).AddHours(localHour);
        return DateTime.SpecifyKind(localTime - SriLankaOffset, DateTimeKind.Utc);
    }

    // The 5 sample bookings: Nimal has one Approved (tomorrow 11:00, with a QR token), one Pending,
    // one Completed (the past slot) and one Cancelled; Ayesha has one Pending.
    // Each one goes through the same steps as a real booking, so every slot's availableSlots is right.
    private List<EnergyReservation> BuildReservations(List<User> users, List<SolarStation> stations,
        List<EnergyBookingSlot> slots)
    {
        User nimal = users.First(u => u.Nic == "199712345678");
        User ayesha = users.First(u => u.Nic == "200156789123");
        SolarStation malabe = stations[0];
        SolarStation kaduwela = stations[1];
        SolarStation battaramulla = stations[2];

        EnergyReservation approved = MakeReservation(nimal, malabe, FindSlot(slots, malabe, 1, 11), 12.5, ReservationTypes.Sell, _now.AddHours(-3));
        MarkApproved(approved, _now.AddHours(-1));

        EnergyReservation pending = MakeReservation(nimal, kaduwela, FindSlot(slots, kaduwela, 3, 8), 8, ReservationTypes.Buy, _now.AddHours(-2));

        EnergyBookingSlot pastSlot = FindSlot(slots, malabe, -2, 11);
        EnergyReservation completed = MakeReservation(nimal, malabe, pastSlot, 20, ReservationTypes.Sell, pastSlot.StartTime.AddDays(-2));
        MarkApproved(completed, pastSlot.StartTime.AddDays(-1));
        MarkCompleted(completed, pastSlot.StartTime.AddMinutes(30));

        EnergyBookingSlot cancelledSlot = FindSlot(slots, battaramulla, 4, 14);
        EnergyReservation cancelled = MakeReservation(nimal, battaramulla, cancelledSlot, 5, ReservationTypes.Buy, _now.AddHours(-5));
        MarkCancelled(cancelled, cancelledSlot, nimal.Nic, _now.AddHours(-4));

        EnergyReservation ayeshaPending = MakeReservation(ayesha, malabe, FindSlot(slots, malabe, 2, 14), 15, ReservationTypes.Sell, _now.AddHours(-1));

        return [approved, pending, completed, cancelled, ayeshaPending];
    }

    // Finds the seeded slot at a station that starts "today + dayOffset" at localHour Sri Lanka time.
    private EnergyBookingSlot FindSlot(List<EnergyBookingSlot> slots, SolarStation station, int dayOffset, int localHour)
    {
        DateTime start = SriLankaTimeToUtc(dayOffset, localHour);
        return slots.First(s => s.StationId == station.Id && s.StartTime == start);
    }

    // Builds a new Pending booking and takes one free place from its slot (like R12 does).
    private static EnergyReservation MakeReservation(User prosumer, SolarStation station, EnergyBookingSlot slot,
        double energyKwh, string type, DateTime createdAt)
    {
        slot.AvailableSlots -= 1;
        return new EnergyReservation
        {
            Id = ObjectId.GenerateNewId().ToString(),
            ProsumerNic = prosumer.Nic,
            ProsumerName = prosumer.FullName,
            StationId = station.Id,
            StationName = station.Name,
            SlotId = slot.Id,
            StartTime = slot.StartTime,
            EndTime = slot.EndTime,
            EnergyKwh = energyKwh,
            Type = type,
            Status = ReservationStatuses.Pending,
            CreatedAt = createdAt,
            UpdatedAt = createdAt
        };
    }

    // Approves a sample booking as the Grid Operator and gives it a random 32-character QR token (like R13).
    private static void MarkApproved(EnergyReservation reservation, DateTime when)
    {
        reservation.Status = ReservationStatuses.Approved;
        reservation.QrToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(16)).ToLowerInvariant();
        reservation.ApprovedBy = OperatorNic;
        reservation.ApprovedAt = when;
        reservation.UpdatedAt = when;
    }

    // Marks a sample booking as finished: the operator scanned the QR code (like R14).
    private static void MarkCompleted(EnergyReservation reservation, DateTime when)
    {
        reservation.Status = ReservationStatuses.Completed;
        reservation.CompletedBy = OperatorNic;
        reservation.CompletedAt = when;
        reservation.UpdatedAt = when;
    }

    // Marks a sample booking as cancelled and gives its place back to the slot (like R12).
    private static void MarkCancelled(EnergyReservation reservation, EnergyBookingSlot slot, string cancelledBy, DateTime when)
    {
        reservation.Status = ReservationStatuses.Cancelled;
        reservation.CancelledBy = cancelledBy;
        reservation.CancelledAt = when;
        reservation.UpdatedAt = when;
        slot.AvailableSlots += 1;
    }
}
