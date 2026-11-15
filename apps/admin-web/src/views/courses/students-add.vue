<template>
  <div class="students-add">
    <!-- Page heading -->
    <div class="page-head">
      <div>
        <h2 class="page-title">添加学员</h2>
        <p class="page-desc">
          <template v-if="course">为「{{ course.title }}」选择学员，已加入的学员不可重复选择。</template>
          <template v-else>为课程选择学员</template>
        </p>
      </div>
      <el-button link type="primary" @click="router.back()">← 返回学员管理</el-button>
    </div>

    <el-card shadow="never" class="list-card">
      <!-- 筛选栏 -->
      <div class="search-bar">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索昵称 / OpenID"
          clearable
          style="width: 220px"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="filters.email"
          placeholder="搜索邮箱"
          clearable
          style="width: 200px"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="filters.grade"
          placeholder="年级，如：2026"
          clearable
          style="width: 140px"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="filters.major"
          placeholder="专业"
          clearable
          style="width: 160px"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="filters.university"
          placeholder="所属院校"
          clearable
          style="width: 180px"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <!-- 候选学员表格 -->
      <el-table
        ref="tableRef"
        :data="candidateList"
        v-loading="loading"
        row-key="user_id"
        :row-class-name="rowClass"
        stripe
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="48" reserve-selection :selectable="isSelectable" />
        <el-table-column label="OpenID" min-width="180">
          <template #default="{ row }">
            <span class="openid-text">{{ row.openid_masked }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column label="年级" width="100">
          <template #default="{ row }">{{ row.grade || '-' }}</template>
        </el-table-column>
        <el-table-column label="专业" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.major || '-' }}</template>
        </el-table-column>
        <el-table-column label="所属院校" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.university || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.enrolled" class="tag-enrolled" type="info">已加入</el-tag>
            <el-tag v-else class="tag-plain" type="info">未加入</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </el-card>

    <!-- 底部确认条 -->
    <div class="confirm-bar">
      <span class="confirm-text">已选择 <b>{{ selectedIds.length }}</b> 位用户</span>
      <div>
        <el-button @click="router.back()">取消</el-button>
        <el-button
          type="primary"
          :disabled="selectedIds.length === 0"
          :loading="submitting"
          @click="handleConfirm"
        >
          确认添加（{{ selectedIds.length }} 人）
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, type TableInstance } from 'element-plus';
import * as courseApi from '@/api/course';
import type { Course, CandidateStudent } from '@/api/course';

const route = useRoute();
const router = useRouter();

const courseId = computed(() => Number(route.params.id));
const loading = ref(false);
const submitting = ref(false);
const course = ref<Course | null>(null);
const tableRef = ref<TableInstance>();
const candidateList = ref<CandidateStudent[]>([]);
const selectedIds = ref<number[]>([]);
const filters = reactive({ keyword: '', email: '', grade: '', major: '', university: '' });
const pagination = reactive({ page: 1, limit: 10, total: 0 });

function isSelectable(row: CandidateStudent) {
  return !row.enrolled;
}

function rowClass({ row }: { row: CandidateStudent }) {
  return row.enrolled ? 'row-enrolled' : '';
}

async function loadCourse() {
  try {
    course.value = await courseApi.getCourseDetail(courseId.value);
  } catch (error) {
    console.error('Load course failed:', error);
  }
}

async function loadList() {
  loading.value = true;
  try {
    const res = await courseApi.getStudentCandidates(courseId.value, {
      page: pagination.page,
      limit: pagination.limit,
      keyword: filters.keyword || undefined,
      email: filters.email || undefined,
      grade: filters.grade || undefined,
      major: filters.major || undefined,
      university: filters.university || undefined,
    });
    candidateList.value = res.list;
    pagination.total = res.pagination.total;
  } catch (error) {
    console.error('Load candidates failed:', error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  loadList();
}

function handleReset() {
  filters.keyword = '';
  filters.email = '';
  filters.grade = '';
  filters.major = '';
  filters.university = '';
  handleSearch();
}

function onSelectionChange(rows: CandidateStudent[]) {
  selectedIds.value = rows.map((r) => r.user_id);
}

async function handleConfirm() {
  if (selectedIds.value.length === 0) return;
  submitting.value = true;
  try {
    const res = await courseApi.batchAddStudents(courseId.value, selectedIds.value);
    ElMessage.success(`已添加 ${res.added} 位学员`);
    tableRef.value?.clearSelection();
    router.push({ name: 'CourseStudents', params: { id: courseId.value } });
  } catch (error) {
    console.error('Batch add failed:', error);
    // 失败后刷新候选状态（可能部分学员已被其他管理员添加）
    loadList();
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadCourse();
  loadList();
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
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.openid-text {
  font-size: 12px;
  color: #667085;
  font-family: 'SF Mono', Menlo, monospace;
}

.tag-enrolled {
  background: #f0f2f5;
  color: #667085;
  border: none;
}

.tag-plain {
  background: #eff5ff;
  color: #2563eb;
  border: none;
}

:deep(.row-enrolled) {
  color: #98a2b3;
  background: #fafbfc;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* 底部确认条 */
.confirm-bar {
  position: sticky;
  bottom: 0;
  z-index: 10;
  margin-top: 16px;
  background: #ffffff;
  border: 1px solid #e7ebf0;
  border-radius: 8px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -2px 12px rgba(24, 34, 48, 0.06);

  .confirm-text {
    font-size: 13px;
    color: #667085;

    b {
      color: #2563eb;
      font-size: 15px;
      margin: 0 2px;
    }
  }
}
</style>
