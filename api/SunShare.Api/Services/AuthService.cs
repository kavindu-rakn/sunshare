/*
 * ============================================================================
 *  File        : AuthService.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & Access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-28
 *  Description : Login (checks the password and the account status, then
 *                gives a JWT) and mobile self-registration (rules R1, R3, R4).
 * ============================================================================
 */
using MongoDB.Driver;
using SunShare.Api.Data;
using SunShare.Api.Dtos;
using SunShare.Api.Helpers;
using SunShare.Api.Models;

namespace SunShare.Api.Services;

// Everything about getting into the system.
public class AuthService
{
    private readonly MongoDbContext _db;
    private readonly JwtTokenHelper _jwt;
    private readonly UserService _users;

    // Receives the database, the token maker and the user service (for registration).
    public AuthService(MongoDbContext db, JwtTokenHelper jwt, UserService users)
    {
        _db = db;
        _jwt = jwt;
        _users = users;
    }

    // Logs a user in: finds them by NIC, checks the password against the BCrypt hash,
    // checks the account is Active (R3, R4), then returns a signed token and who they are.
    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Nic) || string.IsNullOrEmpty(request.Password))
        {
            throw new ApiException(400, "Please enter your NIC and password.");
        }

        string nic = NicValidator.Normalize(request.Nic);
        User? user = await _db.Users.Find(u => u.Nic == nic).FirstOrDefaultAsync();

        // Same message for "no such NIC" and "wrong password", so nobody can guess which NICs exist.
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new ApiException(401, "NIC or password is incorrect.");
        }

        // RULE R3: a self-registered prosumer can't log in until Backoffice activates them.
        if (user.Status == UserStatuses.Pending)
        {
            throw new ApiException(403, "Your account is waiting for Backoffice activation.");
        }
        // RULE R4: a deactivated user can't log in.
        if (user.Status == UserStatuses.Deactivated)
        {
            throw new ApiException(403, "Your account is deactivated. Please contact the Backoffice.");
        }

        var (token, expiresAt) = _jwt.CreateToken(user);
        return new LoginResponse
        {
            Token = token,
            Nic = user.Nic,
            FullName = user.FullName,
            Role = user.Role,
            ExpiresAt = expiresAt
        };
    }

    // Mobile self-registration. The NIC, details and password are checked by UserService (R1).
    public async Task<UserResponse> RegisterAsync(RegisterRequest request)
    {
        // RULE R3: a self-registered account is always a Prosumer and starts Pending.
        return await _users.AddUserAsync(request.Nic, request.FullName, request.Email, request.Phone,
            request.Address, Roles.Prosumer, UserStatuses.Pending, request.Password);
    }
}
