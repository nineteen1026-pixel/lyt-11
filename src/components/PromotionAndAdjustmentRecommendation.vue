<template>
  <n-space vertical :size="16" style="width: 100%">
    <n-card>
      <n-space justify="space-between" align="center" style="width: 100%">
        <n-space vertical :size="4">
          <n-text strong style="font-size: 18px">晋升候选与调薪倾斜建议</n-text>
          <n-text depth="3" style="font-size: 13px">
            基于绩效历史走势自动标注晋升候选，并生成{{ selectedYear + 1 }}年度调薪倾斜方案
          </n-text>
        </n-space>
        <n-space>
          <n-button type="primary" ghost @click="handleExportJson">
            <template #icon><ExportOutlined /></template>
            导出方案
          </n-button>
        </n-space>
      </n-space>
    </n-card>

    <n-card title="筛选条件">
      <n-space :size="20" wrap align="start">
        <n-space vertical :size="6">
          <n-text depth="3" style="font-size: 12px">复盘年份</n-text>
          <n-select
            v-model:value="selectedYear"
            :options="yearOptions"
            style="width: 140px"
          />
        </n-space>
        <n-space vertical :size="6">
          <n-text depth="3" style="font-size: 12px">统计范围</n-text>
          <n-radio-group v-model:value="scope">
            <n-space>
              <n-radio value="company">全公司</n-radio>
              <n-radio value="department">按部门</n-radio>
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
      </n-space>
    </n-card>

    <template v-if="report">
      <n-grid :cols="4" :x-gap="16">
        <n-gi>
          <div class="summary-card sc-strong">
            <div class="sc-label">强烈推荐晋升</div>
            <div class="sc-value">{{ report.summary.strongCandidates }}</div>
            <div class="sc-sub">人</div>
          </div>
        </n-gi>
        <n-gi>
          <div class="summary-card sc-recommended">
            <div class="sc-label">推荐晋升</div>
            <div class="sc-value">{{ report.summary.recommendedCandidates }}</div>
            <div class="sc-sub">人</div>
          </div>
        </n-gi>
        <n-gi>
          <div class="summary-card sc-potential">
            <div class="sc-label">关注培养</div>
            <div class="sc-value">{{ report.summary.potentialCandidates }}</div>
            <div class="sc-sub">人</div>
          </div>
        </n-gi>
        <n-gi>
          <div class="summary-card sc-amount">
            <div class="sc-label">建议调薪总额(月增)</div>
            <div class="sc-value">{{ formatMoney(report.summary.totalSuggestedAmount) }}</div>
          </div>
        </n-gi>
      </n-grid>

      <n-grid :cols="5" :x-gap="12">
        <n-gi>
          <div class="cat-card cc-promotion">
            <div class="cc-label">晋升调薪</div>
            <div class="cc-value">{{ report.summary.categoryBreakdown.promotion }}</div>
          </div>
        </n-gi>
        <n-gi>
          <div class="cat-card cc-perf">
            <div class="cc-label">绩效倾斜</div>
            <div class="cc-value">{{ report.summary.categoryBreakdown.performance_tilt }}</div>
          </div>
        </n-gi>
        <n-gi>
          <div class="cat-card cc-market">
            <div class="cc-label">市场补差</div>
            <div class="cc-value">{{ report.summary.categoryBreakdown.market_catchup }}</div>
          </div>
        </n-gi>
        <n-gi>
          <div class="cat-card cc-retention">
            <div class="cc-label">保留性调薪</div>
            <div class="cc-value">{{ report.summary.categoryBreakdown.retention }}</div>
          </div>
        </n-gi>
        <n-gi>
          <div class="cat-card cc-regular">
            <div class="cc-label">常规年度调薪</div>
            <div class="cc-value">{{ report.summary.categoryBreakdown.annual_regular }}</div>
          </div>
        </n-gi>
      </n-grid>

      <n-card title="晋升候选标注">
        <template #header>
          <n-space align="center" :size="8">
            <n-text strong style="font-size: 16px">晋升候选标注</n-text>
            <n-tag size="small" type="info">基于绩效走势自动识别</n-tag>
          </n-space>
        </template>
        <template v-if="report.promotionCandidates.length > 0">
          <n-data-table
            :columns="candidateColumns"
            :data="report.promotionCandidates"
            :row-key="(row: any) => row.employeeId"
            striped
            :pagination="{ pageSize: 10, showSizePicker: true, pageSizes: [10, 20, 50] }"
          />
        </template>
        <n-empty v-else description="暂无符合条件的晋升候选" />
      </n-card>

      <n-card>
        <template #header>
          <n-space align="center" :size="8">
            <n-text strong style="font-size: 16px">{{ selectedYear + 1 }}年度调薪倾斜建议</n-text>
            <n-tag size="small" :type="report.summary.urgentRecommendations > 0 ? 'error' : 'success'">
              {{ report.summary.urgentRecommendations > 0 ? `${report.summary.urgentRecommendations} 项紧急` : '无紧急项' }}
            </n-tag>
          </n-space>
        </template>
        <template v-if="report.salaryRecommendations.length > 0">
          <n-data-table
            :columns="recommendationColumns"
            :data="report.salaryRecommendations"
            :row-key="(row: any) => row.employeeId"
            striped
            :scroll-x="1600"
            :expanded-row-keys="expandedRowKeys"
            @update:expanded-row-keys="handleExpandedRowChange"
            expand-trigger="row"
            :pagination="{ pageSize: 10, showSizePicker: true, pageSizes: [10, 20, 50, 100] }"
          >
            <template #expanded-row="{ row }">
              <div class="expanded-content">
                <n-space vertical :size="10" style="width: 100%">
                  <n-text strong style="font-size: 13px">调薪理由</n-text>
                  <n-space vertical :size="6" style="width: 100%">
                    <div
                      v-for="(reason, idx) in row.reasons"
                      :key="idx"
                      class="reason-item"
                    >
                      <div class="reason-num">{{ idx + 1 }}</div>
                      <div class="reason-text">{{ reason }}</div>
                    </div>
                  </n-space>
                </n-space>
              </div>
            </template>
          </n-data-table>
        </template>
        <n-empty v-else description="暂无调薪建议数据" />
      </n-card>

      <n-grid :cols="2" :x-gap="16">
        <n-gi>
          <n-card title="晋升候选绩效走势" size="small">
            <template v-if="report.promotionCandidates.length > 0">
              <n-space vertical :size="16" style="width: 100%">
                <div
                  v-for="candidate in report.promotionCandidates.slice(0, 5)"
                  :key="candidate.employeeId"
                  class="trend-card"
                >
                  <n-space justify="space-between" align="center" style="width: 100%">
                    <n-space align="center" :size="8">
                      <n-tag
                        :color="getCandidateLevelColor(candidate.level)"
                        size="small"
                        bordered
                      >
                        {{ candidate.levelLabel }}
                      </n-tag>
                      <n-text strong>{{ candidate.employeeName }}</n-text>
                      <n-text depth="3" style="font-size: 12px">{{ candidate.departmentName }}</n-text>
                    </n-space>
                    <n-text depth="3" style="font-size: 12px">评分 {{ candidate.score }}</n-text>
                  </n-space>
                  <div class="perf-trend-row">
                    <template v-if="candidate.performanceTrend.length > 0">
                      <div
                        v-for="(pt, idx) in candidate.performanceTrend"
                        :key="idx"
                        class="perf-trend-node"
                      >
                        <div class="ptn-period">{{ getHalfLabel(pt.half) }}</div>
                        <div
                          class="ptn-badge"
                          :style="{ background: store.getPerformanceLevelColor(pt.levelName) }"
                        >
                          {{ pt.levelName }}
                        </div>
                        <div class="ptn-coeff">{{ pt.coefficient }}x</div>
                        <div v-if="idx < candidate.performanceTrend.length - 1" class="ptn-arrow">
                          <RightOutlined />
                        </div>
                      </div>
                    </template>
                    <n-text v-else depth="3" style="font-size: 12px">暂无绩效数据</n-text>
                  </div>
                </div>
              </n-space>
            </template>
            <n-empty v-else description="暂无晋升候选" />
          </n-card>
        </n-gi>

        <n-gi>
          <n-card title="调薪类别分布" size="small">
            <template v-if="hasCategoryData">
              <n-space vertical :size="12" style="width: 100%">
                <div
                  v-for="item in categoryList"
                  :key="item.category"
                  class="category-bar-item"
                >
                  <n-space justify="space-between" align="center" style="width: 100%">
                    <n-tag :color="getCategoryColor(item.category)" size="small" bordered>
                      {{ item.label }}
                    </n-tag>
                    <n-text strong>{{ item.count }} 人</n-text>
                  </n-space>
                  <div class="bar-container">
                    <div
                      class="bar-fill"
                      :style="{
                        width: `${item.percent}%`,
                        backgroundColor: getCategoryBarColor(item.category)
                      }"
                    ></div>
                  </div>
                  <n-text depth="3" style="font-size: 12px">
                    占比 {{ item.percent.toFixed(1) }}%
                  </n-text>
                </div>
              </n-space>
            </template>
            <n-empty v-else description="暂无调薪分布数据" />
          </n-card>
        </n-gi>
      </n-grid>
    </template>

    <n-card v-else>
      <n-empty description="请选择年份以生成报告" />
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useMessage, type DataTableColumns, NTag } from 'naive-ui'
import {
  ExportOutlined,
  RightOutlined
} from '@vicons/antd'
import { useSalaryAdjustmentStore } from '@/stores/salaryAdjustment'
import { useBonusStore } from '@/stores/bonus'
import type {
  PromotionCandidateAnalysis,
  PromotionCandidateLevel,
  NextYearSalaryRecommendation,
  SalaryRecommendationCategory,
  PromotionAndAdjustmentReport
} from '@/types'
import dayjs from 'dayjs'

const store = useSalaryAdjustmentStore()
const bonusStore = useBonusStore()
const message = useMessage()

const selectedYear = ref<number>(dayjs().year() - 1)
const scope = ref<'company' | 'department'>('company')
const selectedDepartmentId = ref<string | null>(null)
const expandedRowKeys = ref<string[]>([])

function handleExpandedRowChange(keys: string[]) {
  expandedRowKeys.value = keys
}

const yearOptions = computed(() => {
  const years = store.getAvailableYears()
  if (years.length === 0) years.push(dayjs().year() - 1)
  return years.map((y) => ({ label: `${y}年`, value: y }))
})

const departmentOptions = computed(() =>
  bonusStore.departments.map((d) => ({ label: d.name, value: d.id }))
)

const report = computed<PromotionAndAdjustmentReport | null>(() => {
  if (scope.value === 'company') {
    return store.buildPromotionAndAdjustmentReport(selectedYear.value, 'company')
  } else if (scope.value === 'department' && selectedDepartmentId.value) {
    return store.buildPromotionAndAdjustmentReport(
      selectedYear.value,
      'department',
      selectedDepartmentId.value
    )
  }
  return null
})

const hasCategoryData = computed(() => {
  if (!report.value) return false
  const b = report.value.summary.categoryBreakdown
  return Object.values(b).some((v) => v > 0)
})

const categoryList = computed(() => {
  if (!report.value) return []
  const b = report.value.summary.categoryBreakdown
  const labels: Record<SalaryRecommendationCategory, string> = {
    promotion: '晋升调薪',
    performance_tilt: '绩效倾斜',
    market_catchup: '市场补差',
    retention: '保留性调薪',
    annual_regular: '常规年度调薪'
  }
  const total = Object.values(b).reduce((s, v) => s + v, 0)
  return Object.entries(b)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({
      category: k as SalaryRecommendationCategory,
      label: labels[k as SalaryRecommendationCategory],
      count: v,
      percent: total > 0 ? (v / total) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count)
})

function formatMoney(n: number): string {
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getHalfLabel(half: string): string {
  const map: Record<string, string> = { first: '上半年', second: '下半年', annual: '年度' }
  return map[half] || half
}

function getCandidateLevelColor(level: PromotionCandidateLevel): { color: string; textColor: string; borderColor: string } {
  const colors: Record<PromotionCandidateLevel, { color: string; textColor: string; borderColor: string }> = {
    strong: { color: '#f5222d', textColor: '#fff', borderColor: '#f5222d' },
    recommended: { color: '#fa8c16', textColor: '#fff', borderColor: '#fa8c16' },
    potential: { color: '#1890ff', textColor: '#fff', borderColor: '#1890ff' }
  }
  return colors[level]
}

function getCandidateLevelTagType(level: PromotionCandidateLevel): 'error' | 'warning' | 'info' {
  const map: Record<PromotionCandidateLevel, 'error' | 'warning' | 'info'> = {
    strong: 'error',
    recommended: 'warning',
    potential: 'info'
  }
  return map[level]
}

function getCategoryColor(category: SalaryRecommendationCategory): { color: string; textColor: string; borderColor: string } {
  const colors: Record<SalaryRecommendationCategory, { color: string; textColor: string; borderColor: string }> = {
    promotion: { color: '#722ed1', textColor: '#fff', borderColor: '#722ed1' },
    performance_tilt: { color: '#52c41a', textColor: '#fff', borderColor: '#52c41a' },
    market_catchup: { color: '#1890ff', textColor: '#fff', borderColor: '#1890ff' },
    retention: { color: '#fa8c16', textColor: '#fff', borderColor: '#fa8c16' },
    annual_regular: { color: '#8c8c8c', textColor: '#fff', borderColor: '#8c8c8c' }
  }
  return colors[category]
}

function getCategoryBarColor(category: SalaryRecommendationCategory): string {
  const map: Record<SalaryRecommendationCategory, string> = {
    promotion: '#722ed1',
    performance_tilt: '#52c41a',
    market_catchup: '#1890ff',
    retention: '#fa8c16',
    annual_regular: '#8c8c8c'
  }
  return map[category]
}

function getPriorityTagType(priority: string): 'error' | 'warning' | 'info' | 'default' {
  const map: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
    urgent: 'error',
    high: 'warning',
    medium: 'info',
    low: 'default'
  }
  return map[priority] || 'default'
}

const candidateColumns: DataTableColumns<PromotionCandidateAnalysis> = [
  {
    title: '候选等级',
    key: 'level',
    width: 110,
    align: 'center',
    render: (row) =>
      h(NTag, {
        type: getCandidateLevelTagType(row.level),
        size: 'small',
        bordered: true
      }, { default: () => row.levelLabel })
  },
  { title: '姓名', key: 'employeeName', width: 80 },
  { title: '部门', key: 'departmentName', width: 100 },
  { title: '职位', key: 'position', width: 100 },
  {
    title: '当前月薪',
    key: 'baseSalary',
    width: 110,
    align: 'right',
    render: (row) => formatMoney(row.baseSalary)
  },
  {
    title: '综合评分',
    key: 'score',
    width: 90,
    align: 'center',
    render: (row) =>
      h('span', {
        style: `font-weight: 700; color: ${row.score >= 60 ? '#f5222d' : row.score >= 45 ? '#fa8c16' : '#1890ff'}; font-size: 16px`
      }, String(row.score))
  },
  {
    title: '连续高绩效',
    key: 'consecutiveHighPerfYears',
    width: 90,
    align: 'center',
    render: (row) => {
      if (row.consecutiveHighPerfYears === 0) return h('span', { style: 'color: #8c8c8c' }, '-')
      return h(NTag, { type: 'success', size: 'small', bordered: true }, {
        default: () => `${row.consecutiveHighPerfYears}年`
      })
    }
  },
  {
    title: '绩效走势',
    key: 'performanceTrendDirection',
    width: 90,
    align: 'center',
    render: (row) => {
      const dirMap: Record<string, { label: string; color: string }> = {
        rising: { label: '上升', color: '#52c41a' },
        stable: { label: '稳定', color: '#1890ff' },
        declining: { label: '下降', color: '#f5222d' }
      }
      const d = dirMap[row.performanceTrendDirection]
      return h('span', { style: `color: ${d.color}; font-weight: 600` }, d.label)
    }
  },
  {
    title: '距上次晋升',
    key: 'yearsSinceLastPromotion',
    width: 100,
    align: 'center',
    render: (row) => {
      if (row.yearsSinceLastPromotion === null) return h('span', { style: 'color: #722ed1; font-weight: 600' }, '从未晋升')
      if (row.yearsSinceLastPromotion >= 3) return h('span', { style: 'color: #f5222d; font-weight: 600' }, `${row.yearsSinceLastPromotion}年`)
      return h('span', {}, `${row.yearsSinceLastPromotion}年`)
    }
  },
  {
    title: '薪资增长率',
    key: 'salaryGrowthRate',
    width: 100,
    align: 'right',
    render: (row) => {
      const rate = row.salaryGrowthRate
      const color = rate >= 0.1 ? '#52c41a' : rate >= 0.05 ? '#1890ff' : '#f5222d'
      return h('span', { style: `color: ${color}; font-weight: 600` },
        `${rate >= 0 ? '+' : ''}${(rate * 100).toFixed(1)}%`)
    }
  },
  {
    title: '市场分位',
    key: 'marketPercentile',
    width: 80,
    align: 'center',
    render: (row) => {
      if (row.marketPercentile === null) return h('span', { style: 'color: #8c8c8c' }, '-')
      const p = row.marketPercentile
      const color = p < 25 ? '#f5222d' : p < 50 ? '#fa8c16' : '#52c41a'
      return h('span', { style: `color: ${color}; font-weight: 700` }, `P${p}`)
    }
  },
  {
    title: '流失风险',
    key: 'retentionRisk',
    width: 80,
    align: 'center',
    render: (row) => {
      const riskMap: Record<string, { label: string; color: string }> = {
        high: { label: '高', color: '#f5222d' },
        medium: { label: '中', color: '#fa8c16' },
        low: { label: '低', color: '#52c41a' }
      }
      const r = riskMap[row.retentionRisk]
      return h('span', { style: `color: ${r.color}; font-weight: 600` }, r.label)
    }
  },
  {
    title: '关键依据',
    key: 'reasons',
    width: 200,
    render: (row) => {
      const first = row.reasons[0] || '-'
      return h('span', { style: 'font-size: 12px; line-height: 1.5' },
        first.length > 25 ? first.slice(0, 25) + '…' : first)
    }
  }
]

const recommendationColumns: DataTableColumns<NextYearSalaryRecommendation> = [
  {
    type: 'expand',
    renderExpand: () => null
  },
  {
    title: '优先级',
    key: 'priority',
    width: 80,
    align: 'center',
    render: (row) =>
      h(NTag, {
        type: getPriorityTagType(row.priority),
        size: 'small',
        bordered: true
      }, { default: () => row.priorityLabel })
  },
  { title: '姓名', key: 'employeeName', width: 80, fixed: 'left' },
  { title: '部门', key: 'departmentName', width: 100 },
  { title: '职位', key: 'position', width: 100 },
  {
    title: '当前月薪',
    key: 'currentSalary',
    width: 110,
    align: 'right',
    render: (row) => formatMoney(row.currentSalary)
  },
  {
    title: '调薪类别',
    key: 'category',
    width: 110,
    align: 'center',
    render: (row) =>
      h(NTag, {
        color: getCategoryColor(row.category),
        size: 'small',
        bordered: true
      }, { default: () => row.categoryLabel })
  },
  {
    title: '建议幅度范围',
    key: 'ratioRange',
    width: 120,
    align: 'center',
    render: (row) =>
      h('span', {
        style: 'font-weight: 700; color: #2080f0'
      }, `${(row.suggestedMinRatio * 100).toFixed(0)}% ~ ${(row.suggestedMaxRatio * 100).toFixed(0)}%`)
  },
  {
    title: '建议调薪额(月)',
    key: 'suggestedAmount',
    width: 130,
    align: 'right',
    render: (row) =>
      h('span', {
        style: 'font-weight: 700; color: #52c41a; font-size: 14px'
      }, formatMoney(row.suggestedAmount))
  },
  {
    title: '晋升候选',
    key: 'promotionCandidateLevel',
    width: 90,
    align: 'center',
    render: (row) => {
      if (!row.promotionCandidateLevel) return h('span', { style: 'color: #8c8c8c' }, '-')
      return h(NTag, {
        type: getCandidateLevelTagType(row.promotionCandidateLevel),
        size: 'small',
        bordered: true
      }, {
        default: () => {
          const map: Record<PromotionCandidateLevel, string> = {
            strong: '强烈推荐',
            recommended: '推荐',
            potential: '关注'
          }
          return map[row.promotionCandidateLevel!]
        }
      })
    }
  },
  {
    title: '绩效走势',
    key: 'performanceTrendDirection',
    width: 80,
    align: 'center',
    render: (row) => {
      const dirMap: Record<string, { label: string; color: string }> = {
        rising: { label: '上升', color: '#52c41a' },
        stable: { label: '稳定', color: '#1890ff' },
        declining: { label: '下降', color: '#f5222d' }
      }
      const d = dirMap[row.performanceTrendDirection]
      return h('span', { style: `color: ${d.color}; font-weight: 600` }, d.label)
    }
  },
  {
    title: '市场分位',
    key: 'marketPercentile',
    width: 80,
    align: 'center',
    render: (row) => {
      if (row.marketPercentile === null) return h('span', { style: 'color: #8c8c8c' }, '-')
      const p = row.marketPercentile
      const color = p < 25 ? '#f5222d' : p < 50 ? '#fa8c16' : '#52c41a'
      return h('span', { style: `color: ${color}; font-weight: 700` }, `P${p}`)
    }
  },
  {
    title: '流失风险',
    key: 'retentionRisk',
    width: 80,
    align: 'center',
    render: (row) => {
      const riskMap: Record<string, { label: string; color: string }> = {
        high: { label: '高', color: '#f5222d' },
        medium: { label: '中', color: '#fa8c16' },
        low: { label: '低', color: '#52c41a' }
      }
      const r = riskMap[row.retentionRisk]
      return h('span', { style: `color: ${r.color}; font-weight: 600` }, r.label)
    }
  }
]

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
  a.download = `${selectedYear.value + 1}年度调薪倾斜方案_${dayjs().format('YYYYMMDD')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  message.success('方案数据已导出')
}
</script>

<style scoped>
.summary-card {
  padding: 20px;
  border-radius: 12px;
  text-align: center;
}
.sc-strong {
  background: linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%);
  border: 1px solid #ffa39e;
}
.sc-recommended {
  background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
  border: 1px solid #ffc069;
}
.sc-potential {
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
  border: 1px solid #69c0ff;
}
.sc-amount {
  background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
  border: 1px solid #95de64;
}
.sc-label {
  font-size: 13px;
  color: #595959;
  margin-bottom: 8px;
}
.sc-value {
  font-size: 28px;
  font-weight: 700;
  color: #262626;
}
.sc-sub {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
}

.cat-card {
  padding: 14px;
  border-radius: 8px;
  text-align: center;
}
.cc-promotion {
  background: linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%);
}
.cc-perf {
  background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
}
.cc-market {
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
}
.cc-retention {
  background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
}
.cc-regular {
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
}
.cc-label {
  font-size: 12px;
  color: #595959;
  margin-bottom: 4px;
}
.cc-value {
  font-size: 20px;
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

.trend-card {
  padding: 14px 16px;
  background: #fafafa;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.perf-trend-row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.perf-trend-node {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ptn-period {
  font-size: 11px;
  color: #8c8c8c;
}

.ptn-badge {
  padding: 2px 8px;
  border-radius: 4px;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.ptn-coeff {
  font-size: 11px;
  color: #595959;
}

.ptn-arrow {
  color: #bfbfbf;
  font-size: 10px;
  margin: 0 2px;
}

.expanded-content {
  padding: 16px 20px;
  background: #fafbfc;
  border-radius: 8px;
  margin: 4px 0;
}

.reason-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%);
  border-radius: 6px;
  border-left: 3px solid #1890ff;
}

.reason-num {
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

.reason-text {
  flex: 1;
  font-size: 12px;
  line-height: 1.5;
  color: #262626;
}
</style>
