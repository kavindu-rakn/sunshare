/*
 * ============================================================================
 *  File        : MessageResponse.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : A JSON answer that only has a message: every API error
 *                and simple answers like "Account deactivated.".
 * ============================================================================
 */
package com.sunshare.app.api.models;

// { "message": "human friendly text" } - the shape of every API error (docs/02-ARCHITECTURE.md section 6).
public class MessageResponse {
    public String message;
}
