<template>
  <n-space vertical :size="20" style="width: 100%">
    <n-card title="绩效分布强制校准" :bordered="false">
      <template #header-extra>
        <n-space>
          <n-tag size="small" :type="statusType">{{ statusLabel }}</n-tag>
        </n-space>
      </template>

      <n-space vertical :size="16">
        <n-space :size="20" wrap>
          <n-space vertical :size="6">
            <n-text depth="3" style="font-size: 12px">校准年度</n-text>
            <n-input-number v-model:value="store.calibrationYear" :min="2020" :max="2099" style="width: 120px" />
          </n-space>

          <n-space vertical :size="6">
            <n-text depth="3" style="font-size: 12px">考核周期</n-text>
            <n-select v-model:value="store.calibrationHalf" :options="halfOptions" style="width: 140px" />
          </n-space>

          <n-space vertical :size="6">
            <n-text depth="3" style="font-size: 12px">校准范围</n-text>
            <n-radio-group v-model:value="store.calibrationScope">
              <n-radio value="company">全公司拉通</n-radio>
              <n-radio value="department">按部门</n-radio>
            </n-radio-group>
          </n-space>

          <n-space v-if="store.calibrationScope === 'department'" vertical :size="6">
            <n-text depth="3" style="font-size: 12px">选择部门</n-text>
            <n-select v-model:value="store.calibrationDeptId" :options="departmentOptions" style="width: 200px" placeholder="请选择部门" />
          </n-space>

          <n-space vertical :size="6">
            <n-text depth="3" style="font-size: 12px">&nbsp;</n-text>
            <n-space>
              <n-button type="primary" @click="handleStartCalibration" :disabled="!canStart">
                <template #icon><PlayCircleOutlined /></template>
                开始校准
              </n-button>
              <n-button v-if="store.currentCalibration" @click="handleReset">
                <template #icon><ReloadOutlined /></template>
                重置
              </n-button>
            </n-space>
          </n-space>
        </n-space>
      </n-space>
    </n-card>

    <n-card v-if="store.currentCalibration" title="分布比例配置" :bordered="false">
      <template #header-extra>
        <n-text depth="3" style="font-size: 12px">
          总人数：{{ store.currentCalibration.totalEmployees }} 人
        </n-text>
      </template>

      <n-data-table
        :columns="ratioColumns"
        :data="ratioTableData"
        :pagination="false"
        :bordered="false"
        size="medium"
      />
    </n-card>

    <n-card v-if="store.currentCalibration" title="分布统计" :bordered="false">
      <n-grid :cols="store.performanceDistributionRatios.length" :x-gap="12" :y-gap="12">
        <n-gi v-for="stat in distributionStats" :key="stat.levelId">
          <div class="stat-card" :class="{ 'over-limit': stat.overLimit }">
            <div class="stat-level">{{ stat.levelName }}</div>
            <div class="stat-count">{{ stat.actualCount }} 人</div>
            <div class="stat-ratio">
              <span :class="{ 'text-warning': stat.overLimit }">
                {{ (stat.actualRatio * 100).toFixed(1) }}%
              </span>
              <span class="stat-limit"> / 上限 {{ (stat.maxRatio * 100).toFixed(0) }}%</span>
            </div>
            <div class="stat-bar">
              <div
                class="stat-bar-fill"
                :class="{ 'over-limit': stat.overLimit }"
                :style="{ width: Math.min(stat.actualRatio / stat.maxRatio * 100, 100) + '%' }"
              ></div>
            </div>
          </div>
        </n-gi>
      </n-grid>
    </n-card>

    <n-card v-if="store.currentCalibration" title="校准结果明细" :bordered="false">
      <template #header-extra>
        <n-space>
          <n-input v-model:value="searchKeyword" placeholder="搜索员工姓名" clearable style="width: 200px">
            <template #prefix><SearchOutlined /></template>
          </n-input>
          <n-select v-model:value="filterLevelId" :options="levelFilterOptions" placeholder="筛选等级" clearable style="width: 140px" />
          <n-button v-if="store.currentCalibration.status === 'draft'" type="success" @click="handleConfirm">
            <template #icon><CheckCircleOutlined /></template>
            确认结果
          </n-button>
          <n-button
            v-if="store.currentCalibration.status === 'confirmed'"
            type="primary"
            @click="handleApply"
          >
            <template #icon><CheckOutlined /></template>
            应用校准结果
          </n-button>
        </n-space>
      </template>

      <n-data-table
        :columns="employeeColumns"
        :data="filteredEmployees"
        :pagination="{ pageSize: 10 }"
        :bordered="false"
        size="medium"
        :row-class-name="rowClassName"
      />
    </n-card>

    <n-modal v-model:show="showApplyConfirm" preset="dialog" title="应用校准结果" @positive-click="confirmApply">
      <n-space vertical :size="12">
        <n-text>确认将校准结果应用到员工绩效等级吗？</n-text>
        <n-alert type="warning" :bordered="false">
          应用后将更新所有员工的绩效等级，并刷新奖金测算数据。此操作不可撤销。
        </n-alert>
        <n-text depth="2">
          本次校准共 {{ store.currentCalibration?.totalEmployees }} 人，其中等级变动 {{ changedCount }} 人。
        </n-text>
      </n-space>
    </n-modal>
  </n-space>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import {
  PlayCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CheckOutlined
} from '@vicons/antd'
import { useBonusStore } from '@/stores/bonus'
import { formatCurrency } from '@/utils/tax'
import type { SelectOption, DataTableColumns } from 'naive-ui'

const store = useBonusStore()
const message = useMessage()
const dialog = useDialog()

const searchKeyword = ref('')
const filterLevelId = ref<string | null>(null)
const showApplyConfirm = ref(false)

const halfOptions: SelectOption[] = [
  { label: '上半年', value: 'first' },
  { label: '下半年', value: 'second' },
  { label: '全年度', value: 'annual' }
]

const departmentOptions = computed<SelectOption[]>(() =>
  store.departments.map((d) => ({
    label: d.name,
    value: d.id
  }))
)

const levelFilterOptions = computed<SelectOption[]>(() =>
  store.performanceLevels.map((l) => ({
    label: l.name,
    value: l.id
  }))
)

const canStart = computed(() => {
  if (store.calibrationScope === 'department' && !store.calibrationDeptId) {
    return false
  }
  return true
})

const statusLabel = computed(() => {
  if (!store.currentCalibration) return '未开始'
  const map: Record<string, string> = {
    draft: '草稿',
    confirmed: '已确认',
    applied: '已应用'
  }
  return map[store.currentCalibration.status] || '未知'
})

const statusType = computed(() => {
  if (!store.currentCalibration) return 'default'
  const map: Record<string, any> = {
    draft: 'info',
    confirmed: 'warning',
    applied: 'success'
  }
  return map[store.currentCalibration.status] || 'default'
})

const ratioColumns = [
  {
    title: '绩效等级',
    key: 'levelName',
    width: 120,
    render: (row: any) =>
      h('n-tag', { type: 'info' }, { default: () => row.levelName })
  },
  {
    title: '绩效系数',
    key: 'coefficient',
    width: 120,
    render: (row: any) =>
      h('n-text', { strong: true, type: 'success' }, { default: () => `${row.coefficient}x` })
  },
  {
    title: '人数比例上限',
    key: 'maxRatio',
    width: 200,
    render: (row: any) =>
      h('n-input-number', {
        value: row.maxRatio,
        min: 0,
        max: 1,
        step: 0.01,
        showButton: false,
        style: { width: '120px' },
        onUpdateValue: (v: number) => {
          row.maxRatio = v
          store.updateDistributionRatio(row.levelId, v)
          store.executeCalibration()
        }
      })
  },
  {
    title: '上限人数',
    key: 'maxCount',
    width: 120,
    render: (row: any) => {
      const total = store.currentCalibration?.totalEmployees || 0
      return h('n-text', {}, { default: () => Math.floor(total * row.maxRatio) + ' 人' })
    }
  },
  {
    title: '当前实际人数',
    key: 'actualCount',
    width: 140,
    render: (row: any) => {
      const stat = distributionStats.value.find((s) => s.levelId === row.levelId)
      const count = stat?.actualCount || 0
      const over = stat?.overLimit
      return h(
        'n-text',
        { type: over ? 'error' : 'default', strong: over },
        { default: () => count + ' 人' + (over ? '（超上限）' : '') }
      )
    }
  }
]

const ratioTableData = computed(() => {
  return store.performanceDistributionRatios.map((r) => {
    const level = store.performanceLevels.find((l) => l.id === r.levelId)
    return {
      ...r,
      coefficient: level?.coefficient || 0
    }
  })
})

const distributionStats = computed(() => store.getCalibrationDistributionStats())

const employeeColumns: DataTableColumns = [
  {
    title: '排名',
    key: 'calibratedRank',
    width: 80,
    render: (row: any) =>
      h('n-tag', { size: 'small', type: row.calibratedRank <= 3 ? 'success' : 'default' }, { default: () => `#${row.calibratedRank}` })
  },
  {
    title: '员工姓名',
    key: 'employeeName',
    width: 100
  },
  {
    title: '所属部门',
    key: 'departmentName',
    width: 140
  },
  {
    title: '职位',
    key: 'position',
    width: 140
  },
  {
    title: '当前等级',
    key: 'currentLevelName',
    width: 120,
    render: (row: any) =>
      h('n-tag', { size: 'small', type: 'info' }, { default: () => row.currentLevelName })
  },
  {
    title: '校准后等级',
    key: 'calibratedLevelName',
    width: 140,
    render: (row: any) => {
      if (store.currentCalibration?.status === 'draft') {
        return h('n-select', {
          value: row.calibratedLevelId,
          options: store.performanceLevels.map((l) => ({ label: l.name, value: l.id })),
          size: 'small',
          style: { width: '100px' },
          onUpdateValue: (v: string) => {
            store.adjustEmployeeLevel(row.employeeId, v)
          }
        })
      }
      const isUp = row.changed && row.calibratedCoefficient > row.currentCoefficient
      const isDown = row.changed && row.calibratedCoefficient < row.currentCoefficient
      return h(
        'n-space',
        { size: 4 },
        {
          default: () => [
            h('n-tag', { size: 'small', type: isUp ? 'success' : isDown ? 'error' : 'info' }, { default: () => row.calibratedLevelName }),
            row.changed ? h('n-text', { depth: 3, style: { fontSize: '12px' } }, { default: () => isUp ? '↑升级' : '↓降级' }) : null
          ]
        }
      )
    }
  },
  {
    title: '当前系数',
    key: 'currentCoefficient',
    width: 100,
    render: (row: any) => `${row.currentCoefficient}x`
  },
  {
    title: '校准后系数',
    key: 'calibratedCoefficient',
    width: 110,
    render: (row: any) => {
      const isUp = row.changed && row.calibratedCoefficient > row.currentCoefficient
      const isDown = row.changed && row.calibratedCoefficient < row.currentCoefficient
      return h(
        'n-text',
        { type: isUp ? 'success' : isDown ? 'error' : 'default', strong: row.changed },
        { default: () => `${row.calibratedCoefficient}x` }
      )
    }
  },
  {
    title: '基本工资',
    key: 'baseSalary',
    width: 130,
    render: (row: any) => formatCurrency(row.baseSalary)
  },
  {
    title: '排序分数',
    key: 'sortScore',
    width: 100,
    render: (row: any) => row.sortScore.toFixed(2)
  }
]

const changedCount = computed(() => {
  return store.currentCalibration?.employees.filter((e) => e.changed).length || 0
})

const filteredEmployees = computed(() => {
  if (!store.currentCalibration) return []
  let list = [...store.currentCalibration.employees]
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(
      (e) =>
        e.employeeName.toLowerCase().includes(keyword) ||
        e.departmentName.toLowerCase().includes(keyword) ||
        e.position.toLowerCase().includes(keyword)
    )
  }
  if (filterLevelId.value) {
    list = list.filter((e) => e.calibratedLevelId === filterLevelId.value)
  }
  return list
})

const rowClassName = (row: any): string => {
  return row.changed ? 'row-changed' : ''
}

function handleStartCalibration() {
  if (store.calibrationScope === 'department' && !store.calibrationDeptId) {
    message.warning('请选择部门')
    return
  }
  store.startCalibration()
  message.success('校准已开始')
}

function handleReset() {
  dialog.warning({
    title: '确认重置',
    content: '确定要重置当前校准结果吗？所有调整将丢失。',
    positiveText: '确定重置',
    negativeText: '取消',
    onPositiveClick: () => {
      store.currentCalibration = null
      message.success('已重置')
    }
  })
}

function handleConfirm() {
  if (!store.currentCalibration) return
  store.confirmCalibration()
  message.success('校准结果已确认')
}

function handleApply() {
  if (!store.currentCalibration) return
  showApplyConfirm.value = true
}

function confirmApply() {
  store.applyCalibration()
  showApplyConfirm.value = false
  message.success('校准结果已应用，绩效系数和奖金测算已刷新')
}
</script>

<style scoped>
.stat-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  transition: all 0.2s;
}

.stat-card.over-limit {
  background: #fff1f0;
  border: 1px solid #ffccc7;
}

.stat-level {
  font-size: 18px;
  font-weight: 700;
  color: #1890ff;
  margin-bottom: 8px;
}

.stat-card.over-limit .stat-level {
  color: #ff4d4f;
}

.stat-count {
  font-size: 24px;
  font-weight: 700;
  color: #262626;
  margin-bottom: 4px;
}

.stat-ratio {
  font-size: 13px;
  color: #595959;
  margin-bottom: 12px;
}

.stat-ratio .text-warning {
  color: #ff4d4f;
  font-weight: 600;
}

.stat-limit {
  color: #8c8c8c;
}

.stat-bar {
  height: 6px;
  background: #e8e8e8;
  border-radius: 3px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  background: #1890ff;
  border-radius: 3px;
  transition: width 0.3s;
}

.stat-bar-fill.over-limit {
  background: #ff4d4f;
}

:deep(.row-changed) {
  background-color: #e6f7ff !important;
}
</style>
