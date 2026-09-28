/*
 * ============================================================================
 *  File        : StationService.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Nodes, Slots & Map
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : Business rules for solar stations: list, nearby search (R18),
 *                create, edit, activate, deactivate (R6) and delete (R7).
 * ============================================================================
 */
using System.Globalization;
using MongoDB.Bson;
using MongoDB.Driver;
using SunShare.Api.Data;
using SunShare.Api.Dtos;
using SunShare.Api.Helpers;
using SunShare.Api.Models;

namespace SunShare.Api.Services;

// All station rules live here (FAT service). SlotService also uses FindOrThrowAsync from here.
public class StationService
{
    private readonly MongoDbContext _db;

    // Receives the shared database context.
    public StationService(MongoDbContext db)
    {
        _db = db;
    }

    // Lists stations by name, each with its number of active reservations.
    // RULE R2: prosumers only ever see active stations; staff can ask for active ones only.
    public async Task<List<StationResponse>> ListAsync(bool activeOnly, string callerRole)
    {
        bool onlyActive = activeOnly || callerRole == Roles.Prosumer;
        var filter = onlyActive
            ? Builders<SolarStation>.Filter.Eq(s => s.IsActive, true)
            : Builders<SolarStation>.Filter.Empty;

        List<SolarStation> stations = await _db.SolarStationInfo.Find(filter).SortBy(s => s.Name).ToListAsync();
        List<string> bookedStationIds = await GetActiveBookingStationIdsAsync();
        return stations
            .Select(s => StationResponse.FromStation(s, bookedStationIds.Count(id => id == s.Id)))
            .ToList();
    }

    // RULE R18: active stations within radiusKm of the phone's location, nearest first,
    // with distanceKm filled in. The distance maths happens here, not on the phone.
    public async Task<List<StationResponse>> GetNearbyAsync(double? lat, double? lng, double radiusKm)
    {
        if (lat == null || lng == null)
        {
            throw new ApiException(400, "Please send your location (lat and lng).");
        }
        ValidateCoordinates(lat.Value, lng.Value);
        if (radiusKm <= 0)
        {
            throw new ApiException(400, "The search radius must be more than 0 km.");
        }

        List<SolarStation> stations = await _db.SolarStationInfo.Find(s => s.IsActive).ToListAsync();
        List<string> bookedStationIds = await GetActiveBookingStationIdsAsync();

        var nearby = new List<StationResponse>();
        foreach (SolarStation station in stations)
        {
            double distance = GeoHelper.DistanceKm(lat.Value, lng.Value, station.Latitude, station.Longitude);
            if (distance <= radiusKm)
            {
                long activeCount = bookedStationIds.Count(id => id == station.Id);
                nearby.Add(StationResponse.FromStation(station, activeCount, Math.Round(distance, 2)));
            }
        }
        return nearby.OrderBy(s => s.DistanceKm).ToList();
    }

    // Gets one station by id, or 404.
    public async Task<StationResponse> GetAsync(string id)
    {
        SolarStation station = await FindOrThrowAsync(id);
        return StationResponse.FromStation(station, await CountActiveReservationsAsync(station.Id));
    }

    // Backoffice registers a new station. It is active straight away.
    public async Task<StationResponse> CreateAsync(StationRequest request)
    {
        ValidateRequest(request);

        DateTime now = DateTime.UtcNow;
        var station = new SolarStation
        {
            Id = ObjectId.GenerateNewId().ToString(),
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };
        ApplyRequest(station, request);

        await _db.SolarStationInfo.InsertOneAsync(station);
        return StationResponse.FromStation(station, 0);
    }

    // Backoffice edits a station's details and opening hours. Bookings keep a copy of the
    // station's name, so if the name changes those copies are updated too (search keeps working).
    public async Task<StationResponse> UpdateAsync(string id, StationRequest request)
    {
        SolarStation station = await FindOrThrowAsync(id);
        ValidateRequest(request);

        bool nameChanged = station.Name != request.Name.Trim();
        ApplyRequest(station, request);
        station.UpdatedAt = DateTime.UtcNow;
        await _db.SolarStationInfo.ReplaceOneAsync(s => s.Id == station.Id, station);

        if (nameChanged)
        {
            var renameCopies = Builders<EnergyReservation>.Update.Set(r => r.StationName, station.Name);
            await _db.EnergyReservations.UpdateManyAsync(r => r.StationId == station.Id, renameCopies);
        }
        return StationResponse.FromStation(station, await CountActiveReservationsAsync(station.Id));
    }

    // Backoffice switches a station off so it can't be booked or shown on the map.
    public async Task<StationResponse> DeactivateAsync(string id)
    {
        SolarStation station = await FindOrThrowAsync(id);
        if (!station.IsActive)
        {
            throw new ApiException(400, "This station is already deactivated.");
        }

        // RULE R6: a station with active reservations can't be deactivated (don't strand booked prosumers).
        long activeCount = await CountActiveReservationsAsync(station.Id);
        if (activeCount > 0)
        {
            string plural = activeCount == 1 ? "" : "s";
            throw new ApiException(409, $"This station has {activeCount} active reservation{plural}. Cancel or complete them first.");
        }

        return await SetActiveAsync(station, false);
    }

    // Backoffice switches a deactivated station back on.
    public async Task<StationResponse> ActivateAsync(string id)
    {
        SolarStation station = await FindOrThrowAsync(id);
        if (station.IsActive)
        {
            throw new ApiException(400, "This station is already active.");
        }
        return await SetActiveAsync(station, true);
    }

    // Backoffice deletes a station together with its slots.
    public async Task DeleteAsync(string id)
    {
        SolarStation station = await FindOrThrowAsync(id);

        // RULE R7: only a station that never had any reservation can be deleted; otherwise deactivate it,
        // so no booking history points at a station that no longer exists.
        bool hasHistory = await _db.EnergyReservations.Find(r => r.StationId == station.Id).AnyAsync();
        if (hasHistory)
        {
            throw new ApiException(409, "Stations with booking history can't be deleted — deactivate it instead.");
        }

        await _db.EnergyBookingSlots.DeleteManyAsync(s => s.StationId == station.Id);
        await _db.SolarStationInfo.DeleteOneAsync(s => s.Id == station.Id);
    }

    // Loads a station by id, or throws 404. An id that isn't a valid MongoDB ObjectId
    // (e.g. "abc") also gives 404 instead of crashing the query.
    public async Task<SolarStation> FindOrThrowAsync(string id)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            throw new ApiException(404, "Station not found.");
        }
        SolarStation? station = await _db.SolarStationInfo.Find(s => s.Id == id).FirstOrDefaultAsync();
        if (station == null)
        {
            throw new ApiException(404, "Station not found.");
        }
        return station;
    }

    // Counts a station's active reservations: Pending or Approved and not started yet (the R6 definition).
    public async Task<long> CountActiveReservationsAsync(string stationId)
    {
        DateTime now = DateTime.UtcNow;
        return await _db.EnergyReservations.CountDocumentsAsync(r =>
            r.StationId == stationId
            && (r.Status == ReservationStatuses.Pending || r.Status == ReservationStatuses.Approved)
            && r.StartTime > now);
    }

    // The station ids of ALL active reservations in one query, so a whole list of stations
    // can be counted without asking the database once per station.
    private async Task<List<string>> GetActiveBookingStationIdsAsync()
    {
        DateTime now = DateTime.UtcNow;
        return await _db.EnergyReservations
            .Find(r => (r.Status == ReservationStatuses.Pending || r.Status == ReservationStatuses.Approved)
                       && r.StartTime > now)
            .Project(r => r.StationId)
            .ToListAsync();
    }

    // Saves the station's new on/off state.
    private async Task<StationResponse> SetActiveAsync(SolarStation station, bool isActive)
    {
        station.IsActive = isActive;
        station.UpdatedAt = DateTime.UtcNow;
        await _db.SolarStationInfo.ReplaceOneAsync(s => s.Id == station.Id, station);
        return StationResponse.FromStation(station, await CountActiveReservationsAsync(station.Id));
    }

    // Checks the station form: name and address filled in, GPS in range, capacity above 0,
    // at least 1 battery place, and opening hours as "HH:mm" with opening before closing.
    private static void ValidateRequest(StationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ApiException(400, "Please enter the station name.");
        }
        if (string.IsNullOrWhiteSpace(request.Address))
        {
            throw new ApiException(400, "Please enter the station address.");
        }
        ValidateCoordinates(request.Latitude, request.Longitude);
        if (request.CapacityKw <= 0)
        {
            throw new ApiException(400, "Capacity must be more than 0 kW.");
        }
        if (request.BatterySlots < 1)
        {
            throw new ApiException(400, "A station needs at least 1 battery slot.");
        }
        if (!TryParseTime(request.OpenTime, out TimeOnly open) || !TryParseTime(request.CloseTime, out TimeOnly close))
        {
            throw new ApiException(400, "Opening and closing times must be in 24-hour HH:mm format, e.g. 06:00.");
        }
        if (open >= close)
        {
            throw new ApiException(400, "The opening time must be before the closing time.");
        }
    }

    // Latitude must be between -90 and 90 and longitude between -180 and 180 (the valid GPS ranges).
    private static void ValidateCoordinates(double lat, double lng)
    {
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
        {
            throw new ApiException(400, "Latitude must be between -90 and 90, and longitude between -180 and 180.");
        }
    }

    // Reads "HH:mm" text such as "06:00" as a time of day. Returns false if the text is not in that format.
    private static bool TryParseTime(string? text, out TimeOnly time)
    {
        return TimeOnly.TryParseExact(text ?? "", "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out time);
    }

    // Copies the form fields onto a station (text trimmed).
    private static void ApplyRequest(SolarStation station, StationRequest request)
    {
        station.Name = request.Name.Trim();
        station.Address = request.Address.Trim();
        station.Latitude = request.Latitude;
        station.Longitude = request.Longitude;
        station.CapacityKw = request.CapacityKw;
        station.BatterySlots = request.BatterySlots;
        station.OpenTime = request.OpenTime.Trim();
        station.CloseTime = request.CloseTime.Trim();
    }
}
