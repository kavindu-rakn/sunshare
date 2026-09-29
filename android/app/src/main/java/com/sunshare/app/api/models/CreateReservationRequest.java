/*
 * ============================================================================
 *  File        : CreateReservationRequest.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : JSON body for POST /api/reservations. A prosumer leaves
 *                prosumerNic empty; the API takes the NIC from the token (R16).
 * ============================================================================
 */
package com.sunshare.app.api.models;

// slotId + energy + type ("Sell" or "Buy").
public class CreateReservationRequest {
    public String prosumerNic;
    public String slotId;
    public double energyKwh;
    public String type;

    // Builds a booking request for the logged-in prosumer (no prosumerNic needed).
    public CreateReservationRequest(String slotId, double energyKwh, String type) {
        this.slotId = slotId;
        this.energyKwh = energyKwh;
        this.type = type;
    }
}
