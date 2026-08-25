import { hydrateTransactionCompany } from '../companies/hydrateTransaction.js';
import type { OwnGoodsTransferResult } from '../domain/ownGoodsTransfer.js';
import type { ProcessingServiceResult } from '../domain/processingService.js';
import { evaluateNationalReverseCharge } from '../domain/reverseCharge.js';
import type { DirectExportResult, SwissImportResult } from '../domain/thirdCountry.js';
import type { Party } from '../domain/transaction.js';
import type { VatCaseInput, YesNoUnknown } from '../domain/vatCase.js';
import { resolveSapTaxCode, type SapMappingResult, type SapTreatment } from '../sap/mappings.js';
import type { VatCaseAnalysis } from './analyzeVatCase.js';

export interface SapSuggestion {
  readonly role: 'seller' | 'buyer';
  readonly supplyId: `L${number}`;
  readonly country: string;
  readonly treatment: SapTreatment;
  readonly confidence: 'verified' | 'conditional';
  readonly mapping: SapMappingResult;
  readonly rationale: string;
}

export interface SpecialSapSuggestion {
  readonly role: 'seller' | 'buyer';
  readonly transactionRef: string;
  readonly country: string;
  readonly treatment: SapTreatment;
  readonly confidence: 'verified' | 'conditional';
  readonly mapping: SapMappingResult;
  readonly rationale: string;
}

export type SapDerivationResult =
  | { readonly status: 'complete'; readonly suggestions: readonly SapSuggestion[] }
  | { readonly status: 'indeterminate'; readonly suggestions: readonly SapSuggestion[]; readonly missingFacts: readonly string[]; readonly rationale: string };

export type SpecialSapDerivationResult =
  | { readonly status: 'complete'; readonly suggestions: readonly SpecialSapSuggestion[] }
  | { readonly status: 'indeterminate'; readonly suggestions: readonly SpecialSapSuggestion[]; readonly rationale: string };

function establishedIn(party: Party, country: string): boolean {
  const target = country.toUpperCase();
  return party.establishmentCountry.toUpperCase() === target ||
    (party.fixedEstablishments ?? []).some((item) => item.toUpperCase() === target);
}

function registeredIn(party: Party, country: string): boolean {
  const target = country.toUpperCase();
  return (party.vatRegistrations ?? []).some((item) => item.country.toUpperCase() === target);
}

function fact(value: boolean): YesNoUnknown { return value ? 'yes' : 'no'; }

function suggestion(
  companyId: string,
  role: 'seller' | 'buyer',
  supplyId: `L${number}`,
  country: string,
  treatment: SapTreatment,
  confidence: 'verified' | 'conditional',
  rationale: string,
): SapSuggestion {
  return { role, supplyId, country, treatment, confidence, mapping: resolveSapTaxCode({ companyId, country, treatment }), rationale };
}

function specialSuggestion(
  companyId: string,
  role: 'seller' | 'buyer',
  transactionRef: string,
  country: string,
  treatment: SapTreatment,
  confidence: 'verified' | 'conditional',
  rationale: string,
): SpecialSapSuggestion {
  return { role, transactionRef, country, treatment, confidence, mapping: resolveSapTaxCode({ companyId, country, treatment }), rationale };
}

/** SAP is derived from the legal result, never the other way around. */
export function deriveSapForVatCase(input: VatCaseInput, analysis: VatCaseAnalysis): SapDerivationResult {
  if (!input.companyId || !input.actingPartyId) {
    return {
      status: 'indeterminate', suggestions: [],
      missingFacts: [...(input.companyId ? [] : ['companyId']), ...(input.actingPartyId ? [] : ['actingPartyId'])],
      rationale: 'Company and acting party are required before a company-specific SAP mapping can be derived.',
    };
  }
  if (analysis.status === 'blocked') {
    return { status: 'indeterminate', suggestions: [], missingFacts: ['resolvedChainAnalysis'], rationale: 'SAP mapping is blocked because the VAT chain result is not determined.' };
  }

  const transaction = hydrateTransactionCompany(input.transaction, input.companyId, input.actingPartyId);
  const actingIndex = transaction.parties.findIndex((party) => party.id === input.actingPartyId);
  if (actingIndex < 0) {
    return { status: 'indeterminate', suggestions: [], missingFacts: ['actingPartyId'], rationale: 'The acting party is not part of the commercial chain.' };
  }

  const suggestions: SapSuggestion[] = [];
  const movingIndex = analysis.chain.movingSupply.movingSupplyIndex;
  const movingId = analysis.chain.movingSupply.movingSupplyId;
  const departure = transaction.departureCountry.toUpperCase();
  const destination = transaction.destinationCountry.toUpperCase();

  if (actingIndex === movingIndex) {
    const exempt = analysis.movingSupplyExemption.status;
    const treatment: SapTreatment = exempt === 'verified' || exempt === 'conditional' ? 'IC_SUPPLY' : 'DOMESTIC_SALE';
    suggestions.push(suggestion(
      input.companyId, 'seller', movingId, departure, treatment,
      exempt === 'verified' ? 'verified' : 'conditional',
      treatment === 'IC_SUPPLY'
        ? 'The acting company is seller of the moving supply. The IC-supply SAP code is proposed only because Article 138 is verified or explicitly conditional.'
        : 'Article 138 is not recorded as qualifying, so the adapter does not propose a zero-rated IC-supply code.',
    ));
  }

  if (actingIndex === movingIndex + 1 && analysis.triangle.status !== 'applicable') {
    suggestions.push(suggestion(
      input.companyId, 'buyer', movingId, destination, 'IC_ACQUISITION',
      analysis.triangle.status === 'conditional' ? 'conditional' : 'verified',
      'The acting company is buyer of the moving intra-EU supply. A destination-country IC-acquisition code is proposed unless a fully applicable triangular simplification suppresses that normal booking path.',
    ));
  }

  for (const supply of analysis.chain.supplies) {
    if (supply.position === 'moving') continue;
    const seller = transaction.parties[supply.supplyIndex];
    const buyer = transaction.parties[supply.supplyIndex + 1];
    if (!seller || !buyer) continue;

    if (seller.id === input.actingPartyId) {
      if ((analysis.triangle.status === 'applicable' || analysis.triangle.status === 'conditional') && analysis.triangle.subsequentSupplyId === supply.supplyId) {
        const acquisitionVat = input.acquisitionFacts?.vatIdUsed;
        const bookCountry = acquisitionVat?.status === 'known' ? acquisitionVat.country.toUpperCase() : seller.establishmentCountry.toUpperCase();
        suggestions.push(suggestion(
          input.companyId, 'seller', supply.supplyId, bookCountry, 'TRIANGLE_SALE',
          analysis.triangle.status === 'applicable' ? 'verified' : 'conditional',
          'The acting company makes the subsequent supply in the candidate triangular transaction. The book-circle country follows the VAT ID recorded for the intermediary acquisition.',
        ));
        continue;
      }

      const facts = input.supplyFacts?.[supply.supplyId];
      const reverseCharge = evaluateNationalReverseCharge({
        country: supply.placeCountry,
        sellerEstablished: establishedIn(seller, supply.placeCountry),
        sellerVatRegistered: registeredIn(seller, supply.placeCountry),
        buyerEstablished: fact(establishedIn(buyer, supply.placeCountry)),
        buyerVatRegistered: registeredIn(buyer, supply.placeCountry) ? 'yes' : 'unknown',
        buyerPeriodicReturnFiler: facts?.buyerPeriodicReturnFiler ?? 'unknown',
        buyerTaxablePerson: facts?.buyerStatus === 'taxable_person' ? 'yes' : facts?.buyerStatus === 'consumer' ? 'no' : 'unknown',
        buyerGeneralSchemeVatRegistered: registeredIn(buyer, supply.placeCountry) ? 'yes' : 'unknown',
        transactionType: 'ordinary_goods',
      });
      const treatment: SapTreatment = reverseCharge.status === 'applies' ? 'RC_DOMESTIC_SALE' : 'DOMESTIC_SALE';
      suggestions.push(suggestion(
        input.companyId, 'seller', supply.supplyId, supply.placeCountry, treatment,
        reverseCharge.status === 'indeterminate' || reverseCharge.status === 'country_rule_not_verified' ? 'conditional' : 'verified',
        reverseCharge.status === 'applies' ? 'A verified national reverse-charge rule shifts VAT to the customer.' : 'The resting supply is a domestic seller transaction in the recorded place of supply.',
      ));
    }

    if (buyer.id === input.actingPartyId) {
      suggestions.push(suggestion(
        input.companyId, 'buyer', supply.supplyId, supply.placeCountry, 'DOMESTIC_PURCHASE', 'verified',
        'The acting company buys under a resting domestic supply in this jurisdiction.',
      ));
    }
  }

  return { status: 'complete', suggestions };
}

export function deriveSapForOwnGoods(
  companyId: string,
  result: OwnGoodsTransferResult,
): SpecialSapDerivationResult {
  if (result.status === 'indeterminate' || result.status === 'review_required') {
    return { status: 'indeterminate', suggestions: [], rationale: result.rationale };
  }
  if (result.status !== 'deemed_transfer') return { status: 'complete', suggestions: [] };

  const confidence = result.timing === 'unknown' ? 'conditional' as const : 'verified' as const;
  return {
    status: 'complete',
    suggestions: [
      specialSuggestion(companyId, 'seller', 'OWN_GOODS_OUT', result.deemedSupplyCountry, 'IC_SUPPLY', confidence, 'Article 17(1)/(3) creates the deemed outbound own-goods supply.'),
      specialSuggestion(companyId, 'buyer', 'OWN_GOODS_IN', result.deemedAcquisitionCountry, 'IC_ACQUISITION', confidence, 'The own-goods transfer creates the corresponding intra-Community acquisition in the destination Member State.'),
    ],
  };
}

export function deriveSapForExport(
  companyId: string,
  departureCountry: string,
  result: DirectExportResult,
): SpecialSapDerivationResult {
  if (result.status === 'indeterminate') return { status: 'indeterminate', suggestions: [], rationale: result.rationale };
  if (result.status === 'not_applicable') return { status: 'complete', suggestions: [] };
  const treatment: SapTreatment = result.status === 'not_met' ? 'DOMESTIC_SALE' : 'EXPORT';
  return {
    status: 'complete',
    suggestions: [specialSuggestion(
      companyId, 'seller', 'DIRECT_EXPORT', departureCountry.toUpperCase(), treatment,
      result.status === 'verified' || result.status === 'not_met' ? 'verified' : 'conditional',
      result.status === 'not_met'
        ? 'The export exemption is not usable on the recorded facts; no zero-rated export SAP code is proposed.'
        : 'The direct export is verified or explicitly conditional, so the company export mapping is proposed.',
    )],
  };
}

export function deriveSapForProcessingService(
  companyId: string,
  actingRole: 'provider' | 'recipient',
  result: ProcessingServiceResult,
): SpecialSapDerivationResult {
  if (result.status === 'indeterminate' || result.status === 'review_required') {
    return { status: 'indeterminate', suggestions: [], rationale: result.rationale };
  }
  const treatment: SapTreatment = result.status === 'reverse_charge'
    ? actingRole === 'provider' ? 'RC_DOMESTIC_SALE' : 'RC_DOMESTIC_PURCHASE'
    : actingRole === 'provider' ? 'DOMESTIC_SALE' : 'DOMESTIC_PURCHASE';
  return {
    status: 'complete',
    suggestions: [specialSuggestion(
      companyId, actingRole === 'provider' ? 'seller' : 'buyer', 'PROCESSING_SERVICE', result.placeCountry, treatment, 'verified',
      'The SAP treatment follows the Article 44 service place and the Article 196 liability result.',
    )],
  };
}

export function deriveSapForSwissImport(
  companyId: string,
  result: SwissImportResult,
): SpecialSapDerivationResult {
  if (result.status === 'indeterminate') return { status: 'indeterminate', suggestions: [], rationale: result.rationale };
  if (result.status === 'customer_import') return { status: 'complete', suggestions: [] };
  return {
    status: 'complete',
    suggestions: [specialSuggestion(
      companyId, 'seller', 'SWISS_DOMESTIC_SUPPLY', 'CH', 'DOMESTIC_SALE', 'verified',
      'The supplier imports in its own name under the Swiss subordination-declaration model, so the sale is a Swiss domestic supply.',
    )],
  };
}
