<template>
    <template v-if="optInfo">
        <ElTag v-if="optInfo?.type" :type="optInfo?.type">{{ optInfo?.label }}</ElTag>
        <ElTag v-else :color="optInfo?.bgColor" :style="{color: optInfo?.textColor}">{{ optInfo?.label }}</ElTag>
    </template>
    <ElTag v-else :type="'info'">未知角色</ElTag>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import useStoreBase from '../../store/storeBase';
import { IEnumType } from '../../utils/enum/base';
import { computed } from 'vue';
import { ElTag } from 'element-plus';

const props = defineProps<{
    value: IEnumType;
}>();

const storeBase = useStoreBase();
const { CharacterOptions } = storeToRefs(storeBase);
const optInfo = computed(() => {
    const option = CharacterOptions.value.find(
        (opt) => opt.value === props.value
    );
    return option;
});
</script>