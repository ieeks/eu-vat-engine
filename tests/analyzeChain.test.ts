import { describe, expect, it } from 'vitest';
import { analyzeChain } from '../src/application/analyzeChain.js';
import type { ChainTransaction } from '../src/domain/transaction.js';

const baseTransaction: ChainTransaction = {
  parties: [
    { id: 'A', establishmentCountry: 'DE' },
    { id: 'B', establishmentCountry: 'AT' },
    { id: 'C', establishmentCountry: 'IT' },
  ],
  departureCountry: 'DE',
  destinationCountry: 'IT',
  transport: {
    organizerPartyId: 'B',
    communicatedVatIdToSupplier: { status: 'known', country: 'AT' },
  },
};

describe('analyzeChain', () => {
  it('returns a complete ordered analysis when moving supply is determinable', () => {
    const result = analyzeChain(baseTransaction);

    expect(result).toMatchObject({
      status: 'complete',
      movingSupply: {
        status: 'determined',
        movingSupplyId: 'L1',
      },
      supplies: [
        { supplyId: 'L1', position: 'moving', placeCountry: 'DE' },
        { supplyId: 'L2', position: 'resting_after', placeCountry: 'IT' },
      ],
    });
  });

  it('blocks downstream analysis rather than guessing when Art. 36a facts are missing', () => {
    const result = analyzeChain({
      ...baseTransaction,
      transport: {
        organizerPartyId: 'B',
        communicatedVatIdToSupplier: { status: 'unknown' },
      },
    });

    expect(result).toEqual({
      status: 'blocked',
      movingSupply: {
        status: 'indeterminate',
        missingFacts: ['transport.communicatedVatIdToSupplier'],
        rationale: expect.stringContaining('actually communicated'),
      },
      supplies: [],
    });
  });
});
