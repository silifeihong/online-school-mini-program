<template>
  <div class="course-list">
    <!-- Page heading -->
    <div class="page-head">
      <div>
        <h2 class="page-title">课程管理</h2>
        <p class="page-desc">统一管理视频课程与文档资料，维护价格和上架状态。</p>
      </div>
      <el-button type="primary" class="btn-create" @click="router.push({ name: 'CourseCreate' })">
        ＋ 新增课程
      </el-button>
    </div>

    <el-card shadow="never">
      <!-- 筛选栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchParams.keyword"
          placeholder="搜索课程标题"
          clearable
          style="width: 250px"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="searchParams.payment_type"
          placeholder="付费类型"
          style="width: 136px"
          @change="handleSearch"
        >
          <el-option label="全部" value="" />
          <el-option label="付费" value="paid" />
          <el-option label="免费" value="free" />
        </el-select>
        <el-select
          v-model="searchParams.status"
          placeholder="状态"
          style="width: 136px"
          @change="handleSearch"
        >
          <el-option label="全部" value="" />
          <el-option label="草稿" value="draft" />
          <el-option label="已上架" value="on" />
          <el-option label="已下架" value="off" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="courseList" v-loading="loading" stripe>
        <el-table-column label="封面" width="80">
          <template #default="{ row }">
            <div class="cover-cell">
              <img v-if="row.cover_url" :src="row.cover_url" class="cover-img" />
              <div v-else class="cover-ph">
                <el-icon color="#2563eb"><VideoPlay /></el-icon>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
        <el-table-column label="付费类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.payment_type === 'free' ? 'success' : 'primary'" effect="light">
              {{ row.payment_type === 'free' ? '免费' : '付费' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="100">
          <template #default="{ row }">
            <span v-if="row.payment_type === 'free'" class="price-free">免费</span>
            <span v-else class="price">¥{{ Number(row.price).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="章节/学员" width="110">
          <template #default="{ row }">
            <span class="count-text">{{ row.chapter_count ?? 0 }} 章节 · {{ row.student_count ?? 0 }} 人</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :class="statusTag(row.status).cls" :type="statusTag(row.status).type">
              {{ statusTag(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            <span class="time-text">{{ formatDate(row.created_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="160">
          <template #default="{ row }">
            <span class="time-text">{{ formatDate(row.updated_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="router.push({ name: 'CourseEdit', params: { id: row.id } })">
              编辑
            </el-button>
            <el-button link type="primary" @click="handleToggleStatus(row)">
              {{ row.status === 'on' ? '下架' : '上架' }}
            </el-button>
            <el-button link type="primary" @click="router.push({ name: 'CourseStudents', params: { id: row.id } })">
              学员管理
            </el-button>
            <!-- 草稿、或无学员的已下架课程可删除（后端同规则拦截） -->
            <el-button v-if="canDelete(row)" link type="danger" @click="handleDelete(row)">
              删除
            </el-button>
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

    <p class="foot-note">免费内容价格均为 ¥0，学员由管理员在「学员管理」中手动添加。</p>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as courseApi from '@/api/course';
import type { Course } from '@/api/course';

const router = useRouter();

const loading = ref(false);
const courseList = ref<Course[]>([]);
const searchParams = reactive({
  keyword: '',
  payment_type: '' as '' | 'paid' | 'free',
  status: '' as '' | 'draft' | 'on' | 'off',
});
const pagination = reactive({ page: 1, limit: 10, total: 0 });

async function loadList() {
  loading.value = true;
  try {
    const res = await courseApi.getCourseList({
      page: pagination.page,
      limit: pagination.limit,
      keyword: searchParams.keyword || undefined,
      payment_type: searchParams.payment_type || undefined,
      status: searchParams.status || undefined,
    });
    courseList.value = res.list;
    pagination.total = res.pagination.total;
  } catch (error) {
    console.error('Load courses failed:', error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  loadList();
}

function handleReset() {
  searchParams.keyword = '';
  searchParams.payment_type = '';
  searchParams.status = '';
  handleSearch();
}

async function handleToggleStatus(row: Course) {
  const next = row.status === 'on' ? 'off' : 'on';
  const actionText = next === 'on' ? '上架' : '下架';
  try {
    await ElMessageBox.confirm(`确定${actionText}课程「${row.title}」吗？`, '提示', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    if (next === 'on') {
      // 上架走后端发布校验（封面、至少一个章节）；草稿/已下架课程同一入口
      await courseApi.publishCourse(row.id);
    } else {
      await courseApi.updateCourseStatus(row.id, next);
    }
    ElMessage.success(`${actionText}成功`);
    loadList();
  } catch (error: any) {
    if (error?.message) ElMessage.error(error.message);
    console.error('Toggle status failed:', error);
  }
}

/** 删除条件：草稿，或已下架且无学员 */
function canDelete(row: Course): boolean {
  return row.status === 'draft' || (row.status === 'off' && (row.student_count ?? 0) === 0);
}

async function handleDelete(row: Course) {
  try {
    await ElMessageBox.confirm(`确定删除课程「${row.title}」吗？删除后不可恢复。`, '删除课程', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await courseApi.deleteCourse(row.id);
    ElMessage.success('删除成功');
    loadList();
  } catch (error: any) {
    if (error?.message) ElMessage.error(error.message);
    console.error('Delete course failed:', error);
  }
}

/** 状态标签：草稿=警示色、已上架=绿、已下架=灰 */
const STATUS_TAGS: Record<string, { label: string; type: 'success' | 'info' | 'warning'; cls: string }> = {
  draft: { label: '草稿', type: 'warning', cls: 'tag-draft' },
  on: { label: '已上架', type: 'success', cls: 'tag-on' },
  off: { label: '已下架', type: 'info', cls: 'tag-off' },
};

function statusTag(status: string) {
  return STATUS_TAGS[status] || STATUS_TAGS.off;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

onMounted(loadList);
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

  .btn-create {
    height: 36px;
    padding: 0 16px;
  }
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.cover-cell {
  width: 46px;
  height: 44px;

  .cover-img {
    width: 46px;
    height: 44px;
    border-radius: 4px;
    object-fit: cover;
    display: block;
  }

  .cover-ph {
    width: 46px;
    height: 44px;
    border-radius: 4px;
    background: #eff5ff;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.price {
  font-weight: 700;
  color: #2563eb;
}

.price-free {
  color: #16845c;
  font-weight: 700;
}

.count-text {
  font-size: 12px;
  color: #667085;
}

.time-text {
  font-size: 12px;
  color: #667085;
}

.tag-on {
  background: #ecf8f2;
  color: #16845c;
  border: none;
}

.tag-off {
  background: #f0f2f5;
  color: #667085;
  border: none;
}

.tag-draft {
  background: #fff7e8;
  color: #b54708;
  border: none;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.foot-note {
  margin-top: 12px;
  font-size: 12px;
  color: #98a2b3;
}
</style>
