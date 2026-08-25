import { describe, expect, it } from 'vitest';
import { determineAcquisition } from '../src/domain/acquisition.js';
import { determineMovingSupply } from '../src/domain/movingSupply.js';
import type { ChainTransaction } from '../src/domain/transaction.js';

const tx: ChainTransaction = {
  parties: [
    { id: 'A', establishmentCountry: 'DE' },
    { id: 'B', establishmentCountry: 'AT' },
    { id: 'C', establishmentCountry: 'IT' },
  ],
  departureCountry: 'DE',
  destinationCountry: 'IT',
  transport: {
    organizerPartyId: 'A',
    communicatedVatIdToSupplier: { status: 'unknown' },
  },
};

describe('determineAcquisition', () => {
  it('places the acquisition in the destination under Article 40', () => {
    const moving = determineMovingSupply(tx);
    if (moving.status !== 'determined') throw new Error('test setup');

    const result = determineAcquisition(
      tx,
      moving,
      { vatIdUsed: { status: 'known', country: 'IT' } },
      { status: 'not_applicable', rationale: 'none' },
    );

    expect(result).toMatchObject({
      destinationAcquisitionCountry: 'IT',
      article41: { status: 'not_applicable' },
    });
  });

  it('flags Article 41 when another Member State VAT ID is used', () => {
    const moving = determineMovingSupply(tx);
    if (moving.status !== 'determined') throw new Error('test setup');

    const result = determineAcquisition(
      tx,
      moving,
      { vatIdUsed: { status: 'known', country: 'AT' } },
      { status: 'not_met', failedConditions: ['x'], rationale: 'x' },
    );

    expect(result.article41).toMatchObject({
      status: 'potential',
      additionalCountry: 'AT',
    });
  });
});
