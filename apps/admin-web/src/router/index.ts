import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'students',
        name: 'Students',
        component: () => import('@/views/students/list.vue'),
        meta: { title: '学员管理' },
      },
      {
        path: 'students/:id',
        name: 'StudentDetail',
        component: () => import('@/views/students/detail.vue'),
        meta: { title: '学员详情' },
      },
      {
        path: 'profile-options',
        name: 'ProfileOptions',
        component: () => import('@/views/profile-options/index.vue'),
        meta: { title: '个人信息管理' },
      },
      {
        path: 'courses',
        name: 'Courses',
        component: () => import('@/views/courses/list.vue'),
        meta: { title: '课程管理' },
      },
      {
        path: 'courses/create',
        name: 'CourseCreate',
        component: () => import('@/views/courses/form.vue'),
        meta: { title: '创建课程' },
      },
      {
        path: 'courses/:id/edit',
        name: 'CourseEdit',
        component: () => import('@/views/courses/form.vue'),
        meta: { title: '编辑课程' },
      },
      {
        path: 'courses/:id/students',
        name: 'CourseStudents',
        component: () => import('@/views/courses/students.vue'),
        meta: { title: '学员管理' },
      },
      {
        path: 'courses/:id/students/add',
        name: 'CourseStudentsAdd',
        component: () => import('@/views/courses/students-add.vue'),
        meta: { title: '添加学员' },
      },
      {
        path: 'materials',
        name: 'Materials',
        component: () => import('@/views/materials/list.vue'),
        meta: { title: '资料管理' },
      },
      {
        path: 'materials/create',
        name: 'MaterialCreate',
        component: () => import('@/views/materials/form.vue'),
        meta: { title: '新增资料' },
      },
      {
        path: 'materials/:id/edit',
        name: 'MaterialEdit',
        component: () => import('@/views/materials/form.vue'),
        meta: { title: '编辑资料' },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/settings/index.vue'),
        meta: { title: '系统设置' },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth !== false && !authStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
  } else if (to.name === 'Login' && authStore.isLoggedIn) {
    next({ name: 'Dashboard' });
  } else {
    next();
  }
});

export default router;
