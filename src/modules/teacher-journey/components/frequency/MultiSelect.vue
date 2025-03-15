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
</script>

<template>
  <IonModal id="quantify-modal" class="ion-padding" :is-open="props.checkboxModal" @ion-modal-did-dismiss="emits('update:modelValue', false)">
    <IonCard v-if="true" class="ion-no-padding ion-no-margin">
      <IonCardHeader color="secondary">
        <div style="display: flex; align-items: center; height: 15px;">
          <IonCardTitle style="font-size: medium;">
            Quantifique as faltas
          </IonCardTitle>
        </div>
      </IonCardHeader>
      <div class="ion-padding-top ion-padding-horizontal">
        <IonCheckbox v-for="x in 3" :key="x" class="ion-margin-end ion-margin-bottom" label-placement="end">
          <IonText color="secondary">
            {{ x }}º aula
          </IonText>
        </IonCheckbox>
      </div>
      <div v-if="true">
        <div class="ion-margin" style="display: flex; justify-content: right;">
          <!-- @TODO: construir função para ao clicar em salvar inserir uma copia do registro de conteúdo atual para a turma selecionada -->
          <IonButton
            color="secondary" size="small" style="text-transform: capitalize;"
          >
            Salvar
          </IonButton>
          <IonButton fill="clear" color="danger" size="small" style="text-transform: capitalize;" @click="emits('update:modelValue', false)">
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
