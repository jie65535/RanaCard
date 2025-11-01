<template>
    <el-select
        v-model="modelValue"
        :placeholder="placeholder"
        :clearable="clearable"
        style="width: 100%;">
        <el-option
            v-for="option in CategoryOptions"
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
import { IEnumCategory } from '../../utils/enum/base';

const props = withDefaults(defineProps<{
    clearable?: boolean;
    placeholder?: string;
}>(), {
    clearable: false,
    placeholder: '类别',
})

const storeBase = useStoreBase();
const { CategoryOptions } = storeToRefs(storeBase);

const modelValue = defineModel<IEnumCategory | ''>();
</script>