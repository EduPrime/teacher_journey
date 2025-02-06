<script setup lang="ts">
import ContentLayout from '@/components/theme/ContentLayout.vue'
import { IonButton, IonCol, IonIcon, IonRow, IonSearchbar, IonTitle, IonToolbar, IonSelect, IonItem, IonSelectOption, IonLabel } from '@ionic/vue'
import { add, businessOutline, calendarOutline, menu, people, peopleOutline, personOutline } from 'ionicons/icons'
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

// import TeacherJourney from '../components/TeacherJourney.vue'
// import TeacherJourneyService from '../services/TeacherJourneyService'

// Instanciar o serviço
// const teacherJourneyService = new TeacherJourneyService()

const router = useRouter()

const series = ref([
  { id: 1, name: '1st Grade' },
  { id: 2, name: '2nd Grade' },
  { id: 3, name: '3rd Grade' },
  { id: 4, name: '4th Grade' },
  { id: 5, name: '5th Grade' }
])

const filter = ref({
  serie: null
})

// Carregar dados ao montar o componente
onMounted(async () => {
  // await loadData()
})

// Função para carregar os dados usando o serviço
// async function loadData() {
//   try {
//     const data = await teacherJourneyService.getAll()
//     dataList.value = data || []
//     console.log('Dados carregados:', data)
//   } catch (error) {
//     console.error('Erro ao carregar os dados:', error)
//   }
// }

// Função para navegar para a página de registro
function navigateToRegister() {
  router.push({ name: 'RegisterTeacherJourney' })
}
 
</script>

<template>
  <ContentLayout>
    <ion-text color="secondary">
      <h3 class="">Filtros</h3>
      <p class="">Preencha os filtros abaixo para uma mais acertiva</p>
    </ion-text>
    <IonItem color="primary">
      <IonIcon slot="start" class="cursor-pointer" :icon="businessOutline" />
      <IonSelect :value="filter.serie" toggle-icon="disable" interface="action-sheet" placeholder="Série"
        @ion-change="($event: CustomEvent) => filter.serie = $event.detail.value">
      <IonSelectOption v-for="serie, i in series" :key="i" :value="serie.id">
          {{ serie.name }}
        </IonSelectOption>
      </IonSelect>
    </IonItem>
    <IonItem color="tertiary">
      <IonIcon slot="start" class="cursor-pointer" :icon="peopleOutline"/>
      <IonSelect :value="filter.serie" toggle-icon="disable" interface="action-sheet" placeholder="Série"
        @ion-change="($event: CustomEvent) => filter.serie = $event.detail.value">
        <IonSelectOption v-for="serie, i in series" :key="i" :value="serie.id">
          {{ serie.name }}
        </IonSelectOption>
      </IonSelect>
    </IonItem>

    <ion-card>
      <ion-card-header>
          <ion-row class="">
            <ion-col size="1">
                <ion-icon color="secondary" :icon="calendarOutline" size="large"></ion-icon>
            </ion-col>
            <ion-col size="11">
              <ion-card-title color="secondary">Registro de conteúdo diário</ion-card-title>
            </ion-col>
          </ion-row>
    </ion-card-header>

    <ion-card-content>
    </ion-card-content>
  </ion-card>

  </ContentLayout>
</template>

<style scoped>
/* Seus estilos aqui */
</style>
