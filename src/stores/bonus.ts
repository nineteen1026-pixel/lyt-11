import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  PerformanceLevel,
  Department,
  Employee,
  EmployeeTag,
  BonusPoolConfig,
  PersonalCalculationResult,
  ComprehensiveIncomeInfo,
  TaxMethod,
  AppData,
  AdjustmentType,
  BonusImpactSource,
  PerformanceDistributionRatio,
  CalibrationResult,
  CalibrationEmployee,
  CalibrationScope,
  BonusPlanVersion,
  BonusPlanVersionSnapshot,
  BonusPlanVersionDiff,
  VersionApprovalRecord,
  BonusConfirmationRecord,
  BonusConfirmationBatch,
  TimeoutWarning,
  BonusSandboxScenario,
  SandboxKeyMetrics,
  SandboxLevelDistribution,
  EmployeeTagExpiryWarning,
  BonusSignVoucher
} from '@/types'
import {
  generateId,
  calculateOneTimeTax,
  calculateComprehensiveTax,
  round2
} from '@/utils/tax'
import dayjs from 'dayjs'

export const useBonusStore = defineStore('bonus', () => {
  const performanceLevels = ref<PerformanceLevel[]>([
    { id: generateId(), name: 'S', coefficient: 2.0, description: '卓越' },
    { id: generateId(), name: 'A+', coefficient: 1.5, description: '优秀' },
    { id: generateId(), name: 'A', coefficient: 1.2, description: '良好' },
    { id: generateId(), name: 'B+', coefficient: 1.0, description: '合格' },
    { id: generateId(), name: 'B', coefficient: 0.8, description: '待改进' },
    { id: generateId(), name: 'C', coefficient: 0.5, description: '不合格' }
  ])

  const performanceDistributionRatios = ref<PerformanceDistributionRatio[]>([
    { levelId: '', levelName: 'S', maxRatio: 0.1 },
    { levelId: '', levelName: 'A+', maxRatio: 0.2 },
    { levelId: '', levelName: 'A', maxRatio: 0.3 },
    { levelId: '', levelName: 'B+', maxRatio: 0.25 },
    { levelId: '', levelName: 'B', maxRatio: 0.1 },
    { levelId: '', levelName: 'C', maxRatio: 0.05 }
  ])

  const calibrationResults = ref<CalibrationResult[]>([])
  const currentCalibration = ref<CalibrationResult | null>(null)
  const calibrationYear = ref(dayjs().year())
  const calibrationHalf = ref<'first' | 'second' | 'annual'>('annual')
  const calibrationScope = ref<CalibrationScope>('company')
  const calibrationDeptId = ref<string | null>(null)

  function initDistributionRatios() {
    performanceDistributionRatios.value = performanceLevels.value.map((level, index) => {
      const defaultRatios = [0.1, 0.2, 0.3, 0.25, 0.1, 0.05]
      return {
        levelId: level.id,
        levelName: level.name,
        maxRatio: defaultRatios[index] ?? 0.1
      }
    })
  }

  initDistributionRatios()

  const employeeTags = ref<EmployeeTag[]>([
    { id: generateId(), name: '核心人才', coefficient: 0.3, description: '对公司业务有重大贡献的核心人员', color: '#f5222d', effectiveDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'), expiryDate: dayjs().add(365, 'day').format('YYYY-MM-DD') },
    { id: generateId(), name: '关键岗位', coefficient: 0.2, description: '担任关键岗位的员工', color: '#fa8c16', effectiveDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'), expiryDate: dayjs().add(365, 'day').format('YYYY-MM-DD') },
    { id: generateId(), name: '新人', coefficient: 0.05, description: '入职不满一年的新员工', color: '#52c41a', effectiveDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'), expiryDate: dayjs().add(365, 'day').format('YYYY-MM-DD') },
    { id: generateId(), name: '管理干部', coefficient: 0.15, description: '承担管理职责的员工', color: '#1890ff', effectiveDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'), expiryDate: dayjs().add(365, 'day').format('YYYY-MM-DD') },
    { id: generateId(), name: '技术骨干', coefficient: 0.25, description: '技术领域深度贡献者', color: '#722ed1', effectiveDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'), expiryDate: dayjs().add(365, 'day').format('YYYY-MM-DD') }
  ])

  const dept1Id = generateId()
  const dept2Id = generateId()
  const dept3Id = generateId()

  const tagCoreId = employeeTags.value[0].id
  const tagKeyId = employeeTags.value[1].id
  const tagNewId = employeeTags.value[2].id
  const tagMgrId = employeeTags.value[3].id
  const tagTechId = employeeTags.value[4].id

  const departments = ref<Department[]>([
    {
      id: dept1Id,
      name: '技术研发部',
      allocationRatio: 0.4,
      employees: [
        {
          id: generateId(),
          name: '张三',
          departmentId: dept1Id,
          position: '技术总监',
          baseSalary: 35000,
          performanceLevelId: performanceLevels.value[0].id,
          yearsOfService: 8,
          tagIds: [tagCoreId, tagMgrId, tagTechId]
        },
        {
          id: generateId(),
          name: '李四',
          departmentId: dept1Id,
          position: '高级工程师',
          baseSalary: 25000,
          performanceLevelId: performanceLevels.value[1].id,
          yearsOfService: 5,
          tagIds: [tagKeyId, tagTechId]
        },
        {
          id: generateId(),
          name: '王五',
          departmentId: dept1Id,
          position: '中级工程师',
          baseSalary: 18000,
          performanceLevelId: performanceLevels.value[2].id,
          yearsOfService: 3,
          tagIds: [tagNewId]
        }
      ]
    },
    {
      id: dept2Id,
      name: '市场营销部',
      allocationRatio: 0.3,
      employees: [
        {
          id: generateId(),
          name: '赵六',
          departmentId: dept2Id,
          position: '市场总监',
          baseSalary: 32000,
          performanceLevelId: performanceLevels.value[1].id,
          yearsOfService: 10,
          tagIds: [tagCoreId, tagMgrId]
        },
        {
          id: generateId(),
          name: '钱七',
          departmentId: dept2Id,
          position: '市场经理',
          baseSalary: 20000,
          performanceLevelId: performanceLevels.value[2].id,
          yearsOfService: 4,
          tagIds: [tagKeyId]
        }
      ]
    },
    {
      id: dept3Id,
      name: '运营管理部',
      allocationRatio: 0.3,
      employees: [
        {
          id: generateId(),
          name: '孙八',
          departmentId: dept3Id,
          position: '运营总监',
          baseSalary: 30000,
          performanceLevelId: performanceLevels.value[0].id,
          yearsOfService: 7,
          tagIds: [tagCoreId, tagMgrId]
        },
        {
          id: generateId(),
          name: '周九',
          departmentId: dept3Id,
          position: '运营专员',
          baseSalary: 12000,
          performanceLevelId: performanceLevels.value[3].id,
          yearsOfService: 2,
          tagIds: []
        }
      ]
    }
  ])

  const bonusPool = ref<BonusPoolConfig>({
    totalAmount: 2000000,
    departmentRatios: {
      [dept1Id]: 0.4,
      [dept2Id]: 0.3,
      [dept3Id]: 0.3
    },
    baseRatio: 3,
    performanceRatio: 0.5,
    tenureRatio: 0.1,
    capEnabled: false,
    capAmount: 500000,
    floorEnabled: false,
    floorAmount: 10000
  })

  const salaryAdjustmentImpacts = ref<BonusImpactSource[]>([])

  const bonusCalculationYear = ref(dayjs().year())

  const comprehensiveIncome = ref<Record<string, ComprehensiveIncomeInfo>>({})

  for (const dept of departments.value) {
    for (const emp of dept.employees) {
      comprehensiveIncome.value[emp.id] = {
        annualSalary: emp.baseSalary * 12,
        specialDeduction: emp.baseSalary * 12 * 0.22,
        specialAdditionalDeduction: 24000,
        otherDeduction: 0
      }
    }
  }

  const selectedEmployeeId = ref<string | null>(
    departments.value[0]?.employees[0]?.id || null
  )

  function addPerformanceLevel(level: Omit<PerformanceLevel, 'id'>) {
    performanceLevels.value.push({ ...level, id: generateId() })
  }

  function updatePerformanceLevel(id: string, updates: Partial<PerformanceLevel>) {
    const idx = performanceLevels.value.findIndex((l) => l.id === id)
    if (idx !== -1) {
      performanceLevels.value[idx] = { ...performanceLevels.value[idx], ...updates }
    }
  }

  function removePerformanceLevel(id: string) {
    performanceLevels.value = performanceLevels.value.filter((l) => l.id !== id)
  }

  function addEmployeeTag(tag: Omit<EmployeeTag, 'id'>) {
    employeeTags.value.push({ ...tag, id: generateId() })
  }

  function updateEmployeeTag(id: string, updates: Partial<EmployeeTag>) {
    const idx = employeeTags.value.findIndex((t) => t.id === id)
    if (idx !== -1) {
      employeeTags.value[idx] = { ...employeeTags.value[idx], ...updates }
    }
  }

  function removeEmployeeTag(id: string) {
    employeeTags.value = employeeTags.value.filter((t) => t.id !== id)
    for (const dept of departments.value) {
      for (const emp of dept.employees) {
        emp.tagIds = emp.tagIds.filter((tid) => tid !== id)
      }
    }
  }

  function getTagCoefficient(tagIds: string[]): number {
    return tagIds.reduce((sum, tid) => {
      const tag = employeeTags.value.find((t) => t.id === tid)
      return sum + (tag?.coefficient ?? 0)
    }, 0)
  }

  function addDepartment(dept: Omit<Department, 'id' | 'employees'>) {
    const newId = generateId()
    departments.value.push({ ...dept, id: newId, employees: [] })
    bonusPool.value.departmentRatios[newId] = 0
  }

  function updateDepartment(id: string, updates: Partial<Department>) {
    const idx = departments.value.findIndex((d) => d.id === id)
    if (idx !== -1) {
      departments.value[idx] = { ...departments.value[idx], ...updates }
      if (updates.allocationRatio !== undefined) {
        bonusPool.value.departmentRatios[id] = updates.allocationRatio
      }
    }
  }

  function removeDepartment(id: string) {
    const dept = departments.value.find((d) => d.id === id)
    if (dept) {
      for (const emp of dept.employees) {
        delete comprehensiveIncome.value[emp.id]
      }
    }
    departments.value = departments.value.filter((d) => d.id !== id)
    delete bonusPool.value.departmentRatios[id]
    normalizeDepartmentRatios()
  }

  function addEmployee(deptId: string, employee: Omit<Employee, 'id' | 'departmentId' | 'tagIds'>) {
    const dept = departments.value.find((d) => d.id === deptId)
    if (dept) {
      const newId = generateId()
      dept.employees.push({ ...employee, id: newId, departmentId: deptId, tagIds: [] })
      comprehensiveIncome.value[newId] = {
        annualSalary: employee.baseSalary * 12,
        specialDeduction: employee.baseSalary * 12 * 0.22,
        specialAdditionalDeduction: 24000,
        otherDeduction: 0
      }
    }
  }

  function updateEmployee(id: string, updates: Partial<Employee>) {
    for (const dept of departments.value) {
      const idx = dept.employees.findIndex((e) => e.id === id)
      if (idx !== -1) {
        const oldSalary = dept.employees[idx].baseSalary
        dept.employees[idx] = { ...dept.employees[idx], ...updates }
        if (updates.baseSalary !== undefined && updates.baseSalary !== oldSalary) {
          if (comprehensiveIncome.value[id]) {
            comprehensiveIncome.value[id].annualSalary = updates.baseSalary * 12
            comprehensiveIncome.value[id].specialDeduction = updates.baseSalary * 12 * 0.22
          }
        }
        break
      }
    }
  }

  function removeEmployee(id: string) {
    for (const dept of departments.value) {
      const idx = dept.employees.findIndex((e) => e.id === id)
      if (idx !== -1) {
        dept.employees.splice(idx, 1)
        delete comprehensiveIncome.value[id]
        if (selectedEmployeeId.value === id) {
          selectedEmployeeId.value = dept.employees[0]?.id || null
        }
        break
      }
    }
  }

  function normalizeDepartmentRatios() {
    const total = departments.value.reduce(
      (sum, d) => sum + (bonusPool.value.departmentRatios[d.id] || 0),
      0
    )
    if (total > 0) {
      for (const dept of departments.value) {
        dept.allocationRatio = round2(
          (bonusPool.value.departmentRatios[dept.id] || 0) / total
        )
        bonusPool.value.departmentRatios[dept.id] = dept.allocationRatio
      }
    }
  }

  const allEmployees = computed(() => {
    const list: Employee[] = []
    for (const dept of departments.value) {
      list.push(...dept.employees)
    }
    return list
  })

  function getPerformanceCoefficient(levelId: string): number {
    const level = performanceLevels.value.find((l) => l.id === levelId)
    return level?.coefficient ?? 1.0
  }

  function getDepartmentById(id: string): Department | undefined {
    return departments.value.find((d) => d.id === id)
  }

  function getEmployeeById(id: string): Employee | undefined {
    for (const dept of departments.value) {
      const emp = dept.employees.find((e) => e.id === id)
      if (emp) return emp
    }
    return undefined
  }

  function getEmployeeImpacts(employeeId: string): BonusImpactSource[] {
    return salaryAdjustmentImpacts.value.filter((i) => i.id.startsWith(employeeId + '_'))
  }

  function calculateWeightedBaseSalary(employee: Employee, year: number, pendingAdjustment?: { effectiveDate: string; oldSalary: number; newSalary: number }): number {
    let allImpacts = getEmployeeImpacts(employee.id)
    if (pendingAdjustment) {
      const tempImpact: BonusImpactSource = {
        id: `${employee.id}_pending_${generateId()}`,
        type: 'salary_adjustment',
        name: '待生效调薪',
        description: '待生效调薪',
        effectiveDate: pendingAdjustment.effectiveDate,
        oldValue: pendingAdjustment.oldSalary,
        newValue: pendingAdjustment.newSalary,
        impactAmount: 0
      }
      allImpacts = [...allImpacts, tempImpact]
    }
    if (allImpacts.length === 0) {
      return employee.baseSalary
    }

    const sortedImpacts = [...allImpacts].sort((a, b) =>
      dayjs(a.effectiveDate).valueOf() - dayjs(b.effectiveDate).valueOf()
    )

    const yearImpacts = sortedImpacts.filter((i) => dayjs(i.effectiveDate).year() === year)

    let salaryAtYearStart: number
    if (yearImpacts.length > 0) {
      salaryAtYearStart = yearImpacts[0].oldValue
    } else {
      salaryAtYearStart = employee.baseSalary
      for (const imp of sortedImpacts) {
        if (dayjs(imp.effectiveDate).year() < year) {
          salaryAtYearStart = imp.newValue
        }
      }
    }

    if (yearImpacts.length === 0) {
      return salaryAtYearStart
    }

    let totalWeightedSalary = 0
    let currentSalary = salaryAtYearStart
    let periodStart = dayjs(`${year}-01-01`)
    const yearEnd = dayjs(`${year}-12-31`)

    for (const impact of yearImpacts) {
      const impactDate = dayjs(impact.effectiveDate)
      if (impactDate.isAfter(yearEnd)) break

      const daysBeforeImpact = impactDate.startOf('month').diff(periodStart, 'day')
      if (daysBeforeImpact > 0) {
        totalWeightedSalary += currentSalary * daysBeforeImpact
      }
      periodStart = impactDate.startOf('month')
      currentSalary = impact.newValue
    }

    const remainingDays = yearEnd.endOf('month').diff(periodStart, 'day') + 1
    if (remainingDays > 0) {
      totalWeightedSalary += currentSalary * remainingDays
    }

    const totalDays = yearEnd.endOf('month').diff(dayjs(`${year}-01-01`), 'day') + 1
    return round2(totalWeightedSalary / totalDays)
  }

  function addSalaryAdjustmentImpact(
    employeeId: string,
    impact: Omit<BonusImpactSource, 'id' | 'type' | 'impactAmount'>
  ) {
    const emp = getEmployeeById(employeeId)
    if (!emp) return

    const oldBase = emp.baseSalary * bonusPool.value.baseRatio
    const newBase = impact.newValue * bonusPool.value.baseRatio
    const impactAmount = round2(newBase - oldBase)

    salaryAdjustmentImpacts.value.push({
      ...impact,
      id: `${employeeId}_${generateId()}`,
      type: 'salary_adjustment',
      impactAmount
    })
  }

  function removeEmployeeImpacts(employeeId: string) {
    salaryAdjustmentImpacts.value = salaryAdjustmentImpacts.value.filter(
      (i) => !i.id.startsWith(employeeId + '_')
    )
  }

  const departmentAllocations = computed(() => {
    const map: Record<string, number> = {}
    for (const dept of departments.value) {
      map[dept.id] = round2(
        bonusPool.value.totalAmount * (bonusPool.value.departmentRatios[dept.id] || 0)
      )
    }
    return map
  })

  function calculateEmployeeBaseAmount(employee: Employee, useWeighted: boolean = true, pendingAdjustment?: { effectiveDate: string; oldSalary: number; newSalary: number }): number {
    const salary = useWeighted
      ? calculateWeightedBaseSalary(employee, bonusCalculationYear.value, pendingAdjustment)
      : employee.baseSalary
    const base = salary * bonusPool.value.baseRatio
    const performance = base * getPerformanceCoefficient(employee.performanceLevelId) * bonusPool.value.performanceRatio
    const tenure = base * Math.min(employee.yearsOfService * 0.05, 0.5) * bonusPool.value.tenureRatio
    const tagBonus = base * getTagCoefficient(employee.tagIds)
    return round2(base + performance + tenure + tagBonus)
  }

  function calculateAdjustedTenureBonus(employee: Employee, adjustedBase: number, totalAdjustmentRatio: number): number {
    const adjustedTenureCoefficient = Math.min(
      employee.yearsOfService * 0.05 + totalAdjustmentRatio * 0.5,
      0.6
    )
    return round2(adjustedBase * adjustedTenureCoefficient * bonusPool.value.tenureRatio)
  }

  function calculateDynamicAnnualSalary(employee: Employee, year: number, pendingAdjustment?: { effectiveDate: string; oldSalary: number; newSalary: number }): number {
    let allImpacts = getEmployeeImpacts(employee.id)
    if (pendingAdjustment) {
      const tempImpact: BonusImpactSource = {
        id: `${employee.id}_pending_${generateId()}`,
        type: 'salary_adjustment',
        name: '待生效调薪',
        description: '待生效调薪',
        effectiveDate: pendingAdjustment.effectiveDate,
        oldValue: pendingAdjustment.oldSalary,
        newValue: pendingAdjustment.newSalary,
        impactAmount: 0
      }
      allImpacts = [...allImpacts, tempImpact]
    }

    const sortedImpacts = [...allImpacts].sort((a, b) =>
      dayjs(a.effectiveDate).valueOf() - dayjs(b.effectiveDate).valueOf()
    )

    const yearStart = dayjs(`${year}-01-01`)
    const yearEnd = dayjs(`${year}-12-31`)

    let salaryAtYearStart = employee.baseSalary
    for (const imp of sortedImpacts) {
      if (dayjs(imp.effectiveDate).year() < year) {
        salaryAtYearStart = imp.newValue
      }
    }

    const yearImpacts = sortedImpacts.filter((i) => {
      const d = dayjs(i.effectiveDate)
      return d.year() === year && !d.isAfter(yearEnd)
    })

    let total = 0
    let currentSalary = salaryAtYearStart
    let periodStart = yearStart

    for (const impact of yearImpacts) {
      const impactDate = dayjs(impact.effectiveDate).startOf('month')
      if (impactDate.isAfter(periodStart)) {
        const months = impactDate.diff(periodStart, 'month')
        if (months > 0) {
          total += currentSalary * months
        }
      }
      periodStart = impactDate
      currentSalary = impact.newValue
    }

    const remainingMonths = yearEnd.endOf('month').diff(periodStart, 'month') + 1
    if (remainingMonths > 0) {
      total += currentSalary * remainingMonths
    }

    return round2(total)
  }

  const calculationResults = computed<PersonalCalculationResult[]>(() => {
    type RawCalc = {
      employeeId: string
      employeeName: string
      departmentName: string
      baseAmount: number
      originalBaseAmount: number
      weightedBaseSalary: number
      performanceBonus: number
      tenureBonus: number
      tagBonus: number
      departmentAllocation: number
      grossBonus: number
      impactSources: BonusImpactSource[]
    }
    const rawResults: RawCalc[] = []
    const deptBaseTotals: Record<string, number> = {}

    for (const dept of departments.value) {
      let total = 0
      for (const emp of dept.employees) {
        total += calculateEmployeeBaseAmount(emp)
      }
      deptBaseTotals[dept.id] = total
    }

    for (const dept of departments.value) {
      const deptAlloc = departmentAllocations.value[dept.id] || 0
      const deptBaseTotal = deptBaseTotals[dept.id] || 1

      for (const emp of dept.employees) {
        const weightedSalary = calculateWeightedBaseSalary(emp, bonusCalculationYear.value)
        const base = weightedSalary * bonusPool.value.baseRatio
        const originalBase = emp.baseSalary * bonusPool.value.baseRatio
        const performanceBonus = round2(
          base * getPerformanceCoefficient(emp.performanceLevelId) * bonusPool.value.performanceRatio
        )
        const tenureBonus = round2(
          base * Math.min(emp.yearsOfService * 0.05, 0.5) * bonusPool.value.tenureRatio
        )
        const tagBonus = round2(base * getTagCoefficient(emp.tagIds))
        const baseAmount = round2(base + performanceBonus + tenureBonus + tagBonus)
        const scaleFactor = deptAlloc / deptBaseTotal
        const grossBonus = round2(baseAmount * scaleFactor)
        const impacts = getEmployeeImpacts(emp.id)

        const scaledImpacts = impacts.map((imp) => ({
          ...imp,
          impactAmount: round2(imp.impactAmount * scaleFactor)
        }))

        rawResults.push({
          employeeId: emp.id,
          employeeName: emp.name,
          departmentName: dept.name,
          baseAmount: round2(base),
          originalBaseAmount: round2(originalBase),
          weightedBaseSalary: weightedSalary,
          performanceBonus,
          tenureBonus,
          tagBonus,
          departmentAllocation: round2(baseAmount * (scaleFactor - 1)),
          grossBonus,
          impactSources: scaledImpacts
        })
      }
    }

    const { capEnabled, capAmount, floorEnabled, floorAmount } = bonusPool.value

    type AdjustedCalc = RawCalc & {
      originalGrossBonus: number
      adjustmentType: AdjustmentType
      adjustmentAmount: number
    }

    let redistributedPool = 0
    const adjusted: AdjustedCalc[] = rawResults.map((r) => {
      let gross = r.grossBonus
      let adjType: AdjustmentType = 'none'
      let adjAmount = 0

      if (capEnabled && gross > capAmount) {
        adjType = 'capped'
        adjAmount = capAmount - gross
        redistributedPool += gross - capAmount
        gross = capAmount
      } else if (floorEnabled && gross < floorAmount) {
        adjType = 'floored'
        adjAmount = floorAmount - gross
        redistributedPool -= floorAmount - gross
        gross = floorAmount
      }

      return {
        ...r,
        originalGrossBonus: r.grossBonus,
        adjustmentType: adjType,
        adjustmentAmount: adjAmount,
        grossBonus: gross
      }
    })

    if (Math.abs(redistributedPool) > 0.01) {
      const adjustableList = adjusted.filter((r) => r.adjustmentType === 'none')
      const adjustableTotal = adjustableList.reduce((s, r) => s + r.grossBonus, 0)

      if (adjustableList.length > 0 && adjustableTotal > 0) {
        const unit = redistributedPool / adjustableTotal
        for (const r of adjustableList) {
          const delta = round2(r.grossBonus * unit)
          r.grossBonus = round2(r.grossBonus + delta)
          r.adjustmentAmount = round2(r.adjustmentAmount + delta)
        }
      }
    }

    const results: PersonalCalculationResult[] = adjusted.map((r) => {
      const grossBonus = r.grossBonus
      const taxOneTime = round2(calculateOneTimeTax(grossBonus))
      const netBonusOneTime = round2(grossBonus - taxOneTime)

      const emp = getEmployeeById(r.employeeId)
      const ci = comprehensiveIncome.value[r.employeeId] || {
        annualSalary: emp?.baseSalary ? emp.baseSalary * 12 : 0,
        specialDeduction: 0,
        specialAdditionalDeduction: 0,
        otherDeduction: 0
      }
      const compResult = calculateComprehensiveTax(
        ci.annualSalary,
        grossBonus,
        ci.specialDeduction,
        ci.specialAdditionalDeduction,
        ci.otherDeduction
      )
      const taxComprehensive = round2(compResult.taxDifference)
      const netBonusComprehensive = round2(grossBonus - taxComprehensive)

      let betterMethod: TaxMethod = 'oneTime'
      let savedTax = 0
      if (taxOneTime < taxComprehensive) {
        betterMethod = 'oneTime'
        savedTax = round2(taxComprehensive - taxOneTime)
      } else if (taxComprehensive < taxOneTime) {
        betterMethod = 'comprehensive'
        savedTax = round2(taxOneTime - taxComprehensive)
      }

      return {
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        departmentName: r.departmentName,
        baseAmount: r.baseAmount,
        originalBaseAmount: r.originalBaseAmount,
        weightedBaseSalary: r.weightedBaseSalary,
        performanceBonus: r.performanceBonus,
        tenureBonus: r.tenureBonus,
        tagBonus: r.tagBonus,
        departmentAllocation: r.departmentAllocation,
        originalGrossBonus: r.originalGrossBonus,
        adjustmentType: r.adjustmentType,
        adjustmentAmount: r.adjustmentAmount,
        grossBonus,
        taxOneTime,
        netBonusOneTime,
        taxComprehensive,
        netBonusComprehensive,
        betterMethod,
        savedTax,
        impactSources: r.impactSources
      }
    })

    return results
  })

  const selectedEmployeeResult = computed(() => {
    if (!selectedEmployeeId.value) return null
    return calculationResults.value.find((r) => r.employeeId === selectedEmployeeId.value) || null
  })

  const totalGrossBonus = computed(() =>
    round2(calculationResults.value.reduce((s, r) => s + r.grossBonus, 0))
  )
  const totalTaxOneTime = computed(() =>
    round2(calculationResults.value.reduce((s, r) => s + r.taxOneTime, 0))
  )
  const totalTaxComprehensive = computed(() =>
    round2(calculationResults.value.reduce((s, r) => s + r.taxComprehensive, 0))
  )

  function updateDistributionRatio(levelId: string, maxRatio: number) {
    const idx = performanceDistributionRatios.value.findIndex((r) => r.levelId === levelId)
    if (idx !== -1) {
      performanceDistributionRatios.value[idx].maxRatio = maxRatio
    }
  }

  function getCalibrationEmployees(scope: CalibrationScope, scopeId: string): Employee[] {
    if (scope === 'company') {
      return allEmployees.value
    }
    const dept = departments.value.find((d) => d.id === scopeId)
    return dept ? dept.employees : []
  }

  function generateDefaultScore(employee: Employee): number {
    const levelIndex = performanceLevels.value.findIndex((l) => l.id === employee.performanceLevelId)
    const levelBase = (performanceLevels.value.length - levelIndex) * 10
    const salaryFactor = employee.baseSalary / 10000
    const tenureFactor = Math.min(employee.yearsOfService, 10) * 0.5
    let score = 80 + levelBase + salaryFactor * 0.5 + tenureFactor
    score = Math.max(0, Math.min(100, score))
    score += (Math.random() - 0.5) * 5
    score = Math.max(0, Math.min(100, score))
    return round2(score)
  }

  function startCalibration() {
    const scopeId = calibrationScope.value === 'company' ? 'company' : (calibrationDeptId.value || '')
    const scopeName = calibrationScope.value === 'company'
      ? '全公司'
      : (getDepartmentById(scopeId)?.name || '未知部门')

    const employees = getCalibrationEmployees(calibrationScope.value, scopeId)

    const calibratedEmployees: CalibrationEmployee[] = employees.map((emp, index) => {
      const level = performanceLevels.value.find((l) => l.id === emp.performanceLevelId)
      const dept = getDepartmentById(emp.departmentId)
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        departmentId: emp.departmentId,
        departmentName: dept?.name || '',
        position: emp.position,
        baseSalary: emp.baseSalary,
        currentLevelId: emp.performanceLevelId,
        currentLevelName: level?.name || '',
        currentCoefficient: level?.coefficient || 1,
        calibratedLevelId: null,
        calibratedLevelName: null,
        calibratedCoefficient: null,
        performanceScore: generateDefaultScore(emp),
        originalRank: index + 1,
        calibratedRank: null,
        changed: false
      }
    })

    calibratedEmployees.sort((a, b) => b.performanceScore - a.performanceScore)
    calibratedEmployees.forEach((emp, idx) => {
      emp.originalRank = idx + 1
    })

    const levelDistribution: Record<string, number> = {}
    for (const level of performanceLevels.value) {
      levelDistribution[level.id] = 0
    }
    for (const emp of calibratedEmployees) {
      if (levelDistribution[emp.currentLevelId] !== undefined) {
        levelDistribution[emp.currentLevelId]++
      }
    }

    currentCalibration.value = {
      id: generateId(),
      year: calibrationYear.value,
      half: calibrationHalf.value,
      scope: calibrationScope.value,
      scopeId,
      scopeName,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      appliedAt: null,
      status: 'draft',
      totalEmployees: calibratedEmployees.length,
      levelDistribution,
      employees: calibratedEmployees
    }

    executeCalibration()
  }

  function executeCalibration() {
    if (!currentCalibration.value) return

    const employees = [...currentCalibration.value.employees]
    const totalCount = employees.length

    employees.sort((a, b) => b.performanceScore - a.performanceScore)

    const levelInfoList: { levelId: string; levelName: string; coefficient: number; ratio: number; baseQuota: number; finalQuota: number }[] = []
    for (const ratio of performanceDistributionRatios.value) {
      const level = performanceLevels.value.find((l) => l.id === ratio.levelId)
      if (level) {
        levelInfoList.push({
          levelId: level.id,
          levelName: level.name,
          coefficient: level.coefficient,
          ratio: ratio.maxRatio,
          baseQuota: Math.floor(totalCount * ratio.maxRatio),
          finalQuota: 0
        })
      }
    }

    levelInfoList.sort((a, b) => b.coefficient - a.coefficient)

    const sumBaseQuota = levelInfoList.reduce((s, l) => s + l.baseQuota, 0)
    let remainder = totalCount - sumBaseQuota

    levelInfoList.forEach((info) => {
      info.finalQuota = info.baseQuota
    })

    let levelCursor = 0
    while (remainder > 0 && levelInfoList.length > 0) {
      levelInfoList[levelCursor % levelInfoList.length].finalQuota += 1
      remainder -= 1
      levelCursor += 1
    }

    const assignedLevelIds: string[] = []
    for (const levelInfo of levelInfoList) {
      for (let i = 0; i < levelInfo.finalQuota; i++) {
        assignedLevelIds.push(levelInfo.levelId)
      }
    }

    for (let i = 0; i < totalCount && i < assignedLevelIds.length; i++) {
      const emp = employees[i]
      const levelId = assignedLevelIds[i]
      const levelInfo = levelInfoList.find((l) => l.levelId === levelId)
      if (levelInfo) {
        emp.calibratedLevelId = levelInfo.levelId
        emp.calibratedLevelName = levelInfo.levelName
        emp.calibratedCoefficient = levelInfo.coefficient
        emp.calibratedRank = i + 1
        emp.changed = emp.currentLevelId !== levelInfo.levelId
      }
    }

    if (totalCount > assignedLevelIds.length && levelInfoList.length > 0) {
      const firstLevel = levelInfoList[0]
      for (let i = assignedLevelIds.length; i < totalCount; i++) {
        const emp = employees[i]
        emp.calibratedLevelId = firstLevel.levelId
        emp.calibratedLevelName = firstLevel.levelName
        emp.calibratedCoefficient = firstLevel.coefficient
        emp.calibratedRank = i + 1
        emp.changed = emp.currentLevelId !== firstLevel.levelId
      }
    }

    const levelDistribution: Record<string, number> = {}
    for (const level of performanceLevels.value) {
      levelDistribution[level.id] = 0
    }
    for (const emp of employees) {
      if (emp.calibratedLevelId && levelDistribution[emp.calibratedLevelId] !== undefined) {
        levelDistribution[emp.calibratedLevelId]++
      }
    }

    currentCalibration.value.employees = employees
    currentCalibration.value.levelDistribution = levelDistribution
  }

  function updateEmployeeScore(employeeId: string, score: number) {
    if (!currentCalibration.value) return
    const emp = currentCalibration.value.employees.find((e) => e.employeeId === employeeId)
    if (emp) {
      emp.performanceScore = Math.max(0, Math.min(100, score))
      executeCalibration()
    }
  }

  function adjustEmployeeLevel(employeeId: string, newLevelId: string) {
    if (!currentCalibration.value) return

    const emp = currentCalibration.value.employees.find((e) => e.employeeId === employeeId)
    if (!emp) return

    const newLevel = performanceLevels.value.find((l) => l.id === newLevelId)
    if (!newLevel) return

    emp.calibratedLevelId = newLevel.id
    emp.calibratedLevelName = newLevel.name
    emp.calibratedCoefficient = newLevel.coefficient
    emp.changed = emp.currentLevelId !== newLevel.id

    const levelDistribution: Record<string, number> = {}
    for (const level of performanceLevels.value) {
      levelDistribution[level.id] = 0
    }
    for (const e of currentCalibration.value.employees) {
      if (e.calibratedLevelId && levelDistribution[e.calibratedLevelId] !== undefined) {
        levelDistribution[e.calibratedLevelId]++
      }
    }
    currentCalibration.value.levelDistribution = levelDistribution
  }

  function confirmCalibration() {
    if (!currentCalibration.value) return
    currentCalibration.value.status = 'confirmed'
  }

  async function applyCalibration() {
    if (!currentCalibration.value || currentCalibration.value.status === 'draft') return

    for (const emp of currentCalibration.value.employees) {
      if (emp.calibratedLevelId) {
        updateEmployee(emp.employeeId, { performanceLevelId: emp.calibratedLevelId })
      }
    }

    currentCalibration.value.status = 'applied'
    currentCalibration.value.appliedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')

    calibrationResults.value.push({ ...currentCalibration.value })

    const { useSalaryAdjustmentStore } = await import('@/stores/salaryAdjustment')
    const salaryStore = useSalaryAdjustmentStore()
    const employeesForHistory = currentCalibration.value.employees.map((emp) => ({
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      departmentName: emp.departmentName,
      calibratedLevelId: emp.calibratedLevelId,
      calibratedLevelName: emp.calibratedLevelName,
      calibratedCoefficient: emp.calibratedCoefficient,
      currentLevelId: emp.currentLevelId,
      currentLevelName: emp.currentLevelName,
      currentCoefficient: emp.currentCoefficient
    }))
    salaryStore.addPerformanceRecordsFromCalibration(
      currentCalibration.value.year,
      currentCalibration.value.half,
      employeesForHistory
    )
  }

  function saveCalibration() {
    if (!currentCalibration.value) return
    const existingIdx = calibrationResults.value.findIndex((c) => c.id === currentCalibration.value!.id)
    if (existingIdx !== -1) {
      calibrationResults.value[existingIdx] = { ...currentCalibration.value }
    } else {
      calibrationResults.value.push({ ...currentCalibration.value })
    }
  }

  function getCalibrationDistributionStats() {
    if (!currentCalibration.value) return []

    return performanceDistributionRatios.value.map((ratio) => {
      const level = performanceLevels.value.find((l) => l.id === ratio.levelId)
      const count = currentCalibration.value!.levelDistribution[ratio.levelId] || 0
      const total = currentCalibration.value!.totalEmployees
      const actualRatio = total > 0 ? count / total : 0
      const overLimit = actualRatio > ratio.maxRatio
      return {
        levelId: ratio.levelId,
        levelName: ratio.levelName,
        maxRatio: ratio.maxRatio,
        actualCount: count,
        actualRatio,
        overLimit,
        coefficient: level?.coefficient || 0
      }
    })
  }

  function exportData(): AppData {
    return {
      performanceLevels: performanceLevels.value,
      employeeTags: employeeTags.value,
      departments: departments.value,
      bonusPool: bonusPool.value,
      comprehensiveIncome: comprehensiveIncome.value,
      performanceDistributionRatios: performanceDistributionRatios.value,
      calibrationResults: calibrationResults.value,
      bonusPlanVersions: bonusPlanVersions.value,
      versionApprovalRecords: versionApprovalRecords.value,
      salaryAdjustmentImpacts: salaryAdjustmentImpacts.value,
      sandboxScenarios: sandboxScenarios.value,
      activeSandboxScenarioIds: activeSandboxScenarioIds.value,
      bonusConfirmations: bonusConfirmations.value,
      bonusConfirmationBatches: bonusConfirmationBatches.value,
      bonusSignVouchers: bonusSignVouchers.value
    }
  }

  function importData(data: AppData): boolean {
    try {
      if (!data.performanceLevels || !data.departments || !data.bonusPool) {
        return false
      }
      performanceLevels.value = data.performanceLevels
      employeeTags.value = data.employeeTags || []
      departments.value = data.departments.map((d) => ({
        ...d,
        employees: d.employees.map((e) => ({
          ...e,
          tagIds: e.tagIds || []
        }))
      }))
      bonusPool.value = data.bonusPool
      comprehensiveIncome.value = data.comprehensiveIncome || {}
      if (data.performanceDistributionRatios && data.performanceDistributionRatios.length > 0) {
        performanceDistributionRatios.value = data.performanceDistributionRatios
      } else {
        initDistributionRatios()
      }
      calibrationResults.value = data.calibrationResults || []
      bonusPlanVersions.value = data.bonusPlanVersions || []
      versionApprovalRecords.value = data.versionApprovalRecords || []
      salaryAdjustmentImpacts.value = data.salaryAdjustmentImpacts || []
      if (data.sandboxScenarios && data.sandboxScenarios.length > 0) {
        sandboxScenarios.value = data.sandboxScenarios
        activeSandboxScenarioIds.value = data.activeSandboxScenarioIds || sandboxScenarios.value.filter(s => s.isBaseline).map(s => s.id)
      }
      bonusConfirmations.value = data.bonusConfirmations || []
      bonusConfirmationBatches.value = data.bonusConfirmationBatches || []
      bonusSignVouchers.value = data.bonusSignVouchers || []
      currentCalibration.value = null
      selectedEmployeeId.value = departments.value[0]?.employees[0]?.id || null
      return true
    } catch {
      return false
    }
  }

  const bonusPlanVersions = ref<BonusPlanVersion[]>([])
  const versionApprovalRecords = ref<VersionApprovalRecord[]>([])

  function generateVersionNo(): string {
    if (bonusPlanVersions.value.length === 0) return 'v1.0.0'
    const maxVersion = bonusPlanVersions.value.reduce((max, v) => {
      const num = parseInt(v.versionNo.replace('v', '').split('.')[0])
      return num > max ? num : max
    }, 0)
    return `v${maxVersion + 1}.0.0`
  }

  function createVersion(data: { name: string; description?: string; changeSummary: string }): BonusPlanVersion {
    const snapshot: BonusPlanVersionSnapshot = {
      bonusPool: JSON.parse(JSON.stringify(bonusPool.value)),
      departments: JSON.parse(JSON.stringify(departments.value)),
      performanceLevels: JSON.parse(JSON.stringify(performanceLevels.value)),
      performanceDistributionRatios: JSON.parse(JSON.stringify(performanceDistributionRatios.value)),
      employeeTags: JSON.parse(JSON.stringify(employeeTags.value))
    }
    const version: BonusPlanVersion = {
      id: generateId(),
      versionNo: generateVersionNo(),
      name: data.name,
      description: data.description || '',
      snapshot,
      status: 'draft',
      createdBy: '系统管理员',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      changeSummary: data.changeSummary,
      isCurrent: bonusPlanVersions.value.length === 0
    }
    bonusPlanVersions.value.push(version)
    return version
  }

  function getCurrentVersion(): BonusPlanVersion | null {
    return bonusPlanVersions.value.find((v) => v.isCurrent) || null
  }

  function getVersionById(versionId: string): BonusPlanVersion | undefined {
    return bonusPlanVersions.value.find((v) => v.id === versionId)
  }

  function getApprovalRecordsByVersionId(versionId: string): VersionApprovalRecord[] {
    return versionApprovalRecords.value.filter((r) => r.versionId === versionId)
  }

  function compareWithCurrent(versionId: string): BonusPlanVersionDiff[] {
    const current = getCurrentVersion()
    if (!current) return []
    return compareVersions(current.id, versionId) || []
  }

  function deepCompare(obj1: any, obj2: any, path: string = '', label: string = ''): BonusPlanVersionDiff[] {
    const diffs: BonusPlanVersionDiff[] = []
    if (obj1 === null && obj2 === null) return diffs
    if (obj1 === null || obj2 === null) {
      diffs.push({
        field: path,
        label: label || path,
        oldValue: obj1,
        newValue: obj2,
        changeType: obj1 === null ? 'added' : 'removed',
        path
      })
      return diffs
    }
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
      diffs.push({
        field: path,
        label: label || path,
        oldValue: obj1,
        newValue: obj2,
        changeType: obj1 === obj2 ? 'unchanged' : 'modified',
        path
      })
      return diffs
    }
    if (Array.isArray(obj1) || Array.isArray(obj2)) {
      const arr1 = Array.isArray(obj1) ? obj1 : []
      const arr2 = Array.isArray(obj2) ? obj2 : []
      diffs.push({
        field: path,
        label: label || path,
        oldValue: arr1,
        newValue: arr2,
        changeType: JSON.stringify(arr1) === JSON.stringify(arr2) ? 'unchanged' : 'modified',
        path
      })
      return diffs
    }
    const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)])
    for (const key of keys) {
      const newPath = path ? `${path}.${key}` : key
      diffs.push(...deepCompare(obj1[key], obj2[key], newPath, key))
    }
    return diffs
  }

  function compareVersions(versionId1: string, versionId2: string): BonusPlanVersionDiff[] | null {
    const v1 = getVersionById(versionId1)
    const v2 = getVersionById(versionId2)
    if (!v1 || !v2) return null
    const diffs: BonusPlanVersionDiff[] = []
    const s1 = v1.snapshot
    const s2 = v2.snapshot
    diffs.push(...deepCompare(s1.bonusPool, s2.bonusPool, 'bonusPool', '奖金池配置'))
    diffs.push(...deepCompare(s1.performanceLevels, s2.performanceLevels, 'performanceLevels', '绩效等级'))
    const deptRatios1 = s1.departments.map((d: Department) => ({ id: d.id, name: d.name, allocationRatio: d.allocationRatio }))
    const deptRatios2 = s2.departments.map((d: Department) => ({ id: d.id, name: d.name, allocationRatio: d.allocationRatio }))
    diffs.push(...deepCompare(deptRatios1, deptRatios2, 'departmentAllocations', '部门分配比例'))
    diffs.push(...deepCompare(s1.employeeTags, s2.employeeTags, 'employeeTags', '员工标签系数'))
    return diffs
  }

  function submitVersionForApproval(versionId: string): boolean {
    const version = getVersionById(versionId)
    if (!version || version.status !== 'draft') return false
    const prevStatus = version.status
    version.status = 'pending_approval'
    version.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
    versionApprovalRecords.value.push({
      id: generateId(),
      versionId,
      action: 'submit',
      operatorName: '系统管理员',
      comment: '提交审批',
      operatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      previousStatus: prevStatus,
      newStatus: version.status
    })
    return true
  }

  function applyVersionSnapshot(version: BonusPlanVersion) {
    const s = version.snapshot
    bonusPool.value = JSON.parse(JSON.stringify(s.bonusPool))
    performanceLevels.value = JSON.parse(JSON.stringify(s.performanceLevels))
    employeeTags.value = JSON.parse(JSON.stringify(s.employeeTags))
    if (s.performanceDistributionRatios && s.performanceDistributionRatios.length > 0) {
      performanceDistributionRatios.value = JSON.parse(JSON.stringify(s.performanceDistributionRatios))
    }
    const deptMap: Record<string, Department> = {}
    for (const d of s.departments) {
      deptMap[d.id] = JSON.parse(JSON.stringify(d))
    }
    departments.value = departments.value.map((d) => {
      if (deptMap[d.id]) {
        return { ...deptMap[d.id], employees: d.employees }
      }
      return d
    })
  }

  function approveVersion(versionId: string, comment?: string): boolean {
    const version = getVersionById(versionId)
    if (!version || version.status !== 'pending_approval') return false
    const prevStatus = version.status
    version.status = 'approved'
    version.approvedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
    version.approvedBy = '系统管理员'
    version.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
    for (const v of bonusPlanVersions.value) {
      v.isCurrent = false
    }
    version.isCurrent = true
    applyVersionSnapshot(version)
    versionApprovalRecords.value.push({
      id: generateId(),
      versionId,
      action: 'approve',
      operatorName: '系统管理员',
      comment: comment || '审批通过',
      operatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      previousStatus: prevStatus,
      newStatus: version.status
    })
    return true
  }

  function rejectVersion(versionId: string, reason: string): boolean {
    const version = getVersionById(versionId)
    if (!version || version.status !== 'pending_approval') return false
    const prevStatus = version.status
    version.status = 'rejected'
    version.rejectionReason = reason
    version.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
    versionApprovalRecords.value.push({
      id: generateId(),
      versionId,
      action: 'reject',
      operatorName: '系统管理员',
      comment: reason,
      operatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      previousStatus: prevStatus,
      newStatus: version.status
    })
    return true
  }

  function rollbackToVersion(versionId: string, reason: string): boolean {
    const sourceVersion = getVersionById(versionId)
    if (!sourceVersion) return false
    const newVersion: BonusPlanVersion = {
      id: generateId(),
      versionNo: generateVersionNo(),
      name: `回滚-${sourceVersion.name}`,
      description: reason,
      snapshot: JSON.parse(JSON.stringify(sourceVersion.snapshot)),
      status: 'approved',
      createdBy: '系统管理员',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      approvedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      approvedBy: '系统管理员',
      changeSummary: `回滚到版本 ${sourceVersion.versionNo}：${reason}`,
      isCurrent: true,
      rollbackFromVersionId: versionId
    }
    for (const v of bonusPlanVersions.value) {
      v.isCurrent = false
    }
    bonusPlanVersions.value.push(newVersion)
    applyVersionSnapshot(newVersion)
    versionApprovalRecords.value.push({
      id: generateId(),
      versionId: newVersion.id,
      action: 'rollback',
      operatorName: '系统管理员',
      comment: reason,
      operatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      previousStatus: 'draft',
      newStatus: 'approved'
    })
    return true
  }

  function deleteVersion(versionId: string): boolean {
    const version = getVersionById(versionId)
    if (!version || version.isCurrent) return false
    if (version.status !== 'draft' && version.status !== 'rejected') return false
    bonusPlanVersions.value = bonusPlanVersions.value.filter((v) => v.id !== versionId)
    versionApprovalRecords.value = versionApprovalRecords.value.filter((r) => r.versionId !== versionId)
    return true
  }

  const bonusConfirmations = ref<BonusConfirmationRecord[]>([])
  const bonusConfirmationBatches = ref<BonusConfirmationBatch[]>([])
  const bonusSignVouchers = ref<BonusSignVoucher[]>([])

  let voucherCounter = 0
  function generateVoucherNo(year: number, batchName: string): string {
    voucherCounter++
    const batchCode = batchName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').slice(0, 4).toUpperCase() || 'BONUS'
    const seq = voucherCounter.toString().padStart(6, '0')
    return `BSV-${year}-${batchCode}-${seq}`
  }

  function createConfirmationBatch(data: { name: string; year: number; bonusName: string; deadlineDays: number }): BonusConfirmationBatch {
    const batch: BonusConfirmationBatch = {
      id: generateId(),
      name: data.name,
      year: data.year,
      bonusName: data.bonusName,
      status: 'draft',
      deadlineDays: data.deadlineDays,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      totalConfirmations: allEmployees.value.length,
      signedCount: 0,
      objectedCount: 0,
      pendingCount: 0,
      timeoutCount: 0
    }
    bonusConfirmationBatches.value.push(batch)
    return batch
  }

  function publishConfirmationBatch(batchId: string): boolean {
    const batch = bonusConfirmationBatches.value.find((b) => b.id === batchId)
    if (!batch || batch.status !== 'draft') return false
    batch.status = 'published'
    batch.publishedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
    let pendingCount = 0
    for (const result of calculationResults.value) {
      const emp = getEmployeeById(result.employeeId)
      const dept = emp ? getDepartmentById(emp.departmentId) : null
      const record: BonusConfirmationRecord = {
        id: generateId(),
        batchId,
        employeeId: result.employeeId,
        employeeName: result.employeeName,
        departmentId: emp?.departmentId || '',
        departmentName: dept?.name || result.departmentName,
        position: emp?.position || '',
        grossAmount: result.grossBonus,
        taxAmount: result.taxOneTime,
        netAmount: result.netBonusOneTime,
        taxMethod: result.betterMethod,
        status: 'pending',
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        deadlineAt: dayjs().add(batch.deadlineDays, 'day').format('YYYY-MM-DD HH:mm:ss'),
        reminderCount: 0,
        year: batch.year,
        bonusName: batch.bonusName
      }
      bonusConfirmations.value.push(record)
      pendingCount++
    }
    batch.pendingCount = pendingCount
    return true
  }

  function deleteConfirmationBatch(batchId: string): boolean {
    const batch = bonusConfirmationBatches.value.find((b) => b.id === batchId)
    if (!batch || batch.status !== 'draft') return false
    bonusConfirmationBatches.value = bonusConfirmationBatches.value.filter((b) => b.id !== batchId)
    bonusConfirmations.value = bonusConfirmations.value.filter((c) => c.batchId !== batchId)
    return true
  }

  function checkTimeouts(): void {
    const now = dayjs()
    for (const record of bonusConfirmations.value) {
      if (record.status === 'pending' && now.isAfter(dayjs(record.deadlineAt))) {
        const prevStatus = record.status
        record.status = 'timeout'
        record.timeoutNotifiedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
        updateBatchStats(record.batchId, prevStatus, 'timeout')
        checkBatchCompletion(record.batchId)
      }
    }
  }

  function checkBatchCompletion(batchId: string): void {
    const batch = bonusConfirmationBatches.value.find((b) => b.id === batchId)
    if (!batch || batch.status !== 'published') return
    const batchConfirmations = bonusConfirmations.value.filter((c) => c.batchId === batchId)
    if (batchConfirmations.length === 0) return
    const pendingCount = batchConfirmations.filter((c) => c.status === 'pending').length
    const processingCount = batchConfirmations.filter((c) => c.status === 'objected' || c.status === 'reviewing').length
    if (pendingCount === 0 && processingCount === 0) {
      batch.status = 'completed'
      batch.completedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
  }

  function getConfirmationsByBatch(batchId: string): BonusConfirmationRecord[] {
    return bonusConfirmations.value.filter((c) => c.batchId === batchId)
  }

  function getConfirmationById(recordId: string): BonusConfirmationRecord | undefined {
    return bonusConfirmations.value.find((c) => c.id === recordId)
  }

  function getConfirmationStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: '待确认',
      signed: '已签收',
      objected: '已申诉',
      reviewing: '复核中',
      resolved_confirmed: '复核通过(维持)',
      resolved_adjusted: '复核通过(已调整)',
      expired: '已逾期',
      timeout: '已逾期'
    }
    return map[status] || status
  }

  function getConfirmationStatusColor(status: string): string {
    const map: Record<string, string> = {
      pending: 'warning',
      signed: 'success',
      objected: 'error',
      reviewing: 'info',
      resolved_confirmed: 'success',
      resolved_adjusted: 'success',
      expired: 'default',
      timeout: 'default'
    }
    return map[status] || 'default'
  }

  function updateBatchStats(batchId: string, prevStatus: string, newStatus: string) {
    const batch = bonusConfirmationBatches.value.find((b) => b.id === batchId)
    if (!batch) return
    const decrMap: Record<string, keyof BonusConfirmationBatch> = {
      pending: 'pendingCount',
      signed: 'signedCount',
      objected: 'objectedCount',
      timeout: 'timeoutCount'
    }
    const incrMap: Record<string, keyof BonusConfirmationBatch> = {
      pending: 'pendingCount',
      signed: 'signedCount',
      objected: 'objectedCount',
      timeout: 'timeoutCount'
    }
    const decrKey = decrMap[prevStatus]
    const incrKey = incrMap[newStatus]
    if (decrKey) (batch[decrKey] as number) = Math.max(0, (batch[decrKey] as number) - 1)
    if (incrKey) (batch[incrKey] as number) = (batch[incrKey] as number) + 1
  }

  function signBonus(recordId: string, signatureName: string): boolean {
    const record = getConfirmationById(recordId)
    if (!record || record.status !== 'pending') return false
    const prevStatus = record.status
    record.status = 'signed'
    record.signedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
    record.signature = signatureName
    updateBatchStats(record.batchId, prevStatus, 'signed')
    const voucher = createSignVoucher(recordId)
    if (voucher) {
      record.signVoucherId = voucher.id
    }
    checkBatchCompletion(record.batchId)
    return true
  }

  function createSignVoucher(recordId: string): BonusSignVoucher | null {
    const record = getConfirmationById(recordId)
    if (!record || record.status !== 'signed' || !record.signedAt || !record.signature) {
      return null
    }
    const batch = bonusConfirmationBatches.value.find((b) => b.id === record.batchId)
    const voucher: BonusSignVoucher = {
      id: generateId(),
      confirmationRecordId: record.id,
      batchId: record.batchId,
      employeeId: record.employeeId,
      employeeName: record.employeeName,
      departmentName: record.departmentName,
      position: record.position,
      year: record.year,
      bonusName: record.bonusName,
      grossAmount: record.grossAmount,
      taxAmount: record.taxAmount,
      netAmount: record.netAmount,
      taxMethod: record.taxMethod,
      signature: record.signature,
      signedAt: record.signedAt,
      voucherNo: generateVoucherNo(record.year, batch?.name || ''),
      generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      archivedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      batchName: batch?.name || ''
    }
    bonusSignVouchers.value.push(voucher)
    return voucher
  }

  function submitObjection(recordId: string, reason: string, description: string, attachments: string[]): boolean {
    const record = getConfirmationById(recordId)
    if (!record || record.status !== 'pending') return false
    const prevStatus = record.status
    record.status = 'objected'
    record.objection = {
      id: generateId(),
      reason,
      description,
      attachments,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      objectorName: record.employeeName
    }
    updateBatchStats(record.batchId, prevStatus, 'objected')
    return true
  }

  function startReview(recordId: string): boolean {
    const record = getConfirmationById(recordId)
    if (!record || record.status !== 'objected') return false
    record.status = 'reviewing'
    return true
  }

  function completeReview(recordId: string, result: 'confirmed' | 'adjusted', comment: string, adjustedAmounts?: { grossAmount: number; taxAmount: number; netAmount: number }): boolean {
    const record = getConfirmationById(recordId)
    if (!record || record.status !== 'reviewing') return false
    record.status = result === 'confirmed' ? 'resolved_confirmed' : 'resolved_adjusted'
    record.review = {
      id: generateId(),
      result,
      comment,
      reviewerName: '系统管理员',
      reviewedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      adjustedGrossAmount: adjustedAmounts?.grossAmount,
      adjustedTaxAmount: adjustedAmounts?.taxAmount,
      adjustedNetAmount: adjustedAmounts?.netAmount
    }
    if (result === 'adjusted' && adjustedAmounts) {
      record.grossAmount = adjustedAmounts.grossAmount
      record.taxAmount = adjustedAmounts.taxAmount
      record.netAmount = adjustedAmounts.netAmount
    }
    record.status = 'signed'
    record.signedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
    record.signature = record.employeeName
    updateBatchStats(record.batchId, 'reviewing', 'signed')
    const voucher = createSignVoucher(recordId)
    if (voucher) {
      record.signVoucherId = voucher.id
    }
    checkBatchCompletion(record.batchId)
    return true
  }

  function sendReminder(recordId: string): boolean {
    const record = getConfirmationById(recordId)
    if (!record || record.status !== 'pending') return false
    record.reminderCount++
    record.lastReminderAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
    return true
  }

  function getVoucherById(voucherId: string): BonusSignVoucher | undefined {
    return bonusSignVouchers.value.find((v) => v.id === voucherId)
  }

  function getVoucherByRecordId(recordId: string): BonusSignVoucher | undefined {
    return bonusSignVouchers.value.find((v) => v.confirmationRecordId === recordId)
  }

  function getVouchersByEmployeeId(employeeId: string): BonusSignVoucher[] {
    return bonusSignVouchers.value
      .filter((v) => v.employeeId === employeeId)
      .sort((a, b) => dayjs(b.signedAt).valueOf() - dayjs(a.signedAt).valueOf())
  }

  function getVouchersByBatchId(batchId: string): BonusSignVoucher[] {
    return bonusSignVouchers.value
      .filter((v) => v.batchId === batchId)
      .sort((a, b) => dayjs(b.signedAt).valueOf() - dayjs(a.signedAt).valueOf())
  }

  function formatVoucherMoney(n: number): string {
    return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  function generateVoucherHtml(voucher: BonusSignVoucher): string {
    const taxMethodLabel = voucher.taxMethod === 'oneTime' ? '单独计税' : '综合计税'
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>奖金签收凭证-${voucher.voucherNo}</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; color: #262626; line-height: 1.8; font-size: 14px; background: #fff; }
  .voucher-container { max-width: 720px; margin: 0 auto; }
  .voucher-header { text-align: center; padding: 24px 0 16px; border-bottom: 2px solid #2080f0; margin-bottom: 24px; }
  .voucher-header h1 { font-size: 24px; color: #2080f0; margin-bottom: 8px; }
  .voucher-header .voucher-no { font-size: 13px; color: #8c8c8c; letter-spacing: 1px; }
  .section-title { font-size: 16px; font-weight: 600; color: #262626; margin: 20px 0 12px; padding-left: 10px; border-left: 4px solid #2080f0; }
  .info-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .info-table td { padding: 10px 12px; border: 1px solid #e8e8e8; font-size: 13px; }
  .info-table .label { background: #fafafa; color: #595959; width: 120px; font-weight: 500; }
  .info-table .value { color: #262626; }
  .amount-section { background: linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%); border-radius: 8px; padding: 24px; margin: 20px 0; }
  .amount-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: center; }
  .amount-item .amount-label { font-size: 13px; color: #8c8c8c; margin-bottom: 6px; }
  .amount-item .amount-value { font-size: 22px; font-weight: 700; color: #262626; }
  .amount-item.gross .amount-value { color: #1890ff; }
  .amount-item.tax .amount-value { color: #f5222d; }
  .amount-item.net .amount-value { color: #52c41a; }
  .confirm-section { background: #fffbe6; border: 1px dashed #ffe58f; border-radius: 8px; padding: 20px; margin: 24px 0; }
  .confirm-section .confirm-text { font-size: 14px; color: #8c8c8c; margin-bottom: 8px; }
  .confirm-section .confirm-statement { font-size: 15px; color: #262626; line-height: 1.9; }
  .signature-section { margin-top: 40px; padding-top: 24px; border-top: 1px solid #e8e8e8; }
  .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  .signature-item { text-align: center; }
  .signature-item .signature-label { font-size: 13px; color: #8c8c8c; margin-bottom: 8px; }
  .signature-item .signature-value { font-size: 20px; font-weight: 600; color: #262626; padding: 12px 0; border-bottom: 1px solid #262626; min-height: 48px; }
  .signature-item .signature-date { font-size: 12px; color: #8c8c8c; margin-top: 6px; }
  .watermark { text-align: center; color: #bfbfbf; font-size: 11px; margin-top: 40px; padding-top: 16px; border-top: 1px dashed #e8e8e8; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="voucher-container">
  <div class="voucher-header">
    <h1>奖金电子签收凭证</h1>
    <div class="voucher-no">凭证编号：${voucher.voucherNo}</div>
  </div>

  <div class="section-title">员工信息</div>
  <table class="info-table">
    <tr>
      <td class="label">员工姓名</td>
      <td class="value"><strong>${voucher.employeeName}</strong></td>
      <td class="label">所属部门</td>
      <td class="value">${voucher.departmentName}</td>
    </tr>
    <tr>
      <td class="label">职　　位</td>
      <td class="value">${voucher.position}</td>
      <td class="label">奖金属期</td>
      <td class="value">${voucher.year}年度</td>
    </tr>
  </table>

  <div class="section-title">奖金信息</div>
  <table class="info-table">
    <tr>
      <td class="label">奖金名称</td>
      <td class="value"><strong>${voucher.bonusName}</strong></td>
      <td class="label">所属批次</td>
      <td class="value">${voucher.batchName}</td>
    </tr>
    <tr>
      <td class="label">计税方式</td>
      <td class="value">${taxMethodLabel}</td>
      <td class="label">生成时间</td>
      <td class="value">${voucher.generatedAt}</td>
    </tr>
  </table>

  <div class="section-title">奖金金额明细</div>
  <div class="amount-section">
    <div class="amount-grid">
      <div class="amount-item gross">
        <div class="amount-label">税前奖金总额</div>
        <div class="amount-value">${formatVoucherMoney(voucher.grossAmount)}</div>
      </div>
      <div class="amount-item tax">
        <div class="amount-label">应扣个人所得税</div>
        <div class="amount-value">${formatVoucherMoney(voucher.taxAmount)}</div>
      </div>
      <div class="amount-item net">
        <div class="amount-label">税后实发奖金</div>
        <div class="amount-value">${formatVoucherMoney(voucher.netAmount)}</div>
      </div>
    </div>
  </div>

  <div class="confirm-section">
    <div class="confirm-text">签收确认声明：</div>
    <div class="confirm-statement">
      本人已仔细核对上述奖金明细，确认奖金金额计算方式、计税方式及最终金额均准确无误，无任何异议。
      本人同意按照上述金额领取奖金，并确认此电子签收凭证具有与纸质签收同等法律效力。
    </div>
  </div>

  <div class="signature-section">
    <div class="signature-grid">
      <div class="signature-item">
        <div class="signature-label">员工电子签名</div>
        <div class="signature-value">${voucher.signature}</div>
        <div class="signature-date">签收日期：${voucher.signedAt}</div>
      </div>
      <div class="signature-item">
        <div class="signature-label">归档状态</div>
        <div class="signature-value" style="font-size:16px;color:#52c41a">已归档 ✓</div>
        <div class="signature-date">归档日期：${voucher.archivedAt}</div>
      </div>
    </div>
  </div>

  <div class="watermark">
    本凭证由系统自动生成 · 生成时间 ${now} · 凭证编号 ${voucher.voucherNo}
  </div>
</div>
</body>
</html>`
  }

  function exportVoucherPdf(voucherId: string): boolean {
    const voucher = getVoucherById(voucherId)
    if (!voucher) return false
    const html = generateVoucherHtml(voucher)
    const printWindow = window.open('', '_blank')
    if (!printWindow) return false
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.document.title = `奖金签收凭证-${voucher.voucherNo}`
      setTimeout(() => {
        printWindow.print()
      }, 300)
    }
    return true
  }

  function exportVoucherHtml(voucherId: string): boolean {
    const voucher = getVoucherById(voucherId)
    if (!voucher) return false
    const html = generateVoucherHtml(voucher)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `奖金签收凭证_${voucher.employeeName}_${voucher.voucherNo}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return true
  }

  function batchExportVouchersByBatch(batchId: string, format: 'html' | 'summary' | 'csv' | 'all_csv' = 'html'): { success: number; total: number } {
    const vouchers = getVouchersByBatchId(batchId)
    if (vouchers.length === 0) return { success: 0, total: 0 }

    if (format === 'summary') {
      const batch = bonusConfirmationBatches.value.find((b) => b.id === batchId)
      const summaryHtml = generateBatchSummaryHtml(batchId, vouchers, batch)
      const blob = new Blob([summaryHtml], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `奖金签收汇总_${batch?.name || batchId}_${dayjs().format('YYYYMMDD')}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      return { success: vouchers.length, total: vouchers.length }
    }

    if (format === 'csv' || format === 'all_csv') {
      const csv = generateBatchSummaryCsv(batchId, vouchers)
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const batch = bonusConfirmationBatches.value.find((b) => b.id === batchId)
      a.href = url
      a.download = `奖金签收汇总表_${batch?.name || batchId}_${dayjs().format('YYYYMMDD')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      return { success: vouchers.length, total: vouchers.length }
    }

    let successCount = 0
    vouchers.forEach((voucher, index) => {
      setTimeout(() => {
        const html = generateVoucherHtml(voucher)
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `奖金签收凭证_${String(index + 1).padStart(3, '0')}_${voucher.employeeName}_${voucher.voucherNo}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, index * 200)
      successCount++
    })
    return { success: successCount, total: vouchers.length }
  }

  function generateBatchSummaryCsv(batchId: string, vouchers: BonusSignVoucher[]): string {
    const batch = bonusConfirmationBatches.value.find((b) => b.id === batchId)
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const totalGross = vouchers.reduce((s, v) => s + v.grossAmount, 0)
    const totalTax = vouchers.reduce((s, v) => s + v.taxAmount, 0)
    const totalNet = vouchers.reduce((s, v) => s + v.netAmount, 0)

    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return ''
      const str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const lines: string[] = []

    lines.push('奖金签收凭证汇总表')
    lines.push(`生成时间,${escapeCsv(now)}`)
    lines.push(`批次名称,${escapeCsv(batch?.name || '-')}`)
    lines.push(`奖金名称,${escapeCsv(batch?.bonusName || '-')}`)
    lines.push(`年度,${escapeCsv(batch?.year || '-')}`)
    lines.push(`发布时间,${escapeCsv(batch?.publishedAt?.slice(0, 10) || '-')}`)
    lines.push('')
    lines.push(`签收凭证数量,${vouchers.length}`)
    lines.push(`税前奖金合计,${escapeCsv(formatVoucherMoney(totalGross))}`)
    lines.push(`个税合计,${escapeCsv(formatVoucherMoney(totalTax))}`)
    lines.push(`税后实发合计,${escapeCsv(formatVoucherMoney(totalNet))}`)
    lines.push('')
    lines.push('序号,凭证编号,员工姓名,部门,职位,税前金额,个税,税后实发,计税方式,签收人,签收日期,归档日期,所属批次,奖金名称,年度')

    vouchers.forEach((v, i) => {
      lines.push([
        i + 1,
        escapeCsv(v.voucherNo),
        escapeCsv(v.employeeName),
        escapeCsv(v.departmentName),
        escapeCsv(v.position),
        escapeCsv(formatVoucherMoney(v.grossAmount)),
        escapeCsv(formatVoucherMoney(v.taxAmount)),
        escapeCsv(formatVoucherMoney(v.netAmount)),
        escapeCsv(v.taxMethod === 'oneTime' ? '单独计税' : '综合计税'),
        escapeCsv(v.signature),
        escapeCsv(v.signedAt?.slice(0, 10) || '-'),
        escapeCsv(v.archivedAt?.slice(0, 10) || '-'),
        escapeCsv(v.batchName),
        escapeCsv(v.bonusName),
        v.year
      ].join(','))
    })

    return lines.join('\n')
  }

  function generateBatchSummaryHtml(batchId: string, vouchers: BonusSignVoucher[], batch?: BonusConfirmationBatch): string {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const totalGross = vouchers.reduce((s, v) => s + v.grossAmount, 0)
    const totalTax = vouchers.reduce((s, v) => s + v.taxAmount, 0)
    const totalNet = vouchers.reduce((s, v) => s + v.netAmount, 0)

    const rows = vouchers.map((v, i) => `
      <tr>
        <td style="text-align:center">${i + 1}</td>
        <td>${v.voucherNo}</td>
        <td>${v.employeeName}</td>
        <td>${v.departmentName}</td>
        <td>${v.position}</td>
        <td style="text-align:right">${formatVoucherMoney(v.grossAmount)}</td>
        <td style="text-align:right;color:#f5222d">${formatVoucherMoney(v.taxAmount)}</td>
        <td style="text-align:right;color:#52c41a;font-weight:600">${formatVoucherMoney(v.netAmount)}</td>
        <td>${v.taxMethod === 'oneTime' ? '单独' : '综合'}</td>
        <td>${v.signature}</td>
        <td>${v.signedAt?.slice(0, 10) || '-'}</td>
      </tr>
    `).join('')

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>奖金签收汇总-${batch?.name || batchId}</title>
<style>
  @page { size: A4 landscape; margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; color: #262626; line-height: 1.6; font-size: 12px; }
  .header { text-align: center; padding: 20px 0 16px; border-bottom: 2px solid #2080f0; margin-bottom: 20px; }
  .header h1 { font-size: 22px; color: #2080f0; margin-bottom: 6px; }
  .header p { color: #8c8c8c; font-size: 12px; }
  .batch-info { background: #f6f8fa; border-radius: 8px; padding: 16px 24px; margin-bottom: 20px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .info-item .label { color: #8c8c8c; font-size: 12px; margin-bottom: 2px; }
  .info-item .value { font-weight: 600; font-size: 14px; }
  .summary-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
  .stat-card { padding: 16px; border-radius: 8px; text-align: center; }
  .stat-card.sc-count { background: #e6f7ff; }
  .stat-card.sc-gross { background: #bae7ff; }
  .stat-card.sc-tax { background: #fff1f0; }
  .stat-card.sc-net { background: #f6ffed; }
  .stat-card .label { font-size: 12px; color: #8c8c8c; margin-bottom: 4px; }
  .stat-card .value { font-size: 20px; font-weight: 700; }
  h2 { font-size: 16px; margin: 20px 0 10px; padding-left: 8px; border-left: 3px solid #2080f0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
  th, td { border: 1px solid #e8e8e8; padding: 6px 8px; text-align: left; white-space: nowrap; }
  th { background: #fafafa; font-weight: 600; color: #595959; }
  tr:nth-child(even) td { background: #fafafa; }
  .total-row td { background: #fffbe6 !important; font-weight: 600; }
  .footer { text-align: center; color: #bfbfbf; font-size: 11px; margin-top: 32px; padding-top: 12px; border-top: 1px solid #e8e8e8; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="header">
  <h1>奖金签收凭证汇总表</h1>
  <p>生成时间：${now}</p>
</div>

<div class="batch-info">
  <div class="info-item"><div class="label">批次名称</div><div class="value">${batch?.name || '-'}</div></div>
  <div class="info-item"><div class="label">奖金名称</div><div class="value">${batch?.bonusName || '-'}</div></div>
  <div class="info-item"><div class="label">年度</div><div class="value">${batch?.year || '-'}</div></div>
  <div class="info-item"><div class="label">发布时间</div><div class="value">${batch?.publishedAt?.slice(0, 10) || '-'}</div></div>
</div>

<div class="summary-stats">
  <div class="stat-card sc-count">
    <div class="label">签收凭证数量</div>
    <div class="value">${vouchers.length} 份</div>
  </div>
  <div class="stat-card sc-gross">
    <div class="label">税前奖金合计</div>
    <div class="value">${formatVoucherMoney(totalGross)}</div>
  </div>
  <div class="stat-card sc-tax">
    <div class="label">个税合计</div>
    <div class="value" style="color:#f5222d">${formatVoucherMoney(totalTax)}</div>
  </div>
  <div class="stat-card sc-net">
    <div class="label">税后实发合计</div>
    <div class="value" style="color:#52c41a">${formatVoucherMoney(totalNet)}</div>
  </div>
</div>

<h2>签收凭证明细</h2>
<table>
  <thead>
    <tr>
      <th style="width:40px">序号</th>
      <th>凭证编号</th>
      <th>员工姓名</th>
      <th>部门</th>
      <th>职位</th>
      <th style="width:100px">税前金额</th>
      <th style="width:100px">个税</th>
      <th style="width:100px">税后实发</th>
      <th style="width:60px">计税</th>
      <th>签收人</th>
      <th style="width:100px">签收日期</th>
    </tr>
  </thead>
  <tbody>
    ${rows || '<tr><td colspan="11" style="text-align:center;color:#bfbfbf">暂无记录</td></tr>'}
    <tr class="total-row">
      <td colspan="5" style="text-align:center">合　计</td>
      <td style="text-align:right">${formatVoucherMoney(totalGross)}</td>
      <td style="text-align:right;color:#f5222d">${formatVoucherMoney(totalTax)}</td>
      <td style="text-align:right;color:#52c41a">${formatVoucherMoney(totalNet)}</td>
      <td colspan="3"></td>
    </tr>
  </tbody>
</table>

<div class="footer">
  本文档由「年终奖模拟器」系统自动生成 · ${now}
</div>
</body>
</html>`
  }

  function getTimeoutWarnings(): TimeoutWarning[] {
    const warnings: TimeoutWarning[] = []
    const now = dayjs()
    for (const record of bonusConfirmations.value) {
      if (record.status !== 'pending') continue
      const deadline = dayjs(record.deadlineAt)
      const remainingHours = deadline.diff(now, 'hour')
      if (remainingHours <= 0) continue
      let warningLevel: 'info' | 'warning' | 'critical' = 'info'
      if (remainingHours <= 24) {
        warningLevel = 'critical'
      } else if (remainingHours <= 72) {
        warningLevel = 'warning'
      }
      warnings.push({
        recordId: record.id,
        employeeId: record.employeeId,
        employeeName: record.employeeName,
        departmentName: record.departmentName,
        deadlineAt: record.deadlineAt,
        remainingHours,
        warningLevel,
        status: record.status
      })
    }
    return warnings.sort((a, b) => a.remainingHours - b.remainingHours)
  }

  function createDefaultLevelDistributions(): SandboxLevelDistribution[] {
    return performanceLevels.value.map((level) => ({
      levelId: level.id,
      levelName: level.name,
      ratio: 1 / performanceLevels.value.length,
      coefficient: level.coefficient
    }))
  }

  const sandboxColors = ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2']

  function createBaselineScenario(): BonusSandboxScenario {
    const id = generateId()
    const scenario: BonusSandboxScenario = {
      id,
      name: '基准方案',
      description: '基于当前配置的基准方案',
      color: sandboxColors[0],
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      bonusPoolConfig: JSON.parse(JSON.stringify(bonusPool.value)),
      levelDistributions: createDefaultLevelDistributions(),
      isBaseline: true
    }
    return scenario
  }

  const baselineScenario = createBaselineScenario()
  const sandboxScenarios = ref<BonusSandboxScenario[]>([baselineScenario])
  const activeSandboxScenarioIds = ref<string[]>([baselineScenario.id])

  const activeSandboxScenarios = computed(() => {
    return sandboxScenarios.value.filter((s) => activeSandboxScenarioIds.value.includes(s.id))
  })

  function createSandboxScenario(data: { name: string; description: string }): BonusSandboxScenario {
    const usedColors = sandboxScenarios.value.map((s) => s.color)
    const availableColor = sandboxColors.find((c) => !usedColors.includes(c)) || sandboxColors[sandboxScenarios.value.length % sandboxColors.length]
    const scenario: BonusSandboxScenario = {
      id: generateId(),
      name: data.name,
      description: data.description,
      color: availableColor,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      bonusPoolConfig: JSON.parse(JSON.stringify(bonusPool.value)),
      levelDistributions: createDefaultLevelDistributions(),
      isBaseline: false
    }
    sandboxScenarios.value.push(scenario)
    refreshSandboxMetrics(scenario.id)
    return scenario
  }

  function duplicateSandboxScenario(scenarioId: string): BonusSandboxScenario | null {
    const source = sandboxScenarios.value.find((s) => s.id === scenarioId)
    if (!source) return null
    const usedColors = sandboxScenarios.value.map((s) => s.color)
    const availableColor = sandboxColors.find((c) => !usedColors.includes(c)) || sandboxColors[sandboxScenarios.value.length % sandboxColors.length]
    const scenario: BonusSandboxScenario = {
      id: generateId(),
      name: `${source.name}-副本`,
      description: source.description,
      color: availableColor,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      bonusPoolConfig: JSON.parse(JSON.stringify(source.bonusPoolConfig)),
      levelDistributions: JSON.parse(JSON.stringify(source.levelDistributions)),
      isBaseline: false,
      metrics: source.metrics ? JSON.parse(JSON.stringify(source.metrics)) : undefined
    }
    sandboxScenarios.value.push(scenario)
    return scenario
  }

  function updateSandboxScenario(scenarioId: string, updates: Partial<BonusSandboxScenario>): boolean {
    const idx = sandboxScenarios.value.findIndex((s) => s.id === scenarioId)
    if (idx === -1) return false
    sandboxScenarios.value[idx] = {
      ...sandboxScenarios.value[idx],
      ...updates,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    refreshSandboxMetrics(scenarioId)
    return true
  }

  function deleteSandboxScenario(scenarioId: string): boolean {
    const scenario = sandboxScenarios.value.find((s) => s.id === scenarioId)
    if (!scenario || scenario.isBaseline) return false
    sandboxScenarios.value = sandboxScenarios.value.filter((s) => s.id !== scenarioId)
    activeSandboxScenarioIds.value = activeSandboxScenarioIds.value.filter((id) => id !== scenarioId)
    return true
  }

  function setBaselineScenario(scenarioId: string): void {
    const scenario = sandboxScenarios.value.find((s) => s.id === scenarioId)
    if (!scenario) return
    for (const s of sandboxScenarios.value) {
      s.isBaseline = s.id === scenarioId
    }
  }

  function toggleSandboxScenarioActive(scenarioId: string): void {
    const idx = activeSandboxScenarioIds.value.indexOf(scenarioId)
    if (idx !== -1) {
      activeSandboxScenarioIds.value.splice(idx, 1)
    } else {
      activeSandboxScenarioIds.value.push(scenarioId)
    }
  }

  function calculateSandboxMetrics(scenario: BonusSandboxScenario): SandboxKeyMetrics | null {
    const poolConfig = scenario.bonusPoolConfig
    const emps = allEmployees.value
    if (emps.length === 0) return null

    const grossBonuses: number[] = []
    const deptBaseTotals: Record<string, number> = {}
    const levelDistribution: Record<string, { count: number; totalBonus: number }> = {}
    const deptDistribution: Record<string, { count: number; totalBonus: number; allocationRatio: number }> = {}
    let totalTaxOneTime = 0
    let totalTaxComprehensive = 0
    let totalSavings = 0
    let cappedCount = 0
    let flooredCount = 0
    let adjustmentImpact = 0

    for (const level of performanceLevels.value) {
      levelDistribution[level.id] = { count: 0, totalBonus: 0 }
    }
    for (const dept of departments.value) {
      deptDistribution[dept.id] = {
        count: 0,
        totalBonus: 0,
        allocationRatio: poolConfig.departmentRatios[dept.id] || 0
      }
    }

    for (const dept of departments.value) {
      let deptTotal = 0
      for (const emp of dept.employees) {
        const weightedSalary = calculateWeightedBaseSalary(emp, bonusCalculationYear.value)
        const base = weightedSalary * poolConfig.baseRatio
        const perfCoef = performanceLevels.value.find((l) => l.id === emp.performanceLevelId)?.coefficient || 1
        const perfBonus = round2(base * perfCoef * poolConfig.performanceRatio)
        const tenureCoef = Math.min(emp.yearsOfService * 0.05, 0.5)
        const tenureBonus = round2(base * tenureCoef * poolConfig.tenureRatio)
        const tagCoef = getTagCoefficient(emp.tagIds)
        const tagBonus = round2(base * tagCoef)
        const baseAmount = round2(base + perfBonus + tenureBonus + tagBonus)
        deptTotal += baseAmount
      }
      deptBaseTotals[dept.id] = deptTotal
    }

    for (const dept of departments.value) {
      const deptAlloc = round2(poolConfig.totalAmount * (poolConfig.departmentRatios[dept.id] || 0))
      const deptBaseTotal = deptBaseTotals[dept.id] || 1
      const scaleFactor = deptAlloc / deptBaseTotal

      for (const emp of dept.employees) {
        const weightedSalary = calculateWeightedBaseSalary(emp, bonusCalculationYear.value)
        const base = weightedSalary * poolConfig.baseRatio
        const perfCoef = performanceLevels.value.find((l) => l.id === emp.performanceLevelId)?.coefficient || 1
        const perfBonus = round2(base * perfCoef * poolConfig.performanceRatio)
        const tenureCoef = Math.min(emp.yearsOfService * 0.05, 0.5)
        const tenureBonus = round2(base * tenureCoef * poolConfig.tenureRatio)
        const tagCoef = getTagCoefficient(emp.tagIds)
        const tagBonus = round2(base * tagCoef)
        const baseAmount = round2(base + perfBonus + tenureBonus + tagBonus)
        let gross = round2(baseAmount * scaleFactor)

        if (poolConfig.capEnabled && gross > poolConfig.capAmount) {
          adjustmentImpact += gross - poolConfig.capAmount
          gross = poolConfig.capAmount
          cappedCount++
        } else if (poolConfig.floorEnabled && gross < poolConfig.floorAmount) {
          adjustmentImpact -= poolConfig.floorAmount - gross
          gross = poolConfig.floorAmount
          flooredCount++
        }

        grossBonuses.push(gross)
        totalTaxOneTime += calculateOneTimeTax(gross)
        const ci = comprehensiveIncome.value[emp.id] || {
          annualSalary: emp.baseSalary * 12,
          specialDeduction: emp.baseSalary * 12 * 0.22,
          specialAdditionalDeduction: 24000,
          otherDeduction: 0
        }
        const compResult = calculateComprehensiveTax(
          ci.annualSalary,
          gross,
          ci.specialDeduction,
          ci.specialAdditionalDeduction,
          ci.otherDeduction
        )
        totalTaxComprehensive += compResult.taxDifference
        totalSavings += Math.abs(calculateOneTimeTax(gross) - compResult.taxDifference)

        if (levelDistribution[emp.performanceLevelId]) {
          levelDistribution[emp.performanceLevelId].count++
          levelDistribution[emp.performanceLevelId].totalBonus += gross
        }
        if (deptDistribution[dept.id]) {
          deptDistribution[dept.id].count++
          deptDistribution[dept.id].totalBonus += gross
        }
      }
    }

    const sorted = [...grossBonuses].sort((a, b) => a - b)
    const actualTotal = grossBonuses.reduce((s, v) => s + v, 0)
    const medianBonus = sorted.length % 2 === 0
      ? round2((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
      : sorted[Math.floor(sorted.length / 2)]

    const levelBonusDistribution: SandboxKeyMetrics['levelBonusDistribution'] = {}
    for (const [lvlId, data] of Object.entries(levelDistribution)) {
      levelBonusDistribution[lvlId] = {
        count: data.count,
        ratio: emps.length > 0 ? round2(data.count / emps.length) : 0,
        averageBonus: data.count > 0 ? round2(data.totalBonus / data.count) : 0,
        totalBonus: round2(data.totalBonus)
      }
    }

    const departmentBonusDistribution: SandboxKeyMetrics['departmentBonusDistribution'] = {}
    for (const [deptId, data] of Object.entries(deptDistribution)) {
      departmentBonusDistribution[deptId] = {
        count: data.count,
        averageBonus: data.count > 0 ? round2(data.totalBonus / data.count) : 0,
        totalBonus: round2(data.totalBonus),
        allocationRatio: data.allocationRatio
      }
    }

    return {
      totalBonusPool: poolConfig.totalAmount,
      actualTotalBonus: round2(actualTotal),
      averageBonus: round2(actualTotal / emps.length),
      medianBonus,
      maxBonus: sorted.length > 0 ? sorted[sorted.length - 1] : 0,
      minBonus: sorted.length > 0 ? sorted[0] : 0,
      totalEmployees: emps.length,
      totalTaxOneTime: round2(totalTaxOneTime),
      totalTaxComprehensive: round2(totalTaxComprehensive),
      averageTaxSaving: emps.length > 0 ? round2(totalSavings / emps.length) : 0,
      levelBonusDistribution,
      departmentBonusDistribution,
      cappedCount,
      flooredCount,
      adjustmentImpact: round2(adjustmentImpact)
    }
  }

  function refreshSandboxMetrics(scenarioId: string): void {
    const scenario = sandboxScenarios.value.find((s) => s.id === scenarioId)
    if (!scenario) return
    scenario.metrics = calculateSandboxMetrics(scenario) || undefined
    scenario.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
  }

  function refreshAllSandboxMetrics(): void {
    for (const scenario of sandboxScenarios.value) {
      refreshSandboxMetrics(scenario.id)
    }
  }

  function applySandboxScenario(scenarioId: string): boolean {
    const scenario = sandboxScenarios.value.find((s) => s.id === scenarioId)
    if (!scenario) return false
    bonusPool.value = JSON.parse(JSON.stringify(scenario.bonusPoolConfig))
    if (scenario.levelDistributions && scenario.levelDistributions.length > 0) {
      performanceDistributionRatios.value = scenario.levelDistributions.map((ld) => ({
        levelId: ld.levelId,
        levelName: ld.levelName,
        maxRatio: ld.ratio
      }))
    }
    return true
  }

  refreshAllSandboxMetrics()

  function getExpiringTagWarnings(daysThreshold: number = 7): EmployeeTagExpiryWarning[] {
    const warnings: EmployeeTagExpiryWarning[] = []
    const now = dayjs()
    const tagEmployeesMap: Record<string, Employee[]> = {}
    for (const dept of departments.value) {
      for (const emp of dept.employees) {
        for (const tagId of emp.tagIds) {
          if (!tagEmployeesMap[tagId]) tagEmployeesMap[tagId] = []
          tagEmployeesMap[tagId].push(emp)
        }
      }
    }
    for (const tag of employeeTags.value) {
      const expiryDay = dayjs(tag.expiryDate)
      const daysUntilExpiry = expiryDay.diff(now, 'day')
      if (daysUntilExpiry > daysThreshold) continue
      const employees = tagEmployeesMap[tag.id] || []
      const affectedEmployees: EmployeeTagExpiryWarning['affectedEmployees'] = []
      let totalPotentialLoss = 0
      for (const emp of employees) {
        const dept = getDepartmentById(emp.departmentId)
        const currentTagBonus = round2(emp.baseSalary * bonusPool.value.baseRatio * tag.coefficient)
        const potentialLoss = currentTagBonus
        totalPotentialLoss += potentialLoss
        affectedEmployees.push({
          id: emp.id,
          name: emp.name,
          departmentName: dept?.name || '',
          currentTagBonus,
          potentialLoss
        })
      }
      warnings.push({
        tag,
        daysUntilExpiry,
        affectedEmployees,
        totalPotentialLoss: round2(totalPotentialLoss),
        affectedCount: employees.length
      })
    }
    return warnings.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
  }

  return {
    performanceLevels,
    employeeTags,
    departments,
    bonusPool,
    comprehensiveIncome,
    selectedEmployeeId,
    allEmployees,
    departmentAllocations,
    calculationResults,
    selectedEmployeeResult,
    totalGrossBonus,
    totalTaxOneTime,
    totalTaxComprehensive,
    salaryAdjustmentImpacts,
    bonusCalculationYear,
    performanceDistributionRatios,
    calibrationResults,
    currentCalibration,
    calibrationYear,
    calibrationHalf,
    calibrationScope,
    calibrationDeptId,
    bonusPlanVersions,
    versionApprovalRecords,
    bonusConfirmations,
    bonusConfirmationBatches,
    bonusSignVouchers,
    sandboxScenarios,
    activeSandboxScenarioIds,
    activeSandboxScenarios,
    addPerformanceLevel,
    updatePerformanceLevel,
    removePerformanceLevel,
    addEmployeeTag,
    updateEmployeeTag,
    removeEmployeeTag,
    getTagCoefficient,
    addDepartment,
    updateDepartment,
    removeDepartment,
    addEmployee,
    updateEmployee,
    removeEmployee,
    normalizeDepartmentRatios,
    getPerformanceCoefficient,
    getDepartmentById,
    getEmployeeById,
    getEmployeeImpacts,
    calculateWeightedBaseSalary,
    addSalaryAdjustmentImpact,
    removeEmployeeImpacts,
    calculateEmployeeBaseAmount,
    calculateAdjustedTenureBonus,
    calculateDynamicAnnualSalary,
    updateDistributionRatio,
    initDistributionRatios,
    startCalibration,
    executeCalibration,
    adjustEmployeeLevel,
    updateEmployeeScore,
    confirmCalibration,
    applyCalibration,
    saveCalibration,
    getCalibrationDistributionStats,
    exportData,
    importData,
    createVersion,
    getCurrentVersion,
    getVersionById,
    getApprovalRecordsByVersionId,
    compareWithCurrent,
    compareVersions,
    submitVersionForApproval,
    approveVersion,
    rejectVersion,
    rollbackToVersion,
    deleteVersion,
    createConfirmationBatch,
    publishConfirmationBatch,
    deleteConfirmationBatch,
    checkTimeouts,
    getConfirmationsByBatch,
    getConfirmationById,
    getConfirmationStatusLabel,
    getConfirmationStatusColor,
    signBonus,
    createSignVoucher,
    submitObjection,
    startReview,
    completeReview,
    sendReminder,
    getVoucherById,
    getVoucherByRecordId,
    getVouchersByEmployeeId,
    getVouchersByBatchId,
    generateVoucherHtml,
    exportVoucherPdf,
    exportVoucherHtml,
    batchExportVouchersByBatch,
    generateBatchSummaryHtml,
    generateBatchSummaryCsv,
    checkBatchCompletion,
    getTimeoutWarnings,
    createSandboxScenario,
    duplicateSandboxScenario,
    updateSandboxScenario,
    deleteSandboxScenario,
    setBaselineScenario,
    toggleSandboxScenarioActive,
    calculateSandboxMetrics,
    refreshSandboxMetrics,
    refreshAllSandboxMetrics,
    applySandboxScenario,
    getExpiringTagWarnings
  }
})
