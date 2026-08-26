export interface ExternalVatSource {
  readonly id: string;
  readonly jurisdiction: string;
  readonly title: string;
  readonly url: string;
  readonly reviewedOn: string;
}

const REVIEWED_ON = '2026-08-26';

export const NON_EU_SOURCES = {
  CH_ESTV_SUBORDINATION_DECLARATION: {
    id: 'CH_ESTV_SUBORDINATION_DECLARATION',
    jurisdiction: 'CH',
    title: 'Swiss Federal Tax Administration — import using a subordination declaration',
    url: 'https://www.estv.admin.ch/de/mwst-anmeldung-versandhandelsregelung',
    reviewedOn: REVIEWED_ON,
  },
  CH_MWSTV_ART3: {
    id: 'CH_MWSTV_ART3',
    jurisdiction: 'CH',
    title: 'Swiss VAT Ordinance Article 3 — subordination declaration on import',
    url: 'https://www.fedlex.admin.ch/eli/cc/2009/828/de',
    reviewedOn: REVIEWED_ON,
  },
  CH_ESTV_RATES: {
    id: 'CH_ESTV_RATES',
    jurisdiction: 'CH',
    title: 'Swiss Federal Tax Administration — current VAT rates',
    url: 'https://www.estv.admin.ch/de/mwst-steuersaetze-schweiz',
    reviewedOn: REVIEWED_ON,
  },
  GB_HMRC_NOTICE_703: {
    id: 'GB_HMRC_NOTICE_703',
    jurisdiction: 'GB',
    title: 'HMRC VAT Notice 703 — export of goods from the United Kingdom',
    url: 'https://www.gov.uk/guidance/vat-on-goods-exported-from-the-uk-notice-703',
    reviewedOn: REVIEWED_ON,
  },
} as const satisfies Record<string, ExternalVatSource>;
