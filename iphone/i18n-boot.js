/* 🌐 Charge la traduction AVANT le premier affichage (pas de texte français qui clignote). */
(function () {
  'use strict';
  var I = window.IvassI18n, lang = null;
  try { var st = window.Native && window.Native.read('settings.json'); lang = st && st.lang; } catch (e) { /* premier lancement */ }
  if (!lang) { try { lang = localStorage.getItem('ivass-lang'); } catch (e) { /* stockage indisponible */ } }
  if (!lang) lang = I.detect(navigator.languages || [navigator.language]);
  window.ivassBootLang = lang;
  window.ivassLocale = lang === 'ar' ? 'ar-u-nu-latn' : lang;
  var l = I.info(lang), base = l.full ? lang : 'en';
  if (base !== 'fr') document.write('<script src="i18n/' + base + '.js"><\/script>');
  if (l.rtl) { document.documentElement.dir = 'rtl'; document.documentElement.lang = lang; }
})();
