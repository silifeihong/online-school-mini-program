<template>
  <div class="student-list">
    <el-card>
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchParams.keyword"
          placeholder="搜索邮箱/昵称"
          clearable
          style="width: 240px"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-select v-model="searchParams.grade" placeholder="年级" style="width: 130px" @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option v-for="item in filterOptions.grade" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="searchParams.major" placeholder="专业" style="width: 160px" @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option v-for="item in filterOptions.major" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="searchParams.university" placeholder="院校" style="width: 160px" @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option v-for="item in filterOptions.university" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="searchParams.status" placeholder="状态" style="width: 120px" @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option
            v-for="item in filterOptions.status"
            :key="item"
            :label="getStatusText(item)"
            :value="item"
          />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="studentList" v-loading="loading" stripe>
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="wx_openid" label="openID" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.wx_openid || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="grade" label="年级" width="100" />
        <el-table-column prop="major" label="专业" width="120" />
        <el-table-column prop="university" label="院校" min-width="150" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">详情</el-button>
            <el-button link type="warning" @click="handleResetPassword(row)">重置密码</el-button>
            <el-button
              link
              :type="row.status === 'active' ? 'danger' : 'success'"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
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
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 重置密码弹窗 -->
    <el-dialog v-model="resetDialogVisible" title="重置密码" width="400px">
      <el-form :model="resetForm" :rules="resetRules" ref="resetFormRef" label-width="80px">
        <el-form-item label="新密码" prop="password">
          <el-input v-model="resetForm.password" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitResetPassword" :loading="resetLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import * as studentApi from '@/api/student';
import type { Student, StudentFilterOptions } from '@/api/student';

const router = useRouter();

const loading = ref(false);
const studentList = ref<Student[]>([]);
const filterOptions = ref<StudentFilterOptions>({
  grade: [],
  major: [],
  university: [],
  status: [],
});
const searchParams = reactive({
  keyword: '',
  status: '',
  grade: '',
  major: '',
  university: '',
});
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
});

// 重置密码相关
const resetDialogVisible = ref(false);
const resetLoading = ref(false);
const resetFormRef = ref<FormInstance>();
const resetForm = ref({ password: '' });
const currentStudent = ref<Student | null>(null);

const resetRules: FormRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 20, message: '密码长度为8-20位', trigger: 'blur' },
  ],
};

onMounted(() => {
  loadStudents();
  loadFilterOptions();
});

async function loadStudents() {
  loading.value = true;
  try {
    const result = await studentApi.getStudentList({
      page: pagination.page,
      limit: pagination.limit,
      keyword: searchParams.keyword || undefined,
      status: searchParams.status || undefined,
      grade: searchParams.grade || undefined,
      major: searchParams.major || undefined,
      university: searchParams.university || undefined,
    });
    studentList.value = result.list;
    pagination.total = result.pagination.total;
  } catch (error) {
    console.error('Load students failed:', error);
  } finally {
    loading.value = false;
  }
}

async function loadFilterOptions() {
  try {
    filterOptions.value = await studentApi.getStudentFilterOptions();
  } catch (error) {
    console.error('Load filter options failed:', error);
  }
}

function handleSearch() {
  pagination.page = 1;
  loadStudents();
}

function handleReset() {
  searchParams.keyword = '';
  searchParams.status = '';
  searchParams.grade = '';
  searchParams.major = '';
  searchParams.university = '';
  handleSearch();
}

function handleSizeChange() {
  pagination.page = 1;
  loadStudents();
}

function handlePageChange() {
  loadStudents();
}

function handleView(row: Student) {
  router.push(`/students/${row.id}`);
}

function handleResetPassword(row: Student) {
  currentStudent.value = row;
  resetForm.value.password = '';
  resetDialogVisible.value = true;
}

async function submitResetPassword() {
  if (!resetFormRef.value || !currentStudent.value) return;

  await resetFormRef.value.validate(async (valid) => {
    if (!valid || !currentStudent.value) return;

    resetLoading.value = true;
    try {
      await studentApi.resetStudentPassword(currentStudent.value.id, resetForm.value.password);
      ElMessage.success('密码重置成功');
      resetDialogVisible.value = false;
    } catch (error) {
      console.error('Reset password failed:', error);
    } finally {
      resetLoading.value = false;
    }
  });
}

async function handleToggleStatus(row: Student) {
  const action = row.status === 'active' ? '禁用' : '启用';
  try {
    await ElMessageBox.confirm(`确定要${action}该学员吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    const newStatus = row.status === 'active' ? 'inactive' : 'active';
    await studentApi.updateStudentStatus(row.id, newStatus);
    ElMessage.success(`${action}成功`);
    loadStudents();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Toggle status failed:', error);
    }
  }
}

function getStatusType(status: string) {
  const types: Record<string, string> = {
    active: 'success',
    inactive: 'danger',
    pending: 'warning',
  };
  return types[status] || 'info';
}

function getStatusText(status: string) {
  const texts: Record<string, string> = {
    active: '正常',
    inactive: '禁用',
    pending: '待审核',
  };
  return texts[status] || status;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN');
}
</script>

<style lang="scss" scoped>
.student-list {
  .search-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 20px;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
