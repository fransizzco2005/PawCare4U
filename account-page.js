(function(){'use strict';
const api=(url,opt={})=>fetch(url,{credentials:'same-origin',...opt}).then(async r=>{const t=await r.text();let d={};try{d=t?JSON.parse(t):{}}catch(e){throw Error('Server returned invalid JSON.')}if(!r.ok)throw Error(d.error||'Request failed');return d});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'₱'+Number(n||0).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
const labels={placed:'Order placed',processing:'Packed / processing',shipped:'On the way',delivered:'Delivered',cancelled:'Cancelled'};
const cancelReasons={found_another_product:'I found another product',ordered_by_mistake:'I ordered by mistake',changed_my_mind:'I changed my mind',delivery_takes_too_long:'The delivery takes too long',other:'Other',owner_cancelled:'Cancel on behalf of the customer'};
let profile=null;
let orderTrashView=false;
let reservationTrashView=false;
let overviewMonth=new Date().getMonth()+1;
let overviewYear=new Date().getFullYear();
const overviewMonthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
function monthlySalesPicker(month,year,years){return `<div class="overview-month-picker"><label>Year<select data-sales-year>${years.map(value=>`<option value="${value}" ${Number(value)===Number(year)?'selected':''}>${value}</option>`).join('')}</select></label><div class="overview-month-tabs" role="tablist" aria-label="Select sales month">${overviewMonthNames.map((name,index)=>`<button type="button" role="tab" aria-selected="${index+1===Number(month)}" class="${index+1===Number(month)?'active':''}" data-sales-month="${index+1}">${name}</button>`).join('')}</div></div>`}
function initials(name){return String(name||'PawCare').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'P'}
function avatar(url,name){const img=url?`<img src="${esc(url)}" alt="Profile photo">`:'';return img||initials(name)}
function tracking(o){const states=['placed','processing','shipped','delivered'],idx=states.indexOf(o.order_status);if(o.order_status==='cancelled')return `<div class="tracking cancelled">${states.slice(0,3).map(x=>`<div class="track-step"><span>✓</span><small>${labels[x]}</small></div>`).join('')}<div class="track-step current"><span>×</span><small>Cancelled</small></div></div>`;return `<div class="tracking">${states.map((x,i)=>`<div class="track-step ${i<=idx?'done':''} ${x===o.order_status?'current':''}"><span>${i<idx?'✓':i===idx?'●':'○'}</span><small>${labels[x]}</small></div>`).join('')}</div>`}
function ownerRecordToolbar(type,isOwner,inTrash){if(!isOwner)return '';const label=type==='order'?'orders':'reservations';return `<div class="record-trash-toolbar"><div><b>${inTrash?'Trash':`All ${label}`}</b><small>${inTrash?'Archived records are hidden from the active list.':'Move old records to trash to tidy this list.'}</small></div><button type="button" class="record-trash-toggle" data-record-view-toggle="${type}">${inTrash?'← Back to '+label:'🗑 View trash'}</button></div>`}
function ownerRecordButtons(type,id,label,isOwner,inTrash){if(!isOwner)return '';return inTrash?`<div class="record-owner-actions"><button type="button" data-record-action="restore" data-record-type="${type}" data-record-id="${id}" aria-label="Restore ${esc(label)}">↩ Restore</button><button type="button" class="record-delete-forever" data-record-action="delete" data-record-type="${type}" data-record-id="${id}" data-record-label="${esc(label)}" aria-label="Permanently delete ${esc(label)}">Delete permanently</button></div>`:`<button type="button" class="record-trash-button" data-record-action="archive" data-record-type="${type}" data-record-id="${id}" aria-label="Move ${esc(label)} to trash" title="Move to trash">🗑</button>`}
function wireOwnerRecordActions(box,type,inTrash,reload){box.querySelectorAll('[data-record-view-toggle]').forEach(button=>button.onclick=()=>{if(type==='order')orderTrashView=!orderTrashView;else reservationTrashView=!reservationTrashView;reload()});box.querySelectorAll('[data-record-action]').forEach(button=>button.onclick=async()=>{const action=button.dataset.recordAction,id=Number(button.dataset.recordId),label=button.dataset.recordLabel||`${type} #${id}`;if(action==='delete'&&!window.confirm(`Permanently delete ${label}? This cannot be undone.`))return;button.disabled=true;const original=button.textContent;button.textContent=action==='delete'?'Deleting...':action==='restore'?'Restoring...':'Moving...';try{await api('api/record_trash.php',{method:'POST',body:JSON.stringify({type,action,id})});await reload()}catch(error){alert(error.message);button.disabled=false;button.textContent=original}})}
function cancellationForm(type,id,isOwner){return `<details class="cancellation-details"><summary>Cancel ${type==='order'?'order':'reservation'}</summary><form class="cancellation-form" data-cancel-type="${type}" data-cancel-id="${id}"><label>Reason<select name="reason" required>${Object.entries(cancelReasons).filter(([key])=>key!=='owner_cancelled'||isOwner).map(([key,label])=>`<option value="${key}">${esc(label)}</option>`).join('')}</select></label><label class="cancellation-other" hidden>Tell us more<input name="other_reason" maxlength="300" disabled></label><button type="submit">Confirm cancellation</button></form></details>`}
function wireCancellationForms(box,reload){box.querySelectorAll('.cancellation-form').forEach(form=>{const select=form.elements.reason,other=form.querySelector('.cancellation-other'),input=form.elements.other_reason;select.onchange=()=>{const show=select.value==='other';other.hidden=!show;input.disabled=!show;input.required=show};form.onsubmit=async event=>{event.preventDefault();const button=form.querySelector('button');button.disabled=true;button.textContent='Cancelling...';try{const type=form.dataset.cancelType,body={id:Number(form.dataset.cancelId),order_id:Number(form.dataset.cancelId),reason:select.value,other_reason:input.value.trim()};await api(type==='order'?'api/order_cancel.php':'api/appointment_cancel.php',{method:'POST',body:JSON.stringify(body)});await reload()}catch(error){alert(error.message);button.disabled=false;button.textContent='Confirm cancellation'}}})}
function reservationCard(a,isOwner,inTrash=false){
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
 const ownerControl=isOwner&&!inTrash&&status!=='cancelled'?`<div class="owner-status-control reservation-status-control">Update status <select data-reservation-status data-id="${a.id}">${Object.entries(statusLabels).filter(([key])=>key!=='cancelled').map(([k,v])=>`<option value="${k}" ${k===status?'selected':''}>${v}</option>`).join('')}</select></div>`:'';
 const canCancel=status!=='cancelled'&&(isOwner||['pending','confirmed'].includes(status));
 const cancelAction=canCancel&&!inTrash?cancellationForm('reservation',a.id,isOwner):'';
 const cancelReason=status==='cancelled'&&a.cancellation_reason?`<p class="cancellation-reason"><b>Cancellation reason:</b> ${esc(a.cancellation_reason)}</p>`:'';
 const label=a.reference||('PC-'+String(a.id).padStart(6,'0'));
 return `<article class="reservation-card ${isOwner?'owner-reservation-card':''}"><div class="reservation-card-head"><div><b>${esc(label)}</b><small>Reserved ${esc(new Date(a.created_at).toLocaleString())}</small></div><div class="record-card-actions"><span class="status-pill status-${esc(status)}">${esc(statusLabels[status]||status)}</span>${ownerRecordButtons('reservation',a.id,label,isOwner,inTrash)}</div></div><div class="reservation-details">${body}</div>${cancelReason}${ownerControl}${cancelAction}</article>`;
}
function orderCard(o,isOwner,inTrash=false){
 const messages=(o.messages||[]).map(m=>`<div class="order-message-item"><div><b>👑 ${esc(m.owner_name||'PawCare Owner')}</b><small>${new Date(m.created_at).toLocaleString()}</small></div><p>${esc(m.message)}</p></div>`).join('');
 const ownerComposer=isOwner&&!inTrash?`<div class="owner-order-message"><label>Message customer about this order</label><textarea data-order-message="${o.id}" placeholder="Example: Thank you for your order! We are preparing your items now."></textarea><button type="button" data-send-order-message="${o.id}">Send message</button></div>`:'';
 const ownerStatus=isOwner&&!inTrash&&o.order_status!=='cancelled'?`<div class="owner-status-control">Update status <select data-status-id="${o.id}">${Object.entries(labels).filter(([key])=>key!=='cancelled').map(([k,v])=>`<option value="${k}" ${k===o.order_status?'selected':''}>${v}</option>`).join('')}</select></div>`:'';
 const fulfillment=o.fulfillment_method==='pickup'?`Store pickup · ${esc(o.pickup_branch||'PawCare location')}`:'Home delivery';
 const cancelHistory=(o.history||[]).slice().reverse().find(h=>h.status==='cancelled');
 const cancelReason=cancelHistory?.note?`<p class="cancellation-reason"><b>Cancellation reason:</b> ${esc(cancelHistory.note.replace(/^Cancellation reason:\s*/i,''))}</p>`:'';
 const hasStarted=(o.history||[]).some(h=>['processing','shipped','delivered'].includes(h.status));
 const canCancel=!inTrash&&o.order_status!=='cancelled'&&(isOwner||(o.order_status==='placed'&&!hasStarted));
 const label=`Order #${o.id}`;
 return `<article class="order-card ${isOwner?'owner-order-card':''}"><div class="order-card-head"><div><b>${label}</b><small>${new Date(o.created_at).toLocaleString()}</small></div><div class="record-card-actions"><span class="status-pill status-${o.order_status}">${labels[o.order_status]||o.order_status}</span>${ownerRecordButtons('order',o.id,label,isOwner,inTrash)}</div></div><p class="order-fulfillment"><b>${fulfillment}</b></p>${isOwner?`<div class="owner-customer"><b>${esc(o.customer_name||o.full_name||'Customer')}</b>${esc(o.customer_email||'')}<br>${esc(o.phone||'')} · ${esc(o.city||'')}</div>`:''}<div class="order-items">${(o.items||[]).map(i=>`<div class="order-item"><span>${esc(i.name)} × ${i.qty}</span><b>${money(i.price*i.qty)}</b></div>`).join('')}</div><div class="order-total"><span>Total</span><b>${money(o.total)}</b></div>${tracking(o)}${cancelReason}${messages?`<div class="order-messages"><strong>💬 Message from PawCare</strong>${messages}</div>`:''}${ownerComposer}${ownerStatus}${canCancel?cancellationForm('order',o.id,isOwner):''}</article>`}
function setAvatarEls(p){const els=[['miniAvatarImg','miniInitials'],['profileAvatarImg','profileInitials']];els.forEach(([imgId,initId])=>{const img=document.getElementById(imgId),init=document.getElementById(initId);if(p.avatar_url){img.src=p.avatar_url;img.hidden=false;init.hidden=true}else{img.hidden=true;init.hidden=false;init.textContent=initials(p.nickname||p.profile_name||p.name)}})}
async function loadProfile(){const d=await api('api/profile.php');profile=d.profile;const isOwner=profile.role==='owner';document.body.classList.toggle('is-owner',isOwner);document.body.classList.toggle('is-user',!isOwner);document.querySelectorAll('.owner-only').forEach(el=>{el.hidden=!isOwner});document.querySelector('.role-chip').textContent=isOwner?'👑 OWNER ACCOUNT':'USER ACCOUNT';document.querySelector('.big-role-indicator').textContent=isOwner?'👑 OWNER MODE':'● CUSTOMER';const display=profile.nickname||profile.profile_name||profile.name;document.getElementById('miniName').textContent=display;document.getElementById('miniEmail').textContent=profile.email;document.getElementById('miniInitials').textContent=initials(display);document.getElementById('profileInitials').textContent=initials(display);document.getElementById('profileHello').textContent=display+'!';document.getElementById('fullNameInput').value=profile.name||'';document.getElementById('nicknameInput').value=profile.nickname||profile.profile_name||'';document.getElementById('emailInput').value=profile.email||'';document.getElementById('phoneInput').value=profile.phone||'—';setAvatarEls(profile)}
async function loadOrders(){const box=document.getElementById('accountOrders');box.innerHTML='<div class="account-loading">Loading orders...</div>';try{const d=await api(`api/orders.php${orderTrashView?'?view=trash':''}`),isOwner=d.role==='owner';box.innerHTML=ownerRecordToolbar('order',isOwner,orderTrashView)+(d.orders?.length?d.orders.map(o=>orderCard(o,isOwner,orderTrashView)).join(''):`<div class="account-loading">${orderTrashView?'Trash is empty.':'No orders yet.'}</div>`);wireCancellationForms(box,loadOrders);if(isOwner)wireOwnerRecordActions(box,'order',orderTrashView,loadOrders);box.querySelectorAll('[data-status-id]').forEach(sel=>sel.onchange=async()=>{try{await api('api/owner_orders.php',{method:'POST',body:JSON.stringify({order_id:sel.dataset.statusId,status:sel.value})});loadOrders()}catch(e){alert(e.message);loadOrders()}});box.querySelectorAll('[data-send-order-message]').forEach(btn=>btn.onclick=async()=>{const ta=box.querySelector(`[data-order-message="${btn.dataset.sendOrderMessage}"]`);if(!ta||!ta.value.trim())return;btn.disabled=true;try{await api('api/order_messages.php',{method:'POST',body:JSON.stringify({order_id:btn.dataset.sendOrderMessage,message:ta.value.trim()})});loadOrders()}catch(e){alert(e.message);btn.disabled=false}})}catch(e){box.innerHTML=`<div class="account-loading">${esc(e.message)}</div>`}}
async function loadReservations(){
 const box=document.getElementById('accountReservations'); if(!box)return;
 box.innerHTML='<div class="account-loading">Loading reservations...</div>';
 try{
  const d=await api(`api/appointments.php${reservationTrashView?'?view=trash':''}`); const isOwner=d.role==='owner'; const arr=d.appointments||[];
  box.innerHTML=ownerRecordToolbar('reservation',isOwner,reservationTrashView)+(arr.length?arr.map(a=>reservationCard(a,isOwner,reservationTrashView)).join(''):`<div class="account-loading">${reservationTrashView?'Trash is empty.':'No reservations yet.'}</div>`);
  if(isOwner)wireOwnerRecordActions(box,'reservation',reservationTrashView,loadReservations);
  wireCancellationForms(box,loadReservations);
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
  const ratings=arr.filter(f=>f.sender_role!=='owner'&&Number(f.rating)>0);
  const average=ratings.length?ratings.reduce((sum,f)=>sum+Number(f.rating),0)/ratings.length:0;
  const groups=new Map();
  ratings.forEach(f=>{const key=f.product_id;const current=groups.get(key)||{name:f.product_name||'Product',count:0,total:0};current.count++;current.total+=Number(f.rating);groups.set(key,current)});
  box.innerHTML=`<div class="feedback-summary"><b>Overall customer rating</b><strong>${average.toFixed(2)} / 5</strong><span>${ratings.length} rating${ratings.length===1?'':'s'}</span><div class="feedback-summary-products">${[...groups.values()].map(g=>`<span>${esc(g.name)} · ${(g.total/g.count).toFixed(2)} / 5 (${g.count})</span>`).join('')}</div></div>`+
   arr.map(f=>`<article class="owner-feedback-card">
    <div class="meta"><b>${esc(f.product_name||'Product')}</b><span>by ${esc(f.user_name||'Customer')}</span><span>${esc(new Date(f.created_at).toLocaleString())}</span></div>
    <div class="feedback-entry-rating">${Number(f.rating)?`${'★'.repeat(Math.min(5,Number(f.rating)))}${'☆'.repeat(5-Math.min(5,Number(f.rating)))}`:'No rating'}</div>
    <p>${esc(f.comment||'Rating only; no comment.')}</p>
    ${f.user_id&&f.comment?`<button type="button" class="open-customer-message" data-open-customer="${f.user_id}" data-product-id="${f.product_id}" data-feedback-id="${f.id}">Open customer messages</button>`:''}
   </article>`).join('');
  box.querySelectorAll('[data-open-customer]').forEach(btn=>btn.onclick=async()=>{await selectSection('messages');await loadMessages();});
 }catch(e){box.innerHTML=`<div class="account-loading">${esc(e.message)}</div>`}
}

async function loadOverview(month=overviewMonth,year=overviewYear){
 const box=document.getElementById('accountOverview'); if(!box)return;
 overviewMonth=Number(month);overviewYear=Number(year);
 box.innerHTML='<div class="account-loading">Loading overview...</div>';
 try{
  const d=await api(`api/owner_overview.php?month=${overviewMonth}&year=${overviewYear}`),s=d.sales||{},r=d.ratings||{},selected=d.selected_month||{};
  overviewMonth=Number(selected.month||overviewMonth);overviewYear=Number(selected.year||overviewYear);
  const monthLabel=overviewMonthNames[overviewMonth-1]||'Month';
  const years=[...new Set([overviewYear,...(d.years||[]).map(Number)])].sort((a,b)=>b-a);
  const ratingMonths=(d.monthly_ratings||[]).map(m=>`<tr><td>${esc(m.month)}</td><td>${Number(m.count||0)}</td><td>${Number(m.average||0).toFixed(2)} / 5</td></tr>`).join('');
  box.innerHTML=`<div class="owner-account-panel">
  <div class="overview-sales-controls"><h3>Monthly sales</h3>${monthlySalesPicker(overviewMonth,overviewYear,years)}</div>
  <h2>Overall performance</h2><div class="owner-summary-grid">
   <div><b>${Number(s.orders||0)}</b><span>Completed and active orders</span></div><div><b>${money(s.sales)}</b><span>All-time sales</span></div>
   <div><b>${Number(r.average||0).toFixed(2)} / 5</b><span>Overall customer rating (${Number(r.count||0)} ratings)</span></div>
  </div><div class="overview-month-result"><span>${monthLabel} ${overviewYear}</span><div><span>Orders <b>${Number(selected.orders||0)}</b></span><strong>${money(selected.sales)}</strong></div></div>
  <h2>This month</h2><div class="owner-summary-grid">
   <div><b>${Number(s.month_orders||0)}</b><span>Orders</span></div><div><b>${money(s.month_sales)}</b><span>Sales</span></div>
   <div><b>${Number(r.month_average||0).toFixed(2)} / 5</b><span>Customer rating (${Number(r.month_count||0)} ratings)</span></div>
  </div><div class="overview-tables"><div><h3>Monthly feedback</h3><table><thead><tr><th>Month</th><th>Ratings</th><th>Average</th></tr></thead><tbody>${ratingMonths||'<tr><td colspan="3">No ratings recorded.</td></tr>'}</tbody></table></div></div>
  </div>`;
  box.querySelector('[data-sales-year]')?.addEventListener('change',event=>loadOverview(overviewMonth,Number(event.target.value)));
  box.querySelectorAll('[data-sales-month]').forEach(button=>button.addEventListener('click',()=>loadOverview(Number(button.dataset.salesMonth),overviewYear)));
 }catch(e){box.innerHTML=`<div class="account-loading">${esc(e.message)}</div>`}
}

let selectedConversation=0;
async function loadInventory(){
 const box=document.getElementById('accountInventory');if(!box)return;box.innerHTML='<div class="account-loading">Loading product inventory...</div>';
 try{const products=await api('api/products.php'),groups=new Map();products.forEach(p=>{const list=groups.get(p.category)||[];list.push(p);groups.set(p.category,list)});
  box.innerHTML=window.PawCareInventory.formMarkup()+([...groups.entries()].map(([category,items])=>`<section class="inventory-category"><h2>${esc(category)}</h2>${items.map(p=>`<form class="inventory-product" data-inventory-form="${p.id}"><div><b>${esc(p.name)}</b><small>${esc(p.subcategory||'Product')}</small><span class="${Number(p.stock)===0?'stock-empty':'stock-available'}">${Number(p.stock)===0?'Out of stock':`${Number(p.stock)} in stock`}</span></div><label>Price (₱)<input name="price" type="number" min="0.01" step="0.01" value="${Number(p.price).toFixed(2)}" required></label><label>Stock<input name="stock" type="number" min="0" max="1000000" step="1" value="${Number(p.stock)}" required></label><button type="submit">Save</button><span class="inventory-save-status" aria-live="polite"></span></form>`).join('')}</section>`).join('')||'<div class="account-loading">No products found.</div>');
  window.PawCareInventory.wireCreate(box,api,loadInventory);
  box.querySelectorAll('[data-inventory-form]').forEach(form=>form.onsubmit=async e=>{e.preventDefault();const button=form.querySelector('button'),status=form.querySelector('.inventory-save-status'),data=new FormData(form);button.disabled=true;status.textContent='Saving...';try{await api('api/products.php',{method:'PUT',body:JSON.stringify({product_id:Number(form.dataset.inventoryForm),price:Number(data.get('price')),stock:Number(data.get('stock'))})});status.textContent='Saved';setTimeout(()=>{if(status.isConnected)status.textContent=''},1800)}catch(error){status.textContent=error.message}finally{button.disabled=false}});
 }catch(e){box.innerHTML=`<div class="account-loading">${esc(e.message)}</div>`}
}
async function openConversation(id){
 const thread=document.getElementById('accountConversationThread'),draft=thread.querySelector('[name="message"]')?.value||'';selectedConversation=Number(id);
 try{const d=await api(`api/product_conversations.php?id=${selectedConversation}`),c=d.conversation,owner=d.role==='owner';
  const messages=(d.messages||[]).map(m=>`<div class="product-message ${m.sender_role==='system'?'system':m.sender_role===d.role?'mine':'theirs'}"><b>${esc(m.sender_name||'PawCare')}</b><p>${esc(m.message)}</p><small>${esc(new Date(m.created_at).toLocaleString())}</small></div>`).join('');
  const preorder=c.kind==='preorder'?`<div class="preorder-status">Preorder · ${esc(c.status)} · ${Number(c.preorder_qty)} requested</div>`:'';
  const rating=c.feedback_rating?`<span class="conversation-rating">Customer rating: ${'★'.repeat(Number(c.feedback_rating))}${'☆'.repeat(5-Number(c.feedback_rating))}</span>`:'';
  const approval=owner&&c.kind==='preorder'&&c.status==='pending'?`<div class="preorder-actions"><button type="button" data-preorder-status="approved">Approve request</button><button type="button" data-preorder-status="rejected">Decline</button></div>`:'';
  thread.innerHTML=`<header><div><b>${esc(c.product_name)}</b><small>${owner?`Customer: ${esc(c.customer_name)}`:'PawCare customer support'} · ${money(c.price)} · ${Number(c.stock)} in stock</small>${rating}</div>${preorder}</header><div class="product-message-history">${messages||'<p>No messages yet.</p>'}</div>${approval}<div class="quick-replies"><span>Quick replies</span><button type="button" data-quick-reply="Thank you for reaching out! How can I help?">Thank you</button><button type="button" data-quick-reply="We are checking this for you and will follow up shortly.">We are checking</button></div><form class="product-message-compose"><textarea name="message" maxlength="1000" placeholder="Write a message..." required></textarea><button type="submit">Send message</button></form>`;
  const history=thread.querySelector('.product-message-history');history.scrollTop=history.scrollHeight;
  thread.querySelector('[name="message"]').value=draft;
  thread.querySelectorAll('[data-quick-reply]').forEach(b=>b.onclick=()=>{thread.querySelector('[name="message"]').value=b.dataset.quickReply});
  thread.querySelector('.product-message-compose').onsubmit=async e=>{e.preventDefault();const form=e.currentTarget,field=form.elements.message,button=form.querySelector('button[type="submit"]');if(!field.value.trim())return;button.disabled=true;try{await api('api/product_conversations.php',{method:'PUT',body:JSON.stringify({id:selectedConversation,conversation_id:selectedConversation,message:field.value.trim()})});await openConversation(selectedConversation);await loadMessages()}catch(err){alert(err.message);button.disabled=false}};
  thread.querySelectorAll('[data-preorder-status]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await api('api/product_conversations.php',{method:'PATCH',body:JSON.stringify({id:selectedConversation,conversation_id:selectedConversation,status:b.dataset.preorderStatus})});await openConversation(selectedConversation);await loadMessages()}catch(err){alert(err.message);b.disabled=false}});
  await loadMessages(false);
 }catch(e){thread.innerHTML=`<div class="account-loading">${esc(e.message)}</div>`}
}
async function loadMessages(keepThread=true){
 const list=document.getElementById('accountConversationList');if(!list)return;
 try{const d=await api('api/product_conversations.php'),items=d.conversations||[],unread=items.reduce((sum,c)=>sum+Number(c.unread_count||0),0),badge=document.getElementById('messageUnreadBadge');badge.hidden=unread===0;badge.textContent=unread>99?'99+':String(unread);
  list.innerHTML=items.map(c=>`<button type="button" class="product-conversation-item ${Number(c.id)===selectedConversation?'active':''}" data-conversation-id="${c.id}"><b>${esc(c.product_name)}${c.feedback_rating?` · ★ ${Number(c.feedback_rating)}/5`:''}</b><span>${d.role==='owner'?esc(c.customer_name):esc(c.kind==='preorder'?'Preorder request':'Product support')} · ${esc(c.status)}</span><small>${esc(c.last_message||'No messages')}</small>${Number(c.unread_count)>0?`<i>${Number(c.unread_count)}</i>`:''}</button>`).join('')||'<div class="account-loading">No messages yet. Product questions and reviews will appear here.</div>';
  list.querySelectorAll('[data-conversation-id]').forEach(b=>b.onclick=()=>openConversation(b.dataset.conversationId));
  if(keepThread&&selectedConversation&&items.some(c=>Number(c.id)===selectedConversation))await openConversation(selectedConversation);
  return items;
 }catch(e){list.innerHTML=`<div class="account-loading">${esc(e.message)}</div>`}
}
document.getElementById('accountFeedback')?.addEventListener('click',async event=>{
 const button=event.target.closest('[data-open-customer]');if(!button)return;
 await selectSection('messages');
 const items=await loadMessages(false)||[];
 let conversation=items.find(item=>Number(item.feedback_id)===Number(button.dataset.feedbackId));
 if(!conversation){try{const created=await api('api/product_conversations.php',{method:'POST',body:JSON.stringify({feedback_id:Number(button.dataset.feedbackId)})});conversation={id:created.conversation_id}}catch(error){alert(error.message);return}}
 await openConversation(conversation.id);
});
async function selectSection(name){document.querySelectorAll('.side-link[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===name));document.querySelectorAll('.account-section').forEach(s=>s.classList.toggle('active',s.id==='section-'+name));const titles={profile:['Profile','Manage your PawCare profile and personal details.'],orders:[document.body.classList.contains('is-owner')?'Orders':'My Orders',document.body.classList.contains('is-owner')?'View customer orders and update delivery status.':'Track your deliveries from order placed to delivered.'],reservations:[document.body.classList.contains('is-owner')?'Reservations':'My Reservations',document.body.classList.contains('is-owner')?'View and manage customer service reservations.':'See the service you reserved and all the details you submitted.'],messages:['Messages','Product questions, ratings, replies, and preorder updates.'],inventory:['Product Inventory','Edit prices and stock. Products at zero stock can be requested as preorders.'],feedback:['Customer Feedback','Review customer comments, ratings, and monthly scores.'],overview:['Business Overview','Monthly and all-time sales and rating summaries.']};const t=titles[name]||titles.profile;document.getElementById('accountTitle').textContent=t[0];document.getElementById('accountSubtitle').textContent=t[1];if(name==='orders')loadOrders();if(name==='reservations')loadReservations();if(name==='messages')loadMessages();if(name==='inventory')loadInventory();if(name==='feedback')loadFeedback();if(name==='overview')loadOverview();history.replaceState(null,'','#'+name)}
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
const hash=location.hash.replace('#','');if(['profile','orders','reservations','messages','inventory','feedback','overview'].includes(hash))selectSection(hash);else selectSection('profile');
setInterval(()=>{const active=document.getElementById('section-messages')?.classList.contains('active');loadMessages(active)},8000);
})();
