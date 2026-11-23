/* ============================================================
   Data layer — localStorage persistence, seeding, CRUD
   ============================================================ */
(function () {
  var App = window.App;
  var KEY = 'birms.v1';
  var SESSION_KEY = 'birms.session';

  /* ------------------------------ helpers ------------------------------ */
  function hash(text) {
    var h = 5381;
    for (var i = 0; i < text.length; i++) h = ((h << 5) + h) ^ text.charCodeAt(i);
    return (h >>> 0).toString(16);
  }

  function daysAgo(n) {
    var d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  function daysFromNow(n) {
    return daysAgo(-n);
  }

  function stamp(minutesAgo) {
    return new Date(Date.now() - minutesAgo * 60000).toISOString();
  }

  function pad(n, size) {
    var s = String(n);
    while (s.length < size) s = '0' + s;
    return s;
  }

  /* ------------------------------ settings ------------------------------ */
  function defaultSettings() {
    return {
      barangayName: 'Barangay San Isidro',
      shortName: 'San Isidro',
      municipality: 'Irosin',
      province: 'Sorsogon',
      region: 'Region V (Bicol)',
      captain: 'Hon. Mary Joy D. Santiago',
      secretary: 'Ana Sofia M. Reyes',
      treasurer: 'Roberto C. Lim',
      contact: '(056) 555 0142',
      email: 'sanisidro.iroson@barangay.gov.ph',
      address: 'Barangay Hall, Purok 1, San Isidro, Irosin, Sorsogon',
      officeHours: 'Monday to Friday · 8:00 AM – 5:00 PM',
      fees: {
        'Barangay Clearance': 50,
        'Certificate of Residency': 30,
        'Certificate of Indigency': 0,
        'Business Clearance': 250,
        'Certificate of Good Moral': 50
      }
    };
  }

  App.DOC_TYPES = [
    'Barangay Clearance',
    'Certificate of Residency',
    'Certificate of Indigency',
    'Business Clearance',
    'Certificate of Good Moral'
  ];

  App.DOC_CODES = {
    'Barangay Clearance': 'BC',
    'Certificate of Residency': 'CR',
    'Certificate of Indigency': 'CI',
    'Business Clearance': 'BZ',
    'Certificate of Good Moral': 'GM'
  };

  App.COMPLAINT_TYPES = [
    'Noise Complaint',
    'Boundary Dispute',
    'Physical Injury',
    'Verbal Altercation',
    'Theft / Robbery',
    'Public Nuisance',
    'Domestic Dispute',
    'Others'
  ];

  App.COMPLAINT_STATUS = ['Pending', 'Under Mediation', 'Resolved', 'Dismissed'];
  App.DOC_STATUS = ['Issued', 'Released', 'Cancelled'];
  App.PUROKS = ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Purok 6'];

  /* ------------------------------ seed data ------------------------------ */
  function seedResidents() {
    var households = {
      'Dela Cruz': 'HS-001', 'Bautista': 'HS-002', 'Villanueva': 'HS-003',
      'Mendoza': 'HS-004', 'Aquino': 'HS-005', 'Lim': 'HS-006', 'Garcia': 'HS-007',
      'Pascual': 'HS-008', 'Ocampo': 'HS-009', 'Salazar': 'HS-010',
      'Tolentino': 'HS-011', 'Dizon': 'HS-012', 'Ramos': 'HS-013'
    };

    // first, middle, last, sex, birthdate, civil status, purok, occupation, contact, voter, status
    var rows = [
      ['Juan Miguel', 'Santos', 'Dela Cruz', 'Male', '1979-04-12', 'Married', 'Purok 1', 'Farmer', '0917 234 5611', 'Registered', 'Active'],
      ['Maria Clara', 'Reyes', 'Dela Cruz', 'Female', '1982-08-03', 'Married', 'Purok 1', 'Sari-sari store owner', '0917 234 5612', 'Registered', 'Active'],
      ['Liza Marie', 'Santos', 'Dela Cruz', 'Female', '2008-01-22', 'Single', 'Purok 1', 'Student', '0917 234 5613', 'Not Registered', 'Active'],
      ['Ana Sofia', 'Mercado', 'Reyes', 'Female', '1994-06-17', 'Single', 'Purok 1', 'Barangay Secretary', '0918 441 2200', 'Registered', 'Active'],
      ['Pedro', 'Garcia', 'Bautista', 'Male', '1965-03-09', 'Married', 'Purok 2', 'Retired teacher', '0916 773 1180', 'Registered', 'Active'],
      ['Rosario', 'Lim', 'Bautista', 'Female', '1968-11-28', 'Married', 'Purok 2', 'Homemaker', '0916 773 1181', 'Registered', 'Active'],
      ['Mark Anthony', 'Garcia', 'Bautista', 'Male', '1999-07-14', 'Single', 'Purok 2', 'Electrician', '0909 221 4471', 'Registered', 'Active'],
      ['Ernesto', 'Ramos', 'Villanueva', 'Male', '1972-02-19', 'Married', 'Purok 3', 'Barangay Tanod', '0921 556 8832', 'Registered', 'Active'],
      ['Teresita', 'Cruz', 'Villanueva', 'Female', '1975-09-30', 'Married', 'Purok 3', 'Vendor', '0921 556 8833', 'Registered', 'Active'],
      ['John Paul', 'Ramos', 'Villanueva', 'Male', '2003-05-06', 'Single', 'Purok 3', 'Student', '0921 556 8834', 'Registered', 'Active'],
      ['Ricardo', 'Mendoza', 'Santos', 'Male', '1988-12-01', 'Married', 'Purok 4', 'Tricycle driver', '0917 889 3344', 'Registered', 'Active'],
      ['Jocelyn', 'Reyes', 'Mendoza', 'Female', '1990-03-25', 'Married', 'Purok 4', 'Barangay Health Worker', '0917 889 3345', 'Registered', 'Active'],
      ['Angelica', 'Mendoza', 'Santos', 'Female', '2012-10-11', 'Single', 'Purok 4', 'Student', '0917 889 3346', 'Not Registered', 'Active'],
      ['Fernando', 'Aquino', 'Dela Rosa', 'Male', '1958-06-08', 'Married', 'Purok 5', 'Farmer', '0908 142 7788', 'Registered', 'Active'],
      ['Elena', 'Bautista', 'Aquino', 'Female', '1961-01-16', 'Married', 'Purok 5', 'Homemaker', '0908 142 7789', 'Registered', 'Active'],
      ['Christian', 'Aquino', 'Dela Rosa', 'Male', '1995-04-27', 'Single', 'Purok 5', 'Construction worker', '0919 663 2210', 'Registered', 'Active'],
      ['Grace Ann', 'Lim', 'Tan', 'Female', '1996-11-05', 'Single', 'Purok 6', 'Teacher', '0917 300 9912', 'Registered', 'Active'],
      ['Benjamin', 'Lim', 'Tan', 'Male', '1994-02-23', 'Married', 'Purok 6', 'Fisherman', '0917 300 9913', 'Registered', 'Active'],
      ['Sofia', 'Lim', 'Tan', 'Female', '2020-07-19', 'Single', 'Purok 6', 'None', '0917 300 9914', 'Not Registered', 'Active'],
      ['Rolando', 'Garcia', 'Perez', 'Male', '1983-08-15', 'Married', 'Purok 2', 'Carpenter', '0920 447 1122', 'Registered', 'Active'],
      ['Marilou', 'Santos', 'Garcia', 'Female', '1986-05-21', 'Married', 'Purok 2', 'Laundry worker', '0920 447 1123', 'Registered', 'Active'],
      ['Kevin', 'Garcia', 'Perez', 'Male', '2006-09-09', 'Single', 'Purok 2', 'Out-of-school youth', '0920 447 1124', 'Not Registered', 'Active'],
      ['Nena', 'Pascual', 'Villamor', 'Female', '1949-12-30', 'Widowed', 'Purok 1', 'Retired', '0918 220 7755', 'Registered', 'Active'],
      ['Danilo', 'Ocampo', 'Salazar', 'Male', '1970-07-07', 'Married', 'Purok 3', 'Farmer', '0917 665 4400', 'Registered', 'Active'],
      ['Cristina', 'Dizon', 'Ocampo', 'Female', '1973-10-02', 'Married', 'Purok 3', 'Vendor', '0917 665 4401', 'Registered', 'Active'],
      ['Romeo', 'Salazar', 'Ocampo', 'Male', '1990-01-19', 'Single', 'Purok 4', 'Welder', '0915 337 6621', 'Registered', 'Active'],
      ['Jessa Mae', 'Salazar', 'Ocampo', 'Female', '1993-06-13', 'Single', 'Purok 4', 'Sales clerk', '0915 337 6622', 'Registered', 'Active'],
      ['Alvin', 'Tolentino', 'Ramos', 'Male', '2001-03-08', 'Single', 'Purok 5', 'Student', '0917 412 8890', 'Registered', 'Active'],
      ['Rowena', 'Dizon', 'Cruz', 'Female', '1980-04-04', 'Separated', 'Purok 6', 'Market vendor', '0918 559 0031', 'Registered', 'Active'],
      ['Arturo', 'Pascual', 'Villamor', 'Male', '1947-02-11', 'Widowed', 'Purok 1', 'Retired fisherman', '—', 'Registered', 'Deceased'],
      ['Eduardo', 'Ramos', 'Santos', 'Male', '1969-09-24', 'Married', 'Purok 5', 'Security guard', '0917 118 4422', 'Registered', 'Transferred']
    ];

    return rows.map(function (row, i) {
      var first = row[0], middle = row[1], last = row[2];
      var household = households[last] || ('HS-' + pad(i + 1, 3));
      return {
        id: 'RES-' + pad(i + 1, 4),
        firstName: first,
        middleName: middle,
        lastName: last,
        suffix: '',
        sex: row[3],
        birthDate: row[4],
        civilStatus: row[5],
        religion: 'Roman Catholic',
        occupation: row[7],
        contact: row[8],
        email: '',
        houseNo: String((i % 90) + 1),
        purok: row[6],
        householdNo: household,
        citizenship: 'Filipino',
        voterStatus: row[9],
        bloodType: '',
        emergencyName: 'Household contact',
        emergencyContact: row[8],
        status: row[10],
        registeredAt: daysAgo(120 + i * 23),
        notes: row[10] === 'Deceased' ? 'Record updated after reported death.' :
               row[10] === 'Transferred' ? 'Moved to another municipality.' : ''
      };
    });
  }

  function seedDocuments(residents) {
    function byName(name) {
      for (var i = 0; i < residents.length; i++) {
        if (residents[i].firstName + ' ' + residents[i].lastName === name) return residents[i];
      }
      return null;
    }
    var rows = [
      [{ name: 'Juan Miguel Dela Cruz', type: 'Barangay Clearance', purpose: 'Local employment requirement', days: 20, status: 'Released' }],
      [{ name: 'Grace Ann Lim', type: 'Certificate of Residency', purpose: 'School enrollment requirement', days: 35, status: 'Released' }],
      [{ name: 'Nena Pascual', type: 'Certificate of Indigency', purpose: 'Medical assistance (PhilHealth)', days: 60, status: 'Released' }],
      [{ name: 'Maria Clara Dela Cruz', type: 'Business Clearance', purpose: 'Sari-sari store permit renewal', days: 12, status: 'Released' }],
      [{ name: 'John Paul Villanueva', type: 'Certificate of Good Moral', purpose: 'Scholarship application', days: 8, status: 'Issued' }],
      [{ name: 'Ricardo Mendoza', type: 'Barangay Clearance', purpose: 'Tricycle franchise renewal', days: 5, status: 'Issued' }],
      [{ name: 'Christian Aquino', type: 'Certificate of Residency', purpose: 'Employment requirement', days: 90, status: 'Released' }],
      [{ name: 'Rowena Dizon', type: 'Certificate of Indigency', purpose: 'Burial assistance', days: 120, status: 'Released' }],
      [{ name: 'Kevin Garcia', type: 'Barangay Clearance', purpose: 'Police clearance requirement', days: 3, status: 'Cancelled' }]
    ];
    var counters = {};
    return rows.map(function (entry, i) {
      var item = entry[0];
      var resident = byName(item.name);
      var issuedAt = daysAgo(item.days);
      var year = issuedAt.slice(0, 4);
      var code = App.DOC_CODES[item.type];
      var key = code + '-' + year;
      counters[key] = (counters[key] || 0) + 1;
      var doc = {
        id: 'DOC-' + pad(i + 1, 4),
        no: code + '-' + year + '-' + pad(counters[key], 4),
        type: item.type,
        residentId: resident ? resident.id : '',
        residentName: resident ? App.fullName(resident) : item.name,
        purpose: item.purpose,
        fee: defaultSettings().fees[item.type] || 0,
        issuedAt: issuedAt,
        issuedBy: 'Ana Sofia M. Reyes',
        status: item.status,
        remarks: item.status === 'Cancelled' ? 'Cancelled — requester did not return for release.' : ''
      };
      return doc;
    });
  }

  function seedComplaints(residents) {
    function find(first, last) {
      for (var i = 0; i < residents.length; i++) {
        if (residents[i].firstName === first && residents[i].lastName === last) return residents[i];
      }
      return null;
    }
    function make(i, data) {
      var c = find(data.first, data.last);
      return {
        id: 'CMP-' + pad(i + 1, 4),
        caseNo: 'BLT-' + new Date().getFullYear() + '-' + pad(i + 1, 3),
        complainantId: c ? c.id : '',
        complainantName: c ? App.fullName(c) : data.complainant,
        complainantContact: c ? c.contact : '',
        respondent: data.respondent,
        type: data.type,
        location: data.location,
        narrative: data.narrative,
        filedAt: daysAgo(data.days),
        hearingAt: data.hearing == null ? '' : daysFromNow(data.hearing),
        status: data.status,
        resolution: data.resolution || '',
        handledBy: 'Hon. Mary Joy D. Santiago'
      };
    }
    return [
      make(0, {
        first: 'Ricardo', last: 'Mendoza', respondent: 'Purok 4 residents (videoke session)',
        type: 'Noise Complaint', location: 'Purok 4, near the basketball court',
        narrative: 'Repeated loud videoke sessions past 11:00 PM disturb the neighborhood. Verbal request to lower the volume was ignored.',
        days: 2, hearing: 3, status: 'Pending'
      }),
      make(1, {
        first: 'Teresita', last: 'Villanueva', respondent: 'Danilo Ocampo',
        type: 'Boundary Dispute', location: 'Purok 3, lot 14',
        narrative: 'Disagreement over the placement of a concrete fence along the shared property line.',
        days: 9, hearing: 2, status: 'Under Mediation'
      }),
      make(2, {
        first: 'Jocelyn', last: 'Mendoza', respondent: 'Unidentified minors',
        type: 'Physical Injury', location: 'Purok 4, barangay road',
        narrative: 'Complainant reported a minor scuffle involving minors throwing stones. Parties were called for settlement.',
        days: 25, status: 'Resolved',
        resolution: 'Parties reached an amicable settlement; parents agreed to shoulder medical costs.'
      }),
      make(3, {
        first: 'Rosario', last: 'Bautista', respondent: 'Stray animals (unidentified owner)',
        type: 'Public Nuisance', location: 'Purok 2, alley near the chapel',
        narrative: 'Stray dogs scattering garbage along the alley every evening.',
        days: 40, status: 'Dismissed',
        resolution: 'No identifiable owner; referred to the municipal pound instead.'
      }),
      make(4, {
        first: 'Benjamin', last: 'Lim', respondent: 'Mark Anthony Bautista',
        type: 'Verbal Altercation', location: 'Purok 6, fish landing area',
        narrative: 'Complainant alleges that the respondent shouted threats during an argument over docking space.',
        days: 1, hearing: 6, status: 'Pending'
      })
    ];
  }

  function seedActivity() {
    return [
      { id: App.uid('ACT'), at: stamp(14), user: 'Ana Sofia M. Reyes', action: 'Issued document', detail: 'Barangay Clearance for Ricardo Mendoza' },
      { id: App.uid('ACT'), at: stamp(95), user: 'Mary Joy D. Santiago', action: 'Filed complaint', detail: 'BLT-' + new Date().getFullYear() + '-005 — Verbal Altercation' },
      { id: App.uid('ACT'), at: stamp(320), user: 'Ana Sofia M. Reyes', action: 'Registered resident', detail: 'Kevin Garcia (RES-0022)' },
      { id: App.uid('ACT'), at: stamp(1480), user: 'Mary Joy D. Santiago', action: 'Updated complaint', detail: 'BLT-' + new Date().getFullYear() + '-003 marked Resolved' },
      { id: App.uid('ACT'), at: stamp(2600), user: 'Ana Sofia M. Reyes', action: 'Recorded payment', detail: 'Business Clearance — ₱250.00' }
    ];
  }

  function seedUsers() {
    return [
      {
        id: 'USR-001', name: 'Mary Joy D. Santiago', username: 'admin',
        passwordHash: hash('admin123'), role: 'admin', position: 'Punong Barangay',
        active: true, lastLogin: '', createdAt: daysAgo(400)
      },
      {
        id: 'USR-002', name: 'Ana Sofia M. Reyes', username: 'staff',
        passwordHash: hash('staff123'), role: 'staff', position: 'Barangay Secretary',
        active: true, lastLogin: '', createdAt: daysAgo(380)
      },
      {
        id: 'USR-003', name: 'Roberto C. Lim', username: 'treasurer',
        passwordHash: hash('treasurer123'), role: 'staff', position: 'Barangay Treasurer',
        active: false, lastLogin: '', createdAt: daysAgo(300)
      }
    ];
  }

  function seedData() {
    var residents = seedResidents();
    return {
      version: 1,
      settings: defaultSettings(),
      users: seedUsers(),
      residents: residents,
      documents: seedDocuments(residents),
      complaints: seedComplaints(residents),
      activity: seedActivity()
    };
  }

  /* ------------------------------ persistence ------------------------------ */
  function persist(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (err) {
      App.toast('Could not save to local storage: ' + err.message, 'error');
      return false;
    }
  }

  var state;
  try {
    var raw = localStorage.getItem(KEY);
    state = raw ? JSON.parse(raw) : null;
  } catch (err) {
    state = null;
  }
  if (!state || !Array.isArray(state.residents)) {
    state = seedData();
    persist(state);
  }

  function nowISO() { return new Date().toISOString(); }

  var db = {
    state: function () { return state; },
    save: function () { return persist(state); },

    /* ---- settings ---- */
    settings: function () { return state.settings; },
    saveSettings: function (patch) {
      Object.keys(patch).forEach(function (k) { state.settings[k] = patch[k]; });
      persist(state);
      return state.settings;
    },

    /* ---- residents ---- */
    residents: function () { return state.residents.slice(); },
    resident: function (id) {
      for (var i = 0; i < state.residents.length; i++) if (state.residents[i].id === id) return state.residents[i];
      return null;
    },
    addResident: function (data) {
      var maxNum = 0;
      state.residents.forEach(function (r) {
        var n = parseInt(String(r.id).replace(/\D/g, ''), 10);
        if (n > maxNum) maxNum = n;
      });
      var record = Object.assign({
        id: 'RES-' + pad(maxNum + 1, 4),
        registeredAt: App.todayISO(),
        status: 'Active'
      }, data);
      state.residents.push(record);
      persist(state);
      return record;
    },
    updateResident: function (id, data) {
      var r = db.resident(id);
      if (!r) return null;
      Object.assign(r, data);
      persist(state);
      return r;
    },
    removeResident: function (id) {
      state.residents = state.residents.filter(function (r) { return r.id !== id; });
      state.documents = state.documents.filter(function (d) { return d.residentId !== id; });
      persist(state);
    },

    /* ---- documents ---- */
    documents: function () { return state.documents.slice(); },
    document: function (id) {
      for (var i = 0; i < state.documents.length; i++) if (state.documents[i].id === id) return state.documents[i];
      return null;
    },
    nextDocNo: function (type) {
      var code = App.DOC_CODES[type] || 'DOC';
      var year = String(new Date().getFullYear());
      var prefix = code + '-' + year + '-';
      var max = 0;
      state.documents.forEach(function (d) {
        if (String(d.no).indexOf(prefix) === 0) {
          var n = parseInt(String(d.no).slice(prefix.length), 10);
          if (n > max) max = n;
        }
      });
      return prefix + pad(max + 1, 4);
    },
    addDocument: function (data) {
      var record = Object.assign({ id: App.uid('DOC'), status: 'Issued' }, data);
      state.documents.unshift(record);
      persist(state);
      return record;
    },
    updateDocument: function (id, data) {
      var d = db.document(id);
      if (!d) return null;
      Object.assign(d, data);
      persist(state);
      return d;
    },
    removeDocument: function (id) {
      state.documents = state.documents.filter(function (d) { return d.id !== id; });
      persist(state);
    },
    documentsFor: function (residentId) {
      return state.documents.filter(function (d) { return d.residentId === residentId; });
    },

    /* ---- complaints ---- */
    complaints: function () { return state.complaints.slice(); },
    complaint: function (id) {
      for (var i = 0; i < state.complaints.length; i++) if (state.complaints[i].id === id) return state.complaints[i];
      return null;
    },
    nextCaseNo: function () {
      var year = String(new Date().getFullYear());
      var max = 0;
      state.complaints.forEach(function (c) {
        var parts = String(c.caseNo).split('-');
        var n = parseInt(parts[parts.length - 1], 10);
        if (n > max) max = n;
      });
      return 'BLT-' + year + '-' + pad(max + 1, 3);
    },
    addComplaint: function (data) {
      var record = Object.assign({ id: App.uid('CMP'), status: 'Pending' }, data);
      state.complaints.unshift(record);
      persist(state);
      return record;
    },
    updateComplaint: function (id, data) {
      var c = db.complaint(id);
      if (!c) return null;
      Object.assign(c, data);
      persist(state);
      return c;
    },
    removeComplaint: function (id) {
      state.complaints = state.complaints.filter(function (c) { return c.id !== id; });
      persist(state);
    },
    openComplaintsFor: function (residentId) {
      return state.complaints.filter(function (c) {
        return c.complainantId === residentId && (c.status === 'Pending' || c.status === 'Under Mediation');
      });
    },
    complaintsFor: function (residentId) {
      return state.complaints.filter(function (c) {
        return c.complainantId === residentId;
      });
    },

    /* ---- users ---- */
    users: function () { return state.users.slice(); },
    user: function (id) {
      for (var i = 0; i < state.users.length; i++) if (state.users[i].id === id) return state.users[i];
      return null;
    },
    findByUsername: function (username) {
      var target = String(username || '').trim().toLowerCase();
      for (var i = 0; i < state.users.length; i++) {
        if (String(state.users[i].username).toLowerCase() === target) return state.users[i];
      }
      return null;
    },
    verify: function (username, password) {
      var user = db.findByUsername(username);
      if (!user) return { ok: false, message: 'No account matches that username.' };
      if (!user.active) return { ok: false, message: 'This account is deactivated. Ask the administrator to restore access.' };
      if (user.passwordHash !== hash(password)) return { ok: false, message: 'Incorrect password. Please try again.' };
      user.lastLogin = nowISO();
      persist(state);
      return { ok: true, user: user };
    },
    addUser: function (data) {
      var maxNum = 0;
      state.users.forEach(function (u) {
        var n = parseInt(String(u.id).replace(/\D/g, ''), 10);
        if (n > maxNum) maxNum = n;
      });
      var user = {
        id: 'USR-' + pad(maxNum + 1, 3),
        name: data.name,
        username: data.username,
        passwordHash: hash(data.password),
        role: data.role,
        position: data.position || (data.role === 'admin' ? 'Administrator' : 'Barangay Staff'),
        active: true,
        lastLogin: '',
        createdAt: App.todayISO()
      };
      state.users.push(user);
      persist(state);
      return user;
    },
    updateUser: function (id, data) {
      var u = db.user(id);
      if (!u) return null;
      if (data.password) {
        u.passwordHash = hash(data.password);
        delete data.password;
      }
      Object.assign(u, data);
      persist(state);
      return u;
    },
    removeUser: function (id) {
      state.users = state.users.filter(function (u) { return u.id !== id; });
      persist(state);
    },
    hash: hash,

    /* ---- activity ---- */
    activity: function () { return state.activity.slice(); },
    log: function (action, detail) {
      var session = db.session();
      var user = session ? db.user(session.userId) : null;
      state.activity.unshift({
        id: App.uid('ACT'),
        at: nowISO(),
        user: user ? user.name : 'System',
        action: action,
        detail: detail || ''
      });
      state.activity = state.activity.slice(0, 60);
      persist(state);
    },

    /* ---- session ---- */
    session: function () {
      try {
        var rawSession = localStorage.getItem(SESSION_KEY);
        return rawSession ? JSON.parse(rawSession) : null;
      } catch (err) { return null; }
    },
    setSession: function (userId) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: userId, at: nowISO() }));
    },
    clearSession: function () { localStorage.removeItem(SESSION_KEY); },
    currentUser: function () {
      var session = db.session();
      if (!session) return null;
      var user = db.user(session.userId);
      return user && user.active ? user : null;
    },

    /* ---- maintenance ---- */
    reset: function () {
      state = seedData();
      persist(state);
    },

    exportJSON: function () {
      return JSON.stringify({
        app: 'Barangay Information & Resident Management System',
        exportedAt: nowISO(),
        data: state
      }, null, 2);
    },
    importJSON: function (text) {
      var parsed = JSON.parse(text);
      var data = parsed && parsed.data ? parsed.data : parsed;
      if (!data || !Array.isArray(data.residents)) throw new Error('The file does not contain valid barangay records.');
      if (!data.settings) data.settings = defaultSettings();
      if (!Array.isArray(data.users)) data.users = seedUsers();
      if (!Array.isArray(data.documents)) data.documents = [];
      if (!Array.isArray(data.complaints)) data.complaints = [];
      if (!Array.isArray(data.activity)) data.activity = [];
      state = data;
      persist(state);
    }
  };

  App.db = db;

  /* ---- aggregate helpers used across views ---- */
  App.summary = function () {
    var residents = db.residents();
    var active = residents.filter(function (r) { return r.status === 'Active'; });
    var docs = db.documents();
    var complaints = db.complaints();
    var month = new Date().toISOString().slice(0, 7);
    var docsThisMonth = docs.filter(function (d) { return String(d.issuedAt).slice(0, 7) === month && d.status !== 'Cancelled'; });
    var openComplaints = complaints.filter(function (c) { return c.status === 'Pending' || c.status === 'Under Mediation'; });
    var voters = active.filter(function (r) { return r.voterStatus === 'Registered'; });
    var fees = docsThisMonth.reduce(function (sum, d) { return sum + Number(d.fee || 0); }, 0);
    return {
      totalResidents: residents.length,
      activeResidents: active.length,
      voters: voters.length,
      households: Array.from(new Set(active.map(function (r) { return r.householdNo; }))).length,
      docsThisMonth: docsThisMonth.length,
      docsTotal: docs.filter(function (d) { return d.status !== 'Cancelled'; }).length,
      feesThisMonth: fees,
      openComplaints: openComplaints.length,
      complaintsTotal: complaints.length,
      resolvedComplaints: complaints.filter(function (c) { return c.status === 'Resolved'; }).length,
      pending: complaints.filter(function (c) { return c.status === 'Pending'; }).length,
      mediation: complaints.filter(function (c) { return c.status === 'Under Mediation'; }).length,
      dismissed: complaints.filter(function (c) { return c.status === 'Dismissed'; }).length,
      residents: residents,
      docs: docs,
      complaints: complaints
    };
  };

  App.residentAddress = function (r) {
    if (!r) return '';
    return [r.houseNo ? 'No. ' + r.houseNo : '', r.purok, 'San Isidro', 'Irosin', 'Sorsogon']
      .filter(Boolean).join(', ');
  };

  App.residentLabel = function (r) {
    return App.fullName(r) + ' · ' + r.id + ' · ' + r.purok;
  };
})();
