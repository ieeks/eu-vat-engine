import type { ChainTransaction, CountryCode, PartyId } from './transaction.js';

export type YesNoUnknown = 'yes' | 'no' | 'unknown';

export type BuyerStatus =
  | 'taxable_person'
  | 'non_taxable_legal_person'
  | 'consumer'
  | 'unknown';

export type VatIdFact =
  | { readonly status: 'unknown' }
  | { readonly status: 'none' }
  | {
      readonly status: 'known';
      readonly country: CountryCode;
      readonly vatId?: string;
      readonly validation: 'valid' | 'invalid' | 'unknown';
      readonly indicatedToSupplier: YesNoUnknown;
    };

export type RecapitulativeStatementStatus =
  | 'not_due_yet'
  | 'correct'
  | 'missing'
  | 'incorrect'
  | 'justified'
  | 'unknown';

export interface SupplyComplianceFacts {
  readonly buyerStatus?: BuyerStatus;
  readonly customerVatId?: VatIdFact;
  readonly recapitulativeStatement?: RecapitulativeStatementStatus;
  readonly buyerPeriodicReturnFiler?: YesNoUnknown;
  readonly recipientLiableUnderArticle197?: YesNoUnknown;
  readonly triangleInvoiceReverseChargeText?: 'present' | 'missing' | 'unknown';
  readonly abuseCheck?: 'clear' | 'concern' | 'unknown';
}

export interface AcquisitionFacts {
  readonly vatIdUsed:
    | { readonly status: 'unknown' }
    | { readonly status: 'none' }
    | { readonly status: 'known'; readonly country: CountryCode; readonly vatId?: string };
  readonly destinationTaxReported?: YesNoUnknown;
}

export interface VatCaseInput {
  readonly transaction: ChainTransaction;
  readonly supplyFacts?: Readonly<Record<string, SupplyComplianceFacts>>;
  readonly acquisitionFacts?: AcquisitionFacts;
  readonly actingPartyId?: PartyId;
  readonly companyId?: string;
  readonly policyMode?: 'legal_only' | 'company_policy';
}
