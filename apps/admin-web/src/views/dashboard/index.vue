<template>
  <div class="dashboard">
    <!-- 欢迎图（Figma Welcome hero，替代原统计卡片） -->
    <div class="welcome-hero">
      <img class="hero-img" :src="welcomeImg" alt="欢迎图" />
    </div>
  </div>
</template>

<script setup lang="ts">
import welcomeImg from '@/assets/home-welcome.png';
</script>

<style lang="scss" scoped>
.page-heading {
  margin-bottom: 20px;

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

.welcome-hero {
  background: #ffffff;
  border: 1px solid #e7ebf0;
  border-radius: 12px;
  padding: 24px;

  .hero-img {
    display: block;
    width: 100%;
    border-radius: 8px;
  }
}
</style>
