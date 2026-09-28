/*
 * ============================================================================
 *  File        : ProfileController.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & Access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-28
 *  Description : /api/profile endpoints: the logged-in user's own account -
 *                view, edit and self-deactivate (rules R5, R16).
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

// Every action works on the caller's OWN account; the NIC is read from the login token (RULE R16).
[ApiController]
[Route("api/profile")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly UserService _users;

    // Receives the user service (registered in Program.cs).
    public ProfileController(UserService users)
    {
        _users = users;
    }

    // GET /api/profile - any logged-in user: their own account details.
    [HttpGet]
    public async Task<ActionResult<UserResponse>> Get()
    {
        return Ok(await _users.GetAsync(CallerNic()));
    }

    // PUT /api/profile - Prosumer: edit own details, optional new password.
    [HttpPut]
    [Authorize(Roles = Roles.Prosumer)]
    public async Task<ActionResult<UserResponse>> Update(UpdateProfileRequest request)
    {
        return Ok(await _users.UpdateProfileAsync(CallerNic(), request));
    }

    // PATCH /api/profile/deactivate - Prosumer: deactivate own account (R5). The app then clears its saved login.
    [HttpPatch("deactivate")]
    [Authorize(Roles = Roles.Prosumer)]
    public async Task<ActionResult> Deactivate()
    {
        await _users.DeactivateSelfAsync(CallerNic());
        return Ok(new { message = "Account deactivated." });
    }

    // Reads the caller's NIC from their login token (never from the request body - RULE R16).
    private string CallerNic()
    {
        return User.FindFirstValue(JwtTokenHelper.NicClaim)!;
    }
}
