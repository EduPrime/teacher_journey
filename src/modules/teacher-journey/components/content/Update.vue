<script setup lang="ts">
import showToast from '@/utils/toast-alert'
import { IonAccordion, IonAccordionGroup, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonContent, IonIcon, IonItem, IonLabel, IonModal, IonSelect, IonSelectOption, IonTextarea } from '@ionic/vue'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { add, calendarOutline, save } from 'ionicons/icons'
import { computed, defineProps, onMounted, ref, watch } from 'vue'
import BNCCService from '../../services/BNCCService'
import ContentService from '../../services/ContentService'

interface AvailableDisciplines { id: string, name: string, classroomId: string }
interface Props {
  availableDisciplines: AvailableDisciplines[]
  // teacherId: string
  classroomId: string
  // selectedDay: string
  // disciplineId?: string
  seriesId: string
  registry: any
  isUpdateModalOpen: boolean
}

const props = defineProps<Props>()
const emits = defineEmits(['update:modelValue'])
const availableDisciplineIds = ref<string[]>([])

const bnccService = new BNCCService()
const contentService = new ContentService()

const bnccs = ref()

const modalOpened = ref(props.isUpdateModalOpen)

const filledContent = ref({
  // userId: '',
  id: '',
  disciplines: [] as string[],
  date: '',
  description: '',
  bnccs: [] as string[],
  classroomId: '',
  teacherId: '',
})

watch(() => props.registry, (value) => {
  console.log('registry', value)

  //   modalOpened.value = value
  if (value) {
    filledContent.value = {
      id: value.id,
      disciplines: value.disciplines.map((d: any) => d.disciplineId.id),
      date: value.date,
      description: value.description,
      bnccs: value.bnccs.map((b: any) => b.bnccId.id),
      classroomId: value.classroomId,
      teacherId: value.teacherId,
    }
  }
}, { immediate: true })

watch(() => props.availableDisciplines, async (newValue) => {
  if (newValue && newValue.length > 0 && filledContent.value.disciplines.length === 0) {
    availableDisciplineIds.value = []
    props.availableDisciplines.map((discipline: AvailableDisciplines) => {
      if (discipline.classroomId === props.classroomId) {
        availableDisciplineIds.value.push(discipline.id)
      }
      return void 0
    })

    bnccs.value = await bnccService.getBNCC(availableDisciplineIds.value.length > 0
      ? availableDisciplineIds.value
      : props.availableDisciplines.map((disciplines: AvailableDisciplines) => { return disciplines.id }), props.seriesId)
  }
}, { immediate: true })

async function getBNCCByDisciplines(selectedDisciplines: string[]) {
  const data = await bnccService.getBNCC(selectedDisciplines, props.seriesId)
  bnccs.value = data
  filledContent.value.disciplines = selectedDisciplines
  return data
}

async function setBNCC(selectedBNCC: string[]) {
  filledContent.value.bnccs = selectedBNCC
}

async function saveContent() {
  const data = await contentService.updateContent({ ...filledContent.value })
  emits('update:modelValue', { card: false, saved: !!data })

  showToast('Conteúdo criado com sucesso', 'top', 'success')
}

function formatDate(dateString: string): string {
  const date = parseISO(dateString)
  return format(date, 'dd/MM/yyyy', { locale: ptBR })
}
</script>

<template>
  <IonModal id="update-modal" class="ion-content" :is-open="props.isUpdateModalOpen" @ion-modal-did-dismiss="modalOpened = false">
    <IonCard id="EditarRegistroFormulario" class="ion-no-padding ion-no-margin">
      <IonCardHeader color="secondary">
        <div style="display: flex; align-items: center; height: 15px;">
          <IonIcon class="ion-padding-end" :icon="save" />
          <IonCardTitle style="font-size: medium;">
            Editando {{ props.registry?.classroom }} - {{ formatDate(props.registry?.date) }}
          </IonCardTitle>
        </div>
      </IonCardHeader>

      <div>
        <IonCardContent class="" style="display: flex; flex-direction: column; gap: 15px;">
          <IonSelect
            v-model="filledContent.disciplines"
            class="ion-select-card-content"
            label="Disciplina"
            label-placement="floating"
            fill="outline"
            cancel-text="Cancelar"
            :multiple="true"
            @ion-change="getBNCCByDisciplines($event.detail.value)"
          >
            <IonSelectOption v-for="(discipline, index) in availableDisciplines" :key="index" :value="discipline.id">
              {{ discipline.name }}
            </IonSelectOption>
          </IonSelect>
          <br>
          <IonTextarea
            v-model="filledContent.description"
            label="Conteúdo"
            label-placement="floating"
            fill="outline"
            placeholder="Digite o conteúdo"
            style="--color: var(--ion-color-secondary);"
            :auto-grow="true"
          />
          <br>
          <IonSelect
            v-model="filledContent.bnccs"
            class="ion-select-card-content"
            label="Currículos"
            label-placement="floating"
            fill="outline"
            cancel-text="Cancelar"
            style="--color: var(--ion-color-secondary);"
            :multiple="true"
            @ion-change="setBNCC($event.detail.value)"
          >
            <IonSelectOption v-for="(bncc, index) in bnccs" :key="index" :value="bncc.id">
              {{ bncc.code }} - {{ bncc.objective.slice(0, 32) }}...
            </IonSelectOption>
          </IonSelect>

          <pre>{{ filledContent }}</pre>
          <div class="ion-margin-top" style="display: flex; justify-content: right;">
            <IonButton color="danger" size="small" style="text-transform: capitalize;" @click="emits('update:modelValue', false)">
              Cancelar
            </IonButton>
            <IonButton
              color="secondary" size="small" style="text-transform: capitalize;" @click="
                () => {
                  saveContent()
                  emits('update:modelValue', false)
                }"
            >
              Salvar
              <!-- @TODO: O botão deve aparecer mais aparente na tela -->
            </IonButton>
          </div>
        </IonCardContent>
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
  ion-modal#update-modal {
    --width: fit-content;
    --min-width: 250px;
    --height: fit-content;
    --border-radius: 6px;
    --box-shadow: 0 28px 48px rgba(0, 0, 0, 0.4);
  }

  ion-modal#update-modal h1 {
    margin: 20px 20px 10px 20px;
  }

  ion-modal#update-modal .wrapper {
    margin-bottom: 10px;
  }
</style>
