import { getStandardVatRate } from '../knowledge/countries/standardVatRates.js';
import { evaluateDomesticSellerRegistrationRisk, type RegistrationRiskResult } from './registrationRisk.js';
import { evaluateNationalReverseCharge, type NationalRcResult } from './reverseCharge.js';
import { supplyId, type ChainTransaction, type Party } from './transaction.js';
import type { SupplyComplianceFacts, YesNoUnknown } from './vatCase.js';

export interface DomesticSupplyAnalysis {
  readonly supplyIndex: number;
  readonly supplyId: `L${number}`;
  readonly country: string;
  readonly sellerPartyId: string;
  readonly buyerPartyId: string;
  readonly treatment: 'DOMESTIC_SUPPLY';
  readonly standardRate: number | null;
  readonly rateSourceId: string | null;
  readonly reverseCharge: NationalRcResult;
  readonly sellerRegistration: RegistrationRiskResult;
}

export type DomesticChainResult =
  | { readonly status: 'complete'; readonly country: string; readonly supplies: readonly DomesticSupplyAnalysis[]; readonly rationale: string }
  | { readonly status: 'invalid'; readonly issues: readonly string[] };

function isEstablished(party: Party, country: string): boolean {
  const target = country.toUpperCase();
  return party.establishmentCountry.toUpperCase() === target ||
    (party.fixedEstablishments ?? []).some((item) => item.toUpperCase() === target);
}

function isVatRegistered(party: Party, country: string): boolean {
  const target = country.toUpperCase();
  return (party.vatRegistrations ?? []).some((registration) => registration.country.toUpperCase() === target);
}

function buyerVatFact(buyer: Party, country: string, facts: SupplyComplianceFacts | undefined): YesNoUnknown {
  const customerVatId = facts?.customerVatId;
  if (customerVatId?.status === 'known') {
    if (customerVatId.country.toUpperCase() !== country.toUpperCase()) return 'no';
    if (customerVatId.validation === 'invalid') return 'no';
    if (customerVatId.validation === 'valid') return 'yes';
    return 'unknown';
  }
  if (customerVatId?.status === 'none') return 'no';
  if (isVatRegistered(buyer, country)) return 'yes';
  return 'unknown';
}

function buyerTaxableFact(facts: SupplyComplianceFacts | undefined): YesNoUnknown {
  if (facts?.buyerStatus === 'taxable_person') return 'yes';
  if (facts?.buyerStatus === 'consumer') return 'no';
  return 'unknown';
}

export function analyzeDomesticChain(
  transaction: ChainTransaction,
  supplyFacts?: Readonly<Record<string, SupplyComplianceFacts>>,
): DomesticChainResult {
  const departure = transaction.departureCountry.toUpperCase();
  const destination = transaction.destinationCountry.toUpperCase();
  const issues: string[] = [];

  if (transaction.parties.length < 2) issues.push('A domestic chain requires at least two parties.');
  if (departure !== destination) issues.push('Domestic-chain analysis requires identical departure and destination countries.');
  if (issues.length > 0) return { status: 'invalid', issues };

  const rate = getStandardVatRate(departure);
  const supplies = Array.from({ length: transaction.parties.length - 1 }, (_, supplyIndex): DomesticSupplyAnalysis => {
    const seller = transaction.parties[supplyIndex];
    const buyer = transaction.parties[supplyIndex + 1];
    if (!seller || !buyer) throw new RangeError('Commercial chain contains an invalid supply index.');

    const id = supplyId(supplyIndex);
    const facts = supplyFacts?.[id];
    const buyerEstablished: YesNoUnknown = isEstablished(buyer, departure) ? 'yes' : 'no';
    const buyerVatRegistered = buyerVatFact(buyer, departure, facts);
    const reverseCharge = evaluateNationalReverseCharge({
      country: departure,
      sellerEstablished: isEstablished(seller, departure),
      sellerVatRegistered: isVatRegistered(seller, departure),
      buyerEstablished,
      buyerVatRegistered,
      buyerPeriodicReturnFiler: facts?.buyerPeriodicReturnFiler ?? 'unknown',
      buyerTaxablePerson: buyerTaxableFact(facts),
      buyerGeneralSchemeVatRegistered: buyerVatRegistered,
      transactionType: 'ordinary_goods',
    });

    return {
      supplyIndex,
      supplyId: id,
      country: departure,
      sellerPartyId: seller.id,
      buyerPartyId: buyer.id,
      treatment: 'DOMESTIC_SUPPLY',
      standardRate: rate?.rate ?? null,
      rateSourceId: rate?.sourceId ?? null,
      reverseCharge,
      sellerRegistration: evaluateDomesticSellerRegistrationRisk(seller, departure, reverseCharge),
    };
  });

  return {
    status: 'complete',
    country: departure,
    supplies,
    rationale: 'Departure and destination are the same jurisdiction. Each commercial supply is analyzed as a domestic supply; Article 36a is not used to invent a cross-border moving-supply result.',
  };
}
