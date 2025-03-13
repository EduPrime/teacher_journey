<script setup lang="ts">
import EduFilterProfile from '@/components/FilterProfile.vue'
import ContentLayout from '@/components/theme/ContentLayout.vue'
import EduCalendar from '@/components/WeekDayPicker.vue'
import { IonAccordion, IonAccordionGroup, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCheckbox, IonIcon, IonItem, IonLabel, IonRadio, IonRadioGroup } from '@ionic/vue'
import { calendarOutline } from 'ionicons/icons'
import { ref, watch } from 'vue'

import ScheduleService from '../services/ScheduleService'

const scheduleService = new ScheduleService()

const eduFProfile = ref()

const schedules = ref()

const radioBtn = ref(true)

const isContentSaved = ref({ card: false, saved: undefined as any })

const selectedDayInfo = ref()

watch(selectedDayInfo, async (newValue) => {
  if (newValue.selectedDate && eduFProfile.value) {
    // @TODO: função para carregar a listagem de alunos
    isContentSaved.value.card = false
  }
  else {
    // @TODO: metodo para limpar a listagem
  }
})

watch(eduFProfile, async (newValue) => {
  if (newValue.teacherId) {
    schedules.value = await scheduleService.getSchedules(newValue.teacherId)
  }
  if (newValue.classroomId && selectedDayInfo.value?.selectedDate) {
    // @TODO: Função para carregar a listagem dos alunos
  }
  else {
    // @TODO: metodo para limpar a listagem

  }
})
</script>

<template>
  <ContentLayout>
    <EduFilterProfile :discipline="false" @update:filtered-ocupation="($event) => eduFProfile = $event" />
    <h3>
      <ion-text color="secondary" class="ion-content ion-padding-bottom" style="display: flex; align-items: center;">
        <IonIcon color="secondary" style="margin-right: 1%;" aria-hidden="true" :icon="calendarOutline" />
        Frequência diária
      </ion-text>
    </h3>
    <EduCalendar v-model="selectedDayInfo" :teacher-id="eduFProfile?.teacherId" />

    <IonAccordionGroup v-if="selectedDayInfo?.selectedDate" class="ion-content" expand="inset">
      <IonAccordion v-for="(n, i) in 4" :key="i" :value="`${i}`">
        <IonItem slot="header" color="light">
          <IonLabel>Aluno Fulando da Silva - {{ n }}</IonLabel>
        </IonItem>
        <div slot="content" class="ion-padding">
          <pre>
            radioBtn: {{ radioBtn }}
          </pre>
          <ion-row>
            <IonRadioGroup v-model="radioBtn">
              <IonRadio style="padding-right: 24px;" :value="true">
                Presente
              </IonRadio>
              <IonRadio :value="false">
                Ausente
              </IonRadio>
            </IonRadioGroup>
          </ion-row>
        </div>
      </IonAccordion>
    </IonAccordionGroup>
    <IonCard v-else>
      <IonCardHeader>
        <IonCardTitle>Selecione a turma e dia</IonCardTitle>
      </IonCardHeader>

      <IonCardContent>
        <ion-text color="primary">
          Olá, por favor selecione qual a <b>turma</b> e em qual <b>dia</b> você dejesa fazer o lançamento de frequência
        </ion-text>
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
</style>
