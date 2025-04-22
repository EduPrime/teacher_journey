<script setup lang="ts">
import EduFilterProfile from '@/components/FilterProfile.vue'
import ContentLayout from '@/components/theme/ContentLayout.vue'
import { IonAccordion, IonAccordionGroup, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonItem, IonLabel, IonSegment, IonSegmentButton, IonText, IonChip } from '@ionic/vue'
import { alertOutline, barChartOutline, calendarClearOutline, calendarOutline, checkmarkOutline, helpOutline, lockClosedOutline, shapes } from 'ionicons/icons'

import { DateTime } from 'luxon'

import { computed, ref, watch, onMounted } from 'vue'

import EnrollmentService from '../services/EnrollmentService'
import StageService from '../services/StageService'

import type { DescriptiveStudent } from '../types/types'

const enrollmentService = new EnrollmentService()
const stageService = new StageService()

const eduFProfile = ref()
const students = ref<DescriptiveStudent[] | undefined>(undefined)
const selectedTad = ref('inicial')
const screenWidth = ref(window.innerWidth)

const stage1Start = ref<string|null>(null)
const stage2Start = ref<string|null>(null)
const stage3End = ref<string|null>(null)
const isStage2Enabled = computed(() => stage2Start.value ? DateTime.local() >= DateTime.fromISO(stage2Start.value).startOf('day') : false)
const isStage3Enabled = computed(() => stage3End.value ? DateTime.local() >= DateTime.fromISO(stage3End.value).startOf('day') : false)

watch(eduFProfile, async (newValue) => {
  if (newValue?.teacherId) {
    const raw = await enrollmentService.getClassroomStudents(newValue.classroomId)
    students.value = raw.map(e => ({
      name: e.name,
      situation: e.situation,
      disability: (e.student?.disability?.length ?? 0) > 0,
      status: e.situation !== 'CURSANDO' ? 'BLOQUEADO' : 'INCOMPLETO',
      createdAt: e.createdAt,
      updatedAt: e.updatedAt
    }))
  } else {
    students.value = undefined
  }
})

const getStatusColor = computed(() => (status: string) => {
  switch (status) {
    case 'CONCLUÍDO':
      return 'success'
    case 'INCOMPLETO':
      return 'danger'
    case 'PENDENTE':
      return 'warning'
    case 'BLOQUEADO':
      return 'light'
  }
})

const getStatusIcon = computed(() => (status: string) => {
  switch (status) {
    case 'CONCLUÍDO':
      return checkmarkOutline
    case 'INCOMPLETO':
      return helpOutline
    case 'PENDENTE':
      return alertOutline
    case 'BLOQUEADO':
      return lockClosedOutline
  }
})

function luxonFormatDate(dateString: string) {
  const date = DateTime.fromISO(dateString)
  return date.setLocale('pt-BR').toFormat('dd MMM yyyy')
}

// tab content (simulada)
// Observa o segment selecionado para disparar a animação de passagem de tela

watch(selectedTad, (newValue) => {
  if (newValue) {
    simulateSlide()
    // @TODO:  Adicionar atribuição para que toda vez que alterar o valor do segment, alterar o valor da "etapa" do registro do parecer descritivo
  }
})

const contents = ['Page 1', 'Page 2', 'Page 3']
const currentIndex = ref(0)
const currentContent = ref(contents[currentIndex.value])

const slidingOut = ref(false)
const slidingIn = ref(false)

function simulateSlide() {
  slidingOut.value = true

  setTimeout(() => {
    // Update content
    currentIndex.value = (currentIndex.value + 1) % contents.length
    currentContent.value = contents[currentIndex.value]

    slidingOut.value = false
    slidingIn.value = true

    setTimeout(() => {
      slidingIn.value = false
    }, 300) // Entry animation duration
  }, 300) // Exit animation duration
}

onMounted(async () => {
  try {
    const stages = await stageService.getAllStages()
    const st1 = stages?.find(s => s.numberStage === 1)
    if (st1) stage1Start.value = st1.startDate
    stage2Start.value = DateTime.fromISO('2025-06-30').toISO()
    const st3 = stages?.find(s => s.numberStage === 3)
    if (st3) stage3End.value = st3.endDate
  } catch (error) {
    console.error('Erro ao obter etapas', error)
  }
})
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

    <div v-if="students">
      <div class="ion-content">
        <IonSegment v-model="selectedTad" mode="ios" value="disabled">
          <!-- @TODO: O Botão "INICIAL" sempre deve estar habilitado -->

          <IonSegmentButton value="inicial">
            <IonLabel>Inicial</IonLabel>
          </IonSegmentButton>

          <!-- @TODO: O disabled ta comparando a data atual com uma iserida ( acredito que podemos usar a data de inicio do 2º Bimetre para o caso "PARCIAL" ) -->

          <IonSegmentButton :disabled="!isStage2Enabled" value="parcial">
            <IonLabel>Parcial</IonLabel>
          </IonSegmentButton>

          <!-- @TODO: O disabled ta comparando a data atual com uma iserida ( acredito que podemos usar a data de encerramento do 3º Bimetre para o caso "FINAL" ) -->

          <IonSegmentButton :disabled="!isStage3Enabled" value="final">
            <IonLabel>Final</IonLabel>
          </IonSegmentButton>
        </IonSegment>
      </div>

      <div
        class="content"
        :class="{ 'slide-out': slidingOut, 'slide-in': slidingIn }"
      >
        <IonAccordionGroup class="ion-content" expand="inset">
          <IonAccordion v-for="(s, i) in students" :key="i" :value="`${i}`" class="no-border-accordion">
            <IonItem slot="header" style="--padding-top: 0; --padding-bottom: 0; align-items: center;">
              <IonIcon
                :color="getStatusColor(s.status)" style="margin-right: 6px; font-size: 24px;"
                :icon="getStatusIcon(s.status)"
              />
              <IonLabel style="display: flex; align-items: center; width: 100%;">
                <IonText color="secondary" :style="s.situation !== 'CURSANDO' ? 'opacity: 0.4;' : ''">
                  <b>{{ s.name }}</b>
                </IonText>
                <IonChip v-if="s.disability" class="ion-no-margin" style="margin: auto 0 auto auto;" mode="md" color="tertiary">
                  PCD
                </IonChip>
                <IonChip v-if="s.situation !== 'CURSANDO'" style="margin: auto 0 auto auto;" mode="md">
                  {{ s.situation.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()) }}
                </IonChip>
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
                <!-- @TODO: esse atributo adicionado ao IonTextArea pode fazer o textarea crescer automaticamente mas eu não gostei do efeito ( testem se vcs gostam )  oninput="this.style.minHeight = `${ (100 + this.value.length / (2)) <= 230 ? 100 + this.value.length / (2) : 230}px`" -->
                <ion-textarea
                  color="secondary"
                  class="ion-content"
                  label="Parecer Descritivo"
                  label-placement="floating"
                  fill="outline"
                  :style="`min-height: ${screenWidth <= 480 ? 100 : 180}px;`"
                  placeholder="Enter text"
                  :counter="true"
                  auto-grow
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
                  Atualizado em {{ luxonFormatDate(s.updatedAt) }}
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
      </div>

      <!-- <IonSegmentView :disabled="true">
        <IonSegmentContent id="inicial">
          inicial
        </IonSegmentContent>
        <IonSegmentContent id="parcial">
          parcial
        </IonSegmentContent>
        <IonSegmentContent id="final" :disabled="true">
          final
        </IonSegmentContent>
      </IonSegmentView> -->
    </div>

    <div v-else class="ion-padding-top">
      <IonCard color="info">
        <IonCardHeader>
          <IonCardTitle>Selecione a escola, turma e disciplina</IonCardTitle>
        </IonCardHeader>

        <IonCardContent>
          <IonText>
            Olá, por favor selecione qual a <b>escola</b> e <b>turma</b> na qual deseja fazer o lançamento do parecer descritivo
            conceituais
          </IonText>
        </IonCardContent>
      </IonCard>
    </div>

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
.content {
  position: absolute;
  width: 100%;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

/* Slide out to left */
.slide-out {
  transform: translateX(-100%);
}

/* Slide in from right */
.slide-in {
  transform: translateX(100%);
  animation: slide-in 0.3s ease forwards;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

ion-segment {
  --background: rgba(var(--ion-color-tertiary-rgb), 0.15);
  --color: var(--ion-color-secondary);
}

/*  */

  ion-segment-view {
    height: 150px;
  }

  ion-segment-content {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  ion-segment-content:nth-of-type(1) {
    background: lightpink;
  }
  ion-segment-content:nth-of-type(2) {
    background: lightblue;
  }
  ion-segment-content:nth-of-type(3) {
    background: lightgreen;
  }

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
