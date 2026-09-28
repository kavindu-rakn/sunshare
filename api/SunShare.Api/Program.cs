/*
 * ============================================================================
 *  File        : Program.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-27
 *  Description : Start-up of the SunShare Web API. Registers the services,
 *                builds the app, sets up the request pipeline (Swagger,
 *                authorization, controllers) and starts listening for requests.
 * ============================================================================
 */

var builder = WebApplication.CreateBuilder(args);

// Register the controllers (our API endpoints) and Swagger (the click-to-test page at /swagger).
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Swagger is ON in every environment (not only Development) so it also works on IIS for the demo.
app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthorization();

app.MapControllers();

app.Run();
