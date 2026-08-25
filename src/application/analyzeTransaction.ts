import { hydrateTransactionCompany } from '../companies/hydrateTransaction.js';
import { analyzeDomesticChain, type DomesticChainResult } from '../domain/domesticChain.js';
import { classifyMovementScope, type MovementScope } from '../domain/movementScope.js';
import { evaluateOwnGoodsTransfer, type OwnGoodsTransferInput, type OwnGoodsTransferResult } from '../domain/ownGoodsTransfer.js';
import { evaluateProcessingService, type ProcessingServiceInput, type ProcessingServiceResult } from '../domain/processingService.js';
import { evaluateDirectExport, evaluateEuImport, evaluateSwissImport, type DirectExportInput, type DirectExportResult, type EuImportInput, type EuImportResult, type SwissImportInput, type SwissImportResult } from '../domain/thirdCountry.js';
import type { VatCaseInput } from '../domain/vatCase.js';
import { analyzeVatCase, type VatCaseAnalysis } from './analyzeVatCase.js';

export type TransactionAnalysisRequest =
  | { readonly kind: 'chain'; readonly input: VatCaseInput }
  | { readonly kind: 'own_goods'; readonly input: OwnGoodsTransferInput }
  | { readonly kind: 'processing_service'; readonly input: ProcessingServiceInput }
  | { readonly kind: 'direct_export'; readonly input: DirectExportInput }
  | { readonly kind: 'eu_import'; readonly input: EuImportInput }
  | { readonly kind: 'swiss_import'; readonly input: SwissImportInput };

export type ChainRouterResult =
  | {
      readonly status: 'analyzed';
      readonly scope: Extract<MovementScope, { kind: 'intra_eu' }>;
      readonly analysis: VatCaseAnalysis;
    }
  | {
      readonly status: 'analyzed';
      readonly scope: Extract<MovementScope, { kind: 'domestic' }>;
      readonly analysis: DomesticChainResult;
    }
  | {
      readonly status: 'review_required';
      readonly scope: Exclude<MovementScope, { kind: 'intra_eu' | 'domestic' }>;
      readonly rationale: string;
    };

export type TransactionAnalysisResult =
  | { readonly kind: 'chain'; readonly result: ChainRouterResult }
  | { readonly kind: 'own_goods'; readonly result: OwnGoodsTransferResult }
  | { readonly kind: 'processing_service'; readonly result: ProcessingServiceResult }
  | { readonly kind: 'direct_export'; readonly result: DirectExportResult }
  | { readonly kind: 'eu_import'; readonly result: EuImportResult }
  | { readonly kind: 'swiss_import'; readonly result: SwissImportResult };

function analyzeChainRequest(input: VatCaseInput): ChainRouterResult {
  const hydratedTransaction = hydrateTransactionCompany(
    input.transaction,
    input.companyId,
    input.actingPartyId,
  );
  const hydratedInput: VatCaseInput = {
    ...input,
    transaction: hydratedTransaction,
  };
  const scope = classifyMovementScope(
    hydratedTransaction.departureCountry,
    hydratedTransaction.destinationCountry,
  );

  if (scope.kind === 'intra_eu') {
    return {
      status: 'analyzed',
      scope,
      analysis: analyzeVatCase(hydratedInput),
    };
  }

  if (scope.kind === 'domestic') {
    return {
      status: 'analyzed',
      scope,
      analysis: analyzeDomesticChain(hydratedTransaction, input.supplyFacts),
    };
  }

  return {
    status: 'review_required',
    scope,
    rationale:
      'Article 36a is an intra-EU chain rule and is not used for a multi-party movement involving a third country. Use the dedicated direct-export/import analyzers for two-party movements; multi-party customs chains require importer/exporter-of-record and customs facts before a supply can be classified.',
  };
}

export function analyzeTransaction(
  request: TransactionAnalysisRequest,
): TransactionAnalysisResult {
  switch (request.kind) {
    case 'chain':
      return { kind: 'chain', result: analyzeChainRequest(request.input) };
    case 'own_goods':
      return { kind: 'own_goods', result: evaluateOwnGoodsTransfer(request.input) };
    case 'processing_service':
      return { kind: 'processing_service', result: evaluateProcessingService(request.input) };
    case 'direct_export':
      return { kind: 'direct_export', result: evaluateDirectExport(request.input) };
    case 'eu_import':
      return { kind: 'eu_import', result: evaluateEuImport(request.input) };
    case 'swiss_import':
      return { kind: 'swiss_import', result: evaluateSwissImport(request.input) };
  }
}
