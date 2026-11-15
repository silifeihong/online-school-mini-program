<template>
  <div class="material-list">
    <!-- Page heading -->
    <div class="page-head">
      <div>
        <h2 class="page-title">资料管理</h2>
        <p class="page-desc">维护免费的考研文档资料，学员在小程序端搜索并下载。</p>
      </div>
      <el-button type="primary" class="btn-create" @click="router.push({ name: 'MaterialCreate' })">
        ＋ 新增资料
      </el-button>
    </div>

    <el-card shadow="never">
      <!-- 筛选栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchParams.keyword"
          placeholder="搜索资料标题"
          clearable
          style="width: 250px"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-select v-model="searchParams.status" placeholder="状态" style="width: 136px" @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="草稿" value="draft" />
          <el-option label="已上架" value="on" />
          <el-option label="已下架" value="off" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="materialList" v-loading="loading" stripe>
        <el-table-column label="封面" width="80">
          <template #default="{ row }">
            <div class="cover-cell">
              <img v-if="row.cover_url" :src="row.cover_url" class="cover-img" />
              <div v-else class="cover-ph">
                <el-icon color="#2563eb"><Document /></el-icon>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
        <el-table-column label="文件信息" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="meta-text">{{ filesSummary(row) }}</span>
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
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="router.push({ name: 'MaterialEdit', params: { id: row.id } })">
              编辑
            </el-button>
            <el-button link type="primary" @click="handleToggleStatus(row)">
              {{ row.status === 'on' ? '下架' : '上架' }}
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <p class="foot-note">资料均为免费内容，学员登录小程序后即可搜索并下载。</p>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as materialApi from '@/api/material';
import type { Material } from '@/api/material';

const router = useRouter();

const loading = ref(false);
const materialList = ref<Material[]>([]);
const searchParams = reactive({ keyword: '', status: '' as '' | 'draft' | 'on' | 'off' });
const pagination = reactive({ page: 1, limit: 10, total: 0 });

// ---------- 列表 ----------

async function loadList() {
  loading.value = true;
  try {
    const res = await materialApi.getMaterialList({
      page: pagination.page,
      limit: pagination.limit,
      keyword: searchParams.keyword || undefined,
      status: searchParams.status || undefined,
    });
    materialList.value = res.list;
    pagination.total = res.pagination.total;
  } catch (error) {
    console.error('Load materials failed:', error);
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
  searchParams.status = '';
  handleSearch();
}

async function handleToggleStatus(row: Material) {
  const next = row.status === 'on' ? 'off' : 'on';
  const actionText = next === 'on' ? '上架' : '下架';
  try {
    await ElMessageBox.confirm(`确定${actionText}资料「${row.title}」吗？`, '提示', { type: 'warning' });
  } catch {
    return;
  }
  try {
    await materialApi.updateMaterialStatus(row.id, next);
    ElMessage.success(`${actionText}成功`);
    loadList();
  } catch (error) {
    console.error('Toggle status failed:', error);
  }
}

async function handleDelete(row: Material) {
  try {
    await ElMessageBox.confirm(`确定删除资料「${row.title}」吗？删除后不可恢复。`, '删除资料', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await materialApi.deleteMaterial(row.id);
    ElMessage.success('删除成功');
    loadList();
  } catch (error) {
    console.error('Delete material failed:', error);
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

/** 文件信息汇总：单文件显示其信息，多文件显示个数 */
function filesSummary(row: Material): string {
  const files = row.files || [];
  if (files.length === 0) return '-';
  if (files.length === 1) return files[0].file_meta || '-';
  return `${files.length} 个文件`;
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

.meta-text,
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
