import { isEuMemberState } from '../knowledge/eu/memberStates.js';
import type { CountryCode } from './transaction.js';
import type { SupplyComplianceFacts } from './vatCase.js';

export type Art138Result =
  | { readonly status: 'not_applicable'; readonly rationale: string }
  | {
      readonly status: 'indeterminate';
      readonly missingFacts: readonly string[];
      readonly rationale: string;
    }
  | {
      readonly status: 'not_met';
      readonly failedConditions: readonly string[];
      readonly rationale: string;
    }
  | {
      readonly status: 'conditional';
      readonly pendingConditions: readonly string[];
      readonly rationale: string;
    }
  | {
      readonly status: 'verified';
      readonly legalRuleId: 'VAT_DIRECTIVE_ART_138_1';
      readonly rationale: string;
    };

export function evaluateArt138(
  departureCountry: CountryCode,
  destinationCountry: CountryCode,
  facts: SupplyComplianceFacts | undefined,
): Art138Result {
  const departure = departureCountry.toUpperCase();
  const destination = destinationCountry.toUpperCase();

  if (
    departure === destination ||
    !isEuMemberState(departure) ||
    !isEuMemberState(destination)
  ) {
    return {
      status: 'not_applicable',
      rationale:
        'Art. 138(1) applies to qualifying supplies involving movement from one EU Member State to another.',
    };
  }

  const buyerStatus = facts?.buyerStatus ?? 'unknown';
  const customerVatId = facts?.customerVatId ?? { status: 'unknown' as const };
  const recap = facts?.recapitulativeStatement ?? 'unknown';

  const missing: string[] = [];
  if (buyerStatus === 'unknown') missing.push('buyerStatus');
  if (customerVatId.status === 'unknown') missing.push('customerVatId');

  if (missing.length > 0) {
    return {
      status: 'indeterminate',
      missingFacts: missing,
      rationale:
        'The Art. 138 exemption cannot be concluded until the buyer status and VAT-ID facts for the moving supply are known.',
    };
  }

  const failed: string[] = [];
  if (buyerStatus === 'consumer') {
    failed.push('The recipient is not a qualifying taxable person or non-taxable legal person acting as such.');
  }

  if (customerVatId.status === 'none') {
    failed.push('No VAT identification number was indicated to the supplier.');
  }

  if (customerVatId.status === 'known') {
    if (customerVatId.country.toUpperCase() === departure) {
      failed.push('The indicated customer VAT ID was issued by the Member State of departure.');
    }
    if (customerVatId.validation === 'invalid') {
      failed.push('The indicated customer VAT ID is invalid.');
    }
    if (customerVatId.indicatedToSupplier === 'no') {
      failed.push('The customer VAT ID was not indicated to the supplier.');
    }
  }

  if (recap === 'missing' || recap === 'incorrect') {
    failed.push(
      'The recapitulative statement is missing or incorrect and no justification has been recorded.',
    );
  }

  if (failed.length > 0) {
    return {
      status: 'not_met',
      failedConditions: failed,
      rationale:
        'At least one material condition for the Art. 138(1) exemption is not met on the recorded facts.',
    };
  }

  const pending: string[] = [];
  if (customerVatId.status === 'known' && customerVatId.validation === 'unknown') {
    pending.push('Validate the customer VAT ID.');
  }
  if (customerVatId.status === 'known' && customerVatId.indicatedToSupplier === 'unknown') {
    pending.push('Confirm that the VAT ID was actually indicated to the supplier.');
  }
  if (recap === 'unknown' || recap === 'not_due_yet') {
    pending.push('Confirm the correct recapitulative statement when due.');
  }

  if (pending.length > 0) {
    return {
      status: 'conditional',
      pendingConditions: pending,
      rationale:
        'The supply is potentially exempt under Art. 138(1), but one or more compliance conditions are not yet verified.',
    };
  }

  return {
    status: 'verified',
    legalRuleId: 'VAT_DIRECTIVE_ART_138_1',
    rationale:
      recap === 'justified'
        ? 'The Art. 138(1) conditions are met and the recorded recapitulative-statement shortcoming is documented as duly justified.'
        : 'The recorded facts satisfy the Art. 138(1) VAT-ID and recapitulative-statement conditions.',
  };
}
