<template>
  <div class="student-detail">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>学员详情</span>
          <el-button @click="router.back()">返回</el-button>
        </div>
      </template>

      <div v-if="student" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="邮箱">{{ student.email }}</el-descriptions-item>
          <el-descriptions-item label="openID">{{ student.wx_openid || '-' }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ student.nickname }}</el-descriptions-item>
          <el-descriptions-item label="年级">{{ student.grade }}</el-descriptions-item>
          <el-descriptions-item label="专业">{{ student.major }}</el-descriptions-item>
          <el-descriptions-item label="院校">{{ student.university }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(student.status)">
              {{ getStatusText(student.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="邮箱验证">
            <el-tag :type="student.is_email_verified ? 'success' : 'warning'">
              {{ student.is_email_verified ? '已验证' : '未验证' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="信息完善">
            <el-tag :type="student.is_profile_completed ? 'success' : 'warning'">
              {{ student.is_profile_completed ? '已完成' : '未完成' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">
            {{ formatDate(student.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDate(student.updated_at) }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="actions">
          <el-button type="primary" @click="handleResetPassword">重置密码</el-button>
          <el-button
            :type="student.status === 'active' ? 'danger' : 'success'"
            @click="handleToggleStatus"
          >
            {{ student.status === 'active' ? '禁用账号' : '启用账号' }}
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as studentApi from '@/api/student';
import type { Student } from '@/api/student';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const student = ref<Student | null>(null);

onMounted(async () => {
  await loadStudent();
});

async function loadStudent() {
  const id = Number(route.params.id);
  if (!id) {
    router.back();
    return;
  }

  loading.value = true;
  try {
    student.value = await studentApi.getStudentDetail(id);
  } catch (error) {
    console.error('Load student failed:', error);
    ElMessage.error('加载学员信息失败');
  } finally {
    loading.value = false;
  }
}

async function handleResetPassword() {
  const { value: password } = await ElMessageBox.prompt('请输入新密码', '重置密码', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^.{8,20}$/,
    inputErrorMessage: '密码长度为8-20位',
    inputType: 'password',
  });

  try {
    await studentApi.resetStudentPassword(student.value!.id, password);
    ElMessage.success('密码重置成功');
  } catch (error) {
    console.error('Reset password failed:', error);
  }
}

async function handleToggleStatus() {
  if (!student.value) return;

  const action = student.value.status === 'active' ? '禁用' : '启用';
  try {
    await ElMessageBox.confirm(`确定要${action}该学员吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    const newStatus = student.value.status === 'active' ? 'inactive' : 'active';
    await studentApi.updateStudentStatus(student.value.id, newStatus);
    ElMessage.success(`${action}成功`);
    await loadStudent();
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
.student-detail {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .detail-content {
    .actions {
      margin-top: 24px;
      display: flex;
      gap: 12px;
    }
  }
}
</style>
