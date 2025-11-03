<template>
	<div class="action-row">
		<el-select v-model="type" style="width: 180px" @change="onTypeChange">
			<el-option label="属性变更" value="attr" />
			<el-option label="函数调用" value="func" />
		</el-select>

		<template v-if="iAction.type === 'attr'">
			<CommonSelect v-model="iAction.target" :options="targetOptions" placeholder="目标" style="width: 180px" filterable />
			<CommonSelect v-model="iAction.attr" :options="attrOptions" placeholder="属性" style="width: 200px" filterable />
			<el-select v-model="iAction.mode" style="width: 100px">
				<el-option label="加/减" value="add" />
				<el-option label="设为" value="set" />
			</el-select>
			<el-input v-model="iAction.value" placeholder="数值/表达式" style="width: 200px" />
		</template>

		<template v-else>
			<el-select v-model="iAction.name" placeholder="函数" style="width: 320px" @change="syncArgs" filterable default-first-option>
				<el-option v-for="f in funcOptions" :key="f.value" :label="f.label" :value="f.value" />
			</el-select>
			<template v-if="!isKnownFunc">
				<span class="lbl">参数串</span>
				<el-input v-model="iAction.__rawArgs" placeholder="以 ; 分隔，如 A;B;C" style="width: 320px" />
			</template>
			<template v-else>
				<div class="arg-group" v-for="(arg, i) in iAction.args" :key="i">
					<span class="lbl">{{ arg.label || ('参数' + (i+1)) }}</span>
					<el-input v-model="arg.value" :placeholder="arg.placeholder || ''" style="width: 200px" />
					<el-button v-if="canBuild(iAction.name, i)" size="small" @click="openBuilder(i)">构造</el-button>
				</div>
			</template>
		</template>

		<slot name="tail"></slot>
		<BuilderDialog v-model="showBuilder" @done="onBuilt" />
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import useStoreEffectString from '../../store/storeEffectString'
import { storeToRefs } from 'pinia'
import CommonSelect from '../edit/CommonSelect.vue'
import BuilderDialog from './BuilderDialog.vue'

const props = defineProps<{
  modelValue: Types.Editor.EffectString.AnyAction
}>()
const emit = defineEmits<{
  (e:'update:modelValue', v:Types.Editor.EffectString.AnyAction): void
}>()

const type = ref<'attr'|'func'>(props.modelValue.type);
const iAction = ref<Types.Editor.EffectString.AnyAction>(props.modelValue);

const storeEffectString = useStoreEffectString();
const { targetOptions, attrOptions, funcOptions } = storeToRefs(storeEffectString);

const isKnownFunc = computed(() => !!funcOptions.value.find(x => x.value === (iAction.value.type === 'func' && iAction.value.name)));

/**
 * 监听类型变更
 */
function onTypeChange() {
    if (type.value === 'attr') {
		iAction.value = { type:'attr', target:'Self', attr:'Growth', mode:'add', value:'1' }
	} else {
		iAction.value = { type:'func', name:'RandomGrow', args:[{ label:'数量', value:'1', placeholder: '' }] }
	}
}

function syncArgs() {
	if (iAction.value.type !== 'func') return
	const a = iAction.value
	const spec = funcOptions.value.find(x => x.value === a.name)
	if (!spec) return
	a.args = (spec.args || []).map(x => ({ label:x.name, placeholder:x.placeholder, value:'' }));
	(a as any).__rawArgs = ''
}
const showBuilder = ref(false)
const buildArgIndex = ref<number>(-1)

function canBuild(name: string, idx: number){
  return ['Filter','Tally','RandomRange'].includes(name)
}
function openBuilder(i: number){ buildArgIndex.value = i; showBuilder.value = true }
function onBuilt(v: string){
  const i = buildArgIndex.value
  if (i >= 0 && iAction.value.type === 'func') iAction.value.args[i].value = v
}

watch(() => props.modelValue, (v) => {
	let _n = JSON.stringify(v);
	let _o = JSON.stringify(iAction.value);
	if (_n !== _o) {
		Object.assign(iAction.value, v)
		type.value = v.type
	}
}, { immediate: true, deep: true })
watch(iAction, (v) => {
	let _n = JSON.stringify(v);
	let _o = JSON.stringify(props.modelValue);
	if (_n !== _o) {
		emit('update:modelValue', JSON.parse(_n))
	}
}, { deep: true })
</script>

<style scoped>
.action-row { display:flex; gap:8px; align-items:center; flex-wrap: wrap; }
.lbl { margin: 0 4px; opacity: 0.75; }
.arg-group { display: inline-flex; align-items: center; gap: 6px; margin-right: 8px; flex-wrap: nowrap; }
.arg-group .lbl { white-space: nowrap; }
</style>
