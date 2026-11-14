/* ==========================================================
   BookEasy : auth.js (session simulée + rôles)
   À charger AVANT navbar.js et avant les scripts de la page :
     <script src="js/auth.js"></script>
   Session stockée dans localStorage.session (même format que navbar.js) :
     { id, nom, email, role }
   Rôles : invite | etudiant | enseignant | gestionnaire | admin
   ========================================================== */

// Comptes de démo (mêmes que data/users.json). Mot de passe : ece2026
const COMPTES = [
  { id: 1, nom: "Louise Martin", email: "louise.martin@ece.fr", motDePasse: "ece2026", role: "etudiant" },
  { id: 2, nom: "Marc Lefebvre", email: "marc.lefebvre@ece.fr", motDePasse: "ece2026", role: "enseignant" },
  { id: 3, nom: "Sofia Benali",  email: "sofia.benali@ece.fr",  motDePasse: "ece2026", role: "gestionnaire" },
  { id: 4, nom: "Claire Dupont", email: "claire.dupont@ece.fr", motDePasse: "ece2026", role: "admin" }
];

const INVITE = { id: 0, nom: "Invité", email: "", role: "invite" };

/** Utilisateur connecté, ou un invité */
function utilisateurCourant() {
  try { return JSON.parse(localStorage.getItem("session")) || INVITE; }
  catch (e) { return INVITE; }
}

function estConnecte() {
  return utilisateurCourant().role !== "invite";
}

/** Retourne true si l'e-mail et le mot de passe sont corrects (et ouvre la session) */
function connecter(email, motDePasse) {
  const compte = COMPTES.find(c =>
    c.email.toLowerCase() === String(email).trim().toLowerCase() && c.motDePasse === motDePasse);
  if (!compte) return false;
  const { motDePasse: _ignore, ...session } = compte;   // on ne stocke pas le mot de passe
  localStorage.setItem("session", JSON.stringify(session));
  return true;
}

function deconnecter() {
  localStorage.removeItem("session");
  location.href = "login.html";
}

/** À mettre en haut d'une page protégée : exigerRole(["gestionnaire", "admin"]) */
function exigerRole(rolesAutorises) {
  if (!rolesAutorises.includes(utilisateurCourant().role)) {
    location.href = "login.html";
  }
}
