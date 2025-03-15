<script setup lang="ts">
import showToast from '@/utils/toast-alert'
import { IonAccordion, IonAccordionGroup, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCheckbox, IonItem, IonLabel, IonModal, IonSelect, IonSelectOption, IonText, IonTextarea } from '@ionic/vue'
import { add, calendarOutline, save } from 'ionicons/icons'
import { computed, ref, watch } from 'vue'

interface Props {
  checkboxModal: boolean
}

const props = defineProps<Props>()

const emits = defineEmits(['update:modelValue'])

const startValue = ref(false)

const classesPerDay = ref([{
  name: '1º aula',
  absence: startValue.value,
}, {
  name: '2º aula',
  absence: startValue.value,
}, {
  name: '3º aula',
  absence: startValue.value,
}])

watch(() => props.checkboxModal, (newValue) => {
  if (newValue === true) {
    classesPerDay.value.map((i: any) => {
      return { ...i, absence: false }
    })
  }
})
</script>

<template>
  <IonModal id="quantify-modal" class="ion-padding" :is-open="props.checkboxModal" @ion-modal-did-dismiss="emits('update:modelValue', { modal: false, quantifiedPresence: classesPerDay })">
    <IonCard v-if="true" class="ion-no-padding ion-no-margin">
      <IonCardHeader color="secondary">
        <div style="display: flex; align-items: center; height: 15px;">
          <IonCardTitle style="font-size: medium;">
            Quantifique as faltas
          </IonCardTitle>
        </div>
      </IonCardHeader>
      <div class="ion-padding-top ion-padding-horizontal">
        <IonCheckbox v-for="(x, index) in classesPerDay" :key="index" v-model="x.absence" class="ion-margin-end ion-margin-bottom" label-placement="end">
          <IonText color="secondary">
            {{ x.name }}
          </IonText>
        </IonCheckbox>
      </div>
      <div v-if="true">
        <div class="ion-margin" style="display: flex; justify-content: right;">
          <!-- @TODO: construir função para ao clicar em salvar inserir uma copia do registro de conteúdo atual para a turma selecionada -->
          <IonButton
            color="secondary"
            size="small" style="text-transform: capitalize;" @click="emits('update:modelValue', { modal: false, quantifiedPresence: classesPerDay })"
          >
            Salvar
          </IonButton>
          <IonButton fill="clear" color="danger" size="small" style="text-transform: capitalize;" @click="emits('update:modelValue', { modal: false })">
            Cancelar
          </IonButton>
        </div>
      </div>
    </IonCard>
  </IonModal>
</template>

<style>
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
