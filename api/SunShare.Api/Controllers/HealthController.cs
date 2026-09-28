/*
 * ============================================================================
 *  File        : HealthController.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : GET /api/health - a public check that the API is running and
 *                can reach MongoDB. Used in the demo to prove IIS + MongoDB work.
 * ============================================================================
 */
using Microsoft.AspNetCore.Mvc;
using SunShare.Api.Data;

namespace SunShare.Api.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    private readonly MongoDbContext _db;

    // Receives the shared database context (registered once in Program.cs).
    public HealthController(MongoDbContext db)
    {
        _db = db;
    }

    // GET /api/health (no login needed). Pings MongoDB and answers:
    // 200 { "api": "ok", "database": "connected", "time": ... }  or
    // 503 { "api": "ok", "database": "unreachable", "time": ... } when MongoDB is down.
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        bool connected = await _db.PingAsync();
        var result = new
        {
            api = "ok",
            database = connected ? "connected" : "unreachable",
            time = DateTime.UtcNow
        };

        if (!connected)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, result);
        }
        return Ok(result);
    }
}
