/*
 * ============================================================================
 *  File        : UpdateProfileRequest.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : JSON body for PUT /api/profile: the prosumer edits their
 *                own details; newPassword is optional.
 * ============================================================================
 */
package com.sunshare.app.api.models;

// newPassword = null keeps the current password.
public class UpdateProfileRequest {
    public String fullName;
    public String email;
    public String phone;
    public String address;
    public String newPassword;

    // Builds the request from the Profile form.
    public UpdateProfileRequest(String fullName, String email, String phone, String address, String newPassword) {
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.newPassword = newPassword;
    }
}
