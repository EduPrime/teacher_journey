<script setup lang="ts">
import showToast from '@/utils/toast-alert'
import { IonAccordion, IonAccordionGroup, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonIcon, IonItem, IonLabel, IonModal, IonSelect, IonSelectOption, IonTextarea } from '@ionic/vue'
import { add, calendarOutline, save } from 'ionicons/icons'
import { computed, ref, watch } from 'vue'
import ContentService from '../../services/ContentService'

interface Props {
  currentClassroomId: string
  isCopyModalOpen: boolean
  schedules: any
  registry: any
}

interface Objeto {
  classroomName: string
  [key: string]: any // Caso o objeto tenha outros atributos
}

const props = defineProps<Props>()
const emits = defineEmits(['update:modelValue'])

const contentService = new ContentService()

const modalOpened = ref(props.isCopyModalOpen)
const selectedClassroom = ref('352a5857-193f-4672-9abf-c5302afd1c37')
const copyContentSchool = ref()

const filledContent = ref({
  disciplines: [] as string[],
  date: '',
  description: '',
  bnccs: [] as string[],
  classroomId: '',
  teacherId: '',
})

function removeDuplicatas(array: any[] | Objeto[], attribute?: string): any[] {
  if (attribute) {
    const mapa = new Map<string, Objeto>()
    array.forEach((item) => {
      if (!mapa.has(item[attribute])) {
        mapa.set(item[attribute], item)
      }
    })
    return Array.from(mapa.values())
  }
  else {
    return [...new Set(array)]
  }
};

watch(() => props.registry, (value) => {
//   modalOpened.value = value
  if (value) {
    filledContent.value = {
      disciplines: value.disciplines.map((d: any) => d.disciplineId.id),
      date: value.date,
      description: value.description,
      bnccs: value.bnccs.map((b: any) => b.bnccId.id),
      classroomId: '',
      teacherId: value.teacherId,
    }
  }
}, { immediate: true })

async function saveContent() {
  try {
    if (filledContent?.value.classroomId.length > 3) {
      const data = await contentService.createContent({ ...filledContent.value })
      emits('update:modelValue', { card: false, saved: !!data })
      emits('update:modelValue', false)
      showToast(`Conteúdo copiado com sucesso`, 'top', 'success')
    }
    else {
      showToast(`Você precisa selecionar para qual turma deseja salvar.`, 'top', 'danger')
    }
  }
  catch (error: unknown | any) {
    showToast(`Erro ao copiar`, 'top', 'danger')

    console.error(error.message)
  }
}
</script>

<template>
  <IonModal id="copy-modal" class="ion-content" :is-open="props.isCopyModalOpen" @ion-modal-did-dismiss="modalOpened = false">
    <IonCard v-if="true" class="ion-no-padding ion-no-margin">
      <IonCardHeader color="secondary">
        <div style="display: flex; align-items: center; height: 15px;">
          <div style="font-size: 10px;">
            <IonIcon :icon="save" />
          </div>
          <IonCardTitle style="font-size: medium;">
            Copiar registro para outras turmas
          </IonCardTitle>
        </div>
      </IonCardHeader>

      <div v-if="true">
        <IonCardContent class="" style="display: flex; flex-direction: column; gap: 15px;">
          <ion-text color="secondary">
            Selecione uma turma referente a mesma série na qual foi criado o registro de conteúdo atual.
          </ion-text>

          <IonSelect v-if="props.schedules?.schools.length > 1" v-model="copyContentSchool" class="custom-floating-label" label-placement="floating" justify="space-between" label="Escola" fill="outline">
            <IonSelectOption v-for="(sc, index) in props.schedules?.schools" :key="index" :value="sc.id">
              {{ sc.name }}
            </IonSelectOption>
          </IonSelect>

          <IonSelect v-if="props.schedules" v-model="filledContent.classroomId" class="custom-floating-label" label-placement="floating" label="Turma" fill="outline">
            <!-- Se copyContentSchool existir é usado para encontrar o index ( escola ) no qual as turmas serão pegas e se não usa o index 0 para selecionar o primeiro item no array de turmas por escolas -->
            <!-- todas as turmas são filtradas abaixo para garantir que estejam disponiveis para seleção apenas os items em que a seriesId seja igual a seriesId oriunda da turma selecionada no filtro principal da página ( o de escolas e turmas ) -->

            <IonSelectOption
              v-for="(cls, index) in copyContentSchool
                ? removeDuplicatas(props.schedules.classesPerSchool.find((i: any) => i.schoolId === copyContentSchool).classes.filter((cl: any) => cl.seriesId === selectedClassroom && cl.classroomId !== props.currentClassroomId), 'classroomName')
                : removeDuplicatas(props.schedules.classesPerSchool.at(0).classes.filter((cl: any) => cl.seriesId === selectedClassroom && cl.classroomId !== props.currentClassroomId), 'classroomName')"
              :key="index"
              :value="cls.classroomId"
            >
              {{ cls.classroomName }}
            </IonSelectOption>
          </IonSelect>
        </IonCardContent>

        <div class="ion-margin" style="display: flex; justify-content: right;">
          <IonButton color="danger" size="small" style="text-transform: capitalize;" @click="emits('update:modelValue', false)">
            Cancelar
          </IonButton>
          <!-- @TODO: construir função para ao clicar em salvar inserir uma copia do registro de conteúdo atual para a turma selecionada -->
          <IonButton
            color="secondary" size="small" style="text-transform: capitalize;" @click="
              () => {
                saveContent()
              }"
          >
            Salvar
          </IonButton>
        </div>
      </div>
    </IonCard>
  </IonModal>
</template>
