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
  }
}, { immediate: true })

function compararDatas(stage: { startDate: string, endDate: string, numberStage: string }) {
  const hoje = new Date()
  const inicial = new Date(stage.startDate)
  const final = new Date(stage.endDate)

  return hoje >= inicial && hoje <= final
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
