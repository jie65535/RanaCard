<template>
  <div class="watch-editor">
    <el-radio-group v-model="mode" size="small">
      <el-radio-button label="event">按事件</el-radio-button>
      <el-radio-button label="condition">按条件</el-radio-button>
    </el-radio-group>
    <template v-if="mode==='event'">
      <el-select v-model="eventName" placeholder="事件" style="width: 160px">
        <el-option v-for="e in events" :key="e" :label="e" :value="e" />
      </el-select>
      <el-select v-model="scope" placeholder="范围/作用域" style="width: 140px">
        <el-option label="None" value="None" />
        <el-option label="Around" value="Around" />
        <el-option label="GlobalNum" value="GlobalNum" />
      </el-select>
    </template>
    <template v-else>
      <el-select v-model="condField" placeholder="字段" style="width: 160px">
        <el-option v-for="f in condFields" :key="f" :label="f" :value="f" />
      </el-select>
      <el-select v-model="condOp" placeholder="比较" style="width: 120px">
        <el-option label="Is" value="Is" />
        <el-option label="IsNot" value="IsNot" />
        <el-option label="Equal" value="Equal" />
        <el-option label="Contain" value="Contain" />
      </el-select>
      <el-input v-model="condValue" placeholder="值（如 Spell/露珠）" style="width: 160px" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits<{ (e:'update:modelValue', v:string): void }>()

const mode = ref<'event'|'condition'>('event')
const events = ['Harvest','Grow','RoundBegin','RoundEnd','TimeExplode','TimeSafe','YearBegin','YearEnd']
const scope = ref('None')
const eventName = ref('Harvest')
const condFields = ['Category','Name','ID','TimeLabel']
const condField = ref('Category')
const condOp = ref('Is')
const condValue = ref('Spell')

// init from modelValue
if (props.modelValue && props.modelValue.startsWith('Condition,')) {
  mode.value = 'condition'
  // Condition,Category;Is;Spell
  const body = props.modelValue.slice('Condition,'.length)
  const parts = body.split(';')
  if (parts.length >= 3) {
    condField.value = parts[0]
    condOp.value = parts[1]
    condValue.value = parts.slice(2).join(';')
  }
} else if (props.modelValue) {
  // e.g. Harvest,None
  const parts = props.modelValue.split(',')
  eventName.value = parts[0] || 'Harvest'
  scope.value = parts[1] || 'None'
}

const out = computed(() => mode.value === 'event' ? `${eventName.value},${scope.value}` : `Condition,${condField.value};${condOp.value};${condValue.value}`)

watch(out, v => emit('update:modelValue', v))
</script>

<style scoped>
.watch-editor { display:flex; gap:8px; align-items:center; flex-wrap:wrap }
</style>

