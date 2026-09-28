/*
 * ============================================================================
 *  File        : DashboardController.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : D - Dashboards & QR
 *  Author      : Chamara R M L K (IT22076816)
 *  Created     : 2026-09-28
 *  Description : GET /api/dashboard/summary (staff) and
 *                GET /api/dashboard/prosumer (prosumer home).
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

// Dashboard numbers. Staff and prosumers each get their own endpoint (RULE R2).
[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly DashboardService _dashboard;

    // Receives the dashboard service (registered in Program.cs).
    public DashboardController(DashboardService dashboard)
    {
        _dashboard = dashboard;
    }

    // GET /api/dashboard/summary - Backoffice and Grid Operator: count cards + next pending bookings.
    [HttpGet("summary")]
    [Authorize(Roles = Roles.Staff)]
    public async Task<ActionResult<StaffDashboardResponse>> Summary()
    {
        return Ok(await _dashboard.GetStaffSummaryAsync());
    }

    // GET /api/dashboard/prosumer - Prosumer: counts of their own bookings and their next one (R16).
    [HttpGet("prosumer")]
    [Authorize(Roles = Roles.Prosumer)]
    public async Task<ActionResult<ProsumerDashboardResponse>> Prosumer()
    {
        string callerNic = User.FindFirstValue(JwtTokenHelper.NicClaim)!;
        return Ok(await _dashboard.GetProsumerSummaryAsync(callerNic));
    }
}
