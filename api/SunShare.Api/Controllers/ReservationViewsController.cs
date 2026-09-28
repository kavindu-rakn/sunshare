/*
 * ============================================================================
 *  File        : ReservationViewsController.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : D - Dashboards & QR
 *  Author      : Chamara R M L K (IT22076816)
 *  Created     : 2026-09-28
 *  Description : GET /api/reservations (list with view, filters and search)
 *                and GET /api/reservations/{id}. Queries are in
 *                ReservationQueryService.
 * ============================================================================
 */
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SunShare.Api.Dtos;
using SunShare.Api.Helpers;
using SunShare.Api.Services;

namespace SunShare.Api.Controllers;

// Same /api/reservations route as Part C's ReservationsController; this file holds the read-only endpoints.
[ApiController]
[Route("api/reservations")]
[Authorize]
public class ReservationViewsController : ControllerBase
{
    private readonly ReservationQueryService _queries;

    // Receives the query service (registered in Program.cs).
    public ReservationViewsController(ReservationQueryService queries)
    {
        _queries = queries;
    }

    // GET /api/reservations?view=&status=&stationId=&from=&to=&search= - any logged-in user.
    // Prosumers only get their own bookings (R16).
    [HttpGet]
    public async Task<ActionResult<List<ReservationResponse>>> List([FromQuery] string? view, [FromQuery] string? status,
        [FromQuery] string? stationId, [FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] string? search)
    {
        string callerNic = User.FindFirstValue(JwtTokenHelper.NicClaim)!;
        string callerRole = User.FindFirstValue(JwtTokenHelper.RoleClaim)!;
        return Ok(await _queries.ListAsync(view, status, stationId, from, to, search, callerNic, callerRole));
    }

    // GET /api/reservations/{id} - owner Prosumer or staff: one booking (incl. qrData when Approved).
    [HttpGet("{id}")]
    public async Task<ActionResult<ReservationResponse>> Get(string id)
    {
        string callerNic = User.FindFirstValue(JwtTokenHelper.NicClaim)!;
        string callerRole = User.FindFirstValue(JwtTokenHelper.RoleClaim)!;
        return Ok(await _queries.GetAsync(id, callerNic, callerRole));
    }
}
