import './styles.css';
import { analyzeChain } from '../application/analyzeChain.js';
import { analyzeVatCase } from '../application/analyzeVatCase.js';
import type { ChainTransaction, Party } from '../domain/transaction.js';
import type { SupplyComplianceFacts, VatCaseInput } from '../domain/vatCase.js';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App root not found.');

app.innerHTML = `
  <div class="shell">
    <header class="hero">
      <div class="eyebrow">Deterministic VAT decision support</div>
      <h1>EU VAT Engine</h1>
      <p class="lead">Build the facts first. Legal conclusions, unresolved conditions and company policy stay separate.</p>
    </header>
    <div class="grid">
      <section class="card">
        <h2>Transaction facts</h2>
        <form id="case-form">
          <div class="fields">
            <div class="field"><label for="a">Party A country</label><input id="a" value="DE" maxlength="2"></div>
            <div class="field"><label for="b">Party B country</label><input id="b" value="AT" maxlength="2"></div>
            <div class="field"><label for="c">Party C country</label><input id="c" value="IT" maxlength="2"></div>
            <div class="field"><label for="d">Party D country (optional)</label><input id="d" maxlength="2" placeholder="HU"></div>
            <div class="field"><label for="departure">Goods depart from</label><input id="departure" value="DE" maxlength="2"></div>
            <div class="field"><label for="destination">Goods arrive in</label><input id="destination" value="IT" maxlength="2"></div>
            <div class="field"><label for="organizer">Transport organizer</label>
              <select id="organizer"><option>A</option><option selected>B</option><option>C</option><option>D</option><option value="">Unknown</option></select>
            </div>
            <div class="field"><label for="comm-status">VAT ID communicated to supplier</label>
              <select id="comm-status"><option value="unknown">Unknown</option><option value="none">None</option><option value="known" selected>Known</option></select>
            </div>
            <div class="field"><label for="comm-country">Communicated VAT-ID country</label><input id="comm-country" value="AT" maxlength="2"></div>
            <div class="field"><label for="buyer-vat">Moving-supply customer VAT-ID country</label><input id="buyer-vat" value="IT" maxlength="2"></div>
            <div class="field"><label for="buyer-valid">Customer VAT ID validation</label>
              <select id="buyer-valid"><option value="valid">Valid</option><option value="unknown" selected>Unknown</option><option value="invalid">Invalid</option></select>
            </div>
            <div class="field"><label for="recap">Recapitulative statement</label>
              <select id="recap"><option value="not_due_yet" selected>Not due yet</option><option value="correct">Correct</option><option value="unknown">Unknown</option><option value="missing">Missing</option><option value="incorrect">Incorrect</option><option value="justified">Justified</option></select>
            </div>
            <div class="field"><label for="acq-vat">Acquisition VAT-ID country</label><input id="acq-vat" value="AT" maxlength="2"></div>
            <div class="field"><label for="triangle-customer">Triangle recipient VAT-ID country</label><input id="triangle-customer" value="IT" maxlength="2"></div>
            <div class="field"><label for="art197">Recipient liable under Art. 197</label>
              <select id="art197"><option value="unknown" selected>Unknown</option><option value="yes">Yes</option><option value="no">No</option></select>
            </div>
            <div class="field"><label for="company">Company policy overlay</label>
              <select id="company"><option value="">None / legal only</option><option>EPDE</option><option>EPROHA</option></select>
            </div>
          </div>
          <div class="actions"><button class="primary" type="submit">Analyze case</button></div>
        </form>
      </section>
      <section class="card">
        <h2>Analysis</h2>
        <div id="result" class="result-stack"><p class="muted">Enter the facts and run the deterministic analysis.</p></div>
      </section>
    </div>
  </div>`;

const form = document.querySelector<HTMLFormElement>('#case-form');
const result = document.querySelector<HTMLDivElement>('#result');
if (!form || !result) throw new Error('UI controls not found.');
const resultEl = result;

function value(id: string): string {
  const element = document.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`);
  return element?.value.trim() ?? '';
}

function country(id: string): string {
  return value(id).toUpperCase();
}

function buildParties(): Party[] {
  const raw = [
    ['A', country('a')],
    ['B', country('b')],
    ['C', country('c')],
    ['D', country('d')],
  ] as const;
  return raw.filter(([, c]) => c.length > 0).map(([id, c]) => ({ id, establishmentCountry: c }));
}

function badge(status: string): string {
  return `<span class="badge ${status}">${status.replaceAll('_', ' ')}</span>`;
}

function escapeHtml(input: string): string {
  return input.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function render(data: ReturnType<typeof analyzeVatCase>): void {
  if (data.status === 'blocked') {
    resultEl.innerHTML = `
      <div class="result"><h3>Analysis blocked ${badge('blocked')}</h3><p class="muted">${data.chain.movingSupply.status}</p></div>
      <details><summary>Raw result</summary><pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre></details>`;
    return;
  }

  const supplies = data.chain.supplies
    .map((s) => `<div class="party">${s.supplyId} · ${s.position} · ${s.placeCountry}</div>`)
    .join('<span class="arrow">→</span>');

  resultEl.innerHTML = `
    <div class="result">
      <h3>Moving supply ${badge(data.chain.movingSupply.status)}</h3>
      <strong>${data.chain.movingSupply.movingSupplyId}</strong>
      <p class="muted">${data.chain.movingSupply.rationale}</p>
      <div class="chain">${supplies}</div>
    </div>
    <div class="result"><h3>Art. 138 ${badge(data.movingSupplyExemption.status)}</h3><p class="muted">${data.movingSupplyExemption.rationale}</p></div>
    <div class="result"><h3>Triangle ${badge(data.triangle.status)}</h3><p class="muted">${data.triangle.rationale}</p></div>
    <div class="result"><h3>Acquisition</h3><p class="muted">Art. 40 destination: <strong>${data.acquisition.destinationAcquisitionCountry}</strong> · Art. 41: <strong>${data.acquisition.article41.status}</strong></p></div>
    <div class="result"><h3>Company policy ${badge(data.trianglePolicy.status)}</h3><p class="muted">${data.trianglePolicy.rationale}</p></div>
    <details><summary>Structured engine result</summary><pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre></details>`;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const parties = buildParties();
  const organizer = value('organizer');
  const communicationStatus = value('comm-status');

  const transaction: ChainTransaction = {
    parties,
    departureCountry: country('departure'),
    destinationCountry: country('destination'),
    transport: {
      organizerPartyId: organizer || null,
      communicatedVatIdToSupplier:
        communicationStatus === 'known'
          ? { status: 'known', country: country('comm-country') }
          : communicationStatus === 'none'
            ? { status: 'none' }
            : { status: 'unknown' },
    },
  };

  const chain = analyzeChain(transaction);
  const factsBySupply: Record<string, SupplyComplianceFacts> = {};

  if (chain.status === 'complete') {
    const movingId = chain.movingSupply.movingSupplyId;
    factsBySupply[movingId] = {
      buyerStatus: 'taxable_person',
      customerVatId: {
        status: 'known',
        country: country('buyer-vat'),
        validation: value('buyer-valid') as 'valid' | 'invalid' | 'unknown',
        indicatedToSupplier: 'yes',
      },
      recapitulativeStatement: value('recap') as NonNullable<SupplyComplianceFacts['recapitulativeStatement']>,
    };

    const subsequentIndex = chain.movingSupply.movingSupplyIndex + 1;
    if (subsequentIndex < parties.length - 1) {
      const subsequentId = `L${subsequentIndex + 1}`;
      factsBySupply[subsequentId] = {
        buyerStatus: 'taxable_person',
        customerVatId: {
          status: 'known',
          country: country('triangle-customer'),
          validation: 'unknown',
          indicatedToSupplier: 'yes',
        },
        recipientLiableUnderArticle197: value('art197') as 'yes' | 'no' | 'unknown',
        triangleInvoiceReverseChargeText: 'unknown',
        recapitulativeStatement: value('recap') as NonNullable<SupplyComplianceFacts['recapitulativeStatement']>,
        abuseCheck: 'unknown',
      };
    }
  }

  const companyId = value('company');
  const input: VatCaseInput = {
    transaction,
    supplyFacts: factsBySupply,
    acquisitionFacts: {
      vatIdUsed: country('acq-vat')
        ? { status: 'known', country: country('acq-vat') }
        : { status: 'unknown' },
    },
    ...(companyId ? { companyId, policyMode: 'company_policy' as const } : {}),
  };

  render(analyzeVatCase(input));
});
