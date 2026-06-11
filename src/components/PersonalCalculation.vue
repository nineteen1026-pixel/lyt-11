<template>
  <n-card>
    <template #header>
      <n-space align="center" style="width: 100%" justify="space-between">
        <n-space align="center">
          <n-icon size="20" color="#2080f0">
            <CalculatorOutlined />
          </n-icon>
          <n-text strong style="font-size: 16px">个人测算结果</n-text>
        </n-space>
        <n-tag :type="betterTagType" round>
          更优方案：{{ betterMethodText }}
          <template #avatar v-if="result.savedTax > 0">
            <n-tag round type="success" size="small" style="margin-left: 6px">
              省税 {{ formatCurrency(result.savedTax) }}
            </n-tag>
          </template>
        </n-tag>
      </n-space>
    </template>

    <n-grid :cols="2" :x-gap="24" :y-gap="16" responsive="screen">
      <n-gi span="2 m:1">
        <n-descriptions :column="1" bordered>
          <n-descriptions-item label="部门 / 姓名">
            {{ result.departmentName }} · {{ result.employeeName }}
          </n-descriptions-item>
          <n-descriptions-item label="基础金额">
            <n-text type="info">{{ formatCurrency(result.baseAmount) }}</n-text>
            <n-text depth="3" style="margin-left: 8px">月薪 × 倍数</n-text>
          </n-descriptions-item>
          <n-descriptions-item label="绩效加成">
            <n-text type="success">{{ formatCurrency(result.performanceBonus) }}</n-text>
          </n-descriptions-item>
          <n-descriptions-item label="工龄加成">
            <n-text type="success">{{ formatCurrency(result.tenureBonus) }}</n-text>
          </n-descriptions-item>
          <n-descriptions-item label="部门分配调整">
            <n-text :type="result.departmentAllocation >= 0 ? 'success' : 'warning'">
              {{ result.departmentAllocation >= 0 ? '+' : '' }}{{ formatCurrency(result.departmentAllocation) }}
            </n-text>
          </n-descriptions-item>
          <n-descriptions-item label="年终奖税前总额" label-style="font-weight: 600">
            <n-text strong style="font-size: 18px; color: #d03050">
              {{ formatCurrency(result.grossBonus) }}
            </n-text>
          </n-descriptions-item>
        </n-descriptions>
      </n-gi>

      <n-gi span="2 m:1">
        <n-space vertical style="width: 100%" :size="16">
          <n-statistic label="一次性税款（单独计税）" :value="result.taxOneTime">
            <template #prefix>
              <n-icon><TaxiOutlined /></n-icon>
            </template>
            <template #suffix>元</template>
          </n-statistic>
          <n-statistic label="并入综合所得税款" :value="result.taxComprehensive">
            <template #prefix>
              <n-icon><MergeOutlined /></n-icon>
            </template>
            <template #suffix>元</template>
          </n-statistic>
          <n-divider />
          <n-alert
            :type="betterTagType === 'success' ? 'success' : 'warning'"
            :show-icon="true"
            :title="betterMethodText + '更优'"
          >
            两种方案差异：
            <n-text strong>{{ formatCurrency(Math.abs(result.taxOneTime - result.taxComprehensive)) }}</n-text>
            建议选择标绿的计税方式，省税更多。
          </n-alert>
        </n-space>
      </n-gi>
    </n-grid>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RiseOutlined as CalculatorOutlined, DollarOutlined as TaxiOutlined, SwitcherFilled as MergeOutlined } from '@vicons/antd'
import type { PersonalCalculationResult } from '@/types'
import { formatCurrency } from '@/utils/tax'

const props = defineProps<{
  result: PersonalCalculationResult
}>()

const betterMethodText = computed(() =>
  props.result.betterMethod === 'oneTime' ? '一次性单独计税' : '并入综合所得'
)

const betterTagType = computed(() => {
  if (props.result.savedTax > 0) return 'success'
  return 'info'
})
</script>
