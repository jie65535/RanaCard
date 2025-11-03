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

    <ShareDialog ref="ShareDialogDom" :type="'card'" :post-type="'cards'" placeholder="例如：更强的初始卡组" />
    <ErrorAlert :errors="errors" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useDataStore } from '../store/data'
import { getData, validate, decodeEncrypted, encodeEncrypted } from '../api'
import CategorySelect from '../components/edit/CategorySelect.vue'
import CategoryTag from '../components/tag/CategoryTag.vue'
import TypeTag from '../components/tag/TypeTag.vue'
import TypeSelect from '../components/edit/TypeSelect.vue'
import CharacterSelect from '../components/edit/CharacterSelect.vue'
import ComboSelect from '../components/edit/ComboSelect.vue'
import ShareDialog from '../components/common/ShareDialog.vue'
import ErrorAlert from '../components/common/ErrorAlert.vue'

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

const ShareDialogDom = ref<InstanceType<typeof ShareDialog> | null>(null)

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
  ShareDialogDom.value?.show(cards.value);
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

watch(cards, () => {
  errors.value = [];
  ShareDialogDom.value?.clearErrors();
})

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
