<template>
  <n-space vertical :size="20" style="width: 100%">
    <n-card>
      <template #header>
        <n-space justify="space-between" style="width: 100%">
          <n-text strong style="font-size: 16px">异议复核管理</n-text>
          <n-space>
            <n-badge :value="objectedCount" :max="99" type="error">
              <n-tag type="warning" bordered={false}>
                待处理：{{ objectedCount }} 条
              </n-tag>
            </n-badge>
          </n-space>
        </n-space>
      </template>

      <n-tabs v-model:value="activeTab" type="line" size="large">
        <n-tab-pane name="pending" tab="待复核">
          <n-data-table
            v-if="pendingReviewList.length > 0"
            :columns="pendingColumns"
            :data="pendingReviewList"
            :pagination="pagination"
            :bordered="false"
          />
          <n-empty v-else description="暂无待复核的异议" />
        </n-tab-pane>
        <n-tab-pane name="reviewing" tab="复核中">
          <n-data-table
            v-if="reviewingList.length > 0"
            :columns="reviewingColumns"
            :data="reviewingList"
            :pagination="pagination"
            :bordered="false"
          />
          <n-empty v-else description="暂无复核中的记录" />
        </n-tab-pane>
        <n-tab-pane name="completed" tab="已完成">
          <n-data-table
            v-if="completedList.length > 0"
            :columns="completedColumns"
            :data="completedList"
            :pagination="pagination"
            :bordered="false"
          />
          <n-empty v-else description="暂无已完成的复核记录" />
        </n-tab-pane>
      </n-tabs>
    </n-card>

    <n-modal v-model:show="showReviewModal" preset="card" :style="{ width: '700px' }" title="异议复核处理">
      <n-space v-if="selectedRecord" vertical :size="20" style="width: 100%">
        <n-descriptions :column="2" bordered label-style="width: 100px">
          <n-descriptions-item label="员工姓名">
            <n-text strong>{{ selectedRecord.employeeName }}</n-text>
          </n-descriptions-item>
          <n-descriptions-item label="所属部门">
            {{ selectedRecord.departmentName }}
          </n-descriptions-item>
          <n-descriptions-item label="职位">
            {{ selectedRecord.position }}
          </n-descriptions-item>
          <n-descriptions-item label="奖金名称">
            {{ selectedRecord.bonusName }}
          </n-descriptions-item>
        </n-descriptions>

        <n-card title="奖金明细" size="small">
          <n-grid :cols="3" :x-gap="16">
            <n-gi>
              <n-statistic label="税前奖金" :value="selectedRecord.grossAmount" :precision="2" prefix="¥" />
            </n-gi>
            <n-gi>
              <n-statistic label="应扣个税" :value="selectedRecord.taxAmount" :precision="2" prefix="¥" value-style="color: #f5222d" />
            </n-gi>
            <n-gi>
              <n-statistic label="实发奖金" :value="selectedRecord.netAmount" :precision="2" prefix="¥" value-style="color: #52c41a" />
            </n-gi>
          </n-grid>
        </n-card>

        <n-card title="异议信息" size="small">
          <n-descriptions :column="2" bordered>
            <n-descriptions-item label="异议原因">
              <n-tag type="error" :bordered="false">{{ selectedRecord.objection?.reason }}</n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="申诉人">
              {{ selectedRecord.objection?.objectorName }}
            </n-descriptions-item>
            <n-descriptions-item label="申诉时间" :span="2">
              {{ selectedRecord.objection?.createdAt }}
            </n-descriptions-item>
            <n-descriptions-item label="详细描述" :span="2">
              <n-text>{{ selectedRecord.objection?.description }}</n-text>
            </n-descriptions-item>
            <n-descriptions-item v-if="selectedRecord.objection?.attachments && selectedRecord.objection.attachments.length > 0" label="附件" :span="2">
              <n-space vertical :size="4">
                <n-space v-for="(file, idx) in selectedRecord.objection.attachments" :key="idx" align="center">
                  <n-icon><PaperClipOutlined /></n-icon>
                  <n-text>{{ file }}</n-text>
                </n-space>
              </n-space>
            </n-descriptions-item>
          </n-descriptions>
        </n-card>

        <n-card title="复核处理" size="small">
          <n-form ref="reviewFormRef" :model="reviewForm" :rules="reviewRules" label-placement="top">
            <n-form-item label="复核结果" path="result">
              <n-radio-group v-model:value="reviewForm.result">
                <n-space>
                  <n-radio value="confirmed">维持原金额</n-radio>
                  <n-radio value="adjusted">调整金额</n-radio>
                </n-space>
              </n-radio-group>
            </n-form-item>

            <n-form-item v-if="reviewForm.result === 'adjusted'" label="调整后税前金额" path="adjustedGrossAmount">
              <n-input-number v-model:value="reviewForm.adjustedGrossAmount" :min="0" :precision="2" style="width: 100%" @update:value="calculateAdjustedTax" />
            </n-form-item>

            <n-form-item v-if="reviewForm.result === 'adjusted'" label="调整后个税">
              <n-input-number v-model:value="reviewForm.adjustedTaxAmount" :min="0" :precision="2" style="width: 100%" @update:value="updateAdjustedNet" />
            </n-form-item>

            <n-form-item v-if="reviewForm.result === 'adjusted'" label="调整后实发金额">
              <n-input-number v-model:value="reviewForm.adjustedNetAmount" :min="0" :precision="2" style="width: 100%" disabled />
            </n-form-item>

            <n-form-item label="复核意见" path="comment">
              <n-input v-model:value="reviewForm.comment" type="textarea" :rows="4" placeholder="请输入复核意见..." />
            </n-form-item>
          </n-form>
        </n-card>

        <template #footer>
          <n-space justify="end">
            <n-button @click="showReviewModal = false">取消</n-button>
            <n-button v-if="selectedRecord.status === 'objected'" type="primary" @click="handleStartReview">
              开始复核
            </n-button>
            <n-button v-if="selectedRecord.status === 'reviewing'" type="primary" @click="handleCompleteReview">
              提交复核结果
            </n-button>
          </n-space>
        </template>
      </n-space>
    </n-modal>
  </n-space>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { EyeOutlined, AuditOutlined, PaperClipOutlined } from '@vicons/antd'
import { useBonusStore } from '@/stores/bonus'
import type { BonusConfirmationRecord } from '@/types'
import { calculateOneTimeTax, round2 } from '@/utils/tax'

const store = useBonusStore()
const message = useMessage()
const dialog = useDialog()

const activeTab = ref('pending')
const showReviewModal = ref(false)
const selectedRecordId = ref<string | null>(null)
const reviewFormRef = ref()

const reviewForm = ref({
  result: 'confirmed' as 'confirmed' | 'adjusted',
  adjustedGrossAmount: 0,
  adjustedTaxAmount: 0,
  adjustedNetAmount: 0,
  comment: ''
})

const reviewRules = {
  result: { required: true, message: '请选择复核结果', trigger: 'change' },
  comment: { required: true, message: '请输入复核意见', trigger: 'blur' },
  adjustedGrossAmount: [
    {
      required: true,
      message: '请输入调整后金额',
      trigger: 'blur',
      validator: (_rule: any, value: number) => {
        if (reviewForm.value.result === 'adjusted' && (!value || value <= 0)) {
          return false
        }
        return true
      }
    }
  ]
}

const objectedConfirmations = computed(() =>
  store.bonusConfirmations.filter(c => c.status === 'objected' || c.status === 'reviewing')
)

const objectedCount = computed(() => objectedConfirmations.value.length)

const pendingReviewList = computed(() =>
  store.bonusConfirmations.filter(c => c.status === 'objected')
)

const reviewingList = computed(() =>
  store.bonusConfirmations.filter(c => c.status === 'reviewing')
)

const completedList = computed(() =>
  store.bonusConfirmations.filter(c => c.status === 'resolved_confirmed' || c.status === 'resolved_adjusted')
)

const selectedRecord = computed(() =>
  selectedRecordId.value ? store.getConfirmationById(selectedRecordId.value) : null
)

const pagination = {
  pageSize: 10
}

const baseColumns: DataTableColumns<BonusConfirmationRecord> = [
  {
    title: '员工姓名',
    key: 'employeeName',
    width: 100
  },
  {
    title: '部门',
    key: 'departmentName',
    width: 120
  },
  {
    title: '职位',
    key: 'position',
    width: 120
  },
  {
    title: '异议原因',
    key: 'objectionReason',
    width: 140,
    render: (row) => h('n-tag', { type: 'error', bordered: false }, { default: () => row.objection?.reason || '-' })
  },
  {
    title: '税前金额',
    key: 'grossAmount',
    width: 120,
    render: (row) => `¥${row.grossAmount.toLocaleString()}`
  },
  {
    title: '实发金额',
    key: 'netAmount',
    width: 120,
    render: (row) => h('n-text', { style: { color: '#52c41a' } }, { default: () => `¥${row.netAmount.toLocaleString()}` })
  },
  {
    title: '申诉时间',
    key: 'objectionTime',
    width: 160,
    render: (row) => row.objection?.createdAt || '-'
  }
]

const pendingColumns: DataTableColumns<BonusConfirmationRecord> = [
  ...baseColumns,
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render: (row) => {
      return h('n-button', {
        size: 'small',
        type: 'primary',
        quaternary: true,
        onClick: () => handleViewReview(row.id)
      }, {
        icon: () => h(AuditOutlined),
        default: () => '复核处理'
      })
    }
  }
]

const reviewingColumns: DataTableColumns<BonusConfirmationRecord> = [
  ...baseColumns,
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render: (row) => {
      return h('n-button', {
        size: 'small',
        type: 'primary',
        quaternary: true,
        onClick: () => handleViewReview(row.id)
      }, {
        icon: () => h(EyeOutlined),
        default: () => '继续复核'
      })
    }
  }
]

const completedColumns: DataTableColumns<BonusConfirmationRecord> = [
  ...baseColumns,
  {
    title: '复核结果',
    key: 'reviewResult',
    width: 120,
    render: (row) => {
      const result = row.review?.result === 'confirmed' ? '维持原金额' : '已调整'
      const type = row.review?.result === 'confirmed' ? 'success' : 'warning'
      return h('n-tag', { type, bordered: false }, { default: () => result })
    }
  },
  {
    title: '复核人',
    key: 'reviewerName',
    width: 100,
    render: (row) => row.review?.reviewerName || '-'
  },
  {
    title: '复核时间',
    key: 'reviewTime',
    width: 160,
    render: (row) => row.review?.reviewedAt || '-'
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render: (row) => {
      return h('n-button', {
        size: 'small',
        quaternary: true,
        onClick: () => handleViewDetail(row.id)
      }, {
        icon: () => h(EyeOutlined),
        default: () => '查看详情'
      })
    }
  }
]

function handleViewReview(recordId: string) {
  const record = store.getConfirmationById(recordId)
  if (!record) return

  selectedRecordId.value = recordId
  reviewForm.value = {
    result: 'confirmed',
    adjustedGrossAmount: record.grossAmount,
    adjustedTaxAmount: record.taxAmount,
    adjustedNetAmount: record.netAmount,
    comment: ''
  }
  showReviewModal.value = true
}

function handleViewDetail(recordId: string) {
  handleViewReview(recordId)
}

function handleStartReview() {
  if (!selectedRecordId.value) return

  const ok = store.startReview(selectedRecordId.value)
  if (ok) {
    message.success('已进入复核状态')
  } else {
    message.error('操作失败')
  }
}

function handleCompleteReview() {
  if (!selectedRecordId.value) return

  reviewFormRef.value?.validate((errors: any) => {
    if (!errors) {
      dialog.warning({
        title: '确认提交',
        content: '提交后将无法修改，确认提交复核结果吗？',
        positiveText: '确认提交',
        negativeText: '取消',
        onPositiveClick: () => {
          let adjustedAmounts: { grossAmount: number; taxAmount: number; netAmount: number } | undefined

          if (reviewForm.value.result === 'adjusted') {
            adjustedAmounts = {
              grossAmount: reviewForm.value.adjustedGrossAmount,
              taxAmount: reviewForm.value.adjustedTaxAmount,
              netAmount: reviewForm.value.adjustedNetAmount
            }
          }

          const ok = store.completeReview(
            selectedRecordId.value!,
            reviewForm.value.result,
            reviewForm.value.comment,
            adjustedAmounts
          )

          if (ok) {
            message.success('复核完成')
            showReviewModal.value = false
          } else {
            message.error('提交失败')
          }
        }
      })
    }
  })
}

function calculateAdjustedTax() {
  if (reviewForm.value.result === 'adjusted' && reviewForm.value.adjustedGrossAmount > 0) {
    const tax = calculateOneTimeTax(reviewForm.value.adjustedGrossAmount)
    reviewForm.value.adjustedTaxAmount = round2(tax)
    updateAdjustedNet()
  }
}

function updateAdjustedNet() {
  reviewForm.value.adjustedNetAmount = round2(
    reviewForm.value.adjustedGrossAmount - reviewForm.value.adjustedTaxAmount
  )
}
</script>
