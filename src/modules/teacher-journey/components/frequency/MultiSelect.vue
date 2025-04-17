<script setup lang="ts">
import showToast from '@/utils/toast-alert'
import { IonAccordion, IonAccordionGroup, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCheckbox, IonItem, IonLabel, IonModal, IonSelect, IonSelectOption, IonText, IonTextarea } from '@ionic/vue'
import { add, calendarOutline, save } from 'ionicons/icons'
import { computed, ref, watch } from 'vue'

interface Props {
  checkboxModal: boolean
  cleanChecks: boolean
  numClasses: number
  currentStudent: any
}

const props = defineProps<Props>()

const emits = defineEmits(['update:modelValue', 'update:clean', 'update:openModal'])

interface ClassPerDay {
  name: string
  absent: boolean
}

const classesPerDay = ref<ClassPerDay[]>([])
const allSelected = ref(false)

watch(() => props.cleanChecks, (newValue) => {
  emits('update:clean', false)
  if (newValue && props.currentStudent?.frequencies?.length === 0) {
    classesPerDay.value = classesPerDay.value.map(i => ({ ...i, absent: false }))
    if (classesPerDay.value.length > 0) {
      classesPerDay.value[0].absent = true
    }
    allSelected.value = classesPerDay.value.every(item => item.absent)
  }
})

watch(classesPerDay, (newList) => {
  allSelected.value = newList.every(item => item.absent)
}, { deep: true })

const initialize = () => {
  if (props.currentStudent?.frequencies?.length > 0) {
    classesPerDay.value = props.currentStudent.frequencies.map((f: any) => ({ ...f }))
  } else {
    classesPerDay.value = Array.from({ length: props.numClasses }, (_, i) => ({
      name: `${i + 1}º aula`,
      absent: i === 0,
    }))
  }
  allSelected.value = classesPerDay.value.every(item => item.absent)
}

watch(() => props.checkboxModal, (open) => {
  if (open) {
    initialize()
  }
})

function toggleSelectAll() {
  allSelected.value = !allSelected.value
  classesPerDay.value = classesPerDay.value.map(item => ({
    ...item,
    absent: allSelected.value
  }))
}

function saveQuantifiedPresence() {
  const hasAtLeastOneAbsent = classesPerDay.value.some(item => item.absent)
  if (!hasAtLeastOneAbsent) {
    showToast('Selecione pelo menos uma aula', 'top', 'warning')
    return
  }
  
  emits('update:modelValue', classesPerDay.value)
  //showToast(`Ausência de: ${props.currentStudent.name.toUpperCase()} salva com sucesso`, 'top', 'success')
  emits('update:openModal', false)
}
</script>

<template>
  <IonModal 
    id="quantify-modal" 
    class="ion-padding" 
    :is-open="props.checkboxModal" 
    @ion-modal-did-dismiss="() => emits('update:openModal', false)"
  >
    <IonCard class="ion-no-padding ion-no-margin">
      <IonCardHeader color="secondary">
        <div style="display: flex; align-items: center; height: 15px;">
          <IonCardTitle style="font-size: medium;">
            Quantifique as faltas
          </IonCardTitle>
          <IonButton
            fill="clear"
            @click="toggleSelectAll"
            size="small"
            :style="{
              marginLeft: 'auto',
              backgroundColor: allSelected ? 'white' : 'var(--ion-color-primary)',
              color: allSelected ? 'var(--ion-color-primary)' : 'white',
              borderRadius: '6px',
              transition: '0.2s',
              padding: '4px 6px'
            }"
          >
            <i class="pi pi-check-square" style="font-size: 1.2rem;"></i>
          </IonButton>
        </div>
      </IonCardHeader>

      <div class="ion-padding-top ion-padding-horizontal">
        <IonCheckbox 
          v-for="(x, index) in classesPerDay" 
          :key="index" 
          v-model="x.absent" 
          class="ion-margin-end ion-margin-bottom" 
          label-placement="end"
        >
          <IonText color="secondary">
            {{ x.name }}
          </IonText>
        </IonCheckbox>
      </div>
      
      <div class="ion-margin" style="display: flex; justify-content: right;">
        <IonButton
          color="secondary"
          size="small" 
          style="text-transform: capitalize;" 
          @click="saveQuantifiedPresence"
        >
          Salvar
        </IonButton>
        <IonButton 
          fill="clear" 
          color="danger" 
          size="small" 
          style="text-transform: capitalize;" 
          @click="() => emits('update:openModal', false)"
        >
          Cancelar
        </IonButton>
      </div>
    </IonCard>
  </IonModal>
</template>

<style>
@import 'primeicons/primeicons.css';

  ion-content {
    --padding-start: 10px;
    --padding-end: 10px;
    }
  .ion-content {
    padding-left: 10px;
    padding-right: 10px;
  }
  ion-modal#quantify-modal {
    --width: 400px;
    --min-width: 400px;
    --min-width: 250px;
    --height: fit-content;
    --border-radius: 6px;
    --box-shadow: 0 28px 48px rgba(0, 0, 0, 0.4);
  }

  ion-modal#quantify-modal h1 {
    margin: 20px 20px 10px 20px;
  }

  ion-modal#quantify-modal .wrapper {
    margin-bottom: 10px;
  }
</style>
