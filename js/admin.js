'use strict';
/* =============================================
   Soh NOTED Ensemble — Admin Portal JS
   Admin ID : SNE-ADMIN-0001
   Default PIN : moxart2024
   ============================================= */

// ── Storage ──
const G  = k => { try{return JSON.parse(localStorage.getItem(k))||[];}catch{return[];} };
const GO = k => { try{return JSON.parse(localStorage.getItem(k))||{};}catch{return{};} };
const S  = (k,v) => localStorage.setItem(k,JSON.stringify(v));

const KM = 'sne_m';       // members
const KS = 'sne_s';       // sessions
const KR = 'sne_r';       // attendance records
const KT = 'sne_tickets'; // ticket orders
const KG = 'sne_msgs';    // contact messages
const KP = 'sne_admin_pin';

// ── PIN hash ──
function hp(pin){
  let h=0;
  for(let i=0;i<pin.length;i++){h=Math.imul(31,h)+pin.charCodeAt(i)|0;}
  return h.toString(16);
}

// ── Admin default credentials ──
const ADMIN_ID  = 'SNE-ADMIN-0001';
const ADMIN_DEFAULT_PIN = hp('moxart2024');

function getAdminPin(){ return localStorage.getItem(KP) || ADMIN_DEFAULT_PIN; }

// ── Seed admin member if needed ──
function seedAdmin(){
  let ms=G(KM);
  if(!ms.find(m=>m.id===ADMIN_ID)){
    ms.push({id:ADMIN_ID,name:'Frederick Owusu Boakye',voice:'Conductor',role:'Executive Director',phone:'0548580708',year:'2015',pin:ADMIN_DEFAULT_PIN,status:'active',isAdmin:true});
    S(KM,ms);
  }
}

// ── Toast ──
function toast(msg,type=''){
  const t=document.getElementById('admToast');
  if(!t) return;
  t.textContent=msg;
  t.className=`adm-toast ${type} show`;
  setTimeout(()=>t.classList.remove('show'),3800);
}

// ── Helpers ──
function fmtDate(d){
  if(!d) return '—';
  return new Date(d+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
}
function fmtDateTime(iso){
  if(!iso) return '—';
  const d=new Date(iso);
  return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})+' '+d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
}
function cap(s){return s?s.charAt(0).toUpperCase()+s.slice(1):'';}
function genCode(){return Math.floor(100000+Math.random()*900000).toString();}
function genMemberId(name,phone,year){
  const seed=(name+phone+year).toLowerCase().replace(/\s/g,'');
  let h=0;
  for(let i=0;i<seed.length;i++){h=((h<<5)-h)+seed.charCodeAt(i);h|=0;}
  return 'SNE-'+year+'-'+(Math.abs(h)%9000+1000);
}

// ── Attendance helpers ──
function memberStats(mId){
  const ss=G(KS),rs=G(KR);
  let p=0,e=0,a=0;
  ss.forEach(s=>{
    const r=rs.find(r=>r.sId===s.id&&r.mId===mId);
    if(!r||r.status==='absent') a++;
    else if(r.status==='present') p++;
    else e++;
  });
  const tot=ss.length;
  const pct=tot>0?Math.round(p/tot*100):0;
  return{p,e,a,tot,pct};
}
function statusPill(pct){
  if(pct>=70) return{lbl:'Active',cls:'adm-pill-green'};
  if(pct>=40) return{lbl:'At Risk',cls:'adm-pill-amber'};
  return{lbl:'Inactive',cls:'adm-pill-red'};
}
function sesTiming(s){
  const now=new Date();
  const start=new Date(s.date+'T'+s.start);
  const openAt=new Date(start.getTime()-s.openBefore*60000);
  const closeAt=new Date(start.getTime()+s.closeAfter*60000);
  if(now<openAt) return{status:'upcoming'};
  if(now>closeAt) return{status:'closed'};
  return{status:'open'};
}
function setRecord(sId,mId,status,extra={}){
  let rs=G(KR);
  const i=rs.findIndex(r=>r.sId===sId&&r.mId===mId);
  const rec={sId,mId,status,time:new Date().toISOString(),...extra};
  if(i>=0) rs[i]=rec; else rs.push(rec);
  S(KR,rs);
}

// ── Concert prices (editable) ──
const DEFAULT_PRICES = {
  concert1:{name:'Christmas Carol Concert 2026', student:30,regular:50,vip:150},
  concert2:{name:'Easter Cantata 2027',          student:35,regular:60,vip:180},
  concert3:{name:"Founders' Night Gala",         student:50,regular:100,vip:300}
};
function getPrices(){ return GO('sne_prices') || DEFAULT_PRICES; }

// ── Ticket price calculator ──
function calcAmount(concertKey,type,qty){
  const p=getPrices();
  const c=p[concertKey]||Object.values(p)[0];
  return (c[type]||c.regular)*qty;
}

// ═══════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════
document.getElementById('adminPassToggle')?.addEventListener('click',()=>{
  const f=document.getElementById('adminPass');
  f.type=f.type==='password'?'text':'password';
});

document.getElementById('adminLoginForm')?.addEventListener('submit',e=>{
  e.preventDefault();
  const id  = document.getElementById('adminUser').value.trim().toUpperCase();
  const pin = document.getElementById('adminPass').value.trim();
  const err = document.getElementById('adminLoginErr');
  err.textContent='';

  if(id!==ADMIN_ID){err.textContent='Invalid Admin ID.';return;}
  if(hp(pin)!==getAdminPin()){err.textContent='Incorrect PIN. Try again.';return;}

  sessionStorage.setItem('sne_admin_logged','1');
  document.getElementById('adminLogin').style.display='none';
  document.getElementById('adminDash').style.display='flex';
  initDash();
});

// Auto-login if session active
if(sessionStorage.getItem('sne_admin_logged')==='1'){
  document.getElementById('adminLogin').style.display='none';
  document.getElementById('adminDash').style.display='flex';
  initDash();
}

// Logout
document.getElementById('adminLogout')?.addEventListener('click',()=>{
  sessionStorage.removeItem('sne_admin_logged');
  location.reload();
});

// Mobile sidebar toggle
document.getElementById('adminMenuTog')?.addEventListener('click',()=>{
  document.getElementById('adminSidebar').classList.toggle('open');
  const overlay = document.getElementById('sidebarOverlay');
  if (overlay) overlay.style.display = document.getElementById('adminSidebar').classList.contains('open') ? 'block' : 'none';
});

// ═══════════════════════════════════════════
// DASHBOARD INIT
// ═══════════════════════════════════════════
function initDash(){
  seedAdmin();
  setupNavigation();
  goPage('pageOverview');
}

function setupNavigation(){
  document.querySelectorAll('.adm-nav-item').forEach(btn=>{
    btn.addEventListener('click',()=>{
      goPage(btn.dataset.page);
      document.getElementById('adminSidebar').classList.remove('open');
    });
  });
}

function goPage(pageId){
  document.querySelectorAll('.adm-page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.adm-nav-item').forEach(b=>b.classList.remove('active'));
  document.getElementById(pageId)?.classList.add('active');
  document.querySelector(`[data-page="${pageId}"]`)?.classList.add('active');
  const titles={pageOverview:'Overview',pageTickets:'Ticket Orders',pageConcerts:'Concerts',pageMembers:'Choir Members',pageAttendance:'Attendance',pageMessages:'Messages',pageSettings:'Settings'};
  document.getElementById('pageTitle').textContent=titles[pageId]||'';
  // Close sidebar on mobile
  document.getElementById('adminSidebar').classList.remove('open');
  const overlay = document.getElementById('sidebarOverlay');
  if (overlay) overlay.style.display = 'none';
  // Load page data
  if(pageId==='pageOverview')   loadOverview();
  if(pageId==='pageTickets')    loadTickets();
  if(pageId==='pageConcerts')   loadConcerts();
  if(pageId==='pageMembers')    loadMembers();
  if(pageId==='pageAttendance') initAttendancePage();
  if(pageId==='pageMessages')   loadMessages();
  if(pageId==='pageSettings')   loadSettings();
  if(pageId==='pageAnnouncements') loadAnnouncements();
  if(pageId==='pageDues')          loadDues();
}
window.goPage=goPage;

// ═══════════════════════════════════════════
// OVERVIEW
// ═══════════════════════════════════════════
function loadOverview(){
  const tickets = G(KT);
  const members = G(KM).filter(m=>!m.isAdmin);
  const msgs    = G(KG).filter(m=>!m.read);

  // KPIs
  document.getElementById('kpiTickets').textContent = tickets.length;
  const rev = tickets.filter(t=>t.status==='paid').reduce((s,t)=>s+(t.amount||0),0);
  document.getElementById('kpiRevenue').textContent = 'GHS '+rev.toLocaleString();
  document.getElementById('kpiMembers').textContent = members.length;
  document.getElementById('kpiMessages').textContent = msgs.length;
  const active = members.filter(m=>memberStats(m.id).pct>=70).length;
  document.getElementById('kpiActive').textContent = active;

  // Message badge
  const badge=document.getElementById('msgBadge');
  if(msgs.length>0){badge.style.display='inline';badge.textContent=msgs.length;}
  else badge.style.display='none';

  // Recent orders
  const tbody=document.getElementById('ovRecentOrders');
  const recent=tickets.slice(-5).reverse();
  if(!recent.length){tbody.innerHTML='<tr><td colspan="6" class="adm-empty">No orders yet.</td></tr>';}
  else{
    tbody.innerHTML=recent.map(t=>`<tr>
      <td style="font-family:monospace;font-size:.76rem">${t.ref}</td>
      <td><strong>${t.name}</strong></td>
      <td>${t.concert}</td>
      <td>${t.qty}</td>
      <td>GHS ${(t.amount||0).toLocaleString()}</td>
      <td><span class="adm-pill ${t.status==='paid'?'adm-pill-green':t.status==='pending'?'adm-pill-amber':'adm-pill-red'}">${cap(t.status)}</span></td>
    </tr>`).join('');
  }

  // Recent messages
  const msgDiv=document.getElementById('ovRecentMessages');
  const recentMsgs=G(KG).slice(-3).reverse();
  if(!recentMsgs.length){msgDiv.innerHTML='<p class="adm-empty" style="padding:20px">No messages yet.</p>';}
  else{
    msgDiv.innerHTML=recentMsgs.map(m=>`
      <div class="adm-msg-item ${m.read?'':'unread'}" onclick="goPage('pageMessages')" style="cursor:pointer;margin:0;border-radius:0;border-left:none;border-right:none;border-top:none">
        <div class="adm-msg-avatar">${m.name?m.name[0].toUpperCase():'?'}</div>
        <div class="adm-msg-content">
          <p class="adm-msg-name">${m.name||'—'}</p>
          <p class="adm-msg-subject">${cap(m.subject||'General')}</p>
          <p class="adm-msg-preview">${m.message||''}</p>
        </div>
        <div class="adm-msg-meta">
          <span class="adm-msg-time">${fmtDateTime(m.time)}</span>
          ${!m.read?'<span class="adm-unread-dot"></span>':''}
        </div>
      </div>`).join('');
  }
}

// ═══════════════════════════════════════════
// TICKETS
// ═══════════════════════════════════════════
function loadTickets(){
  renderTickets();
  document.getElementById('ticketSearch')?.addEventListener('input',renderTickets);
  document.getElementById('ticketConcertFilter')?.addEventListener('change',renderTickets);
  document.getElementById('ticketStatusFilter')?.addEventListener('change',renderTickets);
  document.getElementById('exportTicketsBtn')?.addEventListener('click',exportTickets);

  // Manual order
  document.getElementById('toggleManualOrder')?.addEventListener('click',()=>{
    const f=document.getElementById('manualOrderForm');
    f.style.display=f.style.display==='none'?'block':'none';
  });
  document.getElementById('cancelManualOrder')?.addEventListener('click',()=>{
    document.getElementById('manualOrderForm').style.display='none';
  });
  document.getElementById('saveManualOrder')?.addEventListener('click',saveManualOrder);
}

function renderTickets(){
  const srch   =(document.getElementById('ticketSearch')?.value||'').toLowerCase();
  const concert=(document.getElementById('ticketConcertFilter')?.value||'');
  const status =(document.getElementById('ticketStatusFilter')?.value||'');
  let tickets=G(KT);
  if(srch) tickets=tickets.filter(t=>t.name?.toLowerCase().includes(srch)||t.ref?.toLowerCase().includes(srch)||t.phone?.includes(srch));
  if(concert) tickets=tickets.filter(t=>t.concert===concert);
  if(status)  tickets=tickets.filter(t=>t.status===status);
  const tbody=document.getElementById('ticketsBody');
  if(!tickets.length){tbody.innerHTML='<tr><td colspan="12" class="adm-empty">No orders match your filter.</td></tr>';return;}
  tbody.innerHTML=tickets.slice().reverse().map(t=>`<tr>
    <td style="font-family:monospace;font-size:.74rem">${t.ref}</td>
    <td>${fmtDateTime(t.time)}</td>
    <td><strong>${t.name||'—'}</strong></td>
    <td>${t.email||'—'}</td>
    <td>${t.phone||'—'}</td>
    <td>${t.concert||'—'}</td>
    <td>${cap(t.type||'—')}</td>
    <td>${t.qty||1}</td>
    <td>GHS ${(t.amount||0).toLocaleString()}</td>
    <td>${cap(t.method||'—')}</td>
    <td><span class="adm-pill ${t.status==='paid'?'adm-pill-green':t.status==='pending'?'adm-pill-amber':'adm-pill-red'}">${cap(t.status)}</span></td>
    <td style="display:flex;gap:5px;flex-wrap:wrap">
      ${t.status!=='paid'?`<button class="adm-btn adm-btn-green adm-btn-sm" onclick="markTicketPaid('${t.ref}')">Mark Paid</button>`:''}
      <button class="adm-btn adm-btn-sm" style="background:var(--adm-g100);color:var(--adm-t600)" onclick="deleteTicket('${t.ref}')">Delete</button>
    </td>
  </tr>`).join('');
}

function saveManualOrder(){
  const name   =document.getElementById('moName').value.trim();
  const phone  =document.getElementById('moPhone').value.trim();
  const concert=document.getElementById('moConcert').value;
  const type   =document.getElementById('moType').value;
  const qty    =parseInt(document.getElementById('moQty').value)||1;
  const method =document.getElementById('moMethod').value;
  const notes  =document.getElementById('moNotes').value.trim();
  if(!name||!phone){toast('Please fill in name and phone.','error');return;}
  const cKey=Object.keys(DEFAULT_PRICES).find(k=>DEFAULT_PRICES[k].name===concert)||'concert1';
  const amount=calcAmount(cKey,type,qty);
  const ticket={
    ref:'SNE-'+Date.now(),name,phone,email:'',
    concert,type,qty,amount,method,
    status:'paid',notes,
    time:new Date().toISOString()
  };
  const tickets=G(KT);
  tickets.push(ticket);
  S(KT,tickets);
  document.getElementById('manualOrderForm').style.display='none';
  ['moName','moPhone','moNotes'].forEach(id=>document.getElementById(id).value='');
  renderTickets();
  loadOverview();
  toast('Order saved!','success');
}

window.markTicketPaid=function(ref){
  let ts=G(KT);
  const i=ts.findIndex(t=>t.ref===ref);
  if(i>=0){ts[i].status='paid';S(KT,ts);}
  renderTickets();
  toast('Marked as Paid.','success');
};
window.deleteTicket=function(ref){
  if(!confirm('Delete this order?')) return;
  S(KT,G(KT).filter(t=>t.ref!==ref));
  renderTickets();
  loadOverview();
  toast('Order deleted.','warn');
};

function exportTickets(){
  const ts=G(KT);
  let csv='Ref,Date,Name,Phone,Email,Concert,Type,Qty,Amount,Payment,Status\n';
  ts.forEach(t=>{
    csv+=`"${t.ref}","${fmtDateTime(t.time)}","${t.name}","${t.phone}","${t.email}","${t.concert}","${cap(t.type)}",${t.qty},${t.amount},"${cap(t.method)}","${cap(t.status)}"\n`;
  });
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download='SNE_Tickets_'+new Date().toISOString().split('T')[0]+'.csv';
  a.click();
  toast('CSV exported!','success');
}

// ═══════════════════════════════════════════
// CONCERTS
// ═══════════════════════════════════════════
function loadConcerts(){
  const prices=getPrices();
  const tickets=G(KT);
  const grid=document.getElementById('adminConcertsGrid');
  const concerts=[
    {key:'concert1',date:'Sat, 20 Dec 2026',venue:'Wesley Methodist Cathedral, Kumasi',badge:'On Sale'},
    {key:'concert2',date:'Fri, 2 Apr 2027', venue:'Kumasi City Auditorium',              badge:'Coming Soon'},
    {key:'concert3',date:'Sat, 15 May 2027',venue:'Golden Tulip Hotel, Kumasi',          badge:'Limited'},
  ];
  grid.innerHTML=concerts.map(c=>{
    const p=prices[c.key]||{};
    const sold=tickets.filter(t=>t.concert===p.name&&t.status==='paid');
    const revenue=sold.reduce((s,t)=>s+(t.amount||0),0);
    return `<div class="adm-concert-card">
      <div class="adm-cc-head">
        <h4>${p.name||c.key}</h4>
        <p>${c.date}</p>
      </div>
      <div class="adm-cc-body">
        <div class="adm-cc-row"><span>Venue</span><span>${c.venue}</span></div>
        <div class="adm-cc-row"><span>Tickets Sold</span><span>${sold.length}</span></div>
        <div class="adm-cc-row"><span>Revenue</span><span>GHS ${revenue.toLocaleString()}</span></div>
        <div class="adm-cc-row"><span>Student Price</span><span>GHS ${p.student||'—'}</span></div>
        <div class="adm-cc-row"><span>Regular Price</span><span>GHS ${p.regular||'—'}</span></div>
        <div class="adm-cc-row"><span>VIP Price</span><span>GHS ${p.vip||'—'}</span></div>
        <div class="adm-cc-row"><span>Status</span><span><span class="adm-pill adm-pill-blue">${c.badge}</span></span></div>
      </div>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════
// CHOIR MEMBERS
// ═══════════════════════════════════════════
function loadMembers(){
  renderMembers();
  document.getElementById('memberSearch')?.addEventListener('input',renderMembers);
  document.getElementById('memberVoiceFilter')?.addEventListener('change',renderMembers);
  document.getElementById('memberStatusFilter')?.addEventListener('change',renderMembers);

  document.getElementById('addMemberBtn')?.addEventListener('click',()=>{
    const f=document.getElementById('addMemberFormWrap');
    f.style.display=f.style.display==='none'?'block':'none';
  });
  document.getElementById('cancelNewMember')?.addEventListener('click',()=>{
    document.getElementById('addMemberFormWrap').style.display='none';
  });

  // Auto-generate ID
  ['newMName','newMPhone','newMYear'].forEach(id=>{
    document.getElementById(id)?.addEventListener('blur',autoMemberId);
  });

  document.getElementById('saveNewMember')?.addEventListener('click',saveNewMember);
}

function autoMemberId(){
  const n=document.getElementById('newMName').value.trim();
  const p=document.getElementById('newMPhone').value.trim();
  const y=document.getElementById('newMYear').value||new Date().getFullYear();
  if(n&&p) document.getElementById('newMId').value=genMemberId(n,p,y);
}

function saveNewMember(){
  const name =document.getElementById('newMName').value.trim();
  const id   =document.getElementById('newMId').value.trim().toUpperCase();
  const voice=document.getElementById('newMVoice').value;
  const role =document.getElementById('newMRole').value;
  const phone=document.getElementById('newMPhone').value.trim();
  const year =document.getElementById('newMYear').value.trim();
  const pin  =document.getElementById('newMPin').value.trim();
  const err  =document.getElementById('newMemberErr');
  err.textContent='';
  if(!name||!id||!phone||!year||!pin){err.textContent='Please fill in all fields.';return;}
  if(pin.length<4){err.textContent='PIN must be at least 4 digits.';return;}
  let ms=G(KM);
  if(ms.find(m=>m.id===id)){err.textContent='This ID already exists.';return;}
  ms.push({id,name,voice,role,phone,year,pin:hp(pin),status:'active',isAdmin:false});
  S(KM,ms);
  document.getElementById('addMemberFormWrap').style.display='none';
  ['newMName','newMId','newMPhone','newMYear','newMPin'].forEach(x=>document.getElementById(x).value='');
  renderMembers();
  loadOverview();
  toast(name+' added!','success');
}

function renderMembers(){
  const srch  =(document.getElementById('memberSearch')?.value||'').toLowerCase();
  const voice =(document.getElementById('memberVoiceFilter')?.value||'');
  const status=(document.getElementById('memberStatusFilter')?.value||'');
  let ms=G(KM).filter(m=>!m.isAdmin);
  if(voice)  ms=ms.filter(m=>m.voice===voice);
  if(status) ms=ms.filter(m=>m.status===status);
  if(srch)   ms=ms.filter(m=>m.name.toLowerCase().includes(srch)||m.id.toLowerCase().includes(srch));
  const tbody=document.getElementById('membersBody');
  if(!ms.length){tbody.innerHTML='<tr><td colspan="9" class="adm-empty">No members found.</td></tr>';return;}
  tbody.innerHTML=ms.map(m=>{
    const st=memberStats(m.id);
    const {lbl,cls}=statusPill(st.pct);
    const sc=m.status==='active'?'adm-pill-green':'adm-pill-red';
    return `<tr>
      <td style="font-family:monospace;font-size:.74rem">${m.id}</td>
      <td><strong>${m.name}</strong></td>
      <td>${m.voice}</td>
      <td>${m.role}</td>
      <td>${m.phone||'—'}</td>
      <td>${m.year||'—'}</td>
      <td><strong>${st.pct}%</strong> <span class="adm-pill ${cls}" style="margin-left:4px">${lbl}</span></td>
      <td><span class="adm-pill ${sc}">${cap(m.status)}</span></td>
      <td style="display:flex;gap:5px;flex-wrap:wrap">
        <button class="adm-btn adm-btn-sm adm-btn-o" onclick="toggleMember('${m.id}')">${m.status==='active'?'Deactivate':'Activate'}</button>
        <button class="adm-btn adm-btn-sm adm-btn-o" onclick="resetMemberPin('${m.id}')">Reset PIN</button>
        <button class="adm-btn adm-btn-sm adm-btn-danger" onclick="deleteMember('${m.id}')">Delete</button>
      </td>
    </tr>`;
  }).join('');
}

window.toggleMember=function(id){
  let ms=G(KM);
  const i=ms.findIndex(m=>m.id===id);
  if(i<0) return;
  ms[i].status=ms[i].status==='active'?'inactive':'active';
  S(KM,ms); renderMembers(); loadOverview();
  toast('Member status updated.','success');
};
window.resetMemberPin=function(id){
  const p=prompt('New temporary PIN for member '+id+' (4+ digits):');
  if(!p||p.length<4){toast('PIN must be at least 4 digits.','error');return;}
  let ms=G(KM);
  const i=ms.findIndex(m=>m.id===id);
  if(i<0) return;
  ms[i].pin=hp(p); S(KM,ms);
  toast('PIN reset for '+ms[i].name+'.','success');
};
window.deleteMember=function(id){
  const ms=G(KM);
  const m=ms.find(mb=>mb.id===id);
  if(!confirm('Delete '+m?.name+'? All attendance records will also be removed.')) return;
  S(KM,ms.filter(mb=>mb.id!==id));
  S(KR,G(KR).filter(r=>r.mId!==id));
  renderMembers(); loadOverview();
  toast('Member deleted.','warn');
};

// ═══════════════════════════════════════════
// ATTENDANCE
// ═══════════════════════════════════════════
let sesCode='';
function initAttendancePage(){
  // Tabs
  document.querySelectorAll('.adm-att-tab').forEach(t=>{
    t.addEventListener('click',()=>{
      document.querySelectorAll('.adm-att-tab').forEach(x=>x.classList.remove('active'));
      document.querySelectorAll('.adm-att-panel').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      document.getElementById(t.dataset.atab)?.classList.add('active');
    });
  });
  initSessions();
  initLive();
  initReports();
}

// Sessions
function initSessions(){
  sesCode=genCode();
  document.getElementById('sesCodePreview').textContent=sesCode;
  document.getElementById('regenSesCode')?.addEventListener('click',()=>{
    sesCode=genCode();
    document.getElementById('sesCodePreview').textContent=sesCode;
  });
  document.getElementById('newSesBtn')?.addEventListener('click',()=>{
    const f=document.getElementById('newSesFormCard');
    f.style.display=f.style.display==='none'?'block':'none';
    if(f.style.display==='block'){
      document.getElementById('sesDateA').value=new Date().toISOString().split('T')[0];
      document.getElementById('sesStartA').value='10:00';
      document.getElementById('sesEndA').value='13:00';
      document.getElementById('sesVenueA').value='Kumasi, Ashanti Region';
      sesCode=genCode();
      document.getElementById('sesCodePreview').textContent=sesCode;
    }
  });
  document.getElementById('cancelSesA')?.addEventListener('click',()=>document.getElementById('newSesFormCard').style.display='none');
  document.getElementById('saveSesA')?.addEventListener('click',()=>{
    const title=document.getElementById('sesTitleA').value.trim();
    const type =document.getElementById('sesTypeA').value;
    const date =document.getElementById('sesDateA').value;
    const start=document.getElementById('sesStartA').value;
    const end  =document.getElementById('sesEndA').value;
    const venue=document.getElementById('sesVenueA').value.trim();
    const before=parseInt(document.getElementById('sesBeforeA').value)||30;
    const after =parseInt(document.getElementById('sesAfterA').value)||60;
    if(!title||!date||!start||!end||!venue){toast('Fill in all session fields.','error');return;}
    const ss=G(KS);
    ss.push({id:'S-'+Date.now(),title,type,date,start,end,venue,code:sesCode,openBefore:before,closeAfter:after});
    S(KS,ss);
    document.getElementById('newSesFormCard').style.display='none';
    renderSessions();
    toast('Session created!','success');
  });
  renderSessions();
}

function renderSessions(){
  const ss=G(KS).sort((a,b)=>b.date.localeCompare(a.date));
  const tbody=document.getElementById('sesBodyA');
  if(!ss.length){tbody.innerHTML='<tr><td colspan="8" class="adm-empty">No sessions yet.</td></tr>';return;}
  tbody.innerHTML=ss.map(s=>{
    const t=sesTiming(s);
    const sc=t.status==='open'?'adm-pill-green':t.status==='upcoming'?'adm-pill-blue':'adm-pill-gray';
    const pc=G(KR).filter(r=>r.sId===s.id&&r.status==='present').length;
    return `<tr>
      <td>${fmtDate(s.date)}</td>
      <td><strong>${s.title}</strong></td>
      <td><span class="adm-pill adm-pill-blue">${s.type}</span></td>
      <td>${s.start}–${s.end}</td>
      <td style="font-family:monospace;font-weight:700;letter-spacing:.15em;color:var(--adm-navy);font-size:.9rem">${s.code}</td>
      <td>${pc}</td>
      <td><span class="adm-pill ${sc}">${cap(t.status)}</span></td>
      <td><button class="adm-btn adm-btn-danger adm-btn-sm" onclick="deleteSession('${s.id}')">Delete</button></td>
    </tr>`;
  }).join('');
}
window.deleteSession=function(id){
  if(!confirm('Delete this session and all its records?')) return;
  S(KS,G(KS).filter(s=>s.id!==id));
  S(KR,G(KR).filter(r=>r.sId!==id));
  renderSessions();
  toast('Session deleted.','warn');
};

// Live
function initLive(){
  loadLiveSelect();
  document.getElementById('liveSesSel')?.addEventListener('change',renderLive);
  document.getElementById('liveSrchA')?.addEventListener('input',renderLive);
  document.getElementById('liveVoiceA')?.addEventListener('change',renderLive);
}
function loadLiveSelect(){
  const sel=document.getElementById('liveSesSel');
  if(!sel) return;
  const ss=G(KS).sort((a,b)=>b.date.localeCompare(a.date));
  const cur=sel.value;
  sel.innerHTML='<option value="">Select session</option>'+ss.map(s=>`<option value="${s.id}"${s.id===cur?' selected':''}>${fmtDate(s.date)} — ${s.title}</option>`).join('');
  if(cur) renderLive();
}
function renderLive(){
  const sId  =document.getElementById('liveSesSel').value;
  const srch =(document.getElementById('liveSrchA').value||'').toLowerCase();
  const voice=(document.getElementById('liveVoiceA').value||'');
  const banner=document.getElementById('admLiveBanner');
  if(!sId){banner.style.display='none';document.getElementById('liveBodyA').innerHTML='<tr><td colspan="6" class="adm-empty">Select a session.</td></tr>';return;}
  const ses=G(KS).find(s=>s.id===sId);
  if(!ses) return;
  banner.style.display='flex';
  document.getElementById('admLiveCode').textContent=ses.code;
  document.getElementById('admLiveWin').textContent=`Opens ${ses.openBefore}m before · Closes ${ses.closeAfter}m after start`;
  let ms=G(KM).filter(m=>!m.isAdmin);
  if(voice) ms=ms.filter(m=>m.voice===voice);
  if(srch)  ms=ms.filter(m=>m.name.toLowerCase().includes(srch)||m.id.toLowerCase().includes(srch));
  const rs=G(KR);
  let pc=0,ec=0,ac=0;
  const rows=ms.map(m=>{
    const r=rs.find(r=>r.sId===sId&&r.mId===m.id);
    const st=r?r.status:'absent';
    if(st==='present')pc++; else if(st==='excused')ec++; else ac++;
    const cls=st==='present'?'adm-pill-green':st==='excused'?'adm-pill-amber':'adm-pill-red';
    const tm=r?new Date(r.time).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):'—';
    return `<tr>
      <td style="font-family:monospace;font-size:.74rem">${m.id}</td>
      <td><strong>${m.name}</strong></td>
      <td>${m.voice}</td>
      <td><span class="adm-pill ${cls}">${cap(st)}</span></td>
      <td>${tm}</td>
      <td style="display:flex;gap:5px;flex-wrap:wrap">
        ${st==='pending'?`<button class="adm-btn adm-btn-green adm-btn-sm" onclick="liveApprove('${sId}','${m.id}')">Approve</button><button class="adm-btn adm-btn-danger adm-btn-sm" onclick="liveReject('${sId}','${m.id}')">Reject</button>`:''}
        ${st==='absent'?`<button class="adm-btn adm-btn-green adm-btn-sm" onclick="liveMarkPresent('${sId}','${m.id}')">Mark Present</button>`:''}
        ${st==='present'?`<button class="adm-btn adm-btn-sm adm-btn-o" onclick="liveRemove('${sId}','${m.id}')">Remove</button>`:''}
      </td>
    </tr>`;
  }).join('')||'<tr><td colspan="6" class="adm-empty">No members match filter.</td></tr>';
  document.getElementById('liveBodyA').innerHTML=rows;
  document.getElementById('admLivePres').textContent=pc+' Present';
  document.getElementById('admLiveExc').textContent=ec+' Excused';
  document.getElementById('admLiveAbs').textContent=ac+' Absent';
}
window.liveMarkPresent=function(sId,mId){setRecord(sId,mId,'present');renderLive();toast('Marked Present.','success');};
window.liveRemove=function(sId,mId){S(KR,G(KR).filter(r=>!(r.sId===sId&&r.mId===mId)));renderLive();toast('Mark removed.','');};
window.liveApprove=function(sId,mId){ setRecord(sId,mId,'present'); renderLive(); toast('Approved — member is Present.','success'); };
window.liveReject=function(sId,mId){ S(KR,G(KR).filter(r=>!(r.sId===sId&&r.mId===mId))); renderLive(); toast('Check-in rejected.','warn'); };

// Reports
function initReports(){
  document.getElementById('rptSrchA')?.addEventListener('input',renderReports);
  document.getElementById('rptVoiceA')?.addEventListener('change',renderReports);
  document.getElementById('rptStatusA')?.addEventListener('change',renderReports);
  document.getElementById('exportAttBtn')?.addEventListener('click',exportAtt);
  renderReports();
}
function renderReports(){
  const srch  =(document.getElementById('rptSrchA')?.value||'').toLowerCase();
  const voice =(document.getElementById('rptVoiceA')?.value||'');
  const filter=(document.getElementById('rptStatusA')?.value||'');
  let ms=G(KM).filter(m=>!m.isAdmin);
  if(voice) ms=ms.filter(m=>m.voice===voice);
  if(srch)  ms=ms.filter(m=>m.name.toLowerCase().includes(srch)||m.id.toLowerCase().includes(srch));
  const tbody=document.getElementById('rptBodyA');
  const rows=ms.map(m=>{
    const st=memberStats(m.id);
    const {lbl,cls}=statusPill(st.pct);
    const key=st.pct>=70?'active':st.pct>=40?'risk':'inactive';
    if(filter&&filter!==key) return '';
    return `<tr>
      <td style="font-family:monospace;font-size:.74rem">${m.id}</td>
      <td><strong>${m.name}</strong></td>
      <td>${m.voice}</td>
      <td style="color:var(--adm-green);font-weight:700">${st.p}</td>
      <td style="color:var(--adm-amber);font-weight:700">${st.e}</td>
      <td style="color:var(--adm-crimson);font-weight:700">${st.a}</td>
      <td><strong>${st.pct}%</strong></td>
      <td><span class="adm-pill ${cls}">${lbl}</span></td>
    </tr>`;
  }).filter(Boolean).join('')||'<tr><td colspan="8" class="adm-empty">No results.</td></tr>';
  tbody.innerHTML=rows;
}
function exportAtt(){
  const ms=G(KM).filter(m=>!m.isAdmin);
  const ss=G(KS); const rs=G(KR);
  let csv='ID,Name,Voice,Role,'+ss.map(s=>s.date+' '+s.title).join(',')+',Present,Excused,Absent,%,Status\n';
  ms.forEach(m=>{
    const st=memberStats(m.id);
    const {lbl}=statusPill(st.pct);
    let row=`"${m.id}","${m.name}","${m.voice}","${m.role}",`;
    ss.forEach(s=>{const r=rs.find(r=>r.sId===s.id&&r.mId===m.id);row+=(r?cap(r.status):'Absent')+',';});
    row+=`${st.p},${st.e},${st.a},${st.pct}%,"${lbl}"`;
    csv+=row+'\n';
  });
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download='SNE_Attendance_'+new Date().toISOString().split('T')[0]+'.csv';
  a.click();
  toast('CSV exported!','success');
}

// ═══════════════════════════════════════════
// MESSAGES
// ═══════════════════════════════════════════
let currentMsg=null;
function loadMessages(){
  renderMessages();
  document.getElementById('msgSearch')?.addEventListener('input',renderMessages);
  document.getElementById('msgSubjectFilter')?.addEventListener('change',renderMessages);
  document.getElementById('msgReadFilter')?.addEventListener('change',renderMessages);
  document.getElementById('msgModalClose')?.addEventListener('click',()=>document.getElementById('msgModal').classList.remove('open'));
  document.getElementById('msgMarkRead')?.addEventListener('click',()=>{
    if(!currentMsg) return;
    let msgs=G(KG);
    const i=msgs.findIndex(m=>m.id===currentMsg.id);
    if(i>=0){msgs[i].read=true;S(KG,msgs);}
    document.getElementById('msgModal').classList.remove('open');
    renderMessages();loadOverview();
  });
  document.getElementById('msgReply')?.addEventListener('click',()=>{
    if(!currentMsg) return;
    window.open('mailto:'+currentMsg.email+'?subject=Re: '+encodeURIComponent(currentMsg.subject||'Your Message'),'_blank');
  });
}

function renderMessages(){
  const srch   =(document.getElementById('msgSearch')?.value||'').toLowerCase();
  const subject=(document.getElementById('msgSubjectFilter')?.value||'');
  const readF  =(document.getElementById('msgReadFilter')?.value||'');
  let msgs=G(KG);
  if(srch)    msgs=msgs.filter(m=>m.name?.toLowerCase().includes(srch)||m.message?.toLowerCase().includes(srch));
  if(subject) msgs=msgs.filter(m=>m.subject===subject);
  if(readF==='unread') msgs=msgs.filter(m=>!m.read);
  if(readF==='read')   msgs=msgs.filter(m=>m.read);
  const div=document.getElementById('msgList');
  if(!msgs.length){div.innerHTML='<p class="adm-empty" style="padding:40px;text-align:center">No messages match your filter.</p>';return;}
  div.innerHTML=msgs.slice().reverse().map(m=>`
    <div class="adm-msg-item ${m.read?'':'unread'}" onclick="openMessage('${m.id}')">
      <div class="adm-msg-avatar">${m.name?m.name[0].toUpperCase():'?'}</div>
      <div class="adm-msg-content">
        <p class="adm-msg-name">${m.name||'—'} ${m.phone?'<span style="color:var(--adm-t400);font-weight:400">· '+m.phone+'</span>':''}</p>
        <p class="adm-msg-subject">${cap(m.subject||'General')}</p>
        <p class="adm-msg-preview">${m.message||''}</p>
      </div>
      <div class="adm-msg-meta">
        <span class="adm-msg-time">${fmtDateTime(m.time)}</span>
        ${!m.read?'<span class="adm-unread-dot"></span>':''}
      </div>
    </div>`).join('');
}

window.openMessage=function(id){
  const msgs=G(KG);
  const m=msgs.find(msg=>msg.id===id);
  if(!m) return;
  currentMsg=m;
  document.getElementById('msgModalSubject').textContent=cap(m.subject||'Message')+' from '+m.name;
  document.getElementById('msgModalBody').innerHTML=`
    <div style="margin-bottom:14px">
      <p><strong>Name:</strong> ${m.name||'—'}</p>
      <p><strong>Email:</strong> ${m.email||'—'}</p>
      <p><strong>Phone:</strong> ${m.phone||'—'}</p>
      <p><strong>Subject:</strong> ${cap(m.subject||'General')}</p>
      <p><strong>Date:</strong> ${fmtDateTime(m.time)}</p>
    </div>
    <div style="background:var(--adm-off);border-radius:8px;padding:14px;font-size:.9rem;line-height:1.75;color:var(--adm-t700)">
      ${m.message||'(No message body)'}
    </div>`;
  document.getElementById('msgModal').classList.add('open');
};

// ═══════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════
function loadSettings(){
  // Prices
  const p=getPrices();
  const div=document.getElementById('priceSettings');
  div.innerHTML=Object.entries(p).map(([key,c])=>`
    <div style="margin-bottom:16px;padding:14px;background:var(--adm-g50);border-radius:8px">
      <p style="font-size:.82rem;font-weight:700;color:var(--adm-navy);margin-bottom:8px">${c.name}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
        <div class="adm-fg"><label>Student</label><input type="number" data-concert="${key}" data-type="student" value="${c.student}" min="0"/></div>
        <div class="adm-fg"><label>Regular</label><input type="number" data-concert="${key}" data-type="regular" value="${c.regular}" min="0"/></div>
        <div class="adm-fg"><label>VIP</label><input type="number" data-concert="${key}" data-type="vip" value="${c.vip}" min="0"/></div>
      </div>
    </div>`).join('');

  document.getElementById('savePricesBtn')?.addEventListener('click',()=>{
    const updated={};
    document.querySelectorAll('#priceSettings input[data-concert]').forEach(inp=>{
      const ck=inp.dataset.concert; const type=inp.dataset.type;
      if(!updated[ck]) updated[ck]={...getPrices()[ck]};
      updated[ck][type]=parseInt(inp.value)||0;
    });
    S('sne_prices',updated);
    toast('Prices saved!','success');
  });

  // PIN change
  document.getElementById('savePinBtn')?.addEventListener('click',()=>{
    const cur =document.getElementById('currentPin').value.trim();
    const nw  =document.getElementById('newPin').value.trim();
    const conf=document.getElementById('confirmPin').value.trim();
    const err =document.getElementById('pinChangeErr');
    err.textContent='';
    if(hp(cur)!==getAdminPin()){err.textContent='Current PIN is incorrect.';return;}
    if(nw.length<4){err.textContent='New PIN must be at least 4 characters.';return;}
    if(nw!==conf){err.textContent='New PINs do not match.';return;}
    localStorage.setItem(KP,hp(nw));
    // Also update admin member record
    let ms=G(KM);
    const i=ms.findIndex(m=>m.id===ADMIN_ID);
    if(i>=0){ms[i].pin=hp(nw);S(KM,ms);}
    ['currentPin','newPin','confirmPin'].forEach(id=>document.getElementById(id).value='');
    toast('PIN updated successfully!','success');
  });
}

// ═══════════════════════════════════════════
// INTERCEPT TICKET PURCHASES FROM MAIN SITE
// ═══════════════════════════════════════════
// Listen for ticket orders saved by the main site
// (The main site saves to localStorage key sne_tickets on payment)
// Contact form messages from the main site go to sne_msgs

// ═══════════════════════════════════════════
// ANNOUNCEMENTS
// ═══════════════════════════════════════════
// Add Announcements page to admin nav and handle it
// Key: sne_announcements — array of {id, title, body, pinned, date, author}

function loadAnnouncements(){
  renderAnnouncements();
  document.getElementById('addAnnBtn')?.addEventListener('click',()=>{
    const f=document.getElementById('addAnnForm');
    f.style.display=f.style.display==='none'?'block':'none';
  });
  document.getElementById('cancelAnnBtn')?.addEventListener('click',()=>{
    document.getElementById('addAnnForm').style.display='none';
  });
  document.getElementById('saveAnnBtn')?.addEventListener('click',()=>{
    const title=document.getElementById('annTitle').value.trim();
    const body=document.getElementById('annBody').value.trim();
    const pinned=document.getElementById('annPinned').checked;
    if(!title||!body){toast('Please add a title and message.','error');return;}
    const anns=JSON.parse(localStorage.getItem('sne_announcements')||'[]');
    anns.unshift({id:'ANN-'+Date.now(),title,body,pinned,date:new Date().toISOString(),author:'Frederick Owusu Boakye'});
    localStorage.setItem('sne_announcements',JSON.stringify(anns));
    document.getElementById('addAnnForm').style.display='none';
    document.getElementById('annTitle').value='';
    document.getElementById('annBody').value='';
    document.getElementById('annPinned').checked=false;
    renderAnnouncements();
    toast('Announcement posted!','success');
  });
}

function renderAnnouncements(){
  const anns=JSON.parse(localStorage.getItem('sne_announcements')||'[]');
  const list=document.getElementById('annList');
  if(!list) return;
  if(!anns.length){list.innerHTML='<p class="adm-empty" style="padding:40px;text-align:center">No announcements yet.</p>';return;}
  list.innerHTML=anns.map(a=>`
    <div class="adm-ann-item ${a.pinned?'pinned':''}">
      <div class="adm-ann-head">
        <div>
          ${a.pinned?'<span class="adm-pill adm-pill-blue" style="margin-right:8px">Pinned</span>':''}
          <strong>${a.title}</strong>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:.74rem;color:var(--t400)">${new Date(a.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>
          <button class="adm-btn adm-btn-danger adm-btn-sm" onclick="deleteAnn('${a.id}')">Delete</button>
        </div>
      </div>
      <p class="adm-ann-body">${a.body}</p>
    </div>`).join('');
}
window.deleteAnn=function(id){
  if(!confirm('Delete this announcement?')) return;
  const anns=JSON.parse(localStorage.getItem('sne_announcements')||'[]').filter(a=>a.id!==id);
  localStorage.setItem('sne_announcements',JSON.stringify(anns));
  renderAnnouncements();
  toast('Announcement deleted.','warn');
};

// ═══════════════════════════════════════════
// DUES TRACKER
// ═══════════════════════════════════════════
// PAYMENTS TRACKER — 4 categories
// Keys: sne_pay_dues | sne_pay_welfare | sne_pay_costume | sne_pay_trip
// Each record: {memberId, month, year, amount, paid, paidDate, note}
// ═══════════════════════════════════════════

const PAY_CATS = {
  dues:    { key:'sne_pay_dues',    label:'Monthly Dues',       amount:20,  bodyId:'duesBody',    color:'#1e3a8a' },
  welfare: { key:'sne_pay_welfare', label:'Welfare',            amount:10,  bodyId:'welfareBody', color:'#15803d' },
  costume: { key:'sne_pay_costume', label:'Costume',            amount:50,  bodyId:'costumeBody', color:'#7c3aed' },
  trip:    { key:'sne_pay_trip',    label:'Trip/Transportation', amount:30,  bodyId:'tripBody',    color:'#b45309' }
};

function loadDues(){
  // Payment category tab switching
  document.querySelectorAll('[data-ptab]').forEach(tab=>{
    tab.addEventListener('click',()=>{
      document.querySelectorAll('[data-ptab]').forEach(t=>t.classList.remove('active'));
      document.querySelectorAll('.adm-att-panel[id^="pt"]').forEach(p=>p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.ptab)?.classList.add('active');
      renderAllPayTables();
    });
  });

  document.getElementById('duesMonthSel')?.addEventListener('change', renderAllPayTables);
  document.getElementById('duesYearSel')?.addEventListener('change',  renderAllPayTables);
  document.getElementById('duesSrch')?.addEventListener('input',       renderAllPayTables);
  document.getElementById('exportDuesBtn')?.addEventListener('click',  exportAllPay);
  document.getElementById('genDuesBtn')?.addEventListener('click',     generateAllPayRecords);

  renderAllPayTables();
}

function getPayFilter(){
  const month = document.getElementById('duesMonthSel')?.value || (new Date().getMonth()+1).toString().padStart(2,'0');
  const year  = document.getElementById('duesYearSel')?.value  || new Date().getFullYear().toString();
  const srch  = (document.getElementById('duesSrch')?.value||'').toLowerCase();
  return {month, year, srch};
}

function renderPayTable(catKey){
  const cat = PAY_CATS[catKey];
  if(!cat) return;
  const {month, year, srch} = getPayFilter();
  const records = JSON.parse(localStorage.getItem(cat.key)||'[]');
  let ms = G(KM).filter(m=>!m.isAdmin);
  if(srch) ms = ms.filter(m=>m.name.toLowerCase().includes(srch)||m.id.toLowerCase().includes(srch));
  const tbody = document.getElementById(cat.bodyId);
  if(!tbody) return;
  if(!ms.length){ tbody.innerHTML=`<tr><td colspan="7" class="adm-empty">No members yet.</td></tr>`; return; }
  tbody.innerHTML = ms.map(m=>{
    const rec  = records.find(r=>r.memberId===m.id&&r.month===month&&r.year===year);
    const paid = rec&&rec.paid;
    return `<tr>
      <td style="font-family:monospace;font-size:.74rem">${m.id}</td>
      <td><strong>${m.name}</strong></td>
      <td>${m.voice}</td>
      <td>GHS ${rec?rec.amount:cat.amount}</td>
      <td><span class="adm-pill ${paid?'adm-pill-green':'adm-pill-red'}">${paid?'Paid':'Unpaid'}</span></td>
      <td>${rec&&rec.paidDate?new Date(rec.paidDate).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):'—'}</td>
      <td style="display:flex;gap:5px">
        ${!paid?`<button class="adm-btn adm-btn-green adm-btn-sm" onclick="markPayPaid('${catKey}','${m.id}','${month}','${year}')">Mark Paid</button>`:''}
        ${paid?`<button class="adm-btn adm-btn-sm adm-btn-o" onclick="markPayUnpaid('${catKey}','${m.id}','${month}','${year}')">Undo</button>`:''}
      </td>
    </tr>`;
  }).join('');
}

function renderAllPayTables(){
  Object.keys(PAY_CATS).forEach(k => renderPayTable(k));
}

window.markPayPaid=function(catKey,mId,month,year){
  const cat = PAY_CATS[catKey];
  let rs = JSON.parse(localStorage.getItem(cat.key)||'[]');
  const i = rs.findIndex(r=>r.memberId===mId&&r.month===month&&r.year===year);
  const rec = {memberId:mId, month, year, amount:cat.amount, paid:true, paidDate:new Date().toISOString(), category:catKey};
  if(i>=0) rs[i]=rec; else rs.push(rec);
  localStorage.setItem(cat.key, JSON.stringify(rs));
  renderPayTable(catKey);
  toast(cat.label+' marked as Paid.','success');
};

window.markPayUnpaid=function(catKey,mId,month,year){
  const cat = PAY_CATS[catKey];
  let rs = JSON.parse(localStorage.getItem(cat.key)||'[]');
  const i = rs.findIndex(r=>r.memberId===mId&&r.month===month&&r.year===year);
  if(i>=0){rs[i].paid=false; rs[i].paidDate=null;}
  localStorage.setItem(cat.key, JSON.stringify(rs));
  renderPayTable(catKey);
  toast('Payment status updated.','');
};

// Keep old aliases for backward compatibility
window.markDuesPaid   = (mId,month,year) => window.markPayPaid('dues',mId,month,year);
window.markDuesUnpaid = (mId,month,year) => window.markPayUnpaid('dues',mId,month,year);

function generateAllPayRecords(){
  const month = document.getElementById('duesMonthSel')?.value || (new Date().getMonth()+1).toString().padStart(2,'0');
  const year  = document.getElementById('duesYearSel')?.value  || new Date().getFullYear().toString();
  const ms    = G(KM).filter(m=>!m.isAdmin);
  let total   = 0;
  Object.entries(PAY_CATS).forEach(([catKey,cat])=>{
    let rs = JSON.parse(localStorage.getItem(cat.key)||'[]');
    ms.forEach(m=>{
      if(!rs.find(r=>r.memberId===m.id&&r.month===month&&r.year===year)){
        rs.push({memberId:m.id, month, year, amount:cat.amount, paid:false, paidDate:null, category:catKey});
        total++;
      }
    });
    localStorage.setItem(cat.key, JSON.stringify(rs));
  });
  renderAllPayTables();
  toast(total+' payment records generated for all categories!','success');
}

// Keep old alias
function generateMonthlyDues(){ generateAllPayRecords(); }

function exportAllPay(){
  const ms   = G(KM).filter(m=>!m.isAdmin);
  const month= document.getElementById('duesMonthSel')?.value||'01';
  const year = document.getElementById('duesYearSel')?.value||'2026';
  let csv    = 'ID,Name,Voice,Category,Month,Year,Amount,Status,Date Paid\n';
  Object.entries(PAY_CATS).forEach(([catKey,cat])=>{
    const rs = JSON.parse(localStorage.getItem(cat.key)||'[]');
    ms.forEach(m=>{
      const r = rs.find(r=>r.memberId===m.id&&r.month===month&&r.year===year);
      csv += `"${m.id}","${m.name}","${m.voice}","${cat.label}","${month}","${year}",${r?r.amount:cat.amount},"${r&&r.paid?'Paid':'Unpaid'}","${r&&r.paidDate?new Date(r.paidDate).toLocaleDateString('en-GB'):'-'}"\n`;
    });
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download = 'SNE_Payments_'+month+'_'+year+'.csv';
  a.click();
  toast('Payments exported!','success');
}

function exportDues(){ exportAllPay(); }
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download='SNE_Dues_'+new Date().toISOString().split('T')[0]+'.csv';
  a.click();
  toast('Dues exported!','success');
}