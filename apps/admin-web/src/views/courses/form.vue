<template>
  <div class="course-form">
    <!-- Page heading -->
    <div class="page-head">
      <div>
        <h2 class="page-title">{{ step === 1 ? (isEdit ? '编辑课程' : '创建课程') : '课程内容' }}</h2>
        <p class="page-desc">
          {{ step === 1 ? '填写课程信息、上传内容并配置章节。' : `创建课程 · ${form.title || '未命名课程'}` }}
        </p>
      </div>
      <el-button link type="primary" class="back-link" @click="router.push({ name: 'Courses' })">
        ← 返回课程管理
      </el-button>
    </div>

    <!-- 步骤条 -->
    <el-card shadow="never" class="steps-card">
      <div class="steps">
        <div class="step" :class="stepClass(1)">
          <span class="step-num">1</span>
          <span class="step-name">基本信息</span>
        </div>
        <div class="step-line" :class="{ 'step-line-done': step > 1 }"></div>
        <div class="step" :class="stepClass(2)">
          <span class="step-num">2</span>
          <span class="step-name">课程内容</span>
        </div>
      </div>
    </el-card>

    <!-- Step 1：基本信息 -->
    <el-card v-if="step === 1" shadow="never" v-loading="loading">
      <h3 class="section-title">基本信息</h3>
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="form-body">
        <el-form-item label="课程标题" prop="title" required>
          <el-input v-model="form.title" placeholder="请输入课程标题" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item label="课程封面">
          <div class="upload-area" @click="triggerCoverUpload">
            <template v-if="form.cover_url">
              <img :src="form.cover_url" class="cover-preview" />
              <div class="upload-info">
                <span class="upload-name">{{ coverMeta.name }}</span>
                <span class="upload-size">{{ coverMeta.size }}</span>
                <!-- 已上传态：替换=重选文件，删除=清空（保存后生效）；.stop 防止冒泡触发整区点击 -->
                <div class="cover-actions" @click.stop>
                  <el-button link type="primary" @click="triggerCoverUpload">替换</el-button>
                  <el-button link type="danger" @click="handleRemoveCover">删除</el-button>
                </div>
              </div>
            </template>
            <template v-else>
              <el-icon color="#2563eb" :size="18"><UploadFilled /></el-icon>
              <span class="upload-text">上传课程封面</span>
              <span class="upload-hint">{{ SIZE_HINTS.cover }}</span>
            </template>
            <el-progress
              v-if="coverUploading"
              :percentage="coverProgress"
              :stroke-width="4"
              class="upload-progress"
            />
          </div>
          <input ref="coverInputRef" type="file" accept="image/*" hidden @change="onCoverSelected" />
        </el-form-item>

        <el-form-item label="付费类型" prop="payment_type" required>
          <el-radio-group v-model="form.payment_type" @change="onPaymentTypeChange">
            <el-radio value="paid">付费</el-radio>
            <el-radio value="free">免费</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="价格（元）" prop="price">
          <el-input
            v-model.number="form.price"
            type="number"
            :min="0"
            :disabled="form.payment_type === 'free'"
            style="width: 200px"
          >
            <template #prefix>¥</template>
          </el-input>
          <span class="field-helper">
            {{ form.payment_type === 'free' ? '免费课程价格锁定为 ¥0' : '付费课程已启用价格输入' }}
          </span>
        </el-form-item>

        <div class="form-row">
          <el-form-item label="讲师" class="form-col">
            <el-input v-model="form.teacher" placeholder="如：林老师" maxlength="50" />
          </el-form-item>
          <el-form-item label="副标题（卖点）" class="form-col">
            <el-input v-model="form.subtitle" placeholder="如：零基础可学" maxlength="100" />
          </el-form-item>
        </div>

        <el-form-item label="课程简介">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入课程简介（纯文本）"
          />
        </el-form-item>
      </el-form>

      <div class="action-bar">
        <!-- 已发布（上/下架）课程第一步只留「下一步」，基本信息变更随第二步「发布变更/保存变更」一并提交 -->
        <el-button v-if="!isPublished" :loading="saving" @click="handleSaveDraft">保存草稿</el-button>
        <el-button type="primary" :loading="saving" @click="handleNextStep">下一步</el-button>
      </div>
    </el-card>

    <!-- Step 2：课程内容 -->
    <el-card v-else shadow="never" v-loading="loading">
      <div class="chapters-head">
        <div>
          <h3 class="section-title">课程章节</h3>
          <p class="section-desc">每个章节可独立选择视频或文档，并上传对应内容。</p>
        </div>
        <span class="chapters-count">共 {{ chapters.length }} 个章节</span>
      </div>

      <div v-for="(ch, index) in chapters" :key="ch.key" class="chapter-card">
        <div class="chapter-row-top">
          <span class="chapter-index">{{ String(index + 1).padStart(2, '0') }}</span>
          <el-input v-model="ch.title" placeholder="章节标题" maxlength="100" class="chapter-title-input" />
          <el-radio-group v-model="ch.content_type" size="small" class="chapter-type">
            <el-radio-button value="video">视频</el-radio-button>
            <el-radio-button value="document">文档</el-radio-button>
          </el-radio-group>
          <div class="chapter-trial">
            <span class="trial-label">试看</span>
            <el-switch v-model="ch.is_trial" />
          </div>
          <div class="chapter-ops">
            <el-button
              link
              :disabled="index === 0"
              @click="moveChapter(index, -1)"
            >↑</el-button>
            <el-button
              link
              :disabled="index === chapters.length - 1"
              @click="moveChapter(index, 1)"
            >↓</el-button>
            <el-button link type="danger" @click="removeChapter(index)">删除</el-button>
          </div>
        </div>
        <el-input
          v-model="ch.description"
          placeholder="章节简介（选填，展示在小程序播放页）"
          maxlength="500"
          class="chapter-desc-input"
        />
        <div class="chapter-upload" @click="triggerChapterUpload(index)">
          <template v-if="ch.file_url">
            <el-icon color="#2563eb" :size="16">
              <VideoPlay v-if="ch.content_type === 'video'" />
              <Document v-else />
            </el-icon>
            <span class="upload-name">{{ ch.fileName || ch.file_url }}</span>
            <span class="upload-size">{{ ch.fileSize }}</span>
            <el-button link type="primary" @click.stop="triggerChapterUpload(index)">重新上传</el-button>
          </template>
          <template v-else>
            <el-icon color="#2563eb" :size="16"><UploadFilled /></el-icon>
            <span class="upload-text">
              上传{{ ch.content_type === 'video' ? '视频' : '文档' }}课件
            </span>
            <span class="upload-hint">
              {{ ch.content_type === 'video' ? SIZE_HINTS.video : SIZE_HINTS.document }}
            </span>
          </template>
          <el-progress
            v-if="ch.uploading"
            :percentage="ch.progress"
            :stroke-width="4"
            class="upload-progress"
          />
        </div>
      </div>

      <div class="chapter-add" @click="addChapter">＋ 新增章节</div>

      <div class="action-bar action-bar-between">
        <el-button @click="goStep(1)">上一步</el-button>
        <!-- 未发布过：草稿 / 发布双操作；发布过：仅直接发布变更 -->
        <div v-if="!isPublished">
          <el-button :loading="saving" @click="handleSaveDraft">保存草稿</el-button>
          <el-button type="primary" :loading="publishing" @click="handlePublish">发布课程</el-button>
        </div>
        <el-button v-else type="primary" :loading="saving" @click="handleSaveChanges">
          {{ currentStatus === 'on' ? '发布变更' : '保存变更' }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import * as courseApi from '@/api/course';
import type { ChapterContentType } from '@/api/course';
import { uploadFile, formatSize, SIZE_HINTS } from '@/utils/upload';

interface ChapterRow {
  key: number;
  id?: number;
  title: string;
  description: string;
  content_type: ChapterContentType;
  file_url: string;
  fileName: string;
  fileSize: string;
  is_trial: boolean;
  uploading: boolean;
  progress: number;
}

const route = useRoute();
const router = useRouter();

const courseId = computed(() => (route.params.id ? Number(route.params.id) : 0));
const isEdit = computed(() => courseId.value > 0);
const step = computed(() => Number(route.query.step || 1));

const loading = ref(false);
const saving = ref(false);
const publishing = ref(false);
const formRef = ref<FormInstance>();
const currentStatus = ref<'draft' | 'on' | 'off'>('draft');
/** 是否发布过（上架/下架）：发布过则无草稿，保存直接生效变更 */
const isPublished = computed(() => isEdit.value && currentStatus.value !== 'draft');

const form = reactive({
  title: '',
  cover_url: '',
  subtitle: '',
  teacher: '',
  description: '',
  payment_type: 'paid' as 'paid' | 'free',
  price: 0,
});

const coverMeta = reactive({ name: '', size: '' });
const coverUploading = ref(false);
const coverProgress = ref(0);
const coverInputRef = ref<HTMLInputElement>();

const chapters = ref<ChapterRow[]>([]);
let chapterKeySeed = 0;
let removedChapterIds: number[] = [];

const rules: FormRules = {
  title: [{ required: true, message: '请输入课程标题', trigger: 'blur' }],
  payment_type: [{ required: true, message: '请选择付费类型', trigger: 'change' }],
  price: [
    {
      validator: (_rule, value, callback) => {
        if (form.payment_type === 'free') return callback();
        // 付费课程价格必须大于 0（!(>0) 同时拦截 NaN/负数/0/空值）
        if (value === null || value === undefined || value === '' || !(Number(value) > 0)) {
          return callback(new Error('付费课程价格必须大于 0'));
        }
        callback();
      },
      // 不在 blur/change 时触发，仅点击「下一步」「保存草稿」调用 form.validate() 时校验
      trigger: 'none',
    },
  ],
};

function stepClass(n: number) {
  if (n === step.value) return 'step-current';
  if (n < step.value) return 'step-done';
  return 'step-todo';
}

function goStep(n: number) {
  router.replace({
    name: isEdit.value ? 'CourseEdit' : 'CourseCreate',
    params: isEdit.value ? { id: courseId.value } : undefined,
    query: { step: n },
  });
}

function onPaymentTypeChange() {
  if (form.payment_type === 'free') {
    form.price = 0;
  }
}

// ---------- 封面上传 ----------

function triggerCoverUpload() {
  coverInputRef.value?.click();
}

async function onCoverSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  coverUploading.value = true;
  coverProgress.value = 0;
  try {
    const res = await uploadFile('cover', file, (p) => (coverProgress.value = p));
    form.cover_url = res.url;
    coverMeta.name = res.filename;
    coverMeta.size = formatSize(res.size);
    ElMessage.success('封面上传成功');
  } catch (err: any) {
    ElMessage.error(err?.message || '封面上传失败');
  } finally {
    coverUploading.value = false;
  }
}

/** 删除当前封面：仅清空表单预览，点保存/发布后 cover_url=null 落库；发布校验会拦截无封面课程 */
function handleRemoveCover() {
  form.cover_url = '';
  coverMeta.name = '';
  coverMeta.size = '';
}

// ---------- 章节 ----------

function addChapter() {
  chapters.value.push({
    key: ++chapterKeySeed,
    title: '',
    description: '',
    content_type: 'video',
    file_url: '',
    fileName: '',
    fileSize: '',
    is_trial: false,
    uploading: false,
    progress: 0,
  });
}

function removeChapter(index: number) {
  const [removed] = chapters.value.splice(index, 1);
  if (removed?.id) removedChapterIds.push(removed.id);
}

function moveChapter(index: number, delta: number) {
  const target = index + delta;
  const list = chapters.value;
  [list[index], list[target]] = [list[target], list[index]];
}

const chapterInputRefs: Record<number, HTMLInputElement | undefined> = {};

function triggerChapterUpload(index: number) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = chapters.value[index].content_type === 'video' ? 'video/*' : '';
  chapterInputRefs[index] = input;
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    const ch = chapters.value[index];
    const kind = ch.content_type === 'video' ? 'video' : 'document';
    ch.uploading = true;
    ch.progress = 0;
    try {
      const res = await uploadFile(kind, file, (p) => (ch.progress = p));
      ch.file_url = res.url;
      ch.fileName = res.filename;
      ch.fileSize = formatSize(res.size);
      ElMessage.success('课件上传成功');
    } catch (err: any) {
      ElMessage.error(err?.message || '课件上传失败');
    } finally {
      ch.uploading = false;
    }
  };
  input.click();
}

// ---------- 保存 ----------

function collectCoursePayload(): courseApi.CreateCourseParams {
  return {
    title: form.title.trim(),
    // 显式传 null：删除封面后保存要把库里的 cover_url 清掉（undefined 会被 JSON 序列化丢弃、服务端保持原值）
    cover_url: form.cover_url || null,
    subtitle: form.subtitle || undefined,
    teacher: form.teacher || undefined,
    description: form.description || undefined,
    payment_type: form.payment_type,
    price: form.payment_type === 'free' ? 0 : Number(form.price) || 0,
  };
}

/** 保存课程基本信息，返回课程 id（新建则跳转编辑路由） */
async function saveCourseBase(): Promise<number> {
  if (isEdit.value) {
    await courseApi.updateCourse(courseId.value, collectCoursePayload());
    return courseId.value;
  }
  const created = await courseApi.createCourse(collectCoursePayload());
  return created.id;
}

/** 同步章节：删除移除项 → 创建/更新 → 排序 */
async function saveChapters(id: number) {
  for (const removedId of removedChapterIds) {
    await courseApi.deleteChapter(id, removedId);
  }
  removedChapterIds = [];

  for (const row of chapters.value) {
    if (!row.title.trim()) {
      throw new Error('存在未填写标题的章节');
    }
    const payload: courseApi.CreateChapterParams = {
      title: row.title.trim(),
      description: row.description || undefined,
      content_type: row.content_type,
      file_url: row.file_url || undefined,
      is_trial: row.is_trial,
    };
    if (row.id) {
      await courseApi.updateChapter(id, row.id, payload);
    } else {
      const created = await courseApi.createChapter(id, payload);
      row.id = created.id;
    }
  }

  if (chapters.value.length > 0) {
    await courseApi.sortChapters(
      id,
      chapters.value.map((c) => c.id as number),
    );
  }
}

/** 保存课程基础信息（step1 校验后）与章节，成功后提示 successMsg */
async function saveAll(successMsg: string) {
  if (step.value === 1) {
    if (!formRef.value) return;
    const valid = await formRef.value.validate().catch(() => false);
    if (!valid) return;
  }
  saving.value = true;
  try {
    const id = await saveCourseBase();
    if (step.value === 2) {
      await saveChapters(id);
    }
    ElMessage.success(successMsg);
    // 保存草稿/发布变更成功后统一返回课程列表
    router.push({ name: 'Courses' });
  } catch (err: any) {
    if (err?.message) ElMessage.error(err.message);
  } finally {
    saving.value = false;
  }
}

function handleSaveDraft() {
  return saveAll('草稿已保存');
}

/** 发布过的课程编辑：无草稿，保存即直接生效变更 */
function handleSaveChanges() {
  return saveAll(currentStatus.value === 'on' ? '变更已发布' : '变更已保存');
}

async function handleNextStep() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    const id = await saveCourseBase();
    if (!isEdit.value) {
      router.replace({ name: 'CourseEdit', params: { id }, query: { step: 2 } });
    } else {
      goStep(2);
    }
  } catch (err: any) {
    if (err?.message) ElMessage.error(err.message);
  } finally {
    saving.value = false;
  }
}

async function handlePublish() {
  try {
    await ElMessageBox.confirm('发布后课程将在小程序端上架可见，确认发布？', '发布课程', {
      type: 'info',
    });
  } catch {
    return;
  }
  publishing.value = true;
  try {
    const id = await saveCourseBase();
    await saveChapters(id);
    await courseApi.publishCourse(id);
    ElMessage.success('课程已发布');
    router.push({ name: 'Courses' });
  } catch (err: any) {
    if (err?.message) ElMessage.error(err.message);
  } finally {
    publishing.value = false;
  }
}

// ---------- 加载 ----------

async function loadDetail() {
  if (!isEdit.value) return;
  loading.value = true;
  try {
    const detail = await courseApi.getCourseDetail(courseId.value);
    currentStatus.value = detail.status;
    form.title = detail.title;
    form.cover_url = detail.cover_url || '';
    form.subtitle = detail.subtitle || '';
    form.teacher = detail.teacher || '';
    form.description = detail.description || '';
    form.payment_type = detail.payment_type;
    form.price = Number(detail.price);
    if (detail.cover_url) {
      coverMeta.name = detail.cover_url.split('/').pop() || '';
      coverMeta.size = '';
    }
    chapters.value = detail.chapters.map((ch) => ({
      key: ++chapterKeySeed,
      id: ch.id,
      title: ch.title,
      description: ch.description || '',
      content_type: ch.content_type,
      file_url: ch.file_url || '',
      fileName: ch.file_url ? ch.file_url.split('/').pop() || '' : '',
      fileSize: '',
      is_trial: ch.is_trial,
      uploading: false,
      progress: 0,
    }));
  } catch (error) {
    console.error('Load course failed:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  // 新建模式直接进入 step1；编辑模式按 query 定位
  if (!isEdit.value && step.value !== 1) {
    router.replace({ name: 'CourseCreate', query: { step: 1 } });
    return;
  }
  loadDetail();
});
</script>

<style scoped lang="scss">
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;

  .page-title {
    font-size: 24px;
    font-weight: 700;
    color: #182230;
    margin: 0;
  }

  .page-desc {
    font-size: 13px;
    color: #667085;
    margin: 6px 0 0;
  }

  .back-link {
    font-size: 14px;
  }
}

/* ---------- 步骤条 ---------- */
.steps-card {
  margin-bottom: 16px;

  :deep(.el-card__body) {
    padding: 16px 24px;
  }
}

.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.step {
  display: flex;
  align-items: center;
  gap: 8px;

  .step-num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    box-sizing: border-box;
  }

  .step-name {
    font-size: 14px;
  }
}

.step-current {
  .step-num {
    background: #2563eb;
    color: #ffffff;
  }
  .step-name {
    color: #182230;
    font-weight: 700;
  }
}

.step-done {
  .step-num {
    background: #eff5ff;
    color: #2563eb;
  }
  .step-name {
    color: #667085;
  }
}

.step-todo {
  .step-num {
    background: #ffffff;
    border: 1px solid #e7ebf0;
    color: #667085;
  }
  .step-name {
    color: #667085;
  }
}

.step-line {
  width: 96px;
  height: 1px;
  background: #e7ebf0;
  margin: 0 16px;
}

.step-line-done {
  background: #2563eb;
}

/* ---------- 表单 ---------- */
.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #182230;
  margin: 0 0 16px;
}

.section-desc {
  font-size: 12px;
  color: #667085;
  margin: 4px 0 0;
}

.form-body {
  max-width: 720px;
}

.form-row {
  display: flex;
  gap: 16px;

  .form-col {
    flex: 1;
  }
}

.field-helper {
  margin-left: 12px;
  font-size: 12px;
  color: #667085;
}

/* ---------- 上传区 ---------- */
.upload-area {
  position: relative;
  width: 100%;
  min-height: 72px;
  background: #f7f8fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  padding: 12px;
  box-sizing: border-box;
}

.cover-preview {
  width: 96px;
  height: 54px;
  border-radius: 4px;
  object-fit: cover;
}

.upload-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cover-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.upload-text {
  font-size: 13px;
  color: #2563eb;
}

.upload-hint {
  font-size: 11px;
  color: #98a2b3;
}

.upload-name {
  font-size: 13px;
  color: #182230;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-size {
  font-size: 12px;
  color: #667085;
}

.upload-progress {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 4px;
}

/* ---------- 章节 ---------- */
.chapters-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;

  .chapters-count {
    font-size: 12px;
    color: #667085;
  }
}

.chapter-card {
  border: 1px solid #e7ebf0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.chapter-row-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chapter-index {
  font-size: 13px;
  color: #667085;
  flex-shrink: 0;
}

.chapter-title-input {
  flex: 1;
}

.chapter-type {
  flex-shrink: 0;
}

.chapter-trial {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;

  .trial-label {
    font-size: 13px;
    color: #667085;
  }
}

.chapter-ops {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.chapter-desc-input {
  margin-top: 10px;
}

.chapter-upload {
  position: relative;
  margin-top: 10px;
  min-height: 46px;
  background: #f7f8fa;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  box-sizing: border-box;
}

.chapter-add {
  height: 36px;
  border: 1px dashed #cdd5df;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #2563eb;
  cursor: pointer;
  margin-bottom: 16px;

  &:hover {
    border-color: #2563eb;
    background: #f5f9ff;
  }
}

/* ---------- 动作条 ---------- */
.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #e7ebf0;
  padding-top: 16px;
  margin-top: 8px;
}

.action-bar-between {
  justify-content: space-between;
}
</style>
