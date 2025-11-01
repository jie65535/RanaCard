<template>
  <div class="page">
    <el-alert type="info" show-icon :closable="false" title="如何开始">
      <template #default>
        <div>默认已加载游戏数据。也可以导入你的加密文件：</div>
        <div>• 路径示例（Steam）：C:\Program Files (x86)\Steam\steamapps\common\RanaCard\RanaCard_Data\StreamingAssets\Card.json</div>
        <div>• 修改后点击“导出 Card.json”，用导出的文件替换上述路径中的同名文件（建议先备份）。</div>
      </template>
    </el-alert>

    <div class="toolbar">
      <el-button type="primary" @click="loadData">加载游戏数据</el-button>
      <el-upload :show-file-list="false" :on-change="onUploadEncrypted">
        <el-button>导入 Card.json</el-button>
      </el-upload>
      <el-button :disabled="!cards" @click="exportEncrypted">导出 Card.json</el-button>
      
      <el-button :disabled="!cards" @click="openShare">分享改动</el-button>
      <el-input v-model="keyword" placeholder="搜索 ID/名称/效果" style="max-width: 320px" />
      <CategorySelect v-model="selectedCategory as any" clearable style="width: 140px" />
      <TypeSelect v-model="selectedType as any" clearable style="width: 140px" />
    </div>

    <div v-if="!cards" class="empty">请先加载游戏数据或导入加密文件</div>

    <div v-else>
      <el-table height="calc(100vh - 260px)" :data="filtered" @row-click="selectRow" highlight-current-row border stripe>
        <el-table-column prop="ID" label="ID" width="160" sortable />
        <el-table-column prop="Name" label="名称" sortable />
        <el-table-column prop="Category" label="类别" width="120" sortable>
          <template #="{row}">
            <CategoryTag :value="row.Category" />
          </template>
        </el-table-column>
        <el-table-column prop="Type" label="类型" width="120" sortable>
          <template #="{row}">
            <TypeTag :value="row.Type" />
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
          <template v-for="key in cardEditableOrder" :key="key">
            <template v-if="(editBuffer as any)[key] !== undefined">
              <el-form-item :label="fieldLabels[key] || key">
                <el-input v-if="textFields.has(key) && !textAreaFields.has(key)" v-model="(editBuffer as any)[key]" />
                <el-input v-else-if="textAreaFields.has(key)" type="textarea" :rows="3" v-model="(editBuffer as any)[key]" />
                <el-input-number v-else-if="numberFields.has(key)" :min="0" v-model="(editBuffer as any)[key]" />
                <el-switch v-else-if="switchFields.has(key)" :active-value="1" :inactive-value="0" v-model="(editBuffer as any)[key]" />
                <!-- 类别 -->
                <CategorySelect v-else-if="key === 'Category'" v-model="editBuffer.Category" />
                <!-- 类型 -->
                <TypeSelect v-else-if="key === 'Type'" v-model="editBuffer.Type" />
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
          <el-input v-model="shareTitle" placeholder="例如：更强的初始卡组" />
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
import CategorySelect from '../components/edit/CategorySelect.vue'
import CategoryTag from '../components/tag/CategoryTag.vue'
import TypeTag from '../components/tag/TypeTag.vue'
import TypeSelect from '../components/edit/TypeSelect.vue'
import CharacterSelect from '../components/edit/CharacterSelect.vue'
import ComboSelect from '../components/edit/ComboSelect.vue'

const store = useDataStore()
const cards = computed(() => store.cards)
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
const selectedCategory = ref<string | null>(null)
const selectedType = ref<string | null>(null)
const shareVisible = ref(false)
const shareTitle = ref('')
const shareAuthor = ref(localStorage.getItem('share.author') || '')
const shareDescription = ref('')
const router = useRouter()

// 编辑字段与中文标签（仅显示存在差异的字段）
const cardEditableOrder = [
  'Name','ID','Category','Type','Level','Character','Combo',
  'EffectDescription','EffectString','SpecialVal','_growPeriod','_harvestIncome','_timeLabel','CanGainByPack'
] as const
const fieldLabels: Record<string,string> = {
  Name:'名称', ID:'ID', Category:'类别', Type:'类型', Level:'等级',
  Character:'角色', Combo:'流派', EffectDescription:'效果描述', EffectString:'效果字符串',
  SpecialVal:'特殊值', _growPeriod:'成长周期', _harvestIncome:'收获收益', _timeLabel:'时间标签',
  CanGainByPack:'可通过卡包获得'
}
const numberFields = new Set(['Level','SpecialVal','_growPeriod','_harvestIncome','_timeLabel'])
const switchFields = new Set(['CanGainByPack'])
const textAreaFields = new Set(['EffectDescription','EffectString'])
const textFields = new Set(['Name','ID'])

const filtered = computed(() => {
  if (!cards.value) return []
  const kw = keyword.value.trim().toLowerCase()
  if (!kw && !selectedCategory.value && !selectedType.value) return cards.value.Cards
  return cards.value.Cards.filter((c: any) => {
    const id = String(c.ID || '').toLowerCase()
    const name = String(c.Name || '').toLowerCase()
    const ed = String(c.EffectDescription || '').toLowerCase()
    const es = String(c.EffectString || '').toLowerCase()
    const kwOk = !kw || id.includes(kw) || name.includes(kw) || ed.includes(kw) || es.includes(kw)
    const catOk = !selectedCategory.value || c.Category === selectedCategory.value
    const typeOk = !selectedType.value || c.Type === selectedType.value
    return kwOk && catOk && typeOk
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
  const data = await getData('card')
  store.setCards(data)
  current.value = null
}

async function onUploadEncrypted(file: any) {
  try {
    const data = await decodeEncrypted(file.raw as File)
    if (!data || !Array.isArray(data.Cards)) throw new Error('不是有效的加密 Card.json 内容')
    store.setCards(data)
    current.value = null
  } catch (e: any) {
    alert('解密失败：' + e.message)
  }
}

async function runValidate() {
  errors.value = []
  if (!cards.value) return
  const res = await validate('card', cards.value)
  errors.value = res.errors
}

function openShare() {
  shareTitle.value = ''
  shareDescription.value = ''
  shareVisible.value = true
}

async function doShare() {
  if (!cards.value) return
  // validate first
  const res = await validate('card', cards.value)
  if (!res.ok) {
    errors.value = res.errors
    return
  }
  try {
    const { id, url, manageToken } = await shareCreate({ title: shareTitle.value, author: shareAuthor.value || undefined, description: shareDescription.value || undefined }, { cards: cards.value })
    // save token for self-manage
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
  if (!cards.value) return
  try {
    const enc = await encodeEncrypted(cards.value)
    const blob = new Blob([enc], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Card.json'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e: any) {
    alert('加密导出失败：' + e.message)
  }
}

onMounted(() => {
  if (!store.cards) {
    loadData()
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => { width.value = window.innerWidth })
  }
})

watch(cards, () => { errors.value = [] })

function onCancel() {
  editorVisible.value = false
  editBuffer.value = null
}

function onSave() {
  if (!originalRef.value || !editBuffer.value) return
  // 合并回原对象，保持引用不变
  Object.keys(originalRef.value).forEach(k => delete originalRef.value[k])
  Object.assign(originalRef.value, editBuffer.value)
  current.value = originalRef.value
  editorVisible.value = false
}

// 旧的通用推断已改为白名单字段，上述集合替代
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
