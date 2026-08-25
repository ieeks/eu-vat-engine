# EU VAT Engine

Deterministic VAT decision support for EU chain transactions.

## What this repository is

This is a clean-room successor to the existing chain-transaction calculator. It separates:

1. **Legal decision logic**
2. **Legal knowledge and provenance**
3. **Company policy**
4. **SAP mapping**
5. **UI and explanations**

The engine prefers an explicit unresolved result to a hidden assumption.

## Implemented

- chain transaction model
- Art. 36a moving-supply allocation
- Art. 31/32 place-of-supply allocation
- Art. 138 exemption qualification with verified/conditional/not-met states
- Art. 40/41 acquisition logic and Art. 42 triangular relief
- Art. 141/197 triangular simplification
- anti-abuse and invoice/reporting gates
- data-driven national reverse-charge API with verified IT/BE coverage
- registration-risk API
- EPDE / EPROHA configuration and separate legacy policy overlay
- SAP mapping adapter that never invents unknown codes
- browser UI
- automated tests and CI

## Start locally

```bash
npm install
npm run dev
```

## Quality gates

```bash
npm run check
npm run build
```

See `docs/ARCHITECTURE.md` and `docs/LEGAL_BASELINE.md`.
