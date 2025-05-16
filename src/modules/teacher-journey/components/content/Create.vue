<script setup lang="ts">
import showToast from '@/utils/toast-alert'
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonTextarea,
} from "@ionic/vue";
import { save } from "ionicons/icons";
import { computed, defineProps, ref, watch, onMounted } from "vue";
import BNCCService from "../../services/BNCCService";
import ContentService from "../../services/ContentService";
import { Form, Field, ErrorMessage } from "vee-validate";
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'

interface AvailableDisciplines {
  id: string
  name: string
  classroomId: string
}
interface Props {
  availableDisciplines: AvailableDisciplines[]
  teacherId: string
  classroomId: string
  selectedDay: string
  disciplineId?: string
  seriesId: string
  evaluation: string
  isUpdateModalOpen: boolean
}

const props = defineProps<Props>()
const emits = defineEmits(['update:modelValue'])
const availableDisciplineIds = ref<string[]>([])

const bnccService = new BNCCService()
const contentService = new ContentService()

const bnccs = ref<any[]>([]);

const selectedBnccObjects = ref<any[]>([])

const originalBnccs = ref<any[]>([])

const isLoadingBnccs = ref(false);

const modalOpened = ref(props.isUpdateModalOpen)

const uniqueDiscipline = props.availableDisciplines.length === 1
  ? [props.availableDisciplines[0].id]
  : []

const filledContent = ref({
  disciplines: props.disciplineId ? [props.disciplineId] : uniqueDiscipline as string[],
  date: computed(() => props.selectedDay),
  description: '',
  bnccs: [] as string[],
  classroomId: computed(() => props.classroomId),
  teacherId: computed(() => props.teacherId),
})

onMounted(async () => {
  if (props.disciplineId) {
    await getBNCCByDisciplines([props.disciplineId]);
  } else if (props.availableDisciplines?.length > 0) {
    availableDisciplineIds.value = props.availableDisciplines
      .filter(discipline => discipline.classroomId === props.classroomId)
      .map(discipline => discipline.id);
  }
});

watch(
  () => props.availableDisciplines,
  async (newValue) => {
    if (newValue && newValue.length > 0) {
      availableDisciplineIds.value = newValue
        .filter(discipline => discipline.classroomId === props.classroomId)
        .map(discipline => discipline.id);

      if (!props.disciplineId && filledContent.value.disciplines.length === 0) {
        await getBNCCByDisciplines(availableDisciplineIds.value);
      }
    }
  },
  { immediate: true }
);

watch(
  () => props.classroomId,
  (newValue) => {
    if (newValue) {
      filledContent.value.disciplines = []
    }
  },
)

watch(
  () => filledContent.value.disciplines,
  async (newDisciplines) => {
    if (!newDisciplines) return

    await getBNCCByDisciplines(newDisciplines)

    selectedBnccObjects.value = selectedBnccObjects.value.filter(bncc =>
      newDisciplines.includes(bncc.discipline.id)
    )

    filledContent.value.bnccs = selectedBnccObjects.value.map(b => b.id)
  },
  { immediate: true }
)

watch(
  () => props.disciplineId,
  async (newValue) => {
    if (newValue) {
      filledContent.value.disciplines = [newValue];
      await getBNCCByDisciplines([newValue]);
    }
  },
  { immediate: true }
);

async function getBNCCByDisciplines(selectedDisciplines: string[]) {
  isLoadingBnccs.value = true;
  try {
    const data = await bnccService.getBNCC(selectedDisciplines, props.seriesId);
    originalBnccs.value = data || [];
    bnccs.value = originalBnccs.value;
  } catch (error) {
    console.error("Erro ao carregar BNCCs:", error);
    bnccs.value = [];
    originalBnccs.value = [];
  } finally {
    isLoadingBnccs.value = false;
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
  const objective = (option.objective ?? '').toLowerCase();
  return code.includes(query) || objective.includes(query);
}


async function saveContent() {
  try {
    const payload = {
      ...filledContent.value,
      bnccs: selectedBnccObjects.value.map(bncc => bncc.id)
    };

    const data = await contentService.createContent(payload);
    emits('update:modelValue', { card: false, saved: !!data });
    showToast('Conteúdo criado com sucesso', 'top', 'success');
  } catch (error) {
    console.error("Erro ao salvar conteúdo:", error);
    showToast('Erro ao salvar conteúdo', 'top', 'danger');
  }
}
</script>

<template>
  <IonModal id="update-modal" class="ion-content" :is-open="props.isUpdateModalOpen"
    @ion-modal-did-dismiss="() => { modalOpened = false; emits('update:modelValue', false) }">
    <Form :initial-values="{
      Disciplina: filledContent.disciplines,
    }" @submit="saveContent">
      <IonCard id="NovoRegistroFormulario" class="ion-no-padding ion-margin-top">
        <IonCardHeader color="secondary">
          <div style="display: flex; align-items: center; height: 10px;">
            <IonIcon :icon="save" size="small" style="margin-right: 8px;" />
            <IonCardTitle style="font-size: medium;">
              Registro de conteúdo
            </IonCardTitle>
          </div>
        </IonCardHeader>

        <div>
          <IonCardContent class="ion-padding-top">
            <Field name="Disciplina" v-slot="{ field }" rules="required">
              <IonSelect v-if="props.evaluation === 'Conceitual'" v-bind="field" v-model="filledContent.disciplines"
                class="ion-select-card-content" label="Disciplina" label-placement="floating" fill="outline"
                cancel-text="Cancelar" :multiple="true"
                :disabled="!!props.disciplineId || availableDisciplines.length === 1"
                @ion-change="getBNCCByDisciplines($event.detail.value)">
                <IonSelectOption v-for="(discipline, index) in availableDisciplines" :key="index"
                  :value="discipline.id">
                  {{ discipline.name }}
                </IonSelectOption>
              </IonSelect>
              <IonSelect v-else v-bind="field" v-model="filledContent.disciplines" class="ion-select-card-content"
                label="Disciplina" label-placement="floating" fill="outline" cancel-text="Cancelar" :multiple="false"
                :disabled="true" @ion-change="getBNCCByDisciplines($event.detail.value)">
                <IonSelectOption v-for="(discipline, index) in availableDisciplines" :key="index" :value="discipline.id"
                  :selected="filledContent.disciplines.includes(discipline.id)">
                  {{ discipline.name }}
                </IonSelectOption>
              </IonSelect>
            </Field>
            <ErrorMessage name="Disciplina" v-slot="{ message }">
              <span class="error-message">{{ message }}</span>
            </ErrorMessage>

            <br>
            <Field v-slot="{ field }" name="Conteúdo" rules="required|min:2|max:360">
              <IonTextarea v-bind="field" v-model="filledContent.description" label="Conteúdo"
                label-placement="floating" fill="outline" placeholder="Digite o conteúdo"
                style="--color: var(--ion-color-secondary);" :auto-grow="true" :maxlength="361" />
            </Field>
            <ErrorMessage name="Conteúdo" v-slot="{ message }">
              <span class="error-message">{{ message }}</span>
            </ErrorMessage>

            <br>
            <Field v-slot="{ field }" name="Currículos">
              <Multiselect class="bncc-scroll" v-bind="field" v-model="selectedBnccObjects" :options="bnccs"
                :multiple="true" track-by="id" :custom-label="formatBnccLabel" :filterable="true"
                :internal-search="true" :custom-filter="customFilter" :close-on-select="false" :preserve-search="true"
                :hide-selected="true" placeholder="Busque ou selecione BNCC" :no-results-text="isLoadingBnccs
                  ? 'Buscando...'
                  : 'Nenhum resultado encontrado'" no-options-text="Sem opções disponíveis"
                :select-label="`Pressione Enter para selecionar`" :deselect-label="`Pressione Backspace para remover`"
                :selected-label="`Selecionado`">
                <template #noResult>
                  Nenhum resultado encontrado
                </template>
              </Multiselect>
            </Field>
            <!-- <ErrorMessage name="Currículos" v-slot="{ message }">
              <span class="error-message">{{ message }}</span>
            </ErrorMessage> -->

            <div class="ion-margin-top" style="display: flex; justify-content: right;">
              <IonButton color="danger" size="small" style="text-transform: capitalize;"
                @click="emits('update:modelValue', { card: false })">
                Cancelar
              </IonButton>
              <IonButton type="submit" color="secondary" size="small" style="text-transform: capitalize;"
                :disabled="isLoadingBnccs">
                <span v-if="isLoadingBnccs">Carregando...</span>
                <span v-else>Salvar</span>
                <!-- @TODO: O botão deve aparecer mais aparente na tela -->
              </IonButton>
            </div>
          </IonCardContent>
        </div>
      </IonCard>
    </Form>
  </IonModal>
</template>

<style scoped>
ion-modal#update-modal {
  --height: 50vh;
  --width: 40vw;
  --min-width: 300px;
}

ion-modal#update-modal,
ion-card#NovoRegistroFormulario {
  box-shadow: none;
}

.update-modal-content {
  max-height: calc(50vh - 48px);
  overflow-y: auto;
  padding: 16px;
  box-sizing: border-box;
}

.error-message {
  color: red;
  font-size: 1em;
}

:deep(.multiselect__tags) {
  border-color: #b0b0b0;
}

:deep(.multiselect__tags:hover) {
  border-color: black;
}

:deep(.multiselect__placeholder) {
  color: var(--ion-color-secondary) !important;
}
</style>