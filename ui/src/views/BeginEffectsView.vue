<template>
  <div class="page">
    <el-alert type="info" show-icon :closable="false" title="如何开始">
      <template #default>
        <div>默认已加载游戏数据。也可以导入你的加密文件：</div>
        <div>• 路径示例（Steam）：C:\\Program Files (x86)\\Steam\\steamapps\\common\\RanaCard\\RanaCard_Data\\StreamingAssets\\BeginEffect.json</div>
        <div>• 修改后点击“导出 BeginEffect.json”，用导出的文件替换上述路径中的同名文件（建议先备份）。</div>
      </template>
    </el-alert>

    <div class="toolbar">
      <el-button type="primary" @click="loadData">加载游戏数据</el-button>
      <el-upload :show-file-list="false" :on-change="onUploadEncrypted">
        <el-button>导入 BeginEffect.json</el-button>
      </el-upload>
      <el-button :disabled="!beginEffects" @click="exportEncrypted">导出 BeginEffect.json</el-button>
      <el-button :disabled="!beginEffects" @click="openShare">分享改动</el-button>
      <el-input v-model="keyword" placeholder="搜索 ID/描述/效果" style="max-width: 320px" />
      <el-select v-model="unlockedFilter" clearable placeholder="解锁状态" style="width: 140px">
        <el-option :label="'已解锁'" :value="1" />
        <el-option :label="'未解锁'" :value="0" />
      </el-select>
      <el-input-number v-model="minStar" :min="0" :max="999" placeholder="星数≥" :step="1" style="width: 140px" />
      <el-input-number v-model="maxStar" :min="0" :max="999" placeholder="星数≤" :step="1" style="width: 140px" />
    </div>

    <div v-if="!beginEffects" class="empty">请先加载游戏数据或导入加密文件</div>

    <div v-else>
      <el-table height="calc(100vh - 260px)" :data="filtered" @row-click="selectRow" highlight-current-row border stripe>
        <el-table-column prop="ID" label="ID" width="200" sortable />
        <el-table-column prop="EffectDescription" label="描述" min-width="220" show-overflow-tooltip />
        <el-table-column prop="EffectString" label="效果" min-width="260" show-overflow-tooltip />
        <el-table-column prop="StarCount" label="星数" width="100" sortable />
        <el-table-column prop="UnlockCondition" label="解锁条件" min-width="200" show-overflow-tooltip />
        <el-table-column label="解锁" width="80">
          <template #default="{ row }">{{ row.UnLocked === 1 ? '是' : '否' }}</template>
        </el-table-column>
      </el-table>
    </div>

    <el-drawer v-model="editorVisible" :title="'编辑：' + (editBuffer?.ID || '')" :size="drawerSize" :with-header="true" destroy-on-close>
      <div class="drawer-toolbar">
        <el-switch v-model="jsonMode" @change="loadAdvanced" active-text="直接编辑 JSON" />
      </div>
      <template v-if="jsonMode">
        <el-input v-model="advancedText" type="textarea" :rows="18" />
        <div class="editor-actions">
          <el-button @click="loadAdvanced">刷新</el-button>
          <el-button type="primary" @click="saveAdvanced">应用</el-button>
        </div>
      </template>
      <template v-else>
        <el-form label-width="120px" class="form" v-if="editBuffer">
          <el-form-item label="ID"><el-input v-model="editBuffer.ID" /></el-form-item>
          <el-form-item label="描述"><el-input v-model="editBuffer.EffectDescription" type="textarea" :rows="2" /></el-form-item>
          <el-form-item label="效果"><el-input v-model="editBuffer.EffectString" type="textarea" :rows="3" /></el-form-item>
          <el-form-item label="解锁"><el-switch :active-value="1" :inactive-value="0" v-model="editBuffer.UnLocked" /></el-form-item>
          <el-form-item label="解锁条件"><el-input v-model="editBuffer.UnlockCondition" /></el-form-item>
          <el-form-item label="星数"><el-input-number v-model="editBuffer.StarCount" :min="0" :step="1" /></el-form-item>
        </el-form>
      </template>
      <div class="editor-actions">
        <el-button @click="onCancel">取消</el-button>
        <el-button type="primary" @click="onSave">保存</el-button>
      </div>
    </el-drawer>

    <el-alert v-if="errors.length" type="error" title="校验失败" show-icon :closable="false" style="margin-top: 8px">
      <template #default>
        <div v-for="(e, i) in errors" :key="i">• {{ e }}</div>
      </template>
    </el-alert>
    
    <el-dialog v-model="shareVisible" title="分享改动" width="620px">
      <el-form label-width="100px">
        <el-form-item label="标题">
          <el-input v-model="shareTitle" placeholder="例如：开局效果重做/合集" />
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="shareAuthor" placeholder="你的名字" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="shareDescription" type="textarea" :rows="6" placeholder="详细描述你的改动、思路与使用建议（支持多行）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shareVisible=false">取消</el-button>
        <el-button type="primary" :disabled="!shareTitle.trim() || !shareAuthor.trim() || !shareDescription.trim()" @click="doShare">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore, type BeginEffect } from '../store/data'
import { decodeEncrypted, encodeEncrypted, getData, validate, shareCreate } from '../api'

const store = useDataStore()
const beginEffects = computed(() => store.beginEffects)

const keyword = ref('')
const unlockedFilter = ref<number | null>(null)
const minStar = ref<number | null>(null)
const maxStar = ref<number | null>(null)
const width = ref<number>(typeof window !== 'undefined' ? window.innerWidth : 1200)
const drawerSize = computed(() => (width.value >= 1200 ? '720px' : '90%'))

const current = ref<BeginEffect | null>(null)
const originalRef = ref<any>(null)
const editBuffer = ref<any>(null)
const editorVisible = ref(false)
const jsonMode = ref(false)
const advancedText = ref('')
const errors = ref<string[]>([])
const shareVisible = ref(false)
const shareTitle = ref('')
const shareAuthor = ref(localStorage.getItem('share.author') || '')
const shareDescription = ref('')
const router = useRouter()

const filtered = computed(() => {
  const list = beginEffects.value || []
  const kw = keyword.value.trim().toLowerCase()
  return list.filter((e) => {
    const id = (e.ID || '').toLowerCase()
    const desc = (e.EffectDescription || '').toLowerCase()
    const eff = (e.EffectString || '').toLowerCase()
    const kwOk = !kw || id.includes(kw) || desc.includes(kw) || eff.includes(kw)
    const unOk = unlockedFilter.value == null || (e.UnLocked ?? 0) === unlockedFilter.value
    const star = typeof e.StarCount === 'number' ? e.StarCount : null
    const minOk = minStar.value == null || (star == null ? true : star >= minStar.value)
    const maxOk = maxStar.value == null || (star == null ? true : star <= maxStar.value)
    return kwOk && unOk && minOk && maxOk
  })
})

function selectRow(row: any) {
  originalRef.value = row
  current.value = row
  editBuffer.value = JSON.parse(JSON.stringify(row))
  jsonMode.value = false
  editorVisible.value = true
  loadAdvanced()
}

async function loadData() {
  const data = await getData('begineffect')
  if (!Array.isArray(data)) {
    throw new Error('后端返回的 BeginEffect 数据不是数组')
  }
  store.setBeginEffects(data)
  current.value = null
}

async function onUploadEncrypted(file: any) {
  try {
    const data = await decodeEncrypted(file.raw as File)
    if (!data || !Array.isArray(data)) throw new Error('不是有效的加密 BeginEffect.json 内容')
    store.setBeginEffects(data)
    current.value = null
  } catch (e: any) {
    alert('解密失败：' + e.message)
  }
}

async function runValidate() {
  errors.value = []
  if (!beginEffects.value) return
  const res = await validate('begineffect', beginEffects.value)
  errors.value = res.errors
}

function openShare() {
  shareTitle.value = ''
  shareDescription.value = ''
  shareVisible.value = true
}

async function doShare() {
  if (!beginEffects.value) return
  const res = await validate('begineffect', beginEffects.value)
  if (!res.ok) { errors.value = res.errors; return }
  try {
    const { id, url, manageToken } = await shareCreate({ title: shareTitle.value, author: shareAuthor.value || undefined, description: shareDescription.value || undefined }, { beginEffects: beginEffects.value })
    const map = JSON.parse(localStorage.getItem('share.manageTokens') || '{}')
    map[id] = manageToken
    localStorage.setItem('share.manageTokens', JSON.stringify(map))
    if (shareAuthor.value.trim()) localStorage.setItem('share.author', shareAuthor.value.trim())
    shareVisible.value = false
    const full = (import.meta as any).env?.VITE_API_BASE ? `${(import.meta as any).env.VITE_API_BASE.replace(/\/+$/, '')}${url}` : url
    alert('发布成功！\n分享链接：' + full)
    router.push('/share')
  } catch (e: any) {
    alert('发布失败：' + (e?.message || '未知错误'))
  }
}

function loadAdvanced() {
  const src = jsonMode.value ? editBuffer.value : current.value
  if (!src) return
  advancedText.value = JSON.stringify(src, null, 2)
}

function saveAdvanced() {
  if (!editBuffer.value) return
  try {
    const obj = JSON.parse(advancedText.value)
    editBuffer.value = obj
  } catch (e: any) {
    alert('JSON 解析失败：' + e.message)
  }
}

async function exportEncrypted() {
  if (!beginEffects.value) return
  try {
    const enc = await encodeEncrypted(beginEffects.value)
    const blob = new Blob([enc], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'BeginEffect.json'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e: any) {
    alert('加密导出失败：' + e.message)
  }
}

onMounted(() => {
  if (!store.beginEffects) {
    loadData()
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => { width.value = window.innerWidth })
  }
})

function onCancel() {
  editorVisible.value = false
  editBuffer.value = null
}

function onSave() {
  if (!originalRef.value || !editBuffer.value) return
  Object.keys(originalRef.value).forEach(k => delete originalRef.value[k])
  Object.assign(originalRef.value, editBuffer.value)
  current.value = originalRef.value
  editorVisible.value = false
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 12px; }
.toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.editor-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
.empty { opacity: 0.75; padding: 12px; }
.drawer-toolbar { display:flex; justify-content:flex-end; margin-bottom:8px }
</style>
