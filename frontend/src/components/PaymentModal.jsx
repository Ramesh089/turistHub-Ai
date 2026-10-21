import React from 'react';
import BookingModal from './BookingModal';

/**
 * PaymentModal — Standardized wrapper around modern BookingModal
 * Replicates the clean Image 1 reference design across all legacy imports.
 */
export default function PaymentModal({
  pkg,
  initialPlan = null,
  onClose,
  onBookingComplete
}) {
  return (
    <BookingModal
      bookingType="package"
      item={pkg}
      initialPlan={initialPlan}
      onClose={onClose}
      onComplete={onBookingComplete}
    />
  );
}
