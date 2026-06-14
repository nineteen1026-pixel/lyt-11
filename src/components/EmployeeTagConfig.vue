<template>
  <n-card title="员工标签体系" :bordered="false">
    <template #header-extra>
      <n-button type="primary" size="small" @click="openAddModal">
        <template #icon>
          <n-icon><AddOutlined /></n-icon>
        </template>
        新增标签
      </n-button>
    </template>

    <n-alert type="info" :show-icon="true" style="margin-bottom: 16px">
      标签加成系数会在绩效系数基础上额外叠加，多个标签的加成系数累加计算。例如：绩效加成 × 绩效系数 + 基础金额 × 标签加成系数合计
    </n-alert>

    <n-data-table
      :columns="columns"
      :data="tableData"
      :pagination="false"
      :bordered="false"
      size="medium"
    />

    <n-modal v-model:show="showAddModal" preset="dialog" :title="editingId ? '编辑标签' : '新增标签'" @positive-click="handleSave">
      <n-form :model="formData" label-placement="left" label-width="100px">
        <n-form-item label="标签名称">
          <n-input v-model:value="formData.name" placeholder="如：核心人才、关键岗位" />
        </n-form-item>
        <n-form-item label="加成系数">
          <n-input-number v-model:value="formData.coefficient" :min="0" :max="2" :step="0.05" style="width: 100%" />
          <n-text depth="3" style="margin-left: 8px; white-space: nowrap">
            {{ formData.coefficient > 0 ? `额外增加 ${(formData.coefficient * 100).toFixed(0)}%` : '无加成' }}
          </n-text>
        </n-form-item>
        <n-form-item label="生效日期" required>
          <n-date-picker
            v-model:value="formData.effectiveDate"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            placeholder="选择生效日期"
          />
        </n-form-item>
        <n-form-item label="失效日期" required>
          <n-date-picker
            v-model:value="formData.expiryDate"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            placeholder="选择失效日期"
          />
        </n-form-item>
        <n-form-item label="标签描述">
          <n-input v-model:value="formData.description" placeholder="标签适用说明" type="textarea" :rows="2" />
        </n-form-item>
        <n-form-item label="标签颜色">
          <n-space>
            <div
              v-for="c in presetColors"
              :key="c"
              class="color-swatch"
              :class="{ active: formData.color === c }"
              :style="{ backgroundColor: c }"
              @click="formData.color = c"
            />
          </n-space>
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
import dayjs from 'dayjs'

const store = useBonusStore()
const message = useMessage()
const dialog = useDialog()

const showAddModal = ref(false)
const editingId = ref<string | null>(null)

const presetColors = [
  '#f5222d', '#fa541c', '#fa8c16', '#fadb14',
  '#52c41a', '#13c2c2', '#1890ff', '#722ed1',
  '#eb2f96', '#666666'
]

const defaultFormData = () => ({
  name: '',
  coefficient: 0.1,
  description: '',
  color: '#1890ff',
  effectiveDate: dayjs().format('YYYY-MM-DD'),
  expiryDate: dayjs().add(1, 'year').format('YYYY-MM-DD')
})

const formData = ref(defaultFormData())

function getTagStatus(tag: any) {
  const now = dayjs()
  const effective = dayjs(tag.effectiveDate)
  const expiry = dayjs(tag.expiryDate)
  if (now.isBefore(effective, 'day')) return { label: '未生效', type: 'default' as const }
  if (now.isAfter(expiry, 'day')) return { label: '已失效', type: 'error' as const }
  const daysUntilExpiry = expiry.diff(now, 'day') + 1
  if (daysUntilExpiry <= 7) return { label: `即将失效(${daysUntilExpiry}天)`, type: 'warning' as const }
  return { label: '生效中', type: 'success' as const }
}

function openAddModal() {
  editingId.value = null
  formData.value = defaultFormData()
  showAddModal.value = true
}

function openEditModal(row: any) {
  editingId.value = row.id
  formData.value = {
    name: row.name,
    coefficient: row.coefficient,
    description: row.description || '',
    color: row.color || '#1890ff',
    effectiveDate: row.effectiveDate || dayjs().format('YYYY-MM-DD'),
    expiryDate: row.expiryDate || dayjs().add(1, 'year').format('YYYY-MM-DD')
  }
  showAddModal.value = true
}

const columns = [
  {
    title: '标签',
    key: 'name',
    width: 160,
    render: (row: any) =>
      h('n-tag', { color: { color: row.color || '#1890ff', textColor: '#fff' }, round: true }, { default: () => row.name })
  },
  {
    title: '状态',
    key: 'status',
    width: 130,
    render: (row: any) => {
      const status = getTagStatus(row)
      return h('n-tag', { size: 'small', type: status.type }, { default: () => status.label })
    }
  },
  {
    title: '生效日期',
    key: 'effectiveDate',
    width: 120,
    render: (row: any) => row.effectiveDate || '-'
  },
  {
    title: '失效日期',
    key: 'expiryDate',
    width: 120,
    render: (row: any) => row.expiryDate || '-'
  },
  {
    title: '加成系数',
    key: 'coefficient',
    width: 140,
    render: (row: any) => {
      const status = getTagStatus(row)
      const isActive = status.type === 'success' || status.type === 'warning'
      return h('n-text', { strong: true, type: isActive ? 'success' : 'default' }, {
        default: () => isActive ? `+${(row.coefficient * 100).toFixed(0)}%` : '0%'
      })
    }
  },
  {
    title: '描述',
    key: 'description',
    render: (row: any) => row.description || '-'
  },
  {
    title: '使用人数',
    key: 'usageCount',
    width: 100,
    render: (row: any) => {
      const count = store.allEmployees.filter((e) => e.tagIds.includes(row.id)).length
      return h('n-text', {}, { default: () => `${count}人` })
    }
  },
  {
    title: '示例影响',
    key: 'example',
    width: 160,
    render: (row: any) => {
      const base = 10000 * store.bonusPool.baseRatio
      const status = getTagStatus(row)
      const isActive = status.type === 'success' || status.type === 'warning'
      const tagBonus = isActive ? round2(base * row.coefficient) : 0
      return h('n-text', { type: tagBonus > 0 ? 'warning' : 'default' }, { default: () => formatCurrency(tagBonus) })
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 140,
    render: (row: any) =>
      h(
        'n-space',
        {},
        {
          default: () => [
            h(
              'n-button',
              {
                size: 'small',
                quaternary: true,
                onClick: () => openEditModal(row)
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
                onClick: () => handleDelete(row.id, row.name)
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

const tableData = computed(() => store.employeeTags.map((t) => ({ ...t })))

function handleSave() {
  if (!formData.value.name.trim()) {
    message.error('请输入标签名称')
    return false
  }
  if (formData.value.coefficient < 0) {
    message.error('加成系数不能为负数')
    return false
  }
  if (!formData.value.effectiveDate || !formData.value.expiryDate) {
    message.error('请选择生效日期和失效日期')
    return false
  }
  if (dayjs(formData.value.expiryDate).isBefore(formData.value.effectiveDate, 'day')) {
    message.error('失效日期不能早于生效日期')
    return false
  }
  if (editingId.value) {
    store.updateEmployeeTag(editingId.value, { ...formData.value })
    message.success('标签更新成功')
  } else {
    store.addEmployeeTag({ ...formData.value })
    message.success('标签新增成功')
  }
  editingId.value = null
  formData.value = defaultFormData()
  showAddModal.value = false
  return true
}

function handleDelete(id: string, name: string) {
  const used = store.allEmployees.some((e) => e.tagIds.includes(id))
  dialog.warning({
    title: '确认删除',
    content: used
      ? `标签「${name}」正在被员工使用，删除后相关员工的该标签将被移除，加成系数将不再计算`
      : `确定要删除标签「${name}」吗？`,
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: () => {
      store.removeEmployeeTag(id)
      message.success('标签删除成功')
    }
  })
}
</script>

<style scoped>
.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s, transform 0.15s;
}
.color-swatch:hover {
  transform: scale(1.15);
}
.color-swatch.active {
  border-color: #333;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}
</style>
