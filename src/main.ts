import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './style.css';

// ─── Bootstrap ────────────────────────────────────────────────────────────────
const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);

// ─── Initialize Theme (apply dark class before mount) ─────────────────────────
import { useThemeStore } from './stores/theme';
const themeStore = useThemeStore();
themeStore.applyTheme();

app.mount('#app');
