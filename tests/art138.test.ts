import { describe, expect, it } from 'vitest';
import { evaluateArt138 } from '../src/domain/art138.js';

describe('evaluateArt138', () => {
  it('does not equate cross-border movement with verified exemption', () => {
    expect(evaluateArt138('DE', 'IT', undefined).status).toBe('indeterminate');
  });

  it('verifies a supply with qualifying buyer VAT ID and correct recap', () => {
    const result = evaluateArt138('DE', 'IT', {
      buyerStatus: 'taxable_person',
      customerVatId: {
        status: 'known',
        country: 'IT',
        validation: 'valid',
        indicatedToSupplier: 'yes',
      },
      recapitulativeStatement: 'correct',
    });
    expect(result.status).toBe('verified');
  });

  it('rejects a departure-state customer VAT ID', () => {
    const result = evaluateArt138('DE', 'IT', {
      buyerStatus: 'taxable_person',
      customerVatId: {
        status: 'known',
        country: 'DE',
        validation: 'valid',
        indicatedToSupplier: 'yes',
      },
      recapitulativeStatement: 'correct',
    });
    expect(result.status).toBe('not_met');
  });

  it('returns conditional before recap is due', () => {
    const result = evaluateArt138('DE', 'IT', {
      buyerStatus: 'taxable_person',
      customerVatId: {
        status: 'known',
        country: 'IT',
        validation: 'valid',
        indicatedToSupplier: 'yes',
      },
      recapitulativeStatement: 'not_due_yet',
    });
    expect(result.status).toBe('conditional');
  });
});
