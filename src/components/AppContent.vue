<template>
  <div class="app-container">
    <n-layout has-sider bordered style="min-height: 100vh">
      <n-layout-sider
        :collapsed-width="64"
        :width="240"
        :collapsed="collapsed"
        show-trigger
        bordered
        collapse-mode="width"
      >
        <div class="logo-area" :class="{ collapsed }">
          <n-icon size="28" color="#2080f0">
            <WalletOutlined />
          </n-icon>
          <span v-if="!collapsed" class="logo-text">年终奖模拟器</span>
        </div>

        <n-menu
          v-model:value="activeMenu"
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
        />
      </n-layout-sider>

      <n-layout>
        <n-layout-header bordered class="header">
          <n-space justify="space-between" align="center" style="width: 100%">
            <n-space>
              <n-text strong style="font-size: 20px">
                {{ currentTitle }}
              </n-text>
            </n-space>
            <n-space>
              <n-upload
                :show-file-list="false"
                accept=".json"
                @before-upload="handleImport"
                :max="1"
                :custom-request="() => {}"
              >
                <n-button size="small">
                  <template #icon><ImportOutlined /></template>
                  导入方案
                </n-button>
              </n-upload>
              <n-button size="small" type="primary" ghost @click="handleExport">
                <template #icon><ExportOutlined /></template>
                导出方案
              </n-button>
            </n-space>
          </n-space>
        </n-layout-header>

        <n-layout-content class="content">
          <n-space vertical :size="20" style="width: 100%">
            <template v-if="activeMenu === 'overview'">
              <OverviewDashboard />
            </template>

            <template v-else-if="activeMenu === 'performance'">
              <PerformanceCoefficientTable />
            </template>

            <template v-else-if="activeMenu === 'tags'">
              <EmployeeTagConfig />
            </template>

            <template v-else-if="activeMenu === 'pool'">
              <BonusPoolConfig />
            </template>

            <template v-else-if="activeMenu === 'calculate'">
              <EmployeeDetail />
            </template>

            <template v-else-if="activeMenu === 'all'">
              <AllResultsTable />
            </template>
          </n-space>
        </n-layout-content>

        <n-layout-footer bordered class="footer">
          <n-space justify="space-between" style="width: 100%">
            <n-text depth="3">
              © 2024 年终奖发放方案模拟器 · 基于 2024 年最新个税政策
            </n-text>
            <n-space>
              <n-text depth="3">员工总数：{{ store.allEmployees.length }}人</n-text>
              <n-divider vertical />
              <n-text depth="3">部门数：{{ store.departments.length }}</n-text>
            </n-space>
          </n-space>
        </n-layout-footer>
      </n-layout>
    </n-layout>
  </div>

  <input
    ref="fileInputRef"
    type="file"
    accept=".json"
    style="display: none"
    @change="onFileChange"
  />
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useMessage } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import {
  HomeOutlined as DashboardOutlined,
  StarOutlined,
  WalletOutlined,
  FundOutlined,
  TableOutlined,
  ImportOutlined,
  ExportOutlined,
  TagsOutlined
} from '@vicons/antd'
import { useBonusStore } from '@/stores/bonus'
import PerformanceCoefficientTable from '@/components/PerformanceCoefficientTable.vue'
import BonusPoolConfig from '@/components/BonusPoolConfig.vue'
import EmployeeDetail from '@/components/EmployeeDetail.vue'
import OverviewDashboard from '@/components/OverviewDashboard.vue'
import AllResultsTable from '@/components/AllResultsTable.vue'
import EmployeeTagConfig from '@/components/EmployeeTagConfig.vue'
import dayjs from 'dayjs'
import type { AppData } from '@/types'

const store = useBonusStore()
const message = useMessage()

const collapsed = ref(false)
const activeMenu = ref('overview')
const fileInputRef = ref<HTMLInputElement | null>(null)

const menuOptions: MenuOption[] = [
  {
    label: '总览面板',
    key: 'overview',
    icon: () => h(DashboardOutlined)
  },
  {
    label: '绩效系数配置',
    key: 'performance',
    icon: () => h(StarOutlined)
  },
  {
    label: '员工标签管理',
    key: 'tags',
    icon: () => h(TagsOutlined)
  },
  {
    label: '奖金池与分配',
    key: 'pool',
    icon: () => h(FundOutlined)
  },
  {
    label: '个人测算',
    key: 'calculate',
    icon: () => h(WalletOutlined)
  },
  {
    label: '全员测算表',
    key: 'all',
    icon: () => h(TableOutlined)
  }
]

const currentTitle = computed(() => {
  const map: Record<string, string> = {
    overview: '📊 总览面板',
    performance: '⭐ 绩效系数配置',
    tags: '🏷️ 员工标签管理',
    pool: '💰 奖金池与分配配置',
    calculate: '🧮 个人年终奖测算',
    all: '📋 全员年终奖测算表'
  }
  return map[activeMenu.value] || ''
})

function handleExport() {
  const data: AppData & { exportedAt: string; version: string } = {
    ...store.exportData(),
    exportedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    version: '1.0.0'
  }
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `年终奖方案_${dayjs().format('YYYYMMDD_HHmmss')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  message.success('方案已导出')
}

function handleImport({ file }: { file: File }) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string) as AppData
      const ok = store.importData(data)
      if (ok) {
        message.success('方案导入成功')
      } else {
        message.error('方案数据格式不正确')
      }
    } catch {
      message.error('文件解析失败，请确认是有效的 JSON 文件')
    }
  }
  reader.readAsText(file)
  return false
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    handleImport({ file })
  }
}
</script>

<style scoped>
.app-container {
  width: 100%;
  min-height: 100vh;
}
.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px;
  border-bottom: 1px solid #e5e7eb;
  overflow: hidden;
  white-space: nowrap;
  transition: padding 0.2s;
}
.logo-area.collapsed {
  padding: 20px 18px;
}
.logo-text {
  font-size: 17px;
  font-weight: 700;
  color: #2080f0;
  letter-spacing: 0.5px;
}
.header {
  padding: 0 20px;
  background: #fff;
  height: 64px;
  display: flex;
  align-items: center;
}
.content {
  padding: 20px;
  background: #f5f7fa;
}
.footer {
  padding: 12px 20px;
  background: #fff;
  font-size: 13px;
}
</style>
