function getListingCapacityUnits(category, title, peopleCount) {
  if (category === 'Hotel' || category === 'Guide') return 1;
  if (category === 'Bus Operator' && /\b(car|cab|taxi|van|vehicle|private driver)\b/i.test(title || '')) return 1;
  return peopleCount;
}

function getListingPriceTotal(category, title, priceUnit, price, peopleCount) {
  const isPassengerPrice = priceUnit === 'per person'
    || (priceUnit === 'per trip' && category === 'Bus Operator'
      && !/\b(car|cab|taxi|van|vehicle|private driver)\b/i.test(title || ''));
  return Number(price || 0) * (isPassengerPrice ? peopleCount : 1);
}

function getListingRemainingCapacity(capacity, bookedUnits, defaultCapacity = 20) {
  const cap = Number(capacity) > 0 ? Number(capacity) : defaultCapacity;
  return Math.max(0, cap - Number(bookedUnits || 0));
}

module.exports = { getListingCapacityUnits, getListingPriceTotal, getListingRemainingCapacity };
