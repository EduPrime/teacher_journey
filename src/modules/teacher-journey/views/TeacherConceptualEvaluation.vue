<script setup lang="ts">
import type { MountedStudent, RegisteredToSave } from '../types/types'
import EduFilterProfile from '@/components/FilterProfile.vue'
import ContentLayout from '@/components/theme/ContentLayout.vue'

import showToast from '@/utils/toast-alert'
import { IonAccordion, IonAccordionGroup, IonAlert, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonCol, IonGrid, IonIcon, IonItem, IonLabel, IonLoading, IonModal, IonRow, IonSelect, IonSelectOption, IonText, IonToolbar } from '@ionic/vue'
import { alertOutline, apps, checkmarkCircleOutline, checkmarkOutline, helpOutline, lockClosedOutline, text, warningOutline } from 'ionicons/icons'
import { computed, onMounted, ref, watch } from 'vue'
import EduStageTabs from '../components/StageTabs.vue'
import ConceptualGradeService from '../services/ConceptualGradeService'
import EnrollmentService from '../services/EnrollmentService'
import EvaluationRuleService from '../services/EvaluationRuleService'
import RegisteredGradeService from '../services/RegisteredGradeService'
import StageService from '../services/StageService'

const stageService = new StageService()
const evaluationRuleService = new EvaluationRuleService()
const enrollmentService = new EnrollmentService()
const registeredGradeService = new RegisteredGradeService()
const conceptualGradeService = new ConceptualGradeService()

let cleanModal = ref(false)
const selectedStudent = ref()
const stages = ref()
const eduFProfile = ref()
const currentStage = ref()
const conceptualTypes = ref()
const isLoading = ref(false)
const showAlert = ref(false)
const stageFinished = ref<RegisteredToSave>()
const isDisabled = ref(true)
let isGradesFilled = ref(false)
let diffDays = 0
let timestamp = ref<{ id: any, createdAt: any, updatedAt: any } | null>(null)
const studentList = ref<MountedStudent[]>()
const teacherId = ref(localStorage.getItem('teacherId'))
const registeredToSave = ref<RegisteredToSave>({
  areGradesReleased: undefined,
  isCompleted: false,
  classroomId: '',
  disciplineId: '',
  stageId: '',
})

// Watcher que observa o filtro e o calendário para montar a listagem de alunos
watch(eduFProfile, async (newValue) => {
  if (newValue && newValue?.disciplineId) {
    conceptualTypes.value = await evaluationRuleService.getConceptualGradesTypes(newValue.courseIds)
    registeredToSave.value.isCompleted = await registeredGradeService.getRegisteredGradesIsCompletedStatus(teacherId.value, newValue?.classroomId, newValue.disciplineId, currentStage.value?.id)
    // checkRegisteredGrades()
    studentList.value = await enrollmentService.getClassroomConceptualGrades(
      newValue.classroomId,
      newValue.schoolId,
      newValue.disciplineId,
      currentStage.value.id,
      newValue.seriesId,
    )
    stageFinished.value = await registeredGradeService.getRegistered(
      newValue.classroomId,
      newValue.disciplineId,
      currentStage.value?.id,
    )
    registeredToSave.value.stageId = currentStage.value?.id
  }
  else {
    studentList.value = undefined
    registeredToSave.value.stageId = currentStage.value?.id
  }
},
  { immediate: true }
)

watch((currentStage), async (newValue) => {
  if (newValue && eduFProfile.value.disciplineId) {
    conceptualTypes.value = await evaluationRuleService.getConceptualGradesTypes(eduFProfile.value.courseIds)
    registeredToSave.value.isCompleted = await registeredGradeService.getRegisteredGradesIsCompletedStatus(teacherId.value, eduFProfile.value.classroomId, eduFProfile.value.disciplineId, newValue.id)
    // checkRegisteredGrades()
    studentList.value = await enrollmentService.getClassroomConceptualGrades(
      eduFProfile.value.classroomId,
      eduFProfile.value.schoolId,
      eduFProfile.value.disciplineId,
      newValue.id,
      eduFProfile.value.seriesId,
    )
    stageFinished.value = await registeredGradeService.getRegistered(
      eduFProfile.value.classroomId,
      eduFProfile.value.disciplineId,
      newValue.id,
    )
    registeredToSave.value.stageId = newValue?.id
  }
  registeredToSave.value.stageId = newValue?.id
},
  { immediate: true }
)

onMounted(async () => {
  stages.value = await stageService.getAllStages()
})

function guaranteeIonModalDidDismissWorksFine(open: boolean) {
  cleanModal.value = open
  if (open) {
    cleanModal.value = false
    setTimeout(() => (cleanModal.value = true), 10)
  }
}

async function saveGrades(student: MountedStudent) {
  isLoading.value = true
  const isNotEmpty = student.grades.every(item => item.grade)
  try {
    if (!student.conceptualGradeId) {
      const response = await conceptualGradeService.createConceptualGrade(student)
      await registeredGradeService.setAreGradesReleasedToFalse(computedRegisteredGrade.value)
      stageFinished.value = await registeredGradeService.getRegistered( // garantir a existência do stage para um registro completamente novo
        computedRegisteredGrade.value.classroomId,
        computedRegisteredGrade.value.disciplineId,
        computedRegisteredGrade.value.stageId,
    )

      student.conceptualGradeId = response[0].conceptualGradeId
      student.grades.forEach((item) => {
        item.conceptualGradeId = response[0].conceptualGradeId
        item.grade = response.find(r => r.thematicUnitId === item.thematicUnitId)?.grade
      })
      
      if (isNotEmpty) {
        student.status = 'CONCLUÍDO'
        student.isFull = true
        if (stageFinished.value) {
          // stageFinished.value.areGradesReleased = false
        }
        isLoading.value = false
        showToast('Notas salvas com sucesso', 'top', 'success')
      }
      else {
        student.status = 'INCOMPLETO'
        if (stageFinished.value) {
          // stageFinished.value.areGradesReleased = false
        }
        isLoading.value = false
        showToast('Notas salvas com sucesso', 'top', 'success')
      }
    }
    else {
      await conceptualGradeService.updateConceptualGrade(student.grades)
      await registeredGradeService.setAreGradesReleasedToFalse(computedRegisteredGrade.value)
      if (isNotEmpty) {
        student.status = 'CONCLUÍDO'
        student.isFull = true
        if (stageFinished.value) {
          stageFinished.value.areGradesReleased = false
        }
        isLoading.value = false
        showToast('Notas salvas com sucesso', 'top', 'success')
      }
      else {
        student.status = 'INCOMPLETO'
        if (stageFinished.value) {
          stageFinished.value.areGradesReleased = false
        }
        isLoading.value = false
        showToast('Notas salvas com sucesso', 'top', 'success')
      }
    }
  }
  catch (error) {
    isLoading.value = false
    console.error(error)
  }
}

async function cleanGrades(student: MountedStudent) {
  isLoading.value = true
  if (student.conceptualGradeId) {
    try {
      await conceptualGradeService.softDeleteConceptualGrade(student.conceptualGradeId)
      registeredToSave.value.isCompleted = false
      await registeredGradeService.updateRegisteredGradeIsCompleted(teacherId.value, student.classroomId, student.disciplineId, student.stageId, registeredToSave.value.isCompleted)
      await registeredGradeService.setAreGradesReleasedToFalse(computedRegisteredGrade.value)
      if (stageFinished.value) {
        stageFinished.value.areGradesReleased = false
      }
      isLoading.value = false
      showToast('Notas limpas com sucesso', 'top', 'success')
    }
    catch (error) {
      isLoading.value = false
      console.error(error)
    }
  }
  student.grades.forEach((tu) => {
    tu.grade = ''
  })
  student.status = 'INCOMPLETO'
  student.conceptualGradeId = null
  student.isFull = false
  isDisabled.value = false
  if (stageFinished.value) {
        stageFinished.value.areGradesReleased = false
      }
  isLoading.value = false
  showToast('Notas limpas com sucesso', 'top', 'success')
}

function preRegisterGrades() {
  showAlert.value = true
  isGradesFilled.value = studentList.value?.every(item => item.situation !== 'CURSANDO' || item.grades.every(tu => tu.grade)) ?? false
  if (currentStage.value.id === undefined || currentStage.value.id === null) { // currentStage está esvaziando, ainda n identifiquei a origem do erro.
    registeredToSave.value.stageId = registeredToSave.value.stageId
  }
}

function registerGrades(itemToSave: RegisteredToSave) {
  isLoading.value = true
  showAlert.value = false
  try {
    isGradesFilled.value = studentList.value?.every(item => item.situation !== 'CURSANDO' || item.grades.every(tu => tu.grade)) ?? false
    if (isGradesFilled.value) {
      itemToSave.isCompleted = true
      registeredGradeService.upsertRegisteredGrade(itemToSave)
      isDisabled.value = true
      showToast('Notas completas lançadas com sucesso!', 'top', 'success')
    }
    else {
      itemToSave.isCompleted = false
      registeredGradeService.upsertRegisteredGrade(itemToSave)
      isDisabled.value = true
      showToast('Notas incompletas lançadas com sucesso!', 'top', 'success')
    }
  }
  catch (error) {
    console.error('Erro ao registrar notas:', error)
    showToast('Ocorreu um erro ao lançadas o registro de notas.', 'top', 'danger')
  }
  finally {
    isLoading.value = false
    registeredToSave.value.isCompleted = itemToSave.isCompleted
    registeredToSave.value.areGradesReleased = true
    stageFinished.value = {
      areGradesReleased: true,
      isCompleted: itemToSave.isCompleted,
      classroomId: '',
      disciplineId: '',
      stageId: ''
    }
    isLoading.value = false
    }
}

const computedRegisteredGrade = computed(() => ({
  areGradesReleased: registeredToSave.value.areGradesReleased,
  isCompleted: registeredToSave.value.isCompleted,
  teacherId: teacherId.value,
  classroomId: eduFProfile.value?.classroomId || '',
  disciplineId: eduFProfile.value?.disciplineId || '',
  stageId: currentStage.value?.id || registeredToSave.value?.stageId,
}))

const deadline = computed(() => {
  const currentDate = new Date()
  const deadlineDate = new Date(currentStage.value?.endDate)
  if (isNaN(deadlineDate.getTime())) {
    return false
  }
  const diffTime = deadlineDate.getTime() - currentDate.getTime()
  diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
})

const isLaunchAvailable = computed(() => {
  const filled = studentList.value?.some(item => item.grades.some(tu => tu.grade))
   if (stageFinished.value === null && filled && computedRegisteredGrade.value.areGradesReleased === undefined) {

    return true
  }
  else if (stageFinished.value === null && filled && !computedRegisteredGrade.value.areGradesReleased) {

    return false
  }

  else if (stageFinished.value && !stageFinished.value.areGradesReleased && filled) {

    return false
  }
  else if (stageFinished.value && !stageFinished.value.areGradesReleased && !filled) {

    return false
  }

  else {
    return true
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
</script>

<template>
  <ContentLayout>
    <EduFilterProfile :discipline="true" @update:filtered-ocupation="($event) => eduFProfile = $event" />
    <div v-if="deadline && diffDays <= 10 && diffDays >= 0 && !stageFinished && studentList" class="warning-close-information">
      <div class="title">
        Registro irregular
      </div>
      <div class="text">
        <IonIcon :icon="warningOutline" />
        <div>
          Olá professor, o prazo de preenchimento se encerra em {{ diffDays }} {{ diffDays === 1 ? 'dia' : 'dias' }}, caso haja pendência será necessária entrar em contato com a secretaria.
        </div>
      </div>
    </div>
    <div v-else-if="deadline && diffDays < 0 && !stageFinished && studentList" class="warning-close-information">
      <div class="title">
        Registro irregular
      </div>
      <div class="text">
        <IonIcon :icon="warningOutline" />
        <div>
          Olá professor, o prazo de preenchimento se encerrou, entre em contato com a secretaria para resolver as pendências.
        </div>
      </div>
    </div>
    <div v-else />

    <h3>
      <IonText color="secondary" class="ion-content ion-padding-bottom" style="display: flex; align-items: center;">
        <IonIcon color="secondary" style="margin-right: 10px;" aria-hidden="true" :icon="text" />
        <span>Registro Conceitual</span>
      </IonText>
    </h3>
    <div v-if="eduFProfile?.classroomId && eduFProfile?.disciplineId">
      <EduStageTabs v-model="currentStage" :stages="stages">
        <template v-for="stage in stages" :key="stage.numberStage" #[stage.numberStage]>
          <IonCard v-if="stageFinished?.areGradesReleased" class="success-card" style="margin:10px 0px 10px 0px;">
            <IonCardContent>
              <IonText style="display: flex;">
                <IonIcon size="small" style="margin-top: auto; margin-bottom: auto;" :icon="checkmarkCircleOutline" />
                <span style="margin-top: auto; margin-bottom: auto; margin-left: 5px;">
                  Lançamento de notas realizado com sucesso.
                </span>
              </IonText>
            </IonCardContent>
          </IonCard>
          <div v-if="studentList && studentList.length > 0" style="padding: 1px; margin-top: -10px;">
            <IonAccordionGroup expand="inset">
              <IonAccordion v-for="(s, i) in studentList" :key="i" :value="`${i}`" class="no-border-accordion">
                <IonItem slot="header">
                  <IonIcon
                    :color="getStatusColor(s.status)" style="margin-right: 6px; font-size: 24px;"
                    :icon="getStatusIcon(s.status)"
                  />
                  <IonLabel style="display: flex">
                    <IonText
                      color="secondary" class="" style="margin: auto 0 auto 0;"
                      :style="s.situation !== 'CURSANDO' ? ' opacity: 0.4;' : ''"
                    >
                      <b>{{ s.name }}</b>
                    </IonText>
                    <IonChip
                      v-if="s.disability" class="ion-no-margin" style="margin: auto 0 auto auto;" mode="md"
                      color="tertiary"
                    >
                      PCD
                    </IonChip>
                    <IonChip v-if="s.situation !== 'CURSANDO'" style="margin: auto 0 auto auto;" mode="md">
                      {{ s.situation.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()) }}
                    </IonChip>
                  </IonLabel>
                </IonItem>
                <div slot="content" class="ion-padding">
                  <IonCardHeader
                    id="accordionContentHeader" class="ion-no-padding" style="padding: 8px;"
                    :translucent="true"
                  >
                    <div style="display: flex; align-items: center; height: 15px;">
                      <IonIcon :icon="apps" style="margin-right: 10px;" />
                      Unidades Temáticas
                    </div>
                  </IonCardHeader>
                  <div class="ion-padding-bottom ion-content">
                    <div v-for="tu in s.grades" :key="tu.thematicUnitId">
                      <IonGrid class="ion-no-padding ion-padding-top">
                        <IonRow>
                          <IonCol style="display: flex;" size="6">
                            <IonText color="primary" style="margin-top: auto; margin-bottom: auto;">
                              {{ tu.name }}
                            </IonText>
                          </IonCol>
                          <IonCol size="6">
                            <IonSelect
                              id="evaluation" v-model="tu.grade" justify="start" cancel-text="Cancelar"
                              label="Registrar" label-placement="stacked" fill="outline" mode="md" style="zoom: 0.9;"
                              :disabled="s.status === 'BLOQUEADO'" @ion-change="(e) => {
                                tu.grade = e.detail.value
                                s.status = 'PENDENTE'
                                s.isCleansed = false
                              }"
                            >
                              <IonSelectOption
                                v-for="conceptualType in conceptualTypes" :key="conceptualType.index"
                                :value="conceptualType"
                              >
                                {{ conceptualType }}
                              </IonSelectOption>
                            </IonSelect>
                          </IonCol>
                        </IonRow>
                      </IonGrid>
                    </div>
                  </div>
                  <div class="ion-content" style="display: flex;">
                    <IonButton
                      style="margin-left: auto; margin-right: 8px; text-transform: capitalize;" size="small"
                      :disabled="s.status === 'BLOQUEADO'" color="danger" @click="() => { selectedStudent = s; guaranteeIonModalDidDismissWorksFine(true) }"
                    >
                      Limpar
                    </IonButton>

                    <IonButton
                      color="tertiary" size="small" style="text-transform: capitalize;" :disabled="s.status === 'BLOQUEADO'
                        || s.status === 'CONCLUÍDO'
                        || s.status === 'INCOMPLETO'
                      "
                      @click="saveGrades(s)"
                    >
                      Salvar
                    </IonButton>
                  </div>
                </div>
              </IonAccordion>
            </IonAccordionGroup>
          </div>

          <IonCard v-else color="warning">
            <IonCardHeader>
              <IonCardTitle>Alunos não encontrados</IonCardTitle>
            </IonCardHeader>

            <IonCardContent>
              <IonText>
                Nenhum aluno encontrado. Por favor entre em contato com a secretaria de sua escola para verificar se sua
                turma foi cadastrada corretamente.
              </IonText>
            </IonCardContent>
          </IonCard>
        </template>
      </EduStageTabs>
    </div>

    <IonCard v-else color="info">
      <IonCardHeader>
        <IonCardTitle>Selecione a escola, turma e disciplina</IonCardTitle>
      </IonCardHeader>

      <IonCardContent>
        <IonText>
          Olá, por favor selecione qual a <b>escola</b>, <b>turma</b> e <b>disciplina</b> nas quais deseja fazer o lançamento de notas
          conceituais
        </IonText>
      </IonCardContent>
    </IonCard>

    <IonModal id="clean-modal" :is-open="cleanModal" @ion-modal-will-dismiss="guaranteeIonModalDidDismissWorksFine(false)">
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
              color="medium"
              @click="guaranteeIonModalDidDismissWorksFine(false)"
            >
              Cancelar
            </IonButton>
            <IonButton
              style="text-transform: capitalize;"
              size="small"
              color="danger"
              @click="cleanGrades(selectedStudent);
                guaranteeIonModalDidDismissWorksFine(false)
              "
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
      header="Lançar notas"
      :sub-header="isGradesFilled ? 'Ao confirmar, você declara que todas as notas desta turma estão corretas e prontas para a secretaria. Deseja prosseguir?' : 'Existem alunos sem lançamento de nota, deseja prosseguir?'"
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
          handler: () => registerGrades(computedRegisteredGrade),
        },
      ]"
    />

    <IonLoading
      :is-open="isLoading"
      message="Carregando..."
      spinner="crescent"
      class="custom-save-loading"
    />

    <div style="height: 64px;" />
    <template #footer>
      <IonToolbar>
        <IonGrid>
          <IonRow>
            <IonCol size="12">
              <IonButton
                :disabled="isLaunchAvailable" color="secondary" expand="full"
                @click="preRegisterGrades"
              >
                <IonIcon size="small" style="margin-top: auto; margin-bottom: auto; margin-left:10px;" :icon="checkmarkCircleOutline" />
                <span style="margin-top: auto; margin-bottom: auto; margin-left: 5px;">
                  lançar notas
                </span>
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonToolbar>
    </template>
  </ContentLayout>
</template>

<style scoped>
ion-modal#clean-modal {
    --width: fit-content;
    --min-width: 250px;
    --height: fit-content;
    --border-radius: 6px;
    --box-shadow: 0 28px 48px rgba(0, 0, 0, 0.4);
  }

  ion-modal#clean-modal h1 {
    margin: 20px 20px 10px 20px;
  }

  ion-modal#clean-modal ion-icon {
    margin-right: 6px;

    width: 48px;
    height: 48px;

    padding: 4px 0;

    color: #aaaaaa;
  }

  ion-modal#clean-modal .wrapper {
    margin-bottom: 10px;
  }

ion-card-header#accordionContentHeader {
  --background: rgba(var(--ion-color-secondary-rgb), 0.15);
  --color: var(--ion-color-secondary);
}

ion-select#evaluation {
  min-height: 48px;
  --highlight-height: auto;
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

.warning-close-information {
  margin: 10px 10px 20px 10px;
  background-color: #F5C228E6;
  color: #000000B3;
  padding: 15px 18px 16px 6px;
  border-radius: 3px;

  .title {
    font-size: 17px;
    word-spacing: -2px;
    font-weight: 600;
    padding: 0px 0px 8px 27px;
  }

  .text {
    ion-icon {
      width: 55px;
      margin-left: 5px;
      margin-right: 5px;
      margin-top: -3px;
    }

    display: flex;
    font-weight: 300;
    text-align: justify-left;
    align-items: start;
    font-size: 14px;
  }
}

ion-loading.custom-save-loading {
    --background: #e3edff;
    --spinner-color: var(--ion-color-warning);

    color: var(--ion-color-info);
}
</style>
