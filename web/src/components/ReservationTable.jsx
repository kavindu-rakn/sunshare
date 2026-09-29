/*
 * ============================================================================
 *  File        : ReservationTable.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : D - Dashboards & QR
 *  Author      : Chamara R M L K (IT22076816)
 *  Created     : 2026-09-29
 *  Description : Table of bookings shared by the Dashboard (W3) and the
 *                Reservations page (W13). Pages can add their own buttons per
 *                row with renderActions (e.g. Approve, Edit, Cancel).
 * ============================================================================
 */
import StatusBadge from './StatusBadge.jsx';
import { formatDate, formatTime } from '../utils/format.js';

// reservations = rows from the API; renderActions(reservation) = optional buttons for the last column.
export default function ReservationTable({ caption, reservations, renderActions }) {
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">When</th>
            <th scope="col">Station</th>
            <th scope="col">Prosumer</th>
            <th scope="col">Energy</th>
            <th scope="col">Status</th>
            {renderActions && <th scope="col" className="text-end">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {reservations.map((reservation) => (
            <tr key={reservation.id}>
              <td className="text-nowrap">
                <div className="fw-semibold">{formatDate(reservation.startTime)}</div>
                <div className="small text-secondary">{formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}</div>
              </td>
              <td>
                <div>{reservation.stationName}</div>
                <div className="small text-secondary font-monospace" title="Reservation id">{reservation.id}</div>
              </td>
              <td>
                <div>{reservation.prosumerName}</div>
                <div className="small text-secondary">{reservation.prosumerNic}</div>
              </td>
              <td className="text-nowrap">
                <i
                  className={`bi ${reservation.type === 'Sell' ? 'bi-box-arrow-up text-success' : 'bi-box-arrow-in-down text-primary'} me-1`}
                  aria-hidden="true"
                ></i>
                {reservation.energyKwh} kWh
                <div className="small text-secondary">{reservation.type === 'Sell' ? 'Sell (drop off)' : 'Buy (charge)'}</div>
              </td>
              <td><StatusBadge status={reservation.status} /></td>
              {renderActions && <td className="text-end text-nowrap">{renderActions(reservation)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
