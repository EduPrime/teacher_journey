<script setup lang="ts">
import type { FrequencyToSave } from '../types/types'
import EduFilterProfile from '@/components/FilterProfile.vue'
import ContentLayout from '@/components/theme/ContentLayout.vue'
import EduCalendar from '@/components/WeekDayPicker.vue'
import { IonAccordion, IonAccordionGroup, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCol, IonGrid, IonIcon, IonItem, IonLabel, IonRadio, IonRadioGroup, IonRow, IonSelect, IonSelectOption, IonText, IonToolbar } from '@ionic/vue'
import { calendarOutline, checkmarkCircleOutline, layers } from 'ionicons/icons'

import { onMounted, ref, watch } from 'vue'

import FrequencyMultiSelect from '../components/frequency/MultiSelect.vue'
import AttendanceService from '../services/AttendanceService'
import EnrollmentService from '../services/EnrollmentService'
import JustificationService from '../services/JustificationService'

import ScheduleService from '../services/ScheduleService'

const scheduleService = new ScheduleService()
const enrollmentService = new EnrollmentService()
const attendanceService = new AttendanceService()
const justificationService = new JustificationService()

const eduFProfile = ref()

const schedules = ref()

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

    // @TODO: função para carregar a listagem de alunos
    students.value = await enrollmentService.getClassroomStudents(eduFProfile.value.classroomId)
    isContentSaved.value.card = false
    frequencyToSave.value = students.value.map((i: any) => {
      return {
        name: i.name,
        classroomId: eduFProfile.value?.classroomId,
        studentId: i.id,
        status: i.status,
        situation: i.situation,
        enrollmentCode: i.enrollmentCode,
        disability: i.student.disability,
        date: selectedDayInfo.value?.selectedDate,
        presence: true,
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
    schedules.value = await scheduleService.getSchedules(newValue.teacherId)
  }
  if (newValue.classroomId && selectedDayInfo.value?.selectedDate) {
    // @TODO: Função para carregar a listagem dos alunos
    students.value = await enrollmentService.getClassroomStudents(newValue.classroomId)
    frequencyToSave.value = students.value.map((i: any) => {
      return {
        name: i.name,
        classroomId: eduFProfile.value?.classroomId,
        studentId: i.id,
        status: i.status,
        situation: i.situation,
        enrollmentCode: i.enrollmentCode,
        disability: i.student.disability,
        date: selectedDayInfo.value?.selectedDate,
        presence: true,
        justification: undefined as string | undefined,
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
    schedules.value = await scheduleService.getScheduleTeacherDay(newEduFProfile.teacherId, newSelectedDayInfo.selectedDate, newEduFProfile.classroomId, newEduFProfile.disciplineId)

    console.log('schedules', schedules.value)
  }
})

watch(selectedStudent, () => {
  frequencyToSave.value.quantifiedPresence = undefined
  checkboxModal.value.quantifiedPresence = undefined
  cleanChecks.value = true
})

watch(checkboxModal, (newValue) => {
  if (newValue.quantifiedPresence) {
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

// async function saveFrequency() {
//   return void 0
// }

// Benhur até agora vejo que devemos mandar neste formato
onMounted(async () => {
  const data = attendanceService.createAttendance(
    [{
      id: 'some-id',
      date: new Date('2025-03-17'),
      presence: false,
      studentId: '03f22c85-729a-4916-a500-992616003bc1', // João da Silva
      classroomId: '0c086508-d50b-49b6-afce-0c146643129d', // 1º Ano A
      enrollmentId: 'fc10830c-bd72-41fe-b1ab-c23aa6c67731', // João da Silva
      justificationId: '1e222b35-25da-430e-8bbf-03218baccbd7', // Doença
      stageId: '149665ec-a230-439e-aeb2-4cb7bfc8ebb4', // etapa 1
      schoolId: 'd488e90e-327b-4ca7-ad45-888c65d2a3ab', // Escola Municipal de Araripina
      frequencies: [
        {
          name: '1º aula',
          absence: true,
        },
        {
          name: '2º aula',
          absence: true,
        },
        {
          name: '3º aula',
          absence: true,
        },
      ],
    }],
  )
  console.log('onMounted insert Attendance ', data)
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
    <EduCalendar v-model="selectedDayInfo" :teacher-id="eduFProfile?.teacherId" />

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

    <!-- <pre> -->
    <!-- dados a serem enviados -->
    <!-- frequencyToSave: {{ frequencyToSave?.slice(0, 2) }}
    </pre> -->

    <FrequencyMultiSelect v-model="checkboxModal" :checkbox-modal="checkboxModal?.modal" :clean-checks="cleanChecks" @update:clean="($event) => cleanChecks = $event" />

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
            <IonButton v-if="!s.presence" size="small" style="margin-top: auto; margin-bottom: auto; margin-left: auto;" shape="round" @click="() => { selectedStudent = s.studentId; checkboxModal.modal = true }">
              <IonIcon slot="icon-only" :icon="layers" />
            </IonButton>

            <IonSelect v-if="!s.presence" v-model="s.justification" class="custom-floating-label ion-margin-vertical" label-placement="floating" justify="space-between" label="Justificativa de falta" fill="outline">
              <!-- @TODO: As justificativas disponiveis ainda estão estáticas, é necessário consultar e receber estas informações de forma dinâmica -->
              <IonSelectOption v-for="(j, index) in justifyOptions" :key="index" :value="j.id">
                {{ j.name }}
              </IonSelectOption>
            </IonSelect>
          </ionrow>
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
              <IonButton :disabled="justification?.length === 0" color="danger" expand="full" @click="cancelModal = !cancelModal">
                Cancelar
              </IonButton>
            </IonCol>
            <IonCol size="6">
              <IonButton :disabled="justification?.length === 0 || justification" color="secondary" expand="full">
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
