import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import UnifiedPaymentModal from './UnifiedPaymentModal';
import TicketModal from './TicketModal';
import {
  X,
  Bus,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Users,
  ChevronRight,
  Info,
  Disc
} from 'lucide-react';

export default function BusBookingModal({
  bus,
  initialDate,
  onClose,
  onComplete
}) {
  const { user } = useAuth();

  const [step, setStep] = useState('select'); // select -> passengers -> payment -> ticket
  const [travelDate, setTravelDate] = useState(
    initialDate || new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );

  // Deck tier tab for sleeper buses (Lower vs Upper)
  const isSleeper = (bus.vehicle_model || '').toLowerCase().includes('sleeper');
  const [activeDeck, setActiveDeck] = useState('lower'); // 'lower' or 'upper'

  // Boarding & Dropping points
  const defaultBoarding = [
    { point: `${bus.from_city} Central Bus Terminal`, time: bus.departure_time || '20:00' },
    { point: `${bus.from_city} Electronic City / Toll Gate`, time: '20:30' }
  ];
  const defaultDropping = [
    { point: `${bus.to_city} Highway Junction`, time: bus.arrival_time || '06:00' },
    { point: `${bus.to_city} City Bus Stand`, time: '06:30' }
  ];

  const boardingPoints = Array.isArray(bus.boarding_points) && bus.boarding_points.length > 0
    ? bus.boarding_points
    : defaultBoarding;

  const droppingPoints = Array.isArray(bus.dropping_points) && bus.dropping_points.length > 0
    ? bus.dropping_points
    : defaultDropping;

  const [selectedBoarding, setSelectedBoarding] = useState(
    boardingPoints[0]?.point ? `${boardingPoints[0].point} (${boardingPoints[0].time})` : 'Main Boarding Point'
  );
  const [selectedDropping, setSelectedDropping] = useState(
    droppingPoints[0]?.point ? `${droppingPoints[0].point} (${droppingPoints[0].time})` : 'Main Dropping Point'
  );

  // Seats fetched from backend
  const [bookedSeats, setBookedSeats] = useState([]);
  const [heldSeats, setHeldSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]); // array of strings e.g. ["L1", "L2", "U4"]

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
        const res = await api.get(`/transport/${bus.id}/seats?travel_date=${travelDate}`);
        if (isMounted && res.data.success) {
          setBookedSeats(res.data.booked_seats || []);
          setHeldSeats(res.data.held_seats || []);
        }
      } catch (err) {
        console.error('Failed to load bus seats:', err);
      } finally {
        if (isMounted) setLoadingSeats(false);
      }
    }
    fetchSeatStatus();
    return () => {
      isMounted = false;
    };
  }, [bus.id, travelDate]);

  useEffect(() => {
    setPassengers((prev) => {
      return selectedSeats.map((seatCode, idx) => {
        const existing = prev[idx];
        return (
          existing || {
            name: idx === 0 && user?.name ? user.name : '',
            age: '',
            gender: 'Male',
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
        alert('You can select a maximum of 6 bus seats per booking.');
        return;
      }
      setSelectedSeats([...selectedSeats, seatCode]);
    }
  };

  const perSeatFare = Number(bus.price || 850);
  const baseFare = perSeatFare * selectedSeats.length;
  const gst = Math.round(baseFare * 0.05); // 5% GST on AC bus
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const totalAmount = Math.max(0, baseFare + gst - discount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await api.post('/bookings/apply-coupon', {
        code: couponCode,
        amount: baseFare + gst
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
      if (!passengers[i].name.trim()) {
        alert(`Please enter Passenger ${i + 1} Name.`);
        return;
      }
      if (!passengers[i].age) {
        alert(`Please enter Passenger ${i + 1} Age.`);
        return;
      }
    }
    if (!contactEmail.trim() || !contactPhone.trim()) {
      alert('Please enter contact email and mobile number for M-ticket SMS.');
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
          ...p,
          seat: selectedSeats[i]
        })),
        contact_email: contactEmail,
        contact_phone: contactPhone,
        boarding_point: selectedBoarding,
        dropping_point: selectedDropping,
        coach_class: isSleeper ? 'Volvo Multi-Axle Sleeper' : 'AC Seater Pushback',
        payment_method: paymentDetails.payment_method,
        transaction_id: paymentDetails.transaction_id,
        discount_code: appliedCoupon ? appliedCoupon.code : null,
        discount_amount: discount
      };

      const res = await api.post(`/transport/${bus.id}/book`, payload);

      if (res.data.success) {
        const ticketData = {
          ...bus,
          booking_id: res.data.booking_id,
          booking_reference: res.data.booking_reference,
          travel_date: travelDate,
          total_amount: res.data.total_amount || totalAmount,
          payment_method: paymentDetails.payment_method,
          transaction_id: paymentDetails.transaction_id,
          booking_details: {
            coach_class: bus.vehicle_model,
            boarding_point: selectedBoarding,
            dropping_point: selectedDropping,
            seats: selectedSeats,
            passengers: passengers.map((p, i) => ({
              ...p,
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
        alert(res.data.message || 'Bus seat booking failed.');
        setStep('select');
      }
    } catch (err) {
      console.error('Bus booking error:', err);
      const msg = err.response?.data?.message || 'Error completing bus booking.';
      alert(msg);
      setStep('select');
    } finally {
      setSubmitting(false);
    }
  };

  // Render sleeper berths or seater seats
  const renderBerthSeat = (seatCode, berthLabel, isSleeperType = false) => {
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
            ? `Berth ${seatCode} is already booked`
            : isHeld
            ? `Berth ${seatCode} is temporarily held`
            : `Berth ${seatCode} (${berthLabel}) - ₹${perSeatFare}`
        }
        style={{
          width: isSleeperType ? 52 : 36,
          height: isSleeperType ? 34 : 36,
          borderRadius: 6,
          background: bg,
          border: `2px solid ${border}`,
          color: text,
          fontSize: '0.72rem',
          fontWeight: 800,
          cursor: isBooked || isHeld ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <span>{seatCode}</span>
        <span style={{ fontSize: '0.52rem', opacity: 0.85 }}>{berthLabel}</span>
      </button>
    );
  };

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
          maxWidth: 880,
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
            background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
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
              <Bus size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 800 }}>
                  BUS REG: {bus.service_number || 'KA-51-9812'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#fef3c7' }}>
                  ★ {bus.rating || 4.7} ({bus.reviews_count || 120} reviews)
                </span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '2px 0 0', color: '#fff' }}>
                {bus.provider}
              </h2>
              <div style={{ fontSize: '0.82rem', color: '#fef3c7', marginTop: 2 }}>
                {bus.from_city} &rarr; {bus.to_city} • {bus.vehicle_model}
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
              {/* Row 1: Journey Date & Boarding/Dropping Selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
                {/* Date */}
                <div style={{ background: '#fff', padding: 12, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Calendar size={14} color="#d97706" /> Journey Date
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
                </div>

                {/* Boarding Point */}
                <div style={{ background: '#fff', padding: 12, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <MapPin size={14} color="#16a34a" /> Boarding Point
                  </label>
                  <select
                    value={selectedBoarding}
                    onChange={(e) => setSelectedBoarding(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#0f172a'
                    }}
                  >
                    {boardingPoints.map((b, idx) => (
                      <option key={idx} value={`${b.point} (${b.time})`}>
                        {b.point} — {b.time}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dropping Point */}
                <div style={{ background: '#fff', padding: 12, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <MapPin size={14} color="#dc2626" /> Dropping Point
                  </label>
                  <select
                    value={selectedDropping}
                    onChange={(e) => setSelectedDropping(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#0f172a'
                    }}
                  >
                    {droppingPoints.map((d, idx) => (
                      <option key={idx} value={`${d.point} (${d.time})`}>
                        {d.point} — {d.time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Realistic Bus Seat Layout */}
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
                      Select Bus Seats / Sleeper Berths
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {isSleeper ? '2+1 Luxury Sleeper Coach with Upper & Lower Berths' : '2+2 Luxury Pushback Executive Coach'}
                    </div>
                  </div>

                  {/* Sleeper Deck Switcher (if sleeper) */}
                  {isSleeper && (
                    <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 8 }}>
                      <button
                        type="button"
                        onClick={() => setActiveDeck('lower')}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 6,
                          border: 'none',
                          background: activeDeck === 'lower' ? '#d97706' : 'transparent',
                          color: activeDeck === 'lower' ? '#fff' : '#64748b',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                      >
                        Lower Deck
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveDeck('upper')}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 6,
                          border: 'none',
                          background: activeDeck === 'upper' ? '#d97706' : 'transparent',
                          color: activeDeck === 'upper' ? '#fff' : '#64748b',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                      >
                        Upper Deck
                      </button>
                    </div>
                  )}

                  {/* Legend */}
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 14, height: 14, borderRadius: 3, background: '#e0f2fe', border: '1.5px solid #0284c7' }} />
                      <span style={{ color: '#0369a1' }}>Avail</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 14, height: 14, borderRadius: 3, background: '#0284c7', border: '1.5px solid #0284c7' }} />
                      <span style={{ color: '#0284c7' }}>Selected</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 14, height: 14, borderRadius: 3, background: '#fee2e2', border: '1.5px solid #ef4444' }} />
                      <span style={{ color: '#dc2626' }}>Booked</span>
                    </div>
                  </div>
                </div>

                {/* Bus Interior Box with Front Cockpit & Steering Wheel */}
                <div
                  style={{
                    border: '2px solid #cbd5e1',
                    borderRadius: 24,
                    padding: '24px 20px',
                    maxWidth: 580,
                    margin: '0 auto',
                    background: '#f8fafc',
                    position: 'relative'
                  }}
                >
                  {/* Driver Cabin Indicator */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: 16,
                      borderBottom: '2px dashed #cbd5e1',
                      marginBottom: 16
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
                      PASSENGER ENTRY DOOR
                    </div>
                    <div
                      style={{
                        background: '#e2e8f0',
                        padding: '4px 12px',
                        borderRadius: 20,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Disc size={14} color="#d97706" /> DRIVER CABIN
                    </div>
                  </div>

                  {/* Berth / Seat Grid */}
                  {loadingSeats ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: '#d97706' }}>
                      Checking live seat chart...
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* 6 rows of 2+1 layout (single berth on left, aisle, double berth on right) */}
                      {Array.from({ length: 6 }, (_, r) => {
                        const prefix = isSleeper ? (activeDeck === 'lower' ? 'L' : 'U') : 'S';
                        const sLeft = `${prefix}${r * 3 + 1}`;
                        const sRight1 = `${prefix}${r * 3 + 2}`;
                        const sRight2 = `${prefix}${r * 3 + 3}`;

                        return (
                          <div key={r} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {/* Single Berth (Window) */}
                            <div>
                              {renderBerthSeat(sLeft, 'Single', isSleeper)}
                            </div>

                            {/* Center Aisle */}
                            <div style={{ color: '#cbd5e1', fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1 }}>
                              AISLE
                            </div>

                            {/* Double Berth (Aisle + Window) */}
                            <div style={{ display: 'flex', gap: 8 }}>
                              {renderBerthSeat(sRight1, 'Aisle', isSleeper)}
                              {renderBerthSeat(sRight2, 'Window', isSleeper)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', marginTop: 16 }}>
                    ▼ REAR OF BUS / EMERGENCY EXIT ▼
                  </div>
                </div>
              </div>

              {/* Selection Summary */}
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
                    Selected ({selectedSeats.length} Berths):
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#d97706' }}>
                    {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None selected'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Total Fare</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <IndianRupee size={16} />{baseFare.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={selectedSeats.length === 0}
                    onClick={() => setStep('passengers')}
                    style={{
                      background: selectedSeats.length === 0 ? '#cbd5e1' : '#d97706',
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
                    Enter Passenger Information
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Boarding at: <strong>{selectedBoarding}</strong>
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
                  &larr; Back to Bus Layout
                </button>
              </div>

              {/* Passenger Cards */}
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
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#d97706' }}>
                        Passenger {idx + 1} — Berth {selectedSeats[idx]}
                      </span>
                      <span style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                        {isSleeper ? 'AC Sleeper Berth' : 'Pushback Seat'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={p.name}
                          onChange={(e) => {
                            const updated = [...passengers];
                            updated[idx].name = e.target.value;
                            setPassengers(updated);
                          }}
                          placeholder="e.g. Ananya Sen"
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
                          Age *
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={120}
                          value={p.age}
                          onChange={(e) => {
                            const updated = [...passengers];
                            updated[idx].age = e.target.value;
                            setPassengers(updated);
                          }}
                          placeholder="28"
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
                          Gender
                        </label>
                        <select
                          value={p.gender}
                          onChange={(e) => {
                            const updated = [...passengers];
                            updated[idx].gender = e.target.value;
                            setPassengers(updated);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 6,
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.85rem'
                          }}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact + Fare Review */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
                <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
                    M-Ticket Contact Delivery
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
                        Mobile Phone (for Driver SMS & GPS tracking link)
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
                        placeholder="NAMASTE10 or FIRSTTRIP"
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
                          background: '#d97706',
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
                      Fare Breakdown
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem', color: '#475569' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Seat Base Fare ({selectedSeats.length} x ₹{perSeatFare})</span>
                        <strong style={{ color: '#0f172a' }}>₹{baseFare.toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>GST & Bus Operator Surcharge (5%)</span>
                        <strong style={{ color: '#0f172a' }}>₹{gst.toLocaleString('en-IN')}</strong>
                      </div>
                      {appliedCoupon && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                          <span>Promo Discount ({appliedCoupon.code})</span>
                          <strong>-₹{discount.toLocaleString('en-IN')}</strong>
                        </div>
                      )}
                      <div style={{ borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800, color: '#d97706' }}>
                        <span>Net Payable</span>
                        <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: 12, fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Info size={13} color="#d97706" /> Reporting time: 15 mins before departure at boarding point.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    style={{
                      marginTop: 16,
                      background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
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
                      boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)'
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
              serviceTitle={`${bus.provider} (${selectedSeats.join(', ')})`}
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
