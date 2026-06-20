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
            <template #icon><PrinterOutlined /></template>
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
        <n-grid :cols="5" :x-gap="20">
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
            <div class="stat-card voucher">
              <div class="stat-label">签收凭证归档</div>
              <div class="stat-value">{{ archive.summary.totalBonusSignVouchers }} 份</div>
              <div class="stat-sub">电子签收凭证</div>
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
        <n-space :size="16" wrap align="start">
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
            <n-text depth="3" style="font-size: 12px">事由分类</n-text>
            <n-select
              v-model:value="filterReasonCategory"
              :options="reasonCategoryOptions"
              placeholder="全部事由"
              style="width: 140px"
              clearable
            />
          </n-space>

          <n-space vertical :size="6">
            <n-text depth="3" style="font-size: 12px">奖金类型</n-text>
            <n-select
              v-model:value="filterBonusType"
              :options="bonusTypeOptions"
              placeholder="全部类型"
              style="width: 140px"
              clearable
            />
          </n-space>

          <n-space vertical :size="6">
            <n-text depth="3" style="font-size: 12px">绩效等级</n-text>
            <n-select
              v-model:value="filterPerformanceLevel"
              :options="performanceLevelOptions"
              placeholder="全部等级"
              style="width: 140px"
              clearable
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
              :data="filteredSalaryHistory"
              :row-key="(row: any) => row.id"
              striped
              :pagination="{ pageSize: 5, showSizePicker: true, pageSizes: [5, 10, 20] }"
            />
          </n-tab-pane>
          <n-tab-pane name="bonus" tab="奖金发放">
            <n-data-table
              :columns="bonusColumns"
              :data="filteredBonusHistory"
              :row-key="(row: any) => row.id"
              striped
              :pagination="{ pageSize: 5, showSizePicker: true, pageSizes: [5, 10, 20] }"
            />
          </n-tab-pane>
          <n-tab-pane name="performance" tab="绩效评级">
            <n-data-table
              :columns="performanceColumns"
              :data="filteredPerformanceHistory"
              :row-key="(row: any) => row.id"
              striped
              :pagination="{ pageSize: 5, showSizePicker: true, pageSizes: [5, 10, 20] }"
            />
          </n-tab-pane>
          <n-tab-pane name="signVoucher" tab="签收凭证">
            <n-space v-if="archive.summary.totalBonusSignVouchers > 0" justify="end" style="margin-bottom: 12px">
              <n-button size="small" type="primary" ghost @click="handleExportAllVouchers">
                <template #icon><DownloadOutlined /></template>
                批量下载全部凭证
              </n-button>
              <n-button size="small" type="primary" @click="handleExportVoucherSummary">
                <template #icon><FileTextOutlined /></template>
                导出凭证汇总表
              </n-button>
            </n-space>
            <n-data-table
              :columns="signVoucherColumns"
              :data="filteredSignVouchers"
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
  PrinterOutlined,
  DownloadOutlined,
  EyeOutlined
} from '@vicons/antd'
import { useSalaryAdjustmentStore } from '@/stores/salaryAdjustment'
import { useBonusStore } from '@/stores/bonus'
import type { ArchiveEventType, EmployeeCompensationArchive, AdjustmentReasonCategory } from '@/types'
import dayjs from 'dayjs'

const store = useSalaryAdjustmentStore()
const bonusStore = useBonusStore()
const message = useMessage()

const selectedEmployeeId = ref<string | null>(null)
const selectedTypes = ref<ArchiveEventType[]>(['salary_adjustment', 'bonus_payment', 'performance_review', 'approval_record'])
const dateRange = ref<[number, number] | null>(null)
const activeTab = ref('salary')
const filterReasonCategory = ref<AdjustmentReasonCategory | null>(null)
const filterBonusType = ref<string | null>(null)
const filterPerformanceLevel = ref<string | null>(null)

const eventTypes = [
  { value: 'salary_adjustment' as ArchiveEventType, label: '调薪', color: '#1890ff' },
  { value: 'bonus_payment' as ArchiveEventType, label: '奖金', color: '#52c41a' },
  { value: 'performance_review' as ArchiveEventType, label: '绩效', color: '#722ed1' },
  { value: 'approval_record' as ArchiveEventType, label: '审批', color: '#fa8c16' }
]

const reasonCategoryOptions = computed(() => {
  const cats = new Set<AdjustmentReasonCategory>()
  if (archive.value) {
    archive.value.salaryHistory.forEach((h) => cats.add(h.reasonCategory))
  }
  return Array.from(cats).map((c) => ({
    label: store.getCategoryLabel(c),
    value: c
  }))
})

const bonusTypeOptions = computed(() => {
  const types = new Set<string>()
  if (archive.value) {
    archive.value.bonusHistory.forEach((b) => types.add(b.type))
  }
  return Array.from(types).map((t) => ({
    label: store.getBonusTypeLabel(t),
    value: t
  }))
})

const performanceLevelOptions = computed(() => {
  const levels = new Set<string>()
  if (archive.value) {
    archive.value.performanceHistory.forEach((p) => {
      levels.add(p.levelName)
    })
  }
  return Array.from(levels).map((l) => ({
    label: l,
    value: l
  }))
})

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

function matchDateRange(dateStr: string): boolean {
  if (!dateRange.value || !dateRange.value[0] || !dateRange.value[1]) return true
  const d = dayjs(dateStr)
  return d.isAfter(dayjs(dateRange.value[0]).subtract(1, 'day')) && d.isBefore(dayjs(dateRange.value[1]).add(1, 'day'))
}

const filteredSalaryHistory = computed(() => {
  if (!archive.value) return []
  let list = [...archive.value.salaryHistory]
  if (filterReasonCategory.value) {
    list = list.filter((h) => h.reasonCategory === filterReasonCategory.value)
  }
  list = list.filter((h) => matchDateRange(h.effectiveDate))
  return list
})

const filteredBonusHistory = computed(() => {
  if (!archive.value) return []
  let list = [...archive.value.bonusHistory]
  if (filterBonusType.value) {
    list = list.filter((b) => b.type === filterBonusType.value)
  }
  list = list.filter((b) => matchDateRange(b.paymentDate))
  return list
})

const filteredPerformanceHistory = computed(() => {
  if (!archive.value) return []
  let list = [...archive.value.performanceHistory]
  if (filterPerformanceLevel.value) {
    list = list.filter((p) => p.levelName === filterPerformanceLevel.value)
  }
  list = list.filter((p) => matchDateRange(p.reviewedAt))
  return list
})

const filteredEvents = computed(() => {
  if (!archive.value) return []
  let events = [...archive.value.events]

  events = events.filter((e) => selectedTypes.value.includes(e.type))

  events = events.filter((e) => matchDateRange(e.date))

  if (filterReasonCategory.value) {
    events = events.filter((e) => {
      if (e.type === 'salary_adjustment') {
        return e.detail?.reasonCategory === filterReasonCategory.value
      }
      return true
    })
  }

  if (filterBonusType.value) {
    events = events.filter((e) => {
      if (e.type === 'bonus_payment') {
        return e.detail?.type === filterBonusType.value
      }
      return true
    })
  }

  if (filterPerformanceLevel.value) {
    events = events.filter((e) => {
      if (e.type === 'performance_review') {
        return e.detail?.levelName === filterPerformanceLevel.value
      }
      return true
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

const filteredSignVouchers = computed(() => {
  if (!archive.value) return []
  let list = [...archive.value.bonusSignVouchers]
  list = list.filter((v) => matchDateRange(v.signedAt))
  return list
})

const signVoucherColumns: DataTableColumns<any> = [
  { title: '凭证编号', key: 'voucherNo', width: 220,
    render: (row: any) => h('n-tag', { type: 'info', bordered: true }, { default: () => row.voucherNo })
  },
  { title: '所属批次', key: 'batchName', width: 160 },
  { title: '奖金名称', key: 'bonusName', width: 140 },
  { title: '年度', key: 'year', width: 80 },
  { title: '税前金额', key: 'grossAmount', width: 120,
    render: (row: any) => h('span', {}, formatMoney(row.grossAmount))
  },
  { title: '个税', key: 'taxAmount', width: 100,
    render: (row: any) => h('span', { style: 'color: #f5222d' }, formatMoney(row.taxAmount))
  },
  { title: '税后金额', key: 'netAmount', width: 120,
    render: (row: any) => h('span', { style: 'color: #52c41a; font-weight: 600' }, formatMoney(row.netAmount))
  },
  { title: '计税方式', key: 'taxMethod', width: 100,
    render: (row: any) => h('span', {}, row.taxMethod === 'oneTime' ? '单独计税' : '综合计税')
  },
  { title: '签收人', key: 'signature', width: 100 },
  { title: '签收时间', key: 'signedAt', width: 160,
    render: (row: any) => h('span', {}, row.signedAt?.slice(0, 16) || '-')
  },
  { title: '归档时间', key: 'archivedAt', width: 160,
    render: (row: any) => h('span', {}, row.archivedAt?.slice(0, 16) || '-')
  },
  { title: '操作', key: 'actions', width: 160, fixed: 'right',
    render: (row: any) => {
      return h('n-space', {}, {
        default: () => [
          h('n-button', {
            size: 'small',
            type: 'primary',
            quaternary: true,
            onClick: () => handlePreviewVoucher(row.id)
          }, {
            icon: () => h(EyeOutlined),
            default: () => '预览'
          }),
          h('n-button', {
            size: 'small',
            type: 'success',
            quaternary: true,
            onClick: () => handleDownloadVoucher(row.id)
          }, {
            icon: () => h(DownloadOutlined),
            default: () => '下载'
          })
        ]
      })
    }
  }
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
  filterReasonCategory.value = null
  filterBonusType.value = null
  filterPerformanceLevel.value = null
}

function handlePreviewVoucher(voucherId: string) {
  const ok = bonusStore.exportVoucherPdf(voucherId)
  if (!ok) {
    message.error('预览失败，请检查浏览器弹窗设置')
  }
}

function handleDownloadVoucher(voucherId: string) {
  const ok = bonusStore.exportVoucherHtml(voucherId)
  if (ok) {
    message.success('凭证下载成功')
  } else {
    message.error('下载失败')
  }
}

function handleExportAllVouchers() {
  if (!archive.value) return
  const vouchers = filteredSignVouchers.value
  if (vouchers.length === 0) {
    message.warning('没有可导出的签收凭证')
    return
  }
  vouchers.forEach((voucher, index) => {
    setTimeout(() => {
      bonusStore.exportVoucherHtml(voucher.id)
    }, index * 200)
  })
  message.success(`已开始下载 ${vouchers.length} 份凭证文件`)
}

function handleExportVoucherSummary() {
  if (!archive.value) return
  const vouchers = filteredSignVouchers.value
  if (vouchers.length === 0) {
    message.warning('没有可导出的签收凭证')
    return
  }
  const html = buildVoucherSummaryHtml(vouchers)
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    message.error('无法打开打印窗口，请检查浏览器弹窗拦截设置')
    return
  }
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.onload = () => {
    printWindow.document.title = `${archive.value!.employeeName}_签收凭证汇总_${dayjs().format('YYYYMMDD')}`
    setTimeout(() => printWindow.print(), 300)
  }
  message.success('汇总表已打开，可打印或导出PDF')
}

function buildVoucherSummaryHtml(vouchers: any[]): string {
  if (!archive.value) return ''
  const a = archive.value
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  const totalGross = vouchers.reduce((s, v) => s + v.grossAmount, 0)
  const totalTax = vouchers.reduce((s, v) => s + v.taxAmount, 0)
  const totalNet = vouchers.reduce((s, v) => s + v.netAmount, 0)

  const rows = vouchers.map((v, i) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td>${v.voucherNo}</td>
      <td>${v.batchName}</td>
      <td>${v.bonusName}</td>
      <td style="text-align:center">${v.year}</td>
      <td style="text-align:right">${formatMoney(v.grossAmount)}</td>
      <td style="text-align:right;color:#f5222d">${formatMoney(v.taxAmount)}</td>
      <td style="text-align:right;color:#52c41a;font-weight:600">${formatMoney(v.netAmount)}</td>
      <td style="text-align:center">${v.taxMethod === 'oneTime' ? '单独计税' : '综合计税'}</td>
      <td>${v.signature}</td>
      <td>${v.signedAt?.slice(0, 16) || '-'}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${a.employeeName}_签收凭证汇总_${dayjs().format('YYYYMMDD')}</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; color: #262626; line-height: 1.6; font-size: 12px; }
  .header { text-align: center; padding: 16px 0 12px; border-bottom: 3px solid #2080f0; margin-bottom: 16px; }
  .header h1 { font-size: 20px; color: #2080f0; margin-bottom: 4px; }
  .header p { color: #8c8c8c; font-size: 11px; }
  .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background: #f6f8fa; border-radius: 8px; padding: 12px 20px; margin-bottom: 16px; }
  .info-item { display: flex; gap: 6px; }
  .info-label { color: #8c8c8c; min-width: 70px; }
  .info-value { font-weight: 600; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
  .summary-card { text-align: center; padding: 10px; border-radius: 8px; }
  .summary-card .label { font-size: 11px; color: #8c8c8c; margin-bottom: 2px; }
  .summary-card .value { font-size: 18px; font-weight: 700; }
  .summary-card .sub { font-size: 10px; color: #8c8c8c; margin-top: 2px; }
  .sc-total { background: #e6f7ff; }
  .sc-gross { background: #fff7e6; }
  .sc-tax { background: #fff1f0; }
  .sc-net { background: #f6ffed; }
  h2 { font-size: 14px; color: #262626; margin: 12px 0 8px; padding-left: 8px; border-left: 3px solid #2080f0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px; }
  th, td { border: 1px solid #e8e8e8; padding: 5px 8px; text-align: left; }
  th { background: #fafafa; font-weight: 600; color: #595959; white-space: nowrap; }
  tr:nth-child(even) td { background: #fafafa; }
  .total-row td { background: #fff7e6 !important; font-weight: 600; }
  .footer { text-align: center; color: #bfbfbf; font-size: 10px; margin-top: 24px; padding-top: 10px; border-top: 1px solid #e8e8e8; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="header">
  <h1>${a.employeeName} - 奖金签收凭证汇总表</h1>
  <p>生成时间：${now}</p>
</div>
<div class="info-grid">
  <div class="info-item"><span class="info-label">姓　名：</span><span class="info-value">${a.employeeName}</span></div>
  <div class="info-item"><span class="info-label">部　门：</span><span class="info-value">${a.departmentName}</span></div>
  <div class="info-item"><span class="info-label">职　位：</span><span class="info-value">${a.position}</span></div>
  <div class="info-item"><span class="info-label">凭证总数：</span><span class="info-value">${vouchers.length} 份</span></div>
</div>
<div class="summary-grid">
  <div class="summary-card sc-total"><div class="label">凭证份数</div><div class="value">${vouchers.length} 份</div><div class="sub">已签收凭证</div></div>
  <div class="summary-card sc-gross"><div class="label">税前总额</div><div class="value">${formatMoney(totalGross)}</div><div class="sub">税前累计</div></div>
  <div class="summary-card sc-tax"><div class="label">个税总额</div><div class="value" style="color:#f5222d">${formatMoney(totalTax)}</div><div class="sub">累计扣税</div></div>
  <div class="summary-card sc-net"><div class="label">税后总额</div><div class="value" style="color:#52c41a">${formatMoney(totalNet)}</div><div class="sub">实发累计</div></div>
</div>
<h2>签收凭证明细</h2>
<table>
  <thead>
    <tr>
      <th style="width:50px">序号</th><th>凭证编号</th><th>所属批次</th><th>奖金名称</th>
      <th style="width:60px">年度</th><th>税前金额</th><th>扣税金额</th><th>税后实发</th>
      <th style="width:80px">计税方式</th><th>签收人</th><th>签收时间</th>
    </tr>
  </thead>
  <tbody>
    ${rows || '<tr><td colspan="11" style="text-align:center;color:#bfbfbf">暂无记录</td></tr>'}
    ${vouchers.length > 0 ? `
      <tr class="total-row">
        <td colspan="5" style="text-align:center">合　计</td>
        <td style="text-align:right">${formatMoney(totalGross)}</td>
        <td style="text-align:right;color:#f5222d">${formatMoney(totalTax)}</td>
        <td style="text-align:right;color:#52c41a">${formatMoney(totalNet)}</td>
        <td colspan="3"></td>
      </tr>
    ` : ''}
  </tbody>
</table>
<div class="footer">
  本文档由「年终奖模拟器」系统自动生成 · ${now}
</div>
</body>
</html>`
}

function buildHtmlDocument(): string {
  if (!archive.value) return ''

  const a = archive.value
  const events = filteredEvents.value
  const salaryData = filteredSalaryHistory.value
  const bonusData = filteredBonusHistory.value
  const perfData = filteredPerformanceHistory.value
  const voucherData = filteredSignVouchers.value
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  const typeLabel: Record<string, string> = {
    salary_adjustment: '调薪',
    bonus_payment: '奖金发放',
    performance_review: '绩效评级',
    approval_record: '审批记录'
  }
  const typeColor: Record<string, string> = {
    salary_adjustment: '#1890ff',
    bonus_payment: '#52c41a',
    performance_review: '#722ed1',
    approval_record: '#fa8c16'
  }

  const timelineRows = events.map((e) => `
    <tr>
      <td style="white-space:nowrap">${e.date}</td>
      <td><span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;background:${typeColor[e.type]}20;color:${typeColor[e.type]}">${typeLabel[e.type]}</span></td>
      <td>${e.title}</td>
      <td>${e.description}</td>
      <td>${e.amount !== undefined ? formatMoney(e.amount) : '-'}</td>
      <td>${e.status || '-'}</td>
    </tr>
  `).join('')

  const salaryRows = salaryData.map((r) => `
    <tr>
      <td>${r.effectiveDate}</td>
      <td>${store.getCategoryLabel(r.reasonCategory)}</td>
      <td>${r.reasonName}</td>
      <td>${formatMoney(r.oldSalary)}</td>
      <td>${formatMoney(r.newSalary)}</td>
      <td style="color:#52c41a">+${formatMoney(r.adjustmentAmount)}</td>
      <td style="color:#52c41a">+${(r.adjustmentRatio * 100).toFixed(2)}%</td>
      <td>${r.applicantName}</td>
      <td>${r.approverName || '-'}</td>
    </tr>
  `).join('')

  const bonusRows = bonusData.map((r) => `
    <tr>
      <td>${r.paymentDate}</td>
      <td>${store.getBonusTypeLabel(r.type)}</td>
      <td>${r.name}</td>
      <td>${formatMoney(r.grossAmount)}</td>
      <td style="color:#f5222d">${formatMoney(r.taxAmount)}</td>
      <td style="color:#52c41a;font-weight:600">${formatMoney(r.netAmount)}</td>
      <td>${r.taxMethod === 'oneTime' ? '单独计税' : '综合计税'}</td>
      <td>${store.getStatusLabel(r.approvalStatus)}</td>
    </tr>
  `).join('')

  const perfRows = perfData.map((r) => `
    <tr>
      <td>${r.year}</td>
      <td>${r.half === 'annual' ? '年度' : r.half === 'first' ? '上半年' : '下半年'}</td>
      <td style="color:${store.getPerformanceLevelColor(r.levelName)};font-weight:600">${r.levelName}</td>
      <td>${r.coefficient}x</td>
      <td>${r.reviewerName}</td>
      <td>${r.reviewedAt?.slice(0, 10) || '-'}</td>
      <td>${r.comment || '-'}</td>
    </tr>
  `).join('')

  const voucherRows = voucherData.map((r) => `
    <tr>
      <td>${r.voucherNo}</td>
      <td>${r.batchName}</td>
      <td>${r.bonusName}</td>
      <td style="text-align:center">${r.year}</td>
      <td>${formatMoney(r.grossAmount)}</td>
      <td style="color:#f5222d">${formatMoney(r.taxAmount)}</td>
      <td style="color:#52c41a;font-weight:600">${formatMoney(r.netAmount)}</td>
      <td>${r.taxMethod === 'oneTime' ? '单独计税' : '综合计税'}</td>
      <td>${r.signature}</td>
      <td>${r.signedAt?.slice(0, 16) || '-'}</td>
      <td>${r.archivedAt?.slice(0, 16) || '-'}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${a.employeeName}_薪酬档案_${dayjs().format('YYYYMMDD')}</title>
<style>
  @page { size: A4; margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; color: #262626; line-height: 1.6; font-size: 13px; }
  .header { text-align: center; padding: 24px 0 16px; border-bottom: 3px solid #2080f0; margin-bottom: 20px; }
  .header h1 { font-size: 22px; color: #2080f0; margin-bottom: 4px; }
  .header p { color: #8c8c8c; font-size: 12px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 32px; background: #f6f8fa; border-radius: 8px; padding: 16px 24px; margin-bottom: 20px; }
  .info-item { display: flex; gap: 8px; }
  .info-label { color: #8c8c8c; min-width: 80px; }
  .info-value { font-weight: 600; }
  .summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px; }
  .summary-card { text-align: center; padding: 12px; border-radius: 8px; }
  .summary-card .label { font-size: 12px; color: #8c8c8c; margin-bottom: 4px; }
  .summary-card .value { font-size: 20px; font-weight: 700; }
  .summary-card .sub { font-size: 11px; color: #8c8c8c; margin-top: 2px; }
  .sc-salary { background: #e6f7ff; }
  .sc-bonus { background: #f6ffed; }
  .sc-perf { background: #f9f0ff; }
  .sc-voucher { background: #e6fffb; }
  .sc-total { background: #fff7e6; }
  h2 { font-size: 16px; color: #262626; margin: 20px 0 10px; padding-left: 8px; border-left: 3px solid #2080f0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
  th, td { border: 1px solid #e8e8e8; padding: 6px 10px; text-align: left; }
  th { background: #fafafa; font-weight: 600; color: #595959; white-space: nowrap; }
  tr:nth-child(even) td { background: #fafafa; }
  .footer { text-align: center; color: #bfbfbf; font-size: 11px; margin-top: 32px; padding-top: 12px; border-top: 1px solid #e8e8e8; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>

<div class="header">
  <h1>员工薪酬档案 · 离职交接附件</h1>
  <p>生成时间：${now}</p>
</div>

<div class="info-grid">
  <div class="info-item"><span class="info-label">姓　名：</span><span class="info-value">${a.employeeName}</span></div>
  <div class="info-item"><span class="info-label">部　门：</span><span class="info-value">${a.departmentName}</span></div>
  <div class="info-item"><span class="info-label">职　位：</span><span class="info-value">${a.position}</span></div>
  <div class="info-item"><span class="info-label">当前月薪：</span><span class="info-value">${formatMoney(a.baseSalary)}</span></div>
  <div class="info-item"><span class="info-label">绩效等级：</span><span class="info-value">${a.summary.currentLevel}（${a.summary.currentCoefficient}x）</span></div>
  <div class="info-item"><span class="info-label">累计调薪：</span><span class="info-value">${a.summary.totalSalaryAdjustments}次 / ${formatMoney(a.summary.totalAdjustmentAmount)}</span></div>
</div>

<div class="summary-grid">
  <div class="summary-card sc-salary">
    <div class="label">累计调薪次数</div>
    <div class="value">${a.summary.totalSalaryAdjustments} 次</div>
    <div class="sub">累计 ${formatMoney(a.summary.totalAdjustmentAmount)}</div>
  </div>
  <div class="summary-card sc-bonus">
    <div class="label">累计奖金发放</div>
    <div class="value">${a.summary.totalBonusPayments} 笔</div>
    <div class="sub">税后 ${formatMoney(a.summary.totalBonusNet)}</div>
  </div>
  <div class="summary-card sc-perf">
    <div class="label">绩效评级记录</div>
    <div class="value">${a.summary.performanceRecords} 次</div>
    <div class="sub">当前等级 ${a.summary.currentLevel}</div>
  </div>
  <div class="summary-card sc-voucher">
    <div class="label">签收凭证归档</div>
    <div class="value">${a.summary.totalBonusSignVouchers} 份</div>
    <div class="sub">电子签收凭证</div>
  </div>
  <div class="summary-card sc-total">
    <div class="label">历史总事件数</div>
    <div class="value">${events.length} 条</div>
    <div class="sub">筛选后记录</div>
  </div>
</div>

<h2>薪酬档案时间轴</h2>
<table>
  <thead>
    <tr><th>日期</th><th>类型</th><th>标题</th><th>详情</th><th>金额</th><th>状态</th></tr>
  </thead>
  <tbody>${timelineRows || '<tr><td colspan="6" style="text-align:center;color:#bfbfbf">暂无记录</td></tr>'}</tbody>
</table>

<h2>调薪记录明细</h2>
<table>
  <thead>
    <tr><th>生效日期</th><th>事由分类</th><th>具体事由</th><th>调整前</th><th>调整后</th><th>调整金额</th><th>调整比例</th><th>申请人</th><th>批准人</th></tr>
  </thead>
  <tbody>${salaryRows || '<tr><td colspan="9" style="text-align:center;color:#bfbfbf">暂无记录</td></tr>'}</tbody>
</table>

<h2>奖金发放明细</h2>
<table>
  <thead>
    <tr><th>发放日期</th><th>奖金类型</th><th>奖金名称</th><th>税前金额</th><th>扣税金额</th><th>税后实发</th><th>计税方式</th><th>状态</th></tr>
  </thead>
  <tbody>${bonusRows || '<tr><td colspan="8" style="text-align:center;color:#bfbfbf">暂无记录</td></tr>'}</tbody>
</table>

<h2>绩效评级明细</h2>
<table>
  <thead>
    <tr><th>考核年度</th><th>考核周期</th><th>绩效等级</th><th>绩效系数</th><th>评定人</th><th>评定日期</th><th>评语</th></tr>
  </thead>
  <tbody>${perfRows || '<tr><td colspan="7" style="text-align:center;color:#bfbfbf">暂无记录</td></tr>'}</tbody>
</table>

<h2>签收凭证归档</h2>
<table>
  <thead>
    <tr><th>凭证编号</th><th>所属批次</th><th>奖金名称</th><th>年度</th><th>税前金额</th><th>扣税金额</th><th>税后实发</th><th>计税方式</th><th>签收人</th><th>签收时间</th><th>归档时间</th></tr>
  </thead>
  <tbody>${voucherRows || '<tr><td colspan="11" style="text-align:center;color:#bfbfbf">暂无记录</td></tr>'}</tbody>
</table>

<div class="footer">
  本文档由「年终奖模拟器」系统自动生成，作为员工离职交接附件使用 · ${now}
</div>

</body>
</html>`
}

function handleExport() {
  if (!archive.value) {
    message.warning('请先选择员工')
    return
  }

  const html = buildHtmlDocument()
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    message.error('无法打开打印窗口，请检查浏览器弹窗拦截设置')
    return
  }

  printWindow.document.write(html)
  printWindow.document.close()

  printWindow.onload = () => {
    printWindow.document.title = `${archive.value!.employeeName}_薪酬档案_${dayjs().format('YYYYMMDD')}`
    setTimeout(() => {
      printWindow.print()
    }, 300)
  }

  message.info('已打开打印预览，可另存为 PDF 文件')
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
.stat-card.voucher {
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
