/*
 * ============================================================================
 *  File        : ReservationResponse.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : A booking as the API sends it, including canModify (show
 *                Edit/Cancel?) and qrData (QR text, only when Approved).
 * ============================================================================
 */
package com.sunshare.app.api.models;

// Every booking screen reads this; the app never works out the rules itself (canModify comes from the API).
public class ReservationResponse {
    public String id;
    public String prosumerNic;
    public String prosumerName;
    public String stationId;
    public String stationName;
    public String slotId;
    public String startTime;
    public String endTime;
    public double energyKwh;
    public String type;
    public String status;
    public boolean canModify;
    public String qrData;
    public String approvedBy;
    public String approvedAt;
    public String completedBy;
    public String completedAt;
    public String cancelledBy;
    public String cancelledAt;
    public String createdAt;
    public String updatedAt;
}
