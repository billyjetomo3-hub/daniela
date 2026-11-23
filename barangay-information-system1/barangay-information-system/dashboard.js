/* ============================================================
   Dashboard view
   ============================================================ */
(function () {
  var App = window.App;
  App.views = App.views || {};

  App.bars = function (rows, tone) {
    var max = 1;
    rows.forEach(function (r) { if (r.value > max) max = r.value; });
    return '<div class="bars">' + rows.map(function (r) {
      var pct = Math.round((r.value / max) * 100);
      return '<div class="bar-row">' +
        '<div class="bar-label" title="' + App.attr(r.label) + '">' + App.esc(r.label) + '</div>' +
        '<div class="bar-track"><div class="bar-fill ' + (tone || '') + '" style="width:' + (r.value ? Math.max(pct, 3) : 0) + '%"></div></div>' +
        '<div class="bar-value">' + App.num(r.value) + '</div>' +
      '</div>';
    }).join('') + '</div>';
  };

  function greeting() {
    var h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  App.views.dashboard = function (root) {
    var s = App.summary();
    var user = App.db.currentUser();
    var settings = App.db.settings();

    var purokBars = App.PUROKS.map(function (p) {
      return { label: p, value: s.residents.filter(function (r) { return r.purok === p && r.status === 'Active'; }).length };
    });

    var groups = ['Children (2-5)', 'Children (6-12)', 'Teens (13-17)', 'Youth (18-29)', 'Adults (30-44)', 'Adults (45-59)', 'Seniors (60-64)', 'Seniors (65+)'];
    var ageBars = groups.map(function (g) {
      return { label: g, value: s.residents.filter(function (r) { return r.status === 'Active' && App.ageGroup(r.birthDate) === g; }).length };
    });

    var recentDocs = s.docs.filter(function (d) { return d.status !== 'Cancelled'; })
      .slice().sort(function (a, b) { return String(b.issuedAt).localeCompare(String(a.issuedAt)); }).slice(0, 5);

    var activity = App.db.activity().slice(0, 6);

    root.innerHTML =
      '<div class="hero">' +
        '<div>' +
          '<h2>' + greeting() + ', ' + App.esc((user ? user.name.split(' ')[0] : 'Barangay')) + '.</h2>' +
          '<p>Here is what is happening at ' + App.esc(settings.barangayName) + ' today &mdash; ' + App.esc(App.fmtLongDate()) + '.</p>' +
        '</div>' +
        '<div class="hero-actions">' +
          '<button class="btn btn-ghost" data-route="reports">' + App.icon('chart') + ' View reports</button>' +
          '<button class="btn btn-primary" data-action="new-resident">' + App.icon('plus') + ' Register resident</button>' +
        '</div>' +
      '</div>' +

      '<div class="grid grid-4" style="margin-bottom:16px">' +
        '<div class="card stat">' +
          '<div class="stat-top"><span class="stat-label">Residents</span><span class="stat-icon">' + App.icon('users') + '</span></div>' +
          '<div class="stat-value">' + App.num(s.totalResidents) + '</div>' +
          '<div class="stat-meta"><b>' + App.num(s.activeResidents) + '</b> active &middot; ' + App.num(s.households) + ' households</div>' +
        '</div>' +
        '<div class="card stat">' +
          '<div class="stat-top"><span class="stat-label">Registered voters</span><span class="stat-icon gold">' + App.icon('shield') + '</span></div>' +
          '<div class="stat-value">' + App.num(s.voters) + '</div>' +
          '<div class="stat-meta">' + Math.round((s.voters / Math.max(s.activeResidents, 1)) * 100) + '% of active residents</div>' +
        '</div>' +
        '<div class="card stat">' +
          '<div class="stat-top"><span class="stat-label">Documents this month</span><span class="stat-icon green">' + App.icon('file') + '</span></div>' +
          '<div class="stat-value">' + App.num(s.docsThisMonth) + '</div>' +
          '<div class="stat-meta">' + App.money(s.feesThisMonth) + ' in fees collected</div>' +
        '</div>' +
        '<div class="card stat">' +
          '<div class="stat-top"><span class="stat-label">Open complaints</span><span class="stat-icon red">' + App.icon('alert') + '</span></div>' +
          '<div class="stat-value">' + App.num(s.openComplaints) + '</div>' +
          '<div class="stat-meta">' + (s.openComplaints ? '<b>' + s.pending + '</b> pending · <b>' + s.mediation + '</b> under mediation' : 'No unresolved cases') + '</div>' +
        '</div>' +
      '</div>' +

      '<div class="grid grid-2-1" style="margin-bottom:16px">' +
        '<div class="card">' +
          '<div class="section-head"><div><h3>Active residents by purok</h3><p>Distribution across the six puroks</p></div>' +
          '<button class="btn btn-subtle btn-sm" data-route="reports">Details</button></div>' +
          '<div class="card-body">' + App.bars(purokBars) + '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="section-head"><div><h3>Quick actions</h3><p>Common front-desk tasks</p></div></div>' +
          '<div class="card-body"><div class="quick-grid">' +
            '<button class="quick" data-action="new-resident"><span class="quick-icon">' + App.icon('users') + '</span><span class="quick-text"><b>Register a resident</b><span>Add a new barangay record</span></span><span class="chev">' + App.icon('arrowup') + '</span></button>' +
            '<button class="quick" data-action="new-document"><span class="quick-icon">' + App.icon('file') + '</span><span class="quick-text"><b>Issue a clearance</b><span>Clearance or certificate</span></span><span class="chev">' + App.icon('arrowup') + '</span></button>' +
            '<button class="quick" data-action="new-complaint"><span class="quick-icon">' + App.icon('alert') + '</span><span class="quick-text"><b>File a complaint</b><span>Record a blotter entry</span></span><span class="chev">' + App.icon('arrowup') + '</span></button>' +
          '</div></div>' +
        '</div>' +
      '</div>' +

      '<div class="grid grid-2-1" style="margin-bottom:16px">' +
        '<div class="card">' +
          '<div class="section-head"><div><h3>Recently issued documents</h3><p>Latest clearances and certificates</p></div>' +
          '<button class="btn btn-subtle btn-sm" data-route="documents">Open register</button></div>' +
          (recentDocs.length ?
            '<div class="table-wrap"><table><thead><tr><th>Reference</th><th>Resident</th><th>Document</th><th>Issued</th><th class="num">Fee</th></tr></thead><tbody>' +
            recentDocs.map(function (d) {
              return '<tr>' +
                '<td class="cell-strong">' + App.esc(d.no) + '</td>' +
                '<td>' + App.esc(d.residentName) + '</td>' +
                '<td>' + App.esc(d.type) + '</td>' +
                '<td>' + App.esc(App.fmtDate(d.issuedAt)) + '</td>' +
                '<td class="num">' + App.money(d.fee) + '</td>' +
              '</tr>';
            }).join('') +
            '</tbody></table></div>'
            : '<div class="empty"><div class="empty-icon">' + App.icon('file') + '</div><h4>No documents yet</h4><p>Issue your first barangay clearance to see it here.</p></div>') +
        '</div>' +
        '<div class="card">' +
          '<div class="section-head"><div><h3>Recent activity</h3><p>Actions by barangay personnel</p></div></div>' +
          '<div class="card-body">' +
            '<div class="timeline">' + activity.map(function (a) {
              return '<div class="tl-item">' +
                '<div class="tl-dot">' + App.icon('check') + '</div>' +
                '<div class="tl-body"><div class="tl-text"><b>' + App.esc(a.user) + '</b> ' + App.esc(a.action.toLowerCase()) +
                (a.detail ? ' &mdash; ' + App.esc(a.detail) : '') + '</div>' +
                '<div class="tl-meta">' + App.esc(App.timeAgo(a.at)) + '</div></div>' +
              '</div>';
            }).join('') + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="section-head"><div><h3>Population by age group</h3><p>Based on registered birthdates of active residents</p></div>' +
        '<span class="badge badge-gold badge-plain">' + App.num(s.activeResidents) + ' residents</span></div>' +
        '<div class="card-body">' + App.bars(ageBars, 'gold') + '</div>' +
      '</div>';

    root.querySelectorAll('[data-route]').forEach(function (btn) {
      btn.addEventListener('click', function () { App.go(btn.getAttribute('data-route')); });
    });
    root.querySelectorAll('[data-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.getAttribute('data-action');
        if (action === 'new-resident') App.go('residents', { add: 1 });
        if (action === 'new-document') App.go('documents', { add: 1 });
        if (action === 'new-complaint') App.go('complaints', { add: 1 });
      });
    });
  };
})();
