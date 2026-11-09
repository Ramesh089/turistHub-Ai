const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getListingCapacityUnits,
  getListingPriceTotal,
  getListingRemainingCapacity
} = require('./services/listingCapacity');

test('hotel and guide listings consume one capacity unit per booking', () => {
  assert.equal(getListingCapacityUnits('Hotel', 'Deluxe room', 4), 1);
  assert.equal(getListingCapacityUnits('Guide', 'Local guide', 4), 1);
});

test('private vehicles consume one unit while buses and person-based services consume guests', () => {
  assert.equal(getListingCapacityUnits('Bus Operator', 'Private cab', 4), 1);
  assert.equal(getListingCapacityUnits('Bus Operator', 'Sleeper bus', 4), 4);
  assert.equal(getListingCapacityUnits('Tour & Travel', 'Heritage package', 4), 4);
  assert.equal(getListingCapacityUnits('Adventure', 'Day trek', 4), 4);
});

test('listed prices scale by guests only when their unit is per person', () => {
  assert.equal(getListingPriceTotal('Hotel', 'Deluxe room', 'per night', 2500, 2), 2500);
  assert.equal(getListingPriceTotal('Bus Operator', 'Sleeper bus', 'per trip', 650, 3), 1950);
  assert.equal(getListingPriceTotal('Bus Operator', 'Private cab', 'per trip', 2000, 3), 2000);
  assert.equal(getListingPriceTotal('Tour & Travel', 'Heritage tour', 'per person', 1500, 3), 4500);
});

test('remaining capacity never goes below zero', () => {
  assert.equal(getListingRemainingCapacity(10, 4), 6);
  assert.equal(getListingRemainingCapacity(1, 1), 0);
  assert.equal(getListingRemainingCapacity(1, 3), 0);
});
