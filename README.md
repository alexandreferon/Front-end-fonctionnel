# BookEasy

Plateforme de réservation de salles et d’équipements pour les campus ECE (Eiffel, Lyon).
Projet de conception d’application web, Software Architecture, ECE, année universitaire 2026–2027.

**Équipe** : Anouar LECHHAB, Brahim MARSANI, Prénom NOM
**Encadrant** : M. CAMARA Omar

Ce dépôt contient le **front-end** de l’application, développé à partir du rapport de conception (spécifications, diagrammes UML) et des maquettes Figma. Il n’y a pas de backend : les données sont simulées (fichiers JSON et `localStorage`).

---

## Lancer le projet

Les pages lisent les fichiers `data/*.json` avec `fetch`. Il faut donc un petit serveur local : **ouvrir un fichier HTML en double-cliquant ne fonctionne pas** (le navigateur bloque la lecture des JSON).

**Option 1 : Live Server (VS Code)**
1. Installer l’extension « Live Server ».
2. Clic droit sur `login.html`, puis « Open with Live Server ».

**Option 2 : Python**
```bash
python -m http.server 8000
```
Puis ouvrir `http://localhost:8000/login.html`.

Aucune installation de dépendances : Bootstrap, Bootstrap Icons, qrcode.js et Chart.js sont chargés par CDN (connexion internet requise).

---

## Comptes de démonstration

Mot de passe de tous les comptes : `ece2026`

| Rôle | E-mail | Accès |
|---|---|---|
| Étudiant | louise.martin@ece.fr | Salles, équipements, mes réservations |
| Enseignant | marc.lefebvre@ece.fr | Idem, créneaux jusqu’à 4 h |
| Gestionnaire | sofia.benali@ece.fr | + Dashboard Gestion |
| Administrateur | claire.dupont@ece.fr | Accès à tout (+ réglages dans le Dashboard Admin) |
| Invité | (sans connexion) | Consultation des salles et équipements, sans réservation |

---

## Pages

| Page | Fichier | Exigences |
|---|---|---|
| Connexion | `login.html` | EF-1 |
| Réserver une salle (filtres, carte, parcours date et créneau) | `reserver-salle.html` | EF-2, EF-3, EF-6 |
| Trouver un équipement | `equipements.html` | EF-4 |
| Mes réservations (+ modale Check-in QR) | `mes-reservations.html` | EF-5, EF-7 |
| Profil, paramètres et notifications | `profil.html` | EF-1, EF-8 |
| Dashboard Gestion / Admin (+ modale Bloquer une salle) | `admin-dashboard.html` | EF-9, EF-10 |

La réservation confirmée est affichée sur `mes-reservations.html?confirme=ID` (bandeau de confirmation).

---

## Structure du dépôt

```
bookeasy/
├── login.html
├── reserver-salle.html
├── equipements.html
├── mes-reservations.html
├── profil.html
├── admin-dashboard.html
├── css/
│   └── theme.css          Styles partagés (classes préfixées be-)
├── js/
│   ├── auth.js            Session simulée, connexion, rôles
│   ├── navbar.js          Navbar et footer partagés selon le rôle
│   └── rules.js           Règles métier, réservations, check-in
├── data/                  Données simulées
│   ├── users.json
│   ├── rooms.json
│   ├── equipements.json
│   ├── reservations.json
│   ├── notifications.json
│   └── settings.json
└── assets/
    ├── salle-*.jpg        Photos des salles (chemins dans rooms.json)
    └── equipements/       Photos des équipements
```

### Ordre des scripts dans chaque page
```html
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="js/auth.js"></script>
<script src="js/navbar.js"></script>
<script src="js/rules.js"></script>
```
Chaque page contient `<div id="navbar"></div>` en haut du `<body>` et `<div id="footer"></div>` en bas.

---

## Fonctionnement

### Authentification et rôles (`js/auth.js`)
Rôles : `invite`, `etudiant`, `enseignant`, `gestionnaire`, `admin`. La session est stockée dans `localStorage.session`.
Fonctions : `connecter(email, mdp)`, `deconnecter()`, `utilisateurCourant()`, `estConnecte()`, `exigerRole([...])`.

### Règles métier (`js/rules.js`, EF-6)
Contrôlées avant toute réservation, avec un message indiquant la règle en cause. Valeurs par défaut dans `data/settings.json` :

| Règle | Valeur par défaut |
|---|---|
| Quota hebdomadaire | 6 h par semaine et par utilisateur |
| Durée maximale d’un créneau | 2 h (4 h pour un enseignant) |
| Plages d’ouverture | 8h à 20h |
| Anticipation maximale | 7 jours |
| Chevauchement | interdit pour un même utilisateur |
| Unicité du créneau | une seule réservation active par salle ou équipement |
| Sanction | 3 absences sur 30 jours : suspension de 7 jours |

### Statuts d’une réservation
`active`, `confirmee` (check-in effectué), `terminee`, `annulee`, `liberee` (absence).

### Check-in (EF-7)
La fenêtre s’ouvre 10 minutes avant le début du créneau. Sans check-in 15 minutes après le début, la réservation passe à `liberee`.

### Données et stockage
Les modifications sont enregistrées dans le navigateur :

| Clé `localStorage` | Contenu |
|---|---|
| `session` | Utilisateur connecté |
| `bookings` | Réservations (copie modifiable de `reservations.json`) |
| `settings` | Règles métier modifiées par l’admin |
| `blocages` | Salles bloquées par un gestionnaire |

Pour revenir aux données d’origine : exécuter `reinitialiserDonnees()` dans la console du navigateur (touche F12).

### Mode démonstration
Dans `js/rules.js` :
- `MODE_DEMO = true` : le check-in est toujours ouvert, pour pouvoir le montrer. Mettre `false` pour le vrai comportement.
- `DATE_DEMO = "2026-11-15"` : date du jour simulée, pour que les données de démo restent « à venir ». Mettre `null` pour utiliser la vraie date.

---

## Choix technologiques

| Outil | Rôle | Justification |
|---|---|---|
| HTML, CSS, JavaScript | Pages et logique | Aucun build, aucun framework à apprendre, lancement immédiat |
| Bootstrap 5.3.3 | Grille, composants, responsive | Déjà maîtrisé par l’équipe, rapide à personnaliser avec `theme.css` |
| Bootstrap Icons | Icônes | Cohérent avec Bootstrap |
| qrcode.js | QR Code de check-in | Une seule bibliothèque, sans dépendance |
| Chart.js | Statistiques du dashboard | Graphiques simples à intégrer |
| JSON et `localStorage` | Données simulées | Pas de backend demandé pour ce rendu |

Les couleurs, typographies et espacements sont définis une seule fois dans `css/theme.css` (bloc `:root`) à partir des maquettes Figma.

---

## Organisation de l’équipe

| Membre | Parties développées |
|---|---|
| Membre 1 | Connexion, réserver une salle, parcours date et créneau, carte du campus |
| Membre 2 | Équipements, mes réservations, check-in QR, règles métier |
| Membre 3 | Profil et notifications, dashboard gestionnaire et admin, responsive, rapport |

**Git** : une branche par membre, fusion sur `main` après relecture.
Messages de commit : `feat:` (nouvelle fonction), `fix:` (correction), `style:` (CSS), `docs:` (README, rapport).

---

## Limites connues

- **Pas de vraie sécurité** : les comptes et mots de passe sont dans le code, et la session est modifiable depuis le navigateur. Suffisant pour une démonstration front-end.
- Aucun e-mail n’est envoyé : les notifications sont simulées dans l’application.
- Les données sont propres à chaque navigateur (`localStorage`).
- Application web responsive uniquement, pas d’application mobile native (hors périmètre du cahier des charges).
