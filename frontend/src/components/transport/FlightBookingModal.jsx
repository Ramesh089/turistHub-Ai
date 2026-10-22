import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import UnifiedPaymentModal from './UnifiedPaymentModal';
import TicketModal from './TicketModal';
import {
  X,
  Plane,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Users,
  ChevronRight,
  Info,
  Luggage,
  Briefcase
} from 'lucide-react';

export default function FlightBookingModal({
  flight,
  initialDate,
  onClose,
  onComplete
}) {
  const { user } = useAuth();

  const [step, setStep] = useState('select'); // select -> passengers -> payment -> ticket
  const [travelDate, setTravelDate] = useState(
    initialDate || new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );

  // Cabin Classes
  const cabinClasses = flight.class_options && flight.class_options.length > 0
    ? flight.class_options
    : [
        { code: 'ECONOMY', name: 'Standard Economy', fare: flight.price || 3450, baggage: '15 Kg Check-in + 7 Kg Cabin', description: 'Standard seat with complimentary water and seatback magazine.' },
        { code: 'PREMIUM', name: 'Flexi Plus Economy', fare: (flight.price || 3450) * 1.3, baggage: '20 Kg Check-in + 7 Kg Cabin', description: 'Extra legroom seat, free meal, and priority airport check-in.' },
        { code: 'BUSINESS', name: 'Business Class', fare: (flight.price || 3450) * 2.2, baggage: '30 Kg Check-in + 10 Kg Cabin', description: 'Plush reclining leather seat, lounge access, gourmet dining.' }
      ];

  const [selectedCabin, setSelectedCabin] = useState(cabinClasses[0]);

  // Seats fetched from backend
  const [bookedSeats, setBookedSeats] = useState([]);
  const [heldSeats, setHeldSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Passengers
  const [passengers, setPassengers] = useState([]);
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '9876543210');

  // Coupon & Fare
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Confirmed booking
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchSeatStatus() {
      setLoadingSeats(true);
      try {
        const res = await api.get(`/transport/${flight.id}/seats?travel_date=${travelDate}`);
        if (isMounted && res.data.success) {
          setBookedSeats(res.data.booked_seats || []);
          setHeldSeats(res.data.held_seats || []);
        }
      } catch (err) {
        console.error('Failed to load flight seats:', err);
      } finally {
        if (isMounted) setLoadingSeats(false);
      }
    }
    fetchSeatStatus();
    return () => {
      isMounted = false;
    };
  }, [flight.id, travelDate]);

  useEffect(() => {
    setPassengers((prev) => {
      return selectedSeats.map((seatCode, idx) => {
        const existing = prev[idx];
        return (
          existing || {
            title: 'Mr',
            firstName: idx === 0 && user?.name ? user.name.split(' ')[0] : '',
            lastName: idx === 0 && user?.name ? user.name.split(' ').slice(1).join(' ') || 'Traveler' : '',
            govId: '',
            seat: seatCode
          }
        );
      });
    });
  }, [selectedSeats, user?.name]);

  const toggleSeat = (seatCode) => {
    if (bookedSeats.includes(seatCode) || heldSeats.includes(seatCode)) return;

    if (selectedSeats.includes(seatCode)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatCode));
    } else {
      if (selectedSeats.length >= 6) {
        alert('You can select a maximum of 6 flight seats per booking.');
        return;
      }
      setSelectedSeats([...selectedSeats, seatCode]);
    }
  };

  const perSeatFare = Number(selectedCabin.fare || flight.price || 3500);
  const baseFare = perSeatFare * selectedSeats.length;
  const taxesAndAirportFees = Math.round(baseFare * 0.12); // 12% airport UDF + GST
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const totalAmount = Math.max(0, baseFare + taxesAndAirportFees - discount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await api.post('/bookings/apply-coupon', {
        code: couponCode,
        amount: baseFare + taxesAndAirportFees
      });
      if (res.data.success) {
        setAppliedCoupon(res.data);
      } else {
        setCouponError(res.data.message || 'Invalid promo code');
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid promo code');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleProceedToPayment = () => {
    for (let i = 0; i < passengers.length; i++) {
      if (!passengers[i].firstName.trim() || !passengers[i].lastName.trim()) {
        alert(`Please enter Passenger ${i + 1} First & Last Name.`);
        return;
      }
      if (!passengers[i].govId.trim()) {
        alert(`Please enter Passenger ${i + 1} Government ID / Aadhaar / Passport No.`);
        return;
      }
    }
    if (!contactEmail.trim() || !contactPhone.trim()) {
      alert('Please enter contact email and mobile phone for E-Boarding Pass.');
      return;
    }
    setStep('payment');
  };

  const handlePaymentApproved = async (paymentDetails) => {
    setSubmitting(true);
    try {
      const payload = {
        travel_date: travelDate,
        seats: selectedSeats,
        passengers: passengers.map((p, i) => ({
          name: `${p.title} ${p.firstName} ${p.lastName}`.trim(),
          gov_id: p.govId,
          seat: selectedSeats[i]
        })),
        contact_email: contactEmail,
        contact_phone: contactPhone,
        cabin_class: selectedCabin.code || selectedCabin.name,
        payment_method: paymentDetails.payment_method,
        transaction_id: paymentDetails.transaction_id,
        discount_code: appliedCoupon ? appliedCoupon.code : null,
        discount_amount: discount
      };

      const res = await api.post(`/transport/${flight.id}/book`, payload);

      if (res.data.success) {
        const ticketData = {
          ...flight,
          booking_id: res.data.booking_id,
          booking_reference: res.data.booking_reference,
          travel_date: travelDate,
          total_amount: res.data.total_amount || totalAmount,
          payment_method: paymentDetails.payment_method,
          transaction_id: paymentDetails.transaction_id,
          booking_details: {
            cabin_class: `${selectedCabin.name} (${selectedCabin.code})`,
            baggage: selectedCabin.baggage,
            seats: selectedSeats,
            passengers: passengers.map((p, i) => ({
              name: `${p.title} ${p.firstName} ${p.lastName}`.trim(),
              gov_id: p.govId,
              seat: selectedSeats[i]
            })),
            contact_email: contactEmail,
            contact_phone: contactPhone
          }
        };
        setConfirmedBooking(ticketData);
        setStep('ticket');
        if (onComplete) onComplete(ticketData);
      } else {
        alert(res.data.message || 'Flight booking failed.');
        setStep('select');
      }
    } catch (err) {
      console.error('Flight booking error:', err);
      const msg = err.response?.data?.message || 'Error completing flight booking.';
      alert(msg);
      setStep('select');
    } finally {
      setSubmitting(false);
    }
  };

  // Aircraft 3x3 layout (A, B, C | Aisle | D, E, F)
  const totalRows = 8;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 900,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94vh',
          animation: 'fadeIn 0.2s ease'
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
            color: '#ffffff',
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Plane size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#38bdf8', color: '#082f49', padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 800 }}>
                  FLIGHT #{flight.service_number || '6E-205'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#e0f2fe' }}>
                  {flight.vehicle_model || 'Airbus A320neo'} • Non-Stop
                </span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '2px 0 0', color: '#fff' }}>
                {flight.provider}
              </h2>
              <div style={{ fontSize: '0.82rem', color: '#e0f2fe', marginTop: 2 }}>
                {flight.from_city} &rarr; {flight.to_city} • Dep: <strong>{flight.departure_time}</strong> | Arr: <strong>{flight.arrival_time}</strong> ({flight.duration})
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#fff',
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
          {step === 'select' && (
            <div>
              {/* Row 1: Journey Date & Cabin Class options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 2fr', gap: 16, marginBottom: 20 }}>
                {/* Date Picker */}
                <div style={{ background: '#fff', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Calendar size={14} color="#0284c7" /> Departure Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: '#0f172a'
                    }}
                  />
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Luggage size={14} color="#0284c7" /> {selectedCabin.baggage}
                  </div>
                </div>

                {/* Cabin classes */}
                <div style={{ display: 'flex', gap: 10 }}>
                  {cabinClasses.map((c) => (
                    <div
                      key={c.code}
                      onClick={() => setSelectedCabin(c)}
                      style={{
                        flex: 1,
                        background: selectedCabin.code === c.code ? '#eff6ff' : '#ffffff',
                        border: selectedCabin.code === c.code ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: '12px 14px',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>{c.name}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '2px 6px', borderRadius: 10 }}>
                          {c.code}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 8px' }}>
                        {c.description}
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7', display: 'flex', alignItems: 'center' }}>
                        <IndianRupee size={15} />{Number(c.fare).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aircraft Cabin 3x3 Seat Map */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 16,
                  padding: 20,
                  border: '1px solid #e2e8f0',
                  marginBottom: 20
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Aircraft Seat Map (A320 Cabin)
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Window (A, F) • Middle (B, E) • Aisle (C, D)
                    </div>
                  </div>

                  {/* Legend */}
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 14, height: 14, borderRadius: 3, background: '#e0f2fe', border: '1.5px solid #0284c7' }} />
                      <span style={{ color: '#0369a1' }}>Available</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 14, height: 14, borderRadius: 3, background: '#0284c7', border: '1.5px solid #0284c7' }} />
                      <span style={{ color: '#0284c7' }}>Selected</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 14, height: 14, borderRadius: 3, background: '#fee2e2', border: '1.5px solid #ef4444' }} />
                      <span style={{ color: '#dc2626' }}>Occupied</span>
                    </div>
                  </div>
                </div>

                {/* Jet Fuselage Container */}
                <div
                  style={{
                    border: '2px solid #cbd5e1',
                    borderRadius: '40px 40px 16px 16px',
                    padding: '24px 20px',
                    maxWidth: 540,
                    margin: '0 auto',
                    background: '#f8fafc',
                    position: 'relative'
                  }}
                >
                  {/* Cockpit Indicator */}
                  <div style={{ textAlign: 'center', marginBottom: 16, borderBottom: '1px dashed #cbd5e1', paddingBottom: 12 }}>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', letterSpacing: 2, fontWeight: 700 }}>
                      ▲ PILOT COCKPIT & GALLEY ▲
                    </div>
                    {/* Column Headers */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10, fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>
                      <span style={{ width: 20 }}></span>
                      <div style={{ display: 'flex', gap: 6, width: 114, justifyContent: 'space-around' }}>
                        <span>A</span>
                        <span>B</span>
                        <span>C</span>
                      </div>
                      <div style={{ width: 36, textAlign: 'center', color: '#cbd5e1' }}>|</div>
                      <div style={{ display: 'flex', gap: 6, width: 114, justifyContent: 'space-around' }}>
                        <span>D</span>
                        <span>E</span>
                        <span>F</span>
                      </div>
                    </div>
                  </div>

                  {/* Seat Grid */}
                  {loadingSeats ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: '#0284c7' }}>
                      Loading aircraft seat inventory...
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                      {Array.from({ length: totalRows }, (_, r) => {
                        const rowNum = r + 1;
                        const seatCols = ['A', 'B', 'C', 'D', 'E', 'F'];

                        const renderFlightSeat = (col) => {
                          const seatCode = `${rowNum}${col}`;
                          const isBooked = bookedSeats.includes(seatCode);
                          const isHeld = heldSeats.includes(seatCode);
                          const isSelected = selectedSeats.includes(seatCode);

                          let bg = '#e0f2fe';
                          let border = '#0284c7';
                          let text = '#0369a1';

                          if (isBooked) {
                            bg = '#fee2e2';
                            border = '#ef4444';
                            text = '#991b1b';
                          } else if (isHeld) {
                            bg = '#ffedd5';
                            border = '#f97316';
                            text = '#9a3412';
                          } else if (isSelected) {
                            bg = '#0284c7';
                            border = '#0284c7';
                            text = '#ffffff';
                          }

                          return (
                            <button
                              key={seatCode}
                              type="button"
                              disabled={isBooked || isHeld}
                              onClick={() => toggleSeat(seatCode)}
                              title={
                                isBooked
                                  ? `Seat ${seatCode} is occupied`
                                  : isHeld
                                  ? `Seat ${seatCode} is temporarily held`
                                  : `Seat ${seatCode} (${col === 'A' || col === 'F' ? 'Window' : col === 'C' || col === 'D' ? 'Aisle' : 'Middle'})`
                              }
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 6,
                                background: bg,
                                border: `2px solid ${border}`,
                                color: text,
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                cursor: isBooked || isHeld ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {seatCode}
                            </button>
                          );
                        };

                        return (
                          <div key={rowNum} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ width: 20, fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                              {rowNum}
                            </span>
                            {/* Left: A, B, C */}
                            <div style={{ display: 'flex', gap: 6 }}>
                              {renderFlightSeat('A')}
                              {renderFlightSeat('B')}
                              {renderFlightSeat('C')}
                            </div>

                            {/* Center Aisle */}
                            <div style={{ width: 36, textAlign: 'center', fontSize: '0.62rem', color: '#cbd5e1', fontWeight: 700 }}>
                              AISLE
                            </div>

                            {/* Right: D, E, F */}
                            <div style={{ display: 'flex', gap: 6 }}>
                              {renderFlightSeat('D')}
                              {renderFlightSeat('E')}
                              {renderFlightSeat('F')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', marginTop: 16 }}>
                    ▼ REAR GALLEY & LAVATORIES ▼
                  </div>
                </div>
              </div>

              {/* Summary Bar */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 14,
                  padding: '16px 20px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12
                }}
              >
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Selected ({selectedSeats.length} Seats):
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0284c7' }}>
                    {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None selected'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Airfare + Taxes</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <IndianRupee size={16} />{(baseFare + taxesAndAirportFees).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={selectedSeats.length === 0}
                    onClick={() => setStep('passengers')}
                    style={{
                      background: selectedSeats.length === 0 ? '#cbd5e1' : '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: 10,
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: selectedSeats.length === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    Passenger Details <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'passengers' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Enter Passenger Manifest
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Names must strictly match valid photo government identification.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  style={{
                    background: 'none',
                    border: '1px solid #cbd5e1',
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  &larr; Back to Aircraft Map
                </button>
              </div>

              {/* Passengers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                {passengers.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      padding: 16
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0284c7' }}>
                        Passenger {idx + 1} — Assigned Seat {selectedSeats[idx]}
                      </span>
                      <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                        {selectedCabin.name}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr 2fr', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                          Title
                        </label>
                        <select
                          value={p.title}
                          onChange={(e) => {
                            const updated = [...passengers];
                            updated[idx].title = e.target.value;
                            setPassengers(updated);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 8px',
                            borderRadius: 6,
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.85rem'
                          }}
                        >
                          <option value="Mr">Mr</option>
                          <option value="Ms">Ms</option>
                          <option value="Mrs">Mrs</option>
                          <option value="Dr">Dr</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                          First Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={p.firstName}
                          onChange={(e) => {
                            const updated = [...passengers];
                            updated[idx].firstName = e.target.value;
                            setPassengers(updated);
                          }}
                          placeholder="e.g. Rohit"
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 6,
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.85rem'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                          Last Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={p.lastName}
                          onChange={(e) => {
                            const updated = [...passengers];
                            updated[idx].lastName = e.target.value;
                            setPassengers(updated);
                          }}
                          placeholder="e.g. Sharma"
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 6,
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.85rem'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                          Govt ID / Passport / Aadhaar *
                        </label>
                        <input
                          type="text"
                          required
                          value={p.govId}
                          onChange={(e) => {
                            const updated = [...passengers];
                            updated[idx].govId = e.target.value;
                            setPassengers(updated);
                          }}
                          placeholder="XXXX-XXXX-1234"
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 6,
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.85rem'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact + Fare Review */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
                <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
                    E-Boarding Pass Delivery
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="traveler@example.com"
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: 6,
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                        Mobile Phone
                      </label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="9876543210"
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: 6,
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  </div>

                  {/* Promo code */}
                  <div style={{ marginTop: 14 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                      Apply Promo Code
                    </label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="INCREDIBLE2026 or NAMASTE10"
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          borderRadius: 6,
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.85rem',
                          textTransform: 'uppercase'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={validatingCoupon}
                        style={{
                          background: '#0284c7',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        Apply
                      </button>
                    </div>
                    {appliedCoupon && (
                      <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: 4, fontWeight: 700 }}>
                        ✓ {appliedCoupon.message}
                      </div>
                    )}
                    {couponError && (
                      <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 4 }}>
                        {couponError}
                      </div>
                    )}
                  </div>
                </div>

                {/* Fare Summary */}
                <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
                      Airfare Breakdown
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem', color: '#475569' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Base Airfare ({selectedSeats.length} x ₹{perSeatFare})</span>
                        <strong style={{ color: '#0f172a' }}>₹{baseFare.toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Aviation Security Fee & UDF Taxes</span>
                        <strong style={{ color: '#0f172a' }}>₹{taxesAndAirportFees.toLocaleString('en-IN')}</strong>
                      </div>
                      {appliedCoupon && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                          <span>Promo Discount ({appliedCoupon.code})</span>
                          <strong>-₹{discount.toLocaleString('en-IN')}</strong>
                        </div>
                      )}
                      <div style={{ borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800, color: '#0284c7' }}>
                        <span>Total Payable</span>
                        <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: 12, fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Info size={13} color="#0284c7" /> Gate closes 25 minutes prior to departure.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    style={{
                      marginTop: 16,
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '12px',
                      borderRadius: 10,
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                    }}
                  >
                    Proceed to Payment &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <UnifiedPaymentModal
              amount={totalAmount}
              serviceTitle={`${flight.provider} (${selectedSeats.join(', ')})`}
              onSuccess={handlePaymentApproved}
              onClose={() => setStep('passengers')}
            />
          )}

          {step === 'ticket' && confirmedBooking && (
            <TicketModal
              ticket={confirmedBooking}
              onClose={onClose}
              onViewDashboard={() => {
                onClose();
                window.location.href = '/dashboard';
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
