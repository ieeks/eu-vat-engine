import { determineMovingSupply, type MovingSupplyDecision } from '../domain/movingSupply.js';
import { allocateSupplyPlaces, type SupplyPlaceAllocation } from '../domain/placeOfSupply.js';
import type { ChainTransaction } from '../domain/transaction.js';

export type ChainAnalysis =
  | {
      readonly status: 'complete';
      readonly movingSupply: Extract<MovingSupplyDecision, { status: 'determined' }>;
      readonly supplies: readonly SupplyPlaceAllocation[];
    }
  | {
      readonly status: 'blocked';
      readonly movingSupply: Exclude<MovingSupplyDecision, { status: 'determined' }>;
      readonly supplies: readonly [];
    };

/**
 * Phase-1 orchestration entry point.
 *
 * Dependency order is enforced here: place-of-supply allocation is never run
 * when the moving supply is invalid, unknown or outside the current scope.
 */
export function analyzeChain(transaction: ChainTransaction): ChainAnalysis {
  const movingSupply = determineMovingSupply(transaction);

  if (movingSupply.status !== 'determined') {
    return {
      status: 'blocked',
      movingSupply,
      supplies: [],
    };
  }

  return {
    status: 'complete',
    movingSupply,
    supplies: allocateSupplyPlaces(transaction, movingSupply),
  };
}
