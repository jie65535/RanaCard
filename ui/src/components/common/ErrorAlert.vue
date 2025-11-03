<template>
    <el-alert v-if="iErrors.length" type="error" show-icon :closable="false" :title="'校验失败：' + iErrors.length + ' 项'">
      <template #default>
        <div v-for="(e,i) in iErrors" :key="i">{{ e }}</div>
      </template>
    </el-alert>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';


interface ErrorAlertProps {
    errors: string[];
}
const props = withDefaults(defineProps<ErrorAlertProps>(), {
    errors: () => [],
});

const iErrors = ref<string[]>(props.errors);

watch(() => props.errors, (newVal) => {
    iErrors.value = newVal;
}, { immediate: true, deep: true });
</script>