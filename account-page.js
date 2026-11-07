(function(){'use strict';
const api=(url,opt={})=>fetch(url,{credentials:'same-origin',...opt}).then(async r=>{const t=await r.text();let d={};try{d=t?JSON.parse(t):{}}catch(e){throw Error('Server returned invalid JSON.')}if(!r.ok)throw Error(d.error||'Request failed');return d});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'₱'+Number(n||0).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
const labels={placed:'Order placed',processing:'Packed / processing',shipped:'On the way',delivered:'Delivered',cancelled:'Cancelled'};
let profile=null;
function initials(name){return String(name||'PawCare').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'P'}
function avatar(url,name){const img=url?`<img src="${esc(url)}" alt="Profile photo">`:'';return img||initials(name)}
function tracking(o){const states=['placed','processing','shipped','delivered'],idx=states.indexOf(o.order_status);if(o.order_status==='cancelled')return `<div class="tracking cancelled">${states.slice(0,3).map(x=>`<div class="track-step"><span>✓</span><small>${labels[x]}</small></div>`).join('')}<div class="track-step current"><span>×</span><small>Cancelled</small></div></div>`;return `<div class="tracking">${states.map((x,i)=>`<div class="track-step ${i<=idx?'done':''} ${x===o.order_status?'current':''}"><span>${i<idx?'✓':i===idx?'●':'○'}</span><small>${labels[x]}</small></div>`).join('')}</div>`}
function reservationCard(a,isOwner){
 const statusLabels={pending:'Pending',confirmed:'Confirmed',completed:'Completed',cancelled:'Cancelled'};
 const status=a.status||'pending';
 const date=a.appointment_date?new Date(a.appointment_date+'T00:00:00').toLocaleDateString('en-PH',{year:'numeric',month:'long',day:'numeric'}):'—';
 const time=a.appointment_time?new Date('1970-01-01T'+a.appointment_time).toLocaleTimeString('en-PH',{hour:'numeric',minute:'2-digit'}):'—';
 const details=[
  ['Service',a.service_name],['Branch',a.branch],['Date',date],['Time',time],
  ['Customer',a.customer_name],['Email',a.email],['Phone',a.phone],['Pet name',a.pet_name],
  ['Pet type',a.pet_type],['Pet age',a.pet_age||'—'],['Notes / reason',a.notes||'—']
 ];
 const body=details.map(([k,v])=>`<div class="reservation-detail"><small>${esc(k)}</small><b>${esc(v||'—')}</b></div>`).join('');
 const ownerControl=isOwner?`<div class="owner-status-control reservation-status-control">Update status <select data-reservation-status data-id="${a.id}">${Object.entries(statusLabels).map(([k,v])=>`<option value="${k}" ${k===status?'selected':''}>${v}</option>`).join('')}</select></div>`:'';
 return `<article class="reservation-card ${isOwner?'owner-reservation-card':''}"><div class="reservation-card-head"><div><b>${esc(a.reference||('PC-'+String(a.id).padStart(6,'0')))}</b><small>Reserved ${esc(new Date(a.created_at).toLocaleString())}</small></div><span class="status-pill status-${esc(status)}">${esc(statusLabels[status]||status)}</span></div><div class="reservation-details">${body}</div>${ownerControl}</article>`;
}
function orderCard(o,isOwner){
 const messages=(o.messages||[]).map(m=>`<div class="order-message-item"><div><b>👑 ${esc(m.owner_name||'PawCare Owner')}</b><small>${new Date(m.created_at).toLocaleString()}</small></div><p>${esc(m.message)}</p></div>`).join('');
 const ownerComposer=isOwner?`<div class="owner-order-message"><label>Message customer about this order</label><textarea data-order-message="${o.id}" placeholder="Example: Thank you for your order! We are preparing your items now."></textarea><button type="button" data-send-order-message="${o.id}">Send message</button></div>`:'';
 return `<article class="order-card ${isOwner?'owner-order-card':''}"><div class="order-card-head"><div><b>Order #${o.id}</b><small>${new Date(o.created_at).toLocaleString()}</small></div><span class="status-pill status-${o.order_status}">${labels[o.order_status]||o.order_status}</span></div>${isOwner?`<div class="owner-customer"><b>${esc(o.customer_name||o.full_name||'Customer')}</b>${esc(o.customer_email||'')}<br>${esc(o.phone||'')} · ${esc(o.city||'')}</div>`:''}<div class="order-items">${(o.items||[]).map(i=>`<div class="order-item"><span>${esc(i.name)} × ${i.qty}</span><b>${money(i.price*i.qty)}</b></div>`).join('')}</div><div class="order-total"><span>Total</span><b>${money(o.total)}</b></div>${tracking(o)}${messages?`<div class="order-messages"><strong>💬 Message from PawCare</strong>${messages}</div>`:''}${ownerComposer}${isOwner?`<div class="owner-status-control">Update status <select data-status-id="${o.id}">${Object.entries(labels).map(([k,v])=>`<option value="${k}" ${k===o.order_status?'selected':''}>${v}</option>`).join('')}</select></div>`:''}</article>`}
function setAvatarEls(p){const els=[['miniAvatarImg','miniInitials'],['profileAvatarImg','profileInitials']];els.forEach(([imgId,initId])=>{const img=document.getElementById(imgId),init=document.getElementById(initId);if(p.avatar_url){img.src=p.avatar_url;img.hidden=false;init.hidden=true}else{img.hidden=true;init.hidden=false;init.textContent=initials(p.nickname||p.profile_name||p.name)}})}
async function loadProfile(){const d=await api('api/profile.php');profile=d.profile;const isOwner=profile.role==='owner';document.body.classList.toggle('is-owner',isOwner);document.body.classList.toggle('is-user',!isOwner);document.querySelectorAll('.owner-only').forEach(el=>{el.hidden=!isOwner});document.querySelector('.role-chip').textContent=isOwner?'👑 OWNER ACCOUNT':'USER ACCOUNT';document.querySelector('.big-role-indicator').textContent=isOwner?'👑 OWNER MODE':'● CUSTOMER';const display=profile.nickname||profile.profile_name||profile.name;document.getElementById('miniName').textContent=display;document.getElementById('miniEmail').textContent=profile.email;document.getElementById('miniInitials').textContent=initials(display);document.getElementById('profileInitials').textContent=initials(display);document.getElementById('profileHello').textContent=display+'!';document.getElementById('fullNameInput').value=profile.name||'';document.getElementById('nicknameInput').value=profile.nickname||profile.profile_name||'';document.getElementById('emailInput').value=profile.email||'';document.getElementById('phoneInput').value=profile.phone||'—';setAvatarEls(profile)}
async function loadOrders(){const box=document.getElementById('accountOrders');box.innerHTML='<div class="account-loading">Loading orders...</div>';try{const d=await api('api/orders.php');box.innerHTML=d.orders?.length?d.orders.map(o=>orderCard(o,d.role==='owner')).join(''):'<div class="account-loading">No orders yet.</div>';box.querySelectorAll('[data-status-id]').forEach(sel=>sel.onchange=async()=>{try{await api('api/owner_orders.php',{method:'POST',body:JSON.stringify({order_id:sel.dataset.statusId,status:sel.value})});loadOrders()}catch(e){alert(e.message);loadOrders()}});box.querySelectorAll('[data-send-order-message]').forEach(btn=>btn.onclick=async()=>{const ta=box.querySelector(`[data-order-message="${btn.dataset.sendOrderMessage}"]`);if(!ta||!ta.value.trim())return;btn.disabled=true;try{await api('api/order_messages.php',{method:'POST',body:JSON.stringify({order_id:btn.dataset.sendOrderMessage,message:ta.value.trim()})});loadOrders()}catch(e){alert(e.message);btn.disabled=false}})}catch(e){box.innerHTML=`<div class="account-loading">${esc(e.message)}</div>`}}
async function loadReservations(){
 const box=document.getElementById('accountReservations'); if(!box)return;
 box.innerHTML='<div class="account-loading">Loading reservations...</div>';
 try{
  const d=await api('api/appointments.php'); const isOwner=d.role==='owner'; const arr=d.appointments||[];
  box.innerHTML=arr.length?arr.map(a=>reservationCard(a,isOwner)).join(''):'<div class="account-loading">No reservations yet.</div>';
  box.querySelectorAll('[data-reservation-status]').forEach(sel=>sel.onchange=async()=>{
   try{await api('api/appointments.php',{method:'PUT',body:JSON.stringify({id:sel.dataset.id,status:sel.value})});loadReservations();}
   catch(e){alert(e.message);loadReservations();}
  });
 }catch(e){box.innerHTML=`<div class="account-loading">${esc(e.message)}</div>`}
}

async function loadFeedback(){
 const box=document.getElementById('accountFeedback'); if(!box)return;
 box.innerHTML='<div class="account-loading">Loading feedback...</div>';
 try{
  const d=await api('api/product_feedback.php');
  const arr=d.feedback||[];
  if(!arr.length){box.innerHTML='<div class="account-loading">No customer feedback yet.</div>';return;}
  box.innerHTML=arr.map(f=>`<article class="owner-feedback-card">
   <div class="meta"><b>${esc(f.product_name||'Product')}</b><span>by ${esc(f.sender_role==='owner'?'Owner':'Customer')} ${esc(f.user_name||'')}</span><span>${esc(new Date(f.created_at).toLocaleString())}</span></div>
   <div class="feedback-entry-rating">${Number(f.rating)?`${'★'.repeat(Math.min(5,Number(f.rating)))}${'☆'.repeat(5-Math.min(5,Number(f.rating)))}`:'No rating'}</div>
   <p>${esc(f.comment||'Rating only; no comment.')}</p>
   ${f.owner_reply?`<div class="owner-replied"><b>Owner reply:</b> ${esc(f.owner_reply)}</div>`:`<textarea data-feedback-reply="${f.id}" placeholder="Write a reply to this customer..."></textarea><button type="button" data-send-feedback="${f.id}">Reply</button>`}
  </article>`).join('');
  box.querySelectorAll('[data-send-feedback]').forEach(btn=>btn.onclick=async()=>{
   const ta=box.querySelector(`[data-feedback-reply="${btn.dataset.sendFeedback}"]`);
   if(!ta||!ta.value.trim())return;
   btn.disabled=true;
   try{await api('api/product_feedback.php',{method:'PUT',body:JSON.stringify({id:btn.dataset.sendFeedback,owner_reply:ta.value.trim()})});loadFeedback();}
   catch(e){alert(e.message);btn.disabled=false;}
  });
 }catch(e){box.innerHTML=`<div class="account-loading">${esc(e.message)}</div>`}
}

async function loadOverview(){
 const box=document.getElementById('accountOverview'); if(!box)return;
 box.innerHTML='<div class="account-loading">Loading overview...</div>';
 try{
  const [ordersData,resData,feedbackData]=await Promise.all([
   api('api/orders.php'),
   api('api/appointments.php'),
   api('api/product_feedback.php')
  ]);
  const orders=ordersData.orders||[], reservations=resData.appointments||[], feedback=feedbackData.feedback||[];
  const counts={placed:0,processing:0,shipped:0,delivered:0,cancelled:0};
  orders.forEach(o=>{if(counts[o.order_status]!==undefined)counts[o.order_status]++});
  const pendingReservations=reservations.filter(a=>a.status==='pending').length;
  const openFeedback=feedback.filter(f=>!f.owner_reply).length;
  const revenue=orders.filter(o=>o.order_status!=='cancelled').reduce((sum,o)=>sum+Number(o.total||0),0);
  box.innerHTML=`<div class="owner-account-panel">
   <div class="owner-summary-grid">
    <div><b>${orders.length}</b><span>Total orders</span></div>
    <div><b>${pendingReservations}</b><span>Pending reservations</span></div>
    <div><b>${openFeedback}</b><span>Unreplied feedback</span></div>
    <div><b>${money(revenue)}</b><span>Order value</span></div>
   </div>
   <div class="owner-summary-grid" style="margin-top:12px">
    <div><b>${counts.placed}</b><span>Order placed</span></div>
    <div><b>${counts.processing}</b><span>Packed / processing</span></div>
    <div><b>${counts.shipped}</b><span>On the way</span></div>
    <div><b>${counts.delivered}</b><span>Delivered</span></div>
   </div>
  </div>`;
 }catch(e){box.innerHTML=`<div class="account-loading">${esc(e.message)}</div>`}
}

function selectSection(name){document.querySelectorAll('.side-link[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===name));document.querySelectorAll('.account-section').forEach(s=>s.classList.toggle('active',s.id==='section-'+name));const titles={profile:['Profile','Manage your PawCare profile and personal details.'],orders:[document.body.classList.contains('is-owner')?'Orders':'My Orders',document.body.classList.contains('is-owner')?'View customer orders and update delivery status.':'Track your deliveries from order placed to delivered.'],reservations:[document.body.classList.contains('is-owner')?'Reservations':'My Reservations',document.body.classList.contains('is-owner')?'View and manage customer service reservations.':'See the service you reserved and all the details you submitted.'],feedback:['Customer Feedback','Read customer product comments and reply.'],overview:['Overview','Quick view of customer orders and delivery status.']};const t=titles[name]||titles.profile;document.getElementById('accountTitle').textContent=t[0];document.getElementById('accountSubtitle').textContent=t[1];if(name==='orders')loadOrders();if(name==='reservations')loadReservations();if(name==='feedback')loadFeedback();if(name==='overview')loadOverview();history.replaceState(null,'','#'+name)}
document.querySelectorAll('.side-link[data-section]').forEach(b=>b.addEventListener('click',()=>selectSection(b.dataset.section)));
document.getElementById('avatarInput').addEventListener('change',e=>{
 const f=e.target.files[0];if(!f)return;
 if(!/^image\/(png|jpeg|webp|gif)$/.test(f.type)){document.getElementById('profileMessage').textContent='Use JPG, PNG, WEBP, or GIF.';e.target.value='';return}
 if(f.size>4*1024*1024){document.getElementById('profileMessage').textContent='Profile image must be 4MB or smaller.';e.target.value='';return}
 const url=URL.createObjectURL(f),img=document.getElementById('profileAvatarImg');
 img.src=url;img.hidden=false;document.getElementById('profileInitials').hidden=true;
 img.onload=()=>URL.revokeObjectURL(url);
});
function resizeAvatar(file){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onerror=()=>reject(Error('Could not read the selected image.'));
  reader.onload=()=>{
   const img=new Image();
   img.onerror=()=>reject(Error('Please select a valid image.'));
   img.onload=()=>{
    const size=256,canvas=document.createElement('canvas');
    canvas.width=size;canvas.height=size;
    const ctx=canvas.getContext('2d'),scale=Math.max(size/img.width,size/img.height);
    const width=img.width*scale,height=img.height*scale;
    ctx.drawImage(img,(size-width)/2,(size-height)/2,width,height);
    resolve(canvas.toDataURL('image/jpeg',0.86));
   };
   img.src=reader.result;
  };
  reader.readAsDataURL(file);
 });
}
document.getElementById('profileForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const msg=document.getElementById('profileMessage'),fd=new FormData(e.target),f=document.getElementById('avatarInput').files[0];
 const payload={nickname:fd.get('nickname')||''};
 msg.textContent='Saving...';
 try{
  if(f)payload.avatar_data=await resizeAvatar(f);
  const d=await fetch('api/profile.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const responseText=await d.text();
  let j={};
  try{j=responseText?JSON.parse(responseText):{}}catch(_){throw Error(d.ok?'Server returned an invalid response.':`Server request failed (${d.status}).`)}
  if(!d.ok)throw Error(j.error||`Server request failed (${d.status}).`);
  profile=j.profile;msg.textContent='Saved.';await loadProfile();
  window.dispatchEvent(new CustomEvent('pawcare:profile-updated',{detail:profile}));
  setTimeout(()=>msg.textContent='',1800);
 }catch(err){msg.textContent=err.message}
});
document.getElementById('signOutAccount').addEventListener('click',async()=>{await api('api/logout.php',{method:'POST'}).catch(()=>{});location.href='index.html'});
loadProfile().catch(e=>document.getElementById('profileMessage').textContent=e.message);
const hash=location.hash.replace('#','');if(['profile','orders','reservations','feedback','overview'].includes(hash))selectSection(hash);else selectSection('profile');
})();
