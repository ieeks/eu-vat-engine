export interface CaseFile<TInput, TAnalysis> {
  readonly schemaVersion: '1.0';
  readonly engine: 'eu-vat-engine';
  readonly engineBaseline: '2026-08-26';
  readonly createdAt: string;
  readonly caseId?: string;
  readonly title?: string;
  readonly input: TInput;
  readonly analysis: TAnalysis;
}

export interface CaseFileOptions {
  readonly createdAt?: string;
  readonly caseId?: string;
  readonly title?: string;
}

/**
 * Produces a portable evidence snapshot. The caller controls createdAt so tests
 * and external systems can create deterministic files.
 */
export function buildCaseFile<TInput, TAnalysis>(
  input: TInput,
  analysis: TAnalysis,
  options: CaseFileOptions = {},
): CaseFile<TInput, TAnalysis> {
  return {
    schemaVersion: '1.0',
    engine: 'eu-vat-engine',
    engineBaseline: '2026-08-26',
    createdAt: options.createdAt ?? new Date().toISOString(),
    ...(options.caseId ? { caseId: options.caseId } : {}),
    ...(options.title ? { title: options.title } : {}),
    input,
    analysis,
  };
}

export function serializeCaseFile<TInput, TAnalysis>(
  file: CaseFile<TInput, TAnalysis>,
): string {
  return `${JSON.stringify(file, null, 2)}\n`;
}
