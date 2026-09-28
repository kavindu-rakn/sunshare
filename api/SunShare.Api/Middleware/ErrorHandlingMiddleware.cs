/*
 * ============================================================================
 *  File        : ErrorHandlingMiddleware.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : Catches every error thrown while handling a request and
 *                answers with the same JSON shape: { "message": "..." }
 *                (docs/02-ARCHITECTURE.md §6).
 * ============================================================================
 */
using SunShare.Api.Helpers;

namespace SunShare.Api.Middleware;

// Middleware = a step every request passes through. This one is first in the pipeline,
// so it can catch errors from everything after it (controllers, services, database).
public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    // Receives the next step of the pipeline and a logger (ASP.NET Core passes both in).
    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    // Runs for every request: passes it on, and if anything throws, sends a clean JSON error instead.
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ApiException ex)
        {
            // A rule was broken (thrown on purpose by a service): send its status code and message as they are.
            await WriteErrorAsync(context, ex.StatusCode, ex.Message);
        }
        catch (TimeoutException ex)
        {
            // The MongoDB driver gave up waiting: the database is not running or not reachable.
            _logger.LogError(ex, "Database timeout for {Method} {Path}", context.Request.Method, context.Request.Path);
            await WriteErrorAsync(context, StatusCodes.Status503ServiceUnavailable,
                "The database can't be reached right now. Please try again shortly.");
        }
        catch (Exception ex)
        {
            // An unexpected bug: keep the details in the server log, show only a safe message to the client.
            _logger.LogError(ex, "Unhandled error for {Method} {Path}", context.Request.Method, context.Request.Path);
            await WriteErrorAsync(context, StatusCodes.Status500InternalServerError, "Something went wrong on the server.");
        }
    }

    // Writes { "message": "..." } with the given HTTP status code.
    private static async Task WriteErrorAsync(HttpContext context, int statusCode, string message)
    {
        context.Response.StatusCode = statusCode;
        await context.Response.WriteAsJsonAsync(new { message });
    }
}
