import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  X,
  ShieldCheck,
  Shield,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  XCircle,
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
  Printer,
  Receipt,
  Copy,
  Check,
  Clock,
  Hotel,
  Bus,
  Package,
  ChevronLeft,
  Wifi,
  Coffee,
  Utensils,
  Wind,
  Star,
  MapPin,
  Gift,
  RotateCcw
} from 'lucide-react';

// ─── Available promotional discount codes ─────────────────────────────────────
const PROMOS = [
  { code: 'NAMASTE10', label: '10% off', hint: '10% on any booking' },
  { code: 'AIPLAN1500', label: '₹1,500 off', hint: 'AI Itinerary reward' },
  { code: 'INCREDIBLE2026', label: '₹2,000 off', hint: 'Incredible India special' },
  { code: 'FIRSTTRIP', label: '₹1,000 off', hint: 'First booking voucher' }
];

// Pre-booked seat numbers for transport
const BOOKED_SEATS = [3, 7, 12, 15, 19, 24, 28];

function SeatMap({ totalSeats = 40, selectedSeats, onToggle }) {
  const rows = Math.ceil(totalSeats / 4);
  return (
    <div>
      <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', marginBottom: 10, flexWrap: 'wrap' }}>
        {[
          { color: '#e0f2fe', border: '#0284c7', label: 'Available' },
          { color: '#0284c7', border: '#0284c7', label: 'Selected', textColor: '#fff' },
          { color: '#f1f5f9', border: '#cbd5e1', label: 'Booked' }
        ].map(({ color, border, label, textColor }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 14, height: 14, borderRadius: 3, background: color, border: `1.5px solid ${border}`, color: textColor, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>

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
                      width: 34,
                      height: 34,
                      borderRadius: 6,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      border: isBooked ? '1.5px solid #cbd5e1' : isSelected ? '2px solid #0284c7' : '1.5px solid #0284c7',
                      background: isBooked ? '#f1f5f9' : isSelected ? '#0284c7' : '#e0f2fe',
                      color: isBooked ? '#94a3b8' : isSelected ? '#fff' : '#0369a1',
                      cursor: isBooked ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s'
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

function RoomCard({ room, selected, onSelect }) {
  const amenityIcons = {
    WiFi: <Wifi size={13} />,
    Breakfast: <Coffee size={13} />,
    AC: <Wind size={13} />,
    Meals: <Utensils size={13} />
  };
  return (
    <div
      onClick={() => onSelect(room)}
      style={{
        border: selected ? '2.5px solid #0284c7' : '1.5px solid #e2e8f0',
        borderRadius: 12,
        padding: '14px 16px',
        cursor: 'pointer',
        background: selected ? '#f0f9ff' : '#fff',
        transition: 'all 0.18s',
        position: 'relative'
      }}
    >
      {selected && (
        <span
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: '#0284c7',
            color: '#fff',
            borderRadius: '50%',
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <CheckCircle size={14} />
        </span>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <strong style={{ fontSize: '0.93rem', color: '#0f172a' }}>{room.name}</strong>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7' }}>
          ₹{room.price.toLocaleString('en-IN')}
          <span style={{ fontSize: '0.7rem', fontWeight: 500, color: '#64748b' }}>/night</span>
        </span>
      </div>
      <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: 8 }}>{room.desc}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {room.amenities.map((a) => (
          <span
            key={a}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              padding: '2px 8px',
              borderRadius: 20,
              fontSize: '0.72rem',
              color: '#0369a1',
              fontWeight: 600
            }}
          >
            {amenityIcons[a] || null}
            {a}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── AUTHENTIC BRAND SVG LOGOS (Matching Reference Image 1) ─────────────────
function GooglePayLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
    </svg>
  );
}

function PhonePeLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="9" fill="#5F259F"/>
      <path d="M18.2 8H12v20h4.2v-6.2h2.2c4.3 0 7.4-2.8 7.4-6.9s-3.1-6.9-7.4-6.9zm0 9.8h-2.2v-5.8h2.2c2.2 0 3.6 1.2 3.6 2.9s-1.4 2.9-3.6 2.9z" fill="#ffffff"/>
      <path d="M20 15l6 13h-4.2L16.5 17" fill="#ffffff"/>
    </svg>
  );
}

function PaytmLogo() {
  return (
    <svg width="34" height="24" viewBox="0 0 68 28" fill="none">
      <rect width="68" height="28" rx="6" fill="#ffffff"/>
      <text x="4" y="20" fill="#002970" fontSize="16" fontWeight="900" fontFamily="sans-serif" letterSpacing="-0.5">pay</text>
      <text x="34" y="20" fill="#00BAF2" fontSize="16" fontWeight="900" fontFamily="sans-serif" letterSpacing="-0.5">tm</text>
    </svg>
  );
}

function BhimUpiLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 40 32" fill="none">
      <path d="M20 2L32 16L20 30L8 16L20 2Z" fill="#F47920"/>
      <path d="M20 7L28 16L20 25L12 16L20 7Z" fill="#00843D"/>
      <path d="M17 12h6v8h-6z" fill="#ffffff"/>
    </svg>
  );
}

// ─── UNIVERSAL BOOKING & PAYMENT MODAL COMPONENT ─────────────────────────────
export default function BookingModal({
  bookingType = 'package',
  item,
  initialPlan = null,
  onClose,
  onComplete
}) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Wizard Steps: 'details' -> 'payment' -> 'success' | 'failed' | 'cancelled'
  const [step, setStep] = useState('details');

  // Common dates & guest state
  const [checkIn, setCheckIn] = useState(initialPlan?.travel_date || new Date().toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date(initialPlan?.travel_date || new Date());
    d.setDate(d.getDate() + (initialPlan?.days || item?.duration_days || 2));
    return d.toISOString().split('T')[0];
  });
  const [guests, setGuests] = useState(initialPlan?.people || 2);
  const [specialReqs, setSpecialReqs] = useState('');

  // Hotel rooms
  const hotelRooms = [
    { id: 'standard', name: 'Standard Room', price: item?.price_per_night || 2500, desc: 'Comfortable double bed, city view, 200 sq ft', amenities: ['WiFi', 'AC'] },
    { id: 'deluxe', name: 'Deluxe Room', price: Math.round((item?.price_per_night || 2500) * 1.4), desc: 'King bed, garden/pool view, 280 sq ft, bathtub', amenities: ['WiFi', 'AC', 'Breakfast'] },
    { id: 'suite', name: 'Heritage Suite', price: Math.round((item?.price_per_night || 2500) * 2.2), desc: 'Separate living room, premium decor, 400 sq ft, butler', amenities: ['WiFi', 'AC', 'Breakfast', 'Meals'] }
  ];
  const [selectedRoom, setSelectedRoom] = useState(hotelRooms[0]);
  const nights = Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000));

  // Transport state
  const [fromCity, setFromCity] = useState(item?.from_city || 'Bengaluru');
  const [toCity, setToCity] = useState(item?.to_city || item?.route?.split(' → ')[1] || 'Mysore');
  const [travelDate, setTravelDate] = useState(initialPlan?.travel_date || new Date().toISOString().split('T')[0]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const toggleSeat = useCallback((n) => {
    setSelectedSeats((prev) =>
      prev.includes(n) ? prev.filter((s) => s !== n) : prev.length < guests ? [...prev, n] : prev
    );
  }, [guests]);

  // Package state
  const [pkgTravelDate, setPkgTravelDate] = useState(initialPlan?.travel_date || new Date().toISOString().split('T')[0]);

  // Coupons
  const [couponInput, setCouponInput] = useState(initialPlan ? 'AIPLAN1500' : '');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [discountAmt, setDiscountAmt] = useState(0);
  const [couponErr, setCouponErr] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Payment method & simulation state
  const [payMethod, setPayMethod] = useState('UPI'); // 'UPI' | 'CARD' | 'NETBANKING'
  const [upiApp, setUpiApp] = useState('gpay'); // 'gpay' | 'phonepe' | 'paytm' | 'bhim'
  const [cardNo, setCardNo] = useState('4532 8921 4820 9012');
  const [cardName, setCardName] = useState(user?.name || user?.full_name || 'Aarav Sharma');
  const [expiry, setExpiry] = useState('08/28');
  const [cvv, setCvv] = useState('782');
  const [selBank, setSelBank] = useState('SBI');

  // Academic Simulation Scenarios: 'success' | 'failure' | 'cancel'
  const [simScenario, setSimScenario] = useState('success');

  const [processing, setProcessing] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Auto-apply promo from AI Planner
  useEffect(() => {
    if (initialPlan) applyPromo('AIPLAN1500');
  }, []);

  // Price calculations
  const baseAmount = (() => {
    if (bookingType === 'hotel') return selectedRoom.price * nights * guests;
    if (bookingType === 'transport') return (item?.price || 1200) * (selectedSeats.length || guests);
    return (item?.price || 9999) * guests; // package
  })();
  const gst = Math.round((baseAmount - discountAmt) * 0.05);
  const totalAmt = Math.max(baseAmount - discountAmt + gst, 0);
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

  const canProceed = () => {
    if (bookingType === 'transport' && selectedSeats.length === 0) return false;
    return true;
  };

  // ─── EXECUTE DUMMY PAYMENT SIMULATION ──────────────────────────────────────
  const handleSimulatePayment = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setProcessing(true);

    try {
      // Artificial delay for realistic UI feedback
      await new Promise((r) => setTimeout(r, 1200));

      const upiAppName = upiApp === 'gpay' ? 'Google Pay' : upiApp === 'phonepe' ? 'PhonePe' : upiApp === 'paytm' ? 'Paytm' : 'BHIM UPI';
      const subMethodName = payMethod === 'UPI' ? upiAppName : payMethod === 'CARD' ? 'Visa / Mastercard Debit' : `${selBank} Net Banking`;

      const payload = {
        booking_type: bookingType,
        package_id: bookingType === 'package' ? item?.id : null,
        hotel_id: bookingType === 'hotel' ? item?.id : null,
        transport_id: bookingType === 'transport' ? item?.id : null,
        travel_date: bookingType === 'hotel' ? checkIn : bookingType === 'transport' ? travelDate : pkgTravelDate,
        return_date: checkOut,
        check_in: checkIn,
        check_out: checkOut,
        people_count: guests,
        total_amount: totalAmt,
        discount_amount: discountAmt,
        discount_code: appliedPromo?.code || null,
        payment_method: payMethod,
        payment_submethod: subMethodName,
        special_requests: specialReqs,
        scenario: simScenario
      };

      const res = await api.post('/payments/checkout-and-simulate', payload);

      setBookingResult(res.data);

      if (res.data.payment_status === 'demo_success') {
        setStep('success');
        // Keep modal open so the user can inspect the "Payment Successful" confirmation and receipt.
        // onComplete will be called when the user finishes viewing and closes or navigates.
      } else if (res.data.payment_status === 'demo_failed') {
        setStep('failed');
      } else if (res.data.payment_status === 'demo_cancelled') {
        setStep('cancelled');
      }
    } catch (err) {
      console.error('Simulation error:', err);
      const resData = err.response?.data;
      if (simScenario === 'failure') {
        setBookingResult(resData || {
          booking_reference: `TH-BK-${Date.now().toString().slice(-6)}`,
          transaction: {
            demo_transaction_id: `DEMO_TXN_${Date.now()}_FAIL`,
            amount: totalAmt,
            status: 'demo_failed',
            disclaimer: 'This is a simulated transaction. No real money was charged.'
          }
        });
        setStep('failed');
      } else {
        alert(resData?.message || 'Payment simulation error. Please try again.');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleModalClose = () => {
    if (step === 'success' && onComplete && bookingResult) {
      onComplete(bookingResult);
    }
    onClose();
  };

  const copyToClipboard = (text, fieldName) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // ─── PRINT / SAVE AS PDF RECEIPT ──────────────────────────────────────────
  const handlePrintReceipt = () => {
    const tripName = item?.name || item?.title || item?.provider || 'Tourist Booking';
    const destination = item?.location || item?.destination_name || (toCity ? `${fromCity} to ${toCity}` : 'Incredible India');
    const txnId = bookingResult?.transaction?.demo_transaction_id || bookingResult?.transaction_id || `DEMO_TXN_${Date.now()}`;
    const bkRef = bookingResult?.booking_reference || (bookingResult?.booking_id ? `TH-BK-${bookingResult.booking_id}` : `TH-BK-${Date.now().toString().slice(-6)}`);
    const recNo = `REC-${new Date().getFullYear()}-${String(bookingResult?.transaction?.payment_record_id || bookingResult?.booking_id || '82941').padStart(6, '0')}`;
    const upiAppName = upiApp === 'gpay' ? 'Google Pay' : upiApp === 'phonepe' ? 'PhonePe' : upiApp === 'paytm' ? 'Paytm' : 'BHIM UPI';
    const methodStr = payMethod === 'UPI' ? `UPI (${upiAppName})` : payMethod === 'CARD' ? 'Debit/Credit Card' : `Net Banking (${selBank})`;
    const travelDates = bookingType === 'hotel' ? `${checkIn} to ${checkOut}` : bookingType === 'transport' ? travelDate : pkgTravelDate;
    const nowStr = new Date(bookingResult?.transaction?.timestamp || Date.now()).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const printHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Receipt - ${bkRef} - Tourist Hub AI</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 30px 20px;
      color: #0f172a;
      background: #f8fafc;
    }
    .receipt-container {
      max-width: 650px;
      margin: 0 auto;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 12px;
      padding: 32px 36px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 900;
      color: #0284c7;
      letter-spacing: 0.5px;
    }
    .brand-sub {
      font-size: 13px;
      color: #64748b;
      margin-top: 3px;
    }
    .paid-stamp {
      background: #ecfdf5;
      border: 2px solid #10b981;
      color: #065f46;
      font-size: 13px;
      font-weight: 800;
      padding: 6px 14px;
      border-radius: 6px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
      font-size: 13px;
    }
    .meta-item span {
      display: block;
      font-size: 11px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .meta-item strong {
      color: #0f172a;
      font-size: 13px;
    }
    .details-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
      font-size: 13px;
    }
    .section-head {
      font-size: 11px;
      font-weight: 800;
      color: #0369a1;
      text-transform: uppercase;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    .breakdown-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 13px;
    }
    .breakdown-table th {
      text-align: left;
      padding: 8px 0;
      border-bottom: 1.5px solid #cbd5e1;
      color: #475569;
      font-size: 11px;
      text-transform: uppercase;
    }
    .breakdown-table td {
      padding: 10px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .total-line td {
      font-size: 16px;
      font-weight: 800;
      color: #059669;
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
      padding: 14px 0;
    }
    .disclaimer-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
      font-size: 11px;
      color: #1e40af;
      line-height: 1.4;
      margin-top: 20px;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .receipt-container { border: none; box-shadow: none; padding: 0; max-width: 100%; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="top-bar">
      <div>
        <div class="brand-title">TOURIST HUB AI</div>
        <div class="brand-sub">Official Travel Booking & Payment Receipt</div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">GSTIN: 29AAACT9821K1ZZ • Simulated Academic Booking</div>
      </div>
      <div class="paid-stamp">&#10003; PAID (DEMO)</div>
    </div>

    <div class="meta-box">
      <div class="meta-item"><span>Receipt No</span><strong>${recNo}</strong></div>
      <div class="meta-item"><span>Payment Date</span><strong>${nowStr}</strong></div>
      <div class="meta-item"><span>Booking Ref</span><strong style="color:#0284c7">${bkRef}</strong></div>
      <div class="meta-item"><span>Transaction ID</span><strong style="font-family:monospace">${txnId}</strong></div>
    </div>

    <div class="details-row">
      <div>
        <div class="section-head">Billed To</div>
        <div><strong>${user?.name || user?.full_name || 'Demo Traveler'}</strong></div>
        <div style="color:#64748b">${user?.email || 'traveler@example.com'}</div>
        ${user?.phone ? `<div style="color:#64748b">Phone: ${user.phone}</div>` : ''}
      </div>

      <div>
        <div class="section-head">Reservation Summary</div>
        <div><strong>${tripName}</strong></div>
        <div style="color:#64748b">Destination: ${destination}</div>
        <div style="color:#64748b">Travel Date: ${travelDates}</div>
        <div style="color:#64748b">Guests/Seats: ${guests} Person(s)</div>
      </div>
    </div>

    <table class="breakdown-table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align:right">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Base Fare / Booking Fee (${bookingType.toUpperCase()})</td>
          <td style="text-align:right">&#8377;${baseAmount.toLocaleString('en-IN')}</td>
        </tr>
        ${savingsAmt > 0 ? `
        <tr>
          <td style="color:#059669">Promotional Discount (${appliedPromo?.code})</td>
          <td style="text-align:right; color:#059669">&#8722;&#8377;${savingsAmt.toLocaleString('en-IN')}</td>
        </tr>` : ''}
        <tr>
          <td>Goods & Services Tax (GST 5%)</td>
          <td style="text-align:right">&#8377;${gst.toLocaleString('en-IN')}</td>
        </tr>
        <tr class="total-line">
          <td>Total Amount Paid (${methodStr})</td>
          <td style="text-align:right">&#8377;${totalAmt.toLocaleString('en-IN')}</td>
        </tr>
      </tbody>
    </table>

    <div class="disclaimer-box">
      <strong>Academic Demonstration Notice:</strong> This receipt was generated as part of a safe academic simulation on Tourist Hub AI.<br/>
      No real money was charged or transferred. Thank you for using Tourist Hub AI!
    </div>
  </div>
</body>
</html>
`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 350);
    } else {
      const blob = new Blob([printHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TouristHub_Payment_Receipt_${bkRef}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // ─── DOWNLOAD DEMO RECEIPT ────────────────────────────────────────────────
  const handleDownloadReceipt = () => {
    const tripName = item?.name || item?.title || item?.provider || 'Tourist Booking';
    const destination = item?.location || item?.destination_name || (toCity ? `${fromCity} to ${toCity}` : 'Incredible India');
    const txnId = bookingResult?.transaction?.demo_transaction_id || `DEMO_TXN_${Date.now()}`;
    const bkRef = bookingResult?.booking_reference || (bookingResult?.booking_id ? `TH-BK-${bookingResult.booking_id}` : `TH-BK-${Date.now().toString().slice(-6)}`);
    const recNo = `REC-${new Date().getFullYear()}-${String(bookingResult?.transaction?.payment_record_id || bookingResult?.booking_id || '82941').padStart(6, '0')}`;
    const upiAppName = upiApp === 'gpay' ? 'Google Pay' : upiApp === 'phonepe' ? 'PhonePe' : upiApp === 'paytm' ? 'Paytm' : 'BHIM UPI';
    const methodStr = payMethod === 'UPI' ? `UPI (${upiAppName})` : payMethod === 'CARD' ? 'Debit/Credit Card' : `Net Banking (${selBank})`;
    const travelDates = bookingType === 'hotel' ? `${checkIn} to ${checkOut}` : bookingType === 'transport' ? travelDate : pkgTravelDate;
    const nowStr = new Date(bookingResult?.transaction?.timestamp || Date.now()).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'medium'
    });

    const textReceipt = `
================================================================================
                    TOURIST HUB AI — OFFICIAL PAYMENT RECEIPT
                         Incredible India Travel Companion
================================================================================
RECEIPT NO:         ${recNo}
BOOKING REFERENCE:  ${bkRef}
DEMO TXN ID:        ${txnId}
DATE & TIME:        ${nowStr}
PAYMENT STATUS:     PAID • DEMO SIMULATION

--------------------------------------------------------------------------------
CUSTOMER DETAILS:
--------------------------------------------------------------------------------
Name:               ${user?.name || user?.full_name || 'Demo Traveler'}
Email:              ${user?.email || 'traveler@example.com'}
Phone:              ${user?.phone || 'Not provided'}

--------------------------------------------------------------------------------
RESERVATION DETAILS:
--------------------------------------------------------------------------------
Service / Trip:     ${tripName}
Destination:        ${destination}
Travel Schedule:    ${travelDates}
Travelers / Guests: ${guests} Person(s)
Booking Type:       ${bookingType.toUpperCase()}

--------------------------------------------------------------------------------
FINANCIAL BREAKDOWN:
--------------------------------------------------------------------------------
Base Amount:        ₹${baseAmount.toLocaleString('en-IN')}
Coupon Savings:     ${savingsAmt > 0 ? `-₹${savingsAmt.toLocaleString('en-IN')} (${appliedPromo?.code})` : '₹0'}
GST & Taxes (5%):   ₹${gst.toLocaleString('en-IN')}
--------------------------------------------------------------------------------
TOTAL AMOUNT PAID:  ₹${totalAmt.toLocaleString('en-IN')}
PAYMENT METHOD:     ${methodStr}
PAYMENT STATUS:     Authorized & Settled (Simulated)
--------------------------------------------------------------------------------

================================================================================
NOTICE: This is an academic demo simulation transaction.
        No actual money was charged or transferred.
Thank you for choosing Tourist Hub AI!
================================================================================
`;
    const blob = new Blob([textReceipt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TouristHub_Payment_Receipt_${bkRef}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tripName = item?.name || item?.title || item?.provider || 'Tourist Booking';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(5px)',
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: (step === 'details' || step === 'success') ? '640px' : '520px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.16)',
          border: '1px solid #e2e8f0',
          padding: '24px 28px',
          position: 'relative',
          transition: 'all 0.25s ease'
        }}
      >
        {/* ═══════════════ TOP HEADER & CLOSE (Matching Image 1) ═══════════════ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', margin: 0, fontFamily: 'var(--font-serif, sans-serif)' }}>
              {step === 'details' ? 'Booking Details' : step === 'success' ? 'Payment Successful' : step === 'failed' ? 'Payment Status' : 'Payment Options'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
              {step === 'details'
                ? 'Customize your travel details before continuing.'
                : step === 'success'
                  ? 'Your payment is confirmed and official booking receipt has been generated.'
                  : step === 'failed'
                    ? 'Simulated payment outcome for testing.'
                    : 'Choose a secure payment method to continue with your booking.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleModalClose}
            disabled={processing}
            title="Close"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: '#f8fafc',
              color: '#64748b',
              cursor: processing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ═══════════════ STEP 1 — BOOKING DETAILS ═══════════════ */}
        {step === 'details' && (
          <div>
            {/* HOTEL DETAILS */}
            {bookingType === 'hotel' && (
              <div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
                  <img src={item?.image_url} alt={item?.name} style={{ width: 72, height: 60, objectFit: 'cover', borderRadius: 10 }} onError={(e) => { e.target.style.display = 'none'; }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>{item?.name}</div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} />{item?.location}
                      <Star size={12} fill="#f59e0b" color="#f59e0b" style={{ marginLeft: 8 }} />{item?.rating}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>Check-In</label>
                    <input type="date" value={checkIn} min={new Date().toISOString().split('T')[0]} onChange={(e) => setCheckIn(e.target.value)} className="form-control" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>Check-Out</label>
                    <input type="date" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} className="form-control" />
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>Guests</label>
                  <select value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="form-control">
                    {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Select Room Type</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {hotelRooms.map((room) => (
                      <RoomCard key={room.id} room={room} selected={selectedRoom?.id === room.id} onSelect={setSelectedRoom} />
                    ))}
                  </div>
                </div>

                <div style={{ background: '#f0f9ff', borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontSize: '0.85rem', color: '#0369a1' }}>
                  🛏️ <strong>{selectedRoom.name}</strong> × {nights} night{nights > 1 ? 's' : ''} × {guests} guest{guests > 1 ? 's' : ''} = <strong>₹{baseAmount.toLocaleString('en-IN')}</strong>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>From City</label>
                    <input className="form-control" value={fromCity} onChange={(e) => setFromCity(e.target.value)} placeholder="Bengaluru" />
                  </div>
                  <ArrowRight size={20} color="#0284c7" />
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>To City</label>
                    <input className="form-control" value={toCity} onChange={(e) => setToCity(e.target.value)} placeholder="Mysore" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>Travel Date</label>
                    <input type="date" value={travelDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setTravelDate(e.target.value)} className="form-control" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>Departure</label>
                    <input className="form-control" value={item?.departure_time || '06:30 AM'} readOnly style={{ background: '#f8fafc' }} />
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #bae6fd', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0369a1', marginBottom: 12 }}>
                    Select Seats ({selectedSeats.length}/{guests} required)
                    {selectedSeats.length > 0 && (
                      <span style={{ background: '#0284c7', color: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: '0.7rem', marginLeft: 8 }}>
                        Seats: {selectedSeats.sort((a, b) => a - b).join(', ')}
                      </span>
                    )}
                  </div>
                  <SeatMap totalSeats={40} selectedSeats={selectedSeats} onToggle={toggleSeat} />
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
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>by <strong style={{ color: '#0369a1' }}>{item?.company_name || 'Tourist Hub AI Verified Partner'}</strong></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>Travel Date</label>
                    <input type="date" value={pkgTravelDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setPkgTravelDate(e.target.value)} className="form-control" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>Travelers</label>
                    <select value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="form-control">
                      {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => <option key={n} value={n}>{n} Person{n > 1 ? 's' : ''}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* SPECIAL REQUESTS */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>Special Requests (optional)</label>
              <input className="form-control" value={specialReqs} onChange={(e) => setSpecialReqs(e.target.value)} placeholder="e.g. Vegetarian meals, early check-in..." />
            </div>

            {/* COUPONS */}
            <div style={{ background: '#ecfdf5', border: '1px dashed #10b981', borderRadius: 12, padding: 14, marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#065f46', fontSize: '0.85rem', marginBottom: 8 }}>
                <Gift size={16} color="#10b981" /> Apply Coupon
              </div>

              {appliedPromo ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#d1fae5', padding: '8px 12px', borderRadius: 8 }}>
                  <span style={{ fontSize: '0.82rem', color: '#065f46', fontWeight: 600 }}>
                    ✓ <strong>{appliedPromo.code}</strong> applied — saved ₹{appliedPromo.discount.toLocaleString('en-IN')}
                  </span>
                  <button type="button" onClick={removePromo} style={{ background: 'none', border: 'none', color: '#b91c1c', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                    Remove ✕
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-control" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="e.g. AIPLAN1500" style={{ fontSize: '0.85rem' }} />
                  <button type="button" onClick={() => applyPromo()} disabled={couponLoading || !couponInput} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            {/* PRICE BREAKDOWN */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: '#64748b', marginBottom: 5 }}>
                <span>Subtotal</span>
                <span>₹{baseAmount.toLocaleString('en-IN')}</span>
              </div>
              {savingsAmt > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: '#059669', fontWeight: 700, marginBottom: 5 }}>
                  <span>Coupon Discount</span>
                  <span>− ₹{savingsAmt.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#64748b', marginBottom: 10 }}>
                <span>GST (5%)</span>
                <span>+ ₹{gst.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Total Payable</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IndianRupee size={18} />{totalAmt.toLocaleString('en-IN')}
                  </div>
                </div>
                {savingsAmt > 0 && (
                  <span style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
                    Saved ₹{savingsAmt.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => { if (!canProceed()) return; setStep('payment'); }}
              disabled={!canProceed()}
              className="btn btn-green btn-lg"
              style={{ width: '100%', justifyContent: 'center', fontWeight: 700, borderRadius: '10px' }}
            >
              Proceed to Payment Options <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* ═══════════════ STEP 2 — PAYMENT OPTIONS (Image 1 Redesign) ═══════════════ */}
        {step === 'payment' && (
          <div>
            {/* 1. Security Banner (Light-blue banner containing shield icon, matching Image 1) */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#0284c7" />
                <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#1e40af' }}>
                  Demo Mode — No Real Money Will Be Charged
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0284c7', letterSpacing: '0.5px' }}>
                Tourist Hub AI
              </span>
            </div>

            {/* 2. Compact Booking Summary Pill */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                marginBottom: '16px'
              }}
            >
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Booking For:</span>
                <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>{tripName}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  disabled={processing}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0284c7',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                    padding: 0,
                    marginBottom: '2px'
                  }}
                >
                  &larr; Modify
                </button>
                <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0284c7' }}>
                  ₹{totalAmt.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* 3. Payment Method Tabs (3 Horizontally Aligned, matching Image 1) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
              {[
                { key: 'UPI', label: 'UPI / QR', Icon: QrCode },
                { key: 'CARD', label: 'Debit/Credit', Icon: CreditCard },
                { key: 'NETBANKING', label: 'Net Banking', Icon: Building2 }
              ].map(({ key, label, Icon }) => {
                const isActive = payMethod === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPayMethod(key)}
                    disabled={processing}
                    style={{
                      padding: '13px 6px',
                      borderRadius: '12px',
                      cursor: processing ? 'not-allowed' : 'pointer',
                      border: isActive ? '2px solid #0084ff' : '1px solid #e2e8f0',
                      background: isActive ? '#eff6ff' : '#ffffff',
                      color: isActive ? '#0084ff' : '#475569',
                      fontWeight: '700',
                      fontSize: '0.82rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={20} color={isActive ? '#0084ff' : '#64748b'} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            {/* ─── TAB 1: UPI / QR (Matching Image 1) ───────────────── */}
            {payMethod === 'UPI' && (
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '0.96rem', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>
                    Choose UPI App
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                    Simulate a payment using your preferred option
                  </p>
                </div>

                {/* 4 UPI Selectable App Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                  {[
                    { key: 'gpay', label: 'Google Pay', Logo: GooglePayLogo },
                    { key: 'phonepe', label: 'PhonePe', Logo: PhonePeLogo },
                    { key: 'paytm', label: 'Paytm', Logo: PaytmLogo },
                    { key: 'bhim', label: 'BHIM UPI', Logo: BhimUpiLogo }
                  ].map(({ key, label, Logo }) => {
                    const isSelected = upiApp === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setUpiApp(key)}
                        disabled={processing}
                        style={{
                          padding: '10px 4px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #0084ff' : '1px solid #e2e8f0',
                          background: isSelected ? '#eff6ff' : '#ffffff',
                          cursor: processing ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 2px 8px rgba(0, 132, 255, 0.15)' : 'none'
                        }}
                      >
                        <Logo />
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: isSelected ? '#0084ff' : '#334155' }}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* QR Code Container (White rounded box with shadow, central UPI badge) */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    borderRadius: '16px',
                    padding: '16px 14px',
                    textAlign: 'center',
                    marginBottom: '16px'
                  }}
                >
                  <div
                    style={{
                      display: 'inline-block',
                      background: '#ffffff',
                      padding: '12px',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <svg width="138" height="138" viewBox="0 0 100 100">
                      {/* Corner Position Detection Squares */}
                      <rect x="4" y="4" width="24" height="24" fill="#0f172a" rx="4"/>
                      <rect x="8" y="8" width="16" height="16" fill="#fff" rx="2"/>
                      <rect x="12" y="12" width="8" height="8" fill="#0f172a" rx="1"/>

                      <rect x="72" y="4" width="24" height="24" fill="#0f172a" rx="4"/>
                      <rect x="76" y="8" width="16" height="16" fill="#fff" rx="2"/>
                      <rect x="80" y="12" width="8" height="8" fill="#0f172a" rx="1"/>

                      <rect x="4" y="72" width="24" height="24" fill="#0f172a" rx="4"/>
                      <rect x="8" y="76" width="16" height="16" fill="#fff" rx="2"/>
                      <rect x="12" y="80" width="8" height="8" fill="#0f172a" rx="1"/>

                      {/* Timing markers */}
                      {[32, 38, 44, 50, 56, 62].map((x) => (
                        <rect key={`tx-${x}`} x={x} y="14" width="4" height="4" fill={x % 12 === 0 ? '#0f172a' : '#94a3b8'} rx="1" />
                      ))}
                      {[32, 38, 44, 50, 56, 62].map((y) => (
                        <rect key={`ty-${y}`} x="14" y={y} width="4" height="4" fill={y % 12 === 0 ? '#0f172a' : '#94a3b8'} rx="1" />
                      ))}

                      {/* Data Pattern Matrix Elements */}
                      {[
                        [32,32],[36,32],[40,32],[56,32],[60,32],[64,32],[72,32],[76,32],[80,32],
                        [32,36],[44,36],[56,36],[68,36],[72,36],[80,36],[88,36],
                        [36,40],[40,40],[60,40],[64,40],[84,40],[88,40],
                        [72,44],[76,44],[88,44],
                        [32,56],[36,56],[64,56],[68,56],[76,56],[80,56],[88,56],
                        [40,60],[44,60],[60,60],[72,60],[84,60],
                        [32,64],[36,64],[56,64],[68,64],[72,64],[80,64],[88,64],
                        [32,72],[40,72],[56,72],[60,72],[64,72],[72,72],[80,72],[88,72],
                        [36,76],[44,76],[64,76],[68,76],[76,76],[84,76],
                        [32,80],[36,80],[40,80],[56,80],[68,80],[72,80],[80,80],[88,80],
                        [36,84],[44,84],[56,84],[60,84],[64,84],[80,84],[84,84],[88,84],
                        [32,88],[40,88],[68,88],[76,88],[84,88]
                      ].map(([x, y], idx) => (
                        <rect key={idx} x={x} y={y} width="3.5" height="3.5" fill="#0f172a" rx="0.8" />
                      ))}

                      {/* Central UPI Badge Emblem matching Image 1 */}
                      <rect x="34" y="42" width="32" height="16" rx="4" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                      <text x="43" y="53.5" fill="#00843D" fontSize="7.5" fontWeight="900" fontFamily="sans-serif">UPI</text>
                      <path d="M57 46l3 8h-2.5l-3-8z" fill="#F47920"/>
                      <path d="M54 46l3 8h-2.5l-3-8z" fill="#00843D"/>
                    </svg>
                  </div>

                  <div style={{ fontSize: '0.84rem', fontWeight: '600', color: '#1e293b', marginTop: '10px' }}>
                    Scan with any UPI app to pay ₹{totalAmt.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>
                    Demo QR — Not a real payment QR code.
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 2: DEBIT / CREDIT CARD ───────────────────────── */}
            {payMethod === 'CARD' && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>
                    Enter Card Details
                  </h4>
                  <p style={{ fontSize: '0.76rem', color: '#64748b', margin: 0 }}>
                    Demo card simulation (any test numbers work safely)
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Cardholder Name
                    </label>
                    <input
                      className="form-control"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Card Number
                    </label>
                    <input
                      className="form-control"
                      value={cardNo}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
                        setCardNo(v);
                      }}
                      placeholder="4532 •••• •••• 8921"
                      maxLength={19}
                      style={{ fontFamily: 'monospace', letterSpacing: '1px', fontSize: '0.88rem', padding: '8px 12px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                        Expiry (MM/YY)
                      </label>
                      <input
                        className="form-control"
                        value={expiry}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, '');
                          if (v.length >= 2) v = `${v.slice(0, 2)}/${v.slice(2, 4)}`;
                          setExpiry(v);
                        }}
                        placeholder="08/28"
                        maxLength={5}
                        style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                        CVV / CVC
                      </label>
                      <input
                        className="form-control"
                        type="password"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="782"
                        maxLength={4}
                        style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '10px', fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={12} /> Test Simulation: No actual card data is collected, transmitted, or saved.
                </div>
              </div>
            )}

            {/* ─── TAB 3: NET BANKING ───────────────────────────────── */}
            {payMethod === 'NETBANKING' && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>
                    Select Your Bank
                  </h4>
                  <p style={{ fontSize: '0.76rem', color: '#64748b', margin: 0 }}>
                    Simulate an instant net banking authorization
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                  {['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'PNB'].map((bank) => {
                    const isSelected = selBank === bank;
                    return (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setSelBank(bank)}
                        style={{
                          padding: '10px 6px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #0084ff' : '1px solid #e2e8f0',
                          background: isSelected ? '#eff6ff' : '#ffffff',
                          color: isSelected ? '#0084ff' : '#334155',
                          fontWeight: '700',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {bank}
                      </button>
                    );
                  })}
                </div>

                <div style={{ fontSize: '0.72rem', color: '#64748b', background: '#eff6ff', padding: '8px 12px', borderRadius: '8px' }}>
                  Selected: <strong>{selBank}</strong> (Simulated internet banking confirmation)
                </div>
              </div>
            )}

            {/* 4. Academic Demo Test-Mode Selector (Required by Section 4) */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: '10px',
                padding: '8px 12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ⚡ Test Mode:
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { key: 'success', label: '✅ Success', color: '#059669' },
                  { key: 'failure', label: '❌ Simulate Failure', color: '#dc2626' },
                  { key: 'cancel', label: '⏸️ Cancel', color: '#d97706' }
                ].map((sc) => (
                  <button
                    key={sc.key}
                    type="button"
                    onClick={() => setSimScenario(sc.key)}
                    disabled={processing}
                    style={{
                      background: simScenario === sc.key ? sc.color : '#ffffff',
                      color: simScenario === sc.key ? '#ffffff' : '#475569',
                      border: simScenario === sc.key ? `1.5px solid ${sc.color}` : '1px solid #cbd5e1',
                      borderRadius: '16px',
                      padding: '3px 8px',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Full-Width Blue Pay Button (Matching Image 1) */}
            <button
              type="button"
              onClick={handleSimulatePayment}
              disabled={processing}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '10px',
                border: 'none',
                background: simScenario === 'failure' ? '#dc2626' : simScenario === 'cancel' ? '#d97706' : '#0084ff',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '0.98rem',
                cursor: processing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(0, 132, 255, 0.25)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!processing) e.currentTarget.style.filter = 'brightness(0.94)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'none';
              }}
            >
              {processing ? (
                <>
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.8s linear infinite'
                    }}
                  />
                  <span>Processing your demo payment...</span>
                </>
              ) : simScenario === 'failure' ? (
                <>
                  <XCircle size={18} />
                  <span>Simulate Payment Failure • ₹{totalAmt.toLocaleString('en-IN')}</span>
                </>
              ) : simScenario === 'cancel' ? (
                <>
                  <AlertCircle size={18} />
                  <span>Simulate Payment Cancellation</span>
                </>
              ) : (
                <>
                  <Shield size={18} />
                  <span>Simulate Payment • ₹{totalAmt.toLocaleString('en-IN')}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ═══════════════ STEP 3 — SUCCESS RESULT & PAYMENT RECEIPT ═══════════════ */}
        {step === 'success' && (() => {
          const destination = item?.location || item?.destination_name || (toCity ? `${fromCity} to ${toCity}` : 'Incredible India');
          const txnId = bookingResult?.transaction?.demo_transaction_id || bookingResult?.transaction_id || `DEMO_TXN_${Date.now()}`;
          const bkRef = bookingResult?.booking_reference || (bookingResult?.booking_id ? `TH-BK-${bookingResult.booking_id}` : `TH-BK-${Date.now().toString().slice(-6)}`);
          const recNo = `REC-${new Date().getFullYear()}-${String(bookingResult?.transaction?.payment_record_id || bookingResult?.booking_id || '82941').padStart(6, '0')}`;
          const upiAppName = upiApp === 'gpay' ? 'Google Pay' : upiApp === 'phonepe' ? 'PhonePe' : upiApp === 'paytm' ? 'Paytm' : 'BHIM UPI';
          const methodStr = payMethod === 'UPI' ? `UPI (${upiAppName})` : payMethod === 'CARD' ? 'Debit/Credit Card' : `Net Banking (${selBank})`;
          const travelDates = bookingType === 'hotel' ? `${checkIn} to ${checkOut}` : bookingType === 'transport' ? travelDate : pkgTravelDate;
          const formattedDate = new Date(bookingResult?.transaction?.timestamp || Date.now()).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div className="animate-fade-in" style={{ padding: '6px 0' }}>
              {/* 1. TOP CELEBRATORY SUCCESS BANNER */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                  border: '1.5px solid #a7f3d0',
                  borderRadius: '16px',
                  padding: '16px 18px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.12)'
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#059669',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)'
                  }}
                >
                  <CheckCircle2 size={30} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#065f46', margin: 0 }}>
                      Your Payment is Successful!
                    </h3>
                    <span
                      style={{
                        background: '#059669',
                        color: '#ffffff',
                        fontSize: '0.68rem',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        letterSpacing: '0.5px'
                      }}
                    >
                      CONFIRMED
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#047857', margin: '4px 0 0 0' }}>
                    Thank you! Your travel booking has been confirmed. Below is your official payment receipt.
                  </p>
                </div>
              </div>

              {/* 2. AUTHENTIC PAYMENT RECEIPT CARD */}
              <div
                id="touristhub-receipt-view"
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '14px',
                  boxShadow: '0 6px 24px rgba(0, 0, 0, 0.06)',
                  overflow: 'hidden',
                  marginBottom: '18px'
                }}
              >
                {/* Top Gradient Ribbon */}
                <div style={{ height: '5px', background: 'linear-gradient(90deg, #0284c7 0%, #10b981 100%)' }} />

                <div style={{ padding: '20px 22px' }}>
                  {/* Receipt Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '14px', marginBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Receipt size={20} color="#0284c7" />
                        <span style={{ fontSize: '1.05rem', fontWeight: '900', color: '#0f172a', letterSpacing: '0.5px' }}>
                          TOURIST HUB AI
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px', fontWeight: '500' }}>
                        Official Payment Receipt & Travel Voucher
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#ecfdf5',
                          border: '1.5px solid #10b981',
                          color: '#065f46',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.74rem',
                          fontWeight: '800',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase'
                        }}
                      >
                        <CheckCircle size={13} color="#10b981" /> PAID (DEMO)
                      </span>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px' }}>
                        GSTIN: 29AAACT9821K1ZZ
                      </div>
                    </div>
                  </div>

                  {/* Receipt Metadata Grid (Receipt No, Date, Ref ID, Txn ID) */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '10px',
                      marginBottom: '16px'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>
                        Receipt Number
                      </span>
                      <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>{recNo}</strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>
                        Payment Date & Time
                      </span>
                      <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>{formattedDate}</strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>
                        Booking Reference
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ fontSize: '0.88rem', color: '#0284c7' }}>{bkRef}</strong>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(bkRef, 'ref')}
                          title="Copy Booking Reference"
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '2px',
                            cursor: 'pointer',
                            color: copiedField === 'ref' ? '#059669' : '#94a3b8',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                        >
                          {copiedField === 'ref' ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                        {copiedField === 'ref' && <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: '700' }}>Copied!</span>}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>
                        Transaction ID (Demo)
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.78rem', color: '#334155', fontFamily: 'monospace', fontWeight: '600' }}>
                          {txnId.length > 20 ? `${txnId.slice(0, 18)}...` : txnId}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(txnId, 'txn')}
                          title="Copy Transaction ID"
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '2px',
                            cursor: 'pointer',
                            color: copiedField === 'txn' ? '#059669' : '#94a3b8',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                        >
                          {copiedField === 'txn' ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                        {copiedField === 'txn' && <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: '700' }}>Copied!</span>}
                      </div>
                    </div>
                  </div>

                  {/* 2-Column Details: Customer vs Trip */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px', fontSize: '0.82rem' }}>
                    {/* Billed To */}
                    <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '0.68rem', color: '#0284c7', textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' }}>
                        Billed To
                      </div>
                      <div style={{ fontWeight: '800', color: '#0f172a' }}>
                        {user?.name || user?.full_name || 'Traveler'}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.78rem', wordBreak: 'break-all' }}>
                        {user?.email || 'traveler@example.com'}
                      </div>
                      {user?.phone && (
                        <div style={{ color: '#64748b', fontSize: '0.76rem', marginTop: '2px' }}>
                          Phone: {user.phone}
                        </div>
                      )}
                    </div>

                    {/* Reservation Item */}
                    <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '0.68rem', color: '#0284c7', textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' }}>
                        Reservation
                      </div>
                      <div style={{ fontWeight: '800', color: '#0f172a' }}>{tripName}</div>
                      <div style={{ color: '#64748b', fontSize: '0.78rem' }}>📍 {destination}</div>
                      <div style={{ color: '#64748b', fontSize: '0.76rem', marginTop: '2px' }}>
                        📅 {travelDates} • 👥 {guests} Person{guests > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Perforated Divider */}
                  <div
                    style={{
                      borderTop: '1.5px dashed #cbd5e1',
                      margin: '12px 0 14px 0',
                      position: 'relative'
                    }}
                  />

                  {/* Line Items & Financial Breakdown */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Payment Breakdown
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#475569', marginBottom: '6px' }}>
                      <span>Base Fare / Booking Fee</span>
                      <span>₹{baseAmount.toLocaleString('en-IN')}</span>
                    </div>

                    {savingsAmt > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#059669', fontWeight: '700', marginBottom: '6px' }}>
                        <span>Coupon Discount ({appliedPromo?.code})</span>
                        <span>− ₹{savingsAmt.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#475569', marginBottom: '10px' }}>
                      <span>GST & Platform Taxes (5%)</span>
                      <span>+ ₹{gst.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Grand Total Row */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#f0fdf4',
                        border: '1.5px solid #86efac',
                        borderRadius: '8px',
                        padding: '10px 14px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#047857', textTransform: 'uppercase', fontWeight: '800' }}>
                          Total Paid ({methodStr})
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#059669' }}>
                          Transaction Status: Authorized & Settled
                        </div>
                      </div>
                      <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#065f46', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <IndianRupee size={20} />{totalAmt.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Academic Project Simulation Notice */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.72rem',
                      color: '#64748b',
                      textAlign: 'center',
                      lineHeight: 1.4
                    }}
                  >
                    🔒 <strong>Academic Demo Mode:</strong> This receipt is generated for simulated testing. No real money was charged or transferred.
                  </div>
                </div>
              </div>

              {/* 3. RECEIPT ACTION BUTTONS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Row 1: Print & Download */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    style={{
                      background: '#0084ff',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '11px 14px',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 3px 10px rgba(0, 132, 255, 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.94)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                  >
                    <Printer size={16} /> Print / Save as PDF
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadReceipt}
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '10px',
                      padding: '11px 14px',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      color: '#334155',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                  >
                    <Download size={16} /> Download Receipt
                  </button>
                </div>

                {/* Row 2: View in Dashboard & Back to Explore */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      handleModalClose();
                      navigate('/dashboard');
                    }}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      fontSize: '0.84rem',
                      fontWeight: '700',
                      color: '#0f172a',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                  >
                    View in My Bookings <ArrowRight size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={handleModalClose}
                    style={{
                      background: 'none',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      fontSize: '0.84rem',
                      fontWeight: '600',
                      color: '#64748b',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                  >
                    Done / Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ═══════════════ STEP 4 — FAILED RESULT (Section 4) ═══════════════ */}
        {step === 'failed' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#fef2f2',
                border: '2px solid #fecaca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px auto',
                color: '#dc2626'
              }}
            >
              <XCircle size={36} />
            </div>

            <h3 style={{ fontSize: '1.4rem', color: '#991b1b', fontWeight: '800', margin: '0 0 6px 0' }}>
              Demo Payment Failed
            </h3>

            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#991b1b',
                fontSize: '0.8rem',
                fontWeight: '600',
                marginBottom: '16px'
              }}
            >
              Simulated failure scenario: The transaction was declined by the simulated bank network. No real money was charged.
            </div>

            <div
              style={{
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '14px',
                textAlign: 'left',
                fontSize: '0.82rem',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Booking Reference:</span>
                <span style={{ fontWeight: '700' }}>{bookingResult?.booking_reference || `TH-BK-${bookingResult?.booking_id || 'DEMO'}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Simulated Transaction ID:</span>
                <span style={{ fontWeight: '700' }}>{bookingResult?.transaction?.demo_transaction_id || 'DEMO_TXN_FAILED'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Attempted Amount:</span>
                <span style={{ fontWeight: '700', color: '#dc2626' }}>₹{totalAmt.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setSimScenario('success');
                  setStep('payment');
                }}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontWeight: '700', borderRadius: '10px', height: '44px' }}
              >
                <RotateCcw size={16} /> Retry Payment
              </button>

              <button
                type="button"
                onClick={() => setStep('details')}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Back to Booking Details
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════ STEP 5 — CANCELLED RESULT (Section 4) ═══════════════ */}
        {step === 'cancelled' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#fffbeb',
                border: '2px solid #fde68a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px auto',
                color: '#d97706'
              }}
            >
              <AlertCircle size={36} />
            </div>

            <h3 style={{ fontSize: '1.4rem', color: '#92400e', fontWeight: '800', margin: '0 0 6px 0' }}>
              Payment Cancelled
            </h3>

            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 16px 0' }}>
              The demo transaction was cancelled by user. Your booking details and selected trip are preserved.
            </p>

            <div
              style={{
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '14px',
                textAlign: 'left',
                fontSize: '0.82rem',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Item / Package:</span>
                <span style={{ fontWeight: '700' }}>{tripName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Total Preserved:</span>
                <span style={{ fontWeight: '700', color: '#0284c7' }}>₹{totalAmt.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setSimScenario('success');
                  setStep('payment');
                }}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontWeight: '700', borderRadius: '10px', height: '44px' }}
              >
                Return to Payment
              </button>

              <button
                type="button"
                onClick={() => setStep('details')}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Back to Booking Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
