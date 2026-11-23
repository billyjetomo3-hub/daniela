/* ============================================================
   Reports & analytics
   ============================================================ */
(function () {
  var App = window.App;
  App.views = App.views || {};

  var PERIODS = {
    month: 'This month',
    year: 'This year',
    all: 'All time'
  };

  function periodLabel(period) {
    var now = new Date();
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (period === 'month') return months[now.getMonth()] + ' ' + now.getFullYear();
    if (period === 'year') return 'Year ' + now.getFullYear();
    return 'All records on file';
  }

  function inPeriod(dateStr, period) {
    if (period === 'all') return true;
    var d = String(dateStr || '').slice(0, 10);
    var today = App.todayISO();
    if (period === 'month') return d.slice(0, 7) === today.slice(0, 7);
    return d.slice(0, 4) === today.slice(0, 4);
  }

  function buildModel(period) {
    var active = App.db.residents().filter(function (r) { return r.status === 'Active'; });
    var docs = App.db.documents().filter(function (d) { return d.status !== 'Cancelled' && inPeriod(d.issuedAt, period); });
    var allDocs = App.db.documents();
    var complaints = App.db.complaints();
    var periodComplaints = complaints.filter(function (c) { return inPeriod(c.filedAt, period); });
    var open = complaints.filter(function (c) { return c.status === 'Pending' || c.status === 'Under Mediation'; });
    var newResidents = App.db.residents().filter(function (r) { return inPeriod(r.registeredAt, period); });

    var purokRows = App.PUROKS.map(function (p) {
      var residents = active.filter(function (r) { return r.purok === p; });
      var households = Array.from(new Set(residents.map(function (r) { return r.householdNo; }))).length;
      var voters = residents.filter(function (r) { return r.voterStatus === 'Registered'; }).length;
      var purokDocs = docs.filter(function (d) {
        var res = d.residentId ? App.db.resident(d.residentId) : null;
        return res && res.purok === p;
      }).length;
      var purokOpen = complaints.filter(function (c) {
        if (c.status !== 'Pending' && c.status !== 'Under Mediation') return false;
        var res = c.complainantId ? App.db.resident(c.complainantId) : null;
        return res && res.purok === p;
      }).length;
      return { purok: p, residents: residents.length, households: households, voters: voters, documents: purokDocs, open: purokOpen };
    });

    return {
      active: active,
      households: Array.from(new Set(active.map(function (r) { return r.householdNo; }))).length,
      voters: active.filter(function (r) { return r.voterStatus === 'Registered'; }).length,
      docs: docs,
      allDocs: allDocs,
      fees: docs.reduce(function (sum, d) { return sum + Number(d.fee || 0); }, 0),
      complaints: complaints,
      periodComplaints: periodComplaints,
      open: open,
      newResidents: newResidents,
      purokRows: purokRows
    };
  }

  function docTypeBars(model) {
    return App.DOC_TYPES.map(function (t) {
      return { label: t, value: model.docs.filter(function (d) { return d.type === t; }).length };
    });
  }

  function ageBars() {
    var groups = ['Children (2-5)', 'Children (6-12)', 'Teens (13-17)', 'Youth (18-29)', 'Adults (30-44)', 'Adults (45-59)', 'Seniors (60-64)', 'Seniors (65+)'];
    return groups.map(function (g) {
      return {
        label: g,
        value: App.db.residents().filter(function (r) {
          return r.status === 'Active' && App.ageGroup(r.birthDate) === g;
        }).length
      };
    });
  }

  function civilBars() {
    var list = ['Single', 'Married', 'Widowed', 'Separated', 'Annulled'];
    return list.map(function (s) {
      return {
        label: s,
        value: App.db.residents().filter(function (r) { return r.status === 'Active' && r.civilStatus === s; }).length
      };
    });
  }

  function reportSheet(period) {
    var s = App.db.settings();
    var m = buildModel(period);
    var purokRows = m.purokRows.map(function (p) {
      return '<tr><td>' + App.esc(p.purok) + '</td><td>' + p.residents + '</td><td>' + p.households +
        '</td><td>' + p.voters + '</td><td>' + p.documents + '</td><td>' + p.open + '</td></tr>';
    }).join('');
    var docRows = App.DOC_TYPES.map(function (t) {
      var count = m.docs.filter(function (d) { return d.type === t; }).length;
      var fees = m.docs.filter(function (d) { return d.type === t; }).reduce(function (sum, d) { return sum + Number(d.fee || 0); }, 0);
      return '<tr><td>' + App.esc(t) + '</td><td>' + count + '</td><td>' + App.money(fees) + '</td></tr>';
    }).join('');
    var statusRows = App.COMPLAINT_STATUS.map(function (st) {
      var count = m.complaints.filter(function (c) { return c.status === st; }).length;
      return '<tr><td>' + App.esc(st) + '</td><td>' + count + '</td></tr>';
    }).join('');

    return '<div class="sheet">' +
      App.letterhead() +
      '<div class="sheet-title" style="font-size:16pt;margin-top:28px">Barangay Report</div>' +
      '<div class="sheet-title-sub">' + App.esc(periodLabel(period)) + '</div>' +
      '<dl>' +
        '<dt>Report generated</dt><dd>' + App.esc(App.fmtLongDate(new Date())) + '</dd>' +
        '<dt>Total residents</dt><dd>' + App.num(m.active.length) + ' active</dd>' +
        '<dt>Households</dt><dd>' + App.num(m.households) + '</dd>' +
        '<dt>Registered voters</dt><dd>' + App.num(m.voters) + '</dd>' +
        '<dt>New registrations</dt><dd>' + App.num(m.newResidents.length) + '</dd>' +
        '<dt>Documents issued</dt><dd>' + App.num(m.docs.length) + ' (' + App.money(m.fees) + ' in fees)</dd>' +
        '<dt>Open complaints</dt><dd>' + App.num(m.open.length) + '</dd>' +
      '</dl>' +
      '<div class="sheet-section-title">Residents by purok</div>' +
      '<table class="sheet-table"><thead><tr><th>Purok</th><th>Residents</th><th>Households</th><th>Voters</th><th>Documents</th><th>Open cases</th></tr></thead>' +
      '<tbody>' + purokRows + '</tbody></table>' +
      '<div class="sheet-section-title">Documents issued by type</div>' +
      '<table class="sheet-table"><thead><tr><th>Document</th><th>Count</th><th>Fees</th></tr></thead><tbody>' + docRows + '</tbody></table>' +
      '<div class="sheet-section-title">Complaint status</div>' +
      '<table class="sheet-table"><thead><tr><th>Status</th><th>Cases</th></tr></thead><tbody>' + statusRows + '</tbody></table>' +
      '<div class="sheet-sign">' +
        '<div class="block"><div class="role">Prepared by:</div><div class="name">' + App.esc(s.secretary) + '</div><div class="role">Barangay Secretary</div></div>' +
        '<div class="block"><div class="role">Noted by:</div><div class="name">' + App.esc(s.captain) + '</div><div class="role">Punong Barangay</div></div>' +
      '</div>' +
      '<div class="sheet-foot"><span>' + App.esc(s.barangayName) + ' · ' + App.esc(s.address) + '</span><span>Generated by BIRMS</span></div>' +
    '</div>';
  }

  App.views.reports = function (root) {
    var period = 'year';

    root.innerHTML =
      '<div class="hero">' +
        '<div><h2>Reports &amp; statistics</h2><p>Population profile, document issuance and case summaries for the barangay.</p></div>' +
        '<div class="hero-actions">' +
          '<select id="report-period" style="height:38px;width:auto">' +
            Object.keys(PERIODS).map(function (k) {
              return '<option value="' + k + '"' + (k === period ? ' selected' : '') + '>' + PERIODS[k] + '</option>';
            }).join('') +
          '</select>' +
          '<button class="btn btn-ghost" data-act="export-residents">' + App.icon('download') + ' Residents</button>' +
          '<button class="btn btn-primary" data-act="print">' + App.icon('print') + ' Print report</button>' +
        '</div>' +
      '</div>' +
      '<div id="report-body"></div>';

    var body = root.querySelector('#report-body');

    root.querySelector('#report-period').addEventListener('change', function (e) {
      period = e.target.value;
      render();
    });

    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-act=print]')) { App.previewSheet('Barangay report', reportSheet(period)); return; }
      if (e.target.closest('[data-act=export-residents]')) {
        var rows = [['Resident ID', 'Last name', 'First name', 'Purok', 'Sex', 'Birthdate', 'Age', 'Civil status', 'Voter', 'Status']];
        App.db.residents().forEach(function (r) {
          rows.push([r.id, r.lastName, r.firstName, r.purok, r.sex, r.birthDate, App.age(r.birthDate), r.civilStatus, r.voterStatus, r.status]);
        });
        App.exportCSV('barangay-resident-report-' + App.todayISO() + '.csv', rows);
        return;
      }
      if (e.target.closest('[data-act=export-docs]')) {
        var docRows = [['Reference', 'Type', 'Resident', 'Purpose', 'Fee', 'Issued', 'Status']];
        App.db.documents().forEach(function (d) {
          docRows.push([d.no, d.type, d.residentName, d.purpose, d.fee, d.issuedAt, d.status]);
        });
        App.exportCSV('barangay-document-report-' + App.todayISO() + '.csv', docRows);
        return;
      }
    });

    function render() {
      var m = buildModel(period);
      body.innerHTML =
        '<div class="grid grid-4" style="margin-bottom:16px">' +
          '<div class="card stat"><div class="stat-top"><span class="stat-label">Active residents</span><span class="stat-icon">' + App.icon('users') + '</span></div>' +
            '<div class="stat-value">' + App.num(m.active.length) + '</div><div class="stat-meta">' + App.num(m.households) + ' households · ' + App.num(m.voters) + ' voters</div></div>' +
          '<div class="card stat"><div class="stat-top"><span class="stat-label">New registrations</span><span class="stat-icon">' + App.icon('plus') + '</span></div>' +
            '<div class="stat-value">' + App.num(m.newResidents.length) + '</div><div class="stat-meta">' + App.esc(periodLabel(period)) + '</div></div>' +
          '<div class="card stat"><div class="stat-top"><span class="stat-label">Documents issued</span><span class="stat-icon green">' + App.icon('file') + '</span></div>' +
            '<div class="stat-value">' + App.num(m.docs.length) + '</div><div class="stat-meta">' + App.money(m.fees) + ' collected</div></div>' +
          '<div class="card stat"><div class="stat-top"><span class="stat-label">Open complaints</span><span class="stat-icon red">' + App.icon('alert') + '</span></div>' +
            '<div class="stat-value">' + App.num(m.open.length) + '</div><div class="stat-meta">' + m.periodComplaints.length + ' filed ' + App.esc(periodLabel(period).toLowerCase()) + '</div></div>' +
        '</div>' +

        '<div class="grid grid-2" style="margin-bottom:16px">' +
          '<div class="card"><div class="section-head"><div><h3>Residents by purok</h3><p>Active population distribution</p></div></div>' +
            '<div class="card-body">' + App.bars(m.purokRows.map(function (p) { return { label: p.purok, value: p.residents }; })) + '</div></div>' +
          '<div class="card"><div class="section-head"><div><h3>Age distribution</h3><p>Based on registered birthdates</p></div></div>' +
            '<div class="card-body">' + App.bars(ageBars(), 'gold') + '</div></div>' +
        '</div>' +

        '<div class="grid grid-2" style="margin-bottom:16px">' +
          '<div class="card"><div class="section-head"><div><h3>Documents issued</h3><p>' + App.esc(periodLabel(period)) + ' · excluding cancelled</p></div></div>' +
            '<div class="card-body">' + App.bars(docTypeBars(m)) + '</div></div>' +
          '<div class="card"><div class="section-head"><div><h3>Civil status profile</h3><p>Active residents</p></div></div>' +
            '<div class="card-body">' + App.bars(civilBars(), 'gold') + '</div></div>' +
        '</div>' +

        '<div class="card" style="margin-bottom:16px">' +
          '<div class="section-head"><div><h3>Purok summary</h3><p>Registered residents per purok for ' + App.esc(periodLabel(period).toLowerCase()) + '</p></div>' +
            '<div class="row"><button class="btn btn-subtle btn-sm" data-act="export-docs">' + App.icon('download') + ' Documents CSV</button></div></div>' +
          '<div class="table-wrap"><table><thead><tr><th>Purok</th><th class="num">Residents</th><th class="num">Households</th><th class="num">Voters</th><th class="num">Documents</th><th class="num">Open cases</th></tr></thead><tbody>' +
          m.purokRows.map(function (p) {
            return '<tr><td class="cell-strong">' + App.esc(p.purok) + '</td><td class="num">' + App.num(p.residents) +
              '</td><td class="num">' + App.num(p.households) + '</td><td class="num">' + App.num(p.voters) +
              '</td><td class="num">' + App.num(p.documents) + '</td><td class="num">' + App.num(p.open) + '</td></tr>';
          }).join('') +
          '</tbody><tfoot><tr style="background:#fafbfd;font-weight:700"><td>Total</td><td class="num">' + App.num(m.active.length) +
            '</td><td class="num">' + App.num(m.households) + '</td><td class="num">' + App.num(m.voters) +
            '</td><td class="num">' + App.num(m.docs.length) + '</td><td class="num">' + App.num(m.open.length) + '</td></tr></tfoot></table></div>' +
        '</div>' +

        '<div class="grid grid-2">' +
          '<div class="card"><div class="section-head"><div><h3>Complaints by type</h3><p>All recorded cases</p></div></div><div class="card-body">' +
            App.bars(App.COMPLAINT_TYPES.map(function (t) {
              return { label: t, value: m.complaints.filter(function (c) { return c.type === t; }).length };
            }).filter(function (r) { return r.value > 0; })) +
          '</div></div>' +
          '<div class="card"><div class="section-head"><div><h3>Case status</h3><p>Pending, mediation and closed cases</p></div></div><div class="card-body">' +
            '<div class="bars">' + App.COMPLAINT_STATUS.map(function (st) {
              var count = m.complaints.filter(function (c) { return c.status === st; }).length;
              var pct = Math.round((count / Math.max(m.complaints.length, 1)) * 100);
              return '<div class="bar-row"><div class="bar-label">' + App.esc(st) + '</div>' +
                '<div class="bar-track"><div class="bar-fill ' + (st === 'Resolved' ? '' : st === 'Pending' ? 'gold' : '') + '" style="width:' + Math.max(pct, count ? 3 : 0) + '%"></div></div>' +
                '<div class="bar-value">' + count + '</div></div>';
            }).join('') + '</div>' +
            '<div style="margin-top:18px" class="legend"><span><span class="dot" style="background:#1b4670"></span>Resolved / mediation</span><span><span class="dot" style="background:#b8892b"></span>Pending / dismissed</span></div>' +
          '</div></div>' +
        '</div>';
    }

    render();
  };

  App.reportSheet = reportSheet;
})();
