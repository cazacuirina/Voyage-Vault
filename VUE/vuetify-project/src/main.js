/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

const app = createApp(App)

registerPlugins(app)

app.mount('#app')

// Delete localstorage items before closing the window (log out user)
window.addEventListener('beforeunload', () => {
    localStorage.removeItem('token')  
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
})