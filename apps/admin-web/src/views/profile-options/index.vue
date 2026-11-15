<template>
  <div class="profile-options-page" v-loading="loading">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">个人信息管理</h2>
      <p class="page-subtitle">
        统一维护用户资料表单中的下拉选项，不涉及单个用户的个人资料修改。
      </p>
    </div>

    <!-- 提示条 -->
    <div class="notice-bar">
      维护范围：年级、专业、所属院校。仅已启用的选项可供选择；停用后保留用户已有资料。
    </div>

    <div class="content-layout">
      <!-- 左侧：分类卡片 -->
      <div class="groups-column">
        <div v-for="group in groups" :key="group.value" class="group-card">
          <div class="group-heading">
            <span class="group-name">{{ group.label }}</span>
            <button class="btn-add" @click="handleAdd(group.value)">+ 新增</button>
          </div>

          <div class="group-table">
            <div class="table-head">
              <span class="col-name">选项名称</span>
              <span class="col-sort">排序</span>
              <span class="col-actions">操作</span>
            </div>

            <div v-if="group.options.length === 0" class="table-empty">
              暂无选项，点击右上角「+ 新增」创建
            </div>

            <div
              v-for="option in group.visibleOptions"
              :key="option.id"
              class="table-row"
              :class="{ 'row-editing': form.id === option.id }"
            >
              <span class="col-name">
                <span class="option-name" :class="{ disabled: !option.is_enabled }">
                  {{ option.name }}
                </span>
                <span v-if="form.id === option.id" class="editing-tag">编辑中</span>
                <span v-if="!option.is_enabled" class="disabled-tag">已停用</span>
              </span>
              <span class="col-sort">{{ option.sort_order }}</span>
              <span class="col-actions">
                <a class="action-link" @click="handleEdit(option)">编辑</a>
                <span class="action-divider"></span>
                <a class="action-link" @click="handleToggleEnabled(option)">
                  {{ option.is_enabled ? '停用' : '启用' }}
                </a>
                <span class="action-divider"></span>
                <a class="action-link danger" @click="handleDelete(option)">删除</a>
              </span>
            </div>

            <!-- 超过 5 条折叠，点击展开/收起 -->
            <div v-if="group.hasMore" class="table-toggle" @click="toggleExpand(group.value)">
              {{ group.expanded ? '收起' : `展开全部（共 ${group.options.length} 条）` }}
              <span class="toggle-arrow">{{ group.expanded ? '▴' : '▾' }}</span>
            </div>
          </div>
        </div>

        <div class="footer-note">
          排序数值越小，选项越靠前；同一分类下的选项名称不可重复。
        </div>
      </div>

      <!-- 右侧：编辑面板（默认隐藏，点击「新增 / 编辑」后展开） -->
      <div v-if="panelVisible" class="edit-panel">
        <div class="panel-header">编辑枚举选项</div>

        <div class="panel-body">
          <div class="field">
            <label class="field-label"><span class="required">*</span>所属分类</label>
            <div class="field-static">{{ categoryLabel }}</div>
            <p class="field-hint">由所点击的「新增 / 编辑」按钮决定，不可修改。</p>
          </div>

          <div class="field">
            <label class="field-label"><span class="required">*</span>选项名称</label>
            <el-input
              v-model="form.name"
              class="field-control"
              maxlength="30"
              placeholder="请输入选项名称"
              :disabled="saving"
            />
            <p class="field-hint">请输入规范名称，最多 30 个字。</p>
          </div>

          <div class="field">
            <label class="field-label"><span class="required">*</span>排序</label>
            <el-input-number
              v-model="form.sort_order"
              class="field-control sort-input"
              :min="0"
              :step="10"
              :precision="0"
              controls-position="right"
              :disabled="saving"
            />
            <p class="field-hint">非负整数，数值越小越靠前。</p>
          </div>

          <div class="field">
            <label class="field-label">状态</label>
            <el-radio-group v-model="form.is_enabled" :disabled="saving">
              <el-radio :value="true">启用</el-radio>
              <el-radio :value="false">停用</el-radio>
            </el-radio-group>
          </div>
        </div>

        <div class="panel-footer">
          <button class="btn-save" :disabled="saving" @click="handleSave">
            {{ saving ? '保存中...' : '保存' }}
          </button>
          <button class="btn-cancel" :disabled="saving" @click="resetForm">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  createProfileOption,
  deleteProfileOption,
  getProfileOptions,
  updateProfileOption,
  type ProfileOption,
  type ProfileOptionCategory,
} from '@/api/profileOption';

const CATEGORY_META: Array<{ value: ProfileOptionCategory; label: string }> = [
  { value: 'grade', label: '年级' },
  { value: 'major', label: '专业' },
  { value: 'university', label: '所属院校' },
];

const loading = ref(false);
const saving = ref(false);
const options = ref<ProfileOption[]>([]);
/** 编辑面板默认隐藏，点击「新增 / 编辑」按钮后展开 */
const panelVisible = ref(false);

interface OptionForm {
  id: number | null;
  category: ProfileOptionCategory;
  name: string;
  sort_order: number;
  is_enabled: boolean;
}

const form = reactive<OptionForm>({
  id: null,
  category: 'grade',
  name: '',
  sort_order: 0,
  is_enabled: true,
});

/** 每类默认最多展示条数，超出折叠 */
const MAX_VISIBLE = 5;

/** 已展开全部分类的分类值列表 */
const expandedCategories = ref<ProfileOptionCategory[]>([]);

function toggleExpand(category: ProfileOptionCategory) {
  const index = expandedCategories.value.indexOf(category);
  if (index >= 0) {
    expandedCategories.value.splice(index, 1);
  } else {
    expandedCategories.value.push(category);
  }
}

const groups = computed(() =>
  CATEGORY_META.map((meta) => {
    const categoryOptions = options.value.filter((o) => o.category === meta.value);
    const expanded = expandedCategories.value.includes(meta.value);
    return {
      ...meta,
      options: categoryOptions,
      visibleOptions: expanded ? categoryOptions : categoryOptions.slice(0, MAX_VISIBLE),
      hasMore: categoryOptions.length > MAX_VISIBLE,
      expanded,
    };
  })
);

/** 所属分类仅展示：由入口按钮传入，不可修改 */
const categoryLabel = computed(
  () => CATEGORY_META.find((meta) => meta.value === form.category)?.label ?? form.category
);

async function loadOptions() {
  loading.value = true;
  try {
    options.value = await getProfileOptions();
  } catch (error) {
    console.error('Load profile options failed:', error);
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.id = null;
  form.category = 'grade';
  form.name = '';
  form.sort_order = 0;
  form.is_enabled = true;
  panelVisible.value = false;
}

/** 新增：展开面板，分类由按钮所在分组传入，排序默认为该分类最大值 + 10 */
function handleAdd(category: ProfileOptionCategory) {
  const maxSort = options.value
    .filter((o) => o.category === category)
    .reduce((max, o) => Math.max(max, o.sort_order), 0);
  form.id = null;
  form.category = category;
  form.name = '';
  form.sort_order = maxSort + 10;
  form.is_enabled = true;
  panelVisible.value = true;
}

/** 编辑：展开面板，分类随选项带入（仅展示） */
function handleEdit(option: ProfileOption) {
  form.id = option.id;
  form.category = option.category;
  form.name = option.name;
  form.sort_order = option.sort_order;
  form.is_enabled = option.is_enabled;
  panelVisible.value = true;
}

async function handleSave() {
  const name = form.name.trim();
  if (!name) {
    ElMessage.warning('请输入选项名称');
    return;
  }
  if (name.length > 30) {
    ElMessage.warning('选项名称最多 30 个字');
    return;
  }
  if (!Number.isInteger(form.sort_order) || form.sort_order < 0) {
    ElMessage.warning('排序需为非负整数');
    return;
  }

  saving.value = true;
  try {
    const payload = {
      category: form.category,
      name,
      sort_order: form.sort_order,
      is_enabled: form.is_enabled,
    };
    if (form.id) {
      await updateProfileOption(form.id, payload);
      ElMessage.success('选项已更新');
    } else {
      await createProfileOption(payload);
      ElMessage.success('选项已创建');
    }
    await loadOptions();
    resetForm();
  } catch (error) {
    console.error('Save profile option failed:', error);
  } finally {
    saving.value = false;
  }
}

async function handleToggleEnabled(option: ProfileOption) {
  try {
    await updateProfileOption(option.id, { is_enabled: !option.is_enabled });
    ElMessage.success(option.is_enabled ? '已停用' : '已启用');
    if (form.id === option.id) {
      form.is_enabled = !option.is_enabled;
    }
    await loadOptions();
  } catch (error) {
    console.error('Toggle option failed:', error);
  }
}

async function handleDelete(option: ProfileOption) {
  try {
    await ElMessageBox.confirm(
      `确定删除选项「${option.name}」吗？删除后不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    );
  } catch {
    return; // 用户取消
  }

  try {
    await deleteProfileOption(option.id);
    ElMessage.success('已删除');
    if (form.id === option.id) {
      resetForm();
    }
    await loadOptions();
  } catch (error) {
    console.error('Delete option failed:', error);
  }
}

onMounted(loadOptions);
</script>

<style lang="scss" scoped>
.profile-options-page {
  min-height: 100%;
}

/* 页面标题 */
.page-header {
  margin-bottom: 16px;

  .page-title {
    font-size: 24px;
    font-weight: bold;
    color: #182230;
    margin: 0 0 6px;
  }

  .page-subtitle {
    font-size: 13px;
    color: #667085;
    margin: 0;
  }
}

/* 提示条 */
.notice-bar {
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: #eff5ff;
  border-radius: 6px;
  font-size: 13px;
  color: #182230;
  margin-bottom: 20px;
}

/* 双栏布局 */
.content-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.groups-column {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 分类卡片 */
.group-card {
  background: #ffffff;
  border: 1px solid #e7ebf0;
  border-radius: 8px;
  overflow: hidden;
}

.group-heading {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;

  .group-name {
    font-size: 15px;
    font-weight: bold;
    color: #182230;
  }

  .btn-add {
    height: 28px;
    padding: 0 12px;
    background: #ffffff;
    border: 1px solid #e7ebf0;
    border-radius: 6px;
    color: #2563eb;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: #2563eb;
      background: #eff5ff;
    }
  }
}

/* 表格 */
.group-table {
  border-top: 1px solid #e7ebf0;
}

.table-head,
.table-row {
  display: flex;
  align-items: center;
  padding: 0 16px;

  .col-name {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .col-sort {
    width: 80px;
    flex-shrink: 0;
  }

  .col-actions {
    width: 150px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }
}

.table-head {
  height: 30px;
  background: #f7f8fa;
  font-size: 12px;
  color: #667085;
}

.table-row {
  height: 32px;
  font-size: 13px;
  border-top: 1px solid #f2f4f7;

  &.row-editing {
    background: #f5f9ff;
  }

  .option-name {
    color: #182230;

    &.disabled {
      color: #98a2b3;
    }
  }

  .col-sort {
    color: #667085;
  }
}

.editing-tag,
.disabled-tag {
  font-size: 11px;
  padding: 0 6px;
  height: 18px;
  line-height: 18px;
  border-radius: 4px;
}

.editing-tag {
  color: #2563eb;
  background: #eff5ff;
}

.disabled-tag {
  color: #98a2b3;
  background: #f2f4f7;
}

.action-link {
  color: #2563eb;
  font-size: 13px;
  cursor: pointer;
  user-select: none;

  &:hover {
    opacity: 0.75;
  }

  &.danger {
    color: #f04438;
  }
}

.action-divider {
  width: 1px;
  height: 12px;
  background: #e7ebf0;
  margin: 0 8px;
}

.table-empty {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #98a2b3;
  border-top: 1px solid #f2f4f7;
}

/* 折叠/展开切换行 */
.table-toggle {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: #2563eb;
  border-top: 1px solid #f2f4f7;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: #f5f9ff;
  }
}

.footer-note {
  font-size: 12px;
  color: #98a2b3;
}

/* 右侧编辑面板 */
.edit-panel {
  width: 320px;
  flex-shrink: 0;
  background: #ffffff;
  border: 1px solid #e7ebf0;
  border-radius: 8px;
  position: sticky;
  top: 0;
}

.panel-header {
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid #e7ebf0;
  font-size: 15px;
  font-weight: bold;
  color: #182230;
}

.panel-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  .field-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #182230;
    margin-bottom: 8px;

    .required {
      color: #2563eb;
      margin-right: 2px;
    }
  }

  .field-hint {
    font-size: 12px;
    color: #98a2b3;
    margin: 6px 0 0;
  }

  .field-control {
    width: 100%;
  }

  /* 所属分类：只读展示 */
  .field-static {
    height: 38px;
    line-height: 36px;
    padding: 0 12px;
    background: #f7f8fa;
    border: 1px solid #e7ebf0;
    border-radius: 6px;
    font-size: 13px;
    color: #667085;
  }

  :deep(.el-input__wrapper) {
    min-height: 38px;
    border-radius: 6px;
    box-shadow: 0 0 0 1px #e7ebf0 inset;

    &:hover {
      box-shadow: 0 0 0 1px #c2cbd6 inset;
    }

    &.is-focus {
      box-shadow: 0 0 0 1px #2563eb inset;
    }
  }

  :deep(.el-input-number) {
    width: 100%;

    .el-input__inner {
      text-align: left;
    }
  }
}

.panel-footer {
  padding: 16px 20px;
  border-top: 1px solid #e7ebf0;
  display: flex;
  gap: 12px;

  .btn-save,
  .btn-cancel {
    height: 36px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-save {
    flex: 1;
    background: #2563eb;
    border: 1px solid #2563eb;
    color: #ffffff;

    &:hover:not(:disabled) {
      background: #1d4fd7;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .btn-cancel {
    flex: 1;
    background: #ffffff;
    border: 1px solid #e7ebf0;
    color: #667085;

    &:hover:not(:disabled) {
      border-color: #c2cbd6;
      color: #182230;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>
