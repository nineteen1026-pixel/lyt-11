# 年终奖发放方案模拟器

基于 Vue3 + TypeScript + Pinia + Naive UI 的年终奖发放方案单页应用模拟器。

## ✨ 功能特性

- **绩效系数配置**：支持绩效等级、系数的可视化编辑和动态配置
- **奖金池管理**：设置总奖金、部门/人员分配比例、基础倍数、绩效/工龄权重
- **个人测算结果**：完整展示基础金额、绩效加成、工龄加成、部门分配、税前/税后金额
- **计税方式对比**：支持「一次性单独计税」和「并入综合所得」并行计算与对比
- **全员测算表**：搜索、筛选、排序，完整查看所有员工数据与最优方案
- **数据导入导出**：方案保存为 JSON 文件，便于分享与复用

## 🛠️ 技术栈

| 类别 | 技术 |
| --- | --- |
| 框架 | Vue 3 (Composition API) |
| 语言 | TypeScript 5 |
| 状态管理 | Pinia |
| UI 组件库 | Naive UI |
| 构建工具 | Vite 5 |
| 代码规范 | ESLint + Prettier |

## 🚀 快速开始

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 启动本地开发

```bash
npm run dev
# 或
yarn dev
```

启动后浏览器自动打开 `http://localhost:5173`。

### 生产构建

```bash
npm run build
# 或
yarn build
```

### 代码检查与格式化

```bash
npm run lint      # 代码检查
npm run format    # 代码格式化
```

## 📁 项目结构

```
├── src/
│   ├── components/          # 业务组件
│   │   ├── OverviewDashboard.vue        # 总览面板
│   │   ├── PerformanceCoefficientTable.vue  # 绩效系数表
│   │   ├── BonusPoolConfig.vue          # 奖金池配置
│   │   ├── EmployeeDetail.vue           # 员工详情编辑
│   │   ├── PersonalCalculation.vue      # 个人测算结果
│   │   ├── TaxComparisonPanel.vue       # 计税方式对比面板
│   │   └── AllResultsTable.vue          # 全员测算表
│   ├── stores/              # Pinia 状态管理
│   │   └── bonus.ts
│   ├── types/               # TypeScript 类型定义
│   │   └── index.ts
│   ├── utils/               # 工具函数（计税逻辑等）
│   │   └── tax.ts
│   ├── styles/              # 全局样式
│   │   └── main.css
│   ├── App.vue              # 根组件
│   ├── main.ts              # 入口文件
│   └── env.d.ts             # 环境类型声明
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .eslintrc.cjs
└── .prettierrc.json
```

## 📚 计税说明

- **一次性单独计税**：奖金 ÷ 12 → 查月度税率表 → 奖金 × 税率 − 速算扣除数
- **并入综合所得**：年终奖并入年度综合收入，按差额计算增量税款
- 政策依据：财政部 税务总局公告 2023 年第 30 号（优惠政策延至 2027 年底）
