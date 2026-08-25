import type { ChainTransaction, Party } from '../domain/transaction.js';
import { getCompany } from './companies.js';

export function hydrateCompanyParty(
  party: Party,
  companyId: string | undefined,
): Party {
  const company = getCompany(companyId);
  if (!company) return party;

  return {
    ...party,
    establishmentCountry: company.homeCountry,
    fixedEstablishments: company.fixedEstablishments,
    vatRegistrations: company.vatRegistrations,
  };
}

/**
 * Applies company master data only to the explicitly selected acting party.
 * No party is inferred from a company ID alone.
 */
export function hydrateTransactionCompany(
  transaction: ChainTransaction,
  companyId: string | undefined,
  actingPartyId: string | undefined,
): ChainTransaction {
  if (!companyId || !actingPartyId) return transaction;

  return {
    ...transaction,
    parties: transaction.parties.map((party) =>
      party.id === actingPartyId
        ? hydrateCompanyParty(party, companyId)
        : party,
    ),
  };
}
