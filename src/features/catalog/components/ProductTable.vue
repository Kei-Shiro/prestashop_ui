<script setup lang="ts">
import type { Product } from '@shared/types/product';

defineProps<{
  products: Product[];
}>();
</script>

<template>
  <div class="table-wrapper">
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nom</th>
          <th class="text-right">Prix</th>
          <th class="text-right">Stock</th>
          <th>État</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in products" :key="p.id_product">
          <td class="cell-id">#{{ p.id_product }}</td>
          <td class="cell-name">{{ p.name }}</td>
          <td class="text-right cell-mono">{{ p.price }} &euro;</td>
          <td class="text-right">
            <span :class="['stock-badge', Number(p.quantity) > 0 ? 'stock-badge--in' : 'stock-badge--out']">
              {{ p.quantity }}
            </span>
          </td>
          <td>
            <span :class="['status-pill', p.active ? 'status-pill--active' : 'status-pill--inactive']">
              {{ p.active ? 'Actif' : 'Inactif' }}
            </span>
          </td>
        </tr>
        <tr v-if="products.length === 0">
          <td colspan="5" class="empty-cell">Aucun produit à afficher.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrapper {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th, .table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.table th {
  background: #f8fafc;
  font-weight: 600;
  color: #64748b;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table tbody tr:hover {
  background: #f8fafc;
}

.cell-id {
  color: #64748b;
  font-family: monospace;
}

.cell-name {
  font-weight: 500;
  color: #1e293b;
}

.cell-mono {
  font-family: monospace;
}

.text-right { text-align: right; }

.stock-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.stock-badge--in {
  background: #f0fdf4;
  color: #166534;
}

.stock-badge--out {
  background: #fef2f2;
  color: #991b1b;
}

.status-pill {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
}

.status-pill--active {
  background: #ecfdf5;
  color: #059669;
}

.status-pill--inactive {
  background: #f1f5f9;
  color: #64748b;
}

.empty-cell {
  text-align: center;
  padding: 3rem 0;
  color: #64748b;
}
</style>