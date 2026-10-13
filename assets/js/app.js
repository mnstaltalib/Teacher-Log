/* ============================================================================
    app.js — منطق الواجهة الحديثة (سجل المعلم)
   ========================================================================== */
(function () {
  'use strict';

  var GB = window.GradeBook;
  var SCHOOLS = window.SCHOOLS || [];
  var LS = 'mansa_prefs_v1';
  var CUSTOM = '__custom__';
  var FALLBACK_FONT = 'Cairo, Tahoma, Arial, sans-serif';

  var state = {
    schoolId: null,
    stageId: null,
    pdfId: null,
    classId: null,
    font: 'Cairo',
    size: 12,
    align: 'right',
    color: '#000000',
    names: [],
    customType: 'first_secondary'
  };

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    nav: $('nav'), scrollBar: $('scrollBar'), burger: $('burger'), navLinks: $('navLinks'),
    themeBtn: $('themeBtn'), themeIcon: $('themeIcon'),
    heroSec: $('heroSec'), heroGlow: $('heroGlow'), esig: $('esig'),
    schoolGrid: $('schoolGrid'),
    stageField: $('stageField'), stageTabs: $('stageTabs'),
    pdfField: $('pdfField'), pdfTabs: $('pdfTabs'),
    classField: $('classField'), classGrid: $('classGrid'),
    namesField: $('namesField'), autoNames: $('autoNames'),
    autoIcon: $('autoIcon'), autoTitle: $('autoTitle'), autoSub: $('autoSub'),
    manualBox: $('manualBox'), customType: $('customType'), customNames: $('customNames'),
    customCount: $('customCount'), customFileBtn: $('customFileBtn'), customFile: $('customFile'),
    fontSelect: $('fontSelect'), fontLabel: $('fontLabel'),
    alignGroup: $('alignGroup'), alignLabel: $('alignLabel'),
    fontSize: $('fontSize'), sizeLabel: $('sizeLabel'),
    previewCanvas: $('previewCanvas'), previewCap: $('previewCap'),
    textColor: $('textColor'), colorSwatches: $('colorSwatches'), colorLabel: $('colorLabel'),
    colorSwatchIco: $('colorSwatchIco'),
    generateBtn: $('generateBtn'), progress: $('progress'), progressBar: $('progressBar'),
    status: $('status'), toast: $('toast'),
    badgeSchool: $('badgeSchool'), badgeStage: $('badgeStage'), badgeClass: $('badgeClass'),
    stats: $('stats')
  };

  /* ------------------------------ الحالة ------------------------------ */
  function isCustom() { return state.schoolId === CUSTOM; }

  function school() {
    if (isCustom()) { return null; }
    for (var i = 0; i < SCHOOLS.length; i++) { if (SCHOOLS[i].id === state.schoolId) return SCHOOLS[i]; }
    return SCHOOLS[0] || null;
  }

  /* قوالب السجل الثلاثة (تُستخدم في الوضع اليدوي) */
  var TEMPLATES = {
    first_secondary:            { stageId: 'first_secondary',  pdfId: 'default'  },
    second_secondary_bac:       { stageId: 'second_secondary', pdfId: 'bac'      },
    second_secondary_general:   { stageId: 'second_secondary', pdfId: 'general'  }
  };

  function templateSchool() { return SCHOOLS[0] || null; }

  function stage() {
    var s = school(), t = templateSchool();
    if (!t) return null;
    var sid = isCustom() ? TEMPLATES[state.customType].stageId : state.stageId;
    var base = isCustom() ? t : s;
    for (var i = 0; i < base.stages.length; i++) { if (base.stages[i].id === sid) return base.stages[i]; }
    return base.stages[0] || null;
  }

  function pdf() {
    var st = stage(), t = templateSchool();
    if (!st || !t) return null;
    var pid = isCustom() ? TEMPLATES[state.customType].pdfId : state.pdfId;
    for (var i = 0; i < st.pdfs.length; i++) { if (st.pdfs[i].id === pid) return st.pdfs[i]; }
    return st.pdfs[0] || null;
  }

  function klass() {
    var st = stage();
    if (!st || isCustom()) { return null; }
    for (var i = 0; i < st.classes.length; i++) { if (st.classes[i].id === state.classId) return st.classes[i]; }
    return st.classes[0] || null;
  }

  function names() { return isCustom() ? GB.splitNames(el.customNames.value) : state.names; }

  /* ------------------------------ مساعدات ----------------------------- */
  function toArabicDigits(n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); }

  function save() {
    var o = { schoolId: state.schoolId, stageId: state.stageId, pdfId: state.pdfId,
              classId: state.classId, font: state.font, size: state.size,
              align: state.align, color: state.color, customType: state.customType };
    try { localStorage.setItem(LS, JSON.stringify(o)); } catch (e) {}
  }
  function load() {
    try {
      var raw = localStorage.getItem(LS);
      if (raw) { var o = JSON.parse(raw); for (var k in o) { if (o.hasOwnProperty(k)) state[k] = o[k]; } }
    } catch (e) {}
    fromUrl();
  }
  /* روابط مباشرة: index.html?s=..&t=..&p=..&c=.. */
  function fromUrl() {
    var q = String(location.search || '') + String(location.hash || '');
    var m;
    m = /[?#&]s=([^&#]+)/.exec(q); if (m) { state.schoolId = decodeURIComponent(m[1]); }
    m = /[?#&]t=([^&#]+)/.exec(q); if (m) { state.stageId = decodeURIComponent(m[1]); }
    m = /[?#&]p=([^&#]+)/.exec(q); if (m) { state.pdfId = decodeURIComponent(m[1]); }
    m = /[?#&]c=([^&#]+)/.exec(q); if (m) { state.classId = decodeURIComponent(m[1]); }
  }

  var toastTimer = null;
  function toast(msg, kind) {
    el.toast.textContent = msg;
    el.toast.className = 'toast show' + (kind ? ' ' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.className = 'toast'; }, 3400);
  }
  function status(msg, kind, spinner) {
    el.status.className = 'status' + (kind ? ' ' + kind : '');
    el.status.innerHTML = '';
    if (spinner) { var s = document.createElement('span'); s.className = 'spinner'; el.status.appendChild(s); }
    var t = document.createElement('span'); t.textContent = msg;
    el.status.appendChild(t);
  }

  /* ---------------------------- الوضع الليلي --------------------------- */
  var SUN = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
  var MOON = '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>';
  function setTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    el.themeIcon.innerHTML = mode === 'dark' ? MOON : SUN;
    try { localStorage.setItem('mansa_theme', mode); } catch (e) {}
    setTimeout(drawPreview, 60);
  }
  el.themeBtn.addEventListener('click', function () {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ------------------------------- التنقل ------------------------------ */
  el.burger.addEventListener('click', function () { el.navLinks.classList.toggle('open'); });
  el.navLinks.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { el.navLinks.classList.remove('open'); }
  });
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    el.scrollBar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    el.nav.classList.toggle('stuck', y > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --------------------------- ظهور العناصر ----------------------------- */
  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]'), i;
    function show(node) {
      if (node.classList.contains('in')) { return; }
      node.style.transitionDelay = node.style.getPropertyValue('--d') || '0s';
      node.classList.add('in');
    }
    var check = function () {
      var h = window.innerHeight || document.documentElement.clientHeight;
      for (var k = 0; k < items.length; k++) {
        var r = items[k].getBoundingClientRect();
        if (r.top < h * 0.92 && r.bottom > 0) { show(items[k]); }
      }
    };
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) { return; }
      ticking = true;
      requestAnimationFrame(function () { ticking = false; check(); });
    }, { passive: true });
    window.addEventListener('resize', check);
    setTimeout(check, 300); setTimeout(check, 1200);
    if (!('IntersectionObserver' in window)) { check(); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    for (i = 0; i < items.length; i++) { io.observe(items[i]); }
  }

  /* --------------------------- عدّادات الإحصائية ------------------------ */
  function initStats() {
    var classes = 0, i, j;
    for (i = 0; i < SCHOOLS.length; i++) {
      for (j = 0; j < SCHOOLS[i].stages.length; j++) { classes += SCHOOLS[i].stages[j].classes.length; }
    }
    var nodes = document.querySelectorAll('#stats b');
    nodes[0].setAttribute('data-count', SCHOOLS.length);
    nodes[1].setAttribute('data-count', classes);

    function tick(node) {
      var target = parseInt(node.getAttribute('data-count'), 10) || 0, start = null;
      function step(ts) {
        if (!start) { start = ts; }
        var p = Math.min(1, (ts - start) / 1500);
        node.textContent = toArabicDigits(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) { requestAnimationFrame(step); }
        else { node.textContent = toArabicDigits(target) + (target > 100 ? '+' : ''); }
      }
      requestAnimationFrame(step);
    }
    if (!('IntersectionObserver' in window)) {
      for (i = 0; i < nodes.length; i++) { nodes[i].textContent = toArabicDigits(nodes[i].getAttribute('data-count')); }
      return;
    }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { tick(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.5 });
    for (i = 0; i < nodes.length; i++) { io.observe(nodes[i]); }
  }

  /* ------------------------- توهّج يتبع المؤشر -------------------------- */
  function initHeroGlow() {
    if (!el.heroSec || !el.heroGlow) { return; }
    if (window.matchMedia && window.matchMedia('(hover:none)').matches) { return; }
    var raf = null;
    el.heroSec.addEventListener('mousemove', function (e) {
      var r = el.heroSec.getBoundingClientRect();
      if (raf) { return; }
      raf = requestAnimationFrame(function () {
        el.heroGlow.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
        el.heroGlow.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
        raf = null;
      });
    });
    el.heroSec.addEventListener('mouseenter', function () { el.heroGlow.classList.add('on'); });
    el.heroSec.addEventListener('mouseleave', function () { el.heroGlow.classList.remove('on'); });
  }

  /* --------------------------- التوقيع ورسمه --------------------------- */
  function initSignature() {
    if (!el.esig) { return; }
    if (!('IntersectionObserver' in window)) { el.esig.classList.add('in'); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { el.esig.classList.add('in'); io.disconnect(); } });
    }, { threshold: 0.4 });
    io.observe(el.esig);
  }

  /* ------------------------ حاسبة الوقت الموفّر -------------------------- */
  function initCalculator() {
    var c = $('calcClasses'), n = $('calcNames');
    if (!c || !n) { return; }
    function human(min) {
      min = Math.round(min);
      if (min < 60) { return toArabicDigits(min) + ' دقيقة'; }
      var h = Math.floor(min / 60), m = min % 60;
      return toArabicDigits(h) + ' ساعة' + (m ? ' و' + toArabicDigits(m) + ' دقيقة' : '');
    }
    function update() {
      var records = parseInt(c.value, 10) || 1;
      var per = parseInt(n.value, 10) || 45;
      $('calcClassesVal').textContent = toArabicDigits(records) + (records === 1 ? ' سجل' : (records <= 10 ? ' سجلات' : ' سجلاً'));
      $('calcNamesVal').textContent = toArabicDigits(per) + ' طالباً';

      var manual = records * per * 0.5;        /* دقائق */
      var fast = (records * 12) / 60;          /* ١٢ ثانية لكل سجل */
      $('outSaved').textContent = '≈ ' + human(Math.max(0, manual - fast));
      $('outManual').textContent = human(manual);
      $('outFast').textContent = human(fast);
    }
    c.addEventListener('input', update);
    n.addEventListener('input', update);
    update();
  }

  /* --------------------------- بناء الاختيارات -------------------------- */
  function buildSchools() {
    el.schoolGrid.innerHTML = '';

    SCHOOLS.forEach(function (s) {
      var count = 0, students = s.stats && s.stats.students ? s.stats.students : 0;
      s.stages.forEach(function (st) { count += st.classes.length; });

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'school-card' + (s.id === state.schoolId ? ' on' : '');
      btn.style.setProperty('--accent', s.accent || '#4f46e5');
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', s.id === state.schoolId ? 'true' : 'false');
      btn.innerHTML =
        '<span class="lg">' + (s.logo || '🏫') + '</span>' +
        '<span><b>' + s.name + '</b><em>' + toArabicDigits(count) + ' فصل • ' +
        (students ? toArabicDigits(students) + ' طالب' : 'أسماء جاهزة') + '</em></span>';
      btn.addEventListener('click', function () { pickSchool(s.id); });
      el.schoolGrid.appendChild(btn);
    });

    /* خيار: مدرستي غير موجودة */
    var cbtn = document.createElement('button');
    cbtn.type = 'button';
    cbtn.className = 'school-card custom' + (isCustom() ? ' on' : '');
    cbtn.setAttribute('role', 'radio');
    cbtn.setAttribute('aria-checked', isCustom() ? 'true' : 'false');
    cbtn.innerHTML = '<span class="lg">➕</span><span><b>مدرستي غير موجودة</b>' +
                     '<em>اكتب الأسماء بنفسك واختر نوع السجل</em></span>';
    cbtn.addEventListener('click', function () { pickSchool(CUSTOM); });
    el.schoolGrid.appendChild(cbtn);
  }

  function buildStages() {
    var s = school();
    el.stageTabs.innerHTML = '';
    if (!s) { return; }
    s.stages.forEach(function (st) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = st.id === state.stageId ? 'on' : '';
      b.textContent = st.name;
      b.setAttribute('role', 'tab');
      b.addEventListener('click', function () {
        state.stageId = st.id;
        state.pdfId = st.pdfs[0].id;
        state.classId = st.classes[0].id;
        save(); buildStages(); buildPdfs(); buildClasses(); updateBadges();
        loadClassNames();
      });
      el.stageTabs.appendChild(b);
    });
  }

  function buildPdfs() {
    var st = stage();
    el.pdfTabs.innerHTML = '';
    if (!st) { return; }
    if (st.pdfs.length > 1) {
      el.pdfField.style.display = 'block';
      st.pdfs.forEach(function (p) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = p.id === state.pdfId ? 'on' : '';
        b.textContent = p.label;
        b.setAttribute('role', 'tab');
        b.addEventListener('click', function () {
          state.pdfId = p.id; save(); buildPdfs(); updateBadges(); drawPreview();
        });
        el.pdfTabs.appendChild(b);
      });
    } else {
      el.pdfField.style.display = 'none';
    }
  }

  function buildClasses() {
    var st = stage();
    el.classGrid.innerHTML = '';
    if (!st) { return; }
    st.classes.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'class-chip' + (c.id === state.classId ? ' on' : '');
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', c.id === state.classId ? 'true' : 'false');
      b.innerHTML = GB.classLabel(c) + '<small>' + c.id + '</small>';
      b.addEventListener('click', function () {
        state.classId = c.id; save(); buildClasses(); updateBadges(); drawPreview();
        loadClassNames();
      });
      el.classGrid.appendChild(b);
    });
  }

  function pickSchool(id) {
    state.schoolId = id;
    state.names = [];
    var s = school();
    if (s && s.stages.length) {
      state.stageId = s.stages[0].id;
      state.pdfId = s.stages[0].pdfs[0].id;
      state.classId = s.stages[0].classes[0].id;
    }
    save();
    buildSchools(); buildStages(); buildPdfs(); buildClasses();
    updateBadges(); drawPreview();

    if (isCustom()) {
      el.manualBox.classList.add('on');
      el.autoNames.style.display = 'none';
      el.stageField.style.display = 'none';
      el.classField.style.display = 'none';
      setNamesStatus();
      toast('اكتب أسماء طلابك ثم اضغط «توليد السجل»', 'ok');
    } else {
      el.manualBox.classList.remove('on');
      el.autoNames.style.display = '';
      el.stageField.style.display = '';
      el.classField.style.display = '';
      loadClassNames();
    }
  }

  function updateBadges() {
    var s = school(), st = stage(), p = pdf(), c = klass();
    if (isCustom()) {
      el.badgeSchool.textContent = '➕ مدرستي';
      var tpl = el.customType.options[el.customType.selectedIndex].textContent;
      el.badgeStage.textContent = '📄 ' + tpl;
      el.badgeClass.textContent = '✍️ ' + toArabicDigits(names().length) + ' اسم';
      return;
    }
    el.badgeSchool.textContent = (s ? (s.logo || '🏫') + ' ' + s.short : '🏫 مدرسة');
    el.badgeStage.textContent = st ? '📚 ' + st.short : '📚 مرحلة';
    el.badgeClass.textContent = c ? '🚪 ' + GB.classLabel(c) : '🚪 فصل';
    if (p && st && st.pdfs.length > 1) {
      el.badgeStage.textContent = '📚 ' + st.short + ' • ' + p.label;
    }
  }

  /* --------------- تحميل أسماء الفصل تلقائياً (بدون ضغط) ---------------- */
  function loadClassNames() {
    var s = school(), c = klass();
    if (isCustom() || !s || !c) { return; }

    el.autoNames.classList.add('loading');
    el.autoIcon.textContent = '⏳';
    el.autoTitle.textContent = 'جارٍ تحميل أسماء ' + GB.classLabel(c) + '…';
    el.autoSub.textContent = 'ملف ' + c.file;

    GB.loadClassNames(s, c).then(function (list) {
      state.names = list;
      el.autoNames.classList.remove('loading');
      el.autoIcon.textContent = '✅';
      el.autoTitle.textContent = 'تم تحميل ' + toArabicDigits(list.length) + ' اسماً تلقائياً';
      el.autoSub.textContent = GB.classLabel(c) + ' — ' + c.file;
      updateBadges(); drawPreview();
    })['catch'](function (err) {
      el.autoNames.classList.remove('loading');
      el.autoIcon.textContent = '⚠️';
      el.autoTitle.textContent = 'تعذر تحميل أسماء الفصل';
      el.autoSub.textContent = err.message || 'تأكد من وجود ملف ' + (c ? c.file : '');
    });
  }

  /* --------------------------- الوضع اليدوي ---------------------------- */
  function setNamesStatus() {
    var n = GB.splitNames(el.customNames.value).length;
    el.customCount.textContent = toArabicDigits(n) + ' اسم';
    el.customCount.className = 'pill' + (n ? ' ok' : '');
    updateBadges(); drawPreview();
  }
  el.customNames.addEventListener('input', setNamesStatus);
  el.customType.addEventListener('change', function () {
    state.customType = this.value; save(); updateBadges(); drawPreview();
  });
  el.customFileBtn.addEventListener('click', function () { el.customFile.click(); });
  el.customFile.addEventListener('change', function () {
    var f = this.files && this.files[0];
    if (!f) { return; }
    GB.readTextFile(f).then(function (txt) {
      el.customNames.value = GB.splitNames(txt).join('\n');
      setNamesStatus();
      toast('تم استيراد ' + toArabicDigits(names().length) + ' اسماً', 'ok');
    })['catch'](function () { toast('تعذر قراءة الملف', 'err'); });
    this.value = '';
  });

  /* ------------------------------- الخطوط ------------------------------ */
  function buildFontSelect() {
    GB.FONTS.forEach(function (g) {
      var og = document.createElement('optgroup');
      og.label = g.group;
      g.items.forEach(function (f) {
        var o = document.createElement('option');
        o.value = f.value; o.textContent = f.label;
        og.appendChild(o);
      });
      el.fontSelect.appendChild(og);
    });
    var sys = document.createElement('option');
    sys.value = 'system'; sys.textContent = 'خط النظام (افتراضي)';
    el.fontSelect.insertBefore(sys, el.fontSelect.firstChild);
  }

  el.fontSelect.addEventListener('change', function () {
    state.font = this.value; save();
    var meta = GB.findFont(state.font);
    el.fontLabel.textContent = meta ? meta.label.split('—')[0].trim() : 'النظام';
    if (state.font === 'system') { drawPreview(); return; }

    status('جارٍ تحميل الخط…', 'info', true);
    GB.ensureFontLoaded(state.font).then(function (ok) {
      status('');
      drawPreview();
      if (!ok) {
        toast('تعذر تحميل الخط "' + (meta ? meta.label : state.font) + '" — سيُستخدم خط بديل', 'err');
      }
    });
  });

  /* ------------------------------ المحاذاة ----------------------------- */
  var ALIGN_AR = { right: 'يمين', center: 'وسط', left: 'يسار' };
  el.alignGroup.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null;
    if (!b) { return; }
    state.align = b.getAttribute('data-align'); save();
    var all = el.alignGroup.querySelectorAll('button'), i;
    for (i = 0; i < all.length; i++) { all[i].classList.toggle('on', all[i] === b); }
    el.alignLabel.textContent = ALIGN_AR[state.align];
    drawPreview();
  });

  el.fontSize.addEventListener('input', function () {
    state.size = parseInt(this.value, 10) || 12;
    el.sizeLabel.textContent = toArabicDigits(state.size);
    save(); drawPreview();
  });

  /* ------------------------------ اللون -------------------------------- */
  var COLOR_NAMES = {
    '#000000': 'أسود', '#1d4ed8': 'أزرق', '#b91c1c': 'أحمر', '#047857': 'أخضر',
    '#7e22ce': 'بنفسجي', '#c2410c': 'برتقالي', '#0f766e': 'تركوازي', '#6b7280': 'رمادي'
  };

  function setColor(hex) {
    hex = String(hex || '#000000').toLowerCase();
    if (!/^#[0-9a-f]{6}$/.test(hex)) { hex = '#000000'; }
    state.color = hex;
    if (el.textColor) { el.textColor.value = hex; }
    if (el.colorLabel) { el.colorLabel.textContent = COLOR_NAMES[hex] || 'مخصص'; }
    if (el.colorSwatchIco) { el.colorSwatchIco.style.background = hex; }
    var sw = el.colorSwatches ? el.colorSwatches.querySelectorAll('.sw') : [], i;
    for (i = 0; i < sw.length; i++) {
      sw[i].classList.toggle('on', sw[i].getAttribute('data-color') === hex);
    }
    save(); drawPreview();
  }

  if (el.textColor) { el.textColor.addEventListener('input', function () { setColor(this.value); }); }
  if (el.colorSwatches) {
    el.colorSwatches.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.sw') : null;
      if (b) { setColor(b.getAttribute('data-color')); }
    });
  }

  /* ------------------------------ المعاينة ----------------------------- */
  /* نستخدم نفس دالة رسم الـ PDF حرفياً — فما تراه هنا هو ما سيُكتب في السجل */
  function drawPreview() {
    var canvas = el.previewCanvas, ctx = canvas.getContext('2d');
    if (!ctx) { return; }

    var p = pdf();
    var keys = p ? Object.keys(p.pages) : [];
    var data = keys.length ? p.pages[keys[0]] : { maxTextWidth: 100, stepY: 14 };
    var cellW = data.maxTextWidth, cellH = data.stepY * 0.85;

    var list = names();
    var sample = list[0] || 'محمد عبد الله علي حسن';
    var family = GB.fontStack(state.font);

    var cell = GB.renderNameCanvas({
      name: sample, boxWidth: cellW, boxHeight: cellH,
      fontFamily: family, fontSize: state.size, alignment: state.align,
      color: state.color, scale: 4
    });

    /* العرض المتاح داخل الإطار (بدون الحشو) */
    var holder = canvas.parentElement;
    var hcs = holder ? window.getComputedStyle(holder) : null;
    var padX = hcs ? (parseFloat(hcs.paddingLeft) || 0) + (parseFloat(hcs.paddingRight) || 0) : 0;
    var box = (holder ? holder.clientWidth : 340) - padX;

    var serialW = 38, gap = 12;
    var total = Math.max(160, Math.floor(box));
    var cellDispW = Math.max(80, total - serialW - gap);
    var cellDispH = Math.max(34, Math.round(cellDispW * (cell.height / cell.width)));
    var dispW = cellDispW + gap + serialW;
    var dispH = Math.max(56, Math.min(170, cellDispH + 14));

    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(dispW * dpr);
    canvas.height = Math.round(dispH * dpr);
    canvas.style.width = dispW + 'px';
    canvas.style.height = dispH + 'px';
    canvas.style.maxWidth = 'none';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* صفحة بيضاء دائماً — تماماً كما Will تكون في السجل المطبوع */
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, dispW, dispH);

    /* خطوط أفقية خفيفة تمثل خانات الجدول */
    ctx.strokeStyle = 'rgba(100,116,139,.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, dispH / 2 - 0.5); ctx.lineTo(dispW, dispH / 2 - 0.5);
    ctx.moveTo(0, dispH / 2 + 0.5); ctx.lineTo(dispW, dispH / 2 + 0.5);
    ctx.stroke();

    /* عمود الرقم المسلسل */
    ctx.strokeStyle = 'rgba(100,116,139,.28)';
    ctx.beginPath();
    ctx.moveTo(cellDispW + gap / 2, 6); ctx.lineTo(cellDispW + gap / 2, dispH - 6);
    ctx.stroke();

    ctx.fillStyle = '#9aa4b5';
    ctx.font = '700 ' + Math.round(dispH * 0.3) + 'px ' + FALLBACK_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if ('direction' in ctx) { ctx.direction = 'rtl'; }
    ctx.fillText(toArabicDigits(1), cellDispW + gap + serialW / 2, dispH / 2);

    /* الخانة نفسها — نفس صورة الـ PDF */
    ctx.drawImage(cell, 0, (dispH - cellDispH) / 2, cellDispW, cellDispH);

    var meta = GB.findFont(state.font);
    el.previewCap.textContent = (meta ? meta.label.split('—')[0].trim() : 'خط النظام') +
      ' • ' + ALIGN_AR[state.align] + ' • ' + toArabicDigits(state.size) +
      ' • ' + (COLOR_NAMES[state.color] || 'لون مخصص') +
      (p ? ' • ' + toArabicDigits(Object.keys(p.pages).length) + ' صفحات' : '');
  }

  /* ------------------------------ التوليد ------------------------------ */
  var busy = false;
  function setProgress(v) {
    el.progressBar.style.width = Math.max(0, Math.min(100, v)) + '%';
  }

  el.generateBtn.addEventListener('click', function () {
    if (busy) { return; }

    var st = stage(), p = pdf(), list = names(), s = school(), c = klass();
    if (!st || !p) { toast('اختر المدرسة والمرحلة أولاً', 'err'); return; }
    if (!isCustom() && !c) { toast('اختر الفصل أولاً', 'err'); return; }
    if (!list.length) {
      if (isCustom()) {
        toast('اكتب أسماء الطلاب في المربع أولاً', 'err');
        el.customNames.focus();
      } else {
        toast('لم يتم تحميل أسماء الفصل — اختر فصلاً آخر', 'err');
      }
      return;
    }
    if (list.length > GB.MAX_NAMES) {
      toast('سيتم كتابة ' + toArabicDigits(GB.MAX_NAMES) + ' اسماً فقط (السعة القصوى)', 'err');
    }

    busy = true;
    el.generateBtn.disabled = true;
    el.progress.classList.add('on');
    setProgress(1);
    status('جارٍ التجهيز…', 'info', true);

    var fname;
    if (isCustom()) {
      fname = 'سجل - ' + el.customType.options[el.customType.selectedIndex].textContent + '.pdf';
    } else {
      fname = s.short + ' - ' + st.short + ' - ' + GB.classLabel(c).replace(/\s/g, '') + '.pdf';
    }

    GB.generate({
      school: s || templateSchool(), stage: st, pdf: p, names: list,
      fontFamily: state.font, fontSize: state.size, alignment: state.align, color: state.color,
      onProgress: function (v, msg) { setProgress(v); status(msg, 'info', v < 100); }
    }).then(function (bytes) {
      GB.download(bytes, fname);
      busy = false;
      el.generateBtn.disabled = false;
      setProgress(100);
      status('تم إنشاء السجل بنجاح (' + toArabicDigits(list.length) + ' اسم) — جارٍ التنزيل 🎉', 'ok');
      toast('تم التحميل: ' + fname, 'ok');
    })['catch'](function (err) {
      console.error(err);
      busy = false;
      el.generateBtn.disabled = false;
      el.progress.classList.remove('on');
      status('حدث خطأ: ' + err.message, 'err');
      toast('تعذر إنشاء السجل', 'err');
    });
  });

  /* ---------------------------- تبديل النسخ ------------------------------ */
  function initSwitch() {
    var toL = $('toLegacy');
    if (toL) {
      toL.addEventListener('click', function () {
        try { localStorage.setItem('mansa_version', 'legacy'); } catch (e) {}
      });
    }
  }

  /* ------------------------------ الإقلاع ------------------------------ */
  function boot() {
    var savedTheme = 'light';
    try { savedTheme = localStorage.getItem('mansa_theme') || 'light'; } catch (e) {}
    setTheme(savedTheme);

    load();

    if (!SCHOOLS.length) {
      el.schoolGrid.innerHTML = '<div class="note">لم يتم العثور على مدارس — راجع ملف assets/js/schools.js</div>';
      return;
    }

    if (!state.schoolId) { state.schoolId = SCHOOLS[0].id; }
    if (state.schoolId !== CUSTOM && state.schoolId !== SCHOOLS[0].id) {
      var found = false, i;
      for (i = 0; i < SCHOOLS.length; i++) { if (SCHOOLS[i].id === state.schoolId) found = true; }
      if (!found) { state.schoolId = SCHOOLS[0].id; }
    }

    buildFontSelect();
    el.fontSelect.value = state.font;
    var meta = GB.findFont(state.font);
    el.fontLabel.textContent = meta ? meta.label.split('—')[0].trim() : 'النظام';

    el.fontSize.value = state.size;
    el.sizeLabel.textContent = toArabicDigits(state.size);

    setColor(state.color);

    var alignBtns = el.alignGroup.querySelectorAll('button'), j;
    for (j = 0; j < alignBtns.length; j++) {
      alignBtns[j].classList.toggle('on', alignBtns[j].getAttribute('data-align') === state.align);
    }
    el.alignLabel.textContent = ALIGN_AR[state.align];

    el.customType.value = state.customType;
    el.customNames.value = '';

    if (isCustom()) {
      buildSchools();
      el.manualBox.classList.add('on');
      el.autoNames.style.display = 'none';
      el.stageField.style.display = 'none';
      el.classField.style.display = 'none';
      setNamesStatus();
    } else {
      var s = school();
      if (!state.stageId || !hasStage(s, state.stageId)) { state.stageId = s.stages[0].id; }
      var st = stage();
      if (!state.pdfId || !hasPdf(st, state.pdfId)) { state.pdfId = st.pdfs[0].id; }
      if (!state.classId || !hasClass(st, state.classId)) { state.classId = st.classes[0].id; }

      buildSchools(); buildStages(); buildPdfs(); buildClasses();
      loadClassNames();
    }

    updateBadges();
    initReveal(); initStats(); initHeroGlow(); initSignature(); initCalculator();
    initSwitch();
    drawPreview();
    GB.ensureFontLoaded(state.font).then(drawPreview);

    if (/[?#&]c=/.test(location.search + location.hash)) {
      setTimeout(function () {
        var a = document.getElementById('app');
        if (a) { a.scrollIntoView(); }
      }, 420);
    }

    window.addEventListener('resize', drawPreview);
  }

  function hasStage(s, id) {
    if (!s) { return false; }
    for (var i = 0; i < s.stages.length; i++) { if (s.stages[i].id === id) return true; }
    return false;
  }
  function hasPdf(st, id) {
    if (!st) { return false; }
    for (var i = 0; i < st.pdfs.length; i++) { if (st.pdfs[i].id === id) return true; }
    return false;
  }
  function hasClass(st, id) {
    if (!st) { return false; }
    for (var i = 0; i < st.classes.length; i++) { if (st.classes[i].id === id) return true; }
    return false;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
}());
