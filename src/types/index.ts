export interface PerformanceLevel {
  id: string
  name: string
  coefficient: number
  description?: string
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
}

export type TaxMethod = 'oneTime' | 'comprehensive'

export interface PersonalCalculationResult {
  employeeId: string
  employeeName: string
  departmentName: string
  baseAmount: number
  performanceBonus: number
  tenureBonus: number
  tagBonus: number
  departmentAllocation: number
  grossBonus: number
  taxOneTime: number
  netBonusOneTime: number
  taxComprehensive: number
  netBonusComprehensive: number
  betterMethod: TaxMethod
  savedTax: number
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
}
