<template>
  <el-dialog v-model="iVisible" title="分享所有改动（多类目补丁）" width="640px">
    <el-form label-width="100px">
      <el-form-item label="标题">
        <el-input v-model="shareTitle" placeholder="例如：本次平衡性修改合集" />
      </el-form-item>
      <el-form-item label="作者">
        <el-input v-model="shareAuthor" placeholder="你的名字" />
      </el-form-item>
      <el-form-item label="说明">
        <el-input v-model="shareDescription" type="textarea" :rows="6" placeholder="概述涉及的类目与主要变更（支持多行）" />
      </el-form-item>
      <el-alert type="info" :closable="false" show-icon>
        <template #title>说明</template>
        <template #default>只会分享“相对于官方基线”的改动（补丁），不包含未改动的内容。</template>
      </el-alert>
    </el-form>
    <template #footer>
      <el-button @click="iVisible=false">取消</el-button>
      <el-button type="primary" :disabled="!shareTitle.trim() || !shareAuthor.trim() || !shareDescription.trim()" @click="doShare">发布</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { shareCreatePatches, validate, patchDiff } from '../../api'
import { useDataStore } from '../../store/data'

const store = useDataStore()
const router = useRouter()

const emit = defineEmits<{ (e: 'created', id: string): void }>()
const iVisible = ref(false)
const shareTitle = ref('')
const shareAuthor = ref(localStorage.getItem('share.author') || '')
const shareDescription = ref('')

function show() {
  shareTitle.value = ''
  shareDescription.value = ''
  iVisible.value = true
}

async function doShare() {
  // Collect present datasets
  const datasets: Array<{ kind: 'card'|'pendant'|'mapevent'|'begineffect'; payload: any }> = []
  if (store.cards) datasets.push({ kind: 'card', payload: store.cards })
  if (store.pendants) datasets.push({ kind: 'pendant', payload: store.pendants })
  if (store.mapEvents) datasets.push({ kind: 'mapevent', payload: store.mapEvents })
  if (store.beginEffects) datasets.push({ kind: 'begineffect', payload: store.beginEffects })

  if (datasets.length === 0) {
    alert('没有可分享的改动：请先在各页面加载/编辑数据。')
    return
  }

  // validate each present dataset and build diff
  const patches: any[] = []
  for (const { kind, payload } of datasets) {
    const res = await validate(kind, payload)
    if (!res.ok) {
      alert(`【${kind}】校验失败：\n` + (res.errors || []).join('\n'))
      return
    }
    const diff = await patchDiff(kind, payload)
    const ch = (diff?.changes) || {}
    const total = (ch.adds?.length || 0) + (ch.updates?.length || 0) + (ch.deletes?.length || 0)
    if (total > 0) patches.push(diff)
  }

  if (patches.length === 0) {
    alert('未检测到任何改动，未发布。')
    return
  }

  try {
    const { id, url, manageToken } = await shareCreatePatches({
      title: shareTitle.value,
      author: shareAuthor.value || undefined,
      description: shareDescription.value || undefined
    }, patches)
    const map = JSON.parse(localStorage.getItem('share.manageTokens') || '{}')
    map[id] = manageToken
    localStorage.setItem('share.manageTokens', JSON.stringify(map))
    if (shareAuthor.value.trim()) localStorage.setItem('share.author', shareAuthor.value.trim())
    iVisible.value = false
    emit('created', id)
    const full = (import.meta as any).env?.VITE_API_BASE ? `${(import.meta as any).env.VITE_API_BASE.replace(/\/+$/, '')}${url}` : url
    alert('发布成功！\n分享链接：' + full + '\n\n提示：管理令牌已保存在本地，可在“社区分享”页面删除该条目。')
  } catch (e: any) {
    alert('发布失败：' + (e?.message || '未知错误'))
  }
}

defineExpose({ show })
</script>

<style scoped>
</style>
