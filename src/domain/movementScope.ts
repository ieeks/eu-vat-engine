import { isEuMemberState } from '../knowledge/eu/memberStates.js';

export type MovementScope =
  | {
      readonly kind: 'domestic';
      readonly country: string;
    }
  | {
      readonly kind: 'intra_eu';
      readonly departureCountry: string;
      readonly destinationCountry: string;
    }
  | {
      readonly kind: 'export';
      readonly departureCountry: string;
      readonly destinationCountry: string;
    }
  | {
      readonly kind: 'import';
      readonly departureCountry: string;
      readonly destinationCountry: string;
    }
  | {
      readonly kind: 'third_country_cross_border';
      readonly departureCountry: string;
      readonly destinationCountry: string;
    };

/**
 * Classifies the physical goods movement before any VAT rule is selected.
 * Party residence is deliberately irrelevant: a Swiss customer in an AT→SK
 * goods flow is still an intra-EU physical movement, not an export.
 */
export function classifyMovementScope(
  departureCountry: string,
  destinationCountry: string,
): MovementScope {
  const departure = departureCountry.toUpperCase();
  const destination = destinationCountry.toUpperCase();

  if (departure === destination) {
    return { kind: 'domestic', country: departure };
  }

  const departureEu = isEuMemberState(departure);
  const destinationEu = isEuMemberState(destination);

  if (departureEu && destinationEu) {
    return {
      kind: 'intra_eu',
      departureCountry: departure,
      destinationCountry: destination,
    };
  }

  if (departureEu && !destinationEu) {
    return {
      kind: 'export',
      departureCountry: departure,
      destinationCountry: destination,
    };
  }

  if (!departureEu && destinationEu) {
    return {
      kind: 'import',
      departureCountry: departure,
      destinationCountry: destination,
    };
  }

  return {
    kind: 'third_country_cross_border',
    departureCountry: departure,
    destinationCountry: destination,
  };
}
