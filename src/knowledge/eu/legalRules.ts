export interface LegalSource {
  readonly title: string;
  readonly url: string;
  readonly reviewedOn: string;
}

export interface LegalRuleDefinition {
  readonly id: string;
  readonly label: string;
  readonly source: LegalSource;
}

const VAT_DIRECTIVE_SOURCE: LegalSource = {
  title: 'Council Directive 2006/112/EC on the common system of value added tax — consolidated text',
  url: 'https://eur-lex.europa.eu/eli/dir/2006/112/2025-04-14',
  reviewedOn: '2026-08-25',
};

export const EU_LEGAL_RULES = {
  VAT_DIRECTIVE_ART_36A_1: {
    id: 'VAT_DIRECTIVE_ART_36A_1',
    label: 'Art. 36a(1) — default attribution to the supply made to the intermediary operator',
    source: VAT_DIRECTIVE_SOURCE,
  },
  VAT_DIRECTIVE_ART_36A_2: {
    id: 'VAT_DIRECTIVE_ART_36A_2',
    label: 'Art. 36a(2) — departure-state VAT ID communicated to supplier',
    source: VAT_DIRECTIVE_SOURCE,
  },
  VAT_DIRECTIVE_ART_36A_OUT_OF_SCOPE: {
    id: 'VAT_DIRECTIVE_ART_36A_OUT_OF_SCOPE',
    label: 'Art. 36a scope — movement must be from one Member State to another Member State',
    source: VAT_DIRECTIVE_SOURCE,
  },
} as const satisfies Record<string, LegalRuleDefinition>;
