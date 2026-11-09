import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Building2,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  IndianRupee,
  Lock,
  ArrowRight,
  Sparkles,
  Smartphone,
  Clock
} from 'lucide-react';
import {
  UpiLogo,
  GPayIcon,
  PhonePeIcon,
  PaytmIcon,
  BhimIcon,
  VisaIcon,
  MastercardIcon,
  RupayIcon,
  AmexIcon,
  SbiIcon,
  HdfcIcon,
  IciciIcon,
  AxisIcon,
  KotakIcon,
  PnbIcon,
  EmvChipIcon,
  ContactlessWaveIcon,
  PciDssBadge,
  SslEncryptionBadge,
  RbiSandboxBadge
} from '../payment/PaymentIcons';

export default function UnifiedPaymentModal({
  amount,
  serviceTitle,
  bookingReference,
  onSuccess,
  onClose
}) {
  const [method, setMethod] = useState('upi'); // upi, card, netbanking, wallet
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, success, failed
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [upiId, setUpiId] = useState('traveler@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4532 8920 1142 9081');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('883');
  const [cardName, setCardName] = useState('ROHIT SHARMA');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [walletBalance, setWalletBalance] = useState(25000);
  const [upiApp, setUpiApp] = useState('gpay');
  const [qrCountdown, setQrCountdown] = useState(540);

  const cardBrand = (() => {
    const clean = (cardNumber || '').replace(/\s+/g, '');
    if (clean.startsWith('4')) return 'visa';
    if (clean.startsWith('5')) return 'mastercard';
    if (clean.startsWith('6')) return 'rupay';
    if (clean.startsWith('3')) return 'amex';
    return 'visa';
  })();

  useEffect(() => {
    if (method !== 'upi') return;
    const timer = setInterval(() => {
      setQrCountdown((prev) => (prev > 0 ? prev - 1 : 540));
    }, 1000);
    return () => clearInterval(timer);
  }, [method]);

  const POPULAR_BANKS = [
    { name: 'State Bank of India', code: 'SBI', Icon: SbiIcon },
    { name: 'HDFC Bank', code: 'HDFC', Icon: HdfcIcon },
    { name: 'ICICI Bank', code: 'ICICI', Icon: IciciIcon },
    { name: 'Axis Bank', code: 'AXIS', Icon: AxisIcon },
    { name: 'Kotak Mahindra Bank', code: 'KOTAK', Icon: KotakIcon },
    { name: 'Punjab National Bank', code: 'PNB', Icon: PnbIcon }
  ];

  const OTHER_BANKS = [
    'Bank of Baroda',
    'Canara Bank',
    'Union Bank of India',
    'IndusInd Bank',
    'IDBI Bank',
    'Yes Bank',
    'Federal Bank'
  ];

  const handlePay = () => {
    setProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    setTimeout(() => {
      if (simulateFailure) {
        setProcessing(false);
        setPaymentStatus('failed');
        setErrorMessage('The transaction was declined. Please try another payment method.');
      } else {
        setProcessing(false);
        setPaymentStatus('success');
        const txnId = `TXN_IND_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
        setTimeout(() => {
          onSuccess({
            payment_method: method.toUpperCase(),
            transaction_id: txnId,
            paid_amount: amount,
            paid_at: new Date().toISOString()
          });
        }, 800);
      }
    }, 1600);
  };

  const handleRetry = () => {
    setSimulateFailure(false);
    setPaymentStatus('idle');
    setErrorMessage('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 10000,
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
          maxWidth: 580,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'fadeIn 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh'
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            padding: '20px 24px',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#bae6fd', fontWeight: 600 }}>
                <ShieldCheck size={16} /> Secure Payment Gateway
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '4px 0 2px', color: '#fff' }}>
                TouristHub Pay
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#e0f2fe', margin: 0 }}>
                {serviceTitle || 'Transport Reservation'}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={processing}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#fff',
                width: 34,
                height: 34,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Amount banner */}
          <div
            style={{
              marginTop: 16,
              background: 'rgba(255, 255, 255, 0.12)',
              borderRadius: 12,
              padding: '10px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#e0f2fe' }}>Total Payable:</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center' }}>
              <IndianRupee size={18} />{Number(amount).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Payment notice */}
          <div
            style={{
              marginTop: 10,
              background: '#fef3c7',
              color: '#92400e',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Sparkles size={14} /> Payment confirmation will appear after checkout
          </div>
        </div>

        {/* Content body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {paymentStatus === 'processing' ? (
            <div style={{ textAlign: 'center', padding: '50px 20px' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  border: '4px solid #e0f2fe',
                  borderTop: '4px solid #0284c7',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 20px'
                }}
              />
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 700, marginBottom: 6 }}>
                Simulating Bank Authorization...
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: 360, margin: '0 auto' }}>
                Verifying travel inventory & locking confirmed seats in database. Please do not close this window.
              </p>
            </div>
          ) : paymentStatus === 'success' ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div
                style={{
                  width: 68,
                  height: 68,
                  background: '#dcfce7',
                  color: '#16a34a',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}
              >
                <CheckCircle2 size={40} />
              </div>
              <h3 style={{ fontSize: '1.3rem', color: '#166534', fontWeight: 800, marginBottom: 6 }}>
                Payment Approved!
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569' }}>
                Simulated transaction completed. Generating your official ticket...
              </p>
            </div>
          ) : paymentStatus === 'failed' ? (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  background: '#fee2e2',
                  color: '#dc2626',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}
              >
                <AlertTriangle size={34} />
              </div>
              <h3 style={{ fontSize: '1.2rem', color: '#991b1b', fontWeight: 800, marginBottom: 6 }}>
                Simulated Payment Declined
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 20 }}>
                {errorMessage}
              </p>
              <button
                onClick={handleRetry}
                style={{
                  background: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <RotateCcw size={16} /> Retry Payment
              </button>
            </div>
          ) : (
            <div>
              {/* Payment Methods Tabs */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8,
                  marginBottom: 20
                }}
              >
                {[
                  { id: 'upi', label: 'UPI / QR', icon: <QrCode size={18} /> },
                  { id: 'card', label: 'Cards', icon: <CreditCard size={18} /> },
                  { id: 'netbanking', label: 'Net Banking', icon: <Building2 size={18} /> },
                  { id: 'wallet', label: 'Wallet', icon: <Wallet size={18} /> }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 6px',
                      borderRadius: 12,
                      border: method === m.id ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      background: method === m.id ? '#f0f9ff' : '#ffffff',
                      color: method === m.id ? '#0284c7' : '#64748b',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {m.icon}
                    {m.label}
                  </button>
                ))}
              </div>

              {/* UPI Tab */}
              {method === 'upi' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div
                    style={{
                      border: '1.5px dashed #93c5fd',
                      borderRadius: 16,
                      padding: 16,
                      textAlign: 'center',
                      background: '#ffffff',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                      <UpiLogo size={20} />
                      <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
                        Scan & Pay with Any UPI App
                      </span>
                    </div>

                    {/* Simulated QR with Center UPI Badge */}
                    <div
                      style={{
                        width: 140,
                        height: 140,
                        margin: '0 auto',
                        background: '#ffffff',
                        padding: 8,
                        borderRadius: 12,
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #0284c7',
                        position: 'relative'
                      }}
                    >
                      <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="2" width="7" height="7" rx="1" fill="#0284c7" />
                        <rect x="3.5" y="3.5" width="4" height="4" rx="0.5" fill="#fff" />
                        <rect x="4.5" y="4.5" width="2" height="2" fill="#0284c7" />

                        <rect x="15" y="2" width="7" height="7" rx="1" fill="#0284c7" />
                        <rect x="16.5" y="3.5" width="4" height="4" rx="0.5" fill="#fff" />
                        <rect x="17.5" y="4.5" width="2" height="2" fill="#0284c7" />

                        <rect x="2" y="15" width="7" height="7" rx="1" fill="#0284c7" />
                        <rect x="3.5" y="16.5" width="4" height="4" rx="0.5" fill="#fff" />
                        <rect x="4.5" y="17.5" width="2" height="2" fill="#0284c7" />

                        <rect x="10.5" y="2" width="2" height="2" fill="#0f172a" />
                        <rect x="10.5" y="5" width="2" height="2" fill="#0f172a" />
                        <rect x="2" y="10.5" width="2" height="2" fill="#0f172a" />
                        <rect x="5" y="10.5" width="2" height="2" fill="#0f172a" />
                        <rect x="15" y="10.5" width="2" height="2" fill="#0f172a" />
                        <rect x="18" y="10.5" width="2" height="2" fill="#0f172a" />
                        <rect x="10.5" y="15" width="2" height="2" fill="#0f172a" />
                        <rect x="10.5" y="18" width="2" height="2" fill="#0f172a" />
                        <rect x="15" y="15" width="3" height="3" fill="#0f172a" />
                        <rect x="19" y="15" width="3" height="3" fill="#0f172a" />
                        <rect x="15" y="19" width="3" height="3" fill="#0f172a" />
                        <rect x="19" y="19" width="3" height="3" fill="#0f172a" />
                      </svg>
                      <div
                        style={{
                          position: 'absolute',
                          background: '#fff',
                          padding: 2,
                          borderRadius: 4,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        <UpiLogo size={18} />
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 8,
                        background: '#fef3c7',
                        color: '#92400e',
                        padding: '3px 8px',
                        borderRadius: 16,
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}
                    >
                      <Clock size={12} /> QR expires in{' '}
                      {String(Math.floor(qrCountdown / 60)).padStart(2, '0')}:
                      {String(qrCountdown % 60).padStart(2, '0')}
                    </div>
                  </div>

                  {/* Popular UPI Apps Grid */}
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Or choose your UPI app:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                      {[
                        { id: 'gpay', name: 'Google Pay', Icon: GPayIcon, color: '#4285F4' },
                        { id: 'phonepe', name: 'PhonePe', Icon: PhonePeIcon, color: '#5f259f' },
                        { id: 'paytm', name: 'Paytm', Icon: PaytmIcon, color: '#00BAF2' },
                        { id: 'bhim', name: 'BHIM UPI', Icon: BhimIcon, color: '#00a859' }
                      ].map((app) => (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => setUpiApp(app.id)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4,
                            padding: '8px 4px',
                            borderRadius: 10,
                            border: upiApp === app.id ? `2px solid ${app.color}` : '1px solid #e2e8f0',
                            background: upiApp === app.id ? '#f8fafc' : '#ffffff',
                            cursor: 'pointer'
                          }}
                        >
                          <app.Icon size={24} />
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1e293b' }}>
                            {app.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                      UPI ID / VPA
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="username@okhdfcbank"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 10,
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: '#0f172a'
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '0.72rem',
                          color: '#16a34a',
                          fontWeight: 700,
                          background: '#ecfdf5',
                          padding: '2px 6px',
                          borderRadius: 6
                        }}
                      >
                        ✓ Verified
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Card Tab */}
              {method === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Modern 3D Card Visual */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)',
                      borderRadius: 16,
                      padding: 16,
                      color: '#ffffff',
                      boxShadow: '0 8px 22px rgba(2, 132, 199, 0.25)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <EmvChipIcon size={32} />
                        <ContactlessWaveIcon size={18} color="#94a3b8" />
                      </div>
                      <div>
                        {cardBrand === 'visa' && <VisaIcon size={20} />}
                        {cardBrand === 'mastercard' && <MastercardIcon size={20} />}
                        {cardBrand === 'rupay' && <RupayIcon size={20} />}
                        {cardBrand === 'amex' && <AmexIcon size={20} />}
                      </div>
                    </div>
                    <div style={{ fontSize: '1.15rem', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 12 }}>
                      {cardNumber}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '0.62rem', letterSpacing: 0.5 }}>CARD HOLDER</div>
                        <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>{cardName}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#94a3b8', fontSize: '0.62rem', letterSpacing: 0.5 }}>EXPIRES</div>
                        <div style={{ fontWeight: 800, fontFamily: 'monospace' }}>{cardExpiry}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 8,
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.88rem',
                          fontWeight: 600
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                        Expiry / CVV
                      </label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          style={{
                            width: '50%',
                            padding: '9px 8px',
                            borderRadius: 8,
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.85rem',
                            textAlign: 'center'
                          }}
                        />
                        <input
                          type="password"
                          value={cardCvv}
                          maxLength={3}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="CVV"
                          style={{
                            width: '50%',
                            padding: '9px 8px',
                            borderRadius: 8,
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.85rem',
                            textAlign: 'center'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Supported Networks Strip */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Supported networks:</span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <VisaIcon size={18} />
                      <MastercardIcon size={18} />
                      <RupayIcon size={18} />
                      <AmexIcon size={18} />
                    </div>
                  </div>
                </div>
              )}

              {/* Net Banking Tab */}
              {method === 'netbanking' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155' }}>
                    Select Popular Indian Bank
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {POPULAR_BANKS.map((b) => (
                      <button
                        key={b.code}
                        type="button"
                        onClick={() => setSelectedBank(b.name)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                          padding: '10px 6px',
                          borderRadius: 10,
                          border: selectedBank === b.name ? '2px solid #0284c7' : '1px solid #e2e8f0',
                          background: selectedBank === b.name ? '#f0f9ff' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <b.Icon size={26} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', textAlign: 'center' }}>
                          {b.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div style={{ marginTop: 4 }}>
                    <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 4 }}>
                      Or choose other bank:
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.85rem'
                      }}
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b.code} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                      {OTHER_BANKS.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Wallet Tab */}
              {method === 'wallet' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: 14,
                      padding: 18,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>TouristHub Digital Wallet Balance</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center' }}>
                        <IndianRupee size={18} />{walletBalance.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <span
                      style={{
                        background: '#dcfce7',
                        color: '#166534',
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      Sufficient Balance
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    1-Click checkout enabled. ₹{Number(amount).toLocaleString('en-IN')} will be deducted from your simulated wallet balance.
                  </div>
                </div>
              )}

              {/* Developer / QA Test Toggle */}
              <div
                style={{
                  marginTop: 20,
                  padding: '8px 12px',
                  background: '#f1f5f9',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: '#64748b'
                }}
              >
                <span>Decline this payment</span>
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
              </div>

              {/* Trust Badges */}
              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 8,
                  flexWrap: 'wrap'
                }}
              >
                <SslEncryptionBadge />
                <PciDssBadge />
                <RbiSandboxBadge />
              </div>

              {/* Pay Button */}
              <button
                type="button"
                onClick={handlePay}
                style={{
                  marginTop: 18,
                  width: '100%',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px',
                  borderRadius: 12,
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                  transition: 'transform 0.1s'
                }}
              >
                <Lock size={16} /> Pay ₹{Number(amount).toLocaleString('en-IN')} (Simulated)
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
