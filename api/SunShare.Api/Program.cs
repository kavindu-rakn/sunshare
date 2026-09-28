/*
 * ============================================================================
 *  File        : Program.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-27
 *  Description : Start-up of the SunShare Web API. Registers the services
 *                (MongoDB, controllers + JSON, JWT login tokens, CORS, Swagger),
 *                prepares the database, sets up the request pipeline and starts
 *                listening for requests.
 * ============================================================================
 */
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using SunShare.Api.Data;
using SunShare.Api.Middleware;

var builder = WebApplication.CreateBuilder(args);

// ---------- MongoDB ----------
// Read the "MongoDb" section of appsettings.json and register ONE shared MongoDbContext
// (a singleton) that every controller and service receives.
var mongoSettings = builder.Configuration.GetSection("MongoDb").Get<MongoDbSettings>()!;
builder.Services.AddSingleton(new MongoDbContext(mongoSettings));

// ---------- Controllers + JSON ----------
// JSON uses camelCase names (e.g. availableSlots). If a request body has missing or badly typed
// fields, answer 400 with { "message": "..." } like every other error, instead of ASP.NET's default shape.
builder.Services.AddControllers()
    .AddJsonOptions(options => options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase)
    .ConfigureApiBehaviorOptions(options =>
        options.InvalidModelStateResponseFactory = context =>
        {
            string firstError = context.ModelState.Values
                .SelectMany(entry => entry.Errors)
                .Select(error => error.ErrorMessage)
                .FirstOrDefault(text => text != "") ?? "Some details are missing or invalid.";
            return new BadRequestObjectResult(new { message = firstError });
        });

// ---------- Login tokens (JWT) ----------
// Protected requests must send "Authorization: Bearer <token>". A token is accepted only if it was
// signed with our secret key, made by this API, meant for our apps, and has not expired.
// Reference: Microsoft Learn, "Configure JWT bearer authentication in ASP.NET Core"
// https://learn.microsoft.com/en-us/aspnet/core/security/authentication/configure-jwt-bearer-authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwtSettings["Audience"],
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
        // Missing/expired token (401) and wrong role (403) also answer with { "message": "..." }.
        options.Events = new JwtBearerEvents
        {
            OnChallenge = async context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsJsonAsync(new { message = "Please log in to continue." });
            },
            OnForbidden = async context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new { message = "You don't have permission to do that." });
            }
        };
    });
builder.Services.AddAuthorization();

// ---------- CORS ----------
// Browsers only let a web page call an API on another address if the API allows that page's address.
// Allowed: the React dev server (5173) and the IIS-hosted web app (8081), from appsettings.json.
string[] allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
bool isDevelopment = builder.Environment.IsDevelopment();
builder.Services.AddCors(options => options.AddPolicy("WebApp", policy => policy
    .SetIsOriginAllowed(IsAllowedOrigin)
    .AllowAnyHeader()
    .AllowAnyMethod()));

// ---------- Swagger ----------
// The click-to-test page at /swagger, with an "Authorize" button to paste a login token.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "SunShare API",
        Version = "v1",
        Description = "Smart Solar Microgrid Trading System - SE4040 Assignment 1"
    });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Paste the token from POST /api/auth/login (just the token, without the word Bearer)."
    });
    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});

var app = builder.Build();

// ---------- Prepare the database ----------
// Once at start-up: create the indexes, then add the sample data if the database is empty.
// If MongoDB is down we only log it, so the API still starts and GET /api/health can report "unreachable".
var db = app.Services.GetRequiredService<MongoDbContext>();
try
{
    await db.CreateIndexesAsync();
    await new DataSeeder(db).SeedAsync();
}
catch (TimeoutException ex)
{
    app.Logger.LogError(ex, "MongoDB could not be reached at start-up, so indexes and sample data were skipped.");
}

// ---------- Request pipeline (the order matters) ----------
app.UseMiddleware<ErrorHandlingMiddleware>();   // 1. catch every error -> { "message" }
app.UseSwagger();                               // 2. Swagger stays ON in every environment (also on IIS for the demo)
app.UseSwaggerUI();
app.UseCors("WebApp");                          // 3. CORS headers for the web app
app.UseAuthentication();                        // 4. read the token: who is calling?
app.UseAuthorization();                         // 5. check [Authorize(Roles = ...)]: may they do this?
app.MapControllers();                           // 6. run the matching controller action

app.Run();

// CORS check: may a web page from this address (its "origin") call the API?
// Allowed if it is in the list; while developing, any localhost port is also fine
// (e.g. a preview browser that had to use a different port).
bool IsAllowedOrigin(string origin)
{
    if (allowedOrigins.Contains(origin))
    {
        return true;
    }
    return isDevelopment && Uri.TryCreate(origin, UriKind.Absolute, out Uri? uri) && uri.Host == "localhost";
}
