export type CountryCode = string;
export type PartyId = string;

export interface VatRegistration {
  readonly country: CountryCode;
  readonly vatId: string;
}

export interface Party {
  readonly id: PartyId;
  readonly establishmentCountry: CountryCode;
  readonly fixedEstablishments?: readonly CountryCode[];
  readonly vatRegistrations?: readonly VatRegistration[];
}

export type VatIdCommunication =
  | { readonly status: 'unknown' }
  | { readonly status: 'none' }
  | {
      readonly status: 'known';
      readonly country: CountryCode;
      readonly vatId?: string;
    };

export interface TransportFacts {
  /** Party that dispatches/transports the goods itself or through a third party acting on its behalf. */
  readonly organizerPartyId: PartyId | null;

  /**
   * VAT ID actually communicated by an intermediary operator to its supplier for this transaction.
   * Availability of a VAT registration elsewhere in the model is deliberately irrelevant here.
   */
  readonly communicatedVatIdToSupplier: VatIdCommunication;
}

export interface ChainTransaction {
  /** Commercial chain order. parties[0] sells to parties[1], etc. */
  readonly parties: readonly Party[];
  readonly departureCountry: CountryCode;
  readonly destinationCountry: CountryCode;
  readonly transport: TransportFacts;
}

export function supplyId(index: number): `L${number}` {
  return `L${index + 1}`;
}
