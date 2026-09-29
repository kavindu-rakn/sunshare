/*
 * ============================================================================
 *  File        : ReservationForm.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : C - Reservations
 *  Author      : Malkith G W L (IT22630834)
 *  Created     : 2026-09-29
 *  Description : W14 Reservation form - staff book on behalf of a prosumer, or
 *                edit a booking: prosumer -> station -> bookable slot -> kWh ->
 *                Sell/Buy. The API checks every rule (R9-R13, R17) and its
 *                message (e.g. the 7-day or 12-hour rule) is shown here.
 * ============================================================================
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createReservation, getReservation, updateReservation } from '../api/reservationsApi.js';
import { listAvailableSlots } from '../api/slotsApi.js';
import { listStations } from '../api/stationsApi.js';
import { listUsers } from '../api/usersApi.js';
import AlertMessage from '../components/AlertMessage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatDateTime, formatTime } from '../utils/format.js';

// Text shown for one slot in the drop-down, e.g. "Wed, 30 Sep, 08:00 - 10:00 · 4 free".
function slotLabel(slot) {
  return `${formatDateTime(slot.startTime)} - ${formatTime(slot.endTime)} · ${slot.availableSlots} free`;
}

// New booking (/reservations/new) or edit (/reservations/:id/edit).
export default function ReservationForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [prosumers, setProsumers] = useState([]);
  const [stations, setStations] = useState([]);
  const [slots, setSlots] = useState([]);
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState({ prosumerNic: '', stationId: '', slotId: '', energyKwh: '', type: 'Sell' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Once: load the active stations, plus either the active prosumers (new) or the booking (edit).
  useEffect(() => {
    let cancelled = false;
    const second = isEdit ? getReservation(id) : listUsers({ role: 'Prosumer', status: 'Active' });
    Promise.all([listStations(true), second])
      .then(([stationList, data]) => {
        if (cancelled) return;
        setStations(stationList);
        if (isEdit) {
          setCurrent(data);
          setForm({ prosumerNic: data.prosumerNic, stationId: data.stationId, slotId: data.slotId, energyKwh: String(data.energyKwh), type: data.type });
        } else {
          setProsumers(data);
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
  }, [isEdit, id]);

  // Whenever the station changes: load its bookable slots (the API applies R9 and R11).
  useEffect(() => {
    if (!form.stationId) {
      return undefined;
    }
    let cancelled = false;
    listAvailableSlots(form.stationId)
      .then((list) => {
        if (!cancelled) setSlots(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [form.stationId]);

  // Copies what the user picked/typed into the form. A new station clears the chosen slot.
  function handleChange(event) {
    const { name, value } = event.target;
    if (name === 'stationId') {
      setSlots([]);
      setForm((previous) => ({ ...previous, stationId: value, slotId: '' }));
      return;
    }
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  // Saves the booking. The browser only makes sure every box is filled in; the API checks the
  // rules and the page shows its message if something is not allowed.
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    const data = { slotId: form.slotId, energyKwh: Number(form.energyKwh), type: form.type };
    try {
      if (isEdit) {
        const saved = await updateReservation(id, data);
        const backToPending = current.status === 'Approved' && saved.status === 'Pending';
        navigate('/reservations', { state: { message: backToPending ? 'Booking updated. It went back to Pending and needs approval again.' : 'Booking updated.' } });
      } else {
        const saved = await createReservation({ ...data, prosumerNic: form.prosumerNic });
        navigate('/reservations', { state: { message: `Booking created for ${saved.prosumerName} at ${saved.stationName}. It is Pending until approved.` } });
      }
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  // When editing, the booking's own slot stays in the list even if it is now full.
  const showCurrentSlot = isEdit && current && form.stationId === current.stationId && !slots.some((slot) => slot.id === current.slotId);

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit reservation' : 'New reservation'}
        subtitle={isEdit ? 'Change the slot, energy amount or type.' : 'Book a slot on behalf of a prosumer. New bookings start as Pending.'}
      >
        {current && <StatusBadge status={current.status} />}
      </PageHeader>

      <AlertMessage message={error} onClose={() => setError('')} />
      {current && !current.canModify && (
        <AlertMessage type="info" message="This booking can no longer be changed (it is finished, cancelled, or starts in less than 12 hours)." />
      )}

      {loading ? (
        <LoadingSpinner text="Loading..." />
      ) : (
        <form className="card p-4" style={{ maxWidth: '44rem' }} onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-12">
              <label htmlFor="prosumerNic" className="form-label">Prosumer</label>
              {isEdit ? (
                <input id="prosumerNic" className="form-control" value={current ? `${current.prosumerName} (${current.prosumerNic})` : ''} readOnly />
              ) : (
                <select id="prosumerNic" name="prosumerNic" className="form-select" value={form.prosumerNic} onChange={handleChange} required>
                  <option value="">Choose an active prosumer...</option>
                  {prosumers.map((prosumer) => (
                    <option key={prosumer.nic} value={prosumer.nic}>{prosumer.fullName} ({prosumer.nic})</option>
                  ))}
                </select>
              )}
            </div>
            <div className="col-md-6">
              <label htmlFor="stationId" className="form-label">Station</label>
              <select id="stationId" name="stationId" className="form-select" value={form.stationId} onChange={handleChange} required>
                <option value="">Choose a station...</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>{station.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="slotId" className="form-label">Time slot</label>
              <select id="slotId" name="slotId" className="form-select" value={form.slotId} onChange={handleChange} required disabled={!form.stationId}>
                <option value="">{form.stationId ? 'Choose a slot...' : 'Choose a station first'}</option>
                {showCurrentSlot && (
                  <option value={current.slotId}>{formatDateTime(current.startTime)} - {formatTime(current.endTime)} (current)</option>
                )}
                {slots.map((slot) => (
                  <option key={slot.id} value={slot.id}>{slotLabel(slot)}</option>
                ))}
              </select>
              {form.stationId && slots.length === 0 && <div className="form-text">No bookable slots at this station in the next 7 days.</div>}
            </div>
            <div className="col-md-6">
              <label htmlFor="energyKwh" className="form-label">Energy (kWh)</label>
              <input id="energyKwh" name="energyKwh" type="number" step="any" className="form-control" value={form.energyKwh} onChange={handleChange} required />
              <div className="form-text">More than 0 and up to 100 kWh.</div>
            </div>
            <fieldset className="col-md-6">
              <legend className="form-label fs-6 mb-2">Type</legend>
              <div className="form-check">
                <input id="typeSell" name="type" type="radio" value="Sell" className="form-check-input" checked={form.type === 'Sell'} onChange={handleChange} />
                <label htmlFor="typeSell" className="form-check-label">Sell - drop off spare energy</label>
              </div>
              <div className="form-check">
                <input id="typeBuy" name="type" type="radio" value="Buy" className="form-check-input" checked={form.type === 'Buy'} onChange={handleChange} />
                <label htmlFor="typeBuy" className="form-check-label">Buy - charge from the station</label>
              </div>
            </fieldset>
          </div>

          <div className="d-flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
              {isEdit ? 'Save changes' : 'Create booking'}
            </button>
            <Link to="/reservations" className="btn btn-outline-secondary">Cancel</Link>
          </div>
        </form>
      )}
    </>
  );
}
