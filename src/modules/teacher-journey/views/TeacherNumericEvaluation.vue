<script setup lang="ts">
import type { MountedStudent } from '../types/types'
import EduFilterProfile from '@/components/FilterProfile.vue'
import ContentLayout from '@/components/theme/ContentLayout.vue'

import { IonAccordion, IonAccordionGroup, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonCol, IonGrid, IonIcon, IonItem, IonInput, IonLabel, IonLoading, IonRadio, IonRadioGroup, IonRow, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonText, IonToolbar } from '@ionic/vue'

import { apps, text } from 'ionicons/icons'

import { onMounted, ref, watch } from 'vue'
import { Field, ErrorMessage, useForm, Form } from 'vee-validate';

import EduStageTabs from '../components/StageTabs.vue'

import EnrollmentService from '../services/EnrollmentService'

import StageService from '../services/StageService'
import NumericGradeSevice from '../services/NumericGradeService'

import Decimal from 'decimal.js'

const stageService = new StageService()

const stages = ref()

const enrollmentService = new EnrollmentService()

const eduFProfile = ref()

const numericGradeService = new NumericGradeSevice()

const currentStage = ref()
const students = ref()

/*interface FormContext {
  errors: Record<string, string>;
  setFieldError: (field: string, message: string | undefined) => void;
  validate: () => Promise<{ valid: boolean }>;
}*/

interface StudentGrade extends MountedStudent {
  at1: string
  at2: string
  at3: string
  at4: string
  at5: string
  makeUp: string
  exam1: string
  exam2: string
  //form?: FormContext;
}

const studentList = ref<StudentGrade[]>()

const isLoading = ref(false)

function computedEvaluationActivity (s: StudentGrade) {
    const activityValues = [s.at1, s.at2, s.at3, s.at4, s.at5].map(value => parseFloat(value) || 0)
    return activityValues.reduce((sum, val) => sum + val, 0)
}

// Watcher que observa o filtro e o calendário para montar a listágem de alunos
watch(eduFProfile, async (newValue) => {
  if (newValue && newValue?.classroomId) {
    // stage.value = await stageService.getCurrentStageWeekday(newSelectedDayInfo.selectedDate)

    students.value = await enrollmentService.getClassroomStudents(newValue.classroomId)
    studentList.value = students.value.map((i: any) => {
      return {
        name: i.name,
        enrollmentId: i.id,
        classroomId: newValue.classroomId,
        disciplineId: newValue.disciplineId,
        studentId: i.studentId,
        schoolId: i.schoolId,
        // stageId: stage.value?.stageId,
        status: i.status,
        situation: i.situation,
        disability: i.student.disability,
        teacherId: newValue.teacherId,
        at1: '',
        at2: '',
        at3: '',
        at4: '',
        at5: '',
        makeUp: '',
        exam2: ''
      }
    })
  }
  else {
    students.value = undefined
  }
})

/*watch(() => studentList.value, (newList) => {
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
}, { deep: true });*/

async function handleSave(s: any) {
  try {
    isLoading.value = true

    const exam1 = computedEvaluationActivity(s)

    const payload = {
      classroomId: s.classroomId,
      disciplineId: s.disciplineId,
      enrollmentId: s.id,
      studentId: s.studentId,
      stageId: currentStage.value?.stageId || '',
      schoolId: s.schoolId,
      at1: new Decimal(s.at1 || 0),
      at2: new Decimal(s.at2 || 0),
      at3: new Decimal(s.at3 || 0),
      at4: new Decimal(s.at4 || 0),
      at5: new Decimal(s.at5 || 0),
      makeUp: new Decimal(s.makeUp || 0),
      exam1: new Decimal(exam1),
      exam2: new Decimal(s.exam2 || 0),
      grade: new Decimal((exam1 + s.exam2) / 2)
    }
    await numericGradeService.upsertNumericGrade(payload)
  } catch (error: any) {
    console.error('Erro ao salvar notas: ', error.message)
  } finally {
    isLoading.value = false
  }
}

function handleClear(s: StudentGrade) {
  s.at1 = ''
  s.at2 = ''
  s.at3 = ''
  s.at4 = ''
  s.at5 = ''
  s.makeUp = ''
  s.exam2 = ''
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
        <IonIcon color="secondary" style="margin-right: 10px;" aria-hidden="true" :icon="text" />
      </IonText>
    </h3>

    <div v-if=" eduFProfile?.classroomId && (eduFProfile?.evaluation === 'conceitual' || eduFProfile?.disciplineId)">
      <EduStageTabs v-model="currentStage" :stages="stages">
        <template v-for="stage in stages" :key="stage" #[stage.numberStage]>
          <IonAccordionGroup v-if="studentList && studentList.length > 0" class="ion-content" expand="inset">
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
              <div slot="content" class="ion-padding">
                <Form @submit="handleSave(s)">
                <IonGrid>
                    <!-- Linha 1 -->
                    <IonRow>
                        <IonCol size="6">
                        <IonItem lines="none">
                            <Field name="1ª Atividade" rules="notaValida|somaAtividades" v-slot="{ field }">
                                <IonInput v-bind="field" v-model="s.at1" class="input-rounded" label="1ª Atividade" label-placement="floating" placeholder="Digite a nota"></IonInput>
                            </Field>
                        </IonItem>
                        <ErrorMessage name="1ª Atividade" v-slot="{ message }">
                            <span class="error-message">{{ message }}</span>
                        </ErrorMessage>
                        </IonCol>
                        <IonCol size="6">
                        <IonItem lines="none">
                            <Field name="2ª Atividade" rules="notaValida|somaAtividades" v-slot="{ field }">
                                <IonInput v-bind="field" class="input-rounded" label="2ª Atividade" label-placement="floating" placeholder="Digite a nota" v-model="s.at2" />
                            </Field>
                        </IonItem>
                        <ErrorMessage name="2ª Atividade" v-slot="{ message }">
                            <span class="error-message">{{ message }}</span>
                        </ErrorMessage>
                        </IonCol>
                    </IonRow>

                    <!-- Linha 2 -->
                    <IonRow>
                        <IonCol size="6">
                            <IonItem lines="none">
                                <Field name="3ª Atividade" rules="notaValida|somaAtividades" v-slot="{ field }">
                                    <IonInput v-bind="field" class="input-rounded" label="3ª Atividade" label-placement="floating" placeholder="Digite a nota" v-model="s.at3"/>
                                </Field>
                            </IonItem>
                            <ErrorMessage name="3ª Atividade" v-slot="{ message }">
                                <span class="error-message">{{ message }}</span>
                            </ErrorMessage>
                        </IonCol>
                        <IonCol size="6">
                        <IonItem lines="none">
                            <Field name="4ª Atividade" rules="notaValida|somaAtividades" v-slot="{ field }">
                                <IonInput v-bind="field" class="input-rounded" label="4ª Atividade" label-placement="floating" placeholder="Digite a nota" v-model="s.at4" />
                            </Field>
                        </IonItem>
                        <ErrorMessage name="4ª Atividade" v-slot="{ message }">
                            <span class="error-message">{{ message }}</span>
                        </ErrorMessage>
                        </IonCol>
                    </IonRow>

                    <!-- Linha 3 -->
                    <IonRow>
                        <IonCol size="6">
                        <IonItem lines="none">
                            <Field name="5ª Atividade" rules="notaValida|somaAtividades" v-slot="{ field }">
                                <IonInput v-bind="field" class="input-rounded" label="5ª Atividade" label-placement="floating" placeholder="Digite a nota" v-model="s.at5" />
                            </Field>
                        </IonItem>
                        <ErrorMessage name="5ª Atividade" v-slot="{ message }">
                            <span class="error-message">{{ message }}</span>
                        </ErrorMessage>
                        </IonCol>
                        <IonCol size="6">
                        <IonItem lines="none">
                            <Field name="Recuperação Parcial" rules="notaValida|somaAtividades" v-slot="{ field }">
                                <IonInput v-bind="field" class="input-rounded" label="Recuperação Parcial" label-placement="floating" placeholder="Digite a nota" v-model="s.makeUp" />
                            </Field>
                        </IonItem>
                        <ErrorMessage name="Recuperação Parcial" v-slot="{ message }">
                            <span class="error-message">{{ message }}</span>
                        </ErrorMessage>
                        </IonCol>
                    </IonRow>

                    <!-- Linha 4 (onde um campo está desabilitado) -->
                    <IonRow>
                        <IonCol size="6">
                        <IonItem lines="none">
                            <IonInput class="input-rounded" label="1ª Nota: Atividades" :value="computedEvaluationActivity(s).toFixed(2)" disabled />
                        </IonItem>
                        </IonCol>
                        <IonCol size="6">
                        <IonItem lines="none">
                            <Field name="2ª Nota: Prova" rules="notaValida" v-slot="{ field }">
                                <IonInput v-bind="field" class="input-rounded" label="2ª Nota: Prova" label-placement="floating" placeholder="Digite a nota" v-model="s.exam2" />
                            </Field>
                        </IonItem>
                        <ErrorMessage name="2ª Nota: Prova" v-slot="{ message }">
                            <span class="error-message">{{ message }}</span>
                        </ErrorMessage>
                        </IonCol>
                    </IonRow>

                    <!-- Linha dos botões -->
                    <IonRow class="ion-margin-top">
                        <IonCol size="6">
                        <IonButton color="danger" expand="block" @click="handleClear(s)">
                            Apagar
                        </IonButton>
                        </IonCol>
                        <IonCol size="6">
                        <IonButton color="secondary" expand="block" @click="handleSave(s)">
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
      <IonAccordionGroup v-if="studentList && studentList.length > 0" class="ion-content" expand="inset">
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
          <div slot="content" class="ion-padding">
          </div>
        </IonAccordion>
      </IonAccordionGroup>
      <IonCard v-else color="warning">
        <IonCardHeader>
          <IonCardTitle>Alunos não encontrados</IonCardTitle>
        </IonCardHeader>

        <IonCardContent>
          <IonText>
            Nenhum aluno encontrado. Por favor entre em contato com a secretaria de sua escola para verificar se sua turma foi cadastrada corretamente.
          </IonText>
        </IonCardContent>
      </IonCard>
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
