<template>
  <n-card title="全员年终奖测算表" :bordered="false">
    <template #header-extra>
      <n-space>
        <n-input
          v-model:value="keyword"
          placeholder="搜索姓名 / 部门"
          clearable
          style="width: 220px"
        >
          <template #prefix><SearchOutlined /></template>
        </n-input>
        <n-select
          v-model:value="filterMethod"
          placeholder="计税方案"
          style="width: 180px"
          :options="[
            { label: '全部', value: '' },
            { label: '单独计税更优', value: 'oneTime' },
            { label: '并入综合更优', value: 'comprehensive' }
          ]"
          clearable
        />
        <n-select
          v-model:value="sortKey"
          placeholder="排序方式"
          style="width: 180px"
          :options="[
            { label: '税前金额 高→低', value: 'grossBonusDesc' },
            { label: '税前金额 低→高', value: 'grossBonusAsc' },
            { label: '省税金额 高→低', value: 'savedDesc' }
          ]"
        />
      </n-space>
    </template>

    <n-spin :show="loading">
      <n-data-table
        :columns="columns"
        :data="filteredData"
        :pagination="{ pageSize: 20, showSizePicker: true, pageSizes: [10, 20, 50, 100] }"
        :bordered="false"
        striped
        row-key="employeeId"
      />
    </n-spin>

    <n-divider />

    <n-space justify="space-between" style="width: 100%">
      <n-text depth="3">
        共 {{ filteredData.length }} 条记录
      </n-text>
      <n-space>
        <n-statistic label="税前合计" :value="sumBy('grossBonus')" style="min-width: 160px">
          <template #suffix>元</template>
        </n-statistic>
        <n-statistic label="最少税费合计" :value="sumMinTax" :value-style="{ color: '#d03050' }" style="min-width: 160px">
          <template #suffix>元</template>
        </n-statistic>
        <n-statistic label="最多省税合计" :value="sumBy('savedTax')" :value-style="{ color: '#18a058' }" style="min-width: 160px">
          <template #suffix>元</template>
        </n-statistic>
      </n-space>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { useMessage } from 'naive-ui'
import { SearchOutlined, CopyOutlined } from '@vicons/antd'
import { useBonusStore } from '@/stores/bonus'
import type { PersonalCalculationResult, TaxMethod } from '@/types'
import { formatCurrency } from '@/utils/tax'

const store = useBonusStore()
const message = useMessage()

const loading = ref(false)
const keyword = ref('')
const filterMethod = ref<TaxMethod | ''>('')
const sortKey = ref('grossBonusDesc')

const columns: DataTableColumns<PersonalCalculationResult> = [
  { title: '部门', key: 'departmentName', width: 130, fixed: 'left' },
  {
    title: '姓名',
    key: 'employeeName',
    width: 160,
    fixed: 'left',
    render: (row) =>
      h(
        'n-space',
        { size: 6, align: 'center' },
        {
          default: () => {
            const children = [h('span', {}, row.employeeName)]
            if (row.adjustmentType === 'capped') {
              children.push(
                h(
                  'n-tag',
                  { size: 'small', type: 'warning', round: true },
                  { default: () => '已封顶' }
                )
              )
            } else if (row.adjustmentType === 'floored') {
              children.push(
                h(
                  'n-tag',
                  { size: 'small', type: 'success', round: true },
                  { default: () => '已保底' }
                )
              )
            } else if (Math.abs(row.adjustmentAmount) > 0.01) {
              children.push(
                h(
                  'n-tooltip',
                  { trigger: 'hover' },
                  {
                    default: () =>
                      h(
                        'n-tag',
                        { size: 'small', type: 'info', round: true },
                        { default: () => '平账调整' }
                      ),
                    trigger: () =>
                      `平账调整${row.adjustmentAmount >= 0 ? '+' : ''}${formatCurrency(row.adjustmentAmount)}`
                  }
                )
              )
            }
            return children
          }
        }
      )
  },
  {
    title: '原始税前',
    key: 'originalGrossBonus',
    width: 120,
    render: (row) => {
      if (row.adjustmentType === 'none' && Math.abs(row.adjustmentAmount) <= 0.01) {
        return h('n-text', { depth: 3 }, { default: () => '-' })
      }
      return h('n-text', { depth: 3, style: 'text-decoration: line-through' }, {
        default: () => formatCurrency(row.originalGrossBonus)
      })
    }
  },
  {
    title: '调整额',
    key: 'adjustmentAmount',
    width: 110,
    render: (row) => {
      if (Math.abs(row.adjustmentAmount) <= 0.01) {
        return h('n-text', { depth: 3 }, { default: () => '-' })
      }
      const type = row.adjustmentAmount >= 0 ? 'success' : 'warning'
      return h('n-text', { type, strong: true }, {
        default: () => (row.adjustmentAmount >= 0 ? '+' : '') + formatCurrency(row.adjustmentAmount)
      })
    }
  },
  {
    title: '基础',
    key: 'baseAmount',
    width: 110,
    render: (row) => formatCurrency(row.baseAmount)
  },
  {
    title: '绩效加成',
    key: 'performanceBonus',
    width: 110,
    render: (row) =>
      h('n-text', { type: row.performanceBonus > 0 ? 'success' : 'default' }, {
        default: () => (row.performanceBonus > 0 ? '+' : '') + formatCurrency(row.performanceBonus)
      })
  },
  {
    title: '工龄加成',
    key: 'tenureBonus',
    width: 110,
    render: (row) =>
      h('n-text', { type: row.tenureBonus > 0 ? 'success' : 'default' }, {
        default: () => (row.tenureBonus > 0 ? '+' : '') + formatCurrency(row.tenureBonus)
      })
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
    title: '部门调整',
    key: 'departmentAllocation',
    width: 110,
    render: (row) =>
      h('n-text', { type: row.departmentAllocation >= 0 ? 'success' : 'warning' }, {
        default: () => (row.departmentAllocation >= 0 ? '+' : '') + formatCurrency(row.departmentAllocation)
      })
  },
  {
    title: '税前年终奖',
    key: 'grossBonus',
    width: 140,
    fixed: 'left',
    render: (row) => h('n-text', { strong: true, style: 'font-size: 14px' }, { default: () => formatCurrency(row.grossBonus) })
  },
  {
    title: '单独计税',
    key: 'oneTime',
    width: 200,
    render: (row) =>
      h(
        'n-space',
        { size: 8 },
        {
          default: () => [
            h(
              'n-tag',
              {
                size: 'small',
                type: row.betterMethod === 'oneTime' ? 'success' : 'default'
              },
              { default: () => h('n-text', { type: 'error' }, { default: () => `税${formatCurrency(row.taxOneTime)}` }) }
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
    key: 'comprehensive',
    width: 200,
    render: (row) =>
      h(
        'n-space',
        { size: 8 },
        {
          default: () => [
            h(
              'n-tag',
              {
                size: 'small',
                type: row.betterMethod === 'comprehensive' ? 'success' : 'default'
              },
              { default: () => h('n-text', { type: 'error' }, { default: () => `税${formatCurrency(row.taxComprehensive)}` }) }
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
    key: 'better',
    width: 120,
    fixed: 'right',
    render: (row) =>
      h(
        'n-tag',
        { type: 'success', round: true, size: 'small' },
        { default: () => (row.betterMethod === 'oneTime' ? '单独计税' : '并入综合') }
      )
  },
  {
    title: '省税',
    key: 'saved',
    width: 110,
    fixed: 'right',
    render: (row) =>
      h('n-text', { type: 'success', strong: true }, {
        default: () => (row.savedTax > 0 ? '+' + formatCurrency(row.savedTax) : '-')
      })
  },
  {
    title: '操作',
    key: 'action',
    width: 100,
    fixed: 'right',
    render: (row) =>
      h(
        'n-button',
        {
          size: 'tiny',
          type: 'primary',
          quaternary: true,
          onClick: () => {
            store.selectedEmployeeId = row.employeeId
            message.info(`已切换至 ${row.employeeName} 的个人测算页面`)
          }
        },
        {
          icon: () => h(CopyOutlined),
          default: () => '查看详情'
        }
      )
  }
]

const filteredData = computed(() => {
  let list = [...store.calculationResults]

  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(
      (r) =>
        r.employeeName.toLowerCase().includes(kw) ||
        r.departmentName.toLowerCase().includes(kw)
    )
  }

  if (filterMethod.value) {
    list = list.filter((r) => r.betterMethod === filterMethod.value)
  }

  switch (sortKey.value) {
    case 'grossBonusAsc':
      list.sort((a, b) => a.grossBonus - b.grossBonus)
      break
    case 'savedDesc':
      list.sort((a, b) => b.savedTax - a.savedTax)
      break
    case 'grossBonusDesc':
    default:
      list.sort((a, b) => b.grossBonus - a.grossBonus)
  }
  return list
})

function sumBy(key: keyof PersonalCalculationResult) {
  return filteredData.value.reduce((s, r) => s + (r[key] as number), 0)
}

const sumMinTax = computed(() =>
  filteredData.value.reduce((s, r) => s + Math.min(r.taxOneTime, r.taxComprehensive), 0)
)
</script>
