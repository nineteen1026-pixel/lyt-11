<template>
  <n-space vertical :size="16" style="width: 100%">
    <n-select
      v-model:value="selectedId"
      :options="employeeOptions"
      placeholder="请选择员工查看/编辑详情"
      :filterable="true"
      style="width: 100%"
    />

    <template v-if="employee">
      <n-card>
        <template #header>
          <n-space align="center">
            <n-avatar round style="background: #2080f0; width: 48px; height: 48px; font-size: 18px">
              {{ employee.name.charAt(0) }}
            </n-avatar>
            <n-space vertical :size="0">
              <n-text strong style="font-size: 18px">{{ employee.name }}</n-text>
              <n-text depth="3">
                {{ department?.name || '-' }} · {{ employee.position }} · 工龄{{ employee.yearsOfService }}年
              </n-text>
            </n-space>
          </n-space>
        </template>

        <n-grid :cols="2" :x-gap="24" responsive="screen">
          <n-form :model="employee!" label-placement="left" label-width="120px">
            <n-form-item label="姓名">
              <n-input :value="employee!.name" @update:value="(v: string) => store.updateEmployee(employee!.id, { name: v })" />
            </n-form-item>
            <n-form-item label="职位">
              <n-input :value="employee!.position" @update:value="(v: string) => store.updateEmployee(employee!.id, { position: v })" />
            </n-form-item>
            <n-form-item label="月薪（元）">
              <n-input-number
                :value="employee!.baseSalary"
                @update:value="(v: number | null) => store.updateEmployee(employee!.id, { baseSalary: Number(v ?? 0) })"
                :min="0"
                :step="1000"
                style="width: 100%"
                show-group-separator
              />
            </n-form-item>
            <n-form-item label="绩效等级">
              <n-select
                :value="employee!.performanceLevelId"
                @update:value="(v: string) => store.updateEmployee(employee!.id, { performanceLevelId: v })"
                :options="performanceLevelOptions"
              />
            </n-form-item>
            <n-form-item label="工龄（年）">
              <n-input-number
                :value="employee!.yearsOfService"
                @update:value="(v: number | null) => store.updateEmployee(employee!.id, { yearsOfService: Number(v ?? 0) })"
                :min="0"
                :max="50"
                style="width: 100%"
              />
            </n-form-item>
          </n-form>

          <n-card title="综合所得信息（用于计税）" size="small" embedded>
            <n-form
              :model="comprehensiveInfo"
              label-placement="left"
              label-width="140px"
              @update:value="() => {}"
            >
              <n-form-item label="年度薪资收入">
                <n-input-number
                  v-model:value="comprehensiveInfo.annualSalary"
                  :min="0"
                  :step="10000"
                  style="width: 100%"
                  show-group-separator
                />
              </n-form-item>
              <n-form-item label="专项扣除（社保等）">
                <n-input-number
                  v-model:value="comprehensiveInfo.specialDeduction"
                  :min="0"
                  :step="1000"
                  style="width: 100%"
                  show-group-separator
                />
              </n-form-item>
              <n-form-item label="专项附加扣除">
                <n-input-number
                  v-model:value="comprehensiveInfo.specialAdditionalDeduction"
                  :min="0"
                  :step="1000"
                  style="width: 100%"
                  show-group-separator
                />
              </n-form-item>
              <n-form-item label="其他扣除">
                <n-input-number
                  v-model:value="comprehensiveInfo.otherDeduction"
                  :min="0"
                  :step="1000"
                  style="width: 100%"
                  show-group-separator
                />
              </n-form-item>
            </n-form>
            <n-alert type="info" :show-icon="true" style="margin-top: 12px">
              系统默认按月薪×12估算年度薪资，并按22%估算社保专项扣除
            </n-alert>
          </n-card>
        </n-grid>
      </n-card>

      <template v-if="result">
        <PersonalCalculation :result="result" />
        <TaxComparisonPanel :result="result" :comprehensive-info="comprehensiveInfo" />
      </template>
    </template>

    <n-empty v-else description="请先选择员工" />
  </n-space>
</template>

<script setup lang="ts">
import { computed, watch, reactive } from 'vue'
import { useBonusStore } from '@/stores/bonus'
import PersonalCalculation from './PersonalCalculation.vue'
import TaxComparisonPanel from './TaxComparisonPanel.vue'
import type { ComprehensiveIncomeInfo, Employee } from '@/types'

const store = useBonusStore()

const selectedId = computed({
  get: () => store.selectedEmployeeId,
  set: (v) => (store.selectedEmployeeId = v)
})

const employee = computed<Employee | null>(() =>
  selectedId.value ? store.getEmployeeById(selectedId.value) ?? null : null
)

const department = computed(() =>
  employee.value ? store.getDepartmentById(employee.value.departmentId) : null
)

const result = computed(() => store.selectedEmployeeResult)

const employeeOptions = computed(() =>
  store.allEmployees.map((e) => {
    const dept = store.getDepartmentById(e.departmentId)
    return {
      label: `${e.name} - ${dept?.name || '-'} (${e.position})`,
      value: e.id
    }
  })
)

const performanceLevelOptions = computed(() =>
  store.performanceLevels.map((l) => ({
    label: `${l.name} (${l.coefficient}x) - ${l.description || ''}`,
    value: l.id
  }))
)

const defaultCI = (): ComprehensiveIncomeInfo => ({
  annualSalary: 0,
  specialDeduction: 0,
  specialAdditionalDeduction: 24000,
  otherDeduction: 0
})

const comprehensiveInfo = reactive<ComprehensiveIncomeInfo>(defaultCI())

watch(
  () => store.comprehensiveIncome[selectedId.value || ''],
  (v) => {
    if (v) {
      Object.assign(comprehensiveInfo, v)
    }
  },
  { immediate: true }
)

watch(
  comprehensiveInfo,
  (v) => {
    if (selectedId.value) {
      store.comprehensiveIncome[selectedId.value] = { ...v }
    }
  },
  { deep: true }
)

watch(
  () => employee.value,
  (e, oldE) => {
    if (e && e.id !== oldE?.id) {
      const saved = store.comprehensiveIncome[e.id]
      if (saved) {
        Object.assign(comprehensiveInfo, saved)
      }
    }
  }
)
</script>
