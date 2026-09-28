/*
 * ============================================================================
 *  File        : ApiException.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : The error that services throw on purpose when a request
 *                breaks a rule. Carries an HTTP status code and a friendly
 *                message; ErrorHandlingMiddleware sends both to the client.
 * ============================================================================
 */

namespace SunShare.Api.Helpers;

// Example: throw new ApiException(409, "This slot is already full.");
// Status codes we use: 400 rule broken, 401 bad login, 403 not allowed / not yours, 404 not found, 409 conflict.
public class ApiException : Exception
{
    public int StatusCode { get; }

    // Creates the error with the HTTP status code to send and the message the user will see.
    public ApiException(int statusCode, string message) : base(message)
    {
        StatusCode = statusCode;
    }
}
