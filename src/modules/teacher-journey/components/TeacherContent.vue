<script setup lang="ts">
  defineProps({})
  </script>

<template>
    <!-- Template para o componente TeacherJourney -->
    <ion-list>
    <ion-item-sliding>
      <ion-item>
        <ion-label>Arraste para esquerda</ion-label>
      </ion-item>
      <ion-item-options>
        <ion-item-option>Favorito</ion-item-option>
        <ion-item-option color="danger">Apagar</ion-item-option>
      </ion-item-options>
    </ion-item-sliding>
  </ion-list>
</template>

<style scoped>
  /* Estilos para o componente */
</style>
  