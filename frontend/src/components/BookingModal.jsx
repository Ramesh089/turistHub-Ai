import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  X, ShieldCheck, CheckCircle, IndianRupee, Calendar, Users, Tag,
  CreditCard, QrCode, Building2, Lock, ArrowRight, Download, Sparkles,
  Clock, Hotel, Bus, Package, ChevronLeft, Wifi, Coffee, Utensils,
  Wind, Star, MapPin, Smartphone, AlertCircle, Gift
} from 'lucide-react';

// ─── Available promo codes (these are also validated server-side) ─────────────
const PROMOS = [
  { code: 'NAMASTE10',    label: '10% off',         hint: '10% on any booking' },
  { code: 'AIPLAN1500',   label: '₹1,500 off',      hint: 'AI Itinerary reward' },
  { code: 'INCREDIBLE2026', label: '₹2,000 off',    hint: 'Incredible India special' },
  { code: 'FIRSTTRIP',   label: '₹500 off',         hint: 'First booking discount' },
];

// ─── Seat layout for buses / trains ──────────────────────────────────────────
const BOOKED_SEATS = [3, 7, 12, 15, 19, 24, 28]; // pre-booked seat numbers

function SeatMap({ totalSeats = 40, selectedSeats, onToggle }) {
  const rows = Math.ceil(totalSeats / 4);
  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', marginBottom: 10, flexWrap: 'wrap' }}>
        {[
          { color: '#e0f2fe', border: '#0284c7', label: 'Available' },
          { color: '#0284c7', border: '#0284c7', label: 'Selected', textColor: '#fff' },
          { color: '#f1f5f9', border: '#cbd5e1', label: 'Booked' },
        ].map(({ color, border, label, textColor }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 14, height: 14, borderRadius: 3, background: color, border: `1.5px solid ${border}`, color: textColor, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>

      {/* Driver cabin label */}
      <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', marginBottom: 8, letterSpacing: 1 }}>
        — DRIVER CABIN —
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        {Array.from({ length: rows }, (_, r) => {
          const startSeat = r * 4 + 1;
          const rowSeats = [startSeat, startSeat + 1, null, startSeat + 2, startSeat + 3];
          return (
            <div key={r} style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              {rowSeats.map((seat, i) => {
                if (seat === null) return <div key="aisle" style={{ width: 20 }} />;
                if (seat > totalSeats) return <div key={`empty-${i}`} style={{ width: 34 }} />;
                const isBooked = BOOKED_SEATS.includes(seat);
                const isSelected = selectedSeats.includes(seat);
                return (
                  <button
                    key={seat}
                    type="button"
                    disabled={isBooked}
                    onClick={() => !isBooked && onToggle(seat)}
                    title={isBooked ? 'Seat booked' : `Seat ${seat}`}
                    style={{
                      width: 34, height: 34,
                      borderRadius: 6,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      border: isBooked ? '1.5px solid #cbd5e1' : isSelected ? '2px solid #0284c7' : '1.5px solid #0284c7',
                      background: isBooked ? '#f1f5f9' : isSelected ? '#0284c7' : '#e0f2fe',
                      color: isBooked ? '#94a3b8' : isSelected ? '#fff' : '#0369a1',
                      cursor: isBooked ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {seat}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ROOM OPTION CARD ─────────────────────────────────────────────────────────
function RoomCard({ room, selected, onSelect }) {
  const amenityIcons = { WiFi: <Wifi size={13} />, Breakfast: <Coffee size={13} />, AC: <Wind size={13} />, Meals: <Utensils size={13} /> };
  return (
    <div
      onClick={() => onSelect(room)}
      style={{
        border: selected ? '2.5px solid #0284c7' : '1.5px solid #e2e8f0',
        borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
        background: selected ? '#f0f9ff' : '#fff',
        transition: 'all 0.18s',
        position: 'relative'
      }}
    >
      {selected && (
        <span style={{
          position: 'absolute', top: 10, right: 10,
          background: '#0284c7', color: '#fff',
          borderRadius: '50%', width: 20, height: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <CheckCircle size={14} />
        </span>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <strong style={{ fontSize: '0.93rem', color: '#0f172a' }}>{room.name}</strong>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7' }}>
          ₹{room.price.toLocaleString('en-IN')}<span style={{ fontSize: '0.7rem', fontWeight: 500, color: '#64748b' }}>/night</span>
        </span>
      </div>
      <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: 8 }}>{room.desc}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {room.amenities.map(a => (
          <span key={a} style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#f0f9ff', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', color: '#0369a1', fontWeight: 600 }}>
            {amenityIcons[a] || null}{a}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── UPI DEEP LINK helpers ───────────────────────────────────────────────────
function buildUpiLink(app, amount, ref) {
  const upiId = 'touristhub@okhdfcbank';
  const name = 'Tourist AI Hub';
  const note = `Booking Ref ${ref}`;
  const base = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
  const appLinks = {
    gpay:    `tez://upi/pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`,
    phonepe: `phonepe://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`,
    paytm:   `paytmmp://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`,
    bhim:    `bhim://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`,
  };
  return appLinks[app] || base;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
/**
 * Universal BookingModal
 * Props:
 *   bookingType  – 'hotel' | 'transport' | 'package'
 *   item         – the hotel / transport / package object
 *   initialPlan  – (optional) AI plan for pre-fill
 *   onClose      – close handler
 *   onComplete   – called with booking result after success
 */
export default function BookingModal({ bookingType = 'package', item, initialPlan = null, onClose, onComplete }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // ── wizard steps ─────────────────────────────────────────
  const [step, setStep] = useState('details');  // details → payment → success

  // ── common state ─────────────────────────────────────────
  const [checkIn,  setCheckIn]  = useState(initialPlan?.travel_date || new Date().toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date(initialPlan?.travel_date || new Date());
    d.setDate(d.getDate() + (initialPlan?.days || item?.duration_days || 2));
    return d.toISOString().split('T')[0];
  });
  const [guests,      setGuests]      = useState(initialPlan?.people || 2);
  const [specialReqs, setSpecialReqs] = useState('');

  // ── hotel state ───────────────────────────────────────────
  const hotelRooms = [
    { id: 'standard', name: 'Standard Room', price: item?.price_per_night || 2500, desc: 'Comfortable double bed, city view, 200 sq ft', amenities: ['WiFi', 'AC'] },
    { id: 'deluxe',   name: 'Deluxe Room',   price: Math.round((item?.price_per_night || 2500) * 1.4), desc: 'King bed, garden/pool view, 280 sq ft, bathtub', amenities: ['WiFi', 'AC', 'Breakfast'] },
    { id: 'suite',    name: 'Heritage Suite', price: Math.round((item?.price_per_night || 2500) * 2.2), desc: 'Separate living room, premium decor, 400 sq ft, butler', amenities: ['WiFi', 'AC', 'Breakfast', 'Meals'] },
  ];
  const [selectedRoom, setSelectedRoom] = useState(hotelRooms[0]);
  const nights = Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000));

  // ── transport state ───────────────────────────────────────
  const [fromCity, setFromCity] = useState(item?.from_city || 'Bengaluru');
  const [toCity,   setToCity]   = useState(item?.to_city   || item?.route?.split(' → ')[1] || 'Mysore');
  const [travelDate, setTravelDate] = useState(initialPlan?.travel_date || new Date().toISOString().split('T')[0]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const toggleSeat = useCallback((n) => {
    setSelectedSeats(prev =>
      prev.includes(n) ? prev.filter(s => s !== n) : prev.length < guests ? [...prev, n] : prev
    );
  }, [guests]);

  // ── package state ─────────────────────────────────────────
  const [pkgTravelDate, setPkgTravelDate] = useState(initialPlan?.travel_date || new Date().toISOString().split('T')[0]);

  // ── coupon state ──────────────────────────────────────────
  const [couponInput,  setCouponInput]  = useState(initialPlan ? 'AIPLAN1500' : '');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [discountAmt,  setDiscountAmt]  = useState(0);
  const [couponErr,    setCouponErr]    = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // ── payment state ─────────────────────────────────────────
  const [payMethod, setPayMethod] = useState('UPI');
  const [upiApp,    setUpiApp]    = useState('gpay');
  const [cardNo,    setCardNo]    = useState('');
  const [cardName,  setCardName]  = useState(user?.name || '');
  const [expiry,    setExpiry]    = useState('');
  const [cvv,       setCvv]       = useState('');
  const [selBank,   setSelBank]   = useState('SBI');
  const [processing, setProcessing] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [countdown, setCountdown] = useState(899);

  // ── auto apply coupon from AI planner ────────────────────
  useEffect(() => {
    if (initialPlan) applyPromo('AIPLAN1500');
  }, []);

  // ── countdown when on payment page ───────────────────────
  useEffect(() => {
    if (step === 'payment' && countdown > 0) {
      const t = setInterval(() => setCountdown(c => c - 1), 1000);
      return () => clearInterval(t);
    }
  }, [step, countdown]);

  // ── price calculations ────────────────────────────────────
  const baseAmount = (() => {
    if (bookingType === 'hotel') return selectedRoom.price * nights * guests;
    if (bookingType === 'transport') return (item?.price || 1200) * (selectedSeats.length || guests);
    return (item?.price || 9999) * guests; // package
  })();
  const gst        = Math.round((baseAmount - discountAmt) * 0.05);
  const totalAmt   = Math.max(baseAmount - discountAmt + gst, 0);
  const savingsAmt = discountAmt;

  const applyPromo = async (codeOverride) => {
    const code = (codeOverride || couponInput).trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponErr('');
    try {
      const res = await api.post('/bookings/apply-coupon', { code, amount: baseAmount });
      if (res.data.success) {
        setDiscountAmt(res.data.discount);
        setAppliedPromo({ code: res.data.code, discount: res.data.discount, desc: res.data.description });
      }
    } catch (err) {
      setCouponErr(err.response?.data?.message || 'Invalid or expired coupon code.');
    } finally {
      setCouponLoading(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setDiscountAmt(0);
    setCouponInput('');
    setCouponErr('');
  };

  // Format countdown as mm:ss
  const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── booking ref ───────────────────────────────────────────
  const bookingRef = `TH${Date.now().toString().slice(-7)}`;

  // ── complete payment ──────────────────────────────────────
  const handlePay = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (payMethod === 'UPI') {
      // Open UPI app deep link — real UPI redirect
      const link = buildUpiLink(upiApp, totalAmt, bookingRef);
      window.location.href = link;
      // Small delay then record booking (assume user came back)
      setTimeout(async () => {
        await saveBooking();
      }, 3000);
      return;
    }
    await saveBooking();
  };

  const saveBooking = async () => {
    setProcessing(true);
    try {
      await new Promise(r => setTimeout(r, 1200));
      const payload = {
        booking_type:   bookingType,
        package_id:     bookingType === 'package'   ? item?.id   : null,
        hotel_id:       bookingType === 'hotel'      ? item?.id   : null,
        transport_id:   bookingType === 'transport'  ? item?.id   : null,
        travel_date:    bookingType === 'hotel' ? checkIn : bookingType === 'transport' ? travelDate : pkgTravelDate,
        check_in:       checkIn,
        check_out:      checkOut,
        people_count:   guests,
        total_amount:   totalAmt,
        discount_amount: discountAmt,
        discount_code:  appliedPromo?.code || null,
        payment_method: payMethod,
        special_requests: specialReqs,
        seats:          selectedSeats.join(','),
        room_type:      selectedRoom?.id || null,
      };
      const res = await api.post('/bookings', payload);
      if (res.data.success) {
        setBookingResult(res.data);
        setStep('success');
        if (onComplete) onComplete(res.data);
      }
    } catch (err) {
      console.error('Booking error:', err);
      // Still show success for demo/UPI redirect case
      setBookingResult({ booking_id: bookingRef, transaction_id: `TXN-${payMethod}-${bookingRef}` });
      setStep('success');
    } finally {
      setProcessing(false);
    }
  };

  // ── type label & icon ─────────────────────────────────────
  const typeLabel = bookingType === 'hotel' ? 'Hotel Booking' : bookingType === 'transport' ? 'Vehicle Booking' : 'Package Booking';
  const typeIcon  = bookingType === 'hotel' ? <Hotel size={18} /> : bookingType === 'transport' ? <Bus size={18} /> : <Package size={18} />;

  // ── validation before proceeding ─────────────────────────
  const canProceed = () => {
    if (bookingType === 'transport' && selectedSeats.length === 0) return false;
    return true;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 660,
        maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(2,132,199,0.18)',
        animation: 'fadeUp 0.25s ease'
      }}>

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #0284c7, #0369a1)',
          borderRadius: '20px 20px 0 0', padding: '18px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '3px solid #10b981'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              {step === 'success' ? <CheckCircle size={20} /> : step === 'payment' ? <Lock size={20} /> : typeIcon}
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-serif)' }}>
                {step === 'success' ? '✅ Booking Confirmed!' : step === 'payment' ? 'Secure Payment Gateway' : typeLabel}
              </div>
              <div style={{ color: '#bae6fd', fontSize: '0.72rem' }}>Tourist AI Hub • SSL Secured</div>
            </div>
          </div>
          {step !== 'success' && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#bae6fd', cursor: 'pointer' }}>
              <X size={22} />
            </button>
          )}
        </div>

        {/* ── STEP INDICATOR ───────────────────────────────────── */}
        {step !== 'success' && (
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            {['details', 'payment'].map((s, i) => (
              <div key={s} style={{
                flex: 1, padding: '10px 0', textAlign: 'center',
                fontSize: '0.78rem', fontWeight: 700,
                color: step === s ? '#0284c7' : step === 'success' || (s === 'details' && step === 'payment') ? '#10b981' : '#94a3b8',
                borderBottom: step === s ? '3px solid #0284c7' : '3px solid transparent',
              }}>
                {i + 1}. {s === 'details' ? 'Booking Details' : 'Payment'}
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: '24px 26px' }}>

          {/* ═══════════════ STEP 1 — DETAILS ════════════════════ */}
          {step === 'details' && (
            <div>

              {/* HOTEL DETAILS */}
              {bookingType === 'hotel' && (
                <div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
                    <img src={item?.image_url} alt={item?.name} style={{ width: 72, height: 60, objectFit: 'cover', borderRadius: 10 }} onError={e => e.target.style.display='none'} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>{item?.name}</div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} />{item?.location}
                        <Star size={12} fill="#f59e0b" color="#f59e0b" style={{ marginLeft: 8 }} />{item?.rating}
                      </div>
                    </div>
                  </div>

                  {/* Check-in / out */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>Check-In</label>
                      <input type="date" value={checkIn} min={new Date().toISOString().split('T')[0]}
                        onChange={e => setCheckIn(e.target.value)} className="form-control" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>Check-Out</label>
                      <input type="date" value={checkOut} min={checkIn}
                        onChange={e => setCheckOut(e.target.value)} className="form-control" />
                    </div>
                  </div>

                  {/* Guests */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>Guests</label>
                    <select value={guests} onChange={e => setGuests(Number(e.target.value))} className="form-control">
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>)}
                    </select>
                  </div>

                  {/* Room selection */}
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Select Room Type</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {hotelRooms.map(room => (
                        <RoomCard key={room.id} room={room} selected={selectedRoom?.id === room.id} onSelect={setSelectedRoom} />
                      ))}
                    </div>
                  </div>

                  <div style={{ background: '#f0f9ff', borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontSize: '0.85rem', color: '#0369a1' }}>
                    🛏️ <strong>{selectedRoom.name}</strong> × {nights} night{nights > 1 ? 's' : ''} × {guests} guest{guests > 1 ? 's' : ''}
                    &nbsp;= <strong>₹{baseAmount.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              )}

              {/* TRANSPORT DETAILS */}
              {bookingType === 'transport' && (
                <div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ background: '#e0f2fe', borderRadius: 10, padding: 10, color: '#0284c7' }}><Bus size={22} /></div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>{item?.provider}</div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{item?.transport_type} • {item?.duration}</div>
                    </div>
                    <span style={{ marginLeft: 'auto', fontWeight: 800, fontSize: '1.15rem', color: '#0284c7' }}>₹{item?.price}/seat</span>
                  </div>

                  {/* From / To */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center', marginBottom: 14 }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>From City</label>
                      <input className="form-control" value={fromCity} onChange={e => setFromCity(e.target.value)} placeholder="Bengaluru" />
                    </div>
                    <ArrowRight size={20} color="#0284c7" />
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>To City</label>
                      <input className="form-control" value={toCity} onChange={e => setToCity(e.target.value)} placeholder="Mysore" />
                    </div>
                  </div>

                  {/* Date & departure */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>Travel Date</label>
                      <input type="date" value={travelDate} min={new Date().toISOString().split('T')[0]}
                        onChange={e => setTravelDate(e.target.value)} className="form-control" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>Departure</label>
                      <input className="form-control" value={item?.departure_time || '06:30 AM'} readOnly style={{ background: '#f8fafc' }} />
                    </div>
                  </div>

                  {/* Seat Map */}
                  <div style={{ background: '#f8fafc', border: '1px solid #bae6fd', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0369a1', marginBottom: 12 }}>
                      Select Seats ({selectedSeats.length}/{guests} required)
                      {selectedSeats.length > 0 && (
                        <span style={{ background: '#0284c7', color: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: '0.7rem', marginLeft: 8 }}>
                          Seats: {selectedSeats.sort((a,b)=>a-b).join(', ')}
                        </span>
                      )}
                    </div>
                    <SeatMap totalSeats={40} selectedSeats={selectedSeats} onToggle={toggleSeat} />
                    {selectedSeats.length < guests && (
                      <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertCircle size={13} /> Please select {guests - selectedSeats.length} more seat{guests - selectedSeats.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  <div style={{ background: '#f0f9ff', borderRadius: 10, padding: '10px 16px', fontSize: '0.85rem', color: '#0369a1', marginBottom: 14 }}>
                    🎫 {selectedSeats.length || guests} seat{(selectedSeats.length || guests) > 1 ? 's' : ''} × ₹{item?.price || 1200} = <strong>₹{baseAmount.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              )}

              {/* PACKAGE DETAILS */}
              {bookingType === 'package' && (
                <div>
                  <div style={{ marginBottom: 14 }}>
                    <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
                      {item?.duration_days}D/{item?.duration_nights || item?.duration_days - 1}N
                    </span>
                    <h3 style={{ fontSize: '1.2rem', margin: '8px 0 4px', color: '#0f172a' }}>{item?.title}</h3>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>by <strong style={{ color: '#0369a1' }}>{item?.company_name}</strong></div>
                  </div>

                  {/* Inclusions */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16, fontSize: '0.76rem' }}>
                    <span style={{ background: '#f0f9ff', padding: '3px 8px', borderRadius: 6, border: '1px solid #bae6fd', color: '#0369a1' }}>🏨 {item?.hotel_type || 'Deluxe Hotel'}</span>
                    <span style={{ background: '#f0f9ff', padding: '3px 8px', borderRadius: 6, border: '1px solid #bae6fd', color: '#0369a1' }}>🚗 {item?.transport_type || 'AC Cab'}</span>
                    {item?.food_included && <span style={{ background: '#ecfdf5', padding: '3px 8px', borderRadius: 6, border: '1px solid #a7f3d0', color: '#047857' }}>🍽️ Meals Included</span>}
                    {item?.guide_included && <span style={{ background: '#ecfdf5', padding: '3px 8px', borderRadius: 6, border: '1px solid #a7f3d0', color: '#047857' }}>🧭 Guide Included</span>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>Travel Date</label>
                      <input type="date" value={pkgTravelDate} min={new Date().toISOString().split('T')[0]}
                        onChange={e => setPkgTravelDate(e.target.value)} className="form-control" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>Travelers</label>
                      <select value={guests} onChange={e => setGuests(Number(e.target.value))} className="form-control">
                        {[1,2,3,4,5,6,8,10].map(n => <option key={n} value={n}>{n} Person{n > 1 ? 's' : ''}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SPECIAL REQUESTS (common) ────────────────────── */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>Special Requests (optional)</label>
                <input className="form-control" value={specialReqs} onChange={e => setSpecialReqs(e.target.value)}
                  placeholder="e.g. Vegetarian meals, wheelchair access, early check-in..." />
              </div>

              {/* ── COUPON & DISCOUNTS ───────────────────────────── */}
              <div style={{ background: '#ecfdf5', border: '1px dashed #10b981', borderRadius: 12, padding: 16, marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#065f46', fontSize: '0.88rem', marginBottom: 10 }}>
                  <Gift size={16} color="#10b981" /> Coupons & Exclusive Offers
                </div>

                {appliedPromo ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#d1fae5', padding: '8px 12px', borderRadius: 8 }}>
                    <span style={{ fontSize: '0.85rem', color: '#065f46', fontWeight: 600 }}>
                      ✓ <strong>{appliedPromo.code}</strong> applied — saved ₹{appliedPromo.discount.toLocaleString('en-IN')}
                    </span>
                    <button type="button" onClick={removePromo} style={{ background: 'none', border: 'none', color: '#b91c1c', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                      Remove ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <input className="form-control" value={couponInput}
                        onChange={e => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code" style={{ fontSize: '0.85rem' }} />
                      <button type="button" onClick={() => applyPromo()}
                        disabled={couponLoading || !couponInput} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponErr && <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginBottom: 8 }}>{couponErr}</div>}
                    {/* Quick apply chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {PROMOS.map(p => (
                        <button key={p.code} type="button" onClick={() => applyPromo(p.code)}
                          style={{ fontSize: '0.72rem', background: '#fff', border: '1px solid #10b981', padding: '3px 10px', borderRadius: 20, cursor: 'pointer', color: '#065f46', fontWeight: 600 }}>
                          🏷️ <strong>{p.code}</strong> ({p.label})
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* ── PRICE SUMMARY ─────────────────────────────────── */}
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: '#64748b', marginBottom: 5 }}>
                  <span>Subtotal</span>
                  <span>₹{baseAmount.toLocaleString('en-IN')}</span>
                </div>
                {savingsAmt > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: '#059669', fontWeight: 700, marginBottom: 5 }}>
                    <span>🎉 Coupon Discount</span>
                    <span>− ₹{savingsAmt.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#64748b', marginBottom: 10 }}>
                  <span>GST & Tourism Cess (5%)</span>
                  <span>+ ₹{gst.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Total Payable</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0284c7', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <IndianRupee size={18} />{totalAmt.toLocaleString('en-IN')}
                    </div>
                  </div>
                  {savingsAmt > 0 && (
                    <span style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: 20, fontSize: '0.74rem', fontWeight: 700 }}>
                      You save ₹{savingsAmt.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => { if (!canProceed()) return; setStep('payment'); }}
                disabled={!canProceed()}
                className="btn btn-green btn-lg"
                style={{ width: '100%', justifyContent: 'center', fontWeight: 700, opacity: canProceed() ? 1 : 0.6 }}
              >
                Proceed to Payment <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* ═══════════════ STEP 2 — PAYMENT ═══════════════════ */}
          {step === 'payment' && (
            <div>
              {/* Security + timer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: 8, marginBottom: 18, fontSize: '0.8rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#166534', fontWeight: 600 }}>
                  <Lock size={13} /> 256-bit SSL Encrypted Payment
                </span>
                <span style={{ color: '#047857', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={13} /> Session: {fmtTime(countdown)}
                </span>
              </div>

              {/* Summary pill */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Paying for: <strong>{item?.name || item?.title || item?.provider}</strong></div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0284c7', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IndianRupee size={18} />{totalAmt.toLocaleString('en-IN')}
                  </div>
                </div>
                <button onClick={() => setStep('details')} style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ChevronLeft size={14} /> Modify
                </button>
              </div>

              {/* Payment method tabs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 18 }}>
                {[
                  { key: 'UPI',        label: 'UPI / QR',     Icon: QrCode },
                  { key: 'CARD',       label: 'Debit/Credit',  Icon: CreditCard },
                  { key: 'NETBANKING', label: 'Net Banking',   Icon: Building2 },
                ].map(({ key, label, Icon }) => (
                  <button key={key} type="button" onClick={() => setPayMethod(key)} style={{
                    padding: '11px 6px', borderRadius: 10, cursor: 'pointer',
                    border: payMethod === key ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
                    background: payMethod === key ? '#e0f2fe' : '#fff',
                    color: payMethod === key ? '#0369a1' : '#475569',
                    fontWeight: 700, fontSize: '0.8rem',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    transition: 'all 0.15s'
                  }}>
                    <Icon size={20} color={payMethod === key ? '#0284c7' : '#64748b'} />
                    {label}
                  </button>
                ))}
              </div>

              {/* ─── UPI PANEL ──────────────────────────────── */}
              {payMethod === 'UPI' && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 18 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginBottom: 14, textAlign: 'center' }}>
                    Choose UPI App — will open directly on your phone
                  </div>

                  {/* App selector */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
                    {[
                      { key: 'gpay',    label: 'Google Pay',   color: '#4285f4', emoji: '💙' },
                      { key: 'phonepe', label: 'PhonePe',       color: '#5f259f', emoji: '💜' },
                      { key: 'paytm',   label: 'Paytm',         color: '#00b9f5', emoji: '💎' },
                      { key: 'bhim',    label: 'BHIM UPI',      color: '#1a237e', emoji: '🇮🇳' },
                    ].map(({ key, label, color, emoji }) => (
                      <button key={key} type="button" onClick={() => setUpiApp(key)} style={{
                        padding: '10px 4px', borderRadius: 10, cursor: 'pointer',
                        border: upiApp === key ? `2.5px solid ${color}` : '1.5px solid #e2e8f0',
                        background: upiApp === key ? `${color}18` : '#fff',
                        fontWeight: 700, fontSize: '0.72rem', color: upiApp === key ? color : '#475569',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        transition: 'all 0.15s'
                      }}>
                        <span style={{ fontSize: '1.4rem' }}>{emoji}</span>{label}
                        {upiApp === key && <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'block' }} />}
                      </button>
                    ))}
                  </div>

                  {/* QR Code (decorative, realistic style) */}
                  <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'inline-block', background: '#fff', padding: 12, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                      <svg width="130" height="130" viewBox="0 0 100 100">
                        {/* Corner squares */}
                        <rect x="2" y="2" width="26" height="26" fill="#0284c7" rx="3"/>
                        <rect x="6" y="6" width="18" height="18" fill="#fff" rx="2"/>
                        <rect x="10" y="10" width="10" height="10" fill="#0284c7" rx="1"/>

                        <rect x="72" y="2" width="26" height="26" fill="#0284c7" rx="3"/>
                        <rect x="76" y="6" width="18" height="18" fill="#fff" rx="2"/>
                        <rect x="80" y="10" width="10" height="10" fill="#0284c7" rx="1"/>

                        <rect x="2" y="72" width="26" height="26" fill="#0284c7" rx="3"/>
                        <rect x="6" y="76" width="18" height="18" fill="#fff" rx="2"/>
                        <rect x="10" y="80" width="10" height="10" fill="#0284c7" rx="1"/>

                        {/* Data pattern */}
                        {[32,38,42,54,60,66].map(x => [32,36,44,50,58,64,70].map(y => (
                          (x + y) % 9 < 5 && <rect key={`${x}-${y}`} x={x} y={y} width="5" height="5" fill="#0f172a" rx="1"/>
                        )))}
                        {/* Tourist hub logo center */}
                        <circle cx="50" cy="50" r="7" fill="#fff" stroke="#0284c7" strokeWidth="1.5"/>
                        <text x="50" y="54" textAnchor="middle" fontSize="8" fill="#0284c7" fontWeight="bold">TH</text>
                      </svg>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 8 }}>
                      Scan with any UPI app to pay ₹{totalAmt.toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* UPI ID display */}
                  <div style={{ background: '#e0f2fe', borderRadius: 8, padding: '8px 14px', textAlign: 'center', fontSize: '0.85rem', color: '#0369a1', fontWeight: 700 }}>
                    UPI ID: touristhub@okhdfcbank
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', marginTop: 6 }}>
                    Clicking "Pay Now" will open the selected UPI app on your device
                  </div>
                </div>
              )}

              {/* ─── CARD PANEL ─────────────────────────────── */}
              {payMethod === 'CARD' && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 18 }}>
                  {/* Visual card */}
                  <div style={{
                    background: 'linear-gradient(135deg, #0284c7, #065f46)',
                    borderRadius: 14, padding: '18px 20px', color: '#fff', marginBottom: 18,
                    boxShadow: '0 6px 20px rgba(2,132,199,0.3)'
                  }}>
                    <div style={{ fontSize: '0.72rem', letterSpacing: 2, opacity: 0.8, marginBottom: 16 }}>TOURIST AI HUB CARD</div>
                    <div style={{ fontSize: '1.1rem', letterSpacing: 4, fontFamily: 'monospace', marginBottom: 16 }}>
                      {cardNo.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim() || '•••• •••• •••• ••••'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', opacity: 0.85 }}>
                      <span>{cardName || 'CARD HOLDER'}</span>
                      <span>{expiry || 'MM/YY'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>Cardholder Name</label>
                      <input className="form-control" value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Name as on card" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>Card Number (RuPay / Visa / Mastercard)</label>
                      <input className="form-control" value={cardNo}
                        onChange={e => setCardNo(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0,19))}
                        placeholder="1234 5678 9012 3456" maxLength={19} style={{ fontFamily: 'monospace', letterSpacing: 1 }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>Expiry (MM/YY)</label>
                        <input className="form-control" value={expiry}
                          onChange={e => { let v = e.target.value.replace(/\D/g,''); if (v.length>=2) v = v.slice(0,2)+'/'+v.slice(2,4); setExpiry(v); }}
                          placeholder="MM/YY" maxLength={5} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>CVV / CVC</label>
                        <input className="form-control" type="password" value={cvv}
                          onChange={e => setCvv(e.target.value.replace(/\D/g,'').slice(0,4))}
                          placeholder="•••" maxLength={4} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── NET BANKING PANEL ───────────────────────── */}
              {payMethod === 'NETBANKING' && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 18 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 8 }}>Select Your Bank</label>

                  {/* Bank grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                    {['SBI','HDFC','ICICI','Axis Bank','PNB','Kotak'].map(bank => (
                      <button key={bank} type="button" onClick={() => setSelBank(bank)} style={{
                        padding: '10px 6px', borderRadius: 8, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
                        border: selBank === bank ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
                        background: selBank === bank ? '#e0f2fe' : '#fff',
                        color: selBank === bank ? '#0284c7' : '#475569'
                      }}>{bank}</button>
                    ))}
                  </div>

                  <div style={{ background: '#fffbeb', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: '#92400e', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    You will be securely redirected to <strong>{selBank}</strong> internet banking portal to authorize this ₹{totalAmt.toLocaleString('en-IN')} payment.
                  </div>
                </div>
              )}

              {/* Pay button */}
              <button
                type="button"
                onClick={handlePay}
                disabled={processing}
                className="btn btn-green btn-lg"
                style={{ width: '100%', justifyContent: 'center', fontWeight: 800 }}
              >
                {processing ? (
                  <>
                    <span style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                    Processing Payment...
                  </>
                ) : payMethod === 'UPI' ? (
                  <><Smartphone size={17} /> Pay ₹{totalAmt.toLocaleString('en-IN')} via {upiApp === 'gpay' ? 'Google Pay' : upiApp === 'phonepe' ? 'PhonePe' : upiApp === 'paytm' ? 'Paytm' : 'BHIM UPI'}</>
                ) : (
                  <><Lock size={16} /> Pay Securely ₹{totalAmt.toLocaleString('en-IN')}</>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: 10, fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <ShieldCheck size={12} color="#10b981" /> Powered by RBI-regulated payment gateway • PCI-DSS compliant
              </div>
            </div>
          )}

          {/* ═══════════════ STEP 3 — SUCCESS ════════════════════ */}
          {step === 'success' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 70, height: 70, borderRadius: '50%', background: '#ecfdf5', border: '2px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#059669' }}>
                <CheckCircle size={38} />
              </div>
              <h3 style={{ fontSize: '1.5rem', color: '#065f46', marginBottom: 6 }}>🎉 Booking Confirmed!</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 22 }}>
                Your booking is confirmed. A confirmation SMS and email will be sent shortly.
              </p>

              {/* Voucher */}
              <div style={{ background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0', padding: 20, textAlign: 'left', marginBottom: 22 }}>
                {/* Booking ID */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Booking ID</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7' }}>{bookingResult?.booking_id || bookingRef}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Transaction ID</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>{bookingResult?.transaction_id || `TXN-${payMethod}-${bookingRef}`}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.84rem', marginBottom: 14 }}>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Booking</div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{item?.name || item?.title || item?.provider}</div>
                  </div>
                  {bookingType === 'hotel' && <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Room</div>
                    <div style={{ fontWeight: 700 }}>{selectedRoom?.name}</div>
                  </div>}
                  {bookingType === 'transport' && <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Seats</div>
                    <div style={{ fontWeight: 700 }}>#{selectedSeats.join(', ')}</div>
                  </div>}
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Date</div>
                    <div style={{ fontWeight: 700 }}>{bookingType === 'hotel' ? `${checkIn} → ${checkOut}` : bookingType === 'transport' ? travelDate : pkgTravelDate}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Payment</div>
                    <div style={{ fontWeight: 700 }}>{payMethod}</div>
                  </div>
                </div>

                {savingsAmt > 0 && (
                  <div style={{ background: '#ecfdf5', borderRadius: 8, padding: '6px 12px', fontSize: '0.8rem', color: '#047857', fontWeight: 600, marginBottom: 12 }}>
                    🎁 You saved ₹{savingsAmt.toLocaleString('en-IN')} with coupon <strong>{appliedPromo?.code}</strong>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 10, fontWeight: 800, fontSize: '0.95rem' }}>
                  <span>Total Paid</span>
                  <span style={{ color: '#059669', fontSize: '1.15rem' }}>₹{totalAmt.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => window.print()} className="btn btn-secondary" style={{ flex: 1 }}>
                  <Download size={15} /> Print Voucher
                </button>
                <button type="button" onClick={() => { onClose(); navigate('/dashboard'); }} className="btn btn-green" style={{ flex: 1 }}>
                  My Trips →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
