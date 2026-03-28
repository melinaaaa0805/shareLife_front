# ShareLife — Frontend

Application mobile construite avec **React Native** et **Expo**. Elle communique avec l'API ShareLife pour gérer les tâches partagées, les listes de courses et les groupes.

---

## Sommaire

- [Stack technique](#stack-technique)
- [Lancer le projet](#lancer-le-projet)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Écrans](#écrans)
- [Navigation](#navigation)
- [State management](#state-management)
- [API client](#api-client)
- [Thème & design](#thème--design)

---

## Stack technique

| Outil | Version | Rôle |
|-------|---------|------|
| React Native | 0.81.5 | Framework mobile |
| Expo | ~54 | Toolchain & build |
| TypeScript | ~5.9 | Typage statique |
| React Navigation | 7 | Navigation (stack + tabs) |
| Axios | 1.13 | Client HTTP |
| Expo Secure Store | 15 | Stockage sécurisé du JWT |
| AsyncStorage | 2.2 | Stockage clé-valeur persistant |
| Lottie React Native | 7.3 | Animations Lottie |
| Expo Vector Icons | — | Ionicons et autres icônes |

---

## Lancer le projet

```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer le serveur de développement Expo
npx expo start
```

- Scannez le QR code avec **Expo Go** (iOS ou Android)
- Appuyez sur `a` pour lancer sur un émulateur Android
- Appuyez sur `i` pour lancer sur un simulateur iOS (macOS uniquement)

> Assurez-vous que le backend tourne et que `baseURL` dans `api/api.ts` pointe vers l'adresse IP locale de votre machine (et non `localhost`, qui pointe vers le téléphone lui-même).

---

## Configuration

### URL de l'API

Modifiez `api/api.ts` pour pointer vers votre backend :

```typescript
// api/api.ts
const api = axios.create({
  baseURL: 'http://192.168.1.XX:3000', // votre IP locale
});
```

Pour trouver votre IP locale :
- **Windows** : `ipconfig` → adresse IPv4
- **macOS/Linux** : `ifconfig` ou `ip a`

---

## Architecture

```
ShareLifeApp/
├── api/
│   └── api.ts                  # Instance Axios + intercepteurs JWT
│
├── assets/
│   ├── fonts/                  # Police Inter (Regular, Medium, SemiBold, Bold)
│   ├── lottie/                 # Animations Lottie (login, register, success…)
│   └── style/
│       └── theme.ts            # Couleurs, typographie, espacements, rayons
│
├── components/
│   ├── MemberItem.tsx          # Avatar animé + badge admin
│   ├── TextInputField.tsx      # Champ texte générique
│   ├── SelectField.tsx         # Sélecteur (react-native-picker-select)
│   └── WeightSelector.tsx      # Sélecteur de charge mentale (emojis)
│
├── context/
│   ├── AuthContext.tsx         # Authentification + profil utilisateur
│   └── GroupContext.tsx        # Groupe courant sélectionné
│
├── navigation/
│   └── AppNavigator.tsx        # Stack + Tabs + gestion auth
│
├── screens/                    # Voir section Écrans
│
└── types/
    └── types.ts                # Types TypeScript partagés (User, Group, Task…)
```

---

## Écrans

### Authentification

| Écran | Fichier | Description |
|-------|---------|-------------|
| **Accueil** | `HomeScreen.tsx` | Page d'entrée de l'application |
| **Connexion** | `LoginScreen.tsx` | E-mail + mot de passe, lien mot de passe oublié, animation shake sur erreur |
| **Inscription** | `RegisterScreen.tsx` | Indicateur de force du mot de passe, confirmation, consentements RGPD, modal politique de confidentialité |
| **Mot de passe oublié** | `ForgotPasswordScreen.tsx` | Étape 1 : saisie e-mail → Étape 2 : code 6 chiffres + nouveau mot de passe |

### Groupes

| Écran | Fichier | Description |
|-------|---------|-------------|
| **Mes groupes** | `GroupsScreen.tsx` | Liste des groupes, profil utilisateur, bottom sheet édition du profil (avatar, e-mail, mot de passe) |
| **Détail du groupe** | `GroupDetailScreen.tsx` | Infos, mode (Libre/Drôle), admin de la semaine, bouton roue |
| **Créer un groupe** | `CreateGroupScreen.tsx` | Formulaire animé avec succès inline |
| **Membres** | `GroupMemberScreen.tsx` | Liste des membres avec avatars colorés |
| **Ajouter un membre** | `AddMemberScreen.tsx` | Recherche par e-mail, animation succès |
| **Roue** | `SpinWheelScreen.tsx` | Roue tournante animée pour tirer au sort l'admin |

### Tâches

| Écran | Fichier | Description |
|-------|---------|-------------|
| **Calendrier** | `CalendarScreen.tsx` | Vue semaine (grille 2 colonnes), navigation semaine, barre de progression, FAB |
| **Tâches du jour** | `DayTasksScreen.tsx` | Liste des tâches d'un jour, assignation, marquage terminé, stats |
| **Créer une tâche** | `AddTaskScreen.tsx` | 4 sections animées : infos, planification (pills jours + fréquence), durée, charge mentale |
| **Mes tâches** | `TasksScreens.tsx` | Tâches assignées à l'utilisateur courant |
| **Tâches non assignées** | `UnassignedScreen.tsx` | Tâches sans assignation |
| **Importer une tâche** | `ImportTaskScreen.tsx` | Réutiliser une tâche modèle |

### Dashboard & Courses

| Écran | Fichier | Description |
|-------|---------|-------------|
| **Dashboard** | `GroupDashboardScreen.tsx` | Statistiques animées, leaderboard membres, actions rapides |
| **Liste de courses** | `ShoppingListScreen.tsx` | Liste par semaine, ajout rapide, cochage, sync automatique |
| **Paramètres** | `SettingsScreen.tsx` | Paramètres de l'application |

---

## Navigation

```
AppNavigator (Stack)
│
├── [Non connecté]
│   ├── Home
│   ├── Login
│   └── Register
│
├── [Connecté]
│   ├── Home
│   ├── Groups (Accueil, headerShown: false)
│   ├── MainTabs (Tab Navigator)
│   │   ├── Calendar  ──── tab "Calendrier"
│   │   ├── Dashboard ──── tab "Dashboard"
│   │   └── ShoppingList ─ tab "Courses"
│   ├── GroupDetail
│   ├── CreateGroup
│   ├── TasksScreen
│   ├── UnassignedTasks
│   ├── AddMember
│   ├── GroupMembers
│   ├── DayTasks
│   ├── AddTask
│   ├── ImportTask
│   ├── Settings
│   └── SpinWheel
│
└── [Toujours disponible]
    └── ForgotPassword
```

Le navigator conditionne l'affichage des stacks selon `isAuthenticated` (depuis `AuthContext`). La redirection se fait automatiquement lors de la connexion ou déconnexion.

---

## State management

### AuthContext (`context/AuthContext.tsx`)

Gère l'état d'authentification global de l'application.

```typescript
// Données disponibles
const { user, isAuthenticated, loading, login, register, logout, updateUser } = useAuth();

// Types
type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  role: 'ADMIN' | 'MEMBER';
  avatarColor?: string;
};

// Méthodes
login(email, password)          // → stocke le JWT dans Expo Secure Store
register(email, password, firstName)
logout()                        // → supprime le JWT
updateUser(payload)             // → PATCH /users/me + mise à jour du contexte
```

Le JWT est stocké dans **Expo Secure Store** (chiffré nativement). L'e-mail est mis en cache dans **AsyncStorage** pour pré-remplir le champ à la reconnexion.

### GroupContext (`context/GroupContext.tsx`)

Stocke le groupe actuellement sélectionné, utilisé par les écrans Calendar, Dashboard et ShoppingList.

```typescript
const { currentGroup, setCurrentGroup } = useGroup();
```

---

## API client

```typescript
// api/api.ts
const api = axios.create({ baseURL: 'http://...' });

// Intercepteur request : ajoute automatiquement le JWT
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Intercepteur response : déconnexion automatique sur 401
api.interceptors.response.use(null, (error) => {
  if (error.response?.status === 401) {
    // logout + alert
  }
  return Promise.reject(error);
});
```

---

## Thème & design

Le thème est centralisé dans `assets/style/theme.ts`.

### Couleurs

```typescript
colors: {
  // Brand
  purple:     '#9B7BEA',   // couleur principale
  pink:       '#EAB1CF',
  yellow:     '#FFE27A',
  mint:       '#A6D8C0',

  // UI
  background: '#0E0E0E',
  surface:    '#1A1A1A',
  card:       '#1F1F1F',

  textPrimary:   '#F5F5F5',
  textSecondary: '#B5B5B5',
  border:        '#2A2A2A',

  // États
  success: '#A6D8C0',
  warning: '#FFE27A',
  danger:  '#EAB1CF',
  disabled:'#555555',
}
```

### Typographie

Police **Inter** (Regular, Medium, SemiBold, Bold), chargée via Expo Font.

```typescript
size: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, xxl: 32 }
```

### Espacements & rayons

```typescript
spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 }
radius:  { sm: 8, md: 16, lg: 24, xl: 32, round: 999 }
```

### Animations

Toutes les animations utilisent l'**API Animated de React Native** (`useNativeDriver: true` autant que possible). Aucune dépendance externe (pas de Reanimated).

Patterns courants :
- **Stagger slide-up** : entrée en cascade des cartes/sections
- **Spring press** : feedback tactile sur les boutons
- **Shake** : erreur de validation sur un formulaire
- **Fade + slide** : transition entre étapes
- **Compteur animé** : chiffres qui montent depuis 0 (dashboard)
