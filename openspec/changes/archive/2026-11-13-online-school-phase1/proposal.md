# Proposal

## Why

构建一个前后端分离的在线网校系统，包含微信小程序（学员端）和 PC 管理后台（管理员端）。这是项目的第一个阶段，专注于实现核心的用户认证和学员管理功能，为后续的课程、学习记录等功能模块奠定基础。

## What Changes

- 搭建 Monorepo 项目结构（pnpm workspace），包含小程序、管理后台、后端 API 三个子项目
- 实现微信小程序端的用户认证系统：
  - 邮箱注册（6位验证码，5分钟有效期，阿里云邮件推送）
  - 账号密码登录
  - 微信一键登录（需绑定邮箱）
  - 忘记密码（邮箱验证码自助重置）
  - 首次登录填写个人信息（当前年级、所学专业、所属院校）
- 实现管理后台的认证系统：
  - 管理员登录（预定义 admin 账户）
  - JWT 双 Token 认证（access token 2小时 + refresh token 7天）
- 实现学员管理功能：
  - 学员列表（分页、搜索、筛选）
  - 学员详情查看
  - 禁用/启用学员账号
  - 重置学员密码（管理员指定新密码；原文所载固定默认口令已脱敏）
- 配置 Docker Compose 开发环境（MySQL + API + Admin Web）
- 配置完整的代码规范工具链（ESLint、Prettier、Husky、lint-staged、Commitlint）

## Capabilities

### New Capabilities

- `user-auth`: 用户认证系统，覆盖小程序端和管理后台的登录、注册、Token管理、密码重置等认证相关功能
- `student-management`: 学员管理功能，包括学员列表查询、详情查看、状态管理（禁用/启用）、密码重置等管理员操作
- `user-profile`: 用户个人信息管理，包括个人信息的填写、查看和更新（年级、专业、院校）

### Modified Capabilities

（无，这是新项目的首个变更）

## Impact

- **代码结构**：创建完整的 Monorepo 项目结构
  - `apps/api` - NestJS 后端 API
  - `apps/admin-web` - Vue 3 管理后台
  - `apps/miniapp` - 原生微信小程序
  - `packages/shared-types` - TypeScript 共享类型定义
- **API 接口**：新增约 20 个 RESTful API 端点（认证、用户、学员管理）
- **数据库**：创建 4 张核心表（users、students、admins、email_codes）
- **依赖**：
  - 后端：NestJS、TypeORM、@nestjs/jwt、@nestjs/passport、winston、bcrypt
  - 前端：Vue 3、Element Plus、Pinia、Axios
  - 小程序：TDesign Mini Program、MobX-miniprogram
- **外部服务**：阿里云邮件推送（邮箱验证码）
- **部署**：Docker Compose 开发环境，微信小程序手动上传
