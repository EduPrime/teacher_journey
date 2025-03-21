<script setup lang="ts">
import showToast from "@/utils/toast-alert";
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
import { computed, defineProps, ref, watch } from "vue";
import BNCCService from "../../services/BNCCService";
import ContentService from "../../services/ContentService";
import { Form, Field, ErrorMessage } from "vee-validate";

interface AvailableDisciplines {
	id: string;
	name: string;
	classroomId: string;
}
interface Props {
	availableDisciplines: AvailableDisciplines[];
	teacherId: string;
	classroomId: string;
	selectedDay: string;
	disciplineId?: string;
	seriesId: string;
  evaluation: string;
}

const props = defineProps<Props>();
const emits = defineEmits(["update:modelValue"]);
const availableDisciplineIds = ref<string[]>([]);

const bnccService = new BNCCService();
const contentService = new ContentService();

const bnccs = ref();

const filledContent = ref({
	disciplines: props.disciplineId ? [props.disciplineId] : [] as string[],
	date: computed(() => props.selectedDay),
	description: "",
	bnccs: [] as string[],
	classroomId: computed(() => props.classroomId),
	teacherId: computed(() => props.teacherId),
});

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

watch(
  () => props.classroomId,
  async (newValue) => {
    if (newValue) {
      filledContent.value.disciplines = [];
    }
  },
);

watch(
  () => filledContent.value.disciplines,
  async (newValue) => {
    if (newValue.length > 0) {
      await getBNCCByDisciplines(newValue);
    }
  },
);

watch(
  () => props.disciplineId,
  async (newValue) => {
    if (newValue) {
      filledContent.value.disciplines = [newValue];
    }
  },
)

async function getBNCCByDisciplines(selectedDisciplines: string[]) {
	const data = await bnccService.getBNCC(selectedDisciplines, props.seriesId);
	bnccs.value = data;
	filledContent.value.disciplines = selectedDisciplines;
	return data;
}

async function setBNCC(selectedBNCC: string[]) {
	filledContent.value.bnccs = selectedBNCC;
}

async function saveContent() {
	const data = await contentService.createContent({ ...filledContent.value });
	emits("update:modelValue", { card: false, saved: !!data });

	showToast("Conteúdo criado com sucesso", "top", "success");
}
</script>

<template>
  <Form
    :initial-values="{
      Disciplina: filledContent.disciplines,
    }"
    @submit="saveContent">
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
            <IonSelect v-if="props.evaluation === 'conceitual'"
              v-bind="field"
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
            <IonSelect v-else
              v-bind="field"
              v-model="filledContent.disciplines"
              class="ion-select-card-content"
              label="Disciplina"
              label-placement="floating"
              fill="outline"
              cancel-text="Cancelar"
              :multiple="false"
              :disabled="true"
              @ion-change="getBNCCByDisciplines($event.detail.value)"
            >
              <IonSelectOption v-for="(discipline, index) in availableDisciplines" :key="index" :value="discipline.id" :selected="filledContent.disciplines.includes(discipline.id)">
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
              <IonSelectOption v-for="bncc in bnccs" :key="bncc" :value="bncc.id">
                {{ bncc.code }} - {{ bncc.objective.slice(0, 58) }}...
              </IonSelectOption>
            </IonSelect>
          </Field>
          <ErrorMessage name="Currículos" v-slot="{ message }">
              <span class="error-message">{{ message }}</span>
            </ErrorMessage>

          <div class="ion-margin-top" style="display: flex; justify-content: right;">
            <IonButton color="danger" size="small" style="text-transform: capitalize;" @click="emits('update:modelValue', { card: false })">
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
</template>

<style scoped>
.error-message {
  color: red;
  font-size: 1em;
}
</style>
