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
                <n-button
                  size="small"
                  type="warning"
                  quaternary
                  @click="openDelegationModal(node)"
                >
                  <template #icon><UserSwitchOutlined /></template>
                  委托代办
                  <n-tag
                    v-if="getActiveDelegationCount(node) > 0"
                    size="small"
                    type="warning"
                    style="margin-left: 4px"
                  >
                    {{ getActiveDelegationCount(node) }}
                  </n-tag>
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

    <n-modal v-model:show="showDelegationModal" preset="card" style="width: 720px" title="委托代办配置" :mask-closable="false">
      <n-space vertical :size="16" style="width: 100%">
        <n-alert type="info" :bordered="false">
          <template #icon>
            <n-icon><InfoCircleOutlined /></n-icon>
          </template>
          为「{{ currentDelegationNode?.name }}」配置委托代办，授权人可指定代审人在有效期内代为审批。
        </n-alert>

        <n-space justify="space-between" align="center" style="width: 100%">
          <n-text strong>委托列表</n-text>
          <n-button type="primary" size="small" @click="showAddDelegation = true">
            <template #icon><PlusOutlined /></template>
            新增委托
          </n-button>
        </n-space>

        <div v-if="currentDelegationList.length === 0" class="delegation-empty">
          <n-empty description="暂无委托配置" />
        </div>

        <n-data-table
          v-else
          :columns="delegationColumns"
          :data="currentDelegationList"
          :pagination="false"
          :bordered="false"
          size="small"
        />

        <n-modal v-model:show="showAddDelegation" preset="card" style="width: 500px" :title="editingDelegation ? '编辑委托' : '新增委托'" :mask-closable="false">
          <n-form ref="delegationFormRef" :model="delegationForm" :rules="delegationRules" label-placement="left" label-width="100px">
            <n-form-item label="授权人" path="delegatorName">
              <n-input v-model:value="delegationForm.delegatorName" placeholder="请输入授权人姓名" />
            </n-form-item>
            <n-form-item label="代审人" path="delegateName">
              <n-input v-model:value="delegationForm.delegateName" placeholder="请输入代审人姓名" />
            </n-form-item>
            <n-form-item label="有效期开始" path="startDate">
              <n-date-picker
                v-model:value="delegationForm.startDate"
                type="date"
                style="width: 100%"
                placeholder="请选择开始日期"
                value-format="YYYY-MM-DD"
              />
            </n-form-item>
            <n-form-item label="有效期结束" path="endDate">
              <n-date-picker
                v-model:value="delegationForm.endDate"
                type="date"
                style="width: 100%"
                placeholder="请选择结束日期"
                value-format="YYYY-MM-DD"
              />
            </n-form-item>
            <n-form-item label="启用">
              <n-switch v-model:value="delegationForm.enabled" />
            </n-form-item>
          </n-form>
          <template #footer>
            <n-space justify="end">
              <n-button @click="showAddDelegation = false; editingDelegation = null">取消</n-button>
              <n-button type="primary" @click="handleSaveDelegation">确定</n-button>
            </n-space>
          </template>
        </n-modal>
      </n-space>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showDelegationModal = false">关闭</n-button>
        </n-space>
      </template>
    </n-modal>
  </n-space>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h } from 'vue'
import { useMessage, type FormInst, type FormRules } from 'naive-ui'
import {
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  UserSwitchOutlined
} from '@vicons/antd'
import { useSalaryAdjustmentStore } from '@/stores/salaryAdjustment'
import type { ApprovalNode, ApprovalNodeType, ApprovalDelegation } from '@/types'
import dayjs from 'dayjs'

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

const showDelegationModal = ref(false)
const showAddDelegation = ref(false)
const currentDelegationNode = ref<ApprovalNode | null>(null)
const editingDelegation = ref<ApprovalDelegation | null>(null)
const delegationFormRef = ref<FormInst | null>(null)

const delegationForm = reactive({
  delegatorName: '',
  delegateName: '',
  startDate: null as string | null,
  endDate: null as string | null,
  enabled: true
})

const delegationRules: FormRules = {
  delegatorName: { required: true, message: '请输入授权人姓名', trigger: 'blur' },
  delegateName: { required: true, message: '请输入代审人姓名', trigger: 'blur' },
  startDate: { required: true, message: '请选择开始日期', trigger: 'change' },
  endDate: { required: true, message: '请选择结束日期', trigger: 'change' }
}

const sortedWorkflow = computed(() => store.sortedWorkflow)

const currentDelegationList = computed(() => {
  return currentDelegationNode.value?.delegations || []
})

const delegationColumns = [
  {
    title: '授权人',
    key: 'delegatorName',
    width: 120
  },
  {
    title: '代审人',
    key: 'delegateName',
    width: 120
  },
  {
    title: '有效期',
    key: 'validity',
    width: 240,
    render: (row: ApprovalDelegation) => {
      const isExpired = dayjs().isAfter(row.endDate)
      const isNotStarted = dayjs().isBefore(row.startDate)
      let statusText = ''
      let statusType = 'default' as any
      if (isExpired) {
        statusText = '已过期'
        statusType = 'default'
      } else if (isNotStarted) {
        statusText = '未生效'
        statusType = 'info'
      } else {
        statusText = '有效中'
        statusType = 'success'
      }
      return h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
        [
          h('span', {}, `${row.startDate} ~ ${row.endDate}`),
          h('n-tag', { size: 'small', type: row.enabled ? statusType : 'default' }, {
            default: () => row.enabled ? statusText : '已停用'
          })
        ]
      )
    }
  },
  {
    title: '状态',
    key: 'enabled',
    width: 100,
    render: (row: ApprovalDelegation) =>
      h('n-tag', { size: 'small', type: row.enabled ? 'success' : 'default' }, {
        default: () => row.enabled ? '启用' : '停用'
      })
  },
  {
    title: '操作',
    key: 'action',
    width: 160,
    render: (row: ApprovalDelegation) =>
      h('n-space', { size: 'small' }, {
        default: () => [
          h('n-button', {
            size: 'small',
            type: 'primary',
            quaternary: true,
            onClick: () => handleEditDelegation(row)
          }, { default: () => '编辑' }),
          h('n-popconfirm', {
            onPositiveClick: () => handleDeleteDelegation(row.id)
          }, {
            default: () => h('n-button', {
              size: 'small',
              type: 'error',
              quaternary: true
            }, { default: () => '删除' }),
            trigger: () => '确定删除此委托配置吗？'
          })
        ]
      })
  }
]

function getActiveDelegationCount(node: ApprovalNode): number {
  const now = dayjs()
  return (node.delegations || []).filter(
    (d) => d.enabled && !now.isAfter(d.endDate) && !now.isBefore(d.startDate)
  ).length
}

function openDelegationModal(node: ApprovalNode) {
  currentDelegationNode.value = node
  showDelegationModal.value = true
}

function handleEditDelegation(delegation: ApprovalDelegation) {
  editingDelegation.value = delegation
  Object.assign(delegationForm, {
    delegatorName: delegation.delegatorName,
    delegateName: delegation.delegateName,
    startDate: delegation.startDate,
    endDate: delegation.endDate,
    enabled: delegation.enabled
  })
  showAddDelegation.value = true
}

function handleDeleteDelegation(id: string) {
  if (!currentDelegationNode.value) return
  store.deleteDelegation(currentDelegationNode.value.id, id)
  message.success('删除成功')
}

async function handleSaveDelegation() {
  try {
    await delegationFormRef.value?.validate()
    if (delegationForm.startDate && delegationForm.endDate) {
      if (dayjs(delegationForm.startDate).isAfter(delegationForm.endDate)) {
        message.error('开始日期不能晚于结束日期')
        return
      }
    }
    if (!currentDelegationNode.value) return
    const data = {
      delegatorName: delegationForm.delegatorName,
      delegateName: delegationForm.delegateName,
      startDate: delegationForm.startDate!,
      endDate: delegationForm.endDate!,
      enabled: delegationForm.enabled
    }
    if (editingDelegation.value) {
      store.updateDelegation(currentDelegationNode.value.id, editingDelegation.value.id, data)
      message.success('更新成功')
    } else {
      store.addDelegation(currentDelegationNode.value.id, data)
      message.success('添加成功')
    }
    showAddDelegation.value = false
    editingDelegation.value = null
    Object.assign(delegationForm, {
      delegatorName: '',
      delegateName: '',
      startDate: null,
      endDate: null,
      enabled: true
    })
  } catch {
    // validation failed
  }
}

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
.delegation-empty {
  padding: 24px 0;
}
</style>
