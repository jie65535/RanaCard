<template>
    <el-select
        v-model="modelValue"
        :placeholder="placeholder"
        :clearable="clearable"
        style="width: 100%;">
        <el-option
            v-for="option in CharacterOptions"
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
import { IEnumCharacter } from '../../utils/enum/base';

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