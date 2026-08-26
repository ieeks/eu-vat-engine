import { describe, expect, it } from 'vitest';
import { analyzeVatCase } from '../src/application/analyzeVatCase.js';

describe('analyzeVatCase', () => {
  it('composes legal layers without applying company policy by default', () => {
    const result = analyzeVatCase({
      transaction: {
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
      },
      supplyFacts: {
        L1: {
          buyerStatus: 'taxable_person',
          customerVatId: {
            status: 'known',
            country: 'AT',
            validation: 'valid',
            indicatedToSupplier: 'yes',
          },
          recapitulativeStatement: 'correct',
        },
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
      acquisitionFacts: {
        vatIdUsed: { status: 'known', country: 'AT' },
      },
    });

    expect(result).toMatchObject({
      status: 'complete',
      movingSupplyExemption: { status: 'verified' },
      triangle: { status: 'applicable' },
      acquisition: {
        article41: { status: 'neutralized_by_article_42' },
      },
      trianglePolicy: { status: 'not_applied' },
    });
  });
});
