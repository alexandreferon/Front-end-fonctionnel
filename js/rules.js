/* ==========================================================
   BookEasy : rules.js (réservations, règles EF-6, check-in EF-7)
   Charger après auth.js :  <script src="js/rules.js"></script>
   Les pages doivent tourner sur un serveur (Live Server) pour lire data/*.json.
   ========================================================== */

const MODE_DEMO = true;            // true : le check-in est toujours ouvert (démo)
const DATE_DEMO = "2026-11-15";    // « aujourd'hui » simulé ; mettre null pour la vraie date

const LIBELLES_STATUT = { active: "Active", confirmee: "Confirmée", terminee: "Terminée", annulee: "Annulée", liberee: "Libérée" };

/* ---------- Données ---------- */
async function chargerJSON(nom) {
  const r = await fetch(`data/${nom}.json`);
  if (!r.ok) throw new Error(`data/${nom}.json introuvable`);
  return r.json();
}
async function chargerReservations() {
  const sauve = localStorage.getItem("bookings");
  if (sauve) return JSON.parse(sauve);
  const donnees = await chargerJSON("reservations");
  sauverReservations(donnees);
  return donnees;
}
function sauverReservations(liste) { localStorage.setItem("bookings", JSON.stringify(liste)); }
function reinitialiserDonnees() { localStorage.removeItem("bookings"); localStorage.removeItem("settings"); location.reload(); }
async function chargerReglages() {
  const s = localStorage.getItem("settings");
  return s ? JSON.parse(s) : chargerJSON("settings");
}

/* ---------- Dates ---------- */
const aujourdhui = () => DATE_DEMO || new Date().toISOString().slice(0, 10);
const enMinutes = h => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };
const numJour = d => { const [y, m, j] = d.split("-").map(Number); return Date.UTC(y, m - 1, j) / 864e5; };
const debutSemaine = d => { const n = numJour(d); return n - ((n + 3) % 7); };   // lundi
const chevauche = (a, b) => enMinutes(a.debut) < enMinutes(b.fin) && enMinutes(b.debut) < enMinutes(a.fin);
const estActive = r => r.statut === "active" || r.statut === "confirmee";

function formatDate(d) {
  const t = new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return t.charAt(0).toUpperCase() + t.slice(1);
}
function formatDuree(r) {
  const m = enMinutes(r.fin) - enMinutes(r.debut), h = Math.floor(m / 60), reste = m % 60;
  return reste ? `${h} h ${String(reste).padStart(2, "0")}` : `${h} heure${h > 1 ? "s" : ""}`;
}

/* ---------- EF-6 : les 7 règles métier ----------
   demande = { ressourceType, ressourceId, date, debut, fin }
   Retourne null si OK, sinon { regle, message } (la règle en cause). */
function verifierRegles(d, toutes, cfg, user) {
  const non = (regle, message) => ({ regle, message });
  const duree = (enMinutes(d.fin) - enMinutes(d.debut)) / 60;
  const miennes = toutes.filter(r => r.userId === user.id && estActive(r));

  if (duree <= 0) return non("horaires", "L’heure de fin doit être après l’heure de début.");

  if (enMinutes(d.debut) < enMinutes(cfg.ouverture.debut) || enMinutes(d.fin) > enMinutes(cfg.ouverture.fin))
    return non("ouverture", `Le campus est ouvert de ${cfg.ouverture.debut} à ${cfg.ouverture.fin}.`);

  const dureeMax = cfg.dureeMaxHeures[user.role] ?? cfg.dureeMaxHeures.etudiant;
  if (duree > dureeMax) return non("duree", `Durée maximale d’un créneau : ${dureeMax} h.`);

  const ecart = numJour(d.date) - numJour(aujourdhui());
  if (ecart < 0) return non("anticipation", "Cette date est déjà passée.");
  if (ecart > cfg.anticipationJours) return non("anticipation", `Réservation possible ${cfg.anticipationJours} jours à l’avance au maximum.`);

  const semaine = debutSemaine(d.date);
  const deja = miennes.filter(r => debutSemaine(r.date) === semaine)
    .reduce((t, r) => t + (enMinutes(r.fin) - enMinutes(r.debut)) / 60, 0);
  if (deja + duree > cfg.quotaHebdoHeures)
    return non("quota", `Quota hebdomadaire dépassé : ${cfg.quotaHebdoHeures} h par semaine (déjà ${deja} h réservées).`);

  if (miennes.some(r => r.date === d.date && chevauche(r, d)))
    return non("chevauchement", "Vous avez déjà une réservation sur ce créneau.");

  if (toutes.some(r => estActive(r) && r.ressourceType === d.ressourceType && r.ressourceId === d.ressourceId
      && r.date === d.date && chevauche(r, d)))
    return non("unicite", "Cette ressource est déjà réservée sur ce créneau.");

  const debutPeriode = numJour(aujourdhui()) - cfg.sanctions.periodeJours;
  const absences = toutes.filter(r => r.userId === user.id && r.statut === "liberee" && numJour(r.date) >= debutPeriode)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  if (absences.length >= cfg.sanctions.seuilAbsences
      && numJour(aujourdhui()) < numJour(absences[0].date) + cfg.sanctions.suspensionJours)
    return non("sanction", `Droit de réservation suspendu : ${absences.length} absences sur ${cfg.sanctions.periodeJours} jours.`);

  return null;
}

/** Vérifie les règles puis enregistre. Retourne { ok:true, reservation } ou { ok:false, regle, message } */
async function ajouterReservation(demande, user, sensible = false) {
  const [toutes, cfg] = await Promise.all([chargerReservations(), chargerReglages()]);
  const erreur = verifierRegles(demande, toutes, cfg, user);
  if (erreur) return { ok: false, ...erreur };
  const reservation = {
    id: Math.max(0, ...toutes.map(r => r.id)) + 1, userId: user.id, ...demande, statut: "active",
    qrCode: `BE-${demande.date.slice(2).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    ...(sensible ? { enAttenteValidation: true } : {})
  };
  toutes.push(reservation);
  sauverReservations(toutes);
  return { ok: true, reservation };
}

/* ---------- EF-7 : check-in (fenêtre -10 min / +15 min) ---------- */
const debutCreneau = r => new Date(`${r.date}T${r.debut}:00`);
const maintenantPour = r => (MODE_DEMO ? new Date(debutCreneau(r) - 5 * 60000) : new Date());

function etatCheckin(r, cfg, maintenant = maintenantPour(r)) {
  const diff = (maintenant - debutCreneau(r)) / 60000;
  if (diff < -cfg.checkin.ouvertureAvantMinutes) return "trop_tot";
  if (diff > cfg.checkin.delaiAbsenceMinutes) return "expire";
  return "ouvert";
}

/** Libère les réservations sans check-in après +15 min (à appeler au chargement hors démo) */
function libererAbsences(toutes, cfg, maintenant = new Date()) {
  let change = false;
  toutes.forEach(r => {
    if (r.statut === "active" && !r.enAttenteValidation && etatCheckin(r, cfg, maintenant) === "expire") { r.statut = "liberee"; change = true; }
  });
  if (change) sauverReservations(toutes);
  return change;
}

/* ---------- Message (toast) ---------- */
function afficherToast(message, type = "success") {
  let zone = document.getElementById("be-toasts");
  if (!zone) {
    zone = document.createElement("div");
    zone.id = "be-toasts";
    zone.className = "toast-container position-fixed bottom-0 end-0 p-3";
    document.body.appendChild(zone);
  }
  const el = document.createElement("div");
  el.className = `toast align-items-center text-bg-${type === "success" ? "success" : "danger"} border-0`;
  el.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fermer"></button></div>`;
  zone.appendChild(el);
  new bootstrap.Toast(el, { delay: 4000 }).show();
}
