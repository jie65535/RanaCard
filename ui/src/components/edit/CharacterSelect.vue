<template>
    <CommonSelect
        v-model="modelValue"
        :placeholder="placeholder"
        :clearable="clearable"
        :options="CharacterOptions"
    />
</template>

<style scoped>
</style>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import useStoreBase from '../../store/storeBase';
import { IEnumCharacter } from '../../utils/enum/base';
import CommonSelect from './CommonSelect.vue';

const props = withDefaults(defineProps<{
    clearable?: boolean;
    placeholder?: string;
}>(), {
    clearable: false,
    placeholder: '角色',
})

const storeBase = useStoreBase();
const { CharacterOptions } = storeToRefs(storeBase);

const modelValue = defineModel<IEnumCharacter | ''>();
</script>