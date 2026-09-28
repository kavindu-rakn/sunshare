/*
 * ============================================================================
 *  File        : AuthController.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & Access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-28
 *  Description : Public endpoints POST /api/auth/login and
 *                POST /api/auth/register (no token needed).
 * ============================================================================
 */
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SunShare.Api.Dtos;
using SunShare.Api.Services;

namespace SunShare.Api.Controllers;

// [AllowAnonymous] = anyone may call these; you can't have a token before you log in.
[ApiController]
[Route("api/auth")]
[AllowAnonymous]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;

    // Receives the auth service (registered in Program.cs).
    public AuthController(AuthService auth)
    {
        _auth = auth;
    }

    // POST /api/auth/login - NIC + password -> token, NIC, name, role, expiry.
    // Errors: 401 wrong NIC/password, 403 Pending (R3) or Deactivated (R4).
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        return Ok(await _auth.LoginAsync(request));
    }

    // POST /api/auth/register - mobile sign-up; the new prosumer starts Pending (R3). Returns 201.
    // Errors: 400 bad NIC or missing details (R1), 409 NIC already registered.
    [HttpPost("register")]
    public async Task<ActionResult<UserResponse>> Register(RegisterRequest request)
    {
        UserResponse user = await _auth.RegisterAsync(request);
        return Created($"/api/users/{user.Nic}", user);
    }
}
