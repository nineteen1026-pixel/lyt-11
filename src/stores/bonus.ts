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
  EmployeeTagExpiryWarning,
  BonusPlanVersion,
  BonusPlanVersionStatus,
  BonusPlanVersionSnapshot,
  BonusPlanVersionDiff,
  VersionApprovalRecord,
  ApprovalActionType
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
    { id: generateId(), name: '核心人才', coefficient: 0.3, description: '对公司业务有重大贡献的核心人员', color: '#f5222d', effectiveDate: '2025-01-01', expiryDate: '2026-12-31' },
    { id: generateId(), name: '关键岗位', coefficient: 0.2, description: '担任关键岗位的员工', color: '#fa8c16', effectiveDate: '2025-01-01', expiryDate: dayjs().add(5, 'day').format('YYYY-MM-DD') },
    { id: generateId(), name: '新人', coefficient: 0.05, description: '入职不满一年的新员工', color: '#52c41a', effectiveDate: '2025-01-01', expiryDate: '2026-06-20' },
    { id: generateId(), name: '管理干部', coefficient: 0.15, description: '承担管理职责的员工', color: '#1890ff', effectiveDate: '2025-01-01', expiryDate: '2027-06-30' },
    { id: generateId(), name: '技术骨干', coefficient: 0.25, description: '技术领域深度贡献者', color: '#722ed1', effectiveDate: dayjs().add(10, 'day').format('YYYY-MM-DD'), expiryDate: '2027-12-31' }
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

  const bonusPlanVersions = ref<BonusPlanVersion[]>([])
  const versionApprovalRecords = ref<VersionApprovalRecord[]>([])
  const currentOperatorName = ref('当前用户')

  function createSnapshot(): BonusPlanVersionSnapshot {
    return {
      bonusPool: JSON.parse(JSON.stringify(bonusPool.value)),
      departments: JSON.parse(JSON.stringify(departments.value)),
      performanceLevels: JSON.parse(JSON.stringify(performanceLevels.value)),
      performanceDistributionRatios: JSON.parse(JSON.stringify(performanceDistributionRatios.value)),
      employeeTags: JSON.parse(JSON.stringify(employeeTags.value))
    }
  }

  function generateVersionNo(): string {
    const now = dayjs()
    const datePart = now.format('YYYYMMDD')
    const todayVersions = bonusPlanVersions.value.filter(v =>
      v.createdAt.startsWith(now.format('YYYY-MM-DD'))
    ).length
    const seqPart = String(todayVersions + 1).padStart(3, '0')
    return `V${datePart}.${seqPart}`
  }

  function createVersion(params: {
    name: string
    description: string
    changeSummary: string
  }): BonusPlanVersion {
    const snapshot = createSnapshot()
    const version: BonusPlanVersion = {
      id: generateId(),
      versionNo: generateVersionNo(),
      name: params.name,
      description: params.description,
      snapshot,
      status: 'draft',
      createdBy: currentOperatorName.value,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      changeSummary: params.changeSummary,
      isCurrent: false
    }
    bonusPlanVersions.value.unshift(version)
    addApprovalRecord({
      versionId: version.id,
      action: 'submit',
      operatorName: currentOperatorName.value,
      comment: '创建新版本',
      previousStatus: 'draft',
      newStatus: 'draft'
    })
    return version
  }

  function getVersionById(id: string): BonusPlanVersion | undefined {
    return bonusPlanVersions.value.find(v => v.id === id)
  }

  function getVersionsByStatus(status?: BonusPlanVersionStatus): BonusPlanVersion[] {
    if (status) {
      return bonusPlanVersions.value.filter(v => v.status === status)
    }
    return bonusPlanVersions.value
  }

  function getCurrentVersion(): BonusPlanVersion | undefined {
    return bonusPlanVersions.value.find(v => v.isCurrent)
  }

  function deleteVersion(id: string): boolean {
    const idx = bonusPlanVersions.value.findIndex(v => v.id === id)
    if (idx !== -1) {
      const version = bonusPlanVersions.value[idx]
      if (version.status === 'approved' && version.isCurrent) {
        return false
      }
      bonusPlanVersions.value.splice(idx, 1)
      return true
    }
    return false
  }

  function addApprovalRecord(params: {
    versionId: string
    action: ApprovalActionType
    operatorName: string
    comment: string
    previousStatus: BonusPlanVersionStatus
    newStatus: BonusPlanVersionStatus
  }) {
    const record: VersionApprovalRecord = {
      id: generateId(),
      versionId: params.versionId,
      action: params.action,
      operatorName: params.operatorName,
      comment: params.comment,
      operatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      previousStatus: params.previousStatus,
      newStatus: params.newStatus
    }
    versionApprovalRecords.value.push(record)
    const version = getVersionById(params.versionId)
    if (version) {
      version.updatedAt = record.operatedAt
    }
  }

  function getApprovalRecordsByVersionId(versionId: string): VersionApprovalRecord[] {
    return versionApprovalRecords.value
      .filter(r => r.versionId === versionId)
      .sort((a, b) => dayjs(b.operatedAt).valueOf() - dayjs(a.operatedAt).valueOf())
  }

  function submitVersionForApproval(id: string): boolean {
    const version = getVersionById(id)
    if (!version || version.status !== 'draft') return false
    const oldStatus = version.status
    version.status = 'pending_approval'
    addApprovalRecord({
      versionId: id,
      action: 'submit',
      operatorName: currentOperatorName.value,
      comment: '提交审批',
      previousStatus: oldStatus,
      newStatus: 'pending_approval'
    })
    return true
  }

  function approveVersion(id: string, comment: string = ''): boolean {
    const version = getVersionById(id)
    if (!version || version.status !== 'pending_approval') return false
    const oldStatus = version.status
    version.status = 'approved'
    version.approvedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
    version.approvedBy = currentOperatorName.value
    bonusPlanVersions.value.forEach(v => {
      if (v.id !== id && v.isCurrent) {
        v.isCurrent = false
      }
    })
    version.isCurrent = true
    bonusPool.value = JSON.parse(JSON.stringify(version.snapshot.bonusPool))
    departments.value = JSON.parse(JSON.stringify(version.snapshot.departments))
    performanceLevels.value = JSON.parse(JSON.stringify(version.snapshot.performanceLevels))
    performanceDistributionRatios.value = JSON.parse(JSON.stringify(version.snapshot.performanceDistributionRatios))
    employeeTags.value = JSON.parse(JSON.stringify(version.snapshot.employeeTags))
    for (const dept of departments.value) {
      bonusPool.value.departmentRatios[dept.id] = dept.allocationRatio
    }
    addApprovalRecord({
      versionId: id,
      action: 'approve',
      operatorName: currentOperatorName.value,
      comment: comment || '审批通过',
      previousStatus: oldStatus,
      newStatus: 'approved'
    })
    return true
  }

  function rejectVersion(id: string, reason: string): boolean {
    const version = getVersionById(id)
    if (!version || version.status !== 'pending_approval') return false
    const oldStatus = version.status
    version.status = 'rejected'
    version.rejectionReason = reason
    addApprovalRecord({
      versionId: id,
      action: 'reject',
      operatorName: currentOperatorName.value,
      comment: reason,
      previousStatus: oldStatus,
      newStatus: 'rejected'
    })
    return true
  }

  function withdrawVersion(id: string): boolean {
    const version = getVersionById(id)
    if (!version || version.status !== 'pending_approval') return false
    const oldStatus = version.status
    version.status = 'draft'
    addApprovalRecord({
      versionId: id,
      action: 'withdraw',
      operatorName: currentOperatorName.value,
      comment: '撤回审批',
      previousStatus: oldStatus,
      newStatus: 'draft'
    })
    return true
  }

  function compareObjects(obj1: any, obj2: any, path: string = ''): BonusPlanVersionDiff[] {
    const results: BonusPlanVersionDiff[] = []
    const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})])
    const fieldLabels: Record<string, string> = {
      totalAmount: '奖金总额',
      baseRatio: '基础薪资倍数',
      performanceRatio: '绩效影响比例',
      tenureRatio: '工龄影响比例',
      capEnabled: '单人奖金封顶',
      capAmount: '封顶金额',
      floorEnabled: '单人奖金保底',
      floorAmount: '保底金额',
      departmentRatios: '部门分配比例',
      name: '名称',
      allocationRatio: '分配比例',
      coefficient: '系数',
      description: '描述',
      maxRatio: '最大比例'
    }
    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key
      const label = fieldLabels[key] || key
      const val1 = obj1?.[key]
      const val2 = obj2?.[key]
      if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null && !Array.isArray(val1) && !Array.isArray(val2)) {
        results.push(...compareObjects(val1, val2, currentPath))
      } else if (Array.isArray(val1) && Array.isArray(val2)) {
        const maxLen = Math.max(val1.length, val2.length)
        for (let i = 0; i < maxLen; i++) {
          const arrayPath = `${currentPath}[${i}]`
          const item1 = val1[i]
          const item2 = val2[i]
          if (item1 === undefined) {
            results.push({
              field: key,
              label: `${label}[${i}]`,
              oldValue: undefined,
              newValue: item2,
              changeType: 'added',
              path: arrayPath
            })
          } else if (item2 === undefined) {
            results.push({
              field: key,
              label: `${label}[${i}]`,
              oldValue: item1,
              newValue: undefined,
              changeType: 'removed',
              path: arrayPath
            })
          } else if (typeof item1 === 'object' && typeof item2 === 'object') {
            results.push(...compareObjects(item1, item2, arrayPath))
          } else if (JSON.stringify(item1) !== JSON.stringify(item2)) {
            results.push({
              field: key,
              label: `${label}[${i}]`,
              oldValue: item1,
              newValue: item2,
              changeType: 'modified',
              path: arrayPath
            })
          } else {
            results.push({
              field: key,
              label: `${label}[${i}]`,
              oldValue: item1,
              newValue: item2,
              changeType: 'unchanged',
              path: arrayPath
            })
          }
        }
      } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        results.push({
          field: key,
          label,
          oldValue: val1,
          newValue: val2,
          changeType: val1 === undefined ? 'added' : val2 === undefined ? 'removed' : 'modified',
          path: currentPath
        })
      } else {
        results.push({
          field: key,
          label,
          oldValue: val1,
          newValue: val2,
          changeType: 'unchanged',
          path: currentPath
        })
      }
    }
    return results
  }

  function compareVersions(versionId1: string, versionId2: string): BonusPlanVersionDiff[] | null {
    const v1 = getVersionById(versionId1)
    const v2 = getVersionById(versionId2)
    if (!v1 || !v2) return null
    return compareObjects(v1.snapshot, v2.snapshot)
  }

  function compareWithCurrent(versionId: string): BonusPlanVersionDiff[] | null {
    const current = getCurrentVersion()
    if (!current) return null
    return compareVersions(versionId, current.id)
  }

  function getChangedFields(diffs: BonusPlanVersionDiff[]): BonusPlanVersionDiff[] {
    return diffs.filter(d => d.changeType !== 'unchanged')
  }

  function rollbackToVersion(versionId: string, reason: string): boolean {
    const targetVersion = getVersionById(versionId)
    if (!targetVersion || targetVersion.status !== 'approved') return false
    const currentVersion = getCurrentVersion()
    const effectiveSnapshot: BonusPlanVersionSnapshot = JSON.parse(JSON.stringify(targetVersion.snapshot))
    const rollbackVersion: BonusPlanVersion = {
      id: generateId(),
      versionNo: generateVersionNo(),
      name: `${targetVersion.name}-回滚`,
      description: `回滚到版本 ${targetVersion.versionNo}`,
      snapshot: effectiveSnapshot,
      status: 'approved',
      createdBy: currentOperatorName.value,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      approvedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      approvedBy: currentOperatorName.value,
      changeSummary: `回滚操作：${reason}，回滚到版本 ${targetVersion.versionNo}`,
      isCurrent: true,
      rollbackFromVersionId: versionId
    }
    bonusPlanVersions.value.forEach(v => {
      if (v.isCurrent) {
        v.isCurrent = false
      }
    })
    bonusPool.value = JSON.parse(JSON.stringify(effectiveSnapshot.bonusPool))
    departments.value = JSON.parse(JSON.stringify(effectiveSnapshot.departments))
    performanceLevels.value = JSON.parse(JSON.stringify(effectiveSnapshot.performanceLevels))
    performanceDistributionRatios.value = JSON.parse(JSON.stringify(effectiveSnapshot.performanceDistributionRatios))
    employeeTags.value = JSON.parse(JSON.stringify(effectiveSnapshot.employeeTags))
    for (const dept of departments.value) {
      bonusPool.value.departmentRatios[dept.id] = dept.allocationRatio
    }
    bonusPlanVersions.value.unshift(rollbackVersion)
    addApprovalRecord({
      versionId: rollbackVersion.id,
      action: 'rollback',
      operatorName: currentOperatorName.value,
      comment: reason,
      previousStatus: currentVersion?.status || 'approved',
      newStatus: 'approved'
    })
    if (currentVersion) {
      currentVersion.isCurrent = false
      currentVersion.status = 'rolled_back'
    }
    return true
  }

  function applyVersionSnapshot(versionId: string): boolean {
    const version = getVersionById(versionId)
    if (!version) return false
    bonusPool.value = JSON.parse(JSON.stringify(version.snapshot.bonusPool))
    departments.value = JSON.parse(JSON.stringify(version.snapshot.departments))
    performanceLevels.value = JSON.parse(JSON.stringify(version.snapshot.performanceLevels))
    performanceDistributionRatios.value = JSON.parse(JSON.stringify(version.snapshot.performanceDistributionRatios))
    employeeTags.value = JSON.parse(JSON.stringify(version.snapshot.employeeTags))
    for (const dept of departments.value) {
      bonusPool.value.departmentRatios[dept.id] = dept.allocationRatio
    }
    return true
  }

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

  function isTagActive(tag: EmployeeTag, checkDate: dayjs.Dayjs = dayjs()): boolean {
    const effective = dayjs(tag.effectiveDate)
    const expiry = dayjs(tag.expiryDate)
    return !checkDate.isBefore(effective, 'day') && !checkDate.isAfter(expiry, 'day')
  }

  function getTagCoefficient(tagIds: string[], checkDate: dayjs.Dayjs = dayjs()): number {
    return tagIds.reduce((sum, tid) => {
      const tag = employeeTags.value.find((t) => t.id === tid)
      if (tag && isTagActive(tag, checkDate)) {
        return sum + tag.coefficient
      }
      return sum
    }, 0)
  }

  function getExpiringTagWarnings(daysThreshold: number = 7): EmployeeTagExpiryWarning[] {
    const now = dayjs()
    const warnings: EmployeeTagExpiryWarning[] = []

    for (const tag of employeeTags.value) {
      if (!isTagActive(tag, now)) continue

      const expiry = dayjs(tag.expiryDate)
      const daysUntilExpiry = expiry.diff(now, 'day') + 1

      if (daysUntilExpiry > 0 && daysUntilExpiry <= daysThreshold) {
        const affectedEmployees: EmployeeTagExpiryWarning['affectedEmployees'] = []
        let totalPotentialLoss = 0

        for (const dept of departments.value) {
          for (const emp of dept.employees) {
            if (emp.tagIds.includes(tag.id)) {
              const weightedSalary = calculateWeightedBaseSalary(emp, bonusCalculationYear.value)
              const base = weightedSalary * bonusPool.value.baseRatio
              const currentTagBonus = round2(base * tag.coefficient)

              const deptBaseTotals: Record<string, number> = {}
              for (const d of departments.value) {
                let total = 0
                for (const e of d.employees) {
                  total += calculateEmployeeBaseAmount(e)
                }
                deptBaseTotals[d.id] = total
              }
              const deptAlloc = departmentAllocations.value[dept.id] || 0
              const deptBaseTotal = deptBaseTotals[dept.id] || 1
              const scaleFactor = deptAlloc / deptBaseTotal

              const potentialLoss = round2(currentTagBonus * scaleFactor)
              totalPotentialLoss += potentialLoss

              affectedEmployees.push({
                id: emp.id,
                name: emp.name,
                departmentName: dept.name,
                currentTagBonus: round2(currentTagBonus * scaleFactor),
                potentialLoss
              })
            }
          }
        }

        if (affectedEmployees.length > 0) {
          warnings.push({
            tag,
            daysUntilExpiry,
            affectedEmployees,
            totalPotentialLoss,
            affectedCount: affectedEmployees.length
          })
        }
      }
    }

    return warnings.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
  }

  const activeEmployeeTags = computed(() => {
    const now = dayjs()
    return employeeTags.value.filter(tag => isTagActive(tag, now))
  })

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

  function calculateWeightedBaseSalary(employee: Employee, year: number): number {
    const allImpacts = getEmployeeImpacts(employee.id)
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

  function calculateEmployeeBaseAmount(employee: Employee, useWeighted: boolean = true): number {
    const salary = useWeighted
      ? calculateWeightedBaseSalary(employee, bonusCalculationYear.value)
      : employee.baseSalary
    const base = salary * bonusPool.value.baseRatio
    const performance = base * getPerformanceCoefficient(employee.performanceLevelId) * bonusPool.value.performanceRatio
    const tenure = base * Math.min(employee.yearsOfService * 0.05, 0.5) * bonusPool.value.tenureRatio
    const tagBonus = base * getTagCoefficient(employee.tagIds)
    return round2(base + performance + tenure + tagBonus)
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

  function applyCalibration() {
    if (!currentCalibration.value || currentCalibration.value.status === 'draft') return

    for (const emp of currentCalibration.value.employees) {
      if (emp.calibratedLevelId) {
        updateEmployee(emp.employeeId, { performanceLevelId: emp.calibratedLevelId })
      }
    }

    currentCalibration.value.status = 'applied'
    currentCalibration.value.appliedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')

    calibrationResults.value.push({ ...currentCalibration.value })
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
      versionApprovalRecords: versionApprovalRecords.value
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
      currentCalibration.value = null
      selectedEmployeeId.value = departments.value[0]?.employees[0]?.id || null
      return true
    } catch {
      return false
    }
  }

  return {
    performanceLevels,
    employeeTags,
    activeEmployeeTags,
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
    currentOperatorName,
    createVersion,
    getVersionById,
    getVersionsByStatus,
    getCurrentVersion,
    deleteVersion,
    submitVersionForApproval,
    approveVersion,
    rejectVersion,
    withdrawVersion,
    compareVersions,
    compareWithCurrent,
    getChangedFields,
    rollbackToVersion,
    applyVersionSnapshot,
    getApprovalRecordsByVersionId,
    addPerformanceLevel,
    updatePerformanceLevel,
    removePerformanceLevel,
    addEmployeeTag,
    updateEmployeeTag,
    removeEmployeeTag,
    isTagActive,
    getTagCoefficient,
    getExpiringTagWarnings,
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
    importData
  }
})
