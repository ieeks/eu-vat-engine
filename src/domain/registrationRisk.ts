import type { Party } from './transaction.js';
import type { NationalRcResult } from './reverseCharge.js';
import type { TriangleResult } from './triangle.js';

function hasRegistration(party: Party, country: string): boolean {
  const target = country.toUpperCase();
  return (party.vatRegistrations ?? []).some(
    (registration) => registration.country.toUpperCase() === target,
  );
}

function isEstablished(party: Party, country: string): boolean {
  const target = country.toUpperCase();
  return (
    party.establishmentCountry.toUpperCase() === target ||
    (party.fixedEstablishments ?? []).some(
      (item) => item.toUpperCase() === target,
    )
  );
}

export type RegistrationRiskResult =
  | { readonly status: 'none_established'; readonly rationale: string }
  | { readonly status: 'none_reverse_charge'; readonly rationale: string }
  | { readonly status: 'already_registered'; readonly rationale: string }
  | { readonly status: 'registration_required'; readonly rationale: string }
  | { readonly status: 'review_required'; readonly rationale: string };

export function evaluateDomesticSellerRegistrationRisk(
  seller: Party,
  country: string,
  reverseCharge: NationalRcResult,
): RegistrationRiskResult {
  if (isEstablished(seller, country)) {
    return {
      status: 'none_established',
      rationale: 'The seller is established in the country of the domestic supply.',
    };
  }

  if (reverseCharge.status === 'applies') {
    return {
      status: 'none_reverse_charge',
      rationale:
        'The verified reverse-charge result shifts liability to the customer for this supply.',
    };
  }

  if (hasRegistration(seller, country)) {
    return {
      status: 'already_registered',
      rationale:
        'The seller already has a VAT registration in the country of the domestic supply.',
    };
  }

  if (
    reverseCharge.status === 'indeterminate' ||
    reverseCharge.status === 'country_rule_not_verified'
  ) {
    return {
      status: 'review_required',
      rationale:
        'Registration cannot be concluded until the national reverse-charge rule is resolved.',
    };
  }

  return {
    status: 'registration_required',
    rationale:
      'A domestic taxable supply is recorded with no establishment, no existing VAT registration and no verified reverse charge.',
  };
}

export function evaluateAcquisitionRegistrationRisk(
  acquirer: Party,
  destinationCountry: string,
  triangle: TriangleResult,
): RegistrationRiskResult {
  if (triangle.status === 'applicable') {
    return {
      status: 'none_reverse_charge',
      rationale:
        'The triangular simplification is recorded as applicable, so a destination registration is not required solely for this acquisition/subsequent-supply chain.',
    };
  }

  if (hasRegistration(acquirer, destinationCountry)) {
    return {
      status: 'already_registered',
      rationale:
        'The acquirer already has a VAT registration in the destination Member State.',
    };
  }

  if (triangle.status === 'conditional' || triangle.status === 'indeterminate') {
    return {
      status: 'review_required',
      rationale:
        'The registration outcome depends on unresolved triangular-simplification facts.',
    };
  }

  return {
    status: 'registration_required',
    rationale:
      'The intra-Community acquisition occurs in the destination Member State and no applicable triangular simplification or existing registration is recorded.',
  };
}
