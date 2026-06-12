<template>
  <n-space vertical :size="20" style="width: 100%">
    <n-grid :cols="4" :x-gap="16" :y-gap="16" responsive="screen">
      <n-gi>
        <n-card :bordered="false" hoverable>
          <n-statistic label="奖金池总额" :value="store.bonusPool.totalAmount">
            <template #prefix>
              <n-icon size="18" color="#2080f0"><WalletOutlined /></n-icon>
            </template>
            <template #suffix>元</template>
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card :bordered="false" hoverable>
          <n-statistic label="实发合计（单独计税）" :value="netTotalOneTime">
            <template #prefix>
              <n-icon size="18" color="#18a058"><CheckCircleOutlined /></n-icon>
            </template>
            <template #suffix>元</template>
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card :bordered="false" hoverable>
          <n-statistic label="总税费（最优方案）" :value="minTotalTax" :value-style="{ color: '#d03050' }">
            <template #prefix>
              <n-icon size="18" color="#d03050"><WarningOutlined /></n-icon>
            </template>
            <template #suffix>元</template>
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card :bordered="false" hoverable>
          <n-statistic label="累计省税金额" :value="totalSavedTax" :value-style="{ color: '#18a058' }">
            <template #prefix>
              <n-icon size="18" color="#18a058"><GiftOutlined /></n-icon>
            </template>
            <template #suffix>元</template>
          </n-statistic>
        </n-card>
      </n-gi>
    </n-grid>

    <n-grid :cols="3" :x-gap="16" responsive="screen">
      <n-gi span="3 m:2">
        <n-card title="部门分配概览" :bordered="false">
          <template v-if="store.departments.length > 0">
            <n-space vertical style="width: 100%" :size="16">
              <div v-for="dept in store.departments" :key="dept.id">
                <n-space justify="space-between" style="margin-bottom: 6px">
                  <n-text strong>{{ dept.name }}</n-text>
                  <n-space>
                    <n-text depth="3">{{ dept.employees.length }}人</n-text>
                    <n-tag size="small" type="info">{{ (dept.allocationRatio * 100).toFixed(1) }}%</n-tag>
                    <n-text strong type="primary">
                      {{ formatCurrency(store.departmentAllocations[dept.id] || 0) }}
                    </n-text>
                  </n-space>
                </n-space>
                <n-progress
                  type="line"
                  :percentage="Number((dept.allocationRatio * 100).toFixed(1))"
                  :indicator-placement="'inside'"
                  :height="20"
                  :border-radius="10"
                />
              </div>
            </n-space>
          </template>
          <n-empty v-else description="暂无部门配置" />
        </n-card>
      </n-gi>

      <n-gi span="3 m:1">
        <n-card title="方案建议" :bordered="false">
          <n-space vertical style="width: 100%" :size="12">
            <n-alert type="info" :show-icon="true" title="个税政策说明">
              根据2024年最新政策，全年一次性奖金单独计税优惠政策延长至2027年12月31日。
            </n-alert>
            <n-statistic label="推荐「单独计税」人数" :value="countOneTimeBetter" :value-style="{ color: '#2080f0' }">
              <template #suffix> / {{ store.allEmployees.length }}人</template>
            </n-statistic>
            <n-statistic label="推荐「并入综合」人数" :value="countCompBetter" :value-style="{ color: '#18a058' }">
              <template #suffix> / {{ store.allEmployees.length }}人</template>
            </n-statistic>
            <n-divider />
            <n-alert type="success" :show-icon="true">
              共 {{ totalSavedTax > 0 ? formatCurrency(totalSavedTax) : '0' }} 元的优化空间，建议合理分配计税方式。
            </n-alert>
          </n-space>
        </n-card>
      </n-gi>
    </n-grid>

    <n-card title="全员测算一览（前10名）" :bordered="false">
      <n-data-table
        :columns="columns"
        :data="topResults"
        :pagination="{ pageSize: 10 }"
        :bordered="false"
        striped
      />
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { useBonusStore } from '@/stores/bonus'
import {
  WalletOutlined,
  CheckOutlined as CheckCircleOutlined,
  WarningFilled as WarningOutlined,
  GiftOutlined
} from '@vicons/antd'
import type { PersonalCalculationResult, TaxMethod } from '@/types'
import { formatCurrency } from '@/utils/tax'

const store = useBonusStore()

const netTotalOneTime = computed(() =>
  store.calculationResults.reduce((s, r) => s + r.netBonusOneTime, 0)
)

const minTotalTax = computed(() =>
  store.calculationResults.reduce((s, r) => s + Math.min(r.taxOneTime, r.taxComprehensive), 0)
)

const totalSavedTax = computed(() =>
  store.calculationResults.reduce((s, r) => s + r.savedTax, 0)
)

function countBetter(method: TaxMethod) {
  return store.calculationResults.filter((r) => r.betterMethod === method).length
}

const countOneTimeBetter = computed(() => countBetter('oneTime'))
const countCompBetter = computed(() => countBetter('comprehensive'))

const topResults = computed(() =>
  [...store.calculationResults].sort((a, b) => b.grossBonus - a.grossBonus)
)

const columns: DataTableColumns<PersonalCalculationResult> = [
  { title: '部门', key: 'departmentName', width: 130 },
  { title: '姓名', key: 'employeeName', width: 90 },
  {
    title: '税前年终奖',
    key: 'grossBonus',
    width: 130,
    render: (row) => h('n-text', { strong: true }, { default: () => formatCurrency(row.grossBonus) })
  },
  {
    title: '标签加成',
    key: 'tagBonus',
    width: 110,
    render: (row) =>
      h('n-text', { type: row.tagBonus > 0 ? 'success' : 'default' }, {
        default: () => (row.tagBonus > 0 ? '+' : '') + formatCurrency(row.tagBonus)
      })
  },
  {
    title: '单独计税',
    key: 'taxOneTime',
    width: 200,
    render: (row) =>
      h(
        'n-space',
        { size: 8 },
        {
          default: () => [
            h(
              'n-tag',
              { size: 'small', type: row.betterMethod === 'oneTime' ? 'success' : 'default' },
              {
                default: () =>
                  h('n-text', { type: 'error' }, { default: () => `税${formatCurrency(row.taxOneTime)}` })
              }
            ),
            h('n-text', { type: 'success', strong: row.betterMethod === 'oneTime' }, {
              default: () => formatCurrency(row.netBonusOneTime)
            })
          ]
        }
      )
  },
  {
    title: '并入综合',
    key: 'taxComprehensive',
    width: 200,
    render: (row) =>
      h(
        'n-space',
        { size: 8 },
        {
          default: () => [
            h(
              'n-tag',
              { size: 'small', type: row.betterMethod === 'comprehensive' ? 'success' : 'default' },
              {
                default: () =>
                  h('n-text', { type: 'error' }, { default: () => `税${formatCurrency(row.taxComprehensive)}` })
              }
            ),
            h('n-text', { type: 'success', strong: row.betterMethod === 'comprehensive' }, {
              default: () => formatCurrency(row.netBonusComprehensive)
            })
          ]
        }
      )
  },
  {
    title: '更优方案',
    key: 'betterMethod',
    width: 120,
    render: (row) =>
      h(
        'n-tag',
        { type: 'success', round: true },
        { default: () => (row.betterMethod === 'oneTime' ? '单独计税' : '并入综合') }
      )
  },
  {
    title: '省税',
    key: 'savedTax',
    width: 130,
    render: (row) =>
      h(
        'n-text',
        { type: 'success', strong: true },
        { default: () => (row.savedTax > 0 ? '+' + formatCurrency(row.savedTax) : '-') }
      )
  }
]
</script>
