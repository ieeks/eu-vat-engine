# Architecture

The application is intentionally split into layers.

1. **Domain** — deterministic legal decision functions. No DOM, SAP or company policy.
2. **Knowledge** — legal sources and verified national coverage with review dates.
3. **Company policy** — optional overlay kept separate from statutory legal conclusions.
4. **SAP adapter** — maps a concluded tax treatment to known company tax codes.
5. **Application** — composes domain decisions in dependency order.
6. **UI** — collects facts and explains structured engine results.

## Non-negotiable design rules

- Available VAT registrations never imply which VAT ID was communicated.
- Registration is not the same as establishment or fixed establishment.
- An intra-Community movement is not automatically a verified Art. 138 exemption.
- Unknown national reverse-charge law returns `country_rule_not_verified`.
- Unknown SAP mappings return `unknown`; no tax code is invented.
- Company policy can restrict a legal result, but policy and legal result are both retained.
