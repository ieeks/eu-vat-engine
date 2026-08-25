import { describe, expect, it } from 'vitest';
import { evaluateNationalReverseCharge } from '../src/domain/reverseCharge.js';

describe('national reverse charge', () => {
  it('does not block Italian RC merely because seller is VAT registered', () => {
    const result = evaluateNationalReverseCharge({
      country: 'IT',
      sellerEstablished: false,
      sellerVatRegistered: true,
      buyerEstablished: 'yes',
      buyerVatRegistered: 'yes',
      buyerPeriodicReturnFiler: 'unknown',
    });
    expect(result.status).toBe('applies');
  });

  it('requires Belgian customer periodic-filer fact', () => {
    const result = evaluateNationalReverseCharge({
      country: 'BE',
      sellerEstablished: false,
      sellerVatRegistered: true,
      buyerEstablished: 'yes',
      buyerVatRegistered: 'yes',
      buyerPeriodicReturnFiler: 'unknown',
    });
    expect(result.status).toBe('indeterminate');
  });

  it('applies the verified Polish ordinary-goods rule for a non-registered foreign supplier and qualifying buyer', () => {
    const result = evaluateNationalReverseCharge({
      country: 'PL',
      sellerEstablished: false,
      sellerVatRegistered: false,
      buyerEstablished: 'yes',
      buyerVatRegistered: 'yes',
      buyerPeriodicReturnFiler: 'yes',
      buyerTaxablePerson: 'yes',
    });
    expect(result).toMatchObject({
      status: 'applies',
      sourceId: 'PL_VAT_ACT_ART17_1_5',
    });
  });
});
