<template>
  <n-space vertical :size="20" style="width: 100%">
    <n-card title="基本信息" size="small">
      <n-descriptions :column="3" bordered>
        <n-descriptions-item label="申请编号">
          <n-text strong>{{ request.requestNo }}</n-text>
        </n-descriptions-item>
        <n-descriptions-item label="申请状态">
          <n-tag :color="store.getStatusColor(request.status)" bordered round>
            {{ store.getStatusLabel(request.status) }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="申请时间">
          {{ formatDateTime(request.createdAt) }}
        </n-descriptions-item>
        <n-descriptions-item label="员工姓名">
          {{ request.employeeName }}
        </n-descriptions-item>
        <n-descriptions-item label="所属部门">
          {{ request.departmentName }}
        </n-descriptions-item>
        <n-descriptions-item label="当前职位">
          {{ request.position }}
        </n-descriptions-item>
        <n-descriptions-item label="申请人">
          {{ request.applicantName }}
        </n-descriptions-item>
        <n-descriptions-item label="预算年度">
          {{ request.budgetYear }}
        </n-descriptions-item>
        <n-descriptions-item label="生效日期">
          {{ request.effectiveDate }}
        </n-descriptions-item>
      </n-descriptions>
    </n-card>

    <n-card title="调薪信息" size="small">
      <n-grid :cols="4" :x-gap="16">
        <n-gi>
          <div class="salary-card">
            <div class="salary-label">当前月薪</div>
            <div class="salary-value">{{ formatMoney(request.currentSalary) }}</div>
          </div>
        </n-gi>
        <n-gi>
          <div class="salary-card">
            <div class="salary-label">调薪后月薪</div>
            <div class="salary-value salary-increase">{{ formatMoney(request.proposedSalary) }}</div>
          </div>
        </n-gi>
        <n-gi>
          <div class="salary-card">
            <div class="salary-label">月度调整额</div>
            <div class="salary-value salary-increase">+{{ formatMoney(request.adjustmentAmount) }}</div>
          </div>
        </n-gi>
        <n-gi>
          <div class="salary-card">
            <div class="salary-label">调整比例</div>
            <div class="salary-value salary-increase">+{{ (request.adjustmentRatio * 100).toFixed(2) }}%</div>
          </div>
        </n-gi>
      </n-grid>
      <n-divider />
      <n-descriptions :column="3" bordered>
        <n-descriptions-item label="年度薪酬成本增加">
          <n-text type="success">+{{ formatMoney(request.adjustmentAmount * 12) }}</n-text>
        </n-descriptions-item>
        <n-descriptions-item label="调薪事由分类">
          <n-tag :color="reasonCategoryColors[request.reasonCategory]" bordered>
            {{ store.getCategoryLabel(request.reasonCategory) }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="具体事由">
          {{ request.reasonName }}
        </n-descriptions-item>
      </n-descriptions>
      <n-divider />
      <n-space vertical :size="8" style="width: 100%">
        <n-text strong>调薪说明：</n-text>
        <n-text style="white-space: pre-wrap">{{ request.description || '无' }}</n-text>
      </n-space>
      <n-divider v-if="request.attachments && request.attachments.length > 0" />
      <n-space vertical v-if="request.attachments && request.attachments.length > 0">
        <n-text strong>附件列表：</n-text>
        <n-space>
          <n-tag v-for="(file, idx) in request.attachments" :key="idx" closable style="cursor: pointer">
            📎 {{ file }}
          </n-tag>
        </n-space>
      </n-space>
    </n-card>

    <n-card title="审批流程" size="small">
      <n-steps :current="currentStepIndex" vertical>
        <n-step
          v-for="(record) in request.approvalRecords"
          :key="record.nodeId"
          :title="record.nodeName"
          :status="getStepStatus(record.status)"
        >
          <template #description>
            <div v-if="record.status !== 'waiting' && record.status !== 'current'" style="font-size: 12px; margin-top: 4px">
              <div v-if="record.delegationInfo?.isDelegated" style="margin-bottom: 4px">
                <n-tag size="small" type="warning" style="margin-right: 4px">
                  <template #icon><UserSwitchOutlined /></template>
                  代审
                </n-tag>
                <n-text depth="3">
                  原审批人：{{ record.delegationInfo.delegatorName }} → 代审人：{{ record.delegationInfo.delegateName }}
                </n-text>
              </div>
              <div>
                <n-text strong>审批人：</n-text>
                <n-tag
                  size="small"
                  :type="record.delegationInfo?.isDelegated ? 'warning' : 'default'"
                >
                  {{ record.approverName || '-' }}
                  <span v-if="record.delegationInfo?.isDelegated" style="margin-left: 4px; font-size: 10px">（代审）</span>
                </n-tag>
              </div>
              <div v-if="record.comment" style="color: #8c8c8c; margin-top: 2px">
                <n-text strong>意见：</n-text>{{ record.comment }}
              </div>
              <div style="color: #8c8c8c; margin-top: 2px">
                <n-text strong>时间：</n-text>{{ formatDateTime(record.operatedAt) }}
              </div>
            </div>
            <div v-else-if="record.status === 'current'" style="font-size: 12px; margin-top: 4px">
              <n-tag type="info" size="small" style="margin-right: 4px">当前审批节点</n-tag>
              <n-tag
                v-if="getNodeDelegationCount(record.nodeId) > 0"
                type="warning"
                size="small"
              >
                <template #icon><UserSwitchOutlined /></template>
                待委托 {{ getNodeDelegationCount(record.nodeId) }} 人
              </n-tag>
            </div>
          </template>
        </n-step>
      </n-steps>
    </n-card>

    <n-card v-if="request.status === 'approved' || request.status === 'rejected'" title="审批结果" size="small">
      <n-alert
        :type="request.status === 'approved' ? 'success' : 'error'"
        :title="request.status === 'approved' ? '审批通过' : '审批驳回'"
        show-icon
      >
        <template #icon>
          <n-icon size="20">
            <CheckCircleOutlined v-if="request.status === 'approved'" />
            <CloseCircleOutlined v-else />
          </n-icon>
        </template>
        <div v-if="request.status === 'approved'">
          <p>此调薪申请已通过全部审批，自 {{ request.effectiveDate }} 起生效。</p>
          <p v-if="request.approvedAt">批准时间：{{ formatDateTime(request.approvedAt) }}</p>
        </div>
        <div v-else>
          <p>此调薪申请已被驳回。</p>
          <p v-if="request.rejectedAt">驳回时间：{{ formatDateTime(request.rejectedAt) }}</p>
          <div v-if="request.rejectedFromNodeIndex !== undefined && request.rejectedFromNodeIndex >= 0" style="margin-top: 12px">
            <n-tag type="info" size="small" style="margin-right: 8px">
              <template #icon><RollbackOutlined /></template>
              驳回来源：{{ request.approvalRecords[request.rejectedFromNodeIndex]?.nodeName }}
            </n-tag>
          </div>
        </div>
      </n-alert>
    </n-card>

    <template v-if="showActions">
      <n-space justify="end">
        <n-button v-if="canEdit" @click="handleAction('edit')">
          <template #icon><EditOutlined /></template>
          编辑
        </n-button>
        <n-button v-if="canSubmit" type="primary" @click="handleAction('submit')">
          <template #icon><SendOutlined /></template>
          提交审批
        </n-button>
        <n-button v-if="canApprove" type="success" @click="handleAction('approve')">
          <template #icon><CheckOutlined /></template>
          审批通过
        </n-button>
        <n-button v-if="canApprove" type="error" @click="handleAction('reject')">
          <template #icon><CloseOutlined /></template>
          审批驳回
        </n-button>
        <n-button v-if="canReturn" type="warning" @click="handleAction('return')">
          <template #icon><RollbackOutlined /></template>
          退回修改
        </n-button>
        <n-button v-if="canRollback" type="warning" @click="handleAction('rollback')">
          <template #icon><RollbackOutlined /></template>
          回退至原审批节点
        </n-button>
        <n-button v-if="canWithdraw" @click="handleAction('withdraw')">
          <template #icon><UndoOutlined /></template>
          撤回申请
        </n-button>
        <n-button v-if="canDelete" type="error" @click="handleAction('delete')">
          <template #icon><DeleteOutlined /></template>
          删除
        </n-button>
      </n-space>
    </template>
  </n-space>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
  RollbackOutlined,
  UndoOutlined,
  DeleteOutlined,
  UserSwitchOutlined
} from '@vicons/antd'
import { useSalaryAdjustmentStore } from '@/stores/salaryAdjustment'
import type { SalaryAdjustmentRequest, NodeApprovalStatus, AdjustmentReasonCategory } from '@/types'
import dayjs from 'dayjs'

const props = defineProps<{
  request: SalaryAdjustmentRequest
  showActions?: boolean
}>()

const emit = defineEmits<{
  action: [{ type: string; id: string }]
}>()

const store = useSalaryAdjustmentStore()

const reasonCategoryColors: Record<AdjustmentReasonCategory, string> = {
  annual: '#1890ff',
  performance: '#52c41a',
  promotion: '#722ed1',
  market: '#13c2c2',
  certification: '#fa8c16',
  transfer: '#eb2f96',
  special: '#f5222d'
}

const currentStepIndex = computed(() => {
  const idx = props.request.approvalRecords.findIndex((r) => r.status === 'current')
  return idx !== -1 ? idx : props.request.approvalRecords.length
})

const canEdit = computed(() => props.request.status === 'draft' || props.request.status === 'returned')
const canSubmit = computed(() => props.request.status === 'draft' || props.request.status === 'returned')
const canApprove = computed(() => props.request.status === 'pending')
const canReturn = computed(() => props.request.status === 'pending')
const canRollback = computed(() => props.request.status === 'rejected' && props.request.rejectedFromNodeIndex !== undefined)
const canWithdraw = computed(() => props.request.status === 'pending')
const canDelete = computed(() => props.request.status !== 'approved')

function formatMoney(n: number): string {
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDateTime(s: string): string {
  if (!s) return '-'
  return s.replace('T', ' ').slice(0, 16)
}

function getStepStatus(status: NodeApprovalStatus): 'wait' | 'process' | 'finish' | 'error' {
  const map: Record<NodeApprovalStatus, 'wait' | 'process' | 'finish' | 'error'> = {
    waiting: 'wait',
    current: 'process',
    approved: 'finish',
    rejected: 'error',
    skipped: 'finish'
  }
  return map[status] || 'wait'
}

function getNodeDelegationCount(nodeId: string): number {
  const node = store.sortedWorkflow.find((n) => n.id === nodeId)
  if (!node || !node.delegations) return 0
  const now = dayjs()
  return node.delegations.filter(
    (d) => d.enabled && !now.isAfter(d.endDate) && !now.isBefore(d.startDate)
  ).length
}

function handleAction(type: string) {
  emit('action', { type, id: props.request.id })
}
</script>

<style scoped>
.salary-card {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}
.salary-label {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 8px;
}
.salary-value {
  font-size: 20px;
  font-weight: 700;
  color: #262626;
}
.salary-increase {
  color: #52c41a;
}
</style>
