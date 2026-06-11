<template>
  <n-card>
    <template #header>
      <n-space align="center">
        <n-icon size="20" color="#f0a020">
          <BarChartOutlined />
        </n-icon>
        <n-text strong style="font-size: 16px">计税方式对比详情</n-text>
      </n-space>
    </template>

    <n-tabs type="segment" animated style="margin-bottom: 16px">
      <n-tab-pane name="oneTime" tab="方案一：一次性单独计税">
        <n-descriptions :column="2" bordered size="medium">
          <n-descriptions-item label="年终奖税前">
            {{ formatCurrency(result.grossBonus) }}
          </n-descriptions-item>
          <n-descriptions-item label="分摊月金额">
            {{ formatCurrency(result.grossBonus / 12) }}
            <n-text depth="3" style="margin-left: 6px">（÷12）</n-text>
          </n-descriptions-item>
          <n-descriptions-item label="适用税率">
            <n-tag type="warning">{{ (oneTimeBracket.rate * 100).toFixed(0) }}%</n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="速算扣除数">
            {{ formatCurrency(oneTimeBracket.quickDeduction) }}
          </n-descriptions-item>
          <n-descriptions-item label="计算公式" :span="2">
            <n-text code>
              应纳税额 = {{ formatCurrency(result.grossBonus) }} × {{ (oneTimeBracket.rate * 100).toFixed(0) }}% − {{ oneTimeBracket.quickDeduction }}
              = {{ formatCurrency(result.taxOneTime) }}
            </n-text>
          </n-descriptions-item>
          <n-descriptions-item label="应缴税款">
            <n-text type="error" strong>{{ formatCurrency(result.taxOneTime) }}</n-text>
          </n-descriptions-item>
          <n-descriptions-item label="税后到手">
            <n-text type="success" strong style="font-size: 16px">
              {{ formatCurrency(result.netBonusOneTime) }}
            </n-text>
          </n-descriptions-item>
        </n-descriptions>
      </n-tab-pane>

      <n-tab-pane name="comprehensive" tab="方案二：并入综合所得">
        <n-descriptions :column="2" bordered size="medium">
          <n-descriptions-item label="年度薪资收入">
            {{ formatCurrency(comprehensiveInfo.annualSalary) }}
          </n-descriptions-item>
          <n-descriptions-item label="年终奖">
            {{ formatCurrency(result.grossBonus) }}
          </n-descriptions-item>
          <n-descriptions-item label="基本减除费用">
            <n-text type="info">− {{ formatCurrency(60000) }}</n-text>
          </n-descriptions-item>
          <n-descriptions-item label="专项扣除（社保等）">
            <n-text type="info">− {{ formatCurrency(comprehensiveInfo.specialDeduction) }}</n-text>
          </n-descriptions-item>
          <n-descriptions-item label="专项附加扣除">
            <n-text type="info">− {{ formatCurrency(comprehensiveInfo.specialAdditionalDeduction) }}</n-text>
          </n-descriptions-item>
          <n-descriptions-item label="其他扣除">
            <n-text type="info">− {{ formatCurrency(comprehensiveInfo.otherDeduction) }}</n-text>
          </n-descriptions-item>
        </n-descriptions>

        <n-divider style="margin: 16px 0" />

        <n-grid :cols="2" :x-gap="24">
          <n-descriptions :column="1" bordered size="small">
            <n-descriptions-item label="无年终奖的应纳税所得额">
              {{ formatCurrency(Math.max(0, taxableWithout)) }}
            </n-descriptions-item>
            <n-descriptions-item label="适用税率">
              <n-tag size="small" type="warning">{{ (withoutBracket.rate * 100).toFixed(0) }}%</n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="应缴税款A">
              <n-text type="error">{{ formatCurrency(taxWithoutBonus) }}</n-text>
            </n-descriptions-item>
          </n-descriptions>

          <n-descriptions :column="1" bordered size="small">
            <n-descriptions-item label="含年终奖的应纳税所得额">
              {{ formatCurrency(Math.max(0, taxableWith)) }}
            </n-descriptions-item>
            <n-descriptions-item label="适用税率">
              <n-tag size="small" type="warning">{{ (withBracket.rate * 100).toFixed(0) }}%</n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="应缴税款B">
              <n-text type="error">{{ formatCurrency(taxWithBonus) }}</n-text>
            </n-descriptions-item>
          </n-descriptions>
        </n-grid>

        <n-alert type="info" :show-icon="true" style="margin-top: 16px">
          年终奖对应税款 = B − A =
          <n-text type="error" strong>{{ formatCurrency(result.taxComprehensive) }}</n-text>
          ，税后到手：
          <n-text type="success" strong style="font-size: 16px">
            {{ formatCurrency(result.netBonusComprehensive) }}
          </n-text>
        </n-alert>
      </n-tab-pane>
    </n-tabs>

    <n-divider />

    <n-space justify="space-around" align="center" style="padding: 8px">
      <div class="compare-item">
        <div class="compare-label">方案一：单独计税</div>
        <div class="compare-value one-time" :class="{ better: result.betterMethod === 'oneTime' }">
          {{ formatCurrency(result.netBonusOneTime) }}
        </div>
      </div>
      <n-icon size="28" color="#d03050">
        <SwapOutlined />
      </n-icon>
      <div class="compare-item">
        <div class="compare-label">方案二：并入综合</div>
        <div class="compare-value comprehensive" :class="{ better: result.betterMethod === 'comprehensive' }">
          {{ formatCurrency(result.netBonusComprehensive) }}
        </div>
      </div>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BarsOutlined as BarChartOutlined, SwapOutlined } from '@vicons/antd'
import type { PersonalCalculationResult, ComprehensiveIncomeInfo, TaxBracket } from '@/types'
import {
  ONE_TIME_TAX_BRACKETS,
  COMPREHENSIVE_TAX_BRACKETS,
  STANDARD_DEDUCTION,
  formatCurrency
} from '@/utils/tax'

const props = defineProps<{
  result: PersonalCalculationResult
  comprehensiveInfo: ComprehensiveIncomeInfo
}>()

const monthlyBonus = computed(() => props.result.grossBonus / 12)
const oneTimeBracket = computed<TaxBracket>(
  () =>
    ONE_TIME_TAX_BRACKETS.find((b) => monthlyBonus.value > b.min && monthlyBonus.value <= b.max) ||
    ONE_TIME_TAX_BRACKETS[0]
)

const ci = computed(() => props.comprehensiveInfo)
const taxableWith = computed(
  () =>
    ci.value.annualSalary +
    props.result.grossBonus -
    STANDARD_DEDUCTION -
    ci.value.specialDeduction -
    ci.value.specialAdditionalDeduction -
    ci.value.otherDeduction
)
const taxableWithout = computed(
  () =>
    ci.value.annualSalary -
    STANDARD_DEDUCTION -
    ci.value.specialDeduction -
    ci.value.specialAdditionalDeduction -
    ci.value.otherDeduction
)

const withBracket = computed<TaxBracket>(
  () =>
    COMPREHENSIVE_TAX_BRACKETS.find(
      (b) => Math.max(0, taxableWith.value) > b.min && Math.max(0, taxableWith.value) <= b.max
    ) || COMPREHENSIVE_TAX_BRACKETS[0]
)
const withoutBracket = computed<TaxBracket>(
  () =>
    COMPREHENSIVE_TAX_BRACKETS.find(
      (b) => Math.max(0, taxableWithout.value) > b.min && Math.max(0, taxableWithout.value) <= b.max
    ) || COMPREHENSIVE_TAX_BRACKETS[0]
)

const taxWithBonus = computed(
  () => Math.max(0, Math.max(0, taxableWith.value)) * withBracket.value.rate - withBracket.value.quickDeduction
)
const taxWithoutBonus = computed(
  () => Math.max(0, Math.max(0, taxableWithout.value)) * withoutBracket.value.rate - withoutBracket.value.quickDeduction
)
</script>

<style scoped>
.compare-item {
  text-align: center;
}
.compare-label {
  font-size: 14px;
  color: #999;
  margin-bottom: 8px;
}
.compare-value {
  font-size: 24px;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 8px;
}
.compare-value.one-time {
  color: #2080f0;
  background: rgba(32, 128, 240, 0.08);
}
.compare-value.comprehensive {
  color: #18a058;
  background: rgba(24, 160, 88, 0.08);
}
.compare-value.better {
  box-shadow: 0 0 0 2px currentColor, 0 8px 16px rgba(0, 0, 0, 0.08);
  transform: scale(1.05);
}
</style>
