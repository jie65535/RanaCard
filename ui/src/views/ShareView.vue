<template>
  <div class="page">
    <div class="toolbar">
      <el-input v-model="q" placeholder="搜索标题" style="max-width: 320px" />
      <el-button type="primary" @click="load">刷新</el-button>
    </div>

    <el-empty v-if="items.length === 0" description="暂无分享" />

    <el-row v-else :gutter="12">
      <el-col v-for="it in items" :key="it.id" :xs="24" :sm="12" :md="8" :lg="6">
        <el-card class="item" @click="openDetail(it)" shadow="hover">
          <div class="title">{{ it.title }}</div>
          <div class="meta">
            <span>作者：{{ it.author || '佚名' }}</span>
            <span>时间：{{ localTime(it.createdAt) }}</span>
          </div>
          <div class="desc">{{ (it.description || '').slice(0, 80) }}<span v-if="(it.description||'').length>80">...</span></div>
          <div class="meta">
            <span>下载：{{ it.downloads }}</span>
            <span>大小：{{ prettySize(it.size) }}</span>
          </div>
          <div class="actions" @click.stop>
            <el-button size="small" type="primary" @click="onImport(it.id)">一键导入</el-button>
            <el-button v-if="hasToken(it.id)" size="small" type="danger" @click="onDelete(it.id)">删除</el-button>
            <el-button size="small" @click="copyLink(it.id)">复制链接</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="importVisible" title="导入方式" width="420px">
      <el-radio-group v-model="importMode">
        <el-radio label="replace">替换（覆盖对应集合）</el-radio>
        <el-radio label="merge">合并覆盖（按 ID 覆盖，不处理删除）</el-radio>
      </el-radio-group>
      <template #footer>
        <el-button @click="importVisible=false">取消</el-button>
        <el-button type="primary" @click="doImport">确定导入</el-button>
      </template>
    </el-dialog>
  </div>

  <el-drawer v-model="detailVisible" :title="detail?.title || '详情'" :size="drawerSize">
    <template v-if="detail">
      <div class="meta">
        <span>作者：{{ detail.author || '佚名' }}</span>
        <span>时间：{{ localTime(detail.createdAt) }}</span>
        <span>下载：{{ detail.downloads }}</span>
        <span>大小：{{ prettySize(detail.size) }}</span>
      </div>
      <div class="detail-desc">{{ detail.description || '（无说明）' }}</div>
      <div class="actions">
        <el-button type="primary" @click="onImport(detail.id)">一键导入</el-button>
        <el-button v-if="hasToken(detail.id)" type="danger" @click="onDelete(detail.id)">删除</el-button>
        <el-button @click="copyLink(detail.id)">复制链接</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { shareList, shareGet, shareDelete } from '../api'
import { useDataStore, type CardRoot, type PendantRoot, type MapEvent, type BeginEffect } from '../store/data'

const store = useDataStore()
const q = ref('')
const items = ref<Array<{ id: string; title: string; author?: string; createdAt: string; size: number; downloads: number; description?: string }>>([])
const width = ref<number>(typeof window !== 'undefined' ? window.innerWidth : 1200)
const drawerSize = computed(() => width.value < 900 ? '100%' : '520px')

async function load() {
  const { items: list } = await shareList(q.value || undefined, 30)
  items.value = list
}

function prettySize(n: number) {
  if (n < 1024) return `${n}B`
  if (n < 1024*1024) return `${(n/1024).toFixed(1)}KB`
  return `${(n/1024/1024).toFixed(1)}MB`
}

function localTime(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  const hh = String(d.getHours()).padStart(2,'0')
  const mm = String(d.getMinutes()).padStart(2,'0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}

function tokenMap(): Record<string,string> {
  try { return JSON.parse(localStorage.getItem('share.manageTokens') || '{}') } catch { return {} }
}
function saveToken(id: string, tok: string) {
  const map = tokenMap(); map[id]=tok; localStorage.setItem('share.manageTokens', JSON.stringify(map))
}
function hasToken(id: string) { return Boolean(tokenMap()[id]) }

const importVisible = ref(false)
const importId = ref<string>('')
const importMode = ref<'replace'|'merge'>('replace')

async function onImport(id: string) {
  importId.value = id
  importVisible.value = true
}

async function doImport() {
  const id = importId.value
  if (!id) return
  try {
    const data = await shareGet(id)
    const pkg = data?.data || {}
    if (pkg.cards) {
      if (importMode.value === 'replace' || !store.cards) {
        store.setCards(pkg.cards as CardRoot)
      } else {
        store.setCards(mergeCards(store.cards, pkg.cards))
      }
    }
    if (pkg.pendants) {
      if (importMode.value === 'replace' || !store.pendants) {
        store.setPendants(pkg.pendants as PendantRoot)
      } else {
        store.setPendants(mergePendants(store.pendants, pkg.pendants))
      }
    }
    if (pkg.mapEvents) {
      if (importMode.value === 'replace' || !store.mapEvents) {
        store.setMapEvents(pkg.mapEvents as MapEvent[])
      } else {
        store.setMapEvents(mergeMapEvents(store.mapEvents, pkg.mapEvents))
      }
    }
    if (pkg.beginEffects) {
      if (importMode.value === 'replace' || !store.beginEffects) {
        store.setBeginEffects(pkg.beginEffects as BeginEffect[])
      } else {
        store.setBeginEffects(mergeBeginEffects(store.beginEffects, pkg.beginEffects))
      }
    }
    ElMessage.success('导入完成')
  } catch (e: any) {
    ElMessage.error('导入失败：' + (e?.message || '未知错误'))
  } finally {
    importVisible.value = false
  }
}

function mergeCards(dst: CardRoot, inc: CardRoot): CardRoot {
  const map: Record<string, any> = {}
  for (const c of dst.Cards) map[String(c.ID)] = { ...c }
  for (const c of inc.Cards) map[String(c.ID)] = { ...map[String(c.ID)], ...c }
  return { Name: inc.Name || dst.Name, Cards: Object.values(map) }
}

function mergePendants(dst: PendantRoot, inc: PendantRoot): PendantRoot {
  const map: Record<string, any> = {}
  for (const p of dst.Pendant) map[String(p.ID)] = { ...p }
  for (const p of inc.Pendant) map[String(p.ID)] = { ...map[String(p.ID)], ...p }
  return { Name: inc.Name || dst.Name, Pendant: Object.values(map) }
}

function mergeMapEvents(dst: MapEvent[], inc: MapEvent[]): MapEvent[] {
  const map: Record<string, any> = {}
  for (const e of dst) map[String((e as any).ID)] = { ...e }
  for (const e of inc) map[String((e as any).ID)] = { ...map[String((e as any).ID)], ...e }
  return Object.values(map)
}

function mergeBeginEffects(dst: BeginEffect[], inc: BeginEffect[]): BeginEffect[] {
  const map: Record<string, any> = {}
  for (const e of dst) map[String((e as any).ID)] = { ...e }
  for (const e of inc) map[String((e as any).ID)] = { ...map[String((e as any).ID)], ...e }
  return Object.values(map)
}

async function onDelete(id: string) {
  const tok = tokenMap()[id]
  if (!tok) return
  await ElMessageBox.confirm('确认删除该分享？此操作不可恢复', '提示', { type: 'warning' })
  await shareDelete(id, tok)
  ElMessage.success('已删除')
  load()
}

function copyLink(id: string) {
  const link = `${location.origin}${location.pathname}#${'/share'}?id=${id}`
  navigator.clipboard?.writeText(link)
  ElMessage.success('已复制分享链接')
}

onMounted(() => {
  load()
  // Deep-link import: #/share?id=xxxxx
  const hash = typeof window !== 'undefined' ? window.location.hash : ''
  const qstr = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
  const id = new URLSearchParams(qstr).get('id')
  if (id) onImport(id)
  if (typeof window !== 'undefined') window.addEventListener('resize', () => { width.value = window.innerWidth })
})

const detailVisible = ref(false)
const detail = ref<any>(null)
function openDetail(it: any) {
  detail.value = it
  detailVisible.value = true
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 12px; }
.toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.item { margin-bottom: 12px; }
.title { font-weight: 600; margin-bottom: 6px; }
.meta { font-size: 12px; opacity: 0.8; display: flex; gap: 12px; margin-bottom: 6px; }
.actions { display: flex; gap: 8px; }
.desc { font-size: 13px; margin: 6px 0; line-height: 1.5; max-height: 3.1em; overflow: hidden; }
.detail-desc { white-space: pre-wrap; line-height: 1.6; }
</style>
