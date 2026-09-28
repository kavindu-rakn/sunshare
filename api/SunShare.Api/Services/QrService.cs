/*
 * ============================================================================
 *  File        : QrService.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : D - Dashboards & QR
 *  Author      : Chamara R M L K (IT22076816)
 *  Created     : 2026-09-28
 *  Description : Checks a QR code scanned by a Grid Operator and finishes the
 *                energy transfer (rule R14).
 * ============================================================================
 */
using MongoDB.Bson;
using MongoDB.Driver;
using SunShare.Api.Data;
using SunShare.Api.Dtos;
using SunShare.Api.Helpers;
using SunShare.Api.Models;

namespace SunShare.Api.Services;

// The QR only holds "SUNSHARE|<reservationId>|<qrToken>". The server decides if it is valid,
// so a screenshot of an old or edited booking's QR is useless (its token no longer matches).
public class QrService
{
    private readonly MongoDbContext _db;

    // Receives the shared database context.
    public QrService(MongoDbContext db)
    {
        _db = db;
    }

    // Verify (M11 "Verified with server"): returns the booking's details if the QR is valid right now.
    public async Task<ReservationResponse> VerifyAsync(string qrData)
    {
        EnergyReservation reservation = await CheckQrAsync(qrData);
        return ReservationMapper.ToResponse(reservation);
    }

    // Finalize: the same checks again, then Completed + who/when. After this the QR can't be used again.
    public async Task<ReservationResponse> CompleteAsync(string id, string qrData, string callerNic)
    {
        EnergyReservation reservation = await CheckQrAsync(qrData);
        // The scanned QR must belong to the booking being completed (the id in the URL).
        if (reservation.Id != id)
        {
            throw new ApiException(400, "This QR code belongs to a different booking.");
        }

        DateTime now = DateTime.UtcNow;
        reservation.Status = ReservationStatuses.Completed;
        reservation.CompletedBy = callerNic;
        reservation.CompletedAt = now;
        reservation.UpdatedAt = now;

        await _db.EnergyReservations.ReplaceOneAsync(r => r.Id == reservation.Id, reservation);
        return ReservationMapper.ToResponse(reservation);
    }

    // RULE R14: the QR text must be "SUNSHARE|<reservationId>|<qrToken>", the booking must exist and be
    // Approved, and the token must match the one saved when it was approved. Each failure has its own message.
    private async Task<EnergyReservation> CheckQrAsync(string qrData)
    {
        string[] parts = (qrData ?? "").Trim().Split('|');
        if (parts.Length != 3 || parts[0] != ReservationMapper.QrPrefix || !ObjectId.TryParse(parts[1], out _) || parts[2] == "")
        {
            throw new ApiException(400, "This is not a SunShare QR code.");
        }
        string reservationId = parts[1];
        string token = parts[2];

        EnergyReservation? reservation = await _db.EnergyReservations.Find(r => r.Id == reservationId).FirstOrDefaultAsync();
        if (reservation == null)
        {
            throw new ApiException(400, "This QR code's booking doesn't exist.");
        }
        if (reservation.Status == ReservationStatuses.Completed)
        {
            throw new ApiException(400, "This booking is already completed - a QR code can only be used once.");
        }
        if (reservation.Status == ReservationStatuses.Cancelled)
        {
            throw new ApiException(400, "This booking was cancelled.");
        }
        if (reservation.Status != ReservationStatuses.Approved)
        {
            throw new ApiException(400, "This booking hasn't been approved yet.");
        }
        if (reservation.QrToken != token)
        {
            throw new ApiException(400, "This QR code is out of date (the booking was changed). Ask the prosumer to open the booking again.");
        }
        return reservation;
    }
}
