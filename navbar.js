/* ==========================================================
   BookEasy : navbar.js (navbar + footer partagés)
   Utilisation dans chaque page :
     <div id="navbar"></div> ... <div id="footer"></div>
     <script src="js/navbar.js"></script>
   Session attendue : localStorage.session = {"nom":"Louise Martin","role":"etudiant"}
   Rôles : invite | etudiant | enseignant | gestionnaire | admin
   ========================================================== */
(function () {
  // Liens du menu et rôles autorisés à les voir
  const LIENS = [
    { href: "reserver-salle.html",   icone: "bi-building",       texte: "Réserver une salle",     roles: ["invite", "etudiant", "enseignant", "gestionnaire", "admin"] },
    { href: "equipements.html",      icone: "bi-display",        texte: "Trouver un équipement",  roles: ["invite", "etudiant", "enseignant", "gestionnaire", "admin"] },
    { href: "mes-reservations.html", icone: "bi-calendar3",      texte: "Mes réservations",       roles: ["etudiant", "enseignant", "gestionnaire", "admin"] },
    { href: "admin-dashboard.html",  icone: "bi-grid-1x2",       texte: "Dashboard Admin",        roles: ["gestionnaire", "admin"] },
    { href: "admin-settings.html",   icone: "bi-sliders",        texte: "Paramètres",             roles: ["admin"] }
  ];

  function lireSession() {
    try { return JSON.parse(localStorage.getItem("session")) || { role: "invite" }; }
    catch (e) { return { role: "invite" }; }
  }

  const session = lireSession();
  const role = session.role || "invite";
  const pageCourante = location.pathname.split("/").pop() || "index.html";

  const liens = LIENS.filter(l => l.roles.includes(role)).map(l => `
    <li class="nav-item">
      <a class="nav-link ${l.href === pageCourante ? "active" : ""}" href="${l.href}"
         ${l.href === pageCourante ? 'aria-current="page"' : ""}>
        <i class="bi ${l.icone}"></i>${l.texte}
      </a>
    </li>`).join("");

  const compte = role === "invite"
    ? `<a class="btn btn-outline-secondary" href="login.html"><i class="bi bi-person"></i>Connexion / Profil</a>`
    : `<div class="dropdown">
         <button class="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
           <i class="bi bi-person"></i>${session.nom || "Mon compte"}
         </button>
         <ul class="dropdown-menu dropdown-menu-end">
           <li><a class="dropdown-item" href="profil.html"><i class="bi bi-person-gear me-2"></i>Profil et paramètres</a></li>
           <li><hr class="dropdown-divider"></li>
           <li><button class="dropdown-item" id="be-logout"><i class="bi bi-box-arrow-right me-2"></i>Déconnexion</button></li>
         </ul>
       </div>`;

  const html = `
    <nav class="be-navbar navbar navbar-expand-lg" aria-label="Navigation principale">
      <div class="be-container d-flex align-items-center w-100">
        <a class="be-brand" href="reserver-salle.html">
          <span class="be-brand-logo"><i class="bi bi-calendar-check"></i></span>BookEasy
        </a>
        <button class="navbar-toggler ms-auto" type="button" data-bs-toggle="collapse"
                data-bs-target="#be-menu" aria-controls="be-menu" aria-expanded="false" aria-label="Ouvrir le menu">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="be-menu">
          <ul class="navbar-nav mx-auto gap-1">${liens}</ul>
          ${compte}
        </div>
      </div>
    </nav>`;

  const cible = document.getElementById("navbar");
  if (cible) cible.innerHTML = html;

  const pied = document.getElementById("footer");
  if (pied) pied.innerHTML = `<footer class="be-footer">© 2026 BookEasy · ECE</footer>`;

  const logout = document.getElementById("be-logout");
  if (logout) logout.addEventListener("click", () => {
    localStorage.removeItem("session");
    location.href = "login.html";
  });
})();
