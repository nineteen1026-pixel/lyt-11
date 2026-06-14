<template>
  <n-space vertical :size="16" style="width: 100%">
    <n-card>
      <n-space justify="space-between" align="center" style="width: 100%">
        <n-space vertical :size="8">
          <n-text strong style="font-size: 16px">多层级审批节点配置</n-text>
          <n-text depth="3" style="font-size: 13px">配置调薪申请的审批流程，支持按金额阈值动态匹配审批节点</n-text>
        </n-space>
        <n-button type="primary" @click="showModal = true; editingNode = null">
          <template #icon><PlusOutlined /></template>
          新增节点
        </n-button>
      </n-space>
    </n-card>

    <n-card title="当前审批流程">
      <template #header-extra>
        <n-tag type="info">共 {{ sortedWorkflow.length }} 个审批节点</n-tag>
      </template>

      <n-steps :current="-1" vertical>
        <n-step
          v-for="(node, index) in sortedWorkflow"
          :key="node.id"
          :title="`${index + 1}. ${node.name}`"
          :description="getNodeDescription(node)"
          status="process"
        >
          <template #action>
            <div class="node-actions">
              <n-space>
                <n-button
                  size="small"
                  :disabled="index === 0"
                  @click="handleMove(node.id, 'up')"
                >
                  <template #icon><ArrowUpOutlined /></template>
                  上移
                </n-button>
                <n-button
                  size="small"
                  :disabled="index === sortedWorkflow.length - 1"
                  @click="handleMove(node.id, 'down')"
                >
                  <template #icon><ArrowDownOutlined /></template>
                  下移
                </n-button>
                <n-button
                  size="small"
                  type="primary"
                  quaternary
                  @click="handleEdit(node)"
                >
                  <template #icon><EditOutlined /></template>
                  编辑
                </n-button>
                <n-popconfirm @positive-click="handleDelete(node.id)">
                  <template #trigger>
                    <n-button size="small" type="error" quaternary>
                      <template #icon><DeleteOutlined /></template>
                      删除
                    </n-button>
                  </template>
                  确定要删除此审批节点吗？
                </n-popconfirm>
              </n-space>
            </div>
          </template>
        </n-step>
      </n-steps>

      <n-empty v-if="sortedWorkflow.length === 0" description="暂无审批节点，请先添加">
        <template #extra>
          <n-button type="primary" @click="showModal = true; editingNode = null">
            <template #icon><PlusOutlined /></template>
            添加第一个节点
          </n-button>
        </template>
      </n-empty>
    </n-card>

    <n-card title="审批流程说明">
      <n-alert type="info" show-icon>
        <template #icon>
          <n-icon><InfoCircleOutlined /></n-icon>
        </template>
        <ul style="margin: 0; padding-left: 20px">
          <li>审批节点按顺序执行，上一节点通过后自动进入下一节点</li>
          <li>每个节点可设置金额阈值，只有当调薪年度总额在阈值范围内才会触发该节点</li>
          <li>未设置阈值的节点对所有金额生效</li>
          <li>必填节点必须审批，非必填节点可根据金额阈值自动跳过</li>
        </ul>
      </n-alert>
    </n-card>

    <n-modal v-model:show="showModal" preset="card" style="width: 560px" :title="editingNode ? '编辑审批节点' : '新增审批节点'" :mask-closable="false">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="120px">
        <n-form-item label="节点名称" path="name">
          <n-input v-model:value="form.name" placeholder="请输入节点名称" />
        </n-form-item>
        <n-form-item label="节点类型" path="type">
          <n-select v-model:value="form.type" :options="nodeTypeOptions" placeholder="请选择节点类型" />
        </n-form-item>
        <n-form-item label="审批角色" path="approverRole">
          <n-input v-model:value="form.approverRole" placeholder="请输入审批角色（如：HRBP、财务总监等）" />
        </n-form-item>
        <n-form-item label="审批顺序" path="order">
          <n-input-number v-model:value="form.order" :min="1" :precision="0" style="width: 100%" />
        </n-form-item>
        <n-form-item label="最低审批金额">
          <n-input-number v-model:value="form.minApprovalAmount" :min="0" :precision="2" style="width: 100%" />
          <n-text depth="3" style="font-size: 12px">年度调薪总额达到此金额时才需要此节点审批（元/年），留空表示不限制</n-text>
        </n-form-item>
        <n-form-item label="最高审批金额">
          <n-input-number v-model:value="form.maxApprovalAmount" :min="0" :precision="2" style="width: 100%" />
          <n-text depth="3" style="font-size: 12px">年度调薪总额不超过此金额时才需要此节点审批（元/年），留空表示不限制</n-text>
        </n-form-item>
        <n-form-item label="是否必填">
          <n-space align="center">
            <n-switch v-model:value="form.required" />
            <n-text depth="3">必填节点不可跳过</n-text>
          </n-space>
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
import { useMessage, type FormInst, type FormRules } from 'naive-ui'
import {
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined
} from '@vicons/antd'
import { useSalaryAdjustmentStore } from '@/stores/salaryAdjustment'
import type { ApprovalNode, ApprovalNodeType } from '@/types'

const store = useSalaryAdjustmentStore()
const message = useMessage()
const formRef = ref<FormInst | null>(null)

const showModal = ref(false)
const editingNode = ref<ApprovalNode | null>(null)

const nodeTypeOptions = [
  { label: '直属上级', value: 'direct_manager' as ApprovalNodeType },
  { label: '部门负责人', value: 'department_head' as ApprovalNodeType },
  { label: 'HR审核', value: 'hr' as ApprovalNodeType },
  { label: '财务审核', value: 'finance' as ApprovalNodeType },
  { label: 'CEO审批', value: 'ceo' as ApprovalNodeType },
  { label: '自定义节点', value: 'custom' as ApprovalNodeType }
]

const form = reactive({
  name: '',
  type: 'direct_manager' as ApprovalNodeType,
  approverRole: '',
  order: 1,
  minApprovalAmount: 0 as number | undefined,
  maxApprovalAmount: undefined as number | undefined,
  required: true
})

const rules: FormRules = {
  name: { required: true, message: '请输入节点名称', trigger: 'blur', min: 2, max: 50 },
  type: { required: true, message: '请选择节点类型', trigger: 'change' },
  order: { required: true, message: '请输入审批顺序', trigger: 'blur', type: 'number', min: 1 }
}

const sortedWorkflow = computed(() => store.sortedWorkflow)

function getNodeDescription(node: ApprovalNode): string {
  const parts: string[] = []
  parts.push(store.getNodeTypeLabel(node.type))
  if (node.approverRole) {
    parts.push(`角色：${node.approverRole}`)
  }
  if (node.minApprovalAmount !== undefined || node.maxApprovalAmount !== undefined) {
    const min = node.minApprovalAmount !== undefined ? `≥¥${node.minApprovalAmount.toLocaleString()}` : ''
    const max = node.maxApprovalAmount !== undefined ? `≤¥${node.maxApprovalAmount.toLocaleString()}` : ''
    parts.push(`金额：${[min, max].filter(Boolean).join(' ~ ') || '无限制'}`)
  }
  parts.push(node.required ? '必填' : '可选')
  return parts.join(' | ')
}

function handleEdit(node: ApprovalNode) {
  editingNode.value = node
  Object.assign(form, {
    name: node.name,
    type: node.type,
    approverRole: node.approverRole || '',
    order: node.order,
    minApprovalAmount: node.minApprovalAmount,
    maxApprovalAmount: node.maxApprovalAmount,
    required: node.required
  })
  showModal.value = true
}

function handleDelete(id: string) {
  store.removeApprovalNode(id)
  message.success('删除成功')
}

function handleMove(id: string, direction: 'up' | 'down') {
  store.moveApprovalNode(id, direction)
}

async function handleSave() {
  try {
    await formRef.value?.validate()
    if (form.minApprovalAmount !== undefined && form.maxApprovalAmount !== undefined) {
      if (form.minApprovalAmount > form.maxApprovalAmount) {
        message.error('最低金额不能大于最高金额')
        return
      }
    }
    const data = {
      name: form.name,
      type: form.type,
      approverRole: form.approverRole || undefined,
      order: form.order,
      minApprovalAmount: form.minApprovalAmount,
      maxApprovalAmount: form.maxApprovalAmount,
      required: form.required
    }
    if (editingNode.value) {
      store.updateApprovalNode(editingNode.value.id, data)
      message.success('更新成功')
    } else {
      store.addApprovalNode(data)
      message.success('添加成功')
    }
    showModal.value = false
  } catch {
    // validation failed
  }
}
</script>

<style scoped>
.node-actions {
  padding-top: 8px;
}
</style>
