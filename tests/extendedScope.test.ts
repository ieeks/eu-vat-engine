import { describe, expect, it } from 'vitest';
import { analyzeTransaction } from '../src/application/analyzeTransaction.js';
import { buildCaseFile, serializeCaseFile } from '../src/domain/caseFile.js';
import { analyzeDomesticChain } from '../src/domain/domesticChain.js';
import { classifyMovementScope } from '../src/domain/movementScope.js';
import { evaluateOwnGoodsTransfer } from '../src/domain/ownGoodsTransfer.js';
import { evaluateProcessingService } from '../src/domain/processingService.js';
import { evaluateDirectExport, evaluateEuImport, evaluateSwissImport } from '../src/domain/thirdCountry.js';
import type { ChainTransaction } from '../src/domain/transaction.js';

const domesticDe: ChainTransaction = {
  parties: [
    { id: 'A', establishmentCountry: 'DE' },
    { id: 'B', establishmentCountry: 'DE' },
  ],
  departureCountry: 'DE',
  destinationCountry: 'DE',
  transport: { organizerPartyId: 'A', communicatedVatIdToSupplier: { status: 'unknown' } },
};

describe('movement scope', () => {
  it('classifies domestic, intra-EU, export, import and third-country movements from physical countries only', () => {
    expect(classifyMovementScope('DE', 'DE').kind).toBe('domestic');
    expect(classifyMovementScope('DE', 'IT').kind).toBe('intra_eu');
    expect(classifyMovementScope('AT', 'CH').kind).toBe('export');
    expect(classifyMovementScope('GB', 'DE').kind).toBe('import');
    expect(classifyMovementScope('CH', 'GB').kind).toBe('third_country_cross_border');
  });
});

describe('domestic chains', () => {
  it('keeps all supplies domestic and avoids Article 36a', () => {
    const result = analyzeDomesticChain(domesticDe, {
      L1: { buyerStatus: 'taxable_person' },
    });
    expect(result).toMatchObject({
      status: 'complete',
      country: 'DE',
      supplies: [{ supplyId: 'L1', treatment: 'DOMESTIC_SUPPLY', standardRate: 19 }],
    });
  });

  it('routes a domestic chain through the top-level router', () => {
    const result = analyzeTransaction({ kind: 'chain', input: { transaction: domesticDe } });
    expect(result).toMatchObject({ kind: 'chain', result: { status: 'analyzed', scope: { kind: 'domestic' } } });
  });
});

describe('Article 17 own-goods processing', () => {
  it('applies the processing exception when goods are worked on and returned to origin', () => {
    expect(evaluateOwnGoodsTransfer({
      departureCountry: 'AT', destinationCountry: 'DE', purpose: 'processing_or_appraisal',
      workPerformedInDestination: 'yes', returnedToOrigin: 'yes',
    })).toMatchObject({ status: 'exception_applies', legalRuleId: 'VAT_DIRECTIVE_ART_17_2_F' });
  });

  it('uses Article 17(3) timing when an initially valid exception later ceases', () => {
    expect(evaluateOwnGoodsTransfer({
      departureCountry: 'AT', destinationCountry: 'DE', purpose: 'processing_or_appraisal',
      workPerformedInDestination: 'yes', returnedToOrigin: 'no', exceptionAppliedAtDispatch: 'yes',
      exceptionCeasedAt: '2026-08-15',
    })).toMatchObject({
      status: 'deemed_transfer', timingRuleId: 'VAT_DIRECTIVE_ART_17_3', timing: 'condition_ceased', effectiveAt: '2026-08-15',
    });
  });

  it('deems an ordinary own-goods movement an IC supply/acquisition pair', () => {
    expect(evaluateOwnGoodsTransfer({
      departureCountry: 'DE', destinationCountry: 'PL', purpose: 'other',
    })).toMatchObject({
      status: 'deemed_transfer', deemedSupplyCountry: 'DE', deemedAcquisitionCountry: 'PL', timing: 'dispatch',
    });
  });
});

describe('processing service', () => {
  it('places a cross-border B2B processing service at the recipient and applies Article 196', () => {
    expect(evaluateProcessingService({
      provider: { id: 'P', establishmentCountry: 'DE' },
      recipient: { id: 'R', establishmentCountry: 'AT' },
      recipientIsTaxablePerson: 'yes',
    })).toMatchObject({ status: 'reverse_charge', placeCountry: 'AT', liabilityRuleId: 'VAT_DIRECTIVE_ART_196' });
  });

  it('keeps supplier liability when provider is established at the Article 44 service place', () => {
    expect(evaluateProcessingService({
      provider: { id: 'P', establishmentCountry: 'AT' },
      recipient: { id: 'R', establishmentCountry: 'AT' },
      recipientIsTaxablePerson: 'yes',
    })).toMatchObject({ status: 'supplier_liability', placeCountry: 'AT' });
  });
});

describe('third-country VAT', () => {
  it('verifies a direct supplier-controlled EU export when evidence is available', () => {
    expect(evaluateDirectExport({
      departureCountry: 'DE', destinationCountry: 'CH', organizer: 'supplier',
      customerEstablishedInDepartureCountry: 'no', exportEvidence: 'available',
    })).toMatchObject({ status: 'verified', legalRuleId: 'VAT_DIRECTIVE_ART_146_1_A' });
  });

  it('rejects an indirect-export branch where the exporting customer is established in departure country', () => {
    expect(evaluateDirectExport({
      departureCountry: 'DE', destinationCountry: 'CH', organizer: 'customer',
      customerEstablishedInDepartureCountry: 'yes', exportEvidence: 'available',
    })).toMatchObject({ status: 'not_met', legalRuleId: 'VAT_DIRECTIVE_ART_146_1_B' });
  });

  it('verifies an Article 143(1)(d) / Procedure 42 candidate only with customs, VAT-ID and Article 138 facts', () => {
    const result = evaluateEuImport({
      departureCountry: 'CH', importCountry: 'DE', finalDestinationCountry: 'AT',
      customsProcedure42Declared: 'yes', importerVatIdCountry: 'DE', destinationCustomerVatIdCountry: 'AT',
      onwardSupplyFacts: {
        buyerStatus: 'taxable_person',
        customerVatId: { status: 'known', country: 'AT', validation: 'valid', indicatedToSupplier: 'yes' },
        recapitulativeStatement: 'correct',
      },
    });
    expect(result).toMatchObject({ status: 'procedure_42_verified', importCountry: 'DE', finalDestinationCountry: 'AT' });
  });

  it('treats a supplier import under Swiss subordination declaration as Swiss domestic supply', () => {
    expect(evaluateSwissImport({
      originCountry: 'DE', importerOfRecord: 'supplier', supplierUsesSubordinationDeclaration: 'yes',
    })).toMatchObject({ status: 'supplier_domestic_supply', country: 'CH', standardRate: 8.1 });
  });
});

describe('case file', () => {
  it('serializes a deterministic evidence snapshot', () => {
    const file = buildCaseFile({ a: 1 }, { status: 'ok' }, { createdAt: '2026-08-26T00:00:00.000Z', caseId: 'VAT-1' });
    expect(file).toMatchObject({ schemaVersion: '1.0', engine: 'eu-vat-engine', caseId: 'VAT-1' });
    expect(serializeCaseFile(file)).toContain('"engineBaseline": "2026-08-26"');
  });
});
