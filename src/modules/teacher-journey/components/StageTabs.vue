<script setup lang="ts">
import { IonSegment, IonSegmentButton, IonSegmentContent, IonSegmentView } from '@ionic/vue'

import { computed, onMounted, ref, watch } from 'vue'

// interface Props {
//   currentStage: string
// }

interface Props {
  stages: { startDate: string, endDate: string, numberStage: string }[]
}

const props = defineProps<Props>()
// const props = defineProps<Props>()
const emits = defineEmits(['update:modelValue'])

const currentStage = ref('')

// watch(() => props.currentStage, (newValue) => {
//   if (newValue) {
//     currentStage.value = newValue
//   }
// })

watch(() => props.stages, (newValue) => {
  if (newValue && newValue.length > 0) {
    newValue.forEach((stage: { startDate: string, endDate: string, numberStage: string }) => {
      compararDatas(stage)
    })

    emits('update:modelValue', props.stages.find(i => i.numberStage === currentStage.value))
  }
}, { immediate: true })

function compararDatas(stage: { startDate: string, endDate: string, numberStage: string }) {
  const hoje = new Date()
  const inicial = new Date(stage.startDate)
  const final = new Date(stage.endDate)

  if (hoje >= inicial && hoje <= final) {
    return currentStage.value = stage.numberStage
  }
}

function disabledStages(startDate: string): boolean {
  const hoje = new Date()
  const inicial = new Date(startDate)

  return hoje < inicial
}
</script>

<template>
  <div v-if="props.stages && props.stages.length > 0">
    <IonSegment
      v-model="currentStage"
      mode="ios"
      :scrollable="true"
      :value="currentStage"
      style="margin: 0 10px 0 10px;"
    >
      <!-- :disabled="!disabledStages(stage.startDate)" esse atributo pertence ao bloco abaixo -->
      <IonSegmentButton
        v-for="stage in props.stages"
        :key="stage.numberStage"
        :value="stage.numberStage"
        :content-id="!disabledStages(stage.startDate) ? stage.numberStage : undefined"
        :disabled="disabledStages(stage.startDate)"
        @click="emits('update:modelValue', stage)"
      >
        <span>{{ stage.numberStage }}º Etapa</span>
      </IonSegmentButton>
    </IonSegment>

    <IonSegmentView
      style="margin: 10px;"
    >
      <IonSegmentContent
        v-for="stage in props.stages"
        :id="stage.numberStage"
        :key="stage.numberStage"
        :disabled="disabledStages(stage.startDate)"
      >
        <slot :name="stage.numberStage" />
      </IonSegmentContent>
    </IonSegmentView>
  </div>
</template>

<style scoped>
  ion-segment {
    --background: rgba(var(--ion-color-tertiary-rgb), 0.15);
    --color: var(--ion-color-secondary);
  }
  </style>
