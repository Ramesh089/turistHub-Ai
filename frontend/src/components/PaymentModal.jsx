import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  X,
  ShieldCheck,
  CheckCircle,
  IndianRupee,
  Calendar,
  Users,
  Tag,
  CreditCard,
  QrCode,
  Building2,
  Lock,
  ArrowRight,
  Download,
  Sparkles,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function PaymentModal({ pkg, initialPlan = null, onClose, onBookingComplete }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Wizard Steps: 'customize' -> 'gateway' -> 'success'
  const [step, setStep] = useState('customize');

  // Booking Parameters
  const [travelDate, setTravelDate] = useState(
    initialPlan?.travel_date || new Date().toISOString().split('T')[0]
  );
  const [peopleCount, setPeopleCount] = useState(initialPlan?.people || 2);
  const [specialRequests, setSpecialRequests] = useState('');

  // Discount Engine
  const [couponCode, setCouponCode] = useState(initialPlan ? 'AIPLAN1500' : '');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Payment Gateway State
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI', 'CARD', 'NETBANKING'
  const [upiId, setUpiId] = useState('traveler@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8921');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('782');
  const [cardName, setCardName] = useState(user?.name || 'Aarav Sharma');
  const [selectedBank, setSelectedBank] = useState('State Bank of India (SBI)');
  const [processing, setProcessing] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [countdown, setCountdown] = useState(899); // 15:00 minutes

  // Auto-apply initial discount if booked from AI planner
  useEffect(() => {
    if (initialPlan) {
      applyPromo('AIPLAN1500');
    }
  }, [pkg, peopleCount]);

  // Session timer for realistic gateway feel
  useEffect(() => {
    if (step === 'gateway' && countdown > 0) {
      const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, countdown]);

  const basePrice = pkg?.price ? Number(pkg.price) : 9999;
  const subtotal = basePrice * peopleCount;
  const gstTax = Math.round((subtotal - discountAmount) * 0.05); // 5% GST on Indian tour packages
  const finalPayable = Math.max(subtotal - discountAmount + gstTax, 0);

  const applyPromo = async (codeToApply) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) return;

    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await api.post('/bookings/apply-coupon', {
        code,
        amount: subtotal
      });
      if (res.data.success) {
        setDiscountAmount(res.data.discount);
        setAppliedCoupon({
          code: res.data.code,
          discount: res.data.discount,
          desc: res.data.description
        });
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code.');
    } finally {
      setCouponLoading(false);
    }
  };

  const removePromo = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode('');
    setCouponError(null);
  };

  const handleProceedToGateway = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login?redirect=packages');
      return;
    }
    setStep('gateway');
  };

  const handleCompletePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Simulate real-world 1.5s bank gateway network processing
      await new Promise((r) => setTimeout(r, 1400));

      const res = await api.post('/bookings', {
        package_id: pkg?.id || null,
        travel_date: travelDate,
        people_count: peopleCount,
        total_amount: finalPayable,
        discount_amount: discountAmount,
        discount_code: appliedCoupon?.code || null,
        payment_method: paymentMethod,
        special_requests: specialRequests
      });

      if (res.data.success) {
        setBookingResult(res.data);
        setStep('success');
        if (onBookingComplete) onBookingComplete(res.data);
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      alert('Payment processing error. Please retry.');
    } finally {
      setProcessing(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '640px', padding: '0', overflow: 'hidden' }}>
        {/* Modal Top Bar */}
        <div style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '3px solid #10b981'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: '700', fontFamily: 'var(--font-serif)' }}>
                {step === 'gateway' ? 'Secure Payment Gateway' : step === 'success' ? 'Booking Confirmed' : 'Package Reservation & Discounts'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#e0f2fe' }}>
                Tourist AI Hub • Official Incredible India Partner
              </div>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e0f2fe', cursor: 'pointer', padding: '4px' }}>
            <X size={22} />
          </button>
        </div>

        <div style={{ padding: '26px' }}>
          {/* STEP 1: CUSTOMIZE PACKAGE & APPLY DISCOUNTS */}
          {step === 'customize' && (
            <form onSubmit={handleProceedToGateway}>
              <div style={{ marginBottom: '20px' }}>
                <span className="badge badge-sky">{pkg?.duration_days} Days / {pkg?.duration_nights || (pkg?.duration_days - 1)} Nights</span>
                <h3 style={{ fontSize: '1.35rem', marginTop: '6px', color: 'var(--dark)' }}>{pkg?.title}</h3>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Operated by <strong style={{ color: '#0369a1' }}>{pkg?.company_name}</strong></div>
              </div>

              {/* Inclusions summary */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px', fontSize: '0.78rem' }}>
                <span style={{ background: '#f0f9ff', padding: '4px 10px', borderRadius: '6px', border: '1px solid #bae6fd', color: '#0369a1' }}>🏨 {pkg?.hotel_type || 'Heritage Resort'}</span>
                <span style={{ background: '#f0f9ff', padding: '4px 10px', borderRadius: '6px', border: '1px solid #bae6fd', color: '#0369a1' }}>🚗 {pkg?.transport_type || 'AC Private Cab'}</span>
                <span style={{ background: '#ecfdf5', padding: '4px 10px', borderRadius: '6px', border: '1px solid #a7f3d0', color: '#047857' }}>🍽️ Traditional Meals Included</span>
                <span style={{ background: '#ecfdf5', padding: '4px 10px', borderRadius: '6px', border: '1px solid #a7f3d0', color: '#047857' }}>🧭 Certified Guide</span>
              </div>

              {/* Date & Guests */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', color: '#0369a1' }}>Travel Date</label>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', color: '#0369a1' }}>Number of Travelers</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={peopleCount}
                    onChange={(e) => setPeopleCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              {/* Special Requests */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontSize: '0.82rem', color: '#0369a1' }}>Special Requests (Dietary, Heritage Room, Pickup)</label>
                <input
                  type="text"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="e.g. Pure vegetarian meal plan, airport pickup..."
                  className="form-control"
                />
              </div>

              {/* PROMO & DISCOUNT SECTION */}
              <div style={{ background: '#ecfdf5', border: '1px dashed #10b981', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '700', color: '#065f46', marginBottom: '8px' }}>
                  <Tag size={16} color="#10b981" /> Exclusive Discounts & Promo Codes
                </div>

                {appliedCoupon ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#d1fae5', padding: '8px 12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#065f46', fontWeight: '600' }}>
                      ✓ Applied <strong>{appliedCoupon.code}</strong> (-₹{appliedCoupon.discount.toLocaleString('en-IN')})
                    </div>
                    <button type="button" onClick={removePromo} style={{ background: 'none', border: 'none', color: '#b91c1c', fontSize: '0.78rem', cursor: 'pointer', fontWeight: '700' }}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <input
                        type="text"
                        placeholder="Enter coupon code (e.g. NAMASTE10)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="form-control"
                        style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => applyPromo()}
                        disabled={couponLoading || !couponCode}
                        className="btn btn-secondary btn-sm"
                        style={{ flexShrink: 0 }}
                      >
                        {couponLoading ? 'Checking...' : 'Apply Code'}
                      </button>
                    </div>

                    {/* Quick Apply Promo Chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => applyPromo('NAMASTE10')}
                        style={{ fontSize: '0.72rem', background: '#ffffff', border: '1px solid #10b981', padding: '3px 8px', borderRadius: '20px', cursor: 'pointer', color: '#065f46', fontWeight: '600' }}
                      >
                        🎁 <strong>NAMASTE10</strong> (10% Off)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPromo('AIPLAN1500')}
                        style={{ fontSize: '0.72rem', background: '#ffffff', border: '1px solid #10b981', padding: '3px 8px', borderRadius: '20px', cursor: 'pointer', color: '#065f46', fontWeight: '600' }}
                      >
                        ⚡ <strong>AIPLAN1500</strong> (₹1,500 Off)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPromo('INCREDIBLE2026')}
                        style={{ fontSize: '0.72rem', background: '#ffffff', border: '1px solid #10b981', padding: '3px 8px', borderRadius: '20px', cursor: 'pointer', color: '#065f46', fontWeight: '600' }}
                      >
                        🌟 <strong>INCREDIBLE2026</strong> (₹2,000 Off)
                      </button>
                    </div>
                  </div>
                )}

                {couponError && (
                  <div style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: '6px' }}>
                    {couponError}
                  </div>
                )}
              </div>

              {/* Price Calculation Card */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid rgba(2, 132, 199, 0.15)', marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#64748b', marginBottom: '6px' }}>
                  <span>Base Fare (₹{basePrice.toLocaleString('en-IN')} &times; {peopleCount} travelers):</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#059669', fontWeight: '700', marginBottom: '6px' }}>
                    <span>Special Tourist Discount:</span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#64748b', marginBottom: '10px' }}>
                  <span>GST & Tourism Maintenance (5%):</span>
                  <span>+₹{gstTax.toLocaleString('en-IN')}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid rgba(2, 132, 199, 0.15)', paddingTop: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Net Total Payable</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0284c7', display: 'flex', alignItems: 'center' }}>
                      <IndianRupee size={20} />
                      <span>{finalPayable.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: '700', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '20px' }}>
                    All Inclusions Guaranteed
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-green btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Proceed to Payment Gateway <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* STEP 2: REALISTIC PAYMENT GATEWAY (UPI, CARDS, NETBANKING) */}
          {step === 'gateway' && (
            <div className="animate-fade-in">
              {/* Gateway Countdown & Security Banner */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '8px', marginBottom: '18px', fontSize: '0.82rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: '600' }}>
                  <Lock size={14} /> 256-Bit Bank Grade SSL Encryption
                </span>
                <span style={{ color: '#047857', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} /> Session: {formatTime(countdown)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Paying for: {pkg?.title}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0284c7' }}>
                    ₹{finalPayable.toLocaleString('en-IN')}
                  </div>
                </div>
                <button type="button" onClick={() => setStep('customize')} style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '700' }}>
                  Modify Plan &larr;
                </button>
              </div>

              {/* Payment Method Selector Tabs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '10px',
                    border: paymentMethod === 'UPI' ? '2px solid #0284c7' : '1px solid rgba(2, 132, 199, 0.2)',
                    background: paymentMethod === 'UPI' ? '#e0f2fe' : '#ffffff',
                    color: paymentMethod === 'UPI' ? '#0369a1' : '#334155',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <QrCode size={20} color={paymentMethod === 'UPI' ? '#0284c7' : '#64748b'} /> UPI / QR
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '10px',
                    border: paymentMethod === 'CARD' ? '2px solid #0284c7' : '1px solid rgba(2, 132, 199, 0.2)',
                    background: paymentMethod === 'CARD' ? '#e0f2fe' : '#ffffff',
                    color: paymentMethod === 'CARD' ? '#0369a1' : '#334155',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <CreditCard size={20} color={paymentMethod === 'CARD' ? '#0284c7' : '#64748b'} /> RuPay / Cards
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('NETBANKING')}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '10px',
                    border: paymentMethod === 'NETBANKING' ? '2px solid #0284c7' : '1px solid rgba(2, 132, 199, 0.2)',
                    background: paymentMethod === 'NETBANKING' ? '#e0f2fe' : '#ffffff',
                    color: paymentMethod === 'NETBANKING' ? '#0369a1' : '#334155',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Building2 size={20} color={paymentMethod === 'NETBANKING' ? '#0284c7' : '#64748b'} /> Net Banking
                </button>
              </div>

              {/* METHOD 1: UPI / QR CODE */}
              {paymentMethod === 'UPI' && (
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid rgba(2, 132, 199, 0.15)', textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: '700', marginBottom: '12px', color: 'var(--dark)' }}>
                    Scan QR with Google Pay, PhonePe, Paytm, or BHIM
                  </div>

                  <div style={{
                    width: '170px',
                    height: '170px',
                    background: '#ffffff',
                    padding: '10px',
                    borderRadius: '12px',
                    margin: '0 auto 14px auto',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(2, 132, 199, 0.2)'
                  }}>
                    <svg width="150" height="150" viewBox="0 0 100 100" fill="#0f172a">
                      <rect x="0" y="0" width="30" height="30" fill="#0284c7" />
                      <rect x="5" y="5" width="20" height="20" fill="#ffffff" />
                      <rect x="10" y="10" width="10" height="10" fill="#0284c7" />

                      <rect x="70" y="0" width="30" height="30" fill="#0284c7" />
                      <rect x="75" y="5" width="20" height="20" fill="#ffffff" />
                      <rect x="80" y="10" width="10" height="10" fill="#0284c7" />

                      <rect x="0" y="70" width="30" height="30" fill="#0284c7" />
                      <rect x="5" y="75" width="20" height="20" fill="#ffffff" />
                      <rect x="10" y="80" width="10" height="10" fill="#0284c7" />

                      <rect x="36" y="10" width="6" height="6" />
                      <rect x="48" y="14" width="8" height="6" />
                      <rect x="40" y="24" width="16" height="8" />
                      <rect x="10" y="40" width="8" height="16" />
                      <rect x="25" y="45" width="10" height="10" />
                      <rect x="45" y="45" width="10" height="10" fill="#10b981" />
                      <rect x="65" y="40" width="12" height="18" />
                      <rect x="85" y="45" width="8" height="8" />
                      <rect x="40" y="68" width="16" height="8" />
                      <rect x="68" y="70" width="22" height="8" />
                      <rect x="68" y="84" width="10" height="10" />
                      <rect x="84" y="84" width="10" height="10" />
                    </svg>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '14px' }}>
                    Or enter Virtual Payment Address (VPA) / UPI ID:
                  </div>

                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="form-control"
                    placeholder="e.g. mobile@upi, name@okhdfcbank"
                    style={{ textAlign: 'center', fontWeight: '600' }}
                  />
                </div>
              )}

              {/* METHOD 2: RUPAY / DEBIT / CREDIT CARDS */}
              {paymentMethod === 'CARD' && (
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid rgba(2, 132, 199, 0.15)', marginBottom: '20px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem', color: '#0369a1' }}>Cardholder Name</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem', color: '#0369a1' }}>Card Number (RuPay, Visa, Mastercard)</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="form-control"
                      placeholder="4532 0000 0000 0000"
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.82rem', color: '#0369a1' }}>Valid Thru (MM/YY)</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="form-control"
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.82rem', color: '#0369a1' }}>CVV</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="form-control"
                        placeholder="•••"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* METHOD 3: NET BANKING */}
              {paymentMethod === 'NETBANKING' && (
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid rgba(2, 132, 199, 0.15)', marginBottom: '20px' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', color: '#0369a1' }}>Select Bank</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="form-control"
                    style={{ marginBottom: '16px' }}
                  >
                    <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Punjab National Bank (PNB)">Punjab National Bank (PNB)</option>
                    <option value="Bank of Baroda">Bank of Baroda</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  </select>
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    You will be securely redirected to your bank portal to authorize this ₹{finalPayable.toLocaleString('en-IN')} payment.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleCompletePayment}
                disabled={processing}
                className="btn btn-green btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {processing ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                    Communicating with Gateway...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                    <Lock size={16} /> Pay Securely ₹{finalPayable.toLocaleString('en-IN')}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* STEP 3: SUCCESSFUL BOOKING RECEIPT */}
          {step === 'success' && (
            <div className="animate-fade-in" style={{ textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', border: '2px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#059669' }}>
                <CheckCircle size={36} />
              </div>

              <h3 style={{ fontSize: '1.5rem', color: '#065f46', marginBottom: '6px' }}>Payment Successful!</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '20px' }}>
                Your booking has been confirmed by Incredible India Tour Desk.
              </p>

              {/* Official Voucher Card */}
              <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid rgba(2, 132, 199, 0.2)', padding: '20px', textAlign: 'left', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(2, 132, 199, 0.15)', paddingBottom: '12px', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Booking ID</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0284c7' }}>
                      {bookingResult?.booking_id || 'BK-78912'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Bank Reference</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>
                      {bookingResult?.transaction_id || 'TXN-UPI-9941258'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginBottom: '14px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Package:</span>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{pkg?.title}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Travel Date:</span>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{travelDate}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Travelers:</span>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{peopleCount} Persons</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Paid Method:</span>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{paymentMethod}</div>
                  </div>
                </div>

                {discountAmount > 0 && (
                  <div style={{ background: '#ecfdf5', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', color: '#047857', fontWeight: '600', marginBottom: '12px' }}>
                    🎉 Coupon Discount Applied: ₹{discountAmount.toLocaleString('en-IN')} off
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(2, 132, 199, 0.15)', paddingTop: '10px', fontSize: '0.92rem', fontWeight: '800' }}>
                  <span>Total Amount Paid:</span>
                  <span style={{ color: '#059669', fontSize: '1.2rem' }}>₹{finalPayable.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  <Download size={16} /> Print Voucher
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/dashboard');
                  }}
                  className="btn btn-green"
                  style={{ flex: 1 }}
                >
                  View My Trips &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
