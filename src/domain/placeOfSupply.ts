import type { MovingSupplyDecision } from './movingSupply.js';
import { supplyId, type ChainTransaction } from './transaction.js';

export type DeterminedMovingSupplyDecision = Extract<
  MovingSupplyDecision,
  { readonly status: 'determined' }
>;

export type SupplyPosition = 'resting_before' | 'moving' | 'resting_after';

export interface SupplyPlaceAllocation {
  readonly supplyIndex: number;
  readonly supplyId: `L${number}`;
  readonly position: SupplyPosition;
  readonly placeCountry: string;
  readonly legalRuleId: 'VAT_DIRECTIVE_ART_31' | 'VAT_DIRECTIVE_ART_32';
}

/**
 * Allocates the place of each supply once the moving supply has already been
 * determined. This function intentionally cannot accept an indeterminate
 * moving-supply result: callers must resolve that dependency first.
 */
export function allocateSupplyPlaces(
  transaction: ChainTransaction,
  movingSupply: DeterminedMovingSupplyDecision,
): readonly SupplyPlaceAllocation[] {
  const supplyCount = transaction.parties.length - 1;

  if (
    movingSupply.movingSupplyIndex < 0 ||
    movingSupply.movingSupplyIndex >= supplyCount
  ) {
    throw new RangeError('Moving supply index is outside the commercial chain.');
  }

  const departure = transaction.departureCountry.toUpperCase();
  const destination = transaction.destinationCountry.toUpperCase();

  return Array.from({ length: supplyCount }, (_, supplyIndex) => {
    if (supplyIndex < movingSupply.movingSupplyIndex) {
      return {
        supplyIndex,
        supplyId: supplyId(supplyIndex),
        position: 'resting_before',
        placeCountry: departure,
        legalRuleId: 'VAT_DIRECTIVE_ART_31',
      } satisfies SupplyPlaceAllocation;
    }

    if (supplyIndex === movingSupply.movingSupplyIndex) {
      return {
        supplyIndex,
        supplyId: supplyId(supplyIndex),
        position: 'moving',
        placeCountry: departure,
        legalRuleId: 'VAT_DIRECTIVE_ART_32',
      } satisfies SupplyPlaceAllocation;
    }

    return {
      supplyIndex,
      supplyId: supplyId(supplyIndex),
      position: 'resting_after',
      placeCountry: destination,
      legalRuleId: 'VAT_DIRECTIVE_ART_31',
    } satisfies SupplyPlaceAllocation;
  });
}
