<script setup lang="ts">
import type { MountedStudent } from '../types/types'
import EduFilterProfile from '@/components/FilterProfile.vue'
import ContentLayout from '@/components/theme/ContentLayout.vue'
import EduCalendar from '@/components/WeekDayPicker.vue'
import showToast from '@/utils/toast-alert'
import { IonAccordion, IonAccordionGroup, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCol, IonGrid, IonIcon, IonItem, IonLabel, IonLoading, IonRadio, IonRadioGroup, IonRow, IonSelect, IonSelectOption, IonText, IonToolbar } from '@ionic/vue'
import { calendarOutline, checkmarkCircleOutline, checkmarkDone, layers, text, warningOutline } from 'ionicons/icons'
import { DateTime } from 'luxon'

import { onMounted, ref, watch } from 'vue'

import EnrollmentService from '../services/EnrollmentService'

import StageService from '../services/StageService'

const enrollmentService = new EnrollmentService()
const stageService = new StageService()

const eduFProfile = ref()
const selectedDayInfo = ref()

const stage = ref()
const students = ref()
const studentList = ref<MountedStudent[]>()

const isLoading = ref(false)

// Watcher que observa o filtro e o calendário para montar a listágem de alunos
watch([eduFProfile, selectedDayInfo], async ([newEduFProfile, newSelectedDayInfo]) => {
  if (newEduFProfile?.teacherId && newSelectedDayInfo?.selectedDate) {
    stage.value = await stageService.getCurrentStageWeekday(newSelectedDayInfo.selectedDate)

    students.value = await enrollmentService.getClassroomStudents(newEduFProfile.classroomId)

    studentList.value = students.value.map((i: any) => {
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
      } as studentList
    })
  }
  else {
    students.value = undefined
  }
})
</script>

<template>
  <ContentLayout>
    <EduFilterProfile :discipline="false" @update:filtered-ocupation="($event) => eduFProfile = $event" />
    <h3>
      <IonText color="secondary" class="ion-content ion-padding-bottom" style="display: flex; align-items: center;">
        <IonIcon color="secondary" style="margin-right: 10px;" aria-hidden="true" :icon="text" />
        Registro Conceitual
      </IonText>
    </h3>

    <IonCard color="info">
      <IonCardHeader>
        <IonCardTitle>Selecione a turma</IonCardTitle>
      </IonCardHeader>

      <IonCardContent>
        <IonText>
          Olá, por favor selecione qual a <b>turma</b> na qual deseja fazer o lançamento de notas conceituais
        </IonText>
      </IonCardContent>
    </IonCard>

    <div style="height: 64px;" />
    <template #footer>
      <IonToolbar>
        <IonGrid>
          <IonRow>
            <IonCol size="12">
              <IonButton :disabled="isLoading" color="secondary" expand="full" @click="($event) => $event">
                Finalizar
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
