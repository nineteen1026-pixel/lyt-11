<template>
  <n-space v-if="warnings.length > 0" vertical :size="12" style="width: 100%">
    <n-alert
      v-for="warning in warnings"
      :key="warning.tag.id"
      type="warning"
      :show-icon="true"
      :title="alertTitle(warning)"
      closable
    >
      <n-space vertical :size="10">
        <n-text>
          标签「<n-tag :color="{ color: warning.tag.color || '#1890ff', textColor: '#fff' }" size="small" round>{{ warning.tag.name }}</n-tag>」
          将在 <n-text type="error" strong>{{ warning.daysUntilExpiry }} 天</n-text> 后失效（{{ warning.tag.expiryDate }}），
          影响 <n-text strong>{{ warning.affectedCount }}</n-text> 名员工，
          预计总金额变化：<n-text type="error" strong>-{{ formatCurrency(warning.totalPotentialLoss) }}</n-text>
        </n-text>

        <n-collapse v-if="warning.affectedEmployees.length > 0">
          <n-collapse-item title="查看影响员工明细" name="employees">
            <n-data-table
              :columns="employeeColumns"
              :data="warning.affectedEmployees"
              :pagination="false"
              :bordered="false"
              size="small"
            />
          </n-collapse-item>
        </n-collapse>
      </n-space>
    </n-alert>
  </n-space>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useBonusStore } from '@/stores/bonus'
import { formatCurrency } from '@/utils/tax'
import type { EmployeeTagExpiryWarning } from '@/types'

const props = defineProps<{
  daysThreshold?: number
}>()

const store = useBonusStore()

const warnings = computed(() =>
  store.getExpiringTagWarnings(props.daysThreshold ?? 7)
)

function alertTitle(warning: EmployeeTagExpiryWarning) {
  return `标签即将失效提醒 - ${warning.tag.name}`
}

const employeeColumns = [
  {
    title: '员工姓名',
    key: 'name',
    width: 100,
    render: (row: any) =>
      h('n-text', { strong: true }, { default: () => row.name })
  },
  {
    title: '所属部门',
    key: 'departmentName',
    width: 130
  },
  {
    title: '当前标签奖金',
    key: 'currentTagBonus',
    width: 140,
    render: (row: any) =>
      h('n-text', { type: 'success' }, { default: () => '+' + formatCurrency(row.currentTagBonus) })
  },
  {
    title: '潜在减少金额',
    key: 'potentialLoss',
    width: 140,
    render: (row: any) =>
      h('n-text', { type: 'error', strong: true }, { default: () => '-' + formatCurrency(row.potentialLoss) })
  }
]
</script>
