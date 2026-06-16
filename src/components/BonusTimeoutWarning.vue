<template>
  <n-popover trigger="click" :show-arrow="false" placement="bottom-end">
    <template #trigger>
      <n-badge :value="warningCount" :max="99" type="warning" show-zero>
        <n-button quaternary circle size="large">
          <template #icon>
            <n-icon size="20"><BellOutlined /></n-icon>
          </template>
        </n-button>
      </n-badge>
    </template>
    <div class="warning-panel">
      <div class="warning-header">
        <n-text strong>超时预警通知</n-text>
        <n-button size="small" quaternary @click="refreshWarnings">
          <template #icon><ReloadOutlined /></template>
          刷新
        </n-button>
      </div>
      <n-divider style="margin: 8px 0" />
      <div v-if="warnings.length === 0" class="empty-state">
        <n-empty description="暂无预警信息" :image-style="{ height: '80px' }" />
      </div>
      <div v-else class="warning-list">
        <div
          v-for="warning in warnings"
          :key="warning.recordId"
          class="warning-item"
          :class="{
            'warning-critical': warning.warningLevel === 'critical',
            'warning-warning': warning.warningLevel === 'warning'
          }"
          @click="$emit('viewRecord', warning.recordId)"
        >
          <div class="warning-icon">
            <n-icon :size="20" :color="getWarningColor(warning.warningLevel)">
              <component :is="getWarningIcon(warning.warningLevel)" />
            </n-icon>
          </div>
          <div class="warning-content">
            <div class="warning-title">
              <n-text strong>{{ warning.employeeName }}</n-text>
              <n-tag :type="getWarningTagType(warning.warningLevel)" size="small" bordered={false}>
                {{ getWarningLabel(warning.warningLevel) }}
              </n-tag>
            </div>
            <div class="warning-info">
              <n-text depth="3">{{ warning.departmentName }}</n-text>
            </div>
            <div class="warning-time">
              <n-text depth="3" style="font-size: 12px">
                截止时间：{{ warning.deadlineAt }}
              </n-text>
            </div>
            <div class="warning-remaining">
              <n-text :style="{ color: getWarningColor(warning.warningLevel) }" style="font-size: 12px">
                剩余 {{ formatRemainingTime(warning.remainingHours) }}
              </n-text>
            </div>
          </div>
        </div>
      </div>
      <n-divider style="margin: 8px 0" />
      <div class="warning-footer">
        <n-button text type="primary" size="small" @click="$emit('viewAll')">
          查看全部
        </n-button>
      </div>
    </div>
  </n-popover>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { BellOutlined, ReloadOutlined, WarningOutlined, InfoCircleOutlined, ExclamationCircleOutlined } from '@vicons/antd'
import { useBonusStore } from '@/stores/bonus'
import type { TimeoutWarning } from '@/types'

defineEmits<{
  (e: 'viewRecord', recordId: string): void
  (e: 'viewAll'): void
}>()

const store = useBonusStore()
const warnings = ref<TimeoutWarning[]>([])
let timer: number | null = null

const warningCount = computed(() => warnings.value.filter(w => w.warningLevel === 'critical' || w.warningLevel === 'warning').length)

function refreshWarnings() {
  warnings.value = store.getTimeoutWarnings()
}

function getWarningColor(level: string): string {
  const colorMap: Record<string, string> = {
    critical: '#f5222d',
    warning: '#fa8c16',
    info: '#1890ff'
  }
  return colorMap[level] || '#8c8c8c'
}

function getWarningTagType(level: string): 'error' | 'warning' | 'info' {
  const typeMap: Record<string, 'error' | 'warning' | 'info'> = {
    critical: 'error',
    warning: 'warning',
    info: 'info'
  }
  return typeMap[level] || 'info'
}

function getWarningIcon(level: string) {
  const iconMap: Record<string, any> = {
    critical: ExclamationCircleOutlined,
    warning: WarningOutlined,
    info: InfoCircleOutlined
  }
  return iconMap[level] || InfoCircleOutlined
}

function getWarningLabel(level: string): string {
  const labelMap: Record<string, string> = {
    critical: '紧急',
    warning: '警告',
    info: '提示'
  }
  return labelMap[level] || '提示'
}

function formatRemainingTime(hours: number): string {
  if (hours <= 0) return '已超时'
  const days = Math.floor(hours / 24)
  const remainHours = Math.floor(hours % 24)
  if (days > 0) {
    return `${days}天${remainHours}小时`
  }
  return `${remainHours}小时`
}

onMounted(() => {
  refreshWarnings()
  timer = window.setInterval(() => {
    refreshWarnings()
  }, 60000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.warning-panel {
  width: 360px;
  max-height: 480px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.warning-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}
.warning-list {
  flex: 1;
  overflow-y: auto;
  max-height: 360px;
}
.warning-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 8px;
  border-left: 3px solid transparent;
}
.warning-item:hover {
  background-color: #f5f7fa;
}
.warning-item.warning-critical {
  border-left-color: #f5222d;
  background-color: #fff1f0;
}
.warning-item.warning-warning {
  border-left-color: #fa8c16;
  background-color: #fffbe6;
}
.warning-icon {
  flex-shrink: 0;
  padding-top: 2px;
}
.warning-content {
  flex: 1;
  min-width: 0;
}
.warning-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.warning-info {
  margin-bottom: 4px;
}
.warning-time {
  margin-bottom: 4px;
}
.warning-remaining {
  font-weight: 500;
}
.warning-footer {
  text-align: center;
  padding: 4px 0;
}
.empty-state {
  padding: 20px 0;
}
</style>
