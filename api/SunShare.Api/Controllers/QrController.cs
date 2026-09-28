/*
 * ============================================================================
 *  File        : QrController.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : D - Dashboards & QR
 *  Author      : Chamara R M L K (IT22076816)
 *  Created     : 2026-09-28
 *  Description : POST /api/reservations/verify-qr and
 *                PATCH /api/reservations/{id}/complete - Grid Operator only (R14).
 * ============================================================================
 */
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SunShare.Api.Dtos;
using SunShare.Api.Helpers;
using SunShare.Api.Models;
using SunShare.Api.Services;

namespace SunShare.Api.Controllers;

// Only Grid Operators scan QR codes at the station (RULE R14 / R2).
[ApiController]
[Route("api/reservations")]
[Authorize(Roles = Roles.GridOperator)]
public class QrController : ControllerBase
{
    private readonly QrService _qr;

    // Receives the QR service (registered in Program.cs).
    public QrController(QrService qr)
    {
        _qr = qr;
    }

    // POST /api/reservations/verify-qr - checks the scanned text and returns the booking's details.
    [HttpPost("verify-qr")]
    public async Task<ActionResult<ReservationResponse>> Verify(VerifyQrRequest request)
    {
        return Ok(await _qr.VerifyAsync(request.QrData));
    }

    // PATCH /api/reservations/{id}/complete - checks the QR again and marks the booking Completed.
    [HttpPatch("{id}/complete")]
    public async Task<ActionResult<ReservationResponse>> Complete(string id, VerifyQrRequest request)
    {
        string callerNic = User.FindFirstValue(JwtTokenHelper.NicClaim)!;
        return Ok(await _qr.CompleteAsync(id, request.QrData, callerNic));
    }
}
