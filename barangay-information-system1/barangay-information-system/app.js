/* ============================================================
   App shell — routing, auth, shell wiring, navigation
   ============================================================ */
(function () {
  'use strict';

  var App = window.App;

  var ROUTES = {
    dashboard: { label: 'Dashboard', icon: 'grid', role: null },
    residents: { label: 'Residents', icon: 'users', role: null },
    documents: { label: 'Clearances', icon: 'file', role: null },
    complaints: { label: 'Complaints', icon: 'alert', role: null },
    reports: { label: 'Reports', icon: 'chart', role: null },
    users: { label: 'Users', icon: 'shield', role: 'admin' },
    settings: { label: 'Settings', icon: 'settings', role: 'admin' }
  };

  var body = document.body;
  var loginScreen = document.getElementById('login-screen');
  var appShell = document.getElementById('app');
  var view = document.getElementById('view');
  var sidebar = document.getElementById('sidebar');
  var scrim = document.getElementById('scrim');
  var menuBtn = document.getElementById('menu-btn');
  var logoutBtn = document.getElementById('logout-btn');
  var navEl = document.getElementById('nav');
  var titleEl = document.getElementById('page-title');
  var subtitleEl = document.getElementById('page-subtitle');
  var topAvatar = document.getElementById('top-avatar');
  var topName = document.getElementById('top-name');
  var topRole = document.getElementById('top-role');
  var sideAvatar = document.getElementById('side-avatar');
  var sideName = document.getElementById('side-user-name');
  var sideRole = document.getElementById('side-user-role');
  var brandName = document.getElementById('brand-name');
  var brandSeal = document.getElementById('brand-seal');
  var todayEl = document.getElementById('today');

  var session = null;

  function currentSession() {
    return App.db.currentUser();
  }

  function boot() {
    session = currentSession();
    if (session) showApp();
    else {
      var u = document.getElementById('login-username');
      var p = document.getElementById('login-password');
      u.focus();
      document.getElementById('login-error');
    }
    bindShellEvents();
  }

  function showApp() {
    loginScreen.hidden = true;
    appShell.hidden = false;
    body.classList.add('app');
    populateShell();
    renderNav();
    applySettings();
    if (!location.hash) location.hash = '#/dashboard';
    renderRoute();
  }

  function applySettings() {
    var s = App.db.settings();
    brandName.textContent = s.barangayName;
    brandSeal.textContent = App.initials(String(s.barangayName).replace(/^Barangay\s+/i, ''));
    document.title = s.shortName ? s.shortName : s.barangayName + ' · Site';
  }

  // Settings are edited by the admin view, so expose the shell refresh hook.
  App.applySettings = applySettings;

  function populateShell() {
    var user = session;
    topAvatar.textContent = App.initials(user.name);
    topName.textContent = user.name;
    topRole.textContent = user.position || user.role;
    sideAvatar.textContent = App.initials(user.name);
    sideName.textContent = user.name;
    sideRole.textContent = user.position || user.role;
  }

  function renderNav() {
    navEl.innerHTML = '';
    var counts = App.summary();
    var keys = Object.keys(ROUTES);
    keys.forEach(function (route) {
      var item = ROUTES[route];
      if (item.role && session.role !== item.role) return;
      var li = document.createElement('button');
      li.className = 'nav-item' + (location.hash.startsWith('#/' + route) ? ' active' : '');
      li.innerHTML = '<span class="nav-icon">' + App.icon(item.icon) + '</span><span class="nav-label">' + App.esc(item.label) + '</span>' +
        (route === 'residents' || route === 'documents' || route === 'reports' ? '<span class="nav-count" id="nav-' + route + '"></span>' : '') + '';
      if (route === 'residents' || route === 'documents' || route === 'reports') {
        li.setAttribute('data-count-route', route);
      }
      li.setAttribute('data-route', route);
      li.addEventListener('click', function () { go(route); });
      navEl.appendChild(li);
    });
    ['residents', 'documents', 'reports'].forEach(function (route) {
      var el = document.getElementById('nav-' + route);
      if (el) el.textContent = countFor(route, counts);
    });
  }

  function countFor(route, counts) {
    if (route === 'residents') return App.num(counts.totalResidents);
    if (route === 'documents') return App.num(counts.docsTotal);
    if (route === 'reports') return App.num(counts.pending + counts.mediation + counts.resolvedComplaints);
    return '';
  }

  function bindShellEvents() {
    logoutBtn.addEventListener('click', logout);
    menuBtn.addEventListener('click', function () {
      body.classList.add('nav-open');
      scrim.classList.remove('hidden');
    });
    scrim.addEventListener('click', function () {
      body.classList.remove('nav-open');
      scrim.classList.add('hidden');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('nav-open')) {
        body.classList.remove('nav-open');
        scrim.classList.add('hidden');
      }
    });
    window.addEventListener('hashchange', function () {
      if (session) {
        renderNav();
        renderRoute();
      }
    });
    var loginForm = document.getElementById('login-form');
    var loginUsername = document.getElementById('login-username');
    var loginPassword = document.getElementById('login-password');
    var loginError = document.getElementById('login-error');
    var togglePassword = document.getElementById('toggle-password');

    togglePassword.addEventListener('click', function () {
      var showing = loginPassword.type === 'text';
      loginPassword.type = showing ? 'password' : 'text';
      togglePassword.textContent = showing ? 'Show' : 'Hide';
      togglePassword.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    });

    document.querySelectorAll('.demo-cred').forEach(function (button) {
      button.addEventListener('click', function () {
        loginUsername.value = button.getAttribute('data-user') || '';
        loginPassword.value = button.getAttribute('data-pass') || '';
        loginError.hidden = true;
        loginPassword.focus();
      });
    });

    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var result = App.db.verify(loginUsername.value, loginPassword.value);
      if (!result.ok) {
        loginError.textContent = result.message;
        loginError.hidden = false;
        return;
      }
      loginError.hidden = true;
      App.db.setSession(result.user.id);
      session = currentSession();
      showApp();
    });
  }

  function renderRoute() {
    var hash = location.hash.replace(/^#\/?/, '') || 'dashboard';
    var route = hash.split('?')[0];
    var params = new URLSearchParams(hash.split('?')[1] || '');
    var item = ROUTES[route];
    if (!item) { location.hash = '#/dashboard'; return; }
    if (item.role && session.role !== item.role) { location.hash = '#/dashboard'; return; }
    titleEl.textContent = item.label === 'Dashboard' ? 'Dashboard' : item.label;
    subtitleEl.textContent = 'Barangay records & services · ' + App.fmtDate(App.todayISO());
    topAvatar.textContent = session.name ? App.initials(session.name) : 'B';
    body.classList.remove('nav-open');
    scrim.classList.add('hidden');
    view.innerHTML = '<div class="view-enter">' + App.icon('home') + '</div>';
    var module = App.views[route];
    if (module) {
      module(view, params);
    }
  }

  function logout() {
    App.db.clearSession();
    session = null;
    App.db.log('Signed out', 'system');
    loginScreen.hidden = false;
    appShell.hidden = true;
    body.classList.remove('app');
    navEl.innerHTML = '';
    titleEl.textContent = 'Barangay Information & Resident Management System';
    subtitleEl.textContent = 'Sign in to continue';
    view.innerHTML = '';
    document.getElementById('login-username').focus();
  }

  function go(route, params) {
    if (!route) route = 'dashboard';
    var query = '';
    if (params) {
      var search = new URLSearchParams();
      Object.keys(params).forEach(function (key) {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          search.set(key, params[key]);
        }
      });
      query = search.toString();
      if (query) query = '?' + query;
    }
    var nextHash = '#/' + route + query;
    if (location.hash !== nextHash) location.hash = nextHash;
    else renderRoute();
  }

  App.go = go;
  App.refresh = function () { renderRoute(); };
  App.logout = logout;

  document.addEventListener('DOMContentLoaded', function () {
    boot();
  });
  if (document.readyState !== 'loading') boot();
})();
