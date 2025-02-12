<script setup lang="ts">
import ContentLayout from '@/components/theme/ContentLayout.vue'
import { IonButton, IonCol, IonIcon, IonRow, IonSearchbar, IonTitle, IonContent, IonSelect, IonItem, IonSelectOption, IonLabel, IonModal, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle,
  IonAccordion, IonAccordionGroup, IonDatetime } from '@ionic/vue'
import { add, arrowDown, arrowUp, businessOutline, calendar, calendarOutline, menu, people, peopleOutline, personOutline, school } from 'ionicons/icons'
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

import TeacherService from '../services/TeacherService'
import ScheduleService from '../services/ScheduleService'
import SeriesService from '../services/SeriesService'

// import Calendar from '@/components/Calendar.vue'
type Occupation = {
  school?: string;
  series?: string[];
}

const ocupation = ref<Occupation[]>([])
const filteredOcupation = ref<Occupation>({})

const teacherService = new TeacherService()
const scheduleService = new ScheduleService()
const seriesService = new SeriesService()

const router = useRouter()

const userid = ref<string>('')
const teacherid = ref<string>('')
const schools = ref<string[]>([])
const series = ref<string[]>([])
const isModalSchool = ref(false)
const isModalSerie = ref(false)
const setModalSchool = (open: boolean) => (isModalSchool.value = open)
const setModalSerie = (open: boolean) => (isModalSerie.value = open)
const filterCollapse = ref(true)
const accordionGroup = ref(true)
const toggleAccordion = () => {
  if (!accordionGroup.value) {
    return;
  }
  const nativeEl = (accordionGroup.value as any).$el

  if (nativeEl.value === 'first') {
    nativeEl.value = undefined
    filterCollapse.value = !filterCollapse.value
  } else {
    nativeEl.value = 'first';
    filterCollapse.value = !filterCollapse.value
  }
}

// Carregar dados ao montar o componente
onMounted(async () => {
  await loadDataTeacher(),
  await loadDataSchools(),
  await loadDataSchedule(),
  await loadDataSeries()
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
  } catch (error) {
    console.error('Erro ao carregar os dados:', error)
  }
}

async function loadDataSchedule(): Promise<void> {
  try {
    const data = await scheduleService.listClassrooms(teacherid.value)
    schools.value = Array.from(data) || []
    // console.log('Dados carregados loadDataSchedule:', data)
  } catch (error) {
    console.error('Erro ao carregar os dados:', error)
  }
}

async function loadDataSeries(): Promise<void> {
  try {
    const data = await seriesService.listSeriesAndSchools(schools.value)
    ocupation.value = data || []
    // console.log('Dados loadDataSeries:', data)
  } catch (error) {
    console.error('Erro ao carregar os dados:', error)
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
</script>

<template>
  <ContentLayout class="ion-no-margin ion-no-padding">
    <ion-content class="ion-no-margin ion-no-padding" style="--background: rgba(249, 211, 227, 0.2); height: 49%; padding-bottom: 10rem;" v-show="filterCollapse">
      <ion-text color="secondary">
        <h3 class="">Filtros</h3>
        <p class="">Preencha os filtros abaixo para uma mais acertiva</p>
      </ion-text>
      <!-- <div class="sidebyside">
        <ion-button id="schools-modal" expand="full" color="primary" class="item ion-no-padding ion-no-margin" size="large" style="font-size: small;" @click="setModalSchool(true)">
          <ion-icon slot="start" :icon="businessOutline"></ion-icon>
        </ion-button>
        <ion-button id="schools-modal" expand="full" color="primary" class="company-icon ion-no-padding ion-no-margin" size="large" style="font-size: small;" @click="setModalSchool(true)">
          <ion-icon slot="start" :icon="businessOutline"></ion-icon>
          <ion-text style="font-size: x-small;">
            {{ filteredOcupation.school || 'Selecione uma escola' }}
          </ion-text>
        </ion-button>
      </div> -->
      <IonItem style="--min-height: 57px;" color="primary" @click="setModalSchool(true)">
        <ion-label>{{ filteredOcupation.school || 'Selecione uma escola' }}</ion-label>
        <IonIcon slot="start" :icon="businessOutline" />
      </IonItem>
      <ion-item style="--min-height: 57px;" color="tertiary" @click="setModalSerie(true)">
        <ion-label>{{ filteredOcupation.series ? filteredOcupation.series.join(', ') : 'Selecione uma série' }}</ion-label>
        <IonIcon slot="start" :icon="peopleOutline" />
      </ion-item>
      <!-- <ion-button id="schools-modal" expand="full" color="primary" class="ion-no-padding ion-no-margin" size="large" style="font-size: small;" @click="setModalSchool(true)">
          <ion-icon slot="start" :icon="businessOutline"></ion-icon>
            {{ filteredOcupation.school || 'Selecione uma escola' }}
        </ion-button>
        <ion-button id="open-modal2" expand="full" color="tertiary" class="ion-no-padding ion-no-margin" size="large" style="font-size: small;" @click="setModalSerie(true)">
          <ion-icon slot="start" :icon="peopleOutline"></ion-icon>
          {{ filteredOcupation.series ? filteredOcupation.series.join(', ') : 'Selecione uma série' }}
        </ion-button> -->
    </ion-content>
    <ion-modal :is-open="isModalSchool" :initial-breakpoint="0.6" :breakpoints="[0, 0.6, 0.87]" @ionModalDidDismiss="setModalSchool(false)">
      <div class="block">
      <ion-list v-for="(school, i) in ocupation" :key="i" :value="school.school">
        <ion-item @click="setSchool(school)">
        <ion-label>{{ school.school }}</ion-label>
        </ion-item>
      </ion-list>
      </div>
    </ion-modal>
    <ion-modal :is-open="isModalSerie" :initial-breakpoint="0.6" :breakpoints="[0, 0.6, 0.87]" @ionModalDidDismiss="setModalSerie(false)">
      <div class="block">
        <ion-list v-for="(serie, i) in ocupation" :key="i" :value="serie.series ? serie.series[i] : ''">
          <ion-item @click="setSerie(serie)">
            <ion-label>{{ serie.series ? serie.series[i] : '' }}</ion-label>
          </ion-item>
        </ion-list>
      </div>
    </ion-modal>
    <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0px' }">
      <ion-text v-show="!filterCollapse" color="secondary">
      <h3>Filtros</h3>
      </ion-text>
      <ion-button color="tertiary" @click="toggleAccordion()" :style="{ marginTop: filterCollapse ? '-23px' : '0px' }">
      <ion-icon slot="icon-only" :icon="filterCollapse ? arrowUp : arrowDown"></ion-icon>
      </ion-button>
    </div>
    <ion-accordion-group ref="accordionGroup" :multiple="true" :value="['first']">
      <ion-accordion value="first">
        <div class="ion-no-padding" slot="content">
          <!-- <ion-item>
            <ion-icon color="secondary" aria-hidden="true" :icon="calendarOutline" slot="start"></ion-icon>
            <ion-label>Registro de conteúdo diário</ion-label>
          </ion-item> -->
          <ion-card>
            <ion-card-header>
              <ion-card-title color="secondary">
              </ion-card-title>
            </ion-card-header>    
            <ion-card-content>
              <ion-datetime display-format="DD/MM/YYYY" placeholder="Selecione a data"></ion-datetime>
            </ion-card-content>
          </ion-card>
        </div>
      </ion-accordion>
    </ion-accordion-group>

    <!-- <IonItem color="primary">
      <IonIcon slot="start" class="cursor-pointer" :icon="businessOutline" />
      <IonSelect :model="schools" toggle-icon="disable" interface="action-sheet" placeholder="Selecione a escola">
        <IonSelectOption v-for="(school, i) in ocupation" :key="i" :value="school.school">
          {{ school.school }}
        </IonSelectOption>
      </IonSelect>
    </IonItem>
    <IonItem color="tertiary">
      <IonIcon slot="start" class="cursor-pointer" :icon="peopleOutline"/>
      <IonSelect :model="series" toggle-icon="disable" interface="modal" placeholder="Selecione a série">
        <IonSelectOption v-for="(serie, i) in ocupation" :key="i" :value="serie.series ? serie.series[i] : ''">
          {{ serie.series ? serie.series[i] : '' }}
        </IonSelectOption>
      </IonSelect>
    </IonItem> -->


  </ContentLayout>
</template>

<style scoped>
/* .sidebyside {
  display: flex;
  flex-direction: row;
  align-content: stretch;
  width: 100%;
} */
/* .item {
  flex-grow: 1;
}
.company-icon {
  flex-grow: 11;
} */
/* .filter-collapse ion-button ion-icon {
  margin-inline: -9em 0.3em;
} */
/* .filter-collapse ion-button {
  --padding-top: 14px;
  --padding-bottom: 14px;
} */
ion-accordion-group {
  margin-inline: 0 !important;
  margin-top: 16px;
}
toggle-icon {
  color: white;
}
ion-card {
  margin-inline: 0 !important;
}
</style>
