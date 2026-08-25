import { describe, expect, it } from 'vitest';
import { resolveSapTaxCode } from '../src/sap/mappings.js';

describe('SAP mapping', () => {
  it('returns a known EPDE mapping', () => {
    expect(resolveSapTaxCode({
      companyId: 'EPDE',
      country: 'DE',
      treatment: 'IC_SUPPLY',
    })).toMatchObject({ status: 'matched', taxCode: 'DH' });
  });

  it('never invents an unknown mapping', () => {
    expect(resolveSapTaxCode({
      companyId: 'EPDE',
      country: 'HU',
      treatment: 'DOMESTIC_SALE',
    }).status).toBe('unknown');
  });
});
