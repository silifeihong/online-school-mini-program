<template>
  <div class="layout">
    <!-- 侧边栏 -->
    <el-aside width="220px" class="aside">
      <div class="logo">
        <el-icon :size="26" color="#2563eb"><Reading /></el-icon>
        <h1>考研资料库</h1>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#ffffff"
        text-color="#667085"
        active-text-color="#2563eb"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataBoard /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/students">
          <el-icon><User /></el-icon>
          <span>学员管理</span>
        </el-menu-item>
        <el-menu-item index="/courses">
          <el-icon><VideoPlay /></el-icon>
          <span>课程管理</span>
        </el-menu-item>
        <el-menu-item index="/materials">
          <el-icon><Document /></el-icon>
          <span>资料管理</span>
        </el-menu-item>
        <el-sub-menu index="system">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/settings">系统设置</el-menu-item>
          <el-menu-item index="/profile-options">个人信息管理</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container class="main-container">
      <!-- 头部 -->
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.meta.title && route.meta.title !== '首页'">
              {{ route.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown>
            <span class="admin-info">
              <el-icon><UserFilled /></el-icon>
              {{ authStore.adminInfo?.real_name || '管理员' }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleChangePassword">修改密码</el-dropdown-item>
                <el-dropdown-item @click="handleLogout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px">
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="80px">
        <el-form-item label="旧密码" prop="old_password">
          <el-input v-model="passwordForm.old_password" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="new_password">
          <el-input v-model="passwordForm.new_password" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm_password">
          <el-input v-model="passwordForm.confirm_password" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPassword" :loading="passwordLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import * as authApi from '@/api/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// 子页面（创建/编辑/学员管理）保持父菜单高亮
const activeMenu = computed(() => {
  const path = route.path;
  if (path.startsWith('/courses')) return '/courses';
  if (path.startsWith('/materials')) return '/materials';
  if (path.startsWith('/students')) return '/students';
  if (path.startsWith('/settings')) return '/settings';
  return path;
});

// 修改密码相关
const passwordDialogVisible = ref(false);
const passwordLoading = ref(false);
const passwordFormRef = ref<FormInstance>();
const passwordForm = ref({
  old_password: '',
  new_password: '',
  confirm_password: '',
});

const passwordRules: FormRules = {
  old_password: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 20, message: '密码长度为8-20位', trigger: 'blur' },
    {
      pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
      message: '密码必须包含字母和数字',
      trigger: 'blur',
    },
  ],
  confirm_password: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== passwordForm.value.new_password) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
};

function handleChangePassword() {
  passwordDialogVisible.value = true;
  passwordForm.value = {
    old_password: '',
    new_password: '',
    confirm_password: '',
  };
}

async function submitPassword() {
  if (!passwordFormRef.value) return;

  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return;

    passwordLoading.value = true;
    try {
      await authApi.changePassword({
        old_password: passwordForm.value.old_password,
        new_password: passwordForm.value.new_password,
      });
      ElMessage.success('密码修改成功');
      passwordDialogVisible.value = false;
    } catch (error) {
      console.error('Change password failed:', error);
    } finally {
      passwordLoading.value = false;
    }
  });
}

function handleLogout() {
  authStore.logout();
  router.push({ name: 'Login' });
}
</script>

<style lang="scss" scoped>
.layout {
  display: flex;
  height: 100vh;
}

/* 侧边栏配色参照 Figma 管理后台首页（node 164:917）：白底、灰字、选中项浅蓝底蓝字 */
.aside {
  background: #ffffff;
  border-right: 1px solid #e7ebf0;
  overflow-y: auto;

  .logo {
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #ffffff;

    h1 {
      color: #182230;
      font-size: 17px;
      font-weight: 700;
    }
  }

  :deep(.el-menu) {
    border-right: none;
    padding: 8px 12px;
  }

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    height: 44px;
    line-height: 44px;
    border-radius: 8px;
    margin-bottom: 4px;
  }

  :deep(.el-menu-item:hover),
  :deep(.el-sub-menu__title:hover) {
    background: #f5f8ff;
    color: #2563eb;
  }

  :deep(.el-menu-item.is-active) {
    background: #eff5ff;
    color: #2563eb;
    font-weight: 700;
  }
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 24px;

  .header-right {
    .admin-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: #374151;
    }
  }
}

.main {
  flex: 1;
  overflow-y: auto;
  background: #f7f8fa;
  padding: 24px;
}
</style>
