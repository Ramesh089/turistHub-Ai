import React, { useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import UnifiedPaymentModal from './UnifiedPaymentModal';
import TicketModal from './TicketModal';
import {
  X,
  Car,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Users,
  Briefcase,
  ChevronRight,
  Info,
  Phone,
  User,
  Star,
  Fuel,
  Navigation
} from 'lucide-react';

export default function PrivateDriverModal({
  driverService,
  initialDate,
  onClose,
  onComplete
}) {
  const { user } = useAuth();

  const [step, setStep] = useState('details'); // details -> payment -> ticket
  const [tripType, setTripType] = useState('Outstation One-Way'); // One-way, Round-trip, Local Rental, Airport Transfer

  // Trip details
  const [pickupDate, setPickupDate] = useState(
    initialDate || new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [pickupTime, setPickupTime] = useState('09:00 AM');
  const [returnDate, setReturnDate] = useState('');
  const [pickupLocation, setPickupLocation] = useState(
    `${driverService.from_city || 'City'} Central Hotel / Airport`
  );
  const [dropLocation, setDropLocation] = useState(
    `${driverService.to_city || 'Destination'} Drop-off Point`
  );

  // Passenger & Contact
  const [passengerCount, setPassengerCount] = useState(2);
  const [luggageCount, setLuggageCount] = useState(2);
  const [primaryPassenger, setPrimaryPassenger] = useState(user?.name || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '9876543210');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [specialRequests, setSpecialRequests] = useState('English-speaking driver, clean sanitized AC vehicle');

  // Fare & Coupon
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Confirmed booking
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fare calculation
  const maxCapacity = driverService.seats_total || 5;
  const baseRate = Number(driverService.price || 3500);
  const tripMultiplier = tripType === 'Round-Trip' ? 1.75 : tripType === 'Local 8hr Rental' ? 0.9 : 1.0;
  const calculatedBaseFare = Math.round(baseRate * tripMultiplier);
  const tollAndDriverBata = 350; // Standard driver bata and toll allowance
  const gst = Math.round((calculatedBaseFare + tollAndDriverBata) * 0.05);
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const totalAmount = Math.max(0, calculatedBaseFare + tollAndDriverBata + gst - discount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await api.post('/bookings/apply-coupon', {
        code: couponCode,
        amount: calculatedBaseFare + tollAndDriverBata + gst
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
    if (!primaryPassenger.trim()) {
      alert('Please enter primary passenger name.');
      return;
    }
    if (!contactPhone.trim() || !contactEmail.trim()) {
      alert('Please enter contact mobile number and email for driver dispatch.');
      return;
    }
    if (!pickupLocation.trim() || !dropLocation.trim()) {
      alert('Please specify pickup address and drop-off location.');
      return;
    }
    if (passengerCount > maxCapacity) {
      alert(`This vehicle capacity is ${maxCapacity} passengers max. Please reduce traveler count or select a larger van.`);
      return;
    }
    setStep('payment');
  };

  const handlePaymentApproved = async (paymentDetails) => {
    setSubmitting(true);
    try {
      const payload = {
        transport_id: driverService.id,
        trip_type: tripType,
        pickup_location: pickupLocation,
        drop_location: dropLocation,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        return_date: returnDate || null,
        passengers_count: passengerCount,
        luggage_count: luggageCount,
        primary_passenger: primaryPassenger,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        special_requests: specialRequests,
        payment_method: paymentDetails.payment_method,
        transaction_id: paymentDetails.transaction_id,
        discount_code: appliedCoupon ? appliedCoupon.code : null,
        discount_amount: discount
      };

      const res = await api.post('/transport/driver/book', payload);

      if (res.data.success) {
        const ticketData = {
          ...driverService,
          booking_id: res.data.booking_id,
          booking_reference: res.data.booking_reference,
          travel_date: pickupDate,
          total_amount: res.data.total_amount || totalAmount,
          payment_method: paymentDetails.payment_method,
          transaction_id: paymentDetails.transaction_id,
          booking_details: {
            trip_type: tripType,
            pickup_location: pickupLocation,
            drop_location: dropLocation,
            pickup_time: pickupTime,
            driver_name: driverService.driver_name || 'Assigned Certified Chauffeur',
            driver_phone: driverService.driver_phone || '+91 98450 11223',
            vehicle_model: driverService.vehicle_model,
            passengers: [
              {
                name: primaryPassenger,
                age: 'Adult',
                gender: 'Primary Traveler',
                seat: `Full Vehicle Reservation (${passengerCount} Guests)`
              }
            ],
            contact_email: contactEmail,
            contact_phone: contactPhone
          }
        };
        setConfirmedBooking(ticketData);
        setStep('ticket');
        if (onComplete) onComplete(ticketData);
      } else {
        alert(res.data.message || 'Private driver reservation failed.');
      }
    } catch (err) {
      console.error('Driver booking error:', err);
      const msg = err.response?.data?.message || 'Error booking private chauffeur.';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
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
          maxWidth: 860,
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
            background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
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
              <Car size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#bbf7d0', color: '#14532d', padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 800 }}>
                  CHAUFFEUR SERVICE
                </span>
                <span style={{ fontSize: '0.8rem', color: '#dcfce7' }}>
                  ★ {driverService.rating || 4.9} Verified Driver Rating
                </span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '2px 0 0', color: '#fff' }}>
                {driverService.provider}
              </h2>
              <div style={{ fontSize: '0.82rem', color: '#dcfce7', marginTop: 2 }}>
                {driverService.vehicle_model} • Up to {maxCapacity} Passengers • AC • Free Cancellation
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
          {step === 'details' && (
            <div>
              {/* Trip Type Selector */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 8 }}>
                  Select Trip Itinerary Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    'Outstation One-Way',
                    'Round-Trip',
                    'Local 8hr Rental',
                    'Airport Transfer'
                  ].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTripType(type)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 10,
                        border: tripType === type ? '2px solid #16a34a' : '1px solid #cbd5e1',
                        background: tripType === type ? '#f0fdf4' : '#ffffff',
                        color: tripType === type ? '#15803d' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle Specifications & Chauffeur Card */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 14,
                  padding: 16,
                  border: '1px solid #e2e8f0',
                  marginBottom: 20,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 12,
                  textAlign: 'center'
                }}
              >
                <div style={{ borderRight: '1px solid #f1f5f9' }}>
                  <Users size={20} color="#16a34a" style={{ margin: '0 auto 4px' }} />
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Seating Capacity</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                    {maxCapacity} Guests Max
                  </div>
                </div>
                <div style={{ borderRight: '1px solid #f1f5f9' }}>
                  <Briefcase size={20} color="#16a34a" style={{ margin: '0 auto 4px' }} />
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Luggage Boot</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                    {driverService.luggage_capacity || 4} Large Bags
                  </div>
                </div>
                <div style={{ borderRight: '1px solid #f1f5f9' }}>
                  <Fuel size={20} color="#16a34a" style={{ margin: '0 auto 4px' }} />
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Fuel & AC</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                    100% Included
                  </div>
                </div>
                <div>
                  <Star size={20} color="#eab308" style={{ margin: '0 auto 4px' }} />
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Assigned Chauffeur</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                    {driverService.driver_name || 'Licensed Tourist Driver'}
                  </div>
                </div>
              </div>

              {/* Pickup & Schedule Form */}
              <div style={{ background: '#fff', borderRadius: 14, padding: 18, border: '1px solid #e2e8f0', marginBottom: 20 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>
                  Pickup & Schedule Details
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <MapPin size={14} color="#16a34a" /> Exact Pickup Address (Doorstep) *
                    </label>
                    <input
                      type="text"
                      required
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      placeholder="e.g. Hotel Grand, MG Road, Bengaluru"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Navigation size={14} color="#dc2626" /> Drop-off Address / Destination *
                    </label>
                    <input
                      type="text"
                      required
                      value={dropLocation}
                      onChange={(e) => setDropLocation(e.target.value)}
                      placeholder="e.g. Mysore Palace Gate 2 / Resort"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Calendar size={14} color="#16a34a" /> Pickup Date *
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Clock size={14} color="#16a34a" /> Reporting Time *
                    </label>
                    <input
                      type="text"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      placeholder="09:00 AM"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                      Passenger Count
                    </label>
                    <select
                      value={passengerCount}
                      onChange={(e) => setPassengerCount(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.85rem'
                      }}
                    >
                      {Array.from({ length: maxCapacity }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'Passenger' : 'Passengers'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Primary Contact & Fare Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
                {/* Contact info */}
                <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
                    Primary Passenger & Driver Coordination
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                        Lead Passenger Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={primaryPassenger}
                        onChange={(e) => setPrimaryPassenger(e.target.value)}
                        placeholder="e.g. Vikram Malhotra"
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: 6,
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                          Phone (Driver WhatsApp) *
                        </label>
                        <input
                          type="tel"
                          required
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
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                          Email (for Voucher) *
                        </label>
                        <input
                          type="email"
                          required
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
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                        Special Instructions for Chauffeur
                      </label>
                      <input
                        type="text"
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="e.g. Child seat, luggage rack, English speaking"
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
                          background: '#16a34a',
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
                <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
                      Transparent Chauffeur Fare
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem', color: '#475569' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Base Vehicle Hire ({tripType})</span>
                        <strong style={{ color: '#0f172a' }}>₹{calculatedBaseFare.toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Driver Bata, Tolls & State Border Permit</span>
                        <strong style={{ color: '#0f172a' }}>₹{tollAndDriverBata.toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>GST (5%)</span>
                        <strong style={{ color: '#0f172a' }}>₹{gst.toLocaleString('en-IN')}</strong>
                      </div>
                      {appliedCoupon && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                          <span>Promo Discount ({appliedCoupon.code})</span>
                          <strong>-₹{discount.toLocaleString('en-IN')}</strong>
                        </div>
                      )}
                      <div style={{ borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800, color: '#15803d' }}>
                        <span>Total Payable</span>
                        <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: 12, fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Info size={13} color="#16a34a" /> Free cancellation up to 6 hours before reporting time.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    style={{
                      marginTop: 16,
                      background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
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
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                    }}
                  >
                    Confirm & Proceed to Payment &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <UnifiedPaymentModal
              amount={totalAmount}
              serviceTitle={`${driverService.provider} (${tripType})`}
              onSuccess={handlePaymentApproved}
              onClose={() => setStep('details')}
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
