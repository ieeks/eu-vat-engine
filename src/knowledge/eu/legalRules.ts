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
  reviewedOn: '2026-08-26',
};

const T646_SOURCE: LegalSource = {
  title: 'General Court judgment T-646/24, 3 December 2025',
  url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62024TJ0646',
  reviewedOn: '2026-08-25',
};

const LUXURY_TRUST_SOURCE: LegalSource = {
  title: 'Court of Justice judgment C-247/21, Luxury Trust Automobil',
  url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62021CJ0247',
  reviewedOn: '2026-08-25',
};

export const EU_LEGAL_RULES = {
  VAT_DIRECTIVE_ART_17_1: { id: 'VAT_DIRECTIVE_ART_17_1', label: 'Art. 17(1) — transfer of own business goods to another Member State deemed a supply', source: VAT_DIRECTIVE_SOURCE },
  VAT_DIRECTIVE_ART_17_2_F: { id: 'VAT_DIRECTIVE_ART_17_2_F', label: 'Art. 17(2)(f) — work/appraisal exception where the goods are returned to the Member State of origin', source: VAT_DIRECTIVE_SOURCE },
  VAT_DIRECTIVE_ART_17_3: { id: 'VAT_DIRECTIVE_ART_17_3', label: 'Art. 17(3) — deemed transfer when an Article 17(2) condition later ceases', source: VAT_DIRECTIVE_SOURCE },
  VAT_DIRECTIVE_ART_31: { id: 'VAT_DIRECTIVE_ART_31', label: 'Art. 31 — place of supply without dispatch or transport', source: VAT_DIRECTIVE_SOURCE },
  VAT_DIRECTIVE_ART_32: { id: 'VAT_DIRECTIVE_ART_32', label: 'Art. 32 — place of supply with dispatch or transport', source: VAT_DIRECTIVE_SOURCE },
  VAT_DIRECTIVE_ART_36A_1: { id: 'VAT_DIRECTIVE_ART_36A_1', label: 'Art. 36a(1) — default attribution to the supply made to the intermediary operator', source: VAT_DIRECTIVE_SOURCE },
  VAT_DIRECTIVE_ART_36A_2: { id: 'VAT_DIRECTIVE_ART_36A_2', label: 'Art. 36a(2) — departure-state VAT ID communicated to supplier', source: VAT_DIRECTIVE_SOURCE },
  VAT_DIRECTIVE_ART_36A_OUT_OF_SCOPE: { id: 'VAT_DIRECTIVE_ART_36A_OUT_OF_SCOPE', label: 'Art. 36a scope — movement from one Member State to another Member State', source: VAT_DIRECTIVE_SOURCE },
  VAT_DIRECTIVE_ART_40: { id: 'VAT_DIRECTIVE_ART_40', label: 'Art. 40 — place of intra-Community acquisition at end of transport', source: VAT_DIRECTIVE_SOURCE },
  VAT_DIRECTIVE_ART_41: { id: 'VAT_DIRECTIVE_ART_41', label: 'Art. 41 — VAT-ID Member State safety-net acquisition', source: VAT_DIRECTIVE_SOURCE },
  VAT_DIRECTIVE_ART_42: { id: 'VAT_DIRECTIVE_ART_42', label: 'Art. 42 — triangular derogation from Article 41', source: VAT_DIRECTIVE_SOURCE },
  VAT_DIRECTIVE_ART_44: { id: 'VAT_DIRECTIVE_ART_44', label: 'Art. 44 — B2B service place at the customer establishment receiving the service', source: VAT_DIRECTIVE_SOURCE },
  VAT_DIRECTIVE_ART_138_1: { id: 'VAT_DIRECTIVE_ART_138_1', label: 'Art. 138(1)/(1a) — exemption for qualifying intra-Community supplies', source: VAT_DIRECTIVE_SOURCE },
  VAT_DIRECTIVE_ART_141: { id: 'VAT_DIRECTIVE_ART_141', label: 'Art. 141 — triangular transaction simplification', source: VAT_DIRECTIVE_SOURCE },
  VAT_DIRECTIVE_ART_143_1_D: { id: 'VAT_DIRECTIVE_ART_143_1_D', label: 'Art. 143(1)(d) — import exemption for qualifying onward intra-Community supply', source: VAT_DIRECTIVE_SOURCE },
  VAT_DIRECTIVE_ART_146_1_A: { id: 'VAT_DIRECTIVE_ART_146_1_A', label: 'Art. 146(1)(a) — export by or on behalf of the seller', source: VAT_DIRECTIVE_SOURCE },
  VAT_DIRECTIVE_ART_146_1_B: { id: 'VAT_DIRECTIVE_ART_146_1_B', label: 'Art. 146(1)(b) — export by or on behalf of a customer not established in the supplier territory', source: VAT_DIRECTIVE_SOURCE },
  VAT_DIRECTIVE_ART_196: { id: 'VAT_DIRECTIVE_ART_196', label: 'Art. 196 — recipient liability for qualifying cross-border B2B services under Article 44', source: VAT_DIRECTIVE_SOURCE },
  VAT_DIRECTIVE_ART_197: { id: 'VAT_DIRECTIVE_ART_197', label: 'Art. 197 — recipient liable for VAT in qualifying triangular transaction', source: VAT_DIRECTIVE_SOURCE },
  VAT_DIRECTIVE_ART_201: { id: 'VAT_DIRECTIVE_ART_201', label: 'Art. 201 — VAT on importation payable by person(s) designated by the Member State', source: VAT_DIRECTIVE_SOURCE },
  CASE_T646_24: { id: 'CASE_T646_24', label: 'T-646/24 — four-party physical delivery extension and fraud/abuse limitation', source: T646_SOURCE },
  CASE_C247_21: { id: 'CASE_C247_21', label: 'C-247/21 Luxury Trust — triangular invoice reverse-charge wording', source: LUXURY_TRUST_SOURCE },
} as const satisfies Record<string, LegalRuleDefinition>;
