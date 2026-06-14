<template>
  <n-space vertical :size="16" style="width: 100%">
    <n-card>
      <n-space justify="space-between" align="center" style="width: 100%">
        <n-space>
          <n-select
            v-model:value="filterStatus"
            :options="statusOptions"
            placeholder="状态筛选"
            style="width: 160px"
            clearable
          />
          <n-select
            v-model:value="filterDepartment"
            :options="departmentOptions"
            placeholder="部门筛选"
            style="width: 180px"
            clearable
          />
          <n-select
            v-model:value="filterReason"
            :options="reasonOptions"
            placeholder="事由筛选"
            style="width: 180px"
            clearable
          />
          <n-input
            v-model:value="searchKeyword"
            placeholder="搜索申请编号/员工姓名"
            clearable
            style="width: 240px"
          >
            <template #prefix>
              <n-icon><SearchOutlined /></n-icon>
            </template>
          </n-input>
        </n-space>
        <n-space>
          <n-button @click="showForm = true; editingId = null">
            <template #icon><PlusOutlined /></template>
            新建申请
          </n-button>
        </n-space>
      </n-space>
    </n-card>

    <n-card title="申请单列表">
      <template #header-extra>
        <n-space>
          <n-tag type="info">总计 {{ filteredRequests.length }} 条</n-tag>
          <n-tag type="warning" v-if="pendingCount > 0">待审批 {{ pendingCount }}</n-tag>
          <n-tag type="success" v-if="approvedCount > 0">已通过 {{ approvedCount }}</n-tag>
        </n-space>
      </template>

      <n-data-table
        :columns="columns"
        :data="filteredRequests"
        :pagination="pagination"
        :row-key="(row: any) => row.id"
        striped
      >
        <template #body="{ rows }">
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td class="col-request-no">
                <n-text strong>{{ row.requestNo }}</n-text>
              </td>
              <td>
                <n-space vertical :size="2">
                  <n-text>{{ row.employeeName }}</n-text>
                  <n-text depth="3" style="font-size: 12px">{{ row.position }}</n-text>
                </n-space>
              </td>
              <td>{{ row.departmentName }}</td>
              <td>
                <n-tag :color="reasonCategoryColors[row.reasonCategory as AdjustmentReasonCategory]" bordered>
                  {{ store.getCategoryLabel(row.reasonCategory as AdjustmentReasonCategory) }}
                </n-tag>
                <div style="font-size: 12px; color: #8c8c8c; margin-top: 2px">{{ row.reasonName }}</div>
              </td>
              <td class="col-salary">
                <div>当前：{{ formatMoney(row.currentSalary) }}</div>
                <div style="color: #52c41a; margin-top: 2px">
                  调整：+{{ formatMoney(row.adjustmentAmount) }}
                  <span style="font-size: 12px">({{ (row.adjustmentRatio * 100).toFixed(1) }}%)</span>
                </div>
              </td>
              <td>{{ row.effectiveDate }}</td>
              <td>
                <n-tag :color="store.getStatusColor(row.status)" bordered round>
                  {{ store.getStatusLabel(row.status) }}
                </n-tag>
              </td>
              <td>{{ formatDate(row.createdAt) }}</td>
              <td>
                <n-space>
                  <n-button size="small" quaternary type="primary" @click="viewDetail(row)">
                    <template #icon><EyeOutlined /></template>
                    详情
                  </n-button>
                  <n-dropdown
                    trigger="click"
                    :options="getActionOptions(row)"
                    @select="(key: string) => handleAction(key, row)"
                  >
                    <n-button size="small" quaternary>
                      <template #icon><MoreOutlined /></template>
                      操作
                    </n-button>
                  </n-dropdown>
                </n-space>
              </td>
            </tr>
          </tbody>
        </template>
      </n-data-table>
    </n-card>

    <n-modal v-model:show="showForm" preset="card" style="width: 900px" :title="editingId ? '编辑调薪申请' : '新建调薪申请'" :mask-closable="false">
      <SalaryAdjustmentForm
        v-if="showForm"
        :request-id="editingId"
        @submitted="handleFormSubmitted"
        @closed="showForm = false"
      />
    </n-modal>

    <n-modal v-model:show="showDetail" preset="card" style="width: 800px" :title="`申请单详情 - ${detailRequest?.requestNo}`">
      <SalaryAdjustmentDetail v-if="detailRequest && showDetail" :request="detailRequest" :show-actions="true" @action="handleDetailAction" />
    </n-modal>

    <n-modal v-model:show="showApproval" preset="card" style="width: 520px" :title="approvalActionTitle" :mask-closable="false">
      <n-alert v-if="detectedDelegation" type="warning" :bordered="false" style="margin-bottom: 16px">
        <template #icon>
          <n-icon><UserSwitchOutlined /></n-icon>
        </template>
        <n-space vertical :size="4">
          <n-text strong>检测到有效的委托代办</n-text>
          <n-text depth="2" style="font-size: 12px">
            授权人「{{ detectedDelegation.delegatorName }}」已委托您（{{ detectedDelegation.delegateName }}）在
            {{ detectedDelegation.startDate }} ~ {{ detectedDelegation.endDate }} 期间代为审批。
          </n-text>
        </n-space>
      </n-alert>
      <n-form ref="approvalFormRef" :model="approvalForm" :rules="approvalRules" label-placement="left" label-width="80px">
        <n-form-item label="审批人" path="approverName">
          <n-input v-model:value="approvalForm.approverName" placeholder="请输入审批人姓名" @update:value="checkDelegation" />
        </n-form-item>
        <n-form-item label="审批意见" path="comment">
          <n-input v-model:value="approvalForm.comment" type="textarea" :rows="4" placeholder="请输入审批意见" />
        </n-form-item>
        <n-form-item v-if="detectedDelegation" label="标记代审">
          <n-space align="center">
            <n-switch v-model:value="approvalForm.markAsDelegated" />
            <n-text depth="2" style="font-size: 12px">标记后将在审批轨迹中显示「代审」标识</n-text>
          </n-space>
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showApproval = false">取消</n-button>
          <n-button :type="approvalActionType === 'approve' ? 'success' : approvalActionType === 'reject' ? 'error' : 'warning'" @click="handleApprovalSubmit">
            确认{{ approvalActionType === 'approve' ? '通过' : approvalActionType === 'reject' ? '驳回' : '退回' }}
            {{ approvalForm.markAsDelegated ? '（代审）' : '' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </n-space>
</template>

<script setup lang="ts">
import { ref, computed, reactive, h } from 'vue'
import { useMessage, useDialog, type FormInst, type FormRules, type DataTableColumns, type DropdownOption } from 'naive-ui'
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  MoreOutlined,
  UserSwitchOutlined
} from '@vicons/antd'
import { useSalaryAdjustmentStore } from '@/stores/salaryAdjustment'
import { useBonusStore } from '@/stores/bonus'
import SalaryAdjustmentForm from './SalaryAdjustmentForm.vue'
import SalaryAdjustmentDetail from './SalaryAdjustmentDetail.vue'
import type { SalaryAdjustmentRequest, AdjustmentReasonCategory, ApprovalStatus, ApprovalDelegation } from '@/types'

const store = useSalaryAdjustmentStore()
const bonusStore = useBonusStore()
const message = useMessage()
const dialog = useDialog()

const filterStatus = ref<ApprovalStatus | null>(null)
const filterDepartment = ref<string | null>(null)
const filterReason = ref<string | null>(null)
const searchKeyword = ref('')

const showForm = ref(false)
const editingId = ref<string | null>(null)
const showDetail = ref(false)
const detailRequest = ref<SalaryAdjustmentRequest | null>(null)

const showApproval = ref(false)
const approvalActionType = ref<'approve' | 'reject' | 'return'>('approve')
const approvalActionId = ref<string | null>(null)
const approvalFormRef = ref<FormInst | null>(null)
const approvalForm = reactive({ approverName: '', comment: '', markAsDelegated: false })
const detectedDelegation = ref<ApprovalDelegation | null>(null)
const approvalRules: FormRules = {
  approverName: { required: true, message: '请输入审批人姓名', trigger: 'blur' },
  comment: { required: true, message: '请输入审批意见', trigger: 'blur', min: 2 }
}

const approvalActionTitle = computed(() => {
  const map = { approve: '审批通过', reject: '审批驳回', return: '退回修改' }
  return map[approvalActionType.value]
})

const reasonCategoryColors: Record<AdjustmentReasonCategory, string> = {
  annual: '#1890ff',
  performance: '#52c41a',
  promotion: '#722ed1',
  market: '#13c2c2',
  certification: '#fa8c16',
  transfer: '#eb2f96',
  special: '#f5222d'
}

const statusOptions = [
  { label: '草稿', value: 'draft' as ApprovalStatus },
  { label: '审批中', value: 'pending' as ApprovalStatus },
  { label: '已通过', value: 'approved' as ApprovalStatus },
  { label: '已驳回', value: 'rejected' as ApprovalStatus },
  { label: '已退回', value: 'returned' as ApprovalStatus },
  { label: '已撤回', value: 'withdrawn' as ApprovalStatus }
]

const departmentOptions = computed(() =>
  bonusStore.departments.map((d) => ({ label: d.name, value: d.id }))
)

const reasonOptions = computed(() =>
  store.enabledReasons.map((r) => ({ label: r.name, value: r.id }))
)

const pendingCount = computed(() => store.pendingRequests.length)
const approvedCount = computed(() => store.approvedRequests.length)

const filteredRequests = computed(() => {
  let list = [...store.requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (filterStatus.value) list = list.filter((r) => r.status === filterStatus.value)
  if (filterDepartment.value) list = list.filter((r) => r.departmentId === filterDepartment.value)
  if (filterReason.value) list = list.filter((r) => r.reasonId === filterReason.value)
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(
      (r) => r.requestNo.toLowerCase().includes(kw) || r.employeeName.toLowerCase().includes(kw)
    )
  }
  return list
})

const pagination = reactive({ pageSize: 10, showSizePicker: true, pageSizes: [10, 20, 50] })

const columns: DataTableColumns<any> = [
  { title: '申请编号', key: 'requestNo' },
  { title: '员工信息', key: 'employee' },
  { title: '部门', key: 'departmentName' },
  { title: '调薪事由', key: 'reason' },
  { title: '薪资调整', key: 'salary' },
  { title: '生效日期', key: 'effectiveDate' },
  { title: '状态', key: 'status' },
  { title: '申请时间', key: 'createdAt' },
  { title: '操作', key: 'actions', width: 180 }
]

function formatMoney(n: number): string {
  return `¥${n.toLocaleString()}`
}

function formatDate(s: string): string {
  return s ? s.substring(0, 16).replace('T', ' ') : '-'
}

function getActionOptions(row: SalaryAdjustmentRequest): DropdownOption[] {
  const opts: DropdownOption[] = []
  if (row.status === 'draft' || row.status === 'returned') {
    opts.push({ label: () => h('span', [h('span', { style: 'margin-right:8px' }, '✏️'), '编辑']), key: 'edit' })
    opts.push({ label: () => h('span', [h('span', { style: 'margin-right:8px' }, '📤'), '提交审批']), key: 'submit' })
  }
  if (row.status === 'pending') {
    opts.push({ label: () => h('span', [h('span', { style: 'margin-right:8px' }, '✅'), '审批通过']), key: 'approve' })
    opts.push({ label: () => h('span', [h('span', { style: 'margin-right:8px' }, '❌'), '审批驳回']), key: 'reject' })
    opts.push({ label: () => h('span', [h('span', { style: 'margin-right:8px' }, '↩️'), '退回修改']), key: 'return' })
    opts.push({ label: () => h('span', [h('span', { style: 'margin-right:8px' }, '⬅️'), '撤回申请']), key: 'withdraw' })
  }
  if (row.status === 'rejected' && row.rejectedFromNodeIndex !== undefined) {
    opts.push({ label: () => h('span', [h('span', { style: 'margin-right:8px' }, '🔄'), '回退至原审批节点']), key: 'rollback' })
  }
  if (row.status !== 'approved') {
    opts.push({ type: 'divider', key: 'd' })
    opts.push({ label: () => h('span', { style: 'color:#f5222d' }, [h('span', { style: 'margin-right:8px' }, '🗑️'), '删除']), key: 'delete' })
  }
  return opts
}

function handleAction(key: string, row: SalaryAdjustmentRequest) {
  switch (key) {
    case 'edit':
      editingId.value = row.id
      showForm.value = true
      break
    case 'submit':
      handleSubmit(row.id)
      break
    case 'approve':
    case 'reject':
    case 'return':
      openApproval(key as any, row.id)
      break
    case 'rollback':
      handleRollback(row.id)
      break
    case 'withdraw':
      handleWithdraw(row.id)
      break
    case 'delete':
      handleDelete(row.id)
      break
  }
}

function viewDetail(row: SalaryAdjustmentRequest) {
  detailRequest.value = row
  showDetail.value = true
}

function handleDetailAction(action: { type: string; id: string }) {
  showDetail.value = false
  if (action.type === 'edit') {
    editingId.value = action.id
    showForm.value = true
  } else if (action.type === 'submit') {
    handleSubmit(action.id)
  } else if (action.type === 'approve' || action.type === 'reject' || action.type === 'return') {
    openApproval(action.type as any, action.id)
  } else if (action.type === 'rollback') {
    handleRollback(action.id)
  } else if (action.type === 'withdraw') {
    handleWithdraw(action.id)
  } else if (action.type === 'delete') {
    handleDelete(action.id)
  }
}

function handleSubmit(id: string) {
  const res = store.submitRequest(id)
  if (res.ok) message.success(res.message)
  else message.error(res.message)
}

function openApproval(type: 'approve' | 'reject' | 'return', id: string) {
  approvalActionType.value = type
  approvalActionId.value = id
  approvalForm.approverName = ''
  approvalForm.comment = ''
  approvalForm.markAsDelegated = false
  detectedDelegation.value = null
  showApproval.value = true
}

function checkDelegation(approverName: string) {
  if (!approvalActionId.value) return
  const req = store.requests.find((r) => r.id === approvalActionId.value)
  if (!req || req.status !== 'pending') return
  const currentNode = req.workflowSnapshot[req.currentNodeIndex]
  if (!currentNode) return
  const delegation = store.getValidDelegationForApprover(currentNode.id, approverName)
  detectedDelegation.value = delegation
  if (delegation) {
    approvalForm.markAsDelegated = true
  }
}

async function handleApprovalSubmit() {
  try {
    await approvalFormRef.value?.validate()
    if (!approvalActionId.value) return
    let res
    const isDelegated = !!(approvalForm.markAsDelegated && detectedDelegation.value)
    const delegatorName = isDelegated ? detectedDelegation.value!.delegatorName : undefined
    if (approvalActionType.value === 'approve') {
      res = store.approveCurrentNode(
        approvalActionId.value,
        approvalForm.approverName,
        approvalForm.comment,
        isDelegated,
        delegatorName
      )
    } else if (approvalActionType.value === 'reject') {
      if (isDelegated && delegatorName) {
        res = store.delegateRejectCurrentNode(
          approvalActionId.value,
          approvalForm.approverName,
          delegatorName,
          approvalForm.comment
        )
      } else {
        res = store.rejectCurrentNode(
          approvalActionId.value,
          approvalForm.approverName,
          approvalForm.comment,
          false,
          undefined
        )
      }
    } else {
      res = store.returnToApplicant(
        approvalActionId.value,
        approvalForm.approverName,
        approvalForm.comment,
        isDelegated,
        delegatorName
      )
    }
    if (res.ok) {
      message.success(res.message)
      showApproval.value = false
    } else {
      message.error(res.message)
    }
  } catch {
    // validation failed
  }
}

function handleRollback(id: string) {
  dialog.warning({
    title: '确认回退',
    content: '确定要将此申请回退至原审批节点吗？回退后该节点将重新进入审批流程。',
    positiveText: '确认回退',
    negativeText: '取消',
    onPositiveClick: () => {
      const res = store.rollbackToOriginalNode(id)
      if (res.ok) message.success(res.message)
      else message.error(res.message)
    }
  })
}

function handleWithdraw(id: string) {
  dialog.warning({
    title: '确认撤回',
    content: '确定要撤回此调薪申请吗？撤回后可重新编辑提交。',
    positiveText: '确认撤回',
    negativeText: '取消',
    onPositiveClick: () => {
      const res = store.withdrawRequest(id)
      if (res.ok) message.success(res.message)
      else message.error(res.message)
    }
  })
}

function handleDelete(id: string) {
  dialog.warning({
    title: '确认删除',
    content: '确定要删除此调薪申请吗？此操作不可恢复。',
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: () => {
      const res = store.deleteRequest(id)
      if (res.ok) message.success(res.message)
      else message.error(res.message)
    }
  })
}

function handleFormSubmitted() {
  showForm.value = false
  editingId.value = null
}
</script>

<style scoped>
.col-request-no {
  min-width: 140px;
}
.col-salary {
  min-width: 180px;
}
</style>
