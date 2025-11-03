import { defineStore } from 'pinia';
import { ref } from 'vue';

const useStoreEffectString = defineStore('effectString', () => {

    /** 触发时机 */
    const triggerOptions = ref<Types.Core.OptionItem<string>[]>([
        { value: 'Play', label: '打出时 Play' },
        { value: 'Place', label: '放置时 Place' },
        { value: 'Draw', label: '抽到时 Draw' },
        { value: 'Grow', label: '成长时 Grow' },
        { value: 'Harvest', label: '收获时 Harvest' },
        { value: 'RoundBegin', label: '回合开始 RoundBegin' },
        { value: 'RoundEnd', label: '回合结束 RoundEnd' },
        { value: 'TimeExplode', label: '时间爆炸 TimeExplode' },
        { value: 'TimeSafe', label: '时间安全 TimeSafe' },
        { value: 'YearBegin', label: '年初 YearBegin' },
        { value: 'YearEnd', label: '年末 YearEnd' },
        { value: 'Gain', label: '获得挂件 Gain' },
        { value: 'Dying', label: '挂件消失 Dying' },
        { value: 'Buff', label: '光环 Buff' },
        { value: 'Watch', label: '监听事件 Watch(…)' },
    ]);
    /** 作用目标 */
    const targetOptions = ref<Types.Core.OptionItem<string>[]>([
        { value: 'Self', label: '自身 Self' },
        { value: 'SelfCard', label: '这张牌 SelfCard' },
        { value: 'SelfPendant', label: '这个挂件 SelfPendant' },
        { value: 'Global', label: '全局 Global' },
        { value: 'Around', label: '周围 Around' },
        { value: 'LandPlant', label: '地里植物 LandPlant' },
        { value: 'Hand', label: '手牌 Hand' },
        { value: 'Bag', label: '背包 Bag' },
        { value: 'Chosen', label: '所选目标 Chosen' },
        { value: 'CardCollection', label: '卡库 CardCollection' },
        { value: "RandomRange(LandPlant:1)", label: '随机1株地里植物 RandomRange(LandPlant:1)' },
    ]);
    /** 作用参数 */
    const attrOptions = ref<Types.Core.OptionItem<string>[]>([
        { value: 'Growth', label: '成长 Growth' },
        { value: 'GrowPeriod', label: '生长期 GrowPeriod' },
        { value: 'HarvestIncome', label: '收获收益 HarvestIncome' },
        { value: 'Money', label: '金币 Money' },
        { value: 'SpecialVal', label: '特殊值 SpecialVal' },
        { value: 'CountVal', label: '计数 CountVal' },
        { value: 'TimeLabel', label: '时标 TimeLabel' },
        { value: 'TempTimeLabel', label: '临时时标 TempTimeLabel' },
        { value: 'Health', label: '生命 Health' },
        { value: 'HealthLimit', label: '生命上限 HealthLimit' },
        { value: 'KPIMultiplier', label: 'KPI倍率 KPIMultiplier' },
        { value: 'WholeGameKPIMultiplier', label: '全局KPI倍率 WholeGameKPIMultiplier' },
        { value: 'WholeGameKPIDisasterMultiplier', label: '灾年KPI倍率 WholeGameKPIDisasterMultiplier' },
        { value: 'ExtraHarvestTimes', label: '额外收获次数 ExtraHarvestTimes' },
        { value: 'TimeLabelLimit', label: '时标上限 TimeLabelLimit' },
    ]);
    /** 比较符 */
    const cmpOptions = ref<Types.Core.OptionItem<string>[]>([
        { value: 'Equal', label: '等于 Equal' },
        { value: 'Bigger', label: '大于 Bigger' },
        { value: 'BiggerOrEqual', label: '大于等于 ≥' },
        { value: 'Smaller', label: '小于 Smaller' },
        { value: 'SmallerOrEqual', label: '小于等于 ≤' },
        { value: 'Contain', label: '包含 Contain' },
        { value: 'Is', label: '是 Is' },
        { value: 'IsNot', label: '不是 IsNot' },
    ]);
    /** 动作 */
    const funcOptions = ref<Types.Editor.EffectString.DictFunc[]>([
        // 成长类
        { value: 'RandomGrow', label: '随机使一个植物生长 RandomGrow(数量)', args: [{ name: '数量', placeholder: '1' }], group: '成长' },
        { value: 'AllGrow', label: '所有植物生长 AllGrow(数量)', args: [{ name: '数量', placeholder: '1' }], group: '成长' },

        // 数值与资源
        { value: 'BagIn', label: '获得到背包 BagIn(卡名;数量)', args: [{ name: '卡名', placeholder: '阳光' }, { name: '数量', placeholder: '1' }], group: '资源/牌库' },
        { value: 'HandIn', label: '加入手牌 HandIn(卡名;数量)', args: [{ name: '卡名' }, { name: '数量', placeholder: '1' }], group: '资源/牌库' },

        // 触发与控制
        { value: 'TriggerItem', label: '触发事件 TriggerItem(目标;事件;次数)', args: [{ name: '目标', placeholder: 'RandomRange(LandPlant:1)' }, { name: '事件', placeholder: 'Harvest' }, { name: '次数', placeholder: '1' }], group: '触发/控制' },
        { value: 'DestroyItem', label: '销毁 DestroyItem(目标)', args: [{ name: '目标', placeholder: 'Self' }], group: '变换/销毁' },
        { value: 'Transfer', label: '转化 Transfer(目标;新名称)', args: [{ name: '目标', placeholder: 'Self' }, { name: '新名称', placeholder: '卡名' }], group: '变换/销毁' },
        { value: 'TransferCopy', label: '复制 TransferCopy(目标;新名称?)', args: [{ name: '目标', placeholder: 'Self' }, { name: '新名称(可空)' }], group: '变换/销毁' },

        // 抽牌/预测/时间线
        { value: 'DrawIgnoreLabel', label: '忽略标签抽牌 DrawIgnoreLabel(...)', args: [{ name: '参数' }], group: '抽牌/时间' },
        { value: 'LastDraw', label: '最后抽到 LastDraw()', group: '抽牌/时间' },
        { value: 'NextDrawPredictTimeExplode', label: '下一抽预测爆炸 NextDrawPredictTimeExplode(Func)', args: [{ name: '函数' }], group: '抽牌/时间' },
        { value: 'NextDrawMustPeak', label: '下一抽必须峰值 NextDrawMustPeak(属性;是否;次数)', args: [{ name: '属性', placeholder: 'TimeLabel' }, { name: '是否', placeholder: 'true' }, { name: '次数', placeholder: '1' }], group: '抽牌/时间' },
        { value: 'ThisRoundPredictTimeExplode', label: '本回合预测爆炸 ThisRoundPredictTimeExplode(Func)', args: [{ name: '函数' }], group: '抽牌/时间' },
        { value: 'NextRound', label: '下一回合 NextRound(...)', args: [{ name: '原语' }], group: '抽牌/时间' },
        { value: 'NextYear', label: '下一年 NextYear(...)', args: [{ name: '原语' }], group: '抽牌/时间' },

        // 开包/挂件/开局
        { value: 'OpenPack', label: '开包 OpenPack(类型;规格;数量)', args: [{ name: '类型', placeholder: 'Card|Pendant' }, { name: '规格', placeholder: 'Small|Big' }, { name: '数量', placeholder: '1' }], group: '开局/奖励' },
        { value: 'OpenOneOfFourteen', label: '开12选1包 OpenOneOfFourteen()', group: '开局/奖励' },
        { value: 'AddPendant', label: '获得挂件 AddPendant(名称)', args: [{ name: '名称', placeholder: '会员卡' }], group: '开局/奖励' },
        { value: 'AddOriginPendant', label: '获得原初挂件 AddOriginPendant()', group: '开局/奖励' },

        // 光环
        { value: 'Buff', label: '光环 Buff(范围,筛选,属性,数值)', args: [{ name: '范围', placeholder: 'Around|Global' }, { name: '筛选', placeholder: "Filter(...)" }, { name: '属性', placeholder: 'HarvestIncome' }, { name: '数值', placeholder: '1' }], group: '光环' },

        // 过滤/选择/计算（高级原语占位）
        { value: 'Filter', label: '筛选 Filter(...)', args: [{ name: '条件表达式' }], group: '筛选/计算' },
        { value: 'Tally', label: '统计 Tally(...)', args: [{ name: '统计表达式' }], group: '筛选/计算' },
        { value: 'RandomRange', label: '随机若干 RandomRange(...:n)', args: [{ name: '范围:数量', placeholder: 'LandPlant:1' }], group: '筛选/计算' },
        { value: 'GetDataInt', label: '读取数值 GetDataInt(X:Y)', args: [{ name: '源:属性', placeholder: 'Self:HarvestIncome' }], group: '筛选/计算' },
        { value: 'Operation', label: '计算表达式 Operation(…)', args: [{ name: '表达式', placeholder: 'a+b/2' }], group: '筛选/计算' },
    ]);



    return {
        triggerOptions, targetOptions, attrOptions, cmpOptions, funcOptions
    }

})

export default useStoreEffectString;
