import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  AdjustmentReason,
  AdjustmentReasonCategory,
  ApprovalNode,
  ApprovalNodeType,
  ApprovalStatus,
  NodeApprovalStatus,
  ApprovalRecord,
  SalaryAdjustmentRequest,
  AnnualSalaryBudget,
  DepartmentSalaryBudget,
  SalaryHistoryRecord,
  SalaryAdjustmentModuleData
} from '@/types'
import { generateId, round2 } from '@/utils/tax'
import dayjs from 'dayjs'
import { useBonusStore } from './bonus'

const CATEGORY_LABELS: Record<AdjustmentReasonCategory, string> = {
  annual: '年度调薪',
  performance: '绩效调薪',
  promotion: '晋升调薪',
  market: '市场对标',
  certification: '资质认证',
  transfer: '岗位异动',
  special: '特殊调薪'
}

const STATUS_LABELS: Record<ApprovalStatus, string> = {
  draft: '草稿',
  pending: '审批中',
  approved: '已通过',
  rejected: '已驳回',
  returned: '已退回',
  withdrawn: '已撤回'
}

const NODE_TYPE_LABELS: Record<ApprovalNodeType, string> = {
  direct_manager: '直属上级',
  department_head: '部门负责人',
  hr: 'HR审核',
  finance: '财务审核',
  ceo: 'CEO审批',
  custom: '自定义节点'
}

export const useSalaryAdjustmentStore = defineStore('salaryAdjustment', () => {
  const bonusStore = useBonusStore()
  const currentYear = dayjs().year()

  const reasons = ref<AdjustmentReason[]>([
    { id: generateId(), category: 'annual', name: '年度普调', description: '公司年度统一薪资调整', defaultMinRatio: 0.03, defaultMaxRatio: 0.15, enabled: true },
    { id: generateId(), category: 'performance', name: '卓越绩效', description: '上年度绩效评级为S或A+的员工调薪', defaultMinRatio: 0.08, defaultMaxRatio: 0.25, enabled: true },
    { id: generateId(), category: 'promotion', name: '职位晋升', description: '员工晋升后相应的薪资调整', defaultMinRatio: 0.1, defaultMaxRatio: 0.3, enabled: true },
    { id: generateId(), category: 'market', name: '市场薪酬对标', description: '对标市场薪酬水平的调整', defaultMinRatio: 0.05, defaultMaxRatio: 0.2, enabled: true },
    { id: generateId(), category: 'certification', name: '专业资质获取', description: '获得关键专业资质后的调薪', defaultMinRatio: 0.03, defaultMaxRatio: 0.12, enabled: true },
    { id: generateId(), category: 'transfer', name: '部门/岗位异动', description: '跨部门调动或岗位变更', defaultMinRatio: 0, defaultMaxRatio: 0.2, enabled: true },
    { id: generateId(), category: 'special', name: '关键人才保留', description: '核心关键人才的特殊调薪', defaultMinRatio: 0.05, defaultMaxRatio: 0.35, enabled: true }
  ])

  const approvalWorkflow = ref<ApprovalNode[]>([
    { id: generateId(), name: '直属上级审批', type: 'direct_manager', order: 1, required: true, minApprovalAmount: 0 },
    { id: generateId(), name: '部门负责人审批', type: 'department_head', order: 2, required: true, minApprovalAmount: 0, maxApprovalAmount: 5000 },
    { id: generateId(), name: 'HR审核', type: 'hr', order: 3, required: true, minApprovalAmount: 0 },
    { id: generateId(), name: '财务预算审核', type: 'finance', order: 4, required: false, minApprovalAmount: 3000 },
    { id: generateId(), name: 'CEO审批', type: 'ceo', order: 5, required: false, minApprovalAmount: 10000 }
  ])

  const annualBudget = ref<AnnualSalaryBudget | null>(createInitialBudget())

  const requests = ref<SalaryAdjustmentRequest[]>([])

  const salaryHistory = ref<SalaryHistoryRecord[]>([])

  const selectedRequestId = ref<string | null>(null)

  function createInitialBudget(): AnnualSalaryBudget {
    const deptBudgets: DepartmentSalaryBudget[] = bonusStore.departments.map((dept) => {
      const totalAnnualSalary = dept.employees.reduce((sum, emp) => sum + emp.baseSalary * 12, 0)
      return {
        departmentId: dept.id,
        departmentName: dept.name,
        totalBudget: round2(totalAnnualSalary * 0.1),
        usedAmount: 0,
        pendingAmount: 0,
        approvedCount: 0,
        pendingCount: 0,
        headcount: dept.employees.length,
        averageAdjustmentRatio: 0
      }
    })
    const total = deptBudgets.reduce((s, d) => s + d.totalBudget, 0)
    return {
      year: currentYear,
      totalBudget: round2(total),
      usedAmount: 0,
      pendingAmount: 0,
      reservedAmount: round2(total * 0.1),
      departments: deptBudgets,
      maxAdjustmentRatio: 0.35,
      minAdjustmentRatio: 0.01,
      defaultRatio: 0.08,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
  }

  function generateRequestNo(): string {
    const now = dayjs()
    const seq = String(requests.value.length + 1).padStart(4, '0')
    return `SA${now.format('YYYYMMDD')}${seq}`
  }

  const sortedWorkflow = computed(() => [...approvalWorkflow.value].sort((a, b) => a.order - b.order))

  const enabledReasons = computed(() => reasons.value.filter((r) => r.enabled))

  const pendingRequests = computed(() => requests.value.filter((r) => r.status === 'pending'))
  const draftRequests = computed(() => requests.value.filter((r) => r.status === 'draft'))
  const approvedRequests = computed(() => requests.value.filter((r) => r.status === 'approved'))
  const rejectedRequests = computed(() => requests.value.filter((r) => r.status === 'rejected'))

  const budgetOverview = computed(() => {
    if (!annualBudget.value) return null
    const { totalBudget, usedAmount, pendingAmount, reservedAmount } = annualBudget.value
    const available = round2(totalBudget - usedAmount - pendingAmount - reservedAmount)
    const usedRatio = round2(usedAmount / totalBudget)
    const pendingRatio = round2(pendingAmount / totalBudget)
    return { totalBudget, usedAmount, pendingAmount, reservedAmount, available, usedRatio, pendingRatio }
  })

  function getCategoryLabel(cat: AdjustmentReasonCategory): string {
    return CATEGORY_LABELS[cat] || cat
  }

  function getStatusLabel(status: ApprovalStatus): string {
    return STATUS_LABELS[status] || status
  }

  function getNodeTypeLabel(type: ApprovalNodeType): string {
    return NODE_TYPE_LABELS[type] || type
  }

  function getStatusColor(status: ApprovalStatus): string {
    const map: Record<ApprovalStatus, string> = {
      draft: '#8c8c8c',
      pending: '#fa8c16',
      approved: '#52c41a',
      rejected: '#f5222d',
      returned: '#eb2f96',
      withdrawn: '#8c8c8c'
    }
    return map[status]
  }

  function getNodeStatusColor(status: NodeApprovalStatus): string {
    const map: Record<NodeApprovalStatus, string> = {
      waiting: '#bfbfbf',
      current: '#1890ff',
      approved: '#52c41a',
      rejected: '#f5222d',
      skipped: '#8c8c8c'
    }
    return map[status]
  }

  function getNodeStatusLabel(status: NodeApprovalStatus): string {
    const map: Record<NodeApprovalStatus, string> = {
      waiting: '待审批',
      current: '审批中',
      approved: '已通过',
      rejected: '已驳回',
      skipped: '已跳过'
    }
    return map[status]
  }

  function addReason(reason: Omit<AdjustmentReason, 'id'>) {
    reasons.value.push({ ...reason, id: generateId() })
  }

  function updateReason(id: string, updates: Partial<AdjustmentReason>) {
    const idx = reasons.value.findIndex((r) => r.id === id)
    if (idx !== -1) {
      reasons.value[idx] = { ...reasons.value[idx], ...updates }
    }
  }

  function removeReason(id: string) {
    reasons.value = reasons.value.filter((r) => r.id !== id)
  }

  function addApprovalNode(node: Omit<ApprovalNode, 'id'>) {
    approvalWorkflow.value.push({ ...node, id: generateId() })
    normalizeNodeOrders()
  }

  function updateApprovalNode(id: string, updates: Partial<ApprovalNode>) {
    const idx = approvalWorkflow.value.findIndex((n) => n.id === id)
    if (idx !== -1) {
      approvalWorkflow.value[idx] = { ...approvalWorkflow.value[idx], ...updates }
      normalizeNodeOrders()
    }
  }

  function removeApprovalNode(id: string) {
    approvalWorkflow.value = approvalWorkflow.value.filter((n) => n.id !== id)
    normalizeNodeOrders()
  }

  function moveApprovalNode(id: string, direction: 'up' | 'down') {
    const sorted = [...approvalWorkflow.value].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((n) => n.id === id)
    if (idx === -1) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= sorted.length) return
    ;[sorted[idx], sorted[targetIdx]] = [sorted[targetIdx], sorted[idx]]
    sorted.forEach((n, i) => {
      n.order = i + 1
    })
    approvalWorkflow.value = sorted
  }

  function normalizeNodeOrders() {
    const sorted = [...approvalWorkflow.value].sort((a, b) => a.order - b.order)
    sorted.forEach((n, i) => {
      n.order = i + 1
    })
    approvalWorkflow.value = sorted
  }

  function calculateApplicableNodes(adjustmentAmount: number): ApprovalNode[] {
    return sortedWorkflow.value.filter((node) => {
      const aboveMin = node.minApprovalAmount === undefined || adjustmentAmount >= node.minApprovalAmount
      const belowMax = node.maxApprovalAmount === undefined || adjustmentAmount <= node.maxApprovalAmount
      return aboveMin && belowMax
    })
  }

  function checkBudgetAvailability(departmentId: string, amount: number): { ok: boolean; message: string } {
    if (!annualBudget.value) return { ok: false, message: '年度预算未初始化' }
    const deptBudget = annualBudget.value.departments.find((d) => d.departmentId === departmentId)
    if (!deptBudget) return { ok: false, message: '部门预算未找到' }
    const deptAvailable = deptBudget.totalBudget - deptBudget.usedAmount - deptBudget.pendingAmount
    const overallAvailable = annualBudget.value.totalBudget - annualBudget.value.usedAmount - annualBudget.value.pendingAmount - annualBudget.value.reservedAmount
    if (amount > deptAvailable) return { ok: false, message: `部门预算不足，剩余可用：${deptAvailable.toLocaleString()}元` }
    if (amount > overallAvailable) return { ok: false, message: `公司整体预算不足，剩余可用：${overallAvailable.toLocaleString()}元` }
    return { ok: true, message: '预算充足' }
  }

  function createDraftRequest(employeeId: string): SalaryAdjustmentRequest {
    const emp = bonusStore.getEmployeeById(employeeId)
    if (!emp) throw new Error('员工不存在')
    const dept = bonusStore.getDepartmentById(emp.departmentId)
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const defaultReason = enabledReasons.value[0]
    const currentSalary = emp.baseSalary
    const proposedRatio = annualBudget.value?.defaultRatio || 0.08
    const proposedSalary = round2(currentSalary * (1 + proposedRatio))

    const req: SalaryAdjustmentRequest = {
      id: generateId(),
      requestNo: generateRequestNo(),
      employeeId: emp.id,
      employeeName: emp.name,
      departmentId: emp.departmentId,
      departmentName: dept?.name || '',
      position: emp.position,
      reasonCategory: defaultReason?.category || 'annual',
      reasonId: defaultReason?.id || '',
      reasonName: defaultReason?.name || '',
      currentSalary,
      proposedSalary,
      adjustmentAmount: round2(proposedSalary - currentSalary),
      adjustmentRatio: round2(proposedRatio),
      effectiveDate: dayjs().add(1, 'month').startOf('month').format('YYYY-MM-DD'),
      description: '',
      attachments: [],
      status: 'draft',
      currentNodeIndex: -1,
      approvalRecords: [],
      workflowSnapshot: [],
      applicantName: '当前用户',
      createdAt: now,
      updatedAt: now,
      budgetYear: currentYear
    }
    requests.value.push(req)
    selectedRequestId.value = req.id
    return req
  }

  function updateRequest(id: string, updates: Partial<SalaryAdjustmentRequest>) {
    const idx = requests.value.findIndex((r) => r.id === id)
    if (idx === -1) return
    const req = requests.value[idx]
    const updated = { ...req, ...updates, updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') }
    if (updates.currentSalary !== undefined || updates.proposedSalary !== undefined) {
      const cs = updates.currentSalary ?? req.currentSalary
      const ps = updates.proposedSalary ?? req.proposedSalary
      updated.adjustmentAmount = round2(ps - cs)
      updated.adjustmentRatio = round2(cs > 0 ? (ps - cs) / cs : 0)
    }
    if (updates.reasonId) {
      const reason = reasons.value.find((r) => r.id === updates.reasonId)
      if (reason) {
        updated.reasonCategory = reason.category
        updated.reasonName = reason.name
      }
    }
    requests.value[idx] = updated
  }

  function submitRequest(id: string): { ok: boolean; message: string } {
    const idx = requests.value.findIndex((r) => r.id === id)
    if (idx === -1) return { ok: false, message: '申请单不存在' }
    const req = requests.value[idx]
    if (req.status !== 'draft' && req.status !== 'returned') return { ok: false, message: '当前状态不可提交' }
    if (!req.reasonId) return { ok: false, message: '请选择调薪事由' }
    if (req.adjustmentAmount <= 0) return { ok: false, message: '调薪金额必须大于0' }
    if (annualBudget.value) {
      const maxRatio = annualBudget.value.maxAdjustmentRatio
      const minRatio = annualBudget.value.minAdjustmentRatio
      if (req.adjustmentRatio > maxRatio) return { ok: false, message: `调薪比例超过上限${(maxRatio * 100).toFixed(1)}%` }
      if (req.adjustmentRatio < minRatio) return { ok: false, message: `调薪比例低于下限${(minRatio * 100).toFixed(1)}%` }
    }
    const budgetCheck = checkBudgetAvailability(req.departmentId, req.adjustmentAmount * 12)
    if (!budgetCheck.ok) return budgetCheck

    const applicableNodes = calculateApplicableNodes(req.adjustmentAmount * 12)
    const workflowSnapshot = applicableNodes.map((n) => ({ ...n }))
    const records: ApprovalRecord[] = workflowSnapshot.map((n, i) => ({
      nodeId: n.id,
      nodeName: n.name,
      approverName: '',
      status: i === 0 ? 'current' : 'waiting',
      operatedAt: ''
    }))

    requests.value[idx] = {
      ...req,
      status: 'pending',
      currentNodeIndex: 0,
      workflowSnapshot,
      approvalRecords: records,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    allocateBudget(req.departmentId, req.adjustmentAmount * 12, 'pending')
    return { ok: true, message: '提交成功，已进入审批流程' }
  }

  function allocateBudget(departmentId: string, amount: number, type: 'pending' | 'used') {
    if (!annualBudget.value) return
    const dept = annualBudget.value.departments.find((d) => d.departmentId === departmentId)
    if (!dept) return
    if (type === 'pending') {
      dept.pendingAmount = round2(dept.pendingAmount + amount)
      dept.pendingCount += 1
      annualBudget.value.pendingAmount = round2(annualBudget.value.pendingAmount + amount)
    } else {
      dept.usedAmount = round2(dept.usedAmount + amount)
      dept.approvedCount += 1
      annualBudget.value.usedAmount = round2(annualBudget.value.usedAmount + amount)
    }
    annualBudget.value.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
    recalculateDeptAvgRatio()
  }

  function releasePendingBudget(departmentId: string, amount: number) {
    if (!annualBudget.value) return
    const dept = annualBudget.value.departments.find((d) => d.departmentId === departmentId)
    if (!dept) return
    dept.pendingAmount = round2(Math.max(0, dept.pendingAmount - amount))
    dept.pendingCount = Math.max(0, dept.pendingCount - 1)
    annualBudget.value.pendingAmount = round2(Math.max(0, annualBudget.value.pendingAmount - amount))
    annualBudget.value.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
    recalculateDeptAvgRatio()
  }

  function pendingToUsedBudget(departmentId: string, amount: number) {
    if (!annualBudget.value) return
    const dept = annualBudget.value.departments.find((d) => d.departmentId === departmentId)
    if (!dept) return
    dept.pendingAmount = round2(Math.max(0, dept.pendingAmount - amount))
    dept.pendingCount = Math.max(0, dept.pendingCount - 1)
    dept.usedAmount = round2(dept.usedAmount + amount)
    dept.approvedCount += 1
    annualBudget.value.pendingAmount = round2(Math.max(0, annualBudget.value.pendingAmount - amount))
    annualBudget.value.usedAmount = round2(annualBudget.value.usedAmount + amount)
    annualBudget.value.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
    recalculateDeptAvgRatio()
  }

  function recalculateDeptAvgRatio() {
    if (!annualBudget.value) return
    for (const dept of annualBudget.value.departments) {
      const approvedForDept = approvedRequests.value.filter((r) => r.departmentId === dept.departmentId)
      const totalSalary = approvedForDept.reduce((s, r) => s + r.currentSalary, 0)
      const totalAdjust = approvedForDept.reduce((s, r) => s + r.adjustmentAmount, 0)
      dept.averageAdjustmentRatio = totalSalary > 0 ? round2(totalAdjust / totalSalary) : 0
    }
  }

  function approveCurrentNode(id: string, approverName: string, comment: string): { ok: boolean; message: string } {
    const idx = requests.value.findIndex((r) => r.id === id)
    if (idx === -1) return { ok: false, message: '申请单不存在' }
    const req = requests.value[idx]
    if (req.status !== 'pending') return { ok: false, message: '当前状态不可审批' }
    const nodeIdx = req.currentNodeIndex
    if (nodeIdx < 0 || nodeIdx >= req.approvalRecords.length) return { ok: false, message: '审批节点异常' }

    const records = [...req.approvalRecords]
    records[nodeIdx] = {
      ...records[nodeIdx],
      status: 'approved',
      approverName,
      comment,
      operatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }

    const nextIdx = nodeIdx + 1
    if (nextIdx < records.length) {
      records[nextIdx] = { ...records[nextIdx], status: 'current' }
      requests.value[idx] = {
        ...req,
        approvalRecords: records,
        currentNodeIndex: nextIdx,
        updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
      return { ok: true, message: `已通过，进入下一节点：${records[nextIdx].nodeName}` }
    } else {
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
      pendingToUsedBudget(req.departmentId, req.adjustmentAmount * 12)
      bonusStore.updateEmployee(req.employeeId, { baseSalary: req.proposedSalary })
      addSalaryHistoryFromRequest(req, now, approverName)
      requests.value[idx] = {
        ...req,
        status: 'approved',
        approvalRecords: records,
        currentNodeIndex: -1,
        approvedAt: now,
        updatedAt: now
      }
      return { ok: true, message: '审批全部通过，调薪已生效' }
    }
  }

  function rejectCurrentNode(id: string, approverName: string, comment: string): { ok: boolean; message: string } {
    const idx = requests.value.findIndex((r) => r.id === id)
    if (idx === -1) return { ok: false, message: '申请单不存在' }
    const req = requests.value[idx]
    if (req.status !== 'pending') return { ok: false, message: '当前状态不可审批' }
    const nodeIdx = req.currentNodeIndex
    if (nodeIdx < 0 || nodeIdx >= req.approvalRecords.length) return { ok: false, message: '审批节点异常' }

    const records = [...req.approvalRecords]
    records[nodeIdx] = {
      ...records[nodeIdx],
      status: 'rejected',
      approverName,
      comment,
      operatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    releasePendingBudget(req.departmentId, req.adjustmentAmount * 12)
    requests.value[idx] = {
      ...req,
      status: 'rejected',
      approvalRecords: records,
      rejectedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    return { ok: true, message: '已驳回申请' }
  }

  function returnToApplicant(id: string, approverName: string, comment: string): { ok: boolean; message: string } {
    const idx = requests.value.findIndex((r) => r.id === id)
    if (idx === -1) return { ok: false, message: '申请单不存在' }
    const req = requests.value[idx]
    if (req.status !== 'pending') return { ok: false, message: '当前状态不可退回' }
    const nodeIdx = req.currentNodeIndex

    const records = [...req.approvalRecords]
    records[nodeIdx] = {
      ...records[nodeIdx],
      status: 'waiting',
      approverName: '',
      comment: `退回修改：${comment}（由 ${approverName} 退回）`,
      operatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    for (let i = 0; i < records.length; i++) {
      records[i] = { ...records[i], status: 'waiting', approverName: '' }
    }
    releasePendingBudget(req.departmentId, req.adjustmentAmount * 12)
    requests.value[idx] = {
      ...req,
      status: 'returned',
      approvalRecords: records,
      currentNodeIndex: -1,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    return { ok: true, message: '已退回申请人修改' }
  }

  function withdrawRequest(id: string): { ok: boolean; message: string } {
    const idx = requests.value.findIndex((r) => r.id === id)
    if (idx === -1) return { ok: false, message: '申请单不存在' }
    const req = requests.value[idx]
    if (req.status !== 'pending') return { ok: false, message: '仅审批中的申请可撤回' }
    releasePendingBudget(req.departmentId, req.adjustmentAmount * 12)
    const records = req.approvalRecords.map((r) => ({ ...r, status: 'waiting' as NodeApprovalStatus }))
    requests.value[idx] = {
      ...req,
      status: 'withdrawn',
      approvalRecords: records,
      currentNodeIndex: -1,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    return { ok: true, message: '已撤回申请' }
  }

  function deleteRequest(id: string): { ok: boolean; message: string } {
    const req = requests.value.find((r) => r.id === id)
    if (!req) return { ok: false, message: '申请单不存在' }
    if (req.status === 'approved') return { ok: false, message: '已通过的申请不可删除' }
    if (req.status === 'pending') releasePendingBudget(req.departmentId, req.adjustmentAmount * 12)
    requests.value = requests.value.filter((r) => r.id !== id)
    if (selectedRequestId.value === id) selectedRequestId.value = null
    return { ok: true, message: '已删除申请单' }
  }

  function addSalaryHistoryFromRequest(req: SalaryAdjustmentRequest, approvedAt: string, approverName: string) {
    salaryHistory.value.push({
      id: generateId(),
      employeeId: req.employeeId,
      employeeName: req.employeeName,
      departmentName: req.departmentName,
      position: req.position,
      oldSalary: req.currentSalary,
      newSalary: req.proposedSalary,
      adjustmentAmount: req.adjustmentAmount,
      adjustmentRatio: req.adjustmentRatio,
      reasonCategory: req.reasonCategory,
      reasonName: req.reasonName,
      effectiveDate: req.effectiveDate,
      approvedAt,
      applicantName: req.applicantName,
      approverName,
      description: req.description
    })
  }

  function getEmployeeHistory(employeeId: string): SalaryHistoryRecord[] {
    return salaryHistory.value
      .filter((h) => h.employeeId === employeeId)
      .sort((a, b) => dayjs(b.approvedAt).valueOf() - dayjs(a.approvedAt).valueOf())
  }

  function updateAnnualBudget(updates: Partial<AnnualSalaryBudget>) {
    if (!annualBudget.value) return
    annualBudget.value = {
      ...annualBudget.value,
      ...updates,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
  }

  function updateDepartmentBudget(departmentId: string, updates: Partial<DepartmentSalaryBudget>) {
    if (!annualBudget.value) return
    const idx = annualBudget.value.departments.findIndex((d) => d.departmentId === departmentId)
    if (idx === -1) return
    annualBudget.value.departments[idx] = { ...annualBudget.value.departments[idx], ...updates }
    annualBudget.value.totalBudget = round2(annualBudget.value.departments.reduce((s, d) => s + d.totalBudget, 0))
    annualBudget.value.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
  }

  function syncDepartmentsToBudget() {
    if (!annualBudget.value) {
      annualBudget.value = createInitialBudget()
      return
    }
    const existingIds = new Set(annualBudget.value.departments.map((d) => d.departmentId))
    for (const dept of bonusStore.departments) {
      if (!existingIds.has(dept.id)) {
        const totalAnnualSalary = dept.employees.reduce((sum, emp) => sum + emp.baseSalary * 12, 0)
        annualBudget.value.departments.push({
          departmentId: dept.id,
          departmentName: dept.name,
          totalBudget: round2(totalAnnualSalary * 0.1),
          usedAmount: 0,
          pendingAmount: 0,
          approvedCount: 0,
          pendingCount: 0,
          headcount: dept.employees.length,
          averageAdjustmentRatio: 0
        })
      } else {
        const db = annualBudget.value.departments.find((d) => d.departmentId === dept.id)
        if (db) {
          db.departmentName = dept.name
          db.headcount = dept.employees.length
        }
      }
    }
    annualBudget.value.departments = annualBudget.value.departments.filter((d) =>
      bonusStore.departments.some((bd) => bd.id === d.departmentId)
    )
    annualBudget.value.totalBudget = round2(annualBudget.value.departments.reduce((s, d) => s + d.totalBudget, 0))
    annualBudget.value.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
  }

  function exportModuleData(): SalaryAdjustmentModuleData {
    return {
      reasons: reasons.value,
      approvalWorkflow: approvalWorkflow.value,
      annualBudget: annualBudget.value,
      requests: requests.value,
      salaryHistory: salaryHistory.value
    }
  }

  function importModuleData(data: SalaryAdjustmentModuleData): boolean {
    try {
      reasons.value = data.reasons || []
      approvalWorkflow.value = data.approvalWorkflow || []
      annualBudget.value = data.annualBudget
      requests.value = data.requests || []
      salaryHistory.value = data.salaryHistory || []
      return true
    } catch {
      return false
    }
  }

  return {
    reasons,
    approvalWorkflow,
    annualBudget,
    requests,
    salaryHistory,
    selectedRequestId,
    sortedWorkflow,
    enabledReasons,
    pendingRequests,
    draftRequests,
    approvedRequests,
    rejectedRequests,
    budgetOverview,
    CATEGORY_LABELS,
    STATUS_LABELS,
    NODE_TYPE_LABELS,
    getCategoryLabel,
    getStatusLabel,
    getNodeTypeLabel,
    getStatusColor,
    getNodeStatusColor,
    getNodeStatusLabel,
    addReason,
    updateReason,
    removeReason,
    addApprovalNode,
    updateApprovalNode,
    removeApprovalNode,
    moveApprovalNode,
    calculateApplicableNodes,
    checkBudgetAvailability,
    createDraftRequest,
    updateRequest,
    submitRequest,
    approveCurrentNode,
    rejectCurrentNode,
    returnToApplicant,
    withdrawRequest,
    deleteRequest,
    getEmployeeHistory,
    updateAnnualBudget,
    updateDepartmentBudget,
    syncDepartmentsToBudget,
    exportModuleData,
    importModuleData
  }
})
