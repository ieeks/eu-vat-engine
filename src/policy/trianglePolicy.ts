import type { CompanyConfig } from '../companies/companyConfig.js';
import type { TriangleResult } from '../domain/triangle.js';

export type TrianglePolicyResult =
  | { readonly status: 'not_applied'; readonly rationale: string }
  | {
      readonly status: 'allowed';
      readonly legalResult: TriangleResult['status'];
      readonly rationale: string;
    }
  | {
      readonly status: 'blocked_by_company_policy';
      readonly legalResult: TriangleResult['status'];
      readonly rationale: string;
    };

export function evaluateTriangleCompanyPolicy(
  company: CompanyConfig | undefined,
  destinationCountry: string,
  legalResult: TriangleResult,
  mode: 'legal_only' | 'company_policy',
): TrianglePolicyResult {
  if (!company || mode === 'legal_only') {
    return {
      status: 'not_applied',
      rationale: 'No company-policy overlay was applied.',
    };
  }

  if (company.policy.triangleDestinationVatRegistration === 'legal_baseline') {
    return {
      status: 'allowed',
      legalResult: legalResult.status,
      rationale:
        'The company policy follows the legal baseline and does not add a destination-registration blocker.',
    };
  }

  const target = destinationCountry.toUpperCase();
  const hasDestinationRegistration = company.vatRegistrations.some(
    (registration) => registration.country.toUpperCase() === target,
  );

  if (
    hasDestinationRegistration &&
    (legalResult.status === 'applicable' || legalResult.status === 'conditional')
  ) {
    return {
      status: 'blocked_by_company_policy',
      legalResult: legalResult.status,
      rationale:
        'The legal engine does not equate registration with establishment, but this legacy company policy conservatively blocks the simplification where a destination VAT registration exists. The policy is flagged for revalidation.',
    };
  }

  return {
    status: 'allowed',
    legalResult: legalResult.status,
    rationale:
      'The configured conservative destination-registration policy does not block this case.',
  };
}
