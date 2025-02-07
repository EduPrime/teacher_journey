import type { App } from 'vue'
import routes from './routes'
import TeacherJourney from './components/TeacherJourney.vue'

export default {
  install(app: App) {
    app.component('TeacherJourney', TeacherJourney)
  },
  routes,
}
