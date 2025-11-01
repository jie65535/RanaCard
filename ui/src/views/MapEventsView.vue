<template>
  <div class="page">
    <el-alert type="info" show-icon :closable="false" title="如何开始">
      <template #default>
        <div>默认已加载游戏数据。也可以导入你的加密文件：</div>
        <div>• 路径示例（Steam）：C:\Program Files (x86)\Steam\steamapps\common\RanaCard\RanaCard_Data\StreamingAssets\MapEvent.json</div>
        <div>• 修改后点击“导出 MapEvent.json”，用导出的文件替换上述路径中的同名文件（建议先备份）。</div>
      </template>
    </el-alert>

    <div class="toolbar">
      <el-button type="primary" @click="loadData">加载游戏数据</el-button>
      <el-upload :show-file-list="false" :on-change="onUploadEncrypted">
        <el-button>导入 MapEvent.json</el-button>
      </el-upload>
      <el-button :disabled="!mapEvents" @click="exportEncrypted">导出 MapEvent.json</el-button>
      <el-button :disabled="!mapEvents" @click="openShare">分享改动</el-button>
      <el-input v-model="keyword" placeholder="搜索 ID/名称/内容/选项" style="max-width: 320px" />
      <CharacterSelect v-model="selectedCharacter as any" clearable placeholder="角色" style="width: 140px" />
      <el-input-number v-model="minStage" :min="-1" :max="999" placeholder="阶段≥" :step="1" style="width: 140px" />
      <el-input-number v-model="maxStage" :min="-1" :max="999" placeholder="阶段≤" :step="1" style="width: 140px" />
    </div>

    <div v-if="!mapEvents" class="empty">请先加载游戏数据或导入加密文件</div>

    <div v-else>
      <el-table height="calc(100vh - 260px)" :data="filtered" @row-click="selectRow" highlight-current-row border stripe>
        <el-table-column prop="ID" label="ID" width="200" sortable />
        <el-table-column prop="Name" label="名称" sortable />
        <el-table-column prop="LimitStage" label="阶段限制" width="120" sortable />
        <el-table-column prop="Character" label="角色" width="120" sortable>
          <template #="{row}">
            <CharacterTag :value="row.Character" />
          </template>
        </el-table-column>
        <el-table-column label="内容" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">{{ row.Content }}</template>
        </el-table-column>
        <el-table-column label="选项数" width="100">
          <template #default="{ row }">{{ (row.Choices?.length) ?? 0 }}</template>
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
          <el-form-item label="名称"><el-input v-model="editBuffer.Name" /></el-form-item>
          <el-form-item label="阶段限制"><el-input-number v-model="editBuffer.LimitStage" :min="-1" :step="1" /></el-form-item>
          <!-- <el-form-item label="角色"><el-input v-model="editBuffer.Character" /></el-form-item> -->
          <el-form-item label="角色">
            <CharacterSelect v-model="editBuffer.Character" />
          </el-form-item>
          <el-form-item label="内容"><el-input v-model="editBuffer.Content" type="textarea" :rows="4" /></el-form-item>

          <div class="editor-head">选项</div>
          <div style="margin-bottom:8px">
            <el-button size="small" @click="addChoice">新增选项</el-button>
          </div>
          <div v-for="(ch, idx) in (editBuffer.Choices || (editBuffer.Choices = []))" :key="idx" class="choice">
            <el-card shadow="never">
              <template #header>
                <div style="display:flex; align-items:center; gap:8px">
                  <div>选项 {{ idx + 1 }}</div>
                  <el-button type="danger" size="small" @click="removeChoice(idx)">删除</el-button>
                </div>
              </template>
              <el-form-item label="描述"><el-input v-model="ch.Description" /></el-form-item>
              <el-form-item label="效果"><el-input v-model="ch.Effect" type="textarea" :rows="2" /></el-form-item>
            </el-card>
          </div>

          <div class="hint">如需修改其它字段，请使用“直接编辑 JSON”。</div>
        </el-form>
      </template>
      <div class="editor-actions">
        <el-button @click="onCancel">取消</el-button>
        <el-button type="primary" @click="onSave">保存</el-button>
      </div>
    </el-drawer>

    <el-alert v-if="errors.length" type="error" show-icon :closable="false" :title="'校验失败：' + errors.length + ' 项'">
      <template #default>
        <div v-for="(e,i) in errors" :key="i">{{ e }}</div>
      </template>
    </el-alert>
    <el-dialog v-model="shareVisible" title="分享改动" width="620px">
      <el-form label-width="100px">
        <el-form-item label="标题">
          <el-input v-model="shareTitle" placeholder="例如：新增/调整地图事件集" />
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '../store/data'
import { getData, validate, decodeEncrypted, encodeEncrypted, shareCreate } from '../api'
import CharacterSelect from '../components/edit/CharacterSelect.vue'
import CharacterTag from '../components/tag/CharacterTag.vue'

const store = useDataStore()
const mapEvents = computed(() => store.mapEvents)
const keyword = ref('')
const selectedCharacter = ref<string | null>(null)
const minStage = ref<number | null>(null)
const maxStage = ref<number | null>(null)
const current = ref<any | null>(null)
const editorVisible = ref(false)
const editBuffer = ref<any | null>(null)
const originalRef = ref<any | null>(null)
const jsonMode = ref(false)
const width = ref<number>(typeof window !== 'undefined' ? window.innerWidth : 1200)
const drawerSize = computed(() => width.value < 900 ? '100%' : '640px')
const advancedText = ref('')
const errors = ref<string[]>([])
const shareVisible = ref(false)
const shareTitle = ref('')
const shareAuthor = ref(localStorage.getItem('share.author') || '')
const shareDescription = ref('')
const router = useRouter()

const characterOptions = computed(() => {
  if (!mapEvents.value) return [] as string[]
  const set = new Set<string>()
  for (const e of mapEvents.value) if (e.Character) set.add(String(e.Character))
  return Array.from(set).sort()
})

const filtered = computed(() => {
  if (!mapEvents.value) return []
  const kw = keyword.value.trim().toLowerCase()
  return mapEvents.value.filter((e: any) => {
    const id = String(e.ID || '').toLowerCase()
    const name = String(e.Name || '').toLowerCase()
    const content = String(e.Content || '').toLowerCase()
    const choicesText = (e.Choices || [])
      .map((c: any) => `${c?.Description || ''}\n${c?.Effect || ''}`)
      .join('\n')
      .toLowerCase()
    const kwOk = !kw || id.includes(kw) || name.includes(kw) || content.includes(kw) || choicesText.includes(kw)
    const chOk = !selectedCharacter.value || e.Character === selectedCharacter.value
    const st = typeof e.LimitStage === 'number' ? e.LimitStage : null
    const minOk = minStage.value == null || (st == null ? true : st >= minStage.value)
    const maxOk = maxStage.value == null || (st == null ? true : st <= maxStage.value)
    return kwOk && chOk && minOk && maxOk
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
  const data = await getData('mapevent')
  // Expect array
  if (!Array.isArray(data)) {
    throw new Error('后端返回的 MapEvent 数据不是数组')
  }
  store.setMapEvents(data)
  current.value = null
}

async function onUploadEncrypted(file: any) {
  try {
    const data = await decodeEncrypted(file.raw as File)
    if (!data || !Array.isArray(data)) throw new Error('不是有效的加密 MapEvent.json 内容')
    store.setMapEvents(data)
    current.value = null
  } catch (e: any) {
    alert('解密失败：' + e.message)
  }
}

async function runValidate() {
  errors.value = []
  if (!mapEvents.value) return
  const res = await validate('mapevent', mapEvents.value)
  errors.value = res.errors
}

function openShare() {
  shareTitle.value = ''
  shareDescription.value = ''
  shareVisible.value = true
}

async function doShare() {
  if (!mapEvents.value) return
  const res = await validate('mapevent', mapEvents.value)
  if (!res.ok) { errors.value = res.errors; return }
  try {
    const { id, url, manageToken } = await shareCreate({ title: shareTitle.value, author: shareAuthor.value || undefined, description: shareDescription.value || undefined }, { mapEvents: mapEvents.value })
    const map = JSON.parse(localStorage.getItem('share.manageTokens') || '{}')
    map[id] = manageToken
    localStorage.setItem('share.manageTokens', JSON.stringify(map))
    if (shareAuthor.value.trim()) localStorage.setItem('share.author', shareAuthor.value.trim())
    shareVisible.value = false
    const full = (import.meta as any).env?.VITE_API_BASE ? `${(import.meta as any).env.VITE_API_BASE.replace(/\/+$/, '')}${url}` : url
    alert('发布成功！\n分享链接：' + full)
    router.push(`/share?id=${id}`)
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
  if (!mapEvents.value) return
  try {
    const enc = await encodeEncrypted(mapEvents.value)
    const blob = new Blob([enc], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'MapEvent.json'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e: any) {
    alert('加密导出失败：' + e.message)
  }
}

onMounted(() => {
  if (!store.mapEvents) {
    loadData()
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => { width.value = window.innerWidth })
  }
})

watch(mapEvents, () => { errors.value = [] })

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

function addChoice() {
  if (!editBuffer.value) return
  if (!Array.isArray(editBuffer.value.Choices)) editBuffer.value.Choices = []
  editBuffer.value.Choices.push({ Description: '', Effect: '' })
}

function removeChoice(idx: number) {
  if (!editBuffer.value || !Array.isArray(editBuffer.value.Choices)) return
  editBuffer.value.Choices.splice(idx, 1)
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 12px; }
.toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.editor { border: 1px solid var(--el-border-color); border-radius: 6px; }
.editor-head { font-weight: 600; margin: 8px 0; }
.choice { margin-bottom: 8px; }
.editor-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
.empty { opacity: 0.75; padding: 12px; }
.drawer-toolbar { display:flex; justify-content:flex-end; margin-bottom:8px }
</style>
