<?php
/**
 * update_stock_custom.php — endpoint stock personnalisé
 *
 * PrestaShop interdit POST /api/stock_movements via le WebService.
 * Ce script comble le manque : il ajuste StockAvailable ET journalise
 * le mouvement dans la table ps_stock_mvt (lisible via GET /api/stock_movements).
 *
 * >>> DÉPLOIEMENT : copier ce fichier À LA RACINE de PrestaShop <<<
 *     ex : C:\xampp\htdocs\prestashop\update_stock_custom.php
 *     (le même dossier que index.php / config/ / init.php)
 *
 * Appel :
 *   GET|POST /prestashop/update_stock_custom.php?id_product=ID&delta=N&ws_key=KEY
 *     delta > 0  → entrée de stock
 *     delta < 0  → sortie de stock
 *
 * Réponse XML :
 *   <response><success>true|false</success><message>..</message>...</response>
 *
 * Prérequis : PrestaShop 1.7.3+ ou 8.x (param add_movement de updateQuantity).
 */

header('Content-Type: application/xml; charset=utf-8');
// Le front (Vite) tourne sur un autre port en dev → CORS ouvert.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

/** Émet la réponse XML et stoppe le script. */
function respond($ok, $message = '', $extraXml = '')
{
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<response>';
    echo '<success>' . ($ok ? 'true' : 'false') . '</success>';
    if ($message !== '') {
        echo '<message>' . htmlspecialchars($message, ENT_XML1, 'UTF-8') . '</message>';
    }
    echo $extraXml;
    echo '</response>';
    exit;
}

// ── 1. Bootstrap PrestaShop ────────────────────────────────────────────
$config = __DIR__ . '/config/config.inc.php';
if (!file_exists($config)) {
    respond(false, 'config.inc.php introuvable : placez ce fichier a la racine de PrestaShop.');
}
require_once $config;

// ── 2. Authentification : clé WebService ───────────────────────────────
$ws_key = isset($_REQUEST['ws_key']) ? trim($_REQUEST['ws_key']) : '';
if ($ws_key === '') {
    respond(false, 'Cle WebService manquante (ws_key).');
}
$account = Db::getInstance()->getValue(
    'SELECT `id_webservice_account` FROM `' . _DB_PREFIX_ . 'webservice_account`
     WHERE `key` = "' . pSQL($ws_key) . '" AND `active` = 1'
);
if (!$account) {
    respond(false, 'Cle WebService invalide ou inactive.');
}

// ── 3. Validation des paramètres ───────────────────────────────────────
$id_product = isset($_REQUEST['id_product']) ? (int) $_REQUEST['id_product'] : 0;
$delta      = isset($_REQUEST['delta']) ? (int) $_REQUEST['delta'] : 0;

if ($id_product <= 0) {
    respond(false, 'Parametre id_product invalide.');
}
if ($delta === 0) {
    respond(false, 'Parametre delta doit etre un entier non nul.');
}

$product = new Product($id_product);
if (!Validate::isLoadedObject($product)) {
    respond(false, 'Produit introuvable : ' . $id_product);
}

// ── 4. Mise à jour du stock + journalisation du mouvement ──────────────
try {
    $id_shop = (int) Context::getContext()->shop->id;
    StockAvailable::updateQuantity(
        $id_product,
        0,        // id_product_attribute : 0 = produit sans déclinaison
        $delta,   // quantité signée (+ entrée / - sortie)
        $id_shop,
        true      // add_movement → insère la ligne dans ps_stock_mvt
    );
} catch (Exception $e) {
    respond(false, 'Echec mise a jour stock : ' . $e->getMessage());
}

$new_qty = (int) StockAvailable::getQuantityAvailableByProduct($id_product, 0);

respond(true, 'Stock mis a jour.',
    '<id_product>' . $id_product . '</id_product>'
    . '<delta>' . $delta . '</delta>'
    . '<quantity>' . $new_qty . '</quantity>'
);
