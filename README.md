# 网校小程序

在线网校系统 - 微信小程序 + PC管理后台 + NestJS后端API

## 项目结构

```
online_school_mini_program/
├── apps/
│   ├── api/              # NestJS 后端 API
│   ├── admin-web/        # Vue 3 管理后台
│   └── miniapp/          # 微信小程序
├── packages/
│   └── shared-types/     # 共享类型定义
├── docker/               # Docker 配置
├── docker-compose.yml    # Docker Compose
└── pnpm-workspace.yaml   # pnpm 工作区配置
```

## 技术栈

### 后端 API
- **框架**: NestJS 12 + TypeScript
- **数据库**: MySQL 8.0 + TypeORM
- **认证**: JWT (access_token + refresh_token)
- **文档**: Swagger/OpenAPI
- **日志**: Winston

### 管理后台
- **框架**: Vue 3 + TypeScript + Vite
- **UI**: Element Plus
- **状态**: Pinia
- **路由**: Vue Router 4
- **HTTP**: Axios

### 微信小程序
- **UI**: TDesign Mini Program
- **状态**: MobX-miniprogram
- **语言**: TypeScript

## 快速开始

### 环境要求
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- MySQL 8.0

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

复制环境变量文件并修改：

```bash
cp .env.example .env.local
```

主要配置项：
- `DATABASE_HOST`: MySQL 主机
- `DATABASE_PORT`: MySQL 端口
- `DATABASE_USERNAME`: 数据库用户名
- `DATABASE_PASSWORD`: 数据库密码
- `DATABASE_NAME`: 数据库名
- `JWT_SECRET`: JWT 密钥（必填，可用 `openssl rand -hex 32` 生成）
- `ADMIN_SEED_PASSWORD`: 初始管理员密码（seed:admin 使用，不填则跳过创建）

> 使用 docker-compose 时另需根目录 `.env`（已被 git 忽略），至少包含 `MYSQL_ROOT_PASSWORD` 与 `JWT_SECRET`。

### 启动数据库

```bash
docker-compose up -d mysql
```

### 启动后端 API

```bash
pnpm dev:api
```

API 文档: http://localhost:3000/api/docs

### 启动管理后台

```bash
pnpm dev:admin
```

访问: http://localhost:8080

### 微信小程序

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入 `apps/miniapp` 目录
3. 在 `apps/miniapp/config.ts` 中按环境（dev/prod）配置 API 地址

## 初始管理员账号

代码与文档中不再保留默认口令。首次初始化：

1. 在根目录 `.env.local` 中设置 `ADMIN_SEED_PASSWORD=<你的强密码>`
2. 执行 `pnpm --filter @online-school/api seed:admin`（管理员已存在时自动跳过，不会覆盖）
3. 使用 `admin` + 你设置的密码登录管理后台

## API 端点

### 认证模块
- `POST /api/v1/auth/send-email-code` - 发送邮箱验证码
- `POST /api/v1/auth/register` - 邮箱注册
- `POST /api/v1/auth/login` - 账号密码登录
- `POST /api/v1/auth/wechat-login` - 微信登录
- `POST /api/v1/auth/wechat-bind-email` - 微信绑定邮箱
- `POST /api/v1/auth/forgot-password/send-code` - 忘记密码发送验证码
- `POST /api/v1/auth/forgot-password/reset` - 重置密码
- `POST /api/v1/auth/refresh-token` - 刷新Token

### 用户模块
- `GET /api/v1/user/profile` - 获取个人信息
- `PUT /api/v1/user/profile` - 更新个人信息

### 管理员模块
- `POST /api/v1/admin/login` - 管理员登录
- `POST /api/v1/admin/refresh-token` - 刷新Token
- `PUT /api/v1/admin/password` - 修改密码

### 学员管理
- `GET /api/v1/students` - 学员列表（分页、搜索、过滤）
- `GET /api/v1/students/:id` - 学员详情
- `PUT /api/v1/students/:id/status` - 更新学员状态
- `POST /api/v1/students/:id/reset-password` - 重置学员密码

## 构建

```bash
# 构建后端
pnpm build:api

# 构建管理后台
pnpm build:admin
```

## 小程序静态资源

小程序需要手动准备以下图片资源，放在 `apps/miniapp/static/images/` 目录：

- Tab Bar 图标: tab-home.png, tab-home-active.png, tab-mine.png, tab-mine-active.png
- 其他图标: logo.png, wechat.png, default-avatar.png, arrow-right.png
- 菜单图标: menu-course.png, menu-record.png, menu-security.png, menu-about.png
- Banner: banner1.png, banner2.png
- 课程封面: course1.png ~ course4.png

## 开发规范

### 代码格式化

```bash
pnpm format
```

### 代码检查

```bash
pnpm lint
```

### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具
```

## License

MIT
