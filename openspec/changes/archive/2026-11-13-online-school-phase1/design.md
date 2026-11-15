# Design

## Context

这是一个全新的在线网校项目，需要从零搭建完整的技术架构。项目采用前后端分离架构，包含微信小程序（学员端）、PC 管理后台（管理员端）和后端 API 三个主要部分。

关键技术约束：
- 微信小程序必须使用原生开发（WXML/WXSS/JS + TypeScript）
- 后端使用 Node.js + NestJS
- 数据库使用 MySQL
- 采用 Monorepo 结构（pnpm workspace）
- 认证使用 JWT 双 Token 方案
- 邮箱验证使用阿里云邮件推送

## Goals / Non-Goals

**Goals:**
- 搭建可扩展的 Monorepo 项目结构，支持多端开发
- 实现完整的用户认证系统，支持多种登录方式
- 实现管理后台的学员管理功能
- 确保代码质量和开发规范
- 提供清晰的 API 接口文档
- 配置完善的开发环境

**Non-Goals:**
- 不实现课程管理功能（后续阶段）
- 不实现学习记录功能（后续阶段）
- 不实现支付功能（后续阶段）
- 不实现复杂的多角色权限系统（仅单角色 admin）
- 不实现 CI/CD 自动化部署（第一阶段手动部署）

## Decisions

### 1. Monorepo 工具选择：pnpm workspace
**选择**: pnpm workspace
**理由**: 
- 轻量级，配置简单
- 依赖链接高效，磁盘占用小
- 与 NestJS 和 Vue 生态兼容良好
**替代方案**: 
- Nx：功能更强大但对第一阶段过于复杂
- Turborepo：专注构建优化，但 pnpm workspace 已足够

### 2. 小程序技术栈：原生 + TypeScript
**选择**: 原生微信小程序 + TypeScript
**理由**:
- 性能最优，无框架运行时开销
- TypeScript 提供类型安全，与后端统一语言
- 可以充分利用微信原生能力
**替代方案**:
- Taro/uni-app：可跨端但增加复杂度和性能损耗

### 3. 数据库设计：完全独立三表方案
**选择**: users、students、admins 三个独立表
**理由**:
- 学员和管理员是完全不同的业务实体
- 独立表结构更清晰，便于维护
- 避免单表字段过多，影响查询性能
**替代方案**:
- 单表 + 角色字段：灵活但字段冗余，权限控制复杂

### 4. JWT 双 Token 方案
**选择**: Access Token（2小时）+ Refresh Token（7天）
**理由**:
- Access Token 短期有效，降低泄露风险
- Refresh Token 长期有效，提升用户体验
- 平衡安全性和用户体验
**替代方案**:
- 单 Token：简单但安全性较低
- Session：需要服务端存储，不适合前后端分离

### 5. API 版本管理：URL 版本
**选择**: `/api/v1/` 前缀
**理由**:
- 直观清晰，易于理解和维护
- 便于后续版本迭代和兼容性管理
**替代方案**:
- Header 版本：不够直观
- 无版本：后续迭代困难

### 6. 邮箱验证码存储：数据库表
**选择**: 创建 email_codes 表存储验证码
**理由**:
- 简单可靠，无需额外依赖
- 支持审计和查询
- 与现有数据库架构一致
**替代方案**:
- Redis：性能更好但增加依赖复杂度
- 内存存储：重启丢失，不适合生产环境

### 7. 小程序分包加载
**选择**: 主包 5 个页面 + 认证分包
**理由**:
- 主包控制在 2MB 以内
- 认证相关页面使用频率较低，适合分包
- 提升小程序启动速度
**替代方案**:
- 全部放主包：可能超过 2MB 限制
- 更多分包：增加复杂度，收益不明显

### 8. 错误码设计：混合方案
**选择**: HTTP 状态码 + 业务错误码（response body）
**理由**:
- HTTP 状态码表示请求结果（200/400/401/500）
- 业务错误码表示具体业务场景（10001 邮箱已存在）
- 前后端都能清晰理解错误类型
**替代方案**:
- 纯 HTTP 状态码：无法表达细粒度业务错误
- 纯业务错误码：不符合 RESTful 规范

### 9. 表单验证方案：分层验证
**选择**:
- 小程序：手动验证 + 正则
- 管理后台：Element Plus 内置验证
- 后端：class-validator 装饰器验证
**理由**:
- 各端使用最适合的验证方案
- 后端验证确保安全，前端验证提升体验
- class-validator 与 NestJS 深度集成
**替代方案**:
- 统一使用第三方库：增加学习成本和维护复杂度

### 10. 日志方案：winston 文件存储
**选择**: winston 按级别分文件存储
**理由**:
- NestJS 生态成熟，集成简单
- 支持多种输出格式和传输方式
- 便于日志分析和排查问题
**替代方案**:
- console.log：不适合生产环境
- pino：性能更好但生态不如 winston

## Risks / Trade-offs

### 风险 1：微信小程序域名配置
**风险**: 小程序未配置服务器域名，无法访问后端 API
**缓解**: 
- 开发阶段使用微信开发者工具的"不校验合法域名"选项
- 生产环境部署前必须完成域名配置和备案

### 风险 2：阿里云邮件推送服务
**风险**: 需要开通阿里云邮件推送服务并配置 SMTP
**缓解**:
- 开发阶段可以使用日志输出验证码（mock 模式）
- 生产环境提前开通服务并完成域名验证

### 风险 3：数据库迁移风险
**风险**: 数据库迁移可能导致数据丢失或结构错误
**缓解**:
- 使用 TypeORM 迁移工具，所有变更可追溯
- 开发环境使用 Docker 容器，可随时重建
- 生产环境迁移前备份数据库

### 风险 4：Token 安全性
**风险**: Token 存储在 localStorage，存在 XSS 攻击风险
**缓解**:
- 实施严格的 XSS 防护措施
- 设置 Token 合理过期时间
- 后续可考虑 httpOnly cookie 方案

### 风险 5：微信登录依赖
**风险**: 微信登录依赖微信开放平台接口，可能受限于微信政策
**缓解**:
- 提供账号密码登录作为备选方案
- 密切关注微信开放平台政策变化

### 风险 6：单角色权限限制
**风险**: 第一阶段仅支持单角色 admin，无法满足复杂权限需求
**缓解**:
- 设计时预留权限扩展空间
- 后续阶段可实现 RBAC 权限系统

### Trade-off 1：开发效率 vs 代码质量
**权衡**: 完整的代码规范工具链（ESLint、Prettier、Husky 等）增加配置时间，但提升代码质量
**决策**: 第一阶段投入时间配置，长期收益大于短期成本

### Trade-off 2：分包复杂度 vs 性能优化
**权衡**: 分包加载增加代码复杂度，但提升小程序启动速度
**决策**: 第一阶段实施基础分包，平衡性能和开发效率

### Trade-off 3：数据库独立表 vs 单表灵活性
**权衡**: 独立三表方案结构清晰，但查询时需要关联，性能略低
**决策**: 第一阶段数据量小，性能影响可接受，优先保证代码可维护性

## Visual Specifications（视觉规范）

> 来源：Figma 设计稿 `考研小程序项目`（node-id=272-3, 226-1729）

### 颜色体系

| 用途 | 色值 | 说明 |
|------|------|------|
| **主色/品牌色** | `#2563EB` | 按钮、链接、激活状态、微信关联说明文字 |
| **页面背景** | `#F7F8FA` | 小程序页面底色 |
| **容器背景** | `#FFFFFF` | 卡片、表单、输入框背景 |
| **标题文字** | `#182230` | 页面标题、区域标题 |
| **表单标签** | `#344054` | 输入框上方的标签文字 |
| **正文文字** | `#667085` | 正文内容、次要说明 |
| **占位文字** | `#7B8494` | 输入框 placeholder |
| **辅助文字** | `#98A2B3` | 时间戳、版权信息、协议文本 |
| **提示文字** | `#466080` | 蓝色背景上的信息文字 |
| **浅边框** | `#E7EBF0` | 输入框边框、分隔线 |
| **中边框** | `#DCE1E9` | 按钮边框、卡片边框 |
| **分割线** | `#D1D9E3` | 登录页分隔线 |
| **信息背景** | `#EAF1FF` | 微信关联说明区域背景 |
| **浅蓝背景** | `#EFF5FF` | 标签背景 |

**小程序 WXSS 变量定义：**

```css
page {
  --color-primary: #2563EB;
  --color-bg-page: #F7F8FA;
  --color-bg-container: #FFFFFF;
  --color-text-title: #182230;
  --color-text-label: #344054;
  --color-text-body: #667085;
  --color-text-placeholder: #7B8494;
  --color-text-secondary: #98A2B3;
  --color-text-info: #466080;
  --color-border-light: #E7EBF0;
  --color-border-medium: #DCE1E9;
  --color-border-divider: #D1D9E3;
  --color-bg-info: #EAF1FF;
  --color-bg-info-light: #EFF5FF;
}
```

### 字号与字体层级

字体族：**Noto Sans SC**（微信小程序中对应系统默认字体）

| 层级 | 字号 | 字重 | 行高 | 用途 |
|------|------|------|------|------|
| **H1 页面标题** | 26px | Bold 700 | 39px | "邮箱注册"、"账号密码登录" |
| **H2 区域标题** | 24px | Bold 700 | 1.5em | "考研资料库"、"完善备考信息" |
| **Button 按钮文字** | 15px | Bold 700 | 23px | 主按钮文字（"微信一键登录"、"登录"） |
| **Label Bold 表单标签** | 14px | Bold 700 | 1.5em | 表单字段标签（"当前年级"、"所学专业"） |
| **Body 正文** | 14px | Regular 400 | 21px | 链接文字、操作入口（"账号密码登录"、"注册账号"） |
| **Label 表单标签** | 13px | Bold 700 | 20px | 输入框标签（"邮箱地址"、"账号"、"密码"） |
| **Body Secondary 次要正文** | 13px | Regular 400 | 20px | 次要说明文字（"登录考研资料库，继续你的备考计划"） |
| **Helper 辅助文字** | 12px | Regular 400 | 18px | 提示信息、协议说明 |
| **Caption 说明文字** | 11px | Regular 400 | 17px | 底部提示（"登录即表示同意..."、"首次登录后完善备考信息"） |

### 关键间距与圆角规范

**间距系统（8px 基准）：**

| Token | 值 | 用途 |
|-------|------|------|
| `spacing-xs` | 4px | 图标与文字间距 |
| `spacing-sm` | 8px | 表单标签与输入框间距 |
| `spacing-md` | 12px | 表单内部元素间距 |
| `spacing-lg` | 16px | 表单项之间间距 |
| `spacing-xl` | 20px | 按钮之间间距、区块间距 |
| `spacing-2xl` | 24px | 页面水平内边距、区块间距 |
| `spacing-3xl` | 28px | 标题区域间距 |

**组件尺寸：**

| 组件 | 高度 | 圆角 | 内边距 |
|------|------|------|------|
| **主按钮** | 48px | 10px | 水平居中 |
| **次要按钮** | 48px | 10px | 0 14px |
| **输入框** | 48px | 10px | 0 14px |
| **Logo 容器（小）** | 56px × 56px | 16px | 居中 |
| **Logo 容器（大）** | 80px × 80px | 20px | 居中 |
| **表单卡片** | 自适应 | 12px | 16px |
| **信息提示框** | 64px | 10px | 0 14px |

**页面布局间距：**

- 页面水平内边距：**24px**（内容区宽度 327px = 375px - 48px）
- 顶部安全区：状态栏高度 + Top bar 48px
- 区块间距：24px - 28px

### 页面布局结构

**小程序整体布局（Flex 方案）：**

```
Page (375 × 812)
├── Device Status Bar (系统状态栏)
├── Top Bar (48px, Flex row, align-center)
│   ├── 标题 (左对齐, 24px Bold)
│   └── 小程序控制按钮 (右对齐)
└── Content (Flex column, padding: 0 24px)
    ├── 品牌介绍区 (Flex column, align-center, gap: 22px)
    │   ├── Logo 容器 (80×80, 居中)
    │   ├── 品牌文案 (Flex column, align-center, gap: 12px)
    │   └── 价值亮点 (Flex row, gap: 22px)
    ├── 操作区 (Flex column, gap: 20px)
    │   ├── 主按钮 (width: 327px, height: 48px)
    │   └── 辅助操作 (Flex row, justify-center, gap: 20px)
    └── 底部提示 (居中, 11px)
```

**表单页面布局：**

```
Content (Flex column, padding: 16px, gap: 24px)
├── 说明文字 (14px, #667085)
├── 表单卡片 (Flex column, border-radius: 12px, bg: #FFFFFF)
│   └── 表单字段 ×N (Flex column, gap: 8px)
│       ├── 标签 (14px Bold)
│       └── 输入框 (height: 48px, border-radius: 10px)
├── 主按钮 (width: 327px, height: 48px, border-radius: 10px)
└── 底部提示 (12px, 居中)
```

**Flex 布局规则：**

- **垂直排列**：`display: flex; flex-direction: column`
- **水平排列**：`display: flex; flex-direction: row`
- **居中对齐**：`justify-content: center; align-items: center`
- **两端对齐**：`justify-content: space-between; align-items: center`
- **间距方式**：使用 `gap` 属性，不使用 `margin`（保证一致性）
- **弹性宽度**：`flex: 1` 或 `width: 100%` 用于填满容器

### 管理后台视觉规范（参考）

管理后台（Vue 3 + Element Plus）应遵循相同的颜色体系，具体实现：

- **主色**：Element Plus 的 `--el-color-primary` 设置为 `#2563EB`
- **字体**：Element Plus 默认字体栈（`Helvetica Neue`, `Helvetica`, `PingFang SC` 等）
- **圆角**：Element Plus 的 `--el-border-radius-base` 设置为 `8px`
- **间距**：Element Plus 的 `--el-spacing` 遵循 8px 基准
