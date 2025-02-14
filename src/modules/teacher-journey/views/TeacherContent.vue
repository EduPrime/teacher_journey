<script setup lang="ts">
import ContentLayout from '@/components/theme/ContentLayout.vue'
import EduCalendar from '@/components/WeekDayPicker.vue'
import { IonButton, IonCol, IonIcon, IonRow, IonSearchbar, IonTitle, IonContent, IonSelect, IonItem, IonSelectOption, IonLabel, IonModal, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle,
  IonAccordion, IonAccordionGroup, IonDatetime, IonChip, IonTextarea } from '@ionic/vue'
import { add, arrowDown, arrowUp, businessOutline, calendar, calendarOutline, menu, people, peopleOutline, personOutline, save, school } from 'ionicons/icons'
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
const selectedDayInfo = ref()
const accordionContent = ref(false)

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

function addFirstContent(): void {
  console.log('addFirstContent ', accordionContent.value)
  accordionContent.value = true
}
</script>

<template>
  <ContentLayout>
    <ion-content class="" style="--background: rgba(249, 211, 227, 0.3); height: 235px;" v-show="filterCollapse">
      <ion-text color="secondary">
        <h4>Filtros</h4>
        <p style="font-size: 14px;">Preencha os filtros abaixo para uma mais acertiva</p>
      </ion-text>      
      <IonItem style="--min-height: 57px;" color="primary" @click="setModalSchool(true)">
        <ion-label>{{ filteredOcupation.school || 'Selecione uma escola' }}</ion-label>
        <IonIcon slot="start" :icon="businessOutline" />
      </IonItem>
      <ion-item style="--min-height: 57px;" color="tertiary" @click="setModalSerie(true)">
        <ion-label>{{ filteredOcupation.series ? filteredOcupation.series.join(', ') : 'Selecione uma série' }}</ion-label>
        <IonIcon slot="start" :icon="peopleOutline" />
      </ion-item>
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

    <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: filterCollapse ? '0' : '5px' }">
      <ion-text v-show="!filterCollapse" color="secondary">
        <h3>Filtros</h3>
      </ion-text>
      <ion-button color="tertiary" @click="toggleAccordion()" :style="{ marginTop: filterCollapse ? '-20px' : '2px', marginLeft: filterCollapse ? '21.9em' : 'auto', marginRight: filterCollapse ? '10px' : '10px' }">
        <ion-icon slot="icon-only" :icon="filterCollapse ? arrowUp : arrowDown"></ion-icon>
      </ion-button>
    </div>

    <ion-accordion-group ref="accordionGroup" class="ion-content" :multiple="true" :value="['first']">
      <ion-accordion value="first">
        <div class="" slot="content">
          <div style="margin: 0 0 5px 0">
            <ion-text color="secondary" style="display: flex; align-items: center;">
              <ion-icon color="secondary" size="small" style="margin-right: 1%;" aria-hidden="true" :icon="calendarOutline"></ion-icon>
                Registro de conteúdo diário
            </ion-text>
          </div>
          <edu-calendar v-model="selectedDayInfo" />
        </div>
      </ion-accordion>
    </ion-accordion-group>
    

    <ion-card v-if="!accordionContent" class="ion-no-padding ion-margin-top">
      <ion-card-header color="secondary">
        <div style="display: flex; align-items: center; height: 10px;">
          <ion-icon :icon="save" size="small" style="margin-right: 8px;"/>
            <ion-card-title style="font-size: medium;">Registro de conteúdo</ion-card-title>
        </div>
      </ion-card-header>

      <div v-if="accordionContent">
        <ion-card-content class="">
          <ion-text color="secondary">
            Notamos que você ainda não fez o registro diário, toque no botão abaixo para iniciar.
          </ion-text>
        </ion-card-content>
  
        <div style="display: flex; justify-content: flex-end;">
          <ion-button class="ion-margin" color="tertiary" @click="addFirstContent()">
            <ion-icon slot="icon-only" :icon="add"></ion-icon>
          </ion-button>
        </div>
      </div>
      
      <div v-if="!accordionContent">
        <ion-card-content class="ion-padding-top">
            <ion-select
              class="ion-select-card-content"
              label="Disciplina"
              label-placement="floating"
              fill="outline"
              cancel-text="Cancelar"
              :multiple="true"              
            >
                <ion-select-option value="Matemática">Matemática</ion-select-option>
                <ion-select-option value="Português">Português</ion-select-option>
                <ion-select-option value="Ciências">Ciências</ion-select-option>
                <ion-select-option value="História">História</ion-select-option>
                <ion-select-option value="Geografia">Geografia</ion-select-option>
                <ion-select-option value="Educação Física">Educação Física</ion-select-option>
                <ion-select-option value="Artes">Artes</ion-select-option>
                <ion-select-option value="Inglês">Inglês</ion-select-option>
            </ion-select>
            <br>
            <ion-textarea
              label="Conteúdo"
              label-placement="floating"
              fill="outline"
              placeholder="Digite o conteúdo"
              style="--color: var(--ion-color-secondary);"
              :auto-grow="true"
              value="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris tellus sem, auctor accumsan egestas sed, venenatis at ex. Nam consequat ex odio."
            >
            </ion-textarea>
            <br>
            <ion-select
              class="ion-select-card-content"
              label="Currículos"
              label-placement="floating"
              fill="outline"
              cancel-text="Cancelar"
              style="--color: var(--ion-color-secondary);"
              :multiple="true"
            >
              <ion-select-option>EF02LP00PE - Leitura e interpretação textual bas</ion-select-option>
              <ion-select-option>EF02LP01PE - Uso do material didático na sala d</ion-select-option>
            </ion-select>
        </ion-card-content>
  
        <div style="display: flex; justify-content: flex-end;">
          <ion-button class="ion-margin" color="tertiary" @click="addFirstContent()">
            <ion-icon slot="icon-only" :icon="add"></ion-icon>
          </ion-button>
        </div>
      </div>
    </ion-card>
    
    <ion-content>
      <ion-accordion-group v-if="accordionContent" expand="inset" :multiple="true" :value="['first']">
        <ion-accordion value="first">
          <ion-item slot="header" color="secondary">
            <ion-label>6 Ano - "A" - 06/01/2025</ion-label>
          </ion-item>
          <div class="ion-padding" slot="content">
            <ion-chip color="secondary">item.chip1</ion-chip>
            <br>
            <ion-text color="secondary">First Content</ion-text>
            <br>
            <ion-chip color="tertiary">item.chip2</ion-chip>
            <ion-chip color="tertiary">item.chip3</ion-chip>
            <br>
            <div style="display: flex; justify-content: right; margin-top: 20px;">
              <ion-button color="tertiary" size="small">Copiar</ion-button>
              <ion-button color="secondary" size="small">Editar</ion-button>
              <ion-button color="warning" size="small">Excluir</ion-button>
            </div>
          </div>
        </ion-accordion>
        <ion-accordion value="second">
          <ion-item slot="header" color="rose">
            <ion-label>Second Accordion</ion-label>
          </ion-item>
          <div class="ion-padding" slot="content">Second Content</div>
        </ion-accordion>
        <ion-accordion value="third">
          <ion-item slot="header" color="rose">
            <ion-label>Third Accordion</ion-label>
          </ion-item>
          <div class="ion-padding" slot="content">Third Content</div>
        </ion-accordion>
      </ion-accordion-group>
    </ion-content>

    
<!-- 
    <ion-accordion-group v-if="accordionContent" class="content-accondion-style rose accordioncontent" expand="inset" :multiple="true">
      <ion-accordion v-for="(item, index) in mockData" :key="index" :value="item.value">
        <ion-item slot="header" color="rose">
          <ion-label>{{ item.label }}</ion-label>
        </ion-item>
        <div class="ion-padding" slot="content">
          <ion-chip color="primary">{{ item.chip1 }}</ion-chip>
          <ion-chip color="secondary">{{ item.chip2 }}</ion-chip>
          <ion-chip color="tertiary">{{ item.chip3 }}</ion-chip>
          <ion-text>{{ item.text }}</ion-text>
          <div style="display: flex; justify-content: space-between; margin-top: 10px;">
            <ion-button color="tertiary">Copiar</ion-button>
            <ion-button color="secondary">Editar</ion-button>
            <ion-button color="warning">Excluir</ion-button>
          </div>
        </div>
      </ion-accordion>
    </ion-accordion-group> -->
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
toggle-icon {
  color: white;
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

/* .ion-select-card-content::part(placeholder) {
  border-radius: 16px;
  padding: 2px 8px;
  display: inline-block;
} */

.ion-select-card-content::part(icon) {
  color: var(--ion-color-secondary);
  opacity: 1;
}
.content-accondion-style {
  --ion-color-rose: #fecdd3;
  --ion-color-rose-rgb: 254, 205, 211;
  --ion-color-rose-contrast: #000000;
  --ion-color-rose-contrast-rgb: 0, 0, 0;
  --ion-color-rose-shade: #e0b4ba;
  --ion-color-rose-tint: #fed2d7;
}

.rose {
  --ion-color-base: var(--ion-color-rose);
  --ion-color-base-rgb: var(--ion-color-rose-rgb);
  --ion-color-contrast: var(--ion-color-rose-contrast);
  --ion-color-contrast-rgb: var(--ion-color-rose-contrast-rgb);
  --ion-color-shade: var(--ion-color-rose-shade);
  --ion-color-tint: var(--ion-color-rose-tint);
}

ion-accordion-group.accordioncontent div[slot='content'] {
  background: rgba(var(--ion-color-rose-rgb), 0.25);
}
</style>
