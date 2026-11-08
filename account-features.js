/* PawCare additions: customer order tracking + owner dashboard + feedback. */
(function(){
'use strict';
const api=(url,opt={})=>fetch(url,{credentials:'same-origin',headers:{'Content-Type':'application/json'},...opt}).then(async r=>{const t=await r.text();let d={};try{d=t?JSON.parse(t):{}}catch(e){throw Error('Server returned invalid JSON.')}if(!r.ok)throw Error(d.error||'Request failed');return d;});
const money=n=>'₱'+Number(n||0).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
const labels={placed:'Order placed',processing:'Packed / processing',shipped:'On the way',delivered:'Delivered',cancelled:'Cancelled'};
const cancelReasons={found_another_product:'I found another product',ordered_by_mistake:'I ordered by mistake',changed_my_mind:'I changed my mind',delivery_takes_too_long:'The delivery takes too long',other:'Other',owner_cancelled:'Cancel on behalf of the customer'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let orderTrashView=false;
let overviewMonth=new Date().getMonth()+1,overviewYear=new Date().getFullYear();
const overviewMonthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
function orderTrashToolbar(inTrash){return `<div class="record-trash-toolbar"><div><b>${inTrash?'Trash':'All orders'}</b><small>${inTrash?'Archived records are hidden from the active list.':'Move old records to trash to tidy this list.'}</small></div><button type="button" class="record-trash-toggle" data-order-trash-toggle>${inTrash?'← Back to orders':'🗑 View trash'}</button></div>`}
function monthlySalesPicker(month,year,years){return `<div class="overview-month-picker"><label>Year<select data-sales-year>${years.map(value=>`<option value="${value}" ${Number(value)===Number(year)?'selected':''}>${value}</option>`).join('')}</select></label><div class="overview-month-tabs" role="tablist" aria-label="Select sales month">${overviewMonthNames.map((name,index)=>`<button type="button" role="tab" aria-selected="${index+1===Number(month)}" class="${index+1===Number(month)?'active':''}" data-sales-month="${index+1}">${name}</button>`).join('')}</div></div>`}
function orderTrashButton(id,inTrash){const label=`Order #${id}`;return inTrash?`<div class="record-owner-actions"><button type="button" data-record-action="restore" data-record-id="${id}">↩ Restore</button><button type="button" class="record-delete-forever" data-record-action="delete" data-record-id="${id}" data-record-label="${esc(label)}">Delete permanently</button></div>`:`<button type="button" class="record-trash-button" data-record-action="archive" data-record-id="${id}" aria-label="Move ${label} to trash" title="Move to trash">🗑</button>`}
function wireOrderTrash(panel,reload,inTrash){panel.querySelector('[data-order-trash-toggle]')?.addEventListener('click',()=>{orderTrashView=!orderTrashView;reload()});panel.querySelectorAll('[data-record-action]').forEach(button=>button.onclick=async()=>{const action=button.dataset.recordAction,id=Number(button.dataset.recordId);if(action==='delete'&&!window.confirm(`Permanently delete ${button.dataset.recordLabel}? This cannot be undone.`))return;const text=button.textContent;button.disabled=true;button.textContent=action==='delete'?'Deleting...':action==='restore'?'Restoring...':'Moving...';try{await api('api/record_trash.php',{method:'POST',body:JSON.stringify({type:'order',action,id})});await reload()}catch(error){alert(error.message);button.disabled=false;button.textContent=text}})}
function cancellationForm(id,owner){return `<details class="cancellation-details"><summary>Cancel order</summary><form class="cancellation-form" data-cancel-type="order" data-cancel-id="${id}"><label>Reason<select name="reason" required>${Object.entries(cancelReasons).filter(([key])=>key!=='owner_cancelled'||owner).map(([key,label])=>`<option value="${key}">${esc(label)}</option>`).join('')}</select></label><label class="cancellation-other" hidden>Tell us more<input name="other_reason" maxlength="300" disabled></label><button type="submit">Confirm cancellation</button></form></details>`}
function wireCancellationForms(box,reload){box.querySelectorAll('.cancellation-form').forEach(form=>{const select=form.elements.reason,other=form.querySelector('.cancellation-other'),input=form.elements.other_reason;select.onchange=()=>{const show=select.value==='other';other.hidden=!show;input.disabled=!show;input.required=show};form.onsubmit=async event=>{event.preventDefault();const button=form.querySelector('button');button.disabled=true;button.textContent='Cancelling...';try{await api('api/order_cancel.php',{method:'POST',body:JSON.stringify({order_id:Number(form.dataset.cancelId),reason:select.value,other_reason:input.value.trim()})});await reload()}catch(error){alert(error.message);button.disabled=false;button.textContent='Confirm cancellation'}}})}
function tracking(o){
 const states=['placed','processing','shipped','delivered'], cur=o.order_status, idx=states.indexOf(cur);
 if(cur==='cancelled') return `<div class="tracking cancelled">${states.slice(0,3).map(x=>`<div class="track-step"><span>✓</span><small>${labels[x]}</small></div>`).join('')}<div class="track-step current"><span>×</span><small>Cancelled</small></div></div>`;
 return `<div class="tracking">${states.map((x,i)=>`<div class="track-step ${i<=idx?'done':''} ${x===cur?'current':''}"><span>${i<idx?'✓':i===idx?'●':'○'}</span><small>${labels[x]}</small></div>`).join('')}</div>`;
}
function orderCard(o,owner=false,inTrash=false){
 const items=(o.items||[]).map(i=>`<div class="order-item"><span>${esc(i.name)} × ${i.qty}</span><b>${money(i.price*i.qty)}</b></div>`).join('');
 const statusOptions=['placed','processing','shipped','delivered'].map(s=>`<option value="${s}" ${s===o.order_status?'selected':''}>${labels[s]}</option>`).join('');
 const fulfillment=o.fulfillment_method==='pickup'?`Store pickup · ${esc(o.pickup_branch||'PawCare location')}`:'Home delivery';
 const cancelHistory=(o.history||[]).slice().reverse().find(h=>h.status==='cancelled');
 const cancelReason=cancelHistory?.note?`<p class="cancellation-reason"><b>Cancellation reason:</b> ${esc(cancelHistory.note.replace(/^Cancellation reason:\\s*/i,''))}</p>`:'';
 const hasStarted=(o.history||[]).some(h=>['processing','shipped','delivered'].includes(h.status));
 const cancelAction=!inTrash&&o.order_status!=='cancelled'&&(owner||(o.order_status==='placed'&&!hasStarted))?cancellationForm(o.id,owner):'';
 return `<article class="order-card">
  <div class="order-card-head"><div><b>Order #${o.id}</b><small>${new Date(o.created_at).toLocaleString()}</small></div><div class="record-card-actions"><span class="status-pill status-${o.order_status}">${labels[o.order_status]||o.order_status}</span>${owner?orderTrashButton(o.id,inTrash):''}</div></div>
  <p class="order-fulfillment"><b>${fulfillment}</b></p>
  ${owner?`<div class="customer-box"><b>${esc(o.customer_name)}</b><span>${esc(o.customer_email)}</span><span>${esc(o.phone||'')}</span><span>${esc(o.line1)}, ${esc(o.city)}, ${esc(o.province)} ${esc(o.postal_code)}</span></div>`:''}
  <div class="order-items">${items}</div><div class="order-total"><span>Total</span><b>${money(o.total)}</b></div>${tracking(o)}${cancelReason}${cancelAction}
  ${owner&&!inTrash&&o.order_status!=='cancelled'?`<div class="owner-order-action"><label>Update status <select data-order-status data-id="${o.id}">${statusOptions}</select></label></div>`:''}
 </article>`;
}
async function initUserOrders(){
 const msg=document.getElementById('ordersMessage'),list=document.getElementById('ordersList');
 try{const d=await api('api/orders.php'); if(!d.orders.length){msg.textContent='You have no orders yet.';return;} msg.hidden=true; list.innerHTML=d.orders.map(o=>orderCard(o)).join('');wireCancellationForms(list,initUserOrders)}
 catch(e){msg.textContent=e.message;}
}
function initOwner(){
 const tabs=[...document.querySelectorAll('.owner-tab')], panels={orders:document.getElementById('ownerOrdersPanel'),messages:document.getElementById('ownerMessagesPanel'),inventory:document.getElementById('ownerInventoryPanel'),feedback:document.getElementById('ownerFeedbackPanel'),overview:document.getElementById('ownerOverviewPanel')};
 let selectedConversation=0;
 tabs.forEach(t=>t.onclick=()=>{tabs.forEach(x=>x.classList.toggle('active',x===t));Object.entries(panels).forEach(([k,p])=>{if(p)p.hidden=k!==t.dataset.tab});if(t.dataset.tab==='orders')loadOwnerOrders();if(t.dataset.tab==='messages')loadOwnerMessages();if(t.dataset.tab==='inventory')loadInventory();if(t.dataset.tab==='feedback')loadFeedback();if(t.dataset.tab==='overview')loadOverview();});
 document.getElementById('ownerLogout')?.addEventListener('click',async()=>{await api('api/logout.php',{method:'POST'}).catch(()=>{});location.href='index.html';});
 loadOwnerOrders();
 setInterval(()=>loadOwnerMessages(!panels.messages?.hidden),8000);
 panels.overview.addEventListener('click',event=>{const button=event.target.closest('[data-sales-month]');if(button)loadOverview(Number(button.dataset.salesMonth),overviewYear)});
 panels.overview.addEventListener('change',event=>{if(event.target.matches('[data-sales-year]'))loadOverview(overviewMonth,Number(event.target.value))});
 async function loadOwnerOrders(){
  const p=panels.orders;p.innerHTML='<div class="orders-message">Loading orders...</div>';
  try{const d=await api(`api/orders.php${orderTrashView?'?view=trash':''}`);p.innerHTML=orderTrashToolbar(orderTrashView)+(d.orders.length?d.orders.map(o=>orderCard(o,true,orderTrashView)).join(''):`<div class="empty-owner">${orderTrashView?'Trash is empty.':'No customer orders yet.'}</div>`);
   wireOrderTrash(p,loadOwnerOrders,orderTrashView);
   wireCancellationForms(p,loadOwnerOrders);
   p.querySelectorAll('[data-order-status]').forEach(sel=>sel.onchange=async()=>{try{await api('api/owner_orders.php',{method:'POST',body:JSON.stringify({order_id:sel.dataset.id,status:sel.value})});loadOwnerOrders();}catch(e){alert(e.message);loadOwnerOrders();}});
  }catch(e){p.innerHTML=`<div class="orders-message">${esc(e.message)}</div>`;}
 }
 async function loadFeedback(){
  const p=panels.feedback;p.innerHTML='<div class="orders-message">Loading feedback...</div>';
 try{const d=await api('api/product_feedback.php');const f=(d.feedback||[]).filter(x=>x.user_id);const ratings=f.filter(x=>Number(x.rating));const average=ratings.length?ratings.reduce((sum,x)=>sum+Number(x.rating),0)/ratings.length:0;
  p.innerHTML=`<div class="feedback-summary"><b>Overall customer rating</b><strong>${average.toFixed(2)} / 5</strong><span>${ratings.length} ratings</span></div>`+(f.length?f.map(x=>`<article class="feedback-card"><div class="feedback-meta"><b>${esc(x.product_name)}</b><span>from ${esc(x.user_name||'Customer')}</span><small>${new Date(x.created_at).toLocaleString()}</small></div><div class="feedback-entry-rating" aria-label="${Number(x.rating)||0} out of 5 stars">${Number(x.rating)?`${'★'.repeat(Math.min(5,Number(x.rating)))}${'☆'.repeat(5-Math.min(5,Number(x.rating)))}`:'No rating'}</div><p>${esc(x.comment||'Rating only; no comment.')}</p>${x.comment?`<button type="button" class="open-customer-message" data-open-feedback="${x.user_id}" data-product-id="${x.product_id}" data-feedback-id="${x.id}">Open customer conversation</button>`:''}</article>`).join(''):'<div class="empty-owner">No product feedback yet.</div>');
  p.querySelectorAll('[data-open-feedback]').forEach(b=>b.onclick=async()=>{let match;try{const list=(await api('api/product_conversations.php')).conversations;match=list.find(c=>Number(c.feedback_id)===Number(b.dataset.feedbackId));if(!match){const created=await api('api/product_conversations.php',{method:'POST',body:JSON.stringify({feedback_id:Number(b.dataset.feedbackId)})});match={id:created.conversation_id}}}catch(error){alert(error.message);return}panels.messages.hidden=false;panels.feedback.hidden=true;tabs.forEach(t=>t.classList.toggle('active',t.dataset.tab==='messages'));await loadOwnerMessages(false);openOwnerConversation(match.id)});
 }catch(e){p.innerHTML=`<div class="orders-message">${esc(e.message)}</div>`;}
}
async function loadInventory(){
 const p=panels.inventory;p.innerHTML='<div class="orders-message">Loading inventory...</div>';
 try{const products=await api('api/products.php'),groups=new Map();products.forEach(x=>{const group=groups.get(x.category)||[];group.push(x);groups.set(x.category,group)});
  p.innerHTML=window.PawCareInventory.formMarkup()+([...groups].map(([category,items])=>`<section class="inventory-category"><h2>${esc(category)}</h2>${items.map(x=>`<form class="inventory-product" data-product-id="${x.id}"><div><b>${esc(x.name)}</b><small>${esc(x.subcategory||'Product')}</small><span class="${Number(x.stock)===0?'stock-empty':'stock-available'}">${Number(x.stock)===0?'Out of stock':`${Number(x.stock)} in stock`}</span></div><label>Price (₱)<input name="price" type="number" min="0.01" step="0.01" value="${Number(x.price).toFixed(2)}" required></label><label>Stock<input name="stock" type="number" min="0" max="1000000" value="${Number(x.stock)}" required></label><button type="submit">Save</button><span class="inventory-save-status"></span></form>`).join('')}</section>`).join('')||'<div class="empty-owner">No products found.</div>');
  window.PawCareInventory.wireCreate(p,api,loadInventory);
  p.querySelectorAll('.inventory-product').forEach(form=>form.onsubmit=async e=>{e.preventDefault();const data=new FormData(form),status=form.querySelector('.inventory-save-status'),button=form.querySelector('button');button.disabled=true;status.textContent='Saving...';try{await api('api/products.php',{method:'PUT',body:JSON.stringify({product_id:Number(form.dataset.productId),price:Number(data.get('price')),stock:Number(data.get('stock'))})});status.textContent='Saved'}catch(error){status.textContent=error.message}finally{button.disabled=false}});
 }catch(e){p.innerHTML=`<div class="orders-message">${esc(e.message)}</div>`}
}
async function loadOwnerMessages(refreshThread=false){
 try{const d=await api('api/product_conversations.php'),list=panels.messages.querySelector('#ownerConversationList'),items=d.conversations||[],unread=items.reduce((sum,c)=>sum+Number(c.unread_count||0),0),badge=document.getElementById('ownerMessageBadge');badge.hidden=unread===0;badge.textContent=unread>99?'99+':String(unread);
  list.innerHTML=items.map(c=>`<button type="button" class="product-conversation-item ${Number(c.id)===selectedConversation?'active':''}" data-id="${c.id}"><b>${esc(c.product_name)}${c.feedback_rating?` · ★ ${Number(c.feedback_rating)}/5`:''}</b><span>${esc(c.customer_name)} · ${esc(c.kind==='preorder'?'Preorder':'Product')} · ${esc(c.status)}</span><small>${esc(c.last_message||'No messages')}</small>${Number(c.unread_count)>0?`<i>${Number(c.unread_count)}</i>`:''}</button>`).join('')||'<div class="empty-owner">No customer messages yet.</div>';
  list.querySelectorAll('[data-id]').forEach(button=>button.onclick=()=>openOwnerConversation(button.dataset.id));
  if(refreshThread&&selectedConversation)await openOwnerConversation(selectedConversation);
 }catch(e){panels.messages.querySelector('#ownerConversationList').innerHTML=`<div class="orders-message">${esc(e.message)}</div>`}
}
async function openOwnerConversation(id){
 selectedConversation=Number(id);const thread=panels.messages.querySelector('#ownerConversationThread'),draft=thread.querySelector('[name="message"]')?.value||'';
 try{const d=await api(`api/product_conversations.php?id=${selectedConversation}`),c=d.conversation,messages=(d.messages||[]).map(m=>`<div class="product-message ${m.sender_role==='system'?'system':m.sender_role==='owner'?'mine':'theirs'}"><b>${esc(m.sender_name||'PawCare')}</b><p>${esc(m.message)}</p><small>${new Date(m.created_at).toLocaleString()}</small></div>`).join('');
  const preorder=c.kind==='preorder'?`<div class="preorder-status">Preorder · ${esc(c.status)} · ${Number(c.preorder_qty)} requested</div>`:'',actions=c.kind==='preorder'&&c.status==='pending'?'<div class="preorder-actions"><button type="button" data-status="approved">Approve request</button><button type="button" data-status="rejected">Decline</button></div>':'';
  const rating=c.feedback_rating?`<span class="conversation-rating">Customer rating: ${'★'.repeat(Number(c.feedback_rating))}${'☆'.repeat(5-Number(c.feedback_rating))}</span>`:'';
  thread.innerHTML=`<header><div><b>${esc(c.product_name)}</b><small>Customer: ${esc(c.customer_name)} · ${money(c.price)} · ${Number(c.stock)} in stock</small>${rating}</div>${preorder}</header><div class="product-message-history">${messages||'<p>No messages yet.</p>'}</div>${actions}<div class="quick-replies"><span>Quick replies</span><button type="button" data-reply="Thank you for reaching out! How can I help?">Thank you</button><button type="button" data-reply="We are checking this for you and will follow up shortly.">We are checking</button></div><form class="product-message-compose"><textarea name="message" maxlength="1000" required placeholder="Write a reply..."></textarea><button type="submit">Send message</button></form>`;
  thread.querySelector('[name="message"]').value=draft;const history=thread.querySelector('.product-message-history');history.scrollTop=history.scrollHeight;
  thread.querySelectorAll('[data-reply]').forEach(button=>button.onclick=()=>{thread.querySelector('[name="message"]').value=button.dataset.reply});
  thread.querySelector('.product-message-compose').onsubmit=async e=>{e.preventDefault();const field=e.currentTarget.elements.message;if(!field.value.trim())return;try{await api('api/product_conversations.php',{method:'PUT',body:JSON.stringify({conversation_id:selectedConversation,id:selectedConversation,message:field.value.trim()})});await openOwnerConversation(selectedConversation);await loadOwnerMessages(false)}catch(error){alert(error.message)}};
  thread.querySelectorAll('[data-status]').forEach(button=>button.onclick=async()=>{button.disabled=true;try{await api('api/product_conversations.php',{method:'PATCH',body:JSON.stringify({conversation_id:selectedConversation,id:selectedConversation,status:button.dataset.status})});await openOwnerConversation(selectedConversation);await loadOwnerMessages(false)}catch(error){alert(error.message);button.disabled=false}});
 }catch(e){thread.innerHTML=`<div class="orders-message">${esc(e.message)}</div>`}
}
async function loadOverview(month=overviewMonth,year=overviewYear){
 const p=panels.overview;overviewMonth=Number(month);overviewYear=Number(year);
 try{
  const d=await api(`api/owner_overview.php?month=${overviewMonth}&year=${overviewYear}`),s=d.sales||{},r=d.ratings||{},selected=d.selected_month||{};
  overviewMonth=Number(selected.month||overviewMonth);overviewYear=Number(selected.year||overviewYear);
  const monthLabel=overviewMonthNames[overviewMonth-1]||'Month',years=[...new Set([overviewYear,...(d.years||[]).map(Number)])].sort((a,b)=>b-a);
  const ratingMonths=(d.monthly_ratings||[]).map(m=>`<tr><td>${esc(m.month)}</td><td>${Number(m.count||0)}</td><td>${Number(m.average||0).toFixed(2)} / 5</td></tr>`).join('');
  p.innerHTML=`<div class="owner-account-panel">
   <div class="overview-sales-controls"><h3>Monthly sales</h3>${monthlySalesPicker(overviewMonth,overviewYear,years)}</div>
   <h2>Overall performance</h2><div class="owner-summary-grid">
    <div><b>${Number(s.orders||0)}</b><span>Orders</span></div>
    <div><b>${money(s.sales)}</b><span>All-time sales</span></div>
    <div><b>${Number(r.average||0).toFixed(2)} / 5</b><span>Overall rating (${Number(r.count||0)})</span></div>
   </div>
   <div class="overview-month-result"><span>${monthLabel} ${overviewYear}</span><div><span>Orders <b>${Number(selected.orders||0)}</b></span><strong>${money(selected.sales)}</strong></div></div>
   <h2>This month</h2><div class="owner-summary-grid">
    <div><b>${Number(s.month_orders||0)}</b><span>Orders</span></div>
    <div><b>${money(s.month_sales)}</b><span>Sales</span></div>
    <div><b>${Number(r.month_average||0).toFixed(2)} / 5</b><span>Customer rating (${Number(r.month_count||0)} ratings)</span></div>
   </div>
   <div class="overview-tables"><div><h3>Monthly feedback</h3><table><thead><tr><th>Month</th><th>Ratings</th><th>Average</th></tr></thead><tbody>${ratingMonths||'<tr><td colspan="3">No ratings recorded.</td></tr>'}</tbody></table></div></div>
  </div>`;
 }catch(e){p.innerHTML=`<div class="orders-message">${esc(e.message)}</div>`;}
}
}
window.PawCareOrders={initUserOrders}; window.PawCareOwner={init:initOwner};
})();