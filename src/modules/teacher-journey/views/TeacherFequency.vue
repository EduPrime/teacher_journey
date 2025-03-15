<script setup lang="ts">
import EduFilterProfile from '@/components/FilterProfile.vue'
import ContentLayout from '@/components/theme/ContentLayout.vue'
import EduCalendar from '@/components/WeekDayPicker.vue'
import { IonAccordion, IonAccordionGroup, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonItem, IonLabel, IonRadio, IonRadioGroup, IonRow, IonSelect, IonSelectOption, IonText, IonToolbar } from '@ionic/vue'
import { calendarOutline, checkmarkCircleOutline, layers } from 'ionicons/icons'
import { ref, watch } from 'vue'

import FrequencyMultiSelect from '../components/frequency/MultiSelect.vue'

import EnrollmentService from '../services/EnrollmentService'
import ScheduleService from '../services/ScheduleService'

const scheduleService = new ScheduleService()
const enrollmentService = new EnrollmentService()

const eduFProfile = ref()

const schedules = ref()

const students = ref()

const frequencyToSave = ref()

const checkboxModal = ref({ modal: false, quantifiedPresence: undefined as any })
const selectedStudent = ref()

const radioBtn = ref(true)

const justifyOptions = ref([{ name: 'Gravidês', id: 1 }, { name: 'Atestado médico', id: 2 }, { name: 'Transporte escolar ausente', id: 2 }])

const isContentSaved = ref({ card: false, saved: undefined as any })

const selectedDayInfo = ref()

watch(selectedDayInfo, async (newValue) => {
  if (newValue.selectedDate && eduFProfile.value) {
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
      }
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
      }
    })
  }
  else {
    // @TODO: metodo para limpar a listagem
    students.value = undefined
    frequencyToSave.value = undefined
  }
})

watch(selectedStudent, () => {
  checkboxModal.value.quantifiedPresence = undefined
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

    <pre>
      <!-- dados a serem enviados -->
      frequencyToSave: {{ frequencyToSave?.at(0) }}
    </pre>

    <FrequencyMultiSelect v-model="checkboxModal" :checkbox-modal="checkboxModal?.modal" />

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
</style>
