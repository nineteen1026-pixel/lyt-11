<template>
  <n-space vertical :size="20" style="width: 100%">
    <n-card>
      <template #header>
        <n-space justify="space-between" style="width: 100%">
          <n-space>
            <n-button quaternary @click="$emit('back')">
              <template #icon><ArrowLeftOutlined /></template>
              返回列表
            </n-button>
            <n-text strong style="font-size: 16px">奖金确认详情</n-text>
          </n-space>
          <n-tag v-if="record" :color="statusColor" bordered={false} type="success">
            {{ statusLabel }}
          </n-tag>
        </n-space>
      </template>

      <n-grid v-if="record" :cols="2" :x-gap="24" :y-gap="16">
        <n-gi>
          <n-descriptions :column="2" bordered label-style="width: 100px">
            <n-descriptions-item label="员工姓名">
              <n-text strong>{{ record.employeeName }}</n-text>
            </n-descriptions-item>
            <n-descriptions-item label="所属部门">
              {{ record.departmentName }}
            </n-descriptions-item>
            <n-descriptions-item label="职位">
              {{ record.position }}
            </n-descriptions-item>
            <n-descriptions-item label="奖金名称">
              {{ record.bonusName }}
            </n-descriptions-item>
          </n-descriptions>
        </n-gi>
        <n-gi>
          <n-descriptions :column="2" bordered label-style="width: 100px">
            <n-descriptions-item label="年度">
              {{ record.year }}
            </n-descriptions-item>
            <n-descriptions-item label="计税方式">
              {{ record.taxMethod === 'oneTime' ? '单独计税' : '综合计税' }}
            </n-descriptions-item>
            <n-descriptions-item label="创建时间">
              {{ record.createdAt }}
            </n-descriptions-item>
            <n-descriptions-item label="截止时间">
              {{ record.deadlineAt }}
            </n-descriptions-item>
          </n-descriptions>
        </n-gi>
      </n-grid>
    </n-card>

    <n-card v-if="record" title="奖金明细">
      <n-grid :cols="3" :x-gap="20">
        <n-gi>
          <n-statistic label="税前奖金" :value="record.grossAmount" :precision="2" prefix="¥">
            <template #suffix>
              <n-text depth="3" style="font-size: 14px">元</n-text>
            </template>
          </n-statistic>
        </n-gi>
        <n-gi>
          <n-statistic label="应扣个税" :value="record.taxAmount" :precision="2" prefix="¥" value-style="color: #f5222d">
            <template #suffix>
              <n-text depth="3" style="font-size: 14px">元</n-text>
            </template>
          </n-statistic>
        </n-gi>
        <n-gi>
          <n-statistic label="实发奖金" :value="record.netAmount" :precision="2" prefix="¥" value-style="color: #52c41a">
            <template #suffix>
              <n-text depth="3" style="font-size: 14px">元</n-text>
            </template>
          </n-statistic>
        </n-gi>
      </n-grid>
    </n-card>

    <n-card v-if="record && record.status === 'signed'" title="电子签收信息">
      <n-descriptions :column="2" bordered>
        <n-descriptions-item label="签收人">
          {{ record.signature }}
        </n-descriptions-item>
        <n-descriptions-item label="签收时间">
          {{ record.signedAt }}
        </n-descriptions-item>
      </n-descriptions>
    </n-card>

    <n-card v-if="record && record.objection" title="异议信息">
      <n-descriptions :column="2" bordered>
        <n-descriptions-item label="异议原因">
          <n-tag type="error" bordered={false}>{{ record.objection.reason }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="申诉人">
          {{ record.objection.objectorName }}
        </n-descriptions-item>
        <n-descriptions-item label="申诉时间" :span="2">
          {{ record.objection.createdAt }}
        </n-descriptions-item>
        <n-descriptions-item label="详细描述" :span="2">
          <n-text>{{ record.objection.description }}</n-text>
        </n-descriptions-item>
      </n-descriptions>
    </n-card>

    <n-card v-if="record && record.review" title="复核结果">
      <n-descriptions :column="2" bordered>
        <n-descriptions-item label="复核结果">
          <n-tag :type="record.review.result === 'confirmed' ? 'success' : 'warning'" bordered={false}>
            {{ record.review.result === 'confirmed' ? '维持原金额' : '已调整金额' }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="复核人">
          {{ record.review.reviewerName }}
        </n-descriptions-item>
        <n-descriptions-item label="复核时间" :span="2">
          {{ record.review.reviewedAt }}
        </n-descriptions-item>
        <n-descriptions-item label="复核意见" :span="2">
          <n-text>{{ record.review.comment }}</n-text>
        </n-descriptions-item>
        <template v-if="record.review.result === 'adjusted'">
          <n-descriptions-item label="调整后税前">
            <n-text>¥{{ record.review.adjustedGrossAmount?.toLocaleString() }}</n-text>
          </n-descriptions-item>
          <n-descriptions-item label="调整后个税">
            <n-text>¥{{ record.review.adjustedTaxAmount?.toLocaleString() }}</n-text>
          </n-descriptions-item>
          <n-descriptions-item label="调整后实发">
            <n-text strong style="color: #52c41a">¥{{ record.review.adjustedNetAmount?.toLocaleString() }}</n-text>
          </n-descriptions-item>
        </template>
      </n-descriptions>
    </n-card>

    <n-card v-if="record && record.status === 'pending'" title="操作区">
      <n-space vertical :size="16" style="width: 100%">
        <n-space justify="center" :size="20">
          <n-button type="primary" size="large" @click="showSignModal = true">
            <template #icon><CheckCircleOutlined /></template>
            确认签收
          </n-button>
          <n-button type="error" size="large" @click="showObjectionModal = true">
            <template #icon><ExclamationCircleOutlined /></template>
            提出异议
          </n-button>
        </n-space>
        <n-text depth="3" style="text-align: center; display: block; font-size: 12px">
          请在 {{ record.deadlineAt }} 前完成确认，逾期未确认将视为自动确认
        </n-text>
      </n-space>
    </n-card>

    <n-modal v-model:show="showSignModal" preset="dialog" title="电子签收确认" :positive-text="'确认签收'" :negative-text="'取消'" @positive-click="handleSign">
      <n-space vertical :size="16">
        <n-text>
          本人已仔细核对奖金明细，确认上述奖金金额计算正确，无任何异议。
        </n-text>
        <n-form label-placement="top">
          <n-form-item label="请输入姓名进行电子签收">
            <n-input v-model:value="signatureName" placeholder="请输入您的姓名" />
          </n-form-item>
        </n-form>
        <n-checkbox v-model:checked="agreedTerms">
          我已阅读并确认奖金明细无误
        </n-checkbox>
      </n-space>
    </n-modal>

    <n-modal v-model:show="showObjectionModal" preset="dialog" title="提出异议申诉" :positive-text="'提交申诉'" :negative-text="'取消'" @positive-click="handleObjection">
      <n-form ref="objectionFormRef" :model="objectionForm" :rules="objectionRules" label-placement="top">
        <n-form-item label="异议原因" path="reason">
          <n-select v-model:value="objectionForm.reason" :options="objectionReasons" placeholder="请选择异议原因" />
        </n-form-item>
        <n-form-item label="详细描述" path="description">
          <n-input v-model:value="objectionForm.description" type="textarea" :rows="4" placeholder="请详细描述您的异议内容..." />
        </n-form-item>
        <n-form-item label="附件证明">
          <n-upload
            :show-file-list="true"
            multiple
            :max="5"
            :custom-request="() => {}"
            @before-upload="handleUpload"
          >
            <n-button>
              <template #icon><UploadOutlined /></template>
              上传附件
            </n-button>
          </n-upload>
        </n-form-item>
      </n-form>
    </n-modal>
  </n-space>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UploadOutlined
} from '@vicons/antd'
import { useBonusStore } from '@/stores/bonus'

const props = defineProps<{
  recordId: string
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'signed'): void
  (e: 'objected'): void
}>()

const store = useBonusStore()
const message = useMessage()
const dialog = useDialog()

const showSignModal = ref(false)
const showObjectionModal = ref(false)
const signatureName = ref('')
const agreedTerms = ref(false)

const objectionFormRef = ref()
const objectionForm = ref({
  reason: '',
  description: ''
})

const objectionReasons: SelectOption[] = [
  { label: '绩效系数争议', value: '绩效系数争议' },
  { label: '金额计算有误', value: '金额计算有误' },
  { label: '基本工资不对', value: '基本工资不对' },
  { label: '工龄计算错误', value: '工龄计算错误' },
  { label: '标签补贴缺失', value: '标签补贴缺失' },
  { label: '部门分配异议', value: '部门分配异议' },
  { label: '其他原因', value: '其他原因' }
]

const objectionRules = {
  reason: { required: true, message: '请选择异议原因', trigger: 'change' },
  description: { required: true, message: '请输入详细描述', trigger: 'blur' }
}

const record = computed(() => store.getConfirmationById(props.recordId))

const statusLabel = computed(() => {
  if (!record.value) return ''
  return store.getConfirmationStatusLabel(record.value.status)
})

const statusColor = computed(() => {
  if (!record.value) return '#8c8c8c'
  return store.getConfirmationStatusColor(record.value.status)
})

function handleSign() {
  if (!signatureName.value.trim()) {
    message.warning('请输入您的姓名')
    return
  }
  if (!agreedTerms.value) {
    message.warning('请先确认奖金明细无误')
    return
  }

  dialog.warning({
    title: '确认签收',
    content: '签收后将无法修改，确认要签收吗？',
    positiveText: '确认签收',
    negativeText: '取消',
    onPositiveClick: () => {
      const ok = store.signBonus(props.recordId, signatureName.value)
      if (ok) {
        message.success('签收成功')
        showSignModal.value = false
        signatureName.value = ''
        agreedTerms.value = false
        emit('signed')
      } else {
        message.error('签收失败')
      }
    }
  })
}

function handleObjection() {
  objectionFormRef.value?.validate((errors: any) => {
    if (!errors) {
      dialog.warning({
        title: '提交异议',
        content: '提交后将进入复核流程，确认提交吗？',
        positiveText: '确认提交',
        negativeText: '取消',
        onPositiveClick: () => {
          const ok = store.submitObjection(
            props.recordId,
            objectionForm.value.reason,
            objectionForm.value.description,
            []
          )
          if (ok) {
            message.success('异议已提交，等待复核')
            showObjectionModal.value = false
            objectionForm.value = { reason: '', description: '' }
            emit('objected')
          } else {
            message.error('提交失败')
          }
        }
      })
    }
  })
}

function handleUpload({ file }: { file: File }) {
  message.info(`已选择文件：${file.name}`)
  return false
}
</script>
