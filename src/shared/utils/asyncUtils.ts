import { Ref } from 'vue';

/**
 * Exécute une fonction asynchrone en gérant automatiquement les états de chargement et d'erreur.
 * Permet d'éviter de répéter les blocs try/catch et loading = true/false partout dans les stores.
 * 
 * @param loadingRef - Référence Vue au booléen de chargement
 * @param errorRef - Référence Vue au message d'erreur (optionnel)
 * @param callback - La fonction asynchrone à exécuter
 * @param customErrorMessage - Message d'erreur personnalisé en cas d'échec
 */
export async function withLoading<T>(
  loadingRef: Ref<boolean>,
  callback: () => Promise<T>,
  errorRef?: Ref<string | null>,
  customErrorMessage = "Une erreur est survenue lors de l'opération."
): Promise<T | undefined> {
  loadingRef.value = true;
  if (errorRef) errorRef.value = null;

  try {
    return await callback();
  } catch (error) {
    console.error('[Async Error]', error);
    if (errorRef) {
      errorRef.value = customErrorMessage;
    }
    return undefined;
  } finally {
    loadingRef.value = false;
  }
}
