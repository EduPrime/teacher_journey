<script setup lang="ts">
import { IonAccordion, IonAccordionGroup, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonCol, IonGrid, IonIcon, IonItem, IonItemGroup, IonLabel, IonLoading, IonRadio, IonRadioGroup, IonRow, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonText, IonToolbar } from '@ionic/vue'
import { apps, text } from 'ionicons/icons'
import { onMounted, ref, watch } from 'vue'

import EduFilterProfile from '@/components/FilterProfile.vue'
import ContentLayout from '@/components/theme/ContentLayout.vue'
import EduStageTabs from '../components/StageTabs.vue'
import EnrollmentService from '../services/EnrollmentService'
import StageService from '../services/StageService'
import EvaluationRuleService from '../services/EvaluationRuleService'
import RegisteredGradeService from '../services/RegisteredGradeService'
import ConceptualGradeService from '../services/ConceptualGradeService'
import type { ConceptualToSave, MountedStudent, UpdatedGrades, Grades, RegisteredToSave } from '../types/types'


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

// Watcher que observa o filtro e o calendário para montar a listágem de alunos
watch(eduFProfile, async (newValue) => {
  if (newValue && newValue?.disciplineId) {
    studentList.value = await enrollmentService.getClassroomConceptualGrades(
      newValue.classroomId, newValue.schoolId, newValue.disciplineId, currentStage.value.id, newValue.seriesId,
    )
    conceptualTypes.value = await evaluationRuleService.getConceptualGradesTypes(newValue.courseIds)

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
      eduFProfile.value.classroomId, eduFProfile.value.schoolId, eduFProfile.value.disciplineId, newValue.id, eduFProfile.value.seriesId,
    )
    oldList.value = JSON.parse(JSON.stringify(studentList.value))
  }
})

onMounted(async () => {
  stages.value = await stageService.getAllStages()
})

function compareGrades(oldGrades: Grades[], newGrades: Grades[], updatedGrades: UpdatedGrades[]) {
  const oldGradesMap = new Map(oldGrades.map(grade => [grade.thematicUnitId, grade.value]))

  let hasChanged = false

  newGrades.forEach(newGrade => {
    const oldValue = oldGradesMap.get(newGrade.thematicUnitId)

    if (oldValue !== newGrade.value) {
      hasChanged = true

      const existingGrade = updatedGrades.find(
        updated =>
          updated.conceptualGradeId === newGrade.gradeId &&
          updated.thematicUnitId === newGrade.thematicUnitId
      )

      if (existingGrade) {
        existingGrade.grade = newGrade.value
      } else {
        updatedGrades.push({
          grade: newGrade.value,
          conceptualGradeId: newGrade.gradeId,
          thematicUnitId: newGrade.thematicUnitId
        })
      }
    }
  })

  return hasChanged
}

async function saveGrades(oldGrades: Grades[], newGrades: Grades[], updatedGrades: UpdatedGrades[], student: ConceptualToSave) {
  try {
    await conceptualGradeService.createConceptualGrade(updatedGrades, student)
    oldGrades.forEach(oldGrade => {
      const newGrade = newGrades.find(grade => grade.thematicUnitId === oldGrade.thematicUnitId)
      if (newGrade) {
        oldGrade.value = newGrade.value
      }
    })
  } catch (error) {
    console.error(error)
  }
}

function cleanGrades(oldGrades: Grades[], newGrades: Grades[]) {
  newGrades.forEach(newGrade => {
    const oldGrade = oldGrades.find(grade => grade.thematicUnitId === newGrade.thematicUnitId)
    if (oldGrade) {
      newGrade.value = oldGrade.value
    }
  })
}

async function registerGrades(data: RegisteredToSave) {
  await registeredGradeService.create(data)
}

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

    <div v-if="eduFProfile?.classroomId && (eduFProfile?.evaluation === 'conceitual' || eduFProfile?.disciplineId)">

      <EduStageTabs v-model="currentStage" :stages="stages">
        <template v-for="stage in stages" :key="stage" #[stage.numberStage]>
          <div v-if="studentList && studentList.length > 0" style="padding: 1px; margin-top: -10px;">
            <IonAccordionGroup expand="inset">
              <IonAccordion v-for="(s, i) in studentList" :key="i" :value="`${i}`" class="no-border-accordion">
                <IonItem slot="header">
                  <IonLabel style="display: flex">
                    <IonText color="secondary" class="" style="margin: auto 0 auto 0;"
                      :style="s.situation !== 'CURSANDO' ? ' opacity: 0.4;' : ''">
                      <b>{{ s.name }}</b>
                    </IonText>
                    <IonChip v-if="s.disability" class="ion-no-margin" style="margin: auto 0 auto auto;" mode="md"
                      color="tertiary">
                      PCD
                    </IonChip>
                  </IonLabel>
                </IonItem>
                <div slot="content" class="ion-padding">
                  <div v-if="s.situation !== 'CURSANDO'" class="ion-padding-bottom">
                    {{ s.situation }}
                  </div>
                  <IonCardHeader id="accordionContentHeader" class="ion-no-padding" style="padding: 8px;"
                    :translucent="true">
                    <div style="display: flex; align-items: center; height: 15px;">
                      <IonIcon :icon="apps" style="margin-right: 10px;" />
                      Unidades Temáticas
                    </div>
                  </IonCardHeader>
                  <div class="ion-padding-bottom">
                    <IonItem v-for="tu in s.grades" :key="tu.thematicUnitId" lines="none">
                      <IonGrid class="ion-no-padding ion-padding-top">
                        <IonRow>
                          <IonCol style="display: flex;" size="6">
                            <IonText color="primary" style="margin-top: auto; margin-bottom: auto;">
                              {{ tu.name }}
                            </IonText>
                          </IonCol>
                          <IonCol size="6">
                            <IonSelect id="evaluation" justify="start" cancel-text="Cancelar" label="Registrar"
                              label-placement="floating" fill="outline" mode="md" style="zoom: 0.9;" :value="tu.value">
                              <IonSelectOption v-for="conceptualType in conceptualTypes" :key="conceptualType.index"
                                :value="conceptualType" selected="conceptualType === s.conceptualType">
                                {{ conceptualType }}
                              </IonSelectOption>
                            </IonSelect>
                          </IonCol>
                        </IonRow>
                      </IonGrid>
                    </IonItem>
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
        <IonCardTitle>Selecione a turma</IonCardTitle>
      </IonCardHeader>

      <IonCardContent>
        <IonText>
          Olá, por favor selecione qual a <b>turma</b> na qual deseja fazer o lançamento de notas conceituais
        </IonText>
      </IonCardContent>
    </IonCard>

    <div style="height: 64px;" />
    <template #footer>
      <IonToolbar>
        <IonGrid>
          <IonRow>
            <IonCol size="12">
              <IonButton :disabled="isLoading" color="secondary" expand="full" @click="($event) => $event">
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
