# EU VAT Engine

Deterministic VAT decision engine for EU chain transactions.

## Project status

This repository is being built as a clean-room V5 successor to the existing chain-transaction calculator. The core design rule is strict separation between:

1. **Legal decision logic** — deterministic VAT analysis.
2. **Knowledge / legal sources** — EU and national rules with provenance.
3. **Company policy** — internal conservative choices, never presented as statutory law.
4. **SAP mapping** — applied only after the VAT treatment is known.
5. **UI / explanations** — presentation only; no tax decisions.

Development starts with the VAT core and automated tests. UI and SAP are intentionally deferred.

## Safety principle

The engine must never infer that a VAT ID was communicated merely because the company owns that VAT registration. Where a legally material fact is unknown, the engine returns an indeterminate result rather than silently guessing.

## Phase 1

The first implementation covers:

- a typed transaction model for chain transactions;
- transport-organizer modelling;
- Art. 36a moving-supply allocation;
- explicit handling of the VAT ID actually communicated to the supplier;
- indeterminate results where a required fact is missing;
- automated unit tests and CI.

Later phases will add place-of-supply, Art. 138, acquisitions, triangular transactions, national reverse-charge rules, company policies, SAP mappings and the UI.
