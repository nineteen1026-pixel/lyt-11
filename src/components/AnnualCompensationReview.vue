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
          :scroll-x="1400"
          :expanded-row-keys="expandedRowKeys"
          @update:expanded-row-keys="handleExpandedRowChange"
          expand-trigger="row"
          :pagination="{ pageSize: 10, showSizePicker: true, pageSizes: [10, 20, 50, 100] }"
        >
          <template #expanded-row="{ row }">
            <div class="expanded-row-content" v-if="row.competitiveness">
              <n-grid :cols="2" :x-gap="20">
                <n-gi :span="1.3">
                  <n-space vertical :size="8" style="width: 100%">
                    <n-text strong style="font-size: 13px">市场薪酬分位对标</n-text>
                    <div class="exp-percentile-chart">
                      <div class="exp-percentile-bar">
                        <div
                          v-for="(p, i) in percentileKeys"
                          :key="p"
                          class="exp-percentile-segment"
                          :style="{
                            width: getPercentileSegmentWidth(p) + '%',
                            background: percentileColors[i]
                          }"
                        >
                          <div class="exp-percentile-label">{{ p.toUpperCase() }}</div>
                          <div class="exp-percentile-value">{{ formatMoney(row.competitiveness.benchmarkData.baseSalary[p]) }}</div>
                        </div>
                      </div>
                      <div
                        class="exp-current-marker"
                        :style="{ left: getPercentilePosition(row.competitiveness.baseSalaryPercentile) + '%' }"
                      >
                        <div class="exp-marker-arrow"></div>
                        <div class="exp-marker-label">
                          当前 {{ formatMoney(row.competitiveness.baseSalary) }} · P{{ row.competitiveness.baseSalaryPercentile }}
                        </div>
                      </div>
                    </div>
                    <div class="exp-percentile-chart">
                      <div class="exp-percentile-bar">
                        <div
                          v-for="(p, i) in percentileKeys"
                          :key="p"
                          class="exp-percentile-segment"
                          :style="{
                            width: getPercentileSegmentWidth(p) + '%',
                            background: percentileColors[i]
                          }"
                        >
                          <div class="exp-percentile-label">{{ p.toUpperCase() }}</div>
                          <div class="exp-percentile-value" style="font-size: 9px">
                            {{ formatMoney(row.competitiveness.benchmarkData.totalCompensation[p]) }}
                          </div>
                        </div>
                      </div>
                      <div
                        class="exp-current-marker"
                        :style="{ left: getPercentilePosition(row.competitiveness.totalCompensationPercentile) + '%' }"
                      >
                        <div class="exp-marker-arrow"></div>
                        <div class="exp-marker-label" style="font-size: 10px">
                          总包 {{ formatMoney(row.competitiveness.totalCompensation) }} · P{{ row.competitiveness.totalCompensationPercentile }}
                        </div>
                      </div>
                    </div>
                  </n-space>
                </n-gi>
                <n-gi :span="0.7">
                  <n-space vertical :size="10" style="width: 100%">
                    <n-text strong style="font-size: 13px">竞争力评估</n-text>
                    <n-space :size="8" style="width: 100%">
                      <n-tag :type="getCompetitivenessColorType(row.competitiveness.competitivenessLevel)" size="small" bordered>
                        {{ getCompetitivenessLabel(row.competitiveness.competitivenessLevel) }}市场水平
                      </n-tag>
                      <n-tag
                        :type="row.competitiveness.riskLevel === 'high' ? 'error' : row.competitiveness.riskLevel === 'medium' ? 'warning' : 'success'"
                        size="small"
                        bordered
                      >
                        流失风险{{ row.competitiveness.retentionRisk }}
                      </n-tag>
                    </n-space>
                    <n-space vertical :size="4">
                      <n-text depth="3" style="font-size: 12px">
                        vs市场P50：
                        <span :style="{ color: row.competitiveness.gapAnalysis.currentGapAmount > 0 ? '#f5222d' : '#52c41a', fontWeight: 600 }">
                          {{ row.competitiveness.gapAnalysis.currentGapAmount > 0 ? '低于' : '高于' }}
                          {{ (Math.abs(row.competitiveness.gapAnalysis.currentGapPercent) * 100).toFixed(1) }}%
                          （{{ formatMoney(Math.abs(row.competitiveness.gapAnalysis.currentGapAmount)) }}
                        </span>
                      </n-text>
                    </n-space>
                    <n-divider style="margin: 4px 0" />
                    <n-text strong style="font-size: 13px">核心建议</n-text>
                    <n-space vertical :size="6" style="width: 100%">
                      <div
                        v-for="(rec, idx) in row.competitiveness.recommendations.slice(0, 2)"
                        :key="idx"
                        class="exp-rec-item"
                      >
                        <div class="exp-rec-num">{{ idx + 1 }}</div>
                        <div class="exp-rec-text">{{ rec }}</div>
                      </div>
                    </n-space>
                  </n-space>
                </n-gi>
              </n-grid>
            </div>
            <div v-else class="expanded-row-empty">
              <n-text depth="3" style="font-size: 12px">暂无市场对标数据</n-text>
            </div>
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
import { loadChineseFont, getFontName } from '@/utils/chineseFont'

const store = useSalaryAdjustmentStore()
const bonusStore = useBonusStore()
const message = useMessage()

const expandedRowKeys = ref<string[]>([])

function handleExpandedRowChange(keys: string[]) {
  expandedRowKeys.value = keys
}

type PercentileKey = 'p10' | 'p25' | 'p50' | 'p75' | 'p90'
const percentileKeys: PercentileKey[] = ['p10', 'p25', 'p50', 'p75', 'p90']
const percentileColors = [
  'linear-gradient(135deg, #ffccc7 0%, #ffa39e 100%)',
  'linear-gradient(135deg, #ffd591 0%, #ffc069 100%)',
  'linear-gradient(135deg, #91d5ff 0%, #69c0ff 100%)',
  'linear-gradient(135deg, #95de64 0%, #73d13d 100%)',
  'linear-gradient(135deg, #b37feb 0%, #9254de 100%)'
]

function getPercentileSegmentWidth(key: string): number {
  const widths: Record<string, number> = { p10: 15, p25: 15, p50: 25, p75: 25, p90: 20 }
  return widths[key] || 20
}

function getPercentilePosition(percentile: number): number {
  return Math.max(2, Math.min(98, percentile))
}

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

function getCompetitivenessColorType(level: string): 'success' | 'error' | 'warning' | 'info' | 'primary' | 'default' {
  const types: Record<string, 'success' | 'error' | 'warning' | 'info' | 'primary' | 'default'> = {
    far_below: 'error',
    below: 'warning',
    at_market: 'info',
    above: 'success',
    far_above: 'success'
  }
  return types[level] || 'default'
}

function getCompetitivenessLabel(level: string): string {
  const labels: Record<string, string> = {
    far_below: '远低于',
    below: '低于',
    at_market: '符合',
    above: '高于',
    far_above: '远高于'
  }
  return labels[level] || level
}

const employeeColumns: DataTableColumns<EmployeeAnnualReview> = [
  {
    type: 'expand',
    renderExpand: () => null
  },
  { title: '姓名', key: 'employeeName', width: 80, fixed: 'left' },
  { title: '部门', key: 'departmentName', width: 100 },
  { title: '职位', key: 'position', width: 100 },
  {
    title: '年末月薪',
    key: 'endSalary',
    width: 110,
    align: 'right',
    render: (row: EmployeeAnnualReview) => formatMoney(row.endSalary || 0)
  },
  {
    title: '薪资增长率',
    key: 'salaryGrowthRate',
    width: 100,
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
    width: 110,
    align: 'right',
    render: (row: EmployeeAnnualReview) => h('span', {
      style: 'color: #52c41a; font-weight: 600'
    }, formatMoney(row.summary?.totalBonusGross || 0))
  },
  {
    title: '年度总包',
    key: 'compensation',
    width: 120,
    align: 'right',
    render: (row: EmployeeAnnualReview) => h('span', {
      style: 'color: #fa8c16; font-weight: 700'
    }, formatMoney(row.summary?.totalCompensationGross || 0))
  },
  {
    title: '最高绩效',
    key: 'performance',
    width: 80,
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
  },
  {
    title: '市场分位',
    key: 'marketPercentile',
    width: 90,
    align: 'center',
    render: (row: EmployeeAnnualReview) => {
      if (!row.competitiveness) return h('span', { style: 'color: #8c8c8c' }, '-')
      const p = row.competitiveness.baseSalaryPercentile
      const color = p < 25 ? '#f5222d' : p < 50 ? '#fa8c16' : p < 75 ? '#1890ff' : '#52c41a'
      return h('span', { style: `color: ${color}; font-weight: 700` }, `P${p}`)
    }
  },
  {
    title: '竞争力',
    key: 'competitivenessLevel',
    width: 80,
    align: 'center',
    render: (row: EmployeeAnnualReview) => {
      if (!row.competitiveness) return h('span', { style: 'color: #8c8c8c' }, '-')
      return h(NTag, {
        type: getCompetitivenessColorType(row.competitiveness.competitivenessLevel),
        size: 'small',
        bordered: true
      }, { default: () => getCompetitivenessLabel(row.competitiveness!.competitivenessLevel) })
    }
  },
  {
    title: '流失风险',
    key: 'riskLevel',
    width: 80,
    align: 'center',
    render: (row: EmployeeAnnualReview) => {
      if (!row.competitiveness) return h('span', { style: 'color: #8c8c8c' }, '-')
      const risk = row.competitiveness.riskLevel
      const riskColor: Record<string, string> = { high: '#f5222d', medium: '#fa8c16', low: '#52c41a' }
      const riskLabel: Record<string, string> = { high: '高', medium: '中', low: '低' }
      return h('span', { style: `color: ${riskColor[risk] || '#8c8c8c'}; font-weight: 600` }, riskLabel[risk] || risk)
    }
  },
  {
    title: '调薪建议',
    key: 'recommendation',
    width: 200,
    render: (row: EmployeeAnnualReview) => {
      if (!row.competitiveness || row.competitiveness.recommendations.length === 0) {
        return h('span', { style: 'color: #8c8c8c; font-size: 12px' }, row.insights?.recommendation || '-')
      }
      const first = row.competitiveness.recommendations[0]
      return h('span', { style: 'font-size: 12px; line-height: 1.5' }, first.length > 30 ? first.slice(0, 30) + '…' : first)
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

  const loadingMsg = message.loading('正在加载中文字体并生成PDF报告，请稍候...', { duration: 0 })

  try {
    const jsPDF = (await import('jspdf')).default
    await import('jspdf-autotable')

    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const fontName = getFontName()

    // 加载中文字体
    await loadChineseFont(doc)

    let y = 20

    // 标题
    doc.setFontSize(18)
    doc.setTextColor('#1f2329')
    doc.text(`${selectedYear.value}年度薪酬包复盘报告`, pageWidth / 2, y, { align: 'center' })
    y += 8

    // 副标题
    doc.setFontSize(10)
    doc.setTextColor('#8c8c8c')
    const scopeText = report.value.scope === 'company' ? '全公司' : report.value.scopeName || '未知'
    doc.text(`统计范围：${scopeText}`, pageWidth / 2, y, { align: 'center' })
    y += 5
    doc.text(`生成时间：${dayjs().format('YYYY年MM月DD日 HH:mm:ss')}`, pageWidth / 2, y, { align: 'center' })
    y += 12

    // 一、薪酬总览
    if (report.value.companySummary) {
      doc.setFontSize(12)
      doc.setTextColor('#262626')
      doc.text('一、薪酬总览', 15, y)
      y += 8

      const summary = report.value.companySummary
      const summaryData: any[][] = [
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
          font: fontName,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 10,
          font: fontName,
          textColor: '#262626'
        },
        columnStyles: {
          0: { width: 70 },
          1: { width: 100 }
        },
        margin: { left: 15, right: 15 }
      })

      y = (doc as any).lastAutoTable.finalY + 10
    }

    // 二、调薪事由分布
    if (report.value.salaryAdjustmentByCategory) {
      const adjData: any[][] = Object.entries(report.value.salaryAdjustmentByCategory)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => [store.getCategoryLabel(k as AdjustmentReasonCategory), formatMoney(v)])

      if (adjData.length > 0) {
        doc.setFontSize(12)
        doc.setTextColor('#262626')
        doc.text('二、调薪事由分布', 15, y)
        y += 8

        ;(doc as any).autoTable({
          startY: y,
          head: [['调薪事由', '调薪金额']],
          body: adjData,
          theme: 'striped',
          headStyles: {
            fillColor: '#f0f5ff',
            textColor: '#595959',
            fontSize: 10,
            font: fontName,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 10,
            font: fontName,
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

    // 三、绩效等级分布
    if (report.value.companySummary?.performanceDistribution) {
      const perfData: any[][] = Object.entries(report.value.companySummary.performanceDistribution)
        .map(([level, count]) => [level, `${count} 人`])

      if (perfData.length > 0) {
        doc.setFontSize(12)
        doc.setTextColor('#262626')
        doc.text('三、绩效等级分布', 15, y)
        y += 8

        ;(doc as any).autoTable({
          startY: y,
          head: [['绩效等级', '人数']],
          body: perfData,
          theme: 'striped',
          headStyles: {
            fillColor: '#f0f5ff',
            textColor: '#595959',
            fontSize: 10,
            font: fontName,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 10,
            font: fontName,
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

    // 四、薪资增长 TOP5
    if (report.value.topSalaryGrowth && report.value.topSalaryGrowth.length > 0) {
      doc.setFontSize(12)
      doc.setTextColor('#262626')
      doc.text('四、薪资增长 TOP5', 15, y)
      y += 8

      const topGrowthData: any[][] = report.value.topSalaryGrowth.map((emp, i) => [
        `${i + 1}`,
        emp.employeeName,
        emp.departmentName || '-',
        `+${(emp.salaryGrowthRate * 100).toFixed(2)}%`
      ])

      ;(doc as any).autoTable({
        startY: y,
        head: [['排名', '姓名', '部门', '增长率']],
        body: topGrowthData,
        theme: 'striped',
        headStyles: {
          fillColor: '#f0f5ff',
          textColor: '#595959',
          fontSize: 10,
          font: fontName,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9,
          font: fontName,
          textColor: '#262626'
        },
        columnStyles: {
          0: { width: 20, halign: 'center' },
          1: { width: 50 },
          2: { width: 70 },
          3: { width: 40, halign: 'right' }
        },
        margin: { left: 15, right: 15 }
      })

      y = (doc as any).lastAutoTable.finalY + 10
    }

    // 五、奖金收入 TOP5
    if (report.value.topBonusEarners && report.value.topBonusEarners.length > 0) {
      doc.setFontSize(12)
      doc.setTextColor('#262626')
      doc.text('五、奖金收入 TOP5', 15, y)
      y += 8

      const topBonusData: any[][] = report.value.topBonusEarners.map((emp, i) => [
        `${i + 1}`,
        emp.employeeName,
        emp.departmentName || '-',
        formatMoney(emp.summary.totalBonusGross)
      ])

      ;(doc as any).autoTable({
        startY: y,
        head: [['排名', '姓名', '部门', '奖金总额']],
        body: topBonusData,
        theme: 'striped',
        headStyles: {
          fillColor: '#f0f5ff',
          textColor: '#595959',
          fontSize: 10,
          font: fontName,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9,
          font: fontName,
          textColor: '#262626'
        },
        columnStyles: {
          0: { width: 20, halign: 'center' },
          1: { width: 50 },
          2: { width: 70 },
          3: { width: 50, halign: 'right' }
        },
        margin: { left: 15, right: 15 }
      })

      y = (doc as any).lastAutoTable.finalY + 10
    }

    // 六、员工薪酬明细
    if (report.value.employees && report.value.employees.length > 0) {
      doc.setFontSize(12)
      doc.setTextColor('#262626')
      doc.text('六、员工薪酬明细', 15, y)
      y += 8

      const empData: any[][] = report.value.employees.map((emp) => [
        emp.employeeName,
        emp.departmentName || '-',
        emp.position || '-',
        formatMoney(emp.endSalary || 0),
        `${(emp.salaryGrowthRate || 0) >= 0 ? '+' : ''}${((emp.salaryGrowthRate || 0) * 100).toFixed(2)}%`,
        formatMoney(emp.summary?.totalBonusGross || 0),
        formatMoney(emp.summary?.totalCompensationGross || 0),
        emp.summary?.highestPerformanceLevel || '-',
        emp.competitiveness ? `P${emp.competitiveness.baseSalaryPercentile}` : '-',
        emp.competitiveness ? getCompetitivenessLabel(emp.competitiveness.competitivenessLevel) : '-',
        emp.competitiveness ? (emp.competitiveness.riskLevel === 'high' ? '高' : emp.competitiveness.riskLevel === 'medium' ? '中' : '低') : '-'
      ])

      ;(doc as any).autoTable({
        startY: y,
        head: [['姓名', '部门', '职位', '年末月薪', '增长率', '年度奖金', '年度总包', '绩效', '市场分位', '竞争力', '流失风险']],
        body: empData,
        theme: 'striped',
        headStyles: {
          fillColor: '#f0f5ff',
          textColor: '#595959',
          fontSize: 7,
          font: fontName,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 6,
          font: fontName,
          textColor: '#262626'
        },
        columnStyles: {
          0: { width: 20 },
          1: { width: 25 },
          2: { width: 25 },
          3: { width: 30, halign: 'right' },
          4: { width: 20, halign: 'right' },
          5: { width: 30, halign: 'right' },
          6: { width: 30, halign: 'right' },
          7: { width: 15, halign: 'center' },
          8: { width: 18, halign: 'center' },
          9: { width: 18, halign: 'center' },
          10: { width: 18, halign: 'center' }
        },
        margin: { left: 10, right: 10 },
        styles: {
          cellPadding: 1.5
        }
      })

      y = (doc as any).lastAutoTable.finalY + 10
    }

    // 七、市场对标与竞争力分析
    const employeesWithComp = (report.value.employees || []).filter((e) => e.competitiveness)
    if (employeesWithComp.length > 0) {
      doc.setFontSize(12)
      doc.setTextColor('#262626')
      doc.text('七、市场对标与竞争力分析', 15, y)
      y += 8

      const compData: any[][] = employeesWithComp.map((emp) => {
        const c = emp.competitiveness!
        const riskLabel = c.riskLevel === 'high' ? '高' : c.riskLevel === 'medium' ? '中' : '低'
        const gapDir = c.gapAnalysis.currentGapAmount > 0 ? '低于' : '高于'
        const gapStr = `${gapDir}市场P50 ${Math.abs(c.gapAnalysis.currentGapPercent * 100).toFixed(1)}%`
        const topRec = c.recommendations.length > 0 ? c.recommendations[0] : '-'
        return [
          emp.employeeName,
          `P${c.baseSalaryPercentile}`,
          getCompetitivenessLabel(c.competitivenessLevel),
          gapStr,
          riskLabel,
          topRec.length > 35 ? topRec.slice(0, 35) + '…' : topRec
        ]
      })

      ;(doc as any).autoTable({
        startY: y,
        head: [['姓名', '市场分位', '竞争力', 'vs市场P50', '流失风险', '核心建议']],
        body: compData,
        theme: 'striped',
        headStyles: {
          fillColor: '#e6f7ff',
          textColor: '#595959',
          fontSize: 8,
          font: fontName,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 7,
          font: fontName,
          textColor: '#262626'
        },
        columnStyles: {
          0: { width: 25 },
          1: { width: 20, halign: 'center' },
          2: { width: 22, halign: 'center' },
          3: { width: 30, halign: 'center' },
          4: { width: 22, halign: 'center' },
          5: { width: 95 }
        },
        margin: { left: 10, right: 10 },
        styles: {
          cellPadding: 2
        }
      })

      y = (doc as any).lastAutoTable.finalY + 10

      // 调薪建议明细
      const employeesWithRecs = employeesWithComp.filter((e) => e.competitiveness!.recommendations.length > 0)
      if (employeesWithRecs.length > 0) {
        doc.setFontSize(11)
        doc.setTextColor('#262626')
        doc.text('调薪建议明细', 15, y)
        y += 7

        for (const emp of employeesWithRecs) {
          if (y > 265) {
            doc.addPage()
            y = 20
          }
          doc.setFontSize(9)
          doc.setTextColor('#262626')
          doc.text(`${emp.employeeName}（${getCompetitivenessLabel(emp.competitiveness!.competitivenessLevel)}，P${emp.competitiveness!.baseSalaryPercentile}）`, 18, y)
          y += 5
          doc.setFontSize(7)
          doc.setTextColor('#595959')
          for (const rec of emp.competitiveness!.recommendations) {
            if (y > 270) {
              doc.addPage()
              y = 20
            }
            const lines = doc.splitTextToSize(`• ${rec}`, 165)
            doc.text(lines, 22, y)
            y += lines.length * 3.5
          }
          y += 3
        }
      }
    }

    doc.save(`${selectedYear.value}年度薪酬包复盘报告_${dayjs().format('YYYYMMDD')}.pdf`)
    message.success('PDF报告已导出')
  } catch (error) {
    console.error('PDF导出失败:', error)
    message.error('PDF导出失败，请重试')
  } finally {
    loadingMsg.destroy()
  }
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

.expanded-row-content {
  padding: 16px 20px;
  background: #fafbfc;
  border-radius: 8px;
  margin: 4px 0;
}

.expanded-row-empty {
  padding: 16px 20px;
  text-align: center;
  background: #fafbfc;
  border-radius: 8px;
  margin: 4px 0;
}

.exp-percentile-chart {
  position: relative;
  padding: 36px 0 24px;
}

.exp-percentile-bar {
  display: flex;
  height: 32px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.exp-percentile-segment {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 10px;
  position: relative;
}

.exp-percentile-label {
  font-weight: 700;
  font-size: 10px;
}

.exp-percentile-value {
  font-size: 8px;
  opacity: 0.9;
}

.exp-current-marker {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  z-index: 10;
}

.exp-marker-arrow {
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 10px solid #1f1f1f;
  margin: 0 auto;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
}

.exp-marker-label {
  background: #1f1f1f;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  text-align: center;
  margin-top: 2px;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  line-height: 1.4;
}

.exp-rec-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 8px 10px;
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%);
  border-radius: 6px;
  border-left: 3px solid #1890ff;
}

.exp-rec-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #1890ff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.exp-rec-text {
  flex: 1;
  font-size: 12px;
  line-height: 1.5;
  color: #262626;
}
</style>