<script setup lang="ts">
import { IonSegment, IonSegmentButton, IonSegmentContent, IonSegmentView } from '@ionic/vue'

import { onMounted, ref, watch } from 'vue'
import StageService from '../services/StageService'

// interface Props {
//   currentStage: string
// }

// const props = defineProps<Props>()
const emits = defineEmits(['update:modelValue'])

const stageService = new StageService()

const currentStage = ref('')
const stages = ref()

// watch(() => props.currentStage, (newValue) => {
//   if (newValue) {
//     currentStage.value = newValue
//   }
// })

function compararDatas(stage: { startDate: string, endDate: string, numberStage: string }) {
  const hoje = new Date()
  const inicial = new Date(stage.startDate)
  const final = new Date(stage.endDate)

  if (hoje >= inicial && hoje <= final) {
    return currentStage.value = `${stage.numberStage}-etapa`
  }
}

onMounted(async () => {
  stages.value = await stageService.getAllStages()
  if (stages.value && stages.value.length > 0) {
    stages.value.forEach((stage: { startDate: string, endDate: string, numberStage: string }) => {
      compararDatas(stage)
    })

    emits('update:modelValue', currentStage.value)
  }
})

function disabledStages(startDate: string): boolean {
  const hoje = new Date()
  const inicial = new Date(startDate)

  return hoje >= inicial
}
</script>

<template>
  <pre>
    currentStage: {{ currentStage }}
  </pre>
  <IonSegment v-if="stages && stages.length > 0" v-model="currentStage" mode="ios" :scrollable="true" :value="currentStage" style="margin: 0 10px 0 10px;">
    <!-- Adicionar esse atributo ( disabled ) abaixo quando finalizar a questão da tab selecionada ( :disabled="!disabledStages(stage.startDate)" ) -->
    <IonSegmentButton v-for="stage in stages" :key="stage.id" :value="`${stage.numberStage}-etapa`" @click="emits('update:modelValue', `${stage.numberStage}-etapa`)">
      <span>{{ stage.numberStage }}º Etapa</span>
    </IonSegmentButton>
  </IonSegment>

  <IonSegmentView class="ion-content">
    <IonSegmentContent v-for="stage in stages" :id="`${stage.numberStage}-etapa`" :key="stage.numberStage">
      <IonCard>
        <IonCardHeader>
          etapa {{ stage.numberStage }}
        </IonCardHeader>
        <IonCardContent>
          <slot :name="`${stage.numberStage}-etapa`" />
        </IonCardContent>
      </IonCard>
    </IonSegmentContent>
  </IonSegmentView>
</template>

<style scoped>
  ion-segment {
    --background: rgba(var(--ion-color-tertiary-rgb), 0.15);
    --color: var(--ion-color-secondary);
  }
  </style>
