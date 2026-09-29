/*
 * ============================================================================
 *  File        : ApiClient.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Builds the one Retrofit object the whole app uses to call
 *                the API. Before every request it adds the header
 *                "Authorization: Bearer <token>" from the SQLite session,
 *                and Gson turns the JSON answers into the model classes.
 * ============================================================================
 */
package com.sunshare.app.api;

import android.content.Context;

import com.sunshare.app.db.Session;
import com.sunshare.app.db.SunShareDbHelper;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public final class ApiClient {

    // Built once and reused; thrown away by reset() when the server address changes.
    private static ApiService service;

    // Only static helpers - nobody needs to create an ApiClient object.
    private ApiClient() {
    }

    // Returns the API service, building it the first time (with the saved server address).
    public static synchronized ApiService get(Context context) {
        if (service == null) {
            Context app = context.getApplicationContext();
            service = build(app, ApiConfig.getBaseUrl(app));
        }
        return service;
    }

    // Forgets the built service so the next get() uses the new server address.
    public static synchronized void reset() {
        service = null;
    }

    // Creates OkHttp (the network engine, 15 s time limits, token added) and Retrofit on top of it.
    // Reference: Retrofit - A type-safe HTTP client for Android and Java https://square.github.io/retrofit/
    private static ApiService build(Context app, String baseUrl) {
        OkHttpClient http = new OkHttpClient.Builder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(15, TimeUnit.SECONDS)
                .writeTimeout(15, TimeUnit.SECONDS)
                .addInterceptor(chain -> addToken(app, chain))
                .build();
        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(http)
                .addConverterFactory(GsonConverterFactory.create())
                .build();
        return retrofit.create(ApiService.class);
    }

    // Runs before every request: if someone is logged in, adds their JWT token so the API knows who is calling (R2).
    // Reference: OkHttp Interceptors https://square.github.io/okhttp/features/interceptors/
    private static Response addToken(Context app, Interceptor.Chain chain) throws IOException {
        Request request = chain.request();
        Session session = SunShareDbHelper.get(app).getSession();
        if (session != null && session.token != null) {
            request = request.newBuilder()
                    .header("Authorization", "Bearer " + session.token)
                    .build();
        }
        return chain.proceed(request);
    }
}
