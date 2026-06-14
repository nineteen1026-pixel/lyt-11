<template>
  <n-space vertical :size="16" style="width: 100%">
    <n-card>
      <n-space justify="space-between" align="center" style="width: 100%">
        <n-space vertical :size="4">
          <n-text strong style="font-size: 18px">{{ store.annualBudget?.year || currentYear }} 年度调薪预算控盘</n-text>
          <n-text depth="3" style="font-size: 13px">实时监控各部门调薪预算使用情况，确保年度薪酬成本在可控范围内</n-text>
        </n-space>
        <n-space>
          <n-button @click="handleSyncDepts">
            <template #icon><SyncOutlined /></template>
            同步部门
          </n-button>
          <n-button type="primary" @click="showEditModal = true">
            <template #icon><SettingOutlined /></template>
            预算设置
          </n-button>
        </n-space>
      </n-space>
    </n-card>

    <n-card v-if="budgetOverview">
      <template #header-extra>
        <n-tag type="info">整体预算概览</n-tag>
      </template>
      <n-grid :cols="4" :x-gap="20">
        <n-gi>
          <div class="stat-card">
            <div class="stat-label">年度总预算</div>
            <div class="stat-value">{{ formatMoney(budgetOverview.totalBudget) }}</div>
            <div class="stat-sub">年度薪酬成本增加上限</div>
          </div>
        </n-gi>
        <n-gi>
          <div class="stat-card used">
            <div class="stat-label">已使用</div>
            <div class="stat-value">{{ formatMoney(budgetOverview.usedAmount) }}</div>
            <div class="stat-sub">
              <n-progress
                :percentage="Math.round(budgetOverview.usedRatio * 100)"
                :color="getProgressColor(budgetOverview.usedRatio)"
                :stroke-width="6"
                :show-indicator="false"
                style="width: 120px; display: inline-block; margin-right: 8px"
              />
              {{ (budgetOverview.usedRatio * 100).toFixed(1) }}%
            </div>
          </div>
        </n-gi>
        <n-gi>
          <div class="stat-card pending">
            <div class="stat-label">审批中占用</div>
            <div class="stat-value">{{ formatMoney(budgetOverview.pendingAmount) }}</div>
            <div class="stat-sub">
              <n-progress
                :percentage="Math.round(budgetOverview.pendingRatio * 100)"
                color="#fa8c16"
                :stroke-width="6"
                :show-indicator="false"
                style="width: 120px; display: inline-block; margin-right: 8px"
              />
              {{ (budgetOverview.pendingRatio * 100).toFixed(1) }}%
            </div>
          </div>
        </n-gi>
        <n-gi>
          <div class="stat-card available">
            <div class="stat-label">可用余额</div>
            <div class="stat-value">{{ formatMoney(budgetOverview.available) }}</div>
            <div class="stat-sub">含预留 {{ formatMoney(store.annualBudget?.reservedAmount || 0) }}</div>
          </div>
        </n-gi>
      </n-grid>
    </n-card>

    <n-card title="预算参数设置" size="small">
      <n-descriptions :column="4" bordered>
        <n-descriptions-item label="默认调薪比例">
          <n-tag type="primary">{{ (store.annualBudget?.defaultRatio || 0) * 100 }}%</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="最低调薪比例">
          <n-tag>{{ (store.annualBudget?.minAdjustmentRatio || 0) * 100 }}%</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="最高调薪比例">
          <n-tag type="warning">{{ (store.annualBudget?.maxAdjustmentRatio || 0) * 100 }}%</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="预留比例">
          <n-tag type="info">{{ store.annualBudget ? round2(store.annualBudget.reservedAmount / store.annualBudget.totalBudget) * 100 : 0 }}%</n-tag>
        </n-descriptions-item>
      </n-descriptions>
    </n-card>

    <n-card title="部门预算明细">
      <template #header-extra>
        <n-space>
          <n-tag v-if="totalApprovedCount > 0" type="success">已批准 {{ totalApprovedCount }} 笔</n-tag>
          <n-tag v-if="totalPendingCount > 0" type="warning">审批中 {{ totalPendingCount }} 笔</n-tag>
        </n-space>
      </template>
      <n-data-table
        :columns="columns"
        :data="store.annualBudget?.departments || []"
        :row-key="(row: any) => row.departmentId"
        striped
        :pagination="false"
      >
        <template #body="{ rows }">
          <tbody>
            <tr v-for="row in rows" :key="row.departmentId">
              <td>
                <n-text strong>{{ row.departmentName }}</n-text>
              </td>
              <td>{{ row.headcount }} 人</td>
              <td>{{ formatMoney(row.totalBudget) }}</td>
              <td>
                <n-text type="success">{{ formatMoney(row.usedAmount) }}</n-text>
              </td>
              <td>
                <n-text type="warning">{{ formatMoney(row.pendingAmount) }}</n-text>
              </td>
              <td>
                <n-text type="primary">{{ formatMoney(row.totalBudget - row.usedAmount - row.pendingAmount) }}</n-text>
              </td>
              <td>
                <n-space>
                  <n-tag size="small" type="success" v-if="row.approvedCount > 0">{{ row.approvedCount }}笔</n-tag>
                  <n-tag size="small" type="warning" v-if="row.pendingCount > 0">{{ row.pendingCount }}笔</n-tag>
                </n-space>
              </td>
              <td>
                <n-tag :color="getAvgRatioColor(row.averageAdjustmentRatio)" size="small">
                  {{ (row.averageAdjustmentRatio * 100).toFixed(2) }}%
                </n-tag>
              </td>
              <td>
                <div class="progress-cell">
                  <n-progress
                    :percentage="Math.round((row.usedAmount / row.totalBudget) * 100)"
                    :color="getProgressColor(row.usedAmount / row.totalBudget)"
                    :stroke-width="8"
                    :show-indicator="false"
                  />
                  <span class="progress-text">{{ ((row.usedAmount / row.totalBudget) * 100).toFixed(1) }}%</span>
                </div>
              </td>
              <td>
                <n-button size="small" quaternary type="primary" @click="handleEditDept(row)">
                  <template #icon><EditOutlined /></template>
                  调整
                </n-button>
              </td>
            </tr>
          </tbody>
        </template>
      </n-data-table>
    </n-card>

    <n-modal v-model:show="showEditModal" preset="card" style="width: 520px" title="年度预算设置" :mask-closable="false">
      <n-form ref="budgetFormRef" :model="budgetForm" :rules="budgetRules" label-placement="left" label-width="140px">
        <n-form-item label="预算年度">
          <n-input v-model:value="budgetForm.year" disabled />
        </n-form-item>
        <n-form-item label="年度总预算" path="totalBudget">
          <n-input-number v-model:value="budgetForm.totalBudget" :min="0" :precision="2" style="width: 100%" />
        </n-form-item>
        <n-form-item label="预留金额" path="reservedAmount">
          <n-input-number v-model:value="budgetForm.reservedAmount" :min="0" :precision="2" style="width: 100%" />
          <n-text depth="3" style="font-size: 12px">用于特殊情况的预算储备</n-text>
        </n-form-item>
        <n-form-item label="默认调薪比例" path="defaultRatio">
          <n-input-number v-model:value="budgetForm.defaultRatio" :min="0" :max="1" :step="0.01" :precision="2" style="width: 100%" />
          <n-text depth="3" style="font-size: 12px">新建申请时默认使用的比例，如 0.08 表示 8%</n-text>
        </n-form-item>
        <n-form-item label="最低调薪比例" path="minAdjustmentRatio">
          <n-input-number v-model:value="budgetForm.minAdjustmentRatio" :min="0" :max="1" :step="0.01" :precision="2" style="width: 100%" />
        </n-form-item>
        <n-form-item label="最高调薪比例" path="maxAdjustmentRatio">
          <n-input-number v-model:value="budgetForm.maxAdjustmentRatio" :min="0" :max="1" :step="0.01" :precision="2" style="width: 100%" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showEditModal = false">取消</n-button>
          <n-button type="primary" @click="handleSaveBudget">确定</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showDeptModal" preset="card" style="width: 480px" title="调整部门预算" :mask-closable="false">
      <n-form ref="deptFormRef" :model="deptForm" :rules="deptRules" label-placement="left" label-width="120px">
        <n-form-item label="部门名称">
          <n-input v-model:value="deptForm.departmentName" disabled />
        </n-form-item>
        <n-form-item label="部门人数">
          <n-input :value="String(deptForm.headcount)" disabled />
        </n-form-item>
        <n-form-item label="部门预算总额" path="totalBudget">
          <n-input-number v-model:value="deptForm.totalBudget" :min="0" :precision="2" style="width: 100%" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showDeptModal = false">取消</n-button>
          <n-button type="primary" @click="handleSaveDept">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </n-space>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useMessage, type FormInst, type FormRules, type DataTableColumns } from 'naive-ui'
import { SyncOutlined, SettingOutlined, EditOutlined } from '@vicons/antd'
import { useSalaryAdjustmentStore } from '@/stores/salaryAdjustment'
import type { DepartmentSalaryBudget } from '@/types'
import { round2 } from '@/utils/tax'

const store = useSalaryAdjustmentStore()
const message = useMessage()

const currentYear = new Date().getFullYear()
const showEditModal = ref(false)
const showDeptModal = ref(false)
const budgetFormRef = ref<FormInst | null>(null)
const deptFormRef = ref<FormInst | null>(null)
const editingDeptId = ref<string | null>(null)

const budgetForm = reactive({
  year: currentYear,
  totalBudget: 0,
  reservedAmount: 0,
  defaultRatio: 0.08,
  minAdjustmentRatio: 0.01,
  maxAdjustmentRatio: 0.35
})

const deptForm = reactive({
  departmentId: '',
  departmentName: '',
  headcount: 0,
  totalBudget: 0
})

const budgetRules: FormRules = {
  totalBudget: { required: true, message: '请输入年度总预算', trigger: 'blur', type: 'number', min: 0 },
  reservedAmount: { required: true, message: '请输入预留金额', trigger: 'blur', type: 'number', min: 0 },
  defaultRatio: { required: true, message: '请输入默认比例', trigger: 'blur', type: 'number', min: 0, max: 1 },
  minAdjustmentRatio: { required: true, message: '请输入最低比例', trigger: 'blur', type: 'number', min: 0, max: 1 },
  maxAdjustmentRatio: { required: true, message: '请输入最高比例', trigger: 'blur', type: 'number', min: 0, max: 1 }
}

const deptRules: FormRules = {
  totalBudget: { required: true, message: '请输入部门预算总额', trigger: 'blur', type: 'number', min: 0 }
}

const budgetOverview = computed(() => store.budgetOverview)

const totalApprovedCount = computed(() =>
  store.annualBudget?.departments.reduce((sum, d) => sum + d.approvedCount, 0) || 0
)

const totalPendingCount = computed(() =>
  store.annualBudget?.departments.reduce((sum, d) => sum + d.pendingCount, 0) || 0
)

const columns: DataTableColumns<any> = [
  { title: '部门', key: 'departmentName', width: 140 },
  { title: '人数', key: 'headcount', width: 80 },
  { title: '总预算', key: 'totalBudget', width: 140 },
  { title: '已使用', key: 'usedAmount', width: 140 },
  { title: '审批中', key: 'pendingAmount', width: 140 },
  { title: '可用余额', key: 'available', width: 140 },
  { title: '申请数', key: 'counts', width: 120 },
  { title: '平均调薪比例', key: 'avgRatio', width: 120 },
  { title: '使用率', key: 'usage', width: 160 },
  { title: '操作', key: 'actions', width: 100 }
]

function formatMoney(n: number): string {
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getProgressColor(ratio: number): string {
  if (ratio >= 0.9) return '#f5222d'
  if (ratio >= 0.7) return '#fa8c16'
  if (ratio >= 0.5) return '#faad14'
  return '#52c41a'
}

function getAvgRatioColor(ratio: number): string {
  if (ratio >= 0.15) return '#f5222d'
  if (ratio >= 0.1) return '#fa8c16'
  if (ratio >= 0.05) return '#1890ff'
  return '#52c41a'
}

function handleSyncDepts() {
  store.syncDepartmentsToBudget()
  message.success('部门信息已同步')
}

function handleEditDept(dept: DepartmentSalaryBudget) {
  editingDeptId.value = dept.departmentId
  Object.assign(deptForm, {
    departmentId: dept.departmentId,
    departmentName: dept.departmentName,
    headcount: dept.headcount,
    totalBudget: dept.totalBudget
  })
  showDeptModal.value = true
}

async function handleSaveBudget() {
  try {
    await budgetFormRef.value?.validate()
    if (budgetForm.minAdjustmentRatio > budgetForm.maxAdjustmentRatio) {
      message.error('最低比例不能大于最高比例')
      return
    }
    if (budgetForm.defaultRatio < budgetForm.minAdjustmentRatio || budgetForm.defaultRatio > budgetForm.maxAdjustmentRatio) {
      message.error('默认比例应在最小和最大比例之间')
      return
    }
    store.updateAnnualBudget({ ...budgetForm })
    message.success('预算设置已保存')
    showEditModal.value = false
  } catch {
    // validation failed
  }
}

async function handleSaveDept() {
  try {
    await deptFormRef.value?.validate()
    if (editingDeptId.value) {
      store.updateDepartmentBudget(editingDeptId.value, { totalBudget: deptForm.totalBudget })
      message.success('部门预算已更新')
      showDeptModal.value = false
    }
  } catch {
    // validation failed
  }
}
</script>

<style scoped>
.stat-card {
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%);
  padding: 20px;
  border-radius: 12px;
  text-align: center;
}
.stat-card.used {
  background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
}
.stat-card.pending {
  background: linear-gradient(135deg, #fffbe6 0%, #ffe7ba 100%);
}
.stat-card.available {
  background: linear-gradient(135deg, #e6fffb 0%, #b5f5ec 100%);
}
.stat-label {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #262626;
  margin-bottom: 6px;
}
.stat-sub {
  font-size: 12px;
  color: #8c8c8c;
}
.progress-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.progress-cell .n-progress {
  flex: 1;
  max-width: 120px;
}
.progress-text {
  font-size: 12px;
  color: #8c8c8c;
  white-space: nowrap;
}
</style>
