export interface CountryRuleSource {
  readonly id: string;
  readonly country: string;
  readonly title: string;
  readonly url: string;
  readonly reviewedOn: string;
  readonly scopeNote: string;
}

const REVIEWED_ON = '2026-08-26';

export const REVERSE_CHARGE_SOURCES = {
  IT_DPR633_ART17_2: {
    id: 'IT_DPR633_ART17_2',
    country: 'IT',
    title: 'Italian VAT — Article 17(2) DPR 633/1972, official tax administration practice',
    url: 'https://def.finanze.it/DocTribFrontend/getPrassiDetail.do?id=%7B84D18F05-D449-4EC7-B3D7-A85B0CA6751B%7D',
    reviewedOn: REVIEWED_ON,
    scopeNote:
      'Verified for supplies by a non-established supplier to an Italian-established taxable customer; direct VAT identification alone is not treated as establishment.',
  },
  BE_VAT_CODE_ART51_2_5: {
    id: 'BE_VAT_CODE_ART51_2_5',
    country: 'BE',
    title: 'Belgian VAT Code Article 51 §2 5° — FPS Finance guidance',
    url: 'https://finances.belgium.be/fr/entreprises/tva/international/brexit/determination-redevable-tva',
    reviewedOn: REVIEWED_ON,
    scopeNote:
      'Verified branch for non-established suppliers and qualifying periodic-return-filer customers. Direct supplier VAT registration is not a universal blocker.',
  },
  NL_FOREIGN_SUPPLIER_SHIFT: {
    id: 'NL_FOREIGN_SUPPLIER_SHIFT',
    country: 'NL',
    title: 'Belastingdienst — goods sold in the Netherlands by foreign entrepreneurs',
    url: 'https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/internationaal/btw_voor_buitenlandse_ondernemers/goederen/goederen_verkopen_aan_klanten_in_nederland',
    reviewedOn: REVIEWED_ON,
    scopeNote:
      'Verified for ordinary goods supplied in the Netherlands by a business established outside the Netherlands to a customer established or fixed-established in the Netherlands. VAT is generally shifted to the customer; a Dutch VAT registration alone is not treated as establishment.',
  },
  PL_VAT_ACT_ART17_1_5: {
    id: 'PL_VAT_ACT_ART17_1_5',
    country: 'PL',
    title: 'Polish VAT Act Article 17(1)(5) — official Ministry of Finance / ELI text',
    url: 'https://eli.gov.pl/api/acts/DU/2024/361/text.html',
    reviewedOn: REVIEWED_ON,
    scopeNote:
      'Verified ordinary-goods branch: non-established supplier must also not be registered under Article 96(4); qualifying Polish-established buyer becomes liable.',
  },
  CZ_VAT_ACT_108_3_B: {
    id: 'CZ_VAT_ACT_108_3_B',
    country: 'CZ',
    title: 'Czech Financial Administration — notice for non-established taxable persons',
    url: 'https://financnisprava.gov.cz/en/taxes/vat-registration-for-non-established-persons/notice-for-non-established-taxable-persons',
    reviewedOn: REVIEWED_ON,
    scopeNote:
      'Verified ordinary-goods branch under Section 108(3)(b): non-established supplier without valid Czech payer registration supplies goods in Czechia to a registered payer.',
  },
  SI_ZDDV1_ART76_3: {
    id: 'SI_ZDDV1_ART76_3',
    country: 'SI',
    title: 'Slovenian SPOT/FURS — VAT identification and Article 76(3) reverse charge',
    url: 'https://spot.gov.si/sl/teme/davek-na-dodano-vrednost-ddv/',
    reviewedOn: REVIEWED_ON,
    scopeNote:
      'Verified: a non-established supplier to a customer identified under the general VAT scheme may leave VAT to the recipient under Article 76(3); if the foreign supplier elects Slovenian VAT identification, the supplier becomes liable.',
  },
  EE_VAT_ACT_GENERAL_RC: {
    id: 'EE_VAT_ACT_GENERAL_RC',
    country: 'EE',
    title: 'Estonian Tax and Customs Board — general reverse VAT liability for foreign suppliers',
    url: 'https://www.emta.ee/en/business-client/taxes-and-payment/value-added-tax/calculation-and-refund-vat/taxable-transactions-and-acts',
    reviewedOn: REVIEWED_ON,
    scopeNote:
      'Verified: Estonian taxable purchaser reverse-charges ordinary goods/services acquired from a foreign business not registered as a taxable person in Estonia and without a participating permanent establishment.',
  },
  LV_GENERAL_VAT: {
    id: 'LV_GENERAL_VAT',
    country: 'LV',
    title: 'Latvian State Revenue Service — VAT general and reverse-payment arrangements',
    url: 'https://www.vid.gov.lv/en/value-added-tax',
    reviewedOn: REVIEWED_ON,
    scopeNote:
      'Verified only for the general distinction: ordinary domestic supplies use normal VAT, while Latvia lists specific domestic reverse-charge categories. No generic foreign-supplier ordinary-goods rule is activated by this source in the engine.',
  },
} as const satisfies Record<string, CountryRuleSource>;
