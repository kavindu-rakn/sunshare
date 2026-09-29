/*
 * ============================================================================
 *  File        : ApiService.java
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (Android shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Every API endpoint the Android screens (M1-M11 in
 *                docs/05-SCREENS.md) call, one line each. Retrofit writes
 *                the networking code from these annotations. Backoffice-only
 *                endpoints are left out: the web app is used for those.
 * ============================================================================
 */
package com.sunshare.app.api;

import com.sunshare.app.api.models.CreateReservationRequest;
import com.sunshare.app.api.models.HealthResponse;
import com.sunshare.app.api.models.LoginRequest;
import com.sunshare.app.api.models.LoginResponse;
import com.sunshare.app.api.models.MessageResponse;
import com.sunshare.app.api.models.ProsumerDashboardResponse;
import com.sunshare.app.api.models.RegisterRequest;
import com.sunshare.app.api.models.ReservationResponse;
import com.sunshare.app.api.models.SlotResponse;
import com.sunshare.app.api.models.StaffDashboardResponse;
import com.sunshare.app.api.models.StationResponse;
import com.sunshare.app.api.models.UpdateProfileRequest;
import com.sunshare.app.api.models.UpdateReservationRequest;
import com.sunshare.app.api.models.UserResponse;
import com.sunshare.app.api.models.VerifyQrRequest;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.PATCH;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Path;
import retrofit2.http.Query;

// A Retrofit interface has no method bodies: each line maps one Java method to one HTTP call.
public interface ApiService {

    // ----- Health (shared) -----

    // GET /api/health - is the API up and connected to MongoDB?
    @GET("api/health")
    Call<HealthResponse> health();

    // ----- Auth + profile (Part A) -----

    // POST /api/auth/login - NIC + password -> token and role (R3, R4).
    @POST("api/auth/login")
    Call<LoginResponse> login(@Body LoginRequest body);

    // POST /api/auth/register - a new prosumer account, status Pending (R1, R3).
    @POST("api/auth/register")
    Call<UserResponse> register(@Body RegisterRequest body);

    // GET /api/profile - the logged-in user's own details (R16).
    @GET("api/profile")
    Call<UserResponse> getProfile();

    // PUT /api/profile - save the prosumer's own details (R16).
    @PUT("api/profile")
    Call<UserResponse> updateProfile(@Body UpdateProfileRequest body);

    // PATCH /api/profile/deactivate - the prosumer closes their own account (R5).
    @PATCH("api/profile/deactivate")
    Call<MessageResponse> deactivateProfile();

    // ----- Stations + slots (Part B) -----

    // GET /api/stations?activeOnly= - stations for the booking dropdown (null = leave the filter out).
    @GET("api/stations")
    Call<List<StationResponse>> getStations(@Query("activeOnly") Boolean activeOnly);

    // GET /api/stations/nearby?lat=&lng=&radiusKm= - active stations near the phone, nearest first (R18).
    @GET("api/stations/nearby")
    Call<List<StationResponse>> getNearbyStations(@Query("lat") double lat, @Query("lng") double lng,
                                                  @Query("radiusKm") Double radiusKm);

    // GET /api/stations/{id} - one station.
    @GET("api/stations/{id}")
    Call<StationResponse> getStation(@Path("id") String id);

    // GET /api/slots/available?stationId= - bookable slots in the next 7 days with a free place (R9, R11).
    @GET("api/slots/available")
    Call<List<SlotResponse>> getAvailableSlots(@Query("stationId") String stationId);

    // GET /api/slots/{id} - one slot.
    @GET("api/slots/{id}")
    Call<SlotResponse> getSlot(@Path("id") String id);

    // ----- Reservations: actions (Part C) -----

    // POST /api/reservations - book a slot (the API checks R9, R11, R12, R13, R16, R17).
    @POST("api/reservations")
    Call<ReservationResponse> createReservation(@Body CreateReservationRequest body);

    // PUT /api/reservations/{id} - change a booking (R10: at least 12 hours before).
    @PUT("api/reservations/{id}")
    Call<ReservationResponse> updateReservation(@Path("id") String id, @Body UpdateReservationRequest body);

    // PATCH /api/reservations/{id}/cancel - cancel a booking (R10, R12, R15).
    @PATCH("api/reservations/{id}/cancel")
    Call<ReservationResponse> cancelReservation(@Path("id") String id);

    // ----- Reservations: views, QR and dashboards (Part D) -----

    // GET /api/reservations?view=&search= - the prosumer's bookings (view = current, pending or history).
    @GET("api/reservations")
    Call<List<ReservationResponse>> getReservations(@Query("view") String view, @Query("search") String search);

    // GET /api/reservations/{id} - one booking, with qrData when Approved.
    @GET("api/reservations/{id}")
    Call<ReservationResponse> getReservation(@Path("id") String id);

    // POST /api/reservations/verify-qr - the operator checks a scanned QR with the server (R14).
    @POST("api/reservations/verify-qr")
    Call<ReservationResponse> verifyQr(@Body VerifyQrRequest body);

    // PATCH /api/reservations/{id}/complete - the operator finalizes the energy transfer (R14).
    @PATCH("api/reservations/{id}/complete")
    Call<ReservationResponse> completeReservation(@Path("id") String id, @Body VerifyQrRequest body);

    // GET /api/dashboard/summary - Grid Operator home counts.
    @GET("api/dashboard/summary")
    Call<StaffDashboardResponse> getStaffDashboard();

    // GET /api/dashboard/prosumer - Prosumer home counts and next booking.
    @GET("api/dashboard/prosumer")
    Call<ProsumerDashboardResponse> getProsumerDashboard();
}
