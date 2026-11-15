<template>
  <div class="course-students">
    <!-- Page heading -->
    <div class="page-head">
      <div>
        <h2 class="page-title">学员管理</h2>
        <p class="page-desc">
          <template v-if="course">
            {{ course.title }} · {{ course.payment_type === 'free' ? '免费' : `¥${Number(course.price).toFixed(2)}` }}
            · 共 {{ pagination.total }} 位学员
          </template>
          <template v-else>管理该课程的学员名单</template>
        </p>
      </div>
      <div class="head-ops">
        <el-button link type="primary" @click="router.push({ name: 'Courses' })">← 返回课程管理</el-button>
        <el-button
          type="primary"
          @click="router.push({ name: 'CourseStudentsAdd', params: { id: courseId } })"
        >
          ＋ 添加学员
        </el-button>
      </div>
    </div>

    <el-card shadow="never">
      <!-- 筛选栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索学员昵称 / OpenID"
          clearable
          style="width: 260px"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="studentList" v-loading="loading" stripe>
        <el-table-column label="OpenID" min-width="180">
          <template #default="{ row }">
            <span class="openid-text">{{ row.openid_masked }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column label="年级" width="110">
          <template #default="{ row }">{{ row.grade || '-' }}</template>
        </el-table-column>
        <el-table-column label="专业" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.major || '-' }}</template>
        </el-table-column>
        <el-table-column label="所属院校" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.university || '-' }}</template>
        </el-table-column>
        <el-table-column label="加入时间" width="160">
          <template #default="{ row }">
            <span class="time-text">{{ formatDate(row.joined_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" @click="handleRemove(row)">移出</el-button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as courseApi from '@/api/course';
import type { Course, EnrolledStudent } from '@/api/course';

const route = useRoute();
const router = useRouter();

const courseId = computed(() => Number(route.params.id));
const loading = ref(false);
const course = ref<Course | null>(null);
const studentList = ref<EnrolledStudent[]>([]);
const searchKeyword = ref('');
const pagination = reactive({ page: 1, limit: 10, total: 0 });

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
    const res = await courseApi.getCourseStudents(courseId.value, {
      page: pagination.page,
      limit: pagination.limit,
      keyword: searchKeyword.value || undefined,
    });
    studentList.value = res.list;
    pagination.total = res.pagination.total;
  } catch (error) {
    console.error('Load students failed:', error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  loadList();
}

function handleReset() {
  searchKeyword.value = '';
  handleSearch();
}

async function handleRemove(row: EnrolledStudent) {
  try {
    await ElMessageBox.confirm(
      `确定将学员「${row.nickname}」移出本课程吗？移出后该学员将无法继续学习。`,
      '移出学员',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  try {
    await courseApi.removeCourseStudent(courseId.value, row.user_id);
    ElMessage.success('已移出');
    loadList();
    loadCourse();
  } catch (error) {
    console.error('Remove student failed:', error);
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

  .head-ops {
    display: flex;
    align-items: center;
    gap: 12px;
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

.time-text {
  font-size: 12px;
  color: #667085;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
