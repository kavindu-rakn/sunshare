/*
 * ============================================================================
 *  File        : VerifyQrRequest.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : D - Dashboards & QR
 *  Author      : Chamara R M L K (IT22076816)
 *  Created     : 2026-09-28
 *  Description : JSON body for POST /api/reservations/verify-qr and
 *                PATCH /api/reservations/{id}/complete: the scanned QR text.
 * ============================================================================
 */

namespace SunShare.Api.Dtos;

// The text the operator's phone read from the QR code, e.g. "SUNSHARE|66f6...|9f1c..." (R14).
public class VerifyQrRequest
{
    public string QrData { get; set; } = "";
}
