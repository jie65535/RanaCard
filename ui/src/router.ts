import { createRouter, createWebHashHistory } from 'vue-router'
import CardsView from './views/CardsView.vue'
import PendantsView from './views/PendantsView.vue'
import MapEventsView from './views/MapEventsView.vue'
import DSLHelp from './views/DSLHelp.vue'

const routes = [
  { path: '/', redirect: '/cards' },
  { path: '/cards', component: CardsView },
  { path: '/pendants', component: PendantsView },
  { path: '/map-events', component: MapEventsView },
  { path: '/help/effects', component: DSLHelp },
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
