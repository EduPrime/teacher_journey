<script setup lang="ts">
import type { MountedStudent, RegisteredToSave } from '../types/types'
import EduFilterProfile from '@/components/FilterProfile.vue'
import ContentLayout from '@/components/theme/ContentLayout.vue'
import showToast from '@/utils/toast-alert'
import { IonAccordion, IonAccordionGroup, IonAlert, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonCol, IonGrid, IonIcon, IonInput, IonItem, IonLabel, IonLoading, IonModal, IonRadio, IonRadioGroup, IonRow, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonText, IonToolbar } from '@ionic/vue'
import Decimal from 'decimal.js'

import { alertOutline, calculator, checkmarkCircleOutline, checkmarkOutline, helpOutline, lockClosedOutline } from 'ionicons/icons'
import { ErrorMessage, Field, Form, useForm } from 'vee-validate'

import { computed, onMounted, ref, watch } from 'vue'
import EduStageTabs from '../components/StageTabs.vue'

import EnrollmentService from '../services/EnrollmentService'
import NumericGradeSevice from '../services/NumericGradeService'
import RegisteredGradeService from '../services/RegisteredGradeService'
import StageService from '../services/StageService'

const decimalOptions = {
  mask: Number,
  thousandsSeparator: '',
  radix: ',',
  scale: 2,
  padFractionalZeros: true,
  normalizeZeros: false,
  lazy: false,
  mapToRadix: ['.'],
  prepare: (str: string) => {
    return str.replace('.', ',').replace(/[^\d,]/g, '')
  },
}

const enrollmentService = new EnrollmentService()
const stageService = new StageService()
const numericGradeService = new NumericGradeSevice()
const registeredGradeService = new RegisteredGradeService()

const stages = ref()
const showSaveConfirm = ref(false)
const showDeleteConfirm = ref(false)
const eduFProfile = ref()
const currentStage = ref()
const students = ref()
const showFinalizeConfirm = ref(false)
const stageFinished = ref()
const numericStudentList = ref()
const isLoading = ref(false)
const currentStudentToSave = ref<StudentGrade | null>(null)
const currentStudentToDelete = ref<StudentGrade | null>(null)
const studentList = ref<StudentGrade[]>()
const oldList = ref<StudentGrade[]>()

const saveModal = ref(false)
const deleteModal = ref(false)

const showAlert = ref(false)

const registeredToSave = ref<RegisteredToSave>({
  isCompleted: false,
  teacherId: localStorage.getItem('teacherId'),
  classroomId: '',
  disciplineId: '',
  stageId: '',
})

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
  // exam1: string
  grade: string
  teacherId: string
}

const gradesAreFilled = computed (() => studentList.value?.every(item =>
  item.situation !== 'CURSANDO' || (checkMinimalActivities(item) && checkMinimalGrade(item)),
) ?? false)

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

function computedEvaluationActivity(s: StudentGrade) {
  const activityValues = [s.at1, s.at2, s.at3, s.at4, s.at5].map(value => value ? Number.parseFloat(value) : 0)
  return activityValues.reduce((sum, val) => sum + val, 0)
}

/* function evaluationValidate(s:StudentGrade): boolean {
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
} */

function evaluationValidate(s: StudentGrade): boolean {
  const evaluationFields = [
    { value: s.at1, name: '1ª Atividade' },
    { value: s.at2, name: '2ª Atividade' },
    { value: s.at3, name: '3ª Atividade' },
    { value: s.at4, name: '4ª Atividade' },
    { value: s.at5, name: '5ª Atividade' },
    { value: s.makeUp, name: 'Recuperação Parcial' },
    { value: s.grade, name: '2ª Nota: Prova' },
  ]

  for (const field of evaluationFields) {
    if (field.value === '')
      continue

    const numericValue = Number.parseFloat(String(field.value).replace(',', '.'))

    if (Number.isNaN(numericValue)) {
      showToast(`${field.name}: Valor inválido (não é um número)`, 'top', 'warning')
      return false
    }

    if (numericValue < 0) {
      showToast(`${field.name}: A nota não pode ser negativa`, 'top', 'warning')
      return false
    }

    if (numericValue > 10) {
      showToast(`${field.name}: A nota não pode ser maior que 10`, 'top', 'warning')
      return false
    }
  }

  return true
}

function computedMeanWithMakeUp(s: StudentGrade): number {
  const activityEvaluation = computedEvaluationActivity(s)
  const exam2Evaluation = Number.parseFloat(s.grade || '0')
  const makeUpEvaluation = Number.parseFloat(s.makeUp || '0')

  const minorEvaluation = Math.min(activityEvaluation, exam2Evaluation)
  const hightestEvaluation = Math.max(activityEvaluation, exam2Evaluation)

  if (makeUpEvaluation > minorEvaluation)
    return (makeUpEvaluation + hightestEvaluation) / 2

  return (activityEvaluation + exam2Evaluation) / 2
}

function calculateStatus(s: StudentGrade, grade: any): string {
  if (s.situation !== 'CURSANDO') {
    return 'BLOQUEADO'
  }
  if (grade) {
    return 'CONCLUÍDO'
  }
  return 'INCOMPLETO'
}

function convertToDecimal(value: any): Decimal {
  if (
    value === null
    || value === undefined
    || String(value).trim() === ''
  ) {
    return new Decimal(0)
  }
  const strValue = String(value)
  const sanitizedValue = strValue.replace(',', '.')
  return new Decimal(sanitizedValue)
}

// Watcher que observa o filtro e o calendário para montar a listágem de alunos
watch([eduFProfile, currentStage], async ([newEduFProfile, newCurrentStage]) => {
  numericStudentList.value = []
  studentList.value = []

  if (newEduFProfile?.classroomId && newEduFProfile?.disciplineId) {
    // Checa se registro de notas já foi finalizado

    stageFinished.value = await registeredGradeService.getRegistered(newEduFProfile.classroomId, newEduFProfile.disciplineId, newCurrentStage?.id)

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
        status: calculateStatus(i, studentNumeric?.grade),
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
    oldList.value = JSON.parse(JSON.stringify(studentList.value))
  }
  else {
    students.value = undefined
    studentList.value = undefined
  }
})

/* async function handleFinalize() {
  if (!eduFProfile.value || !currentStage.value) return

  try {
    isLoading.value = true

    export interface RegisteredToSave {
      id?: string
      isCompleted: boolean
      teacherId: string | null
      classroomId: string
      disciplineId: string
      stageId: string
    }

    await registeredGradeService.upsertRegisteredGrade(payload)
    showToast('Notas finalizadas com sucesso!', 'top', 'success')
  } catch (err: any) {
    showToast(`Erro ao finalizar: ${err.message}`, 'top', 'danger')
    console.error(err)
  } finally {
    isLoading.value = false
  }
} */

function checkMinimalActivities(s: StudentGrade): boolean {
  const activityFields = [s.at1, s.at2, s.at3, s.at4, s.at5]
  const validActivities = activityFields.filter((val) => {
    const parsed = Number.parseFloat(val)
    return !isNaN(parsed) && parsed >= 0 && parsed <= 10
  }).length >= 3

  return validActivities
}

function checkMinimalGrade(s: StudentGrade): boolean {
  const gradeValid = (() => {
    const gradeValue = Number.parseFloat(s.grade)
    return !isNaN(gradeValue) && gradeValue >= 0 && gradeValue <= 10
  })()

  return gradeValid
}

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
      at1: convertToDecimal(s.at1),
      at2: convertToDecimal(s.at2),
      at3: convertToDecimal(s.at3),
      at4: convertToDecimal(s.at4),
      at5: convertToDecimal(s.at5),
      makeUp: convertToDecimal(s.makeUp),
      grade: convertToDecimal(s.grade),
    }
    await numericGradeService.upsertNumericGrade(payload)
    const student = studentList.value?.find((s: any) => s.enrollmentId === payload.enrollmentId)
    student ? student.status = 'CONCLUÍDO' : false
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
    // s.exam1 = ''
    s.grade = ''

    showToast('Nota apagada com sucesso!', 'top', 'success')
    const student = studentList.value?.find((st: any) => st.enrollmentId === s.enrollmentId)
    student ? student.status = 'INCOMPLETO' : false
  }
  catch (error: any) {
    showToast('Erro ao apagar nota', 'top', 'warning')
    console.error('Erro ao apagar notas: ', error.message)
  }
  finally {
    isLoading.value = false
  }
}

async function registerGrades(itemToSave: RegisteredToSave) {
  showAlert.value = false
  isLoading.value = true

  try {
    // console.log('studentList.value', studentList.value)

    itemToSave.isCompleted = gradesAreFilled.value

    await registeredGradeService.upsertRegisteredGrade(itemToSave)

    showToast(
      gradesAreFilled.value
        ? 'Registro de notas completas finalizado com sucesso!'
        : 'Registro de notas incompletas finalizado com sucesso!',
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

const computedRegisteredGrade = computed(() => ({
  isCompleted: registeredToSave.value.isCompleted,
  teacherId: registeredToSave.value.teacherId,
  classroomId: eduFProfile.value?.classroomId || '',
  disciplineId: eduFProfile.value?.disciplineId || '',
  stageId: currentStage.value?.id || '',
}))

function compareGrades(oldStudents: StudentGrade[] | undefined, newStudent: StudentGrade) {
  const oldStudent = oldStudents?.find(s => s.enrollmentId === newStudent.enrollmentId)
  const equal = oldStudent && Object.keys(oldStudent).every(key => oldStudent[key as keyof StudentGrade] === newStudent[key as keyof StudentGrade])
  const isNotEmpty = checkMinimalActivities(newStudent) && checkMinimalGrade(newStudent)
  if (equal && isNotEmpty) {
    newStudent.status = 'CONCLUÍDO'
  }
  else if (equal && !isNotEmpty) {
    newStudent.status = 'INCOMPLETO'
  }
  else {
    newStudent.status = 'PENDENTE'
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

    <div v-if="eduFProfile?.classroomId && eduFProfile?.disciplineId">
      <EduStageTabs v-model="currentStage" :stages="stages">
        <template v-for="stage in stages" :key="stage" #[stage.numberStage]>
          <IonCard v-if="stageFinished" :color="stageFinished[0].isCompleted ? 'success' : 'info'">
            <IonCardContent>
              <IonText v-if="stageFinished[0].isCompleted" style="display: flex;">
                <IonIcon size="small" style="margin-top: auto; margin-bottom: auto;" :icon="checkmarkCircleOutline" />
                <span style="margin-top: auto; margin-bottom: auto; margin-left: 5px;">
                  Registro Completo de notas na {{ stage.numberStage }}º Etapa.
                </span>
              </IonText>
              <IonText v-if="!stageFinished[0].isCompleted" style="display: flex;">
                <IonIcon size="small" style="margin-top: auto; margin-bottom: auto;" :icon="alertOutline" />
                <span style="margin-top: auto; margin-bottom: auto; margin-left: 5px;">
                  Registro Parcial de notas na {{ stage.numberStage }}º Etapa.
                </span>
              </IonText>
            </IonCardContent>
          </IonCard>
          <IonAccordionGroup v-if="studentList && studentList.length > 0" class="ion-content" expand="inset">
            <IonAccordion v-for="(s, i) in studentList" :key="i" :value="`${i}`" class="no-border-accordion">
              <IonItem slot="header">
                <IonIcon
                  :color="getStatusColor(s.status)" style="margin-right: 5px; font-size: 24px;"
                  :icon="getStatusIcon(s.status)"
                />
                <IonLabel style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px;">
                  <IonText color="secondary" :style="s.situation !== 'CURSANDO' ? ' opacity: 0.4;' : ''">
                    {{ s.name }}
                  </IonText>
                  <IonChip
                    v-if="checkMinimalActivities(s) && checkMinimalGrade(s)" mode="md" color="secondary" :style="{
                      background: computedMeanWithMakeUp(s) >= 7
                        ? 'rgba(56, 142, 60, 0.15)'
                        : 'rgba(79, 41, 116, 0.1)',
                      color: computedMeanWithMakeUp(s) >= 7
                        ? '#388E3C'
                        : '#4F2974',
                      fontWeight: 'bold',
                    }"
                  >
                    Média: {{ computedMeanWithMakeUp(s).toFixed(1) }}
                  </IonChip>
                  <IonChip
                    v-if="!s.disability && s.situation === 'CURSANDO'" class="ion-no-margin"
                    style="margin: auto 0 auto auto;" :style="s.situation === 'CURSANDO' ? 'margin-right: 0px;' : ''"
                    mode="md" color="tertiary"
                  >
                    PCD
                  </IonChip>
                  <IonChip v-if="s.situation !== 'CURSANDO'" style="margin: auto 0 auto auto;" mode="md">
                    {{ s.situation.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()) }}
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
                            <IonInput
                              v-bind="field" v-model="s.at1" v-imask="decimalOptions" class="input-rounded" title="1ª Atividade"
                              label="1ª Atividade" label-placement="floating" placeholder="Digite a nota"
                              :disabled="s.status === 'BLOQUEADO'" @ion-change="compareGrades(oldList, s)"
                            />
                          </Field>
                        </IonItem>
                        <ErrorMessage v-slot="{ message }" name="1ª Atividade">
                          <span class="error-message">{{ message }}</span>
                        </ErrorMessage>
                      </IonCol>
                      <IonCol size="6">
                        <!-- Para no mobile uma linha com cada campo mais largo <IonCol size="8" size-md="6"> -->
                        <IonItem lines="none">
                          <Field v-slot="{ field }" name="2ª Atividade" rules="notaValida">
                            <IonInput
                              v-bind="field" v-model="s.at2" v-imask="decimalOptions" class="input-rounded" title="2ª Atividade"
                              label="2ª Atividade" label-placement="floating" placeholder="Digite a nota"
                              :disabled="s.status === 'BLOQUEADO'" @ion-change="compareGrades(oldList, s)"
                            />
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
                            <IonInput
                              v-bind="field" v-model="s.at3" v-imask="decimalOptions" class="input-rounded" title="3ª Atividade"
                              label="3ª Atividade" label-placement="floating" placeholder="Digite a nota"
                              :disabled="s.status === 'BLOQUEADO'" @ion-change="compareGrades(oldList, s)"
                            />
                          </Field>
                        </IonItem>
                        <ErrorMessage v-slot="{ message }" name="3ª Atividade">
                          <span class="error-message">{{ message }}</span>
                        </ErrorMessage>
                      </IonCol>
                      <IonCol size="6">
                        <IonItem lines="none">
                          <Field v-slot="{ field }" name="4ª Atividade" rules="notaValida">
                            <IonInput
                              v-bind="field" v-model="s.at4" v-imask="decimalOptions" class="input-rounded" title="4ª Atividade"
                              label="4ª Atividade" label-placement="floating" placeholder="Digite a nota"
                              :disabled="s.status === 'BLOQUEADO'" @ion-change="compareGrades(oldList, s)"
                            />
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
                            <IonInput
                              v-bind="field" v-model="s.at5" v-imask="decimalOptions" class="input-rounded" title="5ª Atividade"
                              label="5ª Atividade" label-placement="floating" placeholder="Digite a nota"
                              :disabled="s.status === 'BLOQUEADO'" @ion-change="compareGrades(oldList, s)"
                            />
                          </Field>
                        </IonItem>
                        <ErrorMessage v-slot="{ message }" name="5ª Atividade">
                          <span class="error-message">{{ message }}</span>
                        </ErrorMessage>
                      </IonCol>
                      <IonCol size="6">
                        <IonItem lines="none">
                          <Field v-slot="{ field }" name="Recuperação Parcial" rules="notaValida">
                            <IonInput
                              v-bind="field" v-model="s.makeUp" v-imask="decimalOptions" class="input-rounded"
                              title="Recuperação Parcial" label="Recuperação Parcial" label-placement="floating"
                              placeholder="Digite a nota" :disabled="s.status === 'BLOQUEADO'"
                              @ion-change="compareGrades(oldList, s)"
                            />
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
                            v-imask="decimalOptions" class="input-rounded" title="1ª Nota: Atividade" label="1ª Nota: Atividades"
                            label-placement="floating" :value="computedEvaluationActivity(s).toFixed(2)" disabled
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
                              v-bind="field" v-model="s.grade" v-imask="decimalOptions" class="input-rounded" title="2ª Nota: Prova"
                              label="2ª Nota: Prova" label-placement="floating" placeholder="Digite a nota"
                              :disabled="s.status === 'BLOQUEADO'" @ion-change="compareGrades(oldList, s)"
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
                        <IonButton
                          color="danger" expand="block"
                          :disabled="s.status === 'BLOQUEADO'"
                          @click="() => { currentStudentToDelete = s; deleteModal = true; }"
                        >
                          Limpar
                        </IonButton>
                      </IonCol>
                      <IonCol size="6">
                        <IonButton
                          color="secondary" expand="block"
                          :disabled="s.status === 'BLOQUEADO'"
                          @click="() => { currentStudentToSave = s; saveModal = true; }"
                        >
                          Salvar
                        </IonButton>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
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
        <IonCardTitle>Selecione a turma e disciplina</IonCardTitle>
      </IonCardHeader>

      <IonCardContent>
        <IonText>
          Olá, por favor selecione qual a <b>turma</b> na qual deseja fazer o lançamento de notas numéricas
        </IonText>
      </IonCardContent>
    </IonCard>

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
                  handleSave(currentStudentToSave)
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
                  handleClear(currentStudentToDelete)
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
      :header="gradesAreFilled ? 'Deseja finalizar os registros?' : 'Registros incompletos'"
      :sub-header="gradesAreFilled ? '' : 'Deseja finalizar assim mesmo?'"
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

    <div style="height: 64px;" />
    <template #footer>
      <IonToolbar>
        <IonGrid>
          <IonRow>
            <IonCol size="12">
              <IonButton
                :disabled="isLoading" color="secondary" expand="full"
                @click="showAlert = true"
              >
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

:global(ion-alert.my-custom-alert) {
  --backdrop-opacity: 0;
}

:global(ion-alert.my-custom-alert)::part(backdrop) {
  background: rgba(0, 0, 0, 0.01);
  backdrop-filter: blur(0.25px);
}

:global(ion-alert.my-custom-alert .alert-wrapper) {
  box-shadow: none;
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
