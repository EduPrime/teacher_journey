import { flame, flameOutline } from 'ionicons/icons';
import TeacherJourney from './views/TeacherJourney.vue';

const routes = [
  {
    path: '/teacher-journey',
    name: 'Teacher Journey',
    component: TeacherJourney,
    meta: {
      moduleName: 'Teacher Journey',
      moduleIcon: flameOutline,
      icon: flame,
      name: 'Teacher Journey',
      order: 4,
      requiredRole: ['public', 'admin'],
    },
  },
];

export default routes;
