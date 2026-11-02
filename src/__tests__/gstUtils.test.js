import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateGstTax, resolveStateCode, numberToIndianWords } from '../utils/gstUtils.js';

test('GST State Code Lookup maps state names correctly', () => {
  assert.equal(resolveStateCode('Karnataka'), '29');
  assert.equal(resolveStateCode('Maharashtra'), '27');
  assert.equal(resolveStateCode('Delhi'), '07');
  assert.equal(resolveStateCode('Tamil Nadu'), '33');
});

test('calculateGstTax splits CGST and SGST for Intra-State orders', () => {
  const result = calculateGstTax({
    items: [{ price: 1000, quantity: 1, gstRate: 18 }],
    merchantStateCode: '29', // Karnataka
    buyerStateCode: '29',    // Karnataka
    pricesIncludeGst: false
  });

  assert.equal(result.isIntraState, true);
  assert.equal(result.totalCgst, 90); // 9%
  assert.equal(result.totalSgst, 90); // 9%
  assert.equal(result.totalIgst, 0);
  assert.equal(result.totalGst, 180);
  assert.equal(result.netPayable, 1180);
});

test('calculateGstTax assigns full IGST for Inter-State orders', () => {
  const result = calculateGstTax({
    items: [{ price: 2000, quantity: 1, gstRate: 18 }],
    merchantStateCode: '29', // Karnataka
    buyerStateCode: '27',    // Maharashtra
    pricesIncludeGst: false
  });

  assert.equal(result.isIntraState, false);
  assert.equal(result.totalCgst, 0);
  assert.equal(result.totalSgst, 0);
  assert.equal(result.totalIgst, 360); // 18%
  assert.equal(result.totalGst, 360);
  assert.equal(result.netPayable, 2360);
});

test('calculateGstTax computes reverse tax correctly when price includes GST', () => {
  const result = calculateGstTax({
    items: [{ price: 1180, quantity: 1, gstRate: 18 }],
    merchantStateCode: '29',
    buyerStateCode: '29',
    pricesIncludeGst: true
  });

  assert.equal(result.items[0].taxableValue, 1000);
  assert.equal(result.totalGst, 180);
  assert.equal(result.netPayable, 1180);
});

test('numberToIndianWords formats numbers into words correctly', () => {
  assert.match(numberToIndianWords(1000), /One Thousand/i);
  assert.match(numberToIndianWords(25000), /Twenty Five Thousand/i);
});
