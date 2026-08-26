import { describe, expect, it } from 'vitest';
import { allocateSupplyPlaces } from '../src/domain/placeOfSupply.js';
import { determineMovingSupply } from '../src/domain/movingSupply.js';
import type { ChainTransaction, Party } from '../src/domain/transaction.js';

function party(id: string, country: string): Party {
  return { id, establishmentCountry: country };
}

function analyze(transaction: ChainTransaction) {
  const moving = determineMovingSupply(transaction);
  if (moving.status !== 'determined') {
    throw new Error(`Expected determined moving supply, got ${moving.status}`);
  }
  return allocateSupplyPlaces(transaction, moving);
}

describe('allocateSupplyPlaces', () => {
  it('puts supplies after L1 at the destination when L1 is moving', () => {
    const transaction: ChainTransaction = {
      parties: [party('A', 'DE'), party('B', 'AT'), party('C', 'IT')],
      departureCountry: 'DE',
      destinationCountry: 'IT',
      transport: {
        organizerPartyId: 'A',
        communicatedVatIdToSupplier: { status: 'unknown' },
      },
    };

    expect(analyze(transaction)).toEqual([
      {
        supplyIndex: 0,
        supplyId: 'L1',
        position: 'moving',
        placeCountry: 'DE',
        legalRuleId: 'VAT_DIRECTIVE_ART_32',
      },
      {
        supplyIndex: 1,
        supplyId: 'L2',
        position: 'resting_after',
        placeCountry: 'IT',
        legalRuleId: 'VAT_DIRECTIVE_ART_31',
      },
    ]);
  });

  it('puts supplies before a moving L2 at the departure state', () => {
    const transaction: ChainTransaction = {
      parties: [party('A', 'DE'), party('B', 'AT'), party('C', 'IT')],
      departureCountry: 'DE',
      destinationCountry: 'IT',
      transport: {
        organizerPartyId: 'B',
        communicatedVatIdToSupplier: { status: 'known', country: 'DE' },
      },
    };

    expect(analyze(transaction)).toEqual([
      {
        supplyIndex: 0,
        supplyId: 'L1',
        position: 'resting_before',
        placeCountry: 'DE',
        legalRuleId: 'VAT_DIRECTIVE_ART_31',
      },
      {
        supplyIndex: 1,
        supplyId: 'L2',
        position: 'moving',
        placeCountry: 'DE',
        legalRuleId: 'VAT_DIRECTIVE_ART_32',
      },
    ]);
  });

  it('allocates both sides of a moving middle supply in a four-party chain', () => {
    const transaction: ChainTransaction = {
      parties: [
        party('A', 'IT'),
        party('B', 'AT'),
        party('C', 'DE'),
        party('D', 'HU'),
      ],
      departureCountry: 'IT',
      destinationCountry: 'HU',
      transport: {
        organizerPartyId: 'C',
        communicatedVatIdToSupplier: { status: 'known', country: 'DE' },
      },
    };

    expect(analyze(transaction)).toEqual([
      {
        supplyIndex: 0,
        supplyId: 'L1',
        position: 'resting_before',
        placeCountry: 'IT',
        legalRuleId: 'VAT_DIRECTIVE_ART_31',
      },
      {
        supplyIndex: 1,
        supplyId: 'L2',
        position: 'moving',
        placeCountry: 'IT',
        legalRuleId: 'VAT_DIRECTIVE_ART_32',
      },
      {
        supplyIndex: 2,
        supplyId: 'L3',
        position: 'resting_after',
        placeCountry: 'HU',
        legalRuleId: 'VAT_DIRECTIVE_ART_31',
      },
    ]);
  });
});
