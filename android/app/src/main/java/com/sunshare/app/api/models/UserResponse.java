/*
 * ============================================================================
 *  File        : UserResponse.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : An account as the API sends it (it never contains the
 *                password hash).
 * ============================================================================
 */
package com.sunshare.app.api.models;

// { nic, fullName, email, phone, address, role, status, createdAt, updatedAt }.
public class UserResponse {
    public String nic;
    public String fullName;
    public String email;
    public String phone;
    public String address;
    public String role;
    public String status;
    public String createdAt;
    public String updatedAt;
}
