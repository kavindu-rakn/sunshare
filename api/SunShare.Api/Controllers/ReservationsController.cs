/*
 * ============================================================================
 *  File        : ReservationsController.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : C - Reservations
 *  Author      : Malkith G W L (IT22630834)
 *  Created     : 2026-09-28
 *  Description : Reservation actions: create, update, cancel and approve.
 *                (Lists, QR and dashboards are Part D's controllers on the same
 *                /api/reservations route.) Rules are in ReservationService.
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

// Every action needs a login. Who is calling (NIC + role) always comes from the token (RULE R16).
[ApiController]
[Route("api/reservations")]
[Authorize]
public class ReservationsController : ControllerBase
{
    private readonly ReservationService _reservations;

    // Receives the reservation service (registered in Program.cs).
    public ReservationsController(ReservationService reservations)
    {
        _reservations = reservations;
    }

    // POST /api/reservations - Prosumer (for themselves) or staff (for the prosumerNic they send). Returns 201, status Pending.
    [HttpPost]
    public async Task<ActionResult<ReservationResponse>> Create(CreateReservationRequest request)
    {
        ReservationResponse reservation = await _reservations.CreateAsync(request, CallerNic(), CallerRole());
        return Created($"/api/reservations/{reservation.Id}", reservation);
    }

    // PUT /api/reservations/{id} - owner Prosumer or staff: move slot / change energy or type (Approved -> Pending).
    [HttpPut("{id}")]
    public async Task<ActionResult<ReservationResponse>> Update(string id, UpdateReservationRequest request)
    {
        return Ok(await _reservations.UpdateAsync(id, request, CallerNic(), CallerRole()));
    }

    // PATCH /api/reservations/{id}/cancel - owner Prosumer or staff; at least 12 hours before the start (R10).
    [HttpPatch("{id}/cancel")]
    public async Task<ActionResult<ReservationResponse>> Cancel(string id)
    {
        return Ok(await _reservations.CancelAsync(id, CallerNic(), CallerRole()));
    }

    // PATCH /api/reservations/{id}/approve - Backoffice or Grid Operator: Pending -> Approved + QR (R13).
    [HttpPatch("{id}/approve")]
    [Authorize(Roles = Roles.Staff)]
    public async Task<ActionResult<ReservationResponse>> Approve(string id)
    {
        return Ok(await _reservations.ApproveAsync(id, CallerNic()));
    }

    // The caller's NIC, from their login token (never from the request body - RULE R16).
    private string CallerNic()
    {
        return User.FindFirstValue(JwtTokenHelper.NicClaim)!;
    }

    // The caller's role (Backoffice, GridOperator or Prosumer), from their login token.
    private string CallerRole()
    {
        return User.FindFirstValue(JwtTokenHelper.RoleClaim)!;
    }
}
