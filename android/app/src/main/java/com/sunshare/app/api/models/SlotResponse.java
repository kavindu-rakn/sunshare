/*
 * ============================================================================
 *  File        : SlotResponse.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : A bookable time window at a station (times in UTC).
 * ============================================================================
 */
package com.sunshare.app.api.models;

// { id, stationId, stationName, startTime, endTime, totalSlots, availableSlots, bookedSlots, isActive }.
public class SlotResponse {
    public String id;
    public String stationId;
    public String stationName;
    public String startTime;
    public String endTime;
    public int totalSlots;
    public int availableSlots;
    public int bookedSlots;
    public boolean isActive;
}
