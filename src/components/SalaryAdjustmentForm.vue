<template>
  <n-form ref="formRef" :model="form" :rules="rules" label-placement="top" label-width="120px">
    <n-grid :cols="2" :x-gap="20">
      <n-gi>
        <n-form-item label="申请编号">
          <n-input v-model:value="form.requestNo" disabled />
        </n-form-item>
      </n-gi>
      <n-gi>
        <n-form-item label="申请日期">
          <n-input v-model:value="form.createdAt" disabled />
        </n-form-item>
      </n-gi>

      <n-gi>
        <n-form-item label="员工" path="employeeId">
          <n-select
            v-model:value="form.employeeId"
            :options="employeeOptions"
            placeholder="请选择员工"
            filterable
            @update:value="handleEmployeeChange"
          />
        </n-form-item>
      </n-gi>
      <n-gi>
        <n-form-item label="申请人">
          <n-input v-model:value="form.applicantName" placeholder="请输入申请人姓名" />
        </n-form-item>
      </n-gi>

      <n-gi>
        <n-form-item label="所属部门">
          <n-input :value="form.departmentName" disabled />
        </n-form-item>
      </n-gi>
      <n-gi>
        <n-form-item label="当前职位">
          <n-input :value="form.position" disabled />
        </n-form-item>
      </n-gi>

      <n-gi>
        <n-form-item label="当前月薪">
          <n-input-number
            v-model:value="form.currentSalary"
            :min="0"
            :precision="2"
            style="width: 100%"
            @update:value="calculateAdjustment"
          />
        </n-form-item>
      </n-gi>
      <n-gi>
        <n-form-item label="调薪后月薪" path="proposedSalary">
          <n-input-number
            v-model:value="form.proposedSalary"
            :min="0"
            :precision="2"
            style="width: 100%"
            @update:value="calculateAdjustment"
          />
        </n-form-item>
      </n-gi>

      <n-gi>
        <n-form-item label="调整金额（月）">
          <n-input :value="formatMoney(form.adjustmentAmount)" disabled />
        </n-form-item>
      </n-gi>
      <n-gi>
        <n-form-item label="调整比例">
          <n-input :value="`${(form.adjustmentRatio * 100).toFixed(2)}%`" disabled />
        </n-form-item>
      </n-gi>

      <n-gi>
        <n-form-item label="年度薪酬成本增加">
          <n-input :value="formatMoney(form.adjustmentAmount * 12)" disabled />
        </n-form-item>
      </n-gi>
      <n-gi>
        <n-form-item label="生效日期" path="effectiveDate">
          <n-date-picker
            v-model:value="form.effectiveDate"
            type="date"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </n-form-item>
      </n-gi>

      <n-gi>
        <n-form-item label="调薪事由分类" path="reasonCategory">
          <n-select
            v-model:value="form.reasonCategory"
            :options="categoryOptions"
            placeholder="请选择调薪事由分类"
            @update:value="handleCategoryChange"
          />
        </n-form-item>
      </n-gi>
      <n-gi>
        <n-form-item label="具体调薪事由" path="reasonId">
          <n-select
            v-model:value="form.reasonId"
            :options="filteredReasons"
            placeholder="请选择具体调薪事由"
            @update:value="handleReasonChange"
          />
        </n-form-item>
      </n-gi>

      <n-gi>
        <n-form-item label="建议调整比例范围" v-if="selectedReason">
          <n-input
            :value="`${(selectedReason.defaultMinRatio || 0) * 100}% ~ ${(selectedReason.defaultMaxRatio || 0) * 100}%`"
            disabled
          />
        </n-form-item>
      </n-gi>
      <n-gi>
        <n-form-item label="预算年度">
          <n-input v-model:value="form.budgetYear" disabled />
        </n-form-item>
      </n-gi>
    </n-grid>

    <n-form-item label="调薪说明" path="description">
      <n-input
        v-model:value="form.description"
        type="textarea"
        :rows="4"
        placeholder="请详细说明调薪原因、背景及依据"
      />
    </n-form-item>

    <n-form-item label="附件">
      <n-upload
        :show-file-list="true"
        multiple
        :max="5"
        :custom-request="() => {}"
        @before-upload="handleAttachmentUpload"
      >
        <n-button>
          <template #icon><UploadOutlined /></template>
          上传附件
        </n-button>
      </n-upload>
    </n-form-item>

    <n-divider title-placement="left">
      <n-text strong>调薪联动影响预览</n-text>
    </n-divider>

    <n-card v-if="previewData" title="年终奖与个税影响预览" size="small" style="margin-bottom: 16px">
      <n-grid :cols="2" :x-gap="16" :y-gap="12">
        <n-gi>
          <n-descriptions :column="1" size="small" bordered>
            <n-descriptions-item label="年度薪资（调薪前）">
              {{ formatCurrency(previewData.originalAnnualSalary) }}
            </n-descriptions-item>
            <n-descriptions-item label="年度薪资（调薪后）">
              {{ formatCurrency(previewData.adjustedAnnualSalary) }}
              <n-tag v-if="previewData.annualSalaryDiff > 0" type="success" size="small" style="margin-left: 8px">
                +{{ formatCurrency(previewData.annualSalaryDiff) }}
              </n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="社保专项扣除（调薪后）">
              {{ formatCurrency(previewData.adjustedSpecialDeduction) }}
            </n-descriptions-item>
          </n-descriptions>
        </n-gi>
        <n-gi>
          <n-descriptions :column="1" size="small" bordered>
            <n-descriptions-item label="年终奖（调薪前）">
              {{ formatCurrency(previewData.originalBonus) }}
            </n-descriptions-item>
            <n-descriptions-item label="年终奖（调薪后）">
              {{ formatCurrency(previewData.adjustedBonus) }}
              <n-tag v-if="previewData.bonusDiff > 0" type="success" size="small" style="margin-left: 8px">
                +{{ formatCurrency(previewData.bonusDiff) }}
              </n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="工龄加成（调薪后）">
              {{ formatCurrency(previewData.adjustedTenureBonus) }}
              <n-tag v-if="previewData.tenureBonusDiff > 0" type="success" size="small" style="margin-left: 8px">
                +{{ formatCurrency(previewData.tenureBonusDiff) }}
              </n-tag>
            </n-descriptions-item>
          </n-descriptions>
        </n-gi>
        <n-gi span="2">
          <n-card title="个税对比（并入综合所得）" size="small" embedded>
            <n-grid :cols="3" :x-gap="12">
              <n-gi>
                <n-statistic label="调薪前税款" :value="previewData.originalTaxComprehensive">
                  <template #suffix>元</template>
                </n-statistic>
              </n-gi>
              <n-gi>
                <n-statistic label="调薪后税款" :value="previewData.adjustedTaxComprehensive">
                  <template #suffix>元</template>
                </n-statistic>
              </n-gi>
              <n-gi>
                <n-statistic 
                  label="税款变化" 
                  :value="Math.abs(previewData.taxComprehensiveDiff)"
                  :value-style="{ color: previewData.taxComprehensiveDiff > 0 ? '#d03050' : '#2080f0' }"
                >
                  <template #prefix>
                    <n-icon v-if="previewData.taxComprehensiveDiff > 0"><ArrowUpOutlined /></n-icon>
                    <n-icon v-else><ArrowDownOutlined /></n-icon>
                  </template>
                  <template #suffix>元</template>
                </n-statistic>
              </n-gi>
            </n-grid>
          </n-card>
        </n-gi>
        <n-gi span="2">
          <n-alert type="info" :show-icon="true">
            <n-text strong>调薪影响说明：</n-text>
            <br />
            生效月份：{{ form.effectiveDate }}，年内生效 {{ previewData.effectiveMonths }} 个月
            <br />
            调薪幅度：{{ (form.adjustmentRatio * 100).toFixed(2) }}%，工龄加成系数提升 {{ (previewData.tenureBoost * 100).toFixed(2) }}%
            <br />
            更优计税方案：{{ previewData.betterMethod === 'oneTime' ? '一次性单独计税' : '并入综合所得' }}，
            可省税 {{ formatCurrency(previewData.savedTax) }}
          </n-alert>
        </n-gi>
      </n-grid>
    </n-card>

    <n-divider title-placement="left">
      <n-text strong>预算与审批预览</n-text>
    </n-divider>

    <n-alert v-if="budgetCheckResult" :type="budgetCheckResult.ok ? 'success' : 'error'" :show-icon="true" style="margin-bottom: 16px">
      {{ budgetCheckResult.message }}
    </n-alert>

    <n-card v-if="applicableNodes.length > 0" title="审批流程预览" size="small" style="margin-bottom: 16px">
      <n-steps :current="0" vertical>
        <n-step
          v-for="(node, index) in applicableNodes"
          :key="node.id"
          :title="node.name"
          :description="getNodeDescription(node)"
          :status="index === 0 ? 'process' : 'wait'"
        />
      </n-steps>
    </n-card>

    <n-space justify="end" style="margin-top: 24px">
      <n-button @click="handleCancel">取消</n-button>
      <n-button @click="handleSaveDraft">保存草稿</n-button>
      <n-button type="primary" @click="handleSubmit">提交审批</n-button>
    </n-space>
  </n-form>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useMessage, type FormInst, type FormRules } from 'naive-ui'
import { UploadOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@vicons/antd'
import { useSalaryAdjustmentStore } from '@/stores/salaryAdjustment'
import { useBonusStore } from '@/stores/bonus'
import type { SalaryAdjustmentRequest, AdjustmentReasonCategory, ApprovalNode } from '@/types'
import { round2, calculateOneTimeTax, calculateComprehensiveTax, formatCurrency } from '@/utils/tax'
import dayjs from 'dayjs'

const props = defineProps<{
  requestId: string | null
}>()

const emit = defineEmits<{
  submitted: []
  closed: []
}>()

const store = useSalaryAdjustmentStore()
const bonusStore = useBonusStore()
const message = useMessage()
const formRef = ref<FormInst | null>(null)

const form = reactive({
  id: '',
  requestNo: '',
  employeeId: '',
  applicantName: '当前用户',
  departmentId: '',
  departmentName: '',
  position: '',
  reasonCategory: 'annual' as AdjustmentReasonCategory,
  reasonId: '',
  reasonName: '',
  currentSalary: 0,
  proposedSalary: 0,
  adjustmentAmount: 0,
  adjustmentRatio: 0,
  effectiveDate: '',
  description: '',
  attachments: [] as string[],
  budgetYear: new Date().getFullYear(),
  createdAt: ''
})

const rules: FormRules = {
  employeeId: { required: true, message: '请选择员工', trigger: 'change' },
  proposedSalary: { required: true, message: '请输入调薪后月薪', trigger: 'blur' },
  effectiveDate: { required: true, message: '请选择生效日期', trigger: 'change' },
  reasonCategory: { required: true, message: '请选择调薪事由分类', trigger: 'change' },
  reasonId: { required: true, message: '请选择具体调薪事由', trigger: 'change' },
  description: { required: true, message: '请输入调薪说明', trigger: 'blur', min: 10 }
}

const employeeOptions = computed(() =>
  bonusStore.allEmployees.map((emp) => {
    const dept = bonusStore.getDepartmentById(emp.departmentId)
    return {
      label: `${emp.name} - ${emp.position} (${dept?.name || '未知部门'})`,
      value: emp.id
    }
  })
)

const categoryOptions = computed(() => {
  const categories = new Set(store.enabledReasons.map((r) => r.category))
  return Array.from(categories).map((cat) => ({
    label: store.getCategoryLabel(cat),
    value: cat
  }))
})

const filteredReasons = computed(() =>
  store.enabledReasons
    .filter((r) => r.category === form.reasonCategory)
    .map((r) => ({ label: r.name, value: r.id }))
)

const selectedEmployee = computed(() => {
  if (!form.employeeId) return null
  const emp = bonusStore.getEmployeeById(form.employeeId)
  if (!emp) return null
  const dept = bonusStore.getDepartmentById(emp.departmentId)
  return {
    ...emp,
    departmentName: dept?.name || ''
  }
})

const selectedReason = computed(() =>
  store.reasons.find((r) => r.id === form.reasonId)
)

const applicableNodes = computed(() => {
  if (form.adjustmentAmount <= 0) return []
  return store.calculateApplicableNodes(form.adjustmentAmount * 12)
})

const budgetCheckResult = computed(() => {
  if (!form.employeeId || form.adjustmentAmount <= 0) return null
  return store.checkBudgetAvailability(form.departmentId, form.adjustmentAmount * 12)
})

const previewData = computed(() => {
  if (!selectedEmployee.value || form.adjustmentAmount <= 0 || !form.effectiveDate) return null

  const year = dayjs(form.effectiveDate).year()
  const emp = selectedEmployee.value
  const bonusPool = bonusStore.bonusPool

  const originalAnnualSalary = bonusStore.calculateDynamicAnnualSalary(emp, year)
  const adjustedAnnualSalary = bonusStore.calculateDynamicAnnualSalary(emp, year, {
    effectiveDate: form.effectiveDate,
    oldSalary: form.currentSalary,
    newSalary: form.proposedSalary
  })

  const originalWeightedSalary = bonusStore.calculateWeightedBaseSalary(emp, year)
  const adjustedWeightedSalary = round2(
    (originalAnnualSalary + form.adjustmentAmount * (12 - dayjs(form.effectiveDate).month())) / 12
  )

  const base = originalWeightedSalary * bonusPool.baseRatio
  const adjustedBase = adjustedWeightedSalary * bonusPool.baseRatio

  const empImpacts = bonusStore.getEmployeeImpacts(emp.id)
  const existingAdjustmentRatio = empImpacts.reduce((sum, imp) => {
    if (imp.oldValue > 0) {
      return sum + ((imp.newValue - imp.oldValue) / imp.oldValue)
    }
    return sum
  }, 0)

  const originalTenureBonus = bonusStore.calculateAdjustedTenureBonus(emp, base, existingAdjustmentRatio)
  const adjustedTenureBonus = bonusStore.calculateAdjustedTenureBonus(
    emp,
    adjustedBase,
    existingAdjustmentRatio + form.adjustmentRatio
  )

  const performanceCoefficient = bonusStore.getPerformanceCoefficient(emp.performanceLevelId)
  const originalPerformanceBonus = round2(base * performanceCoefficient * bonusPool.performanceRatio)
  const adjustedPerformanceBonus = round2(adjustedBase * performanceCoefficient * bonusPool.performanceRatio)

  const tagCoefficient = bonusStore.getTagCoefficient(emp.tagIds)
  const originalTagBonus = round2(base * tagCoefficient)
  const adjustedTagBonus = round2(adjustedBase * tagCoefficient)

  const originalBaseAmount = round2(base + originalPerformanceBonus + originalTenureBonus + originalTagBonus)
  const adjustedBaseAmount = round2(adjustedBase + adjustedPerformanceBonus + adjustedTenureBonus + adjustedTagBonus)

  const deptAlloc = bonusStore.departmentAllocations[emp.departmentId] || 0
  const deptBaseTotal = originalBaseAmount * 2
  const scaleFactor = deptAlloc / deptBaseTotal

  const originalBonus = round2(originalBaseAmount * scaleFactor)
  const adjustedBonus = round2(adjustedBaseAmount * scaleFactor)

  const originalSpecialDeduction = round2(originalAnnualSalary * 0.22)
  const adjustedSpecialDeduction = round2(adjustedAnnualSalary * 0.22)

  const ci = bonusStore.comprehensiveIncome[emp.id] || {
    annualSalary: emp.baseSalary * 12,
    specialDeduction: emp.baseSalary * 12 * 0.22,
    specialAdditionalDeduction: 24000,
    otherDeduction: 0
  }

  const originalCompResult = calculateComprehensiveTax(
    originalAnnualSalary,
    originalBonus,
    originalSpecialDeduction,
    ci.specialAdditionalDeduction,
    ci.otherDeduction
  )
  const adjustedCompResult = calculateComprehensiveTax(
    adjustedAnnualSalary,
    adjustedBonus,
    adjustedSpecialDeduction,
    ci.specialAdditionalDeduction,
    ci.otherDeduction
  )

  const originalTaxOneTime = round2(calculateOneTimeTax(originalBonus))
  const adjustedTaxOneTime = round2(calculateOneTimeTax(adjustedBonus))

  const adjustedTaxComprehensive = round2(adjustedCompResult.taxDifference)

  let betterMethod: 'oneTime' | 'comprehensive' = 'oneTime'
  let savedTax = 0
  if (adjustedTaxOneTime < adjustedTaxComprehensive) {
    betterMethod = 'oneTime'
    savedTax = round2(adjustedTaxComprehensive - adjustedTaxOneTime)
  } else if (adjustedTaxComprehensive < adjustedTaxOneTime) {
    betterMethod = 'comprehensive'
    savedTax = round2(adjustedTaxOneTime - adjustedTaxComprehensive)
  }

  const effectiveMonth = dayjs(form.effectiveDate).month()
  const effectiveMonths = 12 - effectiveMonth

  const tenureBoost = Math.min(form.adjustmentRatio * 0.5, 0.1)

  return {
    originalAnnualSalary,
    adjustedAnnualSalary,
    annualSalaryDiff: round2(adjustedAnnualSalary - originalAnnualSalary),
    originalSpecialDeduction,
    adjustedSpecialDeduction,
    originalBonus,
    adjustedBonus,
    bonusDiff: round2(adjustedBonus - originalBonus),
    originalTenureBonus,
    adjustedTenureBonus,
    tenureBonusDiff: round2(adjustedTenureBonus - originalTenureBonus),
    originalTaxComprehensive: round2(originalCompResult.taxDifference),
    adjustedTaxComprehensive,
    taxComprehensiveDiff: round2(adjustedCompResult.taxDifference - originalCompResult.taxDifference),
    originalTaxOneTime,
    adjustedTaxOneTime,
    betterMethod,
    savedTax,
    effectiveMonths,
    tenureBoost
  }
})

function formatMoney(n: number): string {
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getNodeDescription(node: ApprovalNode): string {
  let desc = store.getNodeTypeLabel(node.type)
  if (node.minApprovalAmount !== undefined || node.maxApprovalAmount !== undefined) {
    const min = node.minApprovalAmount !== undefined ? `≥¥${node.minApprovalAmount.toLocaleString()}` : ''
    const max = node.maxApprovalAmount !== undefined ? `≤¥${node.maxApprovalAmount.toLocaleString()}` : ''
    desc += ` (${[min, max].filter(Boolean).join(', ')})`
  }
  return desc
}

function handleEmployeeChange() {
  if (selectedEmployee.value) {
    form.currentSalary = selectedEmployee.value.baseSalary
    form.departmentId = selectedEmployee.value.departmentId
    form.departmentName = selectedEmployee.value.departmentName
    form.position = selectedEmployee.value.position
    const defaultRatio = store.annualBudget?.defaultRatio || 0.08
    form.proposedSalary = round2(form.currentSalary * (1 + defaultRatio))
    calculateAdjustment()
  }
}

function handleCategoryChange() {
  form.reasonId = ''
  form.reasonName = ''
  const firstReason = store.enabledReasons.find((r) => r.category === form.reasonCategory)
  if (firstReason) {
    form.reasonId = firstReason.id
    form.reasonName = firstReason.name
    if (firstReason.defaultMaxRatio && form.currentSalary > 0) {
      const suggestedRatio = (firstReason.defaultMinRatio! + firstReason.defaultMaxRatio!) / 2
      form.proposedSalary = round2(form.currentSalary * (1 + suggestedRatio))
      calculateAdjustment()
    }
  }
}

function handleReasonChange() {
  if (selectedReason.value) {
    form.reasonName = selectedReason.value.name
    if (selectedReason.value.defaultMaxRatio && form.currentSalary > 0) {
      const suggestedRatio = (selectedReason.value.defaultMinRatio! + selectedReason.value.defaultMaxRatio!) / 2
      form.proposedSalary = round2(form.currentSalary * (1 + suggestedRatio))
      calculateAdjustment()
    }
  }
}

function calculateAdjustment() {
  const cs = form.currentSalary || 0
  const ps = form.proposedSalary || 0
  form.adjustmentAmount = round2(ps - cs)
  form.adjustmentRatio = cs > 0 ? round2((ps - cs) / cs) : 0
}

function handleAttachmentUpload({ file }: { file: File }) {
  form.attachments.push(file.name)
  message.success(`已添加附件：${file.name}`)
  return false
}

function loadRequest(id: string) {
  const req = store.requests.find((r) => r.id === id)
  if (req) {
    Object.assign(form, {
      id: req.id,
      requestNo: req.requestNo,
      employeeId: req.employeeId,
      applicantName: req.applicantName,
      departmentId: req.departmentId,
      departmentName: req.departmentName,
      position: req.position,
      reasonCategory: req.reasonCategory,
      reasonId: req.reasonId,
      reasonName: req.reasonName,
      currentSalary: req.currentSalary,
      proposedSalary: req.proposedSalary,
      adjustmentAmount: req.adjustmentAmount,
      adjustmentRatio: req.adjustmentRatio,
      effectiveDate: req.effectiveDate,
      description: req.description,
      attachments: [...req.attachments],
      budgetYear: req.budgetYear,
      createdAt: req.createdAt
    })
  }
}

function initNewRequest() {
  const now = new Date()
  form.createdAt = now.toISOString().slice(0, 16).replace('T', ' ')
  form.budgetYear = now.getFullYear()
  if (store.enabledReasons.length > 0) {
    const firstReason = store.enabledReasons[0]
    form.reasonCategory = firstReason.category
    form.reasonId = firstReason.id
    form.reasonName = firstReason.name
  }
  form.effectiveDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10)
}

async function validateForm(): Promise<boolean> {
  try {
    await formRef.value?.validate()
    return true
  } catch {
    return false
  }
}

function collectFormData(): Partial<SalaryAdjustmentRequest> {
  return {
    employeeId: form.employeeId,
    applicantName: form.applicantName,
    reasonCategory: form.reasonCategory,
    reasonId: form.reasonId,
    reasonName: form.reasonName,
    currentSalary: form.currentSalary,
    proposedSalary: form.proposedSalary,
    adjustmentAmount: form.adjustmentAmount,
    adjustmentRatio: form.adjustmentRatio,
    effectiveDate: form.effectiveDate,
    description: form.description,
    attachments: form.attachments,
    budgetYear: form.budgetYear
  }
}

function handleCancel() {
  emit('closed')
}

function handleSaveDraft() {
  if (!form.employeeId) {
    message.error('请先选择员工')
    return
  }
  const data = collectFormData()
  if (props.requestId) {
    store.updateRequest(props.requestId, data)
  } else {
    const req = store.createDraftRequest(form.employeeId)
    store.updateRequest(req.id, data)
  }
  message.success('草稿已保存')
  emit('submitted')
}

async function handleSubmit() {
  const valid = await validateForm()
  if (!valid) return

  let reqId = props.requestId
  if (!reqId) {
    const req = store.createDraftRequest(form.employeeId)
    reqId = req.id
  }
  store.updateRequest(reqId, collectFormData())

  const res = store.submitRequest(reqId)
  if (res.ok) {
    message.success(res.message)
    emit('submitted')
  } else {
    message.error(res.message)
  }
}

onMounted(() => {
  if (props.requestId) {
    loadRequest(props.requestId)
  } else {
    initNewRequest()
  }
})

watch(
  () => props.requestId,
  (newId) => {
    if (newId) {
      loadRequest(newId)
    } else {
      initNewRequest()
    }
  }
)
</script>
