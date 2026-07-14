/* ============================================================================
   FIRST LIGHT — Interaktivität (reines JavaScript, ohne Framework)
   ----------------------------------------------------------------------------
   Seit dem Umbau auf EIGENSTÄNDIGE SEITEN (Home, /trips/, /about/, /contact/,
   /imprint/) übernimmt die Navigation der Browser selbst – jeder Menülink ist
   ein echter Link auf eine eigene Adresse. Dieses Skript kümmert sich nur noch
   um vier Dinge:
     1. LADE-SCREEN        – das Intro-Herz nach der Animation aus dem DOM nehmen
     2. MOBILE MENÜ        – Burger öffnet/schließt das Vollbild-Menü
     3. EINBLENDEN         – Elemente mit class="reveal" beim Scrollen zeigen
     4. VIDEO              – Reel-Video automatisch starten (sobald eins da ist)
     5. NEWSLETTER         – Formular an MailerLite schicken

   Normalerweise musst du hier nichts ändern – Texte/Bilder stehen in den
   HTML-Dateien, das Aussehen in styles.css.
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

  const body = document.body;
  const menu = document.querySelector('[data-menu]');

  /* ---- 1. LADE-SCREEN AUFRÄUMEN -------------------------------------------
     Der Loader blendet sich per CSS nach ~1 s aus, bliebe aber unsichtbar
     im DOM liegen. Safari 26 (iPhone) bezieht unsichtbare fixed-Elemente
     in die Färbung der Statusleiste ein – deshalb fliegt er ganz raus.
     (Ab dem 2. Seitenaufruf einer Sitzung ist er per CSS eh ausgeblendet –
     siehe .intro-seen in styles.css und das Skript im <head>.) */
  setTimeout(() => {
    const loader = document.querySelector('.loader');
    if (loader) loader.remove();
  }, 1200);


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

  document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => observer.observe(el));

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
      const payload = new URLSearchParams({ 'fields[email]': email });
      try {
        await fetch(MAILERLITE_URL, { method: 'POST', mode: 'no-cors', body: payload });
      } catch (_) { /* Antwort nicht lesbar – bewusst ignoriert */ }

      // Formular durch Danke-Meldung ersetzen
      form.innerHTML = '<p class="newsletter__done">Thanks — you\'re on the list!</p>';
    });
  });


  /* ---- 6. REEL-VIDEO: sofort starten, nur spielen wenn sichtbar -----------
     Das Reel (<mux-video>, von Mux gestreamt) puffert dank preload="auto"
     schon im Hintergrund und startet über Mux-Streaming zuerst in niedriger
     Auflösung (schneller Start, keine Wartezeit) und lädt dann live auf die
     beste Qualität hoch. Hier kümmern wir uns nur ums Abspielen: es läuft nur,
     solange es (fast) sichtbar ist – scrollt man weg, pausiert es (spart
     Daten & Akku). rootMargin 200px = ein Tick früher starten, damit es sich
     beim Ankommen bereits sofort anfühlt. */
  const reel = document.querySelector('[data-reel-video]');
  if (reel && window.customElements && customElements.whenDefined) {
    customElements.whenDefined('mux-video').then(() => {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const p = reel.play();
            if (p && p.catch) p.catch(() => {});   // Autoplay-Blockade still ignorieren
          } else {
            reel.pause();
          }
        });
      }, { threshold: 0, rootMargin: '200px 0px' });
      io.observe(reel);

      // Zurück aus einem anderen Tab: Browser pausieren Videos in Hintergrund-
      // Tabs; der Observer allein löst beim Zurückkehren nicht neu aus. Ist das
      // Reel dann sichtbar, wieder anspielen.
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) return;
        const r = reel.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          const p = reel.play();
          if (p && p.catch) p.catch(() => {});
        }
      });
    });
  }

});
