<template>
    <CommonSelect
        v-model="modelValue"
        :placeholder="placeholder"
        :clearable="clearable"
        :options="ComboOptions"
    />
</template>

<style scoped>
</style>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import useStoreBase from '../../store/storeBase';
import { IEnumCombo } from '../../utils/enum/base';
import CommonSelect from './CommonSelect.vue';

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