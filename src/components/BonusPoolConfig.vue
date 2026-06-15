<template>
  <n-card title="奖金池与分配配置" :bordered="false">
    <n-tabs type="line" animated v-model:value="activeTab">
      <n-tab-pane name="pool" tab="奖金池设置">
        <n-form :model="store.bonusPool" label-placement="left" label-width="180px">
          <n-form-item label="奖金总额（元）">
            <n-input-number
              v-model:value="store.bonusPool.totalAmount"
              :min="0"
              :step="10000"
              style="width: 100%"
              show-group-separator
            />
          </n-form-item>
          <n-form-item label="基础薪资倍数">
            <n-input-number
              v-model:value="store.bonusPool.baseRatio"
              :min="0"
              :max="36"
              :step="0.5"
              style="width: 100%"
            />
          </n-form-item>
          <n-form-item label="绩效影响比例">
            <n-slider v-model:value="store.bonusPool.performanceRatio" :min="0" :max="2" :step="0.05" />
            <n-text type="info" style="margin-top: 8px; display: block">
              当前：{{ (store.bonusPool.performanceRatio * 100).toFixed(0) }}%
            </n-text>
          </n-form-item>
          <n-form-item label="工龄影响比例">
            <n-slider v-model:value="store.bonusPool.tenureRatio" :min="0" :max="1" :step="0.05" />
            <n-text type="info" style="margin-top: 8px; display: block">
              当前：{{ (store.bonusPool.tenureRatio * 100).toFixed(0) }}%（每满1年加5%，上限50%）
            </n-text>
          </n-form-item>

          <n-divider />

          <n-form-item label="单人奖金封顶">
            <n-space align="center">
              <n-switch v-model:value="store.bonusPool.capEnabled" />
              <n-input-number
                v-model:value="store.bonusPool.capAmount"
                :min="0"
                :step="10000"
                :disabled="!store.bonusPool.capEnabled"
                style="width: 200px"
                show-group-separator
              />
              <n-text type="info" v-if="store.bonusPool.capEnabled">
                超过 {{ formatCurrency(store.bonusPool.capAmount) }} 的部分按比例平摊给其他人
              </n-text>
            </n-space>
          </n-form-item>

          <n-form-item label="单人奖金保底">
            <n-space align="center">
              <n-switch v-model:value="store.bonusPool.floorEnabled" />
              <n-input-number
                v-model:value="store.bonusPool.floorAmount"
                :min="0"
                :step="1000"
                :disabled="!store.bonusPool.floorEnabled"
                style="width: 200px"
                show-group-separator
              />
              <n-text type="info" v-if="store.bonusPool.floorEnabled">
                不足 {{ formatCurrency(store.bonusPool.floorAmount) }} 的差额按比例从其他人扣除
              </n-text>
            </n-space>
          </n-form-item>
        </n-form>

        <n-divider />

        <n-statistic label="已配置资金池" :value="store.bonusPool.totalAmount">
          <template #suffix>元</template>
        </n-statistic>
      </n-tab-pane>

      <n-tab-pane name="department" tab="部门分配">
        <n-space vertical :size="16" style="width: 100%">
          <n-space>
            <n-button type="primary" size="small" @click="showAddDeptModal = true">
              <template #icon><AddOutlined /></template>
              新增部门
            </n-button>
            <n-button size="small" @click="normalizeRatios">
              <template #icon><ReloadOutlined /></template>
              归一化比例
            </n-button>
          </n-space>

          <div v-for="dept in store.departments" :key="dept.id" class="dept-card">
            <n-card size="small">
              <template #header>
                <n-space justify="space-between" style="width: 100%">
                  <n-space>
                    <n-tag type="info">{{ dept.name }}</n-tag>
                    <n-button
                      size="tiny"
                      type="error"
                      quaternary
                      @click="handleDeleteDept(dept.id)"
                    >
                      <template #icon><DeleteOutlined /></template>
                      删除部门
                    </n-button>
                  </n-space>
                  <n-statistic label="部门分配" :value="store.departmentAllocations[dept.id] || 0">
                    <template #suffix>元</template>
                  </n-statistic>
                </n-space>
              </template>

              <n-form label-placement="left" label-width="120px">
                <n-form-item label="部门名称">
                  <n-input :value="dept.name" @update:value="(v: string) => store.updateDepartment(dept.id, { name: v })" />
                </n-form-item>
                <n-form-item label="分配比例">
                  <n-input-number
                    :value="dept.allocationRatio"
                    @update:value="(v: number | null) => handleRatioChange(dept.id, Number(v ?? 0))"
                    :min="0"
                    :max="1"
                    :step="0.05"
                    style="width: 100%"
                  />
                </n-form-item>
                <n-progress
                  type="line"
                  :percentage="Number((dept.allocationRatio * 100).toFixed(0))"
                  :show-indicator="false"
                  style="margin-top: 4px"
                />
              </n-form>

              <n-divider style="margin: 16px 0" />

              <n-space justify="space-between" style="margin-bottom: 12px">
                <n-text strong>员工列表（{{ dept.employees.length }}人）</n-text>
                <n-button size="small" type="primary" ghost @click="openAddEmployee(dept.id)">
                  <template #icon><UserAddOutlined /></template>
                  添加员工
                </n-button>
              </n-space>

              <n-data-table
                :columns="employeeColumns"
                :data="dept.employees"
                :pagination="false"
                size="small"
                :bordered="false"
              />
            </n-card>
          </div>

          <n-alert type="info" :show-icon="true">
            合计比例：{{ totalRatioText }}
            <span v-if="Math.abs(totalRatio - 1) > 0.001" style="color: #d03050; margin-left: 8px">
              （建议归一化至100%）
            </span>
          </n-alert>
        </n-space>
      </n-tab-pane>

      <n-tab-pane name="employee" tab="员工详情">
        <EmployeeDetail />
      </n-tab-pane>

      <n-tab-pane name="version" tab="方案版本管理">
        <n-space vertical :size="16" style="width: 100%">
          <n-space justify="space-between" style="width: 100%">
            <n-space>
              <n-select
                v-model:value="versionFilter"
                :options="versionFilterOptions"
                style="width: 150px"
                size="small"
              />
              <n-input
                v-model:value="versionSearch"
                placeholder="搜索版本名称或编号"
                clearable
                size="small"
                style="width: 250px"
              />
            </n-space>
            <n-space>
              <n-button
                type="primary"
                size="small"
                @click="openCreateVersionModal"
              >
                <template #icon><AddOutlined /></template>
                创建新版本
              </n-button>
            </n-space>
          </n-space>

          <n-alert v-if="store.getCurrentVersion()" type="success" :show-icon="true">
            <template #title>
              当前生效版本：{{ store.getCurrentVersion()?.versionNo }} - {{ store.getCurrentVersion()?.name }}
            </template>
            <template #default>
              审批人：{{ store.getCurrentVersion()?.approvedBy }} |
              审批时间：{{ store.getCurrentVersion()?.approvedAt }}
            </template>
          </n-alert>

          <n-data-table
            :columns="versionColumns"
            :data="filteredVersions"
            :pagination="{ pageSize: 10 }"
            size="small"
            :bordered="false"
          />
        </n-space>
      </n-tab-pane>
    </n-tabs>

    <n-modal v-model:show="showAddDeptModal" preset="dialog" title="新增部门" @positive-click="handleAddDept">
      <n-form :model="newDeptForm" label-placement="left" label-width="100px">
        <n-form-item label="部门名称">
          <n-input v-model:value="newDeptForm.name" placeholder="请输入部门名称" />
        </n-form-item>
        <n-form-item label="分配比例">
          <n-input-number v-model:value="newDeptForm.allocationRatio" :min="0" :max="1" :step="0.05" style="width: 100%" />
        </n-form-item>
      </n-form>
    </n-modal>

    <n-modal v-model:show="showAddEmployeeModal" preset="dialog" title="新增员工" @positive-click="handleAddEmployee">
      <n-form :model="newEmployeeForm" label-placement="left" label-width="100px">
        <n-form-item label="姓名">
          <n-input v-model:value="newEmployeeForm.name" placeholder="请输入姓名" />
        </n-form-item>
        <n-form-item label="职位">
          <n-input v-model:value="newEmployeeForm.position" placeholder="请输入职位" />
        </n-form-item>
        <n-form-item label="月薪（元）">
          <n-input-number v-model:value="newEmployeeForm.baseSalary" :min="0" :step="1000" style="width: 100%" show-group-separator />
        </n-form-item>
        <n-form-item label="绩效等级">
          <n-select
            v-model:value="newEmployeeForm.performanceLevelId"
            :options="performanceLevelOptions"
          />
        </n-form-item>
        <n-form-item label="工龄（年）">
          <n-input-number v-model:value="newEmployeeForm.yearsOfService" :min="0" :max="50" style="width: 100%" />
        </n-form-item>
      </n-form>
    </n-modal>

    <n-modal v-model:show="showCreateVersionModal" preset="dialog" title="创建新版本" @positive-click="handleCreateVersion" positive-text="创建">
      <n-form :model="newVersionForm" label-placement="left" label-width="100px">
        <n-form-item label="版本名称" required>
          <n-input v-model:value="newVersionForm.name" placeholder="请输入版本名称" />
        </n-form-item>
        <n-form-item label="版本描述">
          <n-input v-model:value="newVersionForm.description" placeholder="请输入版本描述" type="textarea" :rows="3" />
        </n-form-item>
        <n-form-item label="变更摘要" required>
          <n-input v-model:value="newVersionForm.changeSummary" placeholder="请输入本次变更的主要内容" type="textarea" :rows="3" />
        </n-form-item>
      </n-form>
    </n-modal>

    <n-modal v-model:show="showVersionDetailModal" preset="card" title="版本详情" style="width: 900px">
      <div v-if="selectedVersion" class="version-detail">
        <n-descriptions bordered :column="2" size="small">
          <n-descriptions-item label="版本编号">
            {{ selectedVersion.versionNo }}
          </n-descriptions-item>
          <n-descriptions-item label="版本名称">
            {{ selectedVersion.name }}
          </n-descriptions-item>
          <n-descriptions-item label="状态">
            <n-tag :type="getStatusType(selectedVersion.status)">
              {{ getStatusText(selectedVersion.status) }}
            </n-tag>
            <n-tag v-if="selectedVersion.isCurrent" type="success" style="margin-left: 8px">
              当前生效
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="创建人">
            {{ selectedVersion.createdBy }}
          </n-descriptions-item>
          <n-descriptions-item label="创建时间">
            {{ selectedVersion.createdAt }}
          </n-descriptions-item>
          <n-descriptions-item label="更新时间">
            {{ selectedVersion.updatedAt }}
          </n-descriptions-item>
          <n-descriptions-item v-if="selectedVersion.approvedBy" label="审批人">
            {{ selectedVersion.approvedBy }}
          </n-descriptions-item>
          <n-descriptions-item v-if="selectedVersion.approvedAt" label="审批时间">
            {{ selectedVersion.approvedAt }}
          </n-descriptions-item>
          <n-descriptions-item v-if="selectedVersion.rollbackFromVersionId" label="回滚来源">
            从版本 {{ getVersionNoById(selectedVersion.rollbackFromVersionId) }} 回滚
          </n-descriptions-item>
          <n-descriptions-item label="版本描述" :span="2">
            {{ selectedVersion.description || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="变更摘要" :span="2">
            {{ selectedVersion.changeSummary }}
          </n-descriptions-item>
          <n-descriptions-item v-if="selectedVersion.rejectionReason" label="驳回原因" :span="2">
            <n-text type="error">{{ selectedVersion.rejectionReason }}</n-text>
          </n-descriptions-item>
        </n-descriptions>

        <n-tabs v-model:value="versionDetailTab" type="line" style="margin-top: 16px">
          <n-tab-pane name="snapshot" tab="配置快照">
            <n-space vertical style="width: 100%">
              <n-card title="奖金池配置" size="small">
                <n-descriptions :column="2" size="small">
                  <n-descriptions-item label="奖金总额">
                    {{ formatCurrency(selectedVersion.snapshot.bonusPool.totalAmount) }} 元
                  </n-descriptions-item>
                  <n-descriptions-item label="基础薪资倍数">
                    {{ selectedVersion.snapshot.bonusPool.baseRatio }}x
                  </n-descriptions-item>
                  <n-descriptions-item label="绩效影响比例">
                    {{ (selectedVersion.snapshot.bonusPool.performanceRatio * 100).toFixed(0) }}%
                  </n-descriptions-item>
                  <n-descriptions-item label="工龄影响比例">
                    {{ (selectedVersion.snapshot.bonusPool.tenureRatio * 100).toFixed(0) }}%
                  </n-descriptions-item>
                  <n-descriptions-item label="奖金封顶">
                    {{ selectedVersion.snapshot.bonusPool.capEnabled ? formatCurrency(selectedVersion.snapshot.bonusPool.capAmount) + ' 元' : '未启用' }}
                  </n-descriptions-item>
                  <n-descriptions-item label="奖金保底">
                    {{ selectedVersion.snapshot.bonusPool.floorEnabled ? formatCurrency(selectedVersion.snapshot.bonusPool.floorAmount) + ' 元' : '未启用' }}
                  </n-descriptions-item>
                </n-descriptions>
              </n-card>
              <n-card title="部门分配" size="small">
                <n-data-table
                  :columns="deptSnapshotColumns"
                  :data="selectedVersion.snapshot.departments"
                  :pagination="false"
                  size="small"
                />
              </n-card>
              <n-card title="绩效等级" size="small">
                <n-data-table
                  :columns="levelSnapshotColumns"
                  :data="selectedVersion.snapshot.performanceLevels"
                  :pagination="false"
                  size="small"
                />
              </n-card>
            </n-space>
          </n-tab-pane>
          <n-tab-pane name="compare" tab="与当前版本对比">
            <div v-if="versionDiff.length > 0">
              <n-space style="margin-bottom: 12px">
                <n-tag type="success">新增: {{ diffStats.added }}</n-tag>
                <n-tag type="warning">修改: {{ diffStats.modified }}</n-tag>
                <n-tag type="error">删除: {{ diffStats.removed }}</n-tag>
                <n-tag type="default">未变: {{ diffStats.unchanged }}</n-tag>
              </n-space>
              <n-data-table
                :columns="diffColumns"
                :data="versionDiff"
                :pagination="{ pageSize: 10 }"
                size="small"
              />
            </div>
            <n-empty v-else description="暂无变更差异" />
          </n-tab-pane>
          <n-tab-pane name="approval" tab="审批留痕">
            <n-timeline>
              <n-timeline-item
                v-for="record in approvalRecords"
                :key="record.id"
                :type="getTimelineType(record.action)"
                :title="getActionText(record.action)"
                :time="record.operatedAt"
              >
                <div style="font-size: 13px">
                  <div>操作人：{{ record.operatorName }}</div>
                  <div>状态变更：{{ getStatusText(record.previousStatus) }} → {{ getStatusText(record.newStatus) }}</div>
                  <div v-if="record.comment">备注：{{ record.comment }}</div>
                </div>
              </n-timeline-item>
            </n-timeline>
          </n-tab-pane>
        </n-tabs>
      </div>
    </n-modal>

    <n-modal v-model:show="showCompareModal" preset="card" title="版本对比" style="width: 900px">
      <n-space vertical style="width: 100%">
        <n-space>
          <n-select
            v-model:value="compareVersionId1"
            :options="versionSelectOptions"
            placeholder="选择版本1"
            style="width: 250px"
          />
          <n-text>VS</n-text>
          <n-select
            v-model:value="compareVersionId2"
            :options="versionSelectOptions"
            placeholder="选择版本2"
            style="width: 250px"
          />
          <n-button type="primary" size="small" :disabled="!compareVersionId1 || !compareVersionId2" @click="handleCompare">
            开始对比
          </n-button>
        </n-space>
        <div v-if="compareResult.length > 0">
          <n-space style="margin-bottom: 12px">
            <n-tag type="success">新增: {{ compareStats.added }}</n-tag>
            <n-tag type="warning">修改: {{ compareStats.modified }}</n-tag>
            <n-tag type="error">删除: {{ compareStats.removed }}</n-tag>
            <n-tag type="default">未变: {{ compareStats.unchanged }}</n-tag>
            <n-switch v-model:value="showOnlyChanges" />
            <n-text>仅显示变更项</n-text>
          </n-space>
          <n-data-table
            :columns="diffColumns"
            :data="filteredCompareResult"
            :pagination="{ pageSize: 15 }"
            size="small"
          />
        </div>
        <n-empty v-else-if="compareResult.length === 0 && compareVersionId1 && compareVersionId2" description="请点击开始对比按钮" />
        <n-empty v-else description="请选择两个版本进行对比" />
      </n-space>
    </n-modal>

    <n-modal v-model:show="showApproveModal" preset="dialog" title="审批版本" @positive-click="handleApprove" positive-text="通过">
      <div v-if="selectedVersion">
        <n-alert type="warning" :show-icon="true" style="margin-bottom: 16px">
          您即将审批通过版本 {{ selectedVersion.versionNo }} - {{ selectedVersion.name }}，审批通过后该版本将成为当前生效版本。
        </n-alert>
        <n-form-item label="审批意见">
          <n-input v-model:value="approvalComment" placeholder="请输入审批意见（可选）" type="textarea" :rows="3" />
        </n-form-item>
      </div>
    </n-modal>

    <n-modal v-model:show="showRejectModal" preset="dialog" title="驳回版本" @positive-click="handleReject" positive-text="驳回" negative-text="取消">
      <div v-if="selectedVersion">
        <n-alert type="error" :show-icon="true" style="margin-bottom: 16px">
          您即将驳回版本 {{ selectedVersion.versionNo }} - {{ selectedVersion.name }}。
        </n-alert>
        <n-form-item label="驳回原因" required>
          <n-input v-model:value="rejectReason" placeholder="请输入驳回原因" type="textarea" :rows="3" />
        </n-form-item>
      </div>
    </n-modal>

    <n-modal v-model:show="showRollbackModal" preset="dialog" title="回滚版本" @positive-click="handleRollback" positive-text="确认回滚" negative-text="取消">
      <div v-if="selectedVersion">
        <n-alert type="warning" :show-icon="true" style="margin-bottom: 16px">
          您即将回滚到版本 {{ selectedVersion.versionNo }} - {{ selectedVersion.name }}。
          回滚操作将创建一个新的版本记录，当前生效版本将标记为已回滚。
        </n-alert>
        <n-form-item label="回滚原因" required>
          <n-input v-model:value="rollbackReason" placeholder="请输入回滚原因" type="textarea" :rows="3" />
        </n-form-item>
      </div>
    </n-modal>
  </n-card>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { PlusOutlined as AddOutlined, DeleteOutlined, EditOutlined, ReloadOutlined, TeamOutlined as UserAddOutlined, UserOutlined as UserDeleteOutlined, CompressOutlined as CompareOutlined, CheckCircleOutlined, CloseCircleOutlined, RollbackOutlined, EyeOutlined, SendOutlined } from '@vicons/antd'
import { useBonusStore } from '@/stores/bonus'
import EmployeeDetail from './EmployeeDetail.vue'
import type { DataTableColumns } from 'naive-ui'
import type { Employee, BonusPlanVersion, BonusPlanVersionDiff, ApprovalActionType } from '@/types'
import { formatCurrency } from '@/utils/tax'

const store = useBonusStore()
const message = useMessage()
const dialog = useDialog()

const activeTab = ref('pool')
const showAddDeptModal = ref(false)
const showAddEmployeeModal = ref(false)
const currentDeptId = ref<string>('')

const newDeptForm = ref({
  name: '',
  allocationRatio: 0.1
})

const newEmployeeForm = ref({
  name: '',
  position: '',
  baseSalary: 15000,
  performanceLevelId: '',
  yearsOfService: 1
})

const showCreateVersionModal = ref(false)
const showVersionDetailModal = ref(false)
const showCompareModal = ref(false)
const showApproveModal = ref(false)
const showRejectModal = ref(false)
const showRollbackModal = ref(false)

const versionFilter = ref<string | null>(null)
const versionSearch = ref('')
const selectedVersion = ref<BonusPlanVersion | null>(null)
const versionDetailTab = ref('snapshot')

const newVersionForm = ref({
  name: '',
  description: '',
  changeSummary: ''
})

const compareVersionId1 = ref<string | null>(null)
const compareVersionId2 = ref<string | null>(null)
const compareResult = ref<BonusPlanVersionDiff[]>([])
const showOnlyChanges = ref(true)

const approvalComment = ref('')
const rejectReason = ref('')
const rollbackReason = ref('')

const versionFilterOptions = computed(() => [
  { label: '全部状态', value: null },
  { label: '草稿', value: 'draft' },
  { label: '待审批', value: 'pending_approval' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
  { label: '已回滚', value: 'rolled_back' }
])

const versionSelectOptions = computed(() =>
  store.bonusPlanVersions.map((v) => ({
    label: `${v.versionNo} - ${v.name}`,
    value: v.id
  }))
)

const filteredVersions = computed(() => {
  let result = store.bonusPlanVersions
  if (versionFilter.value) {
    result = result.filter((v) => v.status === versionFilter.value)
  }
  if (versionSearch.value.trim()) {
    const keyword = versionSearch.value.trim().toLowerCase()
    result = result.filter(
      (v) =>
        v.name.toLowerCase().includes(keyword) ||
        v.versionNo.toLowerCase().includes(keyword)
    )
  }
  return result
})

const versionColumns: DataTableColumns<BonusPlanVersion> = [
  { title: '版本编号', key: 'versionNo', width: 160 },
  { title: '版本名称', key: 'name', width: 180 },
  {
    title: '状态',
    key: 'status',
    width: 120,
    render: (row) =>
      h(
        'div',
        {},
        {
          default: () => [
            h('n-tag', { type: getStatusType(row.status), size: 'small' }, { default: () => getStatusText(row.status) }),
            row.isCurrent ? h('n-tag', { type: 'success', size: 'small', style: 'margin-left: 4px' }, { default: () => '当前' }) : null
          ]
        }
      )
  },
  { title: '创建人', key: 'createdBy', width: 100 },
  { title: '创建时间', key: 'createdAt', width: 170 },
  {
    title: '变更摘要',
    key: 'changeSummary',
    ellipsis: { tooltip: true }
  },
  {
    title: '操作',
    key: 'actions',
    width: 320,
    render: (row) =>
      h(
        'n-space',
        { size: 'small' },
        {
          default: () => [
            h(
              'n-button',
              {
                size: 'tiny',
                quaternary: true,
                onClick: () => openVersionDetail(row.id)
              },
              { icon: () => h(EyeOutlined), default: () => '详情' }
            ),
            h(
              'n-button',
              {
                size: 'tiny',
                quaternary: true,
                onClick: () => openCompareModal(row.id)
              },
              { icon: () => h(CompareOutlined), default: () => '对比' }
            ),
            row.status === 'draft'
              ? h(
                  'n-button',
                  {
                    size: 'tiny',
                    type: 'primary',
                    quaternary: true,
                    onClick: () => handleSubmitApproval(row.id)
                  },
                  { icon: () => h(SendOutlined), default: () => '提交' }
                )
              : null,
            row.status === 'pending_approval'
              ? h(
                  'n-button',
                  {
                    size: 'tiny',
                    type: 'success',
                    quaternary: true,
                    onClick: () => openApproveModal(row.id)
                  },
                  { icon: () => h(CheckCircleOutlined), default: () => '通过' }
                )
              : null,
            row.status === 'pending_approval'
              ? h(
                  'n-button',
                  {
                    size: 'tiny',
                    type: 'error',
                    quaternary: true,
                    onClick: () => openRejectModal(row.id)
                  },
                  { icon: () => h(CloseCircleOutlined), default: () => '驳回' }
                )
              : null,
            row.status === 'approved' && !row.isCurrent
              ? h(
                  'n-button',
                  {
                    size: 'tiny',
                    type: 'warning',
                    quaternary: true,
                    onClick: () => openRollbackModal(row.id)
                  },
                  { icon: () => h(RollbackOutlined), default: () => '回滚' }
                )
              : null,
            (row.status === 'draft' || row.status === 'rejected')
              ? h(
                  'n-button',
                  {
                    size: 'tiny',
                    type: 'error',
                    quaternary: true,
                    onClick: () => handleDeleteVersion(row.id)
                  },
                  { icon: () => h(DeleteOutlined), default: () => '删除' }
                )
              : null
          ]
        }
      )
  }
]

const deptSnapshotColumns: DataTableColumns = [
  { title: '部门名称', key: 'name', width: 150 },
  {
    title: '分配比例',
    key: 'allocationRatio',
    width: 120,
    render: (row: any) => `${(row.allocationRatio * 100).toFixed(1)}%`
  },
  { title: '员工数量', key: 'employees', width: 100, render: (row: any) => row.employees.length }
]

const levelSnapshotColumns: DataTableColumns = [
  { title: '等级', key: 'name', width: 100 },
  { title: '系数', key: 'coefficient', width: 100 },
  { title: '描述', key: 'description' }
]

const diffColumns: DataTableColumns<BonusPlanVersionDiff> = [
  {
    title: '字段',
    key: 'label',
    width: 200,
    render: (row) =>
      h(
        'span',
        {
          style: row.changeType !== 'unchanged' ? 'font-weight: bold' : ''
        },
        row.label
      )
  },
  {
    title: '变更类型',
    key: 'changeType',
    width: 100,
    render: (row) => {
      const typeMap: Record<string, { type: string; text: string }> = {
        added: { type: 'success', text: '新增' },
        removed: { type: 'error', text: '删除' },
        modified: { type: 'warning', text: '修改' },
        unchanged: { type: 'default', text: '未变' }
      }
      const info = typeMap[row.changeType] || { type: 'default', text: row.changeType }
      return h('n-tag', { type: info.type as any, size: 'small' }, { default: () => info.text })
    }
  },
  {
    title: '旧值',
    key: 'oldValue',
    width: 250,
    render: (row) => formatDiffValue(row.oldValue)
  },
  {
    title: '新值',
    key: 'newValue',
    width: 250,
    render: (row) => formatDiffValue(row.newValue)
  },
  { title: '路径', key: 'path', ellipsis: { tooltip: true } }
]

const versionDiff = computed(() => {
  if (!selectedVersion.value) return []
  const diff = store.compareWithCurrent(selectedVersion.value.id)
  return diff || []
})

const diffStats = computed(() => ({
  added: versionDiff.value.filter((d) => d.changeType === 'added').length,
  removed: versionDiff.value.filter((d) => d.changeType === 'removed').length,
  modified: versionDiff.value.filter((d) => d.changeType === 'modified').length,
  unchanged: versionDiff.value.filter((d) => d.changeType === 'unchanged').length
}))

const compareStats = computed(() => ({
  added: compareResult.value.filter((d) => d.changeType === 'added').length,
  removed: compareResult.value.filter((d) => d.changeType === 'removed').length,
  modified: compareResult.value.filter((d) => d.changeType === 'modified').length,
  unchanged: compareResult.value.filter((d) => d.changeType === 'unchanged').length
}))

const filteredCompareResult = computed(() => {
  if (showOnlyChanges.value) {
    return compareResult.value.filter((d) => d.changeType !== 'unchanged')
  }
  return compareResult.value
})

const approvalRecords = computed(() => {
  if (!selectedVersion.value) return []
  return store.getApprovalRecordsByVersionId(selectedVersion.value.id)
})

function formatDiffValue(value: any): string {
  if (value === undefined || value === null) return '-'
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (typeof value === 'object') return JSON.stringify(value)
  if (typeof value === 'number') {
    if (value >= 10000) return formatCurrency(value) + ' 元'
    return value.toString()
  }
  return String(value)
}

function getStatusType(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  const map: Record<string, any> = {
    draft: 'default',
    pending_approval: 'warning',
    approved: 'success',
    rejected: 'error',
    rolled_back: 'info'
  }
  return map[status] || 'default'
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    draft: '草稿',
    pending_approval: '待审批',
    approved: '已通过',
    rejected: '已驳回',
    rolled_back: '已回滚'
  }
  return map[status] || status
}

function getActionText(action: ApprovalActionType): string {
  const map: Record<ApprovalActionType, string> = {
    submit: '提交',
    approve: '审批通过',
    reject: '审批驳回',
    withdraw: '撤回',
    rollback: '回滚'
  }
  return map[action] || action
}

function getTimelineType(action: ApprovalActionType): 'success' | 'warning' | 'error' | 'info' {
  const map: Record<ApprovalActionType, any> = {
    submit: 'warning',
    approve: 'success',
    reject: 'error',
    withdraw: 'info',
    rollback: 'info'
  }
  return map[action] || 'default'
}

function getVersionNoById(id: string): string {
  const v = store.getVersionById(id)
  return v?.versionNo || '-'
}

function openCreateVersionModal() {
  newVersionForm.value = {
    name: '',
    description: '',
    changeSummary: ''
  }
  showCreateVersionModal.value = true
}

function handleCreateVersion() {
  if (!newVersionForm.value.name.trim()) {
    message.error('请输入版本名称')
    return false
  }
  if (!newVersionForm.value.changeSummary.trim()) {
    message.error('请输入变更摘要')
    return false
  }
  const version = store.createVersion({ ...newVersionForm.value })
  message.success(`版本 ${version.versionNo} 创建成功`)
  showCreateVersionModal.value = false
  return true
}

function openVersionDetail(id: string) {
  const version = store.getVersionById(id)
  if (version) {
    selectedVersion.value = version
    versionDetailTab.value = 'snapshot'
    showVersionDetailModal.value = true
  }
}

function openCompareModal(versionId?: string) {
  if (versionId) {
    compareVersionId1.value = versionId
    const current = store.getCurrentVersion()
    if (current && current.id !== versionId) {
      compareVersionId2.value = current.id
    } else {
      compareVersionId2.value = null
    }
  }
  compareResult.value = []
  showCompareModal.value = true
}

function handleCompare() {
  if (!compareVersionId1.value || !compareVersionId2.value) {
    message.error('请选择两个版本进行对比')
    return
  }
  const result = store.compareVersions(compareVersionId1.value, compareVersionId2.value)
  if (result) {
    compareResult.value = result
    message.success('对比完成')
  } else {
    message.error('对比失败，请检查版本是否存在')
  }
}

function handleSubmitApproval(id: string) {
  dialog.warning({
    title: '确认提交审批',
    content: '确定要将该版本提交审批吗？',
    positiveText: '确定提交',
    negativeText: '取消',
    onPositiveClick: () => {
      const success = store.submitVersionForApproval(id)
      if (success) {
        message.success('已提交审批')
      } else {
        message.error('提交失败')
      }
    }
  })
}

function openApproveModal(id: string) {
  const version = store.getVersionById(id)
  if (version) {
    selectedVersion.value = version
    approvalComment.value = ''
    showApproveModal.value = true
  }
}

function handleApprove() {
  if (!selectedVersion.value) return false
  const success = store.approveVersion(selectedVersion.value.id, approvalComment.value)
  if (success) {
    message.success('审批通过')
    showApproveModal.value = false
  } else {
    message.error('审批失败')
  }
  return true
}

function openRejectModal(id: string) {
  const version = store.getVersionById(id)
  if (version) {
    selectedVersion.value = version
    rejectReason.value = ''
    showRejectModal.value = true
  }
}

function handleReject() {
  if (!selectedVersion.value) return false
  if (!rejectReason.value.trim()) {
    message.error('请输入驳回原因')
    return false
  }
  const success = store.rejectVersion(selectedVersion.value.id, rejectReason.value)
  if (success) {
    message.success('已驳回')
    showRejectModal.value = false
  } else {
    message.error('驳回失败')
  }
  return true
}

function openRollbackModal(id: string) {
  const version = store.getVersionById(id)
  if (version) {
    selectedVersion.value = version
    rollbackReason.value = ''
    showRollbackModal.value = true
  }
}

function handleRollback() {
  if (!selectedVersion.value) return false
  if (!rollbackReason.value.trim()) {
    message.error('请输入回滚原因')
    return false
  }
  const success = store.rollbackToVersion(selectedVersion.value.id, rollbackReason.value)
  if (success) {
    message.success('回滚成功')
    showRollbackModal.value = false
  } else {
    message.error('回滚失败，只有已通过的版本才能回滚')
  }
  return true
}

function handleDeleteVersion(id: string) {
  const version = store.getVersionById(id)
  dialog.warning({
    title: '确认删除版本',
    content: version
      ? `确定要删除版本 ${version.versionNo} - ${version.name} 吗？`
      : '确定要删除该版本吗？',
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: () => {
      const success = store.deleteVersion(id)
      if (success) {
        message.success('版本已删除')
      } else {
        message.error('删除失败，当前生效版本无法删除')
      }
    }
  })
}

const performanceLevelOptions = computed(() =>
  store.performanceLevels.map((l) => ({
    label: `${l.name} (${l.coefficient}x) - ${l.description || ''}`,
    value: l.id
  }))
)

const totalRatio = computed(() =>
  store.departments.reduce((s, d) => s + d.allocationRatio, 0)
)
const totalRatioText = computed(() => `${(totalRatio.value * 100).toFixed(1)}%`)

function handleRatioChange(deptId: string, value: number) {
  store.updateDepartment(deptId, { allocationRatio: value })
}

function normalizeRatios() {
  store.normalizeDepartmentRatios()
  message.success('已归一化部门比例')
}

function handleAddDept() {
  if (!newDeptForm.value.name.trim()) {
    message.error('请输入部门名称')
    return false
  }
  store.addDepartment({ ...newDeptForm.value })
  message.success('部门已添加')
  newDeptForm.value = { name: '', allocationRatio: 0.1 }
  showAddDeptModal.value = false
  return true
}

function handleDeleteDept(id: string) {
  const dept = store.getDepartmentById(id)
  dialog.warning({
    title: '确认删除部门',
    content: dept && dept.employees.length > 0
      ? `部门「${dept.name}」有${dept.employees.length}名员工，删除后员工也将被移除`
      : `确定要删除该部门吗？`,
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: () => {
      store.removeDepartment(id)
      message.success('部门已删除')
    }
  })
}

function openAddEmployee(deptId: string) {
  currentDeptId.value = deptId
  if (store.performanceLevels.length > 0 && !newEmployeeForm.value.performanceLevelId) {
    newEmployeeForm.value.performanceLevelId = store.performanceLevels[2]?.id || store.performanceLevels[0].id
  }
  showAddEmployeeModal.value = true
}

function handleAddEmployee() {
  if (!newEmployeeForm.value.name.trim()) {
    message.error('请输入姓名')
    return false
  }
  if (!newEmployeeForm.value.performanceLevelId) {
    message.error('请选择绩效等级')
    return false
  }
  store.addEmployee(currentDeptId.value, { ...newEmployeeForm.value })
  message.success('员工已添加')
  newEmployeeForm.value = {
    name: '',
    position: '',
    baseSalary: 15000,
    performanceLevelId: store.performanceLevels[2]?.id || '',
    yearsOfService: 1
  }
  showAddEmployeeModal.value = false
  return true
}

const employeeColumns: DataTableColumns<Employee> = [
  { title: '姓名', key: 'name', width: 90 },
  { title: '职位', key: 'position', width: 120 },
  {
    title: '月薪',
    key: 'baseSalary',
    width: 110,
    render: (row) => h('span', {}, formatCurrency(row.baseSalary))
  },
  {
    title: '绩效',
    key: 'performanceLevelId',
    width: 90,
    render: (row) => {
      const level = store.performanceLevels.find((l) => l.id === row.performanceLevelId)
      return h('n-tag', { size: 'small', type: 'info' }, { default: () => level?.name || '-' })
    }
  },
  { title: '工龄', key: 'yearsOfService', width: 80, render: (row) => `${row.yearsOfService}年` },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render: (row) =>
      h(
        'n-space',
        {},
        {
          default: () => [
            h(
              'n-button',
              {
                size: 'tiny',
                quaternary: true,
                onClick: () => {
                  store.selectedEmployeeId = row.id
                }
              },
              { icon: () => h(EditOutlined), default: () => '详情' }
            ),
            h(
              'n-button',
              {
                size: 'tiny',
                quaternary: true,
                type: 'error',
                onClick: () => handleDeleteEmployee(row.id, row.name)
              },
              { icon: () => h(UserDeleteOutlined), default: () => '删除' }
            )
          ]
        }
      )
  }
]

function handleDeleteEmployee(id: string, name: string) {
  dialog.warning({
    title: '确认删除员工',
    content: `确定要删除员工「${name}」吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      store.removeEmployee(id)
      message.success('员工已删除')
    }
  })
}
</script>

<style scoped>
.dept-card {
  width: 100%;
}
</style>
