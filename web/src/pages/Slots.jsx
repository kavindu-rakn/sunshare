/*
 * ============================================================================
 *  File        : Slots.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Nodes, Slots & Map
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : W11 Slots - one station's booking windows for the next 14
 *                days: time, places (total / booked / free), open or closed,
 *                with Add, Edit and Delete for Backoffice and Grid Operators.
 * ============================================================================
 */
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { deleteSlot, listStationSlots } from '../api/slotsApi.js';
import { getStation } from '../api/stationsApi.js';
import AlertMessage from '../components/AlertMessage.jsx';
import ConfirmButton from '../components/ConfirmButton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatDate, formatTime } from '../utils/format.js';

// Slots of the station in the address (/stations/:id/slots).
export default function Slots() {
  const { id } = useParams();
  const location = useLocation();
  const [station, setStation] = useState(null);
  const [slots, setSlots] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message ?? '');

  // Loads the station and its slots together (again after a delete). "cancelled" ignores late answers.
  useEffect(() => {
    let cancelled = false;
    Promise.all([getStation(id), listStationSlots(id)])
      .then(([stationData, slotList]) => {
        if (!cancelled) {
          setStation(stationData);
          setSlots(slotList);
        }
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
  }, [id, reloadKey]);

  // Deletes one slot. The API refuses while it has active reservations (R8) and its message is shown.
  async function handleDelete(slot) {
    setBusyId(slot.id);
    setError('');
    try {
      await deleteSlot(slot.id);
      setSuccess('The slot was deleted.');
      setReloadKey((key) => key + 1);
    } catch (err) {
      setSuccess('');
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  const title = station ? `Slots · ${station.name}` : 'Slots';
  const subtitle = station
    ? `Booking windows for the next 14 days. This station has ${station.batterySlots} battery slots and opens ${station.openTime} - ${station.closeTime}.`
    : '';

  return (
    <>
      <PageHeader title={title} subtitle={subtitle}>
        <Link to="/stations" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2" aria-hidden="true"></i>Stations
        </Link>
        {station && (
          <Link to={`/slots/new?stationId=${id}`} className="btn btn-primary">
            <i className="bi bi-plus-lg me-2" aria-hidden="true"></i>Add slot
          </Link>
        )}
      </PageHeader>

      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />
      <AlertMessage message={error} onClose={() => setError('')} />
      {station && !station.isActive && (
        <AlertMessage type="info" message="This station is deactivated, so it can't get new slots and its slots can't be booked." />
      )}

      <div className="card">
        {loading && <div className="px-3"><LoadingSpinner text="Loading slots..." /></div>}
        {!loading && slots.length === 0 && (
          <EmptyState icon="bi-clock" title="No slots in the next 14 days" text="Add a time window so prosumers can book it." />
        )}
        {!loading && slots.length > 0 && (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <caption className="visually-hidden">Slots at {station?.name}</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Time</th>
                  <th scope="col">Total</th>
                  <th scope="col">Booked</th>
                  <th scope="col">Free</th>
                  <th scope="col">Booking</th>
                  <th scope="col" className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.id}>
                    <td className="text-nowrap">{formatDate(slot.startTime)}</td>
                    <td className="text-nowrap">{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</td>
                    <td>{slot.totalSlots}</td>
                    <td>{slot.bookedSlots}</td>
                    <td className={slot.availableSlots === 0 ? 'text-danger fw-semibold' : ''}>{slot.availableSlots}</td>
                    <td><StatusBadge status={slot.isActive ? 'Open' : 'Closed'} /></td>
                    <td className="text-end text-nowrap">
                      <Link to={`/slots/${slot.id}/edit`} className="btn btn-sm btn-outline-primary me-1">
                        Edit<span className="visually-hidden"> slot {formatDate(slot.startTime)} {formatTime(slot.startTime)}</span>
                      </Link>
                      <ConfirmButton
                        message={`Delete the ${formatDate(slot.startTime)} ${formatTime(slot.startTime)} slot?`}
                        onConfirm={() => handleDelete(slot)}
                        className="btn btn-sm btn-outline-danger"
                        disabled={busyId === slot.id}
                      >
                        <i className="bi bi-trash" aria-hidden="true"></i>
                        <span className="visually-hidden">Delete slot {formatDate(slot.startTime)} {formatTime(slot.startTime)}</span>
                      </ConfirmButton>
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
