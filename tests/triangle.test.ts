import { describe, expect, it } from 'vitest';
import { determineMovingSupply } from '../src/domain/movingSupply.js';
import { evaluateTriangle } from '../src/domain/triangle.js';
import type { ChainTransaction } from '../src/domain/transaction.js';

const tx: ChainTransaction = {
  parties: [
    { id: 'A', establishmentCountry: 'DE' },
    { id: 'B', establishmentCountry: 'AT', vatRegistrations: [{ country: 'IT', vatId: 'ITX' }] },
    { id: 'C', establishmentCountry: 'IT' },
  ],
  departureCountry: 'DE',
  destinationCountry: 'IT',
  transport: {
    organizerPartyId: 'A',
    communicatedVatIdToSupplier: { status: 'unknown' },
  },
};

describe('evaluateTriangle', () => {
  it('does not treat destination VAT registration alone as establishment', () => {
    const moving = determineMovingSupply(tx);
    if (moving.status !== 'determined') throw new Error('test setup');

    const result = evaluateTriangle(
      tx,
      moving,
      {
        L2: {
          customerVatId: {
            status: 'known',
            country: 'IT',
            validation: 'valid',
            indicatedToSupplier: 'yes',
          },
          recipientLiableUnderArticle197: 'yes',
          triangleInvoiceReverseChargeText: 'present',
          recapitulativeStatement: 'correct',
          abuseCheck: 'clear',
        },
      },
      { vatIdUsed: { status: 'known', country: 'AT' } },
    );

    expect(result.status).toBe('applicable');
  });

  it('blocks when the intermediary is actually established in destination', () => {
    const localTx: ChainTransaction = {
      ...tx,
      parties: [
        tx.parties[0]!,
        {
          ...tx.parties[1]!,
          fixedEstablishments: ['IT'],
        },
        tx.parties[2]!,
      ],
    };
    const moving = determineMovingSupply(localTx);
    if (moving.status !== 'determined') throw new Error('test setup');

    const result = evaluateTriangle(
      localTx,
      moving,
      {
        L2: {
          customerVatId: {
            status: 'known',
            country: 'IT',
            validation: 'valid',
            indicatedToSupplier: 'yes',
          },
          recipientLiableUnderArticle197: 'yes',
          triangleInvoiceReverseChargeText: 'present',
          recapitulativeStatement: 'correct',
          abuseCheck: 'clear',
        },
      },
      { vatIdUsed: { status: 'known', country: 'AT' } },
    );
    expect(result.status).toBe('not_met');
  });
});
