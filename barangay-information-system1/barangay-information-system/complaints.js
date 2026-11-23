/* ============================================================
   Complaints & incident reporting (blotter)
   ============================================================ */
(function () {
  var App = window.App;
  App.views = App.views || {};
  var PAGE_SIZE = 9;
  var input = App.formInput;

  function complaintSheet(c) {
    var s = App.db.settings();
    return '<div class="sheet">' +
      App.letterhead() +
      '<div class="sheet-meta"><span>Case No.: <b>' + App.esc(c.caseNo) + '</b></span><span>Date Filed: <b>' + App.esc(App.fmtDate(c.filedAt)) + '</b></span></div>' +
      '<div class="sheet-title" style="font-size:17pt;margin-top:28px">Barangay Blotter Report</div>' +
      '<div class="sheet-title-sub">' + App.esc(c.type) + ' · ' + App.esc(c.status) + '</div>' +
      '<dl>' +
        '<dt>Complainant</dt><dd>' + App.esc(c.complainantName) + '</dd>' +
        '<dt>Contact</dt><dd>' + App.esc(c.complainantContact || '—') + '</dd>' +
        '<dt>Respondent</dt><dd>' + App.esc(c.respondent) + '</dd>' +
        '<dt>Place of incident</dt><dd>' + App.esc(c.location || '—') + '</dd>' +
        '<dt>Date filed</dt><dd>' + App.esc(App.fmtLongDate(c.filedAt)) + '</dd>' +
        '<dt>Hearing schedule</dt><dd>' + App.esc(c.hearingAt ? App.fmtLongDate(c.hearingAt) : 'Not scheduled') + '</dd>' +
        '<dt>Status</dt><dd>' + App.esc(c.status) + '</dd>' +
        '<dt>Handled by</dt><dd>' + App.esc(c.handledBy || s.captain) + '</dd>' +
      '</dl>' +
      '<div class="sheet-section-title">Narrative report</div>' +
      '<p style="text-indent:0;margin-bottom:8px">' + App.esc(c.narrative) + '</p>' +
      (c.resolution ? '<div class="sheet-section-title">Resolution / action taken</div><p style="text-indent:0">' + App.esc(c.resolution) + '</p>' : '') +
      '<div class="sheet-sign">' +
        '<div class="block"><div class="role">Recorded by:</div><div class="name">' + App.esc(s.secretary) + '</div><div class="role">Barangay Secretary</div></div>' +
        '<div class="block"><div class="role">Attested by:</div><div class="name">' + App.esc(s.captain) + '</div><div class="role">Punong Barangay</div></div>' +
      '</div>' +
      '<div class="sheet-foot"><span>Barangay Blotter · ' + App.esc(s.barangayName) + '</span><span>Printed ' + App.esc(App.fmtLongDate(new Date())) + '</span></div>' +
    '</div>';
  }

  function chooseResidentOptions(selectedId) {
    return App.db.residents()
      .filter(function (r) { return r.status === 'Active'; })
      .sort(function (a, b) { return (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName); })
      .map(function (r) {
        return '<option value="' + App.attr(r.id) + '"' + (selectedId === r.id ? ' selected' : '') + '>' +
          App.esc(App.fullName(r) + ' · ' + r.id) + '</option>';
      }).join('');
  }

  function openComplaintForm(existing, after) {
    var c = existing || {};
    var isEdit = !!existing;
    var today = App.todayISO();

    var modal = App.openModal({
      title: isEdit ? 'Update complaint ' + c.caseNo : 'File a complaint or incident report',
      subtitle: isEdit ? 'Change the case details, schedule or status.' : 'The case number is assigned automatically.',
      size: 'lg',
      body:
        '<form id="complaint-form" novalidate>' +
          '<div class="form-section">' +
            '<div class="form-section-title">Parties involved</div>' +
            '<div class="form-grid">' +
              '<div class="field"><label>Complainant <span class="req">*</span></label>' +
                '<select name="complainantId"><option value="">— Walk-in / non-resident —</option>' +
                chooseResidentOptions(c.complainantId) + '</select></div>' +
              '<div class="field"><label>Complainant name <span class="req">*</span></label>' +
                '<input name="complainantName" value="' + App.attr(c.complainantId ? '' : (c.complainantName || '')) + '" placeholder="Full name" /></div>' +
              '<div class="field"><label>Contact number</label>' +
                '<input name="complainantContact" value="' + App.attr(c.complainantContact || '') + '" placeholder="0917 000 0000" /></div>' +
              '<div class="field"><label>Respondent <span class="req">*</span></label>' +
                '<input name="respondent" value="' + App.attr(c.respondent || '') + '" placeholder="Person or group complained about" /></div>' +
              '<div class="field field-full"><label>Place of incident</label>' +
                '<input name="location" value="' + App.attr(c.location || '') + '" placeholder="e.g. Purok 3, near the barangay hall" /></div>' +
            '</div>' +
          '</div>' +
          '<div class="form-section">' +
            '<div class="form-section-title">Case details</div>' +
            '<div class="form-grid">' +
              '<div class="field"><label>Complaint type <span class="req">*</span></label><select name="type">' +
                App.COMPLAINT_TYPES.map(function (t) {
                  return '<option' + (c.type === t ? ' selected' : '') + '>' + App.esc(t) + '</option>';
                }).join('') + '</select></div>' +
              '<div class="field"><label>Date filed</label><input name="filedAt" type="date" value="' + App.attr(c.filedAt || today) + '" max="' + today + '" /></div>' +
              '<div class="field"><label>Hearing schedule</label><input name="hearingAt" type="date" value="' + App.attr(c.hearingAt || '') + '" /></div>' +
              '<div class="field"><label>Status</label><select name="status">' +
                App.COMPLAINT_STATUS.map(function (t) {
                  return '<option' + (c.status === t ? ' selected' : '') + '>' + App.esc(t) + '</option>';
                }).join('') + '</select></div>' +
              '<div class="field field-full"><label>Narrative <span class="req">*</span></label>' +
                '<textarea name="narrative" placeholder="Describe what happened, when, and who was involved." required>' + App.esc(c.narrative || '') + '</textarea></div>' +
              '<div class="field field-full"><label>Resolution / action taken</label>' +
                '<textarea name="resolution" placeholder="Required when the case is resolved or dismissed.">' + App.esc(c.resolution || '') + '</textarea></div>' +
            '</div>' +
            '<div class="form-error" id="complaint-error" hidden></div>' +
          '</div>' +
        '</form>',
      footer:
        '<button class="btn btn-ghost" data-act="cancel" type="button">Cancel</button>' +
        '<button class="btn btn-primary" data-act="save" type="submit" form="complaint-form">' +
        (isEdit ? 'Save changes' : 'File complaint') + '</button>',
      onMount: function (api) {
        var form = api.panel.querySelector('#complaint-form');
        var errorBox = api.panel.querySelector('#complaint-error');
        var residentSelect = form.elements.complainantId;
        var nameInput = form.elements.complainantName;
        var contactInput = form.elements.complainantContact;

        function syncComplainant() {
          var resident = residentSelect.value ? App.db.resident(residentSelect.value) : null;
          if (resident) {
            nameInput.value = App.fullName(resident);
            nameInput.readOnly = true;
            nameInput.style.background = 'var(--neutral-bg)';
            if (!contactInput.value) contactInput.value = resident.contact;
          } else {
            nameInput.readOnly = false;
            nameInput.style.background = '';
          }
        }
        residentSelect.addEventListener('change', syncComplainant);
        syncComplainant();

        api.panel.querySelector('[data-act=cancel]').addEventListener('click', api.close);

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var data = {
            complainantId: residentSelect.value,
            complainantName: form.elements.complainantName.value.trim(),
            complainantContact: form.elements.complainantContact.value.trim(),
            respondent: form.elements.respondent.value.trim(),
            type: form.elements.type.value,
            location: form.elements.location.value.trim(),
            filedAt: form.elements.filedAt.value,
            hearingAt: form.elements.hearingAt.value,
            status: form.elements.status.value,
            narrative: form.elements.narrative.value.trim(),
            resolution: form.elements.resolution.value.trim()
          };
          var errors = [];
          if (!data.complainantName) errors.push('Complainant name is required.');
          if (!data.respondent) errors.push('Respondent is required.');
          if (!data.narrative || data.narrative.length < 12) errors.push('Please provide a narrative of at least a few sentences.');
          if (!data.filedAt) errors.push('Date filed is required.');
          if ((data.status === 'Resolved' || data.status === 'Dismissed') && !data.resolution) {
            errors.push('Please record the resolution before marking this case ' + data.status.toLowerCase() + '.');
          }
          if (errors.length) {
            errorBox.innerHTML = errors.map(function (m) { return '• ' + App.esc(m); }).join('<br>');
            errorBox.hidden = false;
            return;
          }

          var saved;
          if (isEdit) {
            saved = App.db.updateComplaint(existing.id, data);
            App.db.log('Updated complaint', saved.caseNo + ' — ' + saved.status);
            App.toast('Complaint record updated.');
          } else {
            data.caseNo = App.db.nextCaseNo();
            data.handledBy = (App.db.currentUser() || {}).name || 'Barangay Staff';
            saved = App.db.addComplaint(data);
            App.db.log('Filed complaint', saved.caseNo + ' — ' + saved.type);
            App.toast('Complaint recorded as ' + saved.caseNo + '.');
          }
          api.close();
          App.refresh();
          if (typeof after === 'function') after(saved);
        });
      }
    });
    return modal;
  }

  function openComplaintView(c) {
    var isAdmin = (App.db.currentUser() || {}).role === 'admin';
    App.openModal({
      title: c.type,
      subtitle: c.caseNo + ' · ' + App.esc(c.status),
      size: 'lg',
      body:
        '<div class="row" style="margin-bottom:16px">' +
          '<span class="badge ' + App.complaintTone(c.status) + '">' + App.esc(c.status) + '</span>' +
          '<span class="badge badge-muted">Filed ' + App.esc(App.fmtDate(c.filedAt)) + '</span>' +
          (c.hearingAt ? '<span class="badge badge-gold">Hearing ' + App.esc(App.fmtDate(c.hearingAt)) + '</span>' : '') +
        '</div>' +
        '<dl class="dl">' +
          '<div class="dl-row"><dt>Case number</dt><dd>' + App.esc(c.caseNo) + '</dd></div>' +
          '<div class="dl-row"><dt>Complainant</dt><dd>' + App.esc(c.complainantName) + '</dd></div>' +
          '<div class="dl-row"><dt>Contact</dt><dd>' + App.esc(c.complainantContact || '—') + '</dd></div>' +
          '<div class="dl-row"><dt>Respondent</dt><dd>' + App.esc(c.respondent) + '</dd></div>' +
          '<div class="dl-row"><dt>Place</dt><dd>' + App.esc(c.location || '—') + '</dd></div>' +
          '<div class="dl-row"><dt>Handled by</dt><dd>' + App.esc(c.handledBy || '—') + '</dd></div>' +
        '</dl>' +
        '<div class="form-section-title" style="margin:18px 0 6px">Narrative</div>' +
        '<p style="font-size:13px;line-height:1.65;color:var(--ink-2);background:#fbfcfd;border:1px solid var(--line);border-radius:10px;padding:12px">' + App.esc(c.narrative) + '</p>' +
        (c.resolution ?
          '<div class="form-section-title" style="margin:18px 0 6px">Resolution</div>' +
          '<p style="font-size:13px;line-height:1.65;color:var(--ok);background:var(--ok-bg);border:1px solid #bbf0d4;border-radius:10px;padding:12px">' + App.esc(c.resolution) + '</p>' : '') +
        '<div class="form-section-title" style="margin:18px 0 6px">Quick status update</div>' +
        '<div class="row">' +
          App.COMPLAINT_STATUS.map(function (st) {
            return '<button class="btn btn-sm ' + (st === c.status ? 'btn-primary' : 'btn-subtle') + '" data-status="' + App.attr(st) + '" type="button">' + App.esc(st) + '</button>';
          }).join('') +
        '</div>',
      footer:
        (isAdmin ? '<button class="btn btn-danger-ghost left" data-act="delete" type="button">' + App.icon('trash') + ' Delete</button>' : '') +
        '<button class="btn btn-ghost" data-act="print" type="button">' + App.icon('print') + ' Print blotter</button>' +
        '<button class="btn btn-primary" data-act="edit" type="button">' + App.icon('edit') + ' Update case</button>',
      focusFirst: false,
      onMount: function (api) {
        api.panel.querySelector('[data-act=print]').addEventListener('click', function () {
          App.previewSheet('Blotter report', complaintSheet(c));
        });
        api.panel.querySelector('[data-act=edit]').addEventListener('click', function () {
          api.close();
          openComplaintForm(c);
        });
        api.panel.querySelectorAll('[data-status]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var next = btn.getAttribute('data-status');
            if (next === c.status) return;
            if ((next === 'Resolved' || next === 'Dismissed') && !c.resolution) {
              api.close();
              openComplaintForm(c);
              App.toast('Add a resolution before closing this case.', 'info');
              return;
            }
            App.db.updateComplaint(c.id, { status: next });
            App.db.log('Updated complaint', c.caseNo + ' marked ' + next);
            App.toast('Case marked ' + next.toLowerCase() + '.');
            api.close();
            App.refresh();
          });
        });
        var del = api.panel.querySelector('[data-act=delete]');
        if (del) del.addEventListener('click', function () {
          api.close();
          App.confirm({
            title: 'Delete complaint record?',
            message: c.caseNo + ' will be removed permanently from the blotter.',
            confirmText: 'Delete case', tone: 'danger'
          }).then(function (ok) {
            if (!ok) return;
            App.db.removeComplaint(c.id);
            App.db.log('Deleted complaint', c.caseNo);
            App.toast('Complaint record deleted.', 'info');
            App.refresh();
          });
        });
      }
    });
  }

  /* ------------------------------ list ------------------------------ */
  App.views.complaints = function (root, params) {
    var ui = { q: '', type: '', status: '', page: 1 };

    root.innerHTML =
      '<div class="hero">' +
        '<div><h2>Complaints &amp; incidents</h2><p>Record blotter entries, schedule hearings and track case resolution.</p></div>' +
        '<div class="hero-actions">' +
          '<button class="btn btn-ghost" data-act="export">' + App.icon('download') + ' Export CSV</button>' +
          '<button class="btn btn-primary" data-act="add">' + App.icon('plus') + ' File complaint</button>' +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="toolbar">' +
          '<div class="search">' + App.icon('search') + '<input id="cmp-q" type="search" placeholder="Search case no., complainant or respondent…" /></div>' +
          '<div class="filters">' +
            '<select id="cmp-type"><option value="">All types</option>' + App.COMPLAINT_TYPES.map(function (t) { return '<option>' + App.esc(t) + '</option>'; }).join('') + '</select>' +
            '<select id="cmp-status"><option value="">All statuses</option>' + App.COMPLAINT_STATUS.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select>' +
          '</div>' +
        '</div>' +
        '<div class="table-wrap"><table><thead><tr><th>Case</th><th>Complainant</th><th>Respondent</th><th>Type</th><th>Filed</th><th>Hearing</th><th>Status</th><th class="num">Actions</th></tr></thead>' +
        '<tbody id="cmp-body"></tbody></table></div>' +
        '<div class="table-foot"><span id="cmp-count"></span>' +
          '<div class="pager"><button class="btn btn-ghost btn-sm" id="cmp-prev" type="button">Previous</button>' +
          '<span id="cmp-page" style="padding:0 4px"></span>' +
          '<button class="btn btn-ghost btn-sm" id="cmp-next" type="button">Next</button></div></div>' +
      '</div>';

    function filtered() {
      var q = ui.q.toLowerCase().trim();
      return App.db.complaints().filter(function (c) {
        if (ui.type && c.type !== ui.type) return false;
        if (ui.status && c.status !== ui.status) return false;
        if (!q) return true;
        return [c.caseNo, c.complainantName, c.respondent, c.type, c.location].join(' ').toLowerCase().indexOf(q) !== -1;
      }).sort(function (a, b) {
        return String(b.filedAt).localeCompare(String(a.filedAt));
      });
    }

    function render() {
      var rows = filtered();
      var pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
      if (ui.page > pages) ui.page = pages;
      var start = (ui.page - 1) * PAGE_SIZE;
      var slice = rows.slice(start, start + PAGE_SIZE);
      var tbody = root.querySelector('#cmp-body');

      if (!slice.length) {
        tbody.innerHTML = '<tr><td colspan="8"><div class="empty"><div class="empty-icon">' + App.icon('alert') + '</div>' +
          '<h4>No complaints on record</h4><p>File a complaint to start a blotter entry for this barangay.</p>' +
          '<button class="btn btn-primary btn-sm" data-act="add">' + App.icon('plus') + ' File complaint</button></div></td></tr>';
      } else {
        tbody.innerHTML = slice.map(function (c) {
          return '<tr data-id="' + App.attr(c.id) + '">' +
            '<td class="cell-strong">' + App.highlight(c.caseNo, ui.q) + '</td>' +
            '<td><div class="cell-strong">' + App.esc(c.complainantName) + '</div><div class="cell-sub">' + App.esc(c.complainantContact || '—') + '</div></td>' +
            '<td>' + App.esc(c.respondent) + '</td>' +
            '<td>' + App.esc(c.type) + '</td>' +
            '<td>' + App.esc(App.fmtDate(c.filedAt)) + '</td>' +
            '<td>' + App.esc(c.hearingAt ? App.fmtDate(c.hearingAt) : '—') + '</td>' +
            '<td><span class="badge ' + App.complaintTone(c.status) + '">' + App.esc(c.status) + '</span></td>' +
            '<td><div class="row-actions">' +
              '<button class="mini-btn" data-row="view" title="View case" aria-label="View case">' + App.icon('eye') + '</button>' +
              '<button class="mini-btn" data-row="edit" title="Update case" aria-label="Update case">' + App.icon('edit') + '</button>' +
              '<button class="mini-btn" data-row="print" title="Print blotter" aria-label="Print blotter">' + App.icon('print') + '</button>' +
            '</div></td>' +
          '</tr>';
        }).join('');
      }

      root.querySelector('#cmp-count').textContent = rows.length
        ? 'Showing ' + (start + 1) + '–' + Math.min(start + PAGE_SIZE, rows.length) + ' of ' + rows.length + ' case' + (rows.length === 1 ? '' : 's')
        : 'No cases to display';
      root.querySelector('#cmp-page').textContent = 'Page ' + ui.page + ' of ' + pages;
      root.querySelector('#cmp-prev').disabled = ui.page <= 1;
      root.querySelector('#cmp-next').disabled = ui.page >= pages;
    }

    function exportCSV() {
      var rows = [['Case number', 'Complainant', 'Contact', 'Respondent', 'Type', 'Location', 'Filed', 'Hearing', 'Status', 'Resolution', 'Handled by']];
      filtered().forEach(function (c) {
        rows.push([c.caseNo, c.complainantName, c.complainantContact, c.respondent, c.type, c.location, c.filedAt, c.hearingAt, c.status, c.resolution, c.handledBy]);
      });
      App.exportCSV('barangay-complaints-' + App.todayISO() + '.csv', rows);
    }

    root.querySelector('#cmp-q').addEventListener('input', App.debounce(function (e) {
      ui.q = e.target.value; ui.page = 1; render();
    }, 160));
    root.querySelector('#cmp-type').addEventListener('change', function (e) { ui.type = e.target.value; ui.page = 1; render(); });
    root.querySelector('#cmp-status').addEventListener('change', function (e) { ui.status = e.target.value; ui.page = 1; render(); });
    root.querySelector('#cmp-prev').addEventListener('click', function () { if (ui.page > 1) { ui.page--; render(); } });
    root.querySelector('#cmp-next').addEventListener('click', function () { ui.page++; render(); });

    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-act=add]')) { openComplaintForm(null); return; }
      if (e.target.closest('[data-act=export]')) { exportCSV(); return; }
      var btn = e.target.closest('[data-row]');
      if (!btn) return;
      var tr = btn.closest('tr');
      var c = App.db.complaint(tr.getAttribute('data-id'));
      if (!c) return;
      var action = btn.getAttribute('data-row');
      if (action === 'view') openComplaintView(c);
      else if (action === 'edit') openComplaintForm(c);
      else if (action === 'print') App.previewSheet('Blotter report', complaintSheet(c));
    });

    render();

    if (params && params.get('add') === '1') {
      history.replaceState(null, '', '#/complaints');
      openComplaintForm(null);
    }
  };

  App.openComplaintForm = openComplaintForm;
  App.openComplaintView = openComplaintView;
  App.complaintSheet = complaintSheet;
})();
