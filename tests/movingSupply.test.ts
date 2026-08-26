import { describe, expect, it } from 'vitest';
import { determineMovingSupply } from '../src/domain/movingSupply.js';
import type { ChainTransaction, Party } from '../src/domain/transaction.js';

function party(id: string, country: string): Party {
  return { id, establishmentCountry: country };
}

function transaction(
  parties: readonly Party[],
  organizerPartyId: string | null,
  communication: ChainTransaction['transport']['communicatedVatIdToSupplier'],
  departureCountry = 'DE',
  destinationCountry = 'IT',
): ChainTransaction {
  return {
    parties,
    departureCountry,
    destinationCountry,
    transport: {
      organizerPartyId,
      communicatedVatIdToSupplier: communication,
    },
  };
}

const threeParties = [party('A', 'DE'), party('B', 'AT'), party('C', 'IT')];
const fourParties = [
  party('A', 'IT'),
  party('B', 'AT'),
  party('C', 'DE'),
  party('D', 'HU'),
];

describe('determineMovingSupply', () => {
  it('allocates movement to L1 when the first supplier organizes transport', () => {
    const result = determineMovingSupply(
      transaction(threeParties, 'A', { status: 'unknown' }),
    );

    expect(result).toMatchObject({
      status: 'determined',
      movingSupplyIndex: 0,
      movingSupplyId: 'L1',
      legalRuleId: 'CHAIN_FIRST_SUPPLIER_TRANSPORT',
    });
  });

  it('allocates movement to the final supply when the final customer organizes transport', () => {
    const result = determineMovingSupply(
      transaction(threeParties, 'C', { status: 'unknown' }),
    );

    expect(result).toMatchObject({
      status: 'determined',
      movingSupplyIndex: 1,
      movingSupplyId: 'L2',
      legalRuleId: 'CHAIN_FINAL_CUSTOMER_TRANSPORT',
    });
  });

  it('uses Art. 36a(2) when intermediary B actually communicated a departure-state VAT ID', () => {
    const result = determineMovingSupply(
      transaction(threeParties, 'B', { status: 'known', country: 'DE' }),
    );

    expect(result).toMatchObject({
      status: 'determined',
      movingSupplyIndex: 1,
      movingSupplyId: 'L2',
      legalRuleId: 'VAT_DIRECTIVE_ART_36A_2',
    });
  });

  it('uses Art. 36a(1) when intermediary B communicated a non-departure VAT ID', () => {
    const result = determineMovingSupply(
      transaction(threeParties, 'B', { status: 'known', country: 'AT' }),
    );

    expect(result).toMatchObject({
      status: 'determined',
      movingSupplyIndex: 0,
      movingSupplyId: 'L1',
      legalRuleId: 'VAT_DIRECTIVE_ART_36A_1',
    });
  });

  it('uses Art. 36a(1) when it is confirmed that intermediary B communicated no VAT ID', () => {
    const result = determineMovingSupply(
      transaction(threeParties, 'B', { status: 'none' }),
    );

    expect(result).toMatchObject({
      status: 'determined',
      movingSupplyIndex: 0,
      movingSupplyId: 'L1',
      legalRuleId: 'VAT_DIRECTIVE_ART_36A_1',
    });
  });

  it('returns indeterminate when intermediary VAT-ID communication is unknown', () => {
    const result = determineMovingSupply(
      transaction(threeParties, 'B', { status: 'unknown' }),
    );

    expect(result).toEqual({
      status: 'indeterminate',
      missingFacts: ['transport.communicatedVatIdToSupplier'],
      rationale: expect.stringContaining('actually communicated'),
    });
  });

  it('does not infer communication from VAT registrations owned by the intermediary', () => {
    const parties = [
      party('A', 'DE'),
      {
        id: 'B',
        establishmentCountry: 'AT',
        vatRegistrations: [
          { country: 'DE', vatId: 'DE123' },
          { country: 'BE', vatId: 'BE123' },
        ],
      },
      party('C', 'IT'),
    ];

    const result = determineMovingSupply(
      transaction(parties, 'B', { status: 'unknown' }),
    );

    expect(result.status).toBe('indeterminate');
  });

  it('supports a second intermediary in a four-party chain under Art. 36a(2)', () => {
    const result = determineMovingSupply(
      transaction(
        fourParties,
        'C',
        { status: 'known', country: 'IT' },
        'IT',
        'HU',
      ),
    );

    expect(result).toMatchObject({
      status: 'determined',
      movingSupplyIndex: 2,
      movingSupplyId: 'L3',
      legalRuleId: 'VAT_DIRECTIVE_ART_36A_2',
    });
  });

  it('supports a second intermediary in a four-party chain under Art. 36a(1)', () => {
    const result = determineMovingSupply(
      transaction(
        fourParties,
        'C',
        { status: 'known', country: 'DE' },
        'IT',
        'HU',
      ),
    );

    expect(result).toMatchObject({
      status: 'determined',
      movingSupplyIndex: 1,
      movingSupplyId: 'L2',
      legalRuleId: 'VAT_DIRECTIVE_ART_36A_1',
    });
  });

  it('returns indeterminate when the transport organizer itself is unknown', () => {
    const result = determineMovingSupply(
      transaction(threeParties, null, { status: 'unknown' }),
    );

    expect(result).toMatchObject({
      status: 'indeterminate',
      missingFacts: ['transport.organizerPartyId'],
    });
  });

  it('does not apply Art. 36a to a domestic movement', () => {
    const result = determineMovingSupply(
      transaction(threeParties, 'B', { status: 'known', country: 'DE' }, 'DE', 'DE'),
    );

    expect(result.status).toBe('not_applicable');
  });

  it('does not apply Art. 36a to a third-country movement', () => {
    const result = determineMovingSupply(
      transaction(threeParties, 'B', { status: 'known', country: 'DE' }, 'DE', 'CH'),
    );

    expect(result.status).toBe('not_applicable');
  });

  it('rejects a transport organizer that is not part of the chain', () => {
    const result = determineMovingSupply(
      transaction(threeParties, 'X', { status: 'unknown' }),
    );

    expect(result).toMatchObject({
      status: 'invalid',
      issues: [expect.stringContaining('must be one of the parties')],
    });
  });
});
