export interface CountryRuleSource {
  readonly id: string;
  readonly country: string;
  readonly title: string;
  readonly url: string;
  readonly reviewedOn: string;
  readonly scopeNote: string;
}

export const REVERSE_CHARGE_SOURCES = {
  IT_DPR633_ART17_2: {
    id: 'IT_DPR633_ART17_2',
    country: 'IT',
    title: 'Italian VAT - Article 17(2) DPR 633/1972, official tax administration practice',
    url: 'https://def.finanze.it/DocTribFrontend/getPrassiDetail.do?id=%7B84D18F05-D449-4EC7-B3D7-A85B0CA6751B%7D',
    reviewedOn: '2026-08-25',
    scopeNote:
      'Verified for supplies by a non-established supplier to an Italian-established taxable customer; direct VAT identification alone is not treated as establishment.',
  },
  BE_VAT_CODE_ART51_2_5: {
    id: 'BE_VAT_CODE_ART51_2_5',
    country: 'BE',
    title: 'Belgian VAT Code Article 51 §2 5° - FPS Finance guidance',
    url: 'https://finances.belgium.be/fr/node/11867',
    reviewedOn: '2026-08-25',
    scopeNote:
      'Verified branch for non-established suppliers and qualifying periodic-return-filer customers. Direct supplier VAT registration is not a universal blocker.',
  },
} as const satisfies Record<string, CountryRuleSource>;
