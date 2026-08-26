import { isEuMemberState } from '../knowledge/eu/memberStates.js';
import type { YesNoUnknown } from './vatCase.js';

export type OwnGoodsPurpose =
  | 'processing_or_appraisal'
  | 'temporary_service_use'
  | 'other';

export interface OwnGoodsTransferInput {
  readonly departureCountry: string;
  readonly destinationCountry: string;
  readonly purpose: OwnGoodsPurpose;
  /** Was the Article 17(2) exception genuinely relied on when the goods left? */
  readonly exceptionAppliedAtDispatch?: YesNoUnknown;
  /** Required for processing/appraisal: was the work actually performed in the destination Member State? */
  readonly workPerformedInDestination?: YesNoUnknown;
  /** Will/were the same goods returned to the owner in the exact Member State of origin? */
  readonly returnedToOrigin?: YesNoUnknown;
  /** Date/time when a previously satisfied Article 17(2) condition ceased, if known. */
  readonly exceptionCeasedAt?: string;
}

export type OwnGoodsTransferResult =
  | {
      readonly status: 'not_applicable';
      readonly rationale: string;
    }
  | {
      readonly status: 'exception_applies';
      readonly legalRuleId: 'VAT_DIRECTIVE_ART_17_2_F';
      readonly rationale: string;
    }
  | {
      readonly status: 'deemed_transfer';
      readonly legalRuleId: 'VAT_DIRECTIVE_ART_17_1';
      readonly timingRuleId: 'VAT_DIRECTIVE_ART_17_1' | 'VAT_DIRECTIVE_ART_17_3';
      readonly deemedSupplyCountry: string;
      readonly deemedAcquisitionCountry: string;
      readonly timing: 'dispatch' | 'condition_ceased' | 'unknown';
      readonly effectiveAt?: string;
      readonly missingFacts: readonly string[];
      readonly rationale: string;
    }
  | {
      readonly status: 'indeterminate';
      readonly missingFacts: readonly string[];
      readonly rationale: string;
    }
  | {
      readonly status: 'review_required';
      readonly rationale: string;
    };

function deemedAtDispatch(
  departure: string,
  destination: string,
  rationale: string,
): OwnGoodsTransferResult {
  return {
    status: 'deemed_transfer',
    legalRuleId: 'VAT_DIRECTIVE_ART_17_1',
    timingRuleId: 'VAT_DIRECTIVE_ART_17_1',
    deemedSupplyCountry: departure,
    deemedAcquisitionCountry: destination,
    timing: 'dispatch',
    missingFacts: [],
    rationale,
  };
}

/**
 * Evaluates the own-goods movement independently from any processing service.
 * The Article 17(2)(f) exception is intentionally narrow: work/appraisal in the
 * destination Member State AND return of the same goods to the Member State of
 * origin are both required.
 */
export function evaluateOwnGoodsTransfer(
  input: OwnGoodsTransferInput,
): OwnGoodsTransferResult {
  const departure = input.departureCountry.toUpperCase();
  const destination = input.destinationCountry.toUpperCase();

  if (departure === destination) {
    return {
      status: 'not_applicable',
      rationale: 'Article 17 requires a transfer of own business goods to another Member State.',
    };
  }

  if (!isEuMemberState(departure) || !isEuMemberState(destination)) {
    return {
      status: 'not_applicable',
      rationale:
        'Article 17 intra-Community own-goods treatment is not used for a movement involving a third country; customs/import/export rules must be analyzed instead.',
    };
  }

  if (input.purpose === 'temporary_service_use') {
    return {
      status: 'review_required',
      rationale:
        'Temporary-use exceptions under Article 17(2)(g)/(h) have additional purpose and duration conditions. V5 does not infer those conditions from a generic temporary-use label.',
    };
  }

  if (input.purpose === 'other') {
    return deemedAtDispatch(
      departure,
      destination,
      'Moving own business goods from one Member State to another is deemed a supply under Article 17(1) when no verified Article 17(2) exception applies.',
    );
  }

  const missing: string[] = [];
  if (!input.workPerformedInDestination || input.workPerformedInDestination === 'unknown') {
    missing.push('workPerformedInDestination');
  }
  if (!input.returnedToOrigin || input.returnedToOrigin === 'unknown') {
    missing.push('returnedToOrigin');
  }
  if (missing.length > 0) {
    return {
      status: 'indeterminate',
      missingFacts: missing,
      rationale:
        'The Article 17(2)(f) processing/appraisal exception cannot be selected until both actual work in the destination Member State and return to the Member State of origin are known.',
    };
  }

  if (input.workPerformedInDestination === 'no') {
    return deemedAtDispatch(
      departure,
      destination,
      'The Article 17(2)(f) work/appraisal condition is not met, so the own-goods movement is a deemed transfer under Article 17(1).',
    );
  }

  if (input.returnedToOrigin === 'yes') {
    return {
      status: 'exception_applies',
      legalRuleId: 'VAT_DIRECTIVE_ART_17_2_F',
      rationale:
        'The goods were worked on/appraised in the destination Member State and returned to the owner in the Member State from which they were originally dispatched. Article 17(2)(f) therefore prevents a deemed own-goods transfer.',
    };
  }

  if (input.exceptionAppliedAtDispatch === 'yes') {
    const hasDate = Boolean(input.exceptionCeasedAt?.trim());
    return {
      status: 'deemed_transfer',
      legalRuleId: 'VAT_DIRECTIVE_ART_17_1',
      timingRuleId: 'VAT_DIRECTIVE_ART_17_3',
      deemedSupplyCountry: departure,
      deemedAcquisitionCountry: destination,
      timing: hasDate ? 'condition_ceased' : 'unknown',
      ...(hasDate ? { effectiveAt: input.exceptionCeasedAt } : {}),
      missingFacts: hasDate ? [] : ['exceptionCeasedAt'],
      rationale:
        'The goods are not returned to the Member State of origin after an Article 17(2) exception was initially relied on. Article 17(3) treats the transfer as occurring when that exception condition ceased, not retroactively at the original dispatch.',
    };
  }

  if (input.exceptionAppliedAtDispatch === 'unknown' || !input.exceptionAppliedAtDispatch) {
    return {
      status: 'deemed_transfer',
      legalRuleId: 'VAT_DIRECTIVE_ART_17_1',
      timingRuleId: 'VAT_DIRECTIVE_ART_17_1',
      deemedSupplyCountry: departure,
      deemedAcquisitionCountry: destination,
      timing: 'unknown',
      missingFacts: ['exceptionAppliedAtDispatch'],
      rationale:
        'Because the goods are not returned, an own-goods transfer exists. The recorded facts do not establish whether Article 17(3) defers the timing from the original dispatch to a later cessation of an initially valid exception.',
    };
  }

  return deemedAtDispatch(
    departure,
    destination,
    'No Article 17(2)(f) return exception applied at dispatch and the goods are not returned to the Member State of origin, so Article 17(1) applies from dispatch.',
  );
}
