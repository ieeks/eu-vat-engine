import type { CountryCode, Party, VatRegistration } from '../domain/transaction.js';

export interface CompanyPolicyConfig {
  readonly triangleDestinationVatRegistration:
    | 'legal_baseline'
    | 'conservative_block';
  readonly policyStatus: 'approved' | 'legacy_needs_revalidation';
}

export interface CompanyConfig {
  readonly id: string;
  readonly name: string;
  readonly homeCountry: CountryCode;
  readonly fixedEstablishments: readonly CountryCode[];
  readonly vatRegistrations: readonly VatRegistration[];
  readonly policy: CompanyPolicyConfig;
}

export function companyToParty(config: CompanyConfig): Party {
  return {
    id: config.id,
    establishmentCountry: config.homeCountry,
    fixedEstablishments: config.fixedEstablishments,
    vatRegistrations: config.vatRegistrations,
  };
}
