export type DictArg = { name: string; placeholder?: string }
export type DictFunc = { id: string; label: string; args?: DictArg[]; group?: string }

export const triggers: { id: string; label: string }[] = [
  { id: 'Play', label: '打出时 Play' },
  { id: 'Place', label: '放置时 Place' },
  { id: 'Draw', label: '抽到时 Draw' },
  { id: 'Grow', label: '成长时 Grow' },
  { id: 'Harvest', label: '收获时 Harvest' },
  { id: 'RoundBegin', label: '回合开始 RoundBegin' },
  { id: 'RoundEnd', label: '回合结束 RoundEnd' },
  { id: 'TimeExplode', label: '时间爆炸 TimeExplode' },
  { id: 'TimeSafe', label: '时间安全 TimeSafe' },
  { id: 'YearBegin', label: '年初 YearBegin' },
  { id: 'YearEnd', label: '年末 YearEnd' },
  { id: 'Gain', label: '获得挂件 Gain' },
  { id: 'Dying', label: '挂件消失 Dying' },
  { id: 'Buff', label: '光环 Buff' },
  { id: 'Watch', label: '监听事件 Watch(…)' },
]

export const targets = [
  { id: 'Self', label: '自身 Self' },
  { id: 'SelfCard', label: '这张牌 SelfCard' },
  { id: 'SelfPendant', label: '这个挂件 SelfPendant' },
  { id: 'Global', label: '全局 Global' },
  { id: 'Around', label: '周围 Around' },
  { id: 'LandPlant', label: '地里植物 LandPlant' },
  { id: 'Hand', label: '手牌 Hand' },
  { id: 'Bag', label: '背包 Bag' },
  { id: 'Chosen', label: '所选目标 Chosen' },
  { id: 'CardCollection', label: '卡库 CardCollection' },
  { id: "RandomRange(LandPlant:1)", label: '随机1株地里植物 RandomRange(LandPlant:1)' },
]

export const attrs = [
  { id: 'Growth', label: '成长 Growth' },
  { id: 'GrowPeriod', label: '生长期 GrowPeriod' },
  { id: 'HarvestIncome', label: '收获收益 HarvestIncome' },
  { id: 'Money', label: '金币 Money' },
  { id: 'SpecialVal', label: '特殊值 SpecialVal' },
  { id: 'CountVal', label: '计数 CountVal' },
  { id: 'TimeLabel', label: '时标 TimeLabel' },
  { id: 'TempTimeLabel', label: '临时时标 TempTimeLabel' },
  { id: 'Health', label: '生命 Health' },
  { id: 'HealthLimit', label: '生命上限 HealthLimit' },
  { id: 'KPIMultiplier', label: 'KPI倍率 KPIMultiplier' },
  { id: 'WholeGameKPIMultiplier', label: '全局KPI倍率 WholeGameKPIMultiplier' },
  { id: 'WholeGameKPIDisasterMultiplier', label: '灾年KPI倍率 WholeGameKPIDisasterMultiplier' },
  { id: 'ExtraHarvestTimes', label: '额外收获次数 ExtraHarvestTimes' },
  { id: 'TimeLabelLimit', label: '时标上限 TimeLabelLimit' },
]

export const cmpOps = [
  { id: 'Equal', label: '等于 Equal' },
  { id: 'Bigger', label: '大于 Bigger' },
  { id: 'BiggerOrEqual', label: '大于等于 ≥' },
  { id: 'Smaller', label: '小于 Smaller' },
  { id: 'SmallerOrEqual', label: '小于等于 ≤' },
  { id: 'Contain', label: '包含 Contain' },
  { id: 'Is', label: '是 Is' },
  { id: 'IsNot', label: '不是 IsNot' },
]

export const funcs: DictFunc[] = [
  // 成长类
  { id: 'RandomGrow', label: '随机使一个植物生长 RandomGrow(数量)', args: [{ name: '数量', placeholder: '1' }], group: '成长' },
  { id: 'AllGrow', label: '所有植物生长 AllGrow(数量)', args: [{ name: '数量', placeholder: '1' }], group: '成长' },

  // 数值与资源
  { id: 'BagIn', label: '获得到背包 BagIn(卡名;数量)', args: [{ name: '卡名', placeholder: '阳光' }, { name: '数量', placeholder: '1' }], group: '资源/牌库' },
  { id: 'HandIn', label: '加入手牌 HandIn(卡名;数量)', args: [{ name: '卡名' }, { name: '数量', placeholder: '1' }], group: '资源/牌库' },

  // 触发与控制
  { id: 'TriggerItem', label: '触发事件 TriggerItem(目标;事件;次数)', args: [{ name: '目标', placeholder: 'RandomRange(LandPlant:1)' }, { name: '事件', placeholder: 'Harvest' }, { name: '次数', placeholder: '1' }], group: '触发/控制' },
  { id: 'DestroyItem', label: '销毁 DestroyItem(目标)', args: [{ name: '目标', placeholder: 'Self' }], group: '变换/销毁' },
  { id: 'Transfer', label: '转化 Transfer(目标;新名称)', args: [{ name: '目标', placeholder: 'Self' }, { name: '新名称', placeholder: '卡名' }], group: '变换/销毁' },
  { id: 'TransferCopy', label: '复制 TransferCopy(目标;新名称?)', args: [{ name: '目标', placeholder: 'Self' }, { name: '新名称(可空)' }], group: '变换/销毁' },

  // 抽牌/预测/时间线
  { id: 'DrawIgnoreLabel', label: '忽略标签抽牌 DrawIgnoreLabel(...)', args: [{ name: '参数' }], group: '抽牌/时间' },
  { id: 'LastDraw', label: '最后抽到 LastDraw()', group: '抽牌/时间' },
  { id: 'NextDrawPredictTimeExplode', label: '下一抽预测爆炸 NextDrawPredictTimeExplode(Func)', args: [{ name: '函数' }], group: '抽牌/时间' },
  { id: 'NextDrawMustPeak', label: '下一抽必须峰值 NextDrawMustPeak(属性;是否;次数)', args: [{ name: '属性', placeholder: 'TimeLabel' }, { name: '是否', placeholder: 'true' }, { name: '次数', placeholder: '1' }], group: '抽牌/时间' },
  { id: 'ThisRoundPredictTimeExplode', label: '本回合预测爆炸 ThisRoundPredictTimeExplode(Func)', args: [{ name: '函数' }], group: '抽牌/时间' },
  { id: 'NextRound', label: '下一回合 NextRound(...)', args: [{ name: '原语' }], group: '抽牌/时间' },
  { id: 'NextYear', label: '下一年 NextYear(...)', args: [{ name: '原语' }], group: '抽牌/时间' },

  // 开包/挂件/开局
  { id: 'OpenPack', label: '开包 OpenPack(类型;规格;数量)', args: [{ name: '类型', placeholder: 'Card|Pendant' }, { name: '规格', placeholder: 'Small|Big' }, { name: '数量', placeholder: '1' }], group: '开局/奖励' },
  { id: 'OpenOneOfFourteen', label: '开12选1包 OpenOneOfFourteen()', group: '开局/奖励' },
  { id: 'AddPendant', label: '获得挂件 AddPendant(名称)', args: [{ name: '名称', placeholder: '会员卡' }], group: '开局/奖励' },
  { id: 'AddOriginPendant', label: '获得原初挂件 AddOriginPendant()', group: '开局/奖励' },

  // 光环
  { id: 'Buff', label: '光环 Buff(范围,筛选,属性,数值)', args: [{ name: '范围', placeholder: 'Around|Global' }, { name: '筛选', placeholder: "Filter(...)" }, { name: '属性', placeholder: 'HarvestIncome' }, { name: '数值', placeholder: '1' }], group: '光环' },

  // 过滤/选择/计算（高级原语占位）
  { id: 'Filter', label: '筛选 Filter(...)', args: [{ name: '条件表达式' }], group: '筛选/计算' },
  { id: 'Tally', label: '统计 Tally(...)', args: [{ name: '统计表达式' }], group: '筛选/计算' },
  { id: 'RandomRange', label: '随机若干 RandomRange(...:n)', args: [{ name: '范围:数量', placeholder: 'LandPlant:1' }], group: '筛选/计算' },
  { id: 'GetDataInt', label: '读取数值 GetDataInt(X:Y)', args: [{ name: '源:属性', placeholder: 'Self:HarvestIncome' }], group: '筛选/计算' },
  { id: 'Operation', label: '计算表达式 Operation(…)', args: [{ name: '表达式', placeholder: 'a+b/2' }], group: '筛选/计算' },
]
