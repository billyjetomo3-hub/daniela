/* ============================================================
   Administrator views — user accounts and barangay settings
   ============================================================ */
(function () {
  var App = window.App;
  App.views = App.views || {};
  var input = App.formInput;

  /* ============================== USERS ============================== */
  function roleBadge(role) {
    return role === 'admin' ? '<span class="badge badge-gold">Administrator</span>' : '<span class="badge badge-info">Staff</span>';
  }

  function openUserForm(existing) {
    var u = existing || {};
    var isEdit = !!existing;

    App.openModal({
      title: isEdit ? 'Edit user account' : 'Create user account',
      subtitle: isEdit ? u.username : 'New accounts can sign in immediately.',
      size: 'md',
      body:
        '<form id="user-form" novalidate><div class="form-grid">' +
          input('name', 'Full name', { value: u.name, required: true, placeholder: 'Juan Dela Cruz' }) +
          input('position', 'Position / designation', { value: u.position, placeholder: 'Barangay Secretary' }) +
          input('username', 'Username', { value: u.username, required: true, placeholder: 'jdelacruz' }) +
          input('role', 'Access level', { value: u.role || 'staff', required: true, options: [{ value: 'admin', label: 'Administrator — full access' }, { value: 'staff', label: 'Staff — records & documents' }] }) +
          input('password', isEdit ? 'New password (optional)' : 'Password', { type: 'password', required: !isEdit, placeholder: 'At least 6 characters' }) +
          input('confirm', isEdit ? 'Confirm new password' : 'Confirm password', { type: 'password', required: !isEdit, placeholder: 'Re-enter password' }) +
          '<div class="form-error field-full" id="user-error" hidden></div>' +
        '</div></form>',
      footer:
        '<button class="btn btn-ghost" data-act="cancel" type="button">Cancel</button>' +
        '<button class="btn btn-primary" type="submit" form="user-form">' + (isEdit ? 'Save changes' : 'Create account') + '</button>',
      onMount: function (api) {
        var form = api.panel.querySelector('#user-form');
        var errorBox = api.panel.querySelector('#user-error');
        api.panel.querySelector('[data-act=cancel]').addEventListener('click', api.close);

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var data = {
            name: form.elements.name.value.trim(),
            position: form.elements.position.value.trim(),
            username: form.elements.username.value.trim(),
            role: form.elements.role.value,
            password: form.elements.password.value,
            confirm: form.elements.confirm.value
          };
          var errors = [];
          if (!data.name) errors.push('Full name is required.');
          if (!data.username) errors.push('Username is required.');
          if (!/^[a-zA-Z0-9._-]{3,20}$/.test(data.username)) errors.push('Username must be 3–20 characters (letters, numbers, dot, dash, underscore).');
          var duplicate = App.db.findByUsername(data.username);
          if (duplicate && (!isEdit || duplicate.id !== existing.id)) errors.push('That username is already taken.');
          if (!isEdit && !data.password) errors.push('Password is required.');
          if (data.password || !isEdit) {
            if (data.password.length < 6) errors.push('Password must be at least 6 characters.');
            if (data.password !== data.confirm) errors.push('Passwords do not match.');
          }
          if (errors.length) {
            errorBox.innerHTML = errors.map(function (m) { return '• ' + App.esc(m); }).join('<br>');
            errorBox.hidden = false;
            return;
          }

          if (isEdit) {
            var patch = { name: data.name, position: data.position, username: data.username, role: data.role };
            if (data.password) patch.password = data.password;
            App.db.updateUser(existing.id, patch);
            App.db.log('Updated user account', data.name + ' (' + data.username + ')');
            App.toast('User account updated.');
          } else {
            var created = App.db.addUser(data);
            App.db.log('Created user account', created.name + ' (' + created.username + ')');
            App.toast('User account created.');
          }
          api.close();
          App.refresh();
        });
      }
    });
  }

  function resetPassword(user) {
    App.openModal({
      title: 'Reset password',
      subtitle: user.name + ' · ' + user.username,
      size: 'sm',
      body:
        '<form id="pw-form" class="form-section" novalidate>' +
          '<div class="field"><label>New password <span class="req">*</span></label><input name="password" type="password" placeholder="At least 6 characters" /></div>' +
          '<div class="field"><label>Confirm password <span class="req">*</span></label><input name="confirm" type="password" placeholder="Re-enter password" /></div>' +
          '<div class="form-error" id="pw-error" hidden></div>' +
        '</form>',
      footer:
        '<button class="btn btn-ghost" data-act="cancel" type="button">Cancel</button>' +
        '<button class="btn btn-primary" type="submit" form="pw-form">Update password</button>',
      onMount: function (api) {
        var form = api.panel.querySelector('#pw-form');
        var errorBox = api.panel.querySelector('#pw-error');
        api.panel.querySelector('[data-act=cancel]').addEventListener('click', api.close);
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var pw = form.elements.password.value;
          var confirm = form.elements.confirm.value;
          if (pw.length < 6) { errorBox.innerHTML = '• Password must be at least 6 characters.'; errorBox.hidden = false; return; }
          if (pw !== confirm) { errorBox.innerHTML = '• Passwords do not match.'; errorBox.hidden = false; return; }
          App.db.updateUser(user.id, { password: pw });
          App.db.log('Reset password', user.name + ' (' + user.username + ')');
          App.toast('Password updated for ' + user.username + '.');
          api.close();
          App.refresh();
        });
      }
    });
  }

  App.views.users = function (root) {
    var me = App.db.currentUser();

    function render() {
      var users = App.db.users();
      root.innerHTML =
        '<div class="hero">' +
          '<div><h2>User accounts</h2><p>Control who can sign in to the barangay system and what they can access.</p></div>' +
          '<div class="hero-actions"><button class="btn btn-primary" data-act="add">' + App.icon('plus') + ' Create account</button></div>' +
        '</div>' +
        '<div class="grid grid-2" style="margin-bottom:16px">' +
          '<div class="alert alert-info">' + App.icon('shield') +
            '<div><b>Administrator</b> — full access to residents, documents, complaints, reports, user accounts and settings.</div></div>' +
          '<div class="alert">' + App.icon('users') +
            '<div><b>Staff</b> — can register residents, issue documents, file complaints and generate reports.</div></div>' +
        '</div>' +
        '<div class="card"><div class="section-head"><div><h3>Accounts</h3><p>' + users.length + ' accounts · ' +
          users.filter(function (u) { return u.active; }).length + ' active</p></div></div>' +
          '<div class="table-wrap"><table><thead><tr><th>User</th><th>Username</th><th>Access level</th><th>Last sign-in</th><th>Status</th><th class="num">Actions</th></tr></thead><tbody>' +
          users.map(function (u) {
            var isSelf = me && u.id === me.id;
            return '<tr>' +
              '<td><div class="cell-person"><div class="avatar' + (u.role === 'admin' ? ' avatar-gold' : '') + '">' + App.esc(App.initials(u.name)) + '</div>' +
                '<div><div class="cell-strong">' + App.esc(u.name) + (isSelf ? ' <span class="badge badge-muted" style="margin-left:4px">You</span>' : '') + '</div>' +
                '<div class="cell-sub">' + App.esc(u.position || '—') + '</div></div></div></td>' +
              '<td class="cell-strong">' + App.esc(u.username) + '</td>' +
              '<td>' + roleBadge(u.role) + '</td>' +
              '<td>' + (u.lastLogin ? App.esc(App.fmtDateTime(u.lastLogin)) : '<span style="color:var(--muted-2)">Never</span>') + '</td>' +
              '<td>' + (u.active ? '<span class="badge badge-ok">Active</span>' : '<span class="badge badge-muted">Deactivated</span>') + '</td>' +
              '<td><div class="row-actions">' +
                '<button class="mini-btn" data-user="edit" data-id="' + App.attr(u.id) + '" title="Edit account">' + App.icon('edit') + '</button>' +
                '<button class="mini-btn" data-user="reset" data-id="' + App.attr(u.id) + '" title="Reset password">' + App.icon('shield') + '</button>' +
                '<button class="mini-btn" data-user="toggle" data-id="' + App.attr(u.id) + '" title="' + (u.active ? 'Deactivate account' : 'Reactivate account') + '"' + (isSelf ? ' disabled' : '') + '>' +
                  App.icon(u.active ? 'x' : 'check') + '</button>' +
                '<button class="mini-btn danger" data-user="delete" data-id="' + App.attr(u.id) + '" title="Delete account"' + (isSelf ? ' disabled' : '') + '>' + App.icon('trash') + '</button>' +
              '</div></td>' +
            '</tr>';
          }).join('') +
          '</tbody></table></div>' +
        '</div>' +
        '<p class="copyline" style="margin-top:14px">Passwords are hashed before being stored in this browser. New accounts share the same local database.</p>';
    }

    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-act=add]')) { openUserForm(null); return; }
      var btn = e.target.closest('[data-user]');
      if (!btn) return;
      var user = App.db.user(btn.getAttribute('data-id'));
      if (!user) return;
      var action = btn.getAttribute('data-user');
      if (action === 'edit') openUserForm(user);
      else if (action === 'reset') resetPassword(user);
      else if (action === 'toggle') {
        if (me && user.id === me.id) { App.toast('You cannot deactivate your own account.', 'error'); return; }
        App.db.updateUser(user.id, { active: !user.active });
        App.db.log(user.active ? 'Deactivated account' : 'Reactivated account', user.username);
        App.toast('Account ' + (user.active ? 'deactivated' : 'reactivated') + '.');
        render();
      } else if (action === 'delete') {
        if (me && user.id === me.id) { App.toast('You cannot delete your own account.', 'error'); return; }
        App.confirm({
          title: 'Delete user account?',
          message: user.name + ' (' + user.username + ') will lose access immediately. Records they created stay in the system.',
          confirmText: 'Delete account', tone: 'danger'
        }).then(function (ok) {
          if (!ok) return;
          App.db.removeUser(user.id);
          App.db.log('Deleted user account', user.username);
          App.toast('Account deleted.', 'info');
          render();
        });
      }
    });

    render();
  };

  /* ============================== SETTINGS ============================== */
  App.views.settings = function (root) {
    var s = App.db.settings();

    function render() {
      var backupName = 'birms-backup-' + App.todayISO() + '.json';
      root.innerHTML =
        '<div class="hero">' +
          '<div><h2>Barangay settings</h2><p>These details appear on printed clearances, certificates and reports.</p></div>' +
          '<div class="hero-actions">' +
            '<button class="btn btn-ghost" data-act="backup">' + App.icon('download') + ' Download backup</button>' +
            '<button class="btn btn-primary" data-act="save">Save changes</button>' +
          '</div>' +
        '</div>' +
        '<form id="settings-form">' +
          '<div class="grid grid-2-1">' +
            '<div class="stack">' +
              '<div class="card"><div class="section-head"><div><h3>Barangay profile</h3><p>Official name and address</p></div></div>' +
                '<div class="card-body"><div class="form-grid">' +
                  input('barangayName', 'Barangay name', { value: s.barangayName, required: true }) +
                  input('shortName', 'Short name', { value: s.shortName }) +
                  input('municipality', 'Municipality', { value: s.municipality, required: true }) +
                  input('province', 'Province', { value: s.province, required: true }) +
                  input('region', 'Region', { value: s.region }) +
                  input('contact', 'Contact number', { value: s.contact }) +
                  input('email', 'Email address', { value: s.email, type: 'email' }) +
                  input('officeHours', 'Office hours', { value: s.officeHours }) +
                  input('address', 'Complete address', { value: s.address, full: true }) +
                '</div></div></div>' +

              '<div class="card"><div class="section-head"><div><h3>Signatories</h3><p>Names printed on issued documents</p></div></div>' +
                '<div class="card-body"><div class="form-grid">' +
                  input('captain', 'Punong Barangay', { value: s.captain }) +
                  input('secretary', 'Barangay Secretary', { value: s.secretary }) +
                  input('treasurer', 'Barangay Treasurer', { value: s.treasurer }) +
                '</div></div></div>' +

              '<div class="card"><div class="section-head"><div><h3>Default fees</h3><p>Automatically applied when issuing documents (PHP)</p></div></div>' +
                '<div class="card-body"><div class="form-grid">' +
                  App.DOC_TYPES.map(function (t) {
                    return '<div class="field"><label>' + App.esc(t) + '</label><input name="fee-' + App.attr(t) + '" type="number" min="0" step="0.01" value="' +
                      App.attr(s.fees[t] == null ? 0 : s.fees[t]) + '" /></div>';
                  }).join('') +
                '</div></div></div>' +
            '</div>' +

            '<div class="stack">' +
              '<div class="card"><div class="section-head"><div><h3>Data &amp; backup</h3><p>Everything lives in this browser</p></div></div>' +
                '<div class="card-body stack" style="gap:12px">' +
                  '<p style="font-size:12.5px;color:var(--muted);line-height:1.6">Records are saved in localStorage. Download a backup regularly, or move data to another computer using the restore option.</p>' +
                  '<button class="btn btn-ghost btn-block" type="button" data-act="backup">' + App.icon('download') + ' Download backup (JSON)</button>' +
                  '<button class="btn btn-ghost btn-block" type="button" data-act="restore">' + App.icon('upload') + ' Restore from backup</button>' +
                  '<input type="file" id="restore-file" accept="application/json,.json" hidden />' +
                  '<button class="btn btn-danger-ghost btn-block" type="button" data-act="reset">Reset demo data</button>' +
                '</div></div>' +

              '<div class="card"><div class="section-head"><div><h3>Storage usage</h3><p>Current browser footprint</p></div></div>' +
                '<div class="card-body"><dl class="dl">' +
                  '<div class="dl-row"><dt>Residents</dt><dd>' + App.num(App.db.residents().length) + '</dd></div>' +
                  '<div class="dl-row"><dt>Documents</dt><dd>' + App.num(App.db.documents().length) + '</dd></div>' +
                  '<div class="dl-row"><dt>Complaints</dt><dd>' + App.num(App.db.complaints().length) + '</dd></div>' +
                  '<div class="dl-row"><dt>Accounts</dt><dd>' + App.num(App.db.users().length) + '</dd></div>' +
                  '<div class="dl-row"><dt>Approx. size</dt><dd>' + App.esc(storageSize()) + '</dd></div>' +
                '</dl></div></div>' +

              '<div class="card"><div class="section-head"><div><h3>About</h3><p>System information</p></div></div>' +
                '<div class="card-body"><p style="font-size:12.5px;line-height:1.7;color:var(--muted)">' +
                  '<b style="color:var(--ink)">Barangay Information &amp; Resident Management System</b><br>' +
                  'IT-312 Project Proposal · Veritas Collage of Irosin<br>Prepared by Daniela Lacea Milanes<br>Submitted to Sir Emarvi G. Gito, MIT</p></div></div>' +
            '</div>' +
          '</div>' +
        '</form>' +
        '<p class="copyline" style="margin-top:16px">Backup file: ' + App.esc(backupName) + '</p>';
    }

    function storageSize() {
      try {
        var bytes = new Blob([localStorage.getItem('birms.v1') || '']).size;
        return bytes > 1024 ? (bytes / 1024).toFixed(1) + ' KB' : bytes + ' bytes';
      } catch (err) { return '—'; }
    }

    function readSettings(form) {
      var patch = {
        barangayName: form.elements.barangayName.value.trim(),
        shortName: form.elements.shortName.value.trim(),
        municipality: form.elements.municipality.value.trim(),
        province: form.elements.province.value.trim(),
        region: form.elements.region.value.trim(),
        contact: form.elements.contact.value.trim(),
        email: form.elements.email.value.trim(),
        officeHours: form.elements.officeHours.value.trim(),
        address: form.elements.address.value.trim(),
        captain: form.elements.captain.value.trim(),
        secretary: form.elements.secretary.value.trim(),
        treasurer: form.elements.treasurer.value.trim(),
        fees: {}
      };
      App.DOC_TYPES.forEach(function (t) {
        patch.fees[t] = Number(form.elements['fee-' + t].value || 0);
      });
      return patch;
    }

    function save() {
      var form = root.querySelector('#settings-form');
      var patch = readSettings(form);
      if (!patch.barangayName || !patch.municipality || !patch.province) {
        App.toast('Barangay name, municipality and province are required.', 'error');
        return;
      }
      App.db.saveSettings(patch);
      App.db.log('Updated barangay settings', patch.barangayName);
      App.applySettings();
      App.toast('Barangay settings saved.');
      render();
    }

    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-act=save]')) { e.preventDefault(); save(); }
      else if (e.target.closest('[data-act=backup]')) {
        App.download('birms-backup-' + App.todayISO() + '.json', App.db.exportJSON(), 'application/json');
        App.toast('Backup downloaded.');
      } else if (e.target.closest('[data-act=restore]')) {
        root.querySelector('#restore-file').click();
      } else if (e.target.closest('[data-act=reset]')) {
        App.confirm({
          title: 'Reset to demo data?',
          message: 'All residents, documents, complaints and accounts in this browser will be replaced with the original sample records. Download a backup first if you need to keep your data.',
          confirmText: 'Reset everything', tone: 'danger'
        }).then(function (ok) {
          if (!ok) return;
          App.db.reset();
          App.applySettings();
          if (!App.db.currentUser()) {
            App.logout();
            return;
          }
          App.toast('Demo data restored.', 'info');
          App.refresh();
        });
      }
    });

    root.addEventListener('change', function (e) {
      if (e.target.id !== 'restore-file') return;
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          App.db.importJSON(String(reader.result));
          App.applySettings();
          App.toast('Backup restored successfully.');
          if (!App.db.currentUser()) { App.logout(); return; }
          App.refresh();
        } catch (err) {
          App.toast('Restore failed: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    render();
  };
})();
