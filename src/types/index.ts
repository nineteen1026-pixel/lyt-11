export interface PerformanceLevel {
  id: string
  name: string
  coefficient: number
  description?: string
}

export interface PerformanceDistributionRatio {
  levelId: string
  levelName: string
  maxRatio: number
}

export type CalibrationScope = 'company' | 'department'

export interface CalibrationEmployee {
  employeeId: string
  employeeName: string
  departmentId: string
  departmentName: string
  position: string
  baseSalary: number
  currentLevelId: string
  currentLevelName: string
  currentCoefficient: number
  calibratedLevelId: string | null
  calibratedLevelName: string | null
  calibratedCoefficient: number | null
  performanceScore: number
  originalRank: number
  calibratedRank: number | null
  changed: boolean
}

export interface CalibrationResult {
  id: string
  year: number
  half: 'first' | 'second' | 'annual'
  scope: CalibrationScope
  scopeId: string
  scopeName: string
  createdAt: string
  appliedAt: string | null
  status: 'draft' | 'confirmed' | 'applied'
  totalEmployees: number
  levelDistribution: Record<string, number>
  employees: CalibrationEmployee[]
}

export interface Department {
  id: string
  name: string
  allocationRatio: number
  employees: Employee[]
}

export interface EmployeeTag {
  id: string
  name: string
  coefficient: number
  description?: string
  color?: string
  effectiveDate: string
  expiryDate: string
}

export interface Employee {
  id: string
  name: string
  departmentId: string
  position: string
  baseSalary: number
  performanceLevelId: string
  yearsOfService: number
  tagIds: string[]
}

export interface BonusPoolConfig {
  totalAmount: number
  departmentRatios: Record<string, number>
  baseRatio: number
  performanceRatio: number
  tenureRatio: number
  capEnabled: boolean
  capAmount: number
  floorEnabled: boolean
  floorAmount: number
}

export type TaxMethod = 'oneTime' | 'comprehensive'

export type AdjustmentType = 'none' | 'capped' | 'floored'

export type BonusImpactSourceType = 'salary_adjustment'

export interface BonusImpactSource {
  id: string
  type: BonusImpactSourceType
  name: string
  description: string
  effectiveDate: string
  oldValue: number
  newValue: number
  impactAmount: number
  requestNo?: string
  reasonName?: string
}

export interface PersonalCalculationResult {
  employeeId: string
  employeeName: string
  departmentName: string
  baseAmount: number
  performanceBonus: number
  tenureBonus: number
  tagBonus: number
  departmentAllocation: number
  originalGrossBonus: number
  adjustmentType: AdjustmentType
  adjustmentAmount: number
  grossBonus: number
  taxOneTime: number
  netBonusOneTime: number
  taxComprehensive: number
  netBonusComprehensive: number
  betterMethod: TaxMethod
  savedTax: number
  impactSources: BonusImpactSource[]
  weightedBaseSalary: number
  originalBaseAmount: number
}

export interface ComprehensiveIncomeInfo {
  annualSalary: number
  specialDeduction: number
  specialAdditionalDeduction: number
  otherDeduction: number
}

export interface TaxBracket {
  min: number
  max: number
  rate: number
  quickDeduction: number
}

export type BonusPlanVersionStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'rolled_back'

export interface BonusPlanVersionSnapshot {
  bonusPool: BonusPoolConfig
  departments: Department[]
  performanceLevels: PerformanceLevel[]
  performanceDistributionRatios: PerformanceDistributionRatio[]
  employeeTags: EmployeeTag[]
}

export interface BonusPlanVersion {
  id: string
  versionNo: string
  name: string
  description: string
  snapshot: BonusPlanVersionSnapshot
  status: BonusPlanVersionStatus
  createdBy: string
  createdAt: string
  updatedAt: string
  approvedAt?: string
  approvedBy?: string
  rejectionReason?: string
  changeSummary: string
  isCurrent: boolean
  rollbackFromVersionId?: string
}

export interface BonusPlanVersionDiff {
  field: string
  label: string
  oldValue: any
  newValue: any
  changeType: 'added' | 'removed' | 'modified' | 'unchanged'
  path: string
}

export type ApprovalActionType = 'submit' | 'approve' | 'reject' | 'withdraw' | 'rollback'

export interface VersionApprovalRecord {
  id: string
  versionId: string
  action: ApprovalActionType
  operatorName: string
  comment: string
  operatedAt: string
  previousStatus: BonusPlanVersionStatus
  newStatus: BonusPlanVersionStatus
}

export interface AppData {
  performanceLevels: PerformanceLevel[]
  employeeTags: EmployeeTag[]
  departments: Department[]
  bonusPool: BonusPoolConfig
  comprehensiveIncome: Record<string, ComprehensiveIncomeInfo>
  performanceDistributionRatios: PerformanceDistributionRatio[]
  calibrationResults: CalibrationResult[]
  bonusPlanVersions?: BonusPlanVersion[]
  versionApprovalRecords?: VersionApprovalRecord[]
  salaryAdjustmentImpacts?: BonusImpactSource[]
  sandboxScenarios?: BonusSandboxScenario[]
  activeSandboxScenarioIds?: string[]
  bonusConfirmations?: BonusConfirmationRecord[]
  bonusConfirmationBatches?: BonusConfirmationBatch[]
  bonusSignVouchers?: BonusSignVoucher[]
}

export type AdjustmentReasonCategory =
  | 'annual'
  | 'performance'
  | 'promotion'
  | 'market'
  | 'certification'
  | 'transfer'
  | 'special'

export interface AdjustmentReason {
  id: string
  category: AdjustmentReasonCategory
  name: string
  description?: string
  defaultMinRatio?: number
  defaultMaxRatio?: number
  enabled: boolean
}

export type ApprovalNodeType = 'direct_manager' | 'department_head' | 'hr' | 'finance' | 'ceo' | 'custom'

export interface ApprovalDelegation {
  id: string
  nodeId: string
  delegatorName: string
  delegateName: string
  startDate: string
  endDate: string
  enabled: boolean
  createdAt: string
}

export interface ApprovalNode {
  id: string
  name: string
  type: ApprovalNodeType
  order: number
  approverRole?: string
  minApprovalAmount?: number
  maxApprovalAmount?: number
  required: boolean
  delegations?: ApprovalDelegation[]
}

export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'returned' | 'withdrawn'
export type NodeApprovalStatus = 'waiting' | 'approved' | 'rejected' | 'skipped' | 'current'

export interface DelegationInfo {
  delegatorName: string
  delegateName: string
  isDelegated: boolean
}

export interface DelegateRejectRecord {
  delegateName: string
  delegatorName: string
  comment: string
  rejectedAt: string
}

export interface ApprovalRecord {
  nodeId: string
  nodeName: string
  approverName: string
  status: NodeApprovalStatus
  comment?: string
  operatedAt: string
  delegationInfo?: DelegationInfo
  delegateReject?: DelegateRejectRecord
}

export interface SalaryAdjustmentRequest {
  id: string
  requestNo: string
  employeeId: string
  employeeName: string
  departmentId: string
  departmentName: string
  position: string
  reasonCategory: AdjustmentReasonCategory
  reasonId: string
  reasonName: string
  currentSalary: number
  proposedSalary: number
  adjustmentAmount: number
  adjustmentRatio: number
  effectiveDate: string
  description: string
  attachments: string[]
  status: ApprovalStatus
  currentNodeIndex: number
  approvalRecords: ApprovalRecord[]
  workflowSnapshot: ApprovalNode[]
  applicantName: string
  createdAt: string
  updatedAt: string
  approvedAt?: string
  rejectedAt?: string
  budgetYear: number
  isHistorical?: boolean
  historicalApprovedAt?: string
  rejectedFromNodeIndex?: number
}

export interface DepartmentSalaryBudget {
  departmentId: string
  departmentName: string
  totalBudget: number
  usedAmount: number
  pendingAmount: number
  approvedCount: number
  pendingCount: number
  headcount: number
  averageAdjustmentRatio: number
}

export interface AnnualSalaryBudget {
  year: number
  totalBudget: number
  usedAmount: number
  pendingAmount: number
  reservedAmount: number
  departments: DepartmentSalaryBudget[]
  maxAdjustmentRatio: number
  minAdjustmentRatio: number
  defaultRatio: number
  createdAt: string
  updatedAt: string
}

export interface SalaryHistoryRecord {
  id: string
  employeeId: string
  employeeName: string
  departmentName: string
  position: string
  oldSalary: number
  newSalary: number
  adjustmentAmount: number
  adjustmentRatio: number
  reasonCategory: AdjustmentReasonCategory
  reasonName: string
  effectiveDate: string
  approvedAt: string
  applicantName: string
  approverName: string
  description?: string
}

export interface PerformanceHistoryRecord {
  id: string
  employeeId: string
  employeeName: string
  year: number
  half: 'first' | 'second' | 'annual'
  levelId: string
  levelName: string
  coefficient: number
  reviewerName: string
  reviewedAt: string
  comment?: string
}

export interface BonusPaymentRecord {
  id: string
  employeeId: string
  employeeName: string
  departmentName: string
  year: number
  type: 'year_end' | 'performance' | 'special' | 'other'
  name: string
  grossAmount: number
  taxAmount: number
  netAmount: number
  taxMethod: TaxMethod
  paymentDate: string
  description?: string
  approvalStatus: ApprovalStatus
  approverName?: string
  approvedAt?: string
}

export type ArchiveEventType =
  | 'salary_adjustment'
  | 'bonus_payment'
  | 'performance_review'
  | 'approval_record'

export interface ArchiveTimelineEvent {
  id: string
  type: ArchiveEventType
  date: string
  title: string
  description: string
  amount?: number
  amountLabel?: string
  status?: string
  statusColor?: string
  tags?: string[]
  detail?: any
  relatedRecordId?: string
}

export interface EmployeeTagExpiryWarning {
  tag: EmployeeTag
  daysUntilExpiry: number
  affectedEmployees: {
    id: string
    name: string
    departmentName: string
    currentTagBonus: number
    potentialLoss: number
  }[]
  totalPotentialLoss: number
  affectedCount: number
}

export interface EmployeeCompensationArchive {
  employeeId: string
  employeeName: string
  departmentName: string
  position: string
  baseSalary: number
  hireDate?: string
  events: ArchiveTimelineEvent[]
  salaryHistory: SalaryHistoryRecord[]
  bonusHistory: BonusPaymentRecord[]
  performanceHistory: PerformanceHistoryRecord[]
  bonusSignVouchers: BonusSignVoucher[]
  summary: {
    totalSalaryAdjustments: number
    totalAdjustmentAmount: number
    totalBonusPayments: number
    totalBonusGross: number
    totalBonusNet: number
    performanceRecords: number
    currentLevel: string
    currentCoefficient: number
    totalBonusSignVouchers: number
  }
}

export type BonusConfirmationStatus =
  | 'pending'
  | 'signed'
  | 'objected'
  | 'reviewing'
  | 'resolved_confirmed'
  | 'resolved_adjusted'
  | 'timeout'

export interface ObjectionRecord {
  id: string
  reason: string
  description: string
  attachments: string[]
  createdAt: string
  objectorName: string
}

export interface ReviewRecord {
  id: string
  result: 'confirmed' | 'adjusted'
  adjustedGrossAmount?: number
  adjustedTaxAmount?: number
  adjustedNetAmount?: number
  comment: string
  reviewerName: string
  reviewedAt: string
}

export interface BonusConfirmationRecord {
  id: string
  batchId: string
  employeeId: string
  employeeName: string
  departmentId: string
  departmentName: string
  position: string
  grossAmount: number
  taxAmount: number
  netAmount: number
  taxMethod: TaxMethod
  status: BonusConfirmationStatus
  createdAt: string
  deadlineAt: string
  signedAt?: string
  signature?: string
  objection?: ObjectionRecord
  review?: ReviewRecord
  timeoutNotifiedAt?: string
  reminderCount: number
  lastReminderAt?: string
  year: number
  bonusName: string
  signVoucherId?: string
}

export interface BonusSignVoucher {
  id: string
  confirmationRecordId: string
  batchId: string
  employeeId: string
  employeeName: string
  departmentName: string
  position: string
  year: number
  bonusName: string
  grossAmount: number
  taxAmount: number
  netAmount: number
  taxMethod: TaxMethod
  signature: string
  signedAt: string
  voucherNo: string
  generatedAt: string
  archivedAt: string
  batchName: string
}

export interface BonusSignVoucherExportOptions {
  format: 'pdf' | 'zip' | 'excel'
  includeVouchers: boolean
  includeSummary: boolean
}

export interface BonusConfirmationBatch {
  id: string
  name: string
  year: number
  bonusName: string
  status: 'draft' | 'published' | 'completed'
  deadlineDays: number
  createdAt: string
  publishedAt?: string
  completedAt?: string
  totalConfirmations: number
  signedCount: number
  objectedCount: number
  pendingCount: number
  timeoutCount: number
}

export interface TimeoutWarning {
  recordId: string
  employeeId: string
  employeeName: string
  departmentName: string
  deadlineAt: string
  remainingHours: number
  warningLevel: 'info' | 'warning' | 'critical'
  status: BonusConfirmationStatus
}

export interface BonusConfirmationModuleData {
  batches: BonusConfirmationBatch[]
  confirmations: BonusConfirmationRecord[]
}

export interface SalaryAdjustmentModuleData {
  reasons: AdjustmentReason[]
  approvalWorkflow: ApprovalNode[]
  annualBudget: AnnualSalaryBudget | null
  requests: SalaryAdjustmentRequest[]
  salaryHistory: SalaryHistoryRecord[]
  performanceHistory: PerformanceHistoryRecord[]
  bonusPayments: BonusPaymentRecord[]
}

export interface SalaryTrendPoint {
  year: number
  month?: number
  label: string
  baseSalary: number
  adjustmentAmount: number
  adjustmentRatio: number
  reasonName: string
}

export interface BonusTrendPoint {
  year: number
  type: string
  name: string
  grossAmount: number
  taxAmount: number
  netAmount: number
  taxMethod: TaxMethod
}

export interface PerformanceTrendPoint {
  year: number
  half: 'first' | 'second' | 'annual'
  levelName: string
  coefficient: number
  comment?: string
}

export interface AnnualCompensationSummary {
  year: number
  totalBaseSalaryAnnual: number
  totalBonusGross: number
  totalBonusNet: number
  totalCompensationGross: number
  totalCompensationNet: number
  salaryAdjustmentCount: number
  totalAdjustmentAmount: number
  averageAdjustmentRatio: number
  bonusPaymentCount: number
  performanceRecords: number
  highestPerformanceLevel: string
  lowestPerformanceLevel: string
}

export interface MarketSalaryPercentile {
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
}

export interface MarketBenchmarkData {
  id: string
  position: string
  positionLevel: string
  city: string
  industry: string
  year: number
  baseSalary: MarketSalaryPercentile
  totalCompensation: MarketSalaryPercentile
  bonusRange: {
    min: number
    max: number
    median: number
  }
  salaryGrowthRange: {
    min: number
    max: number
    median: number
  }
  dataSource: string
  updatedAt: string
}

export type CompetitivenessLevel = 'far_below' | 'below' | 'at_market' | 'above' | 'far_above'

export interface SalaryCompetitivenessAssessment {
  employeeId: string
  employeeName: string
  position: string
  year: number
  baseSalary: number
  baseSalaryPercentile: number
  baseSalaryVsMarket: {
    vsP10: number
    vsP25: number
    vsP50: number
    vsP75: number
    vsP90: number
  }
  totalCompensation: number
  totalCompensationPercentile: number
  totalCompensationVsMarket: {
    vsP10: number
    vsP25: number
    vsP50: number
    vsP75: number
    vsP90: number
  }
  competitivenessLevel: CompetitivenessLevel
  historicalAdjustments: {
    count: number
    totalAmount: number
    averageRatio: number
    vsMarketGrowth: number
    multiYearCount: number
    multiYearTotalAmount: number
    multiYearAverageRatio: number
    yearSpan: number
    cagr: number
  }
  marketGrowthRate: number
  personalGrowthRate: number
  gapAnalysis: {
    currentGapAmount: number
    currentGapPercent: number
    projectedGapIn1Year: number
    projectedGapIn2Year: number
  }
  recommendations: string[]
  riskLevel: 'low' | 'medium' | 'high'
  retentionRisk: string
  benchmarkData: MarketBenchmarkData
}

export interface EmployeeAnnualReview {
  employeeId: string
  employeeName: string
  departmentName: string
  position: string
  year: number
  startSalary: number
  endSalary: number
  salaryGrowthRate: number
  salaryTrend: SalaryTrendPoint[]
  bonusTrend: BonusTrendPoint[]
  performanceTrend: PerformanceTrendPoint[]
  summary: AnnualCompensationSummary
  marketBenchmark?: MarketBenchmarkData
  competitiveness?: SalaryCompetitivenessAssessment
  insights: {
    salaryPosition: string
    bonusPosition: string
    performanceTrend: string
    recommendation: string
    marketPosition?: string
    competitiveness?: string
  }
}

export interface DepartmentAnnualReview {
  departmentId: string
  departmentName: string
  year: number
  headcount: number
  averageSalary: number
  averageBonus: number
  totalCompensation: number
  salaryGrowthRate: number
  performanceDistribution: Record<string, number>
}

export interface AnnualCompensationReviewReport {
  year: number
  generatedAt: string
  scope: 'company' | 'department' | 'employee'
  scopeId?: string
  scopeName?: string
  companySummary?: {
    totalHeadcount: number
    totalAnnualSalary: number
    totalBonusGross: number
    totalCompensation: number
    averageSalary: number
    averageBonus: number
    overallSalaryGrowth: number
    performanceDistribution: Record<string, number>
  }
  departments?: DepartmentAnnualReview[]
  employees?: EmployeeAnnualReview[]
  topSalaryGrowth?: EmployeeAnnualReview[]
  topBonusEarners?: EmployeeAnnualReview[]
  salaryAdjustmentByCategory?: Record<AdjustmentReasonCategory, number>
}

export interface SandboxLevelDistribution {
  levelId: string
  levelName: string
  ratio: number
  coefficient: number
}

export interface SandboxKeyMetrics {
  totalBonusPool: number
  actualTotalBonus: number
  averageBonus: number
  medianBonus: number
  maxBonus: number
  minBonus: number
  totalEmployees: number
  totalTaxOneTime: number
  totalTaxComprehensive: number
  averageTaxSaving: number
  levelBonusDistribution: Record<string, {
    count: number
    ratio: number
    averageBonus: number
    totalBonus: number
  }>
  departmentBonusDistribution: Record<string, {
    count: number
    averageBonus: number
    totalBonus: number
    allocationRatio: number
  }>
  cappedCount: number
  flooredCount: number
  adjustmentImpact: number
}

export interface BonusSandboxScenario {
  id: string
  name: string
  description: string
  color: string
  createdAt: string
  updatedAt: string
  bonusPoolConfig: BonusPoolConfig
  levelDistributions: SandboxLevelDistribution[]
  isBaseline: boolean
  metrics?: SandboxKeyMetrics
}

export interface SandboxComparisonColumn {
  key: string
  label: string
  unit?: string
  isBetter: 'higher' | 'lower' | 'neutral'
  format?: 'currency' | 'percentage' | 'number' | 'count'
}

export interface BonusSandboxModuleData {
  scenarios: BonusSandboxScenario[]
  activeScenarioIds: string[]
}

export interface YearlySalaryGrowthData {
  year: number
  startSalary: number
  endSalary: number
  totalAdjustmentAmount: number
  adjustmentCount: number
  averageAdjustmentRatio: number
  highestAdjustment: number
  lowestAdjustment: number
  adjustmentByCategory: Record<AdjustmentReasonCategory, number>
  headcount: number
}

export interface YearlyBonusData {
  year: number
  totalBonusGross: number
  totalBonusNet: number
  averageBonus: number
  bonusCount: number
  bonusByType: Record<string, number>
}

export interface YearlyPerformanceData {
  year: number
  totalReviews: number
  distribution: Record<string, number>
  averageCoefficient: number
}

export interface CrossYearComparisonPoint {
  year: number
  label: string
  averageSalary: number
  averageBonus: number
  averageTotalCompensation: number
  salaryGrowthRate: number
  bonusGrowthRate: number
  totalCompGrowthRate: number
  headcount: number
  totalSalaryCost: number
  totalBonusCost: number
  totalCompCost: number
}

export interface CrossYearComparisonReport {
  generatedAt: string
  scope: 'company' | 'department' | 'employee'
  scopeId?: string
  scopeName?: string
  years: number[]
  comparisonPoints: CrossYearComparisonPoint[]
  yearlySalaryData: YearlySalaryGrowthData[]
  yearlyBonusData: YearlyBonusData[]
  yearlyPerformanceData: YearlyPerformanceData[]
  insights: {
    overallSalaryGrowth: number
    overallBonusGrowth: number
    overallCompGrowth: number
    cagrSalary: number
    cagrBonus: number
    cagrTotal: number
    keyFindings: string[]
  }
  departmentComparison?: {
    departmentId: string
    departmentName: string
    points: CrossYearComparisonPoint[]
  }[]
  topGrowers?: {
    employeeId: string
    employeeName: string
    departmentName: string
    totalGrowthAmount: number
    totalGrowthRate: number
    growthPoints: { year: number; salary: number; growthRate: number }[]
  }[]
}

