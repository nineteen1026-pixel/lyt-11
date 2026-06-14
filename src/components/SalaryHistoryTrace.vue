<template>
  <n-space vertical :size="16" style="width: 100%">
    <n-card>
      <n-space justify="space-between" align="center" style="width: 100%">
        <n-space vertical :size="4">
          <n-text strong style="font-size: 18px">员工调薪轨迹回溯</n-text>
          <n-text depth="3" style="font-size: 13px">查看员工历次调薪记录，分析调薪趋势与历史薪酬变化</n-text>
        </n-space>
        <n-space>
          <n-select
            v-model:value="filterYear"
            :options="yearOptions"
            placeholder="按年份筛选"
            style="width: 140px"
            clearable
          />
          <n-select
            v-model:value="filterCategory"
            :options="categoryOptions"
            placeholder="按事由分类筛选"
            style="width: 160px"
            clearable
          />
        </n-space>
      </n-space>
    </n-card>

    <n-card title="选择员工">
      <n-select
        v-model:value="selectedEmployeeId"
        :options="employeeOptions"
        placeholder="请选择要查看的员工"
        filterable
        style="width: 100%"
        @update:value="handleEmployeeChange"
      />
    </n-card>

    <template v-if="selectedEmployeeId && employeeHistory.length > 0">
      <n-card title="调薪统计概览">
        <n-grid :cols="4" :x-gap="20">
          <n-gi>
            <div class="stat-card">
              <div class="stat-label">累计调薪次数</div>
              <div class="stat-value">{{ employeeHistory.length }} 次</div>
            </div>
          </n-gi>
          <n-gi>
            <div class="stat-card amount">
              <div class="stat-label">累计调薪金额（月）</div>
              <div class="stat-value">+{{ formatMoney(totalAdjustment) }}</div>
            </div>
          </n-gi>
          <n-gi>
            <div class="stat-card ratio">
              <div class="stat-label">平均调薪比例</div>
              <div class="stat-value">+{{ (avgAdjustmentRatio * 100).toFixed(2) }}%</div>
            </div>
          </n-gi>
          <n-gi>
            <div class="stat-card current">
              <div class="stat-label">当前月薪</div>
              <div class="stat-value">{{ formatMoney(currentSalary) }}</div>
            </div>
          </n-gi>
        </n-grid>
      </n-card>

      <n-card title="薪资变化趋势">
        <n-space vertical :size="16" style="width: 100%">
          <div class="salary-timeline">
            <div
              v-for="(record, index) in employeeHistory"
              :key="record.id"
              class="timeline-item"
            >
              <div class="timeline-marker" :class="{ 'first': index === 0, 'last': index === employeeHistory.length - 1 }">
                <div class="marker-dot"></div>
                <div v-if="index < employeeHistory.length - 1" class="marker-line"></div>
              </div>
              <div class="timeline-content">
                <n-card size="small" hoverable>
                  <n-space justify="space-between" align="center" style="width: 100%">
                    <n-space vertical :size="4">
                      <n-space align="center">
                        <n-tag :color="reasonCategoryColors[record.reasonCategory]" bordered>
                          {{ store.getCategoryLabel(record.reasonCategory) }}
                        </n-tag>
                        <n-text strong>{{ record.reasonName }}</n-text>
                      </n-space>
                      <n-text depth="3" style="font-size: 12px">
                        生效日期：{{ record.effectiveDate }} | 批准日期：{{ formatDate(record.approvedAt) }}
                      </n-text>
                    </n-space>
                    <n-space align="center">
                      <div class="salary-change">
                        <div class="old-salary">{{ formatMoney(record.oldSalary) }}</div>
                        <div class="arrow">→</div>
                        <div class="new-salary">{{ formatMoney(record.newSalary) }}</div>
                      </div>
                      <n-tag type="success" size="large">
                        +{{ formatMoney(record.adjustmentAmount) }}
                        <span style="font-size: 11px; margin-left: 4px">(+{{ (record.adjustmentRatio * 100).toFixed(2) }}%)</span>
                      </n-tag>
                    </n-space>
                  </n-space>
                  <n-divider v-if="record.description" style="margin: 12px 0" />
                  <n-text v-if="record.description" depth="3" style="font-size: 13px">
                    <n-icon><FileTextOutlined /></n-icon> {{ record.description }}
                  </n-text>
                  <n-divider style="margin: 12px 0" />
                  <n-space justify="space-between" style="width: 100%">
                    <n-text depth="3" style="font-size: 12px">
                      申请人：{{ record.applicantName }} | 部门：{{ record.departmentName }} | 职位：{{ record.position }}
                    </n-text>
                  </n-space>
                </n-card>
              </div>
            </div>
          </div>
        </n-space>
      </n-card>

      <n-card title="调薪明细列表">
        <n-data-table
          :columns="columns"
          :data="employeeHistory"
          :row-key="(row: any) => row.id"
          striped
          :pagination="{ pageSize: 10, showSizePicker: true, pageSizes: [10, 20, 50] }"
        >
          <template #body="{ rows }">
            <tbody>
              <tr v-for="row in rows" :key="row.id">
                <td>{{ formatDate(row.approvedAt) }}</td>
                <td>{{ row.effectiveDate }}</td>
                <td>
                  <n-tag :color="reasonCategoryColors[row.reasonCategory as AdjustmentReasonCategory]" bordered>
                    {{ store.getCategoryLabel(row.reasonCategory as AdjustmentReasonCategory) }}
                  </n-tag>
                </td>
                <td>{{ row.reasonName }}</td>
                <td>{{ formatMoney(row.oldSalary) }}</td>
                <td>{{ formatMoney(row.newSalary) }}</td>
                <td>
                  <n-text type="success">+{{ formatMoney(row.adjustmentAmount) }}</n-text>
                </td>
                <td>
                  <n-tag type="success">+{{ (row.adjustmentRatio * 100).toFixed(2) }}%</n-tag>
                </td>
                <td>{{ row.applicantName }}</td>
                <td>{{ row.approverName || '-' }}</td>
              </tr>
            </tbody>
          </template>
        </n-data-table>
      </n-card>

      <n-card title="调薪事由分布">
        <n-grid :cols="3" :x-gap="20">
          <n-gi v-for="cat in categoryStats" :key="cat.category">
            <n-card size="small" :bordered="true">
              <n-space justify="space-between" align="center" style="width: 100%">
                <n-space align="center">
                  <n-tag :color="reasonCategoryColors[cat.category]" bordered>
                    {{ store.getCategoryLabel(cat.category) }}
                  </n-tag>
                </n-space>
                <n-text strong>{{ cat.count }} 次</n-text>
              </n-space>
              <n-divider style="margin: 12px 0" />
              <n-space justify="space-between" style="width: 100%">
                <n-text depth="3">累计调薪</n-text>
                <n-text type="success" strong>+{{ formatMoney(cat.totalAmount) }}</n-text>
              </n-space>
              <n-space justify="space-between" style="width: 100%">
                <n-text depth="3">平均比例</n-text>
                <n-tag type="info" size="small">+{{ (cat.avgRatio * 100).toFixed(2) }}%</n-tag>
              </n-space>
            </n-card>
          </n-gi>
        </n-grid>
      </n-card>
    </template>

    <n-card v-else-if="selectedEmployeeId && employeeHistory.length === 0">
      <n-empty description="该员工暂无调薪记录">
        <template #extra>
          <n-button type="primary" @click="goToCreate">
            <template #icon><PlusOutlined /></template>
            发起调薪申请
          </n-button>
        </template>
      </n-empty>
    </n-card>

    <n-card v-else>
      <n-empty description="请选择一位员工查看调薪历史" />
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMessage, type DataTableColumns } from 'naive-ui'
import { PlusOutlined, FileTextOutlined } from '@vicons/antd'
import { useSalaryAdjustmentStore } from '@/stores/salaryAdjustment'
import { useBonusStore } from '@/stores/bonus'
import type { AdjustmentReasonCategory, SalaryHistoryRecord } from '@/types'

const store = useSalaryAdjustmentStore()
const bonusStore = useBonusStore()
const message = useMessage()

const selectedEmployeeId = ref<string | null>(null)
const filterYear = ref<number | null>(null)
const filterCategory = ref<AdjustmentReasonCategory | null>(null)

const reasonCategoryColors: Record<AdjustmentReasonCategory, string> = {
  annual: '#1890ff',
  performance: '#52c41a',
  promotion: '#722ed1',
  market: '#13c2c2',
  certification: '#fa8c16',
  transfer: '#eb2f96',
  special: '#f5222d'
}

const employeeOptions = computed(() =>
  bonusStore.allEmployees.map((emp) => {
    const dept = bonusStore.getDepartmentById(emp.departmentId)
    return {
      label: `${emp.name} - ${emp.position} (${dept?.name || '未知部门'})`,
      value: emp.id
    }
  })
)

const yearOptions = computed(() => {
  const years = new Set<number>()
  store.salaryHistory.forEach((h) => {
    const year = new Date(h.approvedAt).getFullYear()
    years.add(year)
  })
  return Array.from(years)
    .sort((a, b) => b - a)
    .map((y) => ({ label: `${y}年`, value: y }))
})

const categoryOptions = computed(() => {
  const categories = new Set(store.salaryHistory.map((h) => h.reasonCategory))
  return Array.from(categories).map((c) => ({
    label: store.getCategoryLabel(c),
    value: c
  }))
})

const employeeHistory = computed<SalaryHistoryRecord[]>(() => {
  if (!selectedEmployeeId.value) return []
  let list = store.getEmployeeHistory(selectedEmployeeId.value)
  if (filterYear.value) {
    list = list.filter((h) => new Date(h.approvedAt).getFullYear() === filterYear.value)
  }
  if (filterCategory.value) {
    list = list.filter((h) => h.reasonCategory === filterCategory.value)
  }
  return list
})

const totalAdjustment = computed(() =>
  employeeHistory.value.reduce((sum, h) => sum + h.adjustmentAmount, 0)
)

const avgAdjustmentRatio = computed(() => {
  if (employeeHistory.value.length === 0) return 0
  const total = employeeHistory.value.reduce((sum, h) => sum + h.adjustmentRatio, 0)
  return total / employeeHistory.value.length
})

const currentSalary = computed(() => {
  if (employeeHistory.value.length === 0) {
    const emp = bonusStore.getEmployeeById(selectedEmployeeId.value || '')
    return emp?.baseSalary || 0
  }
  return employeeHistory.value[0].newSalary
})

const categoryStats = computed(() => {
  const stats: Record<string, { category: AdjustmentReasonCategory; count: number; totalAmount: number; avgRatio: number }> = {}
  employeeHistory.value.forEach((h) => {
    if (!stats[h.reasonCategory]) {
      stats[h.reasonCategory] = {
        category: h.reasonCategory,
        count: 0,
        totalAmount: 0,
        avgRatio: 0
      }
    }
    stats[h.reasonCategory].count += 1
    stats[h.reasonCategory].totalAmount += h.adjustmentAmount
    stats[h.reasonCategory].avgRatio += h.adjustmentRatio
  })
  return Object.values(stats).map((s) => ({
    ...s,
    avgRatio: s.count > 0 ? s.avgRatio / s.count : 0
  }))
})

const columns: DataTableColumns<any> = [
  { title: '批准日期', key: 'approvedAt', width: 120 },
  { title: '生效日期', key: 'effectiveDate', width: 120 },
  { title: '事由分类', key: 'reasonCategory', width: 120 },
  { title: '具体事由', key: 'reasonName', width: 140 },
  { title: '调整前薪资', key: 'oldSalary', width: 130 },
  { title: '调整后薪资', key: 'newSalary', width: 130 },
  { title: '调整金额', key: 'adjustmentAmount', width: 130 },
  { title: '调整比例', key: 'adjustmentRatio', width: 110 },
  { title: '申请人', key: 'applicantName', width: 100 },
  { title: '批准人', key: 'approverName', width: 100 }
]

function formatMoney(n: number): string {
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(s: string): string {
  if (!s) return '-'
  return s.slice(0, 10)
}

function handleEmployeeChange() {
  // Filtering handled by computed
}

function goToCreate() {
  message.info('请前往调薪申请页面发起申请')
}
</script>

<style scoped>
.stat-card {
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%);
  padding: 20px;
  border-radius: 12px;
  text-align: center;
}
.stat-card.amount {
  background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
}
.stat-card.ratio {
  background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
}
.stat-card.current {
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
}
.salary-timeline {
  padding-left: 8px;
}
.timeline-item {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}
.timeline-item:last-child {
  margin-bottom: 0;
}
.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 16px;
  flex-shrink: 0;
}
.marker-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #1890ff;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px #1890ff;
  z-index: 1;
}
.timeline-marker.first .marker-dot {
  background: #52c41a;
  box-shadow: 0 0 0 2px #52c41a;
}
.timeline-marker.last .marker-dot {
  background: #eb2f96;
  box-shadow: 0 0 0 2px #eb2f96;
}
.marker-line {
  width: 2px;
  flex: 1;
  background: #e8e8e8;
  margin-top: 4px;
}
.timeline-content {
  flex: 1;
  padding-top: 0;
}
.salary-change {
  display: flex;
  align-items: center;
  gap: 12px;
}
.old-salary {
  font-size: 14px;
  color: #8c8c8c;
  text-decoration: line-through;
}
.arrow {
  font-size: 18px;
  color: #1890ff;
  font-weight: 700;
}
.new-salary {
  font-size: 18px;
  font-weight: 700;
  color: #262626;
}
</style>
