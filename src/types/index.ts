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

export interface AppData {
  performanceLevels: PerformanceLevel[]
  employeeTags: EmployeeTag[]
  departments: Department[]
  bonusPool: BonusPoolConfig
  comprehensiveIncome: Record<string, ComprehensiveIncomeInfo>
  performanceDistributionRatios: PerformanceDistributionRatio[]
  calibrationResults: CalibrationResult[]
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

export interface ApprovalNode {
  id: string
  name: string
  type: ApprovalNodeType
  order: number
  approverRole?: string
  minApprovalAmount?: number
  maxApprovalAmount?: number
  required: boolean
}

export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'returned' | 'withdrawn'
export type NodeApprovalStatus = 'waiting' | 'approved' | 'rejected' | 'skipped' | 'current'

export interface ApprovalRecord {
  nodeId: string
  nodeName: string
  approverName: string
  status: NodeApprovalStatus
  comment?: string
  operatedAt: string
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
  summary: {
    totalSalaryAdjustments: number
    totalAdjustmentAmount: number
    totalBonusPayments: number
    totalBonusGross: number
    totalBonusNet: number
    performanceRecords: number
    currentLevel: string
    currentCoefficient: number
  }
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
