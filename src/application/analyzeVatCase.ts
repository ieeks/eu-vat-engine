import { getCompany } from '../companies/companies.js';
import { determineAcquisition, type AcquisitionResult } from '../domain/acquisition.js';
import { evaluateArt138, type Art138Result } from '../domain/art138.js';
import { evaluateTriangle, type TriangleResult } from '../domain/triangle.js';
import type { VatCaseInput } from '../domain/vatCase.js';
import {
  evaluateTriangleCompanyPolicy,
  type TrianglePolicyResult,
} from '../policy/trianglePolicy.js';
import { analyzeChain, type ChainAnalysis } from './analyzeChain.js';

export type VatCaseAnalysis =
  | {
      readonly status: 'blocked';
      readonly chain: Extract<ChainAnalysis, { status: 'blocked' }>;
    }
  | {
      readonly status: 'complete';
      readonly chain: Extract<ChainAnalysis, { status: 'complete' }>;
      readonly movingSupplyExemption: Art138Result;
      readonly triangle: TriangleResult;
      readonly acquisition: AcquisitionResult;
      readonly trianglePolicy: TrianglePolicyResult;
    };

export function analyzeVatCase(input: VatCaseInput): VatCaseAnalysis {
  const chain = analyzeChain(input.transaction);

  if (chain.status === 'blocked') {
    return {
      status: 'blocked',
      chain,
    };
  }

  const movingFacts = input.supplyFacts?.[chain.movingSupply.movingSupplyId];
  const movingSupplyExemption = evaluateArt138(
    input.transaction.departureCountry,
    input.transaction.destinationCountry,
    movingFacts,
  );

  const triangle = evaluateTriangle(
    input.transaction,
    chain.movingSupply,
    input.supplyFacts,
    input.acquisitionFacts,
  );

  const acquisition = determineAcquisition(
    input.transaction,
    chain.movingSupply,
    input.acquisitionFacts,
    triangle,
  );

  const company = getCompany(input.companyId);
  const trianglePolicy = evaluateTriangleCompanyPolicy(
    company,
    input.transaction.destinationCountry,
    triangle,
    input.policyMode ?? 'legal_only',
  );

  return {
    status: 'complete',
    chain,
    movingSupplyExemption,
    triangle,
    acquisition,
    trianglePolicy,
  };
}
