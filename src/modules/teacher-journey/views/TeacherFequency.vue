<script setup lang="ts">
import type { FrequencyToSave } from '../types/types'
import EduFilterProfile from '@/components/FilterProfile.vue'
import ContentLayout from '@/components/theme/ContentLayout.vue'
import EduCalendar from '@/components/WeekDayPicker.vue'
import showToast from '@/utils/toast-alert'
import { IonAccordion, IonAccordionGroup, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCol, IonGrid, IonIcon, IonItem, IonLabel, IonLoading, IonRadio, IonRadioGroup, IonRow, IonSelect, IonSelectOption, IonText, IonToolbar } from '@ionic/vue'
import { calendarOutline, checkmarkCircleOutline, checkmarkDone, layers, warningOutline } from 'ionicons/icons'
import { DateTime } from 'luxon'

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

const todayFrequency = ref()

const isLoadingWarning = ref(false) // Controla o estado de carregamento
const isWarningInformation = ref<boolean | null>(null)
const isLoadingSaveFrequency = ref(false) // Controla o estado do IonLoading

const frequencyToSave = ref<FrequencyToSave[]>()
const cancelModal = ref(false)
const hasUnsavedChanges = ref(false)
const isCancelEnabled = ref(false)

const checkboxModal = ref({ modal: false, quantifiedPresence: undefined as any })
const selectedStudent = ref()

// const justification = ref([{ name: 'Gravidez', id: 1 }, { name: 'Atestado médico', id: 2 }, { name: 'Transporte escolar ausente', id: 2 }])
const justifyOptions = ref()
const cleanChecks = ref(false)
const isContentSaved = ref({ card: false, saved: undefined as any })
const isLoading = ref(false)

const selectedDayInfo = ref()

watch(frequencyToSave, (newValue, oldValue) => {
  if (newValue && newValue.length > 0) {
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      isCancelEnabled.value = false
      hasUnsavedChanges.value = false
    }
    else {
      isCancelEnabled.value = true
      hasUnsavedChanges.value = true
    }
  }
  else {
    isCancelEnabled.value = false
    hasUnsavedChanges.value = false
  }
}, { deep: true })

// Watcher para atualizar schedules quando eduFProfile ou selectedDayInfo mudarem
watch([eduFProfile, selectedDayInfo], async ([newEduFProfile, newSelectedDayInfo]) => {
  isLoadingWarning.value = true // Inicia o carregamento
  todayFrequency.value = []
  if (newEduFProfile?.teacherId && newSelectedDayInfo?.selectedDate) {
    todayFrequency.value = await attendanceService.getAttendanceByToday(newSelectedDayInfo.selectedDate, newEduFProfile.classroomId, newEduFProfile.frequency === 'discipline' && newEduFProfile.disciplineId ? newEduFProfile.disciplineId : undefined)
    stage.value = await stageService.getCurrentStageWeekday(newSelectedDayInfo.selectedDate)
    justifyOptions.value = await justificationService.getJustifications()

    //
    students.value = await enrollmentService.getClassroomStudents(newEduFProfile.classroomId)

    if (todayFrequency.value && todayFrequency.value.length > 0) {
      // Frequência encontrada
      isWarningInformation.value = false // Frequência registrada

      frequencyToSave.value = students.value.map((i: any) => {
        // atribuimos o valor do find em todayFrequency dentro da constante abaixo
        const studentFrequency = todayFrequency.value?.find((atdc: { studentId: string, disciplineId: string }) => atdc.studentId === i.studentId && (atdc.disciplineId === newEduFProfile.disciplineId || newEduFProfile.frequency === 'diaria'))

        return {
          name: i.name,
          enrollmentId: i.id,
          classroomId: newEduFProfile.classroomId,
          disciplineId: newEduFProfile.disciplineId,
          studentId: i.studentId,
          schoolId: i.schoolId,
          stageId: stage.value?.stageId,
          status: i.status,
          situation: i.situation,
          disability: i.student.disability,
          teacherId: newEduFProfile.teacherId,
          date: newSelectedDayInfo.selectedDate,
          presence: studentFrequency?.presence ?? true,
          justificationId: studentFrequency?.justificationId ?? undefined,
          frequencies: studentFrequency?.frequencies ?? [],
        } as FrequencyToSave
      })
    }
    else {
      // Frequência não encontrada
      isWarningInformation.value = true // Frequência pendente
      // Frequência não encontrada
      isWarningInformation.value = true // Frequência pendente

      frequencyToSave.value = students.value.map((i: any) => {
        return {
          name: i.name,
          enrollmentId: i.id,
          classroomId: newEduFProfile.classroomId,
          disciplineId: newEduFProfile.disciplineId,
          studentId: i.studentId,
          schoolId: i.schoolId,
          stageId: stage.value?.stageId,
          status: i.status,
          situation: i.situation,
          disability: i.student.disability,
          teacherId: newEduFProfile.teacherId,
          date: newSelectedDayInfo.selectedDate,
          presence: true,
          justificationId: undefined as string | undefined,
          frequencies: [],
        } as FrequencyToSave
      })
    }

    isContentSaved.value.card = false

    const fullWeekday = getFullWeekday(newSelectedDayInfo.weekday)
    const scheduleResult = await scheduleService.getScheduleTeacherDay(newEduFProfile.teacherId, fullWeekday, newEduFProfile.classroomId, newEduFProfile.disciplineId)
    schedules.value = scheduleResult !== undefined ? scheduleResult : 0
  }
  else {
    students.value = undefined
    frequencyToSave.value = undefined
    isWarningInformation.value = null // Reseta isWarningInformation quando não há dados
  }
  isLoadingWarning.value = false // Finaliza o carregamento
})

watch(selectedStudent, () => {
  // frequencyToSave.value.quantifiedPresence = undefined
  checkboxModal.value.quantifiedPresence = undefined
  cleanChecks.value = true
})

watch(() => checkboxModal.value.quantifiedPresence, (newValue) => {
  if (newValue && frequencyToSave.value) {
    frequencyToSave.value = frequencyToSave.value.map((i: any) => {
      if (i.studentId === selectedStudent.value.studentId) {
        return { ...i, frequencies: newValue }
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
    isLoading.value = true
    isLoadingSaveFrequency.value = true // Exibe o IonLoading
    try {
      // verificar se já existe frequencia do professor para o dia selecionado
      const teacherAttendance = await attendanceService.listTeacherAttendance(
        eduFProfile.value.teacherId,
        selectedDayInfo.value.selectedDate,
        eduFProfile.value.classroomId,
        eduFProfile.value.frequency.toUpperCase(), // Tipo de frequência DISCIPLINA OU DIARIA
        eduFProfile.value.disciplineId,
      )
      if (!teacherAttendance || teacherAttendance.length === 0) {
        // Cria o registro de frequência do professor
        await attendanceService.createTeacherAttendance({
          date: selectedDayInfo.value.selectedDate,
          totalClasses: schedules.value, // Número total de aulas
          type: eduFProfile.value.frequency.toUpperCase(), // Tipo de frequência DISCIPLINA OU DIARIA
          teacherId: eduFProfile.value.teacherId,
          classroomId: eduFProfile.value.classroomId,
          disciplineId: eduFProfile.value.disciplineId,
          stageId: stage.value?.stageId,
          schoolId: students.value?.[0]?.schoolId, // Obtém o ID da escola do primeiro aluno
        })
        // showToast('Frequência do professor registrada com sucesso', 'top', 'success')
      }
      else {
        // showToast('Frequência do professor já foi registrada', 'top', 'warning')
      }

      // Salva a frequência dos alunos
      const createdRecords = await attendanceService.createAttendance(frequencyToSave.value)
      if (createdRecords.length > 0) {
        isWarningInformation.value = false
        showToast('Frequência salva com sucesso', 'top', 'success')
      }
      else {
        showToast('Nenhuma nova frequência foi criada', 'top', 'warning')
      }
    }
    catch (error) {
      showToast('Erro ao salvar frequência', 'top', 'warning')
      console.error('Erro ao salvar frequência', error)
    }
    finally {
      isLoading.value = false
      isLoadingSaveFrequency.value = false // Oculta o IonLoading
      isCancelEnabled.value = false // Desabilita Botão Cancelar
    }
  }
  else {
    console.error('Nenhuma frequência para salvar')
    showToast('Nenhuma frequência para salvar', 'top', 'warning')
  }
}

function luxonFormatDate(dateString: string) {
  const date = DateTime.fromISO(dateString)
  return date.setLocale('pt-BR').toFormat('dd/MM/yyyy')
}
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
    <EduCalendar v-model="selectedDayInfo" :teacher-id="eduFProfile?.teacherId" :current-classroom="eduFProfile?.classroomId" :current-discipline="eduFProfile?.disciplineId" :frequency="eduFProfile?.frequency" />

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

    <FrequencyMultiSelect
      v-if="eduFProfile?.frequency === 'disciplina'"
      v-model="checkboxModal.quantifiedPresence"
      :checkbox-modal="checkboxModal?.modal"
      :clean-checks="cleanChecks"
      :num-classes="schedules"
      :current-student="selectedStudent"
      @update:open-modal="($event) => checkboxModal.modal = $event"
      @update:clean="($event) => cleanChecks = $event"
    />

    <!-- @update:model-value="($event) => checkboxModal.quantifiedPresence = $event" -->

    <div v-if="isLoadingWarning" class="loading-spinner" style="height: 65px;">
      <!-- <IonText>
        <IonIcon name="sync" spin />
        Carregando informações...
      </IonText> -->
    </div>
    <div v-else-if="isWarningInformation !== null">
      <div v-if="isWarningInformation" class="warning-close-date">
        <div class="title">
          Frequência Pendente
        </div>
        <div class="text">
          <IonIcon :icon="warningOutline" size="large" />
          <div>
            Não houve lançamento no dia <b>{{ luxonFormatDate(selectedDayInfo.selectedDate) }}</b>.
          </div>
        </div>
      </div>
      <div v-else class="success-close-date">
        <div class="title">
          Frequência Registrada
        </div>
        <div class="text">
          <IonIcon :icon="checkmarkDone" size="large" />
          <div>
            Lançada no dia <b>{{ luxonFormatDate(selectedDayInfo.selectedDate) }}</b>.
          </div>
        </div>
      </div>
    </div>

    <IonLoading
      :is-open="isLoadingSaveFrequency"
      message="Salvando..."
      spinner="crescent"
      class="custom-save-loading"
    />

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
            <IonButton v-if="eduFProfile.frequency === 'disciplina' && !s.presence" size="small" style="margin-top: auto; margin-bottom: auto; margin-left: auto;" shape="round" @click="() => { selectedStudent = s; checkboxModal.modal = true }">
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
          <IonItem :button="true" :detail="false" @click="cancelModal = false">
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
    <div style="height: 64px;" />
    <template #footer>
      <IonToolbar>
        <IonGrid>
          <IonRow>
            <IonCol size="6">
              <IonButton :disabled="!isCancelEnabled" color="danger" expand="full" @click="cancelModal = !cancelModal">
                Cancelar
              </IonButton>
            </IonCol>
            <IonCol size="6">
              <IonButton :disabled="isLoading" color="secondary" expand="full" @click="saveFrequency">
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

.warning-close-date {
  margin-top: 5px;
  margin-bottom: 5px;
  background-color: #F5C228E6;
  color: #000000B3;
  padding: 6px 6px 6px 6px;
  border-radius: 3px;
  margin-left: 10px;
  margin-right: 10px;

  .title {
    font-size: 17px;
    font-weight: 600;
    padding-left: 34px;
  }

  .text {
    ion-icon {
      width: 30px;
      margin-right: 5px;
      margin-top: -18px;
    }

    font-weight: 300;
    display: flex;
    align-items: start;
    font-size: 15px;
  }
}

.success-close-date {
  margin-top: 5px;
  margin-bottom: 5px;
  background-color: var(--ion-color-success-shade);
  color: #000000B3;
  padding: 6px 6px 6px 6px;
  border-radius: 3px;
  margin-left: 10px;
  margin-right: 10px;

  .title {
    font-size: 17px;
    font-weight: 600;
    padding-left: 34px;
  }

  .text {
    ion-icon {
      width: 30px;
      margin-right: 5px;
      margin-top: -18px;
    }

    font-weight: 300;
    display: flex;
    align-items: start;
    font-size: 15px;
  }

  ion-loading.custom-save-loading {
    --background: #e3edff;
    --spinner-color: var(--ion-color-warning);

    color: var(--ion-color-info);
  }
}
</style>
