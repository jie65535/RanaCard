<template>
  <div class="cond-row">
    <el-select v-model="local.target" placeholder="目标" filterable allow-create style="width: 180px">
      <el-option v-for="t in targets" :key="t.id" :label="t.label" :value="t.id" />
    </el-select>
    <el-select v-model="local.attr" placeholder="属性" filterable allow-create style="width: 200px">
      <el-option v-for="a in attrs" :key="a.id" :label="a.label" :value="a.id" />
    </el-select>
    <el-select v-model="local.op" placeholder="比较" style="width: 140px">
      <el-option v-for="o in cmps" :key="o.id" :label="o.label" :value="o.id" />
    </el-select>
    <el-input v-model="local.value" placeholder="值/表达式" style="width: 220px" />
    <el-button size="small" @click="showBuilder=true">构造</el-button>
    <BuilderDialog v-model="showBuilder" @done="onBuilt" />
  </div>
  
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { targets as targets_, attrs as attrs_, cmpOps as cmps_ } from './dslDict'
import BuilderDialog from './BuilderDialog.vue'

export interface Condition {
  target?: string
  attr?: string
  op?: string
  value?: string
}

const props = defineProps<{ modelValue: Condition }>()
const emit = defineEmits<{ (e:'update:modelValue', v:Condition): void }>()

const targets = targets_
const attrs = attrs_
const cmps = cmps_

const local = reactive<Condition>({ ...props.modelValue })
const showBuilder = ref(false)

watch(() => props.modelValue, (v) => { Object.assign(local, v) })
watch(local, () => emit('update:modelValue', { ...local }), { deep: true })
function onBuilt(v: string){ local.value = v }
</script>

<style scoped>
.cond-row { display:flex; gap:8px; align-items:center; flex-wrap: wrap; }
</style>
