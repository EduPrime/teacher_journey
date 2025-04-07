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
  let etapaSelecionada: string | undefined

    // Por padrão seleciona uma etapa pela data atual 
    for (const stage of newValue) {
      if (compararDatas(stage)) {
        etapaSelecionada = stage.numberStage
        break
      }
    }

    if (!etapaSelecionada) {
      etapaSelecionada = newValue[0].numberStage
    }

    currentStage.value = etapaSelecionada
    emits('update:modelValue', newValue.find(s => s.numberStage === etapaSelecionada))
}, { immediate: true })

function compararDatas(stage: { startDate: string, endDate: string, numberStage: string }) {
  const hoje = new Date()
  const inicial = new Date(stage.startDate)
  const final = new Date(stage.endDate)

  return hoje >= inicial && hoje <= final
}

function disabledStages(startDate: string): boolean {
  const hoje = new Date('2025-06-06')
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
