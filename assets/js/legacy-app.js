/* ============================================================================
    legacy-app.js — منطق النسخة المبسطة (ES5 بالكامل بدون let/const/Arrow)
   ========================================================================== */
(function () {
  'use strict';

  var GB = window.GradeBook;
  var SCHOOLS = window.SCHOOLS || [];
  var CUSTOM = '__custom__';

  var state = {
    schoolId: null, stageId: null, pdfId: null, classId: null,
    font: 'Cairo', size: 12, align: 'right', color: '#000000', names: [],
    customType: 'first_secondary'
  };

  var TEMPLATES = {
    first_secondary:          { stageId: 'first_secondary',  pdfId: 'default' },
    second_secondary_bac:     { stageId: 'second_secondary', pdfId: 'bac'     },
    second_secondary_general: { stageId: 'second_secondary', pdfId: 'general'  }
  };

  function $(id) { return document.getElementById(id); }

  var el = {
    schoolTable: $('schoolTable'), schoolHint: $('schoolHint'),
    stageSeg: $('stageSeg'), pdfSelect: $('pdfSelect'), pdfWrap: $('pdfWrap'),
    stageStep: $('stageStep'), classStep: $('classStep'),
    classTable: $('classTable'), classHint: $('classHint'),
    autoStep: $('autoStep'), autoTitle: $('autoTitle'), autoSub: $('autoSub'),
    manualStep: $('manualStep'), customType: $('customType'), customNames: $('customNames'),
    customCount: $('customCount'), customFileBtn: $('customFileBtn'), customFile: $('customFile'),
    fontSelect: $('fontSelect'), fontSize: $('fontSize'), fontHint: $('fontHint'),
    textColor: $('textColor'), preview: $('preview'), previewHint: $('previewHint'),
    genBtn: $('genBtn'), bar: $('bar'), barFill: $('barFill'), status: $('status'),
    badgeSchool: $('badgeSchool'), badgeStage: $('badgeStage'), badgeClass: $('badgeClass')
  };

  /* ------------------------------ مساعدات ------------------------------ */
  function isCustom() { return state.schoolId === CUSTOM; }
  function tplSchool() { return SCHOOLS.length ? SCHOOLS[0] : null; }

  function school() {
    if (isCustom()) { return null; }
    for (var i = 0; i < SCHOOLS.length; i++) { if (SCHOOLS[i].id === state.schoolId) { return SCHOOLS[i]; } }
    return SCHOOLS[0] || null;
  }
  function stage() {
    var base = isCustom() ? tplSchool() : school();
    if (!base) { return null; }
    var sid = isCustom() ? TEMPLATES[state.customType].stageId : state.stageId;
    for (var i = 0; i < base.stages.length; i++) { if (base.stages[i].id === sid) { return base.stages[i]; } }
    return base.stages[0] || null;
  }
  function pdfOf() {
    var st = stage();
    if (!st) { return null; }
    var pid = isCustom() ? TEMPLATES[state.customType].pdfId : state.pdfId;
    for (var i = 0; i < st.pdfs.length; i++) { if (st.pdfs[i].id === pid) { return st.pdfs[i]; } }
    return st.pdfs[0] || null;
  }
  function klass() {
    var st = stage();
    if (!st || isCustom()) { return null; }
    for (var i = 0; i < st.classes.length; i++) { if (st.classes[i].id === state.classId) { return st.classes[i]; } }
    return null;
  }
  function names() { return isCustom() ? GB.splitNames(el.customNames.value) : state.names; }
  function txt(n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); }
  function addClass(node, cls) { node.className = node.className ? node.className + ' ' + cls : cls; }
  function on(node, fn, ev) {
    if (!node) { return; }
    if (node.addEventListener) { node.addEventListener(ev || 'click', fn, false); }
    else { node.attachEvent('on' + (ev || 'click'), fn); }
  }
  function opt(value, text, selected) {
    var o = document.createElement('option');
    o.value = value;
    o.appendChild(document.createTextNode(text));
    if (selected) { o.selected = true; }
    return o;
  }
  function setStatus(msg, kind) {
    el.status.innerHTML = '';
    if (msg) { el.status.appendChild(document.createTextNode(msg)); }
    addClass(el.status, kind || '');
  }
  function setText(node, html) { if (node) { node.innerHTML = html; } }

  /* --------------------------- بطاقات المدرسة --------------------------- */
  function buildSchools() {
    var tb = el.schoolTable.getElementsByTagName('tbody')[0];
    tb.innerHTML = '';

    function addRow(logo, name, sub, selected, custom, handler) {
      var tr = document.createElement('tr');
      var td1 = document.createElement('td'); td1.className = 'em';
      var box = document.createElement('span');
      box.appendChild(document.createTextNode(logo));
      td1.appendChild(box);

      var td2 = document.createElement('td');
      var b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = name + (sub ? '<small>' + sub + '</small>' : '');
      if (selected) { addClass(b, 'on'); }
      if (custom) { addClass(b, 'custom'); }
      on(b, handler);
      td2.appendChild(b);

      tr.appendChild(td1); tr.appendChild(td2);
      tb.appendChild(tr);
    }

    var i, j;
    for (i = 0; i < SCHOOLS.length; i++) {
      (function (s) {
        var count = 0, m;
        for (m = 0; m < s.stages.length; m++) { count += s.stages[m].classes.length; }
        addRow(s.logo || '🏫', s.name,
               txt(count) + ' فصلاً دراسياً',
               s.id === state.schoolId, false,
               function () { pickSchool(s.id); });
      }(SCHOOLS[i]));
    }

    addRow('➕', 'مدرستي غير موجودة', 'اكتب الأسماء بنفسك واختر نوع السجل',
           isCustom(), true,
           function () { pickSchool(CUSTOM); });

    var s0 = school();
    if (s0) {
      var total = 0;
      for (j = 0; j < s0.stages.length; j++) { total += s0.stages[j].classes.length; }
      setText(el.schoolHint, 'المدرسة المختارة: <b>' + s0.name + '</b> — ' + txt(total) + ' فصلاً متاحاً.');
    } else {
      setText(el.schoolHint, 'الوضع اليدوي: اكتب أسماء طلابك ثم اضغط زر التوليد.');
    }
  }

  /* ----------------------------- تبويب المرحلة --------------------------- */
  function buildStages() {
    var s = school();
    el.stageSeg.innerHTML = '';
    if (!s) { return; }
    s.stages.forEach(function (st) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = st.name;
      if (st.id === state.stageId) { addClass(b, 'on'); }
      on(b, function () {
        state.stageId = st.id;
        state.pdfId = st.pdfs[0].id;
        state.classId = st.classes[0].id;
        buildStages(); buildPdfs(); buildClasses(); updateBadges();
        loadNames();
      });
      el.stageSeg.appendChild(b);
    });
  }

  function buildPdfs() {
    var st = stage();
    el.pdfSelect.innerHTML = '';
    if (!st) { return; }
    if (st.pdfs.length > 1) {
      el.pdfWrap.style.display = '';
      st.pdfs.forEach(function (p) {
        el.pdfSelect.appendChild(opt(p.id, p.label, p.id === state.pdfId));
      });
    } else {
      el.pdfWrap.style.display = 'none';
      el.pdfSelect.appendChild(opt('', st.pdfs[0].label));
    }
  }

  /* ------------------------------- الفصول -------------------------------- */
  function buildClasses() {
    var st = stage();
    var tb = el.classTable.getElementsByTagName('tbody')[0];
    tb.innerHTML = '';
    if (!st) { return; }

    var list = st.classes, perRow = 5, i, j;
    for (i = 0; i < list.length; i += perRow) {
      var tr = document.createElement('tr');
      for (j = i; j < i + perRow && j < list.length; j++) {
        (function (c) {
          var td = document.createElement('td');
          var b = document.createElement('button');
          b.type = 'button';
          b.innerHTML = GB.classLabel(c) + '<small>' + c.id + '</small>';
          if (c.id === state.classId) { addClass(b, 'on'); }
          on(b, function () {
            state.classId = c.id;
            buildClasses(); updateBadges();
            loadNames();
          });
          td.appendChild(b);
          tr.appendChild(td);
        }(list[j]));
      }
      for (var k = list.length - i; k < perRow; k++) {
        var td2 = document.createElement('td');
        td2.innerHTML = '&nbsp;';
        tr.appendChild(td2);
      }
      tb.appendChild(tr);
    }
    var c = klass();
    setText(el.classHint, c ? 'الفصل المختار: <b>' + GB.classLabel(c) + '</b> (ملف <span class="mono">' + c.file + '</span>)' : '');
  }

  function buildFonts() {
    el.fontSelect.appendChild(opt('system', 'خط النظام (افتراضي)', true));
    GB.FONTS.forEach(function (g) {
      var og = document.createElement('optgroup');
      og.label = g.group;
      g.items.forEach(function (f) { og.appendChild(opt(f.value, f.label, false)); });
      el.fontSelect.appendChild(og);
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

    buildSchools(); buildStages(); buildPdfs(); buildClasses();

    if (isCustom()) {
      el.stageStep.style.display = 'none';
      el.classStep.style.display = 'none';
      el.autoStep.style.display = 'none';
      el.manualStep.style.display = '';
      setNamesStatus(); updateBadges(); drawPreview();
      setStatus('اكتب أسماء طلابك ثم اضغط زر التوليد', 'info');
    } else {
      el.stageStep.style.display = '';
      el.classStep.style.display = '';
      el.autoStep.style.display = '';
      el.manualStep.style.display = 'none';
      updateBadges(); drawPreview();
      loadNames();
    }
  }

  function updateBadges() {
    var s = school(), st = stage(), p = pdfOf(), c = klass();
    if (isCustom()) {
      setText(el.badgeSchool, '➕ مدرستي');
      setText(el.badgeStage, '📄 ' + el.customType.options[el.customType.selectedIndex].text);
      setText(el.badgeClass, '✍️ ' + txt(names().length) + ' اسم');
      return;
    }
    setText(el.badgeSchool, (s ? (s.logo || '🏫') + ' ' + s.short : '🏫 مدرسة'));
    setText(el.badgeStage, st ? '📚 ' + st.short : '📚 مرحلة');
    setText(el.badgeClass, c ? '🚪 ' + GB.classLabel(c) : '🚪 فصل');
    if (p && st && st.pdfs.length > 1) {
      setText(el.badgeStage, '📚 ' + st.short + ' • ' + p.label);
    }
  }

  /* ------------------- تحميل الأسماء تلقائياً ------------------------- */
  function loadNames() {
    var s = school(), c = klass();
    if (isCustom() || !s || !c) { return; }

    setText(el.autoTitle, 'جارٍ تحميل أسماء ' + GB.classLabel(c) + '…');
    setText(el.autoSub, 'ملف ' + c.file);

    GB.loadClassNames(s, c).then(function (list) {
      state.names = list;
      setText(el.autoTitle, 'تم تحميل ' + txt(list.length) + ' اسماً تلقائياً');
      setText(el.autoSub, GB.classLabel(c) + ' — ' + c.file);
      updateBadges(); drawPreview();
      setStatus('جاهز — اضغط «توليد السجل وتحميله»', 'info');
    }, function (e) {
      setText(el.autoTitle, 'تعذر تحميل أسماء الفصل');
      setText(el.autoSub, e.message || 'تأكد من وجود ملف ' + c.file);
      setStatus('تعذر تحميل الأسماء', 'err');
    });
  }

  function setNamesStatus() {
    var n = GB.splitNames(el.customNames.value).length;
    setText(el.customCount, 'عدد الأسماء: <b>' + txt(n) + '</b>');
    updateBadges(); drawPreview();
  }

  on(el.customNames, setNamesStatus, 'input');
  on(el.customNames, setNamesStatus, 'keyup');
  on(el.customType, function () {
    state.customType = el.customType.value; updateBadges(); drawPreview();
  }, 'change');
  on(el.customFileBtn, function () { el.customFile.click(); });
  on(el.customFile, function () {
    var f = this.files && this.files[0];
    if (!f) { return; }
    GB.readTextFile(f).then(function (x) {
      el.customNames.value = GB.splitNames(x).join('\n');
      setNamesStatus();
      setStatus('تم استيراد الملف ' + f.name, 'ok');
    }, function () { setStatus('تعذر قراءة الملف', 'err'); });
  }, 'change');

  /* ------------------------------- الخط --------------------------------- */
  on(el.fontSelect, function () {
    state.font = this.value;
    var meta = GB.findFont(state.font);
    setText(el.fontHint, meta ? 'جارٍ تحميل الخط «' + meta.label + '» ...' : 'سيتم استخدام خط النظام.');
    GB.ensureFontLoaded(state.font).then(function (ok) {
      setText(el.fontHint, ok
        ? (meta ? 'الخط المستخدم: ' + meta.label : 'الخط المستخدم: خط النظام')
        : '⚠ تعذر تحميل الخط — سيُستخدم خط بديل.');
      drawPreview();
    }, function () {
      setText(el.fontHint, '⚠ تعذر تحميل الخط — سيُستخدم خط بديل.');
      drawPreview();
    });
  }, 'change');

  on(el.fontSize, function () {
    var v = parseInt(this.value, 10);
    if (isNaN(v)) { v = 12; }
    if (v < 8) { v = 8; }
    if (v > 20) { v = 20; }
    state.size = v; this.value = v;
    drawPreview();
  }, 'change');

  on(el.textColor, function () {
    state.color = this.value || '#000000';
    drawPreview();
  }, 'change');

  function initAlign() {
    var inputs = document.getElementsByTagName('input');
    for (var i = 0; i < inputs.length; i++) {
      (function (r) {
        if (r.name !== 'align') { return; }
        var lbl = r.parentNode;
        if (r.checked) { addClass(lbl, 'on'); }
        on(r, function () {
          state.align = r.value;
          var all = document.getElementsByTagName('input');
          for (var j = 0; j < all.length; j++) {
            if (all[j].name === 'align') { all[j].parentNode.className = ''; }
          }
          addClass(lbl, 'on');
          drawPreview();
        }, 'change');
      }(inputs[i]));
    }
  }

  /* ----------------------------- المعاينة ------------------------------- */
  function drawPreview() {
    var c = el.preview, ctx;
    try { ctx = c.getContext('2d'); } catch (e) { return; }
    if (!ctx) { return; }

    var p = pdfOf(), keys = [], k;
    if (p) { for (k in p.pages) { if (p.pages.hasOwnProperty(k)) { keys.push(k); } } }
    var data = keys.length ? p.pages[keys[0]] : { maxTextWidth: 100, stepY: 14 };

    var list = names();
    var sample = list.length ? list[0] : 'محمد عبد الله علي حسن';

    var cell = GB.renderNameCanvas({
      name: sample, boxWidth: data.maxTextWidth, boxHeight: data.stepY * 0.85,
      fontFamily: GB.fontStack(state.font), fontSize: state.size,
      alignment: state.align, color: state.color, scale: 4
    });

    var w = c.clientWidth || 600;
    if (w < 150) { w = 600; }
    var serialW = 40, gap = 12;
    var cellW = Math.max(90, w - serialW - gap);
    var cellH = Math.max(34, Math.round(cellW * (cell.height / cell.width)));
    var dispW = cellW + gap + serialW;
    var dispH = cellH + 10;

    c.style.width = dispW + 'px';
    c.style.height = dispH + 'px';
    c.width = dispW * 2;
    c.height = dispH * 2;
    ctx.setTransform(2, 0, 0, 2, 0, 0);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, dispW, dispH);

    ctx.strokeStyle = 'rgba(100,116,139,.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, dispH / 2 - .5); ctx.lineTo(dispW, dispH / 2 - .5);
    ctx.moveTo(0, dispH / 2 + .5); ctx.lineTo(dispW, dispH / 2 + .5);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(100,116,139,.35)';
    ctx.beginPath();
    ctx.moveTo(cellW + gap / 2, 4); ctx.lineTo(cellW + gap / 2, dispH - 4);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold ' + Math.max(12, Math.round(dispH * 0.3)) + 'px Cairo, Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if ('direction' in ctx) { ctx.direction = 'rtl'; }
    ctx.fillText(txt(1), cellW + gap + serialW / 2, dispH / 2);

    ctx.drawImage(cell, 0, 5, cellW, cellH);

    var meta = GB.findFont(state.font);
    var a3 = { right: 'يمين', center: 'وسط', left: 'يسار' };
    var cn = { '#000000': 'أسود', '#1d4ed8': 'أزرق', '#b91c1c': 'أحمر', '#047857': 'أخضر',
               '#7e22ce': 'بنفسجي', '#c2410c': 'برتقالي', '#0f766e': 'تركوازي', '#6b7280': 'رمادي' };
    setText(el.previewHint, (meta ? meta.label : 'خط النظام') + ' • ' + a3[state.align] +
      ' • ' + txt(state.size) + ' • ' + (cn[state.color] || 'لون مخصص'));
  }

  /* ------------------------------ التوليد ------------------------------- */
  var busy = false;
  on(el.genBtn, function () {
    if (busy) { return; }
    var st = stage(), p = pdfOf(), list = names(), s = school(), c = klass();
    if (!st || !p) { setStatus('اختر المدرسة والمرحلة أولاً', 'err'); return; }
    if (!isCustom() && !c) { setStatus('اختر الفصل أولاً', 'err'); return; }
    if (!list.length) {
      setStatus(isCustom() ? 'اكتب أسماء الطلاب أولاً' : 'لم يتم تحميل أسماء الفصل', 'err');
      if (isCustom()) { el.customNames.focus(); }
      return;
    }

    busy = true;
    el.genBtn.disabled = true;
    addClass(el.bar, 'on');
    el.barFill.style.width = '2%';
    setStatus('جارٍ تجهيز السجل ...', 'info');

    var fname = isCustom()
      ? 'سجل - ' + el.customType.options[el.customType.selectedIndex].text + '.pdf'
      : s.short + ' - ' + st.short + ' - ' + GB.classLabel(c).replace(/\s/g, '') + '.pdf';

    GB.generate({
      school: s || tplSchool(), stage: st, pdf: p, names: list,
      fontFamily: state.font, fontSize: state.size, alignment: state.align, color: state.color,
      onProgress: function (v, msg) {
        el.barFill.style.width = Math.max(0, Math.min(100, v)) + '%';
        setStatus(msg, 'info');
      }
    }).then(function (bytes) {
      GB.download(bytes, fname);
      busy = false;
      el.genBtn.disabled = false;
      el.barFill.style.width = '100%';
      setStatus('تم إنشاء السجل بنجاح (' + txt(list.length) + ' اسم) — جارٍ التنزيل', 'ok');
    }, function (err) {
      busy = false;
      el.genBtn.disabled = false;
      el.bar.className = 'bar';
      setStatus('خطأ: ' + (err && err.message ? err.message : 'حدث خطأ غير معروف'), 'err');
    });
  });

  /* ---------------------------- الأسئلة ------------------------------- */
  function faq(a, b) {
    on($(a), function () {
      var d = $(b);
      d.style.display = (d.style.display === 'block') ? 'none' : 'block';
    });
  }
  faq('q1', 'a1'); faq('q2', 'a2'); faq('q3', 'a3');

  /* ----------------------------- الإقلاع ------------------------------- */
  function boot() {
    if (!SCHOOLS.length) {
      setStatus('لم يتم العثور على بيانات مدارس — راجع assets/js/schools.js', 'err');
      return;
    }
    state.schoolId = SCHOOLS[0].id;
    state.stageId = SCHOOLS[0].stages[0].id;
    state.pdfId = SCHOOLS[0].stages[0].pdfs[0].id;
    state.classId = SCHOOLS[0].stages[0].classes[0].id;

    buildFonts();
    el.fontSelect.value = state.font;

    buildSchools(); buildStages(); buildPdfs(); buildClasses();
    initAlign();
    updateBadges();
    drawPreview();
    loadNames();

    on(el.pdfSelect, function () {
      if (this.value) { state.pdfId = this.value; updateBadges(); drawPreview(); }
    }, 'change');

    on(window, drawPreview, 'resize');
  }

  if (document.readyState === 'loading') {
    on(document, boot, 'DOMContentLoaded');
  } else { boot(); }
}());
