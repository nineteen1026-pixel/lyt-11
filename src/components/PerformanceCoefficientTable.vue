<template>
  <n-card title="绩效系数配置" :bordered="false">
    <template #header-extra>
      <n-button type="primary" size="small" @click="showAddModal = true">
        <template #icon>
          <n-icon><AddOutlined /></n-icon>
        </template>
        新增等级
      </n-button>
    </template>

    <n-data-table
      :columns="columns"
      :data="tableData"
      :pagination="false"
      :bordered="false"
      size="medium"
    />

    <n-modal v-model:show="showAddModal" preset="dialog" title="新增绩效等级" @positive-click="handleAdd">
      <n-form :model="formData" label-placement="left" label-width="100px">
        <n-form-item label="等级名称">
          <n-input v-model:value="formData.name" placeholder="如：S/A/B" />
        </n-form-item>
        <n-form-item label="绩效系数">
          <n-input-number v-model:value="formData.coefficient" :min="0" :step="0.1" style="width: 100%" />
        </n-form-item>
        <n-form-item label="等级描述">
          <n-input v-model:value="formData.description" placeholder="如：卓越/优秀/良好" />
        </n-form-item>
      </n-form>
    </n-modal>
  </n-card>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { PlusOutlined as AddOutlined, EditOutlined, DeleteOutlined } from '@vicons/antd'
import { useBonusStore } from '@/stores/bonus'
import { formatCurrency, round2 } from '@/utils/tax'

const store = useBonusStore()
const message = useMessage()
const dialog = useDialog()

const showAddModal = ref(false)
const editingId = ref<string | null>(null)

const formData = ref({
  name: '',
  coefficient: 1.0,
  description: ''
})

const columns = [
  {
    title: '等级名称',
    key: 'name',
    width: 120,
    render: (row: any) =>
      editingId.value === row.id
        ? h('n-input', {
            value: row.name,
            onUpdateValue: (v: string) => (row.name = v)
          })
        : h('n-tag', { type: 'info' }, { default: () => row.name })
  },
  {
    title: '绩效系数',
    key: 'coefficient',
    width: 150,
    render: (row: any) =>
      editingId.value === row.id
        ? h('n-input-number', {
            value: row.coefficient,
            min: 0,
            step: 0.1,
            style: { width: '100%' },
            onUpdateValue: (v: number) => (row.coefficient = v)
          })
        : h('n-text', { strong: true, type: 'success' }, { default: () => `${row.coefficient}x` })
  },
  {
    title: '等级描述',
    key: 'description',
    render: (row: any) =>
      editingId.value === row.id
        ? h('n-input', {
            value: row.description || '',
            onUpdateValue: (v: string) => (row.description = v)
          })
        : row.description || '-'
  },
  {
    title: '示例影响',
    key: 'example',
    width: 160,
    render: (row: any) => {
      const base = 10000 * store.bonusPool.baseRatio
      const perf = round2(base * row.coefficient * store.bonusPool.performanceRatio)
      return h('n-text', { type: 'warning' }, { default: () => formatCurrency(perf) })
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 140,
    render: (row: any) =>
      editingId.value === row.id
        ? h(
            'n-space',
            {},
            {
              default: () => [
                h(
                  'n-button',
                  {
                    size: 'small',
                    type: 'success',
                    onClick: () => {
                      store.updatePerformanceLevel(row.id, {
                        name: row.name,
                        coefficient: row.coefficient,
                        description: row.description
                      })
                      editingId.value = null
                      message.success('更新成功')
                    }
                  },
                  { default: () => '保存' }
                ),
                h(
                  'n-button',
                  {
                    size: 'small',
                    onClick: () => {
                      editingId.value = null
                      const original = store.performanceLevels.find((l) => l.id === row.id)
                      if (original) {
                        row.name = original.name
                        row.coefficient = original.coefficient
                        row.description = original.description
                      }
                    }
                  },
                  { default: () => '取消' }
                )
              ]
            }
          )
        : h(
            'n-space',
            {},
            {
              default: () => [
                h(
                  'n-button',
                  {
                    size: 'small',
                    quaternary: true,
                    onClick: () => {
                      editingId.value = row.id
                    }
                  },
                  {
                    icon: () => h(EditOutlined),
                    default: () => '编辑'
                  }
                ),
                h(
                  'n-button',
                  {
                    size: 'small',
                    quaternary: true,
                    type: 'error',
                    onClick: () => handleDelete(row.id)
                  },
                  {
                    icon: () => h(DeleteOutlined),
                    default: () => '删除'
                  }
                )
              ]
            }
          )
  }
]

const tableData = computed(() => store.performanceLevels.map((l) => ({ ...l })))

function handleAdd() {
  if (!formData.value.name.trim()) {
    message.error('请输入等级名称')
    return false
  }
  if (!formData.value.coefficient || formData.value.coefficient <= 0) {
    message.error('请输入有效的系数')
    return false
  }
  store.addPerformanceLevel({ ...formData.value })
  message.success('新增成功')
  formData.value = { name: '', coefficient: 1.0, description: '' }
  showAddModal.value = false
  return true
}

function handleDelete(id: string) {
  const used = store.allEmployees.some((e) => e.performanceLevelId === id)
  dialog.warning({
    title: '确认删除',
    content: used ? '该等级正在被员工使用，删除后相关员工将使用默认系数1.0' : '确定要删除该绩效等级吗？',
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: () => {
      store.removePerformanceLevel(id)
      message.success('删除成功')
    }
  })
}
</script>
