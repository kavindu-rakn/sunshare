/*
 * ============================================================================
 *  File        : StationsController.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Nodes, Slots & Map
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : /api/stations endpoints: list, nearby (R18), get, create,
 *                edit, activate, deactivate (R6) and delete (R7).
 *                Role checks (R2) are the [Authorize] lines; rules are in StationService.
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

// Any logged-in user can read stations; only Backoffice can change them (RULE R2).
[ApiController]
[Route("api/stations")]
[Authorize]
public class StationsController : ControllerBase
{
    private readonly StationService _stations;

    // Receives the station service (registered in Program.cs).
    public StationsController(StationService stations)
    {
        _stations = stations;
    }

    // GET /api/stations?activeOnly= - any logged-in user; prosumers always get active stations only.
    [HttpGet]
    public async Task<ActionResult<List<StationResponse>>> List([FromQuery] bool activeOnly = false)
    {
        string callerRole = User.FindFirstValue(JwtTokenHelper.RoleClaim)!;
        return Ok(await _stations.ListAsync(activeOnly, callerRole));
    }

    // GET /api/stations/nearby?lat=&lng=&radiusKm=25 - any logged-in user (R18): active stations, nearest first.
    [HttpGet("nearby")]
    public async Task<ActionResult<List<StationResponse>>> Nearby([FromQuery] double? lat, [FromQuery] double? lng, [FromQuery] double radiusKm = 25)
    {
        return Ok(await _stations.GetNearbyAsync(lat, lng, radiusKm));
    }

    // GET /api/stations/{id} - any logged-in user: one station.
    [HttpGet("{id}")]
    public async Task<ActionResult<StationResponse>> Get(string id)
    {
        return Ok(await _stations.GetAsync(id));
    }

    // POST /api/stations - Backoffice registers a station. Returns 201.
    [HttpPost]
    [Authorize(Roles = Roles.Backoffice)]
    public async Task<ActionResult<StationResponse>> Create(StationRequest request)
    {
        StationResponse station = await _stations.CreateAsync(request);
        return Created($"/api/stations/{station.Id}", station);
    }

    // PUT /api/stations/{id} - Backoffice edits details and opening hours.
    [HttpPut("{id}")]
    [Authorize(Roles = Roles.Backoffice)]
    public async Task<ActionResult<StationResponse>> Update(string id, StationRequest request)
    {
        return Ok(await _stations.UpdateAsync(id, request));
    }

    // PATCH /api/stations/{id}/deactivate - Backoffice; 409 while it has active reservations (R6).
    [HttpPatch("{id}/deactivate")]
    [Authorize(Roles = Roles.Backoffice)]
    public async Task<ActionResult<StationResponse>> Deactivate(string id)
    {
        return Ok(await _stations.DeactivateAsync(id));
    }

    // PATCH /api/stations/{id}/activate - Backoffice switches it back on.
    [HttpPatch("{id}/activate")]
    [Authorize(Roles = Roles.Backoffice)]
    public async Task<ActionResult<StationResponse>> Activate(string id)
    {
        return Ok(await _stations.ActivateAsync(id));
    }

    // DELETE /api/stations/{id} - Backoffice; only without booking history (R7). Returns 204.
    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Backoffice)]
    public async Task<ActionResult> Delete(string id)
    {
        await _stations.DeleteAsync(id);
        return NoContent();
    }
}
