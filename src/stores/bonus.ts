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
  AppData
} from '@/types'
import {
  generateId,
  calculateOneTimeTax,
  calculateComprehensiveTax,
  round2
} from '@/utils/tax'

export const useBonusStore = defineStore('bonus', () => {
  const performanceLevels = ref<PerformanceLevel[]>([
    { id: generateId(), name: 'S', coefficient: 2.0, description: '卓越' },
    { id: generateId(), name: 'A+', coefficient: 1.5, description: '优秀' },
    { id: generateId(), name: 'A', coefficient: 1.2, description: '良好' },
    { id: generateId(), name: 'B+', coefficient: 1.0, description: '合格' },
    { id: generateId(), name: 'B', coefficient: 0.8, description: '待改进' },
    { id: generateId(), name: 'C', coefficient: 0.5, description: '不合格' }
  ])

  const employeeTags = ref<EmployeeTag[]>([
    { id: generateId(), name: '核心人才', coefficient: 0.3, description: '对公司业务有重大贡献的核心人员', color: '#f5222d' },
    { id: generateId(), name: '关键岗位', coefficient: 0.2, description: '担任关键岗位的员工', color: '#fa8c16' },
    { id: generateId(), name: '新人', coefficient: 0.05, description: '入职不满一年的新员工', color: '#52c41a' },
    { id: generateId(), name: '管理干部', coefficient: 0.15, description: '承担管理职责的员工', color: '#1890ff' },
    { id: generateId(), name: '技术骨干', coefficient: 0.25, description: '技术领域深度贡献者', color: '#722ed1' }
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
    tenureRatio: 0.1
  })

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

  const departmentAllocations = computed(() => {
    const map: Record<string, number> = {}
    for (const dept of departments.value) {
      map[dept.id] = round2(
        bonusPool.value.totalAmount * (bonusPool.value.departmentRatios[dept.id] || 0)
      )
    }
    return map
  })

  function calculateEmployeeBaseAmount(employee: Employee): number {
    const base = employee.baseSalary * bonusPool.value.baseRatio
    const performance = base * getPerformanceCoefficient(employee.performanceLevelId) * bonusPool.value.performanceRatio
    const tenure = base * Math.min(employee.yearsOfService * 0.05, 0.5) * bonusPool.value.tenureRatio
    const tagBonus = base * getTagCoefficient(employee.tagIds)
    return round2(base + performance + tenure + tagBonus)
  }

  const calculationResults = computed<PersonalCalculationResult[]>(() => {
    const results: PersonalCalculationResult[] = []
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
        const base = emp.baseSalary * bonusPool.value.baseRatio
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

        const taxOneTime = round2(calculateOneTimeTax(grossBonus))
        const netBonusOneTime = round2(grossBonus - taxOneTime)

        const ci = comprehensiveIncome.value[emp.id] || {
          annualSalary: emp.baseSalary * 12,
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

        results.push({
          employeeId: emp.id,
          employeeName: emp.name,
          departmentName: dept.name,
          baseAmount: round2(base),
          performanceBonus,
          tenureBonus,
          tagBonus,
          departmentAllocation: round2(baseAmount * (scaleFactor - 1)),
          grossBonus,
          taxOneTime,
          netBonusOneTime,
          taxComprehensive,
          netBonusComprehensive,
          betterMethod,
          savedTax
        })
      }
    }
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

  function exportData(): AppData {
    return {
      performanceLevels: performanceLevels.value,
      employeeTags: employeeTags.value,
      departments: departments.value,
      bonusPool: bonusPool.value,
      comprehensiveIncome: comprehensiveIncome.value
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
      selectedEmployeeId.value = departments.value[0]?.employees[0]?.id || null
      return true
    } catch {
      return false
    }
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
    exportData,
    importData
  }
})
