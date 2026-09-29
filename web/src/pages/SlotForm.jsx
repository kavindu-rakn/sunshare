/*
 * ============================================================================
 *  File        : SlotForm.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Nodes, Slots & Map
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : W12 Slot form - add a slot to a station (/slots/new?stationId=)
 *                or edit one (/slots/:id/edit): start, end, number of places and
 *                open/closed. Times are typed in local time and sent in UTC;
 *                the API checks every rule (R8).
 * ============================================================================
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createSlot, getSlot, updateSlot } from '../api/slotsApi.js';
import { getStation } from '../api/stationsApi.js';
import AlertMessage from '../components/AlertMessage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { fromDateTimeInput, toDateTimeInput } from '../utils/format.js';

// Suggested times for a new slot: tomorrow 08:00 - 10:00 local time.
function defaultTimes() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(8, 0, 0, 0);
  const end = new Date(start);
  end.setHours(10);
  return { startTime: toDateTimeInput(start), endTime: toDateTimeInput(end) };
}

// Add or edit one slot.
export default function SlotForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [stationId, setStationId] = useState(searchParams.get('stationId') ?? '');
  const [station, setStation] = useState(null);
  const [form, setForm] = useState({ ...defaultTimes(), totalSlots: '4', isActive: true });
  const [bookedSlots, setBookedSlots] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Loads what the form needs: for an edit the slot (then its station), for a new slot just the station.
  useEffect(() => {
    let cancelled = false;
    const loadSlot = isEdit
      ? getSlot(id).then((slot) => {
          if (!cancelled) {
            setStationId(slot.stationId);
            setBookedSlots(slot.bookedSlots);
            setForm({
              startTime: toDateTimeInput(slot.startTime),
              endTime: toDateTimeInput(slot.endTime),
              totalSlots: String(slot.totalSlots),
              isActive: slot.isActive,
            });
          }
          return slot.stationId;
        })
      : Promise.resolve(searchParams.get('stationId'));

    loadSlot
      .then((theStationId) => getStation(theStationId))
      .then((stationData) => {
        if (!cancelled) setStation(stationData);
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
  }, [isEdit, id, searchParams]);

  // Copies what the user typed into the form state (checkbox uses "checked", others "value").
  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
  }

  // Saves the slot (times converted to UTC). The API checks R8: start in the future, end after start,
  // 1..battery slots places, not below the booked places, and no time change once booked.
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    const times = { startTime: fromDateTimeInput(form.startTime), endTime: fromDateTimeInput(form.endTime) };
    try {
      if (isEdit) {
        await updateSlot(id, { ...times, totalSlots: Number(form.totalSlots), isActive: form.isActive });
      } else {
        await createSlot({ ...times, stationId, totalSlots: Number(form.totalSlots) });
      }
      navigate(`/stations/${stationId}/slots`, { state: { message: isEdit ? 'The slot was saved.' : 'The slot was added.' } });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit slot' : 'New slot'}
        subtitle={station ? `${station.name} · ${station.batterySlots} battery slots · open ${station.openTime} - ${station.closeTime}` : ''}
      />

      <AlertMessage message={error} onClose={() => setError('')} />

      {loading ? (
        <LoadingSpinner text="Loading..." />
      ) : (
        <form className="card p-4" style={{ maxWidth: '40rem' }} onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-sm-6">
              <label htmlFor="startTime" className="form-label">Starts</label>
              <input id="startTime" name="startTime" type="datetime-local" className="form-control" value={form.startTime} onChange={handleChange} required />
            </div>
            <div className="col-sm-6">
              <label htmlFor="endTime" className="form-label">Ends</label>
              <input id="endTime" name="endTime" type="datetime-local" className="form-control" value={form.endTime} onChange={handleChange} required />
            </div>
            <div className="col-sm-6">
              <label htmlFor="totalSlots" className="form-label">Places in this slot</label>
              <input id="totalSlots" name="totalSlots" type="number" step="1" className="form-control" value={form.totalSlots} onChange={handleChange} required />
              <div className="form-text">
                {station && `Up to ${station.batterySlots} (the station's battery slots).`}
                {isEdit && bookedSlots > 0 && ` ${bookedSlots} already booked - the time can't change and places can't go below that.`}
              </div>
            </div>
            {isEdit && (
              <div className="col-sm-6 d-flex align-items-center">
                <div className="form-check form-switch mt-sm-4">
                  <input id="isActive" name="isActive" type="checkbox" role="switch" className="form-check-input" checked={form.isActive} onChange={handleChange} />
                  <label htmlFor="isActive" className="form-check-label">Open for booking</label>
                </div>
              </div>
            )}
          </div>

          <div className="d-flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary" disabled={saving || !stationId}>
              {saving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
              {isEdit ? 'Save changes' : 'Add slot'}
            </button>
            <Link to={stationId ? `/stations/${stationId}/slots` : '/stations'} className="btn btn-outline-secondary">Cancel</Link>
          </div>
        </form>
      )}
    </>
  );
}
