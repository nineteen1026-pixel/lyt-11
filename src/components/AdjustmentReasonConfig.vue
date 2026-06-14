<template>
  <n-space vertical :size="16" style="width: 100%">
    <n-card>
      <n-space justify="space-between" align="center" style="width: 100%">
        <n-text strong style="font-size: 16px">调薪事由分类配置</n-text>
        <n-button type="primary" @click="showModal = true; editingReason = null">
          <template #icon><PlusOutlined /></template>
          新增事由
        </n-button>
      </n-space>
    </n-card>

    <n-tabs v-model:value="activeCategory" type="line" size="large">
      <n-tab-pane
        v-for="cat in categories"
        :key="cat.value"
        :name="cat.value"
        :tab="`${cat.label} (${getCategoryCount(cat.value)})`"
      >
        <n-card>
          <n-data-table
            :columns="columns"
            :data="getReasonsByCategory(cat.value)"
            :row-key="(row: any) => row.id"
            striped
            :pagination="false"
          >
            <template #body="{ rows }">
              <tbody>
                <tr v-for="row in rows" :key="row.id">
                  <td>
                    <n-space align="center">
                      <n-tag :color="reasonCategoryColors[row.category as AdjustmentReasonCategory]" bordered>
                        {{ store.getCategoryLabel(row.category as AdjustmentReasonCategory) }}
                      </n-tag>
                      <n-text strong>{{ row.name }}</n-text>
                    </n-space>
                  </td>
                  <td>{{ row.description || '-' }}</td>
                  <td>
                    <n-space>
                      <n-tag size="small">{{ (row.defaultMinRatio || 0) * 100 }}%</n-tag>
                      <n-text>~</n-text>
                      <n-tag size="small" type="info">{{ (row.defaultMaxRatio || 0) * 100 }}%</n-tag>
                    </n-space>
                  </td>
                  <td>
                    <n-switch v-model:value="row.enabled" @update:value="(v: boolean) => handleToggle(row.id, v)" />
                  </td>
                  <td>
                    <n-space>
                      <n-button size="small" quaternary type="primary" @click="handleEdit(row)">
                        <template #icon><EditOutlined /></template>
                        编辑
                      </n-button>
                      <n-popconfirm @positive-click="handleDelete(row.id)">
                        <template #trigger>
                          <n-button size="small" quaternary type="error">
                            <template #icon><DeleteOutlined /></template>
                            删除
                          </n-button>
                        </template>
                        确定要删除此调薪事由吗？
                      </n-popconfirm>
                    </n-space>
                  </td>
                </tr>
              </tbody>
            </template>
          </n-data-table>
          <n-empty v-if="getReasonsByCategory(cat.value).length === 0" description="暂无数据" />
        </n-card>
      </n-tab-pane>
    </n-tabs>

    <n-modal v-model:show="showModal" preset="card" style="width: 560px" :title="editingReason ? '编辑调薪事由' : '新增调薪事由'" :mask-closable="false">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="120px">
        <n-form-item label="事由分类" path="category">
          <n-select v-model:value="form.category" :options="categoryOptions" placeholder="请选择分类" />
        </n-form-item>
        <n-form-item label="事由名称" path="name">
          <n-input v-model:value="form.name" placeholder="请输入事由名称" />
        </n-form-item>
        <n-form-item label="描述说明" path="description">
          <n-input v-model:value="form.description" type="textarea" :rows="3" placeholder="请输入描述说明" />
        </n-form-item>
        <n-form-item label="最小调整比例" path="defaultMinRatio">
          <n-input-number v-model:value="form.defaultMinRatio" :min="0" :max="1" :step="0.01" :precision="2" style="width: 100%" />
          <n-text depth="3" style="font-size: 12px">例如：0.05 表示 5%</n-text>
        </n-form-item>
        <n-form-item label="最大调整比例" path="defaultMaxRatio">
          <n-input-number v-model:value="form.defaultMaxRatio" :min="0" :max="1" :step="0.01" :precision="2" style="width: 100%" />
          <n-text depth="3" style="font-size: 12px">例如：0.3 表示 30%</n-text>
        </n-form-item>
        <n-form-item label="启用状态">
          <n-switch v-model:value="form.enabled" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showModal = false">取消</n-button>
          <n-button type="primary" @click="handleSave">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </n-space>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useMessage, type FormInst, type FormRules, type DataTableColumns } from 'naive-ui'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@vicons/antd'
import { useSalaryAdjustmentStore } from '@/stores/salaryAdjustment'
import type { AdjustmentReason, AdjustmentReasonCategory } from '@/types'

const store = useSalaryAdjustmentStore()
const message = useMessage()
const formRef = ref<FormInst | null>(null)

const activeCategory = ref<AdjustmentReasonCategory>('annual')
const showModal = ref(false)
const editingReason = ref<AdjustmentReason | null>(null)

const categories = [
  { label: '年度调薪', value: 'annual' as AdjustmentReasonCategory },
  { label: '绩效调薪', value: 'performance' as AdjustmentReasonCategory },
  { label: '晋升调薪', value: 'promotion' as AdjustmentReasonCategory },
  { label: '市场对标', value: 'market' as AdjustmentReasonCategory },
  { label: '资质认证', value: 'certification' as AdjustmentReasonCategory },
  { label: '岗位异动', value: 'transfer' as AdjustmentReasonCategory },
  { label: '特殊调薪', value: 'special' as AdjustmentReasonCategory }
]

const reasonCategoryColors: Record<AdjustmentReasonCategory, string> = {
  annual: '#1890ff',
  performance: '#52c41a',
  promotion: '#722ed1',
  market: '#13c2c2',
  certification: '#fa8c16',
  transfer: '#eb2f96',
  special: '#f5222d'
}

const categoryOptions = computed(() =>
  categories.map((c) => ({ label: c.label, value: c.value }))
)

const form = reactive({
  category: 'annual' as AdjustmentReasonCategory,
  name: '',
  description: '',
  defaultMinRatio: 0.05,
  defaultMaxRatio: 0.15,
  enabled: true
})

const rules: FormRules = {
  category: { required: true, message: '请选择事由分类', trigger: 'change' },
  name: { required: true, message: '请输入事由名称', trigger: 'blur', min: 2, max: 50 },
  description: { max: 200, message: '描述不能超过200字', trigger: 'blur' },
  defaultMinRatio: { required: true, message: '请输入最小调整比例', trigger: 'blur', type: 'number', min: 0, max: 1 },
  defaultMaxRatio: { required: true, message: '请输入最大调整比例', trigger: 'blur', type: 'number', min: 0, max: 1 }
}

const columns: DataTableColumns<any> = [
  { title: '事由名称', key: 'name', width: 200 },
  { title: '描述说明', key: 'description' },
  { title: '建议比例范围', key: 'ratio', width: 180 },
  { title: '启用状态', key: 'enabled', width: 100 },
  { title: '操作', key: 'actions', width: 160 }
]

function getCategoryCount(category: AdjustmentReasonCategory): number {
  return store.reasons.filter((r) => r.category === category).length
}

function getReasonsByCategory(category: AdjustmentReasonCategory): AdjustmentReason[] {
  return store.reasons.filter((r) => r.category === category)
}

function handleEdit(reason: AdjustmentReason) {
  editingReason.value = reason
  Object.assign(form, {
    category: reason.category,
    name: reason.name,
    description: reason.description || '',
    defaultMinRatio: reason.defaultMinRatio || 0.05,
    defaultMaxRatio: reason.defaultMaxRatio || 0.15,
    enabled: reason.enabled
  })
  showModal.value = true
}

function handleDelete(id: string) {
  store.removeReason(id)
  message.success('删除成功')
}

function handleToggle(id: string, enabled: boolean) {
  store.updateReason(id, { enabled })
  message.success(enabled ? '已启用' : '已禁用')
}

async function handleSave() {
  try {
    await formRef.value?.validate()
    if (form.defaultMinRatio > form.defaultMaxRatio) {
      message.error('最小比例不能大于最大比例')
      return
    }
    if (editingReason.value) {
      store.updateReason(editingReason.value.id, { ...form })
      message.success('更新成功')
    } else {
      store.addReason({ ...form })
      message.success('添加成功')
    }
    showModal.value = false
  } catch {
    // validation failed
  }
}
</script>
