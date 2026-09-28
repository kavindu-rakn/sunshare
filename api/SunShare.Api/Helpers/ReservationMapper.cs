/*
 * ============================================================================
 *  File        : ReservationMapper.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : C - Reservations
 *  Author      : Malkith G W L (IT22630834)
 *  Created     : 2026-09-28
 *  Description : Turns a stored reservation into the ReservationResponse sent
 *                to clients, and works out canModify (R10, R15) and the QR
 *                text (R13, R14). Shared with Part D's list and QR code.
 * ============================================================================
 */
using SunShare.Api.Dtos;
using SunShare.Api.Models;

namespace SunShare.Api.Helpers;

// One place that builds every reservation answer, so all endpoints show the same fields.
public static class ReservationMapper
{
    // Minimum notice before the start for any change or cancel (R10). ReservationService uses it too.
    public static readonly TimeSpan MinChangeNotice = TimeSpan.FromHours(12);

    // Every SunShare QR code starts with this word (R14).
    public const string QrPrefix = "SUNSHARE";

    // Copies a stored reservation into a response and adds canModify and qrData.
    public static ReservationResponse ToResponse(EnergyReservation reservation)
    {
        return new ReservationResponse
        {
            Id = reservation.Id,
            ProsumerNic = reservation.ProsumerNic,
            ProsumerName = reservation.ProsumerName,
            StationId = reservation.StationId,
            StationName = reservation.StationName,
            SlotId = reservation.SlotId,
            StartTime = reservation.StartTime,
            EndTime = reservation.EndTime,
            EnergyKwh = reservation.EnergyKwh,
            Type = reservation.Type,
            Status = reservation.Status,
            CanModify = CanModify(reservation, DateTime.UtcNow),
            QrData = BuildQrData(reservation),
            ApprovedBy = reservation.ApprovedBy,
            ApprovedAt = reservation.ApprovedAt,
            CompletedBy = reservation.CompletedBy,
            CompletedAt = reservation.CompletedAt,
            CancelledBy = reservation.CancelledBy,
            CancelledAt = reservation.CancelledAt,
            CreatedAt = reservation.CreatedAt,
            UpdatedAt = reservation.UpdatedAt
        };
    }

    // RULE R15 + R10: a booking can still be edited or cancelled only while it is Pending or Approved
    // AND it starts at least 12 hours from now.
    public static bool CanModify(EnergyReservation reservation, DateTime now)
    {
        bool stillOpen = reservation.Status == ReservationStatuses.Pending
                         || reservation.Status == ReservationStatuses.Approved;
        return stillOpen && reservation.StartTime - now >= MinChangeNotice;
    }

    // RULE R13 + R14: only an Approved booking has a QR code. Its text is "SUNSHARE|<reservationId>|<qrToken>".
    // The phone turns this text into the QR picture; the token is the secret part.
    public static string? BuildQrData(EnergyReservation reservation)
    {
        if (reservation.Status != ReservationStatuses.Approved || string.IsNullOrEmpty(reservation.QrToken))
        {
            return null;
        }
        return $"{QrPrefix}|{reservation.Id}|{reservation.QrToken}";
    }
}
