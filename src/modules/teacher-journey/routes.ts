import { text, pencil, calendar, saveSharp, extensionPuzzle, shapes, create } from 'ionicons/icons';
import { CustomRouteRecordRaw } from '@/router/RouterType';
import TeacherJourney from './views/TeacherJourney.vue';
import TeacherContent from './views/TeacherContent.vue';
import TeacherView from './views/TeacherView.vue';
const routes: Array<CustomRouteRecordRaw> = [
  {
    path: '/teacherjourney',
    name: 'TeacherJourney',
    component: TeacherView,
    meta: {
      moduleName: 'TeacherJourney',
      moduleIcon: pencil,
      icon: create,
      name: 'Diário',
      order: 1,
      requiredRole: ['PROFESSOR'],
    },
  },
  {
    path: '/teacherjourney/attendance',
    name: 'TeacherAttendance',
    component: TeacherJourney,
    meta: {
      moduleName: 'TeacherJourney',
      moduleIcon: pencil,
      icon: calendar,
      name: 'Frequência',
      order: 2,
      requiredRole: ['PROFESSOR'],
    },
  },
  {
    path: '/teacherjourney/conceitual',
    name: 'TeacherConceitual',
    component: TeacherJourney,
    meta: {
      moduleName: 'TeacherJourney',
      moduleIcon: pencil,
      icon: text,
      name: 'Avaliação conceitual',
      order: 3,
      requiredRole: ['PROFESSOR'],
    },
  },
  {
    path: '/teacherjourney/parecer',
    name: 'TeacherParecer',
    component: TeacherJourney,
    meta: {
      moduleName: 'TeacherJourney',
      moduleIcon: pencil,
      icon: shapes,
      name: 'Parecer descritivo',
      order: 4,
      requiredRole: ['PROFESSOR'],
    },
  },
  {
    path: '/teacherjourney/performance',
    name: 'TeacherPerformance',
    component: TeacherJourney,
    meta: {
      moduleName: 'TeacherJourney',
      moduleIcon: pencil,
      icon: extensionPuzzle,
      name: 'Desempenho PCD',
      order: 5,
      requiredRole: ['PROFESSOR'],
    },
  },
  {
    path: '/teacherjourney/content',
    name: 'teacherContent',
    component: TeacherContent,
    meta: {
      moduleName: 'TeacherJourney',
      moduleIcon: pencil,
      icon: saveSharp,
      name: 'Registro de conteudo',
      order: 6,
      requiredRole: ['PROFESSOR'],
    },
  }
]

export default routes;
