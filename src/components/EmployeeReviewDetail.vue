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
                <n-text strong>{{ review.insights.recommendation }}</n-text>
              </n-space>
            </div>
          </n-gi>
        </n-grid>
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
  BulbOutlined
} from '@vicons/antd'

defineProps<{
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
</style>
