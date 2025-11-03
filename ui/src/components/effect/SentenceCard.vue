<template>
  <el-card class="sentence-card" shadow="never">
    <template #header>
      <div class="head">
        <el-select v-model="local.trigger" placeholder="触发" style="width: 220px" filterable>
          <el-option v-for="t in triggers_" :key="t.id" :label="t.label" :value="t.id" />
        </el-select>
        <template v-if="local.trigger==='Watch' || local.trigger==='Watch(...)'">
          <WatchEditor v-model="local.triggerArgs" />
        </template>
        <div class="spacer"></div>
        <el-checkbox v-model="local.consume">消耗</el-checkbox>
        <el-checkbox v-model="local.foresee">预见</el-checkbox>
        <slot name="tools"></slot>
      </div>
    </template>

    <div class="section">
      <div class="section-title">条件与动作</div>
      <div class="segments">
        <div v-for="(seg, i) in local.segments" :key="seg._id || i" class="segment">
          <div class="cond-bar">
            <template v-if="hasCond(seg)">
              <ConditionRow v-model="seg.cond" />
              <el-button link @click="clearCond(i)">清除条件</el-button>
            </template>
            <template v-else>
              <el-button size="small" type="primary" text @click="addCond(i)">添加条件</el-button>
            </template>
            <div class="spacer"></div>
            <el-button link type="danger" @click="removeSegment(i)">移除片段</el-button>
          </div>
          <div class="actions">
            <div v-for="(a, j) in seg.actions" :key="a._id || j" class="action-line">
              <ActionRow v-model="seg.actions[j]" />
              <el-button link type="danger" @click="removeAction(i, j)">删除动作</el-button>
            </div>
            <el-button size="small" @click="addAction(i)">添加动作</el-button>
          </div>
          <el-divider />
        </div>
        <el-button @click="addSegment">新增片段</el-button>
      </div>
    </div>

  </el-card>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import ConditionRow, { type Condition } from './ConditionRow.vue'
import WatchEditor from './WatchEditor.vue'
import ActionRow, { type AnyAction } from './ActionRow.vue'
import { triggers as trig } from './dslDict'

export type Segment = { cond: Condition, actions: AnyAction[] }
export type Sentence = { trigger: string, triggerArgs?: string, segments: Segment[], consume?: boolean, foresee?: boolean }

const props = defineProps<{ modelValue: Sentence }>()
const emit = defineEmits<{ (e:'update:modelValue', v:Sentence): void }>()

const local = reactive<Sentence>({ ...props.modelValue })
const triggers_ = trig

watch(() => props.modelValue, (v) => { Object.assign(local, v); ensureIds() })
watch(local, () => emit('update:modelValue', JSON.parse(JSON.stringify(local))), { deep: true })

function addSegment(){ local.segments.push({ _id: Math.random().toString(36).slice(2), cond: {}, actions: [] } as any) }
function removeSegment(i:number){ local.segments.splice(i,1) }
function addAction(i:number){
  const seg: any = local.segments[i]
  const next = [...(seg.actions || []), { _id: Math.random().toString(36).slice(2), type:'attr', target:'Self', attr:'Growth', mode:'add', value:'1' }]
  seg.actions = next
}
function removeAction(i:number, j:number){
  const seg: any = local.segments[i]
  const next = (seg.actions || []).slice()
  next.splice(j,1)
  seg.actions = next
}

function hasCond(seg: any){ return !!(seg?.cond && seg.cond.target && seg.cond.attr && seg.cond.op && seg.cond.value!==undefined && seg.cond.value!=='') }
function addCond(i:number){
  const seg:any = local.segments[i]
  if (!seg) return
  seg.cond = { target:'Self', attr:'CountVal', op:'Equal', value:'1' }
}
function clearCond(i:number){
  const seg:any = local.segments[i]
  if (!seg) return
  seg.cond = {}
}

function ensureIds(){
  local.segments.forEach((s: any) => {
    if (!s._id) s._id = Math.random().toString(36).slice(2)
    s.actions = s.actions || []
    s.actions.forEach((a: any) => { if (!a._id) a._id = Math.random().toString(36).slice(2) })
  })
}
ensureIds()
</script>

<style scoped>
.sentence-card { border-left: 4px solid var(--el-color-primary); margin-bottom: 12px }
.head { display:flex; gap:8px; align-items:center }
.spacer { flex: 1 }
.section { padding: 4px 0 }
.section-title { font-weight: 600; opacity: .8; margin-bottom: 6px }
.segment { padding: 8px; border: 1px dashed var(--el-border-color); border-radius: 6px; margin-bottom: 8px }
.cond-bar { display:flex; gap:8px; align-items:center; flex-wrap: wrap; }
.actions { display:flex; flex-direction: column; gap:8px; margin-top: 6px }
.action-line { display:flex; gap:8px; align-items:center; flex-wrap: wrap }
</style>
