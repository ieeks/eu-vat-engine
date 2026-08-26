import { isEuMemberState } from '../knowledge/eu/memberStates.js';
import { supplyId, type ChainTransaction } from './transaction.js';

export type MovingSupplyRuleId =
  | 'CHAIN_FIRST_SUPPLIER_TRANSPORT'
  | 'CHAIN_FINAL_CUSTOMER_TRANSPORT'
  | 'VAT_DIRECTIVE_ART_36A_1'
  | 'VAT_DIRECTIVE_ART_36A_2'
  | 'VAT_DIRECTIVE_ART_36A_OUT_OF_SCOPE';

export type MovingSupplyDecision =
  | {
      readonly status: 'determined';
      readonly movingSupplyIndex: number;
      readonly movingSupplyId: `L${number}`;
      readonly legalRuleId: MovingSupplyRuleId;
      readonly rationale: string;
    }
  | {
      readonly status: 'indeterminate';
      readonly missingFacts: readonly string[];
      readonly rationale: string;
    }
  | {
      readonly status: 'not_applicable';
      readonly legalRuleId: 'VAT_DIRECTIVE_ART_36A_OUT_OF_SCOPE';
      readonly rationale: string;
    }
  | {
      readonly status: 'invalid';
      readonly issues: readonly string[];
    };

function validateTransaction(transaction: ChainTransaction): string[] {
  const issues: string[] = [];

  if (transaction.parties.length < 2) {
    issues.push('A chain transaction requires at least two parties.');
  }

  const ids = transaction.parties.map((party) => party.id);
  if (new Set(ids).size !== ids.length) {
    issues.push('Party IDs must be unique within the chain.');
  }

  if (!transaction.departureCountry.trim()) {
    issues.push('Departure country is required.');
  }

  if (!transaction.destinationCountry.trim()) {
    issues.push('Destination country is required.');
  }

  if (
    transaction.transport.organizerPartyId !== null &&
    !ids.includes(transaction.transport.organizerPartyId)
  ) {
    issues.push('Transport organizer must be one of the parties in the chain.');
  }

  return issues;
}

/**
 * Determines which supply in a chain is attributed the single cross-border movement.
 *
 * Phase 1 intentionally answers only the allocation question. It does not determine
 * tax exemption, place of supply, acquisition, triangular simplification, reverse
 * charge, registration requirements or SAP treatment.
 */
export function determineMovingSupply(
  transaction: ChainTransaction,
): MovingSupplyDecision {
  const issues = validateTransaction(transaction);
  if (issues.length > 0) {
    return { status: 'invalid', issues };
  }

  const departure = transaction.departureCountry.toUpperCase();
  const destination = transaction.destinationCountry.toUpperCase();

  if (
    departure === destination ||
    !isEuMemberState(departure) ||
    !isEuMemberState(destination)
  ) {
    return {
      status: 'not_applicable',
      legalRuleId: 'VAT_DIRECTIVE_ART_36A_OUT_OF_SCOPE',
      rationale:
        'Art. 36a applies to chain transactions involving a dispatch or transport from one EU Member State to another EU Member State.',
    };
  }

  const organizerId = transaction.transport.organizerPartyId;
  if (organizerId === null) {
    return {
      status: 'indeterminate',
      missingFacts: ['transport.organizerPartyId'],
      rationale:
        'The moving supply cannot be allocated until the party dispatching or transporting the goods, or arranging transport on its behalf, is known.',
    };
  }

  const organizerIndex = transaction.parties.findIndex(
    (party) => party.id === organizerId,
  );
  const finalPartyIndex = transaction.parties.length - 1;

  if (organizerIndex === 0) {
    return {
      status: 'determined',
      movingSupplyIndex: 0,
      movingSupplyId: supplyId(0),
      legalRuleId: 'CHAIN_FIRST_SUPPLIER_TRANSPORT',
      rationale:
        'The first supplier organizes the transport, so the first supply is attributed the movement.',
    };
  }

  if (organizerIndex === finalPartyIndex) {
    const movingSupplyIndex = finalPartyIndex - 1;
    return {
      status: 'determined',
      movingSupplyIndex,
      movingSupplyId: supplyId(movingSupplyIndex),
      legalRuleId: 'CHAIN_FINAL_CUSTOMER_TRANSPORT',
      rationale:
        'The final customer organizes the transport, so the final supply is attributed the movement.',
    };
  }

  const communication = transaction.transport.communicatedVatIdToSupplier;

  if (communication.status === 'unknown') {
    return {
      status: 'indeterminate',
      missingFacts: ['transport.communicatedVatIdToSupplier'],
      rationale:
        'The transport organizer is an intermediary operator. The engine must know whether that intermediary actually communicated a VAT ID issued by the Member State of departure to its supplier before Art. 36a(1) or Art. 36a(2) can be selected.',
    };
  }

  if (
    communication.status === 'known' &&
    communication.country.toUpperCase() === departure
  ) {
    const movingSupplyIndex = organizerIndex;
    return {
      status: 'determined',
      movingSupplyIndex,
      movingSupplyId: supplyId(movingSupplyIndex),
      legalRuleId: 'VAT_DIRECTIVE_ART_36A_2',
      rationale:
        'The intermediary operator communicated to its supplier a VAT ID issued by the Member State of departure, so the movement is attributed to the supply made by that intermediary operator.',
    };
  }

  const movingSupplyIndex = organizerIndex - 1;
  return {
    status: 'determined',
    movingSupplyIndex,
    movingSupplyId: supplyId(movingSupplyIndex),
    legalRuleId: 'VAT_DIRECTIVE_ART_36A_1',
    rationale:
      communication.status === 'none'
        ? 'The intermediary operator did not communicate a VAT ID to its supplier. The Art. 36a(2) exception is therefore not established, so the movement is attributed to the supply made to the intermediary operator.'
        : 'The intermediary operator communicated a VAT ID not issued by the Member State of departure. The Art. 36a(2) exception is therefore not met, so the movement is attributed to the supply made to the intermediary operator.',
  };
}
