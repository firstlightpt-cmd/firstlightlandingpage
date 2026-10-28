/* ============================================================================
   FIRST LIGHT — Interaktivität (reines JavaScript, ohne Framework)
   ----------------------------------------------------------------------------
   Seit dem Umbau auf EIGENSTÄNDIGE SEITEN (Home, /trips/, /calendar/, /about/,
   /contact/, /imprint/) übernimmt die Navigation der Browser selbst – jeder
   Menülink ist ein echter Link auf eine eigene Adresse. Dieses Skript kümmert
   sich nur noch um:
     1. LADE-SCREEN        – das Intro-Herz nach der Animation aus dem DOM nehmen
     2. MOBILE MENÜ        – Burger öffnet/schließt das Vollbild-Menü
     3. EINBLENDEN         – Elemente mit class="reveal" beim Scrollen zeigen
     4. VIDEO              – Reel-Video automatisch starten (sobald eins da ist)
     5. NEWSLETTER         – Formular an MailerLite schicken
     6. REEL-VIDEO         – nur abspielen, wenn es im Bild ist
     7. CALENDAR-SHOP      – Galerie, "Buy now" und Kauf-Leiste auf /calendar/

   Normalerweise musst du hier nichts ändern – Texte/Bilder stehen in den
   HTML-Dateien, das Aussehen in styles.css. Ausnahmen: die beiden Konstanten
   direkt hier unten (Newsletter-URL und Bezahl-Link).
   ============================================================================ */

/* ============================================================================
   >>>>>  HIER MAILERLITE VERBINDEN  <<<<<
   ----------------------------------------------------------------------------
   Trage zwischen die Anführungszeichen deine MailerLite-Formular-URL ein.
   Sie sieht so aus (die X/Y sind bei dir Zahlen):
     https://assets.mailerlite.com/jsonp/XXXXXX/forms/YYYYYY/subscribe
   Solange hier der Platzhalter steht, sammelt das Formular noch nichts.
   ============================================================================ */
const MAILERLITE_URL = 'https://assets.mailerlite.com/jsonp/2480058/forms/191783339648091563/subscribe';

/* ============================================================================
   >>>>>  HIER DIE KALENDER-BEZAHLUNG VERBINDEN  <<<<<
   ----------------------------------------------------------------------------
   Empfohlen: ein Stripe "Payment Link" (kein eigener Server nötig).
   Im Stripe-Dashboard: Produkt "The Calendar 2027" mit 39 € anlegen,
   Versandadresse abfragen, Versandländer auf DE/AT/NL/PT beschränken,
   Menge anpassbar machen – fertig ist eine Adresse wie
     https://buy.stripe.com/XXXXXXXX
   Die trägst du hier zwischen die Anführungszeichen ein. Jeder "Buy now"-
   Button auf /calendar/ leitet dann dorthin weiter. Solange hier nichts
   steht, zeigt der Button nur einen Hinweis und es wird NICHTS abgebucht.
   ============================================================================ */
const PAYMENT_LINK = 'https://buy.stripe.com/6oU5kDe8M25L7bL1hT8IU00';


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


  /* ---- 7. CALENDAR-SHOP (/calendar/) ---------------------------------------
     Greift nur auf der Shop-Seite (<section data-shop>). Drei Aufgaben:
       a) Endlos-Galerie (wischen / Pfeile / Vorschaubilder / Pfeiltasten)
       b) "Buy now" → Bezahlseite (PAYMENT_LINK ganz oben) bzw. Hinweis
       c) klebende Kauf-Leiste am Handy                                      */
  const shop = document.querySelector('[data-shop]');
  if (shop) {

    /* -- Platzhalter-Kalenderseiten: kleines Monatsraster erzeugen ------------
       (Mo–So-Kopf, Leerfelder bis zum 1., dann die Tage). Läuft VOR dem
       Klonen der Galerie, damit die Kopien das Raster schon enthalten. */
    shop.querySelectorAll('[data-month-grid]').forEach(grid => {
      const days   = Number(grid.dataset.days)   || 30;
      const offset = Number(grid.dataset.offset) || 0;
      let html = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => `<b>${d}</b>`).join('');
      for (let i = 0; i < offset; i++) html += '<span></span>';
      for (let d = 1; d <= days; d++) html += `<span>${d}</span>`;
      grid.innerHTML = html;
    });

    /* -- a) Galerie als Endlos-Karussell -------------------------------------
       Trick: Vor das erste Foto kommt eine Kopie des letzten, hinter das
       letzte eine Kopie des ersten. Blättert man über den Rand, landet man
       optisch auf der Kopie – und wird im selben Moment unsichtbar auf das
       echte Foto gesetzt. So geht es in beide Richtungen endlos weiter,
       ohne dass die Spur jemals "zurückspult". */
    const track     = shop.querySelector('[data-gallery-track]');
    const thumbs    = Array.from(shop.querySelectorAll('[data-gallery-thumb]'));
    const thumbsBox = shop.querySelector('[data-gallery-thumbs]');
    const counter   = shop.querySelector('[data-gallery-counter]');

    if (track && track.children.length > 1) {
      const real = Array.from(track.children);   // die echten Fotos
      const n = real.length;
      let current = 0;                            // Index des echten Fotos (0 … n-1)
      let settleTimer = null;

      // Kopien anlegen (werden immer sofort geladen, damit der Übergang nahtlos ist)
      const cloneOf = el => {
        const c = el.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        c.querySelectorAll('img').forEach(img => { img.loading = 'eager'; img.alt = ''; });
        return c;
      };
      track.insertBefore(cloneOf(real[n - 1]), real[0]);   // Kopie des letzten vorn
      track.appendChild(cloneOf(real[0]));                  // Kopie des ersten hinten

      // Spur-Position 0 = vordere Kopie, 1 … n = echte Fotos, n+1 = hintere Kopie
      const slideW  = () => track.clientWidth;
      const posNow  = () => Math.round(track.scrollLeft / Math.max(1, slideW()));
      const jumpTo  = pos => track.scrollTo({ left: slideW() * pos, behavior: 'auto' });    // ohne Animation
      const glideTo = pos => track.scrollTo({ left: slideW() * pos, behavior: 'smooth' });  // mit Animation

      function render() {
        thumbs.forEach((t, k) => t.classList.toggle('is-active', k === current));
        if (counter) counter.textContent = `${current + 1} / ${n}`;
        // aktives Vorschaubild in die Mitte der Leiste holen (falls sie scrollt)
        const t = thumbs[current];
        if (t && thumbsBox && thumbsBox.scrollWidth > thumbsBox.clientWidth) {
          thumbsBox.scrollTo({ left: t.offsetLeft - (thumbsBox.clientWidth - t.clientWidth) / 2, behavior: 'smooth' });
        }
      }

      // Nach jedem Scrollen (Wisch, Pfeil, Tastatur): auf einer Kopie gelandet?
      // → unsichtbar auf das echte Foto springen.
      function settle() {
        const pos = posNow();
        if (pos <= 0)      { jumpTo(n); current = n - 1; }
        else if (pos >= n + 1) { jumpTo(1); current = 0; }
        else current = pos - 1;
        render();
      }
      track.addEventListener('scroll', () => {
        // Zähler/Vorschau schon während des Wischens mitführen
        const live = ((posNow() - 1) % n + n) % n;
        if (live !== current) { current = live; render(); }
        clearTimeout(settleTimer);
        settleTimer = setTimeout(settle, 120);
      }, { passive: true });

      // einen Schritt weiter (dir = +1) bzw. zurück (dir = -1)
      function step(dir) {
        let target = posNow() + dir;
        if (target > n + 1) { jumpTo(1); target = 2; }    // schnell geklickt: erst zurücksetzen
        if (target < 0)     { jumpTo(n); target = n - 1; }
        glideTo(target);
      }
      const prevBtn = shop.querySelector('[data-gallery-prev]');
      const nextBtn = shop.querySelector('[data-gallery-next]');
      if (prevBtn) prevBtn.addEventListener('click', () => step(-1));
      if (nextBtn) nextBtn.addEventListener('click', () => step(1));
      thumbs.forEach((t, k) => t.addEventListener('click', () => glideTo(k + 1)));
      track.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); step(-1); }
      });

      // Start auf dem echten ersten Foto (hinter der vorderen Kopie) – erst
      // dann die Spur zeigen, damit die Kopie nie kurz aufblitzt.
      const init = () => { jumpTo(current + 1); track.classList.add('is-ready'); };
      init();
      window.addEventListener('load', init);
      window.addEventListener('resize', () => jumpTo(current + 1));
      render();
    }

    /* -- b) "Buy now" → Bezahlseite --------------------------------------- */
    const notice = shop.querySelector('[data-pay-notice]');
    function pay() {
      if (PAYMENT_LINK) {
        window.location.href = PAYMENT_LINK;
        return;
      }
      // Noch kein Zahlungsanbieter angebunden → Hinweis, NICHTS wird abgebucht.
      if (notice) {
        notice.hidden = false;
        notice.textContent = 'Payment is not connected yet — nothing has been charged. ' +
                             'We\'re finalising the checkout; please check back shortly.';
        notice.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    document.querySelectorAll('[data-pay]').forEach(btn => btn.addEventListener('click', pay));
  }

});
