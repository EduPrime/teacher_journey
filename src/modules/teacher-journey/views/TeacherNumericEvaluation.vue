<script setup lang="ts">
import type { MountedStudent } from '../types/types'
import EduFilterProfile from '@/components/FilterProfile.vue'
import ContentLayout from '@/components/theme/ContentLayout.vue'
import showToast from '@/utils/toast-alert'

import { IonAccordion, IonAccordionGroup, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonCol, IonGrid, IonIcon, IonInput, IonItem, IonLabel, IonLoading, IonRadio, IonRadioGroup, IonRow, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonText, IonToolbar } from '@ionic/vue'

import Decimal from 'decimal.js'

import { apps, calculator } from 'ionicons/icons'

import { ErrorMessage, Field, Form, useForm } from 'vee-validate'
import { onMounted, ref, watch } from 'vue'

import EduStageTabs from '../components/StageTabs.vue'
import EnrollmentService from '../services/EnrollmentService'

import NumericGradeSevice from '../services/NumericGradeService'
import StageService from '../services/StageService'

import { IonAlert } from '@ionic/vue'

const showSaveConfirm = ref(false)
const showDeleteConfirm = ref(false)
const currentStudentToSave = ref<StudentGrade | null>(null)
const currentStudentToDelete = ref<StudentGrade | null>(null)

const stageService = new StageService()

const stages = ref()

const enrollmentService = new EnrollmentService()

const eduFProfile = ref()

const numericGradeService = new NumericGradeSevice()

const currentStage = ref()
const students = ref()

/* interface FormContext {
  errors: Record<string, string>;
  setFieldError: (field: string, message: string | undefined) => void;
  validate: () => Promise<{ valid: boolean }>;
} */

interface StudentGrade extends MountedStudent {
  id: string
  at1: string
  at2: string
  at3: string
  at4: string
  at5: string
  makeUp: string
  //exam1: string
  grade: string
}

const studentList = ref<StudentGrade[]>()
const numericStudentList = ref()

const isLoading = ref(false)

function computedEvaluationActivity(s: StudentGrade) {
  const activityValues = [s.at1, s.at2, s.at3, s.at4, s.at5].map(value => Number.parseFloat(value) || 0)
  return activityValues.reduce((sum, val) => sum + val, 0)
}

/*function evaluationValidate(s:StudentGrade): boolean {
  const evaluationValues = [s.at1, s.at2, s.at3, s.at4, s.at5, s.makeUp, s.grade].map(value => Number.parseFloat(value) || 0)

  console.log('evaluationValues dentro da função', evaluationValues)

  for (const evaluation of evaluationValues) {
    console.log('evaluation', evaluation)

    if (Number.isNaN(evaluation) || evaluation < 0 || evaluation > 10) {
      console.log('entrou')
      return false
    }
  }
  return true
}*/

function evaluationValidate(s: StudentGrade): boolean {
  const evaluationFields = [
    { value: s.at1, name: '1ª Atividade' },
    { value: s.at2, name: '2ª Atividade' },
    { value: s.at3, name: '3ª Atividade' },
    { value: s.at4, name: '4ª Atividade' },
    { value: s.at5, name: '5ª Atividade' },
    { value: s.makeUp, name: 'Recuperação Parcial' },
    { value: s.grade, name: '2ª Nota: Prova' }
  ]

  for (const field of evaluationFields) {
    if (field.value === '') continue
    
    const numericValue = Number.parseFloat(field.value)
    
    if (Number.isNaN(numericValue)) {
      showToast(`${field.name}: Valor inválido (não é um número)`, 'top', 'warning');
      return false
    }
    
    if (numericValue < 0) {
      showToast(`${field.name}: A nota não pode ser negativa`, 'top', 'warning');
      return false
    }
    
    if (numericValue > 10) {
      showToast(`${field.name}: A nota não pode ser maior que 10`, 'top', 'warning');
      return false
    }
  }
  
  return true
}

function computedMeanWithMakeUp(s: StudentGrade): number {
    const activityEvaluation = computedEvaluationActivity(s)
    const exam2Evaluation = parseFloat(s.grade || '0')
    const makeUpEvaluation = parseFloat(s.makeUp || '0') 

    const minorEvaluation = Math.min(activityEvaluation, exam2Evaluation)
    const hightestEvaluation = Math.max(activityEvaluation, exam2Evaluation)

    if (makeUpEvaluation > minorEvaluation) return (makeUpEvaluation + hightestEvaluation)/2

    return (activityEvaluation + exam2Evaluation)/2
}

// Watcher que observa o filtro e o calendário para montar a listágem de alunos
watch([eduFProfile, currentStage], async ([newEduFProfile, newCurrentStage]) => {
  numericStudentList.value = []
  studentList.value = []

  if (newEduFProfile?.classroomId && newEduFProfile?.disciplineId) {
    // Carrega as notas numéricas existentes
    numericStudentList.value = await numericGradeService.getNumericGrade(newEduFProfile.classroomId, newEduFProfile.disciplineId)

    // Carrega os alunos da turma
    students.value = await enrollmentService.getClassroomStudents(newEduFProfile.classroomId)

    // Mapeia os alunos com base nas notas numéricas e na etapa atual
    studentList.value = students.value.map((i: any) => {
      const studentNumeric = numericStudentList.value.find((s: any) =>
        s.studentId === i.studentId
        && s.classroomId === newEduFProfile.classroomId
        && s.disciplineId === newEduFProfile.disciplineId
        && s.stageId === newCurrentStage?.id,
      )

      return {
        id: studentNumeric?.id || '',
        name: i.name,
        enrollmentId: i.id,
        classroomId: newEduFProfile.classroomId,
        disciplineId: newEduFProfile.disciplineId,
        studentId: i.studentId,
        schoolId: i.schoolId,
        stageId: newCurrentStage?.id || '', // Atualiza o stageId com o currentStage
        status: i.status,
        situation: i.situation,
        disability: i.student.disability,
        teacherId: newEduFProfile.teacherId,
        at1: studentNumeric?.at1 || '',
        at2: studentNumeric?.at2 || '',
        at3: studentNumeric?.at3 || '',
        at4: studentNumeric?.at4 || '',
        at5: studentNumeric?.at5 || '',
        makeUp: studentNumeric?.makeUp || '',
        grade: studentNumeric?.grade || '',
      }
    })
  }
  else {
    students.value = undefined
    studentList.value = undefined
  }
})

/* watch(() => studentList.value, (newList) => {
  if (newList) {
    newList.forEach(student => {
      const { validateField } = useForm();

      watch([
        () => student.at1,
        () => student.at2,
        () => student.at3,
        () => student.at4,
        () => student.at5
      ], () => {

        console.log('entrou aqui')

        validateField("1ª Atividade");
        validateField("2ª Atividade");
        validateField("3ª Atividade");
        validateField("4ª Atividade");
        validateField("5ª Atividade");

      }, { deep: true });
    });
  }
}, { deep: true }); */

async function handleSave(s: any) {
  try {

    isLoading.value = true

    if (!evaluationValidate(s)) {
      return false
    } 

    // const exam1 = computedEvaluationActivity(s)
    const atividadesSum = computedEvaluationActivity(s)

    if (atividadesSum > 10) {
      showToast('A soma das atividades não pode ser maior que 10', 'top', 'warning')
      return false
    }

    const payload = {
      classroomId: s.classroomId,
      disciplineId: s.disciplineId,
      enrollmentId: s.enrollmentId,
      studentId: s.studentId,
      stageId: currentStage.value?.id || '',
      schoolId: s.schoolId,
      at1: new Decimal(s.at1 || 0),
      at2: new Decimal(s.at2 || 0),
      at3: new Decimal(s.at3 || 0),
      at4: new Decimal(s.at4 || 0),
      at5: new Decimal(s.at5 || 0),
      makeUp: new Decimal(s.makeUp || 0),
      grade: new Decimal(s.grade || 0),
      // grade: new Decimal(((Number.parseFloat(s.exam1) || 0) + (Number.parseFloat(s.exam2) || 0)) / 2),
    }
    await numericGradeService.upsertNumericGrade(payload)
    showToast('Nota salva com sucesso', 'top', 'success')
  }
  catch (error: any) {
    showToast('Erro ao salvar nota', 'top', 'warning')
    console.error('Erro ao salvar notas: ', error.message)
  }
  finally {
    isLoading.value = false
  }
}

async function handleClear(s: StudentGrade) {
  try {

    if (s.id) {
      await numericGradeService.softDeleteNumericGrade(s.id, s.teacherId)
    }

    s.at1 = ''
    s.at2 = ''
    s.at3 = ''
    s.at4 = ''
    s.at5 = ''
    s.makeUp = ''
    //s.exam1 = ''
    s.grade = ''
    
    showToast('Nota apagada com sucesso!', 'top', 'success')
  }
  catch (error: any) {
    showToast('Erro ao apagar nota', 'top', 'warning')
    console.error('Erro ao apagar notas: ', error.message)
  }
  finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  stages.value = await stageService.getAllStages()
})
</script>

<template>
  <ContentLayout>
    <EduFilterProfile :discipline="true" @update:filtered-ocupation="($event) => eduFProfile = $event" />
    <h3>
      <IonText color="secondary" class="ion-content ion-padding-bottom" style="display: flex; align-items: center;">
        <IonIcon color="secondary" style="margin-right: 10px;" aria-hidden="true" :icon="calculator" />
        Registro Numérico
      </IonText>
    </h3>

    <div v-if=" eduFProfile?.classroomId && (eduFProfile?.evaluation === 'conceitual' || eduFProfile?.disciplineId)">
      <EduStageTabs v-model="currentStage" :stages="stages">
        <template v-for="stage in stages" :key="stage" #[stage.numberStage]>
          <IonAccordionGroup v-if="studentList && studentList.length > 0" class="ion-content" expand="inset">
            <IonAccordion v-for="(s, i) in studentList" :key="i" :value="`${i}`" class="no-border-accordion">
              <IonItem slot="header">
                <IonLabel style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px;">
                  <IonText color="secondary">
                    {{ s.name }}
                  </IonText>
                  <IonChip mode="md" color="secondary" :style="{
                        background: computedMeanWithMakeUp(s) >= 7
                        ? 'rgba(56, 142, 60, 0.15)' 
                        : 'rgba(79, 41, 116, 0.1)', 
                        color: computedMeanWithMakeUp(s) >= 7
                        ? '#388E3C'
                        : '#4F2974',
                        fontWeight: 'bold'
                    }">
                    Média: {{ computedMeanWithMakeUp(s).toFixed(1) }}
                   </IonChip>
                  <IonChip v-if="!s.disability" class="ion-no-margin" style="margin: auto 0 auto auto;" :style=" s.situation === 'CURSANDO' ? 'margin-right: 0px;' : ''" mode="md" color="tertiary">
                    PCD
                  </IonChip>
                </IonLabel>
              </IonItem>
              <div slot="content" class="ion-padding">
                <Form @submit="handleSave(s)">
                  <IonGrid>
                    <!-- Linha 1 -->
                    <IonRow>
                      <IonCol size="6">
                        <IonItem lines="none">
                          <Field v-slot="{ field }" name="1ª Atividade" rules="notaValida">
                            <IonInput v-bind="field" v-model="s.at1" class="input-rounded" title="1ª Atividade" label="1ª Atividade" label-placement="floating" placeholder="Digite a nota" />
                          </Field>
                        </IonItem>
                        <ErrorMessage v-slot="{ message }" name="1ª Atividade">
                          <span class="error-message">{{ message }}</span>
                        </ErrorMessage>
                      </IonCol>
                      <IonCol size="6">
                        <!-- Para no mobile uma linha com cada campo mais largo <IonCol size="8" size-md="6">-->
                        <IonItem lines="none">
                          <Field v-slot="{ field }" name="2ª Atividade" rules="notaValida">
                            <IonInput v-bind="field" v-model="s.at2" class="input-rounded" title="2ª Atividade" label="2ª Atividade" label-placement="floating" placeholder="Digite a nota" />
                          </Field>
                        </IonItem>
                        <ErrorMessage v-slot="{ message }" name="2ª Atividade">
                          <span class="error-message">{{ message }}</span>
                        </ErrorMessage>
                      </IonCol>
                    </IonRow>

                    <!-- Linha 2 -->
                    <IonRow>
                      <IonCol size="6">
                        <IonItem lines="none">
                          <Field v-slot="{ field }" name="3ª Atividade" rules="notaValida">
                            <IonInput v-bind="field" v-model="s.at3" class="input-rounded" title="3ª Atividade" label="3ª Atividade" label-placement="floating" placeholder="Digite a nota" />
                          </Field>
                        </IonItem>
                        <ErrorMessage v-slot="{ message }" name="3ª Atividade">
                          <span class="error-message">{{ message }}</span>
                        </ErrorMessage>
                      </IonCol>
                      <IonCol size="6">
                        <IonItem lines="none">
                          <Field v-slot="{ field }" name="4ª Atividade" rules="notaValida">
                            <IonInput v-bind="field" v-model="s.at4" class="input-rounded" title="4ª Atividade" label="4ª Atividade" label-placement="floating" placeholder="Digite a nota" />
                          </Field>
                        </IonItem>
                        <ErrorMessage v-slot="{ message }" name="4ª Atividade">
                          <span class="error-message">{{ message }}</span>
                        </ErrorMessage>
                      </IonCol>
                    </IonRow>

                    <!-- Linha 3 -->
                    <IonRow>
                      <IonCol size="6">
                        <IonItem lines="none">
                          <Field v-slot="{ field }" name="5ª Atividade" rules="notaValida">
                            <IonInput v-bind="field" v-model="s.at5" class="input-rounded" title="5ª Atividade" label="5ª Atividade" label-placement="floating" placeholder="Digite a nota" />
                          </Field>
                        </IonItem>
                        <ErrorMessage v-slot="{ message }" name="5ª Atividade">
                          <span class="error-message">{{ message }}</span>
                        </ErrorMessage>
                      </IonCol>
                      <IonCol size="6">
                        <IonItem lines="none">
                          <Field v-slot="{ field }" name="Recuperação Parcial" rules="notaValida">
                            <IonInput v-bind="field" v-model="s.makeUp" class="input-rounded" title="Recuperação Parcial" label="Recuperação Parcial" label-placement="floating" placeholder="Digite a nota" />
                          </Field>
                        </IonItem>
                        <ErrorMessage v-slot="{ message }" name="Recuperação Parcial">
                          <span class="error-message">{{ message }}</span>
                        </ErrorMessage>
                      </IonCol>
                    </IonRow>

                    <!-- Linha 4  -->
                    <IonRow>
                    <IonCol size="6">
                        <IonItem lines="none">
                            <IonInput
                                class="input-rounded"
                                title="1ª Nota: Atividade"
                                label="1ª Nota: Atividades"
                                label-placement="floating"
                                :value="computedEvaluationActivity(s).toFixed(2)"
                                disabled
                            />
                        </IonItem>
                        <div v-if="computedEvaluationActivity(s) > 10" class="error-message" style="margin-top: 4px;">
                        A soma das notas das atividades não pode ultrapassar 10.
                        </div>
                    </IonCol>
                        <IonCol size="6">
                            <IonItem lines="none">
                            <Field v-slot="{ field }" name="2ª Nota: Prova" rules="notaValida">
                                <IonInput
                                v-bind="field"
                                v-model="s.grade"
                                class="input-rounded"
                                title="2ª Nota: Prova"
                                label="2ª Nota: Prova"
                                label-placement="floating"
                                placeholder="Digite a nota"
                                />
                            </Field>
                            </IonItem>
                            <ErrorMessage v-slot="{ message }" name="2ª Nota: Prova">
                            <span class="error-message">{{ message }}</span>
                            </ErrorMessage>
                        </IonCol>
                    </IonRow>

                    <!-- Linha dos botões -->
                    <IonRow class="ion-margin-top">
                      <IonCol size="6">
                        <IonButton color="danger" expand="block" @click="() => { currentStudentToDelete = s; showDeleteConfirm = true; }">
                          Limpar
                        </IonButton>
                      </IonCol>
                      <IonCol size="6">
                        <IonButton color="secondary" expand="block" @click="() => { currentStudentToSave = s; showSaveConfirm = true; }">
                          Salvar
                        </IonButton>
                      </IonCol>
                    </IonRow>
                  </IonGrid>

                  <IonAlert 
                    :is-open="showSaveConfirm" 
                    header="Confirmação de Salvamento"
                    message="Deseja salvar as alterações para este aluno?"
                    :buttons="[
                        { text: 'Cancelar', role: 'cancel' },
                        { 
                        text: 'Confirmar', 
                        handler: () => { 
                            if (currentStudentToSave) {
                            handleSave(currentStudentToSave)
                            }
                        }
                        }
                    ]"
                    @did-dismiss="showSaveConfirm = false" 
                    cssClass="my-custom-alert"
                    />

                    <IonAlert 
                    :is-open="showDeleteConfirm" 
                    header="Confirmação de Limpeza"
                    message="Deseja limpar as notas para este aluno?"
                    :buttons="[
                        { text: 'Cancelar', role: 'cancel' },
                        { 
                        text: 'Confirmar', 
                        handler: () => { 
                            if (currentStudentToDelete) {
                            handleClear(currentStudentToDelete)
                            }
                        }
                        }
                    ]"
                    @did-dismiss="showDeleteConfirm = false" 
                    cssClass="my-custom-alert"
                    />
                </Form>
              </div>
            </IonAccordion>
          </IonAccordionGroup>
        </template>
      </EduStageTabs>
      <!-- <IonAccordionGroup v-if="studentList && studentList.length > 0" class="ion-content" expand="inset">
        <IonAccordion v-for="(s, i) in studentList" :key="i" :value="`${i}`" class="no-border-accordion">
          <IonItem slot="header">
            <IonLabel style="display: flex">
              <IonText color="secondary" style="margin: auto 0 auto 0;">
                {{ s.name }}
              </IonText>
              <IonChip v-if="s.situation === 'CURSANDO'" class="ion-no-margin" style="margin: auto 0 auto auto;" :style="!s.disability ? 'margin-right: 0px;' : ''" mode="md" color="light">
                {{ s.situation.toLowerCase() }}
              </IonChip>
              <IonChip v-if="!s.disability" class="ion-no-margin" style="margin: auto 0 auto auto;" :style=" s.situation === 'CURSANDO' ? 'margin-left: 0px;' : ''" mode="md" color="tertiary">
                PCD
              </IonChip>
            </IonLabel>
          </IonItem>
          <div slot="content" class="ion-padding" />
        </IonAccordion>
      </IonAccordionGroup> -->
      <!-- <IonCard v-else color="warning">
        <IonCardHeader>
          <IonCardTitle>Alunos não encontrados</IonCardTitle>
        </IonCardHeader>

        <IonCardContent>
          <IonText>
            Nenhum aluno encontrado. Por favor entre em contato com a secretaria de sua escola para verificar se sua turma foi cadastrada corretamente.
          </IonText>
        </IonCardContent>
      </IonCard> -->
    </div>

    <IonCard v-else color="info">
      <IonCardHeader>
        <IonCardTitle>Selecione a turma</IonCardTitle>
      </IonCardHeader>

      <IonCardContent>
        <IonText>
          Olá, por favor selecione qual a <b>turma</b> na qual deseja fazer o lançamento de notas numéricas
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

:global(ion-alert.my-custom-alert) {
  --backdrop-opacity: 0;
}

:global(ion-alert.my-custom-alert)::part(backdrop) {
  background: rgba(0, 0, 0, 0.01); 
  backdrop-filter: blur(0.25px);
}

:global(ion-alert.my-custom-alert .alert-wrapper) {
  box-shadow: none ;
}

ion-card-header#accordionContentHeader {
    --background: rgba(var(--ion-color-secondary-rgb), 0.15);
    --color: var(--ion-color-secondary);
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

/*.styled-input {
  --background: #f8f8f8;
  --border-radius: 12px;
  --highlight-color-focused: var(--ion-color-secondary);
  --padding-start: 12px;
  --padding-end: 12px;
  --min-height: 52px;
  margin-bottom: 12px;
  border: 1px solid transparent;
  border-radius: 12px;
  transition: border 0.2s ease, box-shadow 0.2s ease;
}

.styled-input.ion-focused {
  border: 1px solid var(--ion-color-secondary);
  box-shadow: 0 0 0 1px var(--ion-color-secondary);
}*/

.input-rounded {
  --background: #fff;
  --inner-background: #fff;
  --border-color: #ccc;
  --border-width: 1px;
  --border-style: solid;
  --border-radius: 12px;
  --highlight-color-focused: #4F2974;
  --padding-start: 14px;
  --padding-end: 14px;
  --min-height: 44px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  transition: all 0.2s ease;
  margin-bottom: 12px;
  --color: #4F2974;
}

.error-message {
  color: red;
  font-size: 1rem;
  margin-left: 1.2rem;
  display: inline-block;
}
</style>
