# LogiTrack — Pilotez vos transports. Maîtrisez votre logistique.

Prototype de démonstration d'une plateforme de gestion du transport routier, du transit et de la logistique à Djibouti.
**Toutes les données sont fictives.** Pas de backend, pas d'authentification réelle : l'état est géré côté client et conservé dans le `localStorage` du navigateur.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de production
```

## Espaces et routes

| Espace | Routes |
| --- | --- |
| Présentation / connexion | `/`, `/login`, `/credits` |
| Administration | `/dashboard`, `/entreprises`, `/transporteurs`, `/camions`, `/chauffeurs`, `/missions`, `/chargements`, `/operations`, `/incidents`, `/rapports`, `/notifications`, `/parametres` |
| Entreprise | `/entreprise`, `/entreprise/camions`, `/entreprise/chauffeurs`, `/entreprise/missions`, `/entreprise/chargements`, `/entreprise/suivi`, `/entreprise/incidents`, `/entreprise/historique`, `/entreprise/statistiques` |
| Chauffeur (mobile-first) | `/chauffeur` |

L'entreprise simulée se choisit dans la barre latérale de l'espace entreprise ; le chauffeur simulé dans l'onglet « Profil » de l'application chauffeur.

## Parcours de démonstration conseillé

1. `/chauffeur` (chauffeur Ahmed Ali Hassan) : ouvrir la mission MS-26-1062, puis Démarrer → Chargement terminé → Transport → Arrivée → Confirmer la livraison.
2. `/operations` : la mission apparaît livrée ; la clôturer depuis le panneau de suivi.
3. `/missions` : créer une mission, puis affecter un camion et un chauffeur.
4. `/incidents` : traiter l'incident critique (groupe froid) et le passer à « Résolu ».
5. Paramètres → « Réinitialiser la démonstration » pour revenir aux données initiales.

## Architecture

```
app/            routes (groupes (admin), (company), (driver), (auth))
components/
  layout/       shell, sidebar, header (recherche globale, notifications, profil)
  ui/           boutons, badges, cartes, modales, formulaires, toasts, images avec fallback
  tables/       tableau générique paginé
  forms/        formulaires de création / modification
  details/      fiches détaillées (panneau latéral avec navigation croisée)
  dashboard/ charts/ maps/ operations/ modules/ driver/ auth/
lib/
  data/         jeu de données (seed), géographie, séries analytiques
  store/        store local (useSyncExternalStore + localStorage) et sélecteurs par périmètre
  constants/ utils/
types/          modèles TypeScript
public/images/  photos libres de droits + credits.json
```

Stack : Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Lucide React, Recharts, React Leaflet (tuiles OpenStreetMap).

## Images

Photographies issues de Wikimedia Commons (CC0, domaine public, CC BY, CC BY-SA). Auteurs et licences : page `/credits` et fichier `public/images/credits.json`. Les avatars des chauffeurs sont volontairement des monogrammes pour ne pas associer de vrais visages à des identités fictives.

La carte affiche des **itinéraires et positions illustratifs** ; aucune donnée GPS réelle n'est utilisée.
