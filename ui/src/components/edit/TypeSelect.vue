<template>
    <CommonSelect
        v-model="modelValue"
        :placeholder="placeholder"
        :clearable="clearable"
        :options="TypeOptions"
    />
</template>

<style scoped>
</style>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import useStoreBase from '../../store/storeBase';
import { IEnumType } from '../../utils/enum/base';
import CommonSelect from './CommonSelect.vue';

const props = withDefaults(defineProps<{
    clearable?: boolean;
    placeholder?: string;
}>(), {
    clearable: false,
    placeholder: '类型',
})

const storeBase = useStoreBase();
const { TypeOptions } = storeToRefs(storeBase);

const modelValue = defineModel<IEnumType | ''>();
</script>