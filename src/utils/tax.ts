import type { TaxBracket } from '@/types'

export const ONE_TIME_TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 3000, rate: 0.03, quickDeduction: 0 },
  { min: 3000, max: 12000, rate: 0.1, quickDeduction: 210 },
  { min: 12000, max: 25000, rate: 0.2, quickDeduction: 1410 },
  { min: 25000, max: 35000, rate: 0.25, quickDeduction: 2660 },
  { min: 35000, max: 55000, rate: 0.3, quickDeduction: 4410 },
  { min: 55000, max: 80000, rate: 0.35, quickDeduction: 7160 },
  { min: 80000, max: Infinity, rate: 0.45, quickDeduction: 15160 }
]

export const COMPREHENSIVE_TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 36000, rate: 0.03, quickDeduction: 0 },
  { min: 36000, max: 144000, rate: 0.1, quickDeduction: 2520 },
  { min: 144000, max: 300000, rate: 0.2, quickDeduction: 16920 },
  { min: 300000, max: 420000, rate: 0.25, quickDeduction: 31920 },
  { min: 420000, max: 660000, rate: 0.3, quickDeduction: 52920 },
  { min: 660000, max: 960000, rate: 0.35, quickDeduction: 85920 },
  { min: 960000, max: Infinity, rate: 0.45, quickDeduction: 181920 }
]

export const STANDARD_DEDUCTION = 60000

export function calculateOneTimeTax(bonus: number): number {
  if (bonus <= 0) return 0
  const monthlyBonus = bonus / 12
  const bracket = ONE_TIME_TAX_BRACKETS.find(
    (b) => monthlyBonus > b.min && monthlyBonus <= b.max
  ) || ONE_TIME_TAX_BRACKETS[0]
  return Math.max(0, bonus * bracket.rate - bracket.quickDeduction)
}

export function calculateComprehensiveTax(
  annualSalary: number,
  bonus: number,
  specialDeduction: number = 0,
  specialAdditionalDeduction: number = 0,
  otherDeduction: number = 0
): { taxWithBonus: number; taxWithoutBonus: number; taxDifference: number } {
  const totalIncomeWithBonus =
    annualSalary + bonus - STANDARD_DEDUCTION - specialDeduction - specialAdditionalDeduction - otherDeduction
  const totalIncomeWithoutBonus =
    annualSalary - STANDARD_DEDUCTION - specialDeduction - specialAdditionalDeduction - otherDeduction

  const taxableWithBonus = Math.max(0, totalIncomeWithBonus)
  const taxableWithoutBonus = Math.max(0, totalIncomeWithoutBonus)

  const bracketWith = COMPREHENSIVE_TAX_BRACKETS.find(
    (b) => taxableWithBonus > b.min && taxableWithBonus <= b.max
  ) || COMPREHENSIVE_TAX_BRACKETS[0]
  const bracketWithout = COMPREHENSIVE_TAX_BRACKETS.find(
    (b) => taxableWithoutBonus > b.min && taxableWithoutBonus <= b.max
  ) || COMPREHENSIVE_TAX_BRACKETS[0]

  const taxWithBonus = Math.max(0, taxableWithBonus * bracketWith.rate - bracketWith.quickDeduction)
  const taxWithoutBonus = Math.max(0, taxableWithoutBonus * bracketWithout.rate - bracketWithout.quickDeduction)

  return {
    taxWithBonus,
    taxWithoutBonus,
    taxDifference: taxWithBonus - taxWithoutBonus
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100
}
