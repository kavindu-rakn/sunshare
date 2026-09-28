/*
 * ============================================================================
 *  File        : JwtTokenHelper.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & Access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-28
 *  Description : Makes the signed login token (JWT) given to a user after a
 *                successful login. The token holds the NIC, name and role and
 *                is valid for 8 hours (settings in appsettings.json -> "Jwt").
 * ============================================================================
 */
using System.Text;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using SunShare.Api.Models;

namespace SunShare.Api.Helpers;

// A JWT is a signed "login ticket": anyone can read what is inside, but only our API
// (which knows the secret key) can make or change one without breaking the signature.
public class JwtTokenHelper
{
    // Names of the values ("claims") stored inside the token. Controllers read the caller's NIC
    // with User.FindFirstValue(JwtTokenHelper.NicClaim) - never from the request body (R16).
    public const string NicClaim = "nic";
    public const string NameClaim = "name";
    public const string RoleClaim = "role";

    private readonly IConfiguration _config;

    // Receives the app settings, to read the "Jwt" section (key, issuer, audience, expiry hours).
    public JwtTokenHelper(IConfiguration config)
    {
        _config = config;
    }

    // Makes a token for this user, signed with HMAC-SHA256 and our secret key.
    // Returns the token text and the moment it expires.
    public (string Token, DateTime ExpiresAt) CreateToken(User user)
    {
        DateTime expiresAt = DateTime.UtcNow.AddHours(_config.GetValue<int>("Jwt:ExpiryHours"));
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));

        var descriptor = new SecurityTokenDescriptor
        {
            Issuer = _config["Jwt:Issuer"],
            Audience = _config["Jwt:Audience"],
            Expires = expiresAt,
            Claims = new Dictionary<string, object>
            {
                [NicClaim] = user.Nic,
                [NameClaim] = user.FullName,
                [RoleClaim] = user.Role
            },
            SigningCredentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256)
        };

        string token = new JsonWebTokenHandler().CreateToken(descriptor);
        return (token, expiresAt);
    }
}
