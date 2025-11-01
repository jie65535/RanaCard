import { defineStore } from 'pinia';
import { ref } from 'vue';
import { IEnumCategory, IEnumCharacter, IEnumCombo, IEnumType } from '../utils/enum/base';

const useStoreBase = defineStore('base', () => {

    /** 类别 */
    const CategoryOptions = ref<Types.Core.OptionItem<IEnumCategory>[]>([
        {label: '衍生物', value: IEnumCategory.DERIVATIVE, type: 'info'},
        {label: '法术', value: IEnumCategory.SPELL, type: 'primary'},
        {label: '物品', value: IEnumCategory.ITEM, type: 'warning'},
    ]);
    /** 类型 */
    const TypeOptions = ref<Types.Core.OptionItem<IEnumType>[]>([
        {label: '普通', value: IEnumType.NORMAL, type: 'primary'},
        {label: '衍生物', value: IEnumType.DERIVATIVE, type: 'info'},
        {label: '植物', value: IEnumType.PLANT, type: 'success'},
        {label: '建筑', value: IEnumType.BUILDING, type: 'danger'},
        {label: '动物', value: IEnumType.ANIMAL, type: 'warning'},
        {label: '巢穴', value: IEnumType.NEST, bgColor: '#8B4513', textColor: '#FFFFFF'},
        {label: '矿物', value: IEnumType.MINERAL, bgColor: '#708090', textColor: '#FFFFFF'},
        {label: '锭', value: IEnumType.INGOT, bgColor: '#DAA520', textColor: '#000000'},
        {label: '昆虫', value: IEnumType.INSECT, bgColor: '#FF8C00', textColor: '#000000'},
        {label: '灾难昆虫', value: IEnumType.DISASTER_INSECT, bgColor: '#000', textColor: '#FFFFFF'},
    ]);
    /** 角色 */
    const CharacterOptions = ref<Types.Core.OptionItem<IEnumCharacter>[]>([
        {label: '全部', value: IEnumCharacter.ALL, type: 'primary'},
        {label: '强力生长', value: IEnumCharacter.STRONG_GROW, type: 'success'},
        {label: '动物亲和', value: IEnumCharacter.ANIMAL, type: 'warning'},
        {label: '橙意满满', value: IEnumCharacter.BLOOD, type: 'danger'},
    ]);
    /** 流派 */
    
    /** 动物 */
    const ComboOptions = ref<Types.Core.OptionItem<IEnumCombo>[]>([
        {label: '中立', value: IEnumCombo.NEUTRAL, type: 'primary'},
        {label: '全局增长', value: IEnumCombo.ALL_GROW, type: 'success'},
        {label: '强力生长', value: IEnumCombo.STRONG_GROW, type: 'info'},
        {label: '橙意满满', value: IEnumCombo.BLOOD, type: 'danger'},
        {label: 'B-过量', value: IEnumCombo.B_EXCESS, bgColor: '#8B0000', textColor: '#FFFFFF'},
        {label: 'B-数字', value: IEnumCombo.B_NUM, bgColor: '#00008B', textColor: '#FFFFFF'},
        {label: 'B-时间', value: IEnumCombo.B_TIMES, bgColor: '#006400', textColor: '#FFFFFF'},
        {label: '动物', value: IEnumCombo.ANIMALS, type: 'warning'},
        {label: '鸡', value: IEnumCombo.CHICKEN, bgColor: '#FFD700', textColor: '#000000'},
        {label: '诅咒', value: IEnumCombo.CURSE, bgColor: '#4B0082', textColor: '#FFFFFF'},
        {label: '灾难', value: IEnumCombo.DISASTER, bgColor: '#2F4F4F', textColor: '#FFFFFF'},
        {label: '事件', value: IEnumCombo.EVENT, bgColor: '#FF4500', textColor: '#EEEEEE'},
        {label: '探矿', value: IEnumCombo.MINING, bgColor: '#A0522D', textColor: '#FFFFFF'},
        {label: '蘑菇', value: IEnumCombo.MUSHROOM, bgColor: '#8A2BE2', textColor: '#FFFFFF'},
        {label: '熊猫', value: IEnumCombo.PANDA, bgColor: '#000000', textColor: '#FFFFFF'},
        {label: '兔子', value: IEnumCombo.RABBIT, bgColor: '#FF69B4', textColor: '#EEEEEE'},
        {label: '雨', value: IEnumCombo.RAIN, bgColor: '#1E90FF', textColor: '#FFFFFF'},
        {label: '稻子', value: IEnumCombo.RICE, bgColor: '#FFFFE0', textColor: '#000000'},
        {label: '法术', value: IEnumCombo.SPELL, bgColor: '#9400D3', textColor: '#FFFFFF'},
        {label: '时间爆炸', value: IEnumCombo.TIME_EXPLODE, bgColor: '#FF1493', textColor: '#EEEEEE'},
        {label: '时间安全', value: IEnumCombo.TIME_SAFE, bgColor: '#00CED1', textColor: '#000000'},
        {label: '重复', value: IEnumCombo.REPEAT, bgColor: '#32CD32', textColor: '#EEEEEE'},
    ]);

    return {
        CategoryOptions, TypeOptions, CharacterOptions, ComboOptions
    }

})

export default useStoreBase;
