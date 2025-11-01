<template>
    <el-select
        v-model="modelValue"
        :placeholder="placeholder"
        :clearable="clearable"
        style="width: 100%;">
        <el-option
            v-for="option in ComboOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
        />
    </el-select>
</template>

<style scoped>
</style>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import useStoreBase from '../../store/storeBase';
import { IEnumCombo } from '../../utils/enum/base';

const props = withDefaults(defineProps<{
    clearable?: boolean;
    placeholder?: string;
}>(), {
    clearable: false,
    placeholder: '流派',
})

const storeBase = useStoreBase();
const { ComboOptions } = storeToRefs(storeBase);

const modelValue = defineModel<IEnumCombo | ''>();
</script>