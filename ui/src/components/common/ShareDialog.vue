<!-- 分享改动弹出框 -->
<template>
    <el-dialog v-model="iVisible" title="分享改动" width="620px">
      <el-form label-width="100px">
        <el-form-item label="标题">
          <el-input v-model="shareTitle" :placeholder="placeholder" />
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="shareAuthor" placeholder="你的名字" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="shareDescription" type="textarea" :rows="6" placeholder="详细描述你的改动、思路与使用建议（支持多行）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="iVisible=false">取消</el-button>
        <el-button type="primary" :disabled="!shareTitle.trim() || !shareAuthor.trim() || !shareDescription.trim()" @click="doShare">发布</el-button>
      </template>
    </el-dialog>

    <ErrorAlert :errors="errors" />
</template>

<style scoped>

</style>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { shareCreate, validate } from '../../api';
import ErrorAlert from './ErrorAlert.vue';

interface ShareDialogProps {
    placeholder?: string;
    type: 'card' | 'begineffect' | 'mapevent' | 'pendant';
    postType: 'cards' | 'beginEffects' | 'mapEvents' | 'pendants';
}

const props = withDefaults(defineProps<ShareDialogProps>(), {
    placeholder: '例如：更强的初始卡组',
});

const router = useRouter();

const postData = ref<any>({});
const iVisible = ref(false);
const shareTitle = ref('')
const shareAuthor = ref(localStorage.getItem('share.author') || '')
const shareDescription = ref('')

const errors = ref<string[]>([]);

function show(data: any) {
    postData.value = data;
    shareTitle.value = '';
    shareDescription.value = '';
    iVisible.value = true;
}

function clearErrors() {
    errors.value = [];
}

async function doShare() {
  if (!postData.value) return
  // validate first
  const res = await validate(props.type, postData.value)
  if (!res.ok) {
    errors.value = res.errors
    return
  }
  try {
    const { id, url, manageToken } = await shareCreate({
        title: shareTitle.value,
        author: shareAuthor.value || undefined,
        description: shareDescription.value || undefined
    }, { [props.postType]: postData.value })
    // save token for self-manage
    const map = JSON.parse(localStorage.getItem('share.manageTokens') || '{}')
    map[id] = manageToken
    localStorage.setItem('share.manageTokens', JSON.stringify(map))
    if (shareAuthor.value.trim()) localStorage.setItem('share.author', shareAuthor.value.trim())
    iVisible.value = false
    const full = (import.meta as any).env?.VITE_API_BASE ? `${(import.meta as any).env.VITE_API_BASE.replace(/\/+$/, '')}${url}` : url
    alert('发布成功！\n分享链接：' + full + '\n\n提示：管理令牌已保存在本地，可在“社区分享”页面删除该条目。')
    router.push(`/share?id=${id}`)
  } catch (e: any) {
    alert('发布失败：' + (e?.message || '未知错误'))
  }
}

defineExpose({
    show,
    clearErrors
})
</script>
