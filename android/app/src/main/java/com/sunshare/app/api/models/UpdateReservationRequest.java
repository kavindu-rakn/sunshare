/*
 * ============================================================================
 *  File        : UpdateReservationRequest.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : JSON body for PUT /api/reservations/{id}: a new slot and/or
 *                energy amount and type.
 * ============================================================================
 */
package com.sunshare.app.api.models;

// The editable parts of a booking.
public class UpdateReservationRequest {
    public String slotId;
    public double energyKwh;
    public String type;

    // Builds the edit request from the Reservation form.
    public UpdateReservationRequest(String slotId, double energyKwh, String type) {
        this.slotId = slotId;
        this.energyKwh = energyKwh;
        this.type = type;
    }
}
