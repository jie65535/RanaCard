import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// Enable Element Plus dark theme via CSS variables when html has class 'dark'
import 'element-plus/theme-chalk/dark/css-vars.css'
// Global theme variables (code blocks, etc.)
import './styles/theme.css'

import App from './App.vue'
import router from './router'
import { useTheme } from './composables/useTheme'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
// Initialize theme before mount so initial paint matches preference
useTheme().initTheme()
app.mount('#app')
