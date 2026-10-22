import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import UnifiedPaymentModal from './UnifiedPaymentModal';
import TicketModal from './TicketModal';
import {
  X,
  Train,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Users,
  Tag,
  ChevronRight,
  Info
} from 'lucide-react';

export default function TrainBookingModal({
  train,
  initialDate,
  onClose,
  onComplete
}) {
  const { user } = useAuth();

  // Step state: 'select' -> 'passengers' -> 'payment' -> 'ticket'
  const [step, setStep] = useState('select');
  const [travelDate, setTravelDate] = useState(
    initialDate || new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );

  // Coach Classes from train data or fallback
  const coachClasses = train.class_options && train.class_options.length > 0
    ? train.class_options
    : [
        { code: 'CC', name: 'AC Chair Car', fare: train.price || 650, available: 42, description: 'Comfortable air-conditioned recliner seating with large viewing window.' },
        { code: 'EC', name: 'Executive Chair Car', fare: (train.price || 650) * 1.8, available: 16, description: 'Spacious 2+2 luxury rotatable seating with complimentary catering.' }
      ];

  const [selectedClass, setSelectedClass] = useState(coachClasses[0]);

  // Seat map state fetched from backend
  const [bookedSeats, setBookedSeats] = useState([]);
  const [heldSeats, setHeldSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Passenger details
  const [passengers, setPassengers] = useState([]);
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '9876543210');

  // Coupon & Fare
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Completed booking data
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch seats from backend when train or date changes
  useEffect(() => {
    let isMounted = true;
    async function fetchSeatStatus() {
      setLoadingSeats(true);
      try {
        const res = await api.get(`/transport/${train.id}/seats?travel_date=${travelDate}`);
        if (isMounted && res.data.success) {
          setBookedSeats(res.data.booked_seats || []);
          setHeldSeats(res.data.held_seats || []);
        }
      } catch (err) {
        console.error('Failed to load seats:', err);
      } finally {
        if (isMounted) setLoadingSeats(false);
      }
    }
    fetchSeatStatus();
    return () => {
      isMounted = false;
    };
  }, [train.id, travelDate]);

  // Sync passenger form whenever selectedSeats changes
  useEffect(() => {
    setPassengers((prev) => {
      return selectedSeats.map((seatNum, idx) => {
        const existing = prev[idx];
        return (
          existing || {
            name: idx === 0 && user?.name ? user.name : '',
            age: '',
            gender: 'Male',
            berth_pref: 'No Preference',
            food_pref: 'Veg',
            seat: `Seat ${seatNum}`
          }
        );
      });
    });
  }, [selectedSeats, user?.name]);

  const toggleSeat = (seatNum) => {
    const seatStr = String(seatNum);
    if (bookedSeats.includes(seatStr) || heldSeats.includes(seatStr)) return;

    if (selectedSeats.includes(seatStr)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatStr));
    } else {
      if (selectedSeats.length >= 6) {
        alert('You can select a maximum of 6 seats per booking.');
        return;
      }
      setSelectedSeats([...selectedSeats, seatStr]);
    }
  };

  // Pricing calculations
  const perSeatFare = Number(selectedClass.fare || train.price || 500);
  const baseFare = perSeatFare * selectedSeats.length;
  const gst = Math.round(baseFare * 0.05); // 5% GST for train
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const totalAmount = Math.max(0, baseFare + gst - discount);

  // Apply Coupon
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

  const handlePassengerChange = (index, field, value) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const handleProceedToPayment = () => {
    // Validate passengers
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
      alert('Please provide contact email and mobile number for e-ticket delivery.');
      return;
    }
    setStep('payment');
  };

  // Called when payment succeeds
  const handlePaymentApproved = async (paymentDetails) => {
    setSubmitting(true);
    setErrorMsg('');
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
        coach_class: selectedClass.code || selectedClass.name,
        payment_method: paymentDetails.payment_method,
        transaction_id: paymentDetails.transaction_id,
        discount_code: appliedCoupon ? appliedCoupon.code : null,
        discount_amount: discount
      };

      const res = await api.post(`/transport/${train.id}/book`, payload);

      if (res.data.success) {
        const ticketData = {
          ...train,
          booking_id: res.data.booking_id,
          booking_reference: res.data.booking_reference,
          travel_date: travelDate,
          total_amount: res.data.total_amount || totalAmount,
          payment_method: paymentDetails.payment_method,
          transaction_id: paymentDetails.transaction_id,
          booking_details: {
            coach_class: `${selectedClass.name} (${selectedClass.code})`,
            seats: selectedSeats,
            passengers: passengers.map((p, i) => ({
              ...p,
              seat: `Coach C2 • ${selectedSeats[i]}`
            })),
            contact_email: contactEmail,
            contact_phone: contactPhone
          }
        };
        setConfirmedBooking(ticketData);
        setStep('ticket');
        if (onComplete) onComplete(ticketData);
      } else {
        alert(res.data.message || 'Seat booking failed. Please try again.');
        setStep('select');
      }
    } catch (err) {
      console.error('Booking error:', err);
      const msg = err.response?.data?.message || 'Server error while booking seats. Some seats may have already been booked.';
      setErrorMsg(msg);
      alert(msg);
      setStep('select');
    } finally {
      setSubmitting(false);
    }
  };

  // Generate 50 train seats (10 rows x 5 seats: 2 on left, aisle, 3 on right)
  const totalRows = 10;

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
            background: 'linear-gradient(135deg, #1e3a8a 0%, #0369a1 100%)',
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
              <Train size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#f59e0b', color: '#78350f', padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 800 }}>
                  TRAIN #{train.service_number || '12002'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#bae6fd' }}>IRCTC Verified Express</span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '2px 0 0', color: '#fff' }}>
                {train.provider}
              </h2>
              <div style={{ fontSize: '0.82rem', color: '#e0f2fe', marginTop: 2 }}>
                {train.from_city} &rarr; {train.to_city} • Dep: <strong>{train.departure_time}</strong> | Arr: <strong>{train.arrival_time}</strong> ({train.duration})
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
              {/* Row 1: Date & Coach Class selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 20 }}>
                {/* Date Picker */}
                <div style={{ background: '#fff', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Calendar size={14} color="#0284c7" /> Journey Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#0f172a'
                    }}
                  />
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 6 }}>
                    Booked seats are synchronized in real-time for this date.
                  </div>
                </div>

                {/* Coach Class Cards */}
                <div style={{ display: 'flex', gap: 10 }}>
                  {coachClasses.map((c) => (
                    <div
                      key={c.code}
                      onClick={() => setSelectedClass(c)}
                      style={{
                        flex: 1,
                        background: selectedClass.code === c.code ? '#eff6ff' : '#ffffff',
                        border: selectedClass.code === c.code ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: '12px 14px',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>{c.code}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 12 }}>
                          {c.available || 35} Avail
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', margin: '4px 0 6px', fontWeight: 600 }}>
                        {c.name}
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7', display: 'flex', alignItems: 'center' }}>
                        <IndianRupee size={15} />{Number(c.fare).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 2: Interactive Seat Layout + Legend */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 16,
                  padding: 20,
                  border: '1px solid #e2e8f0',
                  marginBottom: 20
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Select Your Train Seats — Coach C2
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      2 + 3 Air-Conditioned Coach Layout • Window & Aisle Configuration
                    </div>
                  </div>

                  {/* Seat Status Legend */}
                  <div style={{ display: 'flex', gap: 14, fontSize: '0.75rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 14, height: 14, borderRadius: 3, background: '#e0f2fe', border: '1.5px solid #0284c7' }} />
                      <span style={{ color: '#0369a1' }}>Available</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 14, height: 14, borderRadius: 3, background: '#0284c7', border: '1.5px solid #0284c7' }} />
                      <span style={{ color: '#0284c7' }}>Selected</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 14, height: 14, borderRadius: 3, background: '#fee2e2', border: '1.5px solid #ef4444' }} />
                      <span style={{ color: '#dc2626' }}>Confirmed Booked</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 14, height: 14, borderRadius: 3, background: '#ffedd5', border: '1.5px solid #f97316' }} />
                      <span style={{ color: '#ea580c' }}>Held</span>
                    </div>
                  </div>
                </div>

                {loadingSeats ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#0284c7' }}>
                    Loading real-time coach availability...
                  </div>
                ) : (
                  <div>
                    <div style={{ textAlign: 'center', fontSize: '0.72rem', letterSpacing: 2, color: '#94a3b8', marginBottom: 12 }}>
                      ▲ TOWARDS ENGINE / LOCOMOTIVE ▲
                    </div>

                    {/* Seat Grid: 10 rows. Left side: 2 seats. Center: Aisle. Right side: 3 seats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                      {Array.from({ length: totalRows }, (_, r) => {
                        const s1 = String(r * 5 + 1);
                        const s2 = String(r * 5 + 2);
                        const s3 = String(r * 5 + 3);
                        const s4 = String(r * 5 + 4);
                        const s5 = String(r * 5 + 5);

                        const renderSeat = (seatNum, berthType) => {
                          const isBooked = bookedSeats.includes(seatNum);
                          const isHeld = heldSeats.includes(seatNum);
                          const isSelected = selectedSeats.includes(seatNum);

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
                              key={seatNum}
                              type="button"
                              disabled={isBooked || isHeld}
                              onClick={() => toggleSeat(seatNum)}
                              title={
                                isBooked
                                  ? `Seat ${seatNum} is already booked`
                                  : isHeld
                                  ? `Seat ${seatNum} is temporarily held`
                                  : `Seat ${seatNum} (${berthType}) - ₹${perSeatFare}`
                              }
                              style={{
                                width: 38,
                                height: 38,
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
                              <span>{seatNum}</span>
                              <span style={{ fontSize: '0.55rem', opacity: 0.8, textTransform: 'uppercase' }}>
                                {berthType}
                              </span>
                            </button>
                          );
                        };

                        return (
                          <div key={r} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ width: 20, fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                              R{r + 1}
                            </span>
                            {/* Left Side (Window + Aisle) */}
                            <div style={{ display: 'flex', gap: 6 }}>
                              {renderSeat(s1, 'W')}
                              {renderSeat(s2, 'A')}
                            </div>

                            {/* Walking Aisle */}
                            <div
                              style={{
                                width: 32,
                                height: 38,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#cbd5e1',
                                fontSize: '0.65rem',
                                fontWeight: 600
                              }}
                            >
                              AISLE
                            </div>

                            {/* Right Side (Aisle + Middle + Window) */}
                            <div style={{ display: 'flex', gap: 6 }}>
                              {renderSeat(s3, 'A')}
                              {renderSeat(s4, 'M')}
                              {renderSeat(s5, 'W')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Selection summary bar */}
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
                    {selectedSeats.length > 0 ? selectedSeats.map((s) => `Seat ${s}`).join(', ') : 'None selected yet'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Estimated Base Fare</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <IndianRupee size={16} />{baseFare.toLocaleString('en-IN')}
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
                    IRCTC requires valid passenger identities matching government IDs.
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
                  &larr; Back to Seat Map
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
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0284c7' }}>
                        Passenger {idx + 1} — Assigned to Seat {selectedSeats[idx]}
                      </span>
                      <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                        Coach C2 • Window/Aisle
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={p.name}
                          onChange={(e) => handlePassengerChange(idx, 'name', e.target.value)}
                          placeholder="e.g. Rahul Sharma"
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
                          onChange={(e) => handlePassengerChange(idx, 'age', e.target.value)}
                          placeholder="30"
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
                          onChange={(e) => handlePassengerChange(idx, 'gender', e.target.value)}
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
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                          Food Preference
                        </label>
                        <select
                          value={p.food_pref}
                          onChange={(e) => handlePassengerChange(idx, 'food_pref', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 6,
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.85rem'
                          }}
                        >
                          <option value="Veg">Vegetarian Meal</option>
                          <option value="Non-Veg">Non-Veg Meal</option>
                          <option value="Jain">Jain Meal</option>
                          <option value="No Food">No Food</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact Info & Fare Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
                {/* Contact form */}
                <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
                    E-Ticket Contact Details
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                        Email (for E-Ticket PDF)
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
                        Mobile Phone (for SMS / WhatsApp updates)
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
                      Have a Promo Coupon?
                    </label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="NAMASTE10 or AIPLAN1500"
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
                      Fare Breakdown
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem', color: '#475569' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Base Fare ({selectedSeats.length} x ₹{perSeatFare})</span>
                        <strong style={{ color: '#0f172a' }}>₹{baseFare.toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>GST & IRCTC Service Charge (5%)</span>
                        <strong style={{ color: '#0f172a' }}>₹{gst.toLocaleString('en-IN')}</strong>
                      </div>
                      {appliedCoupon && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                          <span>Promo Discount ({appliedCoupon.code})</span>
                          <strong>-₹{discount.toLocaleString('en-IN')}</strong>
                        </div>
                      )}
                      <div style={{ borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800, color: '#0284c7' }}>
                        <span>Net Amount</span>
                        <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: 12, fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Info size={13} color="#0284c7" /> Cancellation Policy: Full refund up to 24 hrs prior to journey.
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
              serviceTitle={`${train.provider} (Coach ${selectedClass.code})`}
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
