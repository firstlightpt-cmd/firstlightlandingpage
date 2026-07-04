/* ============================================================================
   FIRST LIGHT — Interaktivität (reines JavaScript, ohne Framework)
   ----------------------------------------------------------------------------
   Ersetzt die frühere Claude-Design-Komponente. Vier Aufgaben:
     1. SEITEN UMSCHALTEN  – Klick auf Navi zeigt die passende Seite
     2. MOBILE MENÜ        – Burger öffnet/schließt das Vollbild-Menü
     3. EINBLENDEN         – Elemente mit class="reveal" beim Scrollen zeigen
     4. VIDEO              – Reel-Video automatisch starten (sobald eins da ist)

   Normalerweise musst du hier nichts ändern – Texte/Bilder stehen in der
   index.html, das Aussehen in styles.css.
   ============================================================================ */

/* ============================================================================
   >>>>>  HIER MAILERLITE VERBINDEN  <<<<<
   ----------------------------------------------------------------------------
   Trage zwischen die Anführungszeichen deine MailerLite-Formular-URL ein.
   Sie sieht so aus (die X/Y sind bei dir Zahlen):
     https://assets.mailerlite.com/jsonp/XXXXXX/forms/YYYYYY/subscribe
   Wo du sie findest, steht in der ANLEITUNG.md ("Newsletter mit MailerLite").
   Solange hier der Platzhalter steht, sammelt das Formular noch nichts.
   ============================================================================ */
const MAILERLITE_URL = 'https://assets.mailerlite.com/jsonp/2480058/forms/191783339648091563/subscribe';


document.addEventListener('DOMContentLoaded', () => {

  const body   = document.body;
  const pages  = Array.from(document.querySelectorAll('[data-page]'));
  const menu   = document.querySelector('[data-menu]');

  /* ---- 0. LADE-SCREEN AUFRÄUMEN -------------------------------------------
     Der Loader blendet sich per CSS nach ~1 s aus, bliebe aber unsichtbar
     im DOM liegen. Safari 26 (iPhone) bezieht unsichtbare fixed-Elemente
     in die Färbung der Statusleiste ein – deshalb fliegt er ganz raus. */
  setTimeout(() => {
    const loader = document.querySelector('.loader');
    if (loader) loader.remove();
  }, 1200);


  /* ---- 1. SEITEN UMSCHALTEN ----------------------------------------------
     Jeder Link mit data-goto="home|trips|about|contact" zeigt die zugehörige
     Seite und versteckt die anderen. */
  function goTo(id) {
    pages.forEach(page => {
      page.hidden = (page.dataset.page !== id);
    });
    closeMenu();
    window.scrollTo({ top: 0, behavior: 'auto' });
    revealInView();   // was auf der neuen Seite schon sichtbar ist, gleich zeigen
  }

  document.querySelectorAll('[data-goto]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      goTo(link.getAttribute('data-goto'));
    });
  });


  /* ---- 2. MOBILE MENÜ ----------------------------------------------------- */
  function openMenu()  { menu.classList.add('is-open');    body.classList.add('menu-open'); }
  function closeMenu() { menu.classList.remove('is-open'); body.classList.remove('menu-open'); }
  function toggleMenu() { menu.classList.contains('is-open') ? closeMenu() : openMenu(); }

  document.querySelectorAll('[data-burger]').forEach(btn => {
    btn.addEventListener('click', toggleMenu);
  });
  // Klick auf den Hintergrund (nicht auf einen Link) schließt das Menü wieder
  if (menu) {
    menu.addEventListener('click', e => {
      if (e.target === menu || e.target.tagName === 'NAV') closeMenu();
    });
  }


  /* ---- 3. EINBLENDEN BEIM SCROLLEN ---------------------------------------
     Sobald ein .reveal-Element in den sichtbaren Bereich kommt, bekommt es
     die Klasse .is-visible (die Animation steckt in styles.css). */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);   // nur einmal einblenden
      }
    });
  }, { rootMargin: '0px 0px -40px 0px' });

  function revealInView() {
    document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => {
      // Elemente auf versteckten Seiten überspringen …
      if (el.offsetParent === null) return;
      observer.observe(el);
    });
  }
  revealInView();

  // Sicherheitsnetz: nach 3 s alles zeigen, falls etwas nicht ausgelöst hat
  setTimeout(() => {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
  }, 3000);


  /* ---- 4. VIDEO AUTOMATISCH STARTEN --------------------------------------
     Greift erst, wenn du im Reel ein echtes Video (mit src) hinterlegt hast. */
  document.querySelectorAll('video').forEach(v => {
    v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
    const p = v.play && v.play();
    if (p && p.catch) p.catch(() => {});   // Browser-Blockade still ignorieren
  });


  /* ---- 5. NEWSLETTER → MAILERLITE ----------------------------------------
     Sendet die eingegebene E-Mail an deine MailerLite-Liste und zeigt dann
     eine Danke-Meldung. Die URL dazu steht ganz oben (MAILERLITE_URL).
     Gilt automatisch für alle Formulare mit dem Attribut data-newsletter. */
  document.querySelectorAll('[data-newsletter]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = form.querySelector('input[type="email"]');
      const email = emailInput ? emailInput.value.trim() : '';
      const trap  = form.querySelector('input[name="hp"]');

      if (trap && trap.value) return;   // Spam-Falle ausgefüllt → Bot, ignorieren
      if (!email) return;               // leeres Feld → nichts tun

      // Noch keine MailerLite-URL hinterlegt? Hinweis geben statt still zu scheitern.
      if (!MAILERLITE_URL || MAILERLITE_URL.indexOf('HIER_DEINE') === 0) {
        alert('Der Newsletter ist noch nicht mit MailerLite verbunden.\n' +
              'Bitte MAILERLITE_URL ganz oben in script.js eintragen.');
        return;
      }

      // An MailerLite senden. "no-cors" heißt: wir dürfen die Antwort nicht
      // lesen (deshalb kein Fehler-Handling), die Anmeldung geht aber durch.
      const body = new URLSearchParams({ 'fields[email]': email });
      try {
        await fetch(MAILERLITE_URL, { method: 'POST', mode: 'no-cors', body });
      } catch (_) { /* Antwort nicht lesbar – bewusst ignoriert */ }

      // Formular durch Danke-Meldung ersetzen
      form.innerHTML = '<p class="newsletter__done">Thanks — you\'re on the list!</p>';
    });
  });

});
