/*
 * ============================================================================
 *  File        : StationForm.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Nodes, Slots & Map
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : W10 Station form - create or edit a station (name, address,
 *                GPS position with an "Open in Google Maps" check, capacity,
 *                battery slots, opening hours). The API checks every value.
 * ============================================================================
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createStation, getStation, updateStation } from '../api/stationsApi.js';
import AlertMessage from '../components/AlertMessage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { googleMapsUrl } from '../utils/format.js';

const EMPTY_FORM = { name: '', address: '', latitude: '', longitude: '', capacityKw: '', batterySlots: '', openTime: '06:00', closeTime: '18:00' };

// Backoffice form for one station. With an :id in the address it edits, otherwise it creates.
export default function StationForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // When editing: load the station once and fill the form (numbers become text for the inputs).
  useEffect(() => {
    if (!isEdit) {
      return;
    }
    getStation(id)
      .then((station) => setForm({
        name: station.name,
        address: station.address,
        latitude: String(station.latitude),
        longitude: String(station.longitude),
        capacityKw: String(station.capacityKw),
        batterySlots: String(station.batterySlots),
        openTime: station.openTime,
        closeTime: station.closeTime,
      }))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isEdit, id]);

  // Copies what the user typed into the form state (one handler for every field, by its "name").
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  // Saves the station: POST for new, PUT for edit. Number boxes are sent as numbers.
  // The API checks the ranges (GPS, capacity > 0, at least 1 battery slot, open before close).
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    const data = {
      ...form,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      capacityKw: Number(form.capacityKw),
      batterySlots: Number(form.batterySlots),
    };
    try {
      const saved = isEdit ? await updateStation(id, data) : await createStation(data);
      navigate('/stations', { state: { message: isEdit ? `${saved.name} was saved.` : `${saved.name} was added.` } });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const hasPosition = form.latitude !== '' && form.longitude !== '';

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit station' : 'New station'}
        subtitle="Tip: find the place in Google Maps, right-click it and copy the two numbers (latitude, longitude)."
      />

      <AlertMessage message={error} onClose={() => setError('')} />

      {loading ? (
        <LoadingSpinner text="Loading station..." />
      ) : (
        <form className="card p-4" style={{ maxWidth: '48rem' }} onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="name" className="form-label">Station name</label>
              <input id="name" name="name" className="form-control" value={form.name} onChange={handleChange} required />
            </div>
            <div className="col-md-6">
              <label htmlFor="address" className="form-label">Address</label>
              <input id="address" name="address" className="form-control" value={form.address} onChange={handleChange} required />
            </div>
            <div className="col-sm-6 col-md-4">
              <label htmlFor="latitude" className="form-label">Latitude</label>
              <input id="latitude" name="latitude" type="number" step="any" className="form-control" value={form.latitude} onChange={handleChange} placeholder="6.9147" required />
            </div>
            <div className="col-sm-6 col-md-4">
              <label htmlFor="longitude" className="form-label">Longitude</label>
              <input id="longitude" name="longitude" type="number" step="any" className="form-control" value={form.longitude} onChange={handleChange} placeholder="79.9730" required />
            </div>
            <div className="col-md-4 d-flex align-items-end">
              {hasPosition ? (
                <a className="btn btn-outline-primary w-100" href={googleMapsUrl(form.latitude, form.longitude)} target="_blank" rel="noopener noreferrer">
                  <i className="bi bi-map me-2" aria-hidden="true"></i>Open in Google Maps
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              ) : (
                <span className="form-text">Enter latitude and longitude to check the pin on Google Maps.</span>
              )}
            </div>
            <div className="col-sm-6 col-md-3">
              <label htmlFor="capacityKw" className="form-label">Capacity (kW)</label>
              <input id="capacityKw" name="capacityKw" type="number" step="any" className="form-control" value={form.capacityKw} onChange={handleChange} required />
            </div>
            <div className="col-sm-6 col-md-3">
              <label htmlFor="batterySlots" className="form-label">Battery slots</label>
              <input id="batterySlots" name="batterySlots" type="number" step="1" className="form-control" value={form.batterySlots} onChange={handleChange} required />
            </div>
            <div className="col-sm-6 col-md-3">
              <label htmlFor="openTime" className="form-label">Opens at</label>
              <input id="openTime" name="openTime" type="time" className="form-control" value={form.openTime} onChange={handleChange} required />
            </div>
            <div className="col-sm-6 col-md-3">
              <label htmlFor="closeTime" className="form-label">Closes at</label>
              <input id="closeTime" name="closeTime" type="time" className="form-control" value={form.closeTime} onChange={handleChange} required />
            </div>
          </div>

          <div className="d-flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
              {isEdit ? 'Save changes' : 'Add station'}
            </button>
            <Link to="/stations" className="btn btn-outline-secondary">Cancel</Link>
          </div>
        </form>
      )}
    </>
  );
}
