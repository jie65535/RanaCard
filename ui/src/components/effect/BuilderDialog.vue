<template>
  <el-dialog v-model="visible" :title="title" width="720px">
    <el-tabs v-model="tab">
      <el-tab-pane label="筛选 Filter" name="filter">
        <div class="row">
          <el-select v-model="domain" placeholder="数据域" style="width: 180px">
            <el-option v-for="d in domains" :key="d" :label="d" :value="d" />
          </el-select>
          <el-select v-model="field" placeholder="字段" style="width: 160px">
            <el-option v-for="f in fields" :key="f" :label="f" :value="f" />
          </el-select>
          <el-select v-model="op" placeholder="比较" style="width: 140px">
            <el-option v-for="o in ops" :key="o" :label="o" :value="o" />
          </el-select>
          <el-input v-model="value" placeholder="值" style="width: 180px" />
        </div>
        <div class="row">示例：Filter({{ domain }}'( {{ field }}'{{ op }}'{{ value }} ))</div>
      </el-tab-pane>
      <el-tab-pane label="统计 Tally" name="tally">
        <div class="row">
          <el-select v-model="domain" placeholder="数据域" style="width: 180px">
            <el-option v-for="d in domains" :key="d" :label="d" :value="d" />
          </el-select>
          <el-select v-model="field" placeholder="字段" style="width: 160px">
            <el-option v-for="f in fields" :key="f" :label="f" :value="f" />
          </el-select>
          <el-select v-model="op" placeholder="比较" style="width: 140px">
            <el-option v-for="o in ops" :key="o" :label="o" :value="o" />
          </el-select>
          <el-input v-model="value" placeholder="值" style="width: 180px" />
        </div>
        <div class="row">示例：Tally({{ domain }}'( {{ field }}'{{ op }}'{{ value }} ))</div>
      </el-tab-pane>
      <el-tab-pane label="随机 RandomRange" name="random">
        <div class="row">
          <el-select v-model="source" placeholder="来源" style="width: 220px">
            <el-option v-for="s in sources" :key="s" :label="s" :value="s" />
          </el-select>
          <el-input-number v-model="count" :min="1" :step="1" />
        </div>
        <div class="row">示例：RandomRange({{ source }}:{{ count }})</div>
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <el-button @click="visible=false">取消</el-button>
      <el-button type="primary" @click="apply">应用</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e:'update:modelValue', v:boolean): void, (e:'done', v:string): void }>()

const title = '构造表达式'
const visible = ref(props.modelValue)
watch(() => props.modelValue, v => visible.value = v)
watch(visible, v => emit('update:modelValue', v))

const tab = ref<'filter'|'tally'|'random'>('filter')
const domains = ['Around','Bag','Hand','CardCollection','LandPlant','Global']
const fields = ['Name','ID','Type','Category','TimeLabel','EffectString']
const ops = ['Is','IsNot','Equal','Contain']
const source = ref('LandPlant')
const count = ref(1)
const domain = ref('Around')
const field = ref('Category')
const op = ref('Is')
const value = ref('Spell')

function apply(){
  let out = ''
  if (tab.value==='filter') out = `Filter(${domain.value}'(${field.value}'${op.value}'${value.value}))`
  else if (tab.value==='tally') out = `Tally(${domain.value}'(${field.value}'${op.value}'${value.value}))`
  else out = `RandomRange(${source.value}:${count.value})`
  emit('done', out)
  visible.value = false
}
</script>

<style scoped>
.row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin: 6px 0 }
</style>

