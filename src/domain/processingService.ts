import { isEuMemberState } from '../knowledge/eu/memberStates.js';
import type { Party } from './transaction.js';
import type { YesNoUnknown } from './vatCase.js';

export interface ProcessingServiceInput {
  readonly provider: Party;
  readonly recipient: Party;
  readonly recipientIsTaxablePerson: YesNoUnknown;
  /** Establishment/fixed establishment to which the service is actually supplied. */
  readonly recipientEstablishmentReceivingService?: string | 'unknown';
}

export type ProcessingServiceResult =
  | {
      readonly status: 'reverse_charge';
      readonly placeCountry: string;
      readonly placeRuleId: 'VAT_DIRECTIVE_ART_44';
      readonly liabilityRuleId: 'VAT_DIRECTIVE_ART_196';
      readonly rationale: string;
    }
  | {
      readonly status: 'supplier_liability';
      readonly placeCountry: string;
      readonly placeRuleId: 'VAT_DIRECTIVE_ART_44';
      readonly rationale: string;
    }
  | {
      readonly status: 'indeterminate';
      readonly missingFacts: readonly string[];
      readonly rationale: string;
    }
  | {
      readonly status: 'review_required';
      readonly rationale: string;
    };

function partyEstablishedIn(party: Party, country: string): boolean {
  const target = country.toUpperCase();
  return (
    party.establishmentCountry.toUpperCase() === target ||
    (party.fixedEstablishments ?? []).some((item) => item.toUpperCase() === target)
  );
}

/**
 * Processing the goods is a service question separate from Article 17 goods
 * movement. For B2B services the Article 44 recipient establishment controls
 * place; Article 196 then shifts liability where the provider is not established
 * in that Member State and the EU cross-border conditions are met.
 */
export function evaluateProcessingService(
  input: ProcessingServiceInput,
): ProcessingServiceResult {
  if (input.recipientIsTaxablePerson === 'unknown') {
    return {
      status: 'indeterminate',
      missingFacts: ['recipientIsTaxablePerson'],
      rationale: 'Article 44 B2B treatment cannot be selected until the recipient taxable-person status is known.',
    };
  }

  if (input.recipientIsTaxablePerson === 'no') {
    return {
      status: 'review_required',
      rationale:
        'The recipient is not a taxable person. This engine intentionally does not apply the Article 44 B2B rule to a B2C processing service.',
    };
  }

  const explicit = input.recipientEstablishmentReceivingService;
  if (explicit === 'unknown') {
    return {
      status: 'indeterminate',
      missingFacts: ['recipientEstablishmentReceivingService'],
      rationale:
        'Where the recipient has multiple establishments, the establishment actually receiving the service is material to Article 44.',
    };
  }

  const place = (explicit ?? input.recipient.establishmentCountry).toUpperCase();
  const providerEstablished = partyEstablishedIn(input.provider, place);

  if (providerEstablished) {
    return {
      status: 'supplier_liability',
      placeCountry: place,
      placeRuleId: 'VAT_DIRECTIVE_ART_44',
      rationale:
        'The B2B processing service is located at the recipient establishment under Article 44, and the provider is established in that same jurisdiction; Article 196 recipient liability is therefore not used.',
    };
  }

  if (!isEuMemberState(place)) {
    return {
      status: 'review_required',
      rationale:
        'The Article 44 service place is outside the EU. Local third-country service and liability rules must be applied instead of Article 196.',
    };
  }

  return {
    status: 'reverse_charge',
    placeCountry: place,
    placeRuleId: 'VAT_DIRECTIVE_ART_44',
    liabilityRuleId: 'VAT_DIRECTIVE_ART_196',
    rationale:
      'The B2B processing service is located at the recipient establishment under Article 44. The provider is not established in that Member State, so Article 196 shifts VAT liability to the recipient.',
  };
}
