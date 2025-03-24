<script setup lang="ts">
import showToast from "@/utils/toast-alert";
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
} from "@ionic/vue";
import { save } from "ionicons/icons";
import { DateTime } from "luxon";
import { defineProps, onUpdated, ref, watch } from "vue";
import BNCCService from "../../services/BNCCService";
import ContentService from "../../services/ContentService";
import { Form, Field, ErrorMessage } from "vee-validate";
import { FieldSlotProps } from "vee-validate";

interface AvailableDisciplines {
	id: string;
	name: string;
	classroomId: string;
}
interface Props {
	availableDisciplines: AvailableDisciplines[];
	classroomId: string;
	// disciplineId?: string
	seriesId: string;
	registry: any;
	isUpdateModalOpen: boolean;
	frequency: string;
  evaluation: string;
}

const props = defineProps<Props>();
const emits = defineEmits(["update:modelValue"]);
const availableDisciplineIds = ref<string[]>([]);

const bnccService = new BNCCService();
const contentService = new ContentService();

const bnccs = ref();

const modalOpened = ref(props.isUpdateModalOpen);

const filledContent = ref({
	id: "",
	disciplines: [] as string[],
	date: "",
	description: "",
	bnccs: [] as string[],
	classroomId: "",
	teacherId: "",
});

onUpdated(() => {
	getBNCCByDisciplines(filledContent.value.disciplines);
});

watch(
	() => props.registry,
	(value) => {
		if (value) {
			filledContent.value = {
				id: value.id,
				disciplines: value.disciplines.map((d: any) => d.disciplineId.id),
				date: value.date,
				description: value.description,
				bnccs: value.bnccs.map((b: any) => b.bnccId.id),
				classroomId: value.classroomId,
				teacherId: value.teacherId,
			};
			bnccs.value = bnccService.getBNCC(
				filledContent.value.bnccs,
				props.seriesId,
			);
		}
	},
	{ immediate: true },
);

watch(
	() => props.availableDisciplines,
	async (newValue) => {
		if (
			newValue &&
			newValue.length > 0 &&
			filledContent.value.disciplines.length === 0
		) {
			availableDisciplineIds.value = [];
			props.availableDisciplines.map((discipline: AvailableDisciplines) => {
				if (discipline.classroomId === props.classroomId) {
					availableDisciplineIds.value.push(discipline.id);
				}
				return void 0;
			});

			bnccs.value = await bnccService.getBNCC(
				availableDisciplineIds.value.length > 0
					? availableDisciplineIds.value
					: props.availableDisciplines.map(
							(disciplines: AvailableDisciplines) => {
								return disciplines.id;
							},
						),
				props.seriesId,
			);
		}
	},
	{ immediate: true },
);

// watch(filledContent, async (newValue) => {
//   if (newValue.bnccs.length > 0) {
//     bnccs.value = await bnccService.getBNCC(newValue.bnccs, props.seriesId)
//   }
// }, { immediate: true })

async function getBNCCByDisciplines(selectedDisciplines: string[]) {
	const data = await bnccService.getBNCC(selectedDisciplines, props.seriesId);
	bnccs.value = data;

	filledContent.value.bnccs = data.map((bncc) => bncc.id);
  // @TODO: Verificar a atualização do BNCC corretamente ao trocar de disciplina ao editar um conteúdo
  // filledContent.value.bnccs = filledContent.value.bnccs.filter((bnccId) =>
	// 	data.some((bncc) => bncc.id === bnccId),
	// );

	filledContent.value.disciplines = selectedDisciplines;
	return data;
}

async function setBNCC(selectedBNCC: string[]) {
	filledContent.value.bnccs = selectedBNCC;
}

async function saveContent() {
	// console.log("saveContent entrou");

	const data = await contentService.updateContent({ ...filledContent.value });

	// console.log("data", data);

	emits("update:modelValue", false);

	showToast("Conteúdo editado com sucesso", "top", "success");
}

function luxonFormatDate(dateString: string) {
	const date = DateTime.fromISO(dateString);
	return date.setLocale("pt-BR").toFormat("dd/MM/yyyy");
}
</script>

<template>
    <IonModal id="update-modal" class="ion-content" :is-open="props.isUpdateModalOpen" @ion-modal-did-dismiss="() => { modalOpened = false; emits('update:modelValue', false) }">
      <Form 
        :initial-values="{
          Disciplina: filledContent.disciplines,
          Conteúdo: filledContent.description,
          Currículos: filledContent.bnccs
        }" @submit="saveContent">
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

            <IonCardContent class="" style="display: flex; flex-direction: column; gap: 15px;">
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
                  <IonSelectOption v-for="(discipline, index) in availableDisciplines" :key="index" :value="discipline.id">
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
                <IonSelect
                  v-bind="field"
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
                    {{ bncc.code }} - {{ bncc.objective.slice(0, 58) }}...
                  </IonSelectOption>
                </IonSelect>
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
    --width: 400px;
    --min-width: 400px;
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

  .error-message {
  color: red;
  font-size: 1em;
}
</style>
