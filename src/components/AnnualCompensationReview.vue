<template>
  <n-space vertical :size="16" style="width: 100%">
    <n-card>
      <n-space justify="space-between" align="center" style="width: 100%">
        <n-space vertical :size="4">
          <n-text strong style="font-size: 18px">年度薪酬包复盘报告</n-text>
          <n-text depth="3" style="font-size: 13px">整合薪酬档案与历史方案，输出年度调薪、绩效、奖金趋势分析</n-text>
        </n-space>
        <n-space>
          <n-button type="primary" ghost @click="handleExportPdf">
            <template #icon><PrinterOutlined /></template>
            导出 PDF 报告
          </n-button>
          <n-button type="primary" @click="handleExportJson">
            <template #icon><FileTextOutlined /></template>
            导出 JSON 数据
          </n-button>
        </n-space>
      </n-space>
    </n-card>

    <n-card title="筛选条件">
      <n-space :size="20" wrap align="start">
        <n-space vertical :size="6">
          <n-text depth="3" style="font-size: 12px">统计年份</n-text>
          <n-select
            v-model:value="selectedYear"
            :options="yearOptions"
            style="width: 140px"
            @update:value="handleYearChange"
          />
        </n-space>

        <n-space vertical :size="6">
          <n-text depth="3" style="font-size: 12px">统计范围</n-text>
          <n-radio-group v-model:value="scope">
            <n-space>
              <n-radio value="company">全公司</n-radio>
              <n-radio value="department">按部门</n-radio>
              <n-radio value="employee">按员工</n-radio>
            </n-space>
          </n-radio-group>
        </n-space>

        <n-space v-if="scope === 'department'" vertical :size="6">
          <n-text depth="3" style="font-size: 12px">选择部门</n-text>
          <n-select
            v-model:value="selectedDepartmentId"
            :options="departmentOptions"
            style="width: 200px"
            filterable
          />
        </n-space>

        <n-space v-if="scope === 'employee'" vertical :size="6">
          <n-text depth="3" style="font-size: 12px">选择员工</n-text>
          <n-select
            v-model:value="selectedEmployeeId"
            :options="employeeOptions"
            style="width: 300px"
            filterable
          />
        </n-space>
      </n-space>
    </n-card>

    <template v-if="report">
      <template v-if="report.companySummary">
        <n-card title="公司薪酬总览">
          <n-grid :cols="4" :x-gap="20">
            <n-gi>
              <div class="stat-card sc-headcount">
                <div class="stat-label">员工总数</div>
                <div class="stat-value">{{ report.companySummary.totalHeadcount }} 人</div>
              </div>
            </n-gi>
            <n-gi>
              <div class="stat-card sc-salary">
                <div class="stat-label">年度薪资总额</div>
                <div class="stat-value">{{ formatMoney(report.companySummary.totalAnnualSalary) }}</div>
              </div>
            </n-gi>
            <n-gi>
              <div class="stat-card sc-bonus">
                <div class="stat-label">年度奖金总额</div>
                <div class="stat-value">{{ formatMoney(report.companySummary.totalBonusGross) }}</div>
              </div>
            </n-gi>
            <n-gi>
              <div class="stat-card sc-total">
                <div class="stat-label">年度薪酬总包</div>
                <div class="stat-value">{{ formatMoney(report.companySummary.totalCompensation) }}</div>
              </div>
            </n-gi>
          </n-grid>

          <n-divider style="margin: 20px 0" />

          <n-grid :cols="4" :x-gap="20">
            <n-gi>
              <div class="stat-card sc-avg-salary">
                <div class="stat-label">平均月薪</div>
                <div class="stat-value">{{ formatMoney(report.companySummary.averageSalary) }}</div>
              </div>
            </n-gi>
            <n-gi>
              <div class="stat-card sc-avg-bonus">
                <div class="stat-label">平均奖金</div>
                <div class="stat-value">{{ formatMoney(report.companySummary.averageBonus) }}</div>
              </div>
            </n-gi>
            <n-gi>
              <div class="stat-card sc-growth">
                <div class="stat-label">整体薪资增长率</div>
                <div class="stat-value" style="color: #52c41a">
                  +{{ (report.companySummary.overallSalaryGrowth * 100).toFixed(2) }}%
                </div>
              </div>
            </n-gi>
            <n-gi>
              <div class="stat-card sc-perf">
                <div class="stat-label">绩效等级数</div>
                <div class="stat-value">{{ Object.keys(report.companySummary.performanceDistribution).length }} 级</div>
              </div>
            </n-gi>
          </n-grid>
        </n-card>
      </template>

      <template v-if="scope === 'employee' && report.employees && report.employees.length > 0">
        <EmployeeReviewDetail :review="report.employees[0]" />
      </template>

      <n-grid :cols="2" :x-gap="16">
        <n-gi>
          <n-card title="调薪事由分布">
            <template v-if="adjustedAdjustmentByCategory && Object.keys(adjustedAdjustmentByCategory).length > 0">
              <n-space vertical :size="12" style="width: 100%">
                <div
                  v-for="item in categoryList"
                  :key="item.category"
                  class="category-bar-item"
                >
                  <n-space justify="space-between" align="center" style="width: 100%">
                    <n-space align="center">
                      <n-tag :type="getCategoryColorType(item.category)" size="small" bordered>
                        {{ store.getCategoryLabel(item.category) }}
                      </n-tag>
                    </n-space>
                    <n-text strong>{{ formatMoney(item.amount) }}</n-text>
                  </n-space>
                  <div class="bar-container">
                    <div
                      class="bar-fill"
                      :style="{
                        width: `${item.percent}%`,
                        backgroundColor: getCategoryColor(item.category)
                      }"
                    ></div>
                  </div>
                  <n-text depth="3" style="font-size: 12px">
                    占比 {{ item.percent.toFixed(1) }}%
                  </n-text>
                </div>
              </n-space>
            </template>
            <n-empty v-else description="暂无调薪数据" />
          </n-card>
        </n-gi>

        <n-gi>
          <n-card title="绩效等级分布">
            <template v-if="performanceDistribution && Object.keys(performanceDistribution).length > 0">
              <n-space vertical :size="12" style="width: 100%">
                <div
                  v-for="item in performanceList"
                  :key="item.level"
                  class="category-bar-item"
                >
                  <n-space justify="space-between" align="center" style="width: 100%">
                    <n-space align="center">
                      <n-tag
                        :type="getPerformanceLevelColorType(item.level)"
                        size="small"
                        bordered
                      >
                        {{ item.level }}
                      </n-tag>
                    </n-space>
                    <n-text strong>{{ item.count }} 人</n-text>
                  </n-space>
                  <div class="bar-container">
                    <div
                      class="bar-fill"
                      :style="{
                        width: `${item.percent}%`,
                        backgroundColor: store.getPerformanceLevelColor(item.level)
                      }"
                    ></div>
                  </div>
                  <n-text depth="3" style="font-size: 12px">
                    占比 {{ item.percent.toFixed(1) }}%
                  </n-text>
                </div>
              </n-space>
            </template>
            <n-empty v-else description="暂无绩效数据" />
          </n-card>
        </n-gi>
      </n-grid>

      <n-card title="部门薪酬概览">
        <n-data-table
          :columns="departmentColumns"
          :data="report.departments || []"
          :row-key="(row: any) => row.departmentId"
          striped
          :pagination="{ pageSize: 10, showSizePicker: true, pageSizes: [10, 20, 50] }"
        />
      </n-card>

      <n-grid :cols="2" :x-gap="16">
        <n-gi>
          <n-card title="薪资增长 TOP5">
            <template v-if="report.topSalaryGrowth && report.topSalaryGrowth.length > 0">
              <n-space vertical :size="8" style="width: 100%">
                <div
                  v-for="(item, index) in report.topSalaryGrowth"
                  :key="item.employeeId"
                  class="rank-item"
                >
                  <div class="rank-badge" :class="`rank-${index + 1}`">{{ index + 1 }}</div>
                  <n-space justify="space-between" align="center" style="flex: 1">
                    <n-space vertical :size="2">
                      <n-text strong>{{ item.employeeName }}</n-text>
                      <n-text depth="3" style="font-size: 12px">{{ item.departmentName }}</n-text>
                    </n-space>
                    <n-space vertical align="end" :size="2">
                      <n-tag type="success" size="large">
                        +{{ (item.salaryGrowthRate * 100).toFixed(2) }}%
                      </n-tag>
                      <n-text depth="3" style="font-size: 12px">
                        {{ formatMoney(item.startSalary) }} → {{ formatMoney(item.endSalary) }}
                      </n-text>
                    </n-space>
                  </n-space>
                </div>
              </n-space>
            </template>
            <n-empty v-else description="暂无数据" />
          </n-card>
        </n-gi>

        <n-gi>
          <n-card title="奖金收入 TOP5">
            <template v-if="report.topBonusEarners && report.topBonusEarners.length > 0">
              <n-space vertical :size="8" style="width: 100%">
                <div
                  v-for="(item, index) in report.topBonusEarners"
                  :key="item.employeeId"
                  class="rank-item"
                >
                  <div class="rank-badge" :class="`rank-${index + 1}`">{{ index + 1 }}</div>
                  <n-space justify="space-between" align="center" style="flex: 1">
                    <n-space vertical :size="2">
                      <n-text strong>{{ item.employeeName }}</n-text>
                      <n-text depth="3" style="font-size: 12px">{{ item.departmentName }}</n-text>
                    </n-space>
                    <n-space vertical align="end" :size="2">
                      <n-text strong type="success" style="font-size: 16px">
                        {{ formatMoney(item.summary.totalBonusGross) }}
                      </n-text>
                      <n-text depth="3" style="font-size: 12px">
                        税后 {{ formatMoney(item.summary.totalBonusNet) }}
                      </n-text>
                    </n-space>
                  </n-space>
                </div>
              </n-space>
            </template>
            <n-empty v-else description="暂无数据" />
          </n-card>
        </n-gi>
      </n-grid>

      <n-card title="员工薪酬明细表">
        <n-data-table
          :columns="employeeColumns"
          :data="report.employees || []"
          :row-key="(row: any) => row.employeeId"
          striped
          :pagination="{ pageSize: 10, showSizePicker: true, pageSizes: [10, 20, 50, 100] }"
        >
          <template #body="{ rows }">
            <tbody>
              <tr v-for="row in rows" :key="row.employeeId">
                <td>{{ row.employeeName }}</td>
                <td>{{ row.departmentName }}</td>
                <td>{{ row.position }}</td>
                <td style="text-align: right">{{ formatMoney(row.endSalary) }}</td>
                <td style="text-align: right">
                  <span :style="{ color: row.salaryGrowthRate >= 0 ? '#52c41a' : '#f5222d' }">
                    {{ row.salaryGrowthRate >= 0 ? '+' : '' }}{{ (row.salaryGrowthRate * 100).toFixed(2) }}%
                  </span>
                </td>
                <td style="text-align: right; color: #52c41a; font-weight: 600">{{ formatMoney(row.summary?.totalBonusGross || 0) }}</td>
                <td style="text-align: right; font-weight: 700; color: #fa8c16">{{ formatMoney(row.summary?.totalCompensationGross || 0) }}</td>
                <td style="text-align: center">
                  <n-tag
                    :type="getPerformanceLevelColorType(row.summary?.highestPerformanceLevel || '-')"
                    size="small"
                    bordered
                  >
                    {{ row.summary?.highestPerformanceLevel || '-' }}
                  </n-tag>
                </td>
              </tr>
            </tbody>
          </template>
        </n-data-table>
      </n-card>
    </template>

    <n-card v-else>
      <n-empty description="正在生成报告..." />
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
import { ref, computed, watch, h } from 'vue'
import { useMessage, type DataTableColumns, NTag } from 'naive-ui'
import {
  PrinterOutlined,
  FileTextOutlined
} from '@vicons/antd'
import { useSalaryAdjustmentStore } from '@/stores/salaryAdjustment'
import { useBonusStore } from '@/stores/bonus'
import type {
  AnnualCompensationReviewReport,
  AdjustmentReasonCategory,
  EmployeeAnnualReview
} from '@/types'
import dayjs from 'dayjs'
import EmployeeReviewDetail from './EmployeeReviewDetail.vue'

const store = useSalaryAdjustmentStore()
const bonusStore = useBonusStore()
const message = useMessage()

const selectedYear = ref<number>(dayjs().year() - 1)
const scope = ref<'company' | 'department' | 'employee'>('company')
const selectedDepartmentId = ref<string | null>(null)
const selectedEmployeeId = ref<string | null>(null)

const yearOptions = computed(() => {
  const years = store.getAvailableYears()
  if (years.length === 0) {
    years.push(dayjs().year() - 1)
  }
  return years.map((y) => ({
    label: `${y}年`,
    value: y
  }))
})

const departmentOptions = computed(() =>
  bonusStore.departments.map((d) => ({
    label: d.name,
    value: d.id
  }))
)

const employeeOptions = computed(() =>
  bonusStore.allEmployees.map((emp) => {
    const dept = bonusStore.getDepartmentById(emp.departmentId)
    return {
      label: `${emp.name} - ${emp.position} (${dept?.name || '未知部门'})`,
      value: emp.id
    }
  })
)

const report = computed<AnnualCompensationReviewReport | null>(() => {
  if (scope.value === 'company') {
    return store.buildAnnualReviewReport(selectedYear.value, 'company')
  } else if (scope.value === 'department' && selectedDepartmentId.value) {
    return store.buildAnnualReviewReport(selectedYear.value, 'department', selectedDepartmentId.value)
  } else if (scope.value === 'employee' && selectedEmployeeId.value) {
    return store.buildAnnualReviewReport(selectedYear.value, 'employee', selectedEmployeeId.value)
  }
  return null
})

const adjustmentByCategory = computed<Partial<Record<AdjustmentReasonCategory, number>>>(
  () => report.value?.salaryAdjustmentByCategory || {}
)

const performanceDistribution = computed<Record<string, number>>(() => {
  if (report.value?.companySummary) {
    return report.value.companySummary.performanceDistribution as Record<string, number> || {}
  }
  if (report.value?.departments && report.value.departments.length > 0) {
    return report.value.departments[0].performanceDistribution as Record<string, number> || {}
  }
  return {}
})

const adjustedAdjustmentByCategory = computed(() => {
  if (!report.value?.salaryAdjustmentByCategory) return {}
  const category = report.value.salaryAdjustmentByCategory
  const filtered: Record<string, number> = {}
  Object.keys(category).forEach((key) => {
    const value = category[key as AdjustmentReasonCategory]
    if (value !== undefined && value > 0) {
      filtered[key] = value
    }
  })
  return filtered
})

const categoryList = computed(() => {
  const values = Object.values(adjustmentByCategory.value) as number[]
  const total = values.reduce((s: number, v: number) => s + v, 0)
  return Object.entries(adjustmentByCategory.value)
    .map(([category, amount]) => ({
      category: category as AdjustmentReasonCategory,
      amount: amount as number,
      percent: total > 0 ? ((amount as number) / total) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount)
})

const performanceList = computed(() => {
  const values = Object.values(performanceDistribution.value) as number[]
  const total = values.reduce((s: number, v: number) => s + v, 0)
  const levelOrder = ['S', 'A+', 'A', 'B+', 'B', 'C']
  return Object.entries(performanceDistribution.value)
    .map(([level, count]) => ({
      level,
      count: count as number,
      percent: total > 0 ? ((count as number) / total) * 100 : 0
    }))
    .sort((a, b) => levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level))
})

const departmentColumns: DataTableColumns<any> = [
  { title: '部门', key: 'departmentName', width: 140 },
  { title: '人数', key: 'headcount', width: 80, align: 'center' },
  {
    title: '平均月薪',
    key: 'averageSalary',
    width: 120,
    align: 'right',
    render: (row: any) => h('span', {}, formatMoney(row.averageSalary))
  },
  {
    title: '平均奖金',
    key: 'averageBonus',
    width: 120,
    align: 'right',
    render: (row: any) => h('span', {}, formatMoney(row.averageBonus))
  },
  {
    title: '薪酬总包',
    key: 'totalCompensation',
    width: 140,
    align: 'right',
    render: (row: any) => h('span', { style: 'font-weight: 600' }, formatMoney(row.totalCompensation))
  },
  {
    title: '薪资增长率',
    key: 'salaryGrowthRate',
    width: 110,
    align: 'right',
    render: (row: any) => h('span', {
      style: `color: ${row.salaryGrowthRate >= 0 ? '#52c41a' : '#f5222d'}`
    }, `${row.salaryGrowthRate >= 0 ? '+' : ''}${(row.salaryGrowthRate * 100).toFixed(2)}%`)
  }
]

const employeeColumns: DataTableColumns<EmployeeAnnualReview> = [
  { title: '姓名', key: 'employeeName', width: 100 },
  { title: '部门', key: 'departmentName', width: 120 },
  { title: '职位', key: 'position', width: 120 },
  {
    title: '年末月薪',
    key: 'endSalary',
    width: 120,
    align: 'right'
  },
  {
    title: '薪资增长率',
    key: 'salaryGrowthRate',
    width: 110,
    align: 'right'
  },
  {
    title: '年度奖金',
    key: 'bonus',
    width: 130,
    align: 'right'
  },
  {
    title: '年度总包',
    key: 'compensation',
    width: 140,
    align: 'right'
  },
  {
    title: '最高绩效',
    key: 'performance',
    width: 100,
    align: 'center'
  }
]

function formatMoney(n: number): string {
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getCategoryColor(category: AdjustmentReasonCategory): string {
  const colors: Record<AdjustmentReasonCategory, string> = {
    annual: '#1890ff',
    performance: '#52c41a',
    promotion: '#722ed1',
    market: '#13c2c2',
    certification: '#fa8c16',
    transfer: '#eb2f96',
    special: '#f5222d'
  }
  return colors[category] || '#8c8c8c'
}

function getCategoryColorType(category: AdjustmentReasonCategory): 'success' | 'error' | 'warning' | 'info' | 'primary' | 'default' {
  const types: Record<AdjustmentReasonCategory, 'success' | 'error' | 'warning' | 'info' | 'primary' | 'default'> = {
    annual: 'primary',
    performance: 'success',
    promotion: 'warning',
    market: 'info',
    certification: 'warning',
    transfer: 'error',
    special: 'error'
  }
  return types[category] || 'default'
}

function getPerformanceLevelColorType(level: string): 'success' | 'error' | 'warning' | 'info' | 'primary' | 'default' {
  const types: Record<string, 'success' | 'error' | 'warning' | 'info' | 'primary' | 'default'> = {
    S: 'success',
    'A+': 'success',
    A: 'primary',
    'B+': 'info',
    B: 'info',
    C: 'error'
  }
  return types[level] || 'default'
}

function handleYearChange() {}

async function handleExportPdf() {
  if (!report.value) {
    message.warning('报告尚未生成')
    return
  }

  const jsPDF = await import('jspdf').then(m => m.default)
  await import('jspdf-autotable')

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 20

  doc.setFont('sans-serif', 'bold')
  doc.setFontSize(18)
  doc.setTextColor('#1f2329')
  doc.text(`${selectedYear.value}年度薪酬包复盘报告`, pageWidth / 2, y, { align: 'center' })
  y += 10

  doc.setFont('sans-serif', 'normal')
  doc.setFontSize(10)
  doc.setTextColor('#8c8c8c')
  doc.text(`统计范围：${report.value.scope === 'company' ? '全公司' : report.value.scopeName || '未知'}`, pageWidth / 2, y, { align: 'center' })
  y += 5
  doc.text(`生成时间：${dayjs().format('YYYY年MM月DD日 HH:mm:ss')}`, pageWidth / 2, y, { align: 'center' })
  y += 15

  if (report.value.companySummary) {
    doc.setFont('sans-serif', 'bold')
    doc.setFontSize(12)
    doc.setTextColor('#262626')
    doc.text('一、薪酬总览', 15, y)
    y += 10

    const summary = report.value.companySummary
    const summaryData = [
      ['员工总数', `${summary.totalHeadcount} 人`],
      ['年度薪资总额', formatMoney(summary.totalAnnualSalary)],
      ['年度奖金总额', formatMoney(summary.totalBonusGross)],
      ['年度薪酬总包', formatMoney(summary.totalCompensation)],
      ['平均月薪', formatMoney(summary.averageSalary)],
      ['平均奖金', formatMoney(summary.averageBonus)],
      ['整体薪资增长率', `+${(summary.overallSalaryGrowth * 100).toFixed(2)}%`]
    ]

    ;(doc as any).autoTable({
      startY: y,
      head: [['指标', '数值']],
      body: summaryData,
      theme: 'striped',
      headStyles: {
        fillColor: '#f0f5ff',
        textColor: '#595959',
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10,
        textColor: '#262626'
      },
      columnStyles: {
        0: { width: 70 },
        1: { width: 100 }
      },
      margin: { left: 15, right: 15 },
      didDrawCell: (data: any) => {
        if (data.row.index === 3) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.textColor = '#fa8c16'
        }
      }
    })

    y = (doc as any).lastAutoTable.finalY + 10
  }

  if (report.value.salaryAdjustmentByCategory) {
    const adjData: any[] = Object.entries(report.value.salaryAdjustmentByCategory)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => [store.getCategoryLabel(k as AdjustmentReasonCategory), formatMoney(v)])

    if (adjData.length > 0) {
      doc.setFont('sans-serif', 'bold')
      doc.setFontSize(12)
      doc.setTextColor('#262626')
      doc.text('二、调薪事由分布', 15, y)
      y += 10

      ;(doc as any).autoTable({
        startY: y,
        head: [['调薪事由', '调薪金额']],
        body: adjData,
        theme: 'striped',
        headStyles: {
          fillColor: '#f0f5ff',
          textColor: '#595959',
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 10,
          textColor: '#262626'
        },
        columnStyles: {
          0: { width: 80 },
          1: { width: 90 }
        },
        margin: { left: 15, right: 15 }
      })

      y = (doc as any).lastAutoTable.finalY + 10
    }
  }

  if (report.value.companySummary?.performanceDistribution) {
    const perfData: any[] = Object.entries(report.value.companySummary.performanceDistribution)
      .map(([level, count]) => [level, `${count} 人`])

    if (perfData.length > 0) {
      doc.setFont('sans-serif', 'bold')
      doc.setFontSize(12)
      doc.setTextColor('#262626')
      doc.text('三、绩效等级分布', 15, y)
      y += 10

      ;(doc as any).autoTable({
        startY: y,
        head: [['绩效等级', '人数']],
        body: perfData,
        theme: 'striped',
        headStyles: {
          fillColor: '#f0f5ff',
          textColor: '#595959',
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 10,
          textColor: '#262626'
        },
        columnStyles: {
          0: { width: 60 },
          1: { width: 110 }
        },
        margin: { left: 15, right: 15 }
      })

      y = (doc as any).lastAutoTable.finalY + 10
    }
  }

  if (report.value.topSalaryGrowth && report.value.topSalaryGrowth.length > 0) {
    doc.setFont('sans-serif', 'bold')
    doc.setFontSize(12)
    doc.setTextColor('#262626')
    doc.text('四、薪资增长 TOP5', 15, y)
    y += 10

    const topGrowthData: any[] = report.value.topSalaryGrowth.map((emp) => [
      emp.employeeName,
      emp.departmentName || '-',
      `+${(emp.salaryGrowthRate * 100).toFixed(2)}%`
    ])

    ;(doc as any).autoTable({
      startY: y,
      head: [['姓名', '部门', '增长率']],
      body: topGrowthData,
      theme: 'striped',
      headStyles: {
        fillColor: '#f0f5ff',
        textColor: '#595959',
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: '#262626'
      },
      columnStyles: {
        0: { width: 50 },
        1: { width: 70 },
        2: { width: 50 }
      },
      margin: { left: 15, right: 15 },
      didDrawCell: (data: any) => {
        if (data.column.index === 2) {
          data.cell.styles.textColor = '#52c41a'
          data.cell.styles.fontStyle = 'bold'
        }
      }
    })

    y = (doc as any).lastAutoTable.finalY + 10
  }

  if (report.value.topBonusEarners && report.value.topBonusEarners.length > 0) {
    doc.setFont('sans-serif', 'bold')
    doc.setFontSize(12)
    doc.setTextColor('#262626')
    doc.text('五、奖金收入 TOP5', 15, y)
    y += 10

    const topBonusData: any[] = report.value.topBonusEarners.map((emp) => [
      emp.employeeName,
      emp.departmentName || '-',
      formatMoney(emp.summary.totalBonusGross)
    ])

    ;(doc as any).autoTable({
      startY: y,
      head: [['姓名', '部门', '奖金总额']],
      body: topBonusData,
      theme: 'striped',
      headStyles: {
        fillColor: '#f0f5ff',
        textColor: '#595959',
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: '#262626'
      },
      columnStyles: {
        0: { width: 50 },
        1: { width: 70 },
        2: { width: 50 }
      },
      margin: { left: 15, right: 15 },
      didDrawCell: (data: any) => {
        if (data.column.index === 2) {
          data.cell.styles.textColor = '#52c41a'
          data.cell.styles.fontStyle = 'bold'
        }
      }
    })

    y = (doc as any).lastAutoTable.finalY + 10
  }

  if (report.value.employees && report.value.employees.length > 0) {
    doc.setFont('sans-serif', 'bold')
    doc.setFontSize(12)
    doc.setTextColor('#262626')
    doc.text('六、员工薪酬明细', 15, y)
    y += 10

    const empData: any[] = report.value.employees.map((emp) => [
      emp.employeeName,
      emp.departmentName || '-',
      emp.position || '-',
      formatMoney(emp.endSalary || 0),
      `${(emp.salaryGrowthRate >= 0 ? '+' : '')}${(emp.salaryGrowthRate * 100).toFixed(2)}%`,
      formatMoney(emp.summary?.totalBonusGross || 0),
      formatMoney(emp.summary?.totalCompensationGross || 0),
      emp.summary?.highestPerformanceLevel || '-'
    ])

    ;(doc as any).autoTable({
      startY: y,
      head: ['姓名', '部门', '职位', '年末月薪', '增长率', '年度奖金', '年度总包', '最高绩效'],
      body: empData,
      theme: 'striped',
      headStyles: {
        fillColor: '#f0f5ff',
        textColor: '#595959',
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: '#262626'
      },
      columnStyles: {
        0: { width: 30 },
        1: { width: 35 },
        2: { width: 35 },
        3: { width: 35 },
        4: { width: 35 },
        5: { width: 35 },
        6: { width: 40 },
        7: { width: 30 }
      },
      margin: { left: 10, right: 10 },
      didDrawCell: (data: any) => {
        if (data.column.index === 4) {
          data.cell.styles.textColor = data.cell.raw.startsWith('+') ? '#52c41a' : '#f5222d'
        }
        if (data.column.index === 5) {
          data.cell.styles.textColor = '#52c41a'
        }
        if (data.column.index === 6) {
          data.cell.styles.textColor = '#fa8c16'
          data.cell.styles.fontStyle = 'bold'
        }
      }
    })
  }

  doc.save(`${selectedYear.value}年度薪酬包复盘报告_${dayjs().format('YYYYMMDD')}.pdf`)
  message.success('PDF报告已导出')
}

function handleExportJson() {
  if (!report.value) {
    message.warning('报告尚未生成')
    return
  }

  const json = JSON.stringify(report.value, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${selectedYear.value}年度薪酬包复盘报告_${dayjs().format('YYYYMMDD')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  message.success('报告数据已导出')
}

watch([scope, selectedDepartmentId, selectedEmployeeId], () => {})
</script>

<style scoped>
.stat-card {
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%);
}
.stat-card.sc-headcount {
  background: linear-gradient(135deg, #f6f8fa 0%, #e8e8e8 100%);
}
.stat-card.sc-salary {
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
}
.stat-card.sc-bonus {
  background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
}
.stat-card.sc-total {
  background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
}
.stat-card.sc-avg-salary {
  background: linear-gradient(135deg, #e6fffb 0%, #b5f5ec 100%);
}
.stat-card.sc-avg-bonus {
  background: linear-gradient(135deg, #fff0f6 0%, #ffadd2 100%);
}
.stat-card.sc-growth {
  background: linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%);
}
.stat-card.sc-perf {
  background: linear-gradient(135deg, #fffbe6 0%, #ffe58f 100%);
}
.stat-label {
  font-size: 13px;
  color: #595959;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #262626;
}

.category-bar-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bar-container {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #fafafa;
  border-radius: 8px;
}

.rank-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  background: #bfbfbf;
  flex-shrink: 0;
}

.rank-badge.rank-1 {
  background: linear-gradient(135deg, #ffd700 0%, #ffb800 100%);
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
}

.rank-badge.rank-2 {
  background: linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%);
}

.rank-badge.rank-3 {
  background: linear-gradient(135deg, #cd7f32 0%, #b87333 100%);
}

.rank-badge.rank-4,
.rank-badge.rank-5 {
  background: #8c8c8c;
}
</style>