<script setup lang="ts">
import ContentLayout from '@/components/theme/ContentLayout.vue'
import EduCalendar from '@/components/WeekDayPicker.vue'
import { hexToRgb } from '@/utils/hex-to-rgb'
import { IonAccordion, IonAccordionGroup, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonChip, IonCol, IonContent, IonDatetime, IonIcon, IonItem, IonLabel, IonModal, IonRow, IonSearchbar, IonSelect, IonSelectOption, IonTextarea, IonTitle } from '@ionic/vue'
import { add, arrowDown, arrowUp, businessOutline, calendar, calendarOutline, menu, people, peopleOutline, personOutline, save, school } from 'ionicons/icons'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import ClassroomService from '../services/ClassroomService'
import ContentService from '../services/ContentService'
import ScheduleService from '../services/ScheduleService'
import SeriesService from '../services/SeriesService'
import TeacherService from '../services/TeacherService'

// import Calendar from '@/components/Calendar.vue'
interface Occupation {
  school?: string
  series?: string[]
}

interface Registro {
  classroom: string
  date: string
  description: string
  disciplines: string[]
  bnccs: string[]
}

interface Registro {
  classroom: string
  date: string
  description: string
  disciplines: string[]
  bnccs: string[]
}

const ocupation = ref<Occupation[]>([])
const filteredOcupation = ref<Occupation>({})

const teacherService = new TeacherService()
const scheduleService = new ScheduleService()
const seriesService = new SeriesService()
const classroomService = new ClassroomService()
const contentService = new ContentService()

const router = useRouter()

const userid = ref<string>('')
const teacherid = ref<string>('')
const schools = ref<string[]>([])
const series = ref<string[]>([])

const selectedClassroom = ref('352a5857-193f-4672-9abf-c5302afd1c37')
const schedules = ref()
const copyContentSchool = ref()
const copyContentClass = ref()

const currentClassroom = ref()

const isFilterCollapse = ref(true)
const isCopyModalOpen = ref(false)
const isModalSchool = ref(false)
const isModalSerie = ref(false)
const isDayNoneRecord = ref(true)
const isFormAvailable = ref(false)
const setModalSchool = (open: boolean) => (isModalSchool.value = open)
const setModalSerie = (open: boolean) => (isModalSerie.value = open)
const setFilterCollapse = (open: boolean) => (isFilterCollapse.value = open)
const setDayNoneRecord = (open: boolean) => (isDayNoneRecord.value = open)
const setFormAvailable = (open: boolean) => (isFormAvailable.value = open)
const accordionGroup = ref(true)

const colorStyle = ref({
  primary: getComputedStyle(document.documentElement).getPropertyValue('--ion-color-primary').trim(),
  secondary: getComputedStyle(document.documentElement).getPropertyValue('--ion-color-secondary').trim(),
  tertiary: getComputedStyle(document.documentElement).getPropertyValue('--ion-color-tertiary').trim(),
})

const selectedDayInfo = ref()
const isAccordionContent = ref(false)
const isSaveTeacherContent = ref(false)
const setSaveTeacherContent = (open: boolean) => (isSaveTeacherContent.value = open)
const setCopyModalOpen = (open: boolean) => (isCopyModalOpen.value = open)
const registros = ref<Registro[]>([])

onMounted(async () => {
  await loadDataTeacher(),
  await loadDataSchools(),
  await loadDataSchedule(),
  await loadDataSeries()
  schedules.value = await scheduleService.getSchedules(teacherid.value)
  currentClassroom.value = await classroomService.getClassroom()
  await loadDataContent()
})

async function loadDataTeacher(): Promise<void> {
  const storedData = localStorage.getItem('userLocal')
  // console.log('storedData:', JSON.parse(storedData || '{}').id)

  if (storedData) {
    userid.value = JSON.parse(storedData).id
  }
}

// Função para carregar os dados usando o serviço
async function loadDataSchools(): Promise<void> {
  try {
    const data = await teacherService.listTeacherId(userid.value)
    teacherid.value = data.id || ''
    // console.log('Dados carregados loadDataSchools:', data)
  }
  catch (error) {
    console.error('Erro ao carregar os dados:', error)
  }
}

async function loadDataSchedule(): Promise<void> {
  try {
    const data = await scheduleService.listClassrooms(teacherid.value)
    schools.value = Array.from(data) || []
    // console.log('Dados carregados loadDataSchedule:', data)
  }
  catch (error) {
    console.error('Erro ao carregar os dados:', error)
  }
}

async function loadDataSeries(): Promise<void> {
  try {
    const data = await seriesService.listSeriesAndSchools(schools.value)
    ocupation.value = data || []

    console.log('Dados loadDataSeries:', data)
  }
  catch (error) {
    console.error('Erro ao carregar os dados:', error)
  }
}

async function loadDataContent(): Promise<void> {
  try {
    const currentDate = '2025-02-25'
    const data = await contentService.listContentByToday(teacherid.value, currentDate)
    registros.value = data || []
    addFirstRecord()
  } catch (error) {
    console.error('Erro ao carregar os dados:', error);
  }
}

function setSchool(school: Occupation): void {
  filteredOcupation.value.school = school.school
  console.log('setSchool:', filteredOcupation.value.school)
  setModalSchool(false)
}

function setSerie(serie: Occupation): void {
  filteredOcupation.value.series = serie.series
  console.log('setSerie:', filteredOcupation.value.series)
  setModalSerie(false)
}

function addFirstRecord(): void {
  setDayNoneRecord(!isDayNoneRecord.value)
  setFormAvailable(true)
  console.log('addFirstContent ', isDayNoneRecord.value, isFormAvailable.value)
}

function saveTeacherContent(): void {
  console.log('saveTeacherContent ', isAccordionContent.value)
  setFormAvailable(false)
  isAccordionContent.value = true
  console.log('saveTeacherContent updated ', isAccordionContent.value)
}
</script>

<template>
  <ContentLayout>
    <IonContent v-show="isFilterCollapse" class="" style="--background: rgba(249, 211, 227, 0.3); height: 235px;" :style="`box-shadow: inset 0 0 10px ${hexToRgb(colorStyle.primary, '0.2')}`">
      <ion-text color="secondary">
        <h4>Filtros</h4>
        <p style="font-size: 14px;">
          Preencha os filtros abaixo para uma mais acertiva
        </p>
      </ion-text>
      <IonItem style="--min-height: 57px;" color="primary" @click="setModalSchool(true)">
        <IonLabel>{{ filteredOcupation.school || 'Selecione uma escola' }}</IonLabel>
        <IonIcon slot="start" :icon="businessOutline" />
      </IonItem>
      <IonItem style="--min-height: 57px;" color="tertiary" @click="setModalSerie(true)">
        <IonLabel>{{ filteredOcupation.series ? filteredOcupation.series.join(', ') : 'Selecione uma série' }}</IonLabel>
        <IonIcon slot="start" :icon="peopleOutline" />
      </IonItem>
    </IonContent>
    <!-- <pre>
      filteredOcupation: {{ filteredOcupation }}
    </pre> -->
    <IonModal :is-open="isModalSchool" :initial-breakpoint="0.6" :breakpoints="[0, 0.6, 0.87]" @ion-modal-did-dismiss="setModalSchool(false)">
      <div class="block">
        <ion-list v-for="(sch, i) in ocupation" :key="i" :value="sch.school">
          <IonItem @click="setSchool(sch)">
            <IonLabel>{{ sch.school }}</IonLabel>
          </IonItem>
        </ion-list>
      </div>
    </IonModal>

    <IonModal :is-open="isModalSerie" :initial-breakpoint="0.6" :breakpoints="[0, 0.6, 0.87]" @ion-modal-did-dismiss="setModalSerie(false)">
      <div class="block">
        <ion-list v-for="(serie, i) in ocupation" :key="i" :value="serie.series ? serie.series[i] : ''">
          <IonItem @click="setSerie(serie)">
            <IonLabel>{{ serie.series ? serie.series[i] : '' }}</IonLabel>
          </IonItem>
        </ion-list>
      </div>
    </IonModal>

    <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: isFilterCollapse ? '0' : '5px' }">
      <ion-text v-show="!isFilterCollapse" color="secondary">
        <div class="ion-margin-horizontal">
          <span style="margin-right: 10px; color: var(--ion-color-accent)">{{ filteredOcupation.school }}</span>
          <small style="color: var(--ion-color-accent)">{{ filteredOcupation.series ? filteredOcupation.series.join(', ') : '' }}</small>
        </div>
      </ion-text>
      <IonButton color="tertiary" :style="{ marginTop: isFilterCollapse ? '-20px' : '2px', marginLeft: isFilterCollapse ? '21.9em' : 'auto', marginRight: isFilterCollapse ? '10px' : '10px' }" @click="setFilterCollapse(!isFilterCollapse)">
        <IonIcon slot="icon-only" :icon="isFilterCollapse ? arrowUp : arrowDown" />
      </IonButton>
    </div>
    <pre>
      registros: {{ registros }}
      <!-- schedules: {{ schedules }} -->
    </pre>
    <h3>
      <ion-text color="secondary" class="ion-content ion-padding-bottom" style="display: flex; align-items: center;">
        <IonIcon color="secondary" style="margin-right: 1%;" aria-hidden="true" :icon="calendarOutline" />
        Lançamento diário
      </ion-text>
    </h3>
    <EduCalendar v-model="selectedDayInfo" :teacher-id="teacherid" />

    <IonCard v-show="isDayNoneRecord" class="ion-no-padding ion-margin-top">
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
          <IonButton class="ion-margin" color="tertiary" @click="addFirstRecord()">
            <IonIcon slot="icon-only" :icon="add" />
          </IonButton>
        </div>
      </div>
    </IonCard>

    <IonCard v-show="isFormAvailable" class="ion-no-padding ion-margin-top">
      <IonCardHeader color="secondary">
        <div style="display: flex; align-items: center; height: 10px;">
          <IonIcon :icon="save" size="small" style="margin-right: 8px;" />
          <IonCardTitle style="font-size: medium;">
            Registro de conteúdo
          </IonCardTitle>
        </div>
      </IonCardHeader>

      <div v-if="true">
        <IonCardContent class="ion-padding-top">
          <IonSelect
            class="ion-select-card-content"
            label="Disciplina"
            label-placement="floating"
            fill="outline"
            cancel-text="Cancelar"
            :multiple="true"
          >
            <IonSelectOption value="Matemática">
              Matemática
            </IonSelectOption>
            <IonSelectOption value="Português">
              Português
            </IonSelectOption>
            <IonSelectOption value="Ciências">
              Ciências
            </IonSelectOption>
            <IonSelectOption value="História">
              História
            </IonSelectOption>
            <IonSelectOption value="Geografia">
              Geografia
            </IonSelectOption>
            <IonSelectOption value="Educação Física">
              Educação Física
            </IonSelectOption>
            <IonSelectOption value="Artes">
              Artes
            </IonSelectOption>
            <IonSelectOption value="Inglês">
              Inglês
            </IonSelectOption>
          </IonSelect>
          <br>
          <IonTextarea
            label="Conteúdo"
            label-placement="floating"
            fill="outline"
            placeholder="Digite o conteúdo"
            style="--color: var(--ion-color-secondary);"
            :auto-grow="true"
            value="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris tellus sem, auctor accumsan egestas sed, venenatis at ex. Nam consequat ex odio."
          />
          <br>
          <IonSelect
            class="ion-select-card-content"
            label="Currículos"
            label-placement="floating"
            fill="outline"
            cancel-text="Cancelar"
            style="--color: var(--ion-color-secondary);"
            :multiple="true"
          >
            <IonSelectOption>EF02LP00PE - Leitura e interpretação textual bas</IonSelectOption>
            <IonSelectOption>EF02LP01PE - Uso do material didático na sala d</IonSelectOption>
          </IonSelect>
          <div class="ion-margin-top" style="display: flex; justify-content: right;">
            <IonButton color="danger" size="small" style="text-transform: capitalize;">
              Cancelar
            </IonButton>
            <IonButton color="secondary" size="small" style="text-transform: capitalize;" @click="saveTeacherContent()">
              Salvar
            </IonButton>
          </div>
        </IonCardContent>
      </div>
    </IonCard>

    <IonAccordionGroup v-if="isAccordionContent || registros.length > 0" class="ion-content" expand="inset" :multiple="true" :value="registros">
      <IonAccordion v-for="(registro, index) in registros" :key="index" style="margin-bottom: 5px;" :value="registro.classroom">
        <IonItem slot="header" color="secondary">
          <IonLabel>{{ registro.classroom }} - {{ new Date(registro.date).toLocaleDateString('pt-br') }}</IonLabel>
        </IonItem>
        <div slot="content" style="margin: 10px 0 0 10px;">
          <IonChip v-for="(disciplina, i) in registro.disciplines" :key="i" style="margin-left: 0px; margin-right: 10px;" color="secondary">
            {{ disciplina }}
          </IonChip>
          <div style="margin: 10px 10px 10px 5px;">
            <ion-text color="secondary" class="ion-text-justify">
              {{ registro.description }}
            </ion-text>
          </div>
          <IonChip v-for="(bncc, i) in registro.bnccs" :key="i" style="margin-left: 0px;  margin-right: 10px; font-size: 12px;" color="tertiary">
            {{ bncc }}
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
      <div style="display: flex; justify-content: flex-end;">
        <IonButton color="tertiary" @click="setFormAvailable(!isFormAvailable)"><IonIcon slot="icon-only" :icon="add" /></IonButton>
      </div>
    </IonAccordionGroup>

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

        <div v-if="false">
          <IonCardContent class="ion-padding-top">
            <IonSelect
              class="ion-select-card-content"
              label="Disciplina"
              label-placement="floating"
              fill="outline"
              cancel-text="Cancelar"
              :multiple="true"
            >
              <IonSelectOption value="Matemática">
                Matemática
              </IonSelectOption>
              <IonSelectOption value="Português">
                Português
              </IonSelectOption>
              <IonSelectOption value="Ciências">
                Ciências
              </IonSelectOption>
              <IonSelectOption value="História">
                História
              </IonSelectOption>
              <IonSelectOption value="Geografia">
                Geografia
              </IonSelectOption>
              <IonSelectOption value="Educação Física">
                Educação Física
              </IonSelectOption>
              <IonSelectOption value="Artes">
                Artes
              </IonSelectOption>
              <IonSelectOption value="Inglês">
                Inglês
              </IonSelectOption>
            </IonSelect>
            <br>
            <IonTextarea
              label="Conteúdo"
              label-placement="floating"
              fill="outline"
              placeholder="Digite o conteúdo"
              style="--color: var(--ion-color-secondary);"
              :auto-grow="true"
              value="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris tellus sem, auctor accumsan egestas sed, venenatis at ex. Nam consequat ex odio."
            />
            <br>
            <IonSelect
              class="ion-select-card-content"
              label="Currículos"
              label-placement="floating"
              fill="outline"
              cancel-text="Cancelar"
              style="--color: var(--ion-color-secondary);"
              :multiple="true"
            >
              <IonSelectOption>EF02LP00PE - Leitura e interpretação textual bas</IonSelectOption>
              <IonSelectOption>EF02LP01PE - Uso do material didático na sala d</IonSelectOption>
            </IonSelect>
            <div class="ion-margin-top" style="display: flex; justify-content: right;">
              <IonButton color="danger" size="small" style="text-transform: capitalize;">
                Cancelar
              </IonButton>
              <IonButton color="secondary" size="small" style="text-transform: capitalize;" @click="saveTeacherContent()">
                Salvar
              </IonButton>
            </div>
          </IonCardContent>
        </div>
      </IonCard>
    </IonModal>
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
