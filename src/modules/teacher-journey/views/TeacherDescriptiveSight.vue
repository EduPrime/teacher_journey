<script setup lang="ts">
import EduFilterProfile from '@/components/FilterProfile.vue'
import ContentLayout from '@/components/theme/ContentLayout.vue'
import { 
  IonAccordion, 
  IonAccordionGroup, 
  IonButton, 
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardTitle, 
  IonIcon, 
  IonItem, 
  IonLabel, 
  IonSegment, 
  IonSegmentButton, 
  IonTextarea, 
  IonText, 
  IonChip, 
  IonAlert, 
  IonLoading, 
  IonGrid, 
  IonRow, 
  IonCol, 
  IonToolbar,
  IonModal,
  IonFooter
} from '@ionic/vue'
import { 
  alertOutline, 
  barChartOutline, 
  calendarClearOutline, 
  calendarOutline, 
  checkmarkOutline, 
  helpOutline, 
  lockClosedOutline, 
  shapes, 
  warningOutline 
} from 'ionicons/icons'

import { DateTime } from 'luxon'

import { computed, ref, watch, onMounted } from 'vue'

import EnrollmentService from '../services/EnrollmentService'
import StageService from '../services/StageService'
import showToast from '@/utils/toast-alert'
import FeedbackService from '../services/FeedbackService'
import RegisteredGradeService from '../services/RegisteredGradeService'

import type { DescriptiveStudent } from '../types/types'
import type { RegisteredToSave } from '../types/types'
import type { StudentFeedback } from '@prisma/client'

interface SightStudent extends DescriptiveStudent {
  studentId: string
  classroomId: string
  enrollmentId: string
  schoolId: string
  disciplineId: string
  feedbackId?: string | null
  initialFeedback: string
  partialFeedback: string
  finalFeedback: string
  isSaved: boolean
}

const saveModal = ref(false)
const deleteModal = ref(false)

const currentStudentToSave = ref<SightStudent | null>(null)
const currentStudentToDelete = ref<SightStudent | null>(null)

const enrollmentService = new EnrollmentService()
const stageService = new StageService()
const feedbackService = new FeedbackService()
const registeredGradeService = new RegisteredGradeService()

const eduFProfile = ref()
const students = ref<SightStudent[] | undefined>(undefined)
const selectedTad = ref('inicial')
const screenWidth = ref(window.innerWidth)
const isFinalizedGlobal = ref(false)
const isAnySaved = computed(() => students.value?.some(s => s.isSaved) ?? false)

function isEdited(s: SightStudent): boolean { 
  return s.initialFeedback !== '' || s.partialFeedback !== '' || s.finalFeedback !== ''
}

function onFeedbackEdit(s: SightStudent) {
  if (s.isSaved) s.isSaved = false
}

function getFeedbackIcon(s: SightStudent) {
  if (s.situation !== 'CURSANDO') return lockClosedOutline
  if (s.isSaved) return checkmarkOutline
  if (isEdited(s)) return alertOutline
  return helpOutline
}

function getFeedbackColor(s: SightStudent) {
  if (s.situation !== 'CURSANDO') return 'light'
  if (s.isSaved) return 'success'
  if (isEdited(s)) return 'warning'
  return 'danger'
}

watch(students, () => {
  isFinalizedGlobal.value = false
}, { deep: true })

const stage1Start = ref<string|null>(null)
const stage2Start = ref<string|null>(null)
const stage3End = ref<string|null>(null)
const stage1EndDate = ref<string|null>(null)
const stage2EndDate = ref<string|null>(null)
const stage3EndDate = ref<string|null>(null)

const isStage2Enabled = computed(() => stage2Start.value ? DateTime.local() >= DateTime.fromISO(stage2Start.value).startOf('day') : false)
const isStage3Enabled = computed(() => stage3End.value ? DateTime.local() >= DateTime.fromISO(stage3End.value).startOf('day') : false)

const isLoading = ref(false)
const showAlert = ref(false)
const registeredToSave = ref<RegisteredToSave>({ isCompleted: false, teacherId: '', classroomId: '', disciplineId: '', stageId: '' })
const isContentFilled = computed(() => students.value?.some(s => s.initialFeedback.trim() !== '' || s.partialFeedback.trim() !== '' || s.finalFeedback.trim() !== '') ?? false)
const computedRegisteredFeedback = computed(() => ({ isCompleted: registeredToSave.value.isCompleted, teacherId: eduFProfile.value?.teacherId || '', classroomId: eduFProfile.value?.classroomId || '', disciplineId: eduFProfile.value?.disciplineId || '', stageId: selectedTad.value }))

// calcula dias até fim da etapa baseada em selectedTad
const diffDays = computed(() => {
  const edStr =
    selectedTad.value === 'inicial' ? stage1EndDate.value :
    selectedTad.value === 'parcial' ? stage2EndDate.value :
    stage3EndDate.value
  if (!edStr) return NaN
  const now = new Date()
  const dl = new Date(edStr)
  if (isNaN(dl.getTime())) return NaN
  return Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
})

watch(eduFProfile, async (newValue) => {
  if (newValue?.teacherId) {
    const raw = await enrollmentService.getClassroomStudents(newValue.classroomId)

    const enrichedStudents: SightStudent[] = raw.map(e => ({
      name: e.name,
      situation: e.situation,
      disability: (e.student?.disability?.length ?? 0) > 0,
      status: e.situation !== 'CURSANDO' ? 'BLOQUEADO' : 'INCOMPLETO',
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      studentId: e.studentId,
      classroomId: newValue.classroomId,
      enrollmentId: e.id,
      schoolId: e.schoolId,
      disciplineId: newValue.disciplineId ?? '',
      initialFeedback: '',
      partialFeedback: '',
      finalFeedback: '',
      isSaved: false
    }))

    const feedbackPromises = enrichedStudents.map(s => 
      feedbackService.getStudentFeedback(s.enrollmentId)
        .then(feedback => {
          if (feedback?.length) {
            s.feedbackId = feedback[0].id
            s.initialFeedback = feedback[0].initialFeedback || ''
            s.partialFeedback = feedback[0].partialFeedback || ''
            s.finalFeedback = feedback[0].finalFeedback || ''
            s.isSaved = true
            s.createdAt = feedback[0].createdAt ? new Date(feedback[0].createdAt).toISOString() : s.createdAt
            s.updatedAt = feedback[0].updatedAt ? new Date(feedback[0].updatedAt).toISOString() : s.updatedAt
          }
          return s;
        })
    );
    
    await Promise.all(feedbackPromises)
    
    students.value = enrichedStudents
  } else {
    students.value = undefined;
  }
})

function luxonFormatDate(dateString: string) {
  const date = DateTime.fromISO(dateString)
  if (!date.isValid) return ''
  return date.setLocale('pt-BR').toFormat('dd MMM yyyy')
}

function luxonFormatDateTime(dateString: string) {
  if (!dateString) return ''

  const dt = DateTime.fromISO(dateString, { zone: 'utc' }).toLocal()

  console.log("Date:", dt)

  if (!dt.isValid) { 
    console.log("Invalid date:", dt) 
    return '' 
  } 
  return dt.setLocale('pt-BR').toFormat('dd/MM/yyyy HH:mm')
}

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
    stage2Start.value = DateTime.fromISO('2025-04-30').toISO()
    stage1EndDate.value = stage2Start.value
    const st3 = stages?.find(s => s.numberStage === 3)
    if (st3) { 
      stage3End.value = st3.endDate
      stage2EndDate.value = stage3End.value
      stage3EndDate.value = DateTime.fromISO('2025-12-30').toISO()
    }
  } catch (error) {
    console.error('Erro ao obter etapas', error)
  }
})

async function saveFeedback(s: SightStudent) {
  
  console.log('s', s)

  try {
    const payload = {
      studentId: s.studentId,
      enrollmentId: s.enrollmentId,
      schoolId: s.schoolId,
      disciplineId: s.disciplineId,
      teacherId: eduFProfile.value.teacherId,
      initialFeedback: s.initialFeedback,
      partialFeedback: s.partialFeedback,
      finalFeedback: s.finalFeedback
    }
    const records = await feedbackService.upsertStudentFeedback(payload)
  
    s.feedbackId = records[0].id
    s.initialFeedback = records[0].initialFeedback || ''
    s.partialFeedback = records[0].partialFeedback || ''
    s.finalFeedback = records[0].finalFeedback || ''
    s.updatedAt = records[0].updatedAt ? new Date(records[0].updatedAt).toISOString() : s.updatedAt
    s.createdAt = records[0].createdAt ? new Date(records[0].createdAt).toISOString() : s.createdAt
    s.isSaved = true
    isFinalizedGlobal.value = false
    
    students.value = [...students.value!]
    showToast('Parecer salvo com sucesso', 'top', 'success')
  } catch (error) {
    console.error(error)
    showToast('Erro ao salvar parecer', 'top', 'danger')
  }
}

async function clearFeedback(s: SightStudent) {
  try {
    if (s.feedbackId) await feedbackService.softDeleteStudentFeedback(s.feedbackId, eduFProfile.value?.teacherId)
    s.initialFeedback = ''
    s.partialFeedback = ''
    s.finalFeedback = ''
    s.isSaved = false
    showToast('Parecer limpo com sucesso', 'top', 'success')
    console.debug(`[Clear] Student ${s.studentId}: isSaved=${s.isSaved}, isFinalizedGlobal=${isFinalizedGlobal.value}`)
  } catch (error) {
    console.error(error)
    showToast('Erro ao limpar parecer', 'top', 'danger')
  }
}

function preRegisterFeedback() {
  showAlert.value = true
}

async function registerGrades(itemToSave: RegisteredToSave) {
  showAlert.value = false
  isLoading.value = true

  try {
    itemToSave.isCompleted = isContentFilled.value

    await registeredGradeService.upsertRegisteredGrade(itemToSave)

    showToast(
      isContentFilled.value
        ? 'Registro de parecer descritivo finalizado com sucesso!'
        : 'Registro de parecer descritivo incompletas finalizado com sucesso!',
      'top',
      'success',
    )
  }
  catch (error: any) {
    console.error('Erro ao registrar notas:', error)
    showToast('Ocorreu um erro ao finalizar o registro de notas.', 'top', 'danger')
  }
  finally {
    isLoading.value = false
  }
}

/*async function registerFeedback() {
  try {
    isLoading.value = true
    await registeredGradeService.upsertRegisteredGrade({
      teacherId: eduFProfile.value?.teacherId || '',
      isCompleted: true,
      classroomId: eduFProfile.value?.classroomId,
      disciplineId: eduFProfile.value?.disciplineId || '',
      stageId: selectedTad.value
    })
    isFinalizedGlobal.value = true
    students.value?.forEach(s => s.isSaved = false)
    showToast('Parecer finalizado com sucesso', 'top', 'success')
    showAlert.value = false
    console.debug(`[Finalize] isFinalizedGlobal=${isFinalizedGlobal.value}, anySaved=${students.value?.some(s => s.isSaved)}`)
  } catch (error) {
    console.error(error)
    showToast('Erro ao finalizar parecer', 'top', 'danger')
  } finally {
    isLoading.value = false
  }
}*/
</script>

<template>
  <ContentLayout>
    <EduFilterProfile :discipline="false" @update:filtered-ocupation="($event) => eduFProfile = $event" />
    <div v-if="diffDays <= 10 && diffDays >= 0 && !computedRegisteredFeedback.isCompleted && students" class="warning-close-information">
      <div class="title">Registro irregular</div>
      <div class="text">
        <IonIcon :icon="warningOutline" style="margin-right:6px" />
        <div>
          Olá professor, o prazo de preenchimento da etapa {{ selectedTad === 'inicial' ? 'inicial' : selectedTad === 'parcial' ? 'parcial' : 'final' }} se encerra em {{ diffDays }} {{ diffDays === 1 ? 'dia' : 'dias' }}, caso haja pendência será necessária entrar em contato com a secretaria.
        </div>
      </div>
    </div>
    <div v-else-if="diffDays < 0 && !computedRegisteredFeedback.isCompleted && students" class="warning-close-information">
      <div class="title">Registro irregular</div>
      <div class="text">
        <IonIcon :icon="warningOutline" style="margin-right:6px" />
        <div>
          Olá professor, o prazo de preenchimento da etapa {{ selectedTad === 'inicial' ? 'inicial' : selectedTad === 'parcial' ? 'parcial' : 'final' }} se encerrou, entre em contato com a secretaria para resolver as pendências.
        </div>
      </div>
    </div>
    <h3>
      <IonText color="secondary" class="ion-content ion-padding-bottom" style="display: flex; align-items: center;">
        <IonIcon color="secondary" style="margin-right: 10px;" aria-hidden="true" :icon="shapes" />
        <span>Parecer descritivo</span>
      </IonText>
    </h3>

    <div v-if="students">
      <div class="ion-content">
        <IonSegment v-model="selectedTad" mode="ios" value="disabled">

          <IonSegmentButton value="inicial">
            <IonLabel>Inicial</IonLabel>
          </IonSegmentButton>

          <IonSegmentButton :disabled="!isStage2Enabled" value="parcial">
            <IonLabel>Parcial</IonLabel>
          </IonSegmentButton>

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
                :color="getFeedbackColor(s)" style="margin-right: 6px; font-size: 24px;"
                :icon="getFeedbackIcon(s)"
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
                  {{ selectedTad === 'inicial' ? 'Descrição inicial da criança' : selectedTad === 'parcial' ? 'Descrição parcial da criança' : 'Descrição final da criança' }}
                </IonText>
              </IonCardHeader>
              <div class="ion-margin-top">
                <IonTextarea
                  v-if="selectedTad === 'inicial'"
                  v-model="s.initialFeedback"
                  color="secondary"
                  class="ion-content"
                  label="Parecer Descritivo Inicial"
                  label-placement="floating"
                  fill="outline"
                  :style="`min-height: ${screenWidth <= 480 ? 100 : 180}px;`"
                  placeholder="Enter text"
                  :counter="true"
                  auto-grow
                  :maxlength="800"
                  @ionInput="onFeedbackEdit(s)"
                  :disabled="s.situation !== 'CURSANDO'"
                />
                <IonTextarea
                  v-if="selectedTad === 'parcial'"
                  v-model="s.partialFeedback"
                  color="secondary"
                  class="ion-content"
                  label="Parecer Descritivo Parcial"
                  label-placement="floating"
                  fill="outline"
                  :style="`min-height: ${screenWidth <= 480 ? 100 : 180}px;`"
                  placeholder="Enter text"
                  :counter="true"
                  auto-grow
                  :maxlength="800"
                  @ionInput="onFeedbackEdit(s)"
                  :disabled="s.situation !== 'CURSANDO'"
                />
                <IonTextarea
                  v-if="selectedTad === 'final'"
                  v-model="s.finalFeedback"
                  color="secondary"
                  class="ion-content"
                  label="Parecer Descritivo Final"
                  label-placement="floating"
                  fill="outline"
                  :style="`min-height: ${screenWidth <= 480 ? 100 : 180}px;`"
                  placeholder="Enter text"
                  :counter="true"
                  auto-grow
                  :maxlength="800"
                  @ionInput="onFeedbackEdit(s)"
                  :disabled="s.situation !== 'CURSANDO'"
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
                  Atualizado em {{ luxonFormatDateTime(s.updatedAt) }}
                </IonText>
              </IonCardHeader>
              <div class="ion-content" style="display: flex; justify-content: right; padding-top: 8px; padding-bottom: 8px;">
                <IonButton v-if="s.situation === 'CURSANDO'" color="danger" size="small" style="margin-right: 8px; text-transform: capitalize;" :disabled="!(isEdited(s) || s.isSaved)" @click="() => { currentStudentToDelete = s; deleteModal = true; }">Limpar</IonButton>
                <IonButton v-if="s.situation === 'CURSANDO'" color="secondary" size="small" style="text-transform: capitalize;" :disabled="!isEdited(s) || s.isSaved" @click="() => { currentStudentToSave = s; saveModal = true; }">Salvar</IonButton>
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

    <IonModal id="save-modal" :is-open="saveModal" trigger="open-custom-dialog" @ion-modal-did-dismiss="saveModal = false">
      <IonCard class="ion-no-margin">
        <IonCardHeader>
          <IonCardTitle>Salvar notas</IonCardTitle>
          <IonText class="ion-padding-vertical">
            Tem certeza de que deseja salvar as alterações para este aluno?
          </IonText>
          <div style="display: flex;">
            <IonButton
              size="small"
              style="margin-left: auto; margin-right: 8px; text-transform: capitalize;"
              color="medium"
              @click="() => {
                saveModal = false
              }"
            >
              Cancelar
            </IonButton>
            <IonButton
              style="text-transform: capitalize;"
              size="small"
              color="secondary"
              @click="() => {
                if (currentStudentToSave) {
                  saveFeedback(currentStudentToSave)
                }
                saveModal = false
              }"
            >
              Confirmar
            </IonButton>
          </div>
        </IonCardHeader>
      </IonCard>
    </IonModal>

    <IonModal id="delete-modal" :is-open="deleteModal" trigger="open-custom-dialog" @ion-modal-did-dismiss="deleteModal = false">
      <IonCard class="ion-no-margin">
        <IonCardHeader>
          <IonCardTitle>Limpar notas</IonCardTitle>
          <IonText class="ion-padding-vertical">
            Tem certeza de que deseja limpar as notas?
          </IonText>
          <div style="display: flex;">
            <IonButton
              size="small"
              style="margin-left: auto; margin-right: 8px; text-transform: capitalize;"
              color="secondary"
              @click="() => {
                deleteModal = false
              }"
            >
              Cancelar
            </IonButton>
            <IonButton
              style="text-transform: capitalize;"
              size="small"
              color="danger"
              @click="() => {
                if (currentStudentToDelete) {
                  clearFeedback(currentStudentToDelete)
                }
                deleteModal = false
              }"
            >
              Confirmar
            </IonButton>
          </div>
        </IonCardHeader>
      </IonCard>
    </IonModal>

    <IonAlert
      class="custom-alert"
      :is-open="showAlert"
      :header="isContentFilled ? 'Deseja finalizar os registros?' : 'Registros incompletos'"
      :sub-header="isContentFilled ? '' : 'Deseja finalizar assim mesmo?'"
      :buttons="[
        {
          text: 'Não',
          role: 'cancel',
          cssClass: 'alert-button-cancel',
          handler: () => { showAlert = false },
        },
        {
          text: 'Sim',
          cssClass: 'alert-button-confirm',
          handler: () => registerGrades(computedRegisteredFeedback),
        },
      ]"
    />
    <IonLoading :is-open="isLoading" message="Finalizando..." spinner="crescent" class="custom-save-loading"/>
    <template #footer>
      <IonFooter translucent>
        <IonToolbar>
          <IonGrid>
            <IonRow>
              <IonCol size="12">
                <IonButton
                  :disabled="isLoading || !isAnySaved"
                  color="secondary"
                  expand="full"
                  @click="preRegisterFeedback"
                >
                  Finalizar
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonToolbar>
      </IonFooter>
    </template>
  </ContentLayout>
</template>

<style scoped>
ion-modal {
    --width: fit-content;
    --min-width: 250px;
    --height: fit-content;
    --border-radius: 6px;
    --box-shadow: 0 28px 48px rgba(0, 0, 0, 0.4);
  }

  ion-modal h1 {
    margin: 20px 20px 10px 20px;
  }

  ion-modal ion-icon {
    margin-right: 6px;

    width: 48px;
    height: 48px;

    padding: 4px 0;

    color: #aaaaaa;
  }

  ion-modal .wrapper {
    margin-bottom: 10px;
  }

  .warning-close-information {
  margin: 10px;
  background-color: #F5C228E6;
  color: #000000B3;
  padding: 15px;
  border-radius: 6px;

  .title {
    font-size: 17px;
    font-weight: 600;
    margin-bottom: 8px;
    padding-left: 32px; 
  }

  .text {
    display: flex;
    align-items: flex-start;
    font-weight: 300;
    font-size: 14px;
    line-height: 1.4;
    gap: 8px;
    padding-left: 4px;
    flex-wrap: wrap;

    ion-icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      margin-top: 3px;
    }

    div {
      flex: 1;
      text-align: left;
    }
  }
}

.content {
  position: absolute;
  width: 100%;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
  padding-bottom: 80px;
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
