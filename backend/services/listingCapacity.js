function getListingCapacityUnits(category, title, peopleCount) {
  const count = Number(peopleCount) > 0 ? Number(peopleCount) : 1;
  if (category === 'Bus Operator' && /\b(car|cab|taxi|van|vehicle|private driver)\b/i.test(title || '')) return 1;
  return count;
}

function getListingPriceTotal(category, title, priceUnit, price, peopleCount) {
  const count = Number(peopleCount) > 0 ? Number(peopleCount) : 1;
  const isPrivateVehicle = /\b(car|cab|taxi|van|vehicle|private driver|full cab)\b/i.test(title || '');

  if (category === 'Bus Operator') {
    if (isPrivateVehicle) return Number(price || 0);
    return Number(price || 0) * count;
  }
  if (category === 'Tour & Travel' || category === 'Travel Package') {
    return Number(price || 0) * count;
  }
  if (category === 'Guide') {
    return Number(price || 0) * count;
  }
  if (category === 'Hotel') {
    return Number(price || 0) * count;
  }

  return Number(price || 0) * count;
}

function getListingRemainingCapacity(capacity, bookedUnits, defaultCapacity = 20) {
  const cap = Number(capacity) > 0 ? Number(capacity) : defaultCapacity;
  return Math.max(0, cap - Number(bookedUnits || 0));
}

module.exports = { getListingCapacityUnits, getListingPriceTotal, getListingRemainingCapacity };
