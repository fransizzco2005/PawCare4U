/* PawCare additions: customer order tracking + owner dashboard + feedback. */
(function(){
'use strict';
const api=(url,opt={})=>fetch(url,{credentials:'same-origin',headers:{'Content-Type':'application/json'},...opt}).then(async r=>{const t=await r.text();let d={};try{d=t?JSON.parse(t):{}}catch(e){throw Error('Server returned invalid JSON.')}if(!r.ok)throw Error(d.error||'Request failed');return d;});
const money=n=>'₱'+Number(n||0).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
const labels={placed:'Order placed',processing:'Packed / processing',shipped:'On the way',delivered:'Delivered',cancelled:'Cancelled'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function tracking(o){
 const states=['placed','processing','shipped','delivered'], cur=o.order_status, idx=states.indexOf(cur);
 if(cur==='cancelled') return `<div class="tracking cancelled">${states.slice(0,3).map(x=>`<div class="track-step"><span>✓</span><small>${labels[x]}</small></div>`).join('')}<div class="track-step current"><span>×</span><small>Cancelled</small></div></div>`;
 return `<div class="tracking">${states.map((x,i)=>`<div class="track-step ${i<=idx?'done':''} ${x===cur?'current':''}"><span>${i<idx?'✓':i===idx?'●':'○'}</span><small>${labels[x]}</small></div>`).join('')}</div>`;
}
function orderCard(o,owner=false){
 const items=(o.items||[]).map(i=>`<div class="order-item"><span>${esc(i.name)} × ${i.qty}</span><b>${money(i.price*i.qty)}</b></div>`).join('');
 const statusOptions=['placed','processing','shipped','delivered','cancelled'].map(s=>`<option value="${s}" ${s===o.order_status?'selected':''}>${labels[s]}</option>`).join('');
 return `<article class="order-card">
  <div class="order-card-head"><div><b>Order #${o.id}</b><small>${new Date(o.created_at).toLocaleString()}</small></div><span class="status-pill status-${o.order_status}">${labels[o.order_status]||o.order_status}</span></div>
  ${owner?`<div class="customer-box"><b>${esc(o.customer_name)}</b><span>${esc(o.customer_email)}</span><span>${esc(o.phone||'')}</span><span>${esc(o.line1)}, ${esc(o.city)}, ${esc(o.province)} ${esc(o.postal_code)}</span></div>`:''}
  <div class="order-items">${items}</div><div class="order-total"><span>Total</span><b>${money(o.total)}</b></div>${tracking(o)}
  ${owner?`<div class="owner-order-action"><label>Update status <select data-order-status data-id="${o.id}">${statusOptions}</select></label></div>`:''}
 </article>`;
}
async function initUserOrders(){
 const msg=document.getElementById('ordersMessage'),list=document.getElementById('ordersList');
 try{const d=await api('api/orders.php'); if(!d.orders.length){msg.textContent='You have no orders yet.';return;} msg.hidden=true; list.innerHTML=d.orders.map(o=>orderCard(o)).join('');}
 catch(e){msg.textContent=e.message;}
}
function initOwner(){
 const tabs=[...document.querySelectorAll('.owner-tab')], panels={orders:document.getElementById('ownerOrdersPanel'),feedback:document.getElementById('ownerFeedbackPanel'),overview:document.getElementById('ownerOverviewPanel')};
 tabs.forEach(t=>t.onclick=()=>{tabs.forEach(x=>x.classList.toggle('active',x===t));Object.entries(panels).forEach(([k,p])=>p.hidden=k!==t.dataset.tab);if(t.dataset.tab==='orders')loadOwnerOrders();if(t.dataset.tab==='feedback')loadFeedback();if(t.dataset.tab==='overview')loadOverview();});
 document.getElementById('ownerLogout')?.addEventListener('click',async()=>{await api('api/logout.php',{method:'POST'}).catch(()=>{});location.href='index.html';});
 loadOwnerOrders();
 async function loadOwnerOrders(){
  const p=panels.orders;p.innerHTML='<div class="orders-message">Loading orders...</div>';
  try{const d=await api('api/orders.php');p.innerHTML=d.orders.length?d.orders.map(o=>orderCard(o,true)).join(''):'<div class="empty-owner">No customer orders yet.</div>';
   p.querySelectorAll('[data-order-status]').forEach(sel=>sel.onchange=async()=>{try{await api('api/owner_orders.php',{method:'POST',body:JSON.stringify({order_id:sel.dataset.id,status:sel.value})});loadOwnerOrders();}catch(e){alert(e.message);loadOwnerOrders();}});
  }catch(e){p.innerHTML=`<div class="orders-message">${esc(e.message)}</div>`;}
 }
 async function loadFeedback(){
  const p=panels.feedback;p.innerHTML='<div class="orders-message">Loading feedback...</div>';
  try{const d=await api('api/product_feedback.php');const f=d.feedback||[];p.innerHTML=f.length?f.map(x=>`<article class="feedback-card"><div class="feedback-meta"><b>${esc(x.product_name)}</b><span>from ${esc(x.user_name)}</span><small>${new Date(x.created_at).toLocaleString()}</small></div><p>${esc(x.comment)}</p><div class="owner-reply">${x.owner_reply?`<b>Your reply</b><p>${esc(x.owner_reply)}</p>`:`<label>Reply to customer<textarea data-feedback-id="${x.id}" placeholder="Write a reply..."></textarea><button class="owner-reply-btn" data-reply-id="${x.id}">Send reply</button></label>`}</div></article>`).join(''):'<div class="empty-owner">No product feedback yet.</div>';
   p.querySelectorAll('[data-reply-id]').forEach(b=>b.onclick=async()=>{const ta=p.querySelector(`[data-feedback-id="${b.dataset.replyId}"]`);try{await api('api/product_feedback.php',{method:'PUT',body:JSON.stringify({id:b.dataset.replyId,owner_reply:ta.value})});loadFeedback();}catch(e){alert(e.message);}});
  }catch(e){p.innerHTML=`<div class="orders-message">${esc(e.message)}</div>`;}
 }
 async function loadOverview(){
  const p=panels.overview;try{const d=await api('api/orders.php');const a=d.orders||[];p.innerHTML=`<div class="overview-grid"><div><b>${a.length}</b><span>Total orders</span></div><div><b>${a.filter(x=>['placed','processing'].includes(x.order_status)).length}</b><span>To pack</span></div><div><b>${a.filter(x=>x.order_status==='shipped').length}</b><span>On the way</span></div><div><b>${a.filter(x=>x.order_status==='delivered').length}</b><span>Delivered</span></div><div><b>${money(a.reduce((s,x)=>s+Number(x.total),0))}</b><span>Total sales</span></div></div>`}catch(e){p.innerHTML=`<div class="orders-message">${esc(e.message)}</div>`;}
}
}
window.PawCareOrders={initUserOrders}; window.PawCareOwner={init:initOwner};
})();