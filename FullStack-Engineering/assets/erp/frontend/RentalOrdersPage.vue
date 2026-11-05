<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable, { type DataTablePageEvent } from 'primevue/datatable';
import Message from 'primevue/message';
import { ApiError, http } from '@/shared/api/http';
import { usePermissions } from '@/shared/composables/usePermissions';

type RentalOrder = { id: string; status: string; startDate: string; endDate: string };
type Page = { items: RentalOrder[]; total: number };

const { can } = usePermissions();
const rows = ref<RentalOrder[]>([]);
const total = ref(0);
const pageSize = ref(20);
const first = ref(0);
const loading = ref(false);
const errorMessage = ref<string | null>(null);

// Modo lazy: la página se resuelve en el servidor.
async function load() {
  loading.value = true;
  errorMessage.value = null;
  try {
    const page = first.value / pageSize.value + 1;
    const data = await http<Page>(`/rental-orders?page=${page}&pageSize=${pageSize.value}`);
    rows.value = data.items;
    total.value = data.total;
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : 'No se pudo cargar la lista.';
  } finally {
    loading.value = false;
  }
}

function onPage(event: DataTablePageEvent) {
  first.value = event.first;
  pageSize.value = event.rows;
  void load();
}

onMounted(load);
</script>

<template>
  <section class="flex flex-col gap-4 p-4">
    <header class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-xl font-semibold">Órdenes de alquiler</h1>
      <Button v-if="can('rental-order:create')" label="Nueva orden" icon="pi pi-plus" />
    </header>

    <Message v-if="errorMessage" severity="error" :closable="false">
      {{ errorMessage }}
      <Button label="Reintentar" text size="small" @click="load" />
    </Message>

    <DataTable
      v-else
      :value="rows"
      :loading="loading"
      :total-records="total"
      :rows="pageSize"
      :first="first"
      :rows-per-page-options="[20, 50, 100]"
      data-key="id"
      lazy
      paginator
      scrollable
      @page="onPage"
    >
      <template #empty>Aún no hay órdenes de alquiler.</template>
      <Column field="startDate" header="Inicio" />
      <Column field="endDate" header="Fin" />
      <Column field="status" header="Estado" />
    </DataTable>
  </section>
</template>
