<template>
    <el-select
        v-model="modelValue"
        :placeholder="placeholder"
        :clearable="clearable"
        :filterable="filterable"
        style="width: 100%;">
        <el-option
            v-for="option in options"
            :key="option.value"
            :label="option.label"
            :value="option.value"
        />
    </el-select>
</template>

<style scoped>
</style>

<script lang="ts" setup>
const props = withDefaults(defineProps<{
    options: Types.Core.OptionItem[];
    clearable?: boolean;
    filterable?: boolean;
    placeholder?: string;
}>(), {
    options: () => [],
    clearable: false,
    filterable: false,
    placeholder: '类型',
})

const modelValue = defineModel({
    default: '',
});
</script>