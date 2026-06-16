<template>
  <n-card title="奖金方案沙盘推演" :bordered="false">
    <n-space vertical :size="20" style="width: 100%">
      <n-space justify="space-between" style="width: 100%">
        <n-space>
          <n-tag type="info" v-if="baselineScenario">
            基准方案：{{ baselineScenario.name }}
          </n-tag>
          <n-tag>
            已激活对比：{{ store.activeSandboxScenarioIds.length }}/4
          </n-tag>
        </n-space>
        <n-space>
          <n-button size="small" @click="refreshAllMetrics">
            <template #icon><ReloadOutlined /></template>
            刷新全部指标
          </n-button>
          <n-button type="primary" size="small" @click="openCreateModal">
            <template #icon><AddOutlined /></template>
            新建方案
          </n-button>
        </n-space>
      </n-space>

      <n-tabs type="line" animated v-model:value="activeTab">
        <n-tab-pane name="scenarios" tab="方案管理">
          <n-space vertical :size="16" style="width: 100%">
            <div class="scenario-grid">
              <div
                v-for="scenario in store.sandboxScenarios"
                :key="scenario.id"
                class="scenario-card"
                :class="{ active: isActive(scenario.id), baseline: scenario.isBaseline }"
                :style="{ borderLeftColor: scenario.color }"
              >
                <n-card size="small">
                  <template #header>
                    <n-space justify="space-between" style="width: 100%">
                      <n-space>
                        <div
                          class="color-dot"
                          :style="{ backgroundColor: scenario.color }"
                        />
                        <n-text strong>{{ scenario.name }}</n-text>
                        <n-tag v-if="scenario.isBaseline" type="success" size="small">
                          基准
                        </n-tag>
                      </n-space>
                      <n-switch
                        :value="isActive(scenario.id)"
                        @update:value="() => toggleActive(scenario.id)"
                        size="small"
                      />
                    </n-space>
                  </template>

                  <n-text depth="3" style="font-size: 13px; display: block; margin-bottom: 12px">
                    {{ scenario.description }}
                  </n-text>

                  <n-descriptions :column="2" size="small" bordered>
                    <n-descriptions-item label="奖金池">
                      {{ formatCurrency(scenario.bonusPoolConfig.totalAmount) }}
                    </n-descriptions-item>
                    <n-descriptions-item label="基础倍数">
                      {{ scenario.bonusPoolConfig.baseRatio }}x
                    </n-descriptions-item>
                    <n-descriptions-item label="绩效占比">
                      {{ (scenario.bonusPoolConfig.performanceRatio * 100).toFixed(0) }}%
                    </n-descriptions-item>
                    <n-descriptions-item label="工龄占比">
                      {{ (scenario.bonusPoolConfig.tenureRatio * 100).toFixed(0) }}%
                    </n-descriptions-item>
                  </n-descriptions>

                  <n-divider style="margin: 12px 0" />

                  <div v-if="scenario.metrics">
                    <n-grid :cols="3" :x-gap="8" :y-gap="8">
                      <n-gi>
                        <n-statistic label="人均奖金" :value="scenario.metrics.averageBonus" precision="0">
                          <template #suffix>元</template>
                        </n-statistic>
                      </n-gi>
                      <n-gi>
                        <n-statistic label="中位数" :value="scenario.metrics.medianBonus" precision="0">
                          <template #suffix>元</template>
                        </n-statistic>
                      </n-gi>
                      <n-gi>
                        <n-statistic label="最高奖金" :value="scenario.metrics.maxBonus" precision="0">
                          <template #suffix>元</template>
                        </n-statistic>
                      </n-gi>
                    </n-grid>
                  </div>

                  <n-divider style="margin: 12px 0" />

                  <n-space justify="space-between" wrap>
                    <n-space>
                      <n-button size="tiny" quaternary @click="editScenario(scenario)">
                        <template #icon><EditOutlined /></template>
                        编辑
                      </n-button>
                      <n-button size="tiny" quaternary @click="duplicateScenario(scenario.id)">
                        <template #icon><CopyOutlined /></template>
                        复制
                      </n-button>
                      <n-button
                        size="tiny"
                        quaternary
                        type="success"
                        :disabled="scenario.isBaseline"
                        @click="setAsBaseline(scenario.id)"
                      >
                        <template #icon><StarOutlined /></template>
                        设为基准
                      </n-button>
                    </n-space>
                    <n-space>
                      <n-button
                        size="tiny"
                        type="primary"
                        quaternary
                        @click="applyScenario(scenario.id)"
                      >
                        <template #icon><CheckOutlined /></template>
                        应用方案
                      </n-button>
                      <n-button
                        size="tiny"
                        type="error"
                        quaternary
                        :disabled="scenario.isBaseline"
                        @click="deleteScenario(scenario.id, scenario.name)"
                      >
                        <template #icon><DeleteOutlined /></template>
                        删除
                      </n-button>
                    </n-space>
                  </n-space>
                </n-card>
              </div>
            </div>

            <n-alert type="info" :show-icon="true">
              最多可同时激活 4 个方案进行对比。点击方案右上角的开关可激活/取消激活。
            </n-alert>
          </n-space>
        </n-tab-pane>

        <n-tab-pane name="comparison" tab="横向对比">
          <n-space vertical :size="20" style="width: 100%">
            <n-alert v-if="store.activeSandboxScenarios.length < 2" type="warning" :show-icon="true">
              请至少激活 2 个方案进行对比
            </n-alert>

            <template v-if="store.activeSandboxScenarios.length >= 2">
              <n-card title="核心指标对比" size="small">
                <n-data-table
                  :columns="comparisonColumns"
                  :data="comparisonData"
                  :pagination="false"
                  size="small"
                  :bordered="true"
                />
              </n-card>

              <n-card title="绩效等级分布对比" size="small">
                <n-grid :cols="store.activeSandboxScenarios.length" :x-gap="16">
                  <n-gi v-for="scenario in store.activeSandboxScenarios" :key="scenario.id">
                    <n-space vertical :size="8" style="width: 100%">
                      <n-space>
                        <div class="color-dot" :style="{ backgroundColor: scenario.color }" />
                        <n-text strong>{{ scenario.name }}</n-text>
                      </n-space>
                      <n-space
                        v-for="dist in scenario.levelDistributions"
                        :key="dist.levelId"
                        justify="space-between"
                        style="width: 100%"
                      >
                        <n-text>{{ dist.levelName }}</n-text>
                        <n-text>{{ (dist.ratio * 100).toFixed(1) }}%</n-text>
                      </n-space>
                      <div class="level-chart">
                        <div
                          v-for="dist in scenario.levelDistributions"
                          :key="dist.levelId"
                          class="level-bar"
                          :style="{
                            width: `${dist.ratio * 100}%`,
                            backgroundColor: scenario.color,
                            opacity: 0.3 + (getLevelIndex(dist.levelId) / scenario.levelDistributions.length) * 0.7
                          }"
                        >
                          <span class="level-bar-label">{{ dist.levelName }}</span>
                        </div>
                      </div>
                    </n-space>
                  </n-gi>
                </n-grid>
              </n-card>

              <n-card title="各等级平均奖金对比" size="small">
                <div class="bonus-comparison-chart">
                  <div
                    v-for="level in levelOrder"
                    :key="level"
                    class="bonus-row"
                  >
                    <div class="bonus-label">{{ level }}</div>
                    <div class="bonus-bars">
                      <div
                        v-for="scenario in store.activeSandboxScenarios"
                        :key="scenario.id"
                        class="bonus-bar-wrapper"
                        :style="{ width: `${100 / store.activeSandboxScenarios.length}%` }"
                      >
                        <div
                          class="bonus-bar"
                          :style="{
                            width: `${getBonusBarWidth(scenario, level)}%`,
                            backgroundColor: scenario.color
                          }"
                        >
                          <span v-if="getLevelBonus(scenario, level) > 0" class="bonus-bar-value">
                            {{ formatShortNumber(getLevelBonus(scenario, level)) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="legend-row">
                    <div class="legend-spacer" />
                    <div class="legend-bars">
                      <n-space v-for="scenario in store.activeSandboxScenarios" :key="scenario.id" :size="4">
                        <div class="color-dot" :style="{ backgroundColor: scenario.color }" />
                        <n-text depth="3" style="font-size: 12px">{{ scenario.name }}</n-text>
                      </n-space>
                    </div>
                  </div>
                </div>
              </n-card>

              <n-card title="部门奖金分配对比" size="small">
                <n-data-table
                  :columns="deptComparisonColumns"
                  :data="deptComparisonData"
                  :pagination="false"
                  size="small"
                  :bordered="true"
                />
              </n-card>

              <n-card title="差异分析（相对基准方案）" size="small" v-if="baselineScenario">
                <n-data-table
                  :columns="diffColumns"
                  :data="diffData"
                  :pagination="false"
                  size="small"
                  :bordered="true"
                />
              </n-card>
            </template>
          </n-space>
        </n-tab-pane>

        <n-tab-pane name="edit" tab="方案配置">
          <n-space vertical :size="16" style="width: 100%" v-if="editingScenario">
            <n-card title="基础信息" size="small">
              <n-form :model="editingScenario" label-placement="left" label-width="120px">
                <n-form-item label="方案名称">
                  <n-input v-model:value="editingScenario.name" placeholder="请输入方案名称" />
                </n-form-item>
                <n-form-item label="方案描述">
                  <n-input
                    v-model:value="editingScenario.description"
                    placeholder="请输入方案描述"
                    type="textarea"
                    :rows="2"
                  />
                </n-form-item>
                <n-form-item label="标识颜色">
                  <n-select
                    v-model:value="editingScenario.color"
                    :options="colorOptions"
                    :render-label="renderColorOption"
                    style="width: 200px"
                  />
                </n-form-item>
              </n-form>
            </n-card>

            <n-card title="奖金池配置" size="small">
              <n-form :model="editingScenario.bonusPoolConfig" label-placement="left" label-width="180px">
                <n-form-item label="奖金总额（元）">
                  <n-input-number
                    v-model:value="editingScenario.bonusPoolConfig.totalAmount"
                    :min="0"
                    :step="10000"
                    style="width: 100%"
                    show-group-separator
                  />
                </n-form-item>
                <n-form-item label="基础薪资倍数">
                  <n-input-number
                    v-model:value="editingScenario.bonusPoolConfig.baseRatio"
                    :min="0"
                    :max="36"
                    :step="0.5"
                    style="width: 100%"
                  />
                </n-form-item>
                <n-form-item label="绩效影响比例">
                  <n-slider
                    v-model:value="editingScenario.bonusPoolConfig.performanceRatio"
                    :min="0"
                    :max="2"
                    :step="0.05"
                  />
                  <n-text type="info" style="margin-top: 8px; display: block">
                    当前：{{ (editingScenario.bonusPoolConfig.performanceRatio * 100).toFixed(0) }}%
                  </n-text>
                </n-form-item>
                <n-form-item label="工龄影响比例">
                  <n-slider
                    v-model:value="editingScenario.bonusPoolConfig.tenureRatio"
                    :min="0"
                    :max="1"
                    :step="0.05"
                  />
                  <n-text type="info" style="margin-top: 8px; display: block">
                    当前：{{ (editingScenario.bonusPoolConfig.tenureRatio * 100).toFixed(0) }}%
                  </n-text>
                </n-form-item>
                <n-divider />
                <n-form-item label="单人奖金封顶">
                  <n-space align="center">
                    <n-switch v-model:value="editingScenario.bonusPoolConfig.capEnabled" />
                    <n-input-number
                      v-model:value="editingScenario.bonusPoolConfig.capAmount"
                      :min="0"
                      :step="10000"
                      :disabled="!editingScenario.bonusPoolConfig.capEnabled"
                      style="width: 200px"
                      show-group-separator
                    />
                  </n-space>
                </n-form-item>
                <n-form-item label="单人奖金保底">
                  <n-space align="center">
                    <n-switch v-model:value="editingScenario.bonusPoolConfig.floorEnabled" />
                    <n-input-number
                      v-model:value="editingScenario.bonusPoolConfig.floorAmount"
                      :min="0"
                      :step="1000"
                      :disabled="!editingScenario.bonusPoolConfig.floorEnabled"
                      style="width: 200px"
                      show-group-separator
                    />
                  </n-space>
                </n-form-item>
              </n-form>
            </n-card>

            <n-card title="绩效等级分布" size="small">
              <n-space vertical :size="12" style="width: 100%">
                <div
                  v-for="dist in editingScenario.levelDistributions"
                  :key="dist.levelId"
                  class="distribution-row"
                >
                  <n-space style="width: 120px">
                    <n-tag>{{ dist.levelName }}</n-tag>
                    <n-text depth="3">({{ dist.coefficient }}x)</n-text>
                  </n-space>
                  <n-slider
                    :value="dist.ratio"
                    @update:value="(v: number) => updateDistributionRatio(dist.levelId, v)"
                    :min="0"
                    :max="1"
                    :step="0.01"
                    style="flex: 1"
                  />
                  <n-input-number
                    :value="dist.ratio"
                    @update:value="(v: number | null) => updateDistributionRatio(dist.levelId, Number(v ?? 0))"
                    :min="0"
                    :max="1"
                    :step="0.01"
                    :precision="2"
                    style="width: 100px"
                    :show-button="false"
                  />
                  <n-text style="width: 60px; text-align: right">
                    {{ (dist.ratio * 100).toFixed(1) }}%
                  </n-text>
                </div>
                <n-alert :type="totalRatioValid ? 'success' : 'error'" :show-icon="true">
                  合计比例：{{ (totalDistributionRatio * 100).toFixed(1) }}%
                  <span v-if="!totalRatioValid" style="margin-left: 8px">
                    比例合计必须等于 100%
                  </span>
                </n-alert>
                <n-button size="small" @click="normalizeDistribution">
                  <template #icon><ReloadOutlined /></template>
                  归一化比例
                </n-button>
              </n-space>
            </n-card>

            <n-card title="部门分配比例" size="small">
              <n-space vertical :size="12" style="width: 100%">
                <div
                  v-for="dept in store.departments"
                  :key="dept.id"
                  class="distribution-row"
                >
                  <n-tag style="width: 140px">{{ dept.name }}</n-tag>
                  <n-slider
                    :value="editingScenario.bonusPoolConfig.departmentRatios[dept.id] || 0"
                    @update:value="(v: number) => updateDeptRatio(dept.id, v)"
                    :min="0"
                    :max="1"
                    :step="0.01"
                    style="flex: 1"
                  />
                  <n-input-number
                    :value="editingScenario.bonusPoolConfig.departmentRatios[dept.id] || 0"
                    @update:value="(v: number | null) => updateDeptRatio(dept.id, Number(v ?? 0))"
                    :min="0"
                    :max="1"
                    :step="0.01"
                    :precision="2"
                    style="width: 100px"
                    :show-button="false"
                  />
                  <n-text style="width: 60px; text-align: right">
                    {{ ((editingScenario.bonusPoolConfig.departmentRatios[dept.id] || 0) * 100).toFixed(1) }}%
                  </n-text>
                </div>
                <n-alert :type="deptRatioValid ? 'success' : 'error'" :show-icon="true">
                  合计比例：{{ (totalDeptRatio * 100).toFixed(1) }}%
                  <span v-if="!deptRatioValid" style="margin-left: 8px">
                    比例合计必须等于 100%
                  </span>
                </n-alert>
              </n-space>
            </n-card>

            <n-space justify="end">
              <n-button @click="cancelEdit">取消</n-button>
              <n-button @click="previewMetrics">
                <template #icon><EyeOutlined /></template>
                预览指标
              </n-button>
              <n-button type="primary" :disabled="!canSave" @click="saveEdit">
                保存方案
              </n-button>
            </n-space>
          </n-space>

          <n-empty v-else description="请先选择一个方案进行编辑，或创建新方案" />
        </n-tab-pane>
      </n-tabs>
    </n-space>

    <n-modal v-model:show="showCreateModal" preset="dialog" title="新建推演方案" @positive-click="handleCreate" positive-text="创建">
      <n-form :model="createForm" label-placement="left" label-width="100px">
        <n-form-item label="方案名称" required>
          <n-input v-model:value="createForm.name" placeholder="请输入方案名称" />
        </n-form-item>
        <n-form-item label="方案描述">
          <n-input
            v-model:value="createForm.description"
            placeholder="请输入方案描述"
            type="textarea"
            :rows="3"
          />
        </n-form-item>
        <n-form-item label="基于方案">
          <n-select
            v-model:value="createForm.basedOnId"
            :options="scenarioOptions"
            placeholder="选择基准方案（可选）"
            clearable
          />
        </n-form-item>
      </n-form>
    </n-modal>

    <n-modal v-model:show="showPreviewModal" preset="card" title="方案指标预览" style="width: 800px">
      <div v-if="previewMetricsData" class="preview-content">
        <n-descriptions :column="2" bordered size="small">
          <n-descriptions-item label="奖金池总额">
            {{ formatCurrency(previewMetricsData.totalBonusPool) }} 元
          </n-descriptions-item>
          <n-descriptions-item label="实际发放总额">
            {{ formatCurrency(previewMetricsData.actualTotalBonus) }} 元
          </n-descriptions-item>
          <n-descriptions-item label="人均奖金">
            {{ formatCurrency(previewMetricsData.averageBonus) }} 元
          </n-descriptions-item>
          <n-descriptions-item label="奖金中位数">
            {{ formatCurrency(previewMetricsData.medianBonus) }} 元
          </n-descriptions-item>
          <n-descriptions-item label="最高奖金">
            {{ formatCurrency(previewMetricsData.maxBonus) }} 元
          </n-descriptions-item>
          <n-descriptions-item label="最低奖金">
            {{ formatCurrency(previewMetricsData.minBonus) }} 元
          </n-descriptions-item>
          <n-descriptions-item label="一次性计税总额">
            {{ formatCurrency(previewMetricsData.totalTaxOneTime) }} 元
          </n-descriptions-item>
          <n-descriptions-item label="综合计税总额">
            {{ formatCurrency(previewMetricsData.totalTaxComprehensive) }} 元
          </n-descriptions-item>
          <n-descriptions-item label="人均节税">
            {{ formatCurrency(previewMetricsData.averageTaxSaving) }} 元
          </n-descriptions-item>
          <n-descriptions-item label="员工总数">
            {{ previewMetricsData.totalEmployees }} 人
          </n-descriptions-item>
          <n-descriptions-item label="封顶人数">
            {{ previewMetricsData.cappedCount }} 人
          </n-descriptions-item>
          <n-descriptions-item label="保底人数">
            {{ previewMetricsData.flooredCount }} 人
          </n-descriptions-item>
        </n-descriptions>

        <n-divider />

        <n-text strong>绩效等级分布：</n-text>
        <n-data-table
          :columns="previewLevelColumns"
          :data="previewLevelData"
          :pagination="false"
          size="small"
          style="margin-top: 12px"
        />
      </div>
    </n-modal>
  </n-card>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import {
  PlusOutlined as AddOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  CheckOutlined,
  StarOutlined,
  ReloadOutlined,
  EyeOutlined
} from '@vicons/antd'
import { useBonusStore } from '@/stores/bonus'
import { formatCurrency, round2 } from '@/utils/tax'
import type { BonusSandboxScenario, SandboxKeyMetrics } from '@/types'

const store = useBonusStore()
const message = useMessage()
const dialog = useDialog()

const activeTab = ref('scenarios')
const showCreateModal = ref(false)
const showPreviewModal = ref(false)
const editingScenario = ref<BonusSandboxScenario | null>(null)
const previewMetricsData = ref<SandboxKeyMetrics | null>(null)
const isNewScenario = ref(false)

const createForm = ref({
  name: '',
  description: '',
  basedOnId: null as string | null
})

const SANDBOX_COLORS = ['#1890ff', '#52c41a', '#fa8c16', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#faad14']

const colorOptions = SANDBOX_COLORS.map((color) => ({
  label: color,
  value: color
}))

const scenarioOptions = computed(() =>
  store.sandboxScenarios.map((s) => ({
    label: s.name,
    value: s.id
  }))
)

const baselineScenario = computed(() =>
  store.sandboxScenarios.find((s) => s.isBaseline)
)

const levelOrder = computed(() => {
  if (store.sandboxScenarios.length === 0) return []
  return store.sandboxScenarios[0].levelDistributions.map((d) => d.levelName)
})

const totalDistributionRatio = computed(() => {
  if (!editingScenario.value) return 0
  return editingScenario.value.levelDistributions.reduce((sum, d) => sum + d.ratio, 0)
})

const totalRatioValid = computed(() =>
  Math.abs(totalDistributionRatio.value - 1) < 0.001
)

const totalDeptRatio = computed(() => {
  if (!editingScenario.value) return 0
  return store.departments.reduce(
    (sum, d) => sum + (editingScenario.value!.bonusPoolConfig.departmentRatios[d.id] || 0),
    0
  )
})

const deptRatioValid = computed(() =>
  Math.abs(totalDeptRatio.value - 1) < 0.001
)

const canSave = computed(() => {
  if (!editingScenario.value) return false
  if (!editingScenario.value.name.trim()) return false
  return totalRatioValid.value && deptRatioValid.value
})

const comparisonColumns: DataTableColumns = [
  {
    title: '指标',
    key: 'label',
    width: 180,
    render: (row: any) => h('span', { style: { fontWeight: 'bold' } }, row.label)
  },
  ...store.activeSandboxScenarios.map((scenario) => ({
    title: () =>
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
        h('div', {
          style: {
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: scenario.color
          }
        }),
        h('span', scenario.name),
        scenario.isBaseline ? h('n-tag', { type: 'success', size: 'small' }, { default: () => '基准' }) : null
      ]),
    key: scenario.id,
    render: (row: any) => {
      const value = row[scenario.id]
      const formatted = formatComparisonValue(row, value)
      if (row.isBetter === 'neutral' || !baselineScenario.value || scenario.isBaseline) {
        return formatted
      }
      const baselineValue = row[baselineScenario.value.id]
      const diff = value - baselineValue
      if (Math.abs(diff) < 0.01) {
        return formatted
      }
      const isBetter = row.isBetter === 'higher' ? diff > 0 : diff < 0
      const diffText = row.format === 'percentage'
        ? `${diff > 0 ? '+' : ''}${(diff * 100).toFixed(1)}%`
        : `${diff > 0 ? '+' : ''}${formatCurrency(diff)}`
      return h('div', {}, [
        formatted,
        h(
          'span',
          {
            style: {
              marginLeft: '8px',
              color: isBetter ? '#52c41a' : '#f5222d',
              fontSize: '12px'
            }
          },
          diffText
        )
      ])
    }
  }))
]

const comparisonData = computed(() => {
  const scenarios = store.activeSandboxScenarios
  const metricsList = scenarios.map((s) => ({ id: s.id, metrics: s.metrics }))

  const rows: any[] = [
    {
      label: '奖金池总额',
      unit: '元',
      format: 'currency',
      isBetter: 'neutral',
      ...Object.fromEntries(metricsList.map((m) => [m.id, m.metrics?.totalBonusPool || 0]))
    },
    {
      label: '实际发放总额',
      unit: '元',
      format: 'currency',
      isBetter: 'neutral',
      ...Object.fromEntries(metricsList.map((m) => [m.id, m.metrics?.actualTotalBonus || 0]))
    },
    {
      label: '人均奖金',
      unit: '元',
      format: 'currency',
      isBetter: 'higher',
      ...Object.fromEntries(metricsList.map((m) => [m.id, m.metrics?.averageBonus || 0]))
    },
    {
      label: '奖金中位数',
      unit: '元',
      format: 'currency',
      isBetter: 'higher',
      ...Object.fromEntries(metricsList.map((m) => [m.id, m.metrics?.medianBonus || 0]))
    },
    {
      label: '最高奖金',
      unit: '元',
      format: 'currency',
      isBetter: 'higher',
      ...Object.fromEntries(metricsList.map((m) => [m.id, m.metrics?.maxBonus || 0]))
    },
    {
      label: '最低奖金',
      unit: '元',
      format: 'currency',
      isBetter: 'higher',
      ...Object.fromEntries(metricsList.map((m) => [m.id, m.metrics?.minBonus || 0]))
    },
    {
      label: '一次性计税总额',
      unit: '元',
      format: 'currency',
      isBetter: 'lower',
      ...Object.fromEntries(metricsList.map((m) => [m.id, m.metrics?.totalTaxOneTime || 0]))
    },
    {
      label: '综合计税总额',
      unit: '元',
      format: 'currency',
      isBetter: 'lower',
      ...Object.fromEntries(metricsList.map((m) => [m.id, m.metrics?.totalTaxComprehensive || 0]))
    },
    {
      label: '人均节税',
      unit: '元',
      format: 'currency',
      isBetter: 'higher',
      ...Object.fromEntries(metricsList.map((m) => [m.id, m.metrics?.averageTaxSaving || 0]))
    },
    {
      label: '封顶人数',
      unit: '人',
      format: 'count',
      isBetter: 'lower',
      ...Object.fromEntries(metricsList.map((m) => [m.id, m.metrics?.cappedCount || 0]))
    },
    {
      label: '保底人数',
      unit: '人',
      format: 'count',
      isBetter: 'lower',
      ...Object.fromEntries(metricsList.map((m) => [m.id, m.metrics?.flooredCount || 0]))
    }
  ]

  return rows
})

const deptComparisonColumns: DataTableColumns = [
  { title: '部门', key: 'deptName', width: 150 },
  { title: '人数', key: 'headcount', width: 80 },
  ...store.activeSandboxScenarios.map((scenario) => ({
    title: () =>
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
        h('div', {
          style: {
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: scenario.color
          }
        }),
        h('span', scenario.name)
      ]),
    key: scenario.id,
    children: [
      {
        title: '平均奖金',
        key: `${scenario.id}-avg`,
        render: (row: any) => formatCurrency(row[`${scenario.id}-avg`] || 0)
      },
      {
        title: '奖金总额',
        key: `${scenario.id}-total`,
        render: (row: any) => formatCurrency(row[`${scenario.id}-total`] || 0)
      },
      {
        title: '分配比例',
        key: `${scenario.id}-ratio`,
        render: (row: any) => `${((row[`${scenario.id}-ratio`] || 0) * 100).toFixed(1)}%`
      }
    ]
  }))
]

const deptComparisonData = computed(() => {
  return store.departments.map((dept) => {
    const row: any = {
      deptName: dept.name,
      headcount: dept.employees.length
    }
    for (const scenario of store.activeSandboxScenarios) {
      const deptMetrics = scenario.metrics?.departmentBonusDistribution[dept.id]
      row[`${scenario.id}-avg`] = deptMetrics?.averageBonus || 0
      row[`${scenario.id}-total`] = deptMetrics?.totalBonus || 0
      row[`${scenario.id}-ratio`] = deptMetrics?.allocationRatio || 0
    }
    return row
  })
})

const diffColumns: DataTableColumns = [
  { title: '指标', key: 'label', width: 180 },
  { title: '基准方案', key: 'baseline', width: 140 },
  ...store.activeSandboxScenarios
    .filter((s) => !s.isBaseline)
    .map((scenario) => ({
      title: () =>
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
          h('div', {
            style: {
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: scenario.color
            }
          }),
          h('span', scenario.name)
        ]),
      key: scenario.id,
      render: (row: any) => {
        const value = row[scenario.id]
        const baseline = row.baseline
        const diff = value - baseline
        const diffPercent = baseline !== 0 ? (diff / baseline) * 100 : 0

        return h('div', {}, [
          formatCurrency(value),
          h(
            'span',
            {
              style: {
                marginLeft: '8px',
                color: diff > 0 ? '#52c41a' : diff < 0 ? '#f5222d' : '#8c8c8c',
                fontSize: '12px'
              }
            },
            diff > 0 ? `+${formatCurrency(diff)} (+${diffPercent.toFixed(1)}%)` :
            diff < 0 ? `${formatCurrency(diff)} (${diffPercent.toFixed(1)}%)` :
            '-'
          )
        ])
      }
    }))
]

const diffData = computed(() => {
  if (!baselineScenario.value) return []
  const otherScenarios = store.activeSandboxScenarios.filter((s) => !s.isBaseline)

  const rows: any[] = [
    {
      label: '奖金池总额',
      baseline: baselineScenario.value.metrics?.totalBonusPool || 0,
      ...Object.fromEntries(
        otherScenarios.map((s) => [s.id, s.metrics?.totalBonusPool || 0])
      )
    },
    {
      label: '实际发放总额',
      baseline: baselineScenario.value.metrics?.actualTotalBonus || 0,
      ...Object.fromEntries(
        otherScenarios.map((s) => [s.id, s.metrics?.actualTotalBonus || 0])
      )
    },
    {
      label: '人均奖金',
      baseline: baselineScenario.value.metrics?.averageBonus || 0,
      ...Object.fromEntries(
        otherScenarios.map((s) => [s.id, s.metrics?.averageBonus || 0])
      )
    },
    {
      label: '奖金中位数',
      baseline: baselineScenario.value.metrics?.medianBonus || 0,
      ...Object.fromEntries(
        otherScenarios.map((s) => [s.id, s.metrics?.medianBonus || 0])
      )
    },
    {
      label: '一次性计税总额',
      baseline: baselineScenario.value.metrics?.totalTaxOneTime || 0,
      ...Object.fromEntries(
        otherScenarios.map((s) => [s.id, s.metrics?.totalTaxOneTime || 0])
      )
    },
    {
      label: '综合计税总额',
      baseline: baselineScenario.value.metrics?.totalTaxComprehensive || 0,
      ...Object.fromEntries(
        otherScenarios.map((s) => [s.id, s.metrics?.totalTaxComprehensive || 0])
      )
    }
  ]

  return rows
})

const previewLevelColumns: DataTableColumns = [
  { title: '等级', key: 'levelName', width: 100 },
  { title: '系数', key: 'coefficient', width: 80 },
  { title: '分布比例', key: 'ratio', width: 100, render: (row: any) => `${(row.ratio * 100).toFixed(1)}%` },
  { title: '人数', key: 'count', width: 80 },
  { title: '平均奖金', key: 'averageBonus', render: (row: any) => formatCurrency(row.averageBonus) },
  { title: '奖金总额', key: 'totalBonus', render: (row: any) => formatCurrency(row.totalBonus) }
]

const previewLevelData = computed(() => {
  if (!previewMetricsData.value || !editingScenario.value) return []
  return editingScenario.value.levelDistributions.map((dist) => {
    const levelMetrics = previewMetricsData.value!.levelBonusDistribution[dist.levelId]
    return {
      levelName: dist.levelName,
      coefficient: dist.coefficient,
      ratio: dist.ratio,
      count: levelMetrics?.count || 0,
      averageBonus: levelMetrics?.averageBonus || 0,
      totalBonus: levelMetrics?.totalBonus || 0
    }
  })
})

function formatComparisonValue(row: any, value: number) {
  if (row.format === 'currency') {
    return formatCurrency(value)
  } else if (row.format === 'percentage') {
    return `${(value * 100).toFixed(1)}%`
  } else if (row.format === 'count') {
    return `${value}${row.unit || ''}`
  }
  return value.toString()
}

function formatShortNumber(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`
  }
  return Math.round(value).toString()
}

function getLevelIndex(levelId: string): number {
  if (!editingScenario.value) return 0
  return editingScenario.value.levelDistributions.findIndex((d) => d.levelId === levelId)
}

function getLevelBonus(scenario: BonusSandboxScenario, levelName: string): number {
  if (!scenario.metrics) return 0
  const dist = scenario.levelDistributions.find((d) => d.levelName === levelName)
  if (!dist) return 0
  return scenario.metrics.levelBonusDistribution[dist.levelId]?.averageBonus || 0
}

function getBonusBarWidth(scenario: BonusSandboxScenario, levelName: string): number {
  const allBonuses = levelOrder.value.map((l) => getLevelBonus(scenario, l))
  const maxBonus = Math.max(...allBonuses, 1)
  return (getLevelBonus(scenario, levelName) / maxBonus) * 100
}

function isActive(scenarioId: string): boolean {
  return store.activeSandboxScenarioIds.includes(scenarioId)
}

function toggleActive(scenarioId: string) {
  store.toggleSandboxScenarioActive(scenarioId)
}

function refreshAllMetrics() {
  store.refreshAllSandboxMetrics()
  message.success('已刷新全部方案指标')
}

function openCreateModal() {
  createForm.value = {
    name: '',
    description: '',
    basedOnId: null
  }
  showCreateModal.value = true
}

function handleCreate() {
  if (!createForm.value.name.trim()) {
    message.error('请输入方案名称')
    return false
  }

  let newScenario: BonusSandboxScenario
  if (createForm.value.basedOnId) {
    const duplicated = store.duplicateSandboxScenario(createForm.value.basedOnId)
    if (duplicated) {
      store.updateSandboxScenario(duplicated.id, {
        name: createForm.value.name,
        description: createForm.value.description
      })
      newScenario = duplicated
    } else {
      return false
    }
  } else {
    newScenario = store.createSandboxScenario({
      name: createForm.value.name,
      description: createForm.value.description
    })
  }

  store.refreshSandboxMetrics(newScenario.id)
  message.success(`方案「${newScenario.name}」已创建`)
  showCreateModal.value = true
  return true
}

function editScenario(scenario: BonusSandboxScenario) {
  editingScenario.value = JSON.parse(JSON.stringify(scenario))
  isNewScenario.value = false
  activeTab.value = 'edit'
}

function duplicateScenario(scenarioId: string) {
  const newScenario = store.duplicateSandboxScenario(scenarioId)
  if (newScenario) {
    message.success('方案已复制')
  } else {
    message.error('复制失败')
  }
}

function deleteScenario(scenarioId: string, scenarioName: string) {
  dialog.warning({
    title: '确认删除方案',
    content: `确定要删除方案「${scenarioName}」吗？`,
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: () => {
      const success = store.deleteSandboxScenario(scenarioId)
      if (success) {
        message.success('方案已删除')
      } else {
        message.error('删除失败')
      }
    }
  })
}

function setAsBaseline(scenarioId: string) {
  store.setBaselineScenario(scenarioId)
  message.success('已设为基准方案')
}

function applyScenario(scenarioId: string) {
  const scenario = store.sandboxScenarios.find((s) => s.id === scenarioId)
  if (!scenario) return

  dialog.warning({
    title: '确认应用方案',
    content: `确定要将方案「${scenario.name}」应用为当前配置吗？这将覆盖现有的奖金池和绩效分布配置。`,
    positiveText: '确定应用',
    negativeText: '取消',
    onPositiveClick: () => {
      const success = store.applySandboxScenario(scenarioId)
      if (success) {
        message.success('方案已应用')
      } else {
        message.error('应用失败')
      }
    }
  })
}

function updateDistributionRatio(levelId: string, value: number) {
  if (!editingScenario.value) return
  const idx = editingScenario.value.levelDistributions.findIndex((d) => d.levelId === levelId)
  if (idx !== -1) {
    editingScenario.value.levelDistributions[idx].ratio = round2(value)
  }
}

function updateDeptRatio(deptId: string, value: number) {
  if (!editingScenario.value) return
  editingScenario.value.bonusPoolConfig.departmentRatios[deptId] = round2(value)
}

function normalizeDistribution() {
  if (!editingScenario.value) return
  const total = editingScenario.value.levelDistributions.reduce((sum, d) => sum + d.ratio, 0)
  if (total > 0) {
    editingScenario.value.levelDistributions.forEach((d) => {
      d.ratio = round2(d.ratio / total)
    })
  }
}

function previewMetrics() {
  if (!editingScenario.value) return
  previewMetricsData.value = store.calculateSandboxMetrics(editingScenario.value)
  showPreviewModal.value = true
}

function cancelEdit() {
  editingScenario.value = null
  activeTab.value = 'scenarios'
}

function saveEdit() {
  if (!editingScenario.value || !canSave.value) return

  store.updateSandboxScenario(editingScenario.value.id, {
    name: editingScenario.value.name,
    description: editingScenario.value.description,
    color: editingScenario.value.color,
    bonusPoolConfig: JSON.parse(JSON.stringify(editingScenario.value.bonusPoolConfig)),
    levelDistributions: JSON.parse(JSON.stringify(editingScenario.value.levelDistributions))
  })

  store.refreshSandboxMetrics(editingScenario.value.id)
  message.success('方案已保存')
  editingScenario.value = null
  activeTab.value = 'scenarios'
}

function renderColorOption(option: any) {
  return h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
    h('div', {
      style: {
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: option.value
      }
    }),
    h('span', option.value)
  ])
}
</script>

<style scoped>
.scenario-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
}

.scenario-card {
  border-left: 4px solid #1890ff;
  transition: all 0.2s;
}

.scenario-card.active {
  box-shadow: 0 2px 8px rgba(24, 144, 240, 0.2);
}

.scenario-card.baseline {
  background: linear-gradient(to right, rgba(82, 196, 26, 0.05), transparent);
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.level-chart {
  display: flex;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  background: #f5f7fa;
}

.level-bar {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  transition: width 0.3s;
}

.level-bar-label {
  font-size: 11px;
  color: #fff;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.bonus-comparison-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bonus-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bonus-label {
  width: 60px;
  font-weight: bold;
  text-align: right;
}

.bonus-bars {
  flex: 1;
  display: flex;
  height: 32px;
  gap: 4px;
}

.bonus-bar-wrapper {
  display: flex;
  align-items: center;
}

.bonus-bar {
  height: 100%;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  min-width: 30px;
  transition: width 0.3s;
}

.bonus-bar-value {
  font-size: 11px;
  color: #fff;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.legend-row {
  display: flex;
  gap: 12px;
}

.legend-spacer {
  width: 60px;
}

.legend-bars {
  flex: 1;
  display: flex;
  justify-content: center;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
}

.distribution-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-content {
  max-height: 600px;
  overflow-y: auto;
}
</style>
