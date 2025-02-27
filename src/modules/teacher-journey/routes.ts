import { home, text, pencil, calendar, saveSharp, extensionPuzzle, shapes, create, folderOutline, clipboard, trendingUp, idCard, clipboardSharp } from 'ionicons/icons';
import { CustomRouteRecordRaw } from '@/router/RouterType';
import TeacherJourney from './views/TeacherJourney.vue';
import TeacherContent from './views/TeacherContent.vue';
import TeacherView from './views/TeacherView.vue';

import { ScheduleService } from '@/services/ScheduleService'

const routes: Array<CustomRouteRecordRaw> = [
  {
    path: '',
    redirect: '/home',
    meta: {
      requiredRole: ['PROFESSOR']
    }
  },
  {
    path: '/home',
    name: 'TeacherJourney',
    component: TeacherView,
    meta: {
      moduleName: 'TeacherJourney',
      moduleIcon: home,
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
  },
  // Relatorios
  {
    path: '/teacher-report',
    name: 'TeacherReport',
    component: TeacherJourney,
    meta: {
      moduleName: 'TeacherReport',
      moduleIcon: folderOutline,
      icon: folderOutline,
      name: 'Relatórios',
      order: 2,
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
      icon: clipboard,
      name: 'Relatório de frequência',
      order: 3,
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
      icon: clipboardSharp,
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
      icon: clipboard,
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
      icon: text,
      name: 'Boletim conceitual',
      order: 8,
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
      icon: clipboard,
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

export default routes;
