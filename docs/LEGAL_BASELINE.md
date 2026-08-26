# Legal baseline

Baseline reviewed: **2026-08-26**.

## Primary EU source

Council Directive 2006/112/EC, consolidated 14 April 2025:
- https://eur-lex.europa.eu/eli/dir/2006/112/2025-04-14

Implemented EU topics:
- Article 17(1) — deemed transfer of own business goods to another Member State.
- Article 17(2)(f) — work/appraisal exception where the same goods return to the Member State of origin.
- Article 17(3) — transfer timing when a previously satisfied Article 17(2) condition ceases.
- Articles 31 and 32 — place of supply of goods.
- Article 36a — chain-transaction transport attribution.
- Articles 40, 41 and 42 — intra-Community acquisition, safety-net and triangular relief.
- Article 44 — B2B service place.
- Article 138(1)/(1a) — intra-Community exemption including VAT-ID and recapitulative-statement conditions.
- Article 141 — triangular simplification.
- Article 143(1)(d) — import exemption for qualifying onward intra-Community movement (Procedure 42 context).
- Article 146(1)(a)/(b) — direct and indirect export exemption branches.
- Article 196 — recipient liability for qualifying Article 44 B2B services.
- Article 197 — recipient liability in qualifying triangular transactions.
- Article 201 — import VAT liability designated by the importing Member State.

## Case law

- T-646/24 — four-party physical-delivery context and fraud/abuse limitation.
- C-247/21 Luxury Trust — mandatory triangular invoice reverse-charge wording.
- VwGH Ro 2020/15/0003 is reflected in the architecture principle that VAT registration and establishment are separate facts. A destination VAT registration is therefore not coded as a statutory Article 141 establishment test.

## National ordinary-goods reverse charge

Verified branches are active for:
- Italy
- Belgium
- Netherlands
- Poland
- Czechia
- Slovenia
- Estonia
- Latvia only to the extent documented in the general/special-regime distinction; V5 does not activate a generic Latvian foreign-supplier reverse charge without a verified basis.

National special-goods regimes, installation supplies and service-specific rules are separate scopes. The ordinary-goods engine returns a review state instead of generalising a country rule beyond its verified source.

## Non-EU baseline

- Switzerland: Federal Tax Administration / VAT Ordinance material for importer-of-record and subordination-declaration treatment; standard rate 8.1%.
- United Kingdom: HMRC export guidance is retained as a source reference for future UK-origin export modules. EU-to-GB goods are handled by the EU Article 146 export module.

## Governance

A source review date is metadata, not a claim that the underlying law can never change. National rules should be re-reviewed on legislative changes and at least during each substantive release touching the country module.
