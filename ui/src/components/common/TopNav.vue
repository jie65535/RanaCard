<template>
    <div class="nav">
        <template v-for="item in navList" :key="item.name">
            <el-button link v-if="item.type" :type="item.type" @click="onClick(item)">{{ item.name }}</el-button>
            <el-button link v-else @click="onClick(item)" :class="getIsSelected(item)">{{ item.name }}</el-button>
        </template>
    </div>
</template>

<style scoped>
.nav { display: flex; gap: 8px; align-items: center; }
.selected { font-weight: 600; color: #ef940b; font-size: 16px; }
</style>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

interface NavItem {
  name: string;
  path: string;
  type?: 'primary';
  click?: () => void;
}

const router = useRouter();
const route = useRoute();

const navList = ref<NavItem[]>([
  { name: '卡牌', path: '/cards' },
  { name: '挂件', path: '/pendants' },
  { name: '地图事件', path: '/map-events' },
  { name: '开局效果', path: '/begin-effects' },
  { name: '社区分享', path: '/share' },
  { name: '官方文档', path: '', type: 'primary', click: () => window.open('https://visionfrog.gitbook.io/', '_blank') },
  { name: '效果教程', path: '/help/effects' },
]);

function onClick(item: NavItem) {
    if (item.click) {
        item.click();
        return;
    }
    if (item.path) {
        router.push(item.path);
    }
}

function getIsSelected(item: NavItem) {
    return route.path === item.path ? 'selected' : '';
}
</script>