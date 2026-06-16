<template>
  <n-space vertical :size="20" style="width: 100%">
    <n-card>
      <template #header>
        <n-space justify="space-between" style="width: 100%">
        <n-text strong style="font-size: 16px">奖金确认批次管理</n-text>
        <n-button type="primary" @click="showCreateModal = true">
          <template #icon><PlusOutlined /></template>
          新建批次
        </n-button>
      </n-space>
      </template>
      <n-data-table
        :columns="columns"
        :data="batches"
        :pagination="pagination"
        :bordered="false"
      />
    </n-card>

    <n-modal v-model:show="showCreateModal" preset="dialog" title="新建确认批次" positive-text="创建" negative-text="取消" @positive-click="handleCreate">
      <n-form ref="formRef" :model="formData" :rules="rules" label-placement="top">
        <n-form-item label="批次名称" path="name">
          <n-input v-model:value="formData.name" placeholder="请输入批次名称" />
        </n-form-item>
        <n-form-item label="奖金名称" path="bonusName">
          <n-input v-model:value="formData.bonusName" placeholder="请输入奖金名称" />
        </n-form-item>
        <n-form-item label="年度" path="year">
          <n-input-number v-model:value="formData.year" :min="2020" :max="2100" style="width: 100%" />
        </n-form-item>
        <n-form-item label="签收期限（天）" path="deadlineDays">
          <n-input-number v-model:value="formData.deadlineDays" :min="1" :max="30" style="width: 100%" />
        </n-form-item>
      </n-form>
    </n-modal>
  </n-space>
</template>

<script setup lang="ts">
import { ref, h, computed, onMounted } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { PlusOutlined, EyeOutlined, PlayCircleOutlined, DeleteOutlined } from '@vicons/antd'
import { useBonusStore } from '@/stores/bonus'
import dayjs from 'dayjs'
import type { BonusConfirmationBatch } from '@/types'

const emit = defineEmits<{
  (e: 'viewBatch', batchId: string): void
}>()

const store = useBonusStore()
const message = useMessage()
const dialog = useDialog()

const showCreateModal = ref(false)
const formRef = ref()
const formData = ref({
  name: '',
  bonusName: '',
  year: dayjs().year(),
  deadlineDays: 7
})

const rules = {
  name: { required: true, message: '请输入批次名称', trigger: 'blur' },
  bonusName: { required: true, message: '请输入奖金名称', trigger: 'blur' },
  year: { required: true, message: '请选择年度', trigger: 'change' },
  deadlineDays: { required: true, message: '请输入签收期限', trigger: 'blur' }
}

const batches = computed(() => store.bonusConfirmationBatches)

const pagination = {
  pageSize: 10
}

const getBatchStatusLabel = (status: string) => {
  const map: Record<string, { label: string; color: string }> = {
    draft: { label: '草稿', color: '#8c8c8c' },
    published: { label: '已发布', color: '#1890ff' },
    completed: { label: '已完成', color: '#52c41a' }
  }
  return map[status] || { label: status, color: '#8c8c8c' }
}

const columns: DataTableColumns<BonusConfirmationBatch> = [
  {
    title: '批次名称',
    key: 'name',
    width: 200
  },
  {
    title: '奖金名称',
    key: 'bonusName',
    width: 180
  },
  {
    title: '年度',
    key: 'year',
    width: 80
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) => {
      const status = getBatchStatusLabel(row.status)
      return h('n-tag', { type: 'success', color: status.color, bordered: false }, { default: () => status.label })
    }
  },
  {
    title: '签收期限',
    key: 'deadlineDays',
    width: 100,
    render: (row) => `${row.deadlineDays}天`
  },
  {
    title: '总人数',
    key: 'totalConfirmations',
    width: 80
  },
  {
    title: '已签收',
    key: 'signedCount',
    width: 80,
    render: (row) => h('n-text', { style: { color: '#52c41a' } }, { default: () => row.signedCount })
  },
  {
    title: '待签收',
    key: 'pendingCount',
    width: 80,
    render: (row) => h('n-text', { style: { color: '#fa8c16' } }, { default: () => row.pendingCount })
  },
  {
    title: '有异议',
    key: 'objectedCount',
    width: 80,
    render: (row) => h('n-text', { style: { color: '#f5222d' } }, { default: () => row.objectedCount })
  },
  {
    title: '已超时',
    key: 'timeoutCount',
    width: 80,
    render: (row) => h('n-text', { style: { color: '#8c8c8c' } }, { default: () => row.timeoutCount })
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 160
  },
  {
    title: '发布时间',
    key: 'publishedAt',
    width: 160,
    render: (row) => row.publishedAt || '-'
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (row) => {
      return h('n-space', {}, {
        default: () => [
          h('n-button', {
            size: 'small',
            type: 'primary',
            quaternary: true,
            onClick: () => emit('viewBatch', row.id)
          }, {
            icon: () => h(EyeOutlined),
            default: () => '查看'
          }),
          row.status === 'draft' ? h('n-button', {
            size: 'small',
            type: 'success',
            quaternary: true,
            onClick: () => handlePublish(row.id)
          }, {
            icon: () => h(PlayCircleOutlined),
            default: () => '发布'
          }) : null,
          row.status === 'draft' ? h('n-button', {
            size: 'small',
            type: 'error',
            quaternary: true,
            onClick: () => handleDelete(row.id)
          }, {
            icon: () => h(DeleteOutlined),
            default: () => '删除'
          }) : null
        ].filter(Boolean)
      })
    }
  }
]

function handleCreate() {
  formRef.value?.validate((errors: any) => {
    if (!errors) {
      store.createConfirmationBatch({
        name: formData.value.name,
        year: formData.value.year,
        bonusName: formData.value.bonusName,
        deadlineDays: formData.value.deadlineDays
      })
      message.success('批次创建成功')
      showCreateModal.value = false
      formData.value = {
        name: '',
        bonusName: '',
        year: dayjs().year(),
        deadlineDays: 7
      }
    }
  })
}

function handlePublish(batchId: string) {
  dialog.warning({
    title: '确认发布',
    content: '发布后将生成所有员工的确认单，员工可以开始签收。是否确认发布？',
    positiveText: '确认发布',
    negativeText: '取消',
    onPositiveClick: () => {
      const ok = store.publishConfirmationBatch(batchId)
      if (ok) {
        message.success('批次发布成功')
      } else {
        message.error('发布失败')
      }
    }
  })
}

function handleDelete(batchId: string) {
  dialog.warning({
    title: '确认删除',
    content: '删除后将无法恢复，是否确认删除该批次？',
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: () => {
      const ok = store.deleteConfirmationBatch(batchId)
      if (ok) {
        message.success('删除成功')
      } else {
        message.error('删除失败，仅草稿状态可删除')
      }
    }
  })
}

onMounted(() => {
  store.checkTimeouts()
})
</script>
