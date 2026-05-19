# Debugging : Les Erreurs Fréquentes (XML & Vue)

Ce guide répertorie les erreurs les plus courantes que vous rencontrerez sur le projet et comment les résoudre.

## 1. L'erreur : "Cannot read properties of undefined (reading 'prestashop')"

**Le symptôme :** La page plante complètement, ou un composable renvoie une erreur silencieuse lors d'un fetch.
**La cause :** 
L'API a renvoyé une erreur HTTP (ex: 404, 401), donc Axios a throw une exception. Si vous interceptez l'erreur sans la traiter, ou si vous essayez de lire le succès directement, ça casse. Ou bien le parser XML n'a pas réussi à parser la réponse (si le serveur renvoie du HTML au lieu du XML, par exemple en mode maintenance).

**La solution :**
1. Vérifiez l'onglet Network (Réseau) dans les DevTools du navigateur.
2. Assurez-vous d'avoir toujours un bloc `try/catch` robuste :
```typescript
try {
  const response = await apiService.get('/products');
  return response.prestashop.products.product;
} catch (error: any) {
  // Regardez ce que PrestaShop vous dit exactement !
  console.error("API Error details:", error.response?.data);
  throw error;
}
```

## 2. Le comportement : `items.map is not a function`

**La cause :**
C'est le grand classique de `fast-xml-parser`. PrestaShop renvoie `<products><product>A</product><product>B</product></products>`. Le parser JS génère `products.product = [A, B]`.
Mais s'il n'y a qu'UN SEUL produit, PrestaShop renvoie `<products><product>A</product></products>`. Le parser génère `products.product = A` (un objet, pas un tableau). 
Faire `A.map()` déclenche l'erreur.

**La solution :**
Utiliser systématiquement `ensureArray` !
```typescript
import { ensureArray } from '@/shared/utils/arrayUtils';
const products = ensureArray(response.prestashop.products.product);
// Maintenant map() fonctionnera à 100%
products.map(...) 
```

## 3. L'erreur "Property 'length' was accessed during render but is not defined on instance."

**La cause :**
Dans le template Vue, vous faites un `v-if="products.length > 0"` mais `products` est défini à `null` ou `undefined` de manière asynchrone avant que les données n'arrivent.

**La solution :**
Utilisez l'optional chaining ou initialisez correctement votre ref.
```vue
<!-- Mauvais -->
<div v-if="products.length > 0">...</div>

<!-- Bon -->
<div v-if="products?.length > 0">...</div>
<!-- OU dans le script : const products = ref([]); -->
```

## 4. API PrestaShop renvoie HTTP 400 Bad Request en PUT/POST

**La cause :**
PrestaShop est extrêmement strict sur la structure du XML envoyé. Il faut souvent TOUS les champs requis, et les IDs doivent avoir la bonne structure.

**La solution :**
Affichez le retour d'erreur de PrestaShop. L'API renvoie souvent un `<message>` très clair du type : *"Property Product->name is empty"*.
Si le payload semble correct, vérifiez l'encapsulation :
Avez-vous bien mis l'entité mère dans le payload JS ?
```javascript
// FAUX
apiService.put('/products/1', { name: "test", price: 10 });

// VRAI
apiService.put('/products/1', {
  product: { id: 1, name: "test", price: 10 /* etc... */ }
});
// (apiService ajoutera <prestashop> autour automatiquement)
```
