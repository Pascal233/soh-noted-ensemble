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
    closeTicketModal();
    openMomoModal(name, total, activeConcert, qty, type);
  } else if (method === 'door') {
    closeTicketModal();
    showToast('Reservation confirmed! Please pay at the venue.', 'success');
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
    callback: r => { closeTicketModal(); showToast('Payment successful! Ref: ' + r.reference, 'success'); },
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
  btn.textContent = 'Sending…';
  btn.disabled = true;
  setTimeout(() => {
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
