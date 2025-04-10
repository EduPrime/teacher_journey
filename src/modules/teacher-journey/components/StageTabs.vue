<script setup lang="ts">
import { IonSegment, IonSegmentButton, IonSegmentContent, IonSegmentView } from '@ionic/vue'
import { computed, ref, watch } from 'vue'

interface Props {
  stages: { startDate: string, endDate: string, numberStage: string }[]
}

const props = defineProps<Props>()
const emits = defineEmits(['update:modelValue'])

const currentStage = ref('')

function compararDatas(stage: { startDate: string, endDate: string, numberStage: string }) {
  const hoje = new Date()
  const inicial = new Date(stage.startDate)
  const final = new Date(stage.endDate)

  if (hoje >= inicial && hoje <= final) {
    return currentStage.value = stage.numberStage
  }
}

watch(() => props.stages, (newValue) => {
  if (newValue && newValue.length > 0) {
    newValue.forEach((stage: { startDate: string, endDate: string, numberStage: string }) => {
      compararDatas(stage)
    })

    emits('update:modelValue', props.stages.find(i => i.numberStage === currentStage.value))
  }
}, { immediate: true })

watch(currentStage, (newStage) => {
  const selectedStage = props.stages.find(stage => stage.numberStage === newStage);
  if (selectedStage) {
    emits('update:modelValue', selectedStage);
  }
})

const enabledStages = computed(() => {
  return props.stages.filter((stage) => {
    const hoje = new Date('2025-12-12')
    const inicial = new Date(stage.startDate)

    return hoje >= inicial
  })
})

const buttonWidth = computed(() => {
  const total = enabledStages.value.length
  return total > 0 ? `${total * 120}px` : 'auto'
});

</script>

<template>
  <div v-if="props.stages && props.stages.length > 0">
    <IonSegment v-model="currentStage" mode="ios" :scrollable="true" :value="currentStage"
      style="margin: 0 10px 0 10px;" :style="{ width: buttonWidth }" @ion-change="emits('update:modelValue')">
      <IonSegmentButton v-for="stage in enabledStages" :key="stage.numberStage" :value="stage.numberStage"
        :content-id="stage.numberStage" @click="emits('update:modelValue', stage)" class="custom-button">
        <span>{{ stage.numberStage }}º Etapa</span>
      </IonSegmentButton>
    </IonSegment>

    <IonSegmentView style="margin: 10px;">
      <IonSegmentContent v-for="stage in props.stages" :id="stage.numberStage" :key="stage.numberStage">
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

.custom-button {
  max-width: 120px;
}
</style>
