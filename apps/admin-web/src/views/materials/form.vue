<template>
  <div class="material-form-page">
    <!-- Page heading -->
    <div class="page-head">
      <div>
        <h2 class="page-title">{{ isEdit ? '编辑资料' : '新增资料' }}</h2>
        <p class="page-desc">填写资料信息，上传标题图与 PDF、PPT、图片内容。</p>
      </div>
      <el-button link type="primary" class="back-link" @click="router.push({ name: 'Materials' })">
        ← 返回资料管理
      </el-button>
    </div>

    <!-- 表单卡片 -->
    <el-card shadow="never" v-loading="loading">
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="form-body">
        <!-- 标题 -->
        <el-form-item prop="title">
          <template #label><span class="field-label">标题 <em class="req">*</em></span></template>
          <el-input v-model="form.title" placeholder="如：2027 考研英语核心词汇手册" maxlength="100" show-word-limit />
        </el-form-item>

        <!-- 资料简介 -->
        <el-form-item>
          <template #label><span class="field-label">资料简介</span></template>
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入资料简介"
          />
        </el-form-item>

        <!-- 标题图 -->
        <el-form-item prop="cover_url">
          <template #label><span class="field-label">标题图 <em class="req">*</em></span></template>
          <div class="cover-upload" @click="triggerCoverUpload">
            <template v-if="form.cover_url">
              <img :src="form.cover_url" class="cover-preview" @click.stop="triggerCoverUpload" />
              <div class="cover-actions" @click.stop>
                <el-button link type="primary" @click="triggerCoverUpload">替换</el-button>
                <el-button link class="btn-remove" @click="removeCover">删除</el-button>
              </div>
            </template>
            <template v-else>
              <div class="upload-action">
                <el-icon color="#2563eb" :size="18"><UploadFilled /></el-icon>
                <span class="upload-text">上传图片</span>
              </div>
              <span class="upload-hint">{{ SIZE_HINTS.cover }}</span>
            </template>
            <el-progress v-if="coverUploading" :percentage="coverProgress" :stroke-width="4" class="upload-progress" />
          </div>
          <input ref="coverInputRef" type="file" accept="image/*" hidden @change="onCoverSelected" />
        </el-form-item>

        <!-- 图文内容（富文本，选填；小程序端展示在文件上方） -->
        <el-form-item prop="content">
          <template #label>
            <div class="content-label-row">
              <span class="field-label">图文内容</span>
              <span class="content-hint">选填；小程序端展示在文件上方，插图自动上传（单张 ≤30MB）</span>
            </div>
          </template>
          <div class="editor-wrap">
            <Toolbar
              class="editor-toolbar"
              :editor="editorRef"
              :defaultConfig="toolbarConfig"
              mode="default"
            />
            <Editor
              class="editor-body"
              v-model="form.content"
              :defaultConfig="editorConfig"
              mode="default"
              @onCreated="onEditorCreated"
            />
          </div>
        </el-form-item>

        <!-- 内容文件（多文件） -->
        <el-form-item prop="files">
          <template #label>
            <div class="content-label-row">
              <span class="field-label">内容文件 <em class="req">*</em></span>
              <span class="content-hint">支持 PDF、PPTX、JPG / PNG；PDF / PPT 最大 100MB，单张图片最大 30MB</span>
            </div>
          </template>

          <div class="file-list">
            <!-- 已上传文件行 -->
            <div v-for="(file, index) in form.files" :key="file.file_url" class="file-row">
              <div class="file-type">
                <el-icon v-if="file.isImage" color="#2563eb" :size="21"><Picture /></el-icon>
                <span v-else class="file-ext">{{ file.ext }}</span>
              </div>
              <div class="file-details">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-meta">{{ file.meta }}</span>
              </div>
              <span class="file-status">已上传</span>
              <div class="file-actions">
                <el-button link type="primary" @click="triggerReplace(index)">替换</el-button>
                <el-button link class="btn-remove" @click="removeFile(index)">删除</el-button>
              </div>
              <el-progress
                v-if="fileUploading && replaceIndex === index"
                :percentage="fileProgress"
                :stroke-width="4"
                class="upload-progress"
              />
            </div>

            <!-- 继续上传（常驻，多文件） -->
            <div class="content-upload" @click="triggerAddUpload">
              <el-icon color="#2563eb" :size="18"><Plus /></el-icon>
              <span class="upload-text">继续上传 PDF / PPT / 图片</span>
              <el-progress
                v-if="fileUploading && replaceIndex === null"
                :percentage="fileProgress"
                :stroke-width="4"
                class="upload-progress"
              />
            </div>
          </div>
          <input ref="fileInputRef" type="file" accept=".pdf,.pptx,.jpg,.jpeg,.png" hidden @change="onContentFileSelected" />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 底部操作栏 -->
    <div class="action-bar">
      <el-button class="btn-plain" @click="router.push({ name: 'Materials' })">取消</el-button>
      <div class="action-right">
        <!-- 已发布过（上架/下架）：无草稿态，保存即直接生效变更 -->
        <el-button
          v-if="isPublished"
          type="primary"
          class="btn-publish"
          :loading="saving"
          @click="handleSave(false)"
        >
          {{ currentStatus === 'on' ? '发布变更' : '保存变更' }}
        </el-button>
        <template v-else>
          <el-button class="btn-plain" :loading="saving" @click="handleSave(false)">保存草稿</el-button>
          <el-button type="primary" class="btn-publish" :loading="saving" @click="handleSave(true)">发布资料</el-button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, shallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import '@wangeditor/editor/dist/css/style.css';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import * as materialApi from '@/api/material';
import type { CreateMaterialParams, MaterialFileParam } from '@/api/material';
import { uploadFile, formatSize, SIZE_HINTS } from '@/utils/upload';

const route = useRoute();
const router = useRouter();

const materialId = computed(() => (route.params.id ? Number(route.params.id) : 0));
const isEdit = computed(() => materialId.value > 0);

/** 文件行视图模型：size 非 null 表示本次会话新上传（保存时提交 file_name/file_size 由后端生成文件信息） */
interface FileRow {
  file_url: string;
  name: string;
  meta: string;
  size: number | null;
  ext: string;
  isImage: boolean;
}

const loading = ref(false);
const saving = ref(false);
const formRef = ref<FormInstance>();
const currentStatus = ref<'draft' | 'on' | 'off'>('draft');
/** 是否发布过（上架/下架）：发布过则无草稿，保存直接生效变更 */
const isPublished = computed(() => isEdit.value && currentStatus.value !== 'draft');

const form = reactive({
  title: '',
  description: '',
  cover_url: '',
  content: '',
  files: [] as FileRow[],
});

// ---------- 富文本编辑器（wangeditor） ----------

const editorRef = shallowRef<IDomEditor>();
const toolbarConfig: Partial<IToolbarConfig> = {
  // 不开放视频：小程序详情页以 rich-text 渲染，外链视频无法播放
  excludeKeys: ['group-video'],
};
const editorConfig: Partial<IEditorConfig> = {
  placeholder: '请输入图文内容，可直接粘贴文字 / 图片…',
  MENU_CONF: {
    uploadImage: {
      // 插图复用资料上传通道（OSS 直传 / mock 落盘），插入返回的 URL
      async customUpload(
        file: File,
        insertFn: (url: string, alt?: string, href?: string) => void,
      ) {
        if (file.size > 30 * 1024 * 1024) {
          ElMessage.error('单张图片最大 30MB');
          return;
        }
        try {
          const res = await uploadFile('material', file);
          insertFn(res.url, file.name, res.url);
        } catch (err: any) {
          ElMessage.error(err?.message || '图片上传失败');
        }
      },
    },
  },
};

function onEditorCreated(editor: IDomEditor) {
  editorRef.value = editor;
}

onBeforeUnmount(() => {
  editorRef.value?.destroy();
});

/** 编辑器空内容（<p><br></p> 等空壳 HTML）归一化为 null，避免存无意义内容 */
function normalizeContent(html: string): string | null {
  if (!html) return null;
  const hasMedia = /<(img|video|iframe|table)\b/i.test(html);
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  return hasMedia || text ? html : null;
}

const coverInputRef = ref<HTMLInputElement>();
const fileInputRef = ref<HTMLInputElement>();
const coverUploading = ref(false);
const coverProgress = ref(0);
const fileUploading = ref(false);
const fileProgress = ref(0);
// null = 继续上传（追加）；数字 = 替换对应行
const replaceIndex = ref<number | null>(null);

const rules: FormRules = {
  title: [{ required: true, message: '请输入资料标题', trigger: 'blur' }],
  cover_url: [{ required: true, message: '请上传标题图', trigger: 'change' }],
  files: [
    {
      validator: (_rule, value: FileRow[], callback) => {
        if (!value || value.length === 0) return callback(new Error('请上传内容文件'));
        callback();
      },
      trigger: 'change',
    },
  ],
};

// ---------- 文件行构造 ----------

function makeRow(
  url: string,
  name: string | null | undefined,
  meta: string | null | undefined,
  size: number | null,
): FileRow {
  const displayName = name || url.split('?')[0].split('/').pop() || '';
  const ext = displayName.includes('.') ? (displayName.split('.').pop() || '').toUpperCase() : '';
  return {
    file_url: url,
    name: displayName,
    meta: meta || '文件信息生成中',
    size,
    ext,
    isImage: ['JPG', 'JPEG', 'PNG'].includes(ext),
  };
}

// ---------- 上传 ----------

function triggerCoverUpload() {
  coverInputRef.value?.click();
}

function triggerAddUpload() {
  if (fileUploading.value) return;
  replaceIndex.value = null;
  fileInputRef.value?.click();
}

function triggerReplace(index: number) {
  if (fileUploading.value) return;
  replaceIndex.value = index;
  fileInputRef.value?.click();
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
    formRef.value?.validateField('cover_url');
    ElMessage.success('标题图上传成功');
  } catch (err: any) {
    ElMessage.error(err?.message || '标题图上传失败');
  } finally {
    coverUploading.value = false;
  }
}

/** 内容文件限制：PDF / PPTX ≤100MB，JPG/PNG ≤30MB */
function checkContentFile(file: File): string | null {
  const name = file.name.toLowerCase();
  const isPdf = name.endsWith('.pdf');
  const isPptx = name.endsWith('.pptx');
  const isImage = /\.(jpe?g|png)$/.test(name);
  if (!isPdf && !isPptx && !isImage) return '仅支持 PDF、PPTX、JPG / PNG 文件';
  if ((isPdf || isPptx) && file.size > 100 * 1024 * 1024) return 'PDF / PPT 最大 100MB';
  if (isImage && file.size > 30 * 1024 * 1024) return '单张图片最大 30MB';
  return null;
}

async function onContentFileSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  const invalid = checkContentFile(file);
  if (invalid) {
    ElMessage.error(invalid);
    return;
  }
  const target = replaceIndex.value;
  fileUploading.value = true;
  fileProgress.value = 0;
  try {
    const res = await uploadFile('material', file, (p) => (fileProgress.value = p));
    // 本地即时预览文件信息（与后端生成规则一致），保存后以后端返回的 file_meta 为准
    const ext = (res.filename.split('.').pop() || '').toUpperCase();
    const row = makeRow(res.url, res.filename, `${ext} · ${formatSize(res.size)}`, res.size);
    if (target !== null && target < form.files.length) {
      form.files.splice(target, 1, row);
    } else {
      form.files.push(row);
    }
    formRef.value?.validateField('files');
    ElMessage.success('上传成功');
  } catch (err: any) {
    ElMessage.error(err?.message || '上传失败');
  } finally {
    fileUploading.value = false;
    replaceIndex.value = null;
  }
}

function removeCover() {
  form.cover_url = '';
}

function removeFile(index: number) {
  form.files.splice(index, 1);
  formRef.value?.validateField('files');
}

// ---------- 保存 / 发布 ----------

async function handleSave(publish: boolean) {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    // 新上传文件带 file_name/file_size（后端生成文件信息）；已存在文件仅带 file_url（后端保留原文件信息）
    const files: MaterialFileParam[] = form.files.map((f) =>
      f.size !== null
        ? { file_url: f.file_url, file_name: f.name, file_size: f.size }
        : { file_url: f.file_url, file_name: f.name || undefined },
    );
    const payload: CreateMaterialParams = {
      title: form.title.trim(),
      description: form.description || undefined,
      cover_url: form.cover_url || null,
      files,
      // 清空后提交 null（后端置空），避免残留旧内容
      content: normalizeContent(form.content),
    };

    let id = materialId.value;
    let status = currentStatus.value;
    if (id) {
      const updated = await materialApi.updateMaterial(id, payload);
      status = updated.status;
    } else {
      const created = await materialApi.createMaterial(payload);
      id = created.id;
      status = created.status;
    }

    if (publish && status !== 'on') {
      await materialApi.updateMaterialStatus(id, 'on');
    }
    const msg = publish
      ? '资料已发布'
      : isPublished.value
        ? currentStatus.value === 'on'
          ? '变更已发布'
          : '变更已保存'
        : '草稿已保存';
    ElMessage.success(msg);
    router.push({ name: 'Materials' });
  } catch (err: any) {
    if (err?.message) ElMessage.error(err.message);
  } finally {
    saving.value = false;
  }
}

// ---------- 加载 ----------

async function loadDetail() {
  if (!isEdit.value) return;
  loading.value = true;
  try {
    const detail = await materialApi.getMaterialDetail(materialId.value);
    form.title = detail.title;
    form.description = detail.description || '';
    form.cover_url = detail.cover_url || '';
    form.content = detail.content || '';
    form.files = (detail.files || []).map((f) => makeRow(f.file_url, f.file_name, f.file_meta, null));
    currentStatus.value = detail.status;
  } catch (error) {
    console.error('Load material failed:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(loadDetail);
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

/* ---------- 表单 ---------- */
.form-body {
  max-width: 880px;

  :deep(.el-form-item__label) {
    margin-bottom: 8px;
  }

  :deep(.el-input__wrapper) {
    min-height: 44px;
    border-radius: 8px;
    box-shadow: 0 0 0 1px #e7ebf0 inset;
  }

  :deep(.el-textarea__inner) {
    border-radius: 8px;
    box-shadow: 0 0 0 1px #e7ebf0 inset;
  }
}

.field-label {
  font-size: 14px;
  font-weight: 700;
  color: #182230;
  line-height: 1.5;

  .req {
    color: #f04438;
    font-style: normal;
  }
}

/* ---------- 标题图上传 ---------- */
.cover-upload {
  position: relative;
  width: 100%;
  min-height: 84px;
  background: #f7f8fa;
  border: 1px dashed #e7ebf0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 5px;
  cursor: pointer;
  padding: 12px;
  box-sizing: border-box;

  &:has(.cover-preview) {
    flex-direction: row;
    gap: 12px;
  }
}

.upload-action {
  display: flex;
  align-items: center;
  gap: 7px;
}

.upload-text {
  font-size: 13px;
  color: #2563eb;
}

.upload-hint {
  font-size: 11px;
  color: #98a2b3;
}

.cover-preview {
  width: 96px;
  height: 54px;
  border-radius: 4px;
  object-fit: cover;
}

.cover-actions {
  display: flex;
  gap: 16px;
}

.btn-remove {
  color: #667085;
}

.upload-progress {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 4px;
}

/* ---------- 图文内容编辑器 ---------- */
.editor-wrap {
  width: 100%;
  border: 1px solid #e7ebf0;
  border-radius: 8px;
  overflow: hidden;

  .editor-toolbar {
    border-bottom: 1px solid #e7ebf0;
  }

  .editor-body {
    height: 300px !important;
    overflow-y: hidden !important;
  }
}

/* ---------- 内容多文件 ---------- */
.content-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  .content-hint {
    font-size: 11px;
    color: #667085;
    font-weight: 400;
  }
}

.file-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-row {
  position: relative;
  width: 100%;
  height: 64px;
  background: #ffffff;
  border: 1px solid #e7ebf0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  box-sizing: border-box;
}

.file-type {
  width: 40px;
  height: 40px;
  background: #eff5ff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .file-ext {
    font-size: 11px;
    font-weight: 700;
    color: #2563eb;
  }
}

.file-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;

  .file-name {
    font-size: 13px;
    color: #182230;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-meta {
    font-size: 11px;
    color: #667085;
  }
}

.file-status {
  flex-shrink: 0;
  background: #ecf8f2;
  color: #16845c;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
}

.file-actions {
  flex-shrink: 0;
  display: flex;
  gap: 16px;
  padding-left: 8px;

  :deep(.el-button) {
    font-size: 13px;
  }
}

.content-upload {
  position: relative;
  width: 100%;
  height: 44px;
  background: #f7f8fa;
  border: 1px dashed #e7ebf0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-sizing: border-box;

  &:hover {
    border-color: #2563eb;
  }
}

/* ---------- 底部操作栏 ---------- */
.action-bar {
  height: 68px;
  background: #ffffff;
  border-radius: 8px;
  padding: 0 24px;
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}

.action-right {
  display: flex;
  gap: 12px;
}

.btn-plain {
  height: 36px;
  padding: 0 16px;
  border: 1px solid #e7ebf0;
  border-radius: 8px;
  color: #182230;
  font-weight: 700;
}

.btn-publish {
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  font-weight: 700;
}
</style>
