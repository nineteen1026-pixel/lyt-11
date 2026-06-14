<template>
  <n-space vertical :size="16" style="width: 100%">
    <n-card>
      <n-space justify="space-between" align="center" style="width: 100%">
        <n-space vertical :size="4">
          <n-text strong style="font-size: 18px">员工薪酬档案</n-text>
          <n-text depth="3" style="font-size: 13px">聚合历次调薪、奖金发放、绩效评级与审批记录，支持导出作为离职交接附件</n-text>
        </n-space>
        <n-space>
          <n-button type="primary" ghost @click="handleExport" :disabled="!selectedEmployeeId">
            <template #icon><ExportOutlined /></template>
            导出离职交接附件
          </n-button>
        </n-space>
      </n-space>
    </n-card>

    <n-card title="选择员工">
      <n-select
        v-model:value="selectedEmployeeId"
        :options="employeeOptions"
        placeholder="请选择要查看薪酬档案的员工"
        filterable
        style="width: 100%"
        @update:value="handleEmployeeChange"
      />
    </n-card>

    <template v-if="archive">
      <n-card>
        <n-space align="center" :size="20">
          <n-avatar round style="background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%); width: 64px; height: 64px; font-size: 24px">
            {{ archive.employeeName.charAt(0) }}
          </n-avatar>
          <n-space vertical :size="4" style="flex: 1">
            <n-text strong style="font-size: 20px">{{ archive.employeeName }}</n-text>
            <n-space>
              <n-tag size="small">{{ archive.departmentName }}</n-tag>
              <n-tag size="small" type="info">{{ archive.position }}</n-tag>
              <n-tag size="small" type="success">当前月薪：{{ formatMoney(archive.baseSalary) }}</n-tag>
              <n-tag size="small" type="warning">绩效等级：{{ archive.summary.currentLevel }} ({{ archive.summary.currentCoefficient }}x)</n-tag>
            </n-space>
          </n-space>
        </n-space>
      </n-card>

      <n-card title="薪酬统计概览">
        <n-grid :cols="4" :x-gap="20">
          <n-gi>
            <div class="stat-card salary">
              <div class="stat-label">累计调薪次数</div>
              <div class="stat-value">{{ archive.summary.totalSalaryAdjustments }} 次</div>
              <div class="stat-sub">累计调薪 {{ formatMoney(archive.summary.totalAdjustmentAmount) }}</div>
            </div>
          </n-gi>
          <n-gi>
            <div class="stat-card bonus">
              <div class="stat-label">累计奖金发放</div>
              <div class="stat-value">{{ archive.summary.totalBonusPayments }} 笔</div>
              <div class="stat-sub">税后合计 {{ formatMoney(archive.summary.totalBonusNet) }}</div>
            </div>
          </n-gi>
          <n-gi>
            <div class="stat-card performance">
              <div class="stat-label">绩效评级记录</div>
              <div class="stat-value">{{ archive.summary.performanceRecords }} 次</div>
              <div class="stat-sub">当前等级 {{ archive.summary.currentLevel }}</div>
            </div>
          </n-gi>
          <n-gi>
            <div class="stat-card total">
              <div class="stat-label">历史总事件数</div>
              <div class="stat-value">{{ archive.events.length }} 条</div>
              <div class="stat-sub">完整薪酬档案记录</div>
            </div>
          </n-gi>
        </n-grid>
      </n-card>

      <n-card title="筛选条件">
        <n-space :size="16" wrap>
          <n-space vertical :size="6">
            <n-text depth="3" style="font-size: 12px">事件类型</n-text>
            <n-space>
              <n-checkbox
                v-for="type in eventTypes"
                :key="type.value"
                :checked="selectedTypes.includes(type.value)"
                @update:checked="(v: boolean) => toggleEventType(type.value, v)"
              >
                <n-tag :color="type.color" size="small" bordered>{{ type.label }}</n-tag>
              </n-checkbox>
            </n-space>
          </n-space>

          <n-space vertical :size="6">
            <n-text depth="3" style="font-size: 12px">时间范围</n-text>
            <n-date-picker
              v-model:value="dateRange"
              type="daterange"
              clearable
              style="width: 280px"
              placeholder="选择日期范围"
            />
          </n-space>

          <n-space vertical :size="6">
            <n-text depth="3" style="font-size: 12px">快速筛选</n-text>
            <n-space>
              <n-button size="small" type="default" @click="setQuickFilter('all')">全部</n-button>
              <n-button size="small" type="default" @click="setQuickFilter('year')">近一年</n-button>
              <n-button size="small" type="default" @click="setQuickFilter('3year')">近三年</n-button>
            </n-space>
          </n-space>
        </n-space>
      </n-card>

      <n-card title="薪酬档案时间轴">
        <template v-if="filteredEvents.length > 0">
          <div class="timeline-container">
            <div
              v-for="(event, index) in filteredEvents"
              :key="event.id"
              class="timeline-item"
            >
              <div class="timeline-left">
                <div class="event-date">{{ event.date }}</div>
                <div class="event-type-tag" :style="{ backgroundColor: getEventTypeColor(event.type) + '20', color: getEventTypeColor(event.type) }">
                  {{ getEventTypeLabel(event.type) }}
                </div>
              </div>

              <div class="timeline-marker">
                <div class="marker-dot" :style="{ backgroundColor: getEventTypeColor(event.type), boxShadow: '0 0 0 3px ' + getEventTypeColor(event.type) + '30' }">
                  <component :is="getEventIcon(event.type)" style="width: 14px; height: 14px; color: #fff" />
                </div>
                <div v-if="index < filteredEvents.length - 1" class="marker-line"></div>
              </div>

              <div class="timeline-content">
                <n-card size="small" hoverable class="event-card">
                  <n-space justify="space-between" align="flex-start" style="width: 100%">
                    <n-space vertical :size="8" style="flex: 1">
                      <n-space align="center">
                        <n-text strong style="font-size: 15px">{{ event.title }}</n-text>
                        <n-tag
                          v-if="event.status"
                          size="small"
                          :style="{ backgroundColor: (event.statusColor || '#8c8c8c') + '15', color: event.statusColor || '#8c8c8c', borderColor: event.statusColor || '#8c8c8c' }"
                          bordered
                        >
                          {{ event.status }}
                        </n-tag>
                      </n-space>
                      <n-text depth="3" style="font-size: 13px">
                        {{ event.description }}
                      </n-text>
                      <n-space v-if="event.tags && event.tags.length > 0" :size="6">
                        <n-tag
                          v-for="tag in event.tags"
                          :key="tag"
                          size="small"
                          type="info"
                        >
                          {{ tag }}
                        </n-tag>
                      </n-space>
                    </n-space>
                    <n-space v-if="event.amount !== undefined" vertical align="end" :size="4">
                      <n-text depth="3" style="font-size: 12px">{{ event.amountLabel || '金额' }}</n-text>
                      <n-text strong type="success" style="font-size: 16px">
                        {{ formatMoney(event.amount) }}
                      </n-text>
                    </n-space>
                  </n-space>

                  <n-divider v-if="event.detail && event.detail.description" style="margin: 10px 0" />
                  <n-text v-if="event.detail && event.detail.description" depth="3" style="font-size: 12px">
                    <n-icon size="14"><FileTextOutlined /></n-icon>
                    {{ event.detail.description }}
                  </n-text>

                  <n-divider style="margin: 10px 0" />
                  <n-space justify="space-between" style="width: 100%">
                    <template v-if="event.type === 'salary_adjustment'">
                      <n-text depth="3" style="font-size: 12px">
                        申请人：{{ event.detail?.applicantName || '-' }}
                      </n-text>
                      <n-text depth="3" style="font-size: 12px">
                        批准人：{{ event.detail?.approverName || '-' }}
                      </n-text>
                    </template>
                    <template v-else-if="event.type === 'bonus_payment'">
                      <n-text depth="3" style="font-size: 12px">
                        税前：{{ formatMoney(event.detail?.grossAmount || 0) }}
                      </n-text>
                      <n-text depth="3" style="font-size: 12px">
                        个税：{{ formatMoney(event.detail?.taxAmount || 0) }}
                      </n-text>
                    </template>
                    <template v-else-if="event.type === 'performance_review'">
                      <n-text depth="3" style="font-size: 12px">
                        评定人：{{ event.detail?.reviewerName || '-' }}
                      </n-text>
                      <n-text depth="3" style="font-size: 12px">
                        系数：{{ event.detail?.coefficient || 0 }}x
                      </n-text>
                    </template>
                    <template v-else-if="event.type === 'approval_record'">
                      <n-text depth="3" style="font-size: 12px">
                        申请单号：{{ event.detail?.requestNo || '-' }}
                      </n-text>
                      <n-text depth="3" style="font-size: 12px">
                        创建时间：{{ event.detail?.createdAt?.slice(0, 10) || '-' }}
                      </n-text>
                    </template>
                  </n-space>
                </n-card>
              </div>
            </div>
          </div>
        </template>
        <n-empty v-else description="暂无符合筛选条件的记录" />
      </n-card>

      <n-card title="详细数据表格">
        <n-tabs v-model:value="activeTab" type="line">
          <n-tab-pane name="salary" tab="调薪记录">
            <n-data-table
              :columns="salaryColumns"
              :data="archive.salaryHistory"
              :row-key="(row: any) => row.id"
              striped
              :pagination="{ pageSize: 5, showSizePicker: true, pageSizes: [5, 10, 20] }"
            />
          </n-tab-pane>
          <n-tab-pane name="bonus" tab="奖金发放">
            <n-data-table
              :columns="bonusColumns"
              :data="archive.bonusHistory"
              :row-key="(row: any) => row.id"
              striped
              :pagination="{ pageSize: 5, showSizePicker: true, pageSizes: [5, 10, 20] }"
            />
          </n-tab-pane>
          <n-tab-pane name="performance" tab="绩效评级">
            <n-data-table
              :columns="performanceColumns"
              :data="archive.performanceHistory"
              :row-key="(row: any) => row.id"
              striped
              :pagination="{ pageSize: 5, showSizePicker: true, pageSizes: [5, 10, 20] }"
            />
          </n-tab-pane>
        </n-tabs>
      </n-card>
    </template>

    <n-card v-else-if="selectedEmployeeId">
      <n-empty description="该员工暂无薪酬档案记录" />
    </n-card>

    <n-card v-else>
      <n-empty description="请选择一位员工查看薪酬档案" />
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useMessage, type DataTableColumns } from 'naive-ui'
import {
  RiseOutlined,
  WalletOutlined,
  StarOutlined,
  FileTextOutlined,
  ExportOutlined
} from '@vicons/antd'
import { useSalaryAdjustmentStore } from '@/stores/salaryAdjustment'
import { useBonusStore } from '@/stores/bonus'
import type { ArchiveEventType, EmployeeCompensationArchive } from '@/types'
import dayjs from 'dayjs'

const store = useSalaryAdjustmentStore()
const bonusStore = useBonusStore()
const message = useMessage()

const selectedEmployeeId = ref<string | null>(null)
const selectedTypes = ref<ArchiveEventType[]>(['salary_adjustment', 'bonus_payment', 'performance_review', 'approval_record'])
const dateRange = ref<[number, number] | null>(null)
const activeTab = ref('salary')

const eventTypes = [
  { value: 'salary_adjustment' as ArchiveEventType, label: '调薪', color: '#1890ff' },
  { value: 'bonus_payment' as ArchiveEventType, label: '奖金', color: '#52c41a' },
  { value: 'performance_review' as ArchiveEventType, label: '绩效', color: '#722ed1' },
  { value: 'approval_record' as ArchiveEventType, label: '审批', color: '#fa8c16' }
]

const employeeOptions = computed(() =>
  bonusStore.allEmployees.map((emp) => {
    const dept = bonusStore.getDepartmentById(emp.departmentId)
    return {
      label: `${emp.name} - ${emp.position} (${dept?.name || '未知部门'})`,
      value: emp.id
    }
  })
)

const archive = computed<EmployeeCompensationArchive | null>(() => {
  if (!selectedEmployeeId.value) return null
  return store.buildEmployeeArchive(selectedEmployeeId.value)
})

const filteredEvents = computed(() => {
  if (!archive.value) return []
  let events = [...archive.value.events]

  events = events.filter((e) => selectedTypes.value.includes(e.type))

  if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
    const start = dayjs(dateRange.value[0])
    const end = dayjs(dateRange.value[1])
    events = events.filter((e) => {
      const eventDate = dayjs(e.date)
      return eventDate.isAfter(start.subtract(1, 'day')) && eventDate.isBefore(end.add(1, 'day'))
    })
  }

  return events
})

const salaryColumns: DataTableColumns<any> = [
  { title: '生效日期', key: 'effectiveDate', width: 120 },
  { title: '事由分类', key: 'reasonCategory', width: 120,
    render: (row: any) => h('span', {}, store.getCategoryLabel(row.reasonCategory))
  },
  { title: '具体事由', key: 'reasonName', width: 140 },
  { title: '调整前', key: 'oldSalary', width: 120,
    render: (row: any) => h('span', {}, formatMoney(row.oldSalary))
  },
  { title: '调整后', key: 'newSalary', width: 120,
    render: (row: any) => h('span', {}, formatMoney(row.newSalary))
  },
  { title: '调整金额', key: 'adjustmentAmount', width: 120,
    render: (row: any) => h('span', { style: 'color: #52c41a' }, `+${formatMoney(row.adjustmentAmount)}`)
  },
  { title: '调整比例', key: 'adjustmentRatio', width: 100,
    render: (row: any) => h('span', { style: 'color: #52c41a' }, `+${(row.adjustmentRatio * 100).toFixed(2)}%`)
  },
  { title: '申请人', key: 'applicantName', width: 100 },
  { title: '批准人', key: 'approverName', width: 100 }
]

const bonusColumns: DataTableColumns<any> = [
  { title: '发放日期', key: 'paymentDate', width: 120 },
  { title: '奖金类型', key: 'type', width: 100,
    render: (row: any) => h('span', {}, store.getBonusTypeLabel(row.type))
  },
  { title: '奖金名称', key: 'name', width: 160 },
  { title: '税前金额', key: 'grossAmount', width: 120,
    render: (row: any) => h('span', {}, formatMoney(row.grossAmount))
  },
  { title: '扣税金额', key: 'taxAmount', width: 120,
    render: (row: any) => h('span', { style: 'color: #f5222d' }, formatMoney(row.taxAmount))
  },
  { title: '税后实发', key: 'netAmount', width: 120,
    render: (row: any) => h('span', { style: 'color: #52c41a; font-weight: 600' }, formatMoney(row.netAmount))
  },
  { title: '计税方式', key: 'taxMethod', width: 100,
    render: (row: any) => h('span', {}, row.taxMethod === 'oneTime' ? '单独计税' : '综合计税')
  },
  { title: '状态', key: 'approvalStatus', width: 100,
    render: (row: any) => h('span', { style: `color: ${store.getStatusColor(row.approvalStatus)}` }, store.getStatusLabel(row.approvalStatus))
  }
]

const performanceColumns: DataTableColumns<any> = [
  { title: '考核年度', key: 'year', width: 100 },
  { title: '考核周期', key: 'half', width: 100,
    render: (row: any) => h('span', {}, row.half === 'annual' ? '年度' : row.half === 'first' ? '上半年' : '下半年')
  },
  { title: '绩效等级', key: 'levelName', width: 100,
    render: (row: any) => h('span', { style: `color: ${store.getPerformanceLevelColor(row.levelName)}; font-weight: 600` }, row.levelName)
  },
  { title: '绩效系数', key: 'coefficient', width: 100,
    render: (row: any) => h('span', {}, `${row.coefficient}x`)
  },
  { title: '评定人', key: 'reviewerName', width: 120 },
  { title: '评定日期', key: 'reviewedAt', width: 120,
    render: (row: any) => h('span', {}, row.reviewedAt?.slice(0, 10) || '-')
  },
  { title: '评语', key: 'comment', width: 200, ellipsis: { tooltip: true } }
]

function formatMoney(n: number): string {
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getEventTypeLabel(type: ArchiveEventType): string {
  return store.getEventTypeLabel(type)
}

function getEventTypeColor(type: ArchiveEventType): string {
  return store.getEventTypeColor(type)
}

function getEventIcon(type: ArchiveEventType) {
  const iconMap: Record<ArchiveEventType, any> = {
    salary_adjustment: RiseOutlined,
    bonus_payment: WalletOutlined,
    performance_review: StarOutlined,
    approval_record: FileTextOutlined
  }
  return iconMap[type] || FileTextOutlined
}

function toggleEventType(type: ArchiveEventType, checked: boolean) {
  if (checked) {
    if (!selectedTypes.value.includes(type)) {
      selectedTypes.value.push(type)
    }
  } else {
    selectedTypes.value = selectedTypes.value.filter((t) => t !== type)
  }
}

function setQuickFilter(period: string) {
  const now = dayjs()
  if (period === 'all') {
    dateRange.value = null
  } else if (period === 'year') {
    dateRange.value = [now.subtract(1, 'year').valueOf(), now.valueOf()]
  } else if (period === '3year') {
    dateRange.value = [now.subtract(3, 'year').valueOf(), now.valueOf()]
  }
}

function handleEmployeeChange() {
  // handled by computed
}

function handleExport() {
  if (!archive.value) {
    message.warning('请先选择员工')
    return
  }

  const exportData = {
    documentType: '员工薪酬档案-离职交接附件',
    generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    employeeInfo: {
      name: archive.value.employeeName,
      department: archive.value.departmentName,
      position: archive.value.position,
      currentBaseSalary: archive.value.baseSalary,
      currentPerformanceLevel: archive.value.summary.currentLevel,
      currentPerformanceCoefficient: archive.value.summary.currentCoefficient
    },
    summary: archive.value.summary,
    salaryAdjustmentHistory: archive.value.salaryHistory,
    bonusPaymentHistory: archive.value.bonusHistory,
    performanceReviewHistory: archive.value.performanceHistory,
    timelineEvents: archive.value.events
  }

  const json = JSON.stringify(exportData, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${archive.value.employeeName}_薪酬档案_离职交接附件_${dayjs().format('YYYYMMDD')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  message.success('薪酬档案已导出')
}
</script>

<style scoped>
.stat-card {
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%);
}
.stat-card.salary {
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
}
.stat-card.bonus {
  background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
}
.stat-card.performance {
  background: linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%);
}
.stat-card.total {
  background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
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

.timeline-container {
  padding: 8px 0;
}
.timeline-item {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}
.timeline-item:last-child {
  margin-bottom: 0;
}
.timeline-left {
  width: 100px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
  padding-top: 4px;
}
.event-date {
  font-size: 13px;
  font-weight: 600;
  color: #262626;
}
.event-type-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}
.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
  flex-shrink: 0;
}
.marker-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}
.marker-line {
  width: 2px;
  flex: 1;
  background: #e8e8e8;
  margin-top: 6px;
}
.timeline-content {
  flex: 1;
  padding-top: 0;
}
.event-card {
  border-radius: 8px;
}
</style>
