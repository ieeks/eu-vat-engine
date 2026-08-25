import { describe, expect, it } from 'vitest';
import { EU_MEMBER_STATES, isEuMemberState } from '../src/knowledge/eu/memberStates.js';
import { EU_LEGAL_RULES } from '../src/knowledge/eu/legalRules.js';

describe('EU reference data', () => {
  it('contains exactly the EU-27 baseline', () => {
    expect(EU_MEMBER_STATES).toHaveLength(27);
  });

  it('uses GR as the jurisdiction code for Greece rather than the VAT prefix EL', () => {
    expect(isEuMemberState('GR')).toBe(true);
    expect(isEuMemberState('EL')).toBe(false);
  });

  it('keeps official legal-source provenance with reviewed dates', () => {
    expect(EU_LEGAL_RULES.VAT_DIRECTIVE_ART_36A_2.source).toMatchObject({
      url: expect.stringContaining('eur-lex.europa.eu'),
      reviewedOn: '2026-08-26',
    });
  });
});
