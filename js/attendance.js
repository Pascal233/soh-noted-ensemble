/**
 * Soh NOTED Ensemble — Attendance Portal
 * All data stored in localStorage (ready to swap for a real backend later)
 *
 * Data structures:
 *   sne_members  : [{ id, name, voice, role, phone, year, pin, status, joinedAt }]
 *   sne_sessions : [{ id, title, type, date, start, end, venue, code, openBefore, closeAfter, createdAt }]
 *   sne_records  : [{ sessionId, memberId, status, time, excuseReason, excuseDetails }]
 *                  status: 'present' | 'excused' | 'absent'
 */

'use strict';

// ══════════════════════════════════════════
// STORAGE HELPERS
// ══════════════════════════════════════════
const DB = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  getObj: k => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch { return {}; } },
  setObj: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};

const KEY_MEMBERS  = 'sne_members';
const KEY_SESSIONS = 'sne_sessions';
const KEY_RECORDS  = 'sne_records';
const KEY_SESSION  = 'sne_current_user'; // logged-in user

// ══════════════════════════════════════════
// SEED — pre-load the Executive Director
// ══════════════════════════════════════════
function seedAdminIfNeeded() {
  let members = DB.get(KEY_MEMBERS);
  const adminExists = members.find(m => m.id === 'SNE-ADMIN-0001');
  if (!adminExists) {
    members.push({
      id:        'SNE-ADMIN-0001',
      name:      'Frederick Owusu Boakye',
      voice:     'Conductor',
      role:      'Executive Director',
      phone:     '0548580708',
      year:      '2015',
      pin:       hashPin('moxart2024'),   // default admin PIN — must change
      status:    'active',
      isAdmin:   true,
      joinedAt:  new Date().toISOString()
    });
    DB.set(KEY_MEMBERS, members);
  }
}

// Simple hash (not cryptographic — good enough for local demo, replace with bcrypt on backend)
function hashPin(pin) {
  let h = 0;
  for (let i = 0; i < pin.length; i++) {
    h = Math.imul(31, h) + pin.charCodeAt(i) | 0;
  }
  return h.toString(16);
}

// ══════════════════════════════════════════
// CURRENT USER
// ══════════════════════════════════════════
let currentUser = null;

function getUser() {
  const id = sessionStorage.getItem('sne_logged_in');
  if (!id) return null;
  return DB.get(KEY_MEMBERS).find(m => m.id === id) || null;
}

function loginUser(member) {
  sessionStorage.setItem('sne_logged_in', member.id);
  currentUser = member;
}

function logoutUser() {
  sessionStorage.removeItem('sne_logged_in');
  currentUser = null;
  showScreen('screenLogin');
  updateHeader();
}

// ══════════════════════════════════════════
// SCREENS
// ══════════════════════════════════════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(id);
  if (screen) screen.classList.add('active');
}

// ══════════════════════════════════════════
// HEADER
// ══════════════════════════════════════════
function updateHeader() {
  const el = document.getElementById('headerRight');
  if (!el) return;
  if (!currentUser) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <div class="header-user">
      <span>Hello, <strong>${currentUser.name.split(' ')[0]}</strong></span>
      <span class="header-badge ${currentUser.isAdmin ? 'admin' : ''}">${currentUser.isAdmin ? 'Admin' : currentUser.role}</span>
    </div>
    <button class="ap-btn ap-btn-outline ap-btn-sm" onclick="logoutUser()">Sign Out</button>
  `;
}

// ══════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════
function toast(msg, type = '') {
  const t = document.getElementById('apToast');
  if (!t) return;
  t.textContent = msg;
  t.className = `ap-toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3800);
}

// ══════════════════════════════════════════
// GENERATE IDs & CODES
// ══════════════════════════════════════════
function generateMemberId(name, phone, year) {
  const seed = (name + phone + year).toLowerCase().replace(/\s/g, '');
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return `SNE-${year}-${(Math.abs(hash) % 9000 + 1000)}`;
}

function generateSessionCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ══════════════════════════════════════════
// SESSION TIMING
// ══════════════════════════════════════════
function getSessionStatus(session) {
  const now = new Date();
  const dateStr = session.date; // YYYY-MM-DD
  const start = new Date(`${dateStr}T${session.start}`);
  const end   = new Date(`${dateStr}T${session.end}`);
  const openAt  = new Date(start.getTime() - session.openBefore  * 60000);
  const closeAt = new Date(start.getTime() + session.closeAfter  * 60000);

  if (now < openAt)   return { status: 'upcoming', openAt };
  if (now > closeAt)  return { status: 'closed' };
  if (now >= openAt && now <= closeAt) return { status: 'open', closeAt };
  return { status: 'unknown' };
}

function getTodaySession() {
  const sessions = DB.get(KEY_SESSIONS);
  const today = new Date().toISOString().split('T')[0];
  return sessions.find(s => s.date === today) || null;
}

// ══════════════════════════════════════════
// ATTENDANCE HELPERS
// ══════════════════════════════════════════
function getRecord(sessionId, memberId) {
  return DB.get(KEY_RECORDS).find(r => r.sessionId === sessionId && r.memberId === memberId);
}

function setRecord(sessionId, memberId, status, extra = {}) {
  let records = DB.get(KEY_RECORDS);
  const idx = records.findIndex(r => r.sessionId === sessionId && r.memberId === memberId);
  const rec = { sessionId, memberId, status, time: new Date().toISOString(), ...extra };
  if (idx >= 0) records[idx] = rec;
  else records.push(rec);
  DB.set(KEY_RECORDS, records);
}

function getMemberStats(memberId) {
  const sessions = DB.get(KEY_SESSIONS);
  const records  = DB.get(KEY_RECORDS);
  let present = 0, excused = 0, absent = 0;
  sessions.forEach(s => {
    const rec = records.find(r => r.sessionId === s.id && r.memberId === memberId);
    if (!rec || rec.status === 'absent') absent++;
    else if (rec.status === 'present') present++;
    else if (rec.status === 'excused') excused++;
  });
  const total = sessions.length;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
  return { present, excused, absent, total, pct };
}

function getStatusLabel(pct) {
  if (pct >= 70) return { label: 'Active', cls: 'pill-green' };
  if (pct >= 40) return { label: 'At Risk', cls: 'pill-amber' };
  return { label: 'Inactive', cls: 'pill-red' };
}

// ══════════════════════════════════════════
// LOGIN SCREEN
// ══════════════════════════════════════════
function initLogin() {
  // Toggle first-time setup
  document.getElementById('toggleFirstLogin')?.addEventListener('click', () => {
    const setup = document.getElementById('firstLoginSetup');
    const form  = document.querySelector('#screenLogin .ap-form');
    const toggle = document.getElementById('toggleFirstLogin');
    if (setup.style.display === 'none') {
      setup.style.display = 'block';
      form.style.display  = 'none';
      toggle.textContent  = 'Already have a PIN? Sign in';
    } else {
      setup.style.display = 'none';
      form.style.display  = 'flex';
      toggle.textContent  = 'First time logging in? Set your PIN';
    }
  });

  // Show/hide PIN
  document.getElementById('pinToggle')?.addEventListener('click', () => {
    const input = document.getElementById('loginPin');
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  // Login form
  document.getElementById('loginForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const id  = document.getElementById('loginId').value.trim().toUpperCase();
    const pin = document.getElementById('loginPin').value.trim();
    const err = document.getElementById('loginError');
    err.textContent = '';

    const members = DB.get(KEY_MEMBERS);
    const member  = members.find(m => m.id === id);

    if (!member) { err.textContent = 'Member ID not found. Check with your secretary.'; return; }
    if (member.status === 'inactive') { err.textContent = 'Your account has been deactivated. Contact the admin.'; return; }
    if (member.pin !== hashPin(pin)) {
      err.textContent = 'Incorrect PIN. Try again, or contact the admin to reset it.';
      return;
    }

    loginUser(member);
    updateHeader();
    if (member.isAdmin) {
      showScreen('screenAdmin');
      initAdmin();
    } else {
      showScreen('screenMember');
      loadMemberDashboard();
    }
  });

  // First-time PIN setup
  document.getElementById('setupForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const id   = document.getElementById('setupId').value.trim().toUpperCase();
    const pin  = document.getElementById('setupPin').value.trim();
    const pin2 = document.getElementById('setupPin2').value.trim();
    const err  = document.getElementById('setupError');
    err.textContent = '';

    if (pin.length < 4) { err.textContent = 'PIN must be at least 4 digits.'; return; }
    if (pin !== pin2)   { err.textContent = 'PINs do not match.'; return; }

    let members = DB.get(KEY_MEMBERS);
    const idx   = members.findIndex(m => m.id === id);
    if (idx < 0) { err.textContent = 'Member ID not found. Contact the admin.'; return; }

    members[idx].pin = hashPin(pin);
    DB.set(KEY_MEMBERS, members);
    loginUser(members[idx]);
    updateHeader();
    showScreen('screenMember');
    loadMemberDashboard();
    toast('PIN set successfully. Welcome!', 'success');
  });
}

// ══════════════════════════════════════════
// MEMBER DASHBOARD
// ══════════════════════════════════════════
function loadMemberDashboard() {
  if (!currentUser) return;
  const m = currentUser;

  // Welcome
  document.getElementById('memberName').textContent      = m.name;
  document.getElementById('memberRole').textContent      = m.role;
  document.getElementById('memberVoice').textContent     = m.voice;
  document.getElementById('memberIdDisplay').textContent = m.id;

  // Attendance %
  const stats = getMemberStats(m.id);
  const pill  = document.getElementById('attendancePill');
  const pctEl = document.getElementById('attendancePercent');
  pctEl.textContent = stats.pct + '%';
  const { label, cls } = getStatusLabel(stats.pct);
  pill.className = `attendance-pill ${cls.replace('pill-', 'ap-pill-')}`;
  pill.style.background = stats.pct >= 70 ? 'rgba(21,128,61,.25)' : stats.pct >= 40 ? 'rgba(180,83,9,.25)' : 'rgba(190,18,60,.25)';

  // Today's session
  loadTodaySession();

  // History
  loadMyHistory();
}

function loadTodaySession() {
  if (!currentUser) return;
  const session = getTodaySession();
  const noMsg   = document.getElementById('noSessionMsg');
  const details = document.getElementById('sessionDetails');
  const badge   = document.getElementById('sessionTypeBadge');

  if (!session) {
    noMsg.style.display   = 'flex';
    details.style.display = 'none';
    badge.textContent = '—';
    return;
  }

  noMsg.style.display   = 'none';
  details.style.display = 'block';
  badge.textContent = session.type;
  document.getElementById('sessionTitle').textContent = session.title;
  document.getElementById('sessionDate').textContent  = formatDate(session.date);
  document.getElementById('sessionTime').textContent  = `${session.start} – ${session.end}`;
  document.getElementById('sessionVenue').textContent = session.venue;

  // Check-in state
  const record   = getRecord(session.id, currentUser.id);
  const timing   = getSessionStatus(session);
  const checkedIn   = document.getElementById('alreadyCheckedIn');
  const checkinForm = document.getElementById('checkinForm');
  const windowClosed = document.getElementById('windowClosed');
  const notYetOpen   = document.getElementById('notYetOpen');
  const excuseArea   = document.getElementById('excuseArea');

  // Hide all
  [checkedIn, checkinForm, windowClosed, notYetOpen].forEach(el => el.style.display = 'none');
  excuseArea.style.display = 'none';

  if (record && record.status === 'present') {
    checkedIn.style.display = 'flex';
    document.getElementById('checkinTime').textContent = 'Checked in at ' + formatTime(record.time);
  } else if (record && record.status === 'excused') {
    checkedIn.style.display = 'flex';
    checkedIn.style.background = '#fffbeb';
    checkedIn.style.borderColor = '#fde68a';
    checkedIn.style.color = '#92400e';
    document.getElementById('checkinTime').textContent = 'Excuse submitted: ' + record.excuseReason;
  } else if (timing.status === 'open') {
    checkinForm.style.display = 'block';
    if (!record) excuseArea.style.display = 'block';
    initCodeInputs(session);
  } else if (timing.status === 'upcoming') {
    notYetOpen.style.display = 'block';
    document.getElementById('opensAt').textContent = session.openBefore + ' mins';
    if (!record) excuseArea.style.display = 'block';
  } else if (timing.status === 'closed') {
    windowClosed.style.display = 'flex';
  }
}

function initCodeInputs(session) {
  const boxes = document.querySelectorAll('.code-box');
  boxes.forEach((box, i) => {
    box.value = '';
    box.addEventListener('input', () => {
      box.value = box.value.replace(/\D/g, '');
      if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
    });
    box.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !box.value && i > 0) boxes[i - 1].focus();
    });
  });

  document.getElementById('submitCodeBtn')?.addEventListener('click', () => {
    const entered = Array.from(boxes).map(b => b.value).join('');
    const err = document.getElementById('codeError');
    err.textContent = '';

    if (entered.length < 6) { err.textContent = 'Enter all 6 digits of the code.'; return; }

    const timing = getSessionStatus(session);
    if (timing.status !== 'open') { err.textContent = 'The check-in window has closed.'; return; }

    if (entered !== session.code) {
      err.textContent = 'Incorrect code. Ask the director for the correct code.';
      boxes.forEach(b => { b.style.borderColor = '#be123c'; b.value = ''; });
      boxes[0].focus();
      return;
    }

    setRecord(session.id, currentUser.id, 'present');
    toast('You are marked Present!', 'success');
    loadTodaySession();
  }, { once: true });
}

function loadMyHistory() {
  if (!currentUser) return;
  const stats   = getMemberStats(currentUser.id);
  const sessions = DB.get(KEY_SESSIONS).sort((a, b) => b.date.localeCompare(a.date));
  const records  = DB.get(KEY_RECORDS);

  document.getElementById('statPresent').textContent = stats.present;
  document.getElementById('statExcused').textContent = stats.excused;
  document.getElementById('statAbsent').textContent  = stats.absent;

  const tbody = document.getElementById('myHistoryBody');
  if (!sessions.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-row">No sessions yet.</td></tr>';
    return;
  }
  tbody.innerHTML = sessions.map(s => {
    const rec = records.find(r => r.sessionId === s.id && r.memberId === currentUser.id);
    const status = rec ? rec.status : 'absent';
    const { cls } = statusPill(status);
    return `<tr>
      <td>${formatDate(s.date)}</td>
      <td>${s.title}</td>
      <td><span class="pill pill-blue">${s.type}</span></td>
      <td><span class="pill ${cls}">${capitalise(status)}</span></td>
    </tr>`;
  }).join('');
}

// Excuse modal
document.getElementById('excuseBtn')?.addEventListener('click', () => {
  document.getElementById('excuseModal').classList.add('open');
});
document.getElementById('excuseModalClose')?.addEventListener('click', closeExcuse);
document.getElementById('excuseCancel')?.addEventListener('click', closeExcuse);
document.getElementById('momoModalClose')?.addEventListener('click', closeExcuse);

function closeExcuse() {
  document.getElementById('excuseModal').classList.remove('open');
}

document.getElementById('excuseSubmit')?.addEventListener('click', () => {
  const reason  = document.getElementById('excuseReason').value;
  const details = document.getElementById('excuseDetails').value.trim();
  const err     = document.getElementById('excuseError');
  err.textContent = '';
  if (!reason) { err.textContent = 'Please select a reason.'; return; }
  const session = getTodaySession();
  if (!session || !currentUser) return;
  setRecord(session.id, currentUser.id, 'excused', { excuseReason: reason, excuseDetails: details });
  closeExcuse();
  toast('Your excuse has been submitted.', 'success');
  loadTodaySession();
});

// ══════════════════════════════════════════
// ADMIN DASHBOARD
// ══════════════════════════════════════════
function initAdmin() {
  // Tabs
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab)?.classList.add('active');
      // Refresh relevant tab
      if (tab.dataset.tab === 'tabOverview') loadOverview();
      if (tab.dataset.tab === 'tabSessions') loadSessionsTable();
      if (tab.dataset.tab === 'tabLive')     loadLiveTab();
      if (tab.dataset.tab === 'tabReports')  loadReports();
      if (tab.dataset.tab === 'tabMembers')  loadMembersTable();
    });
  });

  loadOverview();
  initSessionsTab();
  initLiveTab();
  initReportsTab();
  initMembersTab();
}

// ── OVERVIEW ──
function loadOverview() {
  const members  = DB.get(KEY_MEMBERS).filter(m => !m.isAdmin);
  const sessions = DB.get(KEY_SESSIONS);

  let active = 0, risk = 0, inactive = 0;
  members.forEach(m => {
    const { pct } = getMemberStats(m.id);
    if (pct >= 70) active++;
    else if (pct >= 40) risk++;
    else inactive++;
  });

  document.getElementById('ovTotalMembers').textContent  = members.length;
  document.getElementById('ovActiveMembers').textContent = active;
  document.getElementById('ovAtRisk').textContent        = risk;
  document.getElementById('ovInactive').textContent      = inactive;
  document.getElementById('ovTotalSessions').textContent = sessions.length;
  document.getElementById('ovLastSession').textContent   = sessions.length
    ? formatDate(sessions.sort((a, b) => b.date.localeCompare(a.date))[0].date)
    : '—';
}

// ── SESSIONS ──
let currentCode = '';
function initSessionsTab() {
  currentCode = generateSessionCode();
  document.getElementById('previewCode').textContent = currentCode;

  document.getElementById('newSessionBtn')?.addEventListener('click', () => {
    const form = document.getElementById('newSessionForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    if (form.style.display === 'block') {
      // Default date to today
      document.getElementById('sDate').value  = new Date().toISOString().split('T')[0];
      document.getElementById('sStart').value = '10:00';
      document.getElementById('sEnd').value   = '13:00';
      document.getElementById('sVenue').value = 'Kumasi, Ashanti Region';
      currentCode = generateSessionCode();
      document.getElementById('previewCode').textContent = currentCode;
    }
  });

  document.getElementById('regenCode')?.addEventListener('click', () => {
    currentCode = generateSessionCode();
    document.getElementById('previewCode').textContent = currentCode;
  });

  document.getElementById('cancelSessionBtn')?.addEventListener('click', () => {
    document.getElementById('newSessionForm').style.display = 'none';
  });

  document.getElementById('saveSessionBtn')?.addEventListener('click', () => {
    const title  = document.getElementById('sTitle').value.trim();
    const type   = document.getElementById('sType').value;
    const date   = document.getElementById('sDate').value;
    const start  = document.getElementById('sStart').value;
    const end    = document.getElementById('sEnd').value;
    const venue  = document.getElementById('sVenue').value.trim();
    const before = parseInt(document.getElementById('sOpenBefore').value) || 30;
    const after  = parseInt(document.getElementById('sCloseAfter').value) || 60;

    if (!title || !date || !start || !end || !venue) {
      toast('Please fill in all session fields.', 'error'); return;
    }

    const sessions = DB.get(KEY_SESSIONS);
    const session = {
      id:          'SES-' + Date.now(),
      title, type, date, start, end, venue,
      code:        currentCode,
      openBefore:  before,
      closeAfter:  after,
      createdAt:   new Date().toISOString()
    };
    sessions.push(session);
    DB.set(KEY_SESSIONS, sessions);

    document.getElementById('newSessionForm').style.display = 'none';
    loadSessionsTable();
    toast('Session created successfully!', 'success');
  });

  loadSessionsTable();
}

function loadSessionsTable() {
  const sessions = DB.get(KEY_SESSIONS).sort((a, b) => b.date.localeCompare(a.date));
  const tbody = document.getElementById('sessionsBody');
  if (!sessions.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No sessions created yet.</td></tr>';
    return;
  }
  tbody.innerHTML = sessions.map(s => {
    const timing = getSessionStatus(s);
    const statusCls = timing.status === 'open' ? 'pill-green' : timing.status === 'upcoming' ? 'pill-blue' : 'pill-gray';
    const statusLbl = capitalise(timing.status);
    const records   = DB.get(KEY_RECORDS).filter(r => r.sessionId === s.id && r.status === 'present');
    return `<tr>
      <td>${formatDate(s.date)}</td>
      <td><strong>${s.title}</strong></td>
      <td><span class="pill pill-blue">${s.type}</span></td>
      <td>${s.start} – ${s.end}</td>
      <td><span style="font-family:monospace;font-weight:700;letter-spacing:.15em;color:var(--navy)">${s.code}</span></td>
      <td><span class="pill ${statusCls}">${statusLbl}</span> <small style="color:var(--t400)">(${records.length} present)</small></td>
      <td>
        <button class="ap-btn ap-btn-danger ap-btn-sm" onclick="deleteSession('${s.id}')">Delete</button>
      </td>
    </tr>`;
  }).join('');
}

window.deleteSession = function(id) {
  if (!confirm('Delete this session? All attendance records for it will also be deleted.')) return;
  DB.set(KEY_SESSIONS, DB.get(KEY_SESSIONS).filter(s => s.id !== id));
  DB.set(KEY_RECORDS,  DB.get(KEY_RECORDS).filter(r => r.sessionId !== id));
  loadSessionsTable();
  toast('Session deleted.', 'warn');
};

// ── LIVE ATTENDANCE ──
function initLiveTab() {
  document.getElementById('liveSessionSelect')?.addEventListener('change', renderLiveTable);
  document.getElementById('liveSearch')?.addEventListener('input', renderLiveTable);
  document.getElementById('liveVoiceFilter')?.addEventListener('change', renderLiveTable);
  loadLiveTab();
}

function loadLiveTab() {
  const sel = document.getElementById('liveSessionSelect');
  if (!sel) return;
  const sessions = DB.get(KEY_SESSIONS).sort((a, b) => b.date.localeCompare(a.date));
  const current  = sel.value;
  sel.innerHTML  = '<option value="">Select a session</option>' +
    sessions.map(s => `<option value="${s.id}" ${s.id === current ? 'selected' : ''}>${formatDate(s.date)} — ${s.title}</option>`).join('');
  if (current) renderLiveTable();
}

function renderLiveTable() {
  const sesId  = document.getElementById('liveSessionSelect').value;
  const search = (document.getElementById('liveSearch').value || '').toLowerCase();
  const voice  = document.getElementById('liveVoiceFilter').value;
  const codeBox = document.getElementById('liveCodeBox');

  if (!sesId) {
    codeBox.style.display = 'none';
    document.getElementById('liveBody').innerHTML =
      '<tr><td colspan="6" class="empty-row">Select a session above.</td></tr>';
    return;
  }

  const session = DB.get(KEY_SESSIONS).find(s => s.id === sesId);
  if (!session) return;
  codeBox.style.display = 'flex';
  document.getElementById('liveCode').textContent   = session.code;
  document.getElementById('liveWindow').textContent = `Opens ${session.openBefore}m before · Closes ${session.closeAfter}m after`;

  const members = DB.get(KEY_MEMBERS).filter(m => !m.isAdmin)
    .filter(m => !voice || m.voice === voice)
    .filter(m => !search || m.name.toLowerCase().includes(search) || m.id.toLowerCase().includes(search));

  const records = DB.get(KEY_RECORDS);
  let presentCount = 0, excusedCount = 0, absentCount = 0;

  const rows = members.map(m => {
    const rec = records.find(r => r.sessionId === sesId && r.memberId === m.id);
    const status = rec ? rec.status : 'absent';
    if (status === 'present') presentCount++;
    else if (status === 'excused') excusedCount++;
    else absentCount++;
    const { cls } = statusPill(status);
    const timeStr = rec ? formatTime(rec.time) : '—';
    return `<tr>
      <td style="font-family:monospace;font-size:.78rem">${m.id}</td>
      <td><strong>${m.name}</strong></td>
      <td>${m.voice}</td>
      <td><span class="pill ${cls}">${capitalise(status)}</span></td>
      <td>${timeStr}</td>
      <td>
        ${status !== 'present' ? `<button class="ap-btn ap-btn-green ap-btn-sm" onclick="adminMarkPresent('${sesId}','${m.id}')">Mark Present</button>` : ''}
        ${status === 'present' ? `<button class="ap-btn ap-btn-outline ap-btn-sm" onclick="adminRemoveMark('${sesId}','${m.id}')">Remove</button>` : ''}
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="6" class="empty-row">No members match filter.</td></tr>';

  document.getElementById('liveBody').innerHTML = rows;
  document.getElementById('livePresentCount').textContent = `${presentCount} Present`;
  document.getElementById('liveExcusedCount').textContent = `${excusedCount} Excused`;
  document.getElementById('liveAbsentCount').textContent  = `${absentCount} Absent`;
}

window.adminMarkPresent = function(sesId, memberId) {
  setRecord(sesId, memberId, 'present');
  renderLiveTable();
  toast('Marked as Present.', 'success');
};
window.adminRemoveMark = function(sesId, memberId) {
  DB.set(KEY_RECORDS, DB.get(KEY_RECORDS).filter(r => !(r.sessionId === sesId && r.memberId === memberId)));
  renderLiveTable();
  toast('Attendance mark removed.', 'warn');
};

// ── REPORTS ──
function initReportsTab() {
  document.getElementById('reportSearch')?.addEventListener('input', loadReports);
  document.getElementById('reportVoice')?.addEventListener('change', loadReports);
  document.getElementById('reportStatus')?.addEventListener('change', loadReports);
  document.getElementById('exportCsvBtn')?.addEventListener('click', exportCSV);
  loadReports();
}

function loadReports() {
  const search = (document.getElementById('reportSearch').value || '').toLowerCase();
  const voice  = document.getElementById('reportVoice').value;
  const filter = document.getElementById('reportStatus').value;

  let members = DB.get(KEY_MEMBERS).filter(m => !m.isAdmin);
  if (voice) members = members.filter(m => m.voice === voice);
  if (search) members = members.filter(m => m.name.toLowerCase().includes(search) || m.id.toLowerCase().includes(search));

  const tbody = document.getElementById('reportBody');
  if (!members.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-row">No members found.</td></tr>';
    return;
  }

  const rows = members.map(m => {
    const stats = getMemberStats(m.id);
    const { label, cls } = getStatusLabel(stats.pct);
    const statusKey = stats.pct >= 70 ? 'active' : stats.pct >= 40 ? 'risk' : 'inactive';
    if (filter && filter !== statusKey) return '';
    return `<tr>
      <td style="font-family:monospace;font-size:.78rem">${m.id}</td>
      <td><strong>${m.name}</strong></td>
      <td>${m.voice}</td>
      <td style="color:var(--green);font-weight:700">${stats.present}</td>
      <td style="color:var(--amber);font-weight:700">${stats.excused}</td>
      <td style="color:var(--red);font-weight:700">${stats.absent}</td>
      <td><strong>${stats.pct}%</strong></td>
      <td><span class="pill ${cls}">${label}</span></td>
    </tr>`;
  }).filter(Boolean).join('') || '<tr><td colspan="8" class="empty-row">No results.</td></tr>';

  tbody.innerHTML = rows;
}

function exportCSV() {
  const members  = DB.get(KEY_MEMBERS).filter(m => !m.isAdmin);
  const sessions = DB.get(KEY_SESSIONS);
  const records  = DB.get(KEY_RECORDS);

  let csv = 'Member ID,Name,Voice Part,Role,';
  csv += sessions.map(s => `${s.date} ${s.title}`).join(',');
  csv += ',Present,Excused,Absent,Attendance %,Status\n';

  members.forEach(m => {
    const stats = getMemberStats(m.id);
    const { label } = getStatusLabel(stats.pct);
    let row = `"${m.id}","${m.name}","${m.voice}","${m.role}",`;
    sessions.forEach(s => {
      const rec = records.find(r => r.sessionId === s.id && r.memberId === m.id);
      row += (rec ? capitalise(rec.status) : 'Absent') + ',';
    });
    row += `${stats.present},${stats.excused},${stats.absent},${stats.pct}%,"${label}"`;
    csv += row + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `SNE_Attendance_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('CSV exported!', 'success');
}

// ── MEMBERS ──
function initMembersTab() {
  // Auto-generate ID
  const genId = () => {
    const year = document.getElementById('mYear').value || new Date().getFullYear();
    const name = document.getElementById('mName').value.trim();
    const phone = document.getElementById('mPhone').value.trim();
    if (name && phone) {
      document.getElementById('mId').value = generateMemberId(name, phone, year);
    }
  };
  document.getElementById('mName')?.addEventListener('blur', genId);
  document.getElementById('mPhone')?.addEventListener('blur', genId);
  document.getElementById('mYear')?.addEventListener('blur', genId);

  document.getElementById('addMemberBtn')?.addEventListener('click', () => {
    const form = document.getElementById('addMemberForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('cancelMemberBtn')?.addEventListener('click', () => {
    document.getElementById('addMemberForm').style.display = 'none';
  });

  document.getElementById('saveMemberBtn')?.addEventListener('click', () => {
    const name  = document.getElementById('mName').value.trim();
    const id    = document.getElementById('mId').value.trim().toUpperCase();
    const voice = document.getElementById('mVoice').value;
    const role  = document.getElementById('mRole').value;
    const phone = document.getElementById('mPhone').value.trim();
    const year  = document.getElementById('mYear').value.trim();
    const pin   = document.getElementById('mPin').value.trim();
    const err   = document.getElementById('memberFormError');
    err.textContent = '';

    if (!name || !id || !voice || !phone || !year || !pin) {
      err.textContent = 'Please fill in all required fields.'; return;
    }
    if (pin.length < 4) { err.textContent = 'PIN must be at least 4 digits.'; return; }

    let members = DB.get(KEY_MEMBERS);
    if (members.find(m => m.id === id)) { err.textContent = 'This Member ID already exists.'; return; }

    members.push({ id, name, voice, role, phone, year, pin: hashPin(pin), status: 'active', isAdmin: false, joinedAt: new Date().toISOString() });
    DB.set(KEY_MEMBERS, members);
    document.getElementById('addMemberForm').style.display = 'none';
    loadMembersTable();
    loadOverview();
    toast(`${name} added successfully!`, 'success');

    // Clear form
    ['mName','mId','mPhone','mYear','mPin'].forEach(id => document.getElementById(id).value = '');
  });

  document.getElementById('memberSearch')?.addEventListener('input', loadMembersTable);
  document.getElementById('memberVoiceFilter')?.addEventListener('change', loadMembersTable);
  document.getElementById('memberStatusFilter')?.addEventListener('change', loadMembersTable);
  loadMembersTable();
}

function loadMembersTable() {
  const search  = (document.getElementById('memberSearch').value || '').toLowerCase();
  const voice   = document.getElementById('memberVoiceFilter').value;
  const statusF = document.getElementById('memberStatusFilter').value;

  let members = DB.get(KEY_MEMBERS).filter(m => !m.isAdmin);
  if (voice)  members = members.filter(m => m.voice === voice);
  if (search) members = members.filter(m => m.name.toLowerCase().includes(search) || m.id.toLowerCase().includes(search));
  if (statusF) members = members.filter(m => m.status === statusF);

  const tbody = document.getElementById('membersBody');
  if (!members.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No members found.</td></tr>';
    return;
  }
  tbody.innerHTML = members.map(m => {
    const statCls = m.status === 'active' ? 'pill-green' : 'pill-red';
    return `<tr>
      <td style="font-family:monospace;font-size:.78rem">${m.id}</td>
      <td><strong>${m.name}</strong></td>
      <td>${m.voice}</td>
      <td>${m.role}</td>
      <td>${m.year || '—'}</td>
      <td><span class="pill ${statCls}">${capitalise(m.status)}</span></td>
      <td style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="ap-btn ap-btn-outline ap-btn-sm" onclick="toggleMemberStatus('${m.id}')">
          ${m.status === 'active' ? 'Deactivate' : 'Activate'}
        </button>
        <button class="ap-btn ap-btn-outline ap-btn-sm" onclick="resetPin('${m.id}')">Reset PIN</button>
        <button class="ap-btn ap-btn-danger ap-btn-sm" onclick="deleteMember('${m.id}')">Delete</button>
      </td>
    </tr>`;
  }).join('');
}

window.toggleMemberStatus = function(id) {
  let members = DB.get(KEY_MEMBERS);
  const idx = members.findIndex(m => m.id === id);
  if (idx < 0) return;
  members[idx].status = members[idx].status === 'active' ? 'inactive' : 'active';
  DB.set(KEY_MEMBERS, members);
  loadMembersTable();
  loadOverview();
  toast('Member status updated.', 'success');
};

window.resetPin = function(id) {
  const newPin = prompt(`Enter a new temporary PIN for member ${id}:`);
  if (!newPin || newPin.length < 4) { toast('PIN must be at least 4 digits.', 'error'); return; }
  let members = DB.get(KEY_MEMBERS);
  const idx = members.findIndex(m => m.id === id);
  if (idx < 0) return;
  members[idx].pin = hashPin(newPin);
  DB.set(KEY_MEMBERS, members);
  toast(`PIN reset for ${members[idx].name}.`, 'success');
};

window.deleteMember = function(id) {
  const members = DB.get(KEY_MEMBERS);
  const m = members.find(mb => mb.id === id);
  if (!confirm(`Delete ${m?.name}? All their attendance records will be removed.`)) return;
  DB.set(KEY_MEMBERS, members.filter(mb => mb.id !== id));
  DB.set(KEY_RECORDS,  DB.get(KEY_RECORDS).filter(r => r.memberId !== id));
  loadMembersTable();
  loadOverview();
  toast('Member deleted.', 'warn');
};

// ══════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
}

function formatTime(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
}

function capitalise(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function statusPill(status) {
  if (status === 'present') return { cls: 'pill-green' };
  if (status === 'excused') return { cls: 'pill-amber' };
  return { cls: 'pill-red' };
}

// ══════════════════════════════════════════
// INIT
// ══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  seedAdminIfNeeded();
  currentUser = getUser();

  if (currentUser) {
    updateHeader();
    if (currentUser.isAdmin) {
      showScreen('screenAdmin');
      initAdmin();
    } else {
      showScreen('screenMember');
      loadMemberDashboard();
    }
  } else {
    showScreen('screenLogin');
    initLogin();
  }
});
