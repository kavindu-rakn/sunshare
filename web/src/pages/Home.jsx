/*
 * ============================================================================
 *  File        : Home.jsx
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Shared foundation (web shell)
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : W1 Home (index) page - the public landing page: hero,
 *                "how it works" in 3 steps, the three roles, a call to action
 *                and a footer with the team and a live server status.
 * ============================================================================
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getHealth } from '../api/healthApi.js';
import StatusBadge from '../components/StatusBadge.jsx';
import SkipLink from '../components/SkipLink.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const STEPS = [
  {
    icon: 'bi-person-plus',
    title: 'Register',
    text: 'Prosumers sign up in the SunShare Android app with their NIC. A Backoffice officer checks and activates the account.',
  },
  {
    icon: 'bi-calendar-check',
    title: 'Reserve',
    text: 'Pick a nearby station on the map and a time slot up to 7 days ahead - to drop off spare energy or to charge up.',
  },
  {
    icon: 'bi-qr-code-scan',
    title: 'Scan',
    text: 'Once staff approve the booking, the app shows a QR code. At the station a Grid Operator scans it to finish the transfer.',
  },
];

const ROLES = [
  {
    icon: 'bi-building-gear',
    title: 'Backoffice',
    where: 'Web',
    text: 'Manages staff accounts and prosumers, activates new sign-ups, registers solar stations and their schedules, and approves bookings.',
  },
  {
    icon: 'bi-lightning-charge',
    title: 'Grid Operator',
    where: 'Web + mobile',
    text: 'Opens time slots, books and approves on behalf of prosumers, and scans QR codes at the station to complete energy transfers.',
  },
  {
    icon: 'bi-house-heart',
    title: 'Prosumer',
    where: 'Mobile',
    text: 'Finds the nearest stations on a map, reserves and manages bookings, and shows a QR code to check in at the station.',
  },
];

const TEAM = [
  { name: 'Ranathunga R A K N', it: 'IT22552860' },
  { name: 'Gimhan T P K', it: 'IT22266996' },
  { name: 'Malkith G W L', it: 'IT22630834' },
  { name: 'Chamara R M L K', it: 'IT22076816' },
];

// Scrolls to a section of this page. (HashRouter uses "#" for page addresses, so we can't use #anchors.)
function scrollToSection(id) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const section = document.getElementById(id);
  if (section) {
    section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }
}

// The landing page. Logged-in staff see "Open dashboard" instead of "Staff login".
export default function Home() {
  const { user } = useAuth();
  const [serverStatus, setServerStatus] = useState('checking');
  const loginLink = user ? '/dashboard' : '/login';
  const loginText = user ? 'Open dashboard' : 'Staff login';

  // Once, when the page opens: ask GET /api/health whether the server and database are online.
  useEffect(() => {
    getHealth()
      .then((health) => setServerStatus(health.database === 'connected' ? 'online' : 'offline'))
      .catch(() => setServerStatus('offline'));
  }, []);

  return (
    <>
      <SkipLink />
      <header className="home-hero">
        <nav className="container d-flex align-items-center justify-content-between py-3" aria-label="Site">
          <span className="fs-4 fw-bold text-white">
            <i className="bi bi-sun-fill text-warning me-2" aria-hidden="true"></i>SunShare
          </span>
          <div className="d-flex align-items-center gap-2">
            <button type="button" className="btn btn-link text-white text-decoration-none d-none d-sm-inline" onClick={() => scrollToSection('how')}>
              How it works
            </button>
            <Link to={loginLink} className="btn btn-accent">{loginText}</Link>
          </div>
        </nav>

        <div className="container py-5">
          <div className="row align-items-center g-5 py-lg-4">
            <div className="col-lg-6">
              <span className="badge rounded-pill text-bg-light mb-3 px-3 py-2">
                <i className="bi bi-lightning-charge-fill text-warning me-1" aria-hidden="true"></i>
                Smart solar microgrid trading
              </span>
              <h1 className="mb-3">Trade your sunshine.</h1>
              <p className="lead mb-4">
                SunShare connects homes with rooftop solar panels to neighbourhood microgrid stations.
                Book a time slot, drop off your spare energy or charge up - and check in with a QR code.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <Link to={loginLink} className="btn btn-accent btn-lg">{loginText}</Link>
                <button type="button" className="btn btn-outline-light btn-lg" onClick={() => scrollToSection('how')}>
                  How it works
                </button>
              </div>
              <p className="small mt-4 mb-0">
                <i className="bi bi-phone me-1" aria-hidden="true"></i>
                Prosumers use the SunShare Android app.
              </p>
            </div>

            <div className="col-lg-6">
              <div className="position-relative mx-auto" style={{ maxWidth: '26rem' }}>
                <div className="hero-sun position-absolute top-0 end-0" style={{ transform: 'translate(25%, -35%)' }} aria-hidden="true"></div>
                <div className="card hero-card p-4 position-relative">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <div className="small text-secondary">Your next booking</div>
                      <div className="fw-bold fs-5 text-dark">Malabe Solar Hub</div>
                    </div>
                    <StatusBadge status="Approved" />
                  </div>
                  <div className="text-secondary small mt-1">Tue 11:00 - 13:00 · 12.5 kWh · Sell</div>
                  <hr />
                  <div className="d-flex align-items-center gap-3">
                    <i className="bi bi-qr-code display-4 text-dark" aria-hidden="true"></i>
                    <p className="small text-secondary mb-0">
                      Show this QR code at the station. The operator scans it and finishes your energy transfer.
                    </p>
                  </div>
                </div>
                <div className="card hero-card p-3 mt-3 ms-auto position-relative" style={{ maxWidth: '17rem' }}>
                  <div className="d-flex align-items-center gap-3">
                    <span className="feature-icon"><i className="bi bi-geo-alt-fill" aria-hidden="true"></i></span>
                    <div>
                      <div className="fw-semibold text-dark">4 stations nearby</div>
                      <div className="small text-secondary">Nearest: 0.4 km away</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main id="content" tabIndex={-1}>
        <section id="how" className="container py-5" aria-labelledby="how-title">
          <div className="text-center mb-5">
            <h2 id="how-title" className="display-6 fw-bold">How it works</h2>
            <p className="text-secondary">Three simple steps from rooftop to grid.</p>
          </div>
          <ol className="row g-4 list-unstyled">
            {STEPS.map((step, index) => (
              <li key={step.title} className="col-md-4">
                <div className="card h-100 p-4">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <span className="step-number">{index + 1}</span>
                    <i className={`bi ${step.icon} fs-3 text-primary`} aria-hidden="true"></i>
                  </div>
                  <h3 className="h5">{step.title}</h3>
                  <p className="text-secondary mb-0">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-white py-5" aria-labelledby="roles-title">
          <div className="container">
            <div className="text-center mb-5">
              <h2 id="roles-title" className="display-6 fw-bold">One system, three roles</h2>
              <p className="text-secondary">Everyone sees exactly the tools they need.</p>
            </div>
            <div className="row g-4">
              {ROLES.map((role) => (
                <div key={role.title} className="col-md-4">
                  <div className="card h-100 p-4">
                    <span className="feature-icon mb-3"><i className={`bi ${role.icon}`} aria-hidden="true"></i></span>
                    <h3 className="h5 mb-1">{role.title}</h3>
                    <span className="badge rounded-pill role-where align-self-start mb-3">{role.where}</span>
                    <p className="text-secondary mb-0">{role.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="home-cta py-5" aria-labelledby="cta-title">
          <div className="container d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div>
              <h2 id="cta-title" className="h3 mb-1">Keep the microgrid running smoothly</h2>
              <p className="mb-0">Stations, slots, prosumers and bookings - all in one place for staff.</p>
            </div>
            <Link to={loginLink} className="btn btn-accent btn-lg">{loginText}</Link>
          </div>
        </section>
      </main>

      <footer className="home-footer py-5">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-5">
              <div className="fs-5 fw-bold text-white mb-2">
                <i className="bi bi-sun-fill text-warning me-2" aria-hidden="true"></i>SunShare
              </div>
              <p className="mb-2">Smart Solar Microgrid Trading System.</p>
              <p className="small mb-0">SE4040 Enterprise Application Development · Assignment 1 · SLIIT 2026</p>
            </div>
            <div className="col-md-4">
              <h2 className="h6 text-white">Team</h2>
              <ul className="list-unstyled small mb-0">
                {TEAM.map((member) => (
                  <li key={member.it}>{member.name} · {member.it}</li>
                ))}
              </ul>
            </div>
            <div className="col-md-3">
              <h2 className="h6 text-white">System status</h2>
              <p className="small mb-0" role="status">
                <i
                  className={`bi bi-circle-fill me-2 ${serverStatus === 'online' ? 'text-success' : serverStatus === 'offline' ? 'text-danger' : 'text-secondary'}`}
                  aria-hidden="true"
                ></i>
                {serverStatus === 'online' && 'Server and database online'}
                {serverStatus === 'offline' && 'Server offline'}
                {serverStatus === 'checking' && 'Checking server...'}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
