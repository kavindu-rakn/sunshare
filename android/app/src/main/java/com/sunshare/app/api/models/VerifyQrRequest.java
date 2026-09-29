/*
 * ============================================================================
 *  File        : VerifyQrRequest.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : JSON body for POST /api/reservations/verify-qr and
 *                PATCH /api/reservations/{id}/complete: the scanned QR text.
 * ============================================================================
 */
package com.sunshare.app.api.models;

// { "qrData": "SUNSHARE|<reservationId>|<token>" } (R14).
public class VerifyQrRequest {
    public String qrData;

    // Wraps the text the camera read from the QR code.
    public VerifyQrRequest(String qrData) {
        this.qrData = qrData;
    }
}
