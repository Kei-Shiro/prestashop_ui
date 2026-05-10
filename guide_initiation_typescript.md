# 📘 Guide d'Initiation et des Bonnes Pratiques TypeScript

Bienvenue dans ce guide d'initiation à TypeScript ! En tant que développeur, passer de JavaScript à TypeScript est l'un des meilleurs investissements que vous puissiez faire pour la qualité et la maintenabilité de votre code. 

Ce document a été conçu pour vous accompagner pas à pas dans cette transition, avec bienveillance et professionnalisme.

---

## 1. Introduction à TypeScript

**Qu'est-ce que TypeScript ?**
TypeScript (TS) est un sur-ensemble typé de JavaScript développé par Microsoft. Cela signifie que tout code JavaScript valide est un code TypeScript valide, mais TS y ajoute le **typage statique**.

**Pourquoi l'utiliser (Avantages) ?**
* **Détection d'erreurs en amont** : Les erreurs sont détectées lors de la compilation, avant même l'exécution du code.
* **Autocomplétion et documentation embarquée** : Votre éditeur (VS Code, etc.) comprendra vos objets et vous proposera des suggestions pertinentes.
* **Refactoring sécurisé** : Modifier le nom d'une propriété ou la signature d'une fonction se fait en toute confiance, le compilateur vous indiquant où les changements ont cassé le code.
* **Code plus lisible** : Les types agissent comme une documentation vivante.

---

## 2. Initialiser un Projet TypeScript

Voici comment démarrer un nouveau projet de zéro.

**Étape 1 : Initialiser le projet Node.js**
Ouvrez votre terminal et tapez :
```bash
npm init -y
```

**Étape 2 : Installer TypeScript**
Il est recommandé d'installer TypeScript en tant que dépendance de développement :
```bash
npm install -D typescript
```

**Étape 3 : Créer le fichier de configuration**
Générez le fichier `tsconfig.json` avec la commande :
```bash
npx tsc --init
```

**Configuration de base (`tsconfig.json`)**
Dans le fichier généré, assurez-vous d'avoir (au minimum) ces options activées pour adopter les standards de l'industrie :
```json
{
  "compilerOptions": {
    "target": "ES2022",         /* Version de JS générée */
    "module": "CommonJS",       /* Ou 'ESNext' selon votre environnement */
    "outDir": "./dist",         /* Dossier où seront compilés les fichiers JS */
    "rootDir": "./src",         /* Dossier source de vos fichiers TS */
    "strict": true,             /* Active TOUTES les vérifications strictes (Crucial !) */
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

---

## 3. Les Types de Base

TypeScript vous permet d'annoter vos variables.

```typescript
// Primitives
let prenom: string = "Alice";
let age: number = 28;
let estDeveloppeur: boolean = true;

// Tableaux (Arrays)
let competences: string[] = ["React", "TypeScript", "Node.js"];
// Ou avec la syntaxe générique :
let notes: Array<number> = [15, 18, 14];

// Tuples (Tableaux à taille et types fixes)
let utilisateur: [number, string] = [1, "alice@email.com"];

// Enum (Énumérations)
enum Role {
  Admin = "ADMIN",
  User = "USER",
  Guest = "GUEST"
}
let monRole: Role = Role.Admin;
```

*Astuce de pro : TypeScript est intelligent. On appelle cela "l'inférence de type". Si vous écrivez `let ville = "Paris";`, TS comprend immédiatement que `ville` est une string. Il n'est pas nécessaire de tout annoter !*

---

## 4. Interfaces et Types

Pour définir la forme de vos objets, vous avez deux outils principaux : `type` et `interface`.

**Utiliser `interface`** (Privilégié pour les objets et l'orienté objet)
```typescript
interface Utilisateur {
  id: number;
  nom: string;
  email: string;
  age?: number; // Le '?' signifie que cette propriété est optionnelle
}

const alice: Utilisateur = {
  id: 1,
  nom: "Alice",
  email: "alice@example.com"
};
```

**Utiliser `type`** (Privilégié pour les unions, intersections, et types primitifs)
```typescript
type ID = string | number; // Union type : peut être l'un OU l'autre
type Status = "En attente" | "En cours" | "Terminé"; // Literal types

let monId: ID = 42; // Valide
monId = "abc-123"; // Valide également
```

*Quelle est la différence ?* 
Les interfaces peuvent être "rouvertes" (fusionnées) et sont légèrement plus performantes lors de la compilation pour les très gros projets. Préférez `interface` pour déclarer des objets, et `type` pour des alias complexes ou des unions.

---

## 5. Le Typage des Fonctions

Définir les types des paramètres entrants et le type de retour d'une fonction.

```typescript
// Fonction classique
function additionner(a: number, b: number): number {
  return a + b;
}

// Fonction fléchée
const saluer = (nom: string, titre: string = "M/Mme"): void => {
  console.log(`Bonjour ${titre} ${nom}`);
  // 'void' signifie que la fonction ne retourne rien.
};

// Fonction asynchrone (retourne une Promise)
async function fetchUtilisateur(id: number): Promise<Utilisateur> {
  const reponse = await fetch(`/api/users/${id}`);
  return await reponse.json();
}
```

---

## 6. Introduction aux Génériques (Generics)

Les génériques permettent de créer des composants réutilisables qui fonctionnent avec n'importe quel type, tout en conservant la sécurité du typage. Pensez-y comme à des "variables pour les types".

```typescript
// Le 'T' représente le type qui sera passé lors de l'appel
function premierElement<T>(tableau: T[]): T | undefined {
  return tableau[0];
}

const premierNombre = premierElement<number>([1, 2, 3]); // Type retourné : number | undefined
const premiereChaine = premierElement<string>(["A", "B", "C"]); // Type retourné : string | undefined
```

---

## 7. Les Bonnes Pratiques Essentielles

Pour écrire un code TypeScript "Premium" et professionnel, gardez ces règles en tête :

1. **Activez toujours `"strict": true`** dans votre `tsconfig.json`. C'est le filet de sécurité par excellence.
2. **Bannissez le type `any`**. 
   * `any` désactive TypeScript pour cette variable, ce qui annule tout l'intérêt du langage. 
   * Si vous ne connaissez vraiment pas le type à l'avance, utilisez `unknown` à la place, qui vous forcera à vérifier le type avant de l'utiliser.
3. **Profitez de l'inférence de type**. Ne soyez pas redondant.
   * ❌ Mauvais : `let prenom: string = "Bob";`
   * ✅ Bon : `let prenom = "Bob";`
4. **Utilisez l'utilitaire `Readonly`**. Pour protéger vos données de mutations accidentelles :
   ```typescript
   interface Configuration {
     readonly cleApi: string;
   }
   // obj.cleApi = "nouvelle_cle" -> Provoquera une erreur TypeScript !
   ```
5. **Préférez `unknown` à `any` lors du parsing d'API externes**, puis validez les données (avec des bibliothèques comme Zod) avant de les caster dans vos interfaces.

---
*Fin du document. Bon code, et bienvenue dans le monde merveilleux du typage fort !*
