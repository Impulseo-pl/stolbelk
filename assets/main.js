// Stolbelk - interakcje układu (menu-pigułka, karuzela oferty, opinie, filtry realizacji, etapy pracy, pojawianie sekcji)
(function () {
  // MENU pełnoekranowe
  try {
    var btn = document.querySelector('.kh-menu'), menu = document.getElementById('menu');
    if (btn && menu) {
      var ustaw = function (otw) {
        menu.classList.toggle('is-open', otw);
        menu.setAttribute('aria-hidden', otw ? 'false' : 'true');
        btn.setAttribute('aria-expanded', otw ? 'true' : 'false');
        document.body.classList.toggle('km-open', otw);
      };
      btn.addEventListener('click', function () { ustaw(!menu.classList.contains('is-open')); });
      menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { ustaw(false); }); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') ustaw(false); });
    }
  } catch (e) {}

  // KARUZELA oferty (przewijanie o jedną kartę + pasek postępu)
  try {
    document.querySelectorAll('[data-car]').forEach(function (car) {
      var tor = car.querySelector('.k-car-track'), bar = car.querySelector('.k-car-bar span');
      if (!tor) return;
      var krok = function () {
        var it = tor.querySelector('.k-car-item');
        if (!it) return 300;
        var gap = parseFloat(getComputedStyle(tor).columnGap || getComputedStyle(tor).gap) || 0;
        return it.getBoundingClientRect().width + gap;
      };
      car.querySelectorAll('.k-round').forEach(function (b) {
        b.addEventListener('click', function () {
          var dir = parseInt(b.getAttribute('data-dir'), 10) || 1;
          var max = tor.scrollWidth - tor.clientWidth;
          if (dir > 0 && tor.scrollLeft >= max - 4) tor.scrollTo({ left: 0, behavior: 'smooth' });
          else tor.scrollBy({ left: dir * krok(), behavior: 'smooth' });
        });
      });
      var pasek = function () {
        if (!bar) return;
        var max = tor.scrollWidth - tor.clientWidth, cz = tor.clientWidth / tor.scrollWidth;
        var szer = Math.max(0.18, Math.min(1, cz));
        bar.style.width = (szer * 100) + '%';
        var p = max > 0 ? tor.scrollLeft / max : 0;
        bar.style.transform = 'translateX(' + (p * (1 / szer - 1) * 100) + '%)';
      };
      tor.addEventListener('scroll', function () { requestAnimationFrame(pasek); }, { passive: true });
      window.addEventListener('resize', pasek);
      pasek();
    });
  } catch (e) {}

  // OPINIE - przełączanie cytatów
  try {
    document.querySelectorAll('[data-op]').forEach(function (box) {
      var sl = box.querySelectorAll('.k-op-slide'), i = 0, t = null;
      if (sl.length < 2) return;
      var pokaz = function (n) {
        i = (n + sl.length) % sl.length;
        sl.forEach(function (s, k) { s.classList.toggle('is-on', k === i); s.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
      };
      var auto = function () { clearInterval(t); t = setInterval(function () { pokaz(i + 1); }, 9000); };
      box.querySelectorAll('.k-round').forEach(function (b) {
        b.addEventListener('click', function () { pokaz(i + (parseInt(b.getAttribute('data-dir'), 10) || 1)); auto(); });
      });
      box.addEventListener('mouseenter', function () { clearInterval(t); });
      box.addEventListener('mouseleave', auto);
      auto();
    });
  } catch (e) {}

  // REALIZACJE - filtry
  try {
    var fil = document.querySelector('.k-filters');
    if (fil) {
      var it = document.querySelectorAll('.k-g-item');
      fil.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          var f = b.getAttribute('data-f');
          fil.querySelectorAll('button').forEach(function (x) { x.classList.toggle('is-on', x === b); });
          it.forEach(function (el) { el.hidden = !(f === '*' || el.getAttribute('data-cat') === f); });
        });
      });
    }
  } catch (e) {}

  // O NAS - etapy pracy (rozwijane kolumny)
  try {
    document.querySelectorAll('[data-acc]').forEach(function (acc) {
      var its = acc.querySelectorAll('.k-acc-it');
      its.forEach(function (el) {
        var b = el.querySelector('.k-acc-btn');
        b.addEventListener('click', function () {
          its.forEach(function (x) {
            var on = x === el;
            x.classList.toggle('is-on', on);
            x.querySelector('.k-acc-btn').setAttribute('aria-expanded', on ? 'true' : 'false');
          });
        });
      });
    });
  } catch (e) {}

  // OKNO NA ZDJĘCIE: warstwa fixed włączona tylko w pobliżu sekcji (mniej malowania, nic nie leży nad pierwszym ekranem)
  try {
    var okna = document.querySelectorAll('.stopklatka');
    if (okna.length && 'IntersectionObserver' in window) {
      document.documentElement.classList.add('stk-on');
      var io2 = new IntersectionObserver(function (wpisy) {
        wpisy.forEach(function (w) { w.target.classList.toggle('is-near', w.isIntersecting); });
      }, { rootMargin: '60% 0px 60% 0px' });
      okna.forEach(function (o) { io2.observe(o); });
    }
  } catch (e) { document.documentElement.classList.remove('stk-on'); }

  // POJAWIANIE SEKCJI - stan startowy włącza dopiero JS; awaria = wszystko widoczne
  try {
    var els = document.querySelectorAll('.rv');
    if (!els.length || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('rv-on');
    var io = new IntersectionObserver(function (wpisy) {
      wpisy.forEach(function (w) { if (w.isIntersecting) { w.target.classList.add('in'); io.unobserve(w.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
    setTimeout(function () {   // twardy bezpiecznik (jak w silniku): po 3,5 s odsłaniamy wszystko
      els.forEach(function (el) { el.classList.add('in'); });
    }, 3500);
  } catch (e) { document.documentElement.classList.remove('rv-on'); }
})();

// LICZNIK WAŻNOŚCI DEMA (K. 09.08: pełne odliczanie dni/godzin/minut/sekund).
// Element wstrzykuje multipage TYLKO w dema. Nie wita klienta przy wejściu - wjeżdża
// po zejściu z pierwszego ekranu i chowa się po powrocie na górę.
(function () {
  var el = document.querySelector('.demo-wazne');
  if (!el || !el.getAttribute('data-do')) return;
  var koniec = new Date(el.getAttribute('data-do') + 'T23:59:59');
  if (isNaN(koniec)) return;
  var txt = el.querySelector('.dw-txt') || el;
  var dwa = function (n) { return (n < 10 ? '0' : '') + n; };

  var cykl = parseInt(el.getAttribute('data-cykl') || '0', 10);   // dni; 0 = brak wznowienia
  function tyka() {
    var teraz = new Date(), ms = koniec - teraz;
    // po wygaśnięciu licznik rusza od nowa (K. 10.08) - dema i tak zostają, a odliczanie
    // ma dawać klientowi realne poczucie, że sprawa ma termin.
    while (ms <= 0 && cykl > 0) {
      koniec = new Date(koniec.getTime() + cykl * 86400000);
      ms = koniec - teraz;
    }
    if (ms <= 0) { txt.innerHTML = 'Wersja pokazowa wygasła'; el.classList.add('is-koniec'); return false; }
    var s = Math.floor(ms / 1000), d = Math.floor(s / 86400);
    var g = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sek = s % 60;
    var zegar = dwa(g) + ':' + dwa(m) + ':' + dwa(sek);
    txt.innerHTML = d > 0
      ? 'Wersja pokazowa · <b>' + d + ' dni</b> <span class="dw-zeg">' + zegar + '</span>'
      : 'Wersja pokazowa · <b class="dw-pilne">' + zegar + '</b>';
    el.classList.toggle('is-pilne', d === 0);
    return true;
  }
  if (tyka() !== false) setInterval(tyka, 1000);
  el.hidden = false;

  var tick = false;
  function stan() {
    el.classList.toggle('is-on', (window.scrollY || 0) > window.innerHeight * 0.55);
    tick = false;
  }
  window.addEventListener('scroll', function () {
    if (tick) return; tick = true; requestAnimationFrame(stan);
  }, { passive: true });
  stan();
})();


/* === DOLNY PASEK MOBILE: chowa się przy stopce ===
   Lekcja 13.08.2026 (Zielony Azymut): klient zgłosił, że pasek „Zapytaj o termin"
   zasłania treść na dole strony. Rezerwę pod treścią daje CSS (razem z safe-area
   iPhone'a), a tu drugie zabezpieczenie: gdy w kadrze jest stopka albo sekcja CTA
   - czyli te same przyciski - pasek zjeżdża w dół i wraca po odjechaniu w górę.
   Brak IntersectionObserver = pasek zostaje widoczny, czyli stan sprzed zmiany. */
(function () {
  try {
    var pasek = document.querySelector('.sticky-reserve, .sticky-call');
    if (!pasek || !('IntersectionObserver' in window)) return;
    var cele = document.querySelectorAll('footer, .cta');
    if (!cele.length) return;
    var widoczne = 0;
    var io = new IntersectionObserver(function (wpisy) {
      wpisy.forEach(function (w) { widoczne += w.isIntersecting ? 1 : -1; });
      if (widoczne < 0) widoczne = 0;
      pasek.classList.toggle('schowany', widoczne > 0);
    }, { threshold: 0.01 });
    cele.forEach(function (el) { io.observe(el); });
  } catch (e) {}
})();

/* === LICZNIK OTWARĆ DEMA (silnik, bez zmian) === */
(function(){try{if(String(location.protocol).indexOf('http')!==0)return;try{if(/[?&#]team=1/.test(location.search+location.hash)){localStorage.setItem('nb_team','1');}}catch(e){}try{if(localStorage.getItem('nb_team')==='1')return;}catch(e){}if(/crm-newbeginning|crm\.impulseo\.pl/.test(document.referrer||''))return;try{if(navigator.webdriver)return;}catch(e){}try{if(/^https?:\/\/(kris20032|impulseo-pl)\.github\.io\/?$/i.test(document.referrer||''))return;}catch(e){}if(sessionStorage.getItem('_dv'))return;sessionStorage.setItem('_dv','1');var seg=(location.pathname.split('/').filter(Boolean)[0])||'';var base=location.origin+(seg?('/'+seg):'');var ua='';try{ua=(navigator.userAgent||'').slice(0,300);}catch(e){}var EP='https://zngfubfinbojfgaxdrbf.supabase.co/functions/v1/demo-view';try{fetch(EP,{method:'POST',keepalive:true,headers:{'Content-Type':'text/plain'},body:JSON.stringify({demo_url:base,page:location.pathname,referrer:(document.referrer||null),user_agent:(ua||null)})}).catch(function(){});}catch(e){}}catch(e){}})();
