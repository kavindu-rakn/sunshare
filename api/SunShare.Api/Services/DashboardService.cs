/*
 * ============================================================================
 *  File        : DashboardService.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : D - Dashboards & QR
 *  Author      : Chamara R M L K (IT22076816)
 *  Created     : 2026-09-28
 *  Description : Counts for the staff dashboard and the prosumer home screen,
 *                using the definitions in docs/01-SPEC.md §5.
 * ============================================================================
 */
using MongoDB.Driver;
using SunShare.Api.Data;
using SunShare.Api.Dtos;
using SunShare.Api.Helpers;
using SunShare.Api.Models;

namespace SunShare.Api.Services;

// Every number on a dashboard is counted here, on the server, so web and mobile always agree.
public class DashboardService
{
    // How many pending bookings the staff dashboard table shows.
    private const int PendingListSize = 5;

    private readonly MongoDbContext _db;

    // Receives the shared database context.
    public DashboardService(MongoDbContext db)
    {
        _db = db;
    }

    // Staff dashboard (web W3, operator mobile home M10): the count cards and the next pending bookings.
    public async Task<StaffDashboardResponse> GetStaffSummaryAsync()
    {
        DateTime now = DateTime.UtcNow;
        DateTime todayStart = TimeHelper.StartOfTodayInSriLankaUtc();
        DateTime tomorrowStart = todayStart.AddDays(1);
        var reservations = _db.EnergyReservations;

        List<EnergyReservation> nextPending = await reservations
            .Find(r => r.Status == ReservationStatuses.Pending && r.StartTime > now)
            .SortBy(r => r.StartTime)
            .Limit(PendingListSize)
            .ToListAsync();

        return new StaffDashboardResponse
        {
            PendingReservations = await reservations.CountDocumentsAsync(r => r.Status == ReservationStatuses.Pending),
            ApprovedFutureReservations = await reservations.CountDocumentsAsync(r =>
                r.Status == ReservationStatuses.Approved && r.StartTime > now),
            TodayReservations = await reservations.CountDocumentsAsync(r =>
                r.Status != ReservationStatuses.Cancelled && r.StartTime >= todayStart && r.StartTime < tomorrowStart),
            ActiveStations = await _db.SolarStationInfo.CountDocumentsAsync(s => s.IsActive),
            PendingActivations = await _db.Users.CountDocumentsAsync(u => u.Role == Roles.Prosumer
                && (u.Status == UserStatuses.Pending || u.Status == UserStatuses.Deactivated)),
            PendingList = nextPending.Select(ReservationMapper.ToResponse).ToList()
        };
    }

    // Prosumer home (M3): counts of MY bookings and my next upcoming one.
    // RULE R16: only the caller's own bookings (NIC from the token) are counted.
    public async Task<ProsumerDashboardResponse> GetProsumerSummaryAsync(string callerNic)
    {
        DateTime now = DateTime.UtcNow;
        var reservations = _db.EnergyReservations;

        EnergyReservation? next = await reservations
            .Find(r => r.ProsumerNic == callerNic && r.StartTime > now
                       && (r.Status == ReservationStatuses.Pending || r.Status == ReservationStatuses.Approved))
            .SortBy(r => r.StartTime)
            .FirstOrDefaultAsync();

        return new ProsumerDashboardResponse
        {
            PendingCount = await reservations.CountDocumentsAsync(r =>
                r.ProsumerNic == callerNic && r.Status == ReservationStatuses.Pending),
            ApprovedFutureCount = await reservations.CountDocumentsAsync(r =>
                r.ProsumerNic == callerNic && r.Status == ReservationStatuses.Approved && r.StartTime > now),
            CompletedCount = await reservations.CountDocumentsAsync(r =>
                r.ProsumerNic == callerNic && r.Status == ReservationStatuses.Completed),
            NextReservation = next == null ? null : ReservationMapper.ToResponse(next)
        };
    }
}
