import React from 'react';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Train,
  Bus,
  Plane,
  Car,
  Calendar,
  Clock,
  MapPin,
  User,
  ShieldCheck,
  IndianRupee,
  Share2
} from 'lucide-react';

export default function TicketModal({ ticket, onClose, onViewDashboard }) {
  if (!ticket) return null;

  const mode = ticket.transport_type || 'Transport';
  const pnr = ticket.booking_reference || `TH-BK-${ticket.booking_id || ticket.id || 'CONFIRMED'}`;
  const details = ticket.booking_details || {};
  const travelDate = ticket.travel_date
    ? new Date(ticket.travel_date).toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Upcoming Travel';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    const textData = `
================================================================================
                    TOURIST HUB AI — OFFICIAL TRAVEL VOUCHER
                    ${mode.toUpperCase()} CONFIRMED RESERVATION
================================================================================
PNR / BOOKING REF:   ${pnr}
TRANSPORT MODE:      ${mode}
SERVICE / OPERATOR:  ${ticket.provider || ticket.title}
SERVICE NUMBER:      ${ticket.service_number || ticket.transport_number || 'N/A'}
VEHICLE / AIRCRAFT:  ${ticket.vehicle_model || ticket.transport_vehicle || 'Standard'}
JOURNEY ROUTE:       ${ticket.from_city || ticket.transport_from || 'Source'} -> ${ticket.to_city || ticket.transport_to || 'Destination'}
TRAVEL DATE:         ${travelDate}
SCHEDULED TIMINGS:   Dep: ${ticket.departure_time || 'N/A'} | Arr: ${ticket.arrival_time || 'N/A'}
DURATION:            ${ticket.duration || 'N/A'}
BOOKING STATUS:      CONFIRMED (PAID)

--------------------------------------------------------------------------------
PASSENGER MANIFEST & SEATS
--------------------------------------------------------------------------------
${
  details.passengers && details.passengers.length > 0
    ? details.passengers
        .map(
          (p, i) =>
            `Passenger ${i + 1}: ${p.name || 'Traveler'} | Age: ${p.age || 'N/A'} | Gender: ${p.gender || 'N/A'} | Seat/Berth: ${p.seat || details.seats?.[i] || 'Allocated'}`
        )
        .join('\n')
    : `Total Travelers: ${ticket.people_count || 1} Person(s)\nSeats: ${(details.seats || []).join(', ') || 'Reserved'}`
}

--------------------------------------------------------------------------------
PICKUP & DROPPING DETAILS
--------------------------------------------------------------------------------
Boarding / Pickup:   ${details.boarding_point || details.pickup_location || ticket.from_city || 'Main Station / Airport'}
Dropping / Drop-off: ${details.dropping_point || details.drop_location || ticket.to_city || 'Destination Terminal'}
${details.driver_name ? `Assigned Chauffeur:  ${details.driver_name} (${details.driver_phone || 'Contact provided on pickup'})\nDriver Rating:       4.9 / 5.0 ★` : ''}

--------------------------------------------------------------------------------
PAYMENT & FARE BREAKDOWN
--------------------------------------------------------------------------------
Total Amount Paid:   ₹${Number(ticket.total_amount || ticket.paid_amount || 0).toLocaleString('en-IN')}
Payment Mode:        ${ticket.payment_method || 'Online / UPI (Demo)'}
Transaction ID:      ${ticket.transaction_id || 'TXN_SETTLED'}
GST & Taxes:         Included
--------------------------------------------------------------------------------
Important Notice:
- Please carry an original Government Photo ID (Aadhaar, Voter ID, Driving License, Passport).
- Reporting time: 45 minutes prior to departure for Trains/Buses, 2 hours for Domestic Flights.
- This reservation is managed under Tourist Hub AI verified travel partners.
================================================================================
`;
    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ticket_${pnr}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
    >
      <div
        className="printable-ticket"
        style={{
          background: '#ffffff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 720,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'fadeIn 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94vh'
        }}
      >
        {/* Top Control Bar (Hidden during print) */}
        <div
          className="no-print"
          style={{
            padding: '12px 20px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                background: '#dcfce7',
                color: '#166534',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <CheckCircle2 size={14} /> Confirmed & Issued
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
              PNR: <strong style={{ color: '#0f172a' }}>{pnr}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handlePrint}
              style={{
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Printer size={15} /> Print Ticket
            </button>
            <button
              onClick={handleDownloadTxt}
              style={{
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Download size={15} /> Save .txt
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                padding: 6,
                cursor: 'pointer',
                borderRadius: 6
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Ticket Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
          {/* Main Card (Styled to look like an official airline/train/bus ticket) */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              border: '2px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              overflow: 'hidden'
            }}
          >
            {/* Header banner depending on mode */}
            <div
              style={{
                background:
                  mode === 'Train'
                    ? 'linear-gradient(135deg, #1e3a8a, #0369a1)'
                    : mode === 'Bus'
                    ? 'linear-gradient(135deg, #b45309, #d97706)'
                    : mode === 'Flight'
                    ? 'linear-gradient(135deg, #0369a1, #0284c7)'
                    : 'linear-gradient(135deg, #15803d, #16a34a)',
                color: '#ffffff',
                padding: '18px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: 10,
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {mode === 'Train' && <Train size={28} />}
                  {mode === 'Bus' && <Bus size={28} />}
                  {mode === 'Flight' && <Plane size={28} />}
                  {mode === 'Private Driver' && <Car size={28} />}
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.9 }}>
                    {mode === 'Train'
                      ? 'Indian Railways Electronic Reservation Slip (ERS)'
                      : mode === 'Bus'
                      ? 'Intercity Bus Electronic M-Ticket'
                      : mode === 'Flight'
                      ? 'Electronic Boarding Pass & Itinerary'
                      : 'TouristHub Private Chauffeur Voucher'}
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 0', color: '#fff' }}>
                    {ticket.provider || ticket.title}
                  </h3>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>BOOKING PNR</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: 1.5 }}>{pnr}</div>
              </div>
            </div>

            {/* Route & Timing Bar */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1.5px dashed #cbd5e1',
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                gap: 16,
                background: '#fafafa'
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ORIGIN / DEPARTURE</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                  {ticket.from_city || ticket.transport_from || 'Source'}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#0284c7', fontWeight: 700, marginTop: 2 }}>
                  {ticket.departure_time || '08:00 AM'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{travelDate}</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>DURATION</div>
                <div style={{ width: 100, height: 2, background: '#cbd5e1', margin: '6px auto', position: 'relative' }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#0284c7',
                      position: 'absolute',
                      top: -3,
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 700 }}>
                  {ticket.duration || 'Direct'}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>DESTINATION / ARRIVAL</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                  {ticket.to_city || ticket.transport_to || 'Destination'}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#0284c7', fontWeight: 700, marginTop: 2 }}>
                  {ticket.arrival_time || '02:00 PM'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{travelDate}</div>
              </div>
            </div>

            {/* Travel Specs Grid */}
            <div
              style={{
                padding: '16px 24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 14,
                borderBottom: '1px solid #e2e8f0',
                fontSize: '0.82rem'
              }}
            >
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>SERVICE NO.</span>
                <strong style={{ color: '#0f172a' }}>{ticket.service_number || ticket.transport_number || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>CLASS / CATEGORY</span>
                <strong style={{ color: '#0f172a' }}>
                  {details.coach_class || details.cabin_class || details.trip_type || ticket.vehicle_model || 'Standard'}
                </strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>TOTAL SEATS</span>
                <strong style={{ color: '#0284c7' }}>
                  {details.seats && details.seats.length > 0
                    ? details.seats.join(', ')
                    : `${ticket.people_count || 1} Reserved`}
                </strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>FARE PAID</span>
                <strong style={{ color: '#16a34a' }}>
                  ₹{Number(ticket.total_amount || ticket.paid_amount || 0).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            {/* Boarding & Drop location details */}
            {(details.boarding_point || details.pickup_location) && (
              <div
                style={{
                  padding: '14px 24px',
                  background: '#f1f5f9',
                  borderBottom: '1px solid #e2e8f0',
                  fontSize: '0.82rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12
                }}
              >
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>
                    BOARDING / PICKUP POINT
                  </span>
                  <strong style={{ color: '#0f172a' }}>
                    {details.boarding_point || details.pickup_location}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>
                    DROPPING / DESTINATION
                  </span>
                  <strong style={{ color: '#0f172a' }}>
                    {details.dropping_point || details.drop_location || ticket.to_city}
                  </strong>
                </div>
              </div>
            )}

            {/* Passenger Manifest Table */}
            <div style={{ padding: '20px 24px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155', marginBottom: 10 }}>
                Passenger Manifest
              </h4>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                      <th style={{ padding: '8px 12px' }}>#</th>
                      <th style={{ padding: '8px 12px' }}>Passenger Name</th>
                      <th style={{ padding: '8px 12px' }}>Age / Gender</th>
                      <th style={{ padding: '8px 12px' }}>Seat / Berth</th>
                      <th style={{ padding: '8px 12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.passengers && details.passengers.length > 0 ? (
                      details.passengers.map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 12px', color: '#64748b' }}>{idx + 1}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0f172a' }}>{p.name || 'Traveler'}</td>
                          <td style={{ padding: '8px 12px', color: '#475569' }}>
                            {p.age || '—'} Yrs • {p.gender || '—'}
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0284c7' }}>
                            {p.seat || details.seats?.[idx] || 'Seat ' + (idx + 1)}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700 }}>
                              CNF / Confirmed
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td style={{ padding: '8px 12px' }}>1</td>
                        <td style={{ padding: '8px 12px', fontWeight: 700 }}>Primary Traveler</td>
                        <td style={{ padding: '8px 12px' }}>Adult</td>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0284c7' }}>
                          {(details.seats || []).join(', ') || 'Reserved'}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700 }}>
                            CNF / Confirmed
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Security Watermark & QR */}
            <div
              style={{
                padding: '16px 24px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={28} color="#16a34a" />
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  <div>Verified Secure E-Ticket • Tourist Hub AI Central Transit Authority</div>
                  <div>Carry valid government ID during travel. No physical printout required (M-Ticket accepted).</div>
                </div>
              </div>

              {/* Barcode representation */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'monospace', letterSpacing: 3, fontSize: '0.75rem', color: '#334155', fontWeight: 700 }}>
                  ||||| | |||| || ||||| ||| ||
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>SCAN ON BOARDING</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div
          className="no-print"
          style={{
            padding: '14px 20px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            A copy of this ticket has been saved to your account.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {onViewDashboard && (
              <button
                onClick={onViewDashboard}
                style={{
                  background: '#f1f5f9',
                  color: '#0284c7',
                  border: '1px solid #cbd5e1',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Go to My Bookings
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                padding: '8px 20px',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
