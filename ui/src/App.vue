<template>
  <el-container style="height: 100vh">
    <el-header height="56px" class="app-header">
      <div class="brand">种呱得呱助手</div>
      <TopNav />
      <div class="spacer" />
      <div class="actions">
        <el-tooltip content="查看源代码" placement="bottom">
          <el-button size="small" circle @click="openGithub" aria-label="GitHub">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/>
            </svg>
          </el-button>
        </el-tooltip>
      
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
import TopNav from './components/common/TopNav.vue'

const { isDark, setMode } = useTheme()
const tooltip = computed(() => (isDark.value ? '切换亮色' : '切换暗色'))

function toggleTheme() {
  setMode(isDark.value ? 'light' : 'dark')
}

function openOfficial() {
  window.open('https://visionfrog.gitbook.io/', '_blank')
}

function openGithub() {
  window.open('https://github.com/jie65535/RanaCard', '_blank')
}
</script>

<style scoped>
.app-header { display: flex; align-items: center; gap: 16px; }
.brand { font-weight: 600; }
.spacer { flex: 1; }
.actions { display: flex; align-items: center; gap: 12px; margin-right: 8px; }
.version { opacity: 0.7; }
</style>
