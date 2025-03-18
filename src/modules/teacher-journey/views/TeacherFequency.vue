<script setup lang="ts">
import type { FrequencyToSave } from '../types/types'
import EduFilterProfile from '@/components/FilterProfile.vue'
import ContentLayout from '@/components/theme/ContentLayout.vue'
import EduCalendar from '@/components/WeekDayPicker.vue'
import showToast from '@/utils/toast-alert'
import { IonAccordion, IonAccordionGroup, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCol, IonGrid, IonIcon, IonItem, IonLabel, IonRadio, IonRadioGroup, IonRow, IonSelect, IonSelectOption, IonText, IonToolbar } from '@ionic/vue'
import { calendarOutline, checkmarkCircleOutline, layers } from 'ionicons/icons'

import { onMounted, ref, watch } from 'vue'

import FrequencyMultiSelect from '../components/frequency/MultiSelect.vue'
import AttendanceService from '../services/AttendanceService'
import EnrollmentService from '../services/EnrollmentService'
import JustificationService from '../services/JustificationService'
import ScheduleService from '../services/ScheduleService'
import StageService from '../services/StageService'

const scheduleService = new ScheduleService()
const enrollmentService = new EnrollmentService()
const attendanceService = new AttendanceService()
const justificationService = new JustificationService()
const stageService = new StageService()

const eduFProfile = ref()

const schedules = ref(0)
const stage = ref()
const students = ref()

const frequencyToSave = ref<FrequencyToSave[]>()
const cancelModal = ref(false)

const checkboxModal = ref({ modal: false, quantifiedPresence: undefined as any })
const selectedStudent = ref()

// const justification = ref([{ name: 'Gravidez', id: 1 }, { name: 'Atestado médico', id: 2 }, { name: 'Transporte escolar ausente', id: 2 }])
const justifyOptions = ref()
const cleanChecks = ref(false)
const isContentSaved = ref({ card: false, saved: undefined as any })

const selectedDayInfo = ref()

watch(selectedDayInfo, async (newValue) => {
  if (newValue.selectedDate && eduFProfile.value) {
    justifyOptions.value = await justificationService.getJustifications()
    stage.value = await stageService.getCurrentStageWeekday(selectedDayInfo.value.selectedDate)

    // @TODO: função para carregar a listagem de alunos
    students.value = await enrollmentService.getClassroomStudents(eduFProfile.value.classroomId)
    isContentSaved.value.card = false
    frequencyToSave.value = students.value.map((i: any) => {
      return {
        name: i.name,
        enrollmentId: i.id,
        classroomId: eduFProfile.value?.classroomId,
        disciplineId: eduFProfile.value?.disciplineId,
        studentId: i.studentId,
        schoolId: i.schoolId,
        stageId: stage.value?.stageId,
        status: i.status,
        situation: i.situation,
        disability: i.student.disability,
        teacherId: eduFProfile.value?.teacherId,
        date: selectedDayInfo.value?.selectedDate,
        presence: true,
        justificationId: undefined as string | undefined,
        frequencies: [],
      } as FrequencyToSave
    })
  }
  else {
    // @TODO: metodo para limpar a listagem
    students.value = undefined
    frequencyToSave.value = undefined
  }
})

watch(eduFProfile, async (newValue) => {
  if (newValue.teacherId) {
    // schedules.value = await scheduleService.getSchedules(newValue.teacherId)
  }
  if (newValue.classroomId && selectedDayInfo.value?.selectedDate) {
    // @TODO: Função para carregar a listagem dos alunos
    students.value = await enrollmentService.getClassroomStudents(newValue.classroomId)

    frequencyToSave.value = students.value.map((i: any) => {
      return {
        name: i.name,
        enrollmentId: i.id,
        classroomId: eduFProfile.value?.classroomId,
        disciplineId: eduFProfile.value?.disciplineId,
        studentId: i.studentId,
        schoolId: i.schoolId,
        stageId: stage.value?.stageId,
        status: i.status,
        situation: i.situation,
        disability: i.student.disability,
        teacherId: eduFProfile.value?.teacherId,
        date: selectedDayInfo.value?.selectedDate,
        presence: true,
        justificationId: undefined as string | undefined,
        frequencies: [],
      } as FrequencyToSave
    })
  }
  else {
    // @TODO: metodo para limpar a listagem
    students.value = undefined
    frequencyToSave.value = undefined
  }
})

// Watcher para atualizar schedules quando eduFProfile ou selectedDayInfo mudarem
watch([eduFProfile, selectedDayInfo], async ([newEduFProfile, newSelectedDayInfo]) => {
  if (newEduFProfile?.teacherId && newSelectedDayInfo?.selectedDate) {
    const fullWeekday = getFullWeekday(newSelectedDayInfo.weekday)
    const scheduleResult = await scheduleService.getScheduleTeacherDay(newEduFProfile.teacherId, fullWeekday, newEduFProfile.classroomId, newEduFProfile.disciplineId)
    schedules.value = scheduleResult !== undefined ? scheduleResult : 0
  }
})

watch(selectedStudent, () => {
  // frequencyToSave.value.quantifiedPresence = undefined
  checkboxModal.value.quantifiedPresence = undefined
  cleanChecks.value = true
})

watch(checkboxModal, (newValue) => {
  if (newValue.quantifiedPresence && frequencyToSave.value) {
    frequencyToSave.value = frequencyToSave.value.map((i: any) => {
      if (i.studentId === selectedStudent.value) {
        return { ...i, frequencies: checkboxModal.value.quantifiedPresence }
      }
      else {
        return i
      }
    })
  }
})

function getFullWeekday(abbreviatedWeekday: string): string {
  switch (abbreviatedWeekday) {
    case 'MON':
      return 'MONDAY'
    case 'TUE':
      return 'TUESDAY'
    case 'WED':
      return 'WEDNESDAY'
    case 'THU':
      return 'THURSDAY'
    case 'FRI':
      return 'FRIDAY'
    case 'SAT':
      return 'SATURDAY'
    case 'SUN':
      return 'SUNDAY'
    default:
      return abbreviatedWeekday
  }
}

async function saveFrequency() {
  if (frequencyToSave.value && frequencyToSave.value.length > 0) {
    try {
      const createdRecords = await attendanceService.createAttendance(frequencyToSave.value)
      if (createdRecords.length > 0) {
        showToast('Frequência salva com sucesso', 'top', 'success')
        // Exibir mensagem de sucesso
      }
      else {
        showToast('Nenhuma nova frequência foi criada', 'top', 'warning')
        // Exibir mensagem de que nenhuma nova frequência foi criada
      }
    }
    catch (error) {
      showToast('Erro ao salvar frequência', 'top', 'warning')
      console.error('Erro ao salvar frequência', error)
      // Exibir mensagem de erro
    }
  }
  else {
    console.error('Nenhuma frequência para salvar')
    // Exibir mensagem de que não há frequência para salvar
  }
}

// Benhur até agora vejo que devemos mandar neste formato
onMounted(async () => {
  // const data = attendanceService.createAttendance(
  //   [{
  //     date: new Date('2025-03-17'),
  //     presence: false,
  //     teacherId: '45973489-ab5c-4d36-b5c0-842dff919a65', // Yohan Professor
  //     studentId: '03f22c85-729a-4916-a500-992616003bc1', // João da Silva
  //     classroomId: '0c086508-d50b-49b6-afce-0c146643129d', // 1º Ano A
  //     enrollmentId: 'fc10830c-bd72-41fe-b1ab-c23aa6c67731', // João da Silva
  //     justificationId: '1e222b35-25da-430e-8bbf-03218baccbd7', // Doença
  //     stageId: '149665ec-a230-439e-aeb2-4cb7bfc8ebb4', // etapa 1
  //     schoolId: 'd488e90e-327b-4ca7-ad45-888c65d2a3ab', // Escola Municipal de Araripina
  //     frequencies: [
  //       {
  //         name: '1º aula',
  //         absence: true,
  //       },
  //       {
  //         name: '2º aula',
  //         absence: true,
  //       },
  //       {
  //         name: '3º aula',
  //         absence: true,
  //       },
  //     ],
  //   }],
  // )
//   const teacherAttendance: TeacherFrequency = {
//     date: new Date('2025-03-18'),
//     totalClasses: 5,
//     type: 'DISCIPLINA',
//     teacherId: '45973489-ab5c-4d36-b5c0-842dff919a65', // Yohan Professor
//     classroomId: '29cf9857-0fe4-45f4-8b00-fc10e626eba8', // 7º Ano A
//     disciplineId: 'c030869a-3b07-4f7d-b11d-69765af91f9a', // Geometria
//     stageId: '149665ec-a230-439e-aeb2-4cb7bfc8ebb4', // etapa 1
//     schoolId: 'd488e90e-327b-4ca7-ad45-888c65d2a3ab', // Escola Municipal de Araripina
//   }
//   await attendanceService.createTeacherAttendance(teacherAttendance)

  // })
  //   const teacherAttendance: TeacherFrequency = {
  //     date: new Date('2025-03-17'),
  //     totalClasses: 5,
  //     type: 'DIARIA',
  //     teacherId: '45973489-ab5c-4d36-b5c0-842dff919a65', // Yohan Professor
  //     classroomId: '12ab8210-e080-491b-8f6c-45e240a8990e', // 1º Ano B
  //     disciplineId: '6862a800-92c3-4d46-8740-62a02a5e5cf9', // Língua Portuguesa
  //     stageId: '149665ec-a230-439e-aeb2-4cb7bfc8ebb4', // etapa 1
  //     schoolId: 'd488e90e-327b-4ca7-ad45-888c65d2a3ab', // Escola Municipal de Araripina
  //   }
  //   await attendanceService.createTeacherAttendance(teacherAttendance)

  const data = attendanceService.listTeacherAttendance(
    '45973489-ab5c-4d36-b5c0-842dff919a65', // Yohan Professor
    '2025-03-17',
    '29cf9857-0fe4-45f4-8b00-fc10e626eba8', // 7º Ano A
    'DISCIPLINA',
    'c030869a-3b07-4f7d-b11d-69765af91f9a', // Geometria
  )
  data.then((result) => {
    console.log('VUE listTeacherAttendance', result)
  }).catch((error) => {
    console.error('Error fetching teacher attendance', error)
  })
})
</script>

<template>
  <ContentLayout>
    <EduFilterProfile :discipline="false" @update:filtered-ocupation="($event) => eduFProfile = $event" />
    <h3>
      <IonText color="secondary" class="ion-content ion-padding-bottom" style="display: flex; align-items: center;">
        <IonIcon color="secondary" style="margin-right: 1%;" aria-hidden="true" :icon="calendarOutline" />
        Frequência diária
      </IonText>
    </h3>
    <EduCalendar v-model="selectedDayInfo" :teacher-id="eduFProfile?.teacherId" :current-classroom="eduFProfile?.classroomId" :current-discipline="eduFProfile?.disciplineId" />

    <IonCard v-if="false" color="success">
      <IonCardContent>
        <IonText style="display: flex;">
          <IonIcon size="small" style="margin-top: auto; margin-bottom: auto;" :icon="checkmarkCircleOutline" />
          <span style="margin-top: auto; margin-bottom: auto; margin-left: 5px;">
            Frequência do dia já foi registrada
          </span>
        </IonText>
      </IonCardContent>
    </IonCard>
    <FrequencyMultiSelect v-if="eduFProfile?.frequency === 'disciplina'" v-model="checkboxModal" :checkbox-modal="checkboxModal?.modal" :clean-checks="cleanChecks" :num-classes="schedules" @update:clean="($event) => cleanChecks = $event" />

    <pre>
    dados a serem enviados
    frequencyToSave: {{ frequencyToSave?.slice(0, 1) }}

    </pre>

    <IonAccordionGroup v-if="selectedDayInfo?.selectedDate && Array.isArray(frequencyToSave) && frequencyToSave.length > 0" class="ion-content" expand="inset">
      <IonAccordion v-for="(s, i) in frequencyToSave" :key="i" :value="`${i}`" class="no-border-accordion">
        <IonItem slot="header">
          <IonLabel>
            <IonText color="secondary">
              {{ s.name }}
            </IonText>
          </IonLabel>
        </IonItem>
        <div slot="content" class="ion-padding">
          <IonRow>
            <IonRadioGroup v-model="s.presence" style="color: var(--ion-color-secondary); margin-top: auto; margin-bottom: auto;">
              <IonRadio label-placement="end" color="secondary" style="padding-right: 16px; scale: 0.9;" :value="true">
                Presente
              </IonRadio>
              <IonRadio label-placement="end" color="secondary" style="scale: 0.9;" :value="false">
                Ausente
              </IonRadio>
            </IonRadioGroup>
            <IonButton v-if="eduFProfile.frequency === 'disciplina' && !s.presence" size="small" style="margin-top: auto; margin-bottom: auto; margin-left: auto;" shape="round" @click="() => { selectedStudent = s.studentId; checkboxModal.modal = true }">
              <IonIcon slot="icon-only" :icon="layers" />
            </IonButton>

            <IonSelect v-if="!s.presence" v-model="s.justificationId" class="custom-floating-label ion-margin-vertical" label-placement="floating" justify="space-between" label="Justificativa de falta" fill="outline">
              <!-- @TODO: As justificativas disponiveis ainda estão estáticas, é necessário consultar e receber estas informações de forma dinâmica -->
              <IonSelectOption v-for="(j, index) in justifyOptions" :key="index" :value="j.id">
                {{ j.name }}
              </IonSelectOption>
            </IonSelect>
          </IonRow>
        </div>
      </IonAccordion>
    </IonAccordionGroup>
    <IonCard v-else-if="Array.isArray(frequencyToSave) && frequencyToSave.length === 0" color="warning">
      <IonCardHeader>
        <IonCardTitle>Alunos não encontrados</IonCardTitle>
      </IonCardHeader>

      <IonCardContent>
        <IonText>
          Nenhum aluno encontrado. Por favor entre em contato com a secretaria de sua escola para verificar se sua turma foi cadastrada corretamente.
        </IonText>
      </IonCardContent>
    </IonCard>
    <IonCard v-else color="info">
      <IonCardHeader>
        <IonCardTitle>Selecione a turma e dia</IonCardTitle>
      </IonCardHeader>

      <IonCardContent>
        <IonText>
          Olá, por favor selecione qual a <b>turma</b> e em qual <b>dia</b> você dejesa fazer o lançamento de frequência
        </IonText>
      </IonCardContent>
    </IonCard>

    <ion-modal id="cancel-modal" :is-open="cancelModal" trigger="open-cancel-dialog" class="ion-content" @ion-modal-did-dismiss="cancelModal = false">
      <div class="wrapper">
        <h1>Cancelar registro</h1>

        <ion-list lines="none">
          <IonItem :button="true" :detail="false" @click="dismiss()">
            <IonLabel>Atenção ao confirmar todas as informações não salvas serão <b>excluidas</b> permanentemente. Deseja continuar?</IonLabel>
          </IonItem>
        </ion-list>
        <div v-if="true">
          <div class="ion-margin" style="display: flex; justify-content: right;">
            <!-- @TODO: construir função para ao clicar em salvar inserir uma copia do registro de conteúdo atual para a turma selecionada -->
            <IonButton
              color="secondary"
              style="text-transform: capitalize;" @click="cancelModal = false"
            >
              Confirmar
            </IonButton>
            <IonButton color="tertiary" size="small" style="text-transform: capitalize; margin-left: 10px;" @click="cancelModal = false">
              Cancelar
            </IonButton>
          </div>
        </div>
      </div>
    </ion-modal>
    <template #footer>
      <IonToolbar>
        <IonGrid>
          <IonRow>
            <IonCol size="6">
              <IonButton :disabled="false" color="danger" expand="full" @click="cancelModal = !cancelModal">
                Cancelar
              </IonButton>
            </IonCol>
            <IonCol size="6">
              <IonButton :disabled="false" color="secondary" expand="full" @click="saveFrequency">
                Salvar
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonToolbar>
    </template>
  </ContentLayout>
</template>

<style scoped>
ion-content {
  --padding-start: 10px;
  --padding-end: 10px;
}
.ion-content {
  padding-left: 10px;
  padding-right: 10px;
}
ion-accordion-group {
  margin-inline: 0 !important;
  margin-top: 16px;
}

.no-border-accordion::part(content) {
  border: none;
}

.no-border-accordion::part(header) {
  border: none;
}

ion-modal#cancel-modal {
    --width: 400px;
    --min-width: 400px;
    --min-width: 250px;
    --height: fit-content;
    --border-radius: 6px;
    --box-shadow: 0 28px 48px rgba(0, 0, 0, 0.4);
  }

  ion-modal#cancel-modal h1 {
    margin: 20px 20px 10px 20px;
  }

  ion-modal#cancel-modal .wrapper {
    margin-bottom: 10px;
  }
</style>
