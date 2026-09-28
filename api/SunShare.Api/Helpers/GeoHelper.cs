/*
 * ============================================================================
 *  File        : GeoHelper.cs
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Nodes, Slots & Map
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-28
 *  Description : Distance between two GPS points (Haversine formula), used
 *                by the "nearby stations" search (rule R18).
 * ============================================================================
 */

namespace SunShare.Api.Helpers;

// The Earth is (almost) a ball, so the distance between two map points is measured along its
// curved surface, not with a straight ruler line. The Haversine formula does exactly that.
public static class GeoHelper
{
    // Average radius of the Earth in kilometres.
    private const double EarthRadiusKm = 6371.0;

    // Reference: C. Veness, "Calculate distance, bearing and more between Latitude/Longitude points"
    // https://www.movable-type.co.uk/scripts/latlong.html  (Haversine formula)
    // Returns the distance in kilometres between point 1 and point 2 (latitudes/longitudes in degrees).
    public static double DistanceKm(double lat1, double lng1, double lat2, double lng2)
    {
        double dLat = ToRadians(lat2 - lat1);
        double dLng = ToRadians(lng2 - lng1);

        // a = the square of half the straight-line (chord) distance between the points, on a ball of radius 1.
        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                 + Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        // c = the angle between the points, seen from the centre of the Earth (in radians).
        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return EarthRadiusKm * c;
    }

    // Converts degrees to radians (C#'s Math.Sin and Math.Cos work in radians).
    private static double ToRadians(double degrees)
    {
        return degrees * Math.PI / 180.0;
    }
}
