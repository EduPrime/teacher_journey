<script setup lang="ts">
import { IonAccordion, IonAccordionGroup, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonIcon, IonItem, IonLabel, IonModal, IonSelect, IonSelectOption, IonTextarea } from '@ionic/vue'
import { add, calendarOutline, save } from 'ionicons/icons'
import { computed, defineProps, onMounted, ref, watch } from 'vue'
import GradeService from '../../services/GradeService'

interface AvailableDisciplines { id: string, name: string, classroomId: string }
interface Props {
  availableDisciplines: AvailableDisciplines[]
  teacherId: string
  classroomId: string
  selectedDay: string
  disciplineId?: string
  saveFunction: () => void
}

const props = defineProps<Props>()
const availableDisciplineIds = ref<string[]>([])

const gradeService = new GradeService()

const filledContent = ref({
  disciplines: [],
  date: computed(() => props.selectedDay),
  description: '',
  bnccs: [],
  teacherId: computed(() => props.teacherId),
})

watch(() => props.availableDisciplines, async (newValue) => {
  if (newValue && newValue.length > 0) {
    availableDisciplineIds.value = []
    props.availableDisciplines.map((discipline: AvailableDisciplines) => {
      if (discipline.classroomId === props.classroomId) {
        availableDisciplineIds.value.push(discipline.id)
      }
      return void 0
    })

    const itemGrade = await gradeService.getGradesByDisciplines(availableDisciplineIds.value.length > 0
      ? availableDisciplineIds.value
      : props.availableDisciplines.map((disciplines: AvailableDisciplines) => { return disciplines.id }))

    console.log('@#@#itemGrade:', itemGrade)
  }
}, { immediate: true })
onMounted(async () => {
//   const itemGrade = await gradeService.getAllGrades([''])
//   console.log('@#@#itemGrade:', itemGrade)
})
</script>

<template>
  <IonCard id="NovoRegistroFormulario" class="ion-no-padding ion-margin-top">
    <IonCardHeader color="lightaccent">
      <div style="display: flex; align-items: center; height: 10px;">
        <IonIcon :icon="save" size="small" style="margin-right: 8px;" />
        <IonCardTitle style="font-size: medium;">
          Registro de conteúdo
        </IonCardTitle>
      </div>
    </IonCardHeader>

    <div>
      <IonCardContent class="ion-padding-top">
        <IonSelect
          v-model="filledContent.disciplines"
          class="ion-select-card-content"
          label="Disciplina"
          label-placement="floating"
          fill="outline"
          cancel-text="Cancelar"
          :multiple="true"
        >
          <IonSelectOption v-for="(discipline, index) in availableDisciplines" :key="index" :value="discipline.id">
            {{ discipline.name }}
          </IonSelectOption>
        </IonSelect>
        <br>
        <IonTextarea
          v-model="filledContent.description"
          label="Conteúdo"
          label-placement="floating"
          fill="outline"
          placeholder="Digite o conteúdo"
          style="--color: var(--ion-color-secondary);"
          :auto-grow="true"
        />
        <br>
        <IonSelect
          class="ion-select-card-content"
          label="Currículos"
          label-placement="floating"
          fill="outline"
          cancel-text="Cancelar"
          style="--color: var(--ion-color-secondary);"
          :multiple="true"
        >
          <IonSelectOption>EF02LP00PE - Leitura e interpretação textual bas</IonSelectOption>
          <IonSelectOption>EF02LP01PE - Uso do material didático na sala d</IonSelectOption>
        </IonSelect>
        <div class="ion-margin-top" style="display: flex; justify-content: right;">
          <IonButton color="danger" size="small" style="text-transform: capitalize;">
            Cancelar
          </IonButton>
          <IonButton color="secondary" size="small" style="text-transform: capitalize;" @click="saveFunction()">
            Salvar
          </IonButton>
        </div>
      </IonCardContent>
    </div>
  </IonCard>
</template>
