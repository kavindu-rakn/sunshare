/*
 * ============================================================================
 *  File        : SunShareDbHelper.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : The phone's own small SQLite database "sunshare_local.db"
 *                (docs/02-ARCHITECTURE.md section 9). Three tables:
 *                session (who is logged in + their JWT token),
 *                stations_cache (stations for the map when offline) and
 *                app_settings (the server address). The real data lives in
 *                MongoDB behind the API; this is only a local helper store.
 * ============================================================================
 */
package com.sunshare.app.db;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import com.sunshare.app.api.models.StationResponse;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

// Reference: Save data using SQLite (Android Developers) https://developer.android.com/training/data-storage/sqlite
public class SunShareDbHelper extends SQLiteOpenHelper {

    private static final String DB_NAME = "sunshare_local.db";
    private static final int DB_VERSION = 1;

    private static final String TABLE_SESSION = "session";
    private static final String TABLE_STATIONS = "stations_cache";
    private static final String TABLE_SETTINGS = "app_settings";

    // One shared helper for the whole app, so every screen reads the same database file.
    private static SunShareDbHelper instance;

    // Returns the shared helper, creating it the first time it is needed.
    public static synchronized SunShareDbHelper get(Context context) {
        if (instance == null) {
            instance = new SunShareDbHelper(context.getApplicationContext());
        }
        return instance;
    }

    // Private constructor: other classes use get(context) instead.
    private SunShareDbHelper(Context context) {
        super(context, DB_NAME, null, DB_VERSION);
    }

    // Runs once, the first time the app opens the database: creates the three tables.
    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE " + TABLE_SESSION + " ("
                + "nic TEXT PRIMARY KEY, full_name TEXT, role TEXT, token TEXT, logged_in_at TEXT)");
        db.execSQL("CREATE TABLE " + TABLE_STATIONS + " ("
                + "id TEXT PRIMARY KEY, name TEXT, address TEXT, latitude REAL, longitude REAL, "
                + "capacity_kw REAL, battery_slots INTEGER, open_time TEXT, close_time TEXT, "
                + "distance_km REAL, cached_at TEXT)");
        db.execSQL("CREATE TABLE " + TABLE_SETTINGS + " (key TEXT PRIMARY KEY, value TEXT)");
    }

    // Runs when DB_VERSION goes up. Version 1 is the only version, so it simply rebuilds the tables.
    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_SESSION);
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_STATIONS);
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_SETTINGS);
        onCreate(db);
    }

    // ---------- session (max 1 row) ----------

    // Saves the logged-in user after a successful login. Old rows are removed first, so there is only ever one.
    public void saveSession(Session session) {
        SQLiteDatabase db = getWritableDatabase();
        db.delete(TABLE_SESSION, null, null);
        ContentValues values = new ContentValues();
        values.put("nic", session.nic);
        values.put("full_name", session.fullName);
        values.put("role", session.role);
        values.put("token", session.token);
        values.put("logged_in_at", session.loggedInAt);
        db.insert(TABLE_SESSION, null, values);
    }

    // Returns the saved session, or null when nobody is logged in.
    public Session getSession() {
        Cursor cursor = getReadableDatabase().query(TABLE_SESSION,
                new String[]{"nic", "full_name", "role", "token", "logged_in_at"},
                null, null, null, null, null, "1");
        try {
            if (!cursor.moveToFirst()) {
                return null;
            }
            return new Session(cursor.getString(0), cursor.getString(1), cursor.getString(2),
                    cursor.getString(3), cursor.getString(4));
        } finally {
            cursor.close();
        }
    }

    // Forgets the logged-in user (logout, deactivated account, or the token expired - HTTP 401).
    public void clearSession() {
        getWritableDatabase().delete(TABLE_SESSION, null, null);
    }

    // ---------- app_settings ----------

    // Saves one setting (for example api_base_url). An existing value with the same key is replaced.
    public void saveSetting(String key, String value) {
        ContentValues values = new ContentValues();
        values.put("key", key);
        values.put("value", value);
        getWritableDatabase().insertWithOnConflict(TABLE_SETTINGS, null, values, SQLiteDatabase.CONFLICT_REPLACE);
    }

    // Returns one setting, or null if it was never saved.
    public String getSetting(String key) {
        Cursor cursor = getReadableDatabase().query(TABLE_SETTINGS, new String[]{"value"},
                "key = ?", new String[]{key}, null, null, null);
        try {
            return cursor.moveToFirst() ? cursor.getString(0) : null;
        } finally {
            cursor.close();
        }
    }

    // ---------- stations_cache ----------

    // Replaces the cached stations with the latest list from GET /api/stations/nearby.
    // A transaction makes the delete + inserts happen all together (or not at all).
    public void cacheStations(List<StationResponse> stations) {
        SQLiteDatabase db = getWritableDatabase();
        String now = Instant.now().toString();
        db.beginTransaction();
        try {
            db.delete(TABLE_STATIONS, null, null);
            for (StationResponse station : stations) {
                ContentValues values = new ContentValues();
                values.put("id", station.id);
                values.put("name", station.name);
                values.put("address", station.address);
                values.put("latitude", station.latitude);
                values.put("longitude", station.longitude);
                values.put("capacity_kw", station.capacityKw);
                values.put("battery_slots", station.batterySlots);
                values.put("open_time", station.openTime);
                values.put("close_time", station.closeTime);
                values.put("distance_km", station.distanceKm);
                values.put("cached_at", now);
                db.insert(TABLE_STATIONS, null, values);
            }
            db.setTransactionSuccessful();
        } finally {
            db.endTransaction();
        }
    }

    // Returns the cached stations, nearest first (used by the map when the API can't be reached).
    public List<StationResponse> getCachedStations() {
        List<StationResponse> stations = new ArrayList<>();
        Cursor cursor = getReadableDatabase().query(TABLE_STATIONS,
                new String[]{"id", "name", "address", "latitude", "longitude", "capacity_kw",
                        "battery_slots", "open_time", "close_time", "distance_km"},
                null, null, null, null, "distance_km ASC");
        try {
            while (cursor.moveToNext()) {
                StationResponse station = new StationResponse();
                station.id = cursor.getString(0);
                station.name = cursor.getString(1);
                station.address = cursor.getString(2);
                station.latitude = cursor.getDouble(3);
                station.longitude = cursor.getDouble(4);
                station.capacityKw = cursor.getDouble(5);
                station.batterySlots = cursor.getInt(6);
                station.openTime = cursor.getString(7);
                station.closeTime = cursor.getString(8);
                station.distanceKm = cursor.isNull(9) ? null : cursor.getDouble(9);
                station.isActive = true; // only active stations are ever cached (R18)
                stations.add(station);
            }
        } finally {
            cursor.close();
        }
        return stations;
    }

    // Returns when the stations were cached (ISO UTC text), or null if the cache is empty.
    public String getStationsCachedAt() {
        Cursor cursor = getReadableDatabase().query(TABLE_STATIONS, new String[]{"cached_at"},
                null, null, null, null, null, "1");
        try {
            return cursor.moveToFirst() ? cursor.getString(0) : null;
        } finally {
            cursor.close();
        }
    }
}
