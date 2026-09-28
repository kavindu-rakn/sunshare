/*
 * ============================================================================
 *  File        : SlotsController.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Nodes, Slots & Map
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : Slot endpoints: a station's slots, bookable slots (R9, R11),
 *                get, create, edit and delete (R8).
 *                Role checks (R2) are the [Authorize] lines; rules are in SlotService.
 * ============================================================================
 */
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SunShare.Api.Dtos;
using SunShare.Api.Models;
using SunShare.Api.Services;

namespace SunShare.Api.Controllers;

// Routes start at /api so one controller can serve both /api/stations/{id}/slots and /api/slots/...
// Backoffice and Grid Operators manage slots; anyone logged in can read them (RULE R2).
[ApiController]
[Route("api")]
[Authorize]
public class SlotsController : ControllerBase
{
    private readonly SlotService _slots;

    // Receives the slot service (registered in Program.cs).
    public SlotsController(SlotService slots)
    {
        _slots = slots;
    }

    // GET /api/stations/{stationId}/slots?from=&to= - staff: one station's slots (default: today + 14 days).
    [HttpGet("stations/{stationId}/slots")]
    [Authorize(Roles = Roles.Staff)]
    public async Task<ActionResult<List<SlotResponse>>> ListForStation(string stationId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        return Ok(await _slots.ListForStationAsync(stationId, from, to));
    }

    // GET /api/slots/available?stationId= - any logged-in user: slots that can be booked now (R9, R11).
    [HttpGet("slots/available")]
    public async Task<ActionResult<List<SlotResponse>>> Available([FromQuery] string? stationId)
    {
        return Ok(await _slots.GetAvailableAsync(stationId));
    }

    // GET /api/slots/{id} - any logged-in user: one slot.
    [HttpGet("slots/{id}")]
    public async Task<ActionResult<SlotResponse>> Get(string id)
    {
        return Ok(await _slots.GetAsync(id));
    }

    // POST /api/slots - staff add a slot (R8). Returns 201.
    [HttpPost("slots")]
    [Authorize(Roles = Roles.Staff)]
    public async Task<ActionResult<SlotResponse>> Create(SlotRequest request)
    {
        SlotResponse slot = await _slots.CreateAsync(request);
        return Created($"/api/slots/{slot.Id}", slot);
    }

    // PUT /api/slots/{id} - staff edit times, places or open/closed (R8).
    [HttpPut("slots/{id}")]
    [Authorize(Roles = Roles.Staff)]
    public async Task<ActionResult<SlotResponse>> Update(string id, SlotUpdateRequest request)
    {
        return Ok(await _slots.UpdateAsync(id, request));
    }

    // DELETE /api/slots/{id} - staff; 409 while it has active reservations (R8). Returns 204.
    [HttpDelete("slots/{id}")]
    [Authorize(Roles = Roles.Staff)]
    public async Task<ActionResult> Delete(string id)
    {
        await _slots.DeleteAsync(id);
        return NoContent();
    }
}
