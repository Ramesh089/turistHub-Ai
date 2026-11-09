function getHotelNightCount(checkIn, checkOut) {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(checkIn || '') || !datePattern.test(checkOut || '')) return null;

  const start = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
    || start.toISOString().slice(0, 10) !== checkIn
    || end.toISOString().slice(0, 10) !== checkOut) {
    return null;
  }

  const nights = (end.getTime() - start.getTime()) / 86400000;
  return Number.isInteger(nights) && nights > 0 ? nights : null;
}

function getHotelRoomPrice(pricePerNight, roomType) {
  const basePrice = Number(pricePerNight);
  if (!Number.isFinite(basePrice) || basePrice <= 0) return null;

  if (roomType === 'deluxe') return Math.round(basePrice * 1.4);
  if (roomType === 'suite') return Math.round(basePrice * 2.2);
  if (roomType === 'standard') return basePrice;
  return null;
}

function calculateHotelCheckoutTotal(roomPrice, nights, guests, discountAmount = 0) {
  const subtotal = Math.max(0, roomPrice * nights * guests - discountAmount);
  return subtotal + Math.round(subtotal * 0.05);
}

module.exports = { getHotelNightCount, getHotelRoomPrice, calculateHotelCheckoutTotal };
