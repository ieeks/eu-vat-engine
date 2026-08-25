export { analyzeChain } from './application/analyzeChain.js';
export type { ChainAnalysis } from './application/analyzeChain.js';
export { analyzeVatCase } from './application/analyzeVatCase.js';
export type { VatCaseAnalysis } from './application/analyzeVatCase.js';

export { determineMovingSupply } from './domain/movingSupply.js';
export type { MovingSupplyDecision, MovingSupplyRuleId } from './domain/movingSupply.js';
export { allocateSupplyPlaces } from './domain/placeOfSupply.js';
export type { SupplyPlaceAllocation, SupplyPosition } from './domain/placeOfSupply.js';
export { evaluateArt138 } from './domain/art138.js';
export type { Art138Result } from './domain/art138.js';
export { evaluateTriangle } from './domain/triangle.js';
export type { TriangleResult } from './domain/triangle.js';
export { determineAcquisition } from './domain/acquisition.js';
export type { AcquisitionResult } from './domain/acquisition.js';
export { evaluateNationalReverseCharge } from './domain/reverseCharge.js';
export type { NationalRcContext, NationalRcResult } from './domain/reverseCharge.js';
export { evaluateAcquisitionRegistrationRisk, evaluateDomesticSellerRegistrationRisk } from './domain/registrationRisk.js';
export type { RegistrationRiskResult } from './domain/registrationRisk.js';

export type { ChainTransaction, CountryCode, Party, PartyId, TransportFacts, VatIdCommunication, VatRegistration } from './domain/transaction.js';
export type { AcquisitionFacts, SupplyComplianceFacts, VatCaseInput, VatIdFact, YesNoUnknown } from './domain/vatCase.js';

export { COMPANIES, getCompany } from './companies/companies.js';
export type { CompanyConfig } from './companies/companyConfig.js';
export { evaluateTriangleCompanyPolicy } from './policy/trianglePolicy.js';
export { resolveSapTaxCode } from './sap/mappings.js';
export type { SapMappingRequest, SapMappingResult, SapTreatment } from './sap/mappings.js';

export { EU_MEMBER_STATES, isEuMemberState, VAT_ID_PREFIX_BY_COUNTRY } from './knowledge/eu/memberStates.js';
export { EU_LEGAL_RULES } from './knowledge/eu/legalRules.js';
export { REVERSE_CHARGE_SOURCES } from './knowledge/countries/reverseChargeSources.js';
