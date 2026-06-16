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
        />
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
    align: 'right',
    render: (row: EmployeeAnnualReview) => formatMoney(row.endSalary || 0)
  },
  {
    title: '薪资增长率',
    key: 'salaryGrowthRate',
    width: 110,
    align: 'right',
    render: (row: EmployeeAnnualReview) => {
      const rate = row.salaryGrowthRate || 0
      return h('span', {
        style: `color: ${rate >= 0 ? '#52c41a' : '#f5222d'}; font-weight: 600`
      }, `${rate >= 0 ? '+' : ''}${(rate * 100).toFixed(2)}%`)
    }
  },
  {
    title: '年度奖金',
    key: 'bonus',
    width: 130,
    align: 'right',
    render: (row: EmployeeAnnualReview) => h('span', {
      style: 'color: #52c41a; font-weight: 600'
    }, formatMoney(row.summary?.totalBonusGross || 0))
  },
  {
    title: '年度总包',
    key: 'compensation',
    width: 140,
    align: 'right',
    render: (row: EmployeeAnnualReview) => h('span', {
      style: 'color: #fa8c16; font-weight: 700'
    }, formatMoney(row.summary?.totalCompensationGross || 0))
  },
  {
    title: '最高绩效',
    key: 'performance',
    width: 100,
    align: 'center',
    render: (row: EmployeeAnnualReview) => {
      const level = row.summary?.highestPerformanceLevel || '-'
      if (level === '-' || !level) {
        return h('span', { style: 'color: #8c8c8c' }, '-')
      }
      return h(NTag, {
        type: getPerformanceLevelColorType(level),
        size: 'small',
        bordered: true
      }, { default: () => level })
    }
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

  message.loading('正在生成PDF报告，请稍候...')

  const jsPDF = (await import('jspdf')).default
  const html2canvas = (await import('html2canvas')).default

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2

  let y = margin

  const renderSection = async (content: string): Promise<void> => {
    const container = document.createElement('div')
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: ${contentWidth * 3.78}px;
      font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
      background: white;
      padding: 20px;
    `
    container.innerHTML = content
    document.body.appendChild(container)

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = contentWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      if (y + imgHeight > pageHeight - margin) {
        doc.addPage()
        y = margin
      }

      doc.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight)
      y += imgHeight + 5
    } finally {
      document.body.removeChild(container)
    }
  }

  const summary = report.value.companySummary
  if (summary) {
    await renderSection(`
      <div style="font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center;">
        ${selectedYear.value}年度薪酬包复盘报告
      </div>
      <div style="font-size: 14px; color: #666; margin-bottom: 20px; text-align: center;">
        统计范围：${report.value.scope === 'company' ? '全公司' : report.value.scopeName || '未知'} |
        生成时间：${dayjs().format('YYYY年MM月DD日 HH:mm:ss')}
      </div>
      <div style="font-size: 18px; font-weight: bold; margin: 20px 0 15px 0; border-bottom: 2px solid #1890ff; padding-bottom: 8px;">
        一、薪酬总览
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="background: #f0f5ff;">
          <th style="border: 1px solid #e8e8e8; padding: 10px; text-align: left;">指标</th>
          <th style="border: 1px solid #e8e8e8; padding: 10px; text-align: right;">数值</th>
        </tr>
        <tr><td style="border: 1px solid #e8e8e8; padding: 10px;">员工总数</td><td style="border: 1px solid #e8e8e8; padding: 10px; text-align: right;">${summary.totalHeadcount} 人</td></tr>
        <tr style="background: #fafafa;"><td style="border: 1px solid #e8e8e8; padding: 10px;">年度薪资总额</td><td style="border: 1px solid #e8e8e8; padding: 10px; text-align: right;">${formatMoney(summary.totalAnnualSalary)}</td></tr>
        <tr><td style="border: 1px solid #e8e8e8; padding: 10px;">年度奖金总额</td><td style="border: 1px solid #e8e8e8; padding: 10px; text-align: right;">${formatMoney(summary.totalBonusGross)}</td></tr>
        <tr style="background: #fff7e6;"><td style="border: 1px solid #e8e8e8; padding: 10px; font-weight: bold;">年度薪酬总包</td><td style="border: 1px solid #e8e8e8; padding: 10px; text-align: right; font-weight: bold; color: #fa8c16;">${formatMoney(summary.totalCompensation)}</td></tr>
        <tr><td style="border: 1px solid #e8e8e8; padding: 10px;">平均月薪</td><td style="border: 1px solid #e8e8e8; padding: 10px; text-align: right;">${formatMoney(summary.averageSalary)}</td></tr>
        <tr style="background: #fafafa;"><td style="border: 1px solid #e8e8e8; padding: 10px;">平均奖金</td><td style="border: 1px solid #e8e8e8; padding: 10px; text-align: right;">${formatMoney(summary.averageBonus)}</td></tr>
        <tr><td style="border: 1px solid #e8e8e8; padding: 10px;">整体薪资增长率</td><td style="border: 1px solid #e8e8e8; padding: 10px; text-align: right; color: #52c41a; font-weight: bold;">+${(summary.overallSalaryGrowth * 100).toFixed(2)}%</td></tr>
      </table>
    `)
  }

  if (report.value.salaryAdjustmentByCategory) {
    const adjItems = Object.entries(report.value.salaryAdjustmentByCategory)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `<tr><td style="border: 1px solid #e8e8e8; padding: 10px;">${store.getCategoryLabel(k as AdjustmentReasonCategory)}</td><td style="border: 1px solid #e8e8e8; padding: 10px; text-align: right;">${formatMoney(v)}</td></tr>`)
      .join('')

    if (adjItems) {
      await renderSection(`
        <div style="font-size: 18px; font-weight: bold; margin: 20px 0 15px 0; border-bottom: 2px solid #1890ff; padding-bottom: 8px;">
          二、调薪事由分布
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="background: #f0f5ff;">
            <th style="border: 1px solid #e8e8e8; padding: 10px; text-align: left;">调薪事由</th>
            <th style="border: 1px solid #e8e8e8; padding: 10px; text-align: right;">调薪金额</th>
          </tr>
          ${adjItems}
        </table>
      `)
    }
  }

  if (report.value.companySummary?.performanceDistribution) {
    const perfItems = Object.entries(report.value.companySummary.performanceDistribution)
      .map(([level, count]) => `<tr><td style="border: 1px solid #e8e8e8; padding: 10px; font-weight: bold;">${level}</td><td style="border: 1px solid #e8e8e8; padding: 10px; text-align: right;">${count} 人</td></tr>`)
      .join('')

    if (perfItems) {
      await renderSection(`
        <div style="font-size: 18px; font-weight: bold; margin: 20px 0 15px 0; border-bottom: 2px solid #1890ff; padding-bottom: 8px;">
          三、绩效等级分布
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="background: #f0f5ff;">
            <th style="border: 1px solid #e8e8e8; padding: 10px; text-align: left;">绩效等级</th>
            <th style="border: 1px solid #e8e8e8; padding: 10px; text-align: right;">人数</th>
          </tr>
          ${perfItems}
        </table>
      `)
    }
  }

  if (report.value.topSalaryGrowth && report.value.topSalaryGrowth.length > 0) {
    const topGrowthItems = report.value.topSalaryGrowth.map((emp, i) => `
      <tr>
        <td style="border: 1px solid #e8e8e8; padding: 10px; text-align: center; font-weight: bold; color: ${i < 3 ? '#fa8c16' : '#666'};">${i + 1}</td>
        <td style="border: 1px solid #e8e8e8; padding: 10px;">${emp.employeeName}</td>
        <td style="border: 1px solid #e8e8e8; padding: 10px;">${emp.departmentName || '-'}</td>
        <td style="border: 1px solid #e8e8e8; padding: 10px; text-align: right; color: #52c41a; font-weight: bold;">+${(emp.salaryGrowthRate * 100).toFixed(2)}%</td>
      </tr>
    `).join('')

    await renderSection(`
      <div style="font-size: 18px; font-weight: bold; margin: 20px 0 15px 0; border-bottom: 2px solid #1890ff; padding-bottom: 8px;">
        四、薪资增长 TOP5
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="background: #f0f5ff;">
          <th style="border: 1px solid #e8e8e8; padding: 10px; width: 40px;">排名</th>
          <th style="border: 1px solid #e8e8e8; padding: 10px;">姓名</th>
          <th style="border: 1px solid #e8e8e8; padding: 10px;">部门</th>
          <th style="border: 1px solid #e8e8e8; padding: 10px; text-align: right;">增长率</th>
        </tr>
        ${topGrowthItems}
      </table>
    `)
  }

  if (report.value.topBonusEarners && report.value.topBonusEarners.length > 0) {
    const topBonusItems = report.value.topBonusEarners.map((emp, i) => `
      <tr>
        <td style="border: 1px solid #e8e8e8; padding: 10px; text-align: center; font-weight: bold; color: ${i < 3 ? '#fa8c16' : '#666'};">${i + 1}</td>
        <td style="border: 1px solid #e8e8e8; padding: 10px;">${emp.employeeName}</td>
        <td style="border: 1px solid #e8e8e8; padding: 10px;">${emp.departmentName || '-'}</td>
        <td style="border: 1px solid #e8e8e8; padding: 10px; text-align: right; color: #52c41a; font-weight: bold;">${formatMoney(emp.summary.totalBonusGross)}</td>
      </tr>
    `).join('')

    await renderSection(`
      <div style="font-size: 18px; font-weight: bold; margin: 20px 0 15px 0; border-bottom: 2px solid #1890ff; padding-bottom: 8px;">
        五、奖金收入 TOP5
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="background: #f0f5ff;">
          <th style="border: 1px solid #e8e8e8; padding: 10px; width: 40px;">排名</th>
          <th style="border: 1px solid #e8e8e8; padding: 10px;">姓名</th>
          <th style="border: 1px solid #e8e8e8; padding: 10px;">部门</th>
          <th style="border: 1px solid #e8e8e8; padding: 10px; text-align: right;">奖金总额</th>
        </tr>
        ${topBonusItems}
      </table>
    `)
  }

  if (report.value.employees && report.value.employees.length > 0) {
    const empItems = report.value.employees.map((emp) => `
      <tr>
        <td style="border: 1px solid #e8e8e8; padding: 8px;">${emp.employeeName}</td>
        <td style="border: 1px solid #e8e8e8; padding: 8px;">${emp.departmentName || '-'}</td>
        <td style="border: 1px solid #e8e8e8; padding: 8px;">${emp.position || '-'}</td>
        <td style="border: 1px solid #e8e8e8; padding: 8px; text-align: right;">${formatMoney(emp.endSalary || 0)}</td>
        <td style="border: 1px solid #e8e8e8; padding: 8px; text-align: right; color: ${(emp.salaryGrowthRate || 0) >= 0 ? '#52c41a' : '#f5222d'}; font-weight: bold;">${(emp.salaryGrowthRate || 0) >= 0 ? '+' : ''}${((emp.salaryGrowthRate || 0) * 100).toFixed(2)}%</td>
        <td style="border: 1px solid #e8e8e8; padding: 8px; text-align: right; color: #52c41a; font-weight: bold;">${formatMoney(emp.summary?.totalBonusGross || 0)}</td>
        <td style="border: 1px solid #e8e8e8; padding: 8px; text-align: right; color: #fa8c16; font-weight: bold;">${formatMoney(emp.summary?.totalCompensationGross || 0)}</td>
        <td style="border: 1px solid #e8e8e8; padding: 8px; text-align: center; font-weight: bold;">${emp.summary?.highestPerformanceLevel || '-'}</td>
      </tr>
    `).join('')

    await renderSection(`
      <div style="font-size: 18px; font-weight: bold; margin: 20px 0 15px 0; border-bottom: 2px solid #1890ff; padding-bottom: 8px;">
        六、员工薪酬明细
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <tr style="background: #f0f5ff;">
          <th style="border: 1px solid #e8e8e8; padding: 8px;">姓名</th>
          <th style="border: 1px solid #e8e8e8; padding: 8px;">部门</th>
          <th style="border: 1px solid #e8e8e8; padding: 8px;">职位</th>
          <th style="border: 1px solid #e8e8e8; padding: 8px; text-align: right;">年末月薪</th>
          <th style="border: 1px solid #e8e8e8; padding: 8px; text-align: right;">增长率</th>
          <th style="border: 1px solid #e8e8e8; padding: 8px; text-align: right;">年度奖金</th>
          <th style="border: 1px solid #e8e8e8; padding: 8px; text-align: right;">年度总包</th>
          <th style="border: 1px solid #e8e8e8; padding: 8px; text-align: center;">最高绩效</th>
        </tr>
        ${empItems}
      </table>
    `)
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