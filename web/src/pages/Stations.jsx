/*
 * ============================================================================
 *  File        : Stations.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Nodes, Slots & Map
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : W9 Stations - every solar station with its location, size,
 *                schedule, status and active bookings. Backoffice can edit,
 *                deactivate / activate and delete; everyone can open its slots.
 * ============================================================================
 */
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { activateStation, deactivateStation, deleteStation, listStations } from '../api/stationsApi.js';
import AlertMessage from '../components/AlertMessage.jsx';
import ConfirmButton from '../components/ConfirmButton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { googleMapsUrl } from '../utils/format.js';

// Stations page for Backoffice (full control) and Grid Operators (view + slots).
export default function Stations() {
  const { user } = useAuth();
  const isBackoffice = user.role === 'Backoffice';
  const location = useLocation();
  const [stations, setStations] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message ?? '');

  // Loads the stations (again after every action). "cancelled" ignores late answers.
  useEffect(() => {
    let cancelled = false;
    listStations()
      .then((list) => {
        if (!cancelled) setStations(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Runs one station action (deactivate / activate / delete) and shows the API's answer.
  // The API decides if it is allowed: R6 (no deactivating with active bookings), R7 (no deleting with history).
  async function runAction(station, action, successText) {
    setBusyId(station.id);
    setError('');
    try {
      await action(station.id);
      setSuccess(successText);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setSuccess('');
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  return (
    <>
      <PageHeader title="Stations" subtitle="Solar microgrid stations, their battery places and opening hours.">
        {isBackoffice && (
          <Link to="/stations/new" className="btn btn-primary">
            <i className="bi bi-plus-lg me-2" aria-hidden="true"></i>Add station
          </Link>
        )}
      </PageHeader>

      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />
      <AlertMessage message={error} onClose={() => setError('')} />

      <div className="card">
        {loading && <div className="px-3"><LoadingSpinner text="Loading stations..." /></div>}
        {!loading && stations.length === 0 && (
          <EmptyState icon="bi-geo-alt" title="No stations yet" text={isBackoffice ? 'Add the first solar station.' : 'Backoffice has not added any stations yet.'} />
        )}
        {!loading && stations.length > 0 && (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <caption className="visually-hidden">Solar stations</caption>
              <thead>
                <tr>
                  <th scope="col">Station</th>
                  <th scope="col">Location</th>
                  <th scope="col">Capacity</th>
                  <th scope="col">Battery slots</th>
                  <th scope="col">Hours</th>
                  <th scope="col">Active bookings</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stations.map((station) => (
                  <tr key={station.id}>
                    <td>
                      <div className="fw-semibold">{station.name}</div>
                      <div className="small text-secondary">{station.address}</div>
                    </td>
                    <td className="small text-nowrap">
                      {station.latitude}, {station.longitude}
                      <div>
                        <a href={googleMapsUrl(station.latitude, station.longitude)} target="_blank" rel="noopener noreferrer">
                          <i className="bi bi-map me-1" aria-hidden="true"></i>Map<span className="visually-hidden"> of {station.name} (opens in a new tab)</span>
                        </a>
                      </div>
                    </td>
                    <td className="text-nowrap">{station.capacityKw} kW</td>
                    <td>{station.batterySlots}</td>
                    <td className="text-nowrap">{station.openTime} - {station.closeTime}</td>
                    <td>{station.activeReservationCount}</td>
                    <td><StatusBadge status={station.isActive ? 'Active' : 'Deactivated'} /></td>
                    <td className="text-end text-nowrap">
                      <Link to={`/stations/${station.id}/slots`} className="btn btn-sm btn-outline-primary me-1">
                        <i className="bi bi-clock me-1" aria-hidden="true"></i>Slots<span className="visually-hidden"> of {station.name}</span>
                      </Link>
                      {isBackoffice && (
                        <>
                          <Link to={`/stations/${station.id}/edit`} className="btn btn-sm btn-outline-secondary me-1">
                            Edit<span className="visually-hidden"> {station.name}</span>
                          </Link>
                          {station.isActive ? (
                            <ConfirmButton
                              message={`Deactivate ${station.name}? It will disappear from the map and can't be booked.`}
                              onConfirm={() => runAction(station, deactivateStation, `${station.name} was deactivated.`)}
                              className="btn btn-sm btn-outline-warning me-1"
                              disabled={busyId === station.id}
                            >
                              Deactivate<span className="visually-hidden"> {station.name}</span>
                            </ConfirmButton>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success me-1"
                              disabled={busyId === station.id}
                              onClick={() => runAction(station, activateStation, `${station.name} is active again.`)}
                            >
                              Activate<span className="visually-hidden"> {station.name}</span>
                            </button>
                          )}
                          <ConfirmButton
                            message={`Delete ${station.name} and all its slots? This can't be undone.`}
                            onConfirm={() => runAction(station, deleteStation, `${station.name} was deleted.`)}
                            className="btn btn-sm btn-outline-danger"
                            disabled={busyId === station.id}
                          >
                            <i className="bi bi-trash" aria-hidden="true"></i><span className="visually-hidden">Delete {station.name}</span>
                          </ConfirmButton>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
