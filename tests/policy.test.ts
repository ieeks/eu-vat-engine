import { describe, expect, it } from 'vitest';
import { COMPANIES } from '../src/companies/companies.js';
import { evaluateTriangleCompanyPolicy } from '../src/policy/trianglePolicy.js';

describe('company policy overlay', () => {
  const legal = {
    status: 'applicable',
    intermediaryPartyId: 'EPDE',
    subsequentSupplyId: 'L2' as const,
    legalRuleIds: ['VAT_DIRECTIVE_ART_141', 'VAT_DIRECTIVE_ART_197'] as const,
    rationale: 'legal result',
  } as const;

  it('keeps legal and company-policy results separate', () => {
    const itResult = evaluateTriangleCompanyPolicy(
      COMPANIES.EPDE,
      'IT',
      legal,
      'company_policy',
    );
    expect(itResult.status).toBe('allowed');

    const siResult = evaluateTriangleCompanyPolicy(
      COMPANIES.EPDE,
      'SI',
      legal,
      'company_policy',
    );
    expect(siResult).toMatchObject({
      status: 'blocked_by_company_policy',
      legalResult: 'applicable',
    });
  });
});
