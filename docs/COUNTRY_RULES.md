# Country rule matrix

Reviewed: **2026-08-26**.

This file describes only the **general ordinary-goods B2B branch** implemented by `evaluateNationalReverseCharge`. Special domestic reverse-charge categories, services and installation supplies require dedicated rules and are not inferred.

| Country | General foreign-supplier branch implemented | Supplier local VAT registration | Key recipient fact | Source ID |
|---|---|---|---|---|
| IT | Yes | Does not by itself block RC | Customer established in Italy | `IT_DPR633_ART17_2` |
| BE | Yes | Does not by itself block RC | Qualifying periodic VAT return filer | `BE_VAT_CODE_ART51_2_5` |
| NL | Yes | Does not by itself equal establishment | Customer established/fixed-established in NL | `NL_FOREIGN_SUPPLIER_SHIFT` |
| PL | Yes | Blocks this Article 17(1)(5) branch | Qualifying Polish-established taxable buyer | `PL_VAT_ACT_ART17_1_5` |
| CZ | Yes | Blocks Section 108(3)(b) branch | Customer is a registered Czech payer | `CZ_VAT_ACT_108_3_B` |
| SI | Yes | Identified foreign supplier becomes liable | Customer identified under general VAT scheme | `SI_ZDDV1_ART76_3` |
| EE | Yes | Blocks the general foreign-supplier RC branch | Estonian VAT-registered purchaser | `EE_VAT_ACT_GENERAL_RC` |
| LV | No generic branch activated | Registered supplier uses normal VAT for ordinary goods | Special RC categories are separate | `LV_GENERAL_VAT` |

For every other country the engine currently returns `country_rule_not_verified` for this national ordinary-goods question. This is intentional. A registration-risk result may therefore be `review_required` rather than a fabricated definitive answer.

The source URLs and review metadata live in `src/knowledge/countries/reverseChargeSources.ts`.
