/*
 * ============================================================================
 *  File        : UsersController.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & Access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-28
 *  Description : /api/users endpoints for the web app: list, pending
 *                activations, get, create, edit, activate and deactivate.
 *                Role checks (R2) are the [Authorize] lines; rules are in UserService.
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

// Every action needs a login; most are Backoffice only (RULE R2).
[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly UserService _users;

    // Receives the user service (registered in Program.cs).
    public UsersController(UserService users)
    {
        _users = users;
    }

    // GET /api/users?role=&status=&search= - Backoffice and GridOperator.
    // Grid Operators only read it, to pick a prosumer when booking for them.
    [HttpGet]
    [Authorize(Roles = Roles.Staff)]
    public async Task<ActionResult<List<UserResponse>>> List([FromQuery] string? role, [FromQuery] string? status, [FromQuery] string? search)
    {
        return Ok(await _users.ListAsync(role, status, search));
    }

    // GET /api/users/pending-activations - Backoffice: prosumers that are Pending or Deactivated.
    [HttpGet("pending-activations")]
    [Authorize(Roles = Roles.Backoffice)]
    public async Task<ActionResult<List<UserResponse>>> PendingActivations()
    {
        return Ok(await _users.GetPendingActivationsAsync());
    }

    // GET /api/users/{nic} - Backoffice: one user.
    [HttpGet("{nic}")]
    [Authorize(Roles = Roles.Backoffice)]
    public async Task<ActionResult<UserResponse>> Get(string nic)
    {
        return Ok(await _users.GetAsync(nic));
    }

    // POST /api/users - Backoffice creates an account of any role (it starts Active). Returns 201.
    [HttpPost]
    [Authorize(Roles = Roles.Backoffice)]
    public async Task<ActionResult<UserResponse>> Create(CreateUserRequest request)
    {
        UserResponse user = await _users.CreateAsync(request);
        return Created($"/api/users/{user.Nic}", user);
    }

    // PUT /api/users/{nic} - Backoffice edits name, email, phone and address.
    [HttpPut("{nic}")]
    [Authorize(Roles = Roles.Backoffice)]
    public async Task<ActionResult<UserResponse>> Update(string nic, UpdateUserRequest request)
    {
        return Ok(await _users.UpdateAsync(nic, request));
    }

    // PATCH /api/users/{nic}/activate - Backoffice: Pending or Deactivated -> Active (R3, R4).
    [HttpPatch("{nic}/activate")]
    [Authorize(Roles = Roles.Backoffice)]
    public async Task<ActionResult<UserResponse>> Activate(string nic)
    {
        return Ok(await _users.ActivateAsync(nic));
    }

    // PATCH /api/users/{nic}/deactivate - Backoffice: -> Deactivated (R4). The caller's NIC comes from the token.
    [HttpPatch("{nic}/deactivate")]
    [Authorize(Roles = Roles.Backoffice)]
    public async Task<ActionResult<UserResponse>> Deactivate(string nic)
    {
        string callerNic = User.FindFirstValue(JwtTokenHelper.NicClaim)!;
        return Ok(await _users.DeactivateAsync(nic, callerNic));
    }
}
