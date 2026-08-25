import type { CompanyConfig } from './companyConfig.js';

export const COMPANIES = {
  EPDE: {
    id: 'EPDE',
    name: 'EPDE',
    homeCountry: 'DE',
    fixedEstablishments: ['DE'],
    vatRegistrations: [
      { country: 'SI', vatId: 'SI66423562' },
      { country: 'LV', vatId: 'LV90013367396' },
      { country: 'EE', vatId: 'EE102839441' },
      { country: 'NL', vatId: 'NL827914052B01' },
      { country: 'BE', vatId: 'BE1022245089' },
      { country: 'DE', vatId: 'DE449663039' },
      { country: 'CZ', vatId: 'CZ687387072' },
      { country: 'PL', vatId: 'PL5263841834' },
    ],
    policy: {
      triangleDestinationVatRegistration: 'conservative_block',
      policyStatus: 'legacy_needs_revalidation',
    },
  },
  EPROHA: {
    id: 'EPROHA',
    name: 'EPROHA',
    homeCountry: 'AT',
    fixedEstablishments: ['AT'],
    vatRegistrations: [
      { country: 'AT', vatId: 'ATU36513402' },
      { country: 'DE', vatId: 'DE248554278' },
      { country: 'CH', vatId: 'CHE-113.857.016 MWST' },
    ],
    policy: {
      triangleDestinationVatRegistration: 'conservative_block',
      policyStatus: 'legacy_needs_revalidation',
    },
  },
} as const satisfies Record<string, CompanyConfig>;

export type KnownCompanyId = keyof typeof COMPANIES;

export function getCompany(id: string | undefined): CompanyConfig | undefined {
  if (!id) return undefined;
  return COMPANIES[id as KnownCompanyId];
}
