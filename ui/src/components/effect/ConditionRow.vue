<!-- 条件 -->
<template>
	<div class="cond-row">
		<CommonSelect v-model="local.target" :options="targetOptions" placeholder="目标" style="width: 180px" filterable />
		<CommonSelect v-model="local.attr" :options="attrOptions" placeholder="属性" style="width: 200px" filterable />
		<CommonSelect v-model="local.op" :options="cmpOptions" placeholder="比较" style="width: 140px" />
		<el-input v-model="local.value" placeholder="值/表达式" style="width: 220px" />
		<el-button size="small" @click="showBuilder=true">构造</el-button>
		<BuilderDialog v-model="showBuilder" @done="onBuilt" />
	</div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import useStoreEffectString from '../../store/storeEffectString'
import { storeToRefs } from 'pinia'
import BuilderDialog from './BuilderDialog.vue'
import CommonSelect from '../edit/CommonSelect.vue'

const props = defineProps<{ modelValue: Types.Editor.EffectString.Condition }>()
const emit = defineEmits<{
  (e:'update:modelValue', v:Types.Editor.EffectString.Condition): void
}>()

const storeEffectString = useStoreEffectString();
const { targetOptions, attrOptions, cmpOptions } = storeToRefs(storeEffectString);

const local = ref<Types.Editor.EffectString.Condition>({ ...props.modelValue })
const showBuilder = ref(false)

watch(() => props.modelValue, (v) => {
	let _n = JSON.stringify(v);
	let _o = JSON.stringify(local.value);
	if (_n !== _o) {
		Object.assign(local.value, v)
	}
}, { immediate: true, deep: true })
watch(local, () => {
	let _n = JSON.stringify(local.value);
	let _o = JSON.stringify(props.modelValue);
	if (_n !== _o) {
		emit('update:modelValue', local.value)
	}
}, { deep: true })

function onBuilt(v: string){ local.value.value = v }
</script>

<style scoped>
.cond-row { display:flex; gap:8px; align-items:center; flex-wrap: wrap; }
</style>
