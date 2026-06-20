import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  AdjustmentReason,
  AdjustmentReasonCategory,
  ApprovalNode,
  ApprovalNodeType,
  ApprovalStatus,
  NodeApprovalStatus,
  ApprovalRecord,
  SalaryAdjustmentRequest,
  AnnualSalaryBudget,
  DepartmentSalaryBudget,
  SalaryHistoryRecord,
  SalaryAdjustmentModuleData,
  PerformanceHistoryRecord,
  BonusPaymentRecord,
  EmployeeCompensationArchive,
  ArchiveTimelineEvent,
  ArchiveEventType,
  ApprovalDelegation,
  DelegationInfo,
  SalaryTrendPoint,
  BonusTrendPoint,
  PerformanceTrendPoint,
  AnnualCompensationSummary,
  EmployeeAnnualReview,
  DepartmentAnnualReview,
  AnnualCompensationReviewReport,
  YearlySalaryGrowthData,
  YearlyBonusData,
  YearlyPerformanceData,
  CrossYearComparisonPoint,
  CrossYearComparisonReport,
  MarketBenchmarkData,
  SalaryCompetitivenessAssessment,
  CompetitivenessLevel,
  BonusSignVoucher,
  PromotionCandidateAnalysis,
  PromotionCandidateLevel,
  NextYearSalaryRecommendation,
  SalaryRecommendationCategory,
  PromotionAndAdjustmentReport
} from '@/types'
import { generateId, round2 } from '@/utils/tax'
import dayjs from 'dayjs'
import { useBonusStore } from './bonus'

const CATEGORY_LABELS: Record<AdjustmentReasonCategory, string> = {
  annual: '年度调薪',
  performance: '绩效调薪',
  promotion: '晋升调薪',
  market: '市场对标',
  certification: '资质认证',
  transfer: '岗位异动',
  special: '特殊调薪'
}

const STATUS_LABELS: Record<ApprovalStatus, string> = {
  draft: '草稿',
  pending: '审批中',
  approved: '已通过',
  rejected: '已驳回',
  returned: '已退回',
  withdrawn: '已撤回'
}

const NODE_TYPE_LABELS: Record<ApprovalNodeType, string> = {
  direct_manager: '直属上级',
  department_head: '部门负责人',
  hr: 'HR审核',
  finance: '财务审核',
  ceo: 'CEO审批',
  custom: '自定义节点'
}

export const useSalaryAdjustmentStore = defineStore('salaryAdjustment', () => {
  const bonusStore = useBonusStore()
  const currentYear = dayjs().year()

  const reasons = ref<AdjustmentReason[]>([
    { id: generateId(), category: 'annual', name: '年度普调', description: '公司年度统一薪资调整', defaultMinRatio: 0.03, defaultMaxRatio: 0.15, enabled: true },
    { id: generateId(), category: 'performance', name: '卓越绩效', description: '上年度绩效评级为S或A+的员工调薪', defaultMinRatio: 0.08, defaultMaxRatio: 0.25, enabled: true },
    { id: generateId(), category: 'promotion', name: '职位晋升', description: '员工晋升后相应的薪资调整', defaultMinRatio: 0.1, defaultMaxRatio: 0.3, enabled: true },
    { id: generateId(), category: 'market', name: '市场薪酬对标', description: '对标市场薪酬水平的调整', defaultMinRatio: 0.05, defaultMaxRatio: 0.2, enabled: true },
    { id: generateId(), category: 'certification', name: '专业资质获取', description: '获得关键专业资质后的调薪', defaultMinRatio: 0.03, defaultMaxRatio: 0.12, enabled: true },
    { id: generateId(), category: 'transfer', name: '部门/岗位异动', description: '跨部门调动或岗位变更', defaultMinRatio: 0, defaultMaxRatio: 0.2, enabled: true },
    { id: generateId(), category: 'special', name: '关键人才保留', description: '核心关键人才的特殊调薪', defaultMinRatio: 0.05, defaultMaxRatio: 0.35, enabled: true }
  ])

  const approvalWorkflow = ref<ApprovalNode[]>([
    { id: generateId(), name: '直属上级审批', type: 'direct_manager', order: 1, required: true, minApprovalAmount: 0 },
    { id: generateId(), name: '部门负责人审批', type: 'department_head', order: 2, required: true, minApprovalAmount: 0, maxApprovalAmount: 5000 },
    { id: generateId(), name: 'HR审核', type: 'hr', order: 3, required: true, minApprovalAmount: 0 },
    { id: generateId(), name: '财务预算审核', type: 'finance', order: 4, required: false, minApprovalAmount: 3000 },
    { id: generateId(), name: 'CEO审批', type: 'ceo', order: 5, required: false, minApprovalAmount: 10000 }
  ])

  const annualBudget = ref<AnnualSalaryBudget | null>(createInitialBudget())

  const requests = ref<SalaryAdjustmentRequest[]>([])

  const salaryHistory = ref<SalaryHistoryRecord[]>([])

  const performanceHistory = ref<PerformanceHistoryRecord[]>([])

  const bonusPayments = ref<BonusPaymentRecord[]>([])

  const selectedRequestId = ref<string | null>(null)

  function initMockHistoryData() {
    const employees = bonusStore.allEmployees
    const levels = bonusStore.performanceLevels

    employees.forEach((emp) => {
      const dept = bonusStore.getDepartmentById(emp.departmentId)
      const deptName = dept?.name || ''

      salaryHistory.value.push({
        id: generateId(),
        employeeId: emp.id,
        employeeName: emp.name,
        departmentName: deptName,
        position: emp.position,
        oldSalary: round2(emp.baseSalary * 0.85),
        newSalary: emp.baseSalary,
        adjustmentAmount: round2(emp.baseSalary * 0.15),
        adjustmentRatio: 0.15,
        reasonCategory: 'annual',
        reasonName: '年度普调',
        effectiveDate: dayjs().subtract(1, 'year').format('YYYY-MM-DD'),
        approvedAt: dayjs().subtract(1, 'year').add(1, 'month').format('YYYY-MM-DD HH:mm:ss'),
        applicantName: 'HR主管',
        approverName: '部门总监',
        description: '2024年度统一薪资调整'
      })

      salaryHistory.value.push({
        id: generateId(),
        employeeId: emp.id,
        employeeName: emp.name,
        departmentName: deptName,
        position: emp.position,
        oldSalary: round2(emp.baseSalary * 0.75),
        newSalary: round2(emp.baseSalary * 0.85),
        adjustmentAmount: round2(emp.baseSalary * 0.1),
        adjustmentRatio: 0.1,
        reasonCategory: 'performance',
        reasonName: '卓越绩效',
        effectiveDate: dayjs().subtract(2, 'year').format('YYYY-MM-DD'),
        approvedAt: dayjs().subtract(2, 'year').add(1, 'month').format('YYYY-MM-DD HH:mm:ss'),
        applicantName: '直属上级',
        approverName: 'HR总监',
        description: '上年度绩效优异，特别调薪'
      })

      const level = levels.find((l) => l.id === emp.performanceLevelId) || levels[0]
      const prevLevel = levels[Math.max(0, levels.findIndex((l) => l.id === level.id) - 1)] || level

      performanceHistory.value.push({
        id: generateId(),
        employeeId: emp.id,
        employeeName: emp.name,
        year: dayjs().year() - 1,
        half: 'annual',
        levelId: level.id,
        levelName: level.name,
        coefficient: level.coefficient,
        reviewerName: '部门总监',
        reviewedAt: dayjs().subtract(3, 'month').format('YYYY-MM-DD HH:mm:ss'),
        comment: '工作表现优秀，超额完成年度目标'
      })

      performanceHistory.value.push({
        id: generateId(),
        employeeId: emp.id,
        employeeName: emp.name,
        year: dayjs().year() - 2,
        half: 'annual',
        levelId: prevLevel.id,
        levelName: prevLevel.name,
        coefficient: prevLevel.coefficient,
        reviewerName: '部门总监',
        reviewedAt: dayjs().subtract(1, 'year').subtract(3, 'month').format('YYYY-MM-DD HH:mm:ss'),
        comment: '符合预期，达成年度工作目标'
      })

      const bonusAmount = round2(emp.baseSalary * 3 * level.coefficient)
      const taxAmount = round2(bonusAmount * 0.1)
      bonusPayments.value.push({
        id: generateId(),
        employeeId: emp.id,
        employeeName: emp.name,
        departmentName: deptName,
        year: dayjs().year() - 1,
        type: 'year_end',
        name: '2024年度年终奖',
        grossAmount: bonusAmount,
        taxAmount: taxAmount,
        netAmount: round2(bonusAmount - taxAmount),
        taxMethod: 'oneTime',
        paymentDate: dayjs().subtract(2, 'month').format('YYYY-MM-DD'),
        description: '根据年度绩效和司龄计算的年终奖金',
        approvalStatus: 'approved',
        approverName: 'CEO',
        approvedAt: dayjs().subtract(2, 'month').subtract(7, 'day').format('YYYY-MM-DD HH:mm:ss')
      })

      const bonusAmount2 = round2(emp.baseSalary * 2.5 * prevLevel.coefficient)
      const taxAmount2 = round2(bonusAmount2 * 0.1)
      bonusPayments.value.push({
        id: generateId(),
        employeeId: emp.id,
        employeeName: emp.name,
        departmentName: deptName,
        year: dayjs().year() - 2,
        type: 'year_end',
        name: '2023年度年终奖',
        grossAmount: bonusAmount2,
        taxAmount: taxAmount2,
        netAmount: round2(bonusAmount2 - taxAmount2),
        taxMethod: 'oneTime',
        paymentDate: dayjs().subtract(1, 'year').subtract(2, 'month').format('YYYY-MM-DD'),
        description: '根据年度绩效和司龄计算的年终奖金',
        approvalStatus: 'approved',
        approverName: 'CEO',
        approvedAt: dayjs().subtract(1, 'year').subtract(2, 'month').subtract(7, 'day').format('YYYY-MM-DD HH:mm:ss')
      })
    })
  }

  initMockHistoryData()

  const marketBenchmarkData = ref<MarketBenchmarkData[]>(initMockMarketBenchmarkData())

  function initMockMarketBenchmarkData(): MarketBenchmarkData[] {
    const year = dayjs().year()
    const benchmarks: MarketBenchmarkData[] = [
      {
        id: generateId(),
        position: '技术总监',
        positionLevel: 'P8',
        city: '北京',
        industry: '互联网',
        year,
        baseSalary: { p10: 25000, p25: 30000, p50: 38000, p75: 48000, p90: 60000 },
        totalCompensation: { p10: 400000, p25: 500000, p50: 650000, p75: 850000, p90: 1100000 },
        bonusRange: { min: 100000, max: 400000, median: 200000 },
        salaryGrowthRange: { min: 0.05, max: 0.25, median: 0.12 },
        dataSource: '猎聘网年度薪酬报告',
        updatedAt: dayjs().format('YYYY-MM-DD')
      },
      {
        id: generateId(),
        position: '高级工程师',
        positionLevel: 'P6',
        city: '北京',
        industry: '互联网',
        year,
        baseSalary: { p10: 18000, p25: 21000, p50: 26000, p75: 32000, p90: 40000 },
        totalCompensation: { p10: 280000, p25: 340000, p50: 430000, p75: 550000, p90: 700000 },
        bonusRange: { min: 50000, max: 200000, median: 100000 },
        salaryGrowthRange: { min: 0.08, max: 0.3, median: 0.15 },
        dataSource: '拉勾网互联网薪酬白皮书',
        updatedAt: dayjs().format('YYYY-MM-DD')
      },
      {
        id: generateId(),
        position: '中级工程师',
        positionLevel: 'P5',
        city: '北京',
        industry: '互联网',
        year,
        baseSalary: { p10: 12000, p25: 14500, p50: 18000, p75: 22000, p90: 27000 },
        totalCompensation: { p10: 180000, p25: 220000, p50: 280000, p75: 350000, p90: 440000 },
        bonusRange: { min: 30000, max: 100000, median: 60000 },
        salaryGrowthRange: { min: 0.1, max: 0.25, median: 0.15 },
        dataSource: 'BOSS直聘技术岗薪酬报告',
        updatedAt: dayjs().format('YYYY-MM-DD')
      },
      {
        id: generateId(),
        position: '市场总监',
        positionLevel: 'M3',
        city: '北京',
        industry: '互联网',
        year,
        baseSalary: { p10: 22000, p25: 26000, p50: 33000, p75: 42000, p90: 55000 },
        totalCompensation: { p10: 350000, p25: 430000, p50: 560000, p75: 750000, p90: 1000000 },
        bonusRange: { min: 80000, max: 350000, median: 180000 },
        salaryGrowthRange: { min: 0.06, max: 0.22, median: 0.11 },
        dataSource: '脉脉市场岗薪酬调研',
        updatedAt: dayjs().format('YYYY-MM-DD')
      },
      {
        id: generateId(),
        position: '市场经理',
        positionLevel: 'M2',
        city: '北京',
        industry: '互联网',
        year,
        baseSalary: { p10: 14000, p25: 16500, p50: 20000, p75: 25000, p90: 31000 },
        totalCompensation: { p10: 220000, p25: 265000, p50: 330000, p75: 420000, p90: 530000 },
        bonusRange: { min: 40000, max: 150000, median: 80000 },
        salaryGrowthRange: { min: 0.08, max: 0.2, median: 0.12 },
        dataSource: '前程无忧营销岗薪酬报告',
        updatedAt: dayjs().format('YYYY-MM-DD')
      },
      {
        id: generateId(),
        position: '运营总监',
        positionLevel: 'M3',
        city: '北京',
        industry: '互联网',
        year,
        baseSalary: { p10: 20000, p25: 24000, p50: 31000, p75: 40000, p90: 52000 },
        totalCompensation: { p10: 320000, p25: 390000, p50: 520000, p75: 700000, p90: 950000 },
        bonusRange: { min: 70000, max: 320000, median: 160000 },
        salaryGrowthRange: { min: 0.05, max: 0.2, median: 0.1 },
        dataSource: '拉勾网运营岗薪酬白皮书',
        updatedAt: dayjs().format('YYYY-MM-DD')
      },
      {
        id: generateId(),
        position: '运营专员',
        positionLevel: 'P4',
        city: '北京',
        industry: '互联网',
        year,
        baseSalary: { p10: 8000, p25: 9500, p50: 12000, p75: 15000, p90: 19000 },
        totalCompensation: { p10: 110000, p25: 135000, p50: 175000, p75: 225000, p90: 290000 },
        bonusRange: { min: 15000, max: 60000, median: 35000 },
        salaryGrowthRange: { min: 0.1, max: 0.25, median: 0.15 },
        dataSource: '智联招聘运营岗薪酬报告',
        updatedAt: dayjs().format('YYYY-MM-DD')
      }
    ]
    return benchmarks
  }

  function getMarketBenchmarkByPosition(position: string, year?: number): MarketBenchmarkData | undefined {
    const targetYear = year || dayjs().year()
    let benchmark = marketBenchmarkData.value.find(
      (b) => b.position === position && b.year === targetYear
    )
    if (!benchmark) {
      benchmark = marketBenchmarkData.value.find((b) => b.position === position)
    }
    if (!benchmark) {
      const allPositions = marketBenchmarkData.value.map((b) => b.position)
      const similarPosition = allPositions.find((p) => position.includes(p) || p.includes(position))
      if (similarPosition) {
        benchmark = marketBenchmarkData.value.find((b) => b.position === similarPosition)
      }
    }
    return benchmark
  }

  function calculatePercentile(value: number, p10: number, p25: number, p50: number, p75: number, p90: number): number {
    if (value <= p10) return 10
    if (value <= p25) return 10 + ((value - p10) / (p25 - p10)) * 15
    if (value <= p50) return 25 + ((value - p25) / (p50 - p25)) * 25
    if (value <= p75) return 50 + ((value - p50) / (p75 - p50)) * 25
    if (value <= p90) return 75 + ((value - p75) / (p90 - p75)) * 15
    return 95
  }

  function getCompetitivenessLevel(percentile: number): CompetitivenessLevel {
    if (percentile < 20) return 'far_below'
    if (percentile < 40) return 'below'
    if (percentile < 60) return 'at_market'
    if (percentile < 80) return 'above'
    return 'far_above'
  }

  function getCompetitivenessLevelLabel(level: CompetitivenessLevel): string {
    const labels: Record<CompetitivenessLevel, string> = {
      far_below: '远低于市场',
      below: '低于市场',
      at_market: '符合市场水平',
      above: '高于市场',
      far_above: '远高于市场'
    }
    return labels[level]
  }

  function getCompetitivenessLevelColor(level: CompetitivenessLevel): string {
    const colors: Record<CompetitivenessLevel, string> = {
      far_below: '#f5222d',
      below: '#fa8c16',
      at_market: '#1890ff',
      above: '#52c41a',
      far_above: '#722ed1'
    }
    return colors[level]
  }

  function calculateSalaryCompetitiveness(
    employeeId: string,
    year: number
  ): SalaryCompetitivenessAssessment | undefined {
    const emp = bonusStore.getEmployeeById(employeeId)
    if (!emp) return undefined

    const benchmark = getMarketBenchmarkByPosition(emp.position, year)
    if (!benchmark) return undefined

    const salaryHistory = getEmployeeHistory(employeeId)
    const yearHistory = salaryHistory.filter((h) => dayjs(h.effectiveDate).year() === year)

    const trend = getEmployeeSalaryTrend(employeeId, year)
    const endSalary = trend.length > 0 ? trend[trend.length - 1].baseSalary : emp.baseSalary
    const startSalary = trend.length > 0 ? trend[0].baseSalary : emp.baseSalary

    const bonusTrend = getEmployeeBonusTrend(employeeId, year)
    const totalBonus = bonusTrend.reduce((sum, b) => sum + b.grossAmount, 0)
    const totalCompensation = endSalary * 12 + totalBonus

    const baseSalaryPercentile = round2(
      calculatePercentile(
        endSalary,
        benchmark.baseSalary.p10,
        benchmark.baseSalary.p25,
        benchmark.baseSalary.p50,
        benchmark.baseSalary.p75,
        benchmark.baseSalary.p90
      )
    )

    const totalCompPercentile = round2(
      calculatePercentile(
        totalCompensation,
        benchmark.totalCompensation.p10,
        benchmark.totalCompensation.p25,
        benchmark.totalCompensation.p50,
        benchmark.totalCompensation.p75,
        benchmark.totalCompensation.p90
      )
    )

    const competitivenessLevel = getCompetitivenessLevel(baseSalaryPercentile)

    const adjustmentCount = yearHistory.length
    const totalAdjustmentAmount = yearHistory.reduce((sum, h) => sum + h.adjustmentAmount, 0)
    const avgAdjustmentRatio =
      adjustmentCount > 0
        ? yearHistory.reduce((sum, h) => sum + h.adjustmentRatio, 0) / adjustmentCount
        : 0

    const multiYearCount = salaryHistory.length
    const multiYearTotalAmount = salaryHistory.reduce((sum, h) => sum + h.adjustmentAmount, 0)
    const multiYearAverageRatio =
      multiYearCount > 0
        ? salaryHistory.reduce((sum, h) => sum + h.adjustmentRatio, 0) / multiYearCount
        : 0
    const adjustmentYears = new Set(salaryHistory.map((h) => dayjs(h.effectiveDate).year()))
    const yearSpan = adjustmentYears.size > 0 ? Math.max(...adjustmentYears) - Math.min(...adjustmentYears) + 1 : 0

    const earliestSalary = salaryHistory.length > 0
      ? (() => {
          const sorted = [...salaryHistory].sort((a, b) => dayjs(a.effectiveDate).valueOf() - dayjs(b.effectiveDate).valueOf())
          const beforeFirst = sorted[0].oldSalary || (sorted[0].newSalary - sorted[0].adjustmentAmount)
          return { salary: beforeFirst, year: dayjs(sorted[0].effectiveDate).year() }
        })()
      : { salary: startSalary, year: year }
    const cagr = yearSpan > 1 && earliestSalary.salary > 0
      ? Math.pow(endSalary / earliestSalary.salary, 1 / yearSpan) - 1
      : (startSalary > 0 ? (endSalary - startSalary) / startSalary : 0)

    const marketGrowthRate = benchmark.salaryGrowthRange.median
    const personalGrowthRate = startSalary > 0 ? (endSalary - startSalary) / startSalary : 0
    const vsMarketGrowth = round2(cagr - marketGrowthRate)

    const gapAmount = round2(benchmark.baseSalary.p50 - endSalary)
    const gapPercent = round2(benchmark.baseSalary.p50 > 0 ? gapAmount / benchmark.baseSalary.p50 : 0)
    const projectedGap1Y = round2(gapAmount * (1 + marketGrowthRate) - endSalary * cagr)
    const projectedGap2Y = round2(
      gapAmount * Math.pow(1 + marketGrowthRate, 2) - endSalary * (Math.pow(1 + cagr, 2) - 1)
    )

    const recommendations: string[] = []
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    let retentionRisk = '低'

    const perfHistory = getEmployeePerformanceHistory(employeeId)
    const latestPerf = perfHistory.length > 0 ? perfHistory[0] : null
    const perfLevel = latestPerf?.levelName || 'B'

    if (competitivenessLevel === 'far_below') {
      riskLevel = 'high'
      retentionRisk = '高'
      recommendations.push(
        `当前薪资仅为市场分位的 ${baseSalaryPercentile}%，存在较高的流失风险，建议立即进行市场对标调薪`
      )
      if (['S', 'A+', 'A'].includes(perfLevel)) {
        recommendations.push(`该员工绩效评级为 ${perfLevel}，属于高绩效员工，建议优先调薪至市场 P50 以上，预计需调薪 ${formatMoney(Math.max(0, gapAmount))}`)
      }
    } else if (competitivenessLevel === 'below') {
      riskLevel = 'medium'
      retentionRisk = '中'
      recommendations.push(
        `当前薪资低于市场水平（分位 ${baseSalaryPercentile}%），建议在年度调薪中优先考虑，逐步提升至市场 P50 水平`
      )
      if (['S', 'A+'].includes(perfLevel)) {
        riskLevel = 'high'
        retentionRisk = '高'
        recommendations.push(`高绩效员工薪资低于市场水平，建议紧急调薪，调薪幅度建议不低于 ${Math.max(0.08, gapPercent * 1.2).toFixed(0)}%`)
      }
    } else if (competitivenessLevel === 'at_market') {
      riskLevel = 'low'
      retentionRisk = '低'
      recommendations.push(
        `当前薪资符合市场水平（分位 ${baseSalaryPercentile}%），建议保持正常年度调薪节奏，调薪幅度参考市场增长率 ${(marketGrowthRate * 100).toFixed(1)}%`
      )
      if (['S', 'A+'].includes(perfLevel)) {
        recommendations.push(`高绩效员工可考虑调薪至市场 P75 水平，以强化激励效果`)
      }
    } else if (competitivenessLevel === 'above') {
      riskLevel = 'low'
      retentionRisk = '很低'
      recommendations.push(
        `当前薪资高于市场水平（分位 ${baseSalaryPercentile}%），薪酬竞争力较强，建议保持现有水平，可通过奖金等非现金方式进行激励`
      )
    } else {
      riskLevel = 'low'
      retentionRisk = '极低'
      recommendations.push(
        `当前薪资远高于市场水平（分位 ${baseSalaryPercentile}%），薪酬极具竞争力，建议关注投入产出比，可考虑以非物质激励为主`
      )
    }

    if (cagr < marketGrowthRate && multiYearCount > 0) {
      recommendations.push(
        `近${yearSpan > 1 ? yearSpan + '年' : '1年'}累计薪资年复合增长 ${(cagr * 100).toFixed(1)}%，低于市场平均增长率 ${(marketGrowthRate * 100).toFixed(1)}%，建议在下一调薪周期补足差距`
      )
    }

    if (multiYearCount > adjustmentCount && yearSpan > 1) {
      recommendations.push(
        `历史${yearSpan}年共调薪${multiYearCount}次，累计调薪${formatMoney(multiYearTotalAmount)}，年均幅度${(multiYearAverageRatio * 100).toFixed(1)}%`
      )
    }

    if (totalCompPercentile < baseSalaryPercentile - 10) {
      recommendations.push(
        `年度总包市场分位（${totalCompPercentile}%）低于月薪分位（${baseSalaryPercentile}%），建议优化奖金结构，提升整体薪酬竞争力`
      )
    }

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      position: emp.position,
      year,
      baseSalary: endSalary,
      baseSalaryPercentile,
      baseSalaryVsMarket: {
        vsP10: round2(endSalary / benchmark.baseSalary.p10 - 1),
        vsP25: round2(endSalary / benchmark.baseSalary.p25 - 1),
        vsP50: round2(endSalary / benchmark.baseSalary.p50 - 1),
        vsP75: round2(endSalary / benchmark.baseSalary.p75 - 1),
        vsP90: round2(endSalary / benchmark.baseSalary.p90 - 1)
      },
      totalCompensation,
      totalCompensationPercentile: totalCompPercentile,
      totalCompensationVsMarket: {
        vsP10: round2(totalCompensation / benchmark.totalCompensation.p10 - 1),
        vsP25: round2(totalCompensation / benchmark.totalCompensation.p25 - 1),
        vsP50: round2(totalCompensation / benchmark.totalCompensation.p50 - 1),
        vsP75: round2(totalCompensation / benchmark.totalCompensation.p75 - 1),
        vsP90: round2(totalCompensation / benchmark.totalCompensation.p90 - 1)
      },
      competitivenessLevel,
      historicalAdjustments: {
        count: adjustmentCount,
        totalAmount: round2(totalAdjustmentAmount),
        averageRatio: round2(avgAdjustmentRatio),
        vsMarketGrowth,
        multiYearCount,
        multiYearTotalAmount: round2(multiYearTotalAmount),
        multiYearAverageRatio: round2(multiYearAverageRatio),
        yearSpan,
        cagr: round2(cagr)
      },
      marketGrowthRate: round2(marketGrowthRate),
      personalGrowthRate: round2(personalGrowthRate),
      gapAnalysis: {
        currentGapAmount: gapAmount,
        currentGapPercent: gapPercent,
        projectedGapIn1Year: projectedGap1Y,
        projectedGapIn2Year: projectedGap2Y
      },
      recommendations,
      riskLevel,
      retentionRisk,
      benchmarkData: benchmark
    }
  }

  function createInitialBudget(): AnnualSalaryBudget {
    const deptBudgets: DepartmentSalaryBudget[] = bonusStore.departments.map((dept) => {
      const totalAnnualSalary = dept.employees.reduce((sum, emp) => sum + emp.baseSalary * 12, 0)
      return {
        departmentId: dept.id,
        departmentName: dept.name,
        totalBudget: round2(totalAnnualSalary * 0.1),
        usedAmount: 0,
        pendingAmount: 0,
        approvedCount: 0,
        pendingCount: 0,
        headcount: dept.employees.length,
        averageAdjustmentRatio: 0
      }
    })
    const total = deptBudgets.reduce((s, d) => s + d.totalBudget, 0)
    return {
      year: currentYear,
      totalBudget: round2(total),
      usedAmount: 0,
      pendingAmount: 0,
      reservedAmount: round2(total * 0.1),
      departments: deptBudgets,
      maxAdjustmentRatio: 0.35,
      minAdjustmentRatio: 0.01,
      defaultRatio: 0.08,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
  }

  function generateRequestNo(): string {
    const now = dayjs()
    const seq = String(requests.value.length + 1).padStart(4, '0')
    return `SA${now.format('YYYYMMDD')}${seq}`
  }

  const sortedWorkflow = computed(() => [...approvalWorkflow.value].sort((a, b) => a.order - b.order))

  const enabledReasons = computed(() => reasons.value.filter((r) => r.enabled))

  const pendingRequests = computed(() => requests.value.filter((r) => r.status === 'pending'))
  const draftRequests = computed(() => requests.value.filter((r) => r.status === 'draft'))
  const approvedRequests = computed(() => requests.value.filter((r) => r.status === 'approved'))
  const rejectedRequests = computed(() => requests.value.filter((r) => r.status === 'rejected'))

  const budgetOverview = computed(() => {
    if (!annualBudget.value) return null
    const { totalBudget, usedAmount, pendingAmount, reservedAmount } = annualBudget.value
    const available = round2(totalBudget - usedAmount - pendingAmount - reservedAmount)
    const usedRatio = round2(usedAmount / totalBudget)
    const pendingRatio = round2(pendingAmount / totalBudget)
    return { totalBudget, usedAmount, pendingAmount, reservedAmount, available, usedRatio, pendingRatio }
  })

  function getCategoryLabel(cat: AdjustmentReasonCategory): string {
    return CATEGORY_LABELS[cat] || cat
  }

  function getStatusLabel(status: ApprovalStatus): string {
    return STATUS_LABELS[status] || status
  }

  function getNodeTypeLabel(type: ApprovalNodeType): string {
    return NODE_TYPE_LABELS[type] || type
  }

  function getStatusColor(status: ApprovalStatus): string {
    const map: Record<ApprovalStatus, string> = {
      draft: '#8c8c8c',
      pending: '#fa8c16',
      approved: '#52c41a',
      rejected: '#f5222d',
      returned: '#eb2f96',
      withdrawn: '#8c8c8c'
    }
    return map[status]
  }

  function getNodeStatusColor(status: NodeApprovalStatus): string {
    const map: Record<NodeApprovalStatus, string> = {
      waiting: '#bfbfbf',
      current: '#1890ff',
      approved: '#52c41a',
      rejected: '#f5222d',
      skipped: '#8c8c8c'
    }
    return map[status]
  }

  function getNodeStatusLabel(status: NodeApprovalStatus): string {
    const map: Record<NodeApprovalStatus, string> = {
      waiting: '待审批',
      current: '审批中',
      approved: '已通过',
      rejected: '已驳回',
      skipped: '已跳过'
    }
    return map[status]
  }

  function addReason(reason: Omit<AdjustmentReason, 'id'>) {
    reasons.value.push({ ...reason, id: generateId() })
  }

  function updateReason(id: string, updates: Partial<AdjustmentReason>) {
    const idx = reasons.value.findIndex((r) => r.id === id)
    if (idx !== -1) {
      reasons.value[idx] = { ...reasons.value[idx], ...updates }
    }
  }

  function removeReason(id: string) {
    reasons.value = reasons.value.filter((r) => r.id !== id)
  }

  function addApprovalNode(node: Omit<ApprovalNode, 'id'>) {
    approvalWorkflow.value.push({ ...node, id: generateId() })
    normalizeNodeOrders()
  }

  function updateApprovalNode(id: string, updates: Partial<ApprovalNode>) {
    const idx = approvalWorkflow.value.findIndex((n) => n.id === id)
    if (idx !== -1) {
      approvalWorkflow.value[idx] = { ...approvalWorkflow.value[idx], ...updates }
      normalizeNodeOrders()
    }
  }

  function removeApprovalNode(id: string) {
    approvalWorkflow.value = approvalWorkflow.value.filter((n) => n.id !== id)
    normalizeNodeOrders()
  }

  function moveApprovalNode(id: string, direction: 'up' | 'down') {
    const sorted = [...approvalWorkflow.value].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((n) => n.id === id)
    if (idx === -1) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= sorted.length) return
    ;[sorted[idx], sorted[targetIdx]] = [sorted[targetIdx], sorted[idx]]
    sorted.forEach((n, i) => {
      n.order = i + 1
    })
    approvalWorkflow.value = sorted
  }

  function normalizeNodeOrders() {
    const sorted = [...approvalWorkflow.value].sort((a, b) => a.order - b.order)
    sorted.forEach((n, i) => {
      n.order = i + 1
    })
    approvalWorkflow.value = sorted
  }

  function addDelegation(
    nodeId: string,
    data: Omit<ApprovalDelegation, 'id' | 'nodeId' | 'createdAt'>
  ) {
    const node = approvalWorkflow.value.find((n) => n.id === nodeId)
    if (!node) return
    if (!node.delegations) {
      node.delegations = []
    }
    node.delegations.push({
      ...data,
      id: generateId(),
      nodeId,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    })
  }

  function updateDelegation(
    nodeId: string,
    delegationId: string,
    updates: Partial<ApprovalDelegation>
  ) {
    const node = approvalWorkflow.value.find((n) => n.id === nodeId)
    if (!node || !node.delegations) return
    const idx = node.delegations.findIndex((d) => d.id === delegationId)
    if (idx === -1) return
    node.delegations[idx] = { ...node.delegations[idx], ...updates }
  }

  function deleteDelegation(nodeId: string, delegationId: string) {
    const node = approvalWorkflow.value.find((n) => n.id === nodeId)
    if (!node || !node.delegations) return
    node.delegations = node.delegations.filter((d) => d.id !== delegationId)
  }

  function getActiveDelegation(
    nodeId: string,
    approverName: string
  ): ApprovalDelegation | null {
    const node = approvalWorkflow.value.find((n) => n.id === nodeId)
    if (!node || !node.delegations) return null
    const now = dayjs()
    return (
      node.delegations.find(
        (d) =>
          d.enabled &&
          d.delegatorName === approverName &&
          !now.isAfter(d.endDate) &&
          !now.isBefore(d.startDate)
      ) || null
    )
  }

  function getValidDelegationForApprover(
    nodeId: string,
    delegateName: string
  ): ApprovalDelegation | null {
    const node = approvalWorkflow.value.find((n) => n.id === nodeId)
    if (!node || !node.delegations) return null
    const now = dayjs()
    return (
      node.delegations.find(
        (d) =>
          d.enabled &&
          d.delegateName === delegateName &&
          !now.isAfter(d.endDate) &&
          !now.isBefore(d.startDate)
      ) || null
    )
  }

  function calculateApplicableNodes(adjustmentAmount: number): ApprovalNode[] {
    return sortedWorkflow.value.filter((node) => {
      const aboveMin = node.minApprovalAmount === undefined || adjustmentAmount >= node.minApprovalAmount
      const belowMax = node.maxApprovalAmount === undefined || adjustmentAmount <= node.maxApprovalAmount
      return aboveMin && belowMax
    })
  }

  function checkBudgetAvailability(departmentId: string, amount: number): { ok: boolean; message: string } {
    if (!annualBudget.value) return { ok: false, message: '年度预算未初始化' }
    const deptBudget = annualBudget.value.departments.find((d) => d.departmentId === departmentId)
    if (!deptBudget) return { ok: false, message: '部门预算未找到' }
    const deptAvailable = deptBudget.totalBudget - deptBudget.usedAmount - deptBudget.pendingAmount
    const overallAvailable = annualBudget.value.totalBudget - annualBudget.value.usedAmount - annualBudget.value.pendingAmount - annualBudget.value.reservedAmount
    if (amount > deptAvailable) return { ok: false, message: `部门预算不足，剩余可用：${deptAvailable.toLocaleString()}元` }
    if (amount > overallAvailable) return { ok: false, message: `公司整体预算不足，剩余可用：${overallAvailable.toLocaleString()}元` }
    return { ok: true, message: '预算充足' }
  }

  function createDraftRequest(employeeId: string): SalaryAdjustmentRequest {
    const emp = bonusStore.getEmployeeById(employeeId)
    if (!emp) throw new Error('员工不存在')
    const dept = bonusStore.getDepartmentById(emp.departmentId)
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const defaultReason = enabledReasons.value[0]
    const currentSalary = emp.baseSalary
    const proposedRatio = annualBudget.value?.defaultRatio || 0.08
    const proposedSalary = round2(currentSalary * (1 + proposedRatio))

    const req: SalaryAdjustmentRequest = {
      id: generateId(),
      requestNo: generateRequestNo(),
      employeeId: emp.id,
      employeeName: emp.name,
      departmentId: emp.departmentId,
      departmentName: dept?.name || '',
      position: emp.position,
      reasonCategory: defaultReason?.category || 'annual',
      reasonId: defaultReason?.id || '',
      reasonName: defaultReason?.name || '',
      currentSalary,
      proposedSalary,
      adjustmentAmount: round2(proposedSalary - currentSalary),
      adjustmentRatio: round2(proposedRatio),
      effectiveDate: dayjs().add(1, 'month').startOf('month').format('YYYY-MM-DD'),
      description: '',
      attachments: [],
      status: 'draft',
      currentNodeIndex: -1,
      approvalRecords: [],
      workflowSnapshot: [],
      applicantName: '当前用户',
      createdAt: now,
      updatedAt: now,
      budgetYear: currentYear
    }
    requests.value.push(req)
    selectedRequestId.value = req.id
    return req
  }

  function updateRequest(id: string, updates: Partial<SalaryAdjustmentRequest>) {
    const idx = requests.value.findIndex((r) => r.id === id)
    if (idx === -1) return
    const req = requests.value[idx]
    const updated = { ...req, ...updates, updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') }
    if (updates.currentSalary !== undefined || updates.proposedSalary !== undefined) {
      const cs = updates.currentSalary ?? req.currentSalary
      const ps = updates.proposedSalary ?? req.proposedSalary
      updated.adjustmentAmount = round2(ps - cs)
      updated.adjustmentRatio = round2(cs > 0 ? (ps - cs) / cs : 0)
    }
    if (updates.reasonId) {
      const reason = reasons.value.find((r) => r.id === updates.reasonId)
      if (reason) {
        updated.reasonCategory = reason.category
        updated.reasonName = reason.name
      }
    }
    requests.value[idx] = updated
  }

  function submitRequest(id: string): { ok: boolean; message: string } {
    const idx = requests.value.findIndex((r) => r.id === id)
    if (idx === -1) return { ok: false, message: '申请单不存在' }
    const req = requests.value[idx]
    if (req.status !== 'draft' && req.status !== 'returned') return { ok: false, message: '当前状态不可提交' }
    if (!req.reasonId) return { ok: false, message: '请选择调薪事由' }
    if (req.adjustmentAmount <= 0) return { ok: false, message: '调薪金额必须大于0' }
    if (annualBudget.value) {
      const maxRatio = annualBudget.value.maxAdjustmentRatio
      const minRatio = annualBudget.value.minAdjustmentRatio
      if (req.adjustmentRatio > maxRatio) return { ok: false, message: `调薪比例超过上限${(maxRatio * 100).toFixed(1)}%` }
      if (req.adjustmentRatio < minRatio) return { ok: false, message: `调薪比例低于下限${(minRatio * 100).toFixed(1)}%` }
    }
    const budgetCheck = checkBudgetAvailability(req.departmentId, req.adjustmentAmount * 12)
    if (!budgetCheck.ok) return budgetCheck

    const applicableNodes = calculateApplicableNodes(req.adjustmentAmount * 12)
    const workflowSnapshot = applicableNodes.map((n) => ({ ...n }))
    const records: ApprovalRecord[] = workflowSnapshot.map((n, i) => ({
      nodeId: n.id,
      nodeName: n.name,
      approverName: '',
      status: i === 0 ? 'current' : 'waiting',
      operatedAt: ''
    }))

    requests.value[idx] = {
      ...req,
      status: 'pending',
      currentNodeIndex: 0,
      workflowSnapshot,
      approvalRecords: records,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    allocateBudget(req.departmentId, req.adjustmentAmount * 12, 'pending')
    return { ok: true, message: '提交成功，已进入审批流程' }
  }

  function allocateBudget(departmentId: string, amount: number, type: 'pending' | 'used') {
    if (!annualBudget.value) return
    const dept = annualBudget.value.departments.find((d) => d.departmentId === departmentId)
    if (!dept) return
    if (type === 'pending') {
      dept.pendingAmount = round2(dept.pendingAmount + amount)
      dept.pendingCount += 1
      annualBudget.value.pendingAmount = round2(annualBudget.value.pendingAmount + amount)
    } else {
      dept.usedAmount = round2(dept.usedAmount + amount)
      dept.approvedCount += 1
      annualBudget.value.usedAmount = round2(annualBudget.value.usedAmount + amount)
    }
    annualBudget.value.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
    recalculateDeptAvgRatio()
  }

  function releasePendingBudget(departmentId: string, amount: number) {
    if (!annualBudget.value) return
    const dept = annualBudget.value.departments.find((d) => d.departmentId === departmentId)
    if (!dept) return
    dept.pendingAmount = round2(Math.max(0, dept.pendingAmount - amount))
    dept.pendingCount = Math.max(0, dept.pendingCount - 1)
    annualBudget.value.pendingAmount = round2(Math.max(0, annualBudget.value.pendingAmount - amount))
    annualBudget.value.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
    recalculateDeptAvgRatio()
  }

  function pendingToUsedBudget(departmentId: string, amount: number) {
    if (!annualBudget.value) return
    const dept = annualBudget.value.departments.find((d) => d.departmentId === departmentId)
    if (!dept) return
    dept.pendingAmount = round2(Math.max(0, dept.pendingAmount - amount))
    dept.pendingCount = Math.max(0, dept.pendingCount - 1)
    dept.usedAmount = round2(dept.usedAmount + amount)
    dept.approvedCount += 1
    annualBudget.value.pendingAmount = round2(Math.max(0, annualBudget.value.pendingAmount - amount))
    annualBudget.value.usedAmount = round2(annualBudget.value.usedAmount + amount)
    annualBudget.value.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
    recalculateDeptAvgRatio()
  }

  function recalculateDeptAvgRatio() {
    if (!annualBudget.value) return
    for (const dept of annualBudget.value.departments) {
      const approvedForDept = approvedRequests.value.filter((r) => r.departmentId === dept.departmentId)
      const totalSalary = approvedForDept.reduce((s, r) => s + r.currentSalary, 0)
      const totalAdjust = approvedForDept.reduce((s, r) => s + r.adjustmentAmount, 0)
      dept.averageAdjustmentRatio = totalSalary > 0 ? round2(totalAdjust / totalSalary) : 0
    }
  }

  function approveCurrentNode(
    id: string,
    approverName: string,
    comment: string,
    isDelegated: boolean = false,
    delegatorName?: string
  ): { ok: boolean; message: string } {
    const idx = requests.value.findIndex((r) => r.id === id)
    if (idx === -1) return { ok: false, message: '申请单不存在' }
    const req = requests.value[idx]
    if (req.status !== 'pending') return { ok: false, message: '当前状态不可审批' }
    const nodeIdx = req.currentNodeIndex
    if (nodeIdx < 0 || nodeIdx >= req.approvalRecords.length) return { ok: false, message: '审批节点异常' }

    let delegationInfo: DelegationInfo | undefined
    if (isDelegated && delegatorName) {
      delegationInfo = {
        delegatorName,
        delegateName: approverName,
        isDelegated: true
      }
    }

    const records = [...req.approvalRecords]
    records[nodeIdx] = {
      ...records[nodeIdx],
      status: 'approved',
      approverName,
      comment,
      operatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      delegationInfo
    }

    const nextIdx = nodeIdx + 1
    if (nextIdx < records.length) {
      records[nextIdx] = { ...records[nextIdx], status: 'current' }
      requests.value[idx] = {
        ...req,
        approvalRecords: records,
        currentNodeIndex: nextIdx,
        updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        rejectedFromNodeIndex: undefined
      }
      return {
        ok: true,
        message: `已通过${isDelegated ? '（代审）' : ''}，进入下一节点：${records[nextIdx].nodeName}`
      }
    } else {
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
      syncCompensationArchiveOnApproval(req, approverName)
      requests.value[idx] = {
        ...req,
        status: 'approved',
        approvalRecords: records,
        currentNodeIndex: -1,
        approvedAt: now,
        updatedAt: now,
        rejectedFromNodeIndex: undefined
      }
      return { ok: true, message: `审批全部通过${isDelegated ? '（代审）' : ''}，调薪已生效` }
    }
  }

  function rejectCurrentNode(
    id: string,
    approverName: string,
    comment: string,
    isDelegated: boolean = false,
    delegatorName?: string
  ): { ok: boolean; message: string } {
    const idx = requests.value.findIndex((r) => r.id === id)
    if (idx === -1) return { ok: false, message: '申请单不存在' }
    const req = requests.value[idx]
    if (req.status !== 'pending') return { ok: false, message: '当前状态不可审批' }
    const nodeIdx = req.currentNodeIndex
    if (nodeIdx < 0 || nodeIdx >= req.approvalRecords.length) return { ok: false, message: '审批节点异常' }

    let delegationInfo: DelegationInfo | undefined
    if (isDelegated && delegatorName) {
      delegationInfo = {
        delegatorName,
        delegateName: approverName,
        isDelegated: true
      }
    }

    const records = [...req.approvalRecords]
    records[nodeIdx] = {
      ...records[nodeIdx],
      status: 'rejected',
      approverName,
      comment,
      operatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      delegationInfo
    }
    releasePendingBudget(req.departmentId, req.adjustmentAmount * 12)
    requests.value[idx] = {
      ...req,
      status: 'rejected',
      approvalRecords: records,
      rejectedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      rejectedFromNodeIndex: nodeIdx
    }
    return { ok: true, message: `已驳回申请${isDelegated ? '（代审）' : ''}` }
  }

  function delegateRejectCurrentNode(
    id: string,
    delegateName: string,
    delegatorName: string,
    comment: string
  ): { ok: boolean; message: string } {
    const idx = requests.value.findIndex((r) => r.id === id)
    if (idx === -1) return { ok: false, message: '申请单不存在' }
    const req = requests.value[idx]
    if (req.status !== 'pending') return { ok: false, message: '当前状态不可审批' }
    const nodeIdx = req.currentNodeIndex
    if (nodeIdx < 0 || nodeIdx >= req.approvalRecords.length) return { ok: false, message: '审批节点异常' }

    const records = [...req.approvalRecords]
    records[nodeIdx] = {
      ...records[nodeIdx],
      status: 'current',
      approverName: '',
      comment: '',
      operatedAt: '',
      delegationInfo: undefined,
      delegateReject: {
        delegateName,
        delegatorName,
        comment,
        rejectedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
    }

    requests.value[idx] = {
      ...req,
      approvalRecords: records,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }

    const nodeName = records[nodeIdx].nodeName
    return { ok: true, message: `代审驳回，已将「${nodeName}」交回原审批人重新审批` }
  }

  function returnToApplicant(
    id: string,
    approverName: string,
    comment: string,
    isDelegated: boolean = false,
    delegatorName?: string
  ): { ok: boolean; message: string } {
    const idx = requests.value.findIndex((r) => r.id === id)
    if (idx === -1) return { ok: false, message: '申请单不存在' }
    const req = requests.value[idx]
    if (req.status !== 'pending') return { ok: false, message: '当前状态不可退回' }
    const nodeIdx = req.currentNodeIndex

    let delegationInfo: DelegationInfo | undefined
    if (isDelegated && delegatorName) {
      delegationInfo = {
        delegatorName,
        delegateName: approverName,
        isDelegated: true
      }
    }

    const records = [...req.approvalRecords]
    records[nodeIdx] = {
      ...records[nodeIdx],
      status: 'waiting',
      approverName: '',
      comment: `退回修改：${comment}（由 ${approverName}${isDelegated ? ' 代审' : ''} 退回）`,
      operatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      delegationInfo
    }
    for (let i = 0; i < records.length; i++) {
      records[i] = { ...records[i], status: 'waiting', approverName: '' }
    }
    releasePendingBudget(req.departmentId, req.adjustmentAmount * 12)
    requests.value[idx] = {
      ...req,
      status: 'returned',
      approvalRecords: records,
      currentNodeIndex: -1,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    return { ok: true, message: `已退回申请人修改${isDelegated ? '（代审）' : ''}` }
  }

  function rollbackToOriginalNode(id: string): { ok: boolean; message: string } {
    const idx = requests.value.findIndex((r) => r.id === id)
    if (idx === -1) return { ok: false, message: '申请单不存在' }
    const req = requests.value[idx]
    if (req.status !== 'rejected') return { ok: false, message: '仅已驳回的申请可回退' }
    if (req.rejectedFromNodeIndex === undefined || req.rejectedFromNodeIndex < 0) {
      return { ok: false, message: '未找到驳回来源节点，无法回退' }
    }

    const targetNodeIndex = req.rejectedFromNodeIndex
    const records = [...req.approvalRecords]

    records[targetNodeIndex] = {
      ...records[targetNodeIndex],
      status: 'current',
      approverName: '',
      operatedAt: ''
    }

    for (let i = targetNodeIndex + 1; i < records.length; i++) {
      records[i] = {
        ...records[i],
        status: 'waiting',
        approverName: '',
        operatedAt: ''
      }
    }

    const budgetCheck = checkBudgetAvailability(req.departmentId, req.adjustmentAmount * 12)
    if (!budgetCheck.ok) return budgetCheck

    allocateBudget(req.departmentId, req.adjustmentAmount * 12, 'pending')

    requests.value[idx] = {
      ...req,
      status: 'pending',
      approvalRecords: records,
      currentNodeIndex: targetNodeIndex,
      rejectedAt: undefined,
      rejectedFromNodeIndex: undefined,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }

    const targetNodeName = records[targetNodeIndex].nodeName
    return { ok: true, message: `已回退至原审批节点：${targetNodeName}` }
  }

  function withdrawRequest(id: string): { ok: boolean; message: string } {
    const idx = requests.value.findIndex((r) => r.id === id)
    if (idx === -1) return { ok: false, message: '申请单不存在' }
    const req = requests.value[idx]
    if (req.status !== 'pending') return { ok: false, message: '仅审批中的申请可撤回' }
    releasePendingBudget(req.departmentId, req.adjustmentAmount * 12)
    const records = req.approvalRecords.map((r) => ({ ...r, status: 'waiting' as NodeApprovalStatus }))
    requests.value[idx] = {
      ...req,
      status: 'withdrawn',
      approvalRecords: records,
      currentNodeIndex: -1,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    return { ok: true, message: '已撤回申请' }
  }

  function deleteRequest(id: string): { ok: boolean; message: string } {
    const req = requests.value.find((r) => r.id === id)
    if (!req) return { ok: false, message: '申请单不存在' }
    if (req.status === 'approved') return { ok: false, message: '已通过的申请不可删除' }
    if (req.status === 'pending') releasePendingBudget(req.departmentId, req.adjustmentAmount * 12)
    requests.value = requests.value.filter((r) => r.id !== id)
    if (selectedRequestId.value === id) selectedRequestId.value = null
    return { ok: true, message: '已删除申请单' }
  }

  function addSalaryHistoryFromRequest(req: SalaryAdjustmentRequest, approvedAt: string, approverName: string) {
    salaryHistory.value.push({
      id: generateId(),
      employeeId: req.employeeId,
      employeeName: req.employeeName,
      departmentName: req.departmentName,
      position: req.position,
      oldSalary: req.currentSalary,
      newSalary: req.proposedSalary,
      adjustmentAmount: req.adjustmentAmount,
      adjustmentRatio: req.adjustmentRatio,
      reasonCategory: req.reasonCategory,
      reasonName: req.reasonName,
      effectiveDate: req.effectiveDate,
      approvedAt,
      applicantName: req.applicantName,
      approverName,
      description: req.description
    })
  }

  function getEmployeeHistory(employeeId: string): SalaryHistoryRecord[] {
    return salaryHistory.value
      .filter((h) => h.employeeId === employeeId)
      .sort((a, b) => dayjs(b.approvedAt).valueOf() - dayjs(a.approvedAt).valueOf())
  }

  function getEmployeePerformanceHistory(employeeId: string): PerformanceHistoryRecord[] {
    return performanceHistory.value
      .filter((h) => h.employeeId === employeeId)
      .sort((a, b) => dayjs(b.reviewedAt).valueOf() - dayjs(a.reviewedAt).valueOf())
  }

  function getEmployeeBonusPayments(employeeId: string): BonusPaymentRecord[] {
    return bonusPayments.value
      .filter((b) => b.employeeId === employeeId)
      .sort((a, b) => dayjs(b.paymentDate).valueOf() - dayjs(a.paymentDate).valueOf())
  }

  function getEmployeeApprovalRequests(employeeId: string): SalaryAdjustmentRequest[] {
    return requests.value
      .filter((r) => r.employeeId === employeeId)
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
  }

  const EVENT_TYPE_LABELS: Record<ArchiveEventType, string> = {
    salary_adjustment: '调薪',
    bonus_payment: '奖金发放',
    performance_review: '绩效评级',
    approval_record: '审批记录'
  }

  const EVENT_TYPE_COLORS: Record<ArchiveEventType, string> = {
    salary_adjustment: '#1890ff',
    bonus_payment: '#52c41a',
    performance_review: '#722ed1',
    approval_record: '#fa8c16'
  }

  const BONUS_TYPE_LABELS: Record<string, string> = {
    year_end: '年终奖',
    performance: '绩效奖',
    special: '特别奖',
    other: '其他'
  }

  function getEventTypeLabel(type: ArchiveEventType): string {
    return EVENT_TYPE_LABELS[type] || type
  }

  function getEventTypeColor(type: ArchiveEventType): string {
    return EVENT_TYPE_COLORS[type] || '#8c8c8c'
  }

  function getBonusTypeLabel(type: string): string {
    return BONUS_TYPE_LABELS[type] || type
  }

  function buildEmployeeArchive(employeeId: string): EmployeeCompensationArchive | null {
    const emp = bonusStore.getEmployeeById(employeeId)
    if (!emp) return null

    const dept = bonusStore.getDepartmentById(emp.departmentId)
    const deptName = dept?.name || ''

    const salaryHist = getEmployeeHistory(employeeId)
    const perfHist = getEmployeePerformanceHistory(employeeId)
    const bonusHist = getEmployeeBonusPayments(employeeId)
    const approvalReqs = getEmployeeApprovalRequests(employeeId)
    const signVouchers: BonusSignVoucher[] = bonusStore.getVouchersByEmployeeId(employeeId)

    const events: ArchiveTimelineEvent[] = []

    salaryHist.forEach((h) => {
      events.push({
        id: `salary_${h.id}`,
        type: 'salary_adjustment',
        date: h.effectiveDate,
        title: `${h.reasonName} - 调薪`,
        description: `${formatMoney(h.oldSalary)} → ${formatMoney(h.newSalary)}，涨幅 ${(h.adjustmentRatio * 100).toFixed(2)}%`,
        amount: h.adjustmentAmount,
        amountLabel: '调薪金额',
        status: '已生效',
        statusColor: '#52c41a',
        tags: [getCategoryLabel(h.reasonCategory)],
        detail: h,
        relatedRecordId: h.id
      })
    })

    bonusHist.forEach((b) => {
      events.push({
        id: `bonus_${b.id}`,
        type: 'bonus_payment',
        date: b.paymentDate,
        title: b.name,
        description: `${getBonusTypeLabel(b.type)}，税前 ${formatMoney(b.grossAmount)}，税后 ${formatMoney(b.netAmount)}`,
        amount: b.netAmount,
        amountLabel: '实发奖金',
        status: getStatusLabel(b.approvalStatus),
        statusColor: getStatusColor(b.approvalStatus),
        tags: [getBonusTypeLabel(b.type)],
        detail: b,
        relatedRecordId: b.id
      })
    })

    perfHist.forEach((p) => {
      events.push({
        id: `perf_${p.id}`,
        type: 'performance_review',
        date: p.reviewedAt.slice(0, 10),
        title: `${p.year}年度绩效评级`,
        description: `绩效等级：${p.levelName}（系数 ${p.coefficient}x），评定人：${p.reviewerName}`,
        status: p.levelName,
        statusColor: getPerformanceLevelColor(p.levelName),
        tags: [`${p.year}年`, p.half === 'annual' ? '年度' : p.half === 'first' ? '上半年' : '下半年'],
        detail: p,
        relatedRecordId: p.id
      })
    })

    approvalReqs.forEach((r) => {
      events.push({
        id: `approval_${r.id}`,
        type: 'approval_record',
        date: r.createdAt.slice(0, 10),
        title: `调薪申请 - ${r.reasonName}`,
        description: `申请单号：${r.requestNo}，申请调薪 ${formatMoney(r.adjustmentAmount)}，当前状态：${getStatusLabel(r.status)}`,
        amount: r.adjustmentAmount,
        amountLabel: '申请调薪额',
        status: getStatusLabel(r.status),
        statusColor: getStatusColor(r.status),
        tags: [r.requestNo],
        detail: r,
        relatedRecordId: r.id
      })
    })

    signVouchers.forEach((v) => {
      events.push({
        id: `signvoucher_${v.id}`,
        type: 'bonus_payment',
        date: v.signedAt.slice(0, 10),
        title: `${v.bonusName} - 签收凭证`,
        description: `凭证编号：${v.voucherNo}，签收人：${v.signature}，税前 ${formatMoney(v.grossAmount)}，税后 ${formatMoney(v.netAmount)}`,
        amount: v.netAmount,
        amountLabel: '实发奖金',
        status: '已签收',
        statusColor: '#52c41a',
        tags: [v.year.toString(), '签收凭证', v.batchName],
        detail: v,
        relatedRecordId: v.id
      })
    })

    events.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())

    const totalAdjustmentAmount = salaryHist.reduce((sum, h) => sum + h.adjustmentAmount, 0)
    const totalBonusGross = bonusHist.reduce((sum, b) => sum + b.grossAmount, 0)
    const totalBonusNet = bonusHist.reduce((sum, b) => sum + b.netAmount, 0)

    const currentLevel = perfHist.length > 0 ? perfHist[0].levelName : '-'
    const currentCoefficient = perfHist.length > 0 ? perfHist[0].coefficient : 1

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      departmentName: deptName,
      position: emp.position,
      baseSalary: emp.baseSalary,
      events,
      salaryHistory: salaryHist,
      bonusHistory: bonusHist,
      performanceHistory: perfHist,
      bonusSignVouchers: signVouchers,
      summary: {
        totalSalaryAdjustments: salaryHist.length,
        totalAdjustmentAmount,
        totalBonusPayments: bonusHist.length,
        totalBonusGross,
        totalBonusNet,
        performanceRecords: perfHist.length,
        currentLevel,
        currentCoefficient,
        totalBonusSignVouchers: signVouchers.length
      }
    }
  }

  function formatMoney(n: number): string {
    return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  function getPerformanceLevelColor(levelName: string): string {
    const colorMap: Record<string, string> = {
      S: '#f5222d',
      'A+': '#fa8c16',
      A: '#faad14',
      'B+': '#52c41a',
      B: '#1890ff',
      C: '#8c8c8c'
    }
    return colorMap[levelName] || '#8c8c8c'
  }

  function updateAnnualBudget(updates: Partial<AnnualSalaryBudget>) {
    if (!annualBudget.value) return
    annualBudget.value = {
      ...annualBudget.value,
      ...updates,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
  }

  function updateDepartmentBudget(departmentId: string, updates: Partial<DepartmentSalaryBudget>) {
    if (!annualBudget.value) return
    const idx = annualBudget.value.departments.findIndex((d) => d.departmentId === departmentId)
    if (idx === -1) return
    annualBudget.value.departments[idx] = { ...annualBudget.value.departments[idx], ...updates }
    annualBudget.value.totalBudget = round2(annualBudget.value.departments.reduce((s, d) => s + d.totalBudget, 0))
    annualBudget.value.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
  }

  function syncDepartmentsToBudget() {
    if (!annualBudget.value) {
      annualBudget.value = createInitialBudget()
      return
    }
    const existingIds = new Set(annualBudget.value.departments.map((d) => d.departmentId))
    for (const dept of bonusStore.departments) {
      if (!existingIds.has(dept.id)) {
        const totalAnnualSalary = dept.employees.reduce((sum, emp) => sum + emp.baseSalary * 12, 0)
        annualBudget.value.departments.push({
          departmentId: dept.id,
          departmentName: dept.name,
          totalBudget: round2(totalAnnualSalary * 0.1),
          usedAmount: 0,
          pendingAmount: 0,
          approvedCount: 0,
          pendingCount: 0,
          headcount: dept.employees.length,
          averageAdjustmentRatio: 0
        })
      } else {
        const db = annualBudget.value.departments.find((d) => d.departmentId === dept.id)
        if (db) {
          db.departmentName = dept.name
          db.headcount = dept.employees.length
        }
      }
    }
    annualBudget.value.departments = annualBudget.value.departments.filter((d) =>
      bonusStore.departments.some((bd) => bd.id === d.departmentId)
    )
    annualBudget.value.totalBudget = round2(annualBudget.value.departments.reduce((s, d) => s + d.totalBudget, 0))
    annualBudget.value.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
  }

  function exportModuleData(): SalaryAdjustmentModuleData {
    return {
      reasons: reasons.value,
      approvalWorkflow: approvalWorkflow.value,
      annualBudget: annualBudget.value,
      requests: requests.value,
      salaryHistory: salaryHistory.value,
      performanceHistory: performanceHistory.value,
      bonusPayments: bonusPayments.value
    }
  }

  function importModuleData(data: SalaryAdjustmentModuleData): boolean {
    try {
      reasons.value = data.reasons || []
      approvalWorkflow.value = data.approvalWorkflow || []
      annualBudget.value = data.annualBudget
      requests.value = data.requests || []
      salaryHistory.value = data.salaryHistory || []
      performanceHistory.value = data.performanceHistory || []
      bonusPayments.value = data.bonusPayments || []
      return true
    } catch {
      return false
    }
  }

  function getAvailableYears(): number[] {
    const years = new Set<number>()
    salaryHistory.value.forEach((h) => {
      years.add(dayjs(h.effectiveDate).year())
    })
    bonusPayments.value.forEach((b) => {
      years.add(b.year)
    })
    performanceHistory.value.forEach((p) => {
      years.add(p.year)
    })
    requests.value.forEach((r) => {
      if (r.status === 'approved') {
        years.add(dayjs(r.effectiveDate).year())
        if (r.approvedAt) {
          years.add(dayjs(r.approvedAt).year())
        }
      }
    })
    if (years.size === 0) {
      years.add(dayjs().year())
    }
    return Array.from(years).sort((a, b) => b - a)
  }

  function getEmployeeSalaryTrend(employeeId: string, year: number): SalaryTrendPoint[] {
    const history = getEmployeeHistory(employeeId)
      .filter((h) => dayjs(h.effectiveDate).year() === year)
      .sort((a, b) => dayjs(a.effectiveDate).valueOf() - dayjs(b.effectiveDate).valueOf())

    const trend: SalaryTrendPoint[] = []
    let currentSalary = 0

    const emp = bonusStore.getEmployeeById(employeeId)
    if (!emp) return []

    const earliestRecord = salaryHistory.value
      .filter((h) => h.employeeId === employeeId && dayjs(h.effectiveDate).year() < year)
      .sort((a, b) => dayjs(b.effectiveDate).valueOf() - dayjs(a.effectiveDate).valueOf())
    if (earliestRecord.length > 0) {
      currentSalary = earliestRecord[0].newSalary
    } else {
      currentSalary = history.length > 0 ? history[0].oldSalary : emp.baseSalary
    }

    trend.push({
      year,
      month: 1,
      label: `${year}年初`,
      baseSalary: currentSalary,
      adjustmentAmount: 0,
      adjustmentRatio: 0,
      reasonName: '起始薪资'
    })

    history.forEach((h) => {
      const d = dayjs(h.effectiveDate)
      trend.push({
        year,
        month: d.month() + 1,
        label: `${d.month() + 1}月`,
        baseSalary: h.newSalary,
        adjustmentAmount: h.adjustmentAmount,
        adjustmentRatio: h.adjustmentRatio,
        reasonName: h.reasonName
      })
      currentSalary = h.newSalary
    })

    return trend
  }

  function getEmployeeBonusTrend(employeeId: string, year: number): BonusTrendPoint[] {
    return bonusPayments.value
      .filter((b) => b.employeeId === employeeId && b.year === year && b.approvalStatus === 'approved')
      .sort((a, b) => dayjs(a.paymentDate).valueOf() - dayjs(b.paymentDate).valueOf())
      .map((b) => ({
        year: b.year,
        type: b.type,
        name: b.name,
        grossAmount: b.grossAmount,
        taxAmount: b.taxAmount,
        netAmount: b.netAmount,
        taxMethod: b.taxMethod
      }))
  }

  function getEmployeePerformanceTrend(employeeId: string, year: number): PerformanceTrendPoint[] {
    return performanceHistory.value
      .filter((p) => p.employeeId === employeeId && p.year === year)
      .sort((a, b) => {
        const order: Record<string, number> = { first: 1, second: 2, annual: 3 }
        return (order[a.half] || 0) - (order[b.half] || 0)
      })
      .map((p) => ({
        year: p.year,
        half: p.half,
        levelName: p.levelName,
        coefficient: p.coefficient,
        comment: p.comment
      }))
  }

  function buildEmployeeAnnualReview(employeeId: string, year: number): EmployeeAnnualReview | null {
    const emp = bonusStore.getEmployeeById(employeeId)
    if (!emp) return null

    const dept = bonusStore.getDepartmentById(emp.departmentId)
    const deptName = dept?.name || ''

    const salaryTrend = getEmployeeSalaryTrend(employeeId, year)
    const bonusTrend = getEmployeeBonusTrend(employeeId, year)
    const performanceTrend = getEmployeePerformanceTrend(employeeId, year)

    const startSalary = salaryTrend.length > 0 ? salaryTrend[0].baseSalary : emp.baseSalary
    const endSalary = salaryTrend.length > 0 ? salaryTrend[salaryTrend.length - 1].baseSalary : emp.baseSalary
    const salaryGrowthRate = startSalary > 0 ? (endSalary - startSalary) / startSalary : 0

    const totalBonusGross = bonusTrend.reduce((sum, b) => sum + b.grossAmount, 0)
    const totalBonusNet = bonusTrend.reduce((sum, b) => sum + b.netAmount, 0)
    const totalBaseSalaryAnnual = endSalary * 12

    const adjustments = salaryTrend.filter((t) => t.adjustmentAmount > 0)
    const totalAdjustmentAmount = adjustments.reduce((sum, t) => sum + t.adjustmentAmount, 0)
    const averageAdjustmentRatio = adjustments.length > 0
      ? adjustments.reduce((sum, t) => sum + t.adjustmentRatio, 0) / adjustments.length
      : 0

    const levels = performanceTrend.map((p) => p.levelName)
    const levelOrder = ['S', 'A+', 'A', 'B+', 'B', 'C']
    const sortedLevels = [...levels].sort((a, b) => levelOrder.indexOf(a) - levelOrder.indexOf(b))

    const summary: AnnualCompensationSummary = {
      year,
      totalBaseSalaryAnnual: round2(totalBaseSalaryAnnual),
      totalBonusGross: round2(totalBonusGross),
      totalBonusNet: round2(totalBonusNet),
      totalCompensationGross: round2(totalBaseSalaryAnnual + totalBonusGross),
      totalCompensationNet: round2(totalBaseSalaryAnnual + totalBonusNet),
      salaryAdjustmentCount: adjustments.length,
      totalAdjustmentAmount: round2(totalAdjustmentAmount),
      averageAdjustmentRatio: round2(averageAdjustmentRatio),
      bonusPaymentCount: bonusTrend.length,
      performanceRecords: performanceTrend.length,
      highestPerformanceLevel: sortedLevels[0] || '-',
      lowestPerformanceLevel: sortedLevels[sortedLevels.length - 1] || '-'
    }

    const allEmployees = bonusStore.allEmployees
    const allSalaries = allEmployees.map((e) => e.baseSalary).sort((a, b) => a - b)
    const salaryRank = allSalaries.filter((s) => s <= endSalary).length
    const salaryPercentile = allSalaries.length > 0 ? salaryRank / allSalaries.length : 0

    const allBonusTotals = allEmployees.map((e) => {
      const bt = getEmployeeBonusTrend(e.id, year)
      return bt.reduce((sum, b) => sum + b.grossAmount, 0)
    }).sort((a, b) => a - b)
    const bonusRank = allBonusTotals.filter((b) => b <= totalBonusGross).length
    const bonusPercentile = allBonusTotals.length > 0 ? bonusRank / allBonusTotals.length : 0

    let perfTrendText = '稳定'
    if (performanceTrend.length >= 2) {
      const firstCoeff = performanceTrend[0].coefficient
      const lastCoeff = performanceTrend[performanceTrend.length - 1].coefficient
      if (lastCoeff > firstCoeff) {
        perfTrendText = '上升'
      } else if (lastCoeff < firstCoeff) {
        perfTrendText = '下降'
      }
    }

    let recommendation = '保持现有水平'
    if (salaryGrowthRate > 0.2) {
      recommendation = '本年度调薪幅度较大，建议关注绩效产出'
    } else if (salaryGrowthRate < 0.05 && perfTrendText === '上升') {
      recommendation = '绩效提升明显，建议考虑调薪激励'
    } else if (perfTrendText === '下降') {
      recommendation = '绩效有所下滑，建议关注能力提升计划'
    }

    const marketBenchmark = getMarketBenchmarkByPosition(emp.position, year)
    const competitiveness = calculateSalaryCompetitiveness(emp.id, year)

    let marketPositionText = '暂无市场对标数据'
    let competitivenessText = '-'

    if (competitiveness) {
      marketPositionText = `市场分位 ${competitiveness.baseSalaryPercentile}%，${getCompetitivenessLevelLabel(competitiveness.competitivenessLevel)}`
      competitivenessText = getCompetitivenessLevelLabel(competitiveness.competitivenessLevel)

      if (competitiveness.recommendations.length > 0) {
        recommendation = competitiveness.recommendations[0]
      }
    }

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      departmentName: deptName,
      position: emp.position,
      year,
      startSalary: round2(startSalary),
      endSalary: round2(endSalary),
      salaryGrowthRate: round2(salaryGrowthRate),
      salaryTrend,
      bonusTrend,
      performanceTrend,
      summary,
      marketBenchmark: marketBenchmark || undefined,
      competitiveness: competitiveness || undefined,
      insights: {
        salaryPosition: `全公司前 ${(salaryPercentile * 100).toFixed(0)}%`,
        bonusPosition: `全公司前 ${(bonusPercentile * 100).toFixed(0)}%`,
        performanceTrend: perfTrendText,
        recommendation,
        marketPosition: marketPositionText,
        competitiveness: competitivenessText
      }
    }
  }

  function buildDepartmentAnnualReview(departmentId: string, year: number): DepartmentAnnualReview | null {
    const dept = bonusStore.getDepartmentById(departmentId)
    if (!dept) return null

    const employees = dept.employees
    const reviews = employees
      .map((e) => buildEmployeeAnnualReview(e.id, year))
      .filter((r): r is EmployeeAnnualReview => r !== null)

    if (reviews.length === 0) {
      return {
        departmentId,
        departmentName: dept.name,
        year,
        headcount: employees.length,
        averageSalary: 0,
        averageBonus: 0,
        totalCompensation: 0,
        salaryGrowthRate: 0,
        performanceDistribution: {}
      }
    }

    const averageSalary = round2(reviews.reduce((sum, r) => sum + r.endSalary, 0) / reviews.length)
    const averageBonus = round2(reviews.reduce((sum, r) => sum + r.summary.totalBonusGross, 0) / reviews.length)
    const totalCompensation = round2(reviews.reduce((sum, r) => sum + r.summary.totalCompensationGross, 0))

    const totalGrowth = reviews.reduce((sum, r) => sum + r.salaryGrowthRate, 0)
    const salaryGrowthRate = round2(totalGrowth / reviews.length)

    const performanceDistribution: Record<string, number> = {}
    reviews.forEach((r) => {
      const level = r.summary.highestPerformanceLevel
      if (level && level !== '-') {
        performanceDistribution[level] = (performanceDistribution[level] || 0) + 1
      }
    })

    return {
      departmentId,
      departmentName: dept.name,
      year,
      headcount: employees.length,
      averageSalary,
      averageBonus,
      totalCompensation,
      salaryGrowthRate,
      performanceDistribution
    }
  }

  function buildAnnualReviewReport(year: number, scope: 'company' | 'department' | 'employee' = 'company', scopeId?: string): AnnualCompensationReviewReport {
    syncAppliedCalibrationsToPerformanceHistory()

    const report: AnnualCompensationReviewReport = {
      year,
      generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      scope,
      scopeId,
      scopeName: scope === 'company' ? '全公司' : undefined
    }

    let employeeIds: string[] | undefined
    if (scope === 'department' && scopeId) {
      const dept = bonusStore.getDepartmentById(scopeId)
      employeeIds = dept?.employees.map((e) => e.id) || []
    } else if (scope === 'employee' && scopeId) {
      employeeIds = [scopeId]
    }
    const promotionCandidates = analyzePromotionCandidates(year, employeeIds)
    const salaryRecommendations = generateNextYearSalaryRecommendations(year, employeeIds)
    const promotionMap = new Map(promotionCandidates.map((c) => [c.employeeId, c]))
    const recommendationMap = new Map(salaryRecommendations.map((r) => [r.employeeId, r]))

    const strongCandidates = promotionCandidates.filter((c) => c.level === 'strong').length
    const recommendedCandidates = promotionCandidates.filter((c) => c.level === 'recommended').length
    const potentialCandidates = promotionCandidates.filter((c) => c.level === 'potential').length
    const urgentRecommendations = salaryRecommendations.filter((r) => r.priority === 'urgent').length
    const highPriorityRecommendations = salaryRecommendations.filter((r) => r.priority === 'high').length
    const totalSuggestedAmount = round2(salaryRecommendations.reduce((sum, r) => sum + r.suggestedAmount, 0))
    const categoryBreakdown: Record<SalaryRecommendationCategory, number> = {
      promotion: 0,
      performance_tilt: 0,
      market_catchup: 0,
      retention: 0,
      annual_regular: 0
    }
    salaryRecommendations.forEach((r) => {
      categoryBreakdown[r.category]++
    })
    report.promotionAndAdjustmentSummary = {
      strongCandidates,
      recommendedCandidates,
      potentialCandidates,
      urgentRecommendations,
      highPriorityRecommendations,
      totalSuggestedAmount,
      categoryBreakdown
    }

    if (scope === 'company') {
      const allEmployees = bonusStore.allEmployees
      const reviews = allEmployees
        .map((e) => buildEmployeeAnnualReview(e.id, year))
        .filter((r): r is EmployeeAnnualReview => r !== null)

      const deptReviews = bonusStore.departments
        .map((d) => buildDepartmentAnnualReview(d.id, year))
        .filter((r): r is DepartmentAnnualReview => r !== null)

      const totalAnnualSalary = reviews.reduce((sum, r) => sum + r.summary.totalBaseSalaryAnnual, 0)
      const totalBonusGross = reviews.reduce((sum, r) => sum + r.summary.totalBonusGross, 0)
      const totalCompensation = reviews.reduce((sum, r) => sum + r.summary.totalCompensationGross, 0)
      const avgSalary = reviews.length > 0 ? totalAnnualSalary / reviews.length / 12 : 0
      const avgBonus = reviews.length > 0 ? totalBonusGross / reviews.length : 0

      const growthRates = reviews.map((r) => r.salaryGrowthRate)
      const overallGrowth = growthRates.length > 0 ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length : 0

      const perfDist: Record<string, number> = {}
      reviews.forEach((r) => {
        const level = r.summary.highestPerformanceLevel
        if (level && level !== '-') {
          perfDist[level] = (perfDist[level] || 0) + 1
        }
      })

      const adjByCategory: Record<AdjustmentReasonCategory, number> = {
        annual: 0,
        performance: 0,
        promotion: 0,
        market: 0,
        certification: 0,
        transfer: 0,
        special: 0
      }
      salaryHistory.value
        .filter((h) => dayjs(h.effectiveDate).year() === year)
        .forEach((h) => {
          adjByCategory[h.reasonCategory] = (adjByCategory[h.reasonCategory] || 0) + h.adjustmentAmount
        })

      const sortedByGrowth = [...reviews].sort((a, b) => b.salaryGrowthRate - a.salaryGrowthRate)
      const sortedByBonus = [...reviews].sort((a, b) => b.summary.totalBonusGross - a.summary.totalBonusGross)

      report.companySummary = {
        totalHeadcount: allEmployees.length,
        totalAnnualSalary: round2(totalAnnualSalary),
        totalBonusGross: round2(totalBonusGross),
        totalCompensation: round2(totalCompensation),
        averageSalary: round2(avgSalary),
        averageBonus: round2(avgBonus),
        overallSalaryGrowth: round2(overallGrowth),
        performanceDistribution: perfDist
      }
      reviews.forEach((r) => {
        const pc = promotionMap.get(r.employeeId)
        if (pc) {
          r.promotionCandidate = {
            level: pc.level,
            levelLabel: pc.levelLabel,
            score: pc.score,
            reasons: pc.reasons
          }
        }
        const rec = recommendationMap.get(r.employeeId)
        if (rec) {
          r.nextYearSalaryRecommendation = {
            category: rec.category,
            categoryLabel: rec.categoryLabel,
            suggestedMinRatio: rec.suggestedMinRatio,
            suggestedMaxRatio: rec.suggestedMaxRatio,
            suggestedAmount: rec.suggestedAmount,
            priority: rec.priority,
            priorityLabel: rec.priorityLabel,
            reasons: rec.reasons
          }
        }
      })
      report.departments = deptReviews
      report.employees = reviews
      report.topSalaryGrowth = sortedByGrowth.slice(0, 5)
      report.topBonusEarners = sortedByBonus.slice(0, 5)
      report.salaryAdjustmentByCategory = adjByCategory
    } else if (scope === 'department' && scopeId) {
      const dept = bonusStore.getDepartmentById(scopeId)
      report.scopeName = dept?.name || '未知部门'
      report.departments = buildDepartmentAnnualReview(scopeId, year) ? [buildDepartmentAnnualReview(scopeId, year)!] : []
      const deptEmps = dept?.employees || []
      const reviews = deptEmps
        .map((e) => buildEmployeeAnnualReview(e.id, year))
        .filter((r): r is EmployeeAnnualReview => r !== null)
      report.employees = reviews

      const totalAnnualSalary = reviews.reduce((sum, r) => sum + r.summary.totalBaseSalaryAnnual, 0)
      const totalBonusGross = reviews.reduce((sum, r) => sum + r.summary.totalBonusGross, 0)
      const totalCompensation = reviews.reduce((sum, r) => sum + r.summary.totalCompensationGross, 0)
      const avgSalary = reviews.length > 0 ? totalAnnualSalary / reviews.length / 12 : 0
      const avgBonus = reviews.length > 0 ? totalBonusGross / reviews.length : 0
      const growthRates = reviews.map((r) => r.salaryGrowthRate)
      const overallGrowth = growthRates.length > 0 ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length : 0
      const perfDist: Record<string, number> = {}
      reviews.forEach((r) => {
        const level = r.summary.highestPerformanceLevel
        if (level && level !== '-') perfDist[level] = (perfDist[level] || 0) + 1
      })

      const deptEmpIds = new Set(deptEmps.map((e) => e.id))
      const adjByCategory: Record<AdjustmentReasonCategory, number> = {
        annual: 0, performance: 0, promotion: 0, market: 0, certification: 0, transfer: 0, special: 0
      }
      salaryHistory.value
        .filter((h) => dayjs(h.effectiveDate).year() === year && deptEmpIds.has(h.employeeId))
        .forEach((h) => {
          adjByCategory[h.reasonCategory] = (adjByCategory[h.reasonCategory] || 0) + h.adjustmentAmount
        })

      report.companySummary = {
        totalHeadcount: deptEmps.length,
        totalAnnualSalary: round2(totalAnnualSalary),
        totalBonusGross: round2(totalBonusGross),
        totalCompensation: round2(totalCompensation),
        averageSalary: round2(avgSalary),
        averageBonus: round2(avgBonus),
        overallSalaryGrowth: round2(overallGrowth),
        performanceDistribution: perfDist
      }
      reviews.forEach((r) => {
        const pc = promotionMap.get(r.employeeId)
        if (pc) {
          r.promotionCandidate = {
            level: pc.level,
            levelLabel: pc.levelLabel,
            score: pc.score,
            reasons: pc.reasons
          }
        }
        const rec = recommendationMap.get(r.employeeId)
        if (rec) {
          r.nextYearSalaryRecommendation = {
            category: rec.category,
            categoryLabel: rec.categoryLabel,
            suggestedMinRatio: rec.suggestedMinRatio,
            suggestedMaxRatio: rec.suggestedMaxRatio,
            suggestedAmount: rec.suggestedAmount,
            priority: rec.priority,
            priorityLabel: rec.priorityLabel,
            reasons: rec.reasons
          }
        }
      })
      report.salaryAdjustmentByCategory = adjByCategory
      report.topSalaryGrowth = [...reviews].sort((a, b) => b.salaryGrowthRate - a.salaryGrowthRate).slice(0, 5)
      report.topBonusEarners = [...reviews].sort((a, b) => b.summary.totalBonusGross - a.summary.totalBonusGross).slice(0, 5)
    } else if (scope === 'employee' && scopeId) {
      const review = buildEmployeeAnnualReview(scopeId, year)
      if (review) {
        const pc = promotionMap.get(review.employeeId)
        if (pc) {
          review.promotionCandidate = {
            level: pc.level,
            levelLabel: pc.levelLabel,
            score: pc.score,
            reasons: pc.reasons
          }
        }
        const rec = recommendationMap.get(review.employeeId)
        if (rec) {
          review.nextYearSalaryRecommendation = {
            category: rec.category,
            categoryLabel: rec.categoryLabel,
            suggestedMinRatio: rec.suggestedMinRatio,
            suggestedMaxRatio: rec.suggestedMaxRatio,
            suggestedAmount: rec.suggestedAmount,
            priority: rec.priority,
            priorityLabel: rec.priorityLabel,
            reasons: rec.reasons
          }
        }
        report.scopeName = review.employeeName
        report.employees = [review]

        const perfDist: Record<string, number> = {}
        const level = review.summary.highestPerformanceLevel
        if (level && level !== '-') perfDist[level] = 1

        const adjByCategory: Record<AdjustmentReasonCategory, number> = {
          annual: 0, performance: 0, promotion: 0, market: 0, certification: 0, transfer: 0, special: 0
        }
        salaryHistory.value
          .filter((h) => dayjs(h.effectiveDate).year() === year && h.employeeId === scopeId)
          .forEach((h) => {
            adjByCategory[h.reasonCategory] = (adjByCategory[h.reasonCategory] || 0) + h.adjustmentAmount
          })

        report.companySummary = {
          totalHeadcount: 1,
          totalAnnualSalary: review.summary.totalBaseSalaryAnnual,
          totalBonusGross: review.summary.totalBonusGross,
          totalCompensation: review.summary.totalCompensationGross,
          averageSalary: review.endSalary,
          averageBonus: review.summary.totalBonusGross,
          overallSalaryGrowth: review.salaryGrowthRate,
          performanceDistribution: perfDist
        }
        report.salaryAdjustmentByCategory = adjByCategory
      }
    }

    return report
  }

  function exportReviewReportHtml(report: AnnualCompensationReviewReport): string {
    const year = report.year
    const generatedAt = report.generatedAt

    let companySummary = report.companySummary
    let departments = report.departments || []
    let employees = report.employees || []
    const topGrowth = report.topSalaryGrowth || []
    const topBonus = report.topBonusEarners || []
    const adjByCategory = report.salaryAdjustmentByCategory || {} as Record<AdjustmentReasonCategory, number>

    let scopeTitle = '全公司'
    if (report.scope === 'department') {
      scopeTitle = report.scopeName || '部门'
    } else if (report.scope === 'employee') {
      scopeTitle = report.scopeName || '员工'
    }

    const categoryRows = Object.entries(adjByCategory).map(([cat, amount]) => {
      const label = CATEGORY_LABELS[cat as AdjustmentReasonCategory] || cat
      return `<tr><td>${label}</td><td style="text-align:right">${formatMoney(amount)}</td></tr>`
    }).join('')

    const deptRows = departments.map((d) => `
      <tr>
        <td>${d.departmentName}</td>
        <td style="text-align:center">${d.headcount}</td>
        <td style="text-align:right">${formatMoney(d.averageSalary)}</td>
        <td style="text-align:right">${formatMoney(d.averageBonus)}</td>
        <td style="text-align:right">${formatMoney(d.totalCompensation)}</td>
        <td style="text-align:right;color:${d.salaryGrowthRate >= 0 ? '#52c41a' : '#f5222d'}">${d.salaryGrowthRate >= 0 ? '+' : ''}${(d.salaryGrowthRate * 100).toFixed(2)}%</td>
      </tr>
    `).join('')

    const topGrowthRows = topGrowth.map((r, i) => `
      <tr>
        <td style="text-align:center">${i + 1}</td>
        <td>${r.employeeName}</td>
        <td>${r.departmentName}</td>
        <td style="text-align:right">${formatMoney(r.startSalary)}</td>
        <td style="text-align:right">${formatMoney(r.endSalary)}</td>
        <td style="text-align:right;color:#52c41a;font-weight:600">+${(r.salaryGrowthRate * 100).toFixed(2)}%</td>
      </tr>
    `).join('')

    const topBonusRows = topBonus.map((r, i) => `
      <tr>
        <td style="text-align:center">${i + 1}</td>
        <td>${r.employeeName}</td>
        <td>${r.departmentName}</td>
        <td style="text-align:right">${formatMoney(r.summary.totalBonusGross)}</td>
        <td style="text-align:right">${formatMoney(r.summary.totalBonusNet)}</td>
        <td style="text-align:center">${r.summary.bonusPaymentCount}笔</td>
      </tr>
    `).join('')

    const employeeRows = employees.slice(0, 20).map((r) => `
      <tr>
        <td>${r.employeeName}</td>
        <td>${r.departmentName}</td>
        <td>${r.position}</td>
        <td style="text-align:right">${formatMoney(r.endSalary)}</td>
        <td style="text-align:right;color:${r.salaryGrowthRate >= 0 ? '#52c41a' : '#f5222d'}">${r.salaryGrowthRate >= 0 ? '+' : ''}${(r.salaryGrowthRate * 100).toFixed(2)}%</td>
        <td style="text-align:right">${formatMoney(r.summary.totalBonusGross)}</td>
        <td style="text-align:right">${formatMoney(r.summary.totalCompensationGross)}</td>
        <td style="text-align:center;color:${getPerformanceLevelColor(r.summary.highestPerformanceLevel)};font-weight:600">${r.summary.highestPerformanceLevel}</td>
      </tr>
    `).join('')

    const perfDistRows = companySummary ? Object.entries(companySummary.performanceDistribution).map(([level, count]) => {
      const pct = companySummary.totalHeadcount > 0 ? (count / companySummary.totalHeadcount * 100).toFixed(1) : '0'
      return `<tr><td style="color:${getPerformanceLevelColor(level)};font-weight:600">${level}</td><td style="text-align:center">${count}</td><td style="text-align:right">${pct}%</td></tr>`
    }).join('') : ''

    const paSummary = report.promotionAndAdjustmentSummary
    const paCategoryLabels: Record<string, string> = {
      promotion: '晋升调薪',
      performance_tilt: '绩效倾斜',
      market_catchup: '市场补差',
      retention: '保留性调薪',
      annual_regular: '常规年度调薪'
    }
    const paCategoryRows = paSummary ? Object.entries(paSummary.categoryBreakdown).map(([cat, count]) => {
      const label = paCategoryLabels[cat] || cat
      return `<tr><td>${label}</td><td style="text-align:center">${count} 人</td></tr>`
    }).join('') : ''

    const paEmployeeRows = employees.slice(0, 20).map((r) => {
      const pc = r.promotionCandidate
      const rec = r.nextYearSalaryRecommendation
      const pcLabel = pc ? `${pc.levelLabel} (${pc.score}分)` : '-'
      const recLabel = rec ? `${rec.categoryLabel} +${(rec.suggestedMinRatio * 100).toFixed(0)}%~${(rec.suggestedMaxRatio * 100).toFixed(0)}%` : '-'
      const pcColor = pc?.level === 'strong' ? '#d46b08' : pc?.level === 'recommended' ? '#096dd9' : pc?.level === 'potential' ? '#389e0d' : '#8c8c8c'
      const recColor = rec?.priority === 'urgent' ? '#cf1322' : rec?.priority === 'high' ? '#d46b08' : rec?.priority === 'medium' ? '#096dd9' : '#8c8c8c'
      return `
      <tr>
        <td>${r.employeeName}</td>
        <td>${r.departmentName}</td>
        <td>${r.position}</td>
        <td style="text-align:right">${formatMoney(r.endSalary)}</td>
        <td style="text-align:right;color:${r.salaryGrowthRate >= 0 ? '#52c41a' : '#f5222d'}">${r.salaryGrowthRate >= 0 ? '+' : ''}${(r.salaryGrowthRate * 100).toFixed(2)}%</td>
        <td style="text-align:right">${formatMoney(r.summary.totalBonusGross)}</td>
        <td style="text-align:right">${formatMoney(r.summary.totalCompensationGross)}</td>
        <td style="text-align:center;color:${getPerformanceLevelColor(r.summary.highestPerformanceLevel)};font-weight:600">${r.summary.highestPerformanceLevel}</td>
        <td style="text-align:center;color:${pcColor};font-weight:600">${pcLabel}</td>
        <td style="text-align:center;color:${recColor};font-weight:600">${recLabel}</td>
      </tr>`
    }).join('')

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${year}年度薪酬包复盘报告_${scopeTitle}_${dayjs().format('YYYYMMDD')}</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; color: #262626; line-height: 1.6; font-size: 12px; }
  .header { text-align: center; padding: 16px 0 12px; border-bottom: 3px solid #2080f0; margin-bottom: 16px; }
  .header h1 { font-size: 22px; color: #2080f0; margin-bottom: 4px; }
  .header p { color: #8c8c8c; font-size: 12px; }
  .info-bar { display: flex; justify-content: space-between; background: #f6f8fa; padding: 10px 16px; border-radius: 8px; margin-bottom: 16px; }
  .info-item .label { color: #8c8c8c; font-size: 11px; margin-bottom: 2px; }
  .info-item .value { font-size: 15px; font-weight: 700; color: #262626; }
  h2 { font-size: 15px; color: #262626; margin: 20px 0 10px; padding-left: 8px; border-left: 3px solid #2080f0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px; }
  th, td { border: 1px solid #e8e8e8; padding: 6px 10px; text-align: left; }
  th { background: #fafafa; font-weight: 600; color: #595959; white-space: nowrap; }
  tr:nth-child(even) td { background: #fafafa; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
  .summary-card { text-align: center; padding: 12px; border-radius: 8px; background: #f6f8fa; }
  .summary-card .label { font-size: 11px; color: #8c8c8c; margin-bottom: 4px; }
  .summary-card .value { font-size: 18px; font-weight: 700; color: #262626; }
  .sc-salary { background: #e6f7ff; }
  .sc-bonus { background: #f6ffed; }
  .sc-total { background: #fff7e6; }
  .sc-growth { background: #f9f0ff; }
  .sc-strong { background: #fff7e6; }
  .sc-recommended { background: #e6f7ff; }
  .sc-potential { background: #f6ffed; }
  .sc-budget { background: #f9f0ff; }
  .pa-cat-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 12px; }
  .pa-cat-item { text-align: center; padding: 8px; border-radius: 6px; background: #fafafa; font-size: 11px; }
  .pa-cat-item.cat-promotion { background: #fff7e6; }
  .pa-cat-item.cat-performance_tilt { background: #f6ffed; }
  .pa-cat-item.cat-market_catchup { background: #e6f7ff; }
  .pa-cat-item.cat-retention { background: #fff1f0; }
  .pa-cat-item.cat-annual_regular { background: #f5f5f5; }
  .pa-cat-item .cat-label { color: #595959; margin-bottom: 4px; }
  .pa-cat-item .cat-count { font-weight: 700; font-size: 14px; color: #262626; }
  .footer { text-align: center; color: #bfbfbf; font-size: 10px; margin-top: 24px; padding-top: 10px; border-top: 1px solid #e8e8e8; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>

<div class="header">
  <h1>${year}年度薪酬包复盘报告</h1>
  <p>统计范围：${scopeTitle} · 生成时间：${generatedAt}</p>
</div>

${companySummary ? `
<div class="summary-grid">
  <div class="summary-card sc-salary">
    <div class="label">员工总数</div>
    <div class="value">${companySummary.totalHeadcount} 人</div>
  </div>
  <div class="summary-card sc-salary">
    <div class="label">年度薪资总额</div>
    <div class="value">${formatMoney(companySummary.totalAnnualSalary)}</div>
  </div>
  <div class="summary-card sc-bonus">
    <div class="label">年度奖金总额</div>
    <div class="value">${formatMoney(companySummary.totalBonusGross)}</div>
  </div>
  <div class="summary-card sc-total">
    <div class="label">年度薪酬总包</div>
    <div class="value">${formatMoney(companySummary.totalCompensation)}</div>
  </div>
</div>

<div class="summary-grid">
  <div class="summary-card">
    <div class="label">平均月薪</div>
    <div class="value">${formatMoney(companySummary.averageSalary)}</div>
  </div>
  <div class="summary-card">
    <div class="label">平均奖金</div>
    <div class="value">${formatMoney(companySummary.averageBonus)}</div>
  </div>
  <div class="summary-card sc-growth">
    <div class="label">整体薪资增长率</div>
    <div class="value" style="color:#52c41a">+${(companySummary.overallSalaryGrowth * 100).toFixed(2)}%</div>
  </div>
  <div class="summary-card">
    <div class="label">绩效等级数</div>
    <div class="value">${Object.keys(companySummary.performanceDistribution).length} 级</div>
  </div>
</div>
` : ''}

<h2>一、调薪分布分析</h2>
<table>
  <thead>
    <tr><th>调薪事由</th><th style="text-align:right">调薪总额（年度化）</th></tr>
  </thead>
  <tbody>${categoryRows || '<tr><td colspan="2" style="text-align:center;color:#bfbfbf">暂无数据</td></tr>'}</tbody>
</table>

<h2>二、部门薪酬概览</h2>
<table>
  <thead>
    <tr>
      <th>部门</th>
      <th style="text-align:center">人数</th>
      <th style="text-align:right">平均月薪</th>
      <th style="text-align:right">平均奖金</th>
      <th style="text-align:right">薪酬总包</th>
      <th style="text-align:right">薪资增长率</th>
    </tr>
  </thead>
  <tbody>${deptRows || '<tr><td colspan="6" style="text-align:center;color:#bfbfbf">暂无数据</td></tr>'}</tbody>
</table>

<h2>三、绩效等级分布</h2>
<table>
  <thead>
    <tr><th>绩效等级</th><th style="text-align:center">人数</th><th style="text-align:right">占比</th></tr>
  </thead>
  <tbody>${perfDistRows || '<tr><td colspan="3" style="text-align:center;color:#bfbfbf">暂无数据</td></tr>'}</tbody>
</table>

${topGrowth.length > 0 ? `
<h2>四、薪资增长 TOP5</h2>
<table>
  <thead>
    <tr>
      <th style="text-align:center">排名</th>
      <th>姓名</th>
      <th>部门</th>
      <th style="text-align:right">年初薪资</th>
      <th style="text-align:right">年末薪资</th>
      <th style="text-align:right">增长率</th>
    </tr>
  </thead>
  <tbody>${topGrowthRows}</tbody>
</table>
` : ''}

${topBonus.length > 0 ? `
<h2>五、奖金收入 TOP5</h2>
<table>
  <thead>
    <tr>
      <th style="text-align:center">排名</th>
      <th>姓名</th>
      <th>部门</th>
      <th style="text-align:right">税前奖金</th>
      <th style="text-align:right">税后奖金</th>
      <th style="text-align:center">笔数</th>
    </tr>
  </thead>
  <tbody>${topBonusRows}</tbody>
</table>
` : ''}

${paSummary ? `
<h2>六、晋升候选与下年度调薪建议</h2>
<div class="summary-grid">
  <div class="summary-card sc-strong">
    <div class="label">强烈推荐晋升</div>
    <div class="value" style="color:#d46b08">${paSummary.strongCandidates} 人</div>
  </div>
  <div class="summary-card sc-recommended">
    <div class="label">推荐晋升</div>
    <div class="value" style="color:#096dd9">${paSummary.recommendedCandidates} 人</div>
  </div>
  <div class="summary-card sc-potential">
    <div class="label">关注培养</div>
    <div class="value" style="color:#389e0d">${paSummary.potentialCandidates} 人</div>
  </div>
  <div class="summary-card sc-budget">
    <div class="label">建议调薪预算</div>
    <div class="value" style="color:#531dab">${formatMoney(paSummary.totalSuggestedAmount)}</div>
  </div>
</div>
<div class="pa-cat-grid">
  <div class="pa-cat-item cat-promotion">
    <div class="cat-label">晋升调薪</div>
    <div class="cat-count">${paSummary.categoryBreakdown.promotion} 人</div>
  </div>
  <div class="pa-cat-item cat-performance_tilt">
    <div class="cat-label">绩效倾斜</div>
    <div class="cat-count">${paSummary.categoryBreakdown.performance_tilt} 人</div>
  </div>
  <div class="pa-cat-item cat-market_catchup">
    <div class="cat-label">市场补差</div>
    <div class="cat-count">${paSummary.categoryBreakdown.market_catchup} 人</div>
  </div>
  <div class="pa-cat-item cat-retention">
    <div class="cat-label">保留性调薪</div>
    <div class="cat-count">${paSummary.categoryBreakdown.retention} 人</div>
  </div>
  <div class="pa-cat-item cat-annual_regular">
    <div class="cat-label">常规年度调薪</div>
    <div class="cat-count">${paSummary.categoryBreakdown.annual_regular} 人</div>
  </div>
</div>
` : ''}

<h2>七、员工薪酬明细（前20名）</h2>
<table>
  <thead>
    <tr>
      <th>姓名</th>
      <th>部门</th>
      <th>职位</th>
      <th style="text-align:right">年末月薪</th>
      <th style="text-align:right">薪资增长率</th>
      <th style="text-align:right">年度奖金</th>
      <th style="text-align:right">年度总包</th>
      <th style="text-align:center">最高绩效</th>
      <th style="text-align:center">晋升候选</th>
      <th style="text-align:center">下年度调薪建议</th>
    </tr>
  </thead>
  <tbody>${paEmployeeRows || '<tr><td colspan="10" style="text-align:center;color:#bfbfbf">暂无数据</td></tr>'}</tbody>
</table>

<div class="footer">
  本文档由「年终奖模拟器」系统自动生成 · ${generatedAt}
</div>

</body>
</html>`
  }

  function syncCompensationArchiveOnApproval(request: SalaryAdjustmentRequest, approverName: string): boolean {
    try {
      const approvedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')

      bonusStore.addSalaryAdjustmentImpact(request.employeeId, {
        name: '调薪影响',
        description: `${request.reasonName} - ${request.requestNo}`,
        effectiveDate: request.effectiveDate,
        oldValue: request.currentSalary,
        newValue: request.proposedSalary,
        requestNo: request.requestNo,
        reasonName: request.reasonName
      })

      bonusStore.updateEmployee(request.employeeId, { baseSalary: request.proposedSalary })

      addSalaryHistoryFromRequest(request, approvedAt, approverName)

      pendingToUsedBudget(request.departmentId, request.adjustmentAmount * 12)

      return true
    } catch {
      return false
    }
  }

  function getYearlySalaryGrowthData(year: number, employeeIds?: string[]): YearlySalaryGrowthData {
    const allEmployees = bonusStore.allEmployees
    const targetEmployees = employeeIds
      ? allEmployees.filter((e) => employeeIds.includes(e.id))
      : allEmployees

    const yearHistory = salaryHistory.value.filter((h) => {
      const inYear = dayjs(h.effectiveDate).year() === year
      const inScope = !employeeIds || employeeIds.includes(h.employeeId)
      return inYear && inScope
    })

    const prevYearHistory = salaryHistory.value.filter((h) => {
      const beforeYear = dayjs(h.effectiveDate).year() < year
      const inScope = !employeeIds || employeeIds.includes(h.employeeId)
      return beforeYear && inScope
    })

    let totalStartSalary = 0
    let totalEndSalary = 0
    let totalAdjustment = 0
    let adjustmentCount = 0
    let highestAdjustment = 0
    let lowestAdjustment = Infinity

    const adjustmentByCategory: Record<AdjustmentReasonCategory, number> = {
      annual: 0,
      performance: 0,
      promotion: 0,
      market: 0,
      certification: 0,
      transfer: 0,
      special: 0
    }

    targetEmployees.forEach((emp) => {
      const empHistoryPrev = prevYearHistory
        .filter((h) => h.employeeId === emp.id)
        .sort((a, b) => dayjs(b.effectiveDate).valueOf() - dayjs(a.effectiveDate).valueOf())

      const empHistoryYear = yearHistory
        .filter((h) => h.employeeId === emp.id)
        .sort((a, b) => dayjs(a.effectiveDate).valueOf() - dayjs(b.effectiveDate).valueOf())

      let startSalary = empHistoryPrev.length > 0 ? empHistoryPrev[0].newSalary : emp.baseSalary

      if (empHistoryYear.length > 0 && dayjs(empHistoryYear[0].effectiveDate).year() < year) {
        startSalary = empHistoryYear[0].newSalary
      }

      const endSalary = empHistoryYear.length > 0
        ? empHistoryYear[empHistoryYear.length - 1].newSalary
        : startSalary

      totalStartSalary += startSalary
      totalEndSalary += endSalary
    })

    yearHistory.forEach((h) => {
      totalAdjustment += h.adjustmentAmount
      adjustmentCount++
      if (h.adjustmentAmount > highestAdjustment) highestAdjustment = h.adjustmentAmount
      if (h.adjustmentAmount < lowestAdjustment) lowestAdjustment = h.adjustmentAmount
      adjustmentByCategory[h.reasonCategory] = (adjustmentByCategory[h.reasonCategory] || 0) + h.adjustmentAmount
    })

    const headcount = targetEmployees.length
    const avgStart = headcount > 0 ? totalStartSalary / headcount : 0
    const averageAdjustmentRatio = avgStart > 0 ? (totalEndSalary - totalStartSalary) / totalStartSalary : 0

    return {
      year,
      startSalary: round2(totalStartSalary),
      endSalary: round2(totalEndSalary),
      totalAdjustmentAmount: round2(totalAdjustment),
      adjustmentCount,
      averageAdjustmentRatio: round2(averageAdjustmentRatio),
      highestAdjustment: round2(highestAdjustment),
      lowestAdjustment: lowestAdjustment === Infinity ? 0 : round2(lowestAdjustment),
      adjustmentByCategory,
      headcount
    }
  }

  function getYearlyBonusData(year: number, employeeIds?: string[]): YearlyBonusData {
    const yearBonuses = bonusPayments.value.filter((b) => {
      const inYear = b.year === year && b.approvalStatus === 'approved'
      const inScope = !employeeIds || employeeIds.includes(b.employeeId)
      return inYear && inScope
    })

    const totalGross = yearBonuses.reduce((sum, b) => sum + b.grossAmount, 0)
    const totalNet = yearBonuses.reduce((sum, b) => sum + b.netAmount, 0)
    const bonusCount = yearBonuses.length

    const uniqueEmployees = new Set(yearBonuses.map((b) => b.employeeId))
    const avgBonus = uniqueEmployees.size > 0 ? totalGross / uniqueEmployees.size : 0

    const bonusByType: Record<string, number> = {}
    yearBonuses.forEach((b) => {
      bonusByType[b.type] = (bonusByType[b.type] || 0) + b.grossAmount
    })

    return {
      year,
      totalBonusGross: round2(totalGross),
      totalBonusNet: round2(totalNet),
      averageBonus: round2(avgBonus),
      bonusCount,
      bonusByType
    }
  }

  function getYearlyPerformanceData(year: number, employeeIds?: string[]): YearlyPerformanceData {
    const yearReviews = performanceHistory.value.filter((p) => {
      const inYear = p.year === year
      const inScope = !employeeIds || employeeIds.includes(p.employeeId)
      return inYear && inScope
    })

    const distribution: Record<string, number> = {}
    let totalCoeff = 0

    const latestByEmployee: Record<string, PerformanceHistoryRecord> = {}
    yearReviews.forEach((p) => {
      if (!latestByEmployee[p.employeeId] || dayjs(p.reviewedAt).isAfter(latestByEmployee[p.employeeId].reviewedAt)) {
        latestByEmployee[p.employeeId] = p
      }
    })

    Object.values(latestByEmployee).forEach((p) => {
      distribution[p.levelName] = (distribution[p.levelName] || 0) + 1
      totalCoeff += p.coefficient
    })

    const count = Object.keys(latestByEmployee).length

    return {
      year,
      totalReviews: yearReviews.length,
      distribution,
      averageCoefficient: count > 0 ? round2(totalCoeff / count) : 0
    }
  }

  function buildCrossYearComparisonReport(
    years: number[],
    scope: 'company' | 'department' | 'employee' = 'company',
    scopeId?: string
  ): CrossYearComparisonReport {
    const sortedYears = [...years].sort((a, b) => a - b)
    const allEmployees = bonusStore.allEmployees

    let scopeName = '全公司'
    let targetEmployeeIds: string[] | undefined

    if (scope === 'department' && scopeId) {
      const dept = bonusStore.getDepartmentById(scopeId)
      scopeName = dept?.name || '未知部门'
      targetEmployeeIds = dept?.employees.map((e) => e.id) || []
    } else if (scope === 'employee' && scopeId) {
      const emp = bonusStore.getEmployeeById(scopeId)
      scopeName = emp?.name || '未知员工'
      targetEmployeeIds = [scopeId]
    }

    const comparisonPoints: CrossYearComparisonPoint[] = []
    const yearlySalaryData: YearlySalaryGrowthData[] = []
    const yearlyBonusData: YearlyBonusData[] = []
    const yearlyPerformanceData: YearlyPerformanceData[] = []

    sortedYears.forEach((year, index) => {
      const salaryData = getYearlySalaryGrowthData(year, targetEmployeeIds)
      const bonusData = getYearlyBonusData(year, targetEmployeeIds)
      const perfData = getYearlyPerformanceData(year, targetEmployeeIds)

      yearlySalaryData.push(salaryData)
      yearlyBonusData.push(bonusData)
      yearlyPerformanceData.push(perfData)

      const headcount = salaryData.headcount
      const avgSalary = headcount > 0 ? salaryData.endSalary / headcount : 0
      const avgBonus = headcount > 0 ? bonusData.totalBonusGross / headcount : 0
      const avgTotalComp = avgSalary * 12 + avgBonus

      let salaryGrowthRate = 0
      let bonusGrowthRate = 0
      let totalCompGrowthRate = 0

      if (index > 0) {
        const prevPoint = comparisonPoints[index - 1]
        if (prevPoint.averageSalary > 0) {
          salaryGrowthRate = (avgSalary - prevPoint.averageSalary) / prevPoint.averageSalary
        }
        if (prevPoint.averageBonus > 0) {
          bonusGrowthRate = (avgBonus - prevPoint.averageBonus) / prevPoint.averageBonus
        }
        if (prevPoint.averageTotalCompensation > 0) {
          totalCompGrowthRate = (avgTotalComp - prevPoint.averageTotalCompensation) / prevPoint.averageTotalCompensation
        }
      }

      comparisonPoints.push({
        year,
        label: `${year}年`,
        averageSalary: round2(avgSalary),
        averageBonus: round2(avgBonus),
        averageTotalCompensation: round2(avgTotalComp),
        salaryGrowthRate: round2(salaryGrowthRate),
        bonusGrowthRate: round2(bonusGrowthRate),
        totalCompGrowthRate: round2(totalCompGrowthRate),
        headcount,
        totalSalaryCost: round2(avgSalary * 12 * headcount),
        totalBonusCost: round2(bonusData.totalBonusGross),
        totalCompCost: round2(avgSalary * 12 * headcount + bonusData.totalBonusGross)
      })
    })

    const firstPoint = comparisonPoints[0]
    const lastPoint = comparisonPoints[comparisonPoints.length - 1]
    const numYears = sortedYears.length - 1

    let overallSalaryGrowth = 0
    let overallBonusGrowth = 0
    let overallCompGrowth = 0
    let cagrSalary = 0
    let cagrBonus = 0
    let cagrTotal = 0

    if (firstPoint && lastPoint && numYears > 0) {
      if (firstPoint.averageSalary > 0) {
        overallSalaryGrowth = (lastPoint.averageSalary - firstPoint.averageSalary) / firstPoint.averageSalary
        cagrSalary = Math.pow(lastPoint.averageSalary / firstPoint.averageSalary, 1 / numYears) - 1
      }
      if (firstPoint.averageBonus > 0) {
        overallBonusGrowth = (lastPoint.averageBonus - firstPoint.averageBonus) / firstPoint.averageBonus
        cagrBonus = Math.pow(lastPoint.averageBonus / firstPoint.averageBonus, 1 / numYears) - 1
      }
      if (firstPoint.averageTotalCompensation > 0) {
        overallCompGrowth = (lastPoint.averageTotalCompensation - firstPoint.averageTotalCompensation) / firstPoint.averageTotalCompensation
        cagrTotal = Math.pow(lastPoint.averageTotalCompensation / firstPoint.averageTotalCompensation, 1 / numYears) - 1
      }
    }

    const keyFindings: string[] = []
    if (overallSalaryGrowth > 0.1) {
      keyFindings.push(`薪资增长强劲，${sortedYears[0]}-${sortedYears[sortedYears.length - 1]}年累计增长 ${(overallSalaryGrowth * 100).toFixed(1)}%`)
    } else if (overallSalaryGrowth > 0) {
      keyFindings.push(`薪资平稳增长，累计增幅 ${(overallSalaryGrowth * 100).toFixed(1)}%`)
    } else {
      keyFindings.push('薪资增长趋于保守，需关注人才保留')
    }

    if (cagrSalary > 0.08) {
      keyFindings.push(`薪资复合年增长率达 ${(cagrSalary * 100).toFixed(1)}%，高于行业平均水平`)
    }

    if (overallBonusGrowth > overallSalaryGrowth) {
      keyFindings.push('奖金增幅超过薪资增幅，激励导向明显')
    }

    const deptComparison = scope === 'company'
      ? bonusStore.departments.map((dept) => {
          const deptEmpIds = dept.employees.map((e) => e.id)
          const deptPoints: CrossYearComparisonPoint[] = []

          sortedYears.forEach((year, idx) => {
            const sData = getYearlySalaryGrowthData(year, deptEmpIds)
            const bData = getYearlyBonusData(year, deptEmpIds)
            const hc = sData.headcount
            const avgSal = hc > 0 ? sData.endSalary / hc : 0
            const avgBon = hc > 0 ? bData.totalBonusGross / hc : 0
            const avgTotal = avgSal * 12 + avgBon

            let salGrowth = 0
            let bonGrowth = 0
            let totalGrowth = 0
            if (idx > 0 && deptPoints[idx - 1].averageSalary > 0) {
              salGrowth = (avgSal - deptPoints[idx - 1].averageSalary) / deptPoints[idx - 1].averageSalary
              bonGrowth = (avgBon - deptPoints[idx - 1].averageBonus) / deptPoints[idx - 1].averageBonus
              totalGrowth = (avgTotal - deptPoints[idx - 1].averageTotalCompensation) / deptPoints[idx - 1].averageTotalCompensation
            }

            deptPoints.push({
              year,
              label: `${year}年`,
              averageSalary: round2(avgSal),
              averageBonus: round2(avgBon),
              averageTotalCompensation: round2(avgTotal),
              salaryGrowthRate: round2(salGrowth),
              bonusGrowthRate: round2(bonGrowth),
              totalCompGrowthRate: round2(totalGrowth),
              headcount: hc,
              totalSalaryCost: round2(avgSal * 12 * hc),
              totalBonusCost: round2(bData.totalBonusGross),
              totalCompCost: round2(avgSal * 12 * hc + bData.totalBonusGross)
            })
          })

          return {
            departmentId: dept.id,
            departmentName: dept.name,
            points: deptPoints
          }
        })
      : undefined

    const topGrowers = scope === 'company' && sortedYears.length >= 2
      ? allEmployees
          .map((emp) => {
            const growthPoints: { year: number; salary: number; growthRate: number }[] = []
            let prevSalary = 0

            sortedYears.forEach((year, idx) => {
              const yearHistory = salaryHistory.value
                .filter((h) => h.employeeId === emp.id && dayjs(h.effectiveDate).year() === year)
                .sort((a, b) => dayjs(b.effectiveDate).valueOf() - dayjs(a.effectiveDate).valueOf())

              const prevYearHistory = salaryHistory.value
                .filter((h) => h.employeeId === emp.id && dayjs(h.effectiveDate).year() < year)
                .sort((a, b) => dayjs(b.effectiveDate).valueOf() - dayjs(a.effectiveDate).valueOf())

              let yearEndSalary = emp.baseSalary
              if (yearHistory.length > 0) {
                yearEndSalary = yearHistory[0].newSalary
              } else if (prevYearHistory.length > 0) {
                yearEndSalary = prevYearHistory[0].newSalary
              }

              let growthRate = 0
              if (idx > 0 && prevSalary > 0) {
                growthRate = (yearEndSalary - prevSalary) / prevSalary
              }

              growthPoints.push({ year, salary: yearEndSalary, growthRate: round2(growthRate) })
              prevSalary = yearEndSalary
            })

            const firstSal = growthPoints[0]?.salary || 0
            const lastSal = growthPoints[growthPoints.length - 1]?.salary || 0
            const totalGrowth = lastSal - firstSal
            const totalGrowthRate = firstSal > 0 ? totalGrowth / firstSal : 0

            return {
              employeeId: emp.id,
              employeeName: emp.name,
              departmentName: bonusStore.getDepartmentById(emp.departmentId)?.name || '',
              totalGrowthAmount: round2(totalGrowth),
              totalGrowthRate: round2(totalGrowthRate),
              growthPoints
            }
          })
          .sort((a, b) => b.totalGrowthRate - a.totalGrowthRate)
          .slice(0, 10)
      : undefined

    return {
      generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      scope,
      scopeId,
      scopeName,
      years: sortedYears,
      comparisonPoints,
      yearlySalaryData,
      yearlyBonusData,
      yearlyPerformanceData,
      insights: {
        overallSalaryGrowth: round2(overallSalaryGrowth),
        overallBonusGrowth: round2(overallBonusGrowth),
        overallCompGrowth: round2(overallCompGrowth),
        cagrSalary: round2(cagrSalary),
        cagrBonus: round2(cagrBonus),
        cagrTotal: round2(cagrTotal),
        keyFindings
      },
      departmentComparison: deptComparison,
      topGrowers
    }
  }

  function exportCrossYearReportHtml(report: CrossYearComparisonReport): string {
    const { years, comparisonPoints, insights, yearlySalaryData, scopeName, topGrowers, departmentComparison } = report

    const trendRows = comparisonPoints.map((p, i) => `
      <tr>
        <td style="font-weight:600">${p.label}</td>
        <td style="text-align:right">${formatMoney(p.averageSalary)}</td>
        <td style="text-align:right;color:${p.salaryGrowthRate >= 0 ? '#52c41a' : '#f5222d'}">${i === 0 ? '-' : (p.salaryGrowthRate >= 0 ? '+' : '') + (p.salaryGrowthRate * 100).toFixed(2)}%</td>
        <td style="text-align:right">${formatMoney(p.averageBonus)}</td>
        <td style="text-align:right;color:${p.bonusGrowthRate >= 0 ? '#52c41a' : '#f5222d'}">${i === 0 ? '-' : (p.bonusGrowthRate >= 0 ? '+' : '') + (p.bonusGrowthRate * 100).toFixed(2)}%</td>
        <td style="text-align:right;font-weight:600">${formatMoney(p.averageTotalCompensation)}</td>
        <td style="text-align:right;color:${p.totalCompGrowthRate >= 0 ? '#52c41a' : '#f5222d'}">${i === 0 ? '-' : (p.totalCompGrowthRate >= 0 ? '+' : '') + (p.totalCompGrowthRate * 100).toFixed(2)}%</td>
        <td style="text-align:center">${p.headcount}</td>
      </tr>
    `).join('')

    const salaryByYearRows = yearlySalaryData.map((d) => {
      const categoryTotal = Object.values(d.adjustmentByCategory).reduce((s, v) => s + v, 0)
      const categoryRows = Object.entries(d.adjustmentByCategory)
        .filter(([, v]) => v > 0)
        .map(([cat, amount]) => {
          const pct = categoryTotal > 0 ? ((amount / categoryTotal) * 100).toFixed(1) : '0'
          return `<tr><td>${CATEGORY_LABELS[cat as AdjustmentReasonCategory] || cat}</td><td style="text-align:right">${formatMoney(amount)}</td><td style="text-align:right">${pct}%</td></tr>`
        }).join('')
      const rowCount = Math.max(1, Object.values(d.adjustmentByCategory).filter(v => v > 0).length)
      return `
        <tr>
          <td style="font-weight:600;vertical-align:top" rowspan="${rowCount}">${d.year}年</td>
          ${categoryRows || '<td colspan="2" style="text-align:center;color:#bfbfbf">暂无调薪记录</td>'}
        </tr>
      `
    }).join('')

    const topGrowerRows = topGrowers?.map((e, i) => `
      <tr>
        <td style="text-align:center">${i + 1}</td>
        <td>${e.employeeName}</td>
        <td>${e.departmentName}</td>
        <td style="text-align:right">${formatMoney(e.growthPoints[0]?.salary || 0)}</td>
        <td style="text-align:right">${formatMoney(e.growthPoints[e.growthPoints.length - 1]?.salary || 0)}</td>
        <td style="text-align:right;color:#52c41a;font-weight:600">+${formatMoney(e.totalGrowthAmount)}</td>
        <td style="text-align:right;color:#52c41a;font-weight:600">+${(e.totalGrowthRate * 100).toFixed(2)}%</td>
      </tr>
    `).join('') || ''

    const deptCompRows = departmentComparison?.map((d) => {
      const firstP = d.points[0]
      const lastP = d.points[d.points.length - 1]
      const growth = firstP && lastP && firstP.averageSalary > 0
        ? ((lastP.averageSalary - firstP.averageSalary) / firstP.averageSalary * 100).toFixed(2)
        : '0'
      return `
        <tr>
          <td style="font-weight:600">${d.departmentName}</td>
          <td style="text-align:right">${formatMoney(firstP?.averageSalary || 0)}</td>
          <td style="text-align:right">${formatMoney(lastP?.averageSalary || 0)}</td>
          <td style="text-align:right;color:${Number(growth) >= 0 ? '#52c41a' : '#f5222d'};font-weight:600">${Number(growth) >= 0 ? '+' : ''}${growth}%</td>
          <td style="text-align:right">${formatMoney(lastP?.totalCompCost || 0)}</td>
          <td style="text-align:center">${lastP?.headcount || 0}</td>
        </tr>
      `
    }).join('') || ''

    const findingItems = insights.keyFindings.map((f) => `<li>${f}</li>`).join('')

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>跨年度薪资增长趋势对比报告_${scopeName}_${dayjs().format('YYYYMMDD')}</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; color: #262626; line-height: 1.6; font-size: 12px; }
  .header { text-align: center; padding: 16px 0 12px; border-bottom: 3px solid #2080f0; margin-bottom: 16px; }
  .header h1 { font-size: 22px; color: #2080f0; margin-bottom: 4px; }
  .header p { color: #8c8c8c; font-size: 12px; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
  .summary-card { text-align: center; padding: 12px; border-radius: 8px; background: #f6f8fa; }
  .summary-card .label { font-size: 11px; color: #8c8c8c; margin-bottom: 4px; }
  .summary-card .value { font-size: 18px; font-weight: 700; color: #262626; }
  .sc-growth { background: #e6f7ff; }
  .sc-cagr { background: #f9f0ff; }
  .sc-total { background: #fff7e6; }
  h2 { font-size: 15px; color: #262626; margin: 16px 0 10px; padding-left: 8px; border-left: 3px solid #2080f0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px; }
  th, td { border: 1px solid #e8e8e8; padding: 6px 10px; text-align: left; }
  th { background: #fafafa; font-weight: 600; color: #595959; white-space: nowrap; }
  tr:nth-child(even) td { background: #fafafa; }
  .findings { background: #f6ffed; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
  .findings h3 { color: #389e0d; font-size: 13px; margin-bottom: 8px; }
  .findings ul { padding-left: 20px; }
  .findings li { margin-bottom: 4px; }
  .footer { text-align: center; color: #bfbfbf; font-size: 10px; margin-top: 24px; padding-top: 10px; border-top: 1px solid #e8e8e8; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>

<div class="header">
  <h1>跨年度薪资增长趋势对比报告</h1>
  <p>统计范围：${scopeName} · 对比年度：${years.join(' / ')} · 生成时间：${report.generatedAt}</p>
</div>

<div class="summary-grid">
  <div class="summary-card sc-growth">
    <div class="label">累计薪资增长率</div>
    <div class="value" style="color:#52c41a">${insights.overallSalaryGrowth >= 0 ? '+' : ''}${(insights.overallSalaryGrowth * 100).toFixed(2)}%</div>
  </div>
  <div class="summary-card sc-cagr">
    <div class="label">薪资复合年增长率</div>
    <div class="value" style="color:#722ed1">${(insights.cagrSalary * 100).toFixed(2)}%</div>
  </div>
  <div class="summary-card sc-total">
    <div class="label">累计奖金增长率</div>
    <div class="value" style="color:#fa8c16">${insights.overallBonusGrowth >= 0 ? '+' : ''}${(insights.overallBonusGrowth * 100).toFixed(2)}%</div>
  </div>
  <div class="summary-card">
    <div class="label">累计薪酬总包增长</div>
    <div class="value" style="color:#1890ff">${insights.overallCompGrowth >= 0 ? '+' : ''}${(insights.overallCompGrowth * 100).toFixed(2)}%</div>
  </div>
</div>

<div class="findings">
  <h3>📊 核心发现</h3>
  <ul>${findingItems || '<li>暂无数据</li>'}</ul>
</div>

<h2>一、年度薪酬趋势对比</h2>
<table>
  <thead>
    <tr>
      <th>年度</th>
      <th style="text-align:right">平均月薪</th>
      <th style="text-align:right">薪资同比</th>
      <th style="text-align:right">平均奖金</th>
      <th style="text-align:right">奖金同比</th>
      <th style="text-align:right">年度人均总包</th>
      <th style="text-align:right">总包同比</th>
      <th style="text-align:center">员工人数</th>
    </tr>
  </thead>
  <tbody>${trendRows}</tbody>
</table>

${departmentComparison && departmentComparison.length > 0 ? `
<h2>二、部门薪资增长对比</h2>
<table>
  <thead>
    <tr>
      <th>部门</th>
      <th style="text-align:right">${years[0]}年平均月薪</th>
      <th style="text-align:right">${years[years.length - 1]}年平均月薪</th>
      <th style="text-align:right">累计涨幅</th>
      <th style="text-align:right">最新年度薪酬成本</th>
      <th style="text-align:center">当前人数</th>
    </tr>
  </thead>
  <tbody>${deptCompRows}</tbody>
</table>
` : ''}

<h2>三、各年度调薪事由分布</h2>
<table>
  <thead>
    <tr>
      <th>年度</th>
      <th>调薪事由</th>
      <th style="text-align:right">调薪金额</th>
      <th style="text-align:right">占比</th>
    </tr>
  </thead>
  <tbody>${salaryByYearRows}</tbody>
</table>

${topGrowers && topGrowers.length > 0 ? `
<h2>四、薪资增长 TOP10 员工</h2>
<table>
  <thead>
    <tr>
      <th style="text-align:center">排名</th>
      <th>姓名</th>
      <th>部门</th>
      <th style="text-align:right">起始薪资</th>
      <th style="text-align:right">最新薪资</th>
      <th style="text-align:right">增长金额</th>
      <th style="text-align:right">增长率</th>
    </tr>
  </thead>
  <tbody>${topGrowerRows}</tbody>
</table>
` : ''}

<div class="footer">
  本文档由「年终奖模拟器」系统自动生成 · ${report.generatedAt}
</div>

</body>
</html>`
  }

  function analyzePromotionCandidates(
    year: number,
    employeeIds?: string[]
  ): PromotionCandidateAnalysis[] {
    syncAppliedCalibrationsToPerformanceHistory()

    const employees = employeeIds
      ? bonusStore.allEmployees.filter((e) => employeeIds.includes(e.id))
      : bonusStore.allEmployees

    const levelOrder = ['S', 'A+', 'A', 'B+', 'B', 'C']
    const highPerfLevels = new Set(['S', 'A+', 'A'])

    return employees
      .map((emp) => {
        const dept = bonusStore.getDepartmentById(emp.departmentId)
        const deptName = dept?.name || ''

        const perfHistory = getEmployeePerformanceHistory(emp.id)
        const perfTrend = getEmployeePerformanceTrend(emp.id, year)

        const yearPerfs = perfHistory.filter((p) => p.year <= year)
        if (yearPerfs.length === 0) return null

        let consecutiveHighYears = 0
        const sortedYears = [...new Set(yearPerfs.map((p) => p.year))].sort((a, b) => b - a)
        for (const y of sortedYears) {
          const yearRecords = yearPerfs.filter((p) => p.year === y)
          const bestLevel = yearRecords.sort(
            (a, b) => levelOrder.indexOf(a.levelName) - levelOrder.indexOf(b.levelName)
          )[0]
          if (bestLevel && highPerfLevels.has(bestLevel.levelName)) {
            consecutiveHighYears++
          } else {
            break
          }
        }

        let trendDirection: 'rising' | 'stable' | 'declining' = 'stable'
        if (perfTrend.length >= 2) {
          const firstCoeff = perfTrend[0].coefficient
          const lastCoeff = perfTrend[perfTrend.length - 1].coefficient
          if (lastCoeff > firstCoeff * 1.05) trendDirection = 'rising'
          else if (lastCoeff < firstCoeff * 0.95) trendDirection = 'declining'
        } else if (sortedYears.length >= 2) {
          const recentYearPerf = yearPerfs.filter((p) => p.year === sortedYears[0])
          const prevYearPerf = yearPerfs.filter((p) => p.year === sortedYears[1])
          if (recentYearPerf.length > 0 && prevYearPerf.length > 0) {
            const recentBest = recentYearPerf.sort(
              (a, b) => levelOrder.indexOf(a.levelName) - levelOrder.indexOf(b.levelName)
            )[0]
            const prevBest = prevYearPerf.sort(
              (a, b) => levelOrder.indexOf(a.levelName) - levelOrder.indexOf(b.levelName)
            )[0]
            const recentIdx = levelOrder.indexOf(recentBest.levelName)
            const prevIdx = levelOrder.indexOf(prevBest.levelName)
            if (recentIdx < prevIdx) trendDirection = 'rising'
            else if (recentIdx > prevIdx) trendDirection = 'declining'
          }
        }

        const promotionHistory = salaryHistory.value
          .filter((h) => h.employeeId === emp.id && h.reasonCategory === 'promotion')
          .sort((a, b) => dayjs(b.effectiveDate).valueOf() - dayjs(a.effectiveDate).valueOf())
        const lastPromotionYear =
          promotionHistory.length > 0 ? dayjs(promotionHistory[0].effectiveDate).year() : null
        const yearsSinceLastPromotion = lastPromotionYear ? year - lastPromotionYear : null

        const salaryTrend = getEmployeeSalaryTrend(emp.id, year)
        const startSalary = salaryTrend.length > 0 ? salaryTrend[0].baseSalary : emp.baseSalary
        const endSalary = salaryTrend.length > 0 ? salaryTrend[salaryTrend.length - 1].baseSalary : emp.baseSalary
        const salaryGrowthRate = startSalary > 0 ? (endSalary - startSalary) / startSalary : 0

        const competitiveness = calculateSalaryCompetitiveness(emp.id, year)
        const marketPercentile = competitiveness ? competitiveness.baseSalaryPercentile : null
        const retentionRisk = competitiveness?.riskLevel || 'low'

        let score = 0
        const reasons: string[] = []

        if (consecutiveHighYears >= 2) {
          score += 40
          reasons.push(`连续 ${consecutiveHighYears} 年高绩效（S/A+/A）`)
        } else if (consecutiveHighYears === 1) {
          score += 20
          reasons.push('近1年绩效达到高绩效水平')
        }

        if (trendDirection === 'rising') {
          score += 25
          reasons.push('绩效走势持续上升')
        } else if (trendDirection === 'stable') {
          score += 10
        }

        if (yearsSinceLastPromotion !== null && yearsSinceLastPromotion >= 3) {
          score += 20
          reasons.push(`距上次晋升已 ${yearsSinceLastPromotion} 年`)
        } else if (yearsSinceLastPromotion === null) {
          score += 15
          reasons.push('无晋升调薪记录，可能从未晋升')
        }

        if (salaryGrowthRate < 0.05) {
          score += 10
          reasons.push(`薪资增长率仅 ${(salaryGrowthRate * 100).toFixed(1)}%，低于常规水平`)
        }

        if (marketPercentile !== null && marketPercentile < 40) {
          score += 5
          reasons.push(`市场分位仅 P${marketPercentile}，存在竞争力不足风险`)
        }

        if (retentionRisk === 'high') {
          score += 5
          reasons.push('流失风险较高，需关注人才保留')
        }

        let level: PromotionCandidateLevel
        let levelLabel: string
        if (score >= 60 && consecutiveHighYears >= 2 && trendDirection === 'rising') {
          level = 'strong'
          levelLabel = '强烈推荐'
        } else if (score >= 45 && consecutiveHighYears >= 1) {
          level = 'recommended'
          levelLabel = '推荐晋升'
        } else if (score >= 25) {
          level = 'potential'
          levelLabel = '关注培养'
        } else {
          return null
        }

        return {
          employeeId: emp.id,
          employeeName: emp.name,
          departmentName: deptName,
          position: emp.position,
          baseSalary: emp.baseSalary,
          level,
          levelLabel,
          performanceTrend: perfTrend,
          consecutiveHighPerfYears: consecutiveHighYears,
          performanceTrendDirection: trendDirection,
          lastPromotionYear,
          yearsSinceLastPromotion,
          salaryGrowthRate: round2(salaryGrowthRate),
          marketPercentile,
          retentionRisk,
          score,
          reasons
        }
      })
      .filter((c): c is PromotionCandidateAnalysis => c !== null)
      .sort((a, b) => b.score - a.score)
  }

  function generateNextYearSalaryRecommendations(
    year: number,
    employeeIds?: string[]
  ): NextYearSalaryRecommendation[] {
    const employees = employeeIds
      ? bonusStore.allEmployees.filter((e) => employeeIds.includes(e.id))
      : bonusStore.allEmployees

    const candidates = analyzePromotionCandidates(year, employeeIds)
    const candidateMap = new Map(candidates.map((c) => [c.employeeId, c]))

    return employees
      .map((emp) => {
        const dept = bonusStore.getDepartmentById(emp.departmentId)
        const deptName = dept?.name || ''

        const candidate = candidateMap.get(emp.id)
        const competitiveness = calculateSalaryCompetitiveness(emp.id, year)

        const perfHistory = getEmployeePerformanceHistory(emp.id)
        const perfTrend = getEmployeePerformanceTrend(emp.id, year)

        let perfTrendDirection: 'rising' | 'stable' | 'declining' = 'stable'
        if (perfTrend.length >= 2) {
          const firstCoeff = perfTrend[0].coefficient
          const lastCoeff = perfTrend[perfTrend.length - 1].coefficient
          if (lastCoeff > firstCoeff * 1.05) perfTrendDirection = 'rising'
          else if (lastCoeff < firstCoeff * 0.95) perfTrendDirection = 'declining'
        }

        const latestPerf = perfHistory.length > 0 ? perfHistory[0] : null
        const latestPerfLevel = latestPerf?.levelName || 'B'

        const salaryTrend = getEmployeeSalaryTrend(emp.id, year)
        const startSalary = salaryTrend.length > 0 ? salaryTrend[0].baseSalary : emp.baseSalary
        const endSalary = salaryTrend.length > 0 ? salaryTrend[salaryTrend.length - 1].baseSalary : emp.baseSalary
        const salaryGrowthRate = startSalary > 0 ? (endSalary - startSalary) / startSalary : 0

        const marketPercentile = competitiveness?.baseSalaryPercentile ?? null
        const retentionRisk = competitiveness?.riskLevel || 'low'

        let category: SalaryRecommendationCategory
        let categoryLabel: string
        let suggestedMinRatio: number
        let suggestedMaxRatio: number
        let priority: 'urgent' | 'high' | 'medium' | 'low'
        let priorityLabel: string
        const reasons: string[] = []

        const isHighPerf = ['S', 'A+', 'A'].includes(latestPerfLevel)

        if (candidate && candidate.level === 'strong') {
          category = 'promotion'
          categoryLabel = '晋升调薪'
          suggestedMinRatio = 0.15
          suggestedMaxRatio = 0.30
          priority = 'urgent'
          priorityLabel = '紧急'
          reasons.push(`强烈推荐晋升候选，综合评分 ${candidate.score} 分`)
          reasons.push(...candidate.reasons)
        } else if (candidate && candidate.level === 'recommended') {
          category = 'promotion'
          categoryLabel = '晋升调薪'
          suggestedMinRatio = 0.10
          suggestedMaxRatio = 0.25
          priority = 'high'
          priorityLabel = '高优先'
          reasons.push(`推荐晋升候选，综合评分 ${candidate.score} 分`)
          reasons.push(...candidate.reasons)
        } else if (isHighPerf && perfTrendDirection === 'rising') {
          category = 'performance_tilt'
          categoryLabel = '绩效倾斜调薪'
          suggestedMinRatio = 0.08
          suggestedMaxRatio = 0.20
          priority = 'high'
          priorityLabel = '高优先'
          reasons.push(`绩效等级 ${latestPerfLevel}，走势上升，建议绩效调薪倾斜`)
          if (salaryGrowthRate < 0.08) {
            reasons.push(`当年薪资增长率仅 ${(salaryGrowthRate * 100).toFixed(1)}%，低于绩效表现`)
          }
        } else if (competitiveness && competitiveness.competitivenessLevel === 'far_below') {
          category = 'market_catchup'
          categoryLabel = '市场对标补差'
          suggestedMinRatio = 0.10
          suggestedMaxRatio = 0.25
          priority = retentionRisk === 'high' ? 'urgent' : 'high'
          priorityLabel = retentionRisk === 'high' ? '紧急' : '高优先'
          reasons.push(`薪资远低于市场（P${competitiveness.baseSalaryPercentile}），建议补差至市场水平`)
          if (isHighPerf) {
            reasons.push('高绩效员工薪资低于市场，流失风险极大')
          }
        } else if (competitiveness && competitiveness.competitivenessLevel === 'below' && retentionRisk === 'high') {
          category = 'retention'
          categoryLabel = '保留性调薪'
          suggestedMinRatio = 0.08
          suggestedMaxRatio = 0.20
          priority = 'urgent'
          priorityLabel = '紧急'
          reasons.push('流失风险高，建议紧急调薪保留')
          if (isHighPerf) {
            reasons.push('高绩效+薪资偏低，需优先保障保留')
          }
        } else if (competitiveness && competitiveness.competitivenessLevel === 'below') {
          category = 'market_catchup'
          categoryLabel = '市场对标补差'
          suggestedMinRatio = 0.05
          suggestedMaxRatio = 0.15
          priority = 'medium'
          priorityLabel = '中优先'
          reasons.push(`薪资低于市场水平（P${competitiveness.baseSalaryPercentile}），建议逐步补差`)
        } else if (isHighPerf && salaryGrowthRate < 0.05) {
          category = 'performance_tilt'
          categoryLabel = '绩效倾斜调薪'
          suggestedMinRatio = 0.06
          suggestedMaxRatio = 0.15
          priority = 'medium'
          priorityLabel = '中优先'
          reasons.push(`绩效 ${latestPerfLevel} 但薪资增长不足，建议倾斜调薪`)
        } else if (candidate && candidate.level === 'potential') {
          category = 'performance_tilt'
          categoryLabel = '绩效倾斜调薪'
          suggestedMinRatio = 0.05
          suggestedMaxRatio = 0.12
          priority = 'medium'
          priorityLabel = '中优先'
          reasons.push('有晋升潜力，建议持续绩效倾斜激励')
        } else if (retentionRisk === 'medium') {
          category = 'retention'
          categoryLabel = '保留性调薪'
          suggestedMinRatio = 0.04
          suggestedMaxRatio = 0.10
          priority = 'medium'
          priorityLabel = '中优先'
          reasons.push('存在一定流失风险，建议关注保留')
        } else {
          category = 'annual_regular'
          categoryLabel = '常规年度调薪'
          suggestedMinRatio = 0.03
          suggestedMaxRatio = 0.08
          priority = 'low'
          priorityLabel = '常规'
          reasons.push('按常规年度调薪节奏执行')
          if (perfTrendDirection === 'rising') {
            suggestedMinRatio = 0.04
            suggestedMaxRatio = 0.10
            reasons.push('绩效上升趋势明显，建议适当上浮')
          }
        }

        if (competitiveness && competitiveness.gapAnalysis.currentGapAmount > 0) {
          const gapRatio = competitiveness.gapAnalysis.currentGapPercent
          if (gapRatio > 0.15 && category !== 'promotion') {
            suggestedMaxRatio = Math.max(suggestedMaxRatio, Math.min(gapRatio * 1.2, 0.30))
          }
        }

        const suggestedRatio = round2((suggestedMinRatio + suggestedMaxRatio) / 2)
        const suggestedAmount = round2(emp.baseSalary * suggestedRatio)

        return {
          employeeId: emp.id,
          employeeName: emp.name,
          departmentName: deptName,
          position: emp.position,
          currentSalary: emp.baseSalary,
          category,
          categoryLabel,
          suggestedMinRatio: round2(suggestedMinRatio),
          suggestedMaxRatio: round2(suggestedMaxRatio),
          suggestedAmount,
          priority,
          priorityLabel,
          promotionCandidateLevel: candidate?.level || null,
          performanceTrendDirection: perfTrendDirection,
          marketPercentile,
          retentionRisk,
          reasons
        }
      })
      .sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
  }

  function buildPromotionAndAdjustmentReport(
    year: number,
    scope: 'company' | 'department' = 'company',
    scopeId?: string
  ): PromotionAndAdjustmentReport {
    let employeeIds: string[] | undefined
    let scopeName = '全公司'

    if (scope === 'department' && scopeId) {
      const dept = bonusStore.getDepartmentById(scopeId)
      scopeName = dept?.name || '未知部门'
      employeeIds = dept?.employees.map((e) => e.id) || []
    }

    const candidates = analyzePromotionCandidates(year, employeeIds)
    const recommendations = generateNextYearSalaryRecommendations(year, employeeIds)

    const strongCandidates = candidates.filter((c) => c.level === 'strong').length
    const recommendedCandidates = candidates.filter((c) => c.level === 'recommended').length
    const potentialCandidates = candidates.filter((c) => c.level === 'potential').length

    const urgentRecommendations = recommendations.filter((r) => r.priority === 'urgent').length
    const highPriorityRecommendations = recommendations.filter((r) => r.priority === 'high').length
    const totalSuggestedAmount = round2(recommendations.reduce((sum, r) => sum + r.suggestedAmount, 0))

    const categoryBreakdown: Record<SalaryRecommendationCategory, number> = {
      promotion: 0,
      performance_tilt: 0,
      market_catchup: 0,
      retention: 0,
      annual_regular: 0
    }
    recommendations.forEach((r) => {
      categoryBreakdown[r.category]++
    })

    return {
      year,
      nextYear: year + 1,
      generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      scope,
      scopeId,
      scopeName,
      totalEmployees: employeeIds ? employeeIds.length : bonusStore.allEmployees.length,
      promotionCandidates: candidates,
      salaryRecommendations: recommendations,
      summary: {
        strongCandidates,
        recommendedCandidates,
        potentialCandidates,
        urgentRecommendations,
        highPriorityRecommendations,
        totalSuggestedAmount,
        categoryBreakdown
      }
    }
  }

  function addPerformanceRecordsFromCalibration(
    calibrationYear: number,
    calibrationHalf: 'first' | 'second' | 'annual',
    employees: Array<{
      employeeId: string
      employeeName: string
      departmentName: string
      calibratedLevelId: string | null
      calibratedLevelName: string | null
      calibratedCoefficient: number | null
      currentLevelId: string
      currentLevelName: string
      currentCoefficient: number
    }>,
    reviewerName: string = '绩效校准委员会'
  ): number {
    let addedCount = 0
    const reviewedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')

    for (const emp of employees) {
      const levelId = emp.calibratedLevelId || emp.currentLevelId
      const levelName = emp.calibratedLevelName || emp.currentLevelName
      const coefficient = emp.calibratedCoefficient ?? emp.currentCoefficient

      const exists = performanceHistory.value.some(
        (h) =>
          h.employeeId === emp.employeeId &&
          h.year === calibrationYear &&
          h.half === calibrationHalf
      )
      if (exists) continue

      performanceHistory.value.push({
        id: generateId(),
        employeeId: emp.employeeId,
        employeeName: emp.employeeName,
        year: calibrationYear,
        half: calibrationHalf,
        levelId,
        levelName,
        coefficient,
        reviewerName,
        reviewedAt,
        comment: emp.calibratedLevelId && emp.calibratedLevelId !== emp.currentLevelId
          ? `绩效校准：由 ${emp.currentLevelName} 调整为 ${levelName}`
          : '绩效校准确认'
      })
      addedCount++
    }
    return addedCount
  }

  function syncAppliedCalibrationsToPerformanceHistory(): number {
    const calibrations = (bonusStore as any).calibrationResults as Array<{
      id: string
      year: number
      half: 'first' | 'second' | 'annual'
      status: string
      appliedAt: string | null
      employees: Array<{
        employeeId: string
        employeeName: string
        departmentName: string
        currentLevelId: string
        currentLevelName: string
        currentCoefficient: number
        calibratedLevelId: string | null
        calibratedLevelName: string | null
        calibratedCoefficient: number | null
      }>
    }> | undefined

    if (!calibrations || calibrations.length === 0) return 0

    let totalAdded = 0
    const appliedCals = calibrations.filter((c) => c.status === 'applied')

    for (const cal of appliedCals) {
      const employeesForHistory = cal.employees.map((emp) => ({
        employeeId: emp.employeeId,
        employeeName: emp.employeeName,
        departmentName: emp.departmentName,
        calibratedLevelId: emp.calibratedLevelId,
        calibratedLevelName: emp.calibratedLevelName,
        calibratedCoefficient: emp.calibratedCoefficient,
        currentLevelId: emp.currentLevelId,
        currentLevelName: emp.currentLevelName,
        currentCoefficient: emp.currentCoefficient
      }))
      const added = addPerformanceRecordsFromCalibration(
        cal.year,
        cal.half,
        employeesForHistory
      )
      totalAdded += added
    }
    return totalAdded
  }

  return {
    reasons,
    approvalWorkflow,
    annualBudget,
    requests,
    salaryHistory,
    performanceHistory,
    bonusPayments,
    selectedRequestId,
    sortedWorkflow,
    enabledReasons,
    pendingRequests,
    draftRequests,
    approvedRequests,
    rejectedRequests,
    budgetOverview,
    marketBenchmarkData,
    CATEGORY_LABELS,
    STATUS_LABELS,
    NODE_TYPE_LABELS,
    EVENT_TYPE_LABELS,
    EVENT_TYPE_COLORS,
    BONUS_TYPE_LABELS,
    getCategoryLabel,
    getStatusLabel,
    getNodeTypeLabel,
    getStatusColor,
    getNodeStatusColor,
    getNodeStatusLabel,
    getEventTypeLabel,
    getEventTypeColor,
    getBonusTypeLabel,
    getMarketBenchmarkByPosition,
    calculatePercentile,
    getCompetitivenessLevel,
    getCompetitivenessLevelLabel,
    getCompetitivenessLevelColor,
    calculateSalaryCompetitiveness,
    addReason,
    updateReason,
    removeReason,
    addApprovalNode,
    updateApprovalNode,
    removeApprovalNode,
    moveApprovalNode,
    addDelegation,
    updateDelegation,
    deleteDelegation,
    getActiveDelegation,
    getValidDelegationForApprover,
    calculateApplicableNodes,
    checkBudgetAvailability,
    createDraftRequest,
    updateRequest,
    submitRequest,
    approveCurrentNode,
    rejectCurrentNode,
    delegateRejectCurrentNode,
    returnToApplicant,
    rollbackToOriginalNode,
    withdrawRequest,
    deleteRequest,
    getEmployeeHistory,
    getEmployeePerformanceHistory,
    getEmployeeBonusPayments,
    getEmployeeApprovalRequests,
    buildEmployeeArchive,
    getPerformanceLevelColor,
    updateAnnualBudget,
    updateDepartmentBudget,
    syncDepartmentsToBudget,
    exportModuleData,
    importModuleData,
    getAvailableYears,
    getEmployeeSalaryTrend,
    getEmployeeBonusTrend,
    getEmployeePerformanceTrend,
    buildEmployeeAnnualReview,
    buildDepartmentAnnualReview,
    buildAnnualReviewReport,
    exportReviewReportHtml,
    syncCompensationArchiveOnApproval,
    getYearlySalaryGrowthData,
    getYearlyBonusData,
    getYearlyPerformanceData,
    buildCrossYearComparisonReport,
    exportCrossYearReportHtml,
    analyzePromotionCandidates,
    generateNextYearSalaryRecommendations,
    buildPromotionAndAdjustmentReport,
    addPerformanceRecordsFromCalibration,
    syncAppliedCalibrationsToPerformanceHistory
  }
})
