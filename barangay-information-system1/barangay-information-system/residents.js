/* ============================================================
   Residents — registration, records, search, updates
   ============================================================ */
(function () {
  var App = window.App;
  App.views = App.views || {};
  var PAGE_SIZE = 9;

  function fieldsOf() {
    return ['firstName', 'middleName', 'lastName', 'suffix', 'sex', 'birthDate', 'civilStatus',
      'religion', 'occupation', 'contact', 'email', 'houseNo', 'purok', 'householdNo',
      'citizenship', 'voterStatus', 'bloodType', 'emergencyName', 'emergencyContact', 'status', 'notes'];
  }

  function input(name, label, opts) {
    opts = opts || {};
    var value = opts.value == null ? '' : opts.value;
    var type = opts.type || 'text';
    var required = opts.required ? ' required' : '';
    var cls = opts.full ? ' field-full' : '';
    var control;
    if (opts.options) {
      control = '<select name="' + name + '"' + required + '>' +
        (opts.placeholder ? '<option value="">' + App.esc(opts.placeholder) + '</option>' : '') +
        opts.options.map(function (o) {
          var v = typeof o === 'string' ? o : o.value;
          var l = typeof o === 'string' ? o : o.label;
          return '<option value="' + App.attr(v) + '"' + (String(value) === String(v) ? ' selected' : '') + '>' + App.esc(l) + '</option>';
        }).join('') + '</select>';
    } else if (opts.textarea) {
      control = '<textarea name="' + name + '" placeholder="' + App.attr(opts.placeholder || '') + '"' + required + '>' + App.esc(value) + '</textarea>';
    } else {
      control = '<input name="' + name + '" type="' + type + '" value="' + App.attr(value) + '"' +
        (opts.placeholder ? ' placeholder="' + App.attr(opts.placeholder) + '"' : '') +
        (opts.max ? ' max="' + App.attr(opts.max) + '"' : '') +
        (opts.min ? ' min="' + App.attr(opts.min) + '"' : '') +
        required + ' />';
    }
    return '<div class="field' + cls + '"><label>' + App.esc(label) + (opts.required ? ' <span class="req">*</span>' : '') + '</label>' +
      control + (opts.hint ? '<span class="field-hint">' + App.esc(opts.hint) + '</span>' : '') + '</div>';
  }

  App.formInput = input;

  function residentForm(resident) {
    var r = resident || {};
    var isEdit = !!resident;
    return '<form id="resident-form" novalidate>' +
      '<div class="form-section">' +
        '<div class="form-section-title">Personal information</div>' +
        '<div class="form-grid cols-3">' +
          input('firstName', 'First name', { value: r.firstName, required: true, placeholder: 'Juan' }) +
          input('middleName', 'Middle name', { value: r.middleName, placeholder: 'Santos' }) +
          input('lastName', 'Last name', { value: r.lastName, required: true, placeholder: 'Dela Cruz' }) +
          input('suffix', 'Suffix', { value: r.suffix, placeholder: 'Jr., Sr., III' }) +
          input('sex', 'Sex', { value: r.sex || 'Male', required: true, options: ['Male', 'Female'] }) +
          input('birthDate', 'Date of birth', { value: r.birthDate, type: 'date', required: true, max: App.todayISO() }) +
          input('civilStatus', 'Civil status', { value: r.civilStatus || 'Single', required: true, options: ['Single', 'Married', 'Widowed', 'Separated', 'Annulled'] }) +
          input('religion', 'Religion', { value: r.religion || 'Roman Catholic', placeholder: 'Roman Catholic' }) +
          input('occupation', 'Occupation', { value: r.occupation, placeholder: 'Farmer' }) +
        '</div>' +
      '</div>' +
      '<div class="form-section">' +
        '<div class="form-section-title">Address &amp; household</div>' +
        '<div class="form-grid cols-3">' +
          input('houseNo', 'House no.', { value: r.houseNo, placeholder: '12' }) +
          input('purok', 'Purok', { value: r.purok, required: true, options: App.PUROKS, placeholder: 'Select purok' }) +
          input('householdNo', 'Household no.', { value: r.householdNo, placeholder: 'HS-001' }) +
        '</div>' +
      '</div>' +
      '<div class="form-section">' +
        '<div class="form-section-title">Contact &amp; civil registry</div>' +
        '<div class="form-grid">' +
          input('contact', 'Contact number', { value: r.contact, required: true, placeholder: '0917 000 0000' }) +
          input('email', 'Email address', { value: r.email, type: 'email', placeholder: 'name@example.com' }) +
          input('citizenship', 'Citizenship', { value: r.citizenship || 'Filipino', placeholder: 'Filipino' }) +
          input('voterStatus', 'Voter status', { value: r.voterStatus || 'Registered', required: true, options: ['Registered', 'Not Registered'] }) +
          input('bloodType', 'Blood type', { value: r.bloodType, placeholder: 'O+' }) +
          input('emergencyName', 'Emergency contact person', { value: r.emergencyName, placeholder: 'Name of relative' }) +
          input('emergencyContact', 'Emergency contact number', { value: r.emergencyContact, placeholder: '0917 000 0000' }) +
          input('status', 'Residency status', { value: r.status || 'Active', required: true, options: ['Active', 'Transferred', 'Deceased'] }) +
          input('notes', 'Notes / remarks', { value: r.notes, textarea: true, full: true, placeholder: 'Optional notes about this record' }) +
        '</div>' +
      '</div>' +
    '</form>';
  }

  function readForm(form) {
    var data = {};
    fieldsOf().forEach(function (name) {
      var el = form.elements[name];
      data[name] = el ? el.value.trim() : '';
    });
    return data;
  }

  function validate(data, existingId) {
    var errors = [];
    var required = [
      ['firstName', 'First name'], ['lastName', 'Last name'], ['sex', 'Sex'],
      ['birthDate', 'Date of birth'], ['civilStatus', 'Civil status'], ['purok', 'Purok'],
      ['contact', 'Contact number'], ['voterStatus', 'Voter status'], ['status', 'Residency status']
    ];
    required.forEach(function (pair) {
      if (!data[pair[0]]) errors.push(pair[1] + ' is required.');
    });
    if (data.birthDate) {
      var birth = App.parseDate(data.birthDate);
      if (!birth || birth > new Date()) errors.push('Date of birth cannot be in the future.');
      else if (App.age(data.birthDate) > 120) errors.push('Please check the date of birth.');
    }
    if (data.contact && data.contact !== '—' && !/^[0-9+()\s-]{7,20}$/.test(data.contact)) {
      errors.push('Contact number should contain 7–20 digits.');
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Email address is not valid.');
    }
    var duplicate = App.db.residents().filter(function (r) {
      return r.id !== existingId &&
        r.firstName.toLowerCase() === (data.firstName || '').toLowerCase() &&
        r.lastName.toLowerCase() === (data.lastName || '').toLowerCase() &&
        r.birthDate === data.birthDate;
    })[0];
    if (duplicate) errors.push('A matching record already exists: ' + App.fullName(duplicate) + ' (' + duplicate.id + ').');
    return errors;
  }

  function openForm(resident, after) {
    var isEdit = !!resident;
    var modal = App.openModal({
      title: isEdit ? 'Edit resident record' : 'Register a new resident',
      subtitle: isEdit ? resident.id + ' · ' + resident.purok : 'Fields marked with * are required.',
      size: 'lg',
      body: residentForm(resident),
      footer:
        '<button class="btn btn-ghost" data-act="cancel" type="button">Cancel</button>' +
        '<button class="btn btn-primary" data-act="save" type="submit" form="resident-form">' +
        (isEdit ? 'Save changes' : 'Register resident') + '</button>',
      onMount: function (api) {
        var form = api.panel.querySelector('#resident-form');
        var errorBox = document.createElement('div');
        errorBox.className = 'form-error';
        errorBox.hidden = true;
        form.prepend(errorBox);

        api.panel.querySelector('[data-act=cancel]').addEventListener('click', api.close);

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var data = readForm(form);
          var errors = validate(data, isEdit ? resident.id : null);
          form.querySelectorAll('.invalid').forEach(function (el) { el.classList.remove('invalid'); });
          if (errors.length) {
            errorBox.innerHTML = errors.map(function (m) { return '• ' + App.esc(m); }).join('<br>');
            errorBox.hidden = false;
            ['firstName', 'lastName', 'birthDate', 'purok', 'contact'].forEach(function (n) {
              if (!data[n] && form.elements[n]) form.elements[n].classList.add('invalid');
            });
            return;
          }
          var saved;
          if (isEdit) {
            saved = App.db.updateResident(resident.id, data);
            App.db.log('Updated resident', App.fullName(saved) + ' (' + saved.id + ')');
            App.toast('Resident record updated.');
          } else {
            saved = App.db.addResident(data);
            App.db.log('Registered resident', App.fullName(saved) + ' (' + saved.id + ')');
            App.toast('Resident registered successfully.');
          }
          api.close();
          var param = new URLSearchParams(location.hash.split('?')[1] || '');
          if (param.get('add') === '1') { location.hash = '#/residents'; }
          else App.refresh();
          if (typeof after === 'function') after(saved);
        });
      }
    });
    return modal;
  }

  function openProfile(id) {
    var r = App.db.resident(id);
    if (!r) { App.toast('Resident record not found.', 'error'); return; }
    var docs = App.db.documentsFor(r.id);
    var complaints = App.db.complaintsFor(r.id);
    var isAdmin = (App.db.currentUser() || {}).role === 'admin';

    var modal = App.openModal({
      title: App.fullName(r),
      subtitle: r.id + ' · ' + r.status + ' · Registered ' + App.fmtDate(r.registeredAt),
      size: 'lg',
      body:
        '<div class="row" style="gap:14px;margin-bottom:18px">' +
          '<div class="avatar" style="width:54px;height:54px;font-size:17px">' + App.esc(App.initials(App.fullName(r))) + '</div>' +
          '<div>' +
            '<div style="font-weight:650;font-size:15px">' + App.esc(App.fullName(r)) + '</div>' +
            '<div style="font-size:12.5px;color:var(--muted);margin-top:2px">' + App.esc(r.purok) + ' · ' + App.age(r.birthDate) + ' yrs old · ' + App.esc(r.civilStatus) + '</div>' +
          '</div>' +
          '<div class="spacer"></div>' +
          '<span class="badge ' + (r.status === 'Active' ? 'badge-ok' : r.status === 'Deceased' ? 'badge-muted' : 'badge-warn') + '">' + App.esc(r.status) + '</span>' +
          (r.voterStatus === 'Registered' ? ' <span class="badge badge-info">Voter</span>' : '') +
        '</div>' +
        '<div class="grid grid-2">' +
          '<div><div class="form-section-title" style="margin-bottom:6px">Personal</div><dl class="dl">' +
            row('Full name', App.fullName(r)) + row('Sex', r.sex) + row('Date of birth', App.fmtDate(r.birthDate)) +
            row('Civil status', r.civilStatus) + row('Religion', r.religion) + row('Occupation', r.occupation) +
            row('Blood type', r.bloodType || '—') +
          '</dl></div>' +
          '<div><div class="form-section-title" style="margin-bottom:6px">Address &amp; contact</div><dl class="dl">' +
            row('Address', App.residentAddress(r)) + row('Purok', r.purok) + row('Household no.', r.householdNo) +
            row('Contact', r.contact) + row('Email', r.email || '—') + row('Citizenship', r.citizenship) +
            row('Emergency contact', r.emergencyName ? r.emergencyName + (r.emergencyContact ? ' · ' + r.emergencyContact : '') : '—') +
          '</dl></div>' +
        '</div>' +
        '<div class="form-section-title" style="margin:18px 0 6px">Record details</div>' +
        '<dl class="dl">' + row('Registered on', App.fmtDate(r.registeredAt)) + row('Notes', r.notes || '—') + '</dl>' +
        '<div class="form-section-title" style="margin:20px 0 8px">Documents issued (' + docs.length + ')</div>' +
        (docs.length ?
          '<div class="table-wrap" style="border:1px solid var(--line);border-radius:10px"><table><thead><tr><th>Reference</th><th>Type</th><th>Issued</th><th>Status</th></tr></thead><tbody>' +
          docs.map(function (d) {
            return '<tr><td class="cell-strong">' + App.esc(d.no) + '</td><td>' + App.esc(d.type) + '</td><td>' + App.esc(App.fmtDate(d.issuedAt)) + '</td><td><span class="badge ' + docTone(d.status) + '">' + App.esc(d.status) + '</span></td></tr>';
          }).join('') + '</tbody></table></div>'
          : '<p style="font-size:12.5px;color:var(--muted)">No clearances or certificates issued to this resident yet.</p>') +
        '<div class="form-section-title" style="margin:20px 0 8px">Complaints filed (' + complaints.length + ')</div>' +
        (complaints.length ?
          '<div class="table-wrap" style="border:1px solid var(--line);border-radius:10px"><table><thead><tr><th>Case</th><th>Type</th><th>Filed</th><th>Status</th></tr></thead><tbody>' +
          complaints.map(function (c) {
            return '<tr><td class="cell-strong">' + App.esc(c.caseNo) + '</td><td>' + App.esc(c.type) + '</td><td>' + App.esc(App.fmtDate(c.filedAt)) + '</td><td><span class="badge ' + complaintTone(c.status) + '">' + App.esc(c.status) + '</span></td></tr>';
          }).join('') + '</tbody></table></div>'
          : '<p style="font-size:12.5px;color:var(--muted)">No complaints recorded against this resident.</p>') +
        '<p class="copyline" style="margin-top:18px">Barangay ' + App.esc(App.db.settings().shortName) + ' · Record viewed ' + App.esc(App.fmtDateTime(new Date().toISOString())) + '</p>',
      footer:
        (isAdmin ? '<button class="btn btn-danger-ghost left" data-act="delete" type="button">' + App.icon('trash') + ' Delete</button>' : '') +
        '<button class="btn btn-ghost" data-act="print" type="button">' + App.icon('print') + ' Print record</button>' +
        '<button class="btn btn-ghost" data-act="clearance" type="button">' + App.icon('file') + ' Issue clearance</button>' +
        '<button class="btn btn-primary" data-act="edit" type="button">' + App.icon('edit') + ' Edit</button>',
      focusFirst: false,
      onMount: function (api) {
        api.panel.querySelector('[data-act=print]').addEventListener('click', function () {
          App.previewSheet('Resident record', App.residentSheet(r));
        });
        api.panel.querySelector('[data-act=edit]').addEventListener('click', function () {
          api.close();
          openForm(r);
        });
        api.panel.querySelector('[data-act=clearance]').addEventListener('click', function () {
          api.close();
          App.go('documents', { add: 1, resident: r.id });
        });
        var del = api.panel.querySelector('[data-act=delete]');
        if (del) del.addEventListener('click', function () {
          api.close();
          confirmDelete(r);
        });
      }
    });
    return modal;
  }

  function row(label, value) {
    return '<div class="dl-row"><dt>' + App.esc(label) + '</dt><dd>' + App.esc(value || '—') + '</dd></div>';
  }

  function docTone(status) {
    if (status === 'Released') return 'badge-ok';
    if (status === 'Cancelled') return 'badge-danger';
    return 'badge-info';
  }
  App.docTone = docTone;

  function complaintTone(status) {
    if (status === 'Resolved') return 'badge-ok';
    if (status === 'Dismissed') return 'badge-muted';
    if (status === 'Under Mediation') return 'badge-warn';
    return 'badge-info';
  }
  App.complaintTone = complaintTone;

  function confirmDelete(r) {
    App.confirm({
      title: 'Delete resident record?',
      message: 'This will permanently remove ' + App.fullName(r) + ' (' + r.id + ') and the ' +
        App.db.documentsFor(r.id).length + ' document(s) linked to this resident. This cannot be undone.',
      confirmText: 'Delete record',
      tone: 'danger'
    }).then(function (ok) {
      if (!ok) return;
      App.db.removeResident(r.id);
      App.db.log('Deleted resident', App.fullName(r) + ' (' + r.id + ')');
      App.toast('Resident record deleted.', 'info');
      App.refresh();
    });
  }

  /* ---------------------------- list view ---------------------------- */
  App.views.residents = function (root, params) {
    var ui = { q: '', purok: '', sex: '', voter: '', status: '', page: 1 };

    root.innerHTML =
      '<div class="hero">' +
        '<div><h2>Resident records</h2><p>Register, search and maintain the official list of barangay residents.</p></div>' +
        '<div class="hero-actions">' +
          '<button class="btn btn-ghost" data-act="export">' + App.icon('download') + ' Export CSV</button>' +
          '<button class="btn btn-primary" data-act="add">' + App.icon('plus') + ' Register resident</button>' +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="toolbar">' +
          '<div class="search">' + App.icon('search') + '<input id="res-q" type="search" placeholder="Search name, ID, contact or occupation…" /></div>' +
          '<div class="filters">' +
            '<select id="res-purok"><option value="">All puroks</option>' + App.PUROKS.map(function (p) { return '<option>' + p + '</option>'; }).join('') + '</select>' +
            '<select id="res-sex"><option value="">Sex</option><option>Male</option><option>Female</option></select>' +
            '<select id="res-voter"><option value="">Voter status</option><option>Registered</option><option>Not Registered</option></select>' +
            '<select id="res-status"><option value="">Status</option><option>Active</option><option>Transferred</option><option>Deceased</option></select>' +
          '</div>' +
        '</div>' +
        '<div class="table-wrap"><table>' +
          '<thead><tr><th>Resident</th><th>ID</th><th>Age / Sex</th><th>Purok</th><th>Contact</th><th>Voter</th><th>Status</th><th class="num">Actions</th></tr></thead>' +
          '<tbody id="res-body"></tbody>' +
        '</table></div>' +
        '<div class="table-foot"><span id="res-count"></span>' +
          '<div class="pager"><button class="btn btn-ghost btn-sm" id="res-prev" type="button">Previous</button>' +
          '<span id="res-page" style="padding:0 4px"></span>' +
          '<button class="btn btn-ghost btn-sm" id="res-next" type="button">Next</button></div>' +
        '</div>' +
      '</div>';

    var tbody = root.querySelector('#res-body');
    var countEl = root.querySelector('#res-count');
    var pageEl = root.querySelector('#res-page');

    function filtered() {
      var q = ui.q.toLowerCase().trim();
      return App.db.residents().filter(function (r) {
        if (ui.purok && r.purok !== ui.purok) return false;
        if (ui.sex && r.sex !== ui.sex) return false;
        if (ui.voter && r.voterStatus !== ui.voter) return false;
        if (ui.status && r.status !== ui.status) return false;
        if (!q) return true;
        var haystack = [App.fullName(r), r.id, r.purok, r.contact, r.occupation, r.householdNo, r.civilStatus].join(' ').toLowerCase();
        return haystack.indexOf(q) !== -1;
      }).sort(function (a, b) {
        return (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName);
      });
    }

    function render() {
      var rows = filtered();
      var pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
      if (ui.page > pages) ui.page = pages;
      var start = (ui.page - 1) * PAGE_SIZE;
      var slice = rows.slice(start, start + PAGE_SIZE);

      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="8"><div class="empty"><div class="empty-icon">' + App.icon('users') + '</div>' +
          '<h4>No residents found</h4><p>Try a different search or filter, or register a new resident.</p>' +
          '<button class="btn btn-primary btn-sm" data-act="add">' + App.icon('plus') + ' Register resident</button></div></td></tr>';
      } else {
        tbody.innerHTML = slice.map(function (r) {
          return '<tr data-id="' + App.attr(r.id) + '">' +
            '<td><div class="cell-person"><div class="avatar">' + App.esc(App.initials(App.fullName(r))) + '</div>' +
              '<div><div class="cell-strong">' + App.highlight(App.fullName(r), ui.q) + '</div>' +
              '<div class="cell-sub">' + App.esc(r.civilStatus) + ' · ' + App.esc(r.occupation || '—') + '</div></div></div></td>' +
            '<td class="cell-strong">' + App.esc(r.id) + '</td>' +
            '<td>' + App.age(r.birthDate) + ' · ' + App.esc(r.sex) + '</td>' +
            '<td>' + App.esc(r.purok) + '</td>' +
            '<td>' + App.esc(r.contact) + '</td>' +
            '<td>' + (r.voterStatus === 'Registered' ? '<span class="badge badge-info">Registered</span>' : '<span class="badge badge-muted">No</span>') + '</td>' +
            '<td><span class="badge ' + (r.status === 'Active' ? 'badge-ok' : r.status === 'Deceased' ? 'badge-muted' : 'badge-warn') + '">' + App.esc(r.status) + '</span></td>' +
            '<td><div class="row-actions">' +
              '<button class="mini-btn" data-row="view" title="View record" aria-label="View record">' + App.icon('eye') + '</button>' +
              '<button class="mini-btn" data-row="edit" title="Edit record" aria-label="Edit record">' + App.icon('edit') + '</button>' +
              '<button class="mini-btn danger" data-row="delete" title="Delete record" aria-label="Delete record">' + App.icon('trash') + '</button>' +
            '</div></td>' +
          '</tr>';
        }).join('');
      }

      countEl.textContent = rows.length
        ? 'Showing ' + (start + 1) + '–' + Math.min(start + PAGE_SIZE, rows.length) + ' of ' + rows.length + ' resident' + (rows.length === 1 ? '' : 's')
        : 'No records to display';
      pageEl.textContent = 'Page ' + ui.page + ' of ' + pages;
      root.querySelector('#res-prev').disabled = ui.page <= 1;
      root.querySelector('#res-next').disabled = ui.page >= pages;
    }

    function exportCSV() {
      var rows = [['Resident ID', 'Last name', 'First name', 'Middle name', 'Suffix', 'Sex', 'Birthdate', 'Age',
        'Civil status', 'Purok', 'Household', 'Contact', 'Email', 'Occupation', 'Voter status', 'Residency status', 'Registered on']];
      filtered().forEach(function (r) {
        rows.push([r.id, r.lastName, r.firstName, r.middleName, r.suffix, r.sex, r.birthDate, App.age(r.birthDate),
          r.civilStatus, r.purok, r.householdNo, r.contact, r.email, r.occupation, r.voterStatus, r.status, r.registeredAt]);
      });
      App.exportCSV('barangay-residents-' + App.todayISO() + '.csv', rows);
    }

    root.querySelector('#res-q').addEventListener('input', App.debounce(function (e) {
      ui.q = e.target.value; ui.page = 1; render();
    }, 160));
    [['res-purok', 'purok'], ['res-sex', 'sex'], ['res-voter', 'voter'], ['res-status', 'status']].forEach(function (pair) {
      root.querySelector('#' + pair[0]).addEventListener('change', function (e) {
        ui[pair[1]] = e.target.value; ui.page = 1; render();
      });
    });
    root.querySelector('#res-prev').addEventListener('click', function () { if (ui.page > 1) { ui.page--; render(); } });
    root.querySelector('#res-next').addEventListener('click', function () { ui.page++; render(); });

    root.addEventListener('click', function (e) {
      var addBtn = e.target.closest('[data-act=add]');
      if (addBtn) { openForm(null, function () { render(); }); return; }
      var expBtn = e.target.closest('[data-act=export]');
      if (expBtn) { exportCSV(); return; }
      var actionBtn = e.target.closest('[data-row]');
      if (!actionBtn) return;
      var tr = actionBtn.closest('tr');
      if (!tr) return;
      var id = tr.getAttribute('data-id');
      var action = actionBtn.getAttribute('data-row');
      var resident = App.db.resident(id);
      if (!resident) return;
      if (action === 'view') openProfile(id);
      else if (action === 'edit') openForm(resident, function () { render(); });
      else if (action === 'delete') confirmDelete(resident);
    });

    render();

    if (params && params.get('add') === '1') {
      history.replaceState(null, '', '#/residents');
      openForm(null, function () { render(); });
    } else if (params && params.get('id')) {
      openProfile(params.get('id'));
    }
  };

  App.openResidentForm = openForm;
  App.openResidentProfile = openProfile;
  App.residentDocTone = docTone;
  App.residentComplaintTone = complaintTone;
})();
