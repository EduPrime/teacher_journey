import type { CustomRouteRecordRaw } from '@/router/RouterType'
import { calculator, calendar, clipboard, clipboardSharp, create, extensionPuzzle, folderOutline, home, idCard, pencil, ribbon, saveSharp, shapes, star, text, trendingUp } from 'ionicons/icons'
import TeacherConceptualEvaluation from './views/TeacherConceptualEvaluation.vue'
import TeacherContent from './views/TeacherContent.vue'
import TeacherDescriptiveSight from './views/TeacherDescriptiveSight.vue'
import TeacherFrequency from './views/TeacherFequency.vue'
import TeacherJourney from './views/TeacherJourney.vue'
import TeacherNumericEvaluation from './views/TeacherNumericEvaluation.vue'
import TeacherView from './views/TeacherView.vue'

const courseName = localStorage.getItem('courseName')

const maternal = ['Parecer descritivo', 'Relatório parecer descritivo']
const fundamental = ['Avaliação conceitual', 'Parecer descritivo', 'Relatório de avaliação conceitual', 'Boletim conceitual']
const fundamentalII = ['Avaliação numérica', 'Relatório de avaliação numérica', 'Boletim numérico']

const fixedRoutes: Array<CustomRouteRecordRaw> = [
  {
    path: '',
    redirect: '/home',
    meta: {
      requiredRole: ['PROFESSOR'],
    },
  },
  {
    path: '/home',
    name: 'TeacherJourney',
    component: TeacherView,
    meta: {
      requiredRole: ['PROFESSOR'],
    },
  },
  {
    path: '/teacherjourney/frequency',
    name: 'teacherFrequency',
    component: TeacherFrequency,
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
      icon: idCard,
      name: 'Registro de conteúdo',
      order: 6,
      requiredRole: ['PROFESSOR'],
    },
  },
  {
    path: '/teacher-report/attendance',
    name: 'TeacherAttendanceReport',
    component: TeacherJourney,
    meta: {
      moduleName: 'TeacherReport',
      moduleIcon: folderOutline,
      icon: calendar,
      name: 'Relatório de frequência',
      order: 3,
      requiredRole: ['PROFESSOR'],
    },
  },
  {
    path: '/teacher-report/performance/pwd',
    name: 'TeacherPwDPerformanceReport',
    component: TeacherJourney,
    meta: {
      moduleName: 'TeacherReport',
      moduleIcon: folderOutline,
      icon: extensionPuzzle,
      name: 'Relatório de desempenho PCD',
      order: 9,
      requiredRole: ['PROFESSOR'],
    },
  },
  {
    path: '/teacher-report/content-record',
    name: 'TeacherContentRecordReport',
    component: TeacherJourney,
    meta: {
      moduleName: 'TeacherReport',
      moduleIcon: folderOutline,
      icon: idCard,
      name: 'Relatorio de registro de conteúdo',
      order: 10,
      requiredRole: ['PROFESSOR'],
    },
  },
  {
    path: '/teacher-report/final-evaluation',
    name: 'TeacherFinalEvaluationReport',
    component: TeacherJourney,
    meta: {
      moduleName: 'TeacherReport',
      moduleIcon: folderOutline,
      icon: trendingUp,
      name: 'Resultado final',
      order: 11,
      requiredRole: ['PROFESSOR'],
    },
  },
]
const dynamicRoutes: Array<CustomRouteRecordRaw> = [
  {
    path: '/teacherjourney/numeric',
    name: 'TeacherNumeric',
    component: TeacherNumericEvaluation,
    meta: {
      moduleName: 'TeacherJourney',
      moduleIcon: pencil,
      icon: calculator,
      name: 'Avaliação numérica',
      order: 3,
      requiredRole: ['PROFESSOR'],
    },
  },
  {
    path: '/teacherjourney/conceitual',
    name: 'TeacherConceitual',
    component: TeacherConceptualEvaluation,
    meta: {
      moduleName: 'TeacherJourney',
      moduleIcon: pencil,
      // icon: star,
      icon: text,
      name: 'Avaliação conceitual',
      order: 3,
      requiredRole: ['PROFESSOR'],
    },
  },

  {
    path: '/teacherjourney/parecer',
    name: 'TeacherParecer',
    component: TeacherDescriptiveSight,
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
    path: '/teacher-report/assessment/numerical',
    name: 'TeacherNumericalAssessment',
    component: TeacherJourney,
    meta: {
      moduleName: 'TeacherReport',
      moduleIcon: folderOutline,
      icon: clipboardSharp,
      name: 'Relatório de avaliação numérica',
      order: 4,
      requiredRole: ['PROFESSOR'],
    },
  },
  {
    path: '/teacher-report/assessment/conceptual',
    name: 'TeacherConceptualAssessment',
    component: TeacherJourney,
    meta: {
      moduleName: 'TeacherReport',
      moduleIcon: folderOutline,
      icon: star,
      name: 'Relatório de avaliação conceitual',
      order: 5,
      requiredRole: ['PROFESSOR'],
    },
  },
  {
    path: '/teacher-report/assessment/descriptive',
    name: 'TeacherDescriptiveAssessment',
    component: TeacherJourney,
    meta: {
      moduleName: 'TeacherReport',
      moduleIcon: folderOutline,
      icon: shapes,
      name: 'Relatório parecer descritivo',
      order: 6,
      requiredRole: ['PROFESSOR'],
    },
  },
  {
    path: '/teacher-report/card/numeric',
    name: 'TeacherNumericReportCard',
    component: TeacherJourney,
    meta: {
      moduleName: 'TeacherReport',
      moduleIcon: folderOutline,
      icon: text,
      name: 'Boletim numérico',
      order: 7,
      requiredRole: ['PROFESSOR'],
    },
  },
  {
    path: '/teacher-report/card/conceptual',
    name: 'TeacherConceptualReportCard',
    component: TeacherJourney,
    meta: {
      moduleName: 'TeacherReport',
      moduleIcon: folderOutline,
      icon: ribbon,
      name: 'Boletim conceitual',
      order: 8,
      requiredRole: ['PROFESSOR'],
    },
  },

]

let filteredroutes: Array<CustomRouteRecordRaw> = [...dynamicRoutes]

switch (courseName) {
  case 'Educação Infantil':
    filteredroutes = dynamicRoutes.filter(route => maternal.includes(route.meta.name))
    break
  case 'Ensino Fundamental I':
    filteredroutes = dynamicRoutes.filter(route => fundamental.includes(route.meta.name))
    break
  case 'Ensino Fundamental II':
    filteredroutes = dynamicRoutes.filter(route => fundamentalII.includes(route.meta.name))
    break
}

const routes = [...fixedRoutes, ...filteredroutes]

export default routes
