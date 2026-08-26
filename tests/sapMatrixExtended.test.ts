import { describe, expect, it } from 'vitest';
import { resolveSapTaxCode } from '../src/sap/mappings.js';

describe('extended SAP matrix', () => {
  it.each([
    ['EPDE', 'SI', 'IC_SUPPLY', 'C1'],
    ['EPDE', 'SI', 'IC_ACQUISITION', 'EC'],
    ['EPDE', 'PL', 'DOMESTIC_SALE', 'A4'],
    ['EPDE', 'PL', 'DOMESTIC_PURCHASE', 'B7'],
    ['EPDE', 'CZ', 'IC_SUPPLY', 'OB'],
    ['EPDE', 'CZ', 'IC_ACQUISITION', 'UR'],
    ['EPDE', 'BE', 'DOMESTIC_SALE', 'BS'],
    ['EPDE', 'LV', 'DOMESTIC_SALE', 'LS'],
    ['EPDE', 'EE', 'DOMESTIC_SALE', 'ES'],
    ['EPDE', 'NL', 'RC_DOMESTIC_SALE', 'NC'],
    ['EPDE', 'IT', 'IC_ACQUISITION', 'IP'],
    ['EPROHA', 'CH', 'DOMESTIC_SALE', 'B5'],
    ['EPROHA', 'CH', 'DOMESTIC_PURCHASE', 'IB'],
    ['EPROHA', 'DE', 'EXPORT', 'D0'],
    ['EPROHA', 'AT', 'NOT_TAXABLE', 'X0'],
  ] as const)('%s %s %s -> %s', (companyId, country, treatment, expected) => {
    expect(resolveSapTaxCode({ companyId, country, treatment })).toMatchObject({ status: 'matched', taxCode: expected });
  });

  it('keeps known matrix gaps unknown instead of inventing a code', () => {
    expect(resolveSapTaxCode({ companyId: 'EPDE', country: 'NL', treatment: 'IC_SUPPLY' })).toMatchObject({ status: 'unknown' });
    expect(resolveSapTaxCode({ companyId: 'EPDE', country: 'BE', treatment: 'IC_SUPPLY' })).toMatchObject({ status: 'unknown' });
  });
});
