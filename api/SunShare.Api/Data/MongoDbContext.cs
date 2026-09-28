/*
 * ============================================================================
 *  File        : MongoDbContext.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : The one place that talks to MongoDB directly. Opens the
 *                SunShareDb database, exposes its 4 collections (exact names
 *                from docs/03-DATABASE.md), creates indexes and pings the DB.
 * ============================================================================
 */
using MongoDB.Bson;
using MongoDB.Driver;
using SunShare.Api.Models;

namespace SunShare.Api.Data;

// Reference: Microsoft Learn, "Create a web API with ASP.NET Core and MongoDB"
// https://learn.microsoft.com/en-us/aspnet/core/tutorials/first-mongo-app  (adapted: settings + collection setup)
public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    // The 4 collections. Property names = collection names, so they match the rubric exactly.
    public IMongoCollection<User> Users { get; }

    public IMongoCollection<SolarStation> SolarStationInfo { get; }

    public IMongoCollection<EnergyBookingSlot> EnergyBookingSlots { get; }

    public IMongoCollection<EnergyReservation> EnergyReservations { get; }

    // Creates the MongoDB client from the settings and picks the database and its 4 collections.
    // Nothing is sent over the network here; the driver connects on the first real query.
    public MongoDbContext(MongoDbSettings settings)
    {
        var clientSettings = MongoClientSettings.FromConnectionString(settings.ConnectionString);
        // Give up after 5 seconds (instead of the default 30) if MongoDB is not running.
        clientSettings.ServerSelectionTimeout = TimeSpan.FromSeconds(5);
        var client = new MongoClient(clientSettings);

        _database = client.GetDatabase(settings.DatabaseName);
        Users = _database.GetCollection<User>("Users");
        SolarStationInfo = _database.GetCollection<SolarStation>("SolarStationInfo");
        EnergyBookingSlots = _database.GetCollection<EnergyBookingSlot>("EnergyBookingSlots");
        EnergyReservations = _database.GetCollection<EnergyReservation>("EnergyReservations");
    }

    // Sends MongoDB a "ping" command. Returns true if it answered, false if it can't be reached.
    // Used by GET /api/health to prove the API and the database are connected.
    public async Task<bool> PingAsync()
    {
        try
        {
            await _database.RunCommandAsync((Command<BsonDocument>)"{ ping: 1 }");
            return true;
        }
        catch (Exception)
        {
            return false;
        }
    }

    // Creates the small indexes from docs/03-DATABASE.md §6 so common searches stay fast.
    // Safe to run on every start: MongoDB keeps an index that already exists.
    public async Task CreateIndexesAsync()
    {
        var slotsByStationAndTime = Builders<EnergyBookingSlot>.IndexKeys
            .Ascending(s => s.StationId)
            .Ascending(s => s.StartTime);
        await EnergyBookingSlots.Indexes.CreateOneAsync(new CreateIndexModel<EnergyBookingSlot>(slotsByStationAndTime));

        var reservationsByProsumer = Builders<EnergyReservation>.IndexKeys.Ascending(r => r.ProsumerNic);
        await EnergyReservations.Indexes.CreateOneAsync(new CreateIndexModel<EnergyReservation>(reservationsByProsumer));

        var reservationsByStatusAndTime = Builders<EnergyReservation>.IndexKeys
            .Ascending(r => r.Status)
            .Ascending(r => r.StartTime);
        await EnergyReservations.Indexes.CreateOneAsync(new CreateIndexModel<EnergyReservation>(reservationsByStatusAndTime));
    }
}
