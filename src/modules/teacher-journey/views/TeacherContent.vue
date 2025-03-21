<script setup lang="ts">
import EduFilterProfile from '@/components/FilterProfile.vue'
import ContentLayout from '@/components/theme/ContentLayout.vue'
import EduCalendar from '@/components/WeekDayPicker.vue'
import { IonAccordion, IonAccordionGroup, IonAlert, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonIcon, IonItem, IonLabel } from '@ionic/vue'
import { add, calendarOutline, save } from 'ionicons/icons'
import { ref, watch } from 'vue'
import ContentCopy from '../components/content/Copy.vue'
import ContentCreate from '../components/content/Create.vue'
import ContentUpdate from '../components/content/Update.vue'

import ContentService from '../services/ContentService'
import ScheduleService from '../services/ScheduleService'

interface Registro {
  id: string
  classroom: string
  classroomId: string
  teacherId: string
  date: string
  description: string
  disciplines: {
    disciplineId: {
      id: string
      name: string
    }
  }[]
  bnccs: {
    bnccId: {
      code: string
    }
  }[]
}

const contentService = new ContentService()
const scheduleService = new ScheduleService()

const eduFProfile = ref()

const selectedToCopy = ref()
const selectedToUpdate = ref()

const schedules = ref()

const isCopyModalOpen = ref(false)
const isUpdateModalOpen = ref(false)
const isContentSaved = ref({ card: false, saved: undefined as any })

const selectedDayInfo = ref()
const isAccordionContent = ref(false)
const showAlert = ref(false)
const registroToDelete = ref<string | null>(null)
const setCopyModalOpen = (open: boolean) => (isCopyModalOpen.value = open)
const setUpdateModalOpen = (open: boolean) => (isUpdateModalOpen.value = open)
const registros = ref<Registro[]>([])
  const expandedAccordion = ref<string | string[] | undefined>(undefined);

watch(selectedDayInfo, async (newValue) => {
  if (newValue.selectedDate && eduFProfile.value) {
    await loadDataContent(eduFProfile.value.classroomId, newValue.selectedDate)
    isContentSaved.value.card = false
  }
  else {
    registros.value = []
  }
})

watch(eduFProfile, async (newValue) => {
  if (newValue.teacherId) {
    schedules.value = await scheduleService.getSchedules(newValue.teacherId)
  }
  if (newValue.classroomId && selectedDayInfo.value?.selectedDate) {
    await loadDataContent(newValue.classroomId, selectedDayInfo.value?.selectedDate)
  }
  else {
    registros.value = []
  }
})

watch(isContentSaved, async (newValue) => {
  if (newValue.saved) {
    await loadDataContent(eduFProfile.value.classroomId, selectedDayInfo.value?.selectedDate)
  }
})

watch(isUpdateModalOpen, async (newValue) => {
  if (!newValue) {
    await loadDataContent(eduFProfile.value.classroomId, selectedDayInfo.value?.selectedDate)
  }
})

async function loadDataContent(currentClassroomId: string, selectedDate: string): Promise<void> {
  try {
    const data = await contentService.listContentByToday(currentClassroomId, selectedDate)
    registros.value = data || []
  }
  catch (error: unknown | any) {
    registros.value = []
    console.error('Erro ao carregar os dados:', error.message)
  }
}

async function softDeleteDataContent(id: string): Promise<void> {
  registroToDelete.value = id
  showAlert.value = true
}

async function confirmDeleteContent() {
  if (registroToDelete.value) {
    try {
      const userId = JSON.parse(localStorage.getItem('userLocal') || '{}').id || ''
      await contentService.softDeleteContent({ id: registroToDelete.value, userId })
      await loadDataContent(eduFProfile.value.classroomId, selectedDayInfo.value?.selectedDate)
    }
    catch (error: unknown | any) {
      console.error('Erro ao deletar os dados:', error.message)
    }
    finally {
      registroToDelete.value = null
      showAlert.value = false
    }
  }
}

function changeSelectedToCopy(current: any): void {
  selectedToCopy.value = current
  return void 0
}

function changeSelectedToUpdate(current: any): void {
  selectedToUpdate.value = current
  return void 0
}
</script>

<template>
  <ContentLayout>
    <EduFilterProfile :discipline="false" @update:filtered-ocupation="($event) => eduFProfile = $event" />
    <h3>
      <ion-text color="secondary" class="ion-content ion-padding-bottom" style="display: flex; align-items: center;">
        <IonIcon color="secondary" style="margin-right: 1%;" aria-hidden="true" :icon="calendarOutline" />
        Lançamento diário
      </ion-text>
    </h3>
    <EduCalendar v-model="selectedDayInfo" :teacher-id="eduFProfile?.teacherId" :current-classroom="eduFProfile?.classroomId" :current-discipline="eduFProfile?.disciplineId" :frequency="eduFProfile?.frequency" />

    <div v-if="eduFProfile?.classroomId && selectedDayInfo?.selectedDate">
      <IonCard v-show="registros?.length === 0 && !isContentSaved.card" class="ion-no-padding ion-margin-top">
        <IonCardHeader color="secondary">
          <div style="display: flex; align-items: center; height: 10px;">
            <IonIcon :icon="save" size="small" style="margin-right: 8px;" />
            <IonCardTitle style="font-size: medium;">
              Registro de conteúdo
            </IonCardTitle>
          </div>
        </IonCardHeader>

        <div>
          <IonCardContent class="">
            <ion-text color="secondary">
              Notamos que você ainda não fez o registro diário, toque no botão abaixo para iniciar.
            </ion-text>
          </IonCardContent>

          <div style="display: flex; justify-content: flex-end;">
            <IonButton class="ion-margin" color="tertiary" @click="() => { isContentSaved.card = true }">
              <IonIcon slot="icon-only" :icon="add" />
            </IonButton>
          </div>
        </div>
      </IonCard>

      <IonAccordionGroup v-model="expandedAccordion" id="RegistrosExistentes" class="ion-content" expand="inset">
        <IonAccordion v-for="(registro, index) in registros" :key="index" style="margin-bottom: 5px;" :value="`${index}`">
          <IonItem slot="header" color="secondary">
            <IonLabel class="custom-span">
              {{ registro.classroom }} -
              <span v-for="(disciplina, i) in registro.disciplines" :key="i">
                <span v-if="disciplina !== registro?.disciplines?.at(0)"><span v-if="registro?.disciplines.length > 2">, </span><span v-else> e </span></span>
                {{ disciplina.disciplineId.name }}
              </span>
            </IonLabel>
          </IonItem>
          <div slot="content" style="margin: 10px 0 0 10px;">
            <!-- @TODO: Disciplina ainda precisa ser tipada -->
            <IonChip v-for="(disciplina, i) in registro.disciplines" :key="i" style="margin-left: 0px; margin-right: 10px;" color="secondary">
              {{ disciplina.disciplineId.name }}
            </IonChip>
            <div style="margin: 10px 10px 10px 5px;">
              <ion-text color="secondary" class="ion-text-justify" style="white-space: pre-line;">
                {{ registro.description }}
              </ion-text>
            </div>
            <!-- @TODO: Bncc ainda precisa ser tipada -->
            <IonChip v-for="(bncc, i) in registro.bnccs" :key="i" style="margin-left: 0px;  margin-right: 10px; font-size: 12px;" color="tertiary">
              {{ bncc.bnccId.code }}
            </IonChip>
            <br>
            <div class="ion-margin" style="display: flex; justify-content: right; margin-top: 20px; gap: 5px;">
              <IonButton color="tertiary" size="small" style="text-transform: capitalize;" @click="() => { setCopyModalOpen(!isCopyModalOpen); changeSelectedToCopy(registro) }">
                Copiar
              </IonButton>
              <IonButton color="secondary" size="small" style="text-transform: capitalize;" @click="() => { setUpdateModalOpen(!isUpdateModalOpen); changeSelectedToUpdate(registro) }">
                Editar
              </IonButton>
              <IonButton color="danger" size="small" style="text-transform: capitalize;" @click="() => { softDeleteDataContent(registro.id) }">
                Excluir
              </IonButton>
            </div>
          </div>
        </IonAccordion>
      </IonAccordionGroup>

      <ContentCopy v-model="isCopyModalOpen" :is-copy-modal-open="isCopyModalOpen" :schedules="schedules" :registry="selectedToCopy" :current-classroom-id="eduFProfile?.classroomId" />

      <!-- aqui vem o registro do conteúdo -->
      <ContentCreate
        v-if="isContentSaved.card"
        id="NovoRegistroFormulario"
        v-model="isContentSaved"
        :series-id="eduFProfile?.seriesId"
        :selected-day="selectedDayInfo?.selectedDate"
        :teacher-id="eduFProfile.teacherId" :classroom-id="eduFProfile?.classroomId"
        :available-disciplines="schedules?.availableDisciplines"
        :frequency="eduFProfile.frequency"
        :discipline-id="eduFProfile.disciplineId"
      />

      <ContentUpdate
        v-model="isUpdateModalOpen"
        :is-update-modal-open="isUpdateModalOpen"
        :registry="selectedToUpdate"
        :series-id="eduFProfile?.seriesId"
        :classroom-id="eduFProfile?.classroomId"
        :available-disciplines="schedules?.availableDisciplines"
        :frequency="eduFProfile.frequency"
      />

      <div v-if="registros.length > 0" id="NovoRegistro" style="display: flex; justify-content: flex-end;" class="ion-content">
        <IonButton color="tertiary" @click="isContentSaved.card = !isContentSaved.card">
          <IonIcon slot="icon-only" :icon="add" />
        </IonButton>
      </div>
    </div>
    <IonCard v-else color="info">
      <IonCardHeader>
        <IonCardTitle>Selecione a turma e dia</IonCardTitle>
      </IonCardHeader>

      <IonCardContent> Olá, por favor selecione qual a turma e em qual dia você dejesa fazer o preenchimento </IonCardContent>
    </IonCard>

    <IonAlert
      :is-open="showAlert"
      header="Deseja apagar o conteúdo?"
      :buttons="[
        {
          text: 'Não',
          role: 'cancel',
          handler: () => { showAlert = false },
        },
        {
          text: 'Sim',
          handler: confirmDeleteContent,
        },
      ]"
    />
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

.ion-select-card-content {
  --border-color: var(--ion-color-secondary);
  --placeholder-color: var(--ion-color-secondary);
  --placeholder-opacity: 1;
  width: 100%;
}

.ion-select-card-content::part(text) {
  flex: 0 0 auto;
}

.ion-select-card-content::part(text) {
  color: var(--ion-color-secondary);
  background-color: rgba(79, 41, 116, 0.1);
  border-radius: 16px;
  padding: 2px 8px;
  display: inline-block;
}

.ion-select-card-content::part(icon) {
  color: var(--ion-color-secondary);
  opacity: 1;
}

ion-modal#copy-modal {
  --width: fit-content;
  --height: fit-content;
  --border-radius: 6px;
  --box-shadow: 0 28px 48px rgba(0, 0, 0, 0.4);
}

ion-modal#copy-modal h1 {
  margin: 20px 20px 10px 20px;
}

ion-modal#copy-modal ion-icon {
  margin-top: 6px;
  margin-right: 6px;

  width: 22px;
  height: 22px;

  padding: 0 4px;

  color: var(--ion-color-lightaccent-shade);
}

ion-select {

  --placeholder-color: var(--ion-color-primary);
  --placeholder-opacity: 1;
  --border-color: var(--ion-color-primary)
 }
 ion-select::part(text) {
    color: var(--ion-color-primary);
  }
  ion-select::part(icon) {
    color: var(--ion-color-primary);
    opacity: 1;
  }
  ion-select::part(label) {
    color: var(--ion-color-primary);
    opacity: 1;
  }
  .custom-span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
