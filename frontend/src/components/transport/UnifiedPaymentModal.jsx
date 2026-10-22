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
  Smartphone
} from 'lucide-react';

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

  const BANKS = [
    { name: 'HDFC Bank', code: 'HDFC', popular: true },
    { name: 'State Bank of India', code: 'SBI', popular: true },
    { name: 'ICICI Bank', code: 'ICICI', popular: true },
    { name: 'Axis Bank', code: 'AXIS', popular: true },
    { name: 'Kotak Mahindra Bank', code: 'KOTAK', popular: true },
    { name: 'Punjab National Bank', code: 'PNB', popular: false },
    { name: 'Bank of Baroda', code: 'BOB', popular: false }
  ];

  const handlePay = () => {
    setProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    setTimeout(() => {
      if (simulateFailure) {
        setProcessing(false);
        setPaymentStatus('failed');
        setErrorMessage('Transaction declined by payment simulation network (Test Failure Mode).');
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

          {/* Demo Mode Notice */}
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
            <Sparkles size={14} /> DEMO PAYMENT — NO REAL MONEY CHARGED
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div
                    style={{
                      border: '1.5px dashed #cbd5e1',
                      borderRadius: 16,
                      padding: 16,
                      textAlign: 'center',
                      background: '#f8fafc'
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 10 }}>
                      Scan QR with Google Pay, PhonePe, Paytm or BHIM
                    </div>
                    {/* Simulated SVG QR */}
                    <div
                      style={{
                        width: 140,
                        height: 140,
                        margin: '0 auto',
                        background: '#ffffff',
                        padding: 8,
                        borderRadius: 12,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <svg width="124" height="124" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="1.5">
                        <rect x="2" y="2" width="8" height="8" rx="1" fill="#0284c7" stroke="none" />
                        <rect x="14" y="2" width="8" height="8" rx="1" fill="#0284c7" stroke="none" />
                        <rect x="2" y="14" width="8" height="8" rx="1" fill="#0284c7" stroke="none" />
                        <rect x="5" y="5" width="2" height="2" fill="#fff" stroke="none" />
                        <rect x="17" y="5" width="2" height="2" fill="#fff" stroke="none" />
                        <rect x="5" y="17" width="2" height="2" fill="#fff" stroke="none" />
                        <path d="M14 14h2v2h-2zM18 14h4v2h-4zM14 18h2v4h-2zM18 18h4v4h-4z" fill="#0f172a" />
                      </svg>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 8 }}>
                      Scan code or enter VPA address below
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
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
                          fontSize: '0.9rem',
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
                          fontSize: '0.75rem',
                          color: '#16a34a',
                          fontWeight: 700
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
                  {/* Card Visual */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                      borderRadius: 14,
                      padding: 16,
                      color: '#ffffff',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontSize: '0.75rem', letterSpacing: 1, color: '#94a3b8' }}>TOURIST PLATINUM</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8' }}>VISA</span>
                    </div>
                    <div style={{ fontSize: '1.15rem', letterSpacing: 2, fontFamily: 'monospace', marginBottom: 14 }}>
                      {cardNumber}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>CARD HOLDER</div>
                        <div style={{ fontWeight: 700 }}>{cardName}</div>
                      </div>
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>EXPIRES</div>
                        <div style={{ fontWeight: 700 }}>{cardExpiry}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
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
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 8,
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.88rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
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
                            fontSize: '0.85rem'
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
                            fontSize: '0.85rem'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Net Banking Tab */}
              {method === 'netbanking' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                    Select Popular Indian Bank
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {BANKS.filter((b) => b.popular).map((b) => (
                      <button
                        key={b.code}
                        type="button"
                        onClick={() => setSelectedBank(b.name)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: selectedBank === b.name ? '2px solid #0284c7' : '1px solid #e2e8f0',
                          background: selectedBank === b.name ? '#f0f9ff' : '#ffffff',
                          color: selectedBank === b.name ? '#0284c7' : '#334155',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>

                  <div style={{ marginTop: 6 }}>
                    <label style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: 4 }}>
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
                        fontSize: '0.88rem'
                      }}
                    >
                      {BANKS.map((b) => (
                        <option key={b.code} value={b.name}>
                          {b.name}
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
                <span>QA Test: Simulate Payment Failure</span>
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
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
