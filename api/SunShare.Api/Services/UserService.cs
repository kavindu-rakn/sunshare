/*
 * ============================================================================
 *  File        : UserService.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : A - Accounts & Access
 *  Author      : Gimhan T P K (IT22266996)
 *  Created     : 2026-09-28
 *  Description : Business rules for user accounts: list/search, create,
 *                edit, activate and deactivate (rules R1, R3, R4), plus a
 *                prosumer's own profile edit and self-deactivation (R5, R16).
 * ============================================================================
 */
using System.Text.RegularExpressions;
using MongoDB.Bson;
using MongoDB.Driver;
using SunShare.Api.Data;
using SunShare.Api.Dtos;
using SunShare.Api.Helpers;
using SunShare.Api.Models;

namespace SunShare.Api.Services;

// All account rules live here (FAT service). Controllers only pass the request in and the result out.
public class UserService
{
    private const int MinPasswordLength = 6;

    private readonly MongoDbContext _db;

    // Receives the shared database context.
    public UserService(MongoDbContext db)
    {
        _db = db;
    }

    // Lists users for the web tables. Optional filters: role, status, and a search text that is
    // matched against NIC, name or email (not case-sensitive). Sorted by name.
    public async Task<List<UserResponse>> ListAsync(string? role, string? status, string? search)
    {
        var filter = Builders<User>.Filter.Empty;
        if (!string.IsNullOrWhiteSpace(role))
        {
            filter &= Builders<User>.Filter.Eq(u => u.Role, role);
        }
        if (!string.IsNullOrWhiteSpace(status))
        {
            filter &= Builders<User>.Filter.Eq(u => u.Status, status);
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            // Regex.Escape makes characters like "." or "*" in the search text count as plain text.
            var pattern = new BsonRegularExpression(Regex.Escape(search.Trim()), "i");
            filter &= Builders<User>.Filter.Or(
                Builders<User>.Filter.Regex(u => u.Nic, pattern),
                Builders<User>.Filter.Regex(u => u.FullName, pattern),
                Builders<User>.Filter.Regex(u => u.Email, pattern));
        }

        List<User> users = await _db.Users.Find(filter).SortBy(u => u.FullName).ToListAsync();
        return users.Select(UserResponse.FromUser).ToList();
    }

    // Prosumers waiting for Backoffice: new sign-ups (Pending, R3) and deactivated accounts
    // that need reactivation (R4). The one waiting longest comes first.
    public async Task<List<UserResponse>> GetPendingActivationsAsync()
    {
        var filter = Builders<User>.Filter.Eq(u => u.Role, Roles.Prosumer)
            & Builders<User>.Filter.In(u => u.Status, [UserStatuses.Pending, UserStatuses.Deactivated]);

        List<User> users = await _db.Users.Find(filter).SortBy(u => u.UpdatedAt).ToListAsync();
        return users.Select(UserResponse.FromUser).ToList();
    }

    // Gets one user by NIC, or 404 if there is none.
    public async Task<UserResponse> GetAsync(string nic)
    {
        User user = await FindOrThrowAsync(nic);
        return UserResponse.FromUser(user);
    }

    // Backoffice creates an account of any role. Accounts made by staff are Active straight away.
    public async Task<UserResponse> CreateAsync(CreateUserRequest request)
    {
        // RULE R2: only the three known roles exist.
        if (request.Role != Roles.Backoffice && request.Role != Roles.GridOperator && request.Role != Roles.Prosumer)
        {
            throw new ApiException(400, "Role must be Backoffice, GridOperator or Prosumer.");
        }

        return await AddUserAsync(request.Nic, request.FullName, request.Email, request.Phone,
            request.Address, request.Role, UserStatuses.Active, request.Password);
    }

    // Checks and saves a brand-new account. Used by Backoffice "create user" (Active)
    // and by mobile self-registration in AuthService (Pending, R3).
    public async Task<UserResponse> AddUserAsync(string nic, string fullName, string email, string phone,
        string? address, string role, string status, string password)
    {
        nic = NicValidator.Normalize(nic);
        // RULE R1: the NIC must be a valid Sri Lankan NIC.
        if (!NicValidator.IsValid(nic))
        {
            throw new ApiException(400, "Please enter a valid NIC: 9 digits followed by V or X (e.g. 981234567V), or 12 digits (e.g. 199812345678).");
        }
        ValidateDetails(fullName, email, phone);
        ValidatePassword(password);

        // RULE R1: the NIC is the primary key (_id), so two accounts can't share it.
        bool nicTaken = await _db.Users.Find(u => u.Nic == nic).AnyAsync();
        if (nicTaken)
        {
            throw new ApiException(409, "An account with this NIC already exists.");
        }

        DateTime now = DateTime.UtcNow;
        var user = new User
        {
            Nic = nic,
            Role = role,
            Status = status,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            CreatedAt = now,
            UpdatedAt = now
        };
        ApplyDetails(user, fullName, email, phone, address);

        await _db.Users.InsertOneAsync(user);
        return UserResponse.FromUser(user);
    }

    // Backoffice edits an account's details. The NIC and the role never change.
    public async Task<UserResponse> UpdateAsync(string nic, UpdateUserRequest request)
    {
        User user = await FindOrThrowAsync(nic);
        ValidateDetails(request.FullName, request.Email, request.Phone);

        ApplyDetails(user, request.FullName, request.Email, request.Phone, request.Address);
        user.UpdatedAt = DateTime.UtcNow;

        await _db.Users.ReplaceOneAsync(u => u.Nic == user.Nic, user);
        return UserResponse.FromUser(user);
    }

    // Backoffice activates a Pending prosumer (R3) or reactivates a Deactivated account (R4).
    public async Task<UserResponse> ActivateAsync(string nic)
    {
        User user = await FindOrThrowAsync(nic);
        if (user.Status == UserStatuses.Active)
        {
            throw new ApiException(400, "This account is already active.");
        }

        // RULE R3 + R4: only Backoffice (checked by UsersController) can make an account Active.
        return await SetStatusAsync(user, UserStatuses.Active);
    }

    // Backoffice deactivates an account so it can no longer log in (R4).
    public async Task<UserResponse> DeactivateAsync(string nic, string callerNic)
    {
        User user = await FindOrThrowAsync(nic);
        // RULE R4: a Backoffice user can't deactivate their own account.
        if (user.Nic == callerNic)
        {
            throw new ApiException(400, "You can't deactivate your own account.");
        }
        if (user.Status == UserStatuses.Deactivated)
        {
            throw new ApiException(400, "This account is already deactivated.");
        }

        return await SetStatusAsync(user, UserStatuses.Deactivated);
    }

    // A prosumer edits their own details and can set a new password (at least 6 characters).
    // RULE R16: callerNic comes from the login token, so nobody can edit someone else's profile.
    public async Task<UserResponse> UpdateProfileAsync(string callerNic, UpdateProfileRequest request)
    {
        User user = await FindOrThrowAsync(callerNic);
        // RULE R4: a deactivated account can't be changed, even if an old token is still valid.
        if (user.Status == UserStatuses.Deactivated)
        {
            throw new ApiException(403, "Your account is deactivated. Please contact the Backoffice.");
        }
        ValidateDetails(request.FullName, request.Email, request.Phone);

        ApplyDetails(user, request.FullName, request.Email, request.Phone, request.Address);
        if (!string.IsNullOrEmpty(request.NewPassword))
        {
            ValidatePassword(request.NewPassword);
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        }
        user.UpdatedAt = DateTime.UtcNow;

        await _db.Users.ReplaceOneAsync(u => u.Nic == user.Nic, user);
        return UserResponse.FromUser(user);
    }

    // RULE R5: a prosumer deactivates their own account from the mobile app.
    // Afterwards they can't log in (R4) and they appear on Backoffice's Pending Activations list.
    public async Task DeactivateSelfAsync(string callerNic)
    {
        User user = await FindOrThrowAsync(callerNic);
        if (user.Status == UserStatuses.Deactivated)
        {
            throw new ApiException(400, "Your account is already deactivated.");
        }
        await SetStatusAsync(user, UserStatuses.Deactivated);
    }

    // Saves a new status for a user and returns the updated user.
    private async Task<UserResponse> SetStatusAsync(User user, string status)
    {
        user.Status = status;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.Users.ReplaceOneAsync(u => u.Nic == user.Nic, user);
        return UserResponse.FromUser(user);
    }

    // Loads a user by NIC (cleaned first), or throws 404 if there is none.
    private async Task<User> FindOrThrowAsync(string nic)
    {
        string cleanNic = NicValidator.Normalize(nic);
        User? user = await _db.Users.Find(u => u.Nic == cleanNic).FirstOrDefaultAsync();
        if (user == null)
        {
            throw new ApiException(404, "User not found.");
        }
        return user;
    }

    // Checks the details every account needs: a full name, an email with an "@" and a phone number.
    private static void ValidateDetails(string fullName, string email, string phone)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new ApiException(400, "Please enter the full name.");
        }
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
        {
            throw new ApiException(400, "Please enter a valid email address.");
        }
        if (string.IsNullOrWhiteSpace(phone))
        {
            throw new ApiException(400, "Please enter a phone number.");
        }
    }

    // Passwords must be at least 6 characters long.
    private static void ValidatePassword(string password)
    {
        if (string.IsNullOrEmpty(password) || password.Length < MinPasswordLength)
        {
            throw new ApiException(400, $"The password must be at least {MinPasswordLength} characters long.");
        }
    }

    // Copies the editable details onto a user, trimmed. An empty address is saved as "no address".
    private static void ApplyDetails(User user, string fullName, string email, string phone, string? address)
    {
        user.FullName = fullName.Trim();
        user.Email = email.Trim();
        user.Phone = phone.Trim();
        user.Address = string.IsNullOrWhiteSpace(address) ? null : address.Trim();
    }
}
