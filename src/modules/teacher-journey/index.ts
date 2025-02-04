import type { App } from 'vue'
import routes from './routes'
import TeacherJourneyService from './services/TeacherJourneyService'
import TeacherJourney from './components/TeacherJourney.vue'

export default {
  install(app: App) {
    app.component('TeacherJourney', TeacherJourney)
    app.config.globalProperties.$teacherJourneyService = new TeacherJourneyService()
  },
  routes,
}
