# Tasks

## 1. 项目基础架构搭建

- [x] 1.1 初始化 Monorepo 结构：创建根目录 pnpm-workspace.yaml 和 package.json，配置 workspaces 包含 apps/* 和 packages/*，验证 pnpm install 成功
- [x] 1.2 创建 shared-types 包：在 packages/shared-types 中配置 TypeScript，定义通用类型（API 响应、分页、错误码枚举），验证类型可以被其他包引用
- [x] 1.3 配置代码规范工具：在根目录配置 ESLint、Prettier、Husky、lint-staged、Commitlint，创建 .eslintrc.js、.prettierrc、commitlint.config.js，配置 package.json 中的 lint-staged，验证 git commit 时自动检查
- [x] 1.4 配置 Docker Compose：创建 docker-compose.yml，配置 MySQL（3306端口）、环境变量，验证 docker-compose up -d mysql 可以正常启动
- [x] 1.5 配置环境变量：创建 .env.local、.env.development、.env.production 文件，配置 MySQL 连接信息、JWT 密钥、阿里云邮件推送配置（mock 模式），验证环境变量可以正确加载

## 2. 后端 API 基础架构

- [x] 2.1 初始化 NestJS 项目：在 apps/api 中使用 @nestjs/cli 创建项目，配置 TypeORM、JWT、Passport、winston，安装依赖包，验证 npm run start:dev 可以正常启动
- [x] 2.2 配置 TypeORM：创建 ormconfig.ts，配置 MySQL 连接（使用环境变量）、实体路径、迁移路径、日志级别（开发环境开启），验证数据库连接成功
- [x] 2.3 配置 winston 日志：创建 logger.service.ts，配置文件输出（logs/error.log、logs/combined.log、logs/exceptions.log），配置日志级别和格式，验证日志文件可以正确生成
- [x] 2.4 配置全局异常过滤器：创建 global-exception.filter.ts，统一处理异常，返回标准格式响应（code + message + data + timestamp），验证异常响应格式正确
- [x] 2.5 配置全局拦截器：创建 transform.interceptor.ts，统一包装成功响应，添加 timestamp 字段，验证响应格式正确
- [x] 2.6 配置 Swagger 文档：在 main.ts 中配置 @nestjs/swagger，设置标题、描述、版本，配置 API 版本前缀 /api/v1，验证 Swagger 文档可以正常访问

## 3. 数据库实体和迁移

- [x] 3.1 创建 User 实体：创建 users.entity.ts，定义字段（id、email、password_hash、nickname、avatar_url、wx_openid、wx_unionid、is_email_verified、is_profile_completed、status、created_at、updated_at），配置索引（email 唯一、wx_openid 唯一），验证实体定义正确
- [x] 3.2 创建 Student 实体：创建 students.entity.ts，定义字段（id、user_id、grade、major、university、created_at、updated_at），配置索引（user_id 唯一、grade/major/university 组合索引），验证实体定义正确
- [x] 3.3 创建 Admin 实体：创建 admins.entity.ts，定义字段（id、username、password_hash、real_name、status、last_login_at、created_at、updated_at），配置索引（username 唯一），验证实体定义正确
- [x] 3.4 创建 EmailCode 实体：创建 email-codes.entity.ts，定义字段（id、email、code、expires_at、created_at），配置索引（email + code 组合索引），验证实体定义正确
- [ ] 3.5 生成初始迁移：运行 typeorm migration:generate 生成初始迁移文件，验证迁移文件内容正确
- [ ] 3.6 执行迁移：运行 npm run migration:run 执行迁移，验证数据库表创建成功
- [x] 3.7 创建 admin seed 脚本：创建 seed-admin.ts，定义默认 admin 账户（用户名:admin，密码由环境变量 ADMIN_SEED_PASSWORD 提供；原文所载默认口令已脱敏，姓名:系统管理员），配置应用启动时检查并创建，验证 admin 账户可以正常创建

## 4. 后端 Auth 模块

- [x] 4.1 创建 Auth 模块结构：创建 modules/auth 目录，包含 auth.module.ts、auth.controller.ts、auth.service.ts，配置模块依赖，验证模块可以正常加载
- [x] 4.2 实现邮箱验证码发送：在 auth.service.ts 中实现 sendEmailCode 方法，生成 6 位随机验证码，存储到 email_codes 表（5分钟有效期），调用阿里云邮件推送（开发环境 mock），配置 60 秒限流，验证验证码可以正确生成和存储
- [x] 4.3 实现邮箱注册：在 auth.service.ts 中实现 register 方法，验证邮箱验证码、创建 User 记录、关联微信 openid、标记邮箱已验证，返回成功响应，验证注册流程完整
- [x] 4.4 实现账号密码登录：在 auth.service.ts 中实现 login 方法，验证邮箱和密码，生成 JWT 双 Token（access 2小时、refresh 7天），返回 token，验证登录流程正确
- [x] 4.5 实现微信登录：在 auth.service.ts 中实现 wechatLogin 方法，用 code 换取 openid，检查是否已注册（已注册返回 token，未注册返回需要绑定邮箱标识），验证微信登录流程正确
- [x] 4.6 实现微信绑定邮箱：在 auth.service.ts 中实现 bindEmail 方法，为微信新用户绑定邮箱、密码、昵称，创建 User 记录并关联微信，返回 token，验证绑定流程完整
- [x] 4.7 实现忘记密码：在 auth.service.ts 中实现 forgotPassword 和 resetPassword 方法，发送验证码、验证验证码、更新密码，验证密码重置流程正确
- [x] 4.8 实现 Token 刷新：在 auth.service.ts 中实现 refreshToken 方法，验证 refresh token、生成新的双 Token，返回新 token，验证刷新流程正确
- [x] 4.9 实现 JWT 策略：配置 @nestjs/passport 的 JwtStrategy 和 LocalStrategy，创建 guards 和 decorators，验证认证守卫可以正常工作
- [ ] 4.10 编写 Auth 模块单元测试：为 auth.service.ts 编写单元测试，覆盖所有场景（成功、失败、边界情况），验证测试通过

## 5. 后端 User 模块

- [x] 5.1 创建 User 模块结构：创建 modules/user 目录，包含 user.module.ts、user.controller.ts、user.service.ts，配置模块依赖，验证模块可以正常加载
- [x] 5.2 实现获取个人信息：在 user.service.ts 中实现 getProfile 方法，返回当前登录用户的基本信息和个人信息，验证返回数据正确
- [x] 5.3 实现更新个人信息：在 user.service.ts 中实现 updateProfile 方法，更新年级、专业、院校信息，标记 is_profile_completed 为 true，验证更新成功
- [x] 5.4 实现退出登录：在 auth.service.ts 中实现 logout 方法，使当前 token 失效（可选：加入黑名单），验证退出成功
- [ ] 5.5 编写 User 模块单元测试：为 user.service.ts 编写单元测试，验证测试通过

## 6. 后端 Admin 模块

- [x] 6.1 创建 Admin 模块结构：创建 modules/admin 目录，包含 admin.module.ts、admin.controller.ts、admin.service.ts，配置模块依赖，验证模块可以正常加载
- [x] 6.2 实现管理员登录：在 admin.service.ts 中实现 login 方法，验证用户名和密码，生成 JWT 双 Token，更新 last_login_at，验证登录流程正确
- [x] 6.3 实现修改密码：在 admin.service.ts 中实现 changePassword 方法，验证旧密码、更新为新密码，验证修改成功
- [x] 6.4 实现 Token 刷新：在 admin.service.ts 中实现 refreshToken 方法，验证 refresh token、生成新的双 Token，验证刷新流程正确
- [x] 6.5 配置管理员认证守卫：创建 admin-auth.guard.ts，确保只有管理员可以访问 Admin 模块接口，验证守卫正常工作
- [ ] 6.6 编写 Admin 模块单元测试：为 admin.service.ts 编写单元测试，验证测试通过

## 7. 后端 Student 模块

- [x] 7.1 创建 Student 模块结构：创建 modules/student 目录，包含 student.module.ts、student.controller.ts、student.service.ts，配置模块依赖，验证模块可以正常加载
- [x] 7.2 实现学员列表查询：在 student.service.ts 中实现 findAll 方法，支持分页（默认 15 条）、关键词搜索（邮箱）、条件筛选（年级、专业、院校、账号状态、注册日期范围），按注册时间倒序排序，返回标准分页格式，验证查询结果正确
- [x] 7.3 实现学员详情查看：在 student.service.ts 中实现 findOne 方法，返回学员完整信息（基本信息 + 个人信息），验证返回数据正确
- [x] 7.4 实现禁用/启用学员：在 student.service.ts 中实现 updateStatus 方法，切换学员账号状态，验证状态切换成功
- [x] 7.5 实现重置学员密码：在 student.service.ts 中实现 resetPassword 方法，将密码重置为管理员指定的新密码（8-20 位），验证重置成功
- [x] 7.6 配置管理员权限守卫：确保 Student 模块接口只有管理员可以访问，验证权限控制正确
- [ ] 7.7 编写 Student 模块单元测试：为 student.service.ts 编写单元测试，验证测试通过

## 8. 后端 API 文档和测试

- [x] 8.1 完善 Swagger 文档：为所有 API 接口添加 @ApiTags、@ApiOperation、@ApiResponse 装饰器，定义 DTO 文档，验证 Swagger 文档完整且可读
- [ ] 8.2 创建 API 测试集合：使用 Postman 或类似工具创建 API 测试集合，覆盖所有接口，验证所有接口可以正常调用
- [ ] 8.3 编写集成测试：为关键流程编写集成测试（邮箱注册、微信登录、学员管理），验证端到端流程正确

## 9. 小程序基础架构

- [x] 9.1 初始化小程序项目：在 apps/miniapp 中创建原生小程序项目（TypeScript），配置 project.config.json（AppID）、app.json（页面路径、分包、tabBar），验证小程序可以正常编译
- [x] 9.2 配置分包结构：配置主包（splash、login-account、login-wechat、index、mine）和 auth 分包（register、profile-setup、forgot-password），验证分包配置正确
- [x] 9.3 集成 TDesign Mini Program：安装并配置 TDesign 组件库，在 app.json 中引入需要的组件，验证组件可以正常使用
- [x] 9.4 配置 MobX-miniprogram：安装 mobx-miniprogram 和 mobx-miniprogram-bindings，创建 stores 目录，定义 AppStore（userInfo、isLoggedIn、isProfileCompleted），验证状态管理正常工作
- [x] 9.5 封装 HTTP 请求：创建 utils/request.ts，封装 wx.request，配置请求拦截器（自动添加 Authorization header）、响应拦截器（统一错误处理、401 自动刷新 token、loading 状态），配置超时时间 15 秒，验证请求拦截器正常工作
- [x] 9.6 配置全局错误处理：在 app.ts 中配置 onError 全局错误捕获，实现错误提示 Toast，验证错误处理正常工作
- [x] 9.7 定义 API 接口：创建 api 目录，按模块定义接口（auth.ts、user.ts），使用 shared-types 中的类型定义，验证接口定义正确

## 10. 小程序启动页和登录页

- [x] 10.1 创建启动页：创建 pages/splash/index，实现启动页 UI（Logo + 应用名称），实现启动逻辑（检查 token、验证有效性、判断个人信息是否填写、自动跳转），停留 1.5 秒，验证启动逻辑正确
- [x] 10.2 创建账号登录页：创建 pages/login-account/index，实现登录表单（邮箱、密码），实现登录逻辑（调用 API、存储 token、跳转），提供切换到微信登录页的按钮，验证登录流程正确
- [x] 10.3 创建微信登录页：创建 pages/login-wechat/index，实现微信一键登录按钮，调用 wx.login 获取 code，实现登录逻辑（调用 API、存储 token、判断是否需要绑定邮箱、跳转），提供切换到账号登录页的按钮，验证微信登录流程正确
- [x] 10.4 实现 Token 存储：实现 token 的本地存储（wx.setStorageSync）和读取，实现 401 自动刷新 token 逻辑，验证 token 管理正确

## 11. 小程序注册和密码重置

- [x] 11.1 创建注册页：创建 pagesAuth/register/index，实现分步注册流程（步骤1：输入邮箱发送验证码、步骤2：输入验证码设置密码填写昵称、步骤3：获取微信 code、步骤4：提交创建用户），验证注册流程完整
- [x] 11.2 创建个人信息填写页：创建 pagesAuth/profile-setup/index，实现表单（当前年级、所学专业、所属院校），实现提交逻辑（调用 API、更新状态、跳转首页），验证填写流程正确
- [x] 11.3 创建忘记密码页：创建 pagesAuth/forgot-password/index，实现表单（邮箱、验证码、新密码、确认密码），实现发送验证码和重置密码逻辑，验证重置流程正确

## 12. 小程序首页和我的页面

- [x] 12.1 创建首页：创建 pages/index/index，实现首页基础结构（占位内容），配置为 tabBar 页面，验证首页可以正常显示
- [x] 12.2 创建我的页面：创建 pages/mine/index，实现个人信息展示（头像、昵称、邮箱、年级、专业、院校），实现退出登录功能（清除 token、跳转登录页），配置为 tabBar 页面，验证我的页面功能正确

## 13. 管理后台基础架构

- [x] 13.1 初始化 Vue 3 项目：在 apps/admin-web 中使用 Vite 创建 Vue 3 + TypeScript 项目，配置 vite.config.ts，验证项目可以正常启动
- [x] 13.2 集成 Element Plus：安装并配置 Element Plus，在 main.ts 中全局引入，配置中文语言包，验证组件可以正常使用
- [x] 13.3 配置 Pinia：安装并配置 Pinia，创建 stores 目录，定义 auth store（adminInfo、token、refreshToken）和 student store（studentList、total、loading），验证状态管理正常工作
- [x] 13.4 配置 Vue Router：创建 router/index.ts，配置路由（/login、/dashboard、/students、/students/:id），实现路由守卫（未登录跳转登录页、已登录不能访问登录页），验证路由和守卫正常工作
- [x] 13.5 封装 Axios 请求：创建 utils/request.ts，封装 Axios，配置请求拦截器（自动添加 Authorization header）、响应拦截器（统一错误处理、401 跳转登录页、自动刷新 token），配置超时时间 15 秒，验证请求拦截器正常工作
- [x] 13.6 定义 API 接口：创建 api 目录，按模块定义接口（auth.ts、student.ts），使用 shared-types 中的类型定义，验证接口定义正确

## 14. 管理后台登录页和仪表盘

- [x] 14.1 创建登录页：创建 views/login/index.vue，实现登录表单（用户名、密码），实现登录逻辑（调用 API、存储 token、跳转），验证登录流程正确
- [x] 14.2 创建仪表盘页：创建 views/dashboard/index.vue，实现占位内容（"欢迎使用管理系统"），验证页面可以正常显示

## 15. 管理后台学员管理

- [x] 15.1 创建学员列表页：创建 views/students/index.vue，实现学员列表表格（分页、搜索、筛选），实现搜索框（邮箱关键词），实现筛选条件（年级、专业、院校、账号状态、注册日期范围），实现分页组件（默认 15 条），实现查看详情、禁用/启用、重置密码操作按钮，验证列表功能正确
- [x] 15.2 创建学员详情页：创建 views/students/detail.vue，实现学员详细信息展示（基本信息、个人信息、账号状态），实现返回按钮，验证详情展示正确
- [x] 15.3 实现学员管理操作：实现禁用/启用学员弹窗确认，实现重置密码弹窗确认，调用 API 并刷新列表，验证操作功能正确

## 16. 集成测试和验证

- [x] 16.1 端到端流程测试：测试小程序邮箱注册完整流程（发送验证码→注册→填写个人信息→登录），验证流程正确
- [x] 16.2 端到端流程测试：测试小程序微信登录完整流程（微信登录→绑定邮箱→填写个人信息→登录），验证流程正确
- [x] 16.3 端到端流程测试：测试管理后台学员管理完整流程（登录→查看列表→搜索筛选→查看详情→禁用/启用→重置密码），验证流程正确
- [ ] 16.4 验证 Docker Compose：运行 docker-compose up，验证 MySQL、API、Admin Web 三个服务都可以正常启动和通信
- [ ] 16.5 验证代码质量：运行 ESLint、Prettier 检查，确保代码符合规范，运行 TypeScript 编译，确保无类型错误

## 17. 文档编写

- [x] 17.1 编写 README：创建项目根目录 README.md，包含项目介绍、技术栈、项目结构、安装步骤、开发指南、API 文档链接、部署说明，验证文档完整且可读
- [x] 17.2 编写环境变量文档：创建 .env.example 文件，说明所有环境变量的用途和配置方法，验证示例文件完整
- [ ] 17.3 编写数据库迁移文档：在 README 中说明数据库迁移命令（npm run migration:run、npm run migration:revert），验证命令可以正常执行

## 18. 完成情况补录（2026-11-13 归档前核对）

Phase 1 实施期间未回勾任务，本节为归档前逐项核对实际交付情况的结论。已勾选项中含以下形态偏差（功能均交付，实现形式与原任务描述不同）：

- 数据库表结构由 TypeORM synchronize 自动同步，未采用迁移文件体系（对应 3.5、3.6、17.3 未做）。
- 退出登录为客户端本地清除 token（authStore.logout → 清 storage、回登录页），后端无 logout 接口与 token 黑名单（5.4 按偏差形态交付；user-auth 规格 delta 已同步修订为实际行为）。
- 小程序未分包，全部页面平铺于主包；原计划 pagesAuth/register、profile-setup、forgot-password 对应实际 pages/register、pages/profile-setup、pages/forgot-password（9.2、11.x 按偏差形态交付）。
- 账号登录与微信登录合并为单页 pages/login（邮箱密码 + wx.login 一键登录双模式），未拆分 login-account / login-wechat 两页；微信新用户绑定邮箱走 pages/bind-email，注册确认页为 pages/account-confirm（10.2、10.3 按偏差形态交付）。
- 首页为 pages/home（原计划 pages/index），tabBar 配置齐全（12.1 按偏差形态交付）。
- 端到端验证以开发期 curl 脚本 + 人工联调完成（脚本未入库），仓库内无 *.spec.ts 单元/集成测试与 Postman 集合（对应 4.10、5.5、6.6、7.7、8.2、8.3 未做；16.1–16.3 以人工联调形式完成，微信登录使用 .env.local 中真实 WECHAT_APPID/SECRET 配置）。
- docker-compose.yml 已定义 mysql / api / admin-web 三服务，但实际开发中仅 MySQL 以容器运行，API 与前端以本地进程验证，未做全栈 compose 验证（16.4 未做）。
- TypeScript 编译四包全部通过；全仓 ESLint 检查未通过（大量可自动修复的格式问题，未治理），16.5 保持未勾。

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
- Verify the archived result.
