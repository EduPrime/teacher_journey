<script setup lang="ts">
import showToast from '@/utils/toast-alert'
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonTextarea,
} from '@ionic/vue'
import { save } from 'ionicons/icons'
import { DateTime } from 'luxon'
import { ErrorMessage, Field, FieldSlotProps, Form } from 'vee-validate'

import { defineProps, onUpdated, ref, watch } from 'vue'
import BNCCService from '../../services/BNCCService'
import ContentService from '../../services/ContentService'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'

interface AvailableDisciplines {
  id: string
  name: string
  classroomId: string
}
interface Props {
  availableDisciplines: AvailableDisciplines[]
  classroomId: string
  // disciplineId?: string
  seriesId: string
  registry: any
  isUpdateModalOpen: boolean
  frequency: string
  evaluation: string
}

const props = defineProps<Props>()
const emits = defineEmits(['update:modelValue'])
const availableDisciplineIds = ref<string[]>([])

const bnccService = new BNCCService()
const contentService = new ContentService()

const bnccs = ref<any[]>([])

const selectedBnccObjects = ref<any[]>([])

const originalBnccs = ref<any[]>([])

const isLoadingBnccs = ref(false)

const modalOpened = ref(props.isUpdateModalOpen)

const filledContent = ref({
  id: '',
  disciplines: [] as string[],
  date: '',
  description: '',
  bnccs: [] as string[],
  classroomId: '',
  teacherId: '',
})

onUpdated(() => {
  getBNCCByDisciplines(filledContent.value.disciplines)
})

watch(
  () => props.registry,
  async (value) => {
    if (!value) return
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

      await getBNCCByDisciplines(filledContent.value.disciplines)

      selectedBnccObjects.value = originalBnccs.value.filter(b =>
        filledContent.value.bnccs.includes(b.id)
      )
    }
  },
  { immediate: true },
)

watch(
  () => props.availableDisciplines,
  async (newValue) => {
    if (
      newValue
      && newValue.length > 0
      && filledContent.value.disciplines.length === 0
    ) {
      availableDisciplineIds.value = []
      props.availableDisciplines.map((discipline: AvailableDisciplines) => {
        if (discipline.classroomId === props.classroomId) {
          availableDisciplineIds.value.push(discipline.id)
        }
        return void 0
      })

      bnccs.value = await bnccService.getBNCC(
        availableDisciplineIds.value.length > 0
          ? availableDisciplineIds.value
          : props.availableDisciplines.map(
              (disciplines: AvailableDisciplines) => {
                return disciplines.id
              },
            ),
        props.seriesId,
      )
    }
  },
  { immediate: true },
)

watch(
  () => filledContent.value.disciplines,
  async (newDisciplines, oldDisciplines) => {
    if (!oldDisciplines) return 

    await getBNCCByDisciplines(newDisciplines)

    selectedBnccObjects.value = selectedBnccObjects.value.filter(b =>
      newDisciplines.includes(b.discipline.id)
    )

    filledContent.value.bnccs = selectedBnccObjects.value.map(b => b.id)
  },
  { immediate: true }
)
// watch(filledContent, async (newValue) => {
//   if (newValue.bnccs.length > 0) {
//     bnccs.value = await bnccService.getBNCC(newValue.bnccs, props.seriesId)
//   }
// }, { immediate: true })

async function getBNCCByDisciplines(selectedDisciplines: string[]) {
  isLoadingBnccs.value = true
  try {
    const data = await bnccService.getBNCC(selectedDisciplines, props.seriesId)
    originalBnccs.value = data || []
    bnccs.value = originalBnccs.value
  } catch (e) {
    console.error(e)
    originalBnccs.value = []
    bnccs.value = []
  } finally {
    isLoadingBnccs.value = false
  }
}

function formatBnccLabel(option: any) {

if (!option) return ''

const code = option.code ?? ''
const objective = option.objective ?? ''

if (code && objective) return `${code} - ${objective}`
if (code) return code
if (objective) return objective
return 'Sem dados'
}

function customFilter(option: any, label: string, search: string): boolean {
  if (!search) return true;
  const query = search.toLowerCase();
  const code = (option.code ?? '').toLowerCase();
  const objective  = (option.objective ?? '').toLowerCase();
  return code.includes(query) || objective.includes(query);
}

async function setBNCC(selectedBNCC: string[]) {
  filledContent.value.bnccs = selectedBNCC
}

async function saveContent() {
  // Verifica se alguma disciplina não tem um bncc selecionado
  const missing = filledContent.value.disciplines.filter(dId =>
    !selectedBnccObjects.value.some(b => b.discipline.id === dId)
  )
  if (missing.length > 0) {
    // Pega o nome das dsisciplinas sem bnccs correspondentes
    const nomesFaltantes = props.availableDisciplines
      .filter(d => missing.includes(d.id))
      .map(d => d.name)
    showToast(
      `Selecione ao menos uma BNCC para: ${nomesFaltantes.join(', ')}`,
      'top',
      'warning'
    )
    return
  }

  filledContent.value.bnccs = selectedBnccObjects.value.map(b => b.id)
  await contentService.updateContent({ ...filledContent.value })
  emits('update:modelValue', false)
  showToast('Conteúdo editado com sucesso', 'top', 'success')
}

function luxonFormatDate(dateString: string) {
  const date = DateTime.fromISO(dateString)
  return date.setLocale('pt-BR').toFormat('dd/MM/yyyy')
}
</script>

<template>
  <IonModal id="update-modal" class="ion-content" :is-open="props.isUpdateModalOpen" @ion-modal-did-dismiss="() => { modalOpened = false; emits('update:modelValue', false) }">
    <Form
      :initial-values="{
        Disciplina: filledContent.disciplines,
        Conteúdo: filledContent.description,
        Currículos: filledContent.bnccs,
      }" @submit="saveContent"
    >
      <IonCard id="EditarRegistroFormulario" class="ion-no-padding ion-no-margin">
        <IonCardHeader color="secondary">
          <div style="display: flex; align-items: center; height: 15px;">
            <IonIcon class="ion-padding-end" :icon="save" />
            <IonCardTitle style="font-size: medium;">
              Editando {{ props.registry?.classroom }} - {{ luxonFormatDate(props.registry?.date) }}
            </IonCardTitle>
          </div>
        </IonCardHeader>

          <div>
            <IonCardContent class="update-modal-content" style="display: flex; flex-direction: column; gap: 15px;">
              <Field name="Disciplina" v-slot="{ field }" rules="required">
                <IonSelect
                  v-bind="field"
                  v-model="filledContent.disciplines"
                  class="ion-select-card-content"
                  label="Disciplina"
                  label-placement="floating"
                  fill="outline"
                  cancel-text="Cancelar"
                  :disabled="props.frequency === 'disciplina'"
                  :multiple="true"
                  @ion-change="getBNCCByDisciplines($event.detail.value)"
                >
                  <IonSelectOption 
                    v-for="(discipline, index) in availableDisciplines" 
                    :key="index" 
                    :value="discipline.id" 
                    :selected="filledContent.disciplines.includes(discipline.id)">
                    {{ discipline.name }}
                  </IonSelectOption>
                </IonSelect>
              </Field>
              <ErrorMessage name="Disciplina" v-slot="{ message }">
                <span class="error-message">{{ message }}</span>
              </ErrorMessage>
              
              <br>
              <Field name="Conteúdo" v-slot="{ field }" rules="required|min:2|max:360">
                <IonTextarea
                  v-bind="field"
                  v-model="filledContent.description"
                  label="Conteúdo"
                  label-placement="floating"
                  fill="outline"
                  placeholder="Digite o conteúdo"
                  style="--color: var(--ion-color-secondary);"
                  :auto-grow="true"
                  :maxlength="361"
                />
              </Field>
              <ErrorMessage name="Conteúdo" v-slot="{ message }">
                <span class="error-message">{{ message }}</span>
              </ErrorMessage>

              
              <br>
              <Field name="Currículos" v-slot="{ field }" rules="required">
                <Multiselect
                class="bncc-scroll"
                v-bind="field"
                v-model="selectedBnccObjects"
                :options="bnccs"
                :multiple="true"
                track-by="id"
                :custom-label="formatBnccLabel"
                :filterable="true"           
                :internal-search="true"      
                :custom-filter="customFilter"
                placeholder="Busque ou selecione BNCC"
                :disabled="isLoadingBnccs"
                :no-results-text=" isLoadingBnccs 
                    ? 'Buscando...' 
                    : 'Nenhum resultado encontrado' "
                no-options-text="Sem opções disponíveis"
                :select-label="`Pressione Enter para selecionar`"
                :deselect-label="`Pressione Backspace para remover`"
                :selected-label="`Selecionado`"
                >
                <template #noResult>
                  Nenhum resultado encontrado
                </template>
                </Multiselect>
              </Field>
              <ErrorMessage name="Currículos" v-slot="{ message }">
                <span class="error-message">{{ message }}</span>
              </ErrorMessage>

            <div class="ion-margin-top" style="display: flex; justify-content: right;">
              <IonButton color="danger" size="small" style="text-transform: capitalize;" @click="emits('update:modelValue', false)">
                Cancelar
              </IonButton>
              <IonButton type="submit" color="secondary" size="small" style="text-transform: capitalize;">
                Salvar
                <!-- @TODO: O botão deve aparecer mais aparente na tela -->
              </IonButton>
            </div>
          </IonCardContent>
        </div>
      </IonCard>
    </Form>
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
    --height: 50vh;
    --width: 40vw;
    --min-width: 300px;
  }
  
  ion-modal#update-modal,
  ion-card#EditarRegistroFormulario {
    box-shadow: none ;
  }

  .update-modal-content {
    max-height: calc(50vh - 48px); 
    overflow-y: auto;
    padding: 16px;
    box-sizing: border-box;
  }

  ion-modal#update-modal h1 {
    margin: 20px 20px 10px 20px;
  }

  ion-modal#update-modal .wrapper {
    margin-bottom: 10px;
  }

  .error-message {
  color: red;
  font-size: 1em;
}


</style>
