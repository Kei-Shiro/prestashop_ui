# UI, Composants et Layouts

## Théorie : L'approche Composant dans PrestaShop UI

Le projet utilise **Vue 3 avec la Composition API (`<script setup>`)** et sépare clairement l'application en deux univers :
1. **Back-office** (`src/backoffice/layouts/AdminLayout.vue`) : Style ERP, menu latéral, tableaux de données.
2. **Front-office** (`src/frontoffice/layouts/DefaultLayout.vue`) : Style E-commerce, header client, panier.

L'objectif est d'utiliser des composants génériques pour éviter la duplication de code (ex: Modales, Boutons, Tableaux avec pagination).

## Exemples du projet

### 1. Structure d'une page (Dashboard)
```vue
<template>
  <div class="dashboard-page">
    <PageHeader title="Tableau de bord" />
    
    <div class="stats-grid">
      <StatCard 
        v-for="stat in stats" 
        :key="stat.id" 
        :title="stat.label" 
        :value="stat.value" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import PageHeader from '@shared/ui/components/PageHeader.vue';
import StatCard from '@shared/ui/components/StatCard.vue';
import { useStats } from '@/features/dashboard/composables/useStats';

const { fetchStats } = useStats();
const stats = ref([]);

onMounted(async () => {
  stats.value = await fetchStats();
});
</script>
```

## Conventions du Projet
- **Vanilla CSS** : Pas de Tailwind. Les styles sont scopés (`<style scoped>`) ou gérés de manière globale dans `@shared/ui/styles/`.
- **Nommage** : PascalCase pour les composants (ex: `ProductCard.vue`).
- **Props et Emits typés** : Toujours utiliser TypeScript pour définir les contrats des composants.

## Exercice Pratique : Créer un Tableau Avancé

**Objectif** : Créer un composant `DataTable.vue` générique.
1. Il doit accepter une prop `columns` (tableau d'objets avec `key` et `label`).
2. Il doit accepter une prop `data` (tableau d'objets génériques).
3. Il doit émettre un événement `row-click` lorsqu'une ligne est cliquée.

### Solution

```vue
<!-- src/shared/ui/components/DataTable.vue -->
<template>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in data" :key="item.id" @click="handleRowClick(item)">
          <td v-for="col in columns" :key="col.key">
            <!-- Utilisation des slots pour un rendu customisable -->
            <slot :name="col.key" :item="item">
              {{ item[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
// Typage générique pour le composant (Syntaxe Vue 3.3+)
interface Column {
  key: string;
  label: string;
}

const props = defineProps<{
  columns: Column[];
  data: any[];
}>();

const emit = defineEmits<{
  (e: 'row-click', item: any): void;
}>();

const handleRowClick = (item: any) => {
  emit('row-click', item);
};
</script>

<style scoped>
.table-container { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
tr:hover { background-color: #f9f9f9; cursor: pointer; }
</style>
```

## Astuces Senior 💡
- **Slots** : Utilisez toujours les scoped slots dans vos tableaux/listes génériques pour permettre au parent de formater une cellule spécifique (ex: afficher une image, un badge de statut).
- **Responsive** : Pour les tableaux sur mobile, pensez à la technique du CSS `display: block` sur les `tr` et `td` avec des `data-label` en ::before, ou utilisez des cartes au lieu d'un tableau strict.
