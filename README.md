# EU VAT Engine

Deterministic VAT decision support for EU VAT, chain transactions and selected cross-border customs/VAT scenarios.

## Design principle

The engine is a clean-room successor to the legacy chain-transaction calculator and keeps five layers separate:

1. **Legal decision logic** — deterministic functions, no DOM and no SAP assumptions.
2. **Legal knowledge & provenance** — EU/national sources with review dates.
3. **Company policy** — internal conservative rules are visibly separate from law.
4. **SAP mapping** — derived only after tax treatment is known.
5. **UI & case files** — presentation, local case storage and audit export.

Unknown legally material facts produce `indeterminate`, `conditional` or `review_required` results instead of hidden assumptions.

## Implemented analysis modules

### EU chain transactions
- arbitrary 3P/4P+ commercial chains
- Art. 36a moving-supply allocation
- explicit VAT ID actually communicated to the supplier
- Art. 31/32 place-of-supply allocation
- Art. 138 exemption qualification (`verified`, `conditional`, `not_met`, `indeterminate`)
- Art. 40/41 acquisitions and Art. 42 relief
- Art. 141/197 triangular simplification
- invoice/ZM and fraud/abuse gates
- T-646/24 four-party delivery logic support

### Domestic chains
- dedicated domestic routing instead of abusing Art. 36a
- current standard-rate reference data
- national reverse-charge evaluation
- seller registration-risk output

### National ordinary-goods reverse charge
Verified rule branches currently include:
- Italy
- Belgium
- Netherlands
- Poland
- Czechia
- Slovenia
- Estonia
- Latvia (general/special-regime distinction; no invented generic foreign-supplier RC)

Country-specific special-goods/service regimes are deliberately separate and are never inferred from the ordinary-goods engine.

### Own goods / processing
- Art. 17(1) own-goods transfer
- Art. 17(2)(f) work/appraisal return exception
- Art. 17(3) timing when a previously valid exception ceases
- processing service separately under Art. 44/196

### Third-country modules
- direct EU exports under Art. 146(1)(a)/(b) with evidence status
- EU imports and Procedure 42 / Art. 143(1)(d)
- normal import fallback under Art. 201
- Swiss importer-of-record / subordination-declaration analysis
- current Swiss standard VAT rate reference

### Company & SAP layer
- EPDE and EPROHA registrations / fixed establishments
- legal result and legacy company policy separated
- verified legacy SAP tax-code matrix for AT, DE, CH, SI, PL, CZ, NL, BE, LV, EE and IT where mappings are documented
- unknown SAP combinations return `unknown`; codes are never invented

### Workstation UI
The Vite web UI exposes six analysis modes:
1. Lieferkette
2. Eigenwaren / Verbringen
3. Lohnveredelungsleistung
4. Ausfuhr
5. Einfuhr / Verfahren 42
6. Schweiz

It also provides:
- structured engine output
- SAP suggestions
- local browser case storage (up to 50 recent cases)
- JSON case-file export with engine baseline
- print/PDF-friendly output

## Start locally

```bash
npm install
npm run dev
```

## Quality gates

```bash
npm audit --audit-level=high
npm run check
npm run build
```

CI runs security audit, strict TypeScript typecheck, the full Vitest suite and a production Vite build.

## Safety rules

- Available VAT registrations never imply which VAT ID was communicated for a transaction.
- VAT registration is not treated as fixed establishment.
- Cross-border movement alone is not presented as a verified Art. 138 exemption.
- Company policy never mutates the statutory legal result silently.
- National rules and SAP tax codes are never invented when the knowledge baseline is incomplete.
- Third-country multi-party customs chains require explicit customs/importer/exporter facts rather than applying Art. 36a outside its scope.

See `docs/ARCHITECTURE.md` and `docs/LEGAL_BASELINE.md` for the model and legal baseline.
