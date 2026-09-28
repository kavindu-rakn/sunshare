/*
 * ============================================================================
 *  File        : MongoDbSettings.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : Holds the "MongoDb" section of appsettings.json: where the
 *                MongoDB server is and which database to use (SunShareDb).
 * ============================================================================
 */

namespace SunShare.Api.Data;

// Plain settings class; Program.cs fills it from appsettings.json at start-up.
public class MongoDbSettings
{
    public string ConnectionString { get; set; } = "";

    public string DatabaseName { get; set; } = "";
}
