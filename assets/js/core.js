/* ============================================================================
    core.js — محرك توليد السجلات (يعمل مع النسخة الحديثة والنسخة القديمة)
   written in ES5 on purpose so it runs on old browsers & old WebViews
    (var / function / Promise chains — no arrow functions, no template strings)
   ========================================================================== */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------------ *
   *  الخطوط المتاحة
   *  families : المواصفة المستخدمة في رابط خطوط Google (للتحميل الكسول)
   *  label    : الاسم العربي
   *  sample   : نص تجريبي للمعاينة
   * ------------------------------------------------------------------ */
  var FONTS = [
    { group: '✦ خطوط حديثة وعصرية', items: [
      { value: 'Cairo',                   label: 'كايرو — Cairo',            families: 'Cairo:wght@400;600;700;900' },
      { value: 'Vazirmatn',               label: 'وزیر — Vazirmatn',         families: 'Vazirmatn:wght@400;600;700;900' },
      { value: 'Tajawal',                 label: 'تجوال — Tajawal',          families: 'Tajawal:wght@400;500;700;900' },
      { value: 'Almarai',                 label: 'المراعي — Almarai',        families: 'Almarai:wght@400;700;800' },
      { value: 'IBM Plex Sans Arabic',    label: 'بلكس عربي — IBM Plex',     families: 'IBM+Plex+Sans+Arabic:wght@400;600;700' },
      { value: 'Alexandria',              label: 'الإسكندرية — Alexandria',  families: 'Alexandria:wght@400;500;700' },
      { value: 'Changa',                  label: 'تشانجا — Changa',          families: 'Changa:wght@400;600;700' },
      { value: 'Mada',                    label: 'مدى — Mada',               families: 'Mada:wght@400;500;700' },
      { value: 'Harmattan',               label: 'هارمتان — Harmattan',      families: 'Harmattan:wght@400;700' },
      { value: 'El Messiri',              label: 'المسيري — El Messiri',     families: 'El+Messiri:wght@400;600;700' }
    ]},
    { group: '✒ خطوط كلاسيكية ونَسَخية', items: [
      { value: 'Amiri',                   label: 'أميري — Amiri',            families: 'Amiri:wght@400;700' },
      { value: 'Noto Naskh Arabic',       label: 'نوتو نسخ — Naskh',         families: 'Noto+Naskh+Arabic:wght@400;700' },
      { value: 'Lateef',                  label: 'لضيف — Lateef',            families: 'Lateef:wght@400;700' },
      { value: 'Scheherazade New',        label: 'شهرزاد — Scheherazade',    families: 'Scheherazade+New:wght@400;700' },
      { value: 'Katibeh',                 label: 'كتيبة — Katibeh',          families: 'Katibeh:wght@400;700' }
    ]},
    { group: '🏛 خطوط كوفية وزخرفية', items: [
      { value: 'Noto Kufi Arabic',        label: 'نوتو كوفي — Kufi',         families: 'Noto+Kufi+Arabic:wght@400;700;900' },
      { value: 'Reem Kufi',               label: 'ريم كوفي — Reem Kufi',     families: 'Reem+Kufi:wght@400;700' },
      { value: 'Lalezar',                 label: 'لاليزار — Lalezar',        families: 'Lalezar' },
      { value: 'Blaka',                   label: 'بلاكا — Blaka',            families: 'Blaka' },
      { value: 'Qahiri',                  label: 'قاهري — Qahiri',           families: 'Qahiri' }
    ]},
    { group: '✍ خطوط بخط اليد / رقية', items: [
      { value: 'Marhey',                  label: 'مِرِح — Marhey',            families: 'Marhey:wght@400;700' },
      { value: 'Handjet',                 label: 'هندجيت — Handjet',         families: 'Handjet:wght@300;400;700' },
      { value: 'Vibes',                   label: 'فايبس — Vibes',            families: 'Vibes' },
      { value: 'Aref Ruqaa',              label: 'عارف رقعة — Aref Ruqaa',   families: 'Aref+Ruqaa:wght@400;700' },
      { value: 'Aref Ruqaa Ink',          label: 'رقعة إنك — Ruqaa Ink',     families: 'Aref+Ruqaa+Ink:wght@400;700' },
      { value: 'Rakkas',                  label: 'رَكّاس — Rakkas',           families: 'Rakkas' },
      { value: 'Gulzar',                  label: 'گُلزار — Gulzar',           families: 'Gulzar' }
    ]}
  ];

  var MAX_NAMES = 50;      /* أقصى عدد أسماء يُكتب في الصفحة الواحدة */
  var FALLBACK = '"Segoe UI", Tahoma, Arial, sans-serif';
  var AR_SAMPLE = 'اسم الطالب التجريبي محمد';

  /* --------------------------- أدوات عامة --------------------------- */

  function allFonts() {
    var out = [];
    for (var i = 0; i < FONTS.length; i++) {
      out = out.concat(FONTS[i].items);
    }
    return out;
  }

  function findFont(value) {
    var list = allFonts(), i;
    for (i = 0; i < list.length; i++) {
      if (list[i].value === value) { return list[i]; }
    }
    return null;
  }

  function classLabel(cls) {
    if (cls.label) { return cls.label; }
    var parts = String(cls.id).split('-');
    return 'الفصل ' + parts[parts.length - 1];
  }

  function url(path) {
    /* encodeURI حتى تعمل المجلدات والأسماء العربية على كل المتصفحات */
    try { return encodeURI(path); } catch (e) { return path; }
  }

  /* ------------------------- تحميل الخطوط كسولاً ------------------------ */

  var fontSheets = {};   /* value -> عنصر <link> */
  var loadedFonts = {};  /* value -> true بعد نجاح التحميل فعلياً */

  function injectFontSheet(value, meta) {
    if (fontSheets[value]) { return fontSheets[value]; }
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + meta.families + '&display=swap';
    l.setAttribute('data-font', value);
    document.head.appendChild(l);
    fontSheets[value] = l;
    return l;
  }

  /* ننتظر حتى يقرأ المتصفح ملف CSS قبل أن نطلب تحميل الخط */
  function sheetReady(link) {
    return new Promise(function (resolve) {
      var done = false;
      function ok() { if (!done) { done = true; resolve(true); } }
      if (link.addEventListener) {
        link.addEventListener('load', ok, false);
        link.addEventListener('error', ok, false);
      }
      setTimeout(ok, 5000);
      if (link.sheet) { setTimeout(ok, 80); }
    });
  }

  function loadFontFaces(value) {
    if (!(document.fonts && document.fonts.load)) { return Promise.resolve(false); }
    /* مهم: نمرر نصاً عربياً حتى يتم تحميل جزء اللغة العربية من الخط */
    return document.fonts.load('700 16px "' + value + '"', AR_SAMPLE).then(function (faces) {
      return !!(faces && faces.length);
    })['catch'](function () { return false; });
  }

  function ensureFontLoaded(value) {
    if (!value || value === 'system') { return Promise.resolve(true); }

    var meta = findFont(value);
    if (!meta) { return Promise.resolve(false); }
    if (loadedFonts[value]) { return Promise.resolve(true); }

    var link = injectFontSheet(value, meta);

    return sheetReady(link).then(function () {
      return loadFontFaces(value);
    }).then(function (ok) {
      if (ok) { loadedFonts[value] = true; return true; }
      /* محاولة ثانية: قد يحتاج المتصفح طلباً إضافياً لجزء العربية */
      return loadFontFaces(value).then(function (ok2) {
        loadedFonts[value] = !!ok2;
        return !!ok2;
      });
    })['catch'](function () {
      loadedFonts[value] = false;
      return false;
    });
  }

  /* كشف الخط بمقارنة العرض — أدق من document.fonts.check */
  function isFontAvailable(value) {
    if (!value || value === 'system') { return true; }
    if (loadedFonts[value]) { return true; }

    var probe = ['monospace', 'serif', 'sans-serif'], i, base, list = allFonts(), known = false;
    for (i = 0; i < list.length; i++) { if (list[i].value === value) { known = true; } }
    if (!known) { return false; }

    var span = document.createElement('span');
    span.style.cssText = 'position:absolute;left:-9999px;top:-9999px;font-size:72px;' +
                         'line-height:normal;visibility:hidden;white-space:nowrap;font-weight:700;';
    span.textContent = AR_SAMPLE;
    document.body.appendChild(span);

    for (i = 0; i < probe.length; i++) {
      span.style.fontFamily = probe[i];
      base = span.offsetWidth;
      span.style.fontFamily = '"' + value + '",' + probe[i];
      if (span.offsetWidth !== base) {
        document.body.removeChild(span);
        return true;
      }
    }
    document.body.removeChild(span);
    return false;
  }

  function fontStack(value) {
    if (!value || value === 'system') { return FALLBACK; }
    if (!isFontAvailable(value)) { return FALLBACK; }
    return '"' + value + '",' + FALLBACK;
  }

  /* ------------------------- قراءة الملفات (نص) ------------------------- */

  function requestText(path, onProgress) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url(path), true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200 || (xhr.status === 0 && xhr.responseText)) {
            resolve(xhr.responseText);
          } else {
            reject(new Error('تعذر تحميل الملف: ' + path));
          }
        }
      };
      xhr.onerror = function () { reject(new Error('تعذر تحميل الملف: ' + path)); };
      if (onProgress && xhr.upload) { /* لا شيء */ }
      xhr.send();
    });
  }

  function requestArrayBuffer(path, onProgress) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url(path), true);
      xhr.responseType = 'arraybuffer';
      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = function (e) {
          if (e.lengthComputable) { onProgress(e.loaded / e.total); }
        };
      } else if (onProgress) {
        onProgress(0);
      }
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200 || (xhr.status === 0 && xhr.response)) {
            resolve(xhr.response);
          } else {
            reject(new Error('تعذر تحميل ملف الـ PDF: ' + path));
          }
        }
      };
      xhr.onerror = function () { reject(new Error('تعذر تحميل ملف الـ PDF: ' + path)); };
      xhr.send();
    });
  }

  function splitNames(text) {
    var lines = String(text).split(/\r?\n/), out = [], i, n;
    for (i = 0; i < lines.length; i++) {
      n = lines[i].replace(/[ \t\u00a0]+$/g, '').replace(/^[ \t\u00a0]+/g, '').trim();
      if (n) { out.push(n); }
      if (out.length >= MAX_NAMES) { break; }
    }
    return out;
  }

  function loadClassNames(school, cls) {
    return requestText(school.folder + cls.file).then(splitNames);
  }

  function readTextFile(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(String(fr.result)); };
      fr.onerror = function () { reject(new Error('تعذر قراءة الملف')); };
      fr.readAsText(file, 'utf-8');
    });
  }

  /* ---------------------- رسم الاسم داخل خانة واحدة ---------------------- */

  /**
   * يرسم اسم الطالب في كانفس بأبعاد الخانة الحقيقية داخل ملف الـ PDF
   * alignment : 'right' | 'center' | 'left'
   */
  function renderNameCanvas(opts) {
    var name     = opts.name;
    var boxWidth = opts.boxWidth;
    var boxH     = opts.boxHeight;
    var scale    = opts.scale || 4;
    var family   = opts.fontFamily;
    var maxSize  = parseFloat(opts.fontSize) || 12;
    var align    = opts.alignment || 'right';
    var color    = opts.color || '#000000';

    var canvas = document.createElement('canvas');
    canvas.width  = Math.max(1, Math.round(boxWidth * scale));
    canvas.height = Math.max(1, Math.round(boxH * scale));
    var ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    var maxH = boxH * 0.85;
    var size = Math.min(maxSize, maxH);

    ctx.font = 'bold ' + size + 'px ' + family;
    while (size > 4 && ctx.measureText(name).width > boxWidth - 4) {
      size -= 0.25;
      ctx.font = 'bold ' + size + 'px ' + family;
    }

    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    if ('direction' in ctx) { ctx.direction = 'rtl'; }

    var pad = 2, x;
    if (align === 'center') {
      ctx.textAlign = 'center';
      x = boxWidth / 2;
    } else if (align === 'left') {
      ctx.textAlign = 'left';
      x = pad;
    } else {
      ctx.textAlign = 'right';
      x = boxWidth - pad;
    }

    ctx.fillText(name, x, boxH / 2);
    return canvas;
  }

  function canvasToArrayBuffer(canvas) {
    return new Promise(function (resolve, reject) {
      if (canvas.toBlob) {
        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('تعذر تحويل الصورة')); return; }
          var fr = new FileReader();
          fr.onload = function () { resolve(fr.result); };
          fr.onerror = function () { reject(new Error('تعذر قراءة الصورة')); };
          fr.readAsArrayBuffer(blob);
        }, 'image/png');
      } else {
        resolve(dataURLToBuffer(canvas.toDataURL('image/png')));
      }
    });
  }

  function dataURLToBuffer(urlStr) {
    var parts = urlStr.split(','), bin = atob(parts[1]), len = bin.length, buf = new ArrayBuffer(len), view = new Uint8Array(buf), i;
    for (i = 0; i < len; i++) { view[i] = bin.charCodeAt(i); }
    return buf;
  }

  /* ---------------------------- توليد الـ PDF ---------------------------- */

  /**
   * opts = { school, stage, pdf, names, fontFamily, fontSize, alignment, onProgress }
   */
  function generate(opts) {
    var progress = opts.onProgress || function () {};
    var school = opts.school, pdf = opts.pdf, names = opts.names || [];
    var align = opts.alignment || 'right';

    if (!global.PDFLib) {
      return Promise.reject(new Error('لم يتم تحميل مكتبة PDFLib — تأكد من الاتصال بالإنترنت.'));
    }
    if (!names.length) {
      return Promise.reject(new Error('لا توجد أسماء للكتابة.'));
    }

    progress(2, 'تحضير ملف السجل…');

    return ensureFontLoaded(opts.fontFamily)
      .then(function () {
        var family = fontStack(opts.fontFamily);
        return requestArrayBuffer(pdf.file).then(function (buf) {
          return global.PDFLib.PDFDocument.load(buf).then(function (doc) {
            return { doc: doc, family: family };
          });
        });
      })
      .then(function (ctx) {
        var doc = ctx.doc, family = ctx.family;
        var pages = doc.getPages();
        var pageMap = pdf.pages;
        var pageKeys = Object.keys(pageMap).sort(function (a, b) { return Number(a) - Number(b); });
        var totalPages = pageKeys.length;
        var firstKey = Number(pageKeys[0]);
        var lastKey = Number(pageKeys[pageKeys.length - 1]);
        var cache = {};             /* إعادة استخدام نفس الصورة في كل الصفحات */
        var chain = Promise.resolve();

        progress(8, 'جارٍ توزيع الأسماء (' + names.length + ' اسم)…');

        pageKeys.forEach(function (key) {
          chain = chain.then(function () {
            var pageIndex = Number(key) - 1;
            if (pageIndex < 0 || pageIndex >= pages.length) { return; }
            var data = pageMap[key];
            var page = pages[pageIndex];
            var cellHeight = data.stepY * 0.85;

            /* يرسم الأسماء واحداً تلو الآخر وينتظر انتهاء كل صورة قبل 다음ها */
            function step(i) {
              if (i >= names.length) {
                progress(8 + Math.round(((Number(key) - firstKey + 1) / totalPages) * 88),
                         'الصفحة ' + key + ' من ' + lastKey + ' اكتملت ✔');
                return null;
              }

              var cellTopY = data.posY - (i * data.stepY);
              var cy = cellTopY - (data.stepY / 2);
              var cacheKey = names[i] + '|' + data.maxTextWidth + '|' + cellHeight.toFixed(2) +
                             '|' + family + '|' + opts.fontSize + '|' + align + '|' + (opts.color || '#000000');

              function draw(img) {
                var d = img.scale(0.25);
                page.drawImage(img, {
                  x: data.posX - d.width,
                  y: cy - (d.height / 2),
                  width: d.width,
                  height: d.height
                });
                return step(i + 1);
              }

              if (cache[cacheKey]) { return draw(cache[cacheKey]); }

              var canvas = renderNameCanvas({
                name: names[i],
                boxWidth: data.maxTextWidth,
                boxHeight: cellHeight,
                fontFamily: family,
                fontSize: opts.fontSize,
                alignment: align,
                color: opts.color
              });

              return canvasToArrayBuffer(canvas)
                .then(function (buf) { return doc.embedPng(new Uint8Array(buf)); })
                .then(function (img) { cache[cacheKey] = img; return draw(img); });
            }

            /* تنفيذ تدريجي حتى لا تتجمّد الواجهة على الأجهزة الضعيفة */
            return new Promise(function (resolve, reject) {
              setTimeout(function () {
                try { resolve(step(0)); } catch (e) { reject(e); }
              }, 0);
            });
          });
        });

        return chain.then(function () {
          progress(97, 'ضغط الملف وحفظه…');
          return doc.save();
        });
      });
  }

  /* ----------------------------- تنزيل الملف ----------------------------- */

  function download(bytes, filename) {
    var blob = new Blob([bytes], { type: 'application/pdf' });

    /* المتصفحات القديمة جداً */
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, filename);
      return;
    }

    var urlObj;
    try {
      urlObj = global.URL.createObjectURL(blob);
    } catch (e) { urlObj = null; }

    if (!urlObj) {
      var w = global.open('', '_blank');
      if (w && w.document) { w.document.write('<embed src="' + dataURLToBase64(blob) + '">'); }
      return;
    }

    var a = document.createElement('a');
    a.href = urlObj;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    global.setTimeout(function () {
      document.body.removeChild(a);
      try { global.URL.revokeObjectURL(urlObj); } catch (e) {}
    }, 1500);
  }

  function dataURLToBase64(blob) {
    var fr = new FileReader();
    fr.onload = function () { global.open(fr.result, '_blank'); };
    fr.readAsDataURL(blob);
    return '';
  }

  /* ------------------------------ التصدير ------------------------------ */

  global.GradeBook = {
    FONTS: FONTS,
    MAX_NAMES: MAX_NAMES,
    SCHOOLS: (typeof SCHOOLS !== 'undefined' && SCHOOLS) ? SCHOOLS : (global.SCHOOLS || []),
    allFonts: allFonts,
    findFont: findFont,
    classLabel: classLabel,
    fontStack: fontStack,
    isFontAvailable: isFontAvailable,
    ensureFontLoaded: ensureFontLoaded,
    loadClassNames: loadClassNames,
    splitNames: splitNames,
    readTextFile: readTextFile,
    renderNameCanvas: renderNameCanvas,
    canvasToArrayBuffer: canvasToArrayBuffer,
    generate: generate,
    download: download
  };

}(window));
