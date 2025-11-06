<template>
  <el-card class="begin-card" shadow="never">
    <div class="line" v-for="(cmd, i) in local" :key="i">
      <el-select v-model="cmd.kind" style="width: 220px">
        <el-option label="全局属性 Global,Attr,±N/ =常量" value="GlobalAdd" />
        <el-option label="开包 OpenPack(类型;规格;数量)" value="OpenPack" />
        <el-option label="获得挂件 AddPendant(名称)" value="AddPendant" />
        <el-option label="开12选1 OpenOneOfFourteen()" value="OpenOneOfFourteen" />
        <el-option label="获得原初挂件 AddOriginPendant()" value="AddOriginPendant" />
      </el-select>

      <template v-if="cmd.kind==='GlobalAdd'">
        <el-select v-model="cmd.attr" placeholder="属性" style="width: 220px">
          <el-option label="金币 Money" value="Money" />
          <el-option label="生命上限 HealthLimit" value="HealthLimit" />
          <el-option label="全局KPI倍率 WholeGameKPIMultiplier" value="WholeGameKPIMultiplier" />
          <el-option label="灾年KPI倍率 WholeGameKPIDisasterMultiplier" value="WholeGameKPIDisasterMultiplier" />
        </el-select>
        <el-input v-model="cmd.value" placeholder="±N 或 =常量，例如 =1.1 或 -80" style="width: 220px" />
      </template>
      <template v-else-if="cmd.kind==='OpenPack'">
        <el-select v-model="cmd.packType" placeholder="类型" style="width: 120px">
          <el-option label="Card" value="Card" />
          <el-option label="Pendant" value="Pendant" />
        </el-select>
        <el-select v-model="cmd.size" placeholder="规格" style="width: 120px">
          <el-option label="Small" value="Small" />
          <el-option label="Big" value="Big" />
        </el-select>
        <el-input-number v-model="cmd.n" :min="1" :step="1" />
      </template>
      <template v-else-if="cmd.kind==='AddPendant'">
        <el-input v-model="cmd.name" placeholder="挂件名称" style="width: 220px" />
      </template>
      <div class="spacer"></div>
      <el-button link type="danger" @click="remove(i)">移除</el-button>
    </div>
    <div class="actions">
      <el-button @click="add">新增命令</el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'

type GlobalAdd = { kind:'GlobalAdd', attr:'Money'|'HealthLimit'|'WholeGameKPIMultiplier'|'WholeGameKPIDisasterMultiplier', value:string }
type OpenPack = { kind:'OpenPack', packType:'Card'|'Pendant', size:'Small'|'Big', n:number }
type AddPendant = { kind:'AddPendant', name:string }
type Open14 = { kind:'OpenOneOfFourteen' }
type AddOrigin = { kind:'AddOriginPendant' }
export type BeginCmd = GlobalAdd | OpenPack | AddPendant | Open14 | AddOrigin

const props = defineProps<{ modelValue: BeginCmd[] }>()
const emit = defineEmits<{ (e:'update:modelValue', v:BeginCmd[]): void }>()

const local = reactive<BeginCmd[]>(JSON.parse(JSON.stringify(props.modelValue || [])))
watch(() => props.modelValue, (v)=>{ local.splice(0); (v||[]).forEach(x=>local.push(x as any)) })
watch(local, () => emit('update:modelValue', JSON.parse(JSON.stringify(local))), { deep: true })

function add(){ local.push({ kind:'GlobalAdd', attr:'Money', value:'1' } as BeginCmd) }
function remove(i:number){ local.splice(i,1) }
</script>

<style scoped>
.begin-card { border-left: 4px solid var(--el-color-success); margin-bottom: 12px }
.line { display:flex; gap:8px; align-items:center; margin-bottom: 8px; flex-wrap: wrap }
.spacer { flex: 1 }
.actions { display:flex; justify-content:flex-start }
</style>

