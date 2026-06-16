<template>
  <n-space vertical :size="20" style="width: 100%">
    <n-card>
      <template #header>
        <n-space justify="space-between" style="width: 100%">
          <n-space>
            <n-button quaternary @click="$emit('back')">
              <template #icon><ArrowLeftOutlined /></template>
              返回批次列表
            </n-button>
            <n-text strong style="font-size: 16px">
              {{ batch?.name || '员工奖金确认' }}
            </n-text>
          </n-space>
          <n-space>
            <n-select
              v-model:value="statusFilter"
              :options="statusOptions"
              placeholder="状态筛选"
              style="width: 140px"
              clearable
            />
            <n-input
              v-model:value="searchKeyword"
              placeholder="搜索员工姓名/部门"
              style="width: 200px"
              clearable
            >
              <template #prefix>
                <n-icon><SearchOutlined /></n-icon>
              </template>
            </n-input>
          </n-space>
        </n-space>
      </template>

      <n-space v-if="batch" :size="24" style="margin-bottom: 20px; padding: 16px; background: #f5f7fa; border-radius: 8px">
        <div>
          <n-text depth="3" style="font-size: 12px">总人数</n-text>
          <div style="font-size: 20px; font-weight: 600; color: #1f1f1f">{{ batch.totalConfirmations }}</div>
        </div>
        <div>
          <n-text depth="3" style="font-size: 12px">已签收</n-text>
          <div style="font-size: 20px; font-weight: 600; color: #52c41a">{{ batch.signedCount }}</div>
        </div>
        <div>
          <n-text depth="3" style="font-size: 12px">待签收</n-text>
          <div style="font-size: 20px; font-weight: 600; color: #fa8c16">{{ batch.pendingCount }}</div>
        </div>
        <div>
          <n-text depth="3" style="font-size: 12px">有异议</n-text>
          <div style="font-size: 20px; font-weight: 600; color: #f5222d">{{ batch.objectedCount }}</div>
        </div>
        <div>
          <n-text depth="3" style="font-size: 12px">已超时</n-text>
          <div style="font-size: 20px; font-weight: 600; color: #8c8c8c">{{ batch.timeoutCount }}</div>
        </div>
      </n-space>

      <n-data-table
        :columns="columns"
        :data="filteredConfirmations"
        :pagination="pagination"
        :bordered="false"
      />
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
import { ref, h, computed } from 'vue'
import { useMessage } from 'naive-ui'
import type { DataTableColumns, SelectOption } from 'naive-ui'
import { ArrowLeftOutlined, SearchOutlined, EyeOutlined, BellOutlined } from '@vicons/antd'
import { useBonusStore } from '@/stores/bonus'
import type { BonusConfirmationRecord } from '@/types'
import dayjs from 'dayjs'

const props = defineProps<{
  batchId: string
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'viewDetail', recordId: string): void
}>()

const store = useBonusStore()
const message = useMessage()

const statusFilter = ref<string | null>(null)
const searchKeyword = ref('')

const statusOptions: SelectOption[] = [
  { label: '待签收', value: 'pending' },
  { label: '已签收', value: 'signed' },
  { label: '已异议', value: 'objected' },
  { label: '复核中', value: 'reviewing' },
  { label: '复核通过', value: 'resolved_confirmed' },
  { label: '已调整', value: 'resolved_adjusted' },
  { label: '已超时', value: 'timeout' }
]

const batch = computed(() => store.bonusConfirmationBatches.find(b => b.id === props.batchId))

const confirmations = computed(() => store.getConfirmationsByBatch(props.batchId))

const filteredConfirmations = computed(() => {
  let list = confirmations.value
  if (statusFilter.value) {
    list = list.filter(c => c.status === statusFilter.value)
  }
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(c =>
      c.employeeName.toLowerCase().includes(keyword) ||
      c.departmentName.toLowerCase().includes(keyword)
    )
  }
  return list
})

const pagination = {
  pageSize: 10
}

const getRemainingTime = (deadlineAt: string) => {
  const deadline = dayjs(deadlineAt)
  const now = dayjs()
  const diffDays = deadline.diff(now, 'day')
  const diffHours = deadline.diff(now, 'hour') % 24

  if (deadline.isBefore(now)) {
    return '已超时'
  }
  if (diffDays > 0) {
    return `${diffDays}天${diffHours}小时`
  }
  return `${diffHours}小时`
}

const getWarningLevel = (deadlineAt: string): 'info' | 'warning' | 'critical' => {
  const deadline = dayjs(deadlineAt)
  const now = dayjs()
  const remainingHours = deadline.diff(now, 'hour')

  if (remainingHours <= 24) return 'critical'
  if (remainingHours <= 72) return 'warning'
  return 'info'
}

const columns: DataTableColumns<BonusConfirmationRecord> = [
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
    title: '税前金额',
    key: 'grossAmount',
    width: 120,
    render: (row) => `¥${row.grossAmount.toLocaleString()}`
  },
  {
    title: '个税',
    key: 'taxAmount',
    width: 100,
    render: (row) => `¥${row.taxAmount.toLocaleString()}`
  },
  {
    title: '税后金额',
    key: 'netAmount',
    width: 120,
    render: (row) => h('n-text', { strong: true, style: { color: '#52c41a' } }, { default: () => `¥${row.netAmount.toLocaleString()}` })
  },
  {
    title: '计税方式',
    key: 'taxMethod',
    width: 100,
    render: (row) => row.taxMethod === 'oneTime' ? '单独计税' : '综合计税'
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) => {
      const color = store.getConfirmationStatusColor(row.status)
      const label = store.getConfirmationStatusLabel(row.status)
      return h('n-tag', { type: 'success', color, bordered: false }, { default: () => label })
    }
  },
  {
    title: '截止时间',
    key: 'deadlineAt',
    width: 160,
    render: (row) => {
      if (row.status === 'signed' || row.status === 'resolved_confirmed' || row.status === 'resolved_adjusted') {
        return row.signedAt || '-'
      }
      const warningLevel = getWarningLevel(row.deadlineAt)
      const colorMap = {
        info: '#52c41a',
        warning: '#fa8c16',
        critical: '#f5222d'
      }
      return h('div', {}, [
        h('div', {}, row.deadlineAt),
        h('div', { style: { fontSize: '12px', color: colorMap[warningLevel] } }, getRemainingTime(row.deadlineAt))
      ])
    }
  },
  {
    title: '提醒次数',
    key: 'reminderCount',
    width: 80
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    render: (row) => {
      return h('n-space', {}, {
        default: () => [
          h('n-button', {
            size: 'small',
            type: 'primary',
            quaternary: true,
            onClick: () => emit('viewDetail', row.id)
          }, {
            icon: () => h(EyeOutlined),
            default: () => '查看'
          }),
          row.status === 'pending' ? h('n-button', {
            size: 'small',
            type: 'warning',
            quaternary: true,
            onClick: () => handleSendReminder(row.id)
          }, {
            icon: () => h(BellOutlined),
            default: () => '催办'
          }) : null
        ].filter(Boolean)
      })
    }
  }
]

function handleSendReminder(recordId: string) {
  const ok = store.sendReminder(recordId)
  if (ok) {
    message.success('已发送催办提醒')
  } else {
    message.error('催办失败')
  }
}
</script>
