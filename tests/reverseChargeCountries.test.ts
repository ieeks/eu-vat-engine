import { describe, expect, it } from 'vitest';
import { evaluateNationalReverseCharge } from '../src/domain/reverseCharge.js';

function base(country: string) {
  return {
    country,
    sellerEstablished: false,
    sellerVatRegistered: false,
    buyerEstablished: 'yes' as const,
    buyerVatRegistered: 'yes' as const,
    buyerPeriodicReturnFiler: 'yes' as const,
    buyerTaxablePerson: 'yes' as const,
    buyerGeneralSchemeVatRegistered: 'yes' as const,
    transactionType: 'ordinary_goods' as const,
  };
}

describe('verified country distinctions', () => {
  it('Italy does not treat direct supplier VAT registration as establishment', () => {
    expect(evaluateNationalReverseCharge({ ...base('IT'), sellerVatRegistered: true }).status).toBe('applies');
  });

  it('Belgium does not automatically block the qualifying branch because the supplier has a Belgian VAT ID', () => {
    expect(evaluateNationalReverseCharge({ ...base('BE'), sellerVatRegistered: true }).status).toBe('applies');
  });

  it('Netherlands shifts ordinary-goods VAT to a Netherlands-established customer even if the foreign supplier has a Dutch VAT ID', () => {
    expect(evaluateNationalReverseCharge({ ...base('NL'), sellerVatRegistered: true }).status).toBe('applies');
  });

  it('Poland requires the ordinary-goods foreign supplier not to be Polish VAT-registered', () => {
    expect(evaluateNationalReverseCharge(base('PL')).status).toBe('applies');
    expect(evaluateNationalReverseCharge({ ...base('PL'), sellerVatRegistered: true }).status).toBe('does_not_apply');
  });

  it('Czechia requires the non-established supplier not to hold valid Czech payer registration', () => {
    expect(evaluateNationalReverseCharge(base('CZ')).status).toBe('applies');
    expect(evaluateNationalReverseCharge({ ...base('CZ'), sellerVatRegistered: true }).status).toBe('does_not_apply');
  });

  it('Slovenia switches supplier liability when the foreign supplier elects Slovenian VAT identification', () => {
    expect(evaluateNationalReverseCharge(base('SI')).status).toBe('applies');
    expect(evaluateNationalReverseCharge({ ...base('SI'), sellerVatRegistered: true }).status).toBe('does_not_apply');
  });

  it('Estonia general RC requires the foreign supplier not to be Estonian VAT-registered', () => {
    expect(evaluateNationalReverseCharge(base('EE')).status).toBe('applies');
    expect(evaluateNationalReverseCharge({ ...base('EE'), sellerVatRegistered: true }).status).toBe('does_not_apply');
  });

  it('Latvia does not activate a generic ordinary-goods reverse charge from incomplete facts', () => {
    expect(evaluateNationalReverseCharge({ ...base('LV'), sellerVatRegistered: true }).status).toBe('does_not_apply');
    expect(evaluateNationalReverseCharge(base('LV')).status).toBe('country_rule_not_verified');
  });
});
