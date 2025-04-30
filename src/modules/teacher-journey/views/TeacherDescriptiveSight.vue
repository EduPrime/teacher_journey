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
  warningOutline,
  checkmarkCircleOutline
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

const DEFAULT_DISCIPLINE_ID = '6b0cb88e-80a1-4185-a0b4-b625bb26b5fc'

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
  initialCreatedAt: string | null
  initialUpdatedAt: string | null
  partialCreatedAt: string | null
  partialUpdatedAt: string | null
  finalCreatedAt: string | null
  finalUpdatedAt: string | null
  firstSavedAt: string | null
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
const selectedTad = ref<'inicial' | 'parcial' | 'final'>('inicial')
const screenWidth = ref(window.innerWidth)
const isFinalizedGlobal = ref(false)
const hasLaunched = ref(false)

const registeredToSave = ref<RegisteredToSave>({ isCompleted: false, teacherId: '', classroomId: '', disciplineId: '', stageId: '', areGradesReleased: false })

const isContentFilled = computed(() => students.value?.some(s => s.initialFeedback.trim() !== '' || s.partialFeedback.trim() !== '' || s.finalFeedback.trim() !== '') ?? false)
const computedRegisteredFeedback = computed(() => ({
  isCompleted: registeredToSave.value.isCompleted,
  teacherId: eduFProfile.value?.teacherId || '',
  classroomId: eduFProfile.value?.classroomId || '',
  disciplineId: eduFProfile.value?.disciplineId?.trim() ? eduFProfile.value.disciplineId : DEFAULT_DISCIPLINE_ID,
  stageId: selectedTad.value === 'inicial' ? stage1Id.value : selectedTad.value === 'parcial' ? stage2Id.value : stage3Id.value,
  areGradesReleased: registeredToSave.value.areGradesReleased
}))

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

const isStageCompleted = computed(() => {
  if (!students.value) return false
  const cursando = students.value.filter(s => s.situation === 'CURSANDO')
  if (selectedTad.value === 'inicial') return cursando.every(s => s.initialFeedback.trim() !== '')
  if (selectedTad.value === 'parcial') return cursando.every(s => s.partialFeedback.trim() !== '')
  return cursando.every(s => s.finalFeedback.trim() !== '')
})

watch(students, () => {
  isFinalizedGlobal.value = false
}, { deep: true })

const stage1Start = ref<string|null>(null)
const stage2Start = ref<string|null>(null)
const stage3End = ref<string|null>(null)
const stage1EndDate = ref<string|null>(null)
const stage2EndDate = ref<string|null>(null)
const stage3EndDate = ref<string|null>(null)
const stage1Id = ref<string>('')
const stage2Id = ref<string>('')
const stage3Id = ref<string>('')

const isStage2Enabled = computed(() => stage2Start.value ? DateTime.local() >= DateTime.fromISO(stage2Start.value).startOf('day') : false)
const isStage3Enabled = computed(() => stage3End.value ? DateTime.local() >= DateTime.fromISO(stage3End.value).startOf('day') : false)

const isLoading = ref(false)
const showAlert = ref(false)

const isAnySaved = computed(() => students.value?.some(s => s.isSaved) ?? false)

const editModalOpen = ref(false)
const editingStudent = ref<SightStudent | null>(null)
const editingField = ref<'initialFeedback'|'partialFeedback'|'finalFeedback'>('initialFeedback')
const editTemporary = ref('')

// abre o modal para o aluno e campo corretos
function openEditModal(student: SightStudent, field: typeof editingField.value) {
  editingStudent.value = student
  editingField.value = field
  editTemporary.value = student[field] || ''
  editModalOpen.value = true
}

// reseta tudo quando o modal fechar
function closeEditModal() {
  editModalOpen.value = false
  editingStudent.value = null
  editingField.value = 'initialFeedback'
  editTemporary.value = ''
}

// limpa o campo temporário sem fechar o modal
function clearEditTemporary() {
  editTemporary.value = ''
}

// aplica a edição e fecha
function confirmEditModal() {
  if (!editingStudent.value) return
  editingStudent.value[editingField.value] = editTemporary.value
  onFeedbackEdit(editingStudent.value)
  closeEditModal()
}

function isEdited(s: SightStudent): boolean { 
  return s.initialFeedback !== '' || s.partialFeedback !== '' || s.finalFeedback !== ''
}

function onFeedbackEdit(s: SightStudent) {
  if (s.isSaved) s.isSaved = false
}

function getFeedbackIcon(s: SightStudent) {
  if (s.situation !== 'CURSANDO') return lockClosedOutline
  const feedback = selectedTad.value === 'inicial'
    ? s.initialFeedback
    : selectedTad.value === 'parcial'
      ? s.partialFeedback
      : s.finalFeedback
  return feedback.trim() ? checkmarkOutline : helpOutline
}

function getFeedbackColor(s: SightStudent) {
  if (s.situation !== 'CURSANDO') return 'light'
  const feedback = selectedTad.value === 'inicial'
    ? s.initialFeedback
    : selectedTad.value === 'parcial'
      ? s.partialFeedback
      : s.finalFeedback
  return feedback.trim() ? 'success' : 'danger'
}

async function loadRegisteredGrade() {
  const stageId = selectedTad.value === 'inicial' ? stage1Id.value : selectedTad.value === 'parcial' ? stage2Id.value : stage3Id.value
  const registered = await registeredGradeService.getRegistered(
    eduFProfile.value.classroomId,
    eduFProfile.value.disciplineId?.trim() || DEFAULT_DISCIPLINE_ID,
    stageId
  )
  if (registered) {
    registeredToSave.value.isCompleted = registered.isCompleted
    registeredToSave.value.areGradesReleased = registered.areGradesReleased
    if (registered.areGradesReleased) hasLaunched.value = true
  }
}

watch(eduFProfile, async (newValue) => {
  if (newValue?.teacherId) {
    const raw = await enrollmentService.getClassroomStudents(newValue.classroomId)

    const enrichedStudents: SightStudent[] = raw.map(e => {
      const prev = students.value?.find(s => s.enrollmentId === e.id);
      return {
        name: e.name,
        situation: e.situation,
        disability: (e.student?.disability?.length ?? 0) > 0,
        status: e.situation !== 'CURSANDO' ? 'BLOQUEADO' : 'INCOMPLETO',
        createdAt: prev?.firstSavedAt ?? '',
        updatedAt: prev?.updatedAt ?? e.updatedAt,
        studentId: e.studentId,
        classroomId: newValue.classroomId,
        enrollmentId: e.id,
        schoolId: e.schoolId,
        disciplineId: newValue.disciplineId?.trim() ? newValue.disciplineId : DEFAULT_DISCIPLINE_ID,
        initialFeedback: prev?.initialFeedback ?? '',
        initialCreatedAt: prev?.initialCreatedAt ?? null,
        initialUpdatedAt: prev?.initialUpdatedAt ?? null,
        partialFeedback: prev?.partialFeedback ?? '',
        partialCreatedAt: prev?.partialCreatedAt ?? null,
        partialUpdatedAt: prev?.partialUpdatedAt ?? null,
        finalFeedback: prev?.finalFeedback ?? '',
        finalCreatedAt: prev?.finalCreatedAt ?? null,
        finalUpdatedAt: prev?.finalUpdatedAt ?? null,
        isSaved: prev?.isSaved ?? false,
        firstSavedAt: prev?.firstSavedAt ?? null
      }
    })

    const feedbackPromises = enrichedStudents.map(s => 
      feedbackService.getStudentFeedback(s.enrollmentId)
        .then(feedback => {
          if (feedback?.length) {
            s.feedbackId = feedback[0].id
            s.initialFeedback = feedback[0].initialFeedback || ''
            s.initialCreatedAt = feedback[0].initialCreatedAt ? new Date(feedback[0].initialCreatedAt).toISOString() : s.initialCreatedAt
            s.initialUpdatedAt = feedback[0].initialUpdatedAt ? new Date(feedback[0].initialUpdatedAt).toISOString() : s.initialUpdatedAt
            s.partialFeedback = feedback[0].partialFeedback || ''
            s.partialCreatedAt = feedback[0].partialCreatedAt ? new Date(feedback[0].partialCreatedAt).toISOString() : s.partialCreatedAt
            s.partialUpdatedAt = feedback[0].partialUpdatedAt ? new Date(feedback[0].partialUpdatedAt).toISOString() : s.partialUpdatedAt
            s.finalFeedback = feedback[0].finalFeedback || ''
            s.finalCreatedAt = feedback[0].finalCreatedAt ? new Date(feedback[0].finalCreatedAt).toISOString() : s.finalCreatedAt
            s.finalUpdatedAt = feedback[0].finalUpdatedAt ? new Date(feedback[0].finalUpdatedAt).toISOString() : s.finalUpdatedAt
            s.updatedAt = feedback[0].updatedAt ? new Date(feedback[0].updatedAt).toISOString() : s.updatedAt
            // record first save timestamp
            s.firstSavedAt = feedback[0].createdAt ? new Date(feedback[0].createdAt).toISOString() : null
          }
          return s;
        })
    );
    
    await Promise.all(feedbackPromises)
    
    students.value = enrichedStudents

    await loadRegisteredGrade()
  } else {
    students.value = undefined
  }
})

function luxonFormatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const dt = DateTime.fromISO(dateString, { zone: 'utc' }).toLocal()
  if (!dt.isValid) return ''
  return dt.setLocale('pt-BR').toFormat('dd/MM/yyyy')
}

/*function luxonFormatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return ''
  // treat timestamp as UTC, then shift to local zone
  const dt = DateTime.fromISO(dateString, { zone: 'utc' }).toLocal()
  if (!dt.isValid) return ''
  return dt.setLocale('pt-BR').toFormat('dd/MM/yyyy HH:mm')
}*/

function luxonFormatDateTime(dateString: string | null | undefined): string {
    if (!dateString) return "";

    try {
        // 1. Corrige caso a string não tenha indicador de timezone (assume UTC se não tiver 'Z' ou offset)
        const normalizedDateString = dateString.includes('Z') || dateString.match(/[+-]\d{2}:\d{2}$/) 
            ? dateString 
            : dateString + 'Z';

        // 2. Converte para Date object 
        const date = new Date(normalizedDateString);
        if (isNaN(date.getTime())) return ""; 

        // 3. Ajusta para o horário de Brasília (UTC-3)
        const offsetBrasilia = -3; 
        date.setHours(date.getHours() + offsetBrasilia);

        // 4. Formata manualmente no padrão dd/MM/yyyy HH:mm
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
        console.error("Erro ao formatar data:", error);
        return "";
    }
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

    const st1 = stages?.find(s => Number(s.numberStage) === 1)
    if (st1) {
      stage1Start.value = st1.startDate
      stage1Id.value = st1.id
    }

    const st2 = stages?.find(s => Number(s.numberStage) === 2)
    if (st2) {
      stage2Start.value = DateTime.fromISO('2025-04-27').toISO()
      stage2Id.value = st2.id
    }
    stage1EndDate.value = stage2Start.value

    const st3 = stages?.find(s => Number(s.numberStage) === 3)
    if (st3) {
      stage3End.value = st3.endDate
      stage2EndDate.value = st3.endDate
      stage3EndDate.value = DateTime.fromISO('2025-12-30').toISO()
      stage3Id.value = st3.id
    }
  } catch (error) {
    console.error('Erro ao obter etapas', error)
  }
  if (eduFProfile.value?.teacherId) {
    await loadRegisteredGrade()
  }
})

async function saveFeedback(s: SightStudent) {
  
  console.log('s', s)

  try {
    const payload = {
      studentId: s.studentId,
      enrollmentId: s.enrollmentId,
      schoolId: s.schoolId,
      disciplineId: s.disciplineId?.trim() ? s.disciplineId : DEFAULT_DISCIPLINE_ID,
      teacherId: eduFProfile.value.teacherId,
      initialFeedback: s.initialFeedback,
      partialFeedback: s.partialFeedback,
      finalFeedback: s.finalFeedback
    }
    const records = await feedbackService.upsertStudentFeedback(payload)
  
    s.feedbackId = records[0].id
    s.initialFeedback = records[0].initialFeedback || ''
    s.initialCreatedAt = records[0].initialCreatedAt ? new Date(records[0].initialCreatedAt).toISOString() : s.initialCreatedAt
    s.initialUpdatedAt = records[0].initialUpdatedAt ? new Date(records[0].initialUpdatedAt).toISOString() : s.initialUpdatedAt
    s.partialFeedback = records[0].partialFeedback || ''
    s.partialCreatedAt = records[0].partialCreatedAt ? new Date(records[0].partialCreatedAt).toISOString() : s.partialCreatedAt
    s.partialUpdatedAt = records[0].partialUpdatedAt ? new Date(records[0].partialUpdatedAt).toISOString() : s.partialUpdatedAt
    s.finalFeedback = records[0].finalFeedback || ''
    s.finalCreatedAt = records[0].finalCreatedAt ? new Date(records[0].finalCreatedAt).toISOString() : s.finalCreatedAt
    s.finalUpdatedAt = records[0].finalUpdatedAt ? new Date(records[0].finalUpdatedAt).toISOString() : s.finalUpdatedAt
    s.updatedAt = records[0].updatedAt ? new Date(records[0].updatedAt).toISOString() : s.updatedAt
    s.isSaved = true
    isFinalizedGlobal.value = false
    
    students.value = [...students.value!]
    registeredToSave.value.areGradesReleased = false
    showToast('Parecer salvo com sucesso', 'top', 'success')
  } catch (error) {
    console.error(error)
    showToast('Erro ao salvar parecer', 'top', 'danger')
  }
}

async function clearFeedback(s: SightStudent) {
  try {
    let updated: any[] = []
    if (s.feedbackId) {
      updated = await feedbackService.softDeleteStudentFeedback(
        s.feedbackId,
        eduFProfile.value?.teacherId,
        selectedTad.value
      )
    }
    if (selectedTad.value === 'inicial') {
      s.initialFeedback = ''
      s.initialUpdatedAt = updated[0]?.initialUpdatedAt
        ? new Date(new Date(updated[0].initialUpdatedAt).getTime() + 3 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
    } else if (selectedTad.value === 'parcial') {
      s.partialFeedback = ''
      s.partialUpdatedAt = updated[0]?.partialUpdatedAt
        ? new Date(new Date(updated[0].partialUpdatedAt).getTime() + 3 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
    } else {
      s.finalFeedback = ''
      s.finalUpdatedAt = updated[0]?.finalUpdatedAt
        ? new Date(new Date(updated[0].finalUpdatedAt).getTime() + 3 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
    }
    s.isSaved = false
    registeredToSave.value.areGradesReleased = false
    students.value = [...students.value!]
    showToast('Parecer limpo com sucesso', 'top', 'success')
  } catch (error) {
    console.error(error)
    showToast('Erro ao limpar parecer', 'top', 'danger')
  }
}

function preRegisterFeedback() {
  showAlert.value = true
}

async function registerGrades() {
  showAlert.value = false
  isLoading.value = true

  try {
    
    registeredToSave.value.isCompleted = isStageCompleted.value
    registeredToSave.value.areGradesReleased = true
    
    const payload = computedRegisteredFeedback.value

    await registeredGradeService.upsertRegisteredGrade(payload)
    hasLaunched.value = true

    showToast(
      isStageCompleted.value
        ? 'Registro de parecer descritivo finalizado com sucesso!'
        : 'Registro de parecer descritivo com notas faltantes finalizado com sucesso!',
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
    <div v-if="diffDays <= 10 && diffDays >= 0 && !computedRegisteredFeedback.isCompleted && !hasLaunched && students" class="warning-close-information">
      <div class="title">Registro irregular</div>
      <div class="text">
        <IonIcon :icon="warningOutline" style="margin-right:6px" />
        <div>
          Olá professor, o prazo de preenchimento da etapa {{ selectedTad }} se encerra em {{ diffDays }} {{ diffDays === 1 ? 'dia' : 'dias' }}, caso haja pendência será necessária entrar em contato com a secretaria.
        </div>
      </div>
    </div>
    <div v-else-if="diffDays < 0 && !computedRegisteredFeedback.isCompleted && !hasLaunched && students" class="warning-close-information">
      <div class="title">Registro irregular</div>
      <div class="text">
        <IonIcon :icon="warningOutline" style="margin-right:6px" />
        <div>
          Olá professor, o prazo de preenchimento da etapa {{ selectedTad }} se encerrou, entre em contato com a secretaria para resolver as pendências.
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
      <IonCard v-if="computedRegisteredFeedback.areGradesReleased" :color="computedRegisteredFeedback.areGradesReleased ? 'success' : 'info'">
            <IonCardContent>
              <IonText style="display: flex;">
                <IonIcon size="small" style="margin-top: auto; margin-bottom: auto;" :icon="checkmarkCircleOutline" />
                <span style="margin-top: auto; margin-bottom: auto; margin-left: 5px;">
                  Registro do parecer descritivo na Etapa {{ selectedTad }} finalizado com sucesso.
                </span>
              </IonText>
              <IonText v-if="!computedRegisteredFeedback.areGradesReleased" style="display: flex;">
                <IonIcon size="small" style="margin-top: auto; margin-bottom: auto;" :icon="alertOutline" />
                <span style="margin-top: auto; margin-bottom: auto; margin-left: 5px;">
                  Registro do parecer descritivo na Etapa {{ selectedTad }} com notas faltantes finalizado com sucesso.
                </span>
              </IonText>
            </IonCardContent>
          </IonCard>
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
                <IonItem button :detail="false"
                        v-if="selectedTad === 'inicial'"
                        @click="openEditModal(s, 'initialFeedback')"
                        :disabled="s.situation !== 'CURSANDO'">
                  <IonLabel>
                    <div style="min-height: 180px; white-space: pre-wrap; cursor: text;">
                      {{ s.initialFeedback || 'Clique para inserir parecer inicial...' }}
                    </div>
                    <IonText slot="end" color="medium">
                      {{ (s.initialFeedback.length) }}/1000
                    </IonText>
                  </IonLabel>
                </IonItem>
                <IonItem button :detail="false"
                        v-if="selectedTad === 'parcial'"
                        @click="openEditModal(s, 'partialFeedback')"
                        :disabled="s.situation !== 'CURSANDO'">
                  <IonLabel>
                    <div style="min-height: 180px; white-space: pre-wrap; cursor: text;">
                      {{ s.partialFeedback || 'Clique para inserir parecer parcial...' }}
                    </div>
                    <IonText slot="end" color="medium">
                      {{ (s.partialFeedback.length) }}/1000
                    </IonText>
                  </IonLabel>
                </IonItem>
                <IonItem button :detail="false"
                        v-if="selectedTad === 'final'"
                        @click="openEditModal(s, 'finalFeedback')"
                        :disabled="s.situation !== 'CURSANDO'">
                  <IonLabel>
                    <div style="min-height: 180px; white-space: pre-wrap; cursor: text;">
                      {{ s.finalFeedback || 'Clique para inserir parecer final...' }}
                    </div>
                    <IonText slot="end" color="medium">
                      {{ (s.finalFeedback.length) }}/1000
                    </IonText>
                  </IonLabel>
                </IonItem>
              </div>
              <!-- Data de criação do parecer descritivo -->
              <IonCardHeader
                id="accordionContentHeader"
                class="ion-no-padding" style="padding: 8px;"
                :translucent="true"
              >
                <IonText color="primary" style="display: flex; align-items: center; height: 15px;">
                  <IonIcon :icon="calendarClearOutline" style="margin-right: 10px;" />
                  {{
                    selectedTad === 'inicial'
                      ? 'Criado em ' + luxonFormatDate(s.initialCreatedAt)
                      : selectedTad === 'parcial'
                        ? 'Criado em ' + luxonFormatDate(s.partialCreatedAt)
                        : 'Criado em ' + luxonFormatDate(s.finalCreatedAt)
                  }}
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
                  {{
                    selectedTad === 'inicial'
                      ? 'Atualizado em ' + luxonFormatDateTime(s.initialUpdatedAt)
                      : selectedTad === 'parcial'
                        ? 'Atualizado em ' + luxonFormatDateTime(s.partialUpdatedAt)
                        : 'Atualizado em ' + luxonFormatDateTime(s.finalUpdatedAt)
                  }}
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

    <IonModal
      :key="`${editingStudent?.studentId}-${editingField}`"
      v-model:is-open="editModalOpen"
      swipe-to-close="false"
      backdrop-dismiss="false"
      class="edit-modal"
      @ion-modal-did-dismiss="closeEditModal"
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle style="padding-left: 16px; color: var(--ion-color-primary)">
            {{ selectedTad === 'inicial'
                ? 'Editar Parecer Inicial'
                : selectedTad === 'parcial'
                  ? 'Editar Parecer Parcial'
                  : 'Editar Parecer Final' }}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton style="padding-right: 16px;" @click="closeEditModal">Fechar</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent class="edit-modal-content ion-padding">
        <IonTextarea
          v-model="editTemporary"
          autofocus
          counter
          :maxlength="1000"
          :rows="10"
          placeholder="Digite até 1000 caracteres..."
          auto-grow
        />
      </IonContent>

      <IonFooter>
        <IonToolbar>
          <IonButtons slot="end">
            <IonButton color="medium" @click="clearEditTemporary">Limpar</IonButton>
            <IonButton color="secondary" style="padding-right: 16px;" @click="confirmEditModal()">Salvar</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonFooter>
    </IonModal>

    <IonAlert
      class="custom-alert"
      :is-open="showAlert"
      :header="'Deseja finalizar os registros?'"
      :sub-header="isStageCompleted ? 'Ao confirmar, você declara que todas as notas desta turma estão corretas e prontas para a secretaria. Deseja prosseguir?' : 'Existem alunos sem lançamento de nota, deseja prosseguir?'"
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
          handler: () => registerGrades(),
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
                  :disabled="isLoading || !isAnySaved || computedRegisteredFeedback.areGradesReleased"
                  color="secondary"
                  expand="full"
                  @click="preRegisterFeedback"
                >
                  Lançar Parecer
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

.edit-modal {
  --width: 90%;
  --max-width: 500px;
  --min-width: 250px;
  --height: auto;
  --max-height: 80%;
}

.edit-modal-content {
  max-height: calc(80vh - 112px);
  overflow-y: auto;
  box-sizing: border-box;
}

.warning-close-information {
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

ion-loading.custom-save-loading {
  --background: #e3edff;
  --spinner-color: var(--ion-color-warning);

  color: var(--ion-color-info);
}
</style>