<template>
  <n-card title="奖金池与分配配置" :bordered="false">
    <n-tabs type="line" animated>
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
  </n-card>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { PlusOutlined as AddOutlined, DeleteOutlined, EditOutlined, ReloadOutlined, TeamOutlined as UserAddOutlined, UserOutlined as UserDeleteOutlined } from '@vicons/antd'
import { useBonusStore } from '@/stores/bonus'
import EmployeeDetail from './EmployeeDetail.vue'
import type { DataTableColumns } from 'naive-ui'
import type { Employee } from '@/types'
import { formatCurrency } from '@/utils/tax'

const store = useBonusStore()
const message = useMessage()
const dialog = useDialog()

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
