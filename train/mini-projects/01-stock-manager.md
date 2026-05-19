# Mini-Projet : Gestionnaire de Stocks Express

**Durée estimée :** 2 à 3 heures
**Difficulté :** Intermédiaire à Avancé

## Le besoin Métier
Dans le Back-office, le responsable logistique trouve que l'interface native de PrestaShop est trop lente pour mettre à jour les stocks après un inventaire. 
Il veut une interface "Tableur" (Excel-like) qui liste les produits et permet de mettre à jour le stock en 1 clic.

## Les spécifications techniques
1. **Route** : Créer une nouvelle page `/backoffice/fast-stock` (Lien à ajouter dans la navbar admin).
2. **Récupération des données** : 
   - Vous devez récupérer la liste des produits (`/products?display=[id,name,id_default_image]`).
   - Vous devez récupérer les stocks (`/stock_availables?display=full`).
   - Faire la jointure côté client pour afficher chaque produit et son stock actuel.
3. **UI / Tableau** : 
   - Colonne Image, Nom du produit, Quantité Actuelle, Input "Nouvelle Quantité", Bouton "Enregistrer".
4. **Action de mise à jour** :
   - Au clic sur Enregistrer, faire le `PUT` sur l'API `/stock_availables/{id}` (voir `api-integration/01-prestashop-xml.md`).
   - Gérer l'état de chargement local (spinner sur la ligne en cours de modification).
   - Afficher une notification (Toast) en cas de succès ou d'erreur.

## Étape 1 : Architecture des fichiers
Créez la structure suivante dans votre projet :
```
src/
  features/
    inventory/
      components/
        FastStockTable.vue
        FastStockRow.vue
      composables/
        useFastStock.ts
      services/
        inventory-service.ts
  backoffice/
    pages/
      FastStockPage.vue
```

## Étape 2 : Le composable `useFastStock.ts`
Ce composable sera le cœur du mini-projet. Il doit s'occuper de :
1. Lancer les requêtes `Promise.all([getProducts, getStocks])`.
2. Croiser les données (Fusionner le produit avec son stock via `id_product`).
3. Exposer une fonction `updateStock(stockId, newQty)`.

## Conseils & Pièges
- **Piège XML** : Attention aux déclinaisons (combinations) ! Un produit peut avoir plusieurs lignes de stock (une pour chaque taille/couleur). Pour ce mini-projet, concentrez-vous sur les produits sans déclinaisons (`id_product_attribute = 0`), ou affichez les déclinaisons si vous êtes chaud !
- **Vue Reactivity** : Lorsque vous mettez à jour la quantité via l'API et que ça réussit, n'oubliez pas de mettre à jour la valeur de la quantité dans le tableau Vue réactif (`data.value.find(s => s.id === stockId).quantity = newQty`) pour éviter de devoir re-télécharger toute la page !

## Évaluation
Si vous réussissez ce mini-projet, vous maîtrisez :
- La Composition API et la réactivité complexe.
- Les jointures de données asynchrones.
- L'API PrestaShop et son payload PUT XML particulier.
- La conception de composants atomiques (Séparation Table / Row).
