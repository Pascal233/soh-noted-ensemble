/**
 * Soh NOTED Ensemble — main.js
 * Handles: navbar, scroll animations, ticket modal,
 *          Paystack payments, MoMo / USSD flow, contact form
 */

// ── Navbar scroll + mobile toggle ──────────────────────────────
const navbar    = document.querySelector('.navbar');
const navToggle = document.querySelector('.nav-tog');
const navMenu   = document.querySelector('.nav-menu');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
  updateActiveLink();
  scrollTopBtn?.classList.toggle('vis', window.scrollY > 400);
});

navToggle?.addEventListener('click', () => {
  const isOpen = navToggle.classList.toggle('open');
  navMenu.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', isOpen);
});
document.querySelectorAll('.nav-menu a').forEach(a => {
  a.addEventListener('click', () => {
    navToggle.classList.remove('open');
    navMenu.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

function updateActiveLink() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-menu a[href^="#"]');
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 100) current = s.id;
  });
  links.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
  });
}

// ── Scroll animations ───────────────────────────────────────────
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.fu').forEach(el => io.observe(el));

// ── Scroll to top ───────────────────────────────────────────────
const scrollTopBtn = document.getElementById('scrollTop');
scrollTopBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ── Smooth anchor scroll ────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
    }
  });
});

// ── Concert data ────────────────────────────────────────────────
const CONCERTS = {
  concert1: {
    name:   'Christmas Carol Concert 2026',
    date:   'Saturday, 20 December 2026',
    venue:  'Wesley Methodist Cathedral, Kumasi',
    prices: { student: 30, regular: 50, vip: 150 },
    currency: 'GHS'
  },
  concert2: {
    name:   'Easter Cantata 2027',
    date:   'Friday, 2 April 2027',
    venue:  'Kumasi City Auditorium',
    prices: { student: 35, regular: 60, vip: 180 },
    currency: 'GHS'
  },
  concert3: {
    name:   "Founders' Night Gala 2027",
    date:   'Saturday, 15 May 2027',
    venue:  'Golden Tulip Hotel, Kumasi',
    prices: { student: 50, regular: 100, vip: 300 },
    currency: 'GHS'
  }
};

let activeConcert = null;

// ── Open ticket modal ───────────────────────────────────────────
function openModal(id) {
  activeConcert = CONCERTS[id];
  if (!activeConcert) return;
  document.getElementById('modalConcertName').textContent = activeConcert.name;
  document.getElementById('modalConcertDate').textContent = activeConcert.date;
  document.getElementById('modalVenueName').textContent   = activeConcert.venue;
  document.getElementById('ticketForm').reset();
  document.getElementById('ussdInfo').classList.remove('show');
  document.querySelectorAll('.popt').forEach(o => { o.style.borderColor=''; o.style.background=''; });
  document.getElementById('ticketModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  updateSummary();
}

function closeTicketModal() {
  document.getElementById('ticketModal').classList.remove('active');
  document.body.style.overflow = '';
}

document.getElementById('modalCloseBtn')?.addEventListener('click', closeTicketModal);
document.getElementById('modalCancelBtn')?.addEventListener('click', closeTicketModal);
document.getElementById('ticketModal')?.addEventListener('click', e => { if (e.target.id === 'ticketModal') closeTicketModal(); });

// ── Summary calculation ─────────────────────────────────────────
function updateSummary() {
  if (!activeConcert) return 0;
  const type  = document.getElementById('ticketType')?.value;
  const qty   = parseInt(document.getElementById('ticketQty')?.value) || 1;
  const unit  = activeConcert.prices[type] ?? 0;
  const total = unit * qty;

  document.getElementById('summaryType').textContent = type ? type.charAt(0).toUpperCase() + type.slice(1) + ' Ticket' : '—';
  document.getElementById('summaryQty').textContent  = qty;
  document.getElementById('summaryUnit').textContent = unit ? `${activeConcert.currency} ${unit.toFixed(2)}` : '—';
  document.getElementById('modalAmount').textContent = total.toFixed(2);
  return total;
}

document.getElementById('ticketType')?.addEventListener('change', updateSummary);
document.getElementById('ticketQty')?.addEventListener('input', updateSummary);

document.getElementById('qtyMinus')?.addEventListener('click', () => {
  const q = document.getElementById('ticketQty');
  if (q && parseInt(q.value) > 1) { q.value = parseInt(q.value) - 1; updateSummary(); }
});
document.getElementById('qtyPlus')?.addEventListener('click', () => {
  const q = document.getElementById('ticketQty');
  if (q && parseInt(q.value) < 10) { q.value = parseInt(q.value) + 1; updateSummary(); }
});

// ── Payment method selection ────────────────────────────────────
document.querySelectorAll('.popt').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.popt').forEach(o => { o.style.borderColor=''; o.style.background=''; });
    opt.style.borderColor = 'var(--navy)';
    opt.style.background  = 'rgba(26,42,94,.06)';
    const radio = opt.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
    const ussdBox = document.getElementById('ussdInfo');
    ussdBox?.classList.toggle('show', radio?.value === 'ussd');
  });
});

// ── Ticket form submit ──────────────────────────────────────────
document.getElementById('ticketForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const name   = document.getElementById('buyerName')?.value.trim();
  const email  = document.getElementById('buyerEmail')?.value.trim();
  const phone  = document.getElementById('buyerPhone')?.value.trim();
  const type   = document.getElementById('ticketType')?.value;
  const qty    = parseInt(document.getElementById('ticketQty')?.value) || 1;
  const method = document.querySelector('.popt input:checked')?.value;

  if (!name || !email || !phone || !type) { showToast('Please fill in all required fields.', 'error'); return; }
  if (!method) { showToast('Please select a payment method.', 'error'); return; }
  if (!activeConcert) return;

  const total = updateSummary();

  if (method === 'paystack') {
    if (typeof PaystackPop === 'undefined') { showToast('Paystack is loading, please try again.', 'error'); return; }
    runPaystack(email, total, name, phone, qty);
  } else if (method === 'momo' || method === 'ussd') {
    // Save pending order to admin
    saveTicketOrder(name, email, phone, type, qty, total, method, 'pending');
    closeTicketModal();
    openMomoModal(name, total, activeConcert, qty, type);
  }
});

// ── Paystack ────────────────────────────────────────────────────
function runPaystack(email, amount, name, phone, qty) {
  // Replace with your real public key from dashboard.paystack.com
  const KEY = 'pk_live_REPLACE_WITH_YOUR_PAYSTACK_PUBLIC_KEY';
  const handler = PaystackPop.setup({
    key:      KEY,
    email:    email,
    amount:   Math.round(amount * 100),   // pesewas
    currency: 'GHS',
    ref:      'SNE-' + Date.now(),
    metadata: {
      custom_fields: [
        { display_name:'Name',    variable_name:'name',    value: name },
        { display_name:'Phone',   variable_name:'phone',   value: phone },
        { display_name:'Concert', variable_name:'concert', value: activeConcert.name },
        { display_name:'Qty',     variable_name:'qty',     value: qty }
      ]
    },
    callback: r => {
      closeTicketModal();
      saveTicketOrder(email, email, phone, qty, total, 'paystack', 'paid', r.reference);
      showToast('Payment successful! Ref: ' + r.reference, 'success');
    },
    onClose:  ()  => showToast('Payment cancelled.', 'error')
  });
  handler.openIframe();
}

// ── MoMo modal ──────────────────────────────────────────────────
function openMomoModal(name, total, concert, qty, type) {
  const ref = 'SNE-' + Date.now();
  document.getElementById('momoRef').textContent         = ref;
  document.getElementById('momoRefInline').textContent   = ref;
  document.getElementById('momoConcert').textContent     = concert.name;
  document.getElementById('momoTickets').textContent     = `${qty} × ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  document.getElementById('momoName').textContent        = name;
  document.getElementById('momoAmount').textContent      = `GHS ${total.toFixed(2)}`;

  document.getElementById('momoOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeMomoModal() {
  document.getElementById('momoOverlay')?.classList.remove('active');
  document.body.style.overflow = '';
}

document.getElementById('momoCloseBtn')?.addEventListener('click',   closeMomoModal);
document.getElementById('momoConfirmBtn')?.addEventListener('click', () => {
  closeMomoModal();
  showToast('Reference saved. Send your MoMo payment to complete booking.', 'success');
});
document.getElementById('momoOverlay')?.addEventListener('click', e => {
  if (e.target.id === 'momoOverlay') closeMomoModal();
});

// ── Contact form ────────────────────────────────────────────────
document.getElementById('contactForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const btn = this.querySelector('button[type="submit"]');
  const orig = btn.innerHTML;
  btn.classList.add('loading');
  btn.disabled = true;
  // TODO: replace setTimeout with real API call to backend
  setTimeout(() => {
    btn.classList.remove('loading');
    btn.innerHTML = orig;
    btn.disabled  = false;
    this.reset();
    showToast('Message sent! We will get back to you soon.', 'success');
  }, 1800);
});

// ── Toast ────────────────────────────────────────────────────────
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className   = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 4200);
}

// ── Init ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateActiveLink();
});

document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeTicketModal(); closeMomoModal(); } });

// ══════════════════════════════════════════════
// MEMBER ID PORTAL
// ══════════════════════════════════════════════

/**
 * Generates a deterministic but unique-looking member ID.
 * Format: SNE-YYYY-XXXX  (e.g. SNE-2024-4821)
 * The numeric part is derived from the member's name + phone
 * so the same person always gets the same ID.
 */
function generateMemberID(name, phone, year) {
  const seed = (name + phone + year).toLowerCase().replace(/\s/g, '');
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const num = Math.abs(hash) % 9000 + 1000; // always 4 digits 1000–9999
  return `SNE-${year}-${num}`;
}

/** Build the barcode visual (random-looking bars seeded from the ID) */
function buildBarcode(id) {
  const bc = document.getElementById('idcBarcode');
  if (!bc) return;
  bc.innerHTML = '';
  const heights = [14,20,10,24,16,12,22,8,18,14,20,10,22,16,12,24,8,18,14,20,10,24];
  // Use id string to vary heights deterministically
  for (let i = 0; i < 22; i++) {
    const h = heights[i] + (id.charCodeAt(i % id.length) % 6);
    const bar = document.createElement('span');
    bar.style.height = h + 'px';
    bc.appendChild(bar);
  }
}

/** Get initials from a full name */
function getInitials(name) {
  return name.trim().split(/\s+/)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

document.getElementById('memberForm')?.addEventListener('submit', function(e) {
  e.preventDefault();

  const btn  = this.querySelector('button[type="submit"]');
  const orig = btn.innerHTML;
  btn.classList.add('loading');
  btn.disabled = true;

  const name     = document.getElementById('mFullName')?.value.trim();
  const voice    = document.getElementById('mVoicePart')?.value;
  const role     = document.getElementById('mRole')?.value;
  const phone    = document.getElementById('mPhone')?.value.trim();
  const year     = document.getElementById('mJoinYear')?.value;
  const email    = document.getElementById('mEmail')?.value.trim();

  if (!name || !voice || !role || !phone || !year) {
    btn.classList.remove('loading');
    btn.innerHTML = orig;
    btn.disabled = false;
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  // Generate ID
  const memberID = generateMemberID(name, phone, year);
  const initials = getInitials(name);

  // Populate card
  document.getElementById('idcName').textContent  = name;
  document.getElementById('idcRole').textContent  = `${role}  ·  ${voice}`;
  document.getElementById('idcID').textContent    = memberID;
  document.getElementById('idcJoin').textContent  = `Class of ${year}`;
  document.getElementById('idcYear').textContent  = new Date().getFullYear();

  // Phone row
  const phoneRow = document.getElementById('idcPhoneRow');
  if (phoneRow) {
    phoneRow.style.display = 'flex';
    document.getElementById('idcPhone').textContent = phone;
  }

  // Avatar initials
  const avatar = document.getElementById('idcAvatar');
  document.getElementById('idcInitials').textContent = initials;
  avatar?.classList.add('has-initials');

  // Barcode
  buildBarcode(memberID);

  // Show card as generated
  document.getElementById('idCard')?.classList.add('generated');
  document.getElementById('mcActions').style.display = 'flex';
  document.getElementById('mcNote').style.display    = 'flex';
  document.querySelector('.mc-hint').style.display   = 'none';

  // Update note to show default PIN
  const defaultPin4 = phone.replace(/\D/g,'').slice(-4) || '1234';
  const noteEl = document.getElementById('mcNote');
  if (noteEl) {
    noteEl.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
      <span>Screenshot your card. To sign in to Attendance, use your Member ID <strong>${memberID}</strong> and your default PIN: <strong>${defaultPin4}</strong> (last 4 digits of your phone). Change your PIN after first login.</span>
    `;
  }

  // Restore button
  btn.classList.remove('loading');
  btn.innerHTML = orig;
  btn.disabled  = false;

  // ── AUTO-REGISTER member so they can log into Attendance immediately ──
  const defaultPin = phone.replace(/\D/g,'').slice(-4) || '1234';
  const existing   = JSON.parse(localStorage.getItem('sne_m') || '[]');
  const alreadyIn  = existing.find(m => m.id === memberID);
  if (!alreadyIn) {
    // Hash PIN the same way attendance.js does
    function _hp(p){ let h=0; for(let i=0;i<p.length;i++){h=Math.imul(31,h)+p.charCodeAt(i)|0;} return h.toString(16); }
    existing.push({
      id: memberID, name, voice, role, phone, year,
      pin: _hp(defaultPin),
      status: 'active', isAdmin: false,
      joinedAt: new Date().toISOString()
    });
    localStorage.setItem('sne_m', JSON.stringify(existing));
    showToast('ID ready: ' + memberID + '  |  Default PIN: ' + defaultPin, 'success');
  } else {
    showToast('Your Member ID is ready: ' + memberID, 'success');
  }

  // Scroll card into view on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('idCard')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

// Save card — instructs user to screenshot (browser print fallback)
document.getElementById('btnSaveCard')?.addEventListener('click', () => {
  showToast('Take a screenshot to save your ID card!', '');
  // Attempt browser print of just the card
  window.print();
});

// Reset form & card
document.getElementById('btnResetCard')?.addEventListener('click', () => {
  document.getElementById('memberForm')?.reset();

  document.getElementById('idcName').textContent  = '— Member Name —';
  document.getElementById('idcRole').textContent  = 'Role  ·  Voice Part';
  document.getElementById('idcID').textContent    = 'SNE-0000-000';
  document.getElementById('idcJoin').textContent  = '—';
  document.getElementById('idcPhoneRow').style.display = 'none';

  const avatar = document.getElementById('idcAvatar');
  avatar?.classList.remove('has-initials');
  document.getElementById('idcInitials').textContent = '';
  document.getElementById('idcBarcode').innerHTML = '';

  document.getElementById('idCard')?.classList.remove('generated');
  document.getElementById('mcActions').style.display = 'none';
  document.getElementById('mcNote').style.display    = 'none';
  document.querySelector('.mc-hint').style.display   = 'block';
});

// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
// LIGHTBOX
// ══════════════════════════════════════════════
const lightbox = document.getElementById('lightbox');
const lbImg    = document.getElementById('lbImg');
const lbClose  = document.getElementById('lbClose');

function openLightbox(src, alt) {
  if (!src) return;
  lbImg.src = src;
  lbImg.alt = alt || '';
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => { lbImg.src = ''; }, 300);
}

// Close on backdrop click
lightbox?.addEventListener('click', e => {
  if (e.target === lightbox) closeLightbox();
});

// Close button
lbClose?.addEventListener('click', closeLightbox);

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && lightbox?.classList.contains('open')) closeLightbox();
});


// ══════════════════════════════════════════════
// ATTENDANCE PORTAL (embedded in main site)
// ══════════════════════════════════════════════
(function(){
'use strict';

// ── Storage ──
const G = k => { try { return JSON.parse(localStorage.getItem(k))||[]; } catch{return[];} };
const S = (k,v) => localStorage.setItem(k,JSON.stringify(v));
const KM='sne_m', KS='sne_s', KR='sne_r';

// ── Hash ──
function hp(pin){
  let h=0;
  for(let i=0;i<pin.length;i++){h=Math.imul(31,h)+pin.charCodeAt(i)|0;}
  return h.toString(16);
}

// ── Seed admin ──
function seedAdmin(){
  let ms=G(KM);
  if(!ms.find(m=>m.id==='SNE-ADMIN-0001')){
    ms.push({id:'SNE-ADMIN-0001',name:'Frederick Owusu Boakye',voice:'Conductor',
      role:'Executive Director',phone:'0548580708',year:'2015',
      pin:hp('moxart2024'),status:'active',isAdmin:true});
    S(KM,ms);
  }
}

// ── Current user ──
let CU=null;
function getStoredUser(){
  const id=sessionStorage.getItem('sne_att_user');
  if(!id) return null;
  return G(KM).find(m=>m.id===id)||null;
}
function loginAtt(m){ sessionStorage.setItem('sne_att_user',m.id); CU=m; }
function attLogout(){ sessionStorage.removeItem('sne_att_user'); CU=null; showAttView('attViewLogin'); }
window.attLogout=attLogout;

// ── Views ──
function showAttView(id){
  document.querySelectorAll('.att-view').forEach(v=>v.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

// ── Toast ──
function attToast(msg,type=''){
  showToast(msg, type); // reuse main site toast
}

// ── Helpers ──
function fmtDate(d){
  if(!d) return '—';
  return new Date(d+'T12:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
}
function fmtTime(iso){
  if(!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
}
function cap(s){ return s?s.charAt(0).toUpperCase()+s.slice(1):''; }
function genId(name,phone,year){
  const seed=(name+phone+year).toLowerCase().replace(/\s/g,'');
  let h=0;
  for(let i=0;i<seed.length;i++){h=((h<<5)-h)+seed.charCodeAt(i);h|=0;}
  return 'SNE-'+year+'-'+(Math.abs(h)%9000+1000);
}
function genCode(){ return Math.floor(100000+Math.random()*900000).toString(); }

// ── Stats ──
function stats(memberId){
  const sessions=G(KS), records=G(KR);
  let p=0,e=0,a=0;
  sessions.forEach(s=>{
    const r=records.find(r=>r.sId===s.id&&r.mId===memberId);
    if(!r||r.status==='absent') a++;
    else if(r.status==='present') p++;
    else e++;
  });
  const tot=sessions.length;
  const pct=tot>0?Math.round(p/tot*100):0;
  return {p,e,a,tot,pct};
}
function statusInfo(pct){
  if(pct>=70) return {lbl:'Active',cls:'att-pill-green'};
  if(pct>=40) return {lbl:'At Risk',cls:'att-pill-amber'};
  return {lbl:'Inactive',cls:'att-pill-red'};
}
function getRecord(sId,mId){ return G(KR).find(r=>r.sId===sId&&r.mId===mId); }
function setRecord(sId,mId,status,extra={}){
  let rs=G(KR);
  const i=rs.findIndex(r=>r.sId===sId&&r.mId===mId);
  const rec={sId,mId,status,time:new Date().toISOString(),...extra};
  if(i>=0) rs[i]=rec; else rs.push(rec);
  S(KR,rs);
}
function getTodaySes(){
  const today=new Date().toISOString().split('T')[0];
  return G(KS).find(s=>s.date===today)||null;
}
function sesTiming(s){
  const now=new Date();
  const start=new Date(s.date+'T'+s.start);
  const openAt=new Date(start.getTime()-s.openBefore*60000);
  const closeAt=new Date(start.getTime()+s.closeAfter*60000);
  if(now<openAt) return {status:'upcoming',openAt};
  if(now>closeAt) return {status:'closed'};
  return {status:'open',closeAt};
}

let attSesCode='';

// ── LOGIN ──
function initAttLogin(){
  document.getElementById('attPinToggle')?.addEventListener('click',()=>{
    const f=document.getElementById('attPin');
    f.type=f.type==='password'?'text':'password';
  });
  document.getElementById('attShowSetup')?.addEventListener('click',()=>{
    document.getElementById('attSetupBox').style.display='block';
    document.querySelector('#attViewLogin .att-login-box').style.display='none';
  });
  document.getElementById('attHideSetup')?.addEventListener('click',()=>{
    document.getElementById('attSetupBox').style.display='none';
    document.querySelector('#attViewLogin .att-login-box').style.display='block';
  });

  document.getElementById('attLoginForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const id=document.getElementById('attId').value.trim().toUpperCase();
    const pin=document.getElementById('attPin').value.trim();
    const err=document.getElementById('attLoginErr');
    err.textContent='';
    const m=G(KM).find(m=>m.id===id);
    if(!m){err.textContent='Member ID not found. Contact the secretary.';return;}
    if(m.status==='inactive'){err.textContent='Account deactivated. Contact admin.';return;}
    if(m.pin!==hp(pin)){err.textContent='Incorrect PIN. Try again or ask admin to reset.';return;}
    loginAtt(m);
    if(m.isAdmin){showAttView('attViewAdmin');initAttAdmin();}
    else{showAttView('attViewMember');loadAttMember();}
  });

  document.getElementById('attSetupForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const id=document.getElementById('attSetupId').value.trim().toUpperCase();
    const pin=document.getElementById('attSetupPin').value.trim();
    const pin2=document.getElementById('attSetupPin2').value.trim();
    const err=document.getElementById('attSetupErr');
    err.textContent='';
    if(pin.length<4){err.textContent='PIN must be at least 4 digits.';return;}
    if(pin!==pin2){err.textContent='PINs do not match.';return;}
    let ms=G(KM);
    const i=ms.findIndex(m=>m.id===id);
    if(i<0){err.textContent='Member ID not found.';return;}
    ms[i].pin=hp(pin);
    S(KM,ms);
    loginAtt(ms[i]);
    showAttView('attViewMember');
    loadAttMember();
    attToast('PIN set! Welcome to the portal.','success');
  });
}

// ── MEMBER DASHBOARD ──
function loadAttMember(){
  if(!CU) return;
  document.getElementById('attMemberName').textContent=CU.name;
  document.getElementById('attMemberRole').textContent=CU.role;
  document.getElementById('attMemberVoice').textContent=CU.voice;
  document.getElementById('attMemberIdDisp').textContent=CU.id;
  const st=stats(CU.id);
  document.getElementById('attPct').textContent=st.pct+'%';
  loadAttTodaySession();
  loadAttHistory();
}

function loadAttTodaySession(){
  if(!CU) return;
  const ses=getTodaySes();
  const noSes=document.getElementById('attNoSession');
  const detail=document.getElementById('attSessionDetails');
  const badge=document.getElementById('attTypeBadge');
  if(!ses){noSes.style.display='flex';detail.style.display='none';badge.textContent='—';return;}
  noSes.style.display='none';detail.style.display='block';
  badge.textContent=ses.type;
  document.getElementById('attSessionTitle').textContent=ses.title;
  document.getElementById('attSessionDate').textContent=fmtDate(ses.date);
  document.getElementById('attSessionTime').textContent=ses.start+' – '+ses.end;
  document.getElementById('attSessionVenue').textContent=ses.venue;
  renderCheckinState(ses);
}

function renderCheckinState(ses){
  const rec=getRecord(ses.id,CU.id);
  const timing=sesTiming(ses);
  ['attCheckedIn','attExcusedShown','attCodeForm','attWindowClosed','attNotYet'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.style.display='none';
  });
  document.getElementById('attExcuseBtn').style.display='none';

  if(rec&&rec.status==='present'){
    const el=document.getElementById('attCheckedIn');
    el.style.display='flex';
    document.getElementById('attCheckinTime').textContent='Checked in at '+fmtTime(rec.time);
  } else if(rec&&rec.status==='excused'){
    const el=document.getElementById('attExcusedShown');
    el.style.display='flex';
    document.getElementById('attExcuseShownReason').textContent=rec.excuseReason||'—';
  } else if(timing.status==='open'){
    document.getElementById('attCodeForm').style.display='block';
    document.getElementById('attExcuseBtn').style.display='block';
    initAttCodeBoxes(ses);
  } else if(timing.status==='upcoming'){
    document.getElementById('attNotYet').style.display='block';
    document.getElementById('attOpensIn').textContent=ses.openBefore+' mins';
    document.getElementById('attExcuseBtn').style.display='block';
  } else {
    document.getElementById('attWindowClosed').style.display='flex';
  }
}

function initAttCodeBoxes(ses){
  const boxes=document.querySelectorAll('.att-code-box');
  boxes.forEach((b,i)=>{
    b.value='';
    b.oninput=()=>{ b.value=b.value.replace(/\D/g,''); if(b.value&&i<boxes.length-1) boxes[i+1].focus(); };
    b.onkeydown=e=>{ if(e.key==='Backspace'&&!b.value&&i>0) boxes[i-1].focus(); };
  });
  const btn=document.getElementById('attSubmitCode');
  const newBtn=btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn,btn);
  newBtn.addEventListener('click',()=>{
    const entered=Array.from(boxes).map(b=>b.value).join('');
    const err=document.getElementById('attCodeErr');
    err.textContent='';
    if(entered.length<6){err.textContent='Enter all 6 digits.';return;}
    if(sesTiming(ses).status!=='open'){err.textContent='Check-in window has closed.';return;}
    if(entered!==ses.code){
      err.textContent='Wrong code. Ask the director for the correct one.';
      boxes.forEach(b=>{b.style.borderColor='var(--crimson)';b.value='';});
      boxes[0].focus();
      return;
    }
    setRecord(ses.id,CU.id,'present');
    attToast('You are marked Present!','success');
    loadAttTodaySession();
  });
}

function loadAttHistory(){
  if(!CU) return;
  const st=stats(CU.id);
  document.getElementById('attStatP').textContent=st.p;
  document.getElementById('attStatE').textContent=st.e;
  document.getElementById('attStatA').textContent=st.a;
  const sessions=G(KS).sort((a,b)=>b.date.localeCompare(a.date));
  const records=G(KR);
  const tbody=document.getElementById('attHistoryBody');
  if(!sessions.length){tbody.innerHTML='<tr><td colspan="4" class="att-empty-row">No sessions yet.</td></tr>';return;}
  tbody.innerHTML=sessions.map(s=>{
    const r=records.find(r=>r.sId===s.id&&r.mId===CU.id);
    const status=r?r.status:'absent';
    const cls=status==='present'?'att-pill-green':status==='excused'?'att-pill-amber':'att-pill-red';
    return `<tr><td>${fmtDate(s.date)}</td><td>${s.title}</td><td><span class="att-pill att-pill-blue">${s.type}</span></td><td><span class="att-pill ${cls}">${cap(status)}</span></td></tr>`;
  }).join('');
}

// Excuse
document.getElementById('attOpenExcuse')?.addEventListener('click',()=>{ document.getElementById('attExcuseModal').classList.add('open'); });
document.getElementById('attExcuseClose')?.addEventListener('click',closeAttExcuse);
document.getElementById('attExcuseCancel')?.addEventListener('click',closeAttExcuse);
function closeAttExcuse(){ document.getElementById('attExcuseModal').classList.remove('open'); }
document.getElementById('attExcuseSubmit')?.addEventListener('click',()=>{
  const reason=document.getElementById('attExcuseReason').value;
  const details=document.getElementById('attExcuseDetails').value.trim();
  const err=document.getElementById('attExcuseErr');
  err.textContent='';
  if(!reason){err.textContent='Please select a reason.';return;}
  const ses=getTodaySes();
  if(!ses||!CU) return;
  setRecord(ses.id,CU.id,'excused',{excuseReason:reason,excuseDetails:details});
  closeAttExcuse();
  attToast('Excuse submitted.','success');
  loadAttTodaySession();
});

// ── ADMIN ──
function initAttAdmin(){
  document.getElementById('attAdminName').textContent=CU.name;
  document.querySelectorAll('.att-tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
      document.querySelectorAll('.att-tab').forEach(t=>t.classList.remove('active'));
      document.querySelectorAll('.att-panel').forEach(p=>p.classList.remove('active'));
      tab.classList.add('active');
      const panel=document.getElementById(tab.dataset.atab);
      panel?.classList.add('active');
      if(tab.dataset.atab==='atOverview') loadAttOverview();
      if(tab.dataset.atab==='atSessions') loadAttSessions();
      if(tab.dataset.atab==='atLive')     loadAttLive();
      if(tab.dataset.atab==='atReports')  loadAttReports();
      if(tab.dataset.atab==='atMembers')  loadAttMembers();
    });
  });
  loadAttOverview();
  initAttSessionsTab();
  initAttLiveTab();
  initAttReportsTab();
  initAttMembersTab();
}

function loadAttOverview(){
  const ms=G(KM).filter(m=>!m.isAdmin);
  const ss=G(KS);
  let active=0,risk=0,inactive=0;
  ms.forEach(m=>{ const {pct}=stats(m.id); if(pct>=70)active++; else if(pct>=40)risk++; else inactive++; });
  document.getElementById('ovTotal').textContent=ms.length;
  document.getElementById('ovActive').textContent=active;
  document.getElementById('ovRisk').textContent=risk;
  document.getElementById('ovInactive').textContent=inactive;
  document.getElementById('ovSessions').textContent=ss.length;
  document.getElementById('ovLast').textContent=ss.length?fmtDate(ss.sort((a,b)=>b.date.localeCompare(a.date))[0].date):'—';
}

// Sessions tab
function initAttSessionsTab(){
  attSesCode=genCode();
  document.getElementById('attCodePreview').textContent=attSesCode;
  document.getElementById('attRegenCode')?.addEventListener('click',()=>{
    attSesCode=genCode();
    document.getElementById('attCodePreview').textContent=attSesCode;
  });
  document.getElementById('attNewSesBtn')?.addEventListener('click',()=>{
    const f=document.getElementById('attNewSesForm');
    f.style.display=f.style.display==='none'?'block':'none';
    if(f.style.display==='block'){
      document.getElementById('sDateI').value=new Date().toISOString().split('T')[0];
      document.getElementById('sStartI').value='10:00';
      document.getElementById('sEndI').value='13:00';
      document.getElementById('sVenueI').value='Kumasi, Ashanti Region';
      attSesCode=genCode();
      document.getElementById('attCodePreview').textContent=attSesCode;
    }
  });
  document.getElementById('attCancelSes')?.addEventListener('click',()=>{
    document.getElementById('attNewSesForm').style.display='none';
  });
  document.getElementById('attSaveSes')?.addEventListener('click',()=>{
    const title=document.getElementById('sTitleI').value.trim();
    const type=document.getElementById('sTypeI').value;
    const date=document.getElementById('sDateI').value;
    const start=document.getElementById('sStartI').value;
    const end=document.getElementById('sEndI').value;
    const venue=document.getElementById('sVenueI').value.trim();
    const before=parseInt(document.getElementById('sBeforeI').value)||30;
    const after=parseInt(document.getElementById('sAfterI').value)||60;
    if(!title||!date||!start||!end||!venue){attToast('Fill in all session fields.','error');return;}
    const ss=G(KS);
    ss.push({id:'S-'+Date.now(),title,type,date,start,end,venue,code:attSesCode,openBefore:before,closeAfter:after});
    S(KS,ss);
    document.getElementById('attNewSesForm').style.display='none';
    loadAttSessions();
    attToast('Session created!','success');
  });
  loadAttSessions();
}
function loadAttSessions(){
  const ss=G(KS).sort((a,b)=>b.date.localeCompare(a.date));
  const tbody=document.getElementById('attSesBody');
  if(!ss.length){tbody.innerHTML='<tr><td colspan="7" class="att-empty-row">No sessions yet.</td></tr>';return;}
  tbody.innerHTML=ss.map(s=>{
    const t=sesTiming(s);
    const sc=t.status==='open'?'att-pill-green':t.status==='upcoming'?'att-pill-blue':'att-pill-gray';
    const pc=G(KR).filter(r=>r.sId===s.id&&r.status==='present').length;
    return `<tr>
      <td>${fmtDate(s.date)}</td><td><strong>${s.title}</strong></td>
      <td><span class="att-pill att-pill-blue">${s.type}</span></td>
      <td>${s.start}–${s.end}</td>
      <td style="font-family:monospace;font-weight:700;letter-spacing:.15em;color:var(--navy)">${s.code}</td>
      <td><span class="att-pill ${sc}">${cap(t.status)}</span> <small style="color:var(--t400)">(${pc} present)</small></td>
      <td><button class="btn btn-p btn-sm" onclick="attDelSes('${s.id}')">Delete</button></td>
    </tr>`;
  }).join('');
}
window.attDelSes=function(id){
  if(!confirm('Delete this session and all its records?')) return;
  S(KS,G(KS).filter(s=>s.id!==id));
  S(KR,G(KR).filter(r=>r.sId!==id));
  loadAttSessions();
  attToast('Session deleted.','');
};

// Live tab
function initAttLiveTab(){
  document.getElementById('attLiveSel')?.addEventListener('change',renderAttLive);
  document.getElementById('attLiveSrch')?.addEventListener('input',renderAttLive);
  document.getElementById('attLiveVoice')?.addEventListener('change',renderAttLive);
  loadAttLive();
}
function loadAttLive(){
  const sel=document.getElementById('attLiveSel');
  if(!sel) return;
  const ss=G(KS).sort((a,b)=>b.date.localeCompare(a.date));
  const cur=sel.value;
  sel.innerHTML='<option value="">Select session</option>'+ss.map(s=>`<option value="${s.id}"${s.id===cur?' selected':''}>${fmtDate(s.date)} — ${s.title}</option>`).join('');
  if(cur) renderAttLive();
}
function renderAttLive(){
  const sId=document.getElementById('attLiveSel').value;
  const srch=(document.getElementById('attLiveSrch').value||'').toLowerCase();
  const voice=document.getElementById('attLiveVoice').value;
  const banner=document.getElementById('attLiveBanner');
  if(!sId){banner.style.display='none';document.getElementById('attLiveBody').innerHTML='<tr><td colspan="6" class="att-empty-row">Select a session.</td></tr>';return;}
  const ses=G(KS).find(s=>s.id===sId);
  if(!ses) return;
  banner.style.display='flex';
  document.getElementById('attLiveCode').textContent=ses.code;
  document.getElementById('attLiveWin').textContent=`Opens ${ses.openBefore}m before · Closes ${ses.closeAfter}m after`;
  let ms=G(KM).filter(m=>!m.isAdmin);
  if(voice) ms=ms.filter(m=>m.voice===voice);
  if(srch) ms=ms.filter(m=>m.name.toLowerCase().includes(srch)||m.id.toLowerCase().includes(srch));
  const rs=G(KR);
  let pc=0,ec=0,ac=0;
  const rows=ms.map(m=>{
    const r=rs.find(r=>r.sId===sId&&r.mId===m.id);
    const st=r?r.status:'absent';
    if(st==='present')pc++; else if(st==='excused')ec++; else ac++;
    const cls=st==='present'?'att-pill-green':st==='excused'?'att-pill-amber':'att-pill-red';
    return `<tr>
      <td style="font-family:monospace;font-size:.76rem">${m.id}</td>
      <td><strong>${m.name}</strong></td><td>${m.voice}</td>
      <td><span class="att-pill ${cls}">${cap(st)}</span></td>
      <td>${r?fmtTime(r.time):'—'}</td>
      <td style="display:flex;gap:6px;flex-wrap:wrap">
        ${st!=='present'?`<button class="btn btn-p btn-sm" onclick="attMarkP('${sId}','${m.id}')">Present</button>`:''}
        ${st==='present'?`<button class="btn btn-o btn-sm" onclick="attRemoveP('${sId}','${m.id}')">Remove</button>`:''}
      </td>
    </tr>`;
  }).join('')||'<tr><td colspan="6" class="att-empty-row">No members match filter.</td></tr>';
  document.getElementById('attLiveBody').innerHTML=rows;
  document.getElementById('attLivePres').textContent=pc+' Present';
  document.getElementById('attLiveExc').textContent=ec+' Excused';
  document.getElementById('attLiveAbs').textContent=ac+' Absent';
}
window.attMarkP=function(sId,mId){ setRecord(sId,mId,'present'); renderAttLive(); attToast('Marked Present.','success'); };
window.attRemoveP=function(sId,mId){ S(KR,G(KR).filter(r=>!(r.sId===sId&&r.mId===mId))); renderAttLive(); attToast('Mark removed.',''); };

// Reports
function initAttReportsTab(){
  document.getElementById('attRptSrch')?.addEventListener('input',loadAttReports);
  document.getElementById('attRptVoice')?.addEventListener('change',loadAttReports);
  document.getElementById('attRptStatus')?.addEventListener('change',loadAttReports);
  document.getElementById('attExportBtn')?.addEventListener('click',attExportCSV);
}
function loadAttReports(){
  const srch=(document.getElementById('attRptSrch').value||'').toLowerCase();
  const voice=document.getElementById('attRptVoice').value;
  const filter=document.getElementById('attRptStatus').value;
  let ms=G(KM).filter(m=>!m.isAdmin);
  if(voice) ms=ms.filter(m=>m.voice===voice);
  if(srch) ms=ms.filter(m=>m.name.toLowerCase().includes(srch)||m.id.toLowerCase().includes(srch));
  const tbody=document.getElementById('attRptBody');
  const rows=ms.map(m=>{
    const st=stats(m.id);
    const {lbl,cls}=statusInfo(st.pct);
    const key=st.pct>=70?'active':st.pct>=40?'risk':'inactive';
    if(filter&&filter!==key) return '';
    return `<tr>
      <td style="font-family:monospace;font-size:.76rem">${m.id}</td>
      <td><strong>${m.name}</strong></td><td>${m.voice}</td>
      <td style="color:#166534;font-weight:700">${st.p}</td>
      <td style="color:#b45309;font-weight:700">${st.e}</td>
      <td style="color:var(--crimson);font-weight:700">${st.a}</td>
      <td><strong>${st.pct}%</strong></td>
      <td><span class="att-pill ${cls}">${lbl}</span></td>
    </tr>`;
  }).filter(Boolean).join('')||'<tr><td colspan="8" class="att-empty-row">No results.</td></tr>';
  tbody.innerHTML=rows;
}
function attExportCSV(){
  const ms=G(KM).filter(m=>!m.isAdmin);
  const ss=G(KS); const rs=G(KR);
  let csv='ID,Name,Voice,Role,'+ss.map(s=>s.date+' '+s.title).join(',')+',Present,Excused,Absent,%,Status\n';
  ms.forEach(m=>{
    const st=stats(m.id);
    const {lbl}=statusInfo(st.pct);
    let row=`"${m.id}","${m.name}","${m.voice}","${m.role}",`;
    ss.forEach(s=>{ const r=rs.find(r=>r.sId===s.id&&r.mId===m.id); row+=(r?cap(r.status):'Absent')+','; });
    row+=`${st.p},${st.e},${st.a},${st.pct}%,"${lbl}"`;
    csv+=row+'\n';
  });
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download='SNE_Attendance_'+new Date().toISOString().split('T')[0]+'.csv';
  a.click();
  attToast('CSV exported!','success');
}

// Members
function initAttMembersTab(){
  ['mNameI','mPhoneI','mYearI'].forEach(id=>{
    document.getElementById(id)?.addEventListener('blur',autoId);
  });
  function autoId(){
    const n=document.getElementById('mNameI').value.trim();
    const p=document.getElementById('mPhoneI').value.trim();
    const y=document.getElementById('mYearI').value||new Date().getFullYear();
    if(n&&p) document.getElementById('mIdI').value=genId(n,p,y);
  }
  document.getElementById('attAddMemBtn')?.addEventListener('click',()=>{
    const f=document.getElementById('attAddMemForm');
    f.style.display=f.style.display==='none'?'block':'none';
  });
  document.getElementById('attCancelMem')?.addEventListener('click',()=>{
    document.getElementById('attAddMemForm').style.display='none';
  });
  document.getElementById('attSaveMem')?.addEventListener('click',()=>{
    const name=document.getElementById('mNameI').value.trim();
    const id=document.getElementById('mIdI').value.trim().toUpperCase();
    const voice=document.getElementById('mVoiceI').value;
    const role=document.getElementById('mRoleI').value;
    const phone=document.getElementById('mPhoneI').value.trim();
    const year=document.getElementById('mYearI').value.trim();
    const pin=document.getElementById('mPinI').value.trim();
    const err=document.getElementById('attMemErr');
    err.textContent='';
    if(!name||!id||!voice||!phone||!year||!pin){err.textContent='Fill in all fields.';return;}
    if(pin.length<4){err.textContent='PIN must be at least 4 digits.';return;}
    let ms=G(KM);
    if(ms.find(m=>m.id===id)){err.textContent='This ID already exists.';return;}
    ms.push({id,name,voice,role,phone,year,pin:hp(pin),status:'active',isAdmin:false});
    S(KM,ms);
    document.getElementById('attAddMemForm').style.display='none';
    ['mNameI','mIdI','mPhoneI','mYearI','mPinI'].forEach(x=>document.getElementById(x).value='');
    loadAttMembers();
    loadAttOverview();
    attToast(name+' added!','success');
  });
  document.getElementById('attMemSrch')?.addEventListener('input',loadAttMembers);
  document.getElementById('attMemVoice')?.addEventListener('change',loadAttMembers);
  loadAttMembers();
}
function loadAttMembers(){
  const srch=(document.getElementById('attMemSrch').value||'').toLowerCase();
  const voice=document.getElementById('attMemVoice').value;
  let ms=G(KM).filter(m=>!m.isAdmin);
  if(voice) ms=ms.filter(m=>m.voice===voice);
  if(srch) ms=ms.filter(m=>m.name.toLowerCase().includes(srch)||m.id.toLowerCase().includes(srch));
  const tbody=document.getElementById('attMemBody');
  if(!ms.length){tbody.innerHTML='<tr><td colspan="7" class="att-empty-row">No members yet.</td></tr>';return;}
  tbody.innerHTML=ms.map(m=>{
    const sc=m.status==='active'?'att-pill-green':'att-pill-red';
    return `<tr>
      <td style="font-family:monospace;font-size:.76rem">${m.id}</td>
      <td><strong>${m.name}</strong></td><td>${m.voice}</td><td>${m.role}</td><td>${m.year||'—'}</td>
      <td><span class="att-pill ${sc}">${cap(m.status)}</span></td>
      <td style="display:flex;gap:5px;flex-wrap:wrap">
        <button class="btn btn-o btn-sm" onclick="attToggleStatus('${m.id}')">${m.status==='active'?'Deactivate':'Activate'}</button>
        <button class="btn btn-o btn-sm" onclick="attResetPin('${m.id}')">Reset PIN</button>
        <button class="btn btn-p btn-sm" style="background:var(--crimson);border-color:var(--crimson)" onclick="attDelMem('${m.id}')">Delete</button>
      </td>
    </tr>`;
  }).join('');
}
window.attToggleStatus=function(id){
  let ms=G(KM);
  const i=ms.findIndex(m=>m.id===id);
  if(i<0) return;
  ms[i].status=ms[i].status==='active'?'inactive':'active';
  S(KM,ms); loadAttMembers(); loadAttOverview();
  attToast('Status updated.','success');
};
window.attResetPin=function(id){
  const p=prompt('New temporary PIN for member '+id+' (4–6 digits):');
  if(!p||p.length<4){attToast('PIN must be at least 4 digits.','error');return;}
  let ms=G(KM);
  const i=ms.findIndex(m=>m.id===id);
  if(i<0) return;
  ms[i].pin=hp(p); S(KM,ms);
  attToast('PIN reset for '+ms[i].name+'.','success');
};
window.attDelMem=function(id){
  const ms=G(KM);
  const m=ms.find(mb=>mb.id===id);
  if(!confirm('Delete '+m?.name+'? All attendance records will be removed.')) return;
  S(KM,ms.filter(mb=>mb.id!==id));
  S(KR,G(KR).filter(r=>r.mId!==id));
  loadAttMembers(); loadAttOverview();
  attToast('Member deleted.','');
};

// ── INIT ──
document.addEventListener('DOMContentLoaded',()=>{
  if(!document.getElementById('attViewLogin')) return; // not on the right page
  seedAdmin();
  CU=getStoredUser();
  if(CU){
    if(CU.isAdmin){showAttView('attViewAdmin');initAttAdmin();}
    else{showAttView('attViewMember');loadAttMember();}
  } else {
    showAttView('attViewLogin');
    initAttLogin();
  }
});

// Re-init if user scrolls to section while already logged in
document.getElementById('attendance')?.addEventListener('click',()=>{
  if(CU) return;
  if(!document.getElementById('attViewLogin').classList.contains('active')){
    showAttView('attViewLogin');
    initAttLogin();
  }
});

})(); // end IIFE

// ══════════════════════════════════════════════
// SAVE DATA TO ADMIN STORAGE
// ══════════════════════════════════════════════

function saveTicketOrder(name, email, phone, type, qty, amount, method, status, ref) {
  const tickets = JSON.parse(localStorage.getItem('sne_tickets') || '[]');
  tickets.push({
    ref:     ref || 'SNE-' + Date.now(),
    name:    name,
    email:   email,
    phone:   phone,
    concert: activeConcert ? activeConcert.name : '—',
    type:    type,
    qty:     qty,
    amount:  amount,
    method:  method,
    status:  status,
    time:    new Date().toISOString()
  });
  localStorage.setItem('sne_tickets', JSON.stringify(tickets));
}

// Save contact form message to admin
document.getElementById('contactForm')?.addEventListener('submit', function saveMsg() {
  const name    = document.getElementById('cName')?.value.trim();
  const email   = document.getElementById('cEmail')?.value.trim();
  const phone   = document.getElementById('cPhone')?.value.trim();
  const subject = document.getElementById('cSubject')?.value;
  const message = document.getElementById('cMessage')?.value.trim();
  if (!name || !message) return;
  const msgs = JSON.parse(localStorage.getItem('sne_msgs') || '[]');
  msgs.push({
    id:      'MSG-' + Date.now(),
    name, email, phone, subject, message,
    read:    false,
    time:    new Date().toISOString()
  });
  localStorage.setItem('sne_msgs', JSON.stringify(msgs));
}, true); // capture phase so it fires before the existing submit handler

// ══════════════════════════════════════════════
// PORTAL TAB SWITCHING (My ID Card ↔ Attendance)
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.portal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      // Update tab active state
      document.querySelectorAll('.portal-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Show correct panel
      const target = tab.dataset.ptab;
      document.querySelectorAll('.portal-panel').forEach(p => p.classList.remove('active'));
      const panel = document.getElementById(target);
      if (panel) panel.classList.add('active');

      // If switching to Attendance tab, re-init the attendance login
      if (target === 'ptAttendance') {
        const CU = getStoredUser ? getStoredUser() : null;
        // If not logged in, make sure login screen is showing
        if (!CU) {
          document.querySelectorAll('.att-view').forEach(v => v.classList.remove('active'));
          const loginView = document.getElementById('attViewLogin');
          if (loginView) loginView.classList.add('active');
        }
      }
    });
  });
});

// Helper used by attendance inline portal
function getStoredUser() {
  const id = sessionStorage.getItem('sne_att_user');
  if (!id) return null;
  const ms = JSON.parse(localStorage.getItem('sne_m') || '[]');
  return ms.find(m => m.id === id) || null;
}
