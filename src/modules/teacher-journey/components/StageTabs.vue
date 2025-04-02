<script setup lang="ts">
import { IonLabel, IonSegment, IonSegmentButton, IonSegmentContent, IonSegmentView } from '@ionic/vue'

import { onMounted, ref, watch } from 'vue'

// interface Props {
//   currentStage: string
// }

interface Props {
  stages: { startDate: string, endDate: string, numberStage: string }[]
}

const props = defineProps<Props>()
// const props = defineProps<Props>()
const emits = defineEmits(['update:modelValue'])
const stages = ref()

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

    emits('update:modelValue', currentStage.value)
  }
})

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

  return hoje >= inicial
}
</script>

<template>
  <IonSegment v-if="props.stages && props.stages.length > 0" v-model="currentStage" mode="ios" :scrollable="true" :value="currentStage" style="margin: 0 10px 0 10px;">
    <!-- Adicionar esse atributo ( disabled ) abaixo quando finalizar a questão da tab selecionadisabledStages(stage.startDate)" ) -->
    <IonSegmentButton v-for="stage in props.stages" :key="stage.numberStage" :value="stage.numberStage" :content-id="stage.numberStage" @click="emits('update:modelValue', stage)">
      <span>{{ stage.numberStage }}º Etapa</span>
    </IonSegmentButton>
  </IonSegment>

  <!-- <IonSegmentView v-if="stages && stages.length > 0" class="ion-content">
    <IonSegmentContent v-for="stage in stages" :id="stage.numberStage" :key="stage.numberStage">
      <IonCard>
        <IonCardHeader>
          etapa {{ stage.numberStage }}
        </IonCardHeader>
        <IonCardContent>
          asdasdasd
        </IonCardContent>
      </IonCard>
    </IonSegmentContent>
  </IonSegmentView> -->

  <IonSegmentView v-if="props.stages && props.stages.length > 0" class="ion-content">
    <IonSegmentContent v-for="stage in props.stages" :id="stage.numberStage" :key="stage.numberStage">
      <slot :name="stage.numberStage" />
    </IonSegmentContent>
  </IonSegmentView>
</template>

<style scoped>
  ion-segment {
    --background: rgba(var(--ion-color-tertiary-rgb), 0.15);
    --color: var(--ion-color-secondary);
  }
  </style>
