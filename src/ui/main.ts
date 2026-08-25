import './styles.css';
import { analyzeChain } from '../application/analyzeChain.js';
import { analyzeTransaction, type TransactionAnalysisResult } from '../application/analyzeTransaction.js';
import { deriveSapForExport, deriveSapForOwnGoods, deriveSapForProcessingService, deriveSapForSwissImport, deriveSapForVatCase, type SapDerivationResult, type SpecialSapDerivationResult } from '../application/deriveSap.js';
import { buildCaseFile, serializeCaseFile } from '../domain/caseFile.js';
import type { ChainTransaction, Party } from '../domain/transaction.js';
import type { SupplyComplianceFacts, VatCaseInput, YesNoUnknown } from '../domain/vatCase.js';

function mustQuery<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Required UI element not found: ${selector}`);
  return element;
}

const app = mustQuery<HTMLDivElement>('#app');
type Mode = 'chain' | 'own_goods' | 'processing_service' | 'direct_export' | 'eu_import' | 'swiss_import';
type AnySap = SapDerivationResult | SpecialSapDerivationResult | null;
interface LastRun { readonly mode: Mode; readonly input: unknown; readonly analysis: TransactionAnalysisResult; readonly sap: AnySap; }
interface SavedCase { readonly id: string; readonly savedAt: string; readonly run: LastRun; }
const STORAGE_KEY = 'eu-vat-engine.saved-cases.v1';
let lastRun: LastRun | null = null;

app.innerHTML = `<div class="shell"><header class="hero"><div><div class="eyebrow">VAT Compliance Workstation</div><h1>EU VAT Engine</h1><p class="lead">Sachverhalt zuerst. Rechtslage, offene Voraussetzungen, Firmen-Policy und SAP bleiben technisch getrennt.</p></div><div class="hero-actions"><button id="print-btn" class="secondary" type="button">Drucken / PDF</button><button id="export-btn" class="secondary" type="button" disabled>Case JSON</button><button id="save-btn" class="secondary" type="button" disabled>Fall speichern</button></div></header><nav class="mode-tabs" aria-label="Analyseart"><button data-mode="chain" class="mode-tab active">Lieferkette</button><button data-mode="own_goods" class="mode-tab">Eigenwaren</button><button data-mode="processing_service" class="mode-tab">Lohnveredelung</button><button data-mode="direct_export" class="mode-tab">Ausfuhr</button><button data-mode="eu_import" class="mode-tab">Einfuhr / V42</button><button data-mode="swiss_import" class="mode-tab">Schweiz</button></nav><div class="grid"><section class="card input-card"><div class="section-head"><div><div class="eyebrow">Input</div><h2 id="mode-title">Lieferkette</h2></div></div><form id="case-form"></form></section><section class="card"><div class="section-head"><div><div class="eyebrow">Output</div><h2>Analyse</h2></div></div><div id="result" class="result-stack"><div class="empty">Fakten erfassen und Analyse starten.</div></div></section></div><section class="card saved-card"><div class="section-head"><div><div class="eyebrow">Audit Trail</div><h2>Gespeicherte Fälle</h2></div><button id="clear-saved" class="text-button" type="button">Alle löschen</button></div><div id="saved-cases" class="saved-list"></div></section></div>`;

const form = mustQuery<HTMLFormElement>('#case-form');
const resultEl = mustQuery<HTMLDivElement>('#result');
const modeTitle = mustQuery<HTMLElement>('#mode-title');
const exportBtn = mustQuery<HTMLButtonElement>('#export-btn');
const saveBtn = mustQuery<HTMLButtonElement>('#save-btn');
const savedEl = mustQuery<HTMLDivElement>('#saved-cases');

function esc(input: unknown): string { return String(input ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }
function value(id: string): string { return document.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)?.value.trim() ?? ''; }
function country(id: string): string { return value(id).toUpperCase(); }
function yn(id: string): YesNoUnknown { return value(id) as YesNoUnknown; }
function badge(status: string): string { return `<span class="badge ${esc(status)}">${esc(status.replaceAll('_',' '))}</span>`; }
function field(id: string, label: string, val = '', extra = ''): string { return `<div class="field"><label for="${id}">${label}</label><input id="${id}" value="${esc(val)}" ${extra}></div>`; }
function select(id: string, label: string, options: readonly [string,string][], selected?: string): string { return `<div class="field"><label for="${id}">${label}</label><select id="${id}">${options.map(([v,t]) => `<option value="${esc(v)}" ${v === selected ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`; }
const YNU: readonly [string,string][] = [['unknown','Unbekannt'],['yes','Ja'],['no','Nein']];
const COMPANY: readonly [string,string][] = [['','Keine / neutral'],['EPDE','EPDE'],['EPROHA','EPROHA']];
const TITLES: Record<Mode,string> = { chain:'Lieferkette', own_goods:'Eigenwaren / Verbringen', processing_service:'Lohnveredelungsleistung', direct_export:'Ausfuhr', eu_import:'Einfuhr / Verfahren 42', swiss_import:'Schweizer Import' };

function chainForm(): string { return `<div class="fields">${select('company','Firma',COMPANY)}${select('acting','Unsere Position',[['A','A'],['B','B'],['C','C'],['D','D']],'B')}${field('a','A · Land','DE','maxlength="2"')}${field('b','B · Land','AT','maxlength="2"')}${field('c','C · Land','IT','maxlength="2"')}${field('d','D · Land (optional)','','maxlength="2" placeholder="HU"')}${field('departure','Warenabgang','DE','maxlength="2"')}${field('destination','Warenankunft','IT','maxlength="2"')}${select('organizer','Wer organisiert Transport?',[['A','A'],['B','B'],['C','C'],['D','D'],['','Unbekannt']],'B')}${select('comm-status','UID dem Vorlieferanten mitgeteilt?',[['unknown','Unbekannt'],['none','Keine UID'],['known','Ja']],'known')}${field('comm-country','Mitgeteiltes UID-Land','AT','maxlength="2"')}${select('buyer-status','Käuferstatus bewegte Lieferung',[['taxable_person','Unternehmer'],['non_taxable_legal_person','Nichtunternehmerische jur. Person'],['consumer','Privat'],['unknown','Unbekannt']],'taxable_person')}${field('buyer-vat','UID-Land Käufer bewegte Lieferung','AT','maxlength="2"')}${select('buyer-valid','UID-Prüfung',[['valid','Gültig'],['unknown','Unbekannt'],['invalid','Ungültig']],'unknown')}${select('buyer-indicated','UID tatsächlich mitgeteilt',YNU,'yes')}${select('recap','ZM-Status',[['not_due_yet','Noch nicht fällig'],['correct','Korrekt'],['unknown','Unbekannt'],['missing','Fehlt'],['incorrect','Fehlerhaft'],['justified','Fehler gerechtfertigt']],'not_due_yet')}${field('acq-vat','UID-Land des Erwerbers','AT','maxlength="2"')}${field('triangle-customer','UID-Land Dreiecks-Empfänger','IT','maxlength="2"')}${select('art197','Empfänger schuldet nach Art. 197',YNU,'unknown')}${select('invoice-rc','RC-Pflichttext auf Rechnung',[['unknown','Unbekannt'],['present','Vorhanden'],['missing','Fehlt']],'unknown')}${select('abuse','Fraud-/Abuse-Check',[['unknown','Offen'],['clear','Unauffällig'],['concern','Bedenken']],'unknown')}${select('periodic','Empfänger periodischer VAT-Filer',YNU,'unknown')}${select('policy','Sicht',[['legal_only','Nur Rechtslage'],['company_policy','Rechtslage + Firmenpolicy']],'legal_only')}</div><div class="actions"><button class="primary" type="submit">Lieferkette analysieren</button></div>`; }
function ownGoodsForm(): string { return `<div class="fields">${select('company','Firma',COMPANY)}${field('og-dep','Abgang','AT','maxlength="2"')}${field('og-dest','Bestimmung','DE','maxlength="2"')}${select('og-purpose','Zweck',[['processing_or_appraisal','Bearbeitung / Begutachtung'],['other','Sonstiges Verbringen'],['temporary_service_use','Vorübergehende Nutzung']],'processing_or_appraisal')}${select('og-work','Arbeiten im Bestimmungsland ausgeführt',YNU,'yes')}${select('og-return','Ware zurück ins Ursprungsland',YNU,'yes')}${select('og-exception','Art.-17-Ausnahme bei Versand zugrunde gelegt',YNU,'unknown')}${field('og-ceased','Zeitpunkt Wegfall Ausnahme','','type="date"')}</div><div class="actions"><button class="primary" type="submit">Verbringen analysieren</button></div>`; }
function processingForm(): string { return `<div class="fields">${select('company','Firma für SAP',COMPANY)}${select('ps-role','Unsere Rolle',[['recipient','Leistungsempfänger'],['provider','Leistungserbringer']],'recipient')}${field('ps-provider','Leistungserbringer Land','DE','maxlength="2"')}${field('ps-recipient','Leistungsempfänger Land','AT','maxlength="2"')}${select('ps-taxable','Empfänger ist Unternehmer',YNU,'yes')}${field('ps-receiving','Empfangende Niederlassung (optional)','','maxlength="2" placeholder="AT"')}</div><div class="actions"><button class="primary" type="submit">Leistung analysieren</button></div>`; }
function exportForm(): string { return `<div class="fields">${select('company','Firma',COMPANY)}${field('ex-dep','Abgang EU','DE','maxlength="2"')}${field('ex-dest','Drittland','CH','maxlength="2"')}${select('ex-org','Export organisiert durch',[['supplier','Lieferant'],['supplier_agent','Spediteur für Lieferant'],['customer','Kunde'],['customer_agent','Spediteur für Kunde'],['unknown','Unbekannt']],'supplier')}${select('ex-cust-est','Kunde im Abgangsland niedergelassen',YNU,'no')}${select('ex-evidence','Ausfuhrnachweis',[['available','Vorhanden'],['unknown','Offen'],['missing','Fehlt']],'unknown')}</div><div class="actions"><button class="primary" type="submit">Ausfuhr analysieren</button></div>`; }
function importForm(): string { return `<div class="fields">${field('im-dep','Ursprungs-Drittland','CH','maxlength="2"')}${field('im-country','Einfuhrland EU','DE','maxlength="2"')}${field('im-final','Endbestimmung EU','AT','maxlength="2"')}${select('im-v42','Verfahren 42 angemeldet',YNU,'unknown')}${field('im-importer-vat','UID-Land Importeur','DE','maxlength="2"')}${field('im-cust-vat','UID-Land Endkunde','AT','maxlength="2"')}${select('im-valid','Endkunden-UID',[['valid','Gültig'],['unknown','Unbekannt'],['invalid','Ungültig']],'unknown')}${select('im-recap','ZM',[['correct','Korrekt'],['not_due_yet','Noch nicht fällig'],['unknown','Unbekannt'],['missing','Fehlt'],['incorrect','Fehlerhaft'],['justified','Gerechtfertigt']],'unknown')}</div><div class="actions"><button class="primary" type="submit">Einfuhr analysieren</button></div>`; }
function swissForm(): string { return `<div class="fields">${select('company','Firma',COMPANY,'EPROHA')}${field('ch-origin','Ursprungsland','DE','maxlength="2"')}${select('ch-importer','Importeur in CH',[['unknown','Unbekannt'],['supplier','Lieferant'],['customer','Kunde']],'unknown')}${select('ch-subordination','Unterstellungserklärung',YNU,'unknown')}</div><div class="actions"><button class="primary" type="submit">Schweiz analysieren</button></div>`; }
function renderForm(mode: Mode): void { modeTitle.textContent = TITLES[mode]; form.innerHTML = mode === 'chain' ? chainForm() : mode === 'own_goods' ? ownGoodsForm() : mode === 'processing_service' ? processingForm() : mode === 'direct_export' ? exportForm() : mode === 'eu_import' ? importForm() : swissForm(); form.dataset.mode = mode; }

function buildParties(): Party[] { const rows = [['A',country('a')],['B',country('b')],['C',country('c')],['D',country('d')]] as const; return rows.filter(([,c]) => c).map(([id,c]) => ({ id, establishmentCountry:c })); }
function chainInput(): VatCaseInput {
  const parties = buildParties(); const communication = value('comm-status');
  const transaction: ChainTransaction = { parties, departureCountry:country('departure'), destinationCountry:country('destination'), transport:{ organizerPartyId:value('organizer') || null, communicatedVatIdToSupplier:communication === 'known' ? { status:'known', country:country('comm-country') } : communication === 'none' ? { status:'none' } : { status:'unknown' } } };
  const supplyFacts: Record<string,SupplyComplianceFacts> = {}; const chain = analyzeChain(transaction);
  if (chain.status === 'complete') {
    supplyFacts[chain.movingSupply.movingSupplyId] = { buyerStatus:value('buyer-status') as NonNullable<SupplyComplianceFacts['buyerStatus']>, customerVatId:country('buyer-vat') ? { status:'known', country:country('buyer-vat'), validation:value('buyer-valid') as 'valid'|'invalid'|'unknown', indicatedToSupplier:yn('buyer-indicated') } : { status:'unknown' }, recapitulativeStatement:value('recap') as NonNullable<SupplyComplianceFacts['recapitulativeStatement']> };
    const next = chain.movingSupply.movingSupplyIndex + 1; if (next < parties.length - 1) { const id = `L${next + 1}`; supplyFacts[id] = { buyerStatus:'taxable_person', customerVatId:country('triangle-customer') ? { status:'known', country:country('triangle-customer'), validation:'unknown', indicatedToSupplier:'yes' } : { status:'unknown' }, recipientLiableUnderArticle197:yn('art197'), triangleInvoiceReverseChargeText:value('invoice-rc') as 'present'|'missing'|'unknown', recapitulativeStatement:value('recap') as NonNullable<SupplyComplianceFacts['recapitulativeStatement']>, abuseCheck:value('abuse') as 'clear'|'concern'|'unknown', buyerPeriodicReturnFiler:yn('periodic') }; }
  }
  const companyId = value('company'); return { transaction, supplyFacts, acquisitionFacts:{ vatIdUsed:country('acq-vat') ? { status:'known', country:country('acq-vat') } : { status:'unknown' } }, actingPartyId:value('acting'), ...(companyId ? { companyId } : {}), policyMode:value('policy') as 'legal_only'|'company_policy' };
}

function renderSap(sap: AnySap): string {
  if (!sap) return '';
  if (sap.status === 'indeterminate') return `<div class="result"><h3>SAP ${badge('indeterminate')}</h3><p class="muted">${esc(sap.rationale)}</p></div>`;
  if (sap.suggestions.length === 0) return `<div class="result"><h3>SAP</h3><p class="muted">Für diesen Pfad ist kein SAP-Vorschlag erforderlich oder hinterlegt.</p></div>`;
  return `<div class="result"><h3>SAP-Vorschläge</h3><div class="sap-list">${sap.suggestions.map((s) => `<div class="sap-row"><div><strong>${esc('supplyId' in s ? s.supplyId : s.transactionRef)}</strong> · ${esc(s.role)} · ${esc(s.country)}</div><div>${badge(s.confidence)} ${badge(s.mapping.status)}</div><div class="sap-code">${s.mapping.status === 'matched' ? esc(s.mapping.taxCode) : '—'}</div><div class="muted">${esc(s.treatment)} · ${esc(s.rationale)}</div></div>`).join('')}</div></div>`;
}

function renderChainResult(analysis: Extract<TransactionAnalysisResult,{kind:'chain'}>): string {
  const routed = analysis.result;
  if (routed.status === 'review_required') return `<div class="result"><h3>Scope ${badge('review_required')}</h3><p>${esc(routed.scope.kind)}</p><p class="muted">${esc(routed.rationale)}</p></div>`;
  const payload = routed.analysis;
  if ('country' in payload || 'issues' in payload) {
    if (payload.status === 'invalid') return `<div class="result"><h3>Inland ${badge('invalid')}</h3><p class="muted">${esc(payload.issues.join(' · '))}</p></div>`;
    return `<div class="result"><h3>Inlandskette ${badge('complete')}</h3><p class="muted">${esc(payload.rationale)}</p>${payload.supplies.map((s) => `<div class="supply-line"><strong>${s.supplyId}</strong> ${s.country} · ${s.standardRate ?? '?'}% · RC ${badge(s.reverseCharge.status)} · Registrierung ${badge(s.sellerRegistration.status)}</div>`).join('')}</div>`;
  }
  if (payload.status === 'blocked') { const moving = payload.chain.movingSupply; const detail = 'rationale' in moving ? moving.rationale : 'issues' in moving ? moving.issues.join(' · ') : moving.status; return `<div class="result"><h3>Lieferkette ${badge('blocked')}</h3><p class="muted">${esc(detail)}</p></div>`; }
  return `<div class="result"><h3>Bewegte Lieferung ${badge(payload.chain.movingSupply.status)}</h3><div class="big-value">${esc(payload.chain.movingSupply.movingSupplyId)}</div><p class="muted">${esc(payload.chain.movingSupply.rationale)}</p><div class="chain">${payload.chain.supplies.map((s) => `<span class="party">${esc(s.supplyId)} · ${esc(s.position)} · ${esc(s.placeCountry)}</span>`).join('<span class="arrow">→</span>')}</div></div><div class="result"><h3>Art. 138 ${badge(payload.movingSupplyExemption.status)}</h3><p class="muted">${esc(payload.movingSupplyExemption.rationale)}</p></div><div class="result"><h3>Dreieck ${badge(payload.triangle.status)}</h3><p class="muted">${esc(payload.triangle.rationale)}</p></div><div class="result"><h3>Erwerb</h3><p class="muted">Bestimmung: <strong>${esc(payload.acquisition.destinationAcquisitionCountry)}</strong> · Art. 41: <strong>${esc(payload.acquisition.article41.status)}</strong></p></div><div class="result"><h3>Firmenpolicy ${badge(payload.trianglePolicy.status)}</h3><p class="muted">${esc(payload.trianglePolicy.rationale)}</p></div>`;
}
function summary(analysis: TransactionAnalysisResult): string {
  if (analysis.kind === 'chain') return renderChainResult(analysis);
  const result = analysis.result; const status = result.status; const rationale = 'rationale' in result ? result.rationale : '';
  return `<div class="result"><h3>${esc(TITLES[analysis.kind])} ${badge(status)}</h3>${rationale ? `<p class="muted">${esc(rationale)}</p>` : ''}</div>`;
}
function renderRun(run: LastRun): void { resultEl.innerHTML = `${summary(run.analysis)}${renderSap(run.sap)}<details><summary>Strukturiertes Engine-Ergebnis</summary><pre>${esc(JSON.stringify(run.analysis,null,2))}</pre></details>`; exportBtn.disabled = false; saveBtn.disabled = false; }

function runCurrent(mode: Mode): LastRun {
  if (mode === 'chain') {
    const input = chainInput(); const analysis = analyzeTransaction({ kind:'chain', input }); let sap: AnySap = null;
    if (analysis.kind === 'chain' && analysis.result.status === 'analyzed' && analysis.result.scope.kind === 'intra_eu') {
      const payload = analysis.result.analysis; if (!('country' in payload) && !('issues' in payload)) sap = deriveSapForVatCase(input,payload);
    }
    return { mode,input,analysis,sap };
  }
  if (mode === 'own_goods') {
    const input = { departureCountry:country('og-dep'), destinationCountry:country('og-dest'), purpose:value('og-purpose') as 'processing_or_appraisal'|'temporary_service_use'|'other', workPerformedInDestination:yn('og-work'), returnedToOrigin:yn('og-return'), exceptionAppliedAtDispatch:yn('og-exception'), ...(value('og-ceased') ? { exceptionCeasedAt:value('og-ceased') } : {}) };
    const analysis = analyzeTransaction({ kind:'own_goods', input }); if (analysis.kind !== 'own_goods') throw new Error('Unexpected analysis kind'); const sap = value('company') ? deriveSapForOwnGoods(value('company'),analysis.result) : null; return { mode,input,analysis,sap };
  }
  if (mode === 'processing_service') {
    const input = { provider:{ id:'P', establishmentCountry:country('ps-provider') }, recipient:{ id:'R', establishmentCountry:country('ps-recipient') }, recipientIsTaxablePerson:yn('ps-taxable'), ...(country('ps-receiving') ? { recipientEstablishmentReceivingService:country('ps-receiving') } : {}) };
    const analysis = analyzeTransaction({ kind:'processing_service', input }); if (analysis.kind !== 'processing_service') throw new Error('Unexpected analysis kind'); const sap = value('company') ? deriveSapForProcessingService(value('company'),value('ps-role') as 'provider'|'recipient',analysis.result) : null; return { mode,input,analysis,sap };
  }
  if (mode === 'direct_export') {
    const input = { departureCountry:country('ex-dep'), destinationCountry:country('ex-dest'), organizer:value('ex-org') as 'supplier'|'supplier_agent'|'customer'|'customer_agent'|'unknown', customerEstablishedInDepartureCountry:yn('ex-cust-est'), exportEvidence:value('ex-evidence') as 'available'|'missing'|'unknown' };
    const analysis = analyzeTransaction({ kind:'direct_export', input }); if (analysis.kind !== 'direct_export') throw new Error('Unexpected analysis kind'); const sap = value('company') ? deriveSapForExport(value('company'),input.departureCountry,analysis.result) : null; return { mode,input,analysis,sap };
  }
  if (mode === 'eu_import') {
    const input = { departureCountry:country('im-dep'), importCountry:country('im-country'), finalDestinationCountry:country('im-final'), customsProcedure42Declared:yn('im-v42'), importerVatIdCountry:country('im-importer-vat'), destinationCustomerVatIdCountry:country('im-cust-vat'), onwardSupplyFacts:{ buyerStatus:'taxable_person' as const, customerVatId:{ status:'known' as const, country:country('im-cust-vat'), validation:value('im-valid') as 'valid'|'invalid'|'unknown', indicatedToSupplier:'yes' as const }, recapitulativeStatement:value('im-recap') as NonNullable<SupplyComplianceFacts['recapitulativeStatement']> } };
    const analysis = analyzeTransaction({ kind:'eu_import', input }); return { mode,input,analysis,sap:null };
  }
  const input = { originCountry:country('ch-origin'), importerOfRecord:value('ch-importer') as 'supplier'|'customer'|'unknown', supplierUsesSubordinationDeclaration:yn('ch-subordination') };
  const analysis = analyzeTransaction({ kind:'swiss_import', input }); if (analysis.kind !== 'swiss_import') throw new Error('Unexpected analysis kind'); const sap = value('company') ? deriveSapForSwissImport(value('company'),analysis.result) : null; return { mode,input,analysis,sap };
}

form.addEventListener('submit',(event) => { event.preventDefault(); try { lastRun = runCurrent((form.dataset.mode ?? 'chain') as Mode); renderRun(lastRun); } catch (error) { resultEl.innerHTML = `<div class="result"><h3>Fehler ${badge('blocked')}</h3><p class="muted">${esc(error instanceof Error ? error.message : error)}</p></div>`; } });
document.querySelectorAll<HTMLButtonElement>('.mode-tab').forEach((button) => button.addEventListener('click',() => { document.querySelectorAll('.mode-tab').forEach((x) => x.classList.remove('active')); button.classList.add('active'); renderForm(button.dataset.mode as Mode); }));
mustQuery<HTMLButtonElement>('#print-btn').addEventListener('click',() => window.print());
exportBtn.addEventListener('click',() => { if (!lastRun) return; const file = buildCaseFile(lastRun.input,{ analysis:lastRun.analysis,sap:lastRun.sap },{ title:TITLES[lastRun.mode] }); const blob = new Blob([serializeCaseFile(file)],{ type:'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `vat-case-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url); });
function loadSaved(): SavedCase[] { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) as SavedCase[] : []; } catch { return []; } }
function renderSaved(): void { const rows = loadSaved(); savedEl.innerHTML = rows.length ? rows.map((item) => `<button class="saved-item" data-id="${esc(item.id)}"><strong>${esc(TITLES[item.run.mode])}</strong><span>${esc(item.savedAt.slice(0,19).replace('T',' '))}</span></button>`).join('') : '<div class="empty compact">Noch keine Fälle lokal gespeichert.</div>'; savedEl.querySelectorAll<HTMLButtonElement>('.saved-item').forEach((btn) => btn.addEventListener('click',() => { const item = loadSaved().find((x) => x.id === btn.dataset.id); if (!item) return; lastRun = item.run; renderRun(item.run); })); }
saveBtn.addEventListener('click',() => { if (!lastRun) return; const rows = loadSaved(); rows.unshift({ id:crypto.randomUUID(), savedAt:new Date().toISOString(), run:lastRun }); localStorage.setItem(STORAGE_KEY,JSON.stringify(rows.slice(0,50))); renderSaved(); });
mustQuery<HTMLButtonElement>('#clear-saved').addEventListener('click',() => { localStorage.removeItem(STORAGE_KEY); renderSaved(); });
renderForm('chain'); renderSaved();
