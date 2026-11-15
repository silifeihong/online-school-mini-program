# Design

## Context

Phase 1 已就绪：NestJS 12（ESM、`.js` 导入后缀、全局 ValidationPipe whitelist+forbidNonWhitelisted）、响应包 `{code,message,data,timestamp}`、ErrorCode 集中于 packages/shared-types（15000 段为 profile-option）、TypeORM 实体按模块放置、小程序原生 TS（services + mobx store + utils/request 自动解包 data）、admin-web Vue3 + Element Plus。管理端路由现状为裸路径 + AdminAuthGuard（如 `/students`），`/admin/login` 是 admin 前缀先例。微信与邮箱验证码均有 mock 回退先例（根目录 .env.local 控制）。

## Goals / Non-Goals

**Goals:**
- 三端（api / miniapp / admin-web）一次落地课程浏览-试看-购买闭环与后台维护能力
- OSS 直传与本地 mock 双模式对上层契约一致（上传返回 URL、播放签发 URL）
- 权限判定集中于后端 play-url 签发口，前端状态仅为展示

**Non-Goals:**
- 支付、订单、退款；VOD 转码与播放鉴权；视频时长解析；富文本；OSS 断点续传/分片 UI 进度以外的优化

## Decisions

### D1 路由前缀：小程序 `/courses`，管理端 `/admin/courses`
Nest 同 path+method 双控制器会先注册者吞掉请求，裸路径 `/courses` 无法同时挂公开与 admin 守卫。沿用 `/admin/login` 先例，管理端课程/章节/学员/设置全部置于 `/admin/courses/*` 与 `/admin/settings/*`；小程序公开接口用 `/courses/*`。备选（裸路径 + 路由级守卫混挂）被否：与 Phase 1 控制器级守卫风格冲突且易踩注册顺序坑。

### D2 播放权限单口收敛：`GET /courses/:id/chapters/:cid/play-url` 公开路由 + 可选 token
试看章节匿名签发；非试看解析 Bearer（复用 jwt service verify，失败视为匿名）后校验 enrollment。错误语义：课程不存在 16001、已下架且未购 16002、未登录需登录 10201 系列沿用、登录未购 16003。前端据本地登录态先行引导（未登录跳登录、未购弹名片），API 兜底。备选（ guarded 路由 + 试看单独路由）被否：两路由权限分散。

### D3 签名 URL：真实模式 OSS `signatureUrl` GET 3600s；mock 模式直接返回本地静态 URL
mock 文件由 Nest 静态托管 `/uploads/*`（express.static 指向 apps/api/uploads/），无过期但权限校验仍在签发口。凭证配置项（根 .env.local）：ALI_OSS_ACCESS_KEY_ID / SECRET / BUCKET / REGION；任一缺失即 mock 模式，启动日志明示。

### D4 上传链路：STS 临时凭证 + 浏览器 ali-oss 直传；mock 走 multipart 服务端落盘
`POST /admin/uploads/sts`（AdminAuthGuard）返回 `{mode:'oss', credentials:{accessKeyId,accessKeySecret,securityToken,expiration}, bucket, region, prefix}` 或 `{mode:'mock'}`。admin-web `utils/upload.ts`：mode=oss 用 ali-oss Browser SDK put 到 `courses/<kind>/<ts>-<rand>.<ext>`（资料文件用 `materials/<kind>/…` 同构前缀）；mode=mock 用 FormData POST `/admin/uploads/mock`。图片限 5MB、视频限 500MB、资料文档限 100MB 前端校验。备选（服务端中转 multipart 全模式）被否：大视频占用 API 带宽与内存。

### D5 数据模型（TypeORM，dev synchronize 与 Phase 1 一致；字段按设计稿修订）
- `courses`: title varchar(100)、cover_url varchar(500)、subtitle varchar(100) nullable（封面副标题/卖点，如「零基础可学」）、teacher varchar(50) nullable（讲师，如「林老师」）、description text nullable、payment_type enum('paid','free') default 'paid'、price decimal(10,2) default 0（payment_type=free 时强制 0）、status enum('on','off') default 'off'、BaseEntity 时间戳（列表「更新时间」列展示 updated_at）
- `chapters`: course_id FK CASCADE、title varchar(100)、description varchar(500) nullable（章节简介，播放页展示）、content_type enum('video','document') default 'video'（设计稿：「每个章节可独立选择视频或文档」）、file_url varchar(500)（视频或文档地址，取代原 video_url）、is_trial boolean default false、sort_order int default 0；索引 (course_id, sort_order)
- `course_enrollments`: course_id FK、user_id FK users、BaseEntity created_at 即 joined_at；UNIQUE(course_id, user_id)
- `materials`（设计稿新增，见 D10）: title varchar(100)、cover_url varchar(500)、file_url varchar(500)、file_meta varchar(100) nullable（展示串如「PDF · 128 页 · 2.4MB」，后台手填）、description text nullable、status enum('on','off') default 'off'、BaseEntity 时间戳
- `app_settings`: key varchar(50) unique、value varchar(255)；销售微信号 key=`sales_wechat`，无行视为未配置
章节不存时长（Non-Goal，「共 N 课时」= 章节数推导）；enrollment 硬删除（移出语义已确认）；资料不设价格与购买关系（Phase 2 一律免费，见 D10）。

### D6 详情页一次带全：详情响应含 chapters（带 state）+ sales_wechat + enrolled
减少小程序请求次数；state 枚举 `trial|unlocked|locked`，匿名时 unlocked 不出现。列表响应含分页包（沿用 students 列表 pagination 结构）。

### D7 管理后台页面与路由（按设计稿 333:10 修订：两步向导 + 资料管理 + 系统设置）
- `/courses` 列表页：标题搜索 + 付费类型筛选 + 状态筛选（类型列 Phase 2 恒显「视频」，类型筛选不做，见 D10）；表格列＝封面缩略/课程标题/类型/付费类型/价格/状态标签（已上架绿 #ECF8F2·#16845C，已下架灰）/更新时间/操作（编辑、上架|下架、学员管理 文字链）；分页「共 N 条记录 + 条/页 + 页码 + 前往」。~~顶部销售微信配置卡片~~ → 移至 `/settings`（设计稿列表页无该卡片且侧边栏有「系统设置」；此项覆盖 grilling 中「配置入口放课程列表页」的答案，实施前请用户复核）
- `/courses/create` 与 `/courses/:id/edit` 两步向导（同组件，step 参数区分）：**Step1 基本信息**（课程标题*、课程封面*上传「建议 16:9，JPG/PNG ≤5MB」、付费类型* radio 付费/免费、价格*（免费时禁用并锁 ¥0，helper「付费课程已启用价格输入」）、讲师、副标题卖点、课程简介 textarea；底部「保存草稿＋下一步」）；**Step2 课程内容**（`/courses/create?step=2` 或创建成功后的 `/courses/:id/edit?step=2`；章节卡片列表：序号/标题/简介/内容类型（视频|文档）/文件上传（文件名+大小回显）/试看开关/排序/删除，「＋ 新增章节」；底部「上一步＋保存草稿＋发布课程」）。保存草稿＝存为下架态；发布课程＝保存并置 status=on（替代原「创建默认下架后手动上架」的唯一路径，列表操作列仍可再下架）
- `/courses/:id/students` 学员管理页：课程上下文头（课程名+状态标签+「视频课程 · 共 N 课时」+「课程学员 N 人」）、搜索昵称/OpenID、表格列＝OpenID(掩码)/昵称/年级/专业/所属院校/加入时间/操作(移出)、「添加学员」按钮在筛选栏右侧
- `/courses/:id/students/add` 添加学员页：展示全部 active 且有学员档案的用户（含已加入者——灰底禁用勾选＋「已加入」标签＋「不可重复添加」提示，取代原「候选列表排除已 enroll」方案）、搜索昵称/OpenID + 年级/专业/院校筛选、表头全选（支持半选态）、底部确认条「已选择 N 位用户 / 仅将所选用户加入「课程名」」＋「取消＋确认添加（N 人）」
- `/materials` 资料管理页（设计稿侧边栏含此菜单但页面未出稿；列表结构比照课程列表简化：封面/标题/文件格式元信息/状态/更新时间/操作；创建编辑为单页表单：标题、封面、文件上传（PDF/DOC/ZIP ≤100MB）、file_meta、简介、上下架）
- `/settings` 系统设置页：销售微信号配置（读取/保存 app_settings.sales_wechat）；预留后续全局配置项
- 侧边栏导航按设计稿五项：首页/学员管理/课程管理/资料管理/系统设置；Phase 1 已有的「档案选项」菜单保留（设计稿未画，暂不入系统设置，后续阶段再归并）；品牌名「考研资料库」

### D8 小程序页面（按设计稿 333:11 修订）
- home 页重写：顶栏品牌标题「考研资料库」（24px w700）；搜索框 placeholder「搜索课程或资料」；内容类型 tabs **全部/课程/资料**（选中态 #2563EB w700 + 28×3 圆角下划线）——「全部」混排课程卡与资料卡，「课程」「资料」各自过滤；课程卡（88×86 #EFF5FF 占位封面或图片 + 「课程」tag + 标题 + meta「讲师 · N 课时 · 卖点」+ 价格 ¥N / 免费）；资料卡（88×88 图片封面 + 「资料」tag + 标题 + meta「PDF · 128 页 · 简介」+「下载资料」按钮 92×30 #EFF5FF）；onReachBottom 分页 + 下拉刷新；未登录可浏览
- `pages/course-detail`：封面区（有 cover 显图，无则 #EFF5FF 占位块渲染分类+标题+副标题）、信息卡（标题/价格/meta/简介）、目录卡（「课程目录 + 共 N 课时」；章节行＝序号 01 + 标题 + 试看 tag(#EFF5FF r4) 或锁图标；文档章节显示文档图标）、底部购买栏（付费未购＝价格+立即购买；已购＝已购买态；免费课程＝「免费 · 开始学习」直达播放，无购买概念）+ 微信名片弹窗组件
- `pages/course-player`：video 置顶（深色 #18243A 底）+ 当前章节卡（课程名 12px #2563EB / 章节标题 20px w700 / 状态 tag / 章节简介）+ 章节列表卡（当前项 #EFF5FF r8 高亮）；locked 点击按登录态引导；文档章节点击不进播放页，走 wx.downloadFile + wx.openDocument（权限规则与视频一致）
- services/course.ts（列表/详情/play-url）+ services/material.ts（资料列表/下载地址）对应 D2/D6/D10。tabBar 不变（首页/我的）

### D9 错误码 16000 段（shared-types error-codes.ts 追加）
16001 COURSE_NOT_FOUND、16002 COURSE_OFF_SHELF、16003 COURSE_NOT_PURCHASED、16004 CHAPTER_NOT_FOUND、16005 ENROLLMENT_EXISTS、16006 SALES_WECHAT_NOT_SET（仅提示不阻断）、16007 MATERIAL_NOT_FOUND、16008 MATERIAL_OFF_SHELF。

### D10 资料（materials）能力范围：Phase 2 仅免费文档下载，不与课程共表
设计稿出现第三类内容「资料」：首页资料 tab/资料卡（下载动作）、后台侧边栏「资料管理」、章节可为文档。取舍：**独立 `materials` 表**（不复用 courses 加 type 字段——资料无章节/讲师/付费概念，共表会让课程接口到处判 type）；**Phase 2 资料一律免费**（设计稿资料卡无价格元素，列表页脚注「免费内容价格均为 ¥0」仅约束课程付费类型）；下载需登录（与课程内容一致，防匿名抓取），签发短时下载地址复用 play-url 思路（`GET /materials/:id/download-url`）。课程列表页的「类型」列恒显「视频」、类型筛选器不实现（设计稿课程管理副标题「统一管理视频课程与文档资料」按「课程=视频、资料=文档，分两个菜单管理」解读；若用户想要统一列表需另行确认）。付费资料、资料下载计数、资料分类目录留待后续阶段。

### D11 付费类型（payment_type）与免费课程规则
设计稿创建页含「付费类型*：付费/免费」radio 与 helper「付费课程已启用价格输入」、列表页有「付费类型」列与筛选。规则：free → price 强制 0 且输入禁用；免费课程**不需要 enrollment**，全部章节对所有登录用户开放（含非试看章节，play-url 对登录用户直接签发；未登录仍引导登录，与试看章节匿名可播规则叠加后：试看章节任何人可播、免费课程其余章节登录可播）；详情页购买栏替换为「免费 · 开始学习」；首页/详情价格位显示「免费」。免费课程不产生 enrollment 记录，后台学员管理页对免费课程仍可用（管理员手动加人仅影响标记，不影响权限）——Phase 2 免费课程的「学员管理」入口保留但语义弱化。付费判定链不变：enrollment 存在 = 已购。

## 视觉规范（Figma 设计稿：小程序 333:11 / 管理后台 333:10）

来源：figma.com/design/99s4D5AQYVVTW52M7DZ2SR。品牌名统一为「考研资料库」（小程序首页顶栏 + 后台侧边栏 Brand）。实施时以下 token 与尺寸为准，设计稿未覆盖的页面（档案选项、登录、我的等）沿用 Phase 1 已实现的同源风格（#2563EB 主色体系已在迭代 #14 对齐侧边栏）。

### 通用 Design Token（双端一致）

| Token | 值 | 用途 |
|---|---|---|
| primary | #2563EB | 主按钮底/选中态文字/文字链/价格/图标强调 |
| primary-bg | #EFF5FF | 浅底 tag、选中背景、封面占位块、小程序选中章节行 |
| primary-bg-row | #F5F9FF | 后台表格选中行/悬停行 |
| page-bg | 小程序 #F7F8FA / 后台 #F5F7FA | 页面底色 |
| card-bg | #FFFFFF | 卡片/表格/侧边栏/顶栏 |
| radius | 小程序卡片 12、后台卡片与按钮 8、输入框 8、tag 4、章节行内高亮 8 | 圆角 |
| border | #E7EBF0 | 分割线/输入框描边/表格行底线/步骤连接线 |
| text-main | #182230 | 标题/正文 |
| text-sub | #667085 | 描述/次级文字/未选菜单 |
| text-placeholder | #98A2B3 | placeholder/翻页箭头/禁用提示 |
| disabled | 底 #F0F2F5 边 #CDD5DF 字 #667085 | 禁用勾选框/中性 tag（未加入、已下架） |
| success | 字 #16845C 底 #ECF8F2 | 「已上架」「已加入」tag |
| player | 底 #18243A、进度轨 #53617A、时间文字 #CDD5E2 | 播放页 |

### 字体层级

- 小程序：页面标题 24px w700；卡片/章节大标题 16-20px w700；正文 13-14px w400；meta 11-12px #667085；价格 20px w700 #2563EB；筛选 tab 14px（选中 w700 #2563EB + 28×3 r2 下划线）；tabBar 文字 11px（选中 #2563EB）
- 后台：页面 heading 24px w700 + 副描述 13px #667085；卡片节标题 16px w700；表单 label 14px w700（必填带红色 *，设计稿以「*」文本呈现）；输入文字 14px；表头 12px #667085 w400；表格正文 13px #182230（时间列 12px #667085）；按钮文字 14px w700（主按钮白字 #2563EB 底，次按钮 #182230 字白底 #E7EBF0 描边）；侧边栏菜单 14px（选中 w700 #2563EB 底 #EFF5FF，与 Phase 1 迭代 #14 实现一致）

### 后台框架（1440×900）

侧边栏 220px 白底：Brand 区 80px 高（book-open 图标 26 + 「考研资料库」17px w700）；菜单项 196×44 r8 间距 4；顶栏 56px 白底：左页面标题区、右「Avatar 28 圆形 #EFF5FF + 管理员 13px + 竖分割线 1×16 #E7EBF0 + 退出 13px #667085」；主内容区左右留白 28，Page heading 带右侧动作（主按钮 36 高或「← 返回课程管理」文字链 14px #2563EB）。

### 页面级规格

**后台·课程管理列表页（164:1172）**：heading「课程管理 / 统一管理视频课程与文档资料，维护价格和上架状态。」+ 右上「＋ 新增课程」主按钮 106×36。白卡 r8 内：筛选栏 80 高（搜索框 250×40「搜索课程标题」+ 下拉筛选 136-150×40：类型(不实现)/付费类型/状态 + 查询 60×36 主按钮 + 重置 60×36 次按钮）；表头 48 高 #F7F8FA；数据行 66 高 #E7EBF0 底线，封面缩略 46×44 r4 #EFF5FF（视频课程显示 circle-play 图标 #2563EB），状态 tag 49×23 r4，操作列三个文字链「编辑 / 下架|上架 / 学员管理」13px #2563EB；分页栏 80 高「共 N 条记录」13px + 条/页下拉 110×40 + ‹ 页码(当前 32×32 #2563EB r4 白字) › + 前往 N 页。页脚注 12px #98A2B3。

**后台·创建课程页 Step1 基本信息（164:1610）**：heading「创建课程 / 填写课程信息、上传内容并配置章节。」+「← 返回课程管理」。步骤条白卡 60 高：圆 28（当前 #2563EB 白字 w700，未完成白底 #E7EBF0 描边 #667085）+ 步骤名 14px + 连接线 96×1 #E7EBF0；步骤文案「1 基本信息 — 2 课程内容」。表单白卡：节标题「基本信息」16px w700；字段 label 14 w700 上置；输入框 1116×44 r8 #E7EBF0 描边；封面上传占位 1116×72 #F7F8FA r8（upload 图标 #2563EB + 「上传课程封面」13px #2563EB + 「建议 16:9，支持 JPG / PNG，最大 5MB」11px #98A2B3）；付费类型 radio（16 圆，选中 #2563EB 描边）付费/免费；价格 helper 12px #667085「付费课程已启用价格输入」；价格输入 200×44 前缀 ¥；简介 textarea 1116×84。底部动作条白卡 68 高右对齐：「保存草稿」次按钮 88×36 +「下一步」主按钮 74×36。

**后台·上传课件页 Step2 课程内容（164:758）**：heading「课程内容 / 创建课程 · <课程名>」；步骤条（已完成步骤＝圆 #EFF5FF 数字 #2563EB + 名称 #667085，当前步骤实心）。章节白卡：节头「课程章节 16px w700 / 每个章节可独立选择视频或文档，并上传对应内容。12px #667085」+ 右侧「共 N 个章节」12px；章节卡 1116×110 r8 #E7EBF0 描边：上行「序号 01 13px #667085 + 章节标题 label 13px w700 + 标题文本 13px」，下行上传区 1092×46 #F7F8FA r6（图标 #2563EB + 文件名 13px #182230 + 大小 12px #667085）；实施时在章节卡内补充：简介输入、内容类型切换（视频/文档）、试看 switch、删除按钮（设计稿未画出，功能上必需）。「＋ 新增章节」虚线行 1116×36 r6 文字 13px #2563EB。底部动作条：左「上一步」74×36，右「保存草稿 88×36 + 发布课程 88×36 主按钮」。

**后台·课程学员管理页（164:567）**：heading「学员管理 / 查看当前课程的学员信息与学习进度。」（学习进度为 Non-Goal，不实现进度列）+ 右上「← 返回课程管理」次按钮 140×36。白卡：课程上下文条 80 高（课程名 16px w700 + 状态 tag + 「视频课程 · 共 N 课时」12px #667085；右「课程学员 N 人」13px）；筛选栏（搜索 320×40「搜索昵称 / OpenID」+ 查询 + 重置 + 右侧「添加学员」次按钮 88×36）；表头列 OpenID/昵称/年级/专业/所属院校/加入时间/操作；行 64 高，OpenID 掩码显示（oK8xY5a…M2pQ9v），加入时间 12px #667085，操作「移出」按钮 58×32 r8 文字 13px #2563EB；分页同列表页。

**后台·课程添加学员页（164:348）**：heading「添加学员 / 从已有用户中选择学员加入当前课程，无需创建新账号。」+「← 返回学员管理」。白卡：课程上下文条 72 高（同上文 + 右「当前课程学员 N 人」）；筛选栏（搜索 280×40 + 年级/专业/院校三个下拉 140-180×40 + 查询/重置）；提示条 1164×40 #EFF5FF：左「勾选下方用户后，点击「确认添加」加入当前课程。」12px #2563EB + 右「已加入用户不可重复添加」12px #667085；表格首列勾选框 16×16 r3（选中 #2563EB 白勾，表头支持半选横线，已加入行禁用 #F0F2F5/#CDD5DF）；数据行 56 高，选中行底 #F5F9FF，已加入行底 #F7F8FA 字 #667085 + 状态 tag「已加入」#ECF8F2 + 「不可重复添加」11px #98A2B3，未加入 tag #F0F2F5/#667085；末列「是否已加入当前课程」。底部确认条 48 高：左「已选择 N 位用户 14px w700(数字) / 仅将所选用户加入「课程名」12px #667085」，右「取消 60×36 + 确认添加（N 人）142×36 主按钮」。

**小程序·首页（3:63，375×812）**：状态栏 44 + 顶栏 48（「考研资料库」24px w700 #182230）；内容区左右边距 16：搜索条 343×40 白底 r8 #E7EBF0 描边（search 图标 17 + placeholder「搜索课程或资料」13px #98A2B3）；分类 tabs 行高 31，间距 24（全部/课程/资料，选中 #2563EB w700 + 28×3 r2 下划线）；课程卡 343×136 白 r12（左封面 88×86 r8：图片或 #EFF5FF 文字占位「2027 · 考研英语 9px w700 + 长难句精讲 14px w700 #2563EB」；右内容区：tag「课程」38×23 r4 #EFF5FF 11px #2563EB、标题 16px w700 #182230 单行、meta 11px #667085「林老师 · 12 课时 · 零基础可学」、价格 20px w700 #2563EB）；资料卡 343×142 白 r12（左图 88×88 r10、tag「资料」、标题 16 w700、meta 11px #667085「PDF · 128 页 · 高频词汇精编」、「下载资料」按钮 92×30 r8 #EFF5FF：download 图标 14 #2563EB + 12px #2563EB）；卡片间距 16；tabBar 78 高白底（首页/我的，图标 22，文字 11px，选中 #2563EB）。

**小程序·课程详情页（3:179）**：封面区 343×156 r8（#EFF5FF 占位：分类 12px w700 #2563EB + 标题 24px w700 #2563EB + 副标题 12px #667085；有真实封面则整块显示图片）；信息卡 343 白 r12（标题 24px w700 #182230、价格行 ¥199 20px w700 #2563EB + 「林老师 · 12 课时」12px #667085、简介 12px #667085）；目录卡 343 白 r12（节头「课程目录 16px w700」+ 右「共 12 课时」12px #2563EB；章节行 311×37：序号「01」12px #98A2B3 + 标题 13px #182230 + 右侧状态——试看 tag 44×23 r4 #EFF5FF 11px #2563EB / 锁定 lock-keyhole 图标 14×14 #98A2B3）；底部购买栏 375×84 白底（主按钮 343×48 r8 #2563EB「立即购买」14px w700 白字；免费课程替换为「免费 · 开始学习」；已购显示已购买态）。

**小程序·播放视频页（3:233）**：播放器 375×211 #18243A（中央白色圆形播放键、左下「00:00 / 18:32」10px #CDD5E2、进度条轨 #53617A）；当前章节卡 343×175 白 r12（课程名 12px #2563EB、章节标题 20px w700 #182230、状态 tag 60×23 r4 #EFF5FF、简介 14px #667085）；章节列表卡 343×284 白 r12（章节项 311×60 r8：当前播放项底 #EFF5FF，其余白底；序号 + 标题 + 试看/锁定标记同详情页）。

### 设计稿与既有规范冲突的处理记录

1. 销售微信号入口：grilling 定为课程列表页顶部卡片，设计稿列表页无此卡片且侧边栏有「系统设置」→ 迁至 /settings（D7，需用户复核）。
2. 添加学员候选去重：原规范「排除已 enroll」，设计稿为「已加入者灰显禁用 + tag」→ 按设计稿修订（course-enrollment delta）。
3. 创建课程默认下架：原规范「创建后默认下架、列表手动上架」，设计稿 Step2 提供「发布课程」→ 保留默认下架（保存草稿），新增一步式「发布课程」动作（course-management delta）。
4. 章节字段：设计稿小程序播放页展示章节简介、章节可为文档，但后台章节卡未画简介/试看开关 → 字段保留并实施时在章节卡内补齐控件（D5/D7）。
5. 学员管理页副标题含「学习进度」→ 学习进度为 Non-Goal，Phase 2 不实现进度列。
6. 课程列表「类型」列/筛选 → 课程恒为视频类型，列保留恒显「视频」，筛选不实现（D10）。

## Risks / Trade-offs

- [STS 凭证泄露] → 策略限定 `oss:PutObject` 于 `courses/*` 与 `materials/*` 前缀、有效期 15 分钟、每次上传现取
- [浏览器直传大视频失败/慢] → ali-oss multipartUpload + 进度条；失败提示重试；mock 模式不受影响
- [视频格式不兼容小程序 video] → 后台上传校验扩展名 mp4/m4v + 文案提示 H.264；不做服务端转码（Non-Goal）
- [签名 URL 60 分钟过期打断长观看] → 播放器 onerror 时自动重新请求 play-url 续播
- [enrollment 并发重复添加] → DB 唯一约束兜底 + 16005 友好提示
- [mock 与真实模式 URL 契约漂移] → 上传/签发统一经 utils 层，页面不感知模式；集成验证脚本覆盖双模式
- [首页重写影响 Phase 1 home 内容] → 原 home 仅欢迎文案，无功能损失（已确认替换）
- [资料能力为设计稿推导补充，范围未经用户逐项确认] → D10 已收窄为「免费 + 独立表 + 登录下载」最小闭环；实施前随任务清单一起请用户过目，若要付费资料/统一内容模型再立后续变更
- [销售微信号配置入口从课程列表迁到系统设置页，与 grilling 结论不一致] → 已在 D7 与冲突记录中标注「需用户复核」；两方案后端同为 app_settings 单 key，迁移成本仅限前端入口
- [两步向导的「发布课程」绕过列表上架开关] → 状态字段单一来源（status），发布＝status=on 的快捷动作，列表开关行为不变

## Migration Plan

dev 环境 TypeORM synchronize 自动建五张新表（courses/chapters/course_enrollments/materials/app_settings）；无数据迁移。回滚 = 移除 course/material/upload 模块注册与前端路由，旧表不受影响。生产迁移不在本阶段范围（与 Phase 1 一致）。
