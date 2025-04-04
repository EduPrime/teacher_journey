<script setup lang="ts">
import type { ConceptualToSave, Grades, MountedStudent, RegisteredToSave, UpdatedGrades } from '../types/types'
import EduFilterProfile from '@/components/FilterProfile.vue'
import ContentLayout from '@/components/theme/ContentLayout.vue'

import { IonAccordion, IonAccordionGroup, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonCol, IonGrid, IonIcon, IonItem, IonItemGroup, IonLabel, IonLoading, IonRadio, IonRadioGroup, IonRow, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonText, IonToolbar } from '@ionic/vue'
import { apps, text, checkmarkCircleOutline, checkmarkOutline, alertOutline, helpOutline, lockClosedOutline } from 'ionicons/icons'
import { onMounted, ref, watch, computed, onUpdated } from 'vue'
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

const stages = ref()
const eduFProfile = ref()
const currentStage = ref()
const conceptualTypes = ref()
const studentList = ref<MountedStudent[]>()
const oldList = ref<MountedStudent[]>()
const isLoading = ref(false)
const registeredToSave = ref<RegisteredToSave>({
  isCompleted: false,
  teacherId: localStorage.getItem('teacherId'),
  classroomId: '',
  disciplineId: '',
  stageId: ''
})


// Watcher que observa o filtro e o calendário para montar a listagem de alunos
watch(eduFProfile, async (newValue) => {
  if (newValue && newValue?.disciplineId) {
    studentList.value = await enrollmentService.getClassroomConceptualGrades(
      newValue.classroomId,
      newValue.schoolId,
      newValue.disciplineId,
      currentStage.value.id,
      newValue.seriesId,
    )
    conceptualTypes.value = await evaluationRuleService.getConceptualGradesTypes(newValue.courseIds)
    console.log('conceptualTypes', conceptualTypes.value)
    oldList.value = JSON.parse(JSON.stringify(studentList.value))
  }
  else {
    studentList.value = undefined
    oldList.value = undefined
  }
})

watch((currentStage), async (newValue) => {
  if (newValue && eduFProfile.value.disciplineId) {
    console.log('currentStage', currentStage)
    studentList.value = await enrollmentService.getClassroomConceptualGrades(
      eduFProfile.value.classroomId,
      eduFProfile.value.schoolId,
      eduFProfile.value.disciplineId,
      newValue.id,
      eduFProfile.value.seriesId,
    )
    oldList.value = JSON.parse(JSON.stringify(studentList.value))
    console.log('studentList, watch', studentList.value)
  }
})

onMounted(async () => {
  stages.value = await stageService.getAllStages()
})

function updateOldGrades(oldGrades: Grades[], newGrades: Grades[]) {
  oldGrades.forEach((oldGrade) => {
    const newGrade = newGrades.find(grade => grade.thematicUnitId === oldGrade.thematicUnitId)
    if (newGrade) {
      oldGrade.grade = newGrade.grade
    }
  })
}

function compareGrades(oldGrades: Grades[], student: MountedStudent) {
  const key = 'grade'
  const equal = oldGrades.every((item, index) => item[key] === student.grades[index][key])
  const isNotEmpty = student.grades.every((item) => item[key])
  if (equal && isNotEmpty) {
    student.status = 'CONCLUÍDO'
  }
  else if (equal && !isNotEmpty) {
    student.status = 'INCOMPLETO'
  }
  else {
    student.status = 'PENDENTE'
  }
  student.isCleansed = false
}

async function saveGrades(oldGrades: Grades[], student: MountedStudent) {
  const key = 'grade'
  if (student.isCleansed && student.conceptualGradeId) {
    try {
      await conceptualGradeService.softDeleteConceptualGrade(student.conceptualGradeId)
      student.conceptualGradeId = null
      // student.grades.conceptualGradeId = null
      student.status = 'INCOMPLETO'
      student.isCleansed = false
      student.isFull = false
      updateOldGrades(oldGrades, student.grades)
    }
    catch (error) {
      console.error(error)
    }
  }
  else {
    const isNotEmpty = student.grades.every((item) => item[key])
    try {
      if (!student.conceptualGradeId) {
        const response = await conceptualGradeService.createConceptualGrade(student)

        student.conceptualGradeId = response[0].conceptualGradeId
        student.grades.forEach((item) => {
          item.grade = response.find((r) => r.thematicUnitId === item.thematicUnitId)?.grade
        })
        if (isNotEmpty) {
          student.status = 'CONCLUÍDO'
          student.isFull = true
        } else {
          student.status = 'INCOMPLETO'
        }
        updateOldGrades(oldGrades, student.grades)
      }
      else {
        await conceptualGradeService.updateConceptualGrade(student.grades)
        updateOldGrades(oldGrades, student.grades)
        if (isNotEmpty) {
          student.status = 'CONCLUÍDO'
          student.isFull = true
        }
        else {
          student.status = 'INCOMPLETO'
        }
      }
    } catch (error) {
      console.error(error)
    }
  }
}

function cleanGrades(student: MountedStudent) {
  console.log('Limpar', student)
  student.grades.forEach((tu) => {
    tu.grade = ''
  })
  if (student.conceptualGradeId) {
    student.status = 'PENDENTE'
    student.isCleansed = true
  }
  else {
    student.status = 'INCOMPLETO'
  }
}

async function registerGrades(registeredToSave: RegisteredToSave) {
  const isGradesFilled = studentList.value?.every((item) => item.situation !== 'CURSANDO' || item.grades.every((tu) => tu.grade))
  if (isGradesFilled) {
    registeredToSave.isCompleted = true
    await registeredGradeService.upsertRegisteredGrade(registeredToSave)
  }
  else {
    registeredToSave.isCompleted = false
    await registeredGradeService.upsertRegisteredGrade(registeredToSave)
  }
}

const computedRegisteredGrade = computed(() => ({
  isCompleted: registeredToSave.value.isCompleted,
  teacherId: registeredToSave.value.teacherId,
  classroomId: eduFProfile.value?.classroomId || '',
  disciplineId: eduFProfile.value?.disciplineId || '',
  stageId: currentStage.value?.id || ''
}))

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
    <h3>
      <IonText color="secondary" class="ion-content ion-padding-bottom" style="display: flex; align-items: center;">
        <IonIcon color="secondary" style="margin-right: 10px;" aria-hidden="true" :icon="text" />
        <span>Registro Conceitual</span>
      </IonText>
    </h3>

    <div v-if="eduFProfile?.classroomId && eduFProfile?.disciplineId">
      <EduStageTabs v-model="currentStage" :stages="stages">
        <template v-for="stage in stages" :key="stage" #[stage.numberStage]>
          <div v-if="studentList && studentList.length > 0" style="padding: 1px; margin-top: -10px;">
            <IonAccordionGroup expand="inset">
              <IonAccordion v-for="(s, i) in studentList" :key="i" :value="`${i}`" class="no-border-accordion">
                <IonItem slot="header">
                  <IonIcon :color="getStatusColor(s.status)" style="margin-right: 6px; font-size: 24px;"
                    :icon="getStatusIcon(s.status)" />
                  <IonLabel style="display: flex">
                    <IonText color="secondary" class="" style="margin: auto 0 auto 0;"
                      :style="s.situation !== 'CURSANDO' ? ' opacity: 0.4;' : ''">
                      <b>{{ s.name }}</b>
                    </IonText>
                    <IonChip v-if="s.disability" class="ion-no-margin" style="margin: auto 0 auto auto;" mode="md"
                      color="tertiary">
                      PCD
                    </IonChip>
                    <IonChip v-if="s.situation !== 'CURSANDO'" style="margin: auto 0 auto auto;" mode="md">
                      {{s.situation.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}}
                    </IonChip>
                  </IonLabel>
                </IonItem>
                <div slot="content" class="ion-padding">
                  <IonCardHeader id="accordionContentHeader" class="ion-no-padding" style="padding: 8px;"
                    :translucent="true">
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
                            <IonSelect id="evaluation" justify="start" cancel-text="Cancelar" label="Registrar"
                              label-placement="floating" fill="outline" mode="md" style="zoom: 0.9;" v-model="tu.grade"
                              :disabled="s.status === 'BLOQUEADO'" @ionChange="(e) => {
                                tu.grade = e.detail.value
                                compareGrades(oldList?.find((item) => item.enrollmentId === s.enrollmentId)?.grades || [], s)
                              }">
                              <IonSelectOption v-for="conceptualType in conceptualTypes" :key="conceptualType.index"
                                :value="conceptualType.rotulo">
                                {{ conceptualType.rotulo }}
                              </IonSelectOption>
                            </IonSelect>
                          </IonCol>
                        </IonRow>
                      </IonGrid>
                    </div>
                  </div>
                  <div class="ion-content" style="display: flex;">
                    <IonButton style="margin-left: auto; margin-right: 8px; text-transform: capitalize;" size="small"
                      :disabled="s.status === 'BLOQUEADO'" color="danger" @click="cleanGrades(s)">
                      Limpar
                    </IonButton>

                    <IonButton color="tertiary" size="small" style="text-transform: capitalize;" :disabled="s.status === 'BLOQUEADO' ||
                      s.status === 'CONCLUÍDO' ||
                      s.status === 'INCOMPLETO'
                      "
                      @click="saveGrades(oldList?.find((item) => item.enrollmentId === s.enrollmentId)?.grades || [], s)">
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
        <IonCardTitle>Selecione a turma e disciplina</IonCardTitle>
      </IonCardHeader>

      <IonCardContent>
        <IonText>
          Olá, por favor selecione qual a <b>turma</b> e <b>disciplina</b> na qual deseja fazer o lançamento de notas
          conceituais
        </IonText>
      </IonCardContent>
    </IonCard>

    <div style="height: 64px;" />
    <template #footer>
      <IonToolbar>
        <IonGrid>
          <IonRow>
            <IonCol size="12">
              <IonButton :disabled="isLoading || !eduFProfile?.disciplineId" color="secondary" expand="full"
                @click="registerGrades(computedRegisteredGrade)">
                Finalizar
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonToolbar>
    </template>
  </ContentLayout>
</template>

<style scoped>
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

.warning-close-date {
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

.success-close-date {
  margin-top: 5px;
  margin-bottom: 5px;
  background-color: var(--ion-color-success-shade);
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

  ion-loading.custom-save-loading {
    --background: #e3edff;
    --spinner-color: var(--ion-color-warning);

    color: var(--ion-color-info);
  }
}
</style>
