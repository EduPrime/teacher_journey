<script setup lang="ts">
import EduFilterProfile from '@/components/FilterProfile.vue'
import ContentLayout from '@/components/theme/ContentLayout.vue'
import EduCalendar from '@/components/WeekDayPicker.vue'
import { IonAccordion, IonAccordionGroup, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonItem, IonLabel, IonRadio, IonRadioGroup, IonRow, IonText, IonToolbar } from '@ionic/vue'
import { calendarOutline, checkmarkCircleOutline } from 'ionicons/icons'
import { ref, watch } from 'vue'

import EnrollmentService from '../services/EnrollmentService'
import ScheduleService from '../services/ScheduleService'

const scheduleService = new ScheduleService()
const enrollmentService = new EnrollmentService()

const eduFProfile = ref()

const schedules = ref()

const students = ref()

const radioBtn = ref(true)

const isContentSaved = ref({ card: false, saved: undefined as any })

const selectedDayInfo = ref()

watch(selectedDayInfo, async (newValue) => {
  if (newValue.selectedDate && eduFProfile.value) {
    // @TODO: função para carregar a listagem de alunos
    students.value = await enrollmentService.getClassroomStudents(eduFProfile.value.classroomId)
    isContentSaved.value.card = false
  }
  else {
    // @TODO: metodo para limpar a listagem
    students.value = undefined
  }
})

watch(eduFProfile, async (newValue) => {
  if (newValue.teacherId) {
    schedules.value = await scheduleService.getSchedules(newValue.teacherId)
  }
  if (newValue.classroomId && selectedDayInfo.value?.selectedDate) {
    // @TODO: Função para carregar a listagem dos alunos
    students.value = await enrollmentService.getClassroomStudents(newValue.classroomId)
  }
  else {
    // @TODO: metodo para limpar a listagem
    students.value = undefined
  }
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
    <IonAccordionGroup v-if="selectedDayInfo?.selectedDate" class="ion-content" expand="inset">
      <IonAccordion v-for="(s, i) in students" :key="i" :value="`${i}`" class="no-border-accordion">
        <IonItem slot="header">
          <IonLabel>
            <IonText color="secondary">
              {{ s.name }}
            </IonText>
          </IonLabel>
        </IonItem>
        <div slot="content" class="ion-padding">
          <IonRow>
            <IonRadioGroup v-model="radioBtn" style="color: var(--ion-color-secondary);">
              <IonRadio label-placement="end" color="secondary" style="padding-right: 24px;" :value="true">
                Presente
              </IonRadio>
              <IonRadio label-placement="end" color="secondary" :value="false">
                Ausente
              </IonRadio>
            </IonRadioGroup>
          </IonRow>
        </div>
      </IonAccordion>
    </IonAccordionGroup>
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
