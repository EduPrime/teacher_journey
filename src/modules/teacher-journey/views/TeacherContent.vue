<script setup lang="ts">
import EduFilterProfile from '@/components/FilterProfile.vue'
import ContentLayout from '@/components/theme/ContentLayout.vue'
import EduCalendar from '@/components/WeekDayPicker.vue'
import { IonAccordion, IonAccordionGroup, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonIcon, IonItem, IonLabel, IonModal, IonSelect, IonSelectOption, IonTextarea } from '@ionic/vue'
import { add, calendarOutline, save } from 'ionicons/icons'
import { ref, watch } from 'vue'
import ContentCreate from '../components/content/Create.vue'

import ContentService from '../services/ContentService'
import ScheduleService from '../services/ScheduleService'

interface Registro {
  classroom: string
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

const selectedClassroom = ref('352a5857-193f-4672-9abf-c5302afd1c37')
const schedules = ref()
const copyContentSchool = ref()
const copyContentClass = ref()

const isCopyModalOpen = ref(false)
const isFormAvailable = ref(false)

const selectedDayInfo = ref()
const isAccordionContent = ref(false)
const setCopyModalOpen = (open: boolean) => (isCopyModalOpen.value = open)
const registros = ref<Registro[]>([])

watch(selectedDayInfo, async (newValue) => {
  if (newValue.selectedDate && eduFProfile.value) {
    await loadDataContent(eduFProfile.value.classroomId, newValue.selectedDate)
    isFormAvailable.value = false
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
</script>

<template>
  <ContentLayout>
    <EduFilterProfile @update:filtered-ocupation="($event) => eduFProfile = $event" />
    <h3>
      <ion-text color="secondary" class="ion-content ion-padding-bottom" style="display: flex; align-items: center;">
        <IonIcon color="secondary" style="margin-right: 1%;" aria-hidden="true" :icon="calendarOutline" />
        Lançamento diário
      </ion-text>
    </h3>
    <EduCalendar v-model="selectedDayInfo" :teacher-id="eduFProfile?.teacherId" />

    <div v-if="eduFProfile?.classroomId && selectedDayInfo?.selectedDate">
      <IonCard v-show="registros?.length === 0 && !isFormAvailable" class="ion-no-padding ion-margin-top">
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
            <IonButton class="ion-margin" color="tertiary" @click="() => { isFormAvailable = true }">
              <IonIcon slot="icon-only" :icon="add" />
            </IonButton>
          </div>
        </div>
      </IonCard>

      <!-- :value="registros" Removi de IonAccordionGroup -->
      <IonAccordionGroup v-if="isAccordionContent || registros.length > 0" id="RegistrosExistentes" class="ion-content" expand="inset" :multiple="true">
        <IonAccordion v-for="(registro, index) in registros" :key="index" style="margin-bottom: 5px;" :value="registro.classroom">
          <IonItem slot="header" color="secondary">
            <IonLabel>
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
              <ion-text color="secondary" class="ion-text-justify">
                {{ registro.description }}
              </ion-text>
            </div>
            <!-- @TODO: Bncc ainda precisa ser tipada -->
            <IonChip v-for="(bncc, i) in registro.bnccs" :key="i" style="margin-left: 0px;  margin-right: 10px; font-size: 12px;" color="tertiary">
              {{ bncc.bnccId.code }}
            </IonChip>
            <br>
            <div class="ion-margin" style="display: flex; justify-content: right; margin-top: 20px; gap: 5px;">
              <IonButton color="tertiary" size="small" style="text-transform: capitalize;" @click="setCopyModalOpen(!isCopyModalOpen)">
                Copiar
              </IonButton>
              <IonButton color="secondary" size="small" style="text-transform: capitalize;">
                Editar
              </IonButton>
              <IonButton color="danger" size="small" style="text-transform: capitalize;">
                Excluir
              </IonButton>
            </div>
          </div>
        </IonAccordion>
      </IonAccordionGroup>

      <!-- aqui vem o registro do conteúdo -->
      <ContentCreate
        v-show="isFormAvailable"
        id="NovoRegistroFormulario"
        v-model="isFormAvailable"
        :series-id="eduFProfile?.seriesId"
        :selected-day="selectedDayInfo?.selectedDate"
        :teacher-id="eduFProfile.teacherId" :classroom-id="selectedClassroom"
        :available-disciplines="schedules?.availableDisciplines"
      />

      <div v-if="registros.length > 0" id="NovoRegistro" style="display: flex; justify-content: flex-end;" class="ion-content">
        <IonButton color="tertiary" @click="isFormAvailable = !isFormAvailable">
          <IonIcon slot="icon-only" :icon="add" />
        </IonButton>
      </div>

      <IonModal id="copy-modal" class="ion-content" :is-open="isCopyModalOpen" @ion-modal-did-dismiss="setCopyModalOpen(false)">
        <IonCard v-if="true" class="ion-no-padding ion-no-margin">
          <IonCardHeader color="secondary">
            <div style="display: flex; align-items: center; height: 15px;">
              <div style="font-size: 10px;">
                <IonIcon :icon="save" />
              </div>
              <IonCardTitle style="font-size: medium;">
                Copiar registro para outras turmas
              </IonCardTitle>
            </div>
          </IonCardHeader>

          <div v-if="true">
            <IonCardContent class="" style="display: flex; flex-direction: column; gap: 15px;">
              <ion-text color="secondary">
                Selecione uma turma referente a mesma série na qual foi criado o registro de conteúdo atual.
              </ion-text>
              <IonSelect v-if="schedules?.schools.length > 1" v-model="copyContentSchool" class="custom-floating-label" label-placement="floating" justify="space-between" label="Escola" fill="outline">
                <IonSelectOption v-for="(sc, index) in schedules?.schools" :key="index" :value="sc.id">
                  {{ sc.name }}
                </IonSelectOption>
              </IonSelect>
              <IonSelect v-if="schedules" v-model="copyContentClass" class="custom-floating-label" label-placement="floating" label="Turma" fill="outline">
                <!-- Se copyContentSchool existir é usado para encontrar o index ( escola ) no qual as turmas serão pegas e se não usa o index 0 para selecionar o primeiro item no array de turmas por escolas -->
                <!-- todas as turmas são filtradas abaixo para garantir que estejam disponiveis para seleção apenas os items em que a seriesId seja igual a seriesId oriunda da turma selecionada no filtro principal da página ( o de escolas e turmas ) -->
                <IonSelectOption
                  v-for="(cls, index) in copyContentSchool
                    ? schedules.classesPerSchool.find((i: any) => i.schoolId === copyContentSchool).classes.filter((cl: any) => cl.seriesId === selectedClassroom)
                    : schedules.classesPerSchool.at(0).classes.filter((cl: any) => cl.seriesId === selectedClassroom)"
                  :key="index"
                  :value="cls"
                >
                  {{ cls.classroomName }}
                </IonSelectOption>
              </IonSelect>
            </IonCardContent>

            <div class="ion-margin" style="display: flex; justify-content: right;">
              <IonButton color="danger" size="small" style="text-transform: capitalize;" @click="setCopyModalOpen(!isCopyModalOpen)">
                Cancelar
              </IonButton>
              <!-- @TODO: construir função para ao clicar em salvar inserir uma copia do registro de conteúdo atual para a turma selecionada -->
              <IonButton color="secondary" size="small" style="text-transform: capitalize;" @click="setCopyModalOpen(!isCopyModalOpen)">
                Salvar
              </IonButton>
            </div>
          </div>
        </IonCard>
      </IonModal>
    </div>
    <IonCard v-else color="info">
      <IonCardHeader>
        <IonCardTitle>Selecione a turma e dia</IonCardTitle>
      </IonCardHeader>

      <IonCardContent> Ola, porfavor selecione qual a turma e em qual dia você dejesa fazer o preenchimento </IonCardContent>
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
  /* --min-width: 350px; */
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

/*
.custom-floating-label::part(label) {
  transform: translateY(10%) scale(1);
} */

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
</style>
