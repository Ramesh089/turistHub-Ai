function calculatePackageCheckoutTotal(price, people, discountAmount = 0) {
  const subtotal = Math.max(0, Number(price) * people - discountAmount);
  return subtotal + Math.round(subtotal * 0.05);
}

module.exports = { calculatePackageCheckoutTotal };
