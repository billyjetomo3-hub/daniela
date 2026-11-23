/* ============================================================
   Barangay clearances & certificates — issuance and printing
   ============================================================ */
(function () {
  var App = window.App;
  App.views = App.views || {};
  var PAGE_SIZE = 9;

  var input = App.formInput;

  /* ------------------------------ letterhead ------------------------------ */
  App.letterhead = function () {
    var s = App.db.settings();
    return '<div class="sheet-hd">' +
        '<div class="seal">' + App.esc(App.initials(String(s.barangayName).replace(/^Barangay\s+/i, ''))) + '</div>' +
        '<div class="sheet-hd-text">' +
          '<div class="rep">Republic of the Philippines</div>' +
          '<div class="prov">Province of ' + App.esc(s.province) + '</div>' +
          '<div class="muni">Municipality of ' + App.esc(s.municipality) + '</div>' +
          '<div class="brgy">' + App.esc(String(s.barangayName).toUpperCase()) + '</div>' +
          '<div class="office">Office of the Punong Barangay</div>' +
        '</div>' +
        '<div style="width:66px"></div>' +
      '</div>' +
      '<hr class="sheet-rule" /><hr class="sheet-rule thin" />';
  };

  function pronoun(r) {
    return r && r.sex === 'Female' ? 'she' : 'he';
  }

  function documentBody(doc, r) {
    var s = App.db.settings();
    var name = '<span class="u">' + App.esc(String(doc.residentName).toUpperCase()) + '</span>';
    var civil = r ? r.civilStatus.toLowerCase() : 'of legal age';
    var addr = '<span class="u">' + App.esc(r ? App.residentAddress(r) : 'this barangay') + '</span>';
    var purpose = '<span class="u">' + App.esc(doc.purpose) + '</span>';
    var date = App.fmtLongDate(doc.issuedAt);
    var place = 'Barangay ' + s.shortName + ', ' + s.municipality + ', ' + s.province;

    if (doc.type === 'Certificate of Residency') {
      return '<p>This is to certify that ' + name + ', of legal age, ' + civil + ', Filipino citizen, is a bona fide resident of ' + addr + ', ' + place + '.</p>' +
        '<p>This certification is issued upon the request of the above-named person in connection with ' + purpose + '.</p>' +
        '<p>Issued this ' + date + ' at ' + place + ', Philippines.</p>';
    }
    if (doc.type === 'Certificate of Indigency') {
      return '<p>This is to certify that ' + name + ', of legal age, ' + civil + ', Filipino citizen, and a resident of ' + addr + ', ' + place + ', belongs to an indigent family of this barangay and is one of the beneficiaries of our barangay assistance programs.</p>' +
        '<p>This certification is issued upon the request of the above-named person in connection with ' + purpose + ', and for whatever legal purpose it may serve.</p>' +
        '<p>Issued this ' + date + ' at ' + place + ', Philippines.</p>';
    }
    if (doc.type === 'Business Clearance') {
      return '<p>This is to certify that ' + name + ', of legal age, ' + civil + ', Filipino citizen, and a resident of ' + addr + ', is hereby granted a Barangay Business Clearance to operate ' + purpose + ' within the territorial jurisdiction of ' + place + ', subject to existing barangay ordinances and national laws.</p>' +
        '<p>This clearance is issued upon payment of the required fees and upon the request of the above-named person.</p>' +
        '<p>Issued this ' + date + ' at ' + place + ', Philippines.</p>';
    }
    if (doc.type === 'Certificate of Good Moral') {
      return '<p>This is to certify that ' + name + ', of legal age, ' + civil + ', Filipino citizen, and a resident of ' + addr + ', ' + place + ', is a person of good moral character and reputation in this community. ' +
        App.esc(pronoun(r) === 'she' ? 'She' : 'He') + ' has not been involved in any incident that would reflect adversely on ' + pronoun(r) + ' character.</p>' +
        '<p>This certification is issued upon the request of the above-named person in connection with ' + purpose + '.</p>' +
        '<p>Issued this ' + date + ' at ' + place + ', Philippines.</p>';
    }
    return '<p>This is to certify that ' + name + ', of legal age, ' + civil + ', Filipino citizen, and a resident of ' + addr + ', ' + place + ', is known to be of good moral character and has no derogatory record filed in this office as of this date.</p>' +
      '<p>This Barangay Clearance is issued upon the request of the above-named person in connection with ' + purpose + '.</p>' +
      '<p>Issued this ' + date + ' at ' + place + ', Philippines.</p>';
  }

  App.documentSheet = function (doc) {
    var s = App.db.settings();
    var r = doc.residentId ? App.db.resident(doc.residentId) : null;
    return '<div class="sheet">' +
      App.letterhead() +
      '<div class="sheet-meta"><span>Control No.: <b>' + App.esc(doc.no) + '</b></span><span>Date Issued: <b>' + App.esc(App.fmtDate(doc.issuedAt)) + '</b></span></div>' +
      '<div class="sheet-title">' + App.esc(doc.type) + '</div>' +
      '<div class="sheet-title-sub">' + (doc.status === 'Cancelled' ? 'Cancelled' : 'Barangay ' + App.esc(s.shortName)) + '</div>' +
      '<p class="noindent"><b>TO WHOM IT MAY CONCERN:</b></p>' +
      documentBody(doc, r) +
      '<p class="noindent" style="margin-top:16px">Fee paid: <b>' + App.money(doc.fee) + '</b> &nbsp;&middot;&nbsp; O.R. No. ______________</p>' +
      '<div class="sheet-sign">' +
        '<div class="block"><div class="role">Issued by:</div><div class="name">' + App.esc(s.secretary) + '</div><div class="role">Barangay Secretary</div></div>' +
        '<div class="block"><div class="role">Approved by:</div><div class="name">' + App.esc(s.captain) + '</div><div class="role">Punong Barangay</div></div>' +
      '</div>' +
      '<p class="sheet-note">This document is not valid without the official dry seal of the barangay.</p>' +
      '<div class="sheet-foot"><span>' + App.esc(s.address) + '</span><span>' + App.esc(s.contact) + '</span></div>' +
    '</div>';
  };

  App.residentSheet = function (r) {
    var s = App.db.settings();
    return '<div class="sheet">' +
      App.letterhead() +
      '<div class="sheet-title" style="font-size:16pt;margin-top:26px">Resident Record</div>' +
      '<div class="sheet-title-sub">Barangay Resident Registry</div>' +
      '<div class="sheet-section-title">Personal information</div>' +
      '<dl>' +
        '<dt>Resident ID</dt><dd>' + App.esc(r.id) + '</dd>' +
        '<dt>Full name</dt><dd>' + App.esc(App.fullName(r)) + '</dd>' +
        '<dt>Sex</dt><dd>' + App.esc(r.sex) + '</dd>' +
        '<dt>Date of birth</dt><dd>' + App.esc(App.fmtDate(r.birthDate)) + ' (' + App.age(r.birthDate) + ' years old)</dd>' +
        '<dt>Civil status</dt><dd>' + App.esc(r.civilStatus) + '</dd>' +
        '<dt>Religion</dt><dd>' + App.esc(r.religion || '—') + '</dd>' +
        '<dt>Occupation</dt><dd>' + App.esc(r.occupation || '—') + '</dd>' +
        '<dt>Citizenship</dt><dd>' + App.esc(r.citizenship || 'Filipino') + '</dd>' +
      '</dl>' +
      '<div class="sheet-section-title">Address &amp; household</div>' +
      '<dl>' +
        '<dt>Address</dt><dd>' + App.esc(App.residentAddress(r)) + '</dd>' +
        '<dt>Purok</dt><dd>' + App.esc(r.purok) + '</dd>' +
        '<dt>Household no.</dt><dd>' + App.esc(r.householdNo) + '</dd>' +
        '<dt>Voter status</dt><dd>' + App.esc(r.voterStatus) + '</dd>' +
        '<dt>Contact number</dt><dd>' + App.esc(r.contact) + '</dd>' +
        '<dt>Email</dt><dd>' + App.esc(r.email || '—') + '</dd>' +
        '<dt>Emergency contact</dt><dd>' + App.esc(r.emergencyName || '—') + (r.emergencyContact ? ' · ' + App.esc(r.emergencyContact) : '') + '</dd>' +
      '</dl>' +
      '<div class="sheet-section-title">Record status</div>' +
      '<dl>' +
        '<dt>Residency status</dt><dd>' + App.esc(r.status) + '</dd>' +
        '<dt>Registered on</dt><dd>' + App.esc(App.fmtDate(r.registeredAt)) + '</dd>' +
        '<dt>Notes</dt><dd>' + App.esc(r.notes || '—') + '</dd>' +
      '</dl>' +
      '<div class="sheet-sign">' +
        '<div class="block"><div class="name">' + App.esc(s.captain) + '</div><div class="role">Punong Barangay</div></div>' +
        '<div class="block"><div class="name">' + App.esc(s.secretary) + '</div><div class="role">Barangay Secretary</div></div>' +
      '</div>' +
      '<div class="sheet-foot"><span>Printed ' + App.esc(App.fmtLongDate(new Date())) + '</span><span>Generated by BIRMS</span></div>' +
    '</div>';
  };

  /* ------------------------------ issue form ------------------------------ */
  function residentOptions(selected) {
    return App.db.residents()
      .filter(function (r) { return r.status === 'Active'; })
      .sort(function (a, b) { return (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName); })
      .map(function (r) {
        return '<option value="' + App.attr(r.id) + '"' + (selected === r.id ? ' selected' : '') + '>' +
          App.esc(App.fullName(r) + ' · ' + r.id + ' · ' + r.purok) + '</option>';
      }).join('');
  }

  function openDocumentForm(preselectedResident, after) {
    var s = App.db.settings();
    var firstType = App.DOC_TYPES[0];
    var today = App.todayISO();

    var modal = App.openModal({
      title: 'Issue a barangay document',
      subtitle: 'The reference number is generated automatically upon issuance.',
      size: 'lg',
      body:
        '<form id="doc-form" novalidate>' +
          '<div class="form-section">' +
            '<div class="form-section-title">Document details</div>' +
            '<div class="form-grid">' +
              '<div class="field field-full"><label>Resident <span class="req">*</span></label>' +
                '<select name="residentId" required><option value="">Select a registered resident…</option>' +
                residentOptions(preselectedResident) + '</select></div>' +
              '<div class="field"><label>Document type <span class="req">*</span></label>' +
                '<select name="type">' + App.DOC_TYPES.map(function (t) {
                  return '<option value="' + App.attr(t) + '"' + (t === firstType ? ' selected' : '') + '>' + App.esc(t) + '</option>';
                }).join('') + '</select></div>' +
              '<div class="field"><label>Fee (PHP)</label><input name="fee" type="number" min="0" step="0.01" value="' +
                App.attr(s.fees[firstType] || 0) + '" /></div>' +
              '<div class="field field-full"><label>Purpose <span class="req">*</span></label>' +
                '<input name="purpose" placeholder="e.g. Local employment requirement" required /></div>' +
              '<div class="field"><label>Date issued</label><input name="issuedAt" type="date" value="' + today + '" max="' + today + '" /></div>' +
              '<div class="field"><label>Release status</label><select name="status"><option>Issued</option><option>Released</option></select></div>' +
              '<div class="field field-full"><label>Remarks</label><textarea name="remarks" placeholder="Optional notes, e.g. partial payment or claiming instructions"></textarea></div>' +
            '</div>' +
            '<div class="form-note">Reference number: <b id="doc-preview-no">' + App.esc(App.db.nextDocNo(firstType)) + '</b>. A Barangay Clearance cannot be issued to a resident with a pending or under-mediation complaint.</div>' +
            '<div id="doc-warning"></div>' +
            '<div class="form-error" id="doc-error" hidden></div>' +
          '</div>' +
        '</form>',
      footer:
        '<button class="btn btn-ghost" data-act="cancel" type="button">Cancel</button>' +
        '<button class="btn btn-primary" data-act="save" type="submit" form="doc-form">Issue document</button>',
      onMount: function (api) {
        var form = api.panel.querySelector('#doc-form');
        var errorBox = api.panel.querySelector('#doc-error');
        var warning = api.panel.querySelector('#doc-warning');
        var typeSelect = form.elements.type;
        var residentSelect = form.elements.residentId;

        function refreshMeta() {
          var type = typeSelect.value;
          form.elements.fee.value = s.fees[type] == null ? 0 : s.fees[type];
          api.panel.querySelector('#doc-preview-no').textContent = App.db.nextDocNo(type);
          var open = residentSelect.value ? App.db.openComplaintsFor(residentSelect.value) : [];
          if (type === 'Barangay Clearance' && open.length) {
            warning.innerHTML = '<div class="alert alert-warn" style="margin-top:10px">' + App.icon('alert') +
              '<div>This resident has an open complaint (<b>' + App.esc(open[0].caseNo) + '</b> — ' + App.esc(open[0].type) +
              '). A clearance can only be issued after the case is resolved or dismissed.</div></div>';
          } else {
            warning.innerHTML = '';
          }
        }

        typeSelect.addEventListener('change', refreshMeta);
        residentSelect.addEventListener('change', refreshMeta);
        refreshMeta();

        api.panel.querySelector('[data-act=cancel]').addEventListener('click', api.close);

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          errorBox.hidden = true;
          var resident = App.db.resident(residentSelect.value);
          var type = typeSelect.value;
          var purpose = form.elements.purpose.value.trim();
          var errors = [];

          if (!resident) errors.push('Please select the resident who requested the document.');
          if (!purpose) errors.push('Purpose is required.');
          if (resident && resident.status !== 'Active') errors.push('Documents can only be issued to residents with Active status.');
          if (resident && type === 'Barangay Clearance') {
            var open = App.db.openComplaintsFor(resident.id);
            if (open.length) errors.push('A Barangay Clearance cannot be issued: ' + open[0].caseNo + ' is still ' + open[0].status.toLowerCase() + '.');
          }
          if (!form.elements.issuedAt.value) errors.push('Date issued is required.');

          if (errors.length) {
            errorBox.innerHTML = errors.map(function (m) { return '• ' + App.esc(m); }).join('<br>');
            errorBox.hidden = false;
            return;
          }

          var doc = App.db.addDocument({
            no: App.db.nextDocNo(type),
            type: type,
            residentId: resident.id,
            residentName: App.fullName(resident),
            purpose: purpose,
            fee: Number(form.elements.fee.value || 0),
            issuedAt: form.elements.issuedAt.value,
            issuedBy: (App.db.currentUser() || {}).name || 'Barangay Staff',
            status: form.elements.status.value,
            remarks: form.elements.remarks.value.trim()
          });
          App.db.log('Issued document', type + ' for ' + App.fullName(resident) + ' (' + doc.no + ')');
          App.toast(type + ' issued — ' + doc.no);
          api.close();
          App.refresh();
          if (typeof after === 'function') after(doc);
        });
      }
    });
    return modal;
  }

  /* ------------------------------ view ------------------------------ */
  function openDocumentView(doc) {
    var resident = doc.residentId ? App.db.resident(doc.residentId) : null;
    var isAdmin = (App.db.currentUser() || {}).role === 'admin';

    App.openModal({
      title: doc.type,
      subtitle: doc.no + ' · ' + doc.status,
      size: 'md',
      body:
        '<dl class="dl">' +
          '<div class="dl-row"><dt>Reference no.</dt><dd>' + App.esc(doc.no) + '</dd></div>' +
          '<div class="dl-row"><dt>Resident</dt><dd>' + App.esc(doc.residentName) + (resident ? ' <span style="color:var(--muted);font-weight:400">(' + App.esc(resident.id) + ')</span>' : '') + '</dd></div>' +
          '<div class="dl-row"><dt>Purok</dt><dd>' + App.esc(resident ? resident.purok : '—') + '</dd></div>' +
          '<div class="dl-row"><dt>Purpose</dt><dd>' + App.esc(doc.purpose) + '</dd></div>' +
          '<div class="dl-row"><dt>Fee</dt><dd>' + App.money(doc.fee) + '</dd></div>' +
          '<div class="dl-row"><dt>Date issued</dt><dd>' + App.esc(App.fmtDate(doc.issuedAt)) + '</dd></div>' +
          '<div class="dl-row"><dt>Issued by</dt><dd>' + App.esc(doc.issuedBy) + '</dd></div>' +
          '<div class="dl-row"><dt>Status</dt><dd><span class="badge ' + App.docTone(doc.status) + '">' + App.esc(doc.status) + '</span></dd></div>' +
          '<div class="dl-row"><dt>Remarks</dt><dd>' + App.esc(doc.remarks || '—') + '</dd></div>' +
        '</dl>',
      footer:
        (isAdmin ? '<button class="btn btn-danger-ghost left" data-act="delete" type="button">' + App.icon('trash') + ' Delete</button>' : '') +
        (doc.status === 'Issued' ? '<button class="btn btn-ghost" data-act="release" type="button">' + App.icon('check') + ' Mark released</button>' : '') +
        (doc.status !== 'Cancelled' ? '<button class="btn btn-ghost" data-act="cancel-doc" type="button">Cancel document</button>' : '') +
        '<button class="btn btn-primary" data-act="print" type="button">' + App.icon('print') + ' Print</button>',
      focusFirst: false,
      onMount: function (api) {
        api.panel.querySelector('[data-act=print]').addEventListener('click', function () {
          App.previewSheet(doc.type, App.documentSheet(doc));
        });
        var release = api.panel.querySelector('[data-act=release]');
        if (release) release.addEventListener('click', function () {
          App.db.updateDocument(doc.id, { status: 'Released' });
          App.db.log('Released document', doc.no + ' — ' + doc.residentName);
          App.toast('Marked as released.');
          api.close();
          App.refresh();
        });
        var cancel = api.panel.querySelector('[data-act=cancel-doc]');
        if (cancel) cancel.addEventListener('click', function () {
          api.close();
          App.confirm({
            title: 'Cancel this document?',
            message: doc.no + ' will be marked Cancelled. It remains in the register for auditing.',
            confirmText: 'Cancel document',
            tone: 'danger'
          }).then(function (ok) {
            if (!ok) return;
            App.db.updateDocument(doc.id, { status: 'Cancelled' });
            App.db.log('Cancelled document', doc.no + ' — ' + doc.residentName);
            App.toast('Document cancelled.', 'info');
            App.refresh();
          });
        });
        var del = api.panel.querySelector('[data-act=delete]');
        if (del) del.addEventListener('click', function () {
          api.close();
          App.confirm({
            title: 'Delete document record?',
            message: 'This removes ' + doc.no + ' from the register permanently.',
            confirmText: 'Delete', tone: 'danger'
          }).then(function (ok) {
            if (!ok) return;
            App.db.removeDocument(doc.id);
            App.db.log('Deleted document', doc.no);
            App.toast('Document record deleted.', 'info');
            App.refresh();
          });
        });
      }
    });
  }

  /* ------------------------------ list ------------------------------ */
  App.views.documents = function (root, params) {
    var ui = { q: '', type: '', status: '', page: 1 };
    var settings = App.db.settings();

    root.innerHTML =
      '<div class="hero">' +
        '<div><h2>Clearances &amp; certificates</h2><p>Process barangay documents, record fees and print official copies.</p></div>' +
        '<div class="hero-actions">' +
          '<button class="btn btn-ghost" data-act="export">' + App.icon('download') + ' Export CSV</button>' +
          '<button class="btn btn-primary" data-act="issue">' + App.icon('plus') + ' Issue document</button>' +
        '</div>' +
      '</div>' +
      '<div class="grid grid-4" style="margin-bottom:16px">' +
        '<div class="card stat"><div class="stat-top"><span class="stat-label">Total issued</span><span class="stat-icon">' + App.icon('file') + '</span></div>' +
          '<div class="stat-value" id="doc-total">0</div><div class="stat-meta">All documents on record</div></div>' +
        '<div class="card stat"><div class="stat-top"><span class="stat-label">Awaiting release</span><span class="stat-icon gold">' + App.icon('clock') + '</span></div>' +
          '<div class="stat-value" id="doc-issued">0</div><div class="stat-meta">Issued but not yet claimed</div></div>' +
        '<div class="card stat"><div class="stat-top"><span class="stat-label">Fees collected</span><span class="stat-icon green">' + App.icon('money') + '</span></div>' +
          '<div class="stat-value" id="doc-fees" style="font-size:26px">₱0.00</div><div class="stat-meta">Excluding cancelled documents</div></div>' +
        '<div class="card stat"><div class="stat-top"><span class="stat-label">Candidates this month</span><span class="stat-icon">' + App.icon('users') + '</span></div>' +
          '<div class="stat-value" id="doc-month">0</div><div class="stat-meta">Documents issued this month</div></div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="toolbar">' +
          '<div class="search">' + App.icon('search') + '<input id="doc-q" type="search" placeholder="Search reference, resident or purpose…" /></div>' +
          '<div class="filters">' +
            '<select id="doc-type"><option value="">All document types</option>' + App.DOC_TYPES.map(function (t) { return '<option>' + App.esc(t) + '</option>'; }).join('') + '</select>' +
            '<select id="doc-status"><option value="">All statuses</option>' + App.DOC_STATUS.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select>' +
          '</div>' +
        '</div>' +
        '<div class="table-wrap"><table><thead><tr><th>Reference</th><th>Document</th><th>Resident</th><th>Purpose</th><th>Issued</th><th class="num">Fee</th><th>Status</th><th class="num">Actions</th></tr></thead>' +
        '<tbody id="doc-body"></tbody></table></div>' +
        '<div class="table-foot"><span id="doc-count"></span>' +
          '<div class="pager"><button class="btn btn-ghost btn-sm" id="doc-prev" type="button">Previous</button>' +
          '<span id="doc-page" style="padding:0 4px"></span>' +
          '<button class="btn btn-ghost btn-sm" id="doc-next" type="button">Next</button></div></div>' +
      '</div>';

    function filtered() {
      var q = ui.q.toLowerCase().trim();
      return App.db.documents().filter(function (d) {
        if (ui.type && d.type !== ui.type) return false;
        if (ui.status && d.status !== ui.status) return false;
        if (!q) return true;
        return [d.no, d.residentName, d.purpose, d.type].join(' ').toLowerCase().indexOf(q) !== -1;
      }).sort(function (a, b) {
        return String(b.issuedAt).localeCompare(String(a.issuedAt)) || String(b.no).localeCompare(String(a.no));
      });
    }

    function renderStats() {
      var docs = App.db.documents();
      var month = App.todayISO().slice(0, 7);
      root.querySelector('#doc-total').textContent = App.num(docs.filter(function (d) { return d.status !== 'Cancelled'; }).length);
      root.querySelector('#doc-issued').textContent = App.num(docs.filter(function (d) { return d.status === 'Issued'; }).length);
      root.querySelector('#doc-fees').textContent = App.money(docs.filter(function (d) { return d.status !== 'Cancelled'; })
        .reduce(function (sum, d) { return sum + Number(d.fee || 0); }, 0));
      root.querySelector('#doc-month').textContent = App.num(docs.filter(function (d) {
        return String(d.issuedAt).slice(0, 7) === month && d.status !== 'Cancelled';
      }).length);
    }

    function render() {
      var rows = filtered();
      var pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
      if (ui.page > pages) ui.page = pages;
      var start = (ui.page - 1) * PAGE_SIZE;
      var slice = rows.slice(start, start + PAGE_SIZE);
      var tbody = root.querySelector('#doc-body');

      if (!slice.length) {
        tbody.innerHTML = '<tr><td colspan="8"><div class="empty"><div class="empty-icon">' + App.icon('file') + '</div>' +
          '<h4>No documents found</h4><p>Issue a clearance or certificate, or adjust the filters above.</p>' +
          '<button class="btn btn-primary btn-sm" data-act="issue">' + App.icon('plus') + ' Issue document</button></div></td></tr>';
      } else {
        tbody.innerHTML = slice.map(function (d) {
          return '<tr data-id="' + App.attr(d.id) + '">' +
            '<td class="cell-strong">' + App.highlight(d.no, ui.q) + '</td>' +
            '<td>' + App.esc(d.type) + '</td>' +
            '<td><div class="cell-strong">' + App.esc(d.residentName) + '</div><div class="cell-sub">' + App.esc((App.db.resident(d.residentId) || {}).purok || '—') + '</div></td>' +
            '<td>' + App.esc(d.purpose) + '</td>' +
            '<td>' + App.esc(App.fmtDate(d.issuedAt)) + '</td>' +
            '<td class="num">' + App.money(d.fee) + '</td>' +
            '<td><span class="badge ' + App.docTone(d.status) + '">' + App.esc(d.status) + '</span></td>' +
            '<td><div class="row-actions">' +
              '<button class="mini-btn" data-row="view" title="View details" aria-label="View details">' + App.icon('eye') + '</button>' +
              '<button class="mini-btn" data-row="print" title="Print document" aria-label="Print document">' + App.icon('print') + '</button>' +
              (d.status === 'Issued' ? '<button class="mini-btn" data-row="release" title="Mark released" aria-label="Mark released">' + App.icon('check') + '</button>' : '') +
            '</div></td>' +
          '</tr>';
        }).join('');
      }

      root.querySelector('#doc-count').textContent = rows.length
        ? 'Showing ' + (start + 1) + '–' + Math.min(start + PAGE_SIZE, rows.length) + ' of ' + rows.length + ' document' + (rows.length === 1 ? '' : 's')
        : 'No documents to display';
      root.querySelector('#doc-page').textContent = 'Page ' + ui.page + ' of ' + pages;
      root.querySelector('#doc-prev').disabled = ui.page <= 1;
      root.querySelector('#doc-next').disabled = ui.page >= pages;
      renderStats();
    }

    function exportCSV() {
      var rows = [['Reference', 'Document type', 'Resident', 'Resident ID', 'Purpose', 'Fee', 'Date issued', 'Issued by', 'Status', 'Remarks']];
      filtered().forEach(function (d) {
        rows.push([d.no, d.type, d.residentName, d.residentId, d.purpose, d.fee, d.issuedAt, d.issuedBy, d.status, d.remarks]);
      });
      App.exportCSV('barangay-documents-' + App.todayISO() + '.csv', rows);
    }

    root.querySelector('#doc-q').addEventListener('input', App.debounce(function (e) {
      ui.q = e.target.value; ui.page = 1; render();
    }, 160));
    root.querySelector('#doc-type').addEventListener('change', function (e) { ui.type = e.target.value; ui.page = 1; render(); });
    root.querySelector('#doc-status').addEventListener('change', function (e) { ui.status = e.target.value; ui.page = 1; render(); });
    root.querySelector('#doc-prev').addEventListener('click', function () { if (ui.page > 1) { ui.page--; render(); } });
    root.querySelector('#doc-next').addEventListener('click', function () { ui.page++; render(); });

    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-act=issue]')) { openDocumentForm(null); return; }
      if (e.target.closest('[data-act=export]')) { exportCSV(); return; }
      var btn = e.target.closest('[data-row]');
      if (!btn) return;
      var tr = btn.closest('tr');
      var doc = App.db.document(tr.getAttribute('data-id'));
      if (!doc) return;
      var action = btn.getAttribute('data-row');
      if (action === 'view') openDocumentView(doc);
      else if (action === 'print') App.previewSheet(doc.type, App.documentSheet(doc));
      else if (action === 'release') {
        App.db.updateDocument(doc.id, { status: 'Released' });
        App.db.log('Released document', doc.no + ' — ' + doc.residentName);
        App.toast(doc.no + ' marked as released.');
        render();
      }
    });

    render();

    if (params && params.get('add') === '1') {
      var preselect = params.get('resident') || '';
      history.replaceState(null, '', '#/documents');
      openDocumentForm(preselect);
    }
    void settings;
  };

  App.openDocumentForm = openDocumentForm;
  App.openDocumentView = openDocumentView;
})();
