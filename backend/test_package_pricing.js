const test = require('node:test');
const assert = require('node:assert/strict');
const { calculatePackageCheckoutTotal } = require('./services/packagePricing');

test('package checkout total applies discount before 5% tax', () => {
  assert.equal(calculatePackageCheckoutTotal(10000, 2, 1500), 19425);
  assert.equal(calculatePackageCheckoutTotal(1000, 1, 2000), 0);
});
