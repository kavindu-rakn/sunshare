/*
 * ============================================================================
 *  File        : ApiErrorParser.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Turns a failed API call into a human-friendly message.
 *                The API always sends errors as { "message": "..." }
 *                (docs/02-ARCHITECTURE.md section 6), so the app just shows
 *                that text - it never makes up its own rule messages.
 * ============================================================================
 */
package com.sunshare.app.api;

import android.content.Context;

import com.google.gson.Gson;
import com.sunshare.app.api.models.MessageResponse;

import okhttp3.ResponseBody;
import retrofit2.Response;

public final class ApiErrorParser {

    // Only static helpers - nobody needs to create an ApiErrorParser object.
    private ApiErrorParser() {
    }

    // The API answered with an error (400, 401, 403, 404, 409, 500...): returns its "message".
    // If the body is not our JSON (e.g. an IIS error page), returns a general text with the HTTP code.
    public static String fromResponse(Response<?> response) {
        try (ResponseBody body = response.errorBody()) {
            if (body != null) {
                MessageResponse error = new Gson().fromJson(body.charStream(), MessageResponse.class);
                if (error != null && error.message != null && !error.message.isEmpty()) {
                    return error.message;
                }
            }
        } catch (Exception notJson) {
            // Not our { "message" } JSON - fall through to the general text below.
        }
        return "The server answered with an error (HTTP " + response.code() + ").";
    }

    // The call never reached the API (server off, wrong address, phone not on the same Wi-Fi).
    public static String fromFailure(Context context) {
        return "Can't reach the SunShare server at " + ApiConfig.getBaseUrl(context)
                + ". Check the server address (⚙ on the Login screen) and that the phone is on the same Wi-Fi as the laptop.";
    }
}
