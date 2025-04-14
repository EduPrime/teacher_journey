<script setup lang="ts">
import EduFilterProfile from '@/components/FilterProfile.vue'
import ContentLayout from '@/components/theme/ContentLayout.vue'
import { IonAccordion, IonAccordionGroup, IonButton, IonCardHeader, IonIcon, IonItem, IonLabel, IonText } from '@ionic/vue'
import { barChartOutline, calendarClearOutline, calendarOutline, shapes } from 'ionicons/icons'

import { DateTime } from 'luxon'

import { ref, watch } from 'vue'

import EnrollmentService from '../services/EnrollmentService'

const enrollmentService = new EnrollmentService()

const eduFProfile = ref()
const students = ref()

watch(eduFProfile, async (newValue) => {
  if (newValue?.teacherId) {
    //
    students.value = await enrollmentService.getClassroomStudents(newValue.classroomId)
  }
  else {
    students.value = undefined
  }
})

function luxonFormatDate(dateString: string) {
  const date = DateTime.fromISO(dateString)
  return date.setLocale('pt-BR').toFormat('dd MMM yyyy')
}
</script>

<template>
  <ContentLayout>
    <EduFilterProfile :discipline="false" @update:filtered-ocupation="($event) => eduFProfile = $event" />
    <h3>
      <IonText color="secondary" class="ion-content ion-padding-bottom" style="display: flex; align-items: center;">
        <IonIcon color="secondary" style="margin-right: 10px;" aria-hidden="true" :icon="shapes" />
        <span>Parecer descritivo</span>
      </IonText>
    </h3>

    <IonAccordionGroup v-if="students" class="ion-content" expand="inset">
      <IonAccordion v-for="(s, i) in students" :key="i" :value="`${i}`" class="no-border-accordion">
        <IonItem slot="header">
          <IonLabel>
            <IonText color="secondary">
              {{ s.name }}
            </IonText>
          </IonLabel>
        </IonItem>
        <div slot="content" class="ion-padding">
          <IonCardHeader
            id="accordionContentHeader"
            class="ion-no-padding" style="padding: 8px; margin-bottom: 20px; background-color: rgba(var(--ion-color-secondary-rgb), 0.1);"
            :translucent="true"
          >
            <IonText color="primary" style="display: flex; align-items: center; height: 15px;">
              <IonIcon :icon="barChartOutline" style="margin-right: 10px;" />
              Descrição parcial da criança
            </IonText>
          </IonCardHeader>

          <div class="ion-margin-top">
            <ion-textarea
              color="secondary"
              class="ion-content"
              label="Parecer Descritivo"
              label-placement="floating"
              fill="outline"
              :style="`min-height: ${70}px;`"
              oninput="this.style.minHeight = `${70 + this.value.length / 2}px`"
              placeholder="Enter text"
              :counter="true"
              :maxlength="800"
            />
          </div>
          <!-- Data de criação do parecer descritivo -->
          <IonCardHeader
            id="accordionContentHeader"
            class="ion-no-padding" style="padding: 8px;"
            :translucent="true"
          >
            <IonText color="primary" style="display: flex; align-items: center; height: 15px;">
              <IonIcon :icon="calendarClearOutline" style="margin-right: 10px;" />
              Criado em {{ luxonFormatDate(s.createdAt) }}
            </IonText>
          </IonCardHeader>
          <!-- Data de *ATUALIZAÇÂO do parecer descritivo -->
          <IonCardHeader
            id="accordionContentHeader"
            class="ion-no-padding" style="padding: 8px;"
            :translucent="true"
          >
            <IonText color="primary" style="display: flex; align-items: center; height: 15px;">
              <IonIcon :icon="calendarOutline" style="margin-right: 10px;" />
              Atualizado em {{ luxonFormatDate(s.createdAt) }}
            </IonText>
          </IonCardHeader>
          <div class="ion-content" style="display: flex; justify-content: right; padding-top: 8px; padding-bottom: 8px;">
            <IonButton color="secondary" style="text-transform: capitalize;">
              Salvar
            </IonButton>
          </div>
        </div>
      </IonAccordion>
    </IonAccordionGroup>

    <!-- <div style="height: 64px;" />
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
    </template> -->
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

ion-modal#custom-modal {
    --width: 400px;
    --min-width: 400px;
    --min-width: 250px;
    --height: fit-content;
    --border-radius: 6px;
    --box-shadow: 0 28px 48px rgba(0, 0, 0, 0.4);
  }

  ion-modal#custom-modal h1 {
    margin: 20px 20px 10px 20px;
  }

  ion-modal#custom-modal .wrapper {
    margin-bottom: 10px;
  }

ion-loading.custom-save-loading {
  --background: #e3edff;
  --spinner-color: var(--ion-color-warning);

  color: var(--ion-color-info);
}
</style>
