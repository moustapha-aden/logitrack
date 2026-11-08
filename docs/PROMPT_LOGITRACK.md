# CONTEXTE : PROJET LOGITRACK — CE QUI A ÉTÉ FAIT ET COMMENT

Tu reprends **LogiTrack**, un prototype de démonstration d'une plateforme de gestion du transport routier, du transit et de la logistique à Djibouti. Slogan : « Pilotez vos transports. Maîtrisez votre logistique. »

Ce prompt décrit ce qui a été construit, comment, et les décisions techniques prises. Lis-le en entier avant de modifier le code.

---

## 1. Point de départ

- Projet créé avec `npx create-next-app@latest logitrack` (options recommandées).
- Versions : **Next.js 16.4.5** (App Router, Turbopack), **React 19.3**, **TypeScript** strict, **Tailwind CSS 4**.
- `next.config.ts` généré avec `cacheComponents: true` et `partialPrefetching: true`. Ces options ont été **conservées**, et elles ont imposé des choix d'architecture (voir section 4).
- **Important** : cette version de Next.js diffère de celle que tu connais. La documentation embarquée est dans `node_modules/next/dist/docs/`. Consulte-la avant d'utiliser une API Next.js (le fichier `AGENTS.md` du projet le rappelle).

Dépendances ajoutées : `lucide-react` (icônes), `recharts` (graphiques), `leaflet`, `react-leaflet` et `@types/leaflet` (carte).

Contraintes du projet :
- prototype uniquement ;
- pas de backend, pas de base de données, pas d'authentification réelle ;
- données fictives ;
- tout fonctionne côté navigateur.

---

## 2. Architecture des fichiers

```
app/
  layout.tsx              police Inter, ToastProvider, métadonnées FR
  globals.css             thème Tailwind 4 (@theme), animations, styles Leaflet, règle anti-débordement des grilles
  page.tsx                page de présentation (hero plein écran, espaces, fonctionnalités, étapes)
  credits/page.tsx        crédits photos (lit public/images/credits.json)
  (auth)/login/           connexion simulée (choix du rôle)
  (admin)/                layout = AppShell variant "admin" + 12 pages
  (company)/entreprise/   layout = AppShell variant "company" + 9 pages
  (driver)/chauffeur/     application chauffeur mobile-first
components/
  ui/          button, badge, card (Card, CardHeader, StatCard), modal (Modal, Drawer, ConfirmDialog),
               form (Field, Input, Select, Textarea, Toggle), toast, media (SafeImage, DriverAvatar,
               CompanyLogo), misc (PageHeader, SearchInput, FilterSelect, Segmented, EmptyState,
               ProgressBar, InfoRow, LinkButton), dropdown (ActionMenu rendu en portail)
  tables/      data-table.tsx (tableau générique typé, pagination, colonnes masquables par breakpoint)
  forms/       use-form.ts + formulaires entreprise, transporteur, camion, chauffeur, mission, incident, affectation
  details/     detail-provider.tsx (panneau latéral global avec historique), entity-details.tsx,
               mission-details.tsx, parts.tsx
  layout/      app-shell.tsx (sidebar + header + providers), header.tsx (recherche globale, notifications,
               menu profil), nav.ts, logo.tsx
  dashboard/   dashboard-view.tsx (réutilisé pour l'admin et l'entreprise)
  modules/     companies, carriers, trucks, drivers, missions, loads, operations, incidents, reports,
               notifications, settings
  charts/      AreaTrend, BarsChart, LineTrend, Donut (Recharts)
  maps/        djibouti-map.tsx (Leaflet) + index.tsx (chargement dynamique ssr:false)
  operations/  timeline.tsx (OperationTimeline verticale, StepProgress horizontal)
  driver/      driver-app.tsx (application chauffeur complète)
  auth/        login-view.tsx
lib/
  data/seed.ts        jeu de données fictif complet
  data/geo.ts         lieux de Djibouti, itinéraires illustratifs, distances
  data/analytics.ts   séries quotidiennes et mensuelles pour les graphiques
  store/index.ts      store global + actions métier
  store/selectors.ts  ScopeContext, useData() (données filtrées par périmètre), lookups
  constants/          libellés et tons de tous les statuts, 8 étapes de suivi, DEMO_NOW
  utils/              cn, formatage FR (dates en Africa/Djibouti, DJF), statuts dérivés
types/index.ts        tous les modèles TypeScript (aucun `any`)
public/images/        21 photos + credits.json
```

---

## 3. Données et état

### Modèles (`types/index.ts`)

- Company
- Carrier (transporteur partenaire)
- Truck
- Driver
- Mission
- Load (chargement)
- Incident
- AppNotification
- ActivityItem
- MonthlyStat
- Settings
- Prefs (entreprise et chauffeur simulés)
- AppData

### Jeu de données (`lib/data/seed.ts`), entièrement fictif et cohérent

- **12 entreprises** :
  - 6 actives : transporteurs, transitaire, logisticien ;
  - 1 inactive ;
  - 5 clients chargeurs.
- **8 transporteurs partenaires.**
- **24 camions** : immatriculations `DJ-xxx-XX`, types plateau / citerne / porte-conteneur / frigorifique / semi-remorque.
- **22 chauffeurs.**
- **30 missions** réparties sur toutes les étapes :
  - 3 en retard ;
  - 1 sans affectation ;
  - la mission **MS-26-1062** du chauffeur Ahmed Ali Hassan est à l'étape « En attente de chargement », prête pour la démonstration.
- **1 chargement par mission**, dont le poids, le volume et le nombre de colis sont extraits de la description de la mission (tonnes, litres, conteneurs 20'/40', sacs, palettes…) et plafonnés à la capacité du camion.
- **12 incidents.**
- Notifications, activité récente, et 12 mois de statistiques consolidées.
- Montants en **DJF**.
- Lieux : Port de Djibouti, Doraleh, Damerjog, PK12, Arta, Ali Sabieh, Dikhil, Tadjourah, Galafi, Guelilé, Dire Dawa.
- Date de référence fixe : `DEMO_NOW = 2026-11-08T10:30+03:00`. Elle évite les écarts d'affichage entre le serveur et le navigateur (erreurs d'hydratation).
- L'historique des étapes de chaque mission est généré automatiquement (`buildHistory`) à partir de l'heure de départ et de la durée du trajet.

### Store (`lib/store/index.ts`)

- Store maison exposé via `useSyncExternalStore`, et non `useReducer` ou un `useEffect`. Raison : la règle ESLint `react-hooks` de Next 16 interdit les `setState` dans un effet.
- Persistance dans `localStorage` sous la clé `logitrack:data`. La clé est versionnée par `DATA_VERSION` : si la version change, le jeu initial est rechargé.
- Côté serveur, le store renvoie le jeu initial (`getServerSnapshot`) ; le navigateur récupère ensuite les données sauvegardées.
- Un objet `actions` regroupe toutes les mutations :
  - création, modification et suppression pour chaque entité ;
  - `assignMission` ;
  - `setMissionStep` : horodate l'étape, ajoute une activité et une notification ;
  - `reportIncident` : marque la mission en retard si besoin et notifie ;
  - `setIncidentStatus` : lève le retard quand plus aucun incident n'est ouvert ;
  - notifications, paramètres, préférences, `reset`.
- **Utilisateur courant** : `setActor()` est appelé par chaque espace (admin, « Exploitation XX » côté entreprise, nom du chauffeur dans l'application). L'activité et l'historique des étapes sont attribués à cet auteur via `actorOf()`.
- **Réconciliation automatique** après chaque modification : un camion ou un chauffeur engagé sur une mission active (étapes 2 à 5) passe « en mission », puis redevient « disponible » à la fin.
- Statuts **dérivés, jamais stockés** :
  - statut de mission (`missionStatus` : planifiée / en cours / en retard / terminée) ;
  - statut de chargement (`loadStatusFromStep`).

### Périmètre admin / entreprise (`lib/store/selectors.ts`)

- `ScopeContext` vaut `null` pour l'administration, ou l'identifiant de l'entreprise dans l'espace entreprise.
- `useData()` renvoie les données filtrées selon ce périmètre.
- **Les mêmes composants de module servent aux deux espaces** : il n'y a pas de code dupliqué entre l'admin et l'entreprise.

---

## 4. Décisions techniques importantes

1. **Fiches détaillées en panneau latéral, sans route dynamique.** Avec `cacheComponents`, une route `[id]` demande des `<Suspense>` partout (`usePathname` et `useParams` se suspendent dans les layouts). Le `DetailProvider` global ouvre donc n'importe quelle fiche via `open({kind, id})`. Il garde un historique avec un bouton « Retour », ce qui permet de passer d'une fiche à l'autre (mission → camion → chauffeur → entreprise). La recherche globale, les notifications et l'activité ouvrent aussi ces fiches.
2. **Formulaires** : chaque `XxxFormModal` ne monte son contenu que s'il est ouvert. L'état est donc réinitialisé à chaque ouverture. La validation passe par le petit hook `useForm`.
3. **Menus d'actions en portail** (`createPortal`) pour ne pas être coupés par les tableaux qui défilent.
4. **Carte Leaflet** :
   - chargée via `next/dynamic` avec `ssr: false`, dans un composant client ;
   - tuiles OpenStreetMap désaturées en CSS (CARTO exige désormais une clé API) ;
   - itinéraires construits à la main sur les corridors RN1 et RN5 ;
   - position fictive du camion calculée le long de l'itinéraire selon l'étape ;
   - encart « Itinéraires et positions illustratifs — aucune donnée GPS réelle » toujours visible.
5. **Graphiques Recharts sans animation** (`isAnimationActive={false}`), pour un rendu fiable à l'impression et sur les captures. La palette catégorielle bleu / vert / ambre a été vérifiée pour les daltoniens. Le gris est réservé au statut « planifiée ».
6. **`SafeImage`** : `next/image` avec un repli visuel si l'image ne charge pas. Elle n'ajoute pas `relative` quand on lui passe `absolute`, pour que les images de fond restent visibles.
7. **Responsive** : règle `.grid > * { min-width: 0 }` dans `globals.css`, et `min-w-0` sur `Card`. Sans elles, sur mobile, les éléments des grilles s'élargissaient pour suivre leur contenu (graphiques, carrousels, tableaux) et la page atteignait jusqu'à 1 806 px de large.
8. `turbopack.root: process.cwd()` dans `next.config.ts`, pour supprimer l'avertissement lié à un `package-lock.json` situé dans le dossier utilisateur.

---

## 5. Identité visuelle

- **Couleurs** (tokens dans `@theme`) :
  - navy `#101E35` ;
  - brand `#2563EB` ;
  - bleu clair `#EFF6FF` ;
  - fond `#F8FAFC` ;
  - vert `#0F9F83` ;
  - orange `#F59E0B` ;
  - rouge `#EF4444` ;
  - texte `#1E293B`.
- Police **Inter** via `next/font/google`.
- **Admin** : sidebar bleu nuit. **Entreprise** : sidebar blanche avec accent vert et sélecteur d'entreprise. Les deux espaces sont ainsi visuellement distincts.
- Composants : cartes arrondies (`rounded-2xl`), ombres légères (`shadow-card`, `shadow-pop`), badges de statut à pastille, animations courtes (fondu, glissement, zoom) qui respectent `prefers-reduced-motion`.
- Logo SVG maison (`components/layout/logo.tsx`).

---

## 6. Images

- **Source : Wikimedia Commons.** Unsplash et Pexels exigent une clé API. Un script Node a interrogé l'API Commons en filtrant les images paysage d'au moins 1 400 px sous CC0, domaine public, CC BY ou CC BY-SA, puis les a téléchargées en 1 600 px.
- **20 photos**. Depuis la revue de conception, la plupart des camions viennent du **corridor Djibouti–Addis-Abeba** (route Awash–Afdera, photographe Ji-Elle) : HOWO bâché, citernes HOWO et Iveco Trakker, conteneur sur plateau, Mercedes Axor et FAW avec conteneur. Les marques et modèles des camions du jeu de données correspondent à leur photo.
- Une photo remplacée change **toujours de nom de fichier** : le cache d'optimisation de Next.js (`.next/cache/images`) et celui des navigateurs se basent sur l'URL.
- Auteur, licence et lien source de chaque photo dans `public/images/credits.json`, affichés sur `/credits`.
- **Chauffeurs** : avatars à initiales colorées, choix volontaire pour ne pas associer de vrais visages à des identités fictives.
- **Logos d'entreprises** : monogrammes colorés.
- **Logos encore visibles** : quelques photos européennes conservées (porte-conteneur Volvo FM, frigorifique américain) portent des marquages tiers discrets.

---

## 7. Fonctionnalités par espace

### Administration (`/dashboard` … `/parametres`)

- **Vue d'ensemble** :
  - bandeau photo et 7 indicateurs ;
  - graphique « Opérations par période » (30 jours / 12 mois) et anneau des statuts ;
  - dernières missions, alertes importantes, aperçu de flotte avec photos, activité récente, incidents ouverts.
- **Entreprises** : vue tableau ou cartes, filtres par type et statut, création, modification, activation ou désactivation avec confirmation.
- **Transporteurs** : CRUD complet avec confirmation avant suppression.
- **Camions** : cartes avec photo ou tableau ; filtres par entreprise, statut et type ; recherche par immatriculation ; changement de statut ; choix de la photo selon le type.
- **Chauffeurs** : tableau ou cartes, filtres de disponibilité, affectation d'un camion.
- **Missions** :
  - onglets par statut, filtres par entreprise et par dates, export CSV ;
  - création avec chargement, distance et heure d'arrivée calculées automatiquement ;
  - affectation visuelle du camion et du chauffeur ;
  - passage à l'étape suivante (bloqué tant qu'il n'y a ni camion ni chauffeur).
- **Chargements** : statut dérivé de l'étape de la mission, indicateurs de tonnage, mention ADR.
- **Suivi des opérations** :
  - pipeline des 8 étapes (cliquable pour filtrer) ;
  - carte interactive ;
  - panneau de la mission sélectionnée : étape suivante, annulation de l'étape, déclaration d'incident ou de retard, timeline horodatée ;
  - tableau des opérations.
- **Incidents et retards** : indicateurs, filtres, déclaration (formulaire avec gravité), prise en charge, résolution, réouverture, suppression.
- **Rapports** : filtres 3 / 6 / 12 mois et par entreprise. Les graphiques mensuels viennent de l'historique consolidé fictif (le mois en cours est marqué « * »). Les tendances comparent les mois complets à la période précédente de même durée. Le tableau « Performance des entreprises » et « Incidents par type » sont calculés en temps réel depuis le store. Export CSV et impression.
- **Notifications** : filtres, lu / non lu, suppression ; le clic ouvre la fiche liée.
- **Paramètres** : profil, alertes, seuil de retard, tableaux compacts, réinitialisation de la démo.

### Espace entreprise (`/entreprise/...`)

- Mêmes modules, filtrés sur l'entreprise choisie dans la sidebar.
- Page « Chauffeurs et transporteurs » à onglets.
- Historique des missions terminées, avec export.
- Statistiques propres à l'entreprise.

### Application chauffeur (`/chauffeur`)

- Mobile-first. Sur ordinateur, elle s'affiche dans un cadre de téléphone avec un panneau explicatif.
- **Accueil** : photo et nom du chauffeur, carte de la mission en cours avec progression et bouton d'action, boutons rapides (retard, incident, appel), camion avec photo, statistiques.
- **Détail de mission** : mini-carte, itinéraire, camion, client, chargement, timeline. Barre d'action fixe en bas, selon l'étape :
  1. Accepter
  2. Démarrer
  3. Chargement terminé
  4. Démarrer le transport
  5. Arrivé
  6. Confirmer la livraison (avec confirmation)
- **Déclarations** en feuille mobile : retard (motif et durée) ou incident (type, gravité, description, lieu).
- **Onglets** : Missions, Historique, Profil. Le profil permet de changer de chauffeur simulé et de réinitialiser la démo.

### Pages communes

- **Présentation** (`/`) : hero plein écran avec photo du port.
- **Connexion** (`/login`) : choix du rôle, puis de l'entreprise ou du chauffeur simulé.
- **Crédits** (`/credits`).

---

## 8. Vérifications effectuées

- `npx tsc --noEmit` : aucune erreur.
- `npx eslint .` : aucune erreur. Les erreurs `react-hooks/refs` ont été corrigées en déstructurant le hook `usePopover`.
- `npm run build` : les 28 routes sont générées en statique.
- Captures d'écran Chrome headless des pages principales sur ordinateur et mobile, puis corrections : images de fond invisibles, tuiles CARTO bloquées, retours à la ligne dans les tableaux, encart de la carte masqué par le zoom.
- Tests de bout en bout via le Chrome DevTools Protocol (script Node avec WebSocket natif) :
  - parcours chauffeur complet avec persistance ;
  - signalement d'un retard ;
  - recherche, ouverture et clôture d'une mission côté admin ;
  - navigation d'une fiche à l'autre ;
  - création d'une mission ;
  - recherche globale ;
  - **aucune erreur console** sur les 23 pages.
- Audit responsive mesuré sur 390 px (émulation mobile) : `scrollWidth === innerWidth` sur les 23 pages après correction.

---

## 9. Pour continuer

- Lancer : `npm run dev`, puis http://localhost:3000.
- Démonstration conseillée : voir le README (5 étapes).
- Réinitialiser les données : Paramètres → « Réinitialiser la démonstration », ou vider `localStorage`.
- Si tu modifies la structure des données ou le jeu initial, incrémente `DATA_VERSION` dans `seed.ts` (actuellement **5**).
- Pour une vraie version : remplacer le store par une API et une base de données, ajouter l'authentification et les rôles, un fournisseur de cartes avec GPS réel, et des photos sans marques visibles.
- Respecter les conventions : composants typés sans `any`, textes en français, montants en DJF, dates en fuseau Africa/Djibouti, réutilisation des composants `ui/` et du `DataTable`.
