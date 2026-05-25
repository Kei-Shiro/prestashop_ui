# Guide de Survie Technique - PrestaShop UI

Ce guide explique les concepts clés du projet sous la structure **Quoi ➜ Pourquoi ➜ Quand ➜ Comment**, avec des exemples concrets tirés de ton codebase.

---

## Sommaire
1. [La Réactivité Vue 3 (ref vs reactive)](#1-la-réactivité-vue-3-ref-vs-reactive)
2. [Le Cycle de vie (onMounted)](#2-le-cycle-de-vie-onmounted)
3. [Fonctions Fléchées (=>)](#3-fonctions-fléchées--)
4. [Méthodes de Tableaux (map, find, filter, reduce)](#4-méthodes-de-tableaux-map-find-filter-reduce)
5. [Gestion des Événements (event, event.target, @change)](#5-gestion-des-événements-event-eventtarget-change)
6. [Calculs Réactifs (computed)](#6-calculs-réactifs-computed)
7. [Gestion d'État Global (Pinia)](#7-gestion-détat-global-pinia)
8. [Déstructuration d'Objets (destructuring)](#8-déstructuration-dobjets-destructuring)
9. [Sécurité JavaScript (Champs optionnels ?.)](#9-sécurité-javascript-champs-optionnels-)
10. [Outils spécifiques à PrestaShop UI (extractIdValue, extractLanguageValue)](#10-outils-spécifiques-à-prestashop-ui-extractidvalue-extractlanguagevalue)
11. [Directives Vue 3 (v-if, v-for, v-model)](#11-directives-vue-3-v-if-v-for-v-model)
12. [Navigation avec Vue Router (useRoute, useRouter, router-link, guards)](#12-navigation-avec-vue-router-useroute-userouter-router-link-guards)
13. [JavaScript Asynchrone (async/await, try/catch, Promise.all)](#13-javascript-asynchrone-asyncawait-trycatch-promiseall)
14. [Spécificités de l'API PrestaShop (Format XML & Sérialisation)](#14-spécificités-de-lapi-prestashop-format-xml--sérialisation)
15. [Communication entre Composants (Props & Emits)](#15-communication-entre-composants-props--emits)
16. [TypeScript Utile (Interfaces & Type Casting 'as')](#16-typescript-utile-interfaces--type-casting-as)

---

## 1. La Réactivité Vue 3 (ref vs reactive)

### `ref`

*   **Quoi :** Une fonction de Vue qui permet d'emballer une valeur simple (nombre, texte, booléen, tableau, ou objet) dans une boîte "réactive".
*   **Pourquoi :** Si tu utilises une simple variable JS (`let total = 0`), Vue ne sait pas quand elle change. L'interface ne se mettra pas à jour. Avec `ref`, Vue détecte chaque changement et rafraîchit automatiquement l'écran.
*   **Quand :** 
    *   Pour les types primitifs (`string`, `number`, `boolean`).
    *   Pour les tableaux entiers ou les objets que tu prévois de réassigner complètement (ex: charger depuis l'API).
*   **Comment (Exemple concret) :**
    ```typescript
    import { ref } from 'vue';

    // 1. Déclaration
    const isImporting = ref(false); // Booléen
    const orders = ref<any[]>([]); // Tableau vide

    // 2. Modification dans le code JS/TS (.value obligatoire)
    const startImport = () => {
      isImporting.value = true;
    };

    // 3. Utilisation dans le HTML (Pas besoin de .value !)
    // <button :disabled="isImporting">Importer</button>
    ```

### `reactive`

*   **Quoi :** Une fonction de Vue similaire à `ref`, mais réservée exclusivement aux **objets complexes** (dictionnaires, états formulaires regroupés).
*   **Pourquoi :** Évite d'écrire `.value` partout dans le code JS.
*   **Quand :** Uniquement pour les objets de configuration ou les groupes de champs (ex: formulaires, états de cases à cocher multiples).
*   **Comment (Exemple concret) :**
    *Tiré de [ImportPage.vue](file:///c:/Etude/Projet/Evaluation/prestashop_ui/src/backoffice/pages/ImportPage.vue#L260-L262)* :
    ```typescript
    import { reactive } from 'vue';

    // 1. Déclaration
    const checkbox = reactive({
      condition: false
    });

    // 2. Utilisation en JS/TS (Pas de .value !)
    const checkState = () => {
      if (checkbox.condition) {
        console.log("Activé !");
      }
    };
    ```

---

## 2. Le Cycle de vie (onMounted)

*   **Quoi :** Un "hook" (crochet) de cycle de vie qui exécute du code lorsque le composant vient d'être inséré dans la page (le HTML est prêt).
*   **Pourquoi :** Si tu essaies de charger des données depuis l'API ou d'accéder au DOM avant que le composant ne soit affiché, le code va planter.
*   **Quand :** Pour lancer des appels API de chargement de données dès que l'utilisateur arrive sur la page.
*   **Comment (Exemple concret) :**
    *Tiré de [MyOrderPage.vue](file:///c:/Etude/Projet/Evaluation/prestashop_ui/src/frontoffice/pages/MyOrderPage.vue#L79-L87)* :
    ```typescript
    import { onMounted } from 'vue';
    import { useOrders } from '@features/checkout/composables/useOrders';

    const { loadOrdersAndMetadata } = useOrders();

    onMounted(async () => {
      // Dès que la page s'affiche, on charge les commandes depuis l'API
      await loadOrdersAndMetadata();
    });
    ```

---

## 3. Fonctions Fléchées (=>)

*   **Quoi :** Une syntaxe moderne et raccourcie pour écrire des fonctions en JavaScript.
*   **Pourquoi :** C'est plus court à écrire et cela conserve le contexte du mot-clé `this` (très important en JS classique, même si moins bloquant avec la Composition API de Vue).
*   **Quand :** 
    *   Pour déclarer des méthodes rapides de composant.
    *   À l'intérieur des méthodes de tableaux (`map`, `find`, `filter`).
*   **Comment (Exemple concret) :**
    ```typescript
    // Version classique
    function getImageUrlClassic(item) {
      return productService.getImageUrl(item.id_product, item.id_default_image);
    }

    // Version fléchée (utilisée dans ReorderPage.vue)
    const getImageUrl = (item: any) => productService.getImageUrl(item.id_product, item.id_default_image);
    ```

---

## 4. Méthodes de Tableaux (map, find, filter, reduce)

Ces méthodes permettent de manipuler des tableaux proprement sans écrire de boucles `for` fastidieuses.

### `.map()` (Transformer)

*   **Quoi :** Parcourt un tableau et crée un **nouveau** tableau contenant les éléments transformés.
*   **Pourquoi :** Idéal pour extraire ou adapter des données (ex: convertir une liste d'objets bruts en liste de noms).
*   **Quand :** Chaque fois que tu as un tableau de type A et que tu veux un tableau de type B de même taille.
*   **Comment (Exemple concret) :**
    ```typescript
    const users = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" }
    ];

    // Extraire uniquement les noms
    const names = users.map(user => user.name); 
    // Résultat : ["Alice", "Bob"]
    ```

### `.find()` (Rechercher un élément)

*   **Quoi :** Parcourt le tableau et retourne le **premier** élément qui valide une condition.
*   **Pourquoi :** Évite de parcourir manuellement tout le tableau avec un `for` + `break`.
*   **Quand :** Quand tu cherches un objet unique (ex: un produit par son ID).
*   **Comment (Exemple concret) :**
    ```typescript
    const products = [
      { id: '101', name: "T-Shirt" },
      { id: '102', name: "Mug" }
    ];

    const targetProduct = products.find(p => p.id === '102');
    // Résultat : { id: '102', name: "Mug" }
    ```

### `.filter()` (Sélectionner plusieurs éléments)

*   **Quoi :** Parcourt le tableau et retourne un **nouveau** tableau contenant uniquement les éléments qui valident la condition.
*   **Pourquoi :** Idéal pour exclure des éléments (ex: cacher les produits hors stock).
*   **Quand :** Pour filtrer une liste.
*   **Comment (Exemple concret) :**
    *Tiré de [MyOrderPage.vue](file:///c:/Etude/Projet/Evaluation/prestashop_ui/src/frontoffice/pages/MyOrderPage.vue#L83)* :
    ```typescript
    // Filtrer les commandes pour ne garder que celles du client connecté
    orders.value = orders.value.filter(o => Number(o.customerId) === userId);
    ```

### `.reduce()` (Accumuler)

*   **Quoi :** Parcourt le tableau pour le réduire à une **seule valeur** (somme, moyenne, objet cumulé).
*   **Pourquoi :** Très puissant pour calculer des sommes globales.
*   **Quand :** Pour calculer le prix total d'un panier ou le nombre total d'articles.
*   **Comment (Exemple concret) :**
    *Tiré de [ReorderPage.vue](file:///c:/Etude/Projet/Evaluation/prestashop_ui/src/frontoffice/pages/ReorderPage.vue#L106-L112)* :
    ```typescript
    // Calcul de la somme totale du panier
    const totalAmount = computed(() => {
      // sum = accumulateur, item = élément courant
      // 0 = valeur initiale de sum
      return items.value.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    });
    ```

---

## 5. Gestion des Événements (event, event.target, @change)

*   **Quoi :** La mécanique qui permet de lier des actions de l'utilisateur sur la page (clic, saisie, dépôt de fichier) à des fonctions JS.
*   **Pourquoi :** L'interface doit réagir aux interactions de l'utilisateur.
*   **Quand :** 
    *   `@click` sur un bouton.
    *   `@change` sur un sélecteur de fichier ou une liste déroulante.
    *   `@input` ou `@keyup` sur une saisie de texte.
*   **Comment (Exemple concret) :**
    *Tiré de [ImportPage.vue](file:///c:/Etude/Projet/Evaluation/prestashop_ui/src/backoffice/pages/ImportPage.vue#L224-L231)* :
    ```html
    <!-- HTML -->
    <input type="file" @change="handleFileProductsChange" />
    ```
    ```typescript
    // JS
    const handleFileProductsChange = (event: Event) => {
      // 1. event : L'événement brut déclenché par le navigateur
      // 2. event.target : L'élément HTML exact qui a déclenché l'événement (ici, l'input file)
      const target = event.target as HTMLInputElement; 
      
      if (target.files && target.files.length > 0) {
        selectedFileProducts.value = target.files[0]; // Récupère le fichier sélectionné
      }
    };
    ```

---

## 6. Calculs Réactifs (computed)

*   **Quoi :** Une valeur calculée par Vue qui se met à jour **automatiquement** uniquement lorsque l'une de ses dépendances réactives change.
*   **Pourquoi :** Plus performant qu'une simple fonction car Vue met le résultat en cache. Si les données sources ne changent pas, Vue ne recalcule pas.
*   **Quand :** Pour trier une liste, filtrer des résultats de recherche en direct, ou faire un total.
*   **Comment (Exemple concret) :**
    *Tiré de [ImportPage.vue](file:///c:/Etude/Projet/Evaluation/prestashop_ui/src/backoffice/pages/ImportPage.vue#L206-L211)* :
    ```typescript
    // Si l'un de ces fichiers change, canImport se recalcule tout seul
    const canImport = computed(() => {
      return selectedFileProducts.value || 
             selectedFileCombinations.value || 
             selectedFileOrders.value || 
             selectedFileImages.value;
    });
    ```

---

## 7. Gestion d'État Global (Pinia)

*   **Quoi :** La bibliothèque officielle de gestion d'état pour Vue. Elle sert de base de données globale dans ton application.
*   **Pourquoi :** Dans une application, les composants ont besoin de partager des informations (comme l'utilisateur connecté ou le panier actuel). Sans Pinia, tu devrais passer les infos de parent en enfant sur 10 niveaux, ce qui est l'enfer (on appelle ça le *Prop Drilling*).
*   **Quand :** Pour les informations globales : la session utilisateur (Authentification), le panier en cours, les préférences du thème.
*   **Comment (Exemple concret) :**
    *Tiré du routeur front-office [index.ts](file:///c:/Etude/Projet/Evaluation/prestashop_ui/src/frontoffice/router/index.ts#L40-L49)* :
    ```typescript
    import { useCustomerAuthStore as useAuthStore } from '@shared/models/auth';

    router.beforeEach((to) => {
      const authStore = useAuthStore(); // Accès au store global
      
      // On vérifie si l'utilisateur est connecté grâce à l'état du store
      if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        return '/'; // Redirection si non authentifié
      }
    });
    ```

---

## 8. Déstructuration d'Objets (destructuring)

*   **Quoi :** Une syntaxe raccourcie en JS pour extraire des propriétés d'un objet ou d'un tableau et les stocker dans des variables individuelles.
*   **Pourquoi :** Rend le code beaucoup plus propre et lisible.
*   **Quand :** Très fréquent lors de l'utilisation de composables Vue (les fonctions `use...`).
*   **Comment (Exemple concret) :**
    *Tiré de [MyOrderPage.vue](file:///c:/Etude/Projet/Evaluation/prestashop_ui/src/frontoffice/pages/MyOrderPage.vue#L49)* :
    ```typescript
    // Sans déstructuration
    const orderComposable = useOrders();
    const orders = orderComposable.orders;
    const isLoading = orderComposable.isLoading;

    // Avec déstructuration (En une seule ligne !)
    const { orders, isLoading, error, loadOrdersAndMetadata } = useOrders();
    ```

---

## 9. Sécurité JavaScript (Champs optionnels ?.)

*   **Quoi :** L'opérateur de chaînage optionnel (`?.`). Il permet de lire une propriété située au fond d'une chaîne d'objets sans risquer l'erreur `TypeError: Cannot read properties of undefined`.
*   **Pourquoi :** Évite que ton application ne plante complètement si une API renvoie un objet incomplet ou si une donnée n'est pas encore chargée.
*   **Quand :** Dès que tu accèdes à des données imbriquées issues d'API ou de structures XML instables.
*   **Comment (Exemple concret) :**
    *Tiré de [ImportPage.vue](file:///c:/Etude/Projet/Evaluation/prestashop_ui/src/backoffice/pages/ImportPage.vue#L357)* :
    ```typescript
    // Si taxRateMap est nul/undefined, le code retourne undefined ou 0 au lieu de planter
    const taxCount = computed(() => taxRateMap?.size || 0);
    ```

---

## 10. Outils spécifiques à PrestaShop UI

PrestaShop utilise le format **XML** via ses WebServices. Notre projet possède des fonctions utilitaires cruciales pour simplifier l'extraction des données.

### `extractIdValue`

*   **Quoi :** Une fonction utilitaire qui extrait proprement l'ID numérique d'un élément PrestaShop.
*   **Pourquoi :** Le WebService PrestaShop enveloppe parfois les IDs dans des objets complexes contenant des attributs XML comme `xlink`. `extractIdValue` nettoie cela pour te donner une simple chaîne ou un nombre.
*   **Comment (Exemple concret) :**
    ```typescript
    import { extractIdValue } from '@shared/utils/extractIdValue';

    const rawProduct = { id: { '#text': '42', '@_xlink:href': '...' } };
    const cleanId = extractIdValue(rawProduct.id); 
    // Résultat : '42'
    ```

### `extractLanguageValue`

*   **Quoi :** Une fonction utilitaire pour extraire des textes traduits.
*   **Pourquoi :** PrestaShop est multilingue. Un nom de produit ressemble souvent à :
    `{ language: { '@_id': '1', '#text': 'Mon T-shirt' } }`
    `extractLanguageValue` extrait le texte correspondant à la langue par défaut de l'utilisateur.
*   **Comment (Exemple concret) :**
    ```typescript
    import { extractLanguageValue } from '@shared/utils/extractLanguageValue';

    const productNameField = rawProduct.name;
    const displayName = extractLanguageValue(productNameField);
    // Résultat : 'Mon T-shirt' (selon la langue)
    ```

---

## 11. Directives Vue 3 (v-if, v-for, v-model)

### `v-if` / `v-else`

*   **Quoi :** Permet d'afficher ou masquer un élément HTML selon qu'une condition soit vraie ou fausse.
*   **Pourquoi :** Pour adapter l'affichage dynamiquement (ex: afficher un message d'erreur ou un bouton de chargement).
*   **Comment :**
    ```html
    <div v-if="isLoading">Chargement...</div>
    <div v-else>Contenu chargé !</div>
    ```

### `v-for`

*   **Quoi :** Permet de répéter un élément HTML pour chaque élément d'une liste (tableau).
*   **Pourquoi :** Évite de dupliquer manuellement le HTML pour chaque produit ou commande. Le `:key` est obligatoire pour que Vue puisse suivre chaque élément de manière unique en mémoire.
*   **Comment :**
    ```html
    <div v-for="order in orders" :key="order.id">
      Commande n°{{ order.id }} - {{ order.totalPaid }} €
    </div>
    ```

### `v-model`

*   **Quoi :** Lie la valeur d'un champ de formulaire (input, checkbox) à une variable JavaScript. Si l'utilisateur tape, la variable change ; si le JS change la variable, le champ se met à jour.
*   **Pourquoi :** Évite d'écrire un écouteur d'événement manuel pour chaque champ de saisie.
*   **Comment :**
    ```html
    <input type="number" v-model.number="multiplier" min="1" />
    ```

---

## 12. Navigation avec Vue Router (useRoute, useRouter, router-link, guards)

### `useRoute` vs `useRouter`

*   **Quoi :** 
    *   `useRoute` contient les informations de l'URL **actuelle**.
    *   `useRouter` est l'outil pour **changer** d'URL (naviguer).
*   **Pourquoi :** Permet d'interagir avec le système de navigation de l'application.
*   **Quand :**
    *   Utilise `useRoute` pour récupérer des paramètres passés dans l'URL (ex: l'ID d'une commande à renouveler `/reorder?orderId=5`).
    *   Utilise `useRouter` pour rediriger l'utilisateur vers une page de confirmation après un achat.
*   **Comment :**
    ```typescript
    import { useRoute, useRouter } from 'vue-router';

    const route = useRoute();
    const router = useRouter();

    // 1. Lire un paramètre d'URL (?orderId=5)
    const orderId = route.query.orderId;

    // 2. Rediriger vers une autre page
    const goToConfirmation = (id: number) => {
      router.push(`/order-confirmation/${id}`);
    };
    ```

### `<router-link>`

*   **Quoi :** Un composant spécial de Vue Router qui remplace la balise `<a>` classique de HTML.
*   **Pourquoi :** Permet de changer de page instantanément sans recharger tout l'onglet du navigateur (Single Page Application).
*   **Comment :**
    ```html
    <router-link to="/orders" class="btn-back">
      ← Retour à mes commandes
    </router-link>
    ```

### Navigation Guards (`beforeEach`)

*   **Quoi :** Des fonctions de sécurité qui s'exécutent avant chaque changement de page.
*   **Pourquoi :** Pour bloquer l'accès aux pages sensibles (ex : le back-office ou l'historique des commandes d'un client) si l'utilisateur n'est pas connecté.
*   **Comment :**
    ```typescript
    router.beforeEach((to) => {
      const token = localStorage.getItem('admin_token');
      // Si la page requiert d'être connecté et que le token est absent
      if (to.meta.requiresAuth && !token) {
        return { path: '/login' }; // Redirection forcée
      }
    });
    ```

---

## 13. JavaScript Asynchrone (async/await, try/catch, Promise.all)

### `async` / `await`

*   **Quoi :** Syntaxe pour gérer les opérations asynchrones (qui prennent du temps, comme un appel réseau à l'API PrestaShop).
*   **Pourquoi :** Le navigateur n'attend pas que l'API réponde pour exécuter la suite du code. `await` force le JS à attendre la réponse avant de passer à la ligne suivante, rendant le code lisible comme du code synchrone.
*   **Comment :**
    ```typescript
    const verifyStock = async () => {
      // Le code attend ici que la fonction checkReorderStock ait fini sa requête HTTP
      const res = await orderService.checkReorderStock(orderId, multiplier);
      console.log(res);
    };
    ```

### `try` / `catch`

*   **Quoi :** Structure de contrôle pour intercepter et gérer les erreurs.
*   **Pourquoi :** Si une requête API échoue (ex: panne réseau, mauvais identifiant), l'application va crasher (écran figé). Le `try/catch` permet d'attraper l'erreur proprement et d'afficher un message à l'utilisateur.
*   **Comment :**
    ```typescript
    try {
      await verifyStock();
    } catch (err: any) {
      error.value = err.message || "Une erreur réseau est survenue.";
    }
    ```

### `Promise.all`

*   **Quoi :** Méthode pour lancer plusieurs tâches asynchrones en parallèle et attendre qu'elles soient toutes terminées.
*   **Pourquoi :** Gagner du temps. Si tu as 3 requêtes API de 1 seconde à faire, les faire l'une après l'autre prendra 3 secondes. Avec `Promise.all`, elles se lancent ensemble et prennent 1 seconde au total.
*   **Comment :**
    ```typescript
    // Lance le chargement des produits ET des catégories en même temps
    await Promise.all([
      loadProducts(),
      loadCategories()
    ]);
    ```

---

## 14. Spécificités de l'API PrestaShop (Format XML & Sérialisation)

*   **Quoi :** Le format de transfert de données imposé par l'API WebService de PrestaShop.
*   **Pourquoi :** Contrairement à la majorité des API modernes qui échangent du JSON, PrestaShop utilise exclusivement le format **XML** et nécessite une balise racine `<prestashop>`.
*   **Comment :**
    Notre projet intègre un outil automatique de conversion. Tu envoies des objets JS classiques à [apiService](file:///c:/Etude/Projet/Evaluation/prestashop_ui/src/shared/api/api-service.ts), et le [Serializer](file:///c:/Etude/Projet/Evaluation/prestashop_ui/src/shared/utils/serializer.ts) s'occupe de les sérialiser.
    
    *Structure attendue par PrestaShop :*
    ```xml
    <prestashop>
      <product>
        <name>
          <language id="1">Mon super produit</language>
        </name>
        <price>19.99</price>
      </product>
    </prestashop>
    ```

---

## 15. Communication entre Composants (Props & Emits)

### Props (De parent à enfant)

*   **Quoi :** Paramètres personnalisés qu'un composant peut recevoir de son parent.
*   **Pourquoi :** Pour rendre les composants réutilisables (ex : un composant de bouton qui prend en prop sa couleur ou son texte).
*   **Comment :**
    ```html
    <!-- Parent.vue -->
    <BasePagination :total-items="100" v-model:current-page="currentPage" />
    ```
    ```typescript
    // Enfant (BasePagination.vue)
    defineProps<{
      totalItems: number;
    }>();
    ```

### Emits (D'enfant à parent)

*   **Quoi :** Événements personnalisés déclenchés par le composant enfant vers son parent.
*   **Pourquoi :** Permet à l'enfant de dire au parent : "L'utilisateur a cliqué sur moi, fais quelque chose".
*   **Comment :**
    ```typescript
    // Enfant.vue
    const emit = defineEmits(['page-changed']);
    const onPageClick = (page: number) => {
      emit('page-changed', page);
    };
    ```
    ```html
    <!-- Parent.vue -->
    <BasePagination @page-changed="handlePageChange" />
    ```

---

## 16. TypeScript Utile (Interfaces & Type Casting 'as')

### Interfaces et Types

*   **Quoi :** Déclarations qui définissent la forme (les propriétés et leurs types) qu'un objet doit respecter.
*   **Pourquoi :** Permet d'avoir de l'autocomplétion dans ton éditeur et de bloquer les erreurs de frappe (ex: écrire `order.total_paid` au lieu de `order.totalPaid`).
*   **Comment :**
    ```typescript
    interface Order {
      id: number;
      dateAdd: string;
      totalPaid: number;
      currentState: {
        label: string;
        color: string;
      };
    }
    ```

### Type Casting avec `as`

*   **Quoi :** Dire explicitement au compilateur TypeScript "Fais-moi confiance, cet objet est de tel type".
*   **Pourquoi :** Parfois, TypeScript ne connaît pas le type précis d'un élément (ex : un événement générique du navigateur). Le mot-clé `as` permet de lui préciser pour accéder aux propriétés (ex : `.files` ou `.checked`).
*   **Comment :**
    ```typescript
    // TypeScript sait que event.target est un élément HTML, mais pas spécifiquement un Input
    const target = event.target as HTMLInputElement; 
    
    // Maintenant, nous avons accès à .checked sans erreur TypeScript
    const isChecked = target.checked; 
    ```
