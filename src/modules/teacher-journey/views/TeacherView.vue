<script setup lang="ts">
import ContentLayout from '@/components/theme/ContentLayout.vue'
import {
  IonCard,
  IonContent,
  IonHeader,
  IonIcon,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { arrowDownOutline, arrowUpOutline, businessOutline, menu, warningOutline } from 'ionicons/icons'
import { Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { computed, onMounted, ref, watch } from 'vue'
import EnrollmentService from '../services/EnrollmentService'
import GradeService from '../services/GradeService'
import ScheduleService from '../services/ScheduleService'
import StageService from '../services/StageService'

import 'swiper/css'
import 'swiper/css/pagination'

const modules = ref([Pagination])
const stageService = new StageService()
const scheduleService = new ScheduleService()
const enrollment = new EnrollmentService()
const gradeService = new GradeService()
const stages = ref([])
const schedules = ref([])
const teacherId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const institutionId = 'bd14f407-3758-4656-a299-e4cf3859dd29'

// Dados mockados
const alertasInformacoes = {
  escolas: 2,
  turmas: 8,
}
const classes = ref([])
const totalSchools = ref(0)
const totalClassrooms = ref(0)
const quadroHorarios = {
  dias: [
    { label: 'Seg', value: 'MONDAY' },
    { label: 'Ter', value: 'TUESDAY' },
    { label: 'Qua', value: 'WEDNESDAY' },
    { label: 'Qui', value: 'THURSDAY' },
    { label: 'Sex', value: 'FRIDAY' },
    { label: 'Sáb', value: 'SATURDAY' },
  ],

}

const necessidadesEspeciais = [
  {
    turma: '4º ANO B',
    tag: 'GCR',
    alunos: [
      { nome: 'Jane Salino Alves', tag: 'tag' },
      { nome: 'Maria Aquino Marinho', tag: 'tag' },
      { nome: 'Maria Maurinho Marinho', tag: 'tag' },
    ],
  },
  {
    turma: '4º ANO C',
    tag: 'GCR',
    alunos: [
      { nome: 'Jane Salino Alves', tag: 'tag' },
      { nome: 'Maria Aquino Marinho', tag: 'tag' },
      { nome: 'Maria Maurinho Marinho', tag: 'tag' },
    ],
  },
]

const alertaDesempenho = [
  {
    turma: '4º ANO C',
    professor: 'GCR',
    alunos: [
      { nome: 'Jane Salino Alves', tag: 'tag' },
      { nome: 'Maria Aquino Marinho', tag: 'tag' },
      { nome: 'Maria Maurinho Marinho', tag: 'tag' },
    ],
  },
]
const selectDay = ref('MONDAY')
const allClasses = ref([])
async function loadStages() {
  try {
    stages.value = await stageService.getCurrentStage(institutionId)
  }
  catch (error) {
    console.error('Erro ao carregar os estágios:', error)
  }
}

async function loadSchedule() {
  try {
    schedules.value = await scheduleService.getSchedule(teacherId)
    const classes = []
    schedules.value.forEach((stage) => {
      const existingClass = classes.find(cls => cls.id === stage.classroomId)
      if (!existingClass) {
        const newClass = {
          id: stage.classroomId,
          name: stage.classroom.name,
          school: stage.school.name,
          discipline: stage.discipline.name,
          disciplineId: stage.disciplineId,
        }
        classes.push(newClass)
      }
    })
    allClasses.value = classes
  }
  catch (error) {
    console.error('Erro ao carregar os estágios:', error)
  }
}
async function loadSchools() {
  try {
    totalSchools.value = await scheduleService.countSchools(teacherId)
  }
  catch (error) {
    console.error('Erro ao carregar as escolas:', error)
  }
}
async function loadClassrooms() {
  try {
    totalClassrooms.value = await scheduleService.countClassrooms(teacherId)
  }
  catch (error) {
    console.error('Erro ao carregar as séries:', error)
  }
}

const horarios = computed(() => {
  const filteredSchedule = schedules.value.filter((schedule) => {
    return schedule.weekday === selectDay.value
  })
  return filteredSchedule
})
const disabledStudents = computed(() => {
  return allClasses.value.map((classroom) => {
    const filteredStudents = classroom.students?.filter(currentStudent => currentStudent.student.disability?.length)
    return {
      ...classroom,
      students: filteredStudents,
    }
  })
})
const classrooms = ref([])
const students = ref()
async function getStudents() {
  try {
    classrooms.value = await scheduleService.listClassrooms(teacherId)
    classrooms.value.forEach(async (classroomId) => {
      enrollment.getClassroomStudents(classroomId).then((classroomStudents) => {
        allClasses.value.forEach((classroom) => {
          if (
            classroom.id === classroomStudents[0].classroomId
          )
            classroom.students = classroomStudents
        })
      })
    })
  }
  catch (error) {
    console.error('Erro ao carregar as séries:', error)
  }
}

async function getClassAndDisciplines() {
  const data = await scheduleService.getClassroomsAndDisciplines(teacherId)
  data.forEach(async (classe) => {
    gradeService.getGrades(classe.classroomId, classe.disciplineId, stages.value.currentId).then((classroomStudents) => {
      allClasses.value.forEach((classroom) => {
        if (
          classroom.disciplineId === classroomStudents[0].disciplineId
        ) {
          classroom.students.forEach((currentStudent) => {
            classroomStudents.forEach((classroomStudent) => {
              if (currentStudent.id === classroomStudent.enrollmentId)
                currentStudent.grade = classroomStudent.grade
              // console.log(currentStudent, classroomStudents)
            })
          })
        }
      })
    })
  })
  return data
}
function getCapitalizedInitials(input: string): string {
  const initials = input
    .match(/\b[A-Z][a-z]*\b/g)
    ?.map(word => word[0])
    .join('')
    .slice(0, 4) || ''

  return initials
}
const attentionStudents = computed(() => {
  return allClasses.value.map((classroom) => {
    const filteredStudents = classroom.students?.filter(student =>
      student?.grade || 0 < 6,
    )
    return {
      ...classroom,
      students: filteredStudents,
    }
  })
})
onMounted(async () => {
  loadSchedule()
  loadSchools()
  loadClassrooms()
  getStudents()
  await loadStages()
  getClassAndDisciplines()
})
function formatHour(horario: any) {
  const [HH, mm] = horario.split(':')
  return `${HH}:${mm}`
}
</script>

<template>
  <ContentLayout :no-padding="true" classes="bg-light">
    <div style="margin: 0;">
      <div class="section ion-padding">
        <div class="flex">
          <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M10.5 20.9166C16.2292 20.9166 20.9167 16.2291 20.9167 10.5C20.9167 4.77081 16.2292 0.083313 10.5 0.083313C4.77087 0.083313 0.083374 4.77081 0.083374 10.5C0.083374 16.2291 4.77087 20.9166 10.5 20.9166ZM9.45837 5.29165H11.5417V7.37498H9.45837V5.29165ZM12.5834 15.7083H8.41671V13.625H9.45837V11.5416H8.41671V9.45831H11.5417V13.625H12.5834V15.7083Z"
              fill="#4F2974" />
          </svg>
          <div class="text-primary text-lg">
            Alertas e Informações
          </div>
        </div>
        <div v-if="stages?.daysLeft <= 20" class="warning-close-date">
          <div class="title">
            Atenção ao fechamento de bimestre
          </div>
          <div class="text">
            <IonIcon :icon="warningOutline" size="large" />
            <div>
              Após o fechamento do bimestre ( em <b>{{ stages.daysLeft }} dias </b>) será
              necessário entrar em contato com a secretária para
              efetuar o preenchimento ou alterações no período encerrado
            </div>
          </div>
        </div>
        <div class="info-row">
          <div class="bg-lightprimary">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M14.25 6H11.25V4.5L7.875 3.15V1.5H9.75V0H7.125V3.15L3.75 4.5V6H0.75C0.3375 6 0 6.3375 0 6.75V15H6V11.25H9V15H15V6.75C15 6.3375 14.6625 6 14.25 6ZM4.5 13.5H1.5V11.25H4.5V13.5ZM4.5 9.75H1.5V7.5H4.5V9.75ZM7.5 4.5C7.9125 4.5 8.25 4.8375 8.25 5.25C8.25 5.6625 7.9125 6 7.5 6C7.0875 6 6.75 5.6625 6.75 5.25C6.75 4.8375 7.0875 4.5 7.5 4.5ZM9 9.75H6V7.5H9V9.75ZM13.5 13.5H10.5V11.25H13.5V13.5ZM13.5 9.75H10.5V7.5H13.5V9.75Z"
                fill="#71438D" />
            </svg> Escolas <strong>{{ totalSchools }}</strong>
          </div>
          <div class="bg-lighttertiary">
            <svg width="15" height="9" viewBox="0 0 15 9" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M7.5 0.125C6.91984 0.125 6.36344 0.355468 5.9532 0.765704C5.54297 1.17594 5.3125 1.73234 5.3125 2.3125C5.3125 2.89266 5.54297 3.44906 5.9532 3.8593C6.36344 4.26953 6.91984 4.5 7.5 4.5C8.08016 4.5 8.63656 4.26953 9.0468 3.8593C9.45703 3.44906 9.6875 2.89266 9.6875 2.3125C9.6875 1.73234 9.45703 1.17594 9.0468 0.765704C8.63656 0.355468 8.08016 0.125 7.5 0.125ZM7.5 1.375C7.74864 1.375 7.9871 1.47377 8.16291 1.64959C8.33873 1.8254 8.4375 2.06386 8.4375 2.3125C8.4375 2.56114 8.33873 2.7996 8.16291 2.97541C7.9871 3.15123 7.74864 3.25 7.5 3.25C7.25136 3.25 7.0129 3.15123 6.83709 2.97541C6.66127 2.7996 6.5625 2.56114 6.5625 2.3125C6.5625 2.06386 6.66127 1.8254 6.83709 1.64959C7.0129 1.47377 7.25136 1.375 7.5 1.375ZM3.4375 2C3.0231 2 2.62567 2.16462 2.33265 2.45765C2.03962 2.75067 1.875 3.1481 1.875 3.5625C1.875 4.15 2.20625 4.65625 2.68125 4.925C2.90625 5.05 3.1625 5.125 3.4375 5.125C3.7125 5.125 3.96875 5.05 4.19375 4.925C4.425 4.79375 4.61875 4.60625 4.7625 4.38125C4.30625 3.7875 4.0625 3.0625 4.0625 2.3125C4.0625 2.25625 4.0625 2.19375 4.0625 2.1375C3.875 2.05 3.6625 2 3.4375 2ZM11.5625 2C11.3375 2 11.125 2.05 10.9375 2.1375C10.9375 2.19375 10.9375 2.25625 10.9375 2.3125C10.9375 3.0625 10.6937 3.7875 10.2375 4.38125C10.3125 4.5 10.3938 4.59375 10.4875 4.6875C10.5875 4.78125 10.6875 4.8625 10.8063 4.925C11.0313 5.05 11.2875 5.125 11.5625 5.125C11.8375 5.125 12.0937 5.05 12.3187 4.925C12.7937 4.65625 13.125 4.15 13.125 3.5625C13.125 3.1481 12.9604 2.75067 12.6674 2.45765C12.3743 2.16462 11.9769 2 11.5625 2ZM7.5 5.75C6.0375 5.75 3.125 6.48125 3.125 7.9375V8.875H11.875V7.9375C11.875 6.48125 8.9625 5.75 7.5 5.75ZM2.94375 6.09375C1.7375 6.2375 0 6.85 0 7.9375V8.875H1.875V7.66875C1.875 7.0375 2.30625 6.5125 2.94375 6.09375ZM12.0563 6.09375C12.6938 6.5125 13.125 7.0375 13.125 7.66875V8.875H15V7.9375C15 6.85 13.2625 6.2375 12.0563 6.09375ZM7.5 7C8.45625 7 9.525 7.3125 10.1437 7.625H4.85625C5.475 7.3125 6.54375 7 7.5 7Z"
                fill="#D1559F" />
            </svg>
            Turmas: <strong>{{ totalClassrooms }}</strong>
          </div>
        </div>
      </div>
      <div class="section ion-padding">
        <div class="flex">
          <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M5.20833 22.9167C4.63542 22.9167 4.14497 22.7127 3.73698 22.3047C3.32899 21.8967 3.125 21.4063 3.125 20.8334V6.25004C3.125 5.67712 3.32899 5.18667 3.73698 4.77869C4.14497 4.3707 4.63542 4.16671 5.20833 4.16671H6.25V2.08337H8.33333V4.16671H16.6667V2.08337H18.75V4.16671H19.7917C20.3646 4.16671 20.855 4.3707 21.263 4.77869C21.671 5.18667 21.875 5.67712 21.875 6.25004V12.1615C21.5451 12.0052 21.2066 11.875 20.8594 11.7709C20.5122 11.6667 20.1562 11.5886 19.7917 11.5365V10.4167H5.20833V20.8334H11.7708C11.8924 21.2153 12.0356 21.5799 12.2005 21.9271C12.3655 22.2743 12.5608 22.6042 12.7865 22.9167H5.20833ZM18.75 23.9584C17.309 23.9584 16.0807 23.4506 15.0651 22.4349C14.0495 21.4193 13.5417 20.191 13.5417 18.75C13.5417 17.3091 14.0495 16.0808 15.0651 15.0651C16.0807 14.0495 17.309 13.5417 18.75 13.5417C20.191 13.5417 21.4193 14.0495 22.4349 15.0651C23.4505 16.0808 23.9583 17.3091 23.9583 18.75C23.9583 20.191 23.4505 21.4193 22.4349 22.4349C21.4193 23.4506 20.191 23.9584 18.75 23.9584ZM20.4948 21.224L21.224 20.4948L19.2708 18.5417V15.625H18.2292V18.9584L20.4948 21.224Z"
              fill="#4F2974" />
          </svg>
          <div class="text-primary text-lg">
            Quadro de Horários
          </div>
        </div>
        <div class="row bg">
          <div v-for="dia in quadroHorarios.dias" :key="dia.value" :class="{ active: dia.value === selectDay }"
            @click="selectDay = dia.value">
            {{ dia.label }}
          </div>
        </div>
        <div class="grid">
          <IonCard v-for="(horario, index) in horarios" :key="index" style="margin: 0px" class="ion-padding">
            <div class="grid-row borders">
              <svg width="23" height="23" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M17.5 14.1667H5.83337V2.50004H17.5M17.5 0.833374H5.83337C5.39135 0.833374 4.96742 1.00897 4.65486 1.32153C4.3423 1.63409 4.16671 2.05801 4.16671 2.50004V14.1667C4.16671 14.6087 4.3423 15.0327 4.65486 15.3452C4.96742 15.6578 5.39135 15.8334 5.83337 15.8334H17.5C17.9421 15.8334 18.366 15.6578 18.6786 15.3452C18.9911 15.0327 19.1667 14.6087 19.1667 14.1667V2.50004C19.1667 2.05801 18.9911 1.63409 18.6786 1.32153C18.366 1.00897 17.9421 0.833374 17.5 0.833374ZM11.6667 12.5H13.3334V4.16671H10V5.83337H11.6667M2.50004 4.16671H0.833374V17.5C0.833374 17.9421 1.00897 18.366 1.32153 18.6786C1.63409 18.9911 2.05801 19.1667 2.50004 19.1667H15.8334V17.5H2.50004V4.16671Z"
                  fill="#71438D" />
              </svg>
              <div>
                <div>{{ formatHour(horario.start) }}</div>
                <div>{{ formatHour(horario.end) }}</div>
              </div>
              <div class="classroom-cluster">
                <span class="classroom-badge">
                  {{ horario.classroom.name }}
                </span>
              </div>
            </div>
            <div class="text-primary text-lg grid-row">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M10 2.5L0.833374 7.5L10 12.5L17.5 8.40833V14.1667H19.1667V7.5M4.16671 10.9833V14.3167L10 17.5L15.8334 14.3167V10.9833L10 14.1667L4.16671 10.9833Z"
                  fill="#71438D" />
              </svg>
              {{ horario.school.name }}
            </div>
          </IonCard>
        </div>
      </div>
      <div class="section">
        <div class="flex" style="margin-bottom: 16px; margin-left: 16px;">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M19.3542 10.4583H17.7917V6.29163C17.7917 5.13538 16.8542 4.20829 15.7084 4.20829H11.5417V2.64579C11.5417 1.95512 11.2673 1.29274 10.779 0.804369C10.2906 0.315993 9.62821 0.041626 8.93754 0.041626C8.24687 0.041626 7.58449 0.315993 7.09612 0.804369C6.60774 1.29274 6.33337 1.95512 6.33337 2.64579V4.20829H2.16671C1.61417 4.20829 1.08427 4.42779 0.693568 4.81849C0.302867 5.20919 0.083374 5.73909 0.083374 6.29163V10.25H1.64587C3.20837 10.25 4.45837 11.5 4.45837 13.0625C4.45837 14.625 3.20837 15.875 1.64587 15.875H0.083374V19.8333C0.083374 20.3858 0.302867 20.9157 0.693568 21.3064C1.08427 21.6971 1.61417 21.9166 2.16671 21.9166H6.12504V20.3541C6.12504 18.7916 7.37504 17.5416 8.93754 17.5416C10.5 17.5416 11.75 18.7916 11.75 20.3541V21.9166H15.7084C16.2609 21.9166 16.7908 21.6971 17.1815 21.3064C17.5722 20.9157 17.7917 20.3858 17.7917 19.8333V15.6666H19.3542C20.0449 15.6666 20.7073 15.3923 21.1956 14.9039C21.684 14.4155 21.9584 13.7531 21.9584 13.0625C21.9584 12.3718 21.684 11.7094 21.1956 11.221C20.7073 10.7327 20.0449 10.4583 19.3542 10.4583Z"
              fill="#71438D" />
          </svg>
          <div class="text-primary text-lg">
            Necessidades Especiais
          </div>
        </div>
        <div class="bg-primary" style="padding: 16px 8px 2px 8px;">
          <Swiper style="padding-bottom: 30px;" :slides-per-view="1.1" :pagination="true" space-between="10"
            class="mySwiper swiper-white" :modules="modules">
            <SwiperSlide v-for="(classroom, index) in disabledStudents" :key="index">
              <div class="list-item">
                <div class="flex between">
                  <strong>{{ classroom.name }}</strong>
                  <div class="header-badge">
                    {{ getCapitalizedInitials(classroom.school) }}
                  </div>
                </div>
                <div v-for="(student, i) in classroom.students" :key="i" class="flex between">
                  <div>{{ student.name }}</div>
                  <div class="badge">
                    {{ student.student.disability }}
                  </div>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
      </div>
      <div class="section ion-padding">
        <div class="flex" style="margin-bottom: 16px;">
          <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M18 12.5737L10.225 6.49874C9.775 6.14874 9.271 6.01108 8.713 6.08574C8.15433 6.16108 7.70833 6.43208 7.375 6.89874L4.625 10.6987L1.25 8.02374C1.05 7.85708 0.841667 7.74041 0.625 7.67374C0.408333 7.60708 0.2 7.57374 0 7.57374V3.82374C0.0833333 3.82374 0.179333 3.83608 0.288 3.86074C0.396 3.88608 0.5 3.94041 0.6 4.02374L4 6.57374L8.375 0.423743C8.54167 0.190409 8.76667 0.0530759 9.05 0.0117426C9.33333 -0.0302574 9.59167 0.0404094 9.825 0.223743L14 3.57374H17C17.2833 3.57374 17.5207 3.66941 17.712 3.86074C17.904 4.05274 18 4.29041 18 4.57374V12.5737ZM1 16.5737C0.716667 16.5737 0.479333 16.4777 0.288 16.2857C0.0960001 16.0944 0 15.8571 0 15.5737V9.84874C0.116667 9.84874 0.225 9.86541 0.325 9.89874C0.425 9.93208 0.525 9.99041 0.625 10.0737L5 13.5737L8.4 8.89874C8.56667 8.66541 8.78733 8.52774 9.062 8.48574C9.33733 8.44441 9.59167 8.51541 9.825 8.69874L18 15.0987V15.5737C18 15.8571 17.904 16.0944 17.712 16.2857C17.5207 16.4777 17.2833 16.5737 17 16.5737H1Z"
              fill="#71438D" />
          </svg>
          <div class="text-primary text-lg">
            Alerta de Desempenho
          </div>
        </div>
        <!-- <div v-for="(alerta, index) in alertaDesempenho" :key="index" class="list-item">
          <div class="flex between">
            <strong>{{ alerta.turma }}</strong>
            <div class="header-badge">
              {{ alerta.professor }}
            </div>
          </div>
          <div v-for="(aluno, i) in alerta.alunos" :key="i" class="flex between">
            <div>{{ aluno.nome }}</div>
            <div class="badge">
              {{ aluno.tag }}
            </div>
          </div>
        </div> -->
        <div>
          <Swiper style="padding-bottom: 30px;" :slides-per-view="1.1" :pagination="true" space-between="10"
            class="mySwiper swiper-red" :modules="modules">
            <SwiperSlide v-for="(classroom, index) in attentionStudents" :key="index">
              <div class="list-item">
                <div class="flex between">
                  <strong>{{ classroom.name }}</strong>
                  <div class="header-badge">
                    {{ getCapitalizedInitials(classroom.school) }}
                  </div>
                </div>
                <div v-for="(student, i) in classroom.students" :key="i" class="flex text-orange between">
                  <div>{{ student.name }}</div>
                  <div>
                    --
                  </div>
                  <svg width="24" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M4 5L2 3.04L2 8.66667H4M7.33333 6.22667L6.28667 7.12L5.33333 6.24L5.33333 11.3333H7.33333M10.6667 7.33333L8.66667 5.33333V14L10.6667 14M12.54 7.46L11.3333 8.66667L14.6667 8.66667L14.6667 5.33333L13.4733 6.52667L8.66667 1.76L6.35333 3.77333L3.83333 1.33333H2L6.31333 5.56L8.66667 3.57333"
                      fill="#ED6466" />
                  </svg>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
      </div>
    </div>
  </ContentLayout>
</template>

<style scoped lang="scss">
.section {
  margin-bottom: 24px;
}

/* Alertas e Informações Section */
.info-row {
  margin-top: 16px;
  display: flex;
  gap: 16px;
  font-size: 16px;
  color: #555;
}

.info-row div {
  flex: 1;

}

.text-orange {
  align-items: center;

  div {
    color: #ED6466 !important
  }
}

.warning-close-date {
  margin-top: 16px;
  background-color: #F5C228E5;
  color: #222;
  padding: 15px;
  border-radius: 8px;

  .title {
    font-size: 18px;
    font-weight: 600;
    padding-left: 38px;
    margin-bottom: 16px;
  }

  .text {
    ion-icon {
      width: 80px;
      margin-right: 14px;
    }

    font-weight: 300;
    display: flex;
    align-items: start;
    font-size: 16px;
  }
}

.row {
  margin-top: 16px;
  display: flex;
  align-items: center;
  background-color: var(--ion-color-tertiary);
  border-radius: 6px;
}

/* Quadro de Horários Section */
.grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.grid-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.grid-row div {
  font-size: 14px;
  flex: 1
}

.row.bg div {
  background-color: hwb(314 86% 4%);
  flex: 1;
  color: var(--ion-color-primary);
  text-align: center;
  padding: 12px 10px;
  font-size: 16px
}

.row.bg div.active {
  background-color: #71438D;
  color: #fff;
}

/* Necessidades Especiais and Alerta de Desempenho Sections */
.list {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 12px;
}

.text-lg {
  font-size: 18px;
}

.list-item {
  background-color: #f9f9f9;
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  text-align: left;
  border: 1px solid #e0e0e0;
}

.bg-primary {
  background-color: #71438D;
  color: #fff;

}

.bg-tertiary {
  background-color: var(--ion-color-tertiary);
  color: #fff;
}

.classroom-cluster {
  margin-left: auto;
  text-align: right;
}

.classroom-badge {

  color: #D1559F;
  background: #D1559F26;
  border-radius: 20px;
  padding: 8px 15px;
  text-transform: uppercase;
}

.borders {
  border-bottom: 1px solid #4F297466;
  border-top: 1px solid #4F297466;
  padding: 6px 0px;
  margin-bottom: 8px;

  div {
    font-size: 16px;
  }
}

.bg-lightprimary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px 0px;
  font-size: 16px;
  background-color: #EAE3EE;
  border-radius: 6px;
}

.bg-lighttertiary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px 0px;
  font-size: 16px;
  background-color: hwb(314 86% 4%);
  border-radius: 6px;
}

.between {
  justify-content: space-between;
}

.badge {
  background-color: hwb(314 86% 4%);
  color: var(--ion-color-tertiary) !important;
  padding: 4px 8px;
  border-radius: 16px;
  padding: 4px 12px;
}

.list-item strong {
  display: block;
  font-size: 16px;
  margin-bottom: 8px;
  color: #222;
}

.header-badge {
  background-color: var(--ion-color-tertiary);
  color: white !important;
  padding: 4px 8px;
  border-radius: 16px;
  padding: 4px 12px;
}

.list-item div {
  font-size: 14px;
  color: #444;
  margin-bottom: 4px;
}

.flex {
  display: flex;
  gap: 8px;
}

.text-primary {
  color: var(--ion-color-primary);
}
</style>

<style lang="scss">
.swiper-white {
  .swiper-pagination-bullet {
    background: white !important;
  }

}

.swiper-red {
  .swiper-pagination-bullet {
    background-color: #FAD3E4;
  }

  .swiper-pagination-bullet-active {
    background-color: #D1559F;
  }
}

.swiper-pagination-bullet {
  opacity: 1;
  transition: all 0.2s;
}

.swiper-pagination-bullet-active {
  width: 12px !important;
  height: 12px !important;
}

.swiper-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
