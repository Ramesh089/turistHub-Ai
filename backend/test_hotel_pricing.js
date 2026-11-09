const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getHotelNightCount,
  getHotelRoomPrice,
  calculateHotelCheckoutTotal
} = require('./services/hotelPricing');

test('hotel nights require valid dates with checkout after check-in', () => {
  assert.equal(getHotelNightCount('2026-11-10', '2026-11-13'), 3);
  assert.equal(getHotelNightCount('2026-02-30', '2026-03-02'), null);
  assert.equal(getHotelNightCount('2026-11-10', '2026-11-10'), null);
  assert.equal(getHotelNightCount('2026-11-11', '2026-11-10'), null);
});

test('hotel room rates match the selected room and server catalogue rate', () => {
  assert.equal(getHotelRoomPrice(2500, 'standard'), 2500);
  assert.equal(getHotelRoomPrice(2500, 'deluxe'), 3500);
  assert.equal(getHotelRoomPrice(2500, 'suite'), 5500);
  assert.equal(getHotelRoomPrice(2500, 'unknown'), null);
});

test('hotel checkout total applies discount before tax over nights and guests', () => {
  assert.equal(calculateHotelCheckoutTotal(3500, 2, 2, 1000), 13650);
});
