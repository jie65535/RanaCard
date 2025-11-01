<template>
  <div class="page">
    <el-alert type="info" show-icon :closable="false" title="如何开始">
      <template #default>
        <div>默认已加载游戏数据。也可以导入你的加密文件：</div>
        <div>• 路径示例（Steam）：C:\Program Files (x86)\Steam\steamapps\common\RanaCard\RanaCard_Data\StreamingAssets\Pendant.json</div>
        <div>• 修改后点击“导出 Pendant.json”，用导出的文件替换上述路径中的同名文件（建议先备份）。</div>
      </template>
    </el-alert>

    <div class="toolbar">
      <el-button type="primary" @click="loadData">加载游戏数据</el-button>
      <el-upload :show-file-list="false" :on-change="onUploadEncrypted">
        <el-button>导入 Pendant.json</el-button>
      </el-upload>
      <el-button :disabled="!pendants" @click="exportEncrypted">导出 Pendant.json</el-button>
      
      <el-button :disabled="!pendants" @click="openShare">分享改动</el-button>
      <el-input v-model="keyword" placeholder="搜索 ID/名称/效果" style="max-width: 320px" />
      <CharacterSelect v-model="selectedCharacter as any" clearable placeholder="角色" style="width: 140px" />
      <ComboSelect v-model="selectedCombo as any" clearable placeholder="流派" style="width: 140px" />
    </div>

    <div v-if="!pendants" class="empty">请先加载游戏数据或导入加密文件</div>

    <div v-else>
      <el-table height="calc(100vh - 260px)" :data="filtered" @row-click="selectRow" highlight-current-row border stripe>
        <el-table-column prop="ID" label="ID" width="180" sortable />
        <el-table-column prop="Name" label="名称" sortable />
        <el-table-column prop="Character" label="角色" width="120" sortable>
          <template #="{row}">
            <CharacterTag :value="row.Character" />
          </template>
        </el-table-column>
        <el-table-column prop="Combo" label="流派" width="120" sortable>
          <template #="{row}">
            <ComboTag :value="row.Combo" />
          </template>
        </el-table-column>
        <el-table-column prop="Level" label="等级" width="80" sortable />
        <el-table-column prop="EffectDescription" label="效果描述" min-width="240" show-overflow-tooltip />
        <el-table-column prop="EffectString" label="效果字符串" min-width="260" show-overflow-tooltip />
      </el-table>
    </div>

    <el-drawer v-model="editorVisible" :title="'编辑：' + (editBuffer?.ID || '')" :size="drawerSize" :with-header="true" destroy-on-close>
      <div class="drawer-toolbar">
        <el-switch v-model="jsonMode" active-text="直接编辑 JSON" />
      </div>
      <template v-if="jsonMode">
        <el-input v-model="advancedText" type="textarea" :rows="18" />
      </template>
      <template v-else>
        <el-form label-width="120px" class="form" v-if="editBuffer">
          <template v-for="key in pendantEditableOrder" :key="key">
            <template v-if="(editBuffer as any)[key] !== undefined">
              <el-form-item :label="fieldLabels[key] || key">
                <el-input v-if="textFields.has(key) && !textAreaFields.has(key)" v-model="(editBuffer as any)[key]" />
                <el-input v-else-if="textAreaFields.has(key)" type="textarea" :rows="3" v-model="(editBuffer as any)[key]" />
                <el-input-number v-else-if="numberFields.has(key)" :min="0" v-model="(editBuffer as any)[key]" />
                <el-switch v-else-if="switchFields.has(key)" :active-value="1" :inactive-value="0" v-model="(editBuffer as any)[key]" />
                <!-- 角色 -->
                <CharacterSelect v-else-if="key === 'Character'" v-model="editBuffer.Character" />
                <!-- 流派 -->
                <ComboSelect v-else-if="key === 'Combo'" v-model="editBuffer.Combo" />
                <el-input v-else v-model="(editBuffer as any)[key]" />
              </el-form-item>
            </template>
          </template>
          <div class="hint">更多字段请使用“直接编辑 JSON”。</div>
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
          <el-input v-model="shareTitle" placeholder="例如：更强的初始挂件" />
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
import CharacterTag from '../components/tag/CharacterTag.vue'
import ComboTag from '../components/tag/ComboTag.vue'
import CharacterSelect from '../components/edit/CharacterSelect.vue'
import ComboSelect from '../components/edit/ComboSelect.vue'

const store = useDataStore()
const pendants = computed(() => store.pendants)
const keyword = ref('')
const current = ref<any | null>(null)
const editorVisible = ref(false)
const editBuffer = ref<any | null>(null)
const originalRef = ref<any | null>(null)
const jsonMode = ref(false)
const width = ref<number>(typeof window !== 'undefined' ? window.innerWidth : 1200)
const drawerSize = computed(() => width.value < 900 ? '100%' : '520px')
const advancedText = ref('')
const errors = ref<string[]>([])
const selectedCharacter = ref<string | null>(null)
const selectedCombo = ref<string | null>(null)
const shareVisible = ref(false)
const shareTitle = ref('')
const shareAuthor = ref(localStorage.getItem('share.author') || '')
const shareDescription = ref('')
const router = useRouter()

// 仅显示存在差异的字段
const pendantEditableOrder = [
  'Name','ID','Character','Combo','Level','EffectDescription','EffectString','ForbidState','CanGainByPack'
] as const
const fieldLabels: Record<string,string> = {
  Name:'名称', ID:'ID', Character:'角色', Combo:'流派', Level:'等级',
  EffectDescription:'效果描述', EffectString:'效果字符串', ForbidState:'禁用状态', CanGainByPack:'可通过卡包获得'
}
const numberFields = new Set(['Level','ForbidState'])
const switchFields = new Set(['CanGainByPack'])
const textAreaFields = new Set(['EffectDescription','EffectString'])
const textFields = new Set(['Name','ID'])

const filtered = computed(() => {
  if (!pendants.value) return []
  const kw = keyword.value.trim().toLowerCase()
  const items = pendants.value.Pendant || []
  return items.filter((p: any) => {
    const id = String(p.ID || '').toLowerCase()
    const name = String(p.Name || '').toLowerCase()
    const ed = String(p.EffectDescription || '').toLowerCase()
    const es = String(p.EffectString || '').toLowerCase()
    const kwOk = !kw || id.includes(kw) || name.includes(kw) || ed.includes(kw) || es.includes(kw)
    const chOk = !selectedCharacter.value || p.Character === selectedCharacter.value
    const coOk = !selectedCombo.value || p.Combo === selectedCombo.value
    return kwOk && chOk && coOk
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
  const data = await getData('pendant')
  store.setPendants(data)
  current.value = null
}

async function onUploadEncrypted(file: any) {
  try {
    const data = await decodeEncrypted(file.raw as File)
    if (!data || !Array.isArray(data.Pendant)) throw new Error('不是有效的加密 Pendant.json 内容')
    store.setPendants(data)
    current.value = null
  } catch (e: any) {
    alert('解密失败：' + e.message)
  }
}

async function runValidate() {
  errors.value = []
  if (!pendants.value) return
  const res = await validate('pendant', pendants.value)
  errors.value = res.errors
}

function openShare() {
  shareTitle.value = ''
  shareDescription.value = ''
  shareVisible.value = true
}

async function doShare() {
  if (!pendants.value) return
  const res = await validate('pendant', pendants.value)
  if (!res.ok) {
    errors.value = res.errors
    return
  }
  try {
    const { id, url, manageToken } = await shareCreate({ title: shareTitle.value, author: shareAuthor.value || undefined, description: shareDescription.value || undefined }, { pendants: pendants.value })
    const map = JSON.parse(localStorage.getItem('share.manageTokens') || '{}')
    map[id] = manageToken
    localStorage.setItem('share.manageTokens', JSON.stringify(map))
    if (shareAuthor.value.trim()) localStorage.setItem('share.author', shareAuthor.value.trim())
    shareVisible.value = false
    const full = (import.meta as any).env?.VITE_API_BASE ? `${(import.meta as any).env.VITE_API_BASE.replace(/\/+$/, '')}${url}` : url
    alert('发布成功！\n分享链接：' + full + '\n\n提示：管理令牌已保存在本地，可在“社区分享”页面删除该条目。')
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
  if (!pendants.value) return
  try {
    const enc = await encodeEncrypted(pendants.value)
    const blob = new Blob([enc], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Pendant.json'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e: any) {
    alert('加密导出失败：' + e.message)
  }
}

onMounted(() => {
  if (!store.pendants) {
    loadData()
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => { width.value = window.innerWidth })
  }
})

watch(pendants, () => { errors.value = [] })

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

// 采用白名单字段集合替代通用推断
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 12px; }
.toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.editor { border: 1px solid var(--el-border-color); border-radius: 6px; }
.editor-head { font-weight: 600; margin-bottom: 8px; }
.editor-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
.empty { opacity: 0.75; padding: 12px; }
.drawer-toolbar { display:flex; justify-content:flex-end; margin-bottom:8px }
.drawer-toolbar { display:flex; justify-content:flex-end; margin-bottom:8px }
</style>
