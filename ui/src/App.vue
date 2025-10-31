<template>
  <el-container style="height: 100vh">
    <el-header height="56px" class="app-header">
      <div class="brand">种呱得呱助手</div>
      <div class="nav">
        <el-button link @click="$router.push('/cards')">卡牌</el-button>
        <el-button link @click="$router.push('/pendants')">挂件</el-button>
        <el-button link @click="$router.push('/map-events')">地图事件</el-button>
        <el-button link type="primary" @click="openOfficial">官方文档</el-button>
        <el-button link @click="$router.push('/help/effects')">效果教程</el-button>
      </div>
      <div class="spacer" />
      <div class="theme">
        <el-tooltip :content="tooltip" placement="bottom">
          <el-button size="small" circle @click="toggleTheme">
            <el-icon v-if="isDark"><Moon /></el-icon>
            <el-icon v-else><Sunny /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
      <div class="version">M1</div>
    </el-header>
    <el-main>
      <router-view />
    </el-main>
  </el-container>

  </template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from './composables/useTheme'
import { Sunny, Moon } from '@element-plus/icons-vue'

const { isDark, setMode } = useTheme()
const tooltip = computed(() => (isDark.value ? '切换亮色' : '切换暗色'))

function toggleTheme() {
  setMode(isDark.value ? 'light' : 'dark')
}

function openOfficial() {
  window.open('https://visionfrog.gitbook.io/', '_blank')
}
</script>

<style scoped>
.app-header { display: flex; align-items: center; gap: 16px; }
.brand { font-weight: 600; }
.nav { display: flex; gap: 8px; align-items: center; }
.spacer { flex: 1; }
.theme { display: flex; align-items: center; gap: 12px; margin-right: 8px; }
.version { opacity: 0.7; }
</style>
