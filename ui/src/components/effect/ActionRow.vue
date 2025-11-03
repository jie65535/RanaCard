<template>
  <div class="action-row">
    <el-select v-model="type" style="width: 180px">
      <el-option label="属性变更" value="attr" />
      <el-option label="函数调用" value="func" />
    </el-select>

    <template v-if="type==='attr'">
      <el-select v-model="attrAction.target" placeholder="目标" filterable allow-create style="width: 180px">
        <el-option v-for="t in targets" :key="t.id" :label="t.label" :value="t.id" />
      </el-select>
      <el-select v-model="attrAction.attr" placeholder="属性" filterable allow-create style="width: 200px">
        <el-option v-for="a in attrs" :key="a.id" :label="a.label" :value="a.id" />
      </el-select>
      <el-select v-model="attrAction.mode" style="width: 100px">
        <el-option label="加/减" value="add" />
        <el-option label="设为" value="set" />
      </el-select>
      <el-input v-model="attrAction.value" placeholder="数值/表达式" style="width: 200px" />
    </template>

    <template v-else>
      <el-select v-model="funcAction.name" placeholder="函数" style="width: 320px" @change="syncArgs" filterable allow-create default-first-option>
        <el-option v-for="f in funcs" :key="f.id" :label="f.label" :value="f.id" />
      </el-select>
      <template v-if="!isKnownFunc">
        <span class="lbl">参数串</span>
        <el-input v-model="rawArgs" placeholder="以 ; 分隔，如 A;B;C" style="width: 320px" />
      </template>
      <template v-else>
        <div class="arg-group" v-for="(arg, i) in funcAction.args" :key="i">
          <span class="lbl">{{ arg.label || ('参数' + (i+1)) }}</span>
          <el-input v-model="arg.value" :placeholder="arg.placeholder || ''" style="width: 200px" />
          <el-button v-if="canBuild(funcAction.name, i)" size="small" @click="openBuilder(i)">构造</el-button>
        </div>
      </template>
    </template>

    <slot name="tail"></slot>
    <BuilderDialog v-model="showBuilder" @done="onBuilt" />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { targets as targets_, attrs as attrs_, funcs as funcs_, type DictFunc } from './dslDict'
import BuilderDialog from './BuilderDialog.vue'

export type AttrAction = { type:'attr', target:string, attr:string, mode:'add'|'set', value:string }
export type FuncArg = { label?: string, placeholder?: string, value: string }
export type FuncAction = { type:'func', name:string, args: FuncArg[] }
export type AnyAction = AttrAction | FuncAction

const props = defineProps<{ modelValue: AnyAction }>()
const emit = defineEmits<{ (e:'update:modelValue', v:AnyAction): void }>()

const type = computed({
  get: () => props.modelValue.type,
  set: (v: 'attr'|'func') => {
    if (v === 'attr') emit('update:modelValue', { type:'attr', target:'Self', attr:'Growth', mode:'add', value:'1' })
    else emit('update:modelValue', { type:'func', name:'RandomGrow', args:[{ label:'数量', value:'1' }] })
  }
})

const targets = targets_
const attrs = attrs_
const funcs = funcs_
const isKnownFunc = computed(() => !!(funcs as DictFunc[]).find(x => x.id === funcAction.value.name))
const rawArgs = computed({
  get: () => (funcAction.value as any).__rawArgs || '',
  set: (v: string) => { (funcAction.value as any).__rawArgs = v }
})

const attrAction = computed({
  get: () => props.modelValue.type==='attr' ? props.modelValue as AttrAction : { type:'attr', target:'Self', attr:'Growth', mode:'add', value:'1' },
  set: (v: AttrAction) => emit('update:modelValue', v)
})

const funcAction = computed({
  get: () => props.modelValue.type==='func' ? props.modelValue as FuncAction : { type:'func', name:'RandomGrow', args:[{ label:'数量', value:'1' }] },
  set: (v: FuncAction) => emit('update:modelValue', v)
})

function syncArgs() {
  const a = funcAction.value
  const spec = (funcs as DictFunc[]).find(x => x.id === a.name)
  if (!spec) return
  a.args = (spec.args || []).map(x => ({ label:x.name, placeholder:x.placeholder, value:'' }))
  ;(a as any).__rawArgs = ''
}
const showBuilder = ref(false)
const buildArgIndex = ref<number>(-1)

function canBuild(name: string, idx: number){
  return ['Filter','Tally','RandomRange'].includes(name)
}
function openBuilder(i: number){ buildArgIndex.value = i; showBuilder.value = true }
function onBuilt(v: string){
  const i = buildArgIndex.value
  if (i >= 0) funcAction.value.args[i].value = v
}
</script>

<style scoped>
.action-row { display:flex; gap:8px; align-items:center; flex-wrap: wrap; }
.lbl { margin: 0 4px; opacity: 0.75; }
.arg-group { display: inline-flex; align-items: center; gap: 6px; margin-right: 8px; flex-wrap: nowrap; }
.arg-group .lbl { white-space: nowrap; }
</style>
