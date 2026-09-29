/*
 * ============================================================================
 *  File        : StationResponse.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : A solar station as the API sends it; distanceKm is only
 *                filled by GET /api/stations/nearby (R18).
 * ============================================================================
 */
package com.sunshare.app.api.models;

// One station: position, size, hours, status, active bookings and (for /nearby) the distance in km.
public class StationResponse {
    public String id;
    public String name;
    public String address;
    public double latitude;
    public double longitude;
    public double capacityKw;
    public int batterySlots;
    public String openTime;
    public String closeTime;
    public boolean isActive;
    public long activeReservationCount;
    public Double distanceKm;
}
