import type { MovingSupplyDecision } from './movingSupply.js';
import type { ChainTransaction } from './transaction.js';
import type { AcquisitionFacts } from './vatCase.js';
import type { TriangleResult } from './triangle.js';

type DeterminedMovingSupply = Extract<MovingSupplyDecision, { status: 'determined' }>;

export interface AcquisitionResult {
  readonly acquirerPartyId: string;
  readonly destinationAcquisitionCountry: string;
  readonly destinationLegalRuleId: 'VAT_DIRECTIVE_ART_40';
  readonly article41:
    | { readonly status: 'not_applicable' }
    | {
        readonly status: 'potential';
        readonly additionalCountry: string;
        readonly rationale: string;
      }
    | {
        readonly status: 'neutralized_by_article_42';
        readonly additionalCountry: string;
        readonly rationale: string;
      };
}

export function determineAcquisition(
  transaction: ChainTransaction,
  movingSupply: DeterminedMovingSupply,
  facts: AcquisitionFacts | undefined,
  triangle: TriangleResult,
): AcquisitionResult {
  const acquirer = transaction.parties[movingSupply.movingSupplyIndex + 1];
  if (!acquirer) {
    throw new RangeError('Moving supply has no acquirer.');
  }

  const destination = transaction.destinationCountry.toUpperCase();
  const vatIdUsed = facts?.vatIdUsed ?? { status: 'unknown' as const };

  if (vatIdUsed.status !== 'known' || vatIdUsed.country.toUpperCase() === destination) {
    return {
      acquirerPartyId: acquirer.id,
      destinationAcquisitionCountry: destination,
      destinationLegalRuleId: 'VAT_DIRECTIVE_ART_40',
      article41: { status: 'not_applicable' },
    };
  }

  const additionalCountry = vatIdUsed.country.toUpperCase();

  if (triangle.status === 'applicable' || triangle.status === 'conditional') {
    return {
      acquirerPartyId: acquirer.id,
      destinationAcquisitionCountry: destination,
      destinationLegalRuleId: 'VAT_DIRECTIVE_ART_40',
      article41: {
        status: 'neutralized_by_article_42',
        additionalCountry,
        rationale:
          'Article 42 can disapply the Article 41 safety-net acquisition where the triangular conditions and reporting requirements are fulfilled.',
      },
    };
  }

  return {
    acquirerPartyId: acquirer.id,
    destinationAcquisitionCountry: destination,
    destinationLegalRuleId: 'VAT_DIRECTIVE_ART_40',
    article41: {
      status: 'potential',
      additionalCountry,
      rationale:
        'A VAT ID from another Member State was used for the acquisition. Article 41 may create an additional acquisition there until the conditions for relief are evidenced.',
    },
  };
}
