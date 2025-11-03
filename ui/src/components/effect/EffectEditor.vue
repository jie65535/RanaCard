<template>
	<div class="effect-editor">
		<el-tabs v-model="tab">
			<el-tab-pane label="可视化" name="visual">
				<template v-if="kind !== 'begineffect'">
					<div class="cards">
						<SentenceCard v-for="(s, i) in sentences" :key="i" :model-value="s" @update:modelValue="val => onSentenceUpdate(i, val)">
							<template #tools>
								<el-button link @click="moveUp(i)" :disabled="i===0">上移</el-button>
								<el-button link @click="moveDown(i)" :disabled="i===sentences.length-1">下移</el-button>
								<el-button link type="danger" @click="removeSentence(i)">删除</el-button>
							</template>
						</SentenceCard>
						<el-button type="primary" @click="addSentence">新增句子</el-button>
					</div>
				</template>
				<template v-else>
					<BeginEffectCard v-model="beginCmds" />
					<div class="row">
						<el-button @click="applyBeginTemplate('vip')">模板：-80金币 并获得会员卡</el-button>
					</div>
				</template>
				<div class="preview">
					<div class="lbl">生成的效果字符串</div>
					<el-input :model-value="preview" type="textarea" :rows="4" readonly />
				</div>
			</el-tab-pane>
			<el-tab-pane label="DSL" name="dsl">
				<el-input v-model="dslText" type="textarea" :rows="8" @input="emitDSL" />
			</el-tab-pane>
		</el-tabs>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SentenceCard from './SentenceCard.vue'
import BeginEffectCard, { type BeginCmd } from './BeginEffectCard.vue'

const props = withDefaults(defineProps<{
  modelValue: string,
  kind?: 'card'|'pendant'|'begineffect'
}>(), {
  kind: 'card'
});
const emit = defineEmits<{
  (e:'update:modelValue', v:string): void
}>()

const tab = ref<'visual'|'dsl'>('visual')
const dslText = ref('')
const sentences = ref<Types.Editor.EffectString.Sentence[]>([])
// 使用 ref 以便 v-model 能正确赋值（避免 const 变量被模板赋值失败）
const beginCmds = ref<BeginCmd[]>([])

const preview = computed(() => props.kind !== 'begineffect' ? serializeSentences() : serializeBegin())
const suppressEmit = ref(false)
// 记录上次由本组件发出的 DSL，避免父组件回传时重复初始化造成循环
const lastEmitted = ref<string>('')
// 标记是否由可视化编辑触发的变更（而非初始化/父级回传）
const dirtyFromVisual = ref(false)

// 不再监听 preview 自动提交，改为仅在用户交互后显式提交，避免递归更新

function emitDSL(){
	if (tab.value !== 'dsl') return
	const v = (dslText.value || '').trim()
	if (v === (props.modelValue || '').trim()) return
	emit('update:modelValue', dslText.value)
}
function emitFromVisual(){
	console.log('emitFromVisual called', props.modelValue)
	if (tab.value !== 'visual') return
	const v = (preview.value || '').trim()
	// 同步 DSL 预览文本
	dslText.value = v
	if (v === (props.modelValue || '').trim()) return
	lastEmitted.value = v
	emit('update:modelValue', v)
}

/**
 * 新增句子
 */
function addSentence() {
	sentences.value.push({
		trigger:'Play',
		segments:[{ cond:{}, actions:[] }],
		consume:false,
		foresee:false
	});
	dirtyFromVisual.value = true;
	emitFromVisual()
}
/**
 * 删除句子
 * @param i 句子索引
 */
function removeSentence(i:number){
	sentences.value.splice(i,1);
	dirtyFromVisual.value = true;
	emitFromVisual()
}
/**
 * 句子上移
 * @param i 句子索引
 */
function moveUp(i:number) {
	if (i > 0) {
		sentences.value.splice(i-1,2,sentences.value[i], sentences.value[i-1]);
		dirtyFromVisual.value = true;
		emitFromVisual()
	}
}
/**
 * 句子下移
 * @param i 句子索引
 */
function moveDown(i:number) {
	if (i < sentences.value.length - 1) {
		sentences.value.splice(i, 2, sentences.value[i + 1], sentences.value[i]);
		dirtyFromVisual.value = true;
		emitFromVisual()
	}
}

function onSentenceUpdate(i: number, val: any){
  // 替换数组项，确保父级拿到子组件变更
  sentences.value.splice(i, 1, val)
  dirtyFromVisual.value = true
  emitFromVisual()
}

function applyFromTemplate(name:'grow1'|'money3'){
  if(name==='grow1'){
    sentences.value = [];
    sentences.value.push({
		trigger:'Play',
		segments:[
			{
				cond:{},
				actions:[
					{ type:'func', name:'RandomGrow', args:[{ label:'数量', value:'1' }] }
				]
			}],
			consume:true,
			foresee:false
		})
  } else {
    sentences.value.splice(0)
    sentences.value.push({
		trigger:'RoundEnd',
		segments:[
			{
				cond:{},
				actions:[
					{ type:'attr', target:'Global', attr:'Money', mode:'add', value:'3' }
				]
			}],
			consume:false,
			foresee:false
		})
	}
}
function applyBeginTemplate(name:'vip') { beginCmds.value.splice(0); beginCmds.value.push({ kind:'GlobalAdd', attr:'Money', value:'-80' } as any); beginCmds.value.push({ kind:'AddPendant', name:'会员卡' } as any); dirtyFromVisual.value = true; emitFromVisual() }

function serAction(a:any){
  if(a.type==='attr'){ const v=a.mode==='set'?`=${a.value}`:a.value; return `[${a.target},${a.attr},${v}]` }
if(a.type==='func'){
  const rawArgs = (a as any).__rawArgs as string | undefined
  const args = rawArgs != null ? rawArgs : (a.args||[]).map((x:any)=>x.value).join(';')
  return `[${a.name}(${args})]`
}
  if(a.type==='raw'){ return `[${a.raw}]` }
  return ''
}
function serializeSentence(s: Types.Editor.EffectString.Sentence): string {
	const inner = s.segments.map(seg => {
		const cond = seg.cond && seg.cond.target && seg.cond.attr && seg.cond.op && (seg.cond.value!==undefined && seg.cond.value!=='')
		? `{${seg.cond.target},${seg.cond.attr},${seg.cond.op},${seg.cond.value}}` : ''
		const acts = seg.actions.map(serAction).join('')
		return `${cond}${acts}`
	}).join('')
	const block = `<${inner}>`
	const tags: string[] = []
	if (s.consume) tags.push('Consume')
	if (s.foresee) tags.push('Foresee')
	const tagStr = tags.length ? ` (${tags.join(' ')})` : ''
	const trig = (s.trigger==='Watch' || s.trigger==='Watch(...)') ? `Watch(${s.triggerArgs || 'Harvest,None'})` : s.trigger
	return `${trig} ${block}${tagStr}`
}
function serializeSentences(): string { return sentences.value.map(serializeSentence).join(' # ') }
function serializeBegin(): string {
	return beginCmds.value.map((b:any)=>
		b.kind==='GlobalAdd'
			? `Global,${b.attr},${b.value}`
			: b.kind==='OpenPack'
				? `OpenPack(${b.packType};${b.size};${b.n})`
				: b.kind==='AddPendant'
					? `AddPendant(${b.name})`
					: b.kind==='OpenOneOfFourteen'
						? `OpenOneOfFourteen()`
						: b.kind==='AddOriginPendant'
							? `AddOriginPendant()`
							: ''
	).filter(Boolean).join(' # ')
}

/**
 * 初始化函数，从 DSL 文本解析到可视化数据结构
 */
function initFromDSL(){
	suppressEmit.value = true
	try {
		sentences.value = [];
		beginCmds.value = [];
		const raw=(props.modelValue||'').trim(); dslText.value=raw
		if(!raw) return
		if(props.kind === 'begineffect'){ parseBegin(raw); return }
		parseEffect(raw)
	} finally {
		setTimeout(() => { suppressEmit.value = false }, 0)
	}
}

function parseBegin(raw: string){
  const parts = raw.split('#').map(s=>s.trim()).filter(Boolean)
  for (const p of parts){
    if (p.startsWith('OpenPack(')){
      const m = p.match(/^OpenPack\((Card|Pendant);(Small|Big);(\d+)\)$/)
      if (m) { beginCmds.value.push({ kind: 'OpenPack', packType: m[1] as any, size: m[2] as any, n: Number(m[3]) } as any); continue }
    } else if (p.startsWith('AddPendant(')){
      const m = p.match(/^AddPendant\((.+)\)$/)
      if (m) { beginCmds.value.push({ kind: 'AddPendant', name: m[1] } as any); continue }
    } else if (p.startsWith('OpenOneOfFourteen(')){
      beginCmds.value.push({ kind:'OpenOneOfFourteen' } as any); continue
    } else if (p.startsWith('AddOriginPendant(')){
      beginCmds.value.push({ kind:'AddOriginPendant' } as any); continue
    } else if (p.startsWith('Global,')){
      const m = p.match(/^Global,(Money|HealthLimit|WholeGameKPIMultiplier|WholeGameKPIDisasterMultiplier),(.+)$/)
      if (m) { beginCmds.value.push({ kind: 'GlobalAdd', attr: m[1] as any, value: m[2] } as any); continue }
    }
  }
}
function parseCond(txt:string){ const parts=txt.split(',').map(s=>s.trim()); if(parts.length>=4){ const [target,attr,op,...rest]=parts; return { target, attr, op: op as any, value: rest.join(',') } } return {} }
function parseAction(txt:string): any {
  const attrM=txt.match(/^(.*?),(.*?),(=.*|.+)$/)
  if(attrM){
    const target=attrM[1].trim(), attr=attrM[2].trim(), v=attrM[3].trim(); const mode=v.startsWith('=')?'set':'add'; const value=v.startsWith('=')?v.slice(1):v; return { type:'attr', target, attr, mode, value }
  }
  const funcM=txt.match(/^(\w+)\((.*)\)$/)
  if(funcM){ const name=funcM[1]; const rawArgs=funcM[2]; const parts=rawArgs===''?[]:rawArgs.split(';'); return { type:'func', name, args: parts.map((p)=>({ value:p })), __rawArgs: rawArgs } }
  return { type:'raw', raw: txt }
}

/**
 * 解析效果字符串到可视化数据结构
 * @param raw 效果字符串
 */
function parseEffect(raw:string){
	const parts = raw.split('#').map(s=>s.trim()).filter(Boolean);
	for(const p of parts) {
		const m = p.match(/^(.*?)\s*<\s*(.*)\s*>\s*(\((.+)\))?\s*$/);
		if(!m) {
			sentences.value.push({
				trigger:'Play',
				segments:[{ cond:{}, actions:[] }],
				consume:false,
				foresee:false
			});
			continue
		}
		let triggerText = (m[1]||'').trim()||'Play';
		const inner = m[2]||'';
		const tagStr = (m[4]||'');
		const s: Types.Editor.EffectString.Sentence = {
			trigger: triggerText,
			segments: [{ cond:{}, actions:[] }],
			consume: /\bConsume\b/.test(tagStr),
			foresee: /\bForesee\b/.test(tagStr)
		}; // handle Watch(...)
		const watchM = triggerText.match(/^Watch\((.*)\)$/)
		if (watchM) {
			s.trigger = 'Watch';
			s.triggerArgs = watchM[1];
		}
		let current = s.segments[0];
		const tokens = Array.from(inner.matchAll(/\{([^{}]+)\}|\[([^\[\]]+)\]/g));
		for(const t of tokens) {
			if(t[1]) {
				current = {
					cond:parseCond(t[1]),
					actions:[]
				};
				s.segments.push(current);
			} else if(t[2]) {
				current.actions.push(parseAction(t[2]))
			}
		}
		if(s.segments.length>1 && s.segments[0].actions.length===0 && Object.keys(s.segments[0].cond).length===0) {
			s.segments.shift()
		}
		if(s.segments.length===0) {
			s.segments.push({
				cond:{},
				actions:[]
			})
		}
		sentences.value.push(s);
	}
}

// 监听开局命令编辑，触发同步（深度）
watch(beginCmds, () => { if (tab.value==='visual') emitFromVisual() }, { deep: true })

// 监听 props 回传，避免与本地发出的值重复初始化
watch(() => props.modelValue, (v) => {
	const incoming = (v || '').trim();
	const old = (dslText.value || '').trim();
	if (incoming === lastEmitted.value) return
	if (incoming === old) return
	dslText.value = incoming;
	sentences.value = [];
	beginCmds.value = [];
	initFromDSL();
}, { immediate: true })
</script>

<style scoped>
.effect-editor { border: 1px solid var(--el-border-color); border-radius: 6px; padding: 8px; }
.cards { display:flex; flex-direction: column; gap: 8px }
.preview { margin-top: 8px; }
</style>
