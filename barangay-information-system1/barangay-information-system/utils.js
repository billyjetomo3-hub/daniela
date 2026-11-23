/* ============================================================
   Shared helpers: escaping, formatting, modals, toasts, print
   ============================================================ */
(function () {
  var App = (window.App = window.App || {});

  App.esc = function (value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  };

  App.attr = function (value) {
    return App.esc(value);
  };

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  App.parseDate = function (iso) {
    if (!iso) return null;
    if (iso instanceof Date) return iso;
    var text = String(iso);
    var date = text.length > 10 ? new Date(text) : new Date(text + 'T00:00:00');
    return isNaN(date.getTime()) ? null : date;
  };

  App.fmtDate = function (iso, withYear) {
    var d = App.parseDate(iso);
    if (!d) return '—';
    var out = MONTHS[d.getMonth()] + ' ' + d.getDate();
    return withYear === false ? out : out + ', ' + d.getFullYear();
  };

  App.fmtLongDate = function (iso) {
    var d = App.parseDate(iso) || new Date();
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  };

  App.fmtDateTime = function (iso) {
    var d = App.parseDate(iso);
    if (!d) return '—';
    var h = d.getHours(), m = d.getMinutes();
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return App.fmtDate(d) + ' · ' + h + ':' + String(m).padStart(2, '0') + ' ' + ampm;
  };

  App.timeAgo = function (iso) {
    var d = App.parseDate(iso);
    if (!d) return '—';
    var secs = Math.floor((Date.now() - d.getTime()) / 1000);
    if (secs < 60) return 'just now';
    var mins = Math.floor(secs / 60);
    if (mins < 60) return mins + ' min ago';
    var hours = Math.floor(mins / 60);
    if (hours < 24) return hours + (hours === 1 ? ' hour ago' : ' hours ago');
    var days = Math.floor(hours / 24);
    if (days < 7) return days + (days === 1 ? ' day ago' : ' days ago');
    return App.fmtDate(d);
  };

  App.todayISO = function () {
    var d = new Date();
    var off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
  };

  App.age = function (birthDate) {
    var b = App.parseDate(birthDate);
    if (!b) return '—';
    var now = new Date();
    var age = now.getFullYear() - b.getFullYear();
    var m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return age;
  };

  App.ageGroup = function (birthDate) {
    var age = App.age(birthDate);
    if (age === '—') return 'Unknown';
    if (age < 1) return 'Infants (0-1)';
    if (age <= 5) return 'Children (2-5)';
    if (age <= 12) return 'Children (6-12)';
    if (age <= 17) return 'Teens (13-17)';
    if (age <= 29) return 'Youth (18-29)';
    if (age <= 44) return 'Adults (30-44)';
    if (age <= 59) return 'Adults (45-59)';
    if (age <= 64) return 'Seniors (60-64)';
    return 'Seniors (65+)';
  };

  App.money = function (value) {
    var n = Number(value || 0);
    return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  App.num = function (value) {
    return Number(value || 0).toLocaleString('en-PH');
  };

  App.initials = function (name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '—';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  App.fullName = function (r) {
    if (!r) return '—';
    return [r.firstName, r.middleName, r.lastName, r.suffix].filter(Boolean).join(' ');
  };

  App.title = function (text) {
    return String(text || '').replace(/\w\S*/g, function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1);
    });
  };

  App.debounce = function (fn, wait) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait || 220);
    };
  };

  App.uid = function (prefix) {
    return (prefix || 'ID') + '-' + Date.now().toString(36).toUpperCase() +
      Math.random().toString(36).slice(2, 5).toUpperCase();
  };

  App.highlight = function (text, query) {
    var safe = App.esc(text);
    if (!query) return safe;
    var q = query.trim();
    if (!q) return safe;
    var escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return safe.replace(new RegExp('(' + escapedQ + ')', 'ig'), '<mark>$1</mark>');
  };

  /* ---------------------------- icons ---------------------------- */
  var ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    users: '<path d="M17 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20"/><circle cx="9.5" cy="7" r="3.5"/><path d="M22 20v-1.5a4 4 0 0 0-3-3.87M16.5 3.6a3.5 3.5 0 0 1 0 6.8"/>',
    file: '<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5M9 13h6M9 17h4"/>',
    alert: '<path d="M10.3 3.9 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15v3M12 9v9M17 12v6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4.6a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 11a2 2 0 1 1 0 4Z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    print: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    home: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 22V12h6v10"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    doc: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M15 2v5h5"/><path d="M8 13h8M8 17h5"/>',
    gavel: '<path d="m14 13-7.5 7.5a2.1 2.1 0 0 1-3-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 21-6-6"/>',
    money: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
    grid: '<path d="M3 3h18v18H3z"/><path d="M3 9h18M9 3v18"/>',
    arrowup: '<path d="M12 19V5M5 12l7-7 7 7"/>'
  };

  App.icon = function (name, cls) {
    var body = ICONS[name] || ICONS.doc;
    return '<svg' + (cls ? ' class="' + cls + '"' : '') +
      ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      body + '</svg>';
  };

  /* ---------------------------- toasts ---------------------------- */
  App.toast = function (message, tone) {
    var root = document.getElementById('toast-root');
    if (!root) return;
    var el = document.createElement('div');
    el.className = 'toast ' + (tone || 'success');
    var glyph = tone === 'error' ? '!' : tone === 'info' ? 'i' : '✓';
    el.innerHTML = '<span class="toast-icon">' + glyph + '</span><div>' + App.esc(message) + '</div>';
    root.appendChild(el);
    setTimeout(function () {
      el.classList.add('leaving');
      setTimeout(function () { el.remove(); }, 220);
    }, 3400);
  };

  /* ---------------------------- modal ---------------------------- */
  App.openModal = function (opts) {
    var root = document.getElementById('modal-root');
    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    var size = opts.size ? ' modal-' + opts.size : '';
    backdrop.innerHTML =
      '<div class="modal' + size + '" role="dialog" aria-modal="true" aria-label="' + App.attr(opts.title || 'Dialog') + '">' +
        '<div class="modal-head">' +
          '<div><h3>' + App.esc(opts.title || '') + '</h3>' +
          (opts.subtitle ? '<p>' + App.esc(opts.subtitle) + '</p>' : '') + '</div>' +
          '<button class="modal-close" type="button" aria-label="Close">' + App.icon('x') + '</button>' +
        '</div>' +
        '<div class="modal-body">' + (opts.body || '') + '</div>' +
        (opts.footer ? '<div class="modal-foot">' + opts.footer + '</div>' : '') +
      '</div>';
    root.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    var api = {
      root: backdrop,
      panel: backdrop.querySelector('.modal'),
      body: backdrop.querySelector('.modal-body'),
      close: function () {
        backdrop.remove();
        document.body.style.overflow = '';
        document.removeEventListener('keydown', onKey);
      }
    };

    function onKey(e) {
      if (e.key === 'Escape') { api.close(); }
    }
    document.addEventListener('keydown', onKey);
    backdrop.querySelector('.modal-close').addEventListener('click', api.close);
    backdrop.addEventListener('mousedown', function (e) {
      if (e.target === backdrop) api.close();
    });

    if (typeof opts.onMount === 'function') opts.onMount(api);
    var firstInput = backdrop.querySelector('input:not([type=hidden]), select, textarea');
    if (firstInput && opts.focusFirst !== false) setTimeout(function () { firstInput.focus(); }, 40);
    return api;
  };

  App.confirm = function (opts) {
    return new Promise(function (resolve) {
      var settled = false;
      var modal;
      var onEscape;
      function finish(value) {
        if (settled) return;
        settled = true;
        if (onEscape) document.removeEventListener('keydown', onEscape);
        resolve(value);
        if (modal) modal.close();
      }
      modal = App.openModal({
        title: opts.title || 'Are you sure?',
        subtitle: opts.subtitle,
        size: 'sm',
        body: '<p style="font-size:13.5px;color:var(--ink-2);line-height:1.6">' + App.esc(opts.message || '') + '</p>',
        footer:
          '<button class="btn btn-ghost" data-act="cancel" type="button">Cancel</button>' +
          '<button class="btn ' + (opts.tone === 'danger' ? 'btn-danger' : 'btn-primary') + '" data-act="ok" type="button">' +
          App.esc(opts.confirmText || 'Confirm') + '</button>',
        focusFirst: false,
        onMount: function (api) {
          api.panel.querySelector('[data-act=cancel]').addEventListener('click', function () { finish(false); });
          api.panel.querySelector('[data-act=ok]').addEventListener('click', function () { finish(true); });
          api.root.addEventListener('mousedown', function (e) {
            if (e.target === api.root) finish(false);
          });
          api.panel.querySelector('.modal-close').addEventListener('click', function () { finish(false); });
        }
      });
      onEscape = function (e) {
        if (e.key === 'Escape') finish(false);
      };
      document.addEventListener('keydown', onEscape);
    });
  };

  /* ---------------------------- export ---------------------------- */
  App.download = function (filename, content, mime) {
    var blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  };

  App.toCSV = function (rows) {
    return '\uFEFF' + rows.map(function (row) {
      return row.map(function (cell) {
        var text = String(cell == null ? '' : cell);
        if (/[",\n]/.test(text)) text = '"' + text.replace(/"/g, '""') + '"';
        return text;
      }).join(',');
    }).join('\r\n');
  };

  App.exportCSV = function (filename, rows) {
    App.download(filename, App.toCSV(rows), 'text/csv;charset=utf-8');
    App.toast('Exported ' + filename, 'success');
  };

  /* ---------------------------- print ---------------------------- */
  App.printHTML = function (html) {
    var root = document.getElementById('print-root');
    if (!root) return;
    root.innerHTML = html;
    document.body.classList.add('printing');
    var cleanup = function () {
      document.body.classList.remove('printing');
      root.innerHTML = '';
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(function () {
      window.print();
      setTimeout(cleanup, 800);
    }, 60);
  };

  App.previewSheet = function (title, html) {
    var modal = App.openModal({
      title: title,
      subtitle: 'Preview before printing. Use Print to open your browser print dialog.',
      size: 'lg',
      body: '<div class="sheet-preview">' + html + '</div>',
      footer:
        '<button class="btn btn-ghost" data-act="close" type="button">Close</button>' +
        '<button class="btn btn-primary" data-act="print" type="button">' + App.icon('print') + ' Print</button>',
      focusFirst: false,
      onMount: function (api) {
        api.panel.querySelector('[data-act=close]').addEventListener('click', api.close);
        api.panel.querySelector('[data-act=print]').addEventListener('click', function () {
          App.printHTML(api.body.querySelector('.sheet-preview').innerHTML);
        });
      }
    });
    return modal;
  };
})();
