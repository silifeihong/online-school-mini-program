# Tasks

## 1. 共享类型与错误码

- [x] 1.1 packages/shared-types：error-codes.ts 追加 16000 段（16001 COURSE_NOT_FOUND / 16002 COURSE_OFF_SHELF / 16003 COURSE_NOT_PURCHASED / 16004 CHAPTER_NOT_FOUND / 16005 ENROLLMENT_EXISTS / 16006 SALES_WECHAT_NOT_SET / 16007 MATERIAL_NOT_FOUND / 16008 MATERIAL_OFF_SHELF）；新增 Course（含 payment_type/teacher/subtitle）/Chapter（含 content_type/description/file_url）/Material/Enrollment 接口类型。验证：`pnpm --filter @online-school/shared-types build` 通过
- [x] 1.2 apps/api 与两端引用新类型替换 any 占位。验证：三端 build/tsc 无类型报错

## 2. 后端课程模块（实体 + 管理端 CRUD + 向导）

- [x] 2.1 新增 course/material 模块实体：courses / chapters / course_enrollments / materials / app_settings（字段与索引按 design D5，含 payment_type、teacher、subtitle、chapter.content_type/description/file_url）。验证：API 启动日志出现五表 synchronize 建表，mysql 中 `SHOW TABLES` 可见
- [x] 2.2 AdminCourseController：课程列表（状态 + 付费类型筛选 + 标题搜索 + 分页 + 章节数聚合 + updated_at）、创建、详情、更新、删除、上下架切换、发布课程（保存并置 on，供向导 Step2 用）。验证：curl 全链路——保存草稿默认下架 → 发布课程后小程序接口可见（见 4.4）→ 列表筛选调用
- [x] 2.3 章节管理接口：课程下章节列表/新增/更新/删除/排序保存（content_type=video|document、file_url、description、is_trial、sort_order 校验）。验证：curl 增删改后 GET 章节顺序、试看标记与内容类型正确
- [x] 2.4 课程 DTO：whitelist 兼容（标题必填 ≤100、teacher/subtitle 可选、payment_type enum、price decimal ≥0 两位小数、free 时服务端强制 price=0、简介可选）。验证：非法价格/空标题/free+非零价格 curl 返回 10001 或被归零

## 3. 后端学员关系与设置

- [x] 3.1 AdminEnrollmentController：课程学员列表（join students/users 取掩码 OpenID/昵称/年级/专业/院校 + joined_at + 昵称/OpenID 搜索）、候选学员接口（active 且有档案；已加入者带 enrolled=true 标记而非排除；支持昵称/OpenID 搜索 + 年级/专业/院校筛选）、批量添加（事务 + 唯一约束兜底 16005）、移出（硬删除）。验证：curl 批量加 2 人 → 列表 2 行 joined_at 正确 → 候选接口该 2 人 enrolled=true → 重复添加返回 16005 → 移出后列表消失
- [x] 3.2 AdminSettingsController：GET/PUT 销售微信号（key=sales_wechat，供 /settings 系统设置页）。验证：curl PUT 后 GET 返回新值；课程详情响应同步带出（见 4.2）

## 4. 后端小程序接口、播放签发与资料

- [x] 4.1 MiniCourseController：GET /courses（仅上架 + 标题搜索 + type=course|material|all 混排参数 + 分页）、GET /courses/:id（详情 + 章节 state：trial/unlocked/locked + enrolled + payment_type + sales_wechat；免费课程登录用户全章节 unlocked；下架课程：已购返回全量、未购 16002）。验证：curl 匿名/登录/已购/免费四态响应符合 spec course-learning 详情场景
- [x] 4.2 GET /courses/:id/chapters/:cid/play-url（公开路由 + 可选 Bearer）：试看匿名签发；付费非试看未登录 401 引导、登录未购 16003、已购签发；免费课程非试看登录即签发；document 章节同样签发（下载地址语义）。真实模式 OSS signatureUrl 3600s、mock 模式本地 /uploads/* URL。验证：mock 模式 curl 各态返回正确且 URL 可 GET 200
- [x] 4.3 MiniMaterialController：GET /materials（仅上架 + 标题搜索 + 分页）、GET /materials/:id/download-url（登录守卫；不存在 16007、下架 16008；OSS 签名/mock 本地 URL）。验证：匿名请求 download-url 401，登录请求返回可下载 URL
- [x] 4.4 upload 模块：POST /admin/uploads/sts（配置齐全返回 STS 凭证、缺失返回 mode=mock；策略限定 courses/* 与 materials/* 前缀）、POST /admin/uploads/mock（multipart 落盘 apps/api/uploads 并返回 /uploads/* URL）、Nest 静态托管 /uploads。验证：未配凭证 curl sts 返回 mock → mock 上传后 URL 可访问；配置假凭证返回 credentials 结构（字段齐全）

## 5. 小程序首页改造与服务层

- [x] 5.1 services/course.ts（getCourseList/getCourseDetail/getPlayUrl）+ services/material.ts（getMaterialList/getDownloadUrl）+ 类型。验证：`npx tsc --noEmit`（apps/miniapp）通过
- [x] 5.2 pages/home 重写（视觉按 design.md 视觉规范·首页）：品牌标题「考研资料库」+ 搜索框（搜索课程或资料）+ 全部/课程/资料三 tabs（选中 #2563EB + 下划线）+ 课程卡（封面占位/课程 tag/标题/meta 讲师·课时·卖点/价格或「免费」）+ 资料卡（封面/资料 tag/标题/meta/下载资料按钮）+ onReachBottom 分页 + 下拉刷新；未登录可浏览。验证：开发者工具匿名进入首页见混排列表，搜索、tab 切换与触底加载生效
- [x] 5.3 课程卡点击跳 course-detail（query id）；资料卡「下载资料」：未登录跳登录，登录取 download-url 后 wx.downloadFile + wx.openDocument。验证：跳转携带 id；mock 模式下载打开 PDF 成功

## 6. 小程序课程详情与购买弹窗

- [x] 6.1 pages/course-detail（视觉按 design.md 视觉规范·详情页）：封面区（图或 #EFF5FF 占位）/信息卡（标题/价格或免费/讲师·课时/简介）/目录卡（共 N 课时 + 章节行：序号/标题/试看 tag/锁图标/文档样式）+ 底部操作栏三态（立即购买 / 已购买 / 免费·开始学习）。验证：匿名/登录未购/已购/免费四类课程截图核对章节标记与操作栏
- [x] 6.2 微信名片弹窗组件：展示 sales_wechat + 一键复制（wx.setClipboardData）+ 引导文案；未配置时兜底提示；未登录点购买跳登录；免费课程不弹。验证：弹窗复制成功 toast；未登录点击跳转登录页
- [x] 6.3 下架课程直链：已购正常、未购提示已下架不展示章节。验证：curl 对应 16002 且页面提示文案展示

## 7. 小程序播放页

- [x] 7.1 pages/course-player（视觉按 design.md 视觉规范·播放页）：video 置顶（#18243A 底）+ 当前章节卡（课程名/章节标题/状态 tag/章节简介）+ 章节列表卡（当前项 #EFF5FF 高亮）；进入即按 chapter_id 请求 play-url；试看匿名可播。验证：匿名播放试看章节出画面
- [x] 7.2 锁定章节引导：未登录点锁定跳登录、登录未购点付费锁定章节弹购买弹窗、免费课程章节登录直接播；document 章节点击走下载打开不进播放页；播放 onerror 自动重取 play-url 续播。验证：各态点击行为符合 spec；mock 断链场景重取生效
- [x] 7.3 app.json 注册 course-detail / course-player 页面。验证：编译无未注册页面报错

## 8. 管理后台骨架、课程列表与系统设置

- [x] 8.1 api/course.ts + api/material.ts：课程/章节/学员/设置/上传/资料全部接口封装 + 类型。验证：`pnpm --filter @online-school/admin-web build` 通过
- [x] 8.2 侧边栏与路由（视觉按 design.md 视觉规范·后台框架）：导航五项（首页/学员管理/课程管理/资料管理/系统设置）+ 保留档案选项；品牌名改「考研资料库」；路由 /courses、/courses/create?step=1|2、/courses/:id/edit?step=、/courses/:id/students、/courses/:id/students/add、/materials、/settings。验证：登录后菜单可见且各路由可直达
- [x] 8.3 课程列表页：标题搜索 + 付费类型/状态筛选 + 查询/重置；表格列＝封面缩略(#EFF5FF r4)/标题/类型(恒「视频」)/付费类型/价格/状态标签(已上架 #ECF8F2·#16845C、已下架灰)/更新时间/操作（编辑、上架|下架、学员管理文字链）；分页条。验证：筛选调用生效；状态操作切换即上下架
- [x] 8.4 系统设置页 /settings：销售微信号读取/保存表单卡片。验证：保存后刷新回显，小程序详情弹窗同步（联调见 10.1）
- [x] 8.5 utils/upload.ts：sts 探测 + ali-oss 直传（进度条）+ mock 回退 + 大小校验（图 5MB/视频 500MB/文档 100MB）+ 已上传文件名与大小回显。验证：mock 模式上传封面返回可预览 URL

## 9. 管理后台课程向导与学员页

- [x] 9.1 课程向导 Step1 基本信息（create/edit 同组件）：步骤条（当前实心 #2563EB/未完成描边/已完成 #EFF5FF）+ 表单（标题*/封面上传占位文案「建议 16:9，支持 JPG / PNG，最大 5MB」/付费类型 radio 付费|免费/价格（免费禁用锁 ¥0 + helper 文案）/讲师/副标题/简介）+ 保存草稿/下一步。验证：free 切换时价格禁用；保存草稿后列表出现下架课程
- [x] 9.2 课程向导 Step2 课程内容：章节卡列表（序号/标题输入/简介输入/内容类型切换 视频|文档/文件上传回显/试看 switch/删除）+「＋ 新增章节」虚线行 + 共 N 个章节计数 + 上一步/保存草稿/发布课程。验证：新建课程含 2 章节（1 试看 1 文档）发布后列表已上架且小程序详情一致
- [x] 9.3 课程学员页：课程上下文头（课程名+状态 tag+「视频课程 · 共 N 课时」+「课程学员 N 人」）+ 搜索昵称/OpenID + 表格（掩码 OpenID/昵称/年级/专业/所属院校/加入时间/移出确认）+ 右上添加学员入口。验证：移出后小程序该学员非试看章节变锁定
- [x] 9.4 添加学员页：候选表（active 有档案；已加入行灰显禁选 + 「已加入/不可重复添加」tag，未加入「未加入」tag）+ 搜索 + 年级/专业/院校筛选 + 表头全选/半选 + 底部确认条（已选择 N 位用户 / 仅将所选用户加入「课程名」/ 取消 + 确认添加（N 人））。验证：批量添加 2 人后返回学员页新增 2 行；再进添加页该 2 人灰显
- [x] 9.5 资料管理页 /materials：列表（封面/标题/格式元信息/状态标签/更新时间/操作 编辑|上架下架|删除）+ 搜索与状态筛选 + 新建/编辑表单（标题/封面/文件上传/file_meta/简介）。验证：创建资料默认下架 → 上架后小程序资料 tab 可见

## 10. 集成验证与收尾

- [x] 10.1 编写并执行 curl 集成脚本（mock 模式）：建课（草稿）→ 传图传视频传文档 → 发布课程 → 小程序列表三 tab/详情/试看 play-url → 免费课程登录 play-url → 批量 enroll → 全章节 play-url → 移出 → 权限收回 → 下架两态 → 资料创建/上架/登录 download-url/匿名 401。验证：脚本全绿且输出贴入 progress.md
- [x] 10.2 三端构建：api nest build、miniapp tsc --noEmit、admin-web build 全通过；测试课程/资料/学员数据清理
- [x] 10.3 更新 .planning 的 progress.md 与 task_plan.md（Phase 2 段落）。验证：两文件含 Phase 2 完成记录

## Workflow follow-up

- 实施前请用户复核两处设计稿驱动的范围决策：① 资料能力按「Phase 2 仅免费下载」收窄（design D10）；② 销售微信号配置入口从课程列表卡片迁至系统设置页（design D7，覆盖此前 grilling 答案）
- 实施完成后由用户验收真机/开发者工具体验；阿里云真凭证联调留待用户提供 AK 后单独一轮验证
- 归档（openspec archive phase2-courses）待用户确认验收后执行

## 11. 验收期追加需求（用户验收过程中提出，均已实现并验证）

- [x] 11.1 资料多文件：files simple-json 整组替换、下载 download-url ?index=N、列表文件信息汇总。验证：多文件上传/替换/下载链路脚本通过
- [x] 11.2 资料富文本图文内容：content mediumtext 列 + wangeditor 编辑器（插图走上传通道）+ 小程序 rich-text 渲染（img 自适应屏宽）展示顺序高于文件。验证：verify_content.sh 7/7
- [x] 11.3 课程/资料列表新增「创建时间」列（更新时间之前）。验证：列表接口含 created_at、后台展示
- [x] 11.4 单文档资料有图文内容时不自动打开文档，点击文件卡片再打开。验证：详情页行为走查
- [x] 11.5 状态新增草稿：实体默认 draft、状态接口拒绝回草稿、草稿资料小程序按不存在隐藏、草稿/下架课程未报名不可见（已报名不受影响）、后台列表草稿筛选与标签、已发布课程表单去「保存草稿」改「发布变更/保存变更」且保存成功跳列表、第一步已发布态仅「下一步」。验证：verify_draft.sh 13/13
- [x] 11.6 课程条件删除：列表对草稿、或已下架且 0 学员课程显示删除按钮，服务端同规则拦截。验证：verify_delete.sh 5/5
- [x] 11.7 上传限制提升：图片 30MB（前后端）、资料文档前端 50→100MB（后端本就 100MB）、富文本插图 30MB。验证：verify_upload_limits.sh 3/3
- [x] 11.8 课程封面已上传态「替换/删除」按钮，删除保存后 cover_url=null 落库。验证：curl 建课→置 null→详情 null
- [x] 11.9 启动页按 Figma 设计稿（379:12）重做：#F7F8FA 底、蓝圆角 Logo+白色 book-open 图标（SVG 转 PNG）、考研资料库标题/副标题/价值点文案；跳转逻辑不变。验证：开发者工具走查
