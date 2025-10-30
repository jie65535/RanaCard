<template>
  <div class="dsl-help">
    <el-card>
      <h2>效果教程：从零到熟练</h2>

      <p>
        本教程面向从未接触过编程的玩家，手把手带你理解并写出游戏里的“效果字符串”。
        你可以从头看完，也可以按目录挑你需要的部分；每一节都配有可复制的示例。
      </p>

      <h3>1. 这门“语言”长什么样？</h3>
      <ul>
        <li>每张卡/挂件的效果由几段“句子”组成，用 <code>#</code> 分隔。</li>
        <li>每个句子 = <strong>触发时机</strong> + <strong>执行块</strong> + <strong>可选标签</strong>。</li>
        <li>执行块用尖括号 <code>&lt; ... &gt;</code> 包住，里面按顺序执行。</li>
      </ul>
      <div class="ex">
        例：打出时随机让一株植物+1成长，并且这张牌会被消耗<br>
        <code>Play &lt;[RandomGrow(1)]&gt; (Consume)</code>
      </div>

      <h3>2. 触发时机（什么时候生效）</h3>
      <p>常用触发词（看到就按字面理解即可）：</p>
      <ul>
        <li>打出：<code>Play</code>；放置：<code>Place</code>；抽到：<code>Draw</code></li>
        <li>成长：<code>Grow</code>；收获：<code>Harvest</code></li>
        <li>回合开始/结束：<code>RoundBegin</code>/<code>RoundEnd</code></li>
        <li>时间爆炸/安全：<code>TimeExplode</code>/<code>TimeSafe</code>；年初/年末：<code>YearBegin</code>/<code>YearEnd</code></li>
        <li>获得挂件时：<code>Gain</code>；挂件消失时：<code>Dying</code></li>
        <li>监听其它事件：<code>Watch(...)</code>（见第7节）</li>
      </ul>

      <h3>3. 执行块的基本语法</h3>
      <ul>
        <li>执行块里有两种元素：<strong>{条件}</strong> 和 <strong>[动作]</strong>。</li>
        <li>写法顺序就是执行顺序；条件只影响它后面紧挨着的一串动作。</li>
      </ul>
      <div class="ex">
        例：先把计数+1；如果计数≥10，则+5金币并把计数清零<br>
        <code>&lt;[Self,CountVal,1]&gt;&lt;{Self,CountVal,BiggerOrEqual,10}[Global,Money,5][Self,CountVal,=0]&gt;</code>
      </div>

      <h3>4. 动作：做什么事</h3>
      <ul>
        <li>改属性：<code>[目标, 属性, 数值]</code>（在原值上加）；<code>[目标, 属性, =数值]</code>（直接设为）。</li>
        <li>常见属性：
          <code>Growth</code>（成长），<code>GrowPeriod</code>（生长期），<code>HarvestIncome</code>（收获收益），
          <code>SpecialVal</code>/<code>CountVal</code>（自定义计数），<code>TimeLabel</code>（时标/费用）。
        </li>
        <li>触发别人的事件：<code>[TriggerItem(目标; 事件; 次数)]</code></li>
        <li>销毁/复制/转化：<code>[DestroyItem(目标)]</code>、<code>[Transfer(目标; 新名称)]</code>、<code>[TransferCopy(目标; Left/Right)]</code></li>
        <li>范围强化（光环/一次性批量修改）：
          <ul>
            <li>光环：<code>[Buff(范围, 筛选, 属性, 变化)]</code></li>
            <li>一次性：<code>[Filter(范围'(条件)), 属性, 数值]</code></li>
          </ul>
        </li>
        <li>抽牌与预知：<code>[DrawTwoDiscardOne()]</code>、<code>[LastDraw()]</code>、<code>[NextDrawPredictTimeExplode(Action)]</code> 等</li>
        <li>背包掉落：<code>[BagIn(名称;数量)]</code></li>
      </ul>
      <div class="ex">
        例：周围植物的收获收益+1（光环）<br>
        <code>Buff &lt;[Buff(Around,Type;Is;Plant,HarvestIncome,1)]&gt;</code>
      </div>

      <h3>5. 目标与范围：对谁生效</h3>
      <ul>
        <li>常见目标：
          <code>Self</code>（这张牌/这个单位），<code>SelfCard</code>（这张牌的“影子”，常用来记数），
          <code>SelfPendant</code>（这个挂件），<code>Global</code>（全局），<code>Chosen</code>（玩家点选），
          <code>Left/Right</code>（相邻），<code>Around</code>（周围），<code>Land</code>（全场）。
        </li>
        <li>筛选与随机：
          <code>Filter( 作用域'( 条件 ) )</code> 选出一组目标；
          <code>RandomRange(筛选:数量)</code> 从中随机挑若干。
        </li>
      </ul>
      <div class="ex">
        例：随机选择两株全场植物，各+1成长<br>
        <code>Play &lt;[RandomRange(Filter(Land'(Type'Is'Plant)):2),Growth,1]&gt;</code>
      </div>

      <h3>6. 条件：什么时候才执行后面的动作</h3>
      <ul>
        <li>写法：<code>{ 目标, 属性, 比较, 值 }</code>。比较包括：
          <code>Is</code>（等于），<code>Not</code>（不等于），<code>Contain</code>/<code>NotContain</code>（名字包含/不包含），
          <code>Bigger</code>/<code>BiggerOrEqual</code>（大于/大于等于），<code>Smaller</code>/<code>SmallerOrEqual</code>，<code>Equal</code>。
        </li>
        <li>筛选器里可用 <code>&amp;</code>（并且）、<code>|</code>（或者）拼条件。</li>
      </ul>
      <div class="ex">
        例：如果没有空地，就+5金币（挂件常见）<br>
        <code>RoundEnd &lt;{Global,LandEmptyNum,Equal,0}[Global,Money,5]&gt;</code>
      </div>

      <h3>7. 表达式与取值：用变量做数学</h3>
      <ul>
        <li>读数：<code>GetDataInt(目标:属性)</code>，如 <code>GetDataInt(Self:HarvestIncome)</code></li>
        <li>计算：<code>Operation(表达式)</code>，支持 <code>+ - * / % () ^</code></li>
        <li>统计：<code>Tally(筛选)</code> 返回数量；<code>Probability(多段)</code> 按百分比执行分支。</li>
      </ul>
      <div class="ex">
        例：把自己的收益换成金币<br>
        <code>Harvest &lt;[Global,Money,GetDataInt(Self:HarvestIncome)]&gt;</code>
      </div>

      <h3>8. 监听（Watch）：别人做了事，我来响应</h3>
      <ul>
        <li>周围某事件：<code>Watch(Around,Harvest)</code>（周围单位收获时）</li>
        <li>满足某条件：<code>Watch(Condition, Category;Is;Spell)</code>（使用法术时）</li>
        <li>全局计数变化：<code>Watch(GlobalNum,ThisRoundSpellNumPlus)</code> 等</li>
        <li>挂件扩展：<code>Watch(BagIn,None)</code>（有物品入包）等。</li>
      </ul>
      <div class="ex">
        例：每使用1张法术就计数，满5次送奖励并清零（挂件）<br>
        <code>Watch(Condition,Category;Is;Spell) &lt;[SelfPendant,CountVal,1]&gt;&lt;{SelfPendant,CountVal,BiggerOrEqual,5}[BagIn(蒸发露珠;1)][SelfPendant,CountVal,-5]&gt;</code>
      </div>

      <h3>9. 常见模式（拿来即用）</h3>
      <ul>
        <li><strong>倒计时结算</strong>：放下后倒数，到0结算并自毁<br>
          <code>RoundEnd &lt;[Self,HarvestIncome,2]&gt; # Place &lt;[Self,SpecialVal,-1]&gt;&lt;{Self,SpecialVal,SmallerOrEqual,0}[Global,Money,GetDataInt(Self:HarvestIncome)][DestroyItem(Self)]&gt;</code>
        </li>
        <li><strong>进位结算</strong>：每次+1，累计到6就给钱并清余数<br>
          <code>&lt;[Self,SpecialVal,1]&gt;&lt;{Self,SpecialVal,BiggerOrEqual,6}[Global,Money,Operation(GetDataInt(Self:SpecialVal)/6)][Self,SpecialVal,=Operation(GetDataInt(Self:SpecialVal)%6)]&gt;</code>
        </li>
        <li><strong>光环</strong>：周围植物收获收益+1（持续效果）<br>
          <code>Buff &lt;[Buff(Around,Type;Is;Plant,HarvestIncome,1)]&gt;</code>
        </li>
        <li><strong>立即触发</strong>：选择一株植物立刻收获一次<br>
          <code>Play &lt;{Chosen,Type,Is,Plant}[TriggerItem(Chosen;Harvest;1)]&gt;</code>
        </li>
      </ul>

      <h3>10. 从0到1写一条完整效果（五步法）</h3>
      <ol>
        <li>时机：什么时候发生？例：回合结束 —— <code>RoundEnd</code></li>
        <li>对象：影响谁？例：自己 —— <code>Self</code></li>
        <li>动作：做什么？例：收益+2 —— <code>[Self,HarvestIncome,2]</code></li>
        <li>条件：需要满足什么？例：没有空地 —— <code>{Global,LandEmptyNum,Equal,0}</code></li>
        <li>组合：按顺序拼成句子<br>
          <code>RoundEnd &lt;{Global,LandEmptyNum,Equal,0}[Self,HarvestIncome,2]&gt;</code>
        </li>
      </ol>

      <h3>11. 实用示例库（可复制稍改数值/名字即可）</h3>
      <ul>
        <li>回合开始多一次“额外收获”机会（挂件）：<br>
          <code>RoundBegin &lt;[Global,ExtraHarvestTimes,=1]&gt;</code>
        </li>
        <li>获得时商店打七折（挂件）：<br>
          <code>Gain &lt;[Global,ShopDiscount,=0.7]&gt;</code>
        </li>
        <li>时间爆炸次数越多，收益越高（指数系数）：<br>
          <code>Add &lt;[SelfCard,HarvestIncome,=Operation(1.05^GetDataInt(Global:TimeExplodeNum)*6)]&gt;</code>
        </li>
        <li>随机两株周围植物+1成长：<br>
          <code>Play &lt;[RandomRange(Filter(Around'(Type'Is'Plant)):2),Growth,1]&gt;</code>
        </li>
        <li>触发左侧单位的收获：<br>
          <code>Harvest &lt;[TriggerItem(Left;Harvest;1)]&gt;</code>
        </li>
        <li>回合结束向背包放入“硬币”1个（挂件常见）：<br>
          <code>RoundEnd &lt;[BagIn(硬币;1)]&gt;</code>
        </li>
      </ul>

      <h3>12. 小结与建议</h3>
      <ul>
        <li>看不懂时，先找“时机”与“对象”，再看“动作”。</li>
        <li>涉及一群单位时，先用 <code>Filter(...)</code> 选出来，再配合 <code>RandomRange</code> 或直接加属性。</li>
        <li>需要“每几次给一次奖励”时，用“进位结算”模板最省心。</li>
      </ul>

    </el-card>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.dsl-help { max-width: 1080px; margin: 0 auto; }
.dsl-help :deep(code) {
  background: var(--code-bg);
  color: var(--code-fg);
  padding: 0 4px;
  border-radius: 3px;
  border: 1px solid var(--code-border);
}
.dsl-help :deep(pre) { background: transparent; }
.dsl-help :deep(code) { white-space: break-spaces; }
.dsl-help :deep(.el-card__body) { overflow-x: auto; }
.dsl-help :deep(.el-card) { border-radius: 8px; }
.dsl-help :deep(h2), .dsl-help :deep(h3) { margin-top: 12px; }
.dsl-help :deep(ul) { padding-left: 18px; }
.dsl-help :deep(li) { margin: 4px 0; }
.dsl-help :deep(.el-option) { font-size: 13px; }
.dsl-help :deep(.ex code) { display: inline-block; margin-top: 4px; }
.ex { margin: 8px 0 16px; }
</style>
