<template>
  <div class="settings-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">系统设置</h2>
        <p class="page-desc">维护全局业务配置，保存后即时生效。</p>
      </div>
    </div>

    <el-card shadow="never" v-loading="loading">
      <h3 class="section-title">销售微信号</h3>
      <p class="section-desc">
        小程序课程详情页「立即购买」弹窗中展示的微信号，学员复制后添加销售微信完成购课。
      </p>
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="settings-form">
        <el-form-item label="销售微信号" prop="sales_wechat">
          <el-input
            v-model="form.sales_wechat"
            placeholder="请输入销售微信号"
            maxlength="50"
            style="width: 320px"
          />
        </el-form-item>
      </el-form>
      <div class="form-actions">
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { getSalesWechat, saveSalesWechat } from '@/api/settings';

const loading = ref(false);
const saving = ref(false);
const formRef = ref<FormInstance>();
const form = reactive({ sales_wechat: '' });

const rules: FormRules = {
  sales_wechat: [
    { required: true, message: '请输入销售微信号', trigger: 'blur' },
    { max: 50, message: '长度不能超过 50 个字符', trigger: 'blur' },
  ],
};

async function load() {
  loading.value = true;
  try {
    const res = await getSalesWechat();
    form.sales_wechat = res.sales_wechat || '';
  } catch (error) {
    console.error('Load settings failed:', error);
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    saving.value = true;
    try {
      await saveSalesWechat(form.sales_wechat.trim());
      ElMessage.success('保存成功');
    } catch (error) {
      console.error('Save settings failed:', error);
    } finally {
      saving.value = false;
    }
  });
}

onMounted(load);
</script>

<style scoped lang="scss">
.page-head {
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

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #182230;
  margin: 0 0 4px;
}

.section-desc {
  font-size: 12px;
  color: #667085;
  margin: 0 0 20px;
}

.settings-form {
  max-width: 480px;
}

.form-actions {
  display: flex;
  justify-content: flex-start;
}
</style>
