<template>
  <div class="page">
    <div class="toolbar">
      <el-input v-model="q" placeholder="搜索标题" style="max-width: 320px" />
      <el-select v-model="sortKey" style="width: 140px" placeholder="排序字段">
        <el-option label="按时间" value="time" />
        <el-option label="按下载" value="downloads" />
      </el-select>
      <el-select v-model="sortOrder" style="width: 120px" placeholder="顺序">
        <el-option label="降序" value="desc" />
        <el-option label="升序" value="asc" />
      </el-select>
      <el-button type="primary" @click="load">刷新</el-button>
      <el-button type="success" @click="openGlobalShare">分享所有改动</el-button>
    </div>

    <el-empty v-if="items.length === 0" description="暂无分享" />

    <el-row v-else :gutter="12">
      <el-col v-for="it in sortedItems" :key="it.id" :xs="24" :sm="12" :md="8" :lg="6">
        <el-card :class="['item', { highlight: it.id===highlightId }]" @click="openDetail(it)" shadow="hover">
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
            <el-button size="small" type="primary" @click="onImport(it.id)">导入</el-button>
            <el-button v-if="hasToken(it.id)" size="small" type="danger" @click="onDelete(it.id)">删除</el-button>
            <el-button size="small" @click="copyLink(it.id)">复制链接</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="importVisible" title="导入补丁" width="720px">
      <div class="preview" v-if="importPreview">
        <div class="row">
          <span>类型：{{ importPreview.kind }}</span>
          <el-tag v-if="importPreview.kind==='legacy-data'" type="warning" size="small" style="margin-left:8px">旧格式整包分享</el-tag>
        </div>
        <div class="row">新增：{{ importPreview.adds.length }}，更新：{{ importPreview.updates.length }}，删除：{{ importPreview.deletes.length }}</div>
        <template v-if="true">
          <el-collapse>
            <el-collapse-item name="adds" v-if="importPreview.adds.length">
              <template #title>新增（{{ importPreview.adds.length }} 项）</template>
              <ul>
                <li v-for="a in importPreview.adds" :key="a.id">{{ a.id }}</li>
              </ul>
            </el-collapse-item>
            <el-collapse-item name="updates" v-if="importPreview.updates.length">
              <template #title>更新（{{ importPreview.updates.length }} 项）</template>
              <div v-for="u in importPreview.updates" :key="u.id" class="upd">
                <div class="upd-id">{{ u.id }}</div>
                <div class="upd-fields">
                  <div v-for="(ft, key) in u.fields" :key="key" class="field-line">
                    <span class="k">{{ key }}</span>
                    <el-tooltip :content="full(ft.from)" placement="top" :show-after="200">
                      <span class="v from">{{ pretty(ft.from) }}</span>
                    </el-tooltip>
                    <span class="arrow">→</span>
                    <el-tooltip :content="full(ft.to)" placement="top" :show-after="200">
                      <span class="v to">{{ pretty(ft.to) }}</span>
                    </el-tooltip>
                  </div>
                </div>
              </div>
            </el-collapse-item>
            <el-collapse-item name="deletes" v-if="importPreview.deletes.length">
              <template #title>删除（{{ importPreview.deletes.length }} 项）</template>
              <ul>
                <li v-for="d in importPreview.deletes" :key="d.id">{{ d.id }}</li>
              </ul>
            </el-collapse-item>
          </el-collapse>
        </template>
      </div>
      <div class="mode">
        <div class="row">应用方式：</div>
      <el-radio-group v-model="importMode">
        <el-radio label="replace">基于官方基线应用（不含本地改动）</el-radio>
        <el-radio label="merge">基于当前编辑数据应用（与本地改动合并，冲突跳过）</el-radio>
      </el-radio-group>
      </div>
      <el-alert style="margin-top:10px" type="info" :closable="false" show-icon title="导入后提示">
        <template #default>导入完成后，请到对应页面点击“导出 XXX.json”，将导出的文件替换到游戏目录中，才会在游戏内生效。</template>
      </el-alert>
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
      <div class="detail-preview" v-if="detailPreview">
        <div class="title" style="margin:10px 0 6px; font-weight:600;">补丁预览</div>
        <div class="meta">类型：{{ detailPreview.kind }}；新增：{{ detailPreview.adds.length }}，更新：{{ detailPreview.updates.length }}，删除：{{ detailPreview.deletes.length }}</div>
        <el-collapse>
          <el-collapse-item name="upd" v-if="detailPreview.updates.length">
            <template #title>更新（{{ detailPreview.updates.length }} 项）</template>
            <div v-for="u in detailPreview.updates" :key="u.id" class="upd">
              <div class="upd-id">{{ u.id }}</div>
              <div class="upd-fields">
                <div v-for="(ft, key) in u.fields" :key="key" class="field-line">
                  <span class="k">{{ key }}</span>
                  <el-tooltip :content="full(ft.from)" placement="top" :show-after="200">
                    <span class="v from">{{ pretty(ft.from) }}</span>
                  </el-tooltip>
                  <span class="arrow">→</span>
                  <el-tooltip :content="full(ft.to)" placement="top" :show-after="200">
                    <span class="v to">{{ pretty(ft.to) }}</span>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </el-collapse-item>
          <el-collapse-item name="add" v-if="detailPreview.adds.length">
            <template #title>新增（{{ detailPreview.adds.length }} 项）</template>
            <ul><li v-for="a in detailPreview.adds" :key="a.id">{{ a.id }}</li></ul>
          </el-collapse-item>
          <el-collapse-item name="del" v-if="detailPreview.deletes.length">
            <template #title>删除（{{ detailPreview.deletes.length }} 项）</template>
            <ul><li v-for="d in detailPreview.deletes" :key="d.id">{{ d.id }}</li></ul>
          </el-collapse-item>
        </el-collapse>
      </div>
      <div class="actions">
        <el-button type="primary" @click="onImport(detail.id)">导入</el-button>
        <el-button v-if="hasToken(detail.id)" type="danger" @click="onDelete(detail.id)">删除</el-button>
        <el-button @click="copyLink(detail.id)">复制链接</el-button>
      </div>
    </template>
  </el-drawer>
  <GlobalShareDialog ref="globalShareRef" @created="onGlobalCreated" />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { shareList, shareGet, shareDelete, patchApply, getData } from '../api'
import GlobalShareDialog from '../components/common/GlobalShareDialog.vue'
import { useDataStore, type CardRoot, type PendantRoot, type MapEvent, type BeginEffect } from '../store/data'

function pretty(v: any) { try { if (v === null || v === undefined) return String(v); if (typeof v === "string") return v.length>60 ? v.slice(0,60)+"…" : v; if (typeof v === "number" || typeof v === "boolean") return String(v); const t = JSON.stringify(v); return t.length>60 ? t.slice(0,60)+"…" : t } catch { return String(v) } }
function full(v: any) { try { if (v === null || v === undefined) return String(v); if (typeof v === "string") return v; if (typeof v === "number" || typeof v === "boolean") return String(v); return JSON.stringify(v) } catch { return String(v) } }
const store = useDataStore()
const q = ref('')
const items = ref<Array<{ id: string; title: string; author?: string; createdAt: string; size: number; downloads: number; description?: string }>>([])
const width = ref<number>(typeof window !== 'undefined' ? window.innerWidth : 1200)
const drawerSize = computed(() => width.value < 900 ? '100%' : '520px')
const sortKey = ref<'time'|'downloads'>('time')
const sortOrder = ref<'asc'|'desc'>('desc')
const sortedItems = computed(() => {
  const list = items.value.slice()
  list.sort((a,b) => {
    let av = sortKey.value==='downloads' ? a.downloads : new Date(a.createdAt).getTime()
    let bv = sortKey.value==='downloads' ? b.downloads : new Date(b.createdAt).getTime()
    if (isNaN(Number(av))) av = 0; if (isNaN(Number(bv))) bv = 0
    return sortOrder.value==='asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
  })
  return list
})
const highlightId = ref<string>('')
const globalShareRef = ref<InstanceType<typeof GlobalShareDialog> | null>(null)
function openGlobalShare() { globalShareRef.value?.show() }

async function onGlobalCreated(id: string) {
  await load()
  const it = items.value.find(i => i.id === id)
  if (it) {
    highlightId.value = id
    openDetail(it)
    setTimeout(() => { highlightId.value = '' }, 3000)
  }
}

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
const importPreview = ref<any | null>(null)
let pendingPkg: any = null

async function onImport(id: string) {
  importId.value = id
  try {
    const data = await shareGet(id)
    pendingPkg = data
    if (Array.isArray(data?.patches)) {
      const patches = data.patches
      const kinds = patches.map((p: any) => (p?.meta?.kind || '').toLowerCase()).filter(Boolean)
      importPreview.value = {
        kind: kinds.join(',') || 'multiple',
        adds: patches.flatMap((p: any) => (p?.changes?.adds || []).map((x: any) => ({ ...x, _kind: (p?.meta?.kind || '').toLowerCase() }))),
        updates: patches.flatMap((p: any) => (p?.changes?.updates || []).map((x: any) => ({ ...x, _kind: (p?.meta?.kind || '').toLowerCase() }))),
        deletes: patches.flatMap((p: any) => (p?.changes?.deletes || []).map((x: any) => ({ ...x, _kind: (p?.meta?.kind || '').toLowerCase() })))}
    } else {
      const patch = data.patch
      const ch = patch?.changes || {}
      importPreview.value = {
        kind: (patch?.meta?.kind || data?.meta?.kinds?.[0] || '').toLowerCase(),
        adds: ch.adds || [],
        updates: ch.updates || [],
        deletes: ch.deletes || []
      }
    }
  } catch {
    importPreview.value = null
  }
  importVisible.value = true
}

async function doImport() {
  const id = importId.value
  if (!id) return
  try {
    const data = pendingPkg || await shareGet(id)
    const pkg = data || {}
    // 优先补丁导入（只应用改动）
    if (Array.isArray(pkg.patches)) {
      for (const p of pkg.patches as any[]) {
        const kind: string = (p?.meta?.kind || '').toLowerCase()
        if (!kind) continue
        if (kind === 'card') {
          const target = importMode.value === 'replace' || !store.cards ? (await getData('card')) : store.cards
          const resp = await patchApply('card', p, target)
          store.setCards(resp.result as CardRoot)
        } else if (kind === 'pendant') {
          const target = importMode.value === 'replace' || !store.pendants ? (await getData('pendant')) : store.pendants
          const resp = await patchApply('pendant', p, target)
          store.setPendants(resp.result as PendantRoot)
        } else if (kind === 'mapevent') {
          const target = importMode.value === 'replace' || !store.mapEvents ? (await getData('mapevent')) : store.mapEvents
          const resp = await patchApply('mapevent', p, target)
          store.setMapEvents(resp.result as MapEvent[])
        } else if (kind === 'begineffect') {
          const target = importMode.value === 'replace' || !store.beginEffects ? (await getData('begineffect')) : store.beginEffects
          const resp = await patchApply('begineffect', p, target)
          store.setBeginEffects(resp.result as BeginEffect[])
        }
      }
    } else if (pkg.patch) {
      const patch: any = pkg.patch
      const kind: string = (patch?.meta?.kind || pkg.meta?.kinds?.[0] || '').toLowerCase()
      if (!kind) throw new Error('分享补丁缺少种类')
      if (kind === 'card') {
        const target = importMode.value === 'replace' || !store.cards ? (await getData('card')) : store.cards
        const resp = await patchApply('card', patch, target)
        store.setCards(resp.result as CardRoot)
      } else if (kind === 'pendant') {
        const target = importMode.value === 'replace' || !store.pendants ? (await getData('pendant')) : store.pendants
        const resp = await patchApply('pendant', patch, target)
        store.setPendants(resp.result as PendantRoot)
      } else if (kind === 'mapevent') {
        const target = importMode.value === 'replace' || !store.mapEvents ? (await getData('mapevent')) : store.mapEvents
        const resp = await patchApply('mapevent', patch, target)
        store.setMapEvents(resp.result as MapEvent[])
      } else if (kind === 'begineffect') {
        const target = importMode.value === 'replace' || !store.beginEffects ? (await getData('begineffect')) : store.beginEffects
        const resp = await patchApply('begineffect', patch, target)
        store.setBeginEffects(resp.result as BeginEffect[])
      } else {
        throw new Error('不支持的补丁类型：' + kind)
      }
    } else {
      throw new Error('该分享条目未包含补丁，请刷新后重试。')
    }
    ElMessage.success('导入完成。提示：请到对应页面导出 JSON 替换游戏文件后在游戏中生效。')
  } catch (e: any) {
    ElMessage.error('导入失败：' + (e?.message || '未知错误'))
  } finally {
    importVisible.value = false
    pendingPkg = null
    importPreview.value = null
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


onMounted(async () => {
  // Deep-link focus: #/share?id=xxxxx -> 仅打开详情并高亮，不自动导入
  const hash = typeof window !== 'undefined' ? window.location.hash : ''
  const qstr = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
  const focusId = new URLSearchParams(qstr).get('id') || ''
  await load()
  if (focusId) {
    const it = items.value.find(i => i.id === focusId)
    if (it) {
      highlightId.value = focusId
      openDetail(it)
      setTimeout(() => { highlightId.value = '' }, 3000)
    }
  }
  if (typeof window !== 'undefined') window.addEventListener('resize', () => { width.value = window.innerWidth })
})

const detailVisible = ref(false)
const detail = ref<any>(null)
const detailPreview = ref<any | null>(null)
async function openDetail(it: any) {
  detail.value = it
  detailVisible.value = true
  detailPreview.value = null
  try {
    const pkg = await shareGet(it.id)
    if (Array.isArray(pkg?.patches)) {
      const patches = pkg.patches
      const kinds = patches.map((p: any) => (p?.meta?.kind || '').toLowerCase()).filter(Boolean)
      detailPreview.value = {
        kind: kinds.join(',') || 'multiple',
        adds: patches.flatMap((p: any) => (p?.changes?.adds || []).map((x: any) => ({ ...x, _kind: (p?.meta?.kind || '').toLowerCase() }))),
        updates: patches.flatMap((p: any) => (p?.changes?.updates || []).map((x: any) => ({ ...x, _kind: (p?.meta?.kind || '').toLowerCase() }))),
        deletes: patches.flatMap((p: any) => (p?.changes?.deletes || []).map((x: any) => ({ ...x, _kind: (p?.meta?.kind || '').toLowerCase() })))
      }
    } else if (pkg?.patch) {
      const patch = pkg.patch
      const ch = patch?.changes || {}
      detailPreview.value = {
        kind: (patch?.meta?.kind || pkg?.meta?.kinds?.[0] || '').toLowerCase(),
        adds: ch.adds || [],
        updates: ch.updates || [],
        deletes: ch.deletes || []
      }
    }
  } catch {
    detailPreview.value = null
  }
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
.item.highlight { outline: 2px solid var(--el-color-primary); }
/* Import dialog preview styles */
.preview .row { margin-bottom: 6px; }
.list { max-height: 180px; overflow: auto; border: 1px solid var(--el-border-color); padding: 6px; border-radius: 6px; margin-top: 6px; }
.list-title { font-weight: 600; margin-bottom: 6px; }
.upd { padding: 6px 8px; border-bottom: 1px dashed var(--el-border-color); }
.upd:last-child { border-bottom: none; }
.upd-id { font-weight: 600; margin-bottom: 4px; }
.field-line { display: flex; gap: 6px; align-items: baseline; margin: 2px 0; }
.field-line .k { color: var(--el-color-primary); min-width: 120px; }
.field-line .v { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
.field-line .v.from { opacity: 0.7; }
.field-line .arrow { opacity: 0.6; }
</style>
