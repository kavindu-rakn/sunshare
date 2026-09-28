/*
 * ============================================================================
 *  File        : ReservationQueryService.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : D - Dashboards & QR
 *  Author      : Chamara R M L K (IT22076816)
 *  Created     : 2026-09-28
 *  Description : Reads bookings for the lists: views current / pending /
 *                history / all, filters (status, station, dates), search,
 *                and one booking by id (rule R16 + list definitions).
 * ============================================================================
 */
using System.Text.RegularExpressions;
using MongoDB.Bson;
using MongoDB.Driver;
using SunShare.Api.Data;
using SunShare.Api.Dtos;
using SunShare.Api.Helpers;
using SunShare.Api.Models;

namespace SunShare.Api.Services;

// Read-only booking queries used by the web Reservations page (W13) and the mobile Bookings tabs (M8).
public class ReservationQueryService
{
    private readonly MongoDbContext _db;
    private readonly ReservationService _reservations;

    // Receives the database and Part C's ReservationService (for find-by-id and the owner check).
    public ReservationQueryService(MongoDbContext db, ReservationService reservations)
    {
        _db = db;
        _reservations = reservations;
    }

    // Lists bookings for the caller. view = all (default) | current | pending | history.
    // Optional filters: status, stationId, from/to (start time, UTC), and a search text.
    // current/pending/all are soonest first; history is newest first.
    public async Task<List<ReservationResponse>> ListAsync(string? view, string? status, string? stationId,
        DateTime? from, DateTime? to, string? search, string callerNic, string callerRole)
    {
        var filter = Builders<EnergyReservation>.Filter.Empty;
        // RULE R16: a prosumer only ever sees their own bookings.
        if (callerRole == Roles.Prosumer)
        {
            filter &= Builders<EnergyReservation>.Filter.Eq(r => r.ProsumerNic, callerNic);
        }

        string chosenView = string.IsNullOrWhiteSpace(view) ? "all" : view.Trim().ToLowerInvariant();
        filter &= ViewFilter(chosenView);
        filter &= OptionalFilters(status, stationId, from, to);
        if (!string.IsNullOrWhiteSpace(search))
        {
            filter &= SearchFilter(search.Trim(), callerRole);
        }

        var query = _db.EnergyReservations.Find(filter);
        List<EnergyReservation> reservations = chosenView == "history"
            ? await query.SortByDescending(r => r.StartTime).ToListAsync()
            : await query.SortBy(r => r.StartTime).ToListAsync();
        return reservations.Select(ReservationMapper.ToResponse).ToList();
    }

    // Gets one booking. RULE R16: a prosumer can only open their own (403 otherwise).
    public async Task<ReservationResponse> GetAsync(string id, string callerNic, string callerRole)
    {
        EnergyReservation reservation = await _reservations.FindOrThrowAsync(id);
        ReservationService.CheckOwner(reservation, callerNic, callerRole);
        return ReservationMapper.ToResponse(reservation);
    }

    // The list definitions from docs/01-SPEC.md §5:
    // current = Approved and in the future; pending = Pending; history = Completed, Cancelled or already started.
    private static FilterDefinition<EnergyReservation> ViewFilter(string view)
    {
        var f = Builders<EnergyReservation>.Filter;
        DateTime now = DateTime.UtcNow;
        switch (view)
        {
            case "all":
                return f.Empty;
            case "current":
                return f.Eq(r => r.Status, ReservationStatuses.Approved) & f.Gt(r => r.StartTime, now);
            case "pending":
                return f.Eq(r => r.Status, ReservationStatuses.Pending);
            case "history":
                return f.In(r => r.Status, [ReservationStatuses.Completed, ReservationStatuses.Cancelled])
                       | f.Lte(r => r.StartTime, now);
            default:
                throw new ApiException(400, "View must be all, current, pending or history.");
        }
    }

    // Adds the optional filter-bar choices: one status, one station, and a start-time range (to is exclusive).
    private static FilterDefinition<EnergyReservation> OptionalFilters(string? status, string? stationId, DateTime? from, DateTime? to)
    {
        var f = Builders<EnergyReservation>.Filter;
        var filter = f.Empty;
        if (!string.IsNullOrWhiteSpace(status))
        {
            filter &= f.Eq(r => r.Status, status);
        }
        if (!string.IsNullOrWhiteSpace(stationId))
        {
            if (!ObjectId.TryParse(stationId, out _))
            {
                throw new ApiException(400, "The station filter is not a valid station id.");
            }
            filter &= f.Eq(r => r.StationId, stationId);
        }
        if (from.HasValue)
        {
            filter &= f.Gte(r => r.StartTime, TimeHelper.AsUtc(from.Value));
        }
        if (to.HasValue)
        {
            filter &= f.Lt(r => r.StartTime, TimeHelper.AsUtc(to.Value));
        }
        return filter;
    }

    // Search box: matches the station name (not case-sensitive), or a full 24-character reservation id.
    // Staff can also search by prosumer NIC or name. Regex.Escape makes symbols count as plain text.
    private static FilterDefinition<EnergyReservation> SearchFilter(string search, string callerRole)
    {
        var f = Builders<EnergyReservation>.Filter;
        var pattern = new BsonRegularExpression(Regex.Escape(search), "i");

        var matches = new List<FilterDefinition<EnergyReservation>> { f.Regex(r => r.StationName, pattern) };
        if (ObjectId.TryParse(search, out _))
        {
            matches.Add(f.Eq(r => r.Id, search));
        }
        if (callerRole != Roles.Prosumer)
        {
            matches.Add(f.Regex(r => r.ProsumerNic, pattern));
            matches.Add(f.Regex(r => r.ProsumerName, pattern));
        }
        return f.Or(matches);
    }
}
