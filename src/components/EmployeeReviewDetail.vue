<template>
  <n-card title="员工年度薪酬详情">
    <n-space vertical :size="16" style="width: 100%">
      <n-space align="center" :size="20">
        <n-avatar round style="background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%); width: 64px; height: 64px; font-size: 24px">
          {{ review.employeeName.charAt(0) }}
        </n-avatar>
        <n-space vertical :size="4" style="flex: 1">
          <n-text strong style="font-size: 20px">{{ review.employeeName }}</n-text>
          <n-space>
            <n-tag size="small">{{ review.departmentName }}</n-tag>
            <n-tag size="small" type="info">{{ review.position }}</n-tag>
            <n-tag size="small" type="success">年末月薪：{{ formatMoney(review.endSalary) }}</n-tag>
            <n-tag
              size="small"
              :type="review.salaryGrowthRate >= 0 ? 'success' : 'error'"
            >
              年增长：{{ review.salaryGrowthRate >= 0 ? '+' : '' }}{{ (review.salaryGrowthRate * 100).toFixed(2) }}%
            </n-tag>
          </n-space>
        </n-space>
      </n-space>

      <n-grid :cols="4" :x-gap="16">
        <n-gi>
          <div class="mini-stat sc-salary">
            <div class="mini-label">年初薪资</div>
            <div class="mini-value">{{ formatMoney(review.startSalary) }}</div>
          </div>
        </n-gi>
        <n-gi>
          <div class="mini-stat sc-growth">
            <div class="mini-label">薪资增长</div>
            <div class="mini-value">
              +{{ formatMoney(review.endSalary - review.startSalary) }}
            </div>
          </div>
        </n-gi>
        <n-gi>
          <div class="mini-stat sc-bonus">
            <div class="mini-label">年度奖金</div>
            <div class="mini-value">{{ formatMoney(review.summary.totalBonusGross) }}</div>
          </div>
        </n-gi>
        <n-gi>
          <div class="mini-stat sc-total">
            <div class="mini-label">年度总包</div>
            <div class="mini-value">{{ formatMoney(review.summary.totalCompensationGross) }}</div>
          </div>
        </n-gi>
      </n-grid>

      <n-divider style="margin: 8px 0" />

      <n-grid :cols="2" :x-gap="16">
        <n-gi>
          <n-card size="small" title="薪资趋势">
            <template v-if="review.salaryTrend.length > 0">
              <n-space vertical :size="8" style="width: 100%">
                <div
                  v-for="(point, index) in review.salaryTrend"
                  :key="index"
                  class="trend-item"
                >
                  <div class="trend-date">{{ point.label }}</div>
                  <div class="trend-info">
                    <span class="trend-salary">{{ formatMoney(point.baseSalary) }}</span>
                    <span v-if="point.adjustmentAmount > 0" class="trend-change">
                      +{{ formatMoney(point.adjustmentAmount) }}
                    </span>
                  </div>
                  <div v-if="point.adjustmentAmount > 0" class="trend-reason">
                    {{ point.reasonName }}
                  </div>
                </div>
              </n-space>
            </template>
            <n-empty v-else description="暂无薪资数据" />
          </n-card>
        </n-gi>

        <n-gi>
          <n-card size="small" title="奖金趋势">
            <template v-if="review.bonusTrend.length > 0">
              <n-space vertical :size="8" style="width: 100%">
                <div
                  v-for="(bonus, index) in review.bonusTrend"
                  :key="index"
                  class="trend-item"
                >
                  <div class="trend-date">{{ bonus.name }}</div>
                  <div class="trend-info">
                    <span class="trend-salary">{{ formatMoney(bonus.netAmount) }}</span>
                    <span class="trend-type">
                      {{ getBonusTypeLabel(bonus.type) }}
                    </span>
                  </div>
                  <div class="trend-reason">
                    税前 {{ formatMoney(bonus.grossAmount) }}，扣税 {{ formatMoney(bonus.taxAmount) }}
                  </div>
                </div>
              </n-space>
            </template>
            <n-empty v-else description="暂无奖金数据" />
          </n-card>
        </n-gi>
      </n-grid>

      <n-card size="small" title="绩效趋势">
        <template v-if="review.performanceTrend.length > 0">
          <n-space :size="16" align="center">
            <div
              v-for="(perf, index) in review.performanceTrend"
              :key="index"
              class="perf-item"
            >
              <div class="perf-period">{{ getHalfLabel(perf.half) }}</div>
              <n-tag
                :color="getPerformanceLevelColor(perf.levelName)"
                size="large"
                bordered
              >
                {{ perf.levelName }}
              </n-tag>
              <div class="perf-coeff">系数 {{ perf.coefficient }}x</div>
              <div v-if="perf.comment" class="perf-comment">{{ perf.comment }}</div>
            </div>
          </n-space>
        </template>
        <n-empty v-else description="暂无绩效数据" />
      </n-card>

      <n-card size="small" title="洞察与建议">
        <n-grid :cols="2" :x-gap="16">
          <n-gi>
            <div class="insight-item">
              <n-icon size="18" color="#1890ff"><BarChartOutlined /></n-icon>
              <n-space vertical :size="2">
                <n-text depth="3" style="font-size: 12px">薪资定位</n-text>
                <n-text strong>{{ review.insights.salaryPosition }}</n-text>
              </n-space>
            </div>
          </n-gi>
          <n-gi>
            <div class="insight-item">
              <n-icon size="18" color="#52c41a"><WalletOutlined /></n-icon>
              <n-space vertical :size="2">
                <n-text depth="3" style="font-size: 12px">奖金定位</n-text>
                <n-text strong>{{ review.insights.bonusPosition }}</n-text>
              </n-space>
            </div>
          </n-gi>
          <n-gi>
            <div class="insight-item">
              <n-icon size="18" color="#722ed1"><RiseOutlined /></n-icon>
              <n-space vertical :size="2">
                <n-text depth="3" style="font-size: 12px">绩效趋势</n-text>
                <n-text strong>{{ review.insights.performanceTrend }}</n-text>
              </n-space>
            </div>
          </n-gi>
          <n-gi>
            <div class="insight-item">
              <n-icon size="18" color="#fa8c16"><BulbOutlined /></n-icon>
              <n-space vertical :size="2">
                <n-text depth="3" style="font-size: 12px">建议</n-text>
                <n-text strong>{{ review.competitiveness && review.competitiveness.recommendations.length > 0 ? '基于市场对标分析' : '基于内部数据分析' }}</n-text>
              </n-space>
            </div>
          </n-gi>
          <n-gi v-if="review.insights.marketPosition">
            <div class="insight-item">
              <n-icon size="18" color="#13c2c2"><TrendingUpOutlined /></n-icon>
              <n-space vertical :size="2">
                <n-text depth="3" style="font-size: 12px">市场定位</n-text>
                <n-text strong>{{ review.insights.marketPosition }}</n-text>
              </n-space>
            </div>
          </n-gi>
          <n-gi v-if="review.insights.competitiveness && review.competitiveness">
            <div class="insight-item">
              <n-icon size="18" :color="store.getCompetitivenessLevelColor(review.competitiveness.competitivenessLevel)">
                <TrophyOutlined />
              </n-icon>
              <n-space vertical :size="2">
                <n-text depth="3" style="font-size: 12px">薪酬竞争力</n-text>
                <n-tag
                  :color="store.getCompetitivenessLevelColor(review.competitiveness.competitivenessLevel)"
                  size="small"
                  style="width: fit-content"
                >
                  {{ review.insights.competitiveness }}
                </n-tag>
              </n-space>
            </div>
          </n-gi>
        </n-grid>
      </n-card>

      <n-card v-if="review.competitiveness" size="small" title="市场薪酬分位对标">
        <n-space vertical :size="16" style="width: 100%">
          <n-space justify="space-between" align="center" style="width: 100%">
            <n-space :size="12">
              <n-tag size="small" type="info">{{ review.competitiveness.benchmarkData.positionLevel }}</n-tag>
              <n-tag size="small">{{ review.competitiveness.benchmarkData.city }}</n-tag>
              <n-tag size="small" type="success">{{ review.competitiveness.benchmarkData.industry }}</n-tag>
            </n-space>
            <n-text depth="3" style="font-size: 12px">
              数据来源：{{ review.competitiveness.benchmarkData.dataSource }} · {{ review.competitiveness.benchmarkData.updatedAt }}
            </n-text>
          </n-space>

          <n-space vertical :size="12" style="width: 100%">
            <n-text strong style="font-size: 14px">月薪分位对标</n-text>
            <div class="percentile-chart">
              <div class="percentile-bar">
                <div
                  v-for="(percentile, key) in review.competitiveness.benchmarkData.baseSalary"
                  :key="key"
                  class="percentile-segment"
                  :style="{ width: getPercentileSegmentWidth(key) + '%' }"
                >
                  <div class="percentile-label">{{ key.toUpperCase() }}</div>
                  <div class="percentile-value">{{ formatMoney(percentile) }}</div>
                </div>
              </div>
              <div
                class="current-marker"
                :style="{ left: getPercentilePosition(review.competitiveness.baseSalaryPercentile) + '%' }"
              >
                <div class="marker-arrow"></div>
                <div class="marker-label">
                  当前：{{ formatMoney(review.competitiveness.baseSalary) }}
                  <br />
                  <span style="font-weight: 600">分位 {{ review.competitiveness.baseSalaryPercentile }}%</span>
                </div>
              </div>
            </div>
          </n-space>

          <n-space vertical :size="12" style="width: 100%">
            <n-text strong style="font-size: 14px">年度总包分位对标</n-text>
            <div class="percentile-chart">
              <div class="percentile-bar">
                <div
                  v-for="(percentile, key) in review.competitiveness.benchmarkData.totalCompensation"
                  :key="key"
                  class="percentile-segment"
                  :style="{ width: getPercentileSegmentWidth(key) + '%' }"
                >
                  <div class="percentile-label">{{ key.toUpperCase() }}</div>
                  <div class="percentile-value">{{ formatMoney(percentile) }}</div>
                </div>
              </div>
              <div
                class="current-marker"
                :style="{ left: getPercentilePosition(review.competitiveness.totalCompensationPercentile) + '%' }"
              >
                <div class="marker-arrow"></div>
                <div class="marker-label">
                  当前：{{ formatMoney(review.competitiveness.totalCompensation) }}
                  <br />
                  <span style="font-weight: 600">分位 {{ review.competitiveness.totalCompensationPercentile }}%</span>
                </div>
              </div>
            </div>
          </n-space>

          <n-grid :cols="5" :x-gap="12">
            <n-gi v-for="key in percentileKeys" :key="key">
              <div
                class="vs-market-card"
                :class="{ 'positive': getBaseSalaryVsMarket(key) >= 0, 'negative': getBaseSalaryVsMarket(key) < 0 }"
              >
                <div class="vs-label">vs {{ formatPercentileLabel(key) }}</div>
                <div class="vs-value">
                  {{ getBaseSalaryVsMarket(key) >= 0 ? '+' : '' }}
                  {{ (getBaseSalaryVsMarket(key) * 100).toFixed(1) }}%
                </div>
              </div>
            </n-gi>
          </n-grid>
        </n-space>
      </n-card>

      <n-card v-if="review.competitiveness" size="small" title="个人薪酬竞争力评估">
        <n-grid :cols="3" :x-gap="16">
          <n-gi>
            <div class="assessment-card">
              <div class="assessment-icon" style="background: #fff7e6">
                <n-icon size="24" color="#fa8c16"><LineChartOutlined /></n-icon>
              </div>
              <n-space vertical :size="4" style="flex: 1">
                <n-text depth="3" style="font-size: 12px">市场增长率</n-text>
                <n-text strong style="font-size: 18px">
                  {{ (review.competitiveness.marketGrowthRate * 100).toFixed(1) }}%
                </n-text>
              </n-space>
            </div>
          </n-gi>
          <n-gi>
            <div class="assessment-card">
              <div class="assessment-icon" style="background: #f6ffed">
                <n-icon size="24" color="#52c41a"><ArrowUpOutlined /></n-icon>
              </div>
              <n-space vertical :size="4" style="flex: 1">
                <n-text depth="3" style="font-size: 12px">个人增长率</n-text>
                <n-text
                  strong
                  style="font-size: 18px"
                  :style="{ color: review.competitiveness.personalGrowthRate >= review.competitiveness.marketGrowthRate ? '#52c41a' : '#fa8c16' }"
                >
                  {{ review.competitiveness.personalGrowthRate >= 0 ? '+' : '' }}
                  {{ (review.competitiveness.personalGrowthRate * 100).toFixed(1) }}%
                </n-text>
              </n-space>
            </div>
          </n-gi>
          <n-gi>
            <div class="assessment-card">
              <div
                class="assessment-icon"
                :style="{ background: review.competitiveness.historicalAdjustments.vsMarketGrowth >= 0 ? '#f6ffed' : '#fff1f0' }"
              >
                <n-icon
                  size="24"
                  :color="review.competitiveness.historicalAdjustments.vsMarketGrowth >= 0 ? '#52c41a' : '#f5222d'"
                >
                  <ThunderboltOutlined />
                </n-icon>
              </div>
              <n-space vertical :size="4" style="flex: 1">
                <n-text depth="3" style="font-size: 12px">增长vs市场</n-text>
                <n-text
                  strong
                  style="font-size: 18px"
                  :style="{ color: review.competitiveness.historicalAdjustments.vsMarketGrowth >= 0 ? '#52c41a' : '#f5222d' }"
                >
                  {{ review.competitiveness.historicalAdjustments.vsMarketGrowth >= 0 ? '+' : '' }}
                  {{ (review.competitiveness.historicalAdjustments.vsMarketGrowth * 100).toFixed(1) }}%
                </n-text>
              </n-space>
            </div>
          </n-gi>
        </n-grid>

        <n-divider style="margin: 16px 0" />

        <n-grid :cols="4" :x-gap="16">
          <n-gi>
            <div class="stat-box">
              <div class="stat-label">当年调薪次数</div>
              <div class="stat-num">{{ review.competitiveness.historicalAdjustments.count }} 次</div>
            </div>
          </n-gi>
          <n-gi>
            <div class="stat-box">
              <div class="stat-label">当年调薪总额</div>
              <div class="stat-num">{{ formatMoney(review.competitiveness.historicalAdjustments.totalAmount) }}</div>
            </div>
          </n-gi>
          <n-gi>
            <div class="stat-box">
              <div class="stat-label">当年平均调薪幅度</div>
              <div class="stat-num">{{ (review.competitiveness.historicalAdjustments.averageRatio * 100).toFixed(1) }}%</div>
            </div>
          </n-gi>
          <n-gi>
            <div class="stat-box" :class="'risk-' + review.competitiveness.riskLevel">
              <div class="stat-label">流失风险</div>
              <div class="stat-num">{{ review.competitiveness.retentionRisk }}</div>
            </div>
          </n-gi>
        </n-grid>

        <n-divider style="margin: 16px 0" />

        <n-grid :cols="4" :x-gap="16">
          <n-gi>
            <div class="stat-box" style="background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)">
              <div class="stat-label">历史调薪次数</div>
              <div class="stat-num">{{ review.competitiveness.historicalAdjustments.multiYearCount }} 次</div>
            </div>
          </n-gi>
          <n-gi>
            <div class="stat-box" style="background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)">
              <div class="stat-label">历史累计调薪额</div>
              <div class="stat-num">{{ formatMoney(review.competitiveness.historicalAdjustments.multiYearTotalAmount) }}</div>
            </div>
          </n-gi>
          <n-gi>
            <div class="stat-box" style="background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)">
              <div class="stat-label">年均调薪幅度</div>
              <div class="stat-num">{{ (review.competitiveness.historicalAdjustments.multiYearAverageRatio * 100).toFixed(1) }}%</div>
            </div>
          </n-gi>
          <n-gi>
            <div class="stat-box" style="background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)">
              <div class="stat-label">年复合增长率</div>
              <div class="stat-num">{{ (review.competitiveness.historicalAdjustments.cagr * 100).toFixed(1) }}%</div>
            </div>
          </n-gi>
        </n-grid>

        <n-divider style="margin: 16px 0" />

        <n-space vertical :size="12" style="width: 100%">
          <n-text strong style="font-size: 14px">差距分析</n-text>
          <n-grid :cols="3" :x-gap="16">
            <n-gi>
              <div class="gap-card">
                <div class="gap-label">当前差距</div>
                <div class="gap-amount" :style="{ color: review.competitiveness.gapAnalysis.currentGapAmount > 0 ? '#f5222d' : '#52c41a' }">
                  {{ review.competitiveness.gapAnalysis.currentGapAmount > 0 ? '-' : '+' }}
                  {{ formatMoney(Math.abs(review.competitiveness.gapAnalysis.currentGapAmount)) }}
                </div>
                <div class="gap-percent">
                  {{ review.competitiveness.gapAnalysis.currentGapAmount > 0 ? '低于' : '高于' }}市场中位数
                  {{ (Math.abs(review.competitiveness.gapAnalysis.currentGapPercent) * 100).toFixed(1) }}%
                </div>
              </div>
            </n-gi>
            <n-gi>
              <div class="gap-card">
                <div class="gap-label">1年后预计差距</div>
                <div class="gap-amount" :style="{ color: review.competitiveness.gapAnalysis.projectedGapIn1Year > 0 ? '#f5222d' : '#52c41a' }">
                  {{ review.competitiveness.gapAnalysis.projectedGapIn1Year > 0 ? '-' : '+' }}
                  {{ formatMoney(Math.abs(review.competitiveness.gapAnalysis.projectedGapIn1Year)) }}
                </div>
                <div class="gap-percent">按当前增长趋势预测</div>
              </div>
            </n-gi>
            <n-gi>
              <div class="gap-card">
                <div class="gap-label">2年后预计差距</div>
                <div class="gap-amount" :style="{ color: review.competitiveness.gapAnalysis.projectedGapIn2Year > 0 ? '#f5222d' : '#52c41a' }">
                  {{ review.competitiveness.gapAnalysis.projectedGapIn2Year > 0 ? '-' : '+' }}
                  {{ formatMoney(Math.abs(review.competitiveness.gapAnalysis.projectedGapIn2Year)) }}
                </div>
                <div class="gap-percent">按当前增长趋势预测</div>
              </div>
            </n-gi>
          </n-grid>
        </n-space>
      </n-card>

      <n-card v-if="review.competitiveness && review.competitiveness.recommendations.length > 0" size="small" title="调薪建议（基于市场对标分析）">
        <n-space vertical :size="10" style="width: 100%">
          <div
            v-for="(rec, index) in review.competitiveness.recommendations"
            :key="index"
            class="recommendation-item"
          >
            <div class="rec-number">{{ index + 1 }}</div>
            <div class="rec-content">{{ rec }}</div>
          </div>
        </n-space>
      </n-card>

      <n-card v-else-if="review.insights.recommendation" size="small" title="调薪建议（基于内部数据分析）">
        <div class="recommendation-item">
          <div class="rec-number">1</div>
          <div class="rec-content">{{ review.insights.recommendation }}</div>
        </div>
      </n-card>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import type { EmployeeAnnualReview } from '@/types'
import { useSalaryAdjustmentStore } from '@/stores/salaryAdjustment'
import {
  BarChartOutlined,
  WalletOutlined,
  RiseOutlined,
  BulbOutlined,
  RiseOutlined as TrendingUpOutlined,
  TrophyOutlined,
  LineChartOutlined,
  ArrowUpOutlined,
  ThunderboltOutlined
} from '@vicons/antd'

const props = defineProps<{
  review: EmployeeAnnualReview
}>()

const store = useSalaryAdjustmentStore()

function formatMoney(n: number): string {
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getBonusTypeLabel(type: string): string {
  return store.getBonusTypeLabel(type)
}

function getHalfLabel(half: string): string {
  const map: Record<string, string> = {
    first: '上半年',
    second: '下半年',
    annual: '年度'
  }
  return map[half] || half
}

function getPerformanceLevelColor(levelName: string): string {
  return store.getPerformanceLevelColor(levelName)
}

function getPercentileSegmentWidth(key: string): number {
  const widths: Record<string, number> = { p10: 15, p25: 15, p50: 25, p75: 25, p90: 20 }
  return widths[key] || 20
}

function getPercentilePosition(percentile: number): number {
  return Math.max(2, Math.min(98, percentile))
}

type PercentileKey = 'p10' | 'p25' | 'p50' | 'p75' | 'p90'
type VsMarketKey = 'vsP10' | 'vsP25' | 'vsP50' | 'vsP75' | 'vsP90'

const percentileKeys: PercentileKey[] = ['p10', 'p25', 'p50', 'p75', 'p90']

function toVsMarketKey(key: PercentileKey): VsMarketKey {
  return `vs${key.charAt(0).toUpperCase()}${key.slice(1)}` as VsMarketKey
}

function getBaseSalaryVsMarket(key: PercentileKey): number {
  if (!props.review.competitiveness) return 0
  const vsKey = toVsMarketKey(key)
  return props.review.competitiveness.baseSalaryVsMarket[vsKey]
}

function formatPercentileLabel(key: PercentileKey): string {
  return key.toUpperCase()
}
</script>

<style scoped>
.mini-stat {
  padding: 14px;
  border-radius: 8px;
  text-align: center;
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%);
}
.mini-stat.sc-salary {
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
}
.mini-stat.sc-growth {
  background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
}
.mini-stat.sc-bonus {
  background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
}
.mini-stat.sc-total {
  background: linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%);
}
.mini-label {
  font-size: 12px;
  color: #595959;
  margin-bottom: 4px;
}
.mini-value {
  font-size: 18px;
  font-weight: 700;
  color: #262626;
}

.trend-item {
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.trend-date {
  font-size: 13px;
  font-weight: 600;
  color: #262626;
}
.trend-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.trend-salary {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}
.trend-change {
  font-size: 12px;
  color: #52c41a;
  background: #f6ffed;
  padding: 2px 8px;
  border-radius: 4px;
}
.trend-type {
  font-size: 12px;
  color: #8c8c8c;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
}
.trend-reason {
  font-size: 12px;
  color: #8c8c8c;
}

.perf-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  background: #fafafa;
  border-radius: 8px;
  min-width: 120px;
}
.perf-period {
  font-size: 12px;
  color: #8c8c8c;
}
.perf-coeff {
  font-size: 13px;
  color: #595959;
}
.perf-comment {
  font-size: 12px;
  color: #8c8c8c;
  text-align: center;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.insight-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.percentile-chart {
  position: relative;
  padding: 50px 0 30px;
}

.percentile-bar {
  display: flex;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.percentile-segment {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 11px;
  position: relative;
}

.percentile-segment:nth-child(1) {
  background: linear-gradient(135deg, #ffccc7 0%, #ffa39e 100%);
}

.percentile-segment:nth-child(2) {
  background: linear-gradient(135deg, #ffd591 0%, #ffc069 100%);
}

.percentile-segment:nth-child(3) {
  background: linear-gradient(135deg, #91d5ff 0%, #69c0ff 100%);
}

.percentile-segment:nth-child(4) {
  background: linear-gradient(135deg, #95de64 0%, #73d13d 100%);
}

.percentile-segment:nth-child(5) {
  background: linear-gradient(135deg, #b37feb 0%, #9254de 100%);
}

.percentile-label {
  font-weight: 700;
  font-size: 12px;
}

.percentile-value {
  font-size: 10px;
  opacity: 0.95;
}

.current-marker {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  z-index: 10;
}

.marker-arrow {
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 12px solid #1f1f1f;
  margin: 0 auto;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.marker-label {
  background: #1f1f1f;
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 11px;
  text-align: center;
  margin-top: 2px;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  line-height: 1.5;
}

.vs-market-card {
  text-align: center;
  padding: 12px 8px;
  border-radius: 8px;
  background: #fafafa;
}

.vs-market-card.positive {
  background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
}

.vs-market-card.negative {
  background: linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%);
}

.vs-label {
  font-size: 12px;
  color: #595959;
  margin-bottom: 4px;
}

.vs-value {
  font-size: 16px;
  font-weight: 700;
}

.vs-market-card.positive .vs-value {
  color: #52c41a;
}

.vs-market-card.negative .vs-value {
  color: #f5222d;
}

.assessment-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fafafa;
  border-radius: 10px;
}

.assessment-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-box {
  text-align: center;
  padding: 14px;
  background: #fafafa;
  border-radius: 8px;
}

.stat-box.risk-high {
  background: linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%);
}

.stat-box.risk-medium {
  background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
}

.stat-box.risk-low {
  background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
}

.stat-label {
  font-size: 12px;
  color: #595959;
  margin-bottom: 4px;
}

.stat-num {
  font-size: 18px;
  font-weight: 700;
  color: #262626;
}

.gap-card {
  text-align: center;
  padding: 16px;
  background: #fafafa;
  border-radius: 10px;
}

.gap-label {
  font-size: 12px;
  color: #595959;
  margin-bottom: 6px;
}

.gap-amount {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
}

.gap-percent {
  font-size: 12px;
  color: #8c8c8c;
}

.recommendation-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%);
  border-radius: 8px;
  border-left: 4px solid #1890ff;
}

.rec-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #1890ff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.rec-content {
  flex: 1;
  font-size: 13px;
  line-height: 1.6;
  color: #262626;
}
</style>
