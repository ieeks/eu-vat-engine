import { isEuMemberState } from '../knowledge/eu/memberStates.js';
import { getStandardVatRate } from '../knowledge/countries/standardVatRates.js';
import { evaluateArt138, type Art138Result } from './art138.js';
import type { SupplyComplianceFacts, YesNoUnknown } from './vatCase.js';

export type ExportOrganizer =
  | 'supplier'
  | 'supplier_agent'
  | 'customer'
  | 'customer_agent'
  | 'unknown';

export type ExportEvidenceStatus = 'available' | 'missing' | 'unknown';

export interface DirectExportInput {
  readonly departureCountry: string;
  readonly destinationCountry: string;
  readonly organizer: ExportOrganizer;
  readonly customerEstablishedInDepartureCountry: YesNoUnknown;
  readonly exportEvidence: ExportEvidenceStatus;
}

export type DirectExportResult =
  | { readonly status: 'not_applicable'; readonly rationale: string }
  | {
      readonly status: 'verified' | 'conditional' | 'not_met';
      readonly legalRuleId: 'VAT_DIRECTIVE_ART_146_1_A' | 'VAT_DIRECTIVE_ART_146_1_B';
      readonly evidenceStatus: ExportEvidenceStatus;
      readonly rationale: string;
    }
  | {
      readonly status: 'indeterminate';
      readonly missingFacts: readonly string[];
      readonly rationale: string;
    };

function exportResultFromEvidence(
  legalRuleId: 'VAT_DIRECTIVE_ART_146_1_A' | 'VAT_DIRECTIVE_ART_146_1_B',
  evidence: ExportEvidenceStatus,
  basis: string,
): DirectExportResult {
  if (evidence === 'available') {
    return {
      status: 'verified',
      legalRuleId,
      evidenceStatus: evidence,
      rationale: `${basis} Export evidence is recorded as available.`,
    };
  }
  if (evidence === 'missing') {
    return {
      status: 'not_met',
      legalRuleId,
      evidenceStatus: evidence,
      rationale: `${basis} The required export evidence is recorded as missing, so the exemption is not treated as verified/usable.`,
    };
  }
  return {
    status: 'conditional',
    legalRuleId,
    evidenceStatus: evidence,
    rationale: `${basis} The export exemption remains conditional until the required customs/commercial export evidence is retained.`,
  };
}

export function evaluateDirectExport(input: DirectExportInput): DirectExportResult {
  const departure = input.departureCountry.toUpperCase();
  const destination = input.destinationCountry.toUpperCase();
  if (!isEuMemberState(departure) || isEuMemberState(destination)) {
    return {
      status: 'not_applicable',
      rationale: 'This EU export evaluator requires physical movement from an EU Member State to a third country.',
    };
  }

  if (input.organizer === 'unknown') {
    return {
      status: 'indeterminate',
      missingFacts: ['organizer'],
      rationale: 'Article 146(1)(a) and (b) depend on whether export is carried out by/on behalf of the seller or by/on behalf of the customer.',
    };
  }

  if (input.organizer === 'supplier' || input.organizer === 'supplier_agent') {
    return exportResultFromEvidence(
      'VAT_DIRECTIVE_ART_146_1_A',
      input.exportEvidence,
      'The goods are exported outside the EU by or on behalf of the seller under Article 146(1)(a).',
    );
  }

  if (input.customerEstablishedInDepartureCountry === 'unknown') {
    return {
      status: 'indeterminate',
      missingFacts: ['customerEstablishedInDepartureCountry'],
      rationale: 'An indirect export under Article 146(1)(b) requires the exporting customer not to be established in the supplier territory.',
    };
  }

  if (input.customerEstablishedInDepartureCountry === 'yes') {
    return {
      status: 'not_met',
      legalRuleId: 'VAT_DIRECTIVE_ART_146_1_B',
      evidenceStatus: input.exportEvidence,
      rationale: 'The customer arranging the export is established in the departure Member State, so the recorded facts do not meet Article 146(1)(b).',
    };
  }

  return exportResultFromEvidence(
    'VAT_DIRECTIVE_ART_146_1_B',
    input.exportEvidence,
    'The goods are exported by or on behalf of a customer not established in the supplier territory under Article 146(1)(b).',
  );
}

export interface EuImportInput {
  readonly departureCountry: string;
  readonly importCountry: string;
  readonly finalDestinationCountry: string;
  readonly customsProcedure42Declared: YesNoUnknown;
  readonly importerVatIdCountry?: string;
  readonly destinationCustomerVatIdCountry?: string;
  readonly onwardSupplyFacts?: SupplyComplianceFacts;
}

export type EuImportResult =
  | { readonly status: 'not_applicable'; readonly rationale: string }
  | {
      readonly status: 'normal_import';
      readonly importCountry: string;
      readonly liabilityRuleId: 'VAT_DIRECTIVE_ART_201';
      readonly rationale: string;
    }
  | {
      readonly status: 'procedure_42_verified';
      readonly importCountry: string;
      readonly finalDestinationCountry: string;
      readonly importRuleId: 'VAT_DIRECTIVE_ART_143_1_D';
      readonly onwardSupply: Extract<Art138Result, { status: 'verified' }>;
      readonly rationale: string;
    }
  | {
      readonly status: 'procedure_42_conditional';
      readonly importCountry: string;
      readonly finalDestinationCountry: string;
      readonly importRuleId: 'VAT_DIRECTIVE_ART_143_1_D';
      readonly onwardSupply: Art138Result;
      readonly pendingConditions: readonly string[];
      readonly rationale: string;
    };

export function evaluateEuImport(input: EuImportInput): EuImportResult {
  const departure = input.departureCountry.toUpperCase();
  const importCountry = input.importCountry.toUpperCase();
  const finalDestination = input.finalDestinationCountry.toUpperCase();

  if (isEuMemberState(departure) || !isEuMemberState(importCountry)) {
    return {
      status: 'not_applicable',
      rationale: 'This evaluator requires importation from a third country into an EU Member State.',
    };
  }

  if (!isEuMemberState(finalDestination) || finalDestination === importCountry) {
    return {
      status: 'normal_import',
      importCountry,
      liabilityRuleId: 'VAT_DIRECTIVE_ART_201',
      rationale:
        'No onward movement to a different EU Member State is recorded, so the engine does not apply the Article 143(1)(d) import exemption. Import VAT liability follows the importing Member State under Article 201.',
    };
  }

  if (input.customsProcedure42Declared === 'no') {
    return {
      status: 'normal_import',
      importCountry,
      liabilityRuleId: 'VAT_DIRECTIVE_ART_201',
      rationale:
        'Procedure 42/import exemption is explicitly not declared, so import VAT is treated under the normal import rules in the import Member State.',
    };
  }

  const onwardSupply = evaluateArt138(importCountry, finalDestination, input.onwardSupplyFacts);
  const pending: string[] = [];
  if (input.customsProcedure42Declared === 'unknown') pending.push('customsProcedure42Declared');
  if (input.importerVatIdCountry?.toUpperCase() !== importCountry) pending.push('importerVatIdCountry');
  if (input.destinationCustomerVatIdCountry?.toUpperCase() !== finalDestination) pending.push('destinationCustomerVatIdCountry');
  if (onwardSupply.status !== 'verified') pending.push('onwardSupplyArticle138');

  if (pending.length === 0 && onwardSupply.status === 'verified') {
    return {
      status: 'procedure_42_verified',
      importCountry,
      finalDestinationCountry: finalDestination,
      importRuleId: 'VAT_DIRECTIVE_ART_143_1_D',
      onwardSupply,
      rationale:
        'The import is recorded in a Member State other than final destination, Procedure 42 is declared, the relevant VAT-ID countries are recorded, and the onward intra-Community supply satisfies the engine’s verified Article 138 conditions.',
    };
  }

  return {
    status: 'procedure_42_conditional',
    importCountry,
    finalDestinationCountry: finalDestination,
    importRuleId: 'VAT_DIRECTIVE_ART_143_1_D',
    onwardSupply,
    pendingConditions: pending,
    rationale:
      'Article 143(1)(d) may exempt the import followed by a qualifying onward intra-Community supply, but one or more customs/VAT-ID/Article-138 conditions remain unresolved.',
  };
}

export interface SwissImportInput {
  readonly originCountry: string;
  readonly importerOfRecord: 'supplier' | 'customer' | 'unknown';
  readonly supplierUsesSubordinationDeclaration: YesNoUnknown;
}

export type SwissImportResult =
  | {
      readonly status: 'supplier_domestic_supply';
      readonly country: 'CH';
      readonly standardRate: number;
      readonly sourceId: 'CH_MWSTV_ART3';
      readonly rationale: string;
    }
  | {
      readonly status: 'customer_import';
      readonly country: 'CH';
      readonly rationale: string;
    }
  | {
      readonly status: 'indeterminate';
      readonly missingFacts: readonly string[];
      readonly rationale: string;
    };

export function evaluateSwissImport(input: SwissImportInput): SwissImportResult {
  if (input.importerOfRecord === 'unknown') {
    return {
      status: 'indeterminate',
      missingFacts: ['importerOfRecord'],
      rationale: 'Swiss chain/import treatment depends materially on who imports the goods in their own name.',
    };
  }

  if (input.importerOfRecord === 'customer') {
    return {
      status: 'customer_import',
      country: 'CH',
      rationale:
        'The customer is recorded as importer of record. The supplier-side transaction remains before the Swiss import; Swiss import VAT is borne/accounted for by the customer subject to customs rules.',
    };
  }

  if (input.supplierUsesSubordinationDeclaration === 'unknown') {
    return {
      status: 'indeterminate',
      missingFacts: ['supplierUsesSubordinationDeclaration'],
      rationale:
        'A supplier importing in its own name may use the Swiss subordination-declaration mechanism, which changes the supply place to Switzerland. The declaration status is unknown.',
    };
  }

  if (input.supplierUsesSubordinationDeclaration === 'no') {
    return {
      status: 'customer_import',
      country: 'CH',
      rationale:
        'The supplier does not use a Swiss subordination declaration. The engine therefore does not classify the supplier’s sale as a Swiss domestic supply solely because the supplier arranged carriage.',
    };
  }

  const rate = getStandardVatRate('CH');
  return {
    status: 'supplier_domestic_supply',
    country: 'CH',
    standardRate: rate?.rate ?? 8.1,
    sourceId: 'CH_MWSTV_ART3',
    rationale:
      'The supplier imports the goods in its own name using a Swiss subordination declaration. Under Swiss VAT Ordinance Article 3, the relevant supply is treated as made in Switzerland; the current standard rate is 8.1% for ordinary goods unless a reduced/special rate applies.',
  };
}
