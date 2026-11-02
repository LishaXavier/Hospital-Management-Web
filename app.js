/* HealthCare+ — front-end demo. Data is stored in localStorage.
   For real use, move auth + data to a backend (Node/PHP/Django) with hashed passwords. */
const $ = s => document.querySelector(s);
const DB_KEY = 'hc_db', SES_KEY = 'hc_session';
const SERVICES = [['🩺','Outpatient Care','Treatment for everyday health needs.'],['🛏️','Inpatient Services','Safe hospital stays with 24/7 care.'],['🧪','Diagnostic Services','Accurate tests and faster results.'],['💊','Pharmacy','Quality medicines and health products.'],['🔪','Surgery & Operations','Advanced surgical care with expert teams.'],['🚑','Emergency Care','24/7 services for urgent needs.'],['👶','Maternity & Child Care','Specialized care for mothers and children.'],['🦴','Rehabilitation','Helping you recover and live better.']];

const seed = () => ({
  users: [
    { id: 1, role: 'admin', name: 'Admin', email: 'admin@hc.com', pass: 'admin123' },
    { id: 2, role: 'doctor', name: 'Dr. Sarah Khan', email: 'sarah@hc.com', pass: 'doc123', spec: 'Cardiologist' },
    { id: 3, role: 'doctor', name: 'Dr. Ahmed Rahman', email: 'ahmed@hc.com', pass: 'doc123', spec: 'General Physician' },
    { id: 4, role: 'patient', name: 'Demo Patient', email: 'patient@hc.com', pass: 'pat123' }
  ],
  appts: [{ id: 1, patient: 4, doctor: 2, date: new Date(Date.now() + 864e5).toISOString().slice(0, 10), time: '10:00', reason: 'Chest check-up', status: 'Pending' }]
});
let db = JSON.parse(localStorage.getItem(DB_KEY) || 'null') || seed();
const save = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
let me = JSON.parse(localStorage.getItem(SES_KEY) || 'null');
let role = 'patient', mode = 'login';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uname = id => (db.users.find(u => u.id === id) || { name: '—' }).name;
const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2200); };

/* ---------- Landing ---------- */
$('#serviceGrid').innerHTML = SERVICES.map(s => `<div class="svc"><i>${s[0]}</i><b>${s[1]}</b><span>${s[2]}</span></div>`).join('');

/* ---------- Auth ---------- */
function openLogin(r) { if (me) return render(); if (r) setRole(r); $('#loginModal').hidden = false; }
function closeLogin() { $('#loginModal').hidden = true; $('#authErr').textContent = ''; }
function setRole(r) {
  role = r;
  document.querySelectorAll('#roleTabs button').forEach(b => b.classList.toggle('on', b.dataset.r === r));
  if (r !== 'patient') mode = 'login';
  syncAuthUI();
}
function syncAuthUI() {
  const reg = mode === 'register';
  $('#authTitle').textContent = reg ? 'Create patient account' : 'Login';
  $('#authBtn').textContent = reg ? 'Create account' : 'Login';
  $('#nameRow').hidden = !reg;
  $('#toggleAuth').textContent = reg ? 'Have an account? Login' : 'New patient? Create account';
  $('#toggleAuth').parentElement.hidden = role !== 'patient';
}
document.querySelectorAll('#roleTabs button').forEach(b => b.onclick = () => setRole(b.dataset.r));
function toggleAuth(e) { e.preventDefault(); mode = mode === 'login' ? 'register' : 'login'; syncAuthUI(); }
function submitAuth() {
  const email = $('#email').value.trim().toLowerCase(), pass = $('#pass').value, err = $('#authErr');
  if (!email || !pass) return err.textContent = 'Enter email and password.';
  if (mode === 'register') {
    const name = $('#fname').value.trim();
    if (!name) return err.textContent = 'Enter your full name.';
    if (db.users.some(u => u.email === email)) return err.textContent = 'This email is already registered.';
    db.users.push({ id: Date.now(), role: 'patient', name, email, pass }); save();
  }
  const u = db.users.find(u => u.email === email && u.pass === pass && u.role === role);
  if (!u) return err.textContent = `No ${role} account matches these details.`;
  me = { id: u.id, role: u.role }; localStorage.setItem(SES_KEY, JSON.stringify(me));
  closeLogin(); render(); toast(`Welcome, ${u.name}`);
}
function logout() { me = null; localStorage.removeItem(SES_KEY); render(); }

/* ---------- Rendering ---------- */
function render() {
  const site = $('#site'), dash = $('#dash');
  if (!me) {
    site.hidden = false; dash.hidden = true;
    $('#authArea').innerHTML = '<button class="btn" onclick="openLogin()">Login</button>'; return;
  }
  site.hidden = true; dash.hidden = false;
  $('#authArea').innerHTML = `<button class="btn ghost" onclick="logout()">Logout (${esc(uname(me.id))})</button>`;
  ({ patient: patientView, doctor: doctorView, admin: adminView })[me.role]();
  window.scrollTo(0, 0);
}
const kpi = (n, l) => `<div class="kpi"><b>${n}</b>${l}</div>`;
const table = (head, rows) => rows.length ? `<div class="tw"><table><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>${rows.join('')}</table></div>` : '<p class="empty">Nothing here yet.</p>';
const tag = s => `<span class="tag ${s}">${s}</span>`;
const head = (t, sub) => `<div class="dh"><h2>${t}</h2><span class="tag">${sub}</span></div>`;

/* Patient */
function patientView() {
  const mine = db.appts.filter(a => a.patient === me.id).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const docs = db.users.filter(u => u.role === 'doctor');
  const today = new Date().toISOString().slice(0, 10);
  $('#dash').innerHTML = head('Patient dashboard', 'Patient') +
    `<div class="kpis">${kpi(mine.length, 'My appointments')}${kpi(mine.filter(a => a.status === 'Pending').length, 'Pending')}${kpi(mine.filter(a => a.status === 'Completed').length, 'Completed')}</div>
    <div class="panel"><h3>Book an appointment</h3><div class="form">
      <label>Doctor<select id="bDoc">${docs.map(d => `<option value="${d.id}">${esc(d.name)} — ${esc(d.spec || 'Doctor')}</option>`).join('')}</select></label>
      <label>Date<input id="bDate" type="date" min="${today}" value="${today}"></label>
      <label>Time<input id="bTime" type="time" value="10:00"></label>
      <label>Reason<input id="bReason" placeholder="Reason for visit"></label>
      <button class="btn" onclick="book()">Book appointment</button></div></div>
    <div class="panel"><h3>My appointments</h3>${table(['Doctor', 'Date', 'Time', 'Reason', 'Status', ''], mine.map(a => `<tr><td>${esc(uname(a.doctor))}</td><td>${a.date}</td><td>${a.time}</td><td>${esc(a.reason)}</td><td>${tag(a.status)}</td><td>${a.status === 'Pending' ? `<button class="btn sm bad" onclick="setStatus(${a.id},'Cancelled')">Cancel</button>` : ''}</td></tr>`))}</div>`;
}
function book() {
  const a = { id: Date.now(), patient: me.id, doctor: +$('#bDoc').value, date: $('#bDate').value, time: $('#bTime').value, reason: $('#bReason').value.trim() || 'General consultation', status: 'Pending' };
  if (!a.doctor || !a.date || !a.time) return toast('Fill all fields');
  if (db.appts.some(x => x.doctor === a.doctor && x.date === a.date && x.time === a.time && x.status !== 'Cancelled')) return toast('That slot is taken. Pick another time.');
  db.appts.push(a); save(); render(); toast('Appointment booked');
}
function setStatus(id, s) { const a = db.appts.find(x => x.id === id); if (!a) return; a.status = s; save(); render(); toast(`Marked ${s}`); }

/* Doctor */
function doctorView() {
  const mine = db.appts.filter(a => a.doctor === me.id).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  $('#dash').innerHTML = head('Doctor dashboard', esc(uname(me.id))) +
    `<div class="kpis">${kpi(mine.length, 'Total appointments')}${kpi(mine.filter(a => a.status === 'Pending').length, 'Pending')}${kpi(new Set(mine.map(a => a.patient)).size, 'Patients')}</div>
    <div class="panel"><h3>My schedule</h3>${table(['Patient', 'Date', 'Time', 'Reason', 'Status', ''], mine.map(a => `<tr><td>${esc(uname(a.patient))}</td><td>${a.date}</td><td>${a.time}</td><td>${esc(a.reason)}</td><td>${tag(a.status)}</td><td>${a.status === 'Pending' ? `<button class="btn sm ok" onclick="setStatus(${a.id},'Completed')">Complete</button> <button class="btn sm bad" onclick="setStatus(${a.id},'Cancelled')">Cancel</button>` : ''}</td></tr>`))}</div>`;
}

/* Admin */
function adminView() {
  const docs = db.users.filter(u => u.role === 'doctor'), pats = db.users.filter(u => u.role === 'patient');
  $('#dash').innerHTML = head('Admin dashboard', 'Admin') +
    `<div class="kpis">${kpi(docs.length, 'Doctors')}${kpi(pats.length, 'Patients')}${kpi(db.appts.length, 'Appointments')}${kpi(db.appts.filter(a => a.status === 'Pending').length, 'Pending')}</div>
    <div class="panel"><h3>Add doctor</h3><div class="form">
      <label>Name<input id="dName" placeholder="Dr. Full Name"></label>
      <label>Specialty<input id="dSpec" placeholder="e.g. Pediatrician"></label>
      <label>Email<input id="dEmail" type="email"></label>
      <label>Password<input id="dPass" type="text"></label>
      <button class="btn" onclick="addDoctor()">Add doctor</button></div></div>
    <div class="panel"><h3>Doctors</h3>${table(['Name', 'Specialty', 'Email', ''], docs.map(d => `<tr><td>${esc(d.name)}</td><td>${esc(d.spec || '')}</td><td>${esc(d.email)}</td><td><button class="btn sm bad" onclick="removeUser(${d.id})">Remove</button></td></tr>`))}</div>
    <div class="panel"><h3>Patients</h3>${table(['Name', 'Email', ''], pats.map(p => `<tr><td>${esc(p.name)}</td><td>${esc(p.email)}</td><td><button class="btn sm bad" onclick="removeUser(${p.id})">Remove</button></td></tr>`))}</div>
    <div class="panel"><h3>All appointments</h3>${table(['Patient', 'Doctor', 'Date', 'Time', 'Status'], db.appts.map(a => `<tr><td>${esc(uname(a.patient))}</td><td>${esc(uname(a.doctor))}</td><td>${a.date}</td><td>${a.time}</td><td>${tag(a.status)}</td></tr>`))}</div>`;
}
function addDoctor() {
  const name = $('#dName').value.trim(), email = $('#dEmail').value.trim().toLowerCase(), pass = $('#dPass').value;
  if (!name || !email || !pass) return toast('Fill name, email and password');
  if (db.users.some(u => u.email === email)) return toast('Email already used');
  db.users.push({ id: Date.now(), role: 'doctor', name, spec: $('#dSpec').value.trim(), email, pass }); save(); render(); toast('Doctor added');
}
function removeUser(id) {
  if (!confirm('Remove this user and their appointments?')) return;
  db.users = db.users.filter(u => u.id !== id);
  db.appts = db.appts.filter(a => a.patient !== id && a.doctor !== id); save(); render();
}

syncAuthUI();
render();