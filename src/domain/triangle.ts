import type { MovingSupplyDecision } from './movingSupply.js';
import { supplyId, type ChainTransaction } from './transaction.js';
import type { AcquisitionFacts, SupplyComplianceFacts } from './vatCase.js';

type DeterminedMovingSupply = Extract<MovingSupplyDecision, { status: 'determined' }>;

export type TriangleResult =
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
      readonly intermediaryPartyId: string;
      readonly subsequentSupplyId: `L${number}`;
      readonly pendingConditions: readonly string[];
      readonly rationale: string;
    }
  | {
      readonly status: 'applicable';
      readonly intermediaryPartyId: string;
      readonly subsequentSupplyId: `L${number}`;
      readonly legalRuleIds: readonly [
        'VAT_DIRECTIVE_ART_141',
        'VAT_DIRECTIVE_ART_197',
      ];
      readonly rationale: string;
    };

function isEstablishedIn(
  transaction: ChainTransaction,
  partyIndex: number,
  country: string,
): boolean {
  const party = transaction.parties[partyIndex];
  if (!party) return false;
  const target = country.toUpperCase();
  return (
    party.establishmentCountry.toUpperCase() === target ||
    (party.fixedEstablishments ?? []).some(
      (item) => item.toUpperCase() === target,
    )
  );
}

export function evaluateTriangle(
  transaction: ChainTransaction,
  movingSupply: DeterminedMovingSupply,
  supplyFacts: Readonly<Record<string, SupplyComplianceFacts>> | undefined,
  acquisitionFacts: AcquisitionFacts | undefined,
): TriangleResult {
  const intermediaryIndex = movingSupply.movingSupplyIndex + 1;
  const subsequentSupplyIndex = intermediaryIndex;

  if (subsequentSupplyIndex >= transaction.parties.length - 1) {
    return {
      status: 'not_applicable',
      rationale:
        'The buyer of the moving supply does not make a subsequent supply within this chain.',
    };
  }

  const intermediary = transaction.parties[intermediaryIndex];
  if (!intermediary) {
    return {
      status: 'not_applicable',
      rationale: 'No intermediary party exists for the candidate triangle.',
    };
  }

  const destination = transaction.destinationCountry.toUpperCase();
  const departure = transaction.departureCountry.toUpperCase();
  const subsequentId = supplyId(subsequentSupplyIndex);
  const facts = supplyFacts?.[subsequentId];
  const customerVatId = facts?.customerVatId ?? { status: 'unknown' as const };
  const liable197 = facts?.recipientLiableUnderArticle197 ?? 'unknown';
  const invoiceText = facts?.triangleInvoiceReverseChargeText ?? 'unknown';
  const abuseCheck = facts?.abuseCheck ?? 'unknown';
  const recap = facts?.recapitulativeStatement ?? 'unknown';
  const acquisitionVatId = acquisitionFacts?.vatIdUsed ?? { status: 'unknown' as const };

  const failed: string[] = [];
  const missing: string[] = [];

  if (isEstablishedIn(transaction, intermediaryIndex, destination)) {
    failed.push('The intermediary is established or has a fixed establishment in the destination Member State.');
  }

  if (acquisitionVatId.status === 'unknown') {
    missing.push('acquisitionFacts.vatIdUsed');
  } else if (acquisitionVatId.status === 'none') {
    failed.push('The intermediary has not recorded a VAT ID used for the acquisition.');
  } else {
    const acquisitionCountry = acquisitionVatId.country.toUpperCase();
    if (acquisitionCountry === destination) {
      failed.push('The intermediary used a VAT ID issued by the destination Member State.');
    }
    if (acquisitionCountry === departure) {
      failed.push('The goods were dispatched from the same Member State that issued the intermediary acquisition VAT ID.');
    }
  }

  if (customerVatId.status === 'unknown') {
    missing.push(`${subsequentId}.customerVatId`);
  } else if (customerVatId.status === 'none') {
    failed.push('The recipient of the subsequent supply has no recorded destination-country VAT ID.');
  } else {
    if (customerVatId.country.toUpperCase() !== destination) {
      failed.push('The recipient VAT ID is not issued by the destination Member State.');
    }
    if (customerVatId.validation === 'invalid') {
      failed.push('The recipient VAT ID is invalid.');
    }
  }

  if (liable197 === 'no') {
    failed.push('The recipient is not designated as liable for VAT under Article 197 on the recorded facts.');
  } else if (liable197 === 'unknown') {
    missing.push(`${subsequentId}.recipientLiableUnderArticle197`);
  }

  if (invoiceText === 'missing') {
    failed.push('The required reverse-charge wording for the triangular invoice is missing.');
  }

  if (recap === 'missing' || recap === 'incorrect') {
    failed.push('The triangular recapitulative statement is missing or incorrect.');
  }

  if (abuseCheck === 'concern') {
    failed.push('A recorded fraud/abuse concern prevents automatic application of the simplification.');
  }

  if (failed.length > 0) {
    return {
      status: 'not_met',
      failedConditions: failed,
      rationale:
        'The triangular simplification is not available on the recorded facts.',
    };
  }

  if (missing.length > 0) {
    return {
      status: 'indeterminate',
      missingFacts: missing,
      rationale:
        'One or more legally material facts for Articles 141 and 197 are not known.',
    };
  }

  const pending: string[] = [];
  if (customerVatId.status === 'known' && customerVatId.validation === 'unknown') {
    pending.push('Validate the destination-country customer VAT ID.');
  }
  if (invoiceText === 'unknown') {
    pending.push('Confirm the mandatory reverse-charge wording on the invoice.');
  }
  if (recap === 'unknown' || recap === 'not_due_yet') {
    pending.push('Confirm the triangular recapitulative statement when due.');
  }
  if (abuseCheck === 'unknown') {
    pending.push('Complete the fraud/abuse reasonableness check.');
  }

  if (pending.length > 0) {
    return {
      status: 'conditional',
      intermediaryPartyId: intermediary.id,
      subsequentSupplyId: subsequentId,
      pendingConditions: pending,
      rationale:
        'The structural triangular conditions are met, but operational or anti-abuse checks remain open.',
    };
  }

  return {
    status: 'applicable',
    intermediaryPartyId: intermediary.id,
    subsequentSupplyId: subsequentId,
    legalRuleIds: ['VAT_DIRECTIVE_ART_141', 'VAT_DIRECTIVE_ART_197'],
    rationale:
      'The recorded facts satisfy the structural and recorded compliance conditions for the triangular simplification.',
  };
}
