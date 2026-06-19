<template>
  <n-space vertical :size="16" style="width: 100%">
    <n-card>
      <n-space justify="space-between" align="center" style="width: 100%">
        <n-space vertical :size="4">
          <n-text strong style="font-size: 18px">跨年度薪资增长趋势对比</n-text>
          <n-text depth="3" style="font-size: 13px">对比多年度薪资、奖金、绩效数据，分析薪酬增长趋势与投入产出比</n-text>
        </n-space>
        <n-space>
          <n-button type="primary" ghost @click="handleExportHtml">
            <template #icon><PrinterOutlined /></template>
            导出 HTML 报告
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
          <n-text depth="3" style="font-size: 12px">对比年度</n-text>
          <n-select
            v-model:value="selectedYears"
            :options="yearOptions"
            multiple
            filterable
            tag
            max-tag-count="5"
            style="width: 320px"
            placeholder="请选择对比年度"
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
      <n-card title="核心指标对比">
        <n-grid :cols="4" :x-gap="20">
          <n-gi>
            <div class="metric-card metric-growth">
              <div class="metric-label">累计薪资增长率</div>
              <div class="metric-value" :style="{ color: report.insights.overallSalaryGrowth >= 0 ? '#52c41a' : '#f5222d' }">
                {{ report.insights.overallSalaryGrowth >= 0 ? '+' : '' }}{{ (report.insights.overallSalaryGrowth * 100).toFixed(2) }}%
              </div>
              <div class="metric-sub">{{ report.years[0] }} - {{ report.years[report.years.length - 1] }} 累计</div>
            </div>
          </n-gi>
          <n-gi>
            <div class="metric-card metric-cagr">
              <div class="metric-label">薪资复合年增长率</div>
              <div class="metric-value" style="color: #722ed1">
                {{ (report.insights.cagrSalary * 100).toFixed(2) }}%
              </div>
              <div class="metric-sub">CAGR</div>
            </div>
          </n-gi>
          <n-gi>
            <div class="metric-card metric-bonus">
              <div class="metric-label">累计奖金增长率</div>
              <div class="metric-value" :style="{ color: report.insights.overallBonusGrowth >= 0 ? '#fa8c16' : '#f5222d' }">
                {{ report.insights.overallBonusGrowth >= 0 ? '+' : '' }}{{ (report.insights.overallBonusGrowth * 100).toFixed(2) }}%
              </div>
              <div class="metric-sub">奖金趋势</div>
            </div>
          </n-gi>
          <n-gi>
            <div class="metric-card metric-total">
              <div class="metric-label">累计薪酬总包增长</div>
              <div class="metric-value" style="color: #1890ff">
                {{ report.insights.overallCompGrowth >= 0 ? '+' : '' }}{{ (report.insights.overallCompGrowth * 100).toFixed(2) }}%
              </div>
              <div class="metric-sub">总包趋势</div>
            </div>
          </n-gi>
        </n-grid>
      </n-card>

      <n-card title="核心发现">
        <n-alert type="success" :show-icon="true">
          <ul style="margin: 0; padding-left: 20px">
            <li v-for="(finding, idx) in report.insights.keyFindings" :key="idx" style="margin-bottom: 4px">
              {{ finding }}
            </li>
          </ul>
        </n-alert>
      </n-card>

      <n-card title="年度薪酬趋势对比">
        <n-table :bordered="true" size="small">
          <thead>
            <tr>
              <th style="text-align: left">年度</th>
              <th style="text-align: right">平均月薪</th>
              <th style="text-align: right">薪资同比</th>
              <th style="text-align: right">平均奖金</th>
              <th style="text-align: right">奖金同比</th>
              <th style="text-align: right">年度人均总包</th>
              <th style="text-align: right">总包同比</th>
              <th style="text-align: center">员工人数</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(point, idx) in report.comparisonPoints" :key="point.year">
              <td style="font-weight: 600">{{ point.label }}</td>
              <td style="text-align: right">{{ formatMoney(point.averageSalary) }}</td>
              <td style="text-align: right">
                <n-tag v-if="idx === 0" size="small" type="default">-</n-tag>
                <n-tag
                  v-else
                  size="small"
                  :type="point.salaryGrowthRate >= 0 ? 'success' : 'error'"
                  :bordered="false"
                >
                  {{ point.salaryGrowthRate >= 0 ? '+' : '' }}{{ (point.salaryGrowthRate * 100).toFixed(2) }}%
                </n-tag>
              </td>
              <td style="text-align: right">{{ formatMoney(point.averageBonus) }}</td>
              <td style="text-align: right">
                <n-tag v-if="idx === 0" size="small" type="default">-</n-tag>
                <n-tag
                  v-else
                  size="small"
                  :type="point.bonusGrowthRate >= 0 ? 'success' : 'error'"
                  :bordered="false"
                >
                  {{ point.bonusGrowthRate >= 0 ? '+' : '' }}{{ (point.bonusGrowthRate * 100).toFixed(2) }}%
                </n-tag>
              </td>
              <td style="text-align: right; font-weight: 600">{{ formatMoney(point.averageTotalCompensation) }}</td>
              <td style="text-align: right">
                <n-tag v-if="idx === 0" size="small" type="default">-</n-tag>
                <n-tag
                  v-else
                  size="small"
                  :type="point.totalCompGrowthRate >= 0 ? 'success' : 'error'"
                  :bordered="false"
                >
                  {{ point.totalCompGrowthRate >= 0 ? '+' : '' }}{{ (point.totalCompGrowthRate * 100).toFixed(2) }}%
                </n-tag>
              </td>
              <td style="text-align: center">{{ point.headcount }}</td>
            </tr>
          </tbody>
        </n-table>
      </n-card>

      <n-card v-if="report.departmentComparison && report.departmentComparison.length > 0" title="部门薪资增长对比">
        <n-table :bordered="true" size="small">
          <thead>
            <tr>
              <th style="text-align: left">部门</th>
              <th style="text-align: right">{{ report.years[0] }}年平均月薪</th>
              <th style="text-align: right">{{ report.years[report.years.length - 1] }}年平均月薪</th>
              <th style="text-align: right">累计涨幅</th>
              <th style="text-align: right">最新年度薪酬成本</th>
              <th style="text-align: center">当前人数</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="dept in report.departmentComparison" :key="dept.departmentId">
              <td style="font-weight: 600">{{ dept.departmentName }}</td>
              <td style="text-align: right">{{ formatMoney(dept.points[0]?.averageSalary || 0) }}</td>
              <td style="text-align: right">{{ formatMoney(dept.points[dept.points.length - 1]?.averageSalary || 0) }}</td>
              <td style="text-align: right">
                <n-tag
                  size="small"
                  :type="getDeptGrowthRate(dept) >= 0 ? 'success' : 'error'"
                  :bordered="false"
                >
                  {{ getDeptGrowthRate(dept) >= 0 ? '+' : '' }}{{ (getDeptGrowthRate(dept) * 100).toFixed(2) }}%
                </n-tag>
              </td>
              <td style="text-align: right">{{ formatMoney(dept.points[dept.points.length - 1]?.totalCompCost || 0) }}</td>
              <td style="text-align: center">{{ dept.points[dept.points.length - 1]?.headcount || 0 }}</td>
            </tr>
          </tbody>
        </n-table>
      </n-card>

      <n-card title="各年度调薪事由分布">
        <n-table :bordered="true" size="small">
          <thead>
            <tr>
              <th style="text-align: left">年度</th>
              <th style="text-align: left">调薪事由</th>
              <th style="text-align: right">调薪金额</th>
              <th style="text-align: right">占比</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="yearData in report.yearlySalaryData" :key="yearData.year">
              <tr v-for="(item, idx) in getCategoryRows(yearData)" :key="`${yearData.year}-${idx}`">
                <td v-if="idx === 0" :rowspan="getCategoryRows(yearData).length" style="font-weight: 600; vertical-align: top">
                  {{ yearData.year }}年
                </td>
                <td>{{ item.label }}</td>
                <td style="text-align: right">{{ formatMoney(item.amount) }}</td>
                <td style="text-align: right">{{ item.ratio }}%</td>
              </tr>
            </template>
          </tbody>
        </n-table>
      </n-card>

      <n-card v-if="report.topGrowers && report.topGrowers.length > 0" title="薪资增长 TOP10 员工">
        <n-table :bordered="true" size="small">
          <thead>
            <tr>
              <th style="text-align: center; width: 60px">排名</th>
              <th style="text-align: left">姓名</th>
              <th style="text-align: left">部门</th>
              <th style="text-align: right">起始薪资</th>
              <th style="text-align: right">最新薪资</th>
              <th style="text-align: right">增长金额</th>
              <th style="text-align: right">增长率</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(emp, idx) in report.topGrowers" :key="emp.employeeId">
              <td style="text-align: center">
                <n-tag size="small" :type="idx < 3 ? 'warning' : 'default'" :bordered="false">
                  {{ idx + 1 }}
                </n-tag>
              </td>
              <td>{{ emp.employeeName }}</td>
              <td>{{ emp.departmentName }}</td>
              <td style="text-align: right">{{ formatMoney(emp.growthPoints[0]?.salary || 0) }}</td>
              <td style="text-align: right">{{ formatMoney(emp.growthPoints[emp.growthPoints.length - 1]?.salary || 0) }}</td>
              <td style="text-align: right; color: #52c41a; font-weight: 600">+{{ formatMoney(emp.totalGrowthAmount) }}</td>
              <td style="text-align: right; color: #52c41a; font-weight: 600">+{{ (emp.totalGrowthRate * 100).toFixed(2) }}%</td>
            </tr>
          </tbody>
        </n-table>
      </n-card>

      <n-card title="薪酬成本趋势">
        <n-grid :cols="3" :x-gap="20">
          <n-gi>
            <div class="cost-card">
              <div class="cost-label">年度薪资总成本</div>
              <div class="cost-chart">
                <div v-for="point in report.comparisonPoints" :key="point.year" class="cost-bar">
                  <div class="cost-bar-label">{{ point.year }}</div>
                  <div
                    class="cost-bar-fill"
                    :style="{ height: getBarHeight(point.totalSalaryCost, 'salary') + '%', background: '#1890ff' }"
                  ></div>
                  <div class="cost-bar-value">{{ formatShortMoney(point.totalSalaryCost) }}</div>
                </div>
              </div>
            </div>
          </n-gi>
          <n-gi>
            <div class="cost-card">
              <div class="cost-label">年度奖金总成本</div>
              <div class="cost-chart">
                <div v-for="point in report.comparisonPoints" :key="point.year" class="cost-bar">
                  <div class="cost-bar-label">{{ point.year }}</div>
                  <div
                    class="cost-bar-fill"
                    :style="{ height: getBarHeight(point.totalBonusCost, 'bonus') + '%', background: '#fa8c16' }"
                  ></div>
                  <div class="cost-bar-value">{{ formatShortMoney(point.totalBonusCost) }}</div>
                </div>
              </div>
            </div>
          </n-gi>
          <n-gi>
            <div class="cost-card">
              <div class="cost-label">年度薪酬总包</div>
              <div class="cost-chart">
                <div v-for="point in report.comparisonPoints" :key="point.year" class="cost-bar">
                  <div class="cost-bar-label">{{ point.year }}</div>
                  <div
                    class="cost-bar-fill"
                    :style="{ height: getBarHeight(point.totalCompCost, 'total') + '%', background: '#722ed1' }"
                  ></div>
                  <div class="cost-bar-value">{{ formatShortMoney(point.totalCompCost) }}</div>
                </div>
              </div>
            </div>
          </n-gi>
        </n-grid>
      </n-card>
    </template>

    <n-empty v-else description="请选择对比年度以生成报告" />
  </n-space>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import {
  PrinterOutlined,
  FileTextOutlined
} from '@vicons/antd'
import { useSalaryAdjustmentStore } from '@/stores/salaryAdjustment'
import { useBonusStore } from '@/stores/bonus'
import type { CrossYearComparisonReport } from '@/types'
import dayjs from 'dayjs'

const store = useSalaryAdjustmentStore()
const bonusStore = useBonusStore()
const message = useMessage()

const scope = ref<'company' | 'department' | 'employee'>('company')
const selectedDepartmentId = ref<string | null>(null)
const selectedEmployeeId = ref<string | null>(null)
const selectedYears = ref<number[]>([])

const report = ref<CrossYearComparisonReport | null>(null)

const yearOptions = computed(() => {
  const years = store.getAvailableYears()
  return years.map((y) => ({
    label: `${y}年`,
    value: y
  }))
})

const availableYears = computed(() => store.getAvailableYears())

watch(availableYears, (newYears, oldYears) => {
  const prev = oldYears || []
  const newOnes = newYears.filter((y) => !prev.includes(y))
  if (newOnes.length > 0 && selectedYears.value.length > 0) {
    selectedYears.value = Array.from(new Set([...selectedYears.value, ...newOnes])).sort((a, b) => b - a)
  }
  if (newOnes.length > 0 && selectedYears.value.length === 0) {
    selectedYears.value = newYears.slice(0, 3)
  }
}, { immediate: false })

const departmentOptions = computed(() => {
  return bonusStore.departments.map((d) => ({
    label: d.name,
    value: d.id
  }))
})

const employeeOptions = computed(() => {
  return bonusStore.allEmployees.map((e) => {
    const dept = bonusStore.getDepartmentById(e.departmentId)
    return {
      label: `${e.name} - ${dept?.name || ''} - ${e.position}`,
      value: e.id
    }
  })
})

function formatMoney(n: number): string {
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatShortMoney(n: number): string {
  if (n >= 10000) {
    return `¥${(n / 10000).toFixed(1)}万`
  }
  return `¥${n.toFixed(0)}`
}

function getCategoryRows(yearData: { adjustmentByCategory: Record<string, number> }) {
  const total = Object.values(yearData.adjustmentByCategory).reduce((s, v) => s + v, 0)
  const rows = Object.entries(yearData.adjustmentByCategory)
    .filter(([, v]) => v > 0)
    .map(([cat, amount]) => ({
      label: store.CATEGORY_LABELS[cat as keyof typeof store.CATEGORY_LABELS] || cat,
      amount,
      ratio: total > 0 ? ((amount / total) * 100).toFixed(1) : '0'
    }))
  return rows.length > 0 ? rows : [{ label: '暂无调薪记录', amount: 0, ratio: '0' }]
}

function getDeptGrowthRate(dept: { points: { averageSalary: number }[] }) {
  if (dept.points.length < 2) return 0
  const first = dept.points[0].averageSalary
  const last = dept.points[dept.points.length - 1].averageSalary
  if (first === 0) return 0
  return (last - first) / first
}

function getBarHeight(value: number, type: 'salary' | 'bonus' | 'total') {
  if (!report.value) return 0
  const values = report.value.comparisonPoints.map((p) => {
    if (type === 'salary') return p.totalSalaryCost
    if (type === 'bonus') return p.totalBonusCost
    return p.totalCompCost
  })
  const max = Math.max(...values)
  if (max === 0) return 0
  return (value / max) * 80 + 10
}

function generateReport() {
  if (selectedYears.value.length < 1) {
    report.value = null
    return
  }

  let scopeId: string | undefined
  if (scope.value === 'department' && selectedDepartmentId.value) {
    scopeId = selectedDepartmentId.value
  } else if (scope.value === 'employee' && selectedEmployeeId.value) {
    scopeId = selectedEmployeeId.value
  }

  report.value = store.buildCrossYearComparisonReport(
    selectedYears.value,
    scope.value,
    scopeId
  )
}

function handleYearChange() {
  generateReport()
}

function handleExportHtml() {
  if (!report.value) return
  const html = store.exportCrossYearReportHtml(report.value)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `跨年度薪资增长趋势对比报告_${report.value.scopeName}_${dayjs().format('YYYYMMDD')}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  message.success('报告已导出')
}

function handleExportJson() {
  if (!report.value) return
  const json = JSON.stringify(report.value, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `跨年度对比数据_${report.value.scopeName}_${dayjs().format('YYYYMMDD')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  message.success('数据已导出')
}

watch(scope, () => {
  if (scope.value === 'department' && !selectedDepartmentId.value) {
    selectedDepartmentId.value = bonusStore.departments[0]?.id || null
  }
  if (scope.value === 'employee' && !selectedEmployeeId.value) {
    selectedEmployeeId.value = bonusStore.allEmployees[0]?.id || null
  }
  generateReport()
})

watch(selectedDepartmentId, () => {
  if (scope.value === 'department') {
    generateReport()
  }
})

watch(selectedEmployeeId, () => {
  if (scope.value === 'employee') {
    generateReport()
  }
})

watch(
  () => [
    store.approvedRequests.length,
    store.salaryHistory.length,
    store.requests.filter(r => r.status === 'approved').length,
    bonusStore.salaryAdjustmentImpacts.length,
    bonusStore.allEmployees.length,
    bonusStore.departments.length
  ],
  () => {
    if (selectedYears.value.length > 0) {
      generateReport()
    }
  },
  { deep: false }
)

onMounted(() => {
  const availableYears = store.getAvailableYears()
  if (availableYears.length >= 2) {
    selectedYears.value = availableYears.slice(0, 3)
  } else if (availableYears.length === 1) {
    selectedYears.value = availableYears
  }
  generateReport()
})
</script>

<style scoped>
.metric-card {
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  background: #f6f8fa;
}
.metric-growth {
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
}
.metric-cagr {
  background: linear-gradient(135deg, #f9f0ff 0%, #d3adf7 100%);
}
.metric-bonus {
  background: linear-gradient(135deg, #fff7e6 0%, #ffd591 100%);
}
.metric-total {
  background: linear-gradient(135deg, #f6ffed 0%, #b7eb8f 100%);
}
.metric-label {
  font-size: 13px;
  color: #595959;
  margin-bottom: 8px;
}
.metric-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}
.metric-sub {
  font-size: 12px;
  color: #8c8c8c;
}

.cost-card {
  padding: 16px;
  border-radius: 12px;
  background: #fafafa;
}
.cost-label {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 16px;
  text-align: center;
}
.cost-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 160px;
  padding: 0 10px;
}
.cost-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
  justify-content: flex-end;
}
.cost-bar-label {
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 4px;
  order: 3;
}
.cost-bar-fill {
  width: 36px;
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height 0.3s ease;
  order: 2;
}
.cost-bar-value {
  font-size: 11px;
  color: #595959;
  margin-top: 4px;
  margin-bottom: 6px;
  order: 1;
  white-space: nowrap;
}
</style>
