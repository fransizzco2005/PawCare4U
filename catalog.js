/* PawCare static catalog interactions. Images intentionally stay in HTML. */
(function(){
  const hero=document.querySelector('.hero');
  if(hero && !hero.querySelector('.catalog-hero-visual')){
    const animalMap={
      'page-dog':{label:'DOGS',src:'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=900&q=85'},
      'page-cat':{label:'CATS',src:'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=85'},
      'page-bird':{label:'BIRDS',src:'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=900&q=85'},
      'page-fish':{label:'FISH',src:'https://images.unsplash.com/photo-1522069169874-c58ec4b4bb49?auto=format&fit=crop&w=900&q=85'},
      'page-rodent':{label:'SMALL PETS',src:'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&w=900&q=85'}
    };
    const animal=Object.keys(animalMap).find(name=>document.body.classList.contains(name));
    const art=animalMap[animal];
    if(art){
      const visual=document.createElement('div');
      visual.className='catalog-hero-visual';
      visual.innerHTML=`<div class="catalog-hero-orbit"></div><div class="catalog-hero-frame"><img src="${art.src}" alt="${art.label.toLowerCase()} care collection"><span>${art.label}</span></div>`;
      hero.appendChild(visual);
    }
  }
  const grid=document.querySelector('.products-grid');
  if(!grid) return;
  const cards=[...grid.querySelectorAll('.product-card')];
  const count=document.querySelector('.products-count');
  const sort=document.querySelector('.sort-control select');
  const search=document.getElementById('search-input');
  const sidebar=document.querySelector('.sidebar-filters');
  const animal=document.body.className.match(/page-(dog|cat|bird|fish|small-pets)/)?.[1] || 'pet';
  const animalKey=animal==='small-pets'?'rodent':animal;
  const categories=['All categories','Food & Treats','Grooming & Beauty','Toys & Enrichment','Beds & Comfort','Feeding','Walking & Outdoor','Health & Wellness','Training','Clothing & Accessories','Travel'];
  let active='All categories', query='';

  function money(n){return '₱'+Number(n||0).toLocaleString('en-PH',{maximumFractionDigits:0});}
  function data(card){return {id:Number(card.dataset.productId),name:card.dataset.name,price:Number(card.dataset.price),oldPrice:card.dataset.oldPrice?Number(card.dataset.oldPrice):null,rating:Number(card.dataset.rating||4.5),reviews:Number(card.dataset.reviews||0),description:card.dataset.description||'A practical PawCare essential for everyday pet care.',category:animalKey,subcategory:card.dataset.subcategory,stock:Number(card.dataset.stock||100),image:card.querySelector('img')?.getAttribute('src')||''};}
  function renderSidebar(){
    if(!sidebar) return;
    sidebar.innerHTML='';
    const heading=document.createElement('div'); heading.className='filters-heading'; heading.innerHTML='<span>Filters</span>';
    sidebar.appendChild(heading);
    const group=document.createElement('div'); group.className='filter-group'; group.innerHTML='<label>Shop by category</label>';
    categories.forEach(cat=>{const label=document.createElement('label');label.className='filter-option';label.innerHTML=`<input type="radio" name="pc-sub" ${cat===active?'checked':''}> <span>${cat}</span>`;label.querySelector('input').addEventListener('change',()=>{active=cat;render()});group.appendChild(label)});
    sidebar.appendChild(group);
    const note=document.createElement('div');note.className='filter-group filter-note';note.innerHTML='<label>Catalog</label><p>20 products · 2 products in every shop category.</p>';sidebar.appendChild(note);
    const saveBtn=document.createElement('button');saveBtn.type='button';saveBtn.className='filter-save-btn';saveBtn.textContent='Save this search';
    saveBtn.addEventListener('click',()=>toast(`Search saved: ${active}`));
    sidebar.appendChild(saveBtn);
  }
  function render(){
    let list=cards.filter(c=>{
      const d=data(c), term=query.toLowerCase();
      return (active==='All categories'||d.subcategory===active) && (!term||d.name.toLowerCase().includes(term)||d.subcategory.toLowerCase().includes(term));
    });
    const mode=sort?.value||'Featured';
    list.sort((a,b)=>{const A=data(a),B=data(b); if(mode==='Price: Low to High')return A.price-B.price;if(mode==='Price: High to Low')return B.price-A.price;if(mode==='Best Rated')return B.rating-A.rating;if(mode==='Newest First')return B.id-A.id;return A.id-B.id;});
    list.forEach(c=>grid.appendChild(c));
    cards.forEach(c=>c.hidden=!list.includes(c));
    if(count) count.textContent=`Showing ${list.length} product${list.length===1?'':'s'}`;
  }
  function toast(msg){let t=document.getElementById('catalogToast');if(!t){t=document.createElement('div');t.id='catalogToast';t.className='catalog-toast';document.body.appendChild(t)}t.textContent=msg;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),2200)}
  async function apiAdd(product,qty){
    const payload={product_id:product.id,qty,product:{name:product.name,category:product.category,subcategory:product.subcategory,price:product.price,old_price:product.oldPrice,rating:product.rating,reviews:product.reviews,tag:'',stock:product.stock,image_url:product.image}};
    const r=await fetch('api/cart.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const d=await r.json(); if(!r.ok) throw new Error(d.error||'Could not add item');
    document.querySelectorAll('.icon-badge').forEach(b=>b.textContent=(d.items||[]).reduce((n,i)=>n+Number(i.qty||0),0));
    return d;
  }
  function openDetails(card){
    const p=data(card); let modal=document.getElementById('productModal');
    if(!modal){modal=document.createElement('div');modal.id='productModal';modal.className='product-modal';modal.innerHTML=`<div class="product-modal__backdrop" data-close-product></div><div class="product-modal__dialog" role="dialog" aria-modal="true" aria-label="Product details"><button class="product-modal__close" type="button" data-close-product aria-label="Close">×</button><div class="product-modal__media"><img id="modalProductImg" alt=""></div><div class="product-modal__body"><div class="modal-product-category" id="modalProductCategory"></div><h2 id="modalProductName"></h2><div id="modalProductRating" class="product-rating"></div><p id="modalProductDescription"></p><div id="modalProductPrice" class="product-price"></div><div class="modal-qty"><button type="button" id="modalQtyMinus">−</button><span id="modalQty">1</span><button type="button" id="modalQtyPlus">+</button></div><div class="modal-actions"><button class="btn btn-primary" id="modalAdd">Add to Cart</button><button class="btn btn-secondary" id="modalCheckout">Checkout</button></div><div class="product-feedback-box"><h3>Product comment</h3><p class="feedback-note" id="modalFeedbackNote">Sign in to leave a comment for the owner.</p><textarea id="modalFeedbackText" placeholder="Write your comment or feedback..." maxlength="1000"></textarea><button type="button" class="feedback-send" id="modalFeedbackSend">Send comment</button><div id="modalFeedbackReplies"></div></div></div></div>`;document.body.appendChild(modal);modal.addEventListener('click',e=>{if(e.target.closest('[data-close-product]'))close()})}
    const img=modal.querySelector('#modalProductImg'); img.src=card.querySelector('img').getAttribute('src'); img.alt=p.name;
    modal.querySelector('#modalProductCategory').textContent=p.subcategory; modal.querySelector('#modalProductName').textContent=p.name; modal.querySelector('#modalProductRating').textContent=`★ ${p.rating.toFixed(1)} (${p.reviews} reviews)`; modal.querySelector('#modalProductDescription').textContent=p.description; modal.querySelector('#modalProductPrice').innerHTML=(p.oldPrice?`<span class="card-old-price">${money(p.oldPrice)}</span> `:'')+money(p.price);
    let qty=1; const qtyEl=modal.querySelector('#modalQty'); qtyEl.textContent=qty; const setQty=n=>{qty=Math.max(1,Math.min(p.stock,n));qtyEl.textContent=qty}; modal.querySelector('#modalQtyMinus').onclick=()=>setQty(qty-1); modal.querySelector('#modalQtyPlus').onclick=()=>setQty(qty+1);
    modal.querySelector('#modalAdd').onclick=async()=>{try{await apiAdd(p,qty);toast(`${p.name} added to cart.`)}catch(e){toast(e.message)}};
    modal.querySelector('#modalCheckout').onclick=async()=>{try{await apiAdd(p,qty);close();sessionStorage.setItem('pawcareSkipHomeGalaxy','1');location.href='index.html#cart'}catch(e){toast(e.message)}};
    const fbNote=modal.querySelector('#modalFeedbackNote'),fbText=modal.querySelector('#modalFeedbackText'),fbSend=modal.querySelector('#modalFeedbackSend'),fbReplies=modal.querySelector('#modalFeedbackReplies');
    fbText.value=''; fbReplies.innerHTML='';
    let feedbackUser=false;
    fetch('api/session.php',{credentials:'same-origin'}).then(r=>r.json()).then(d=>{
      feedbackUser=!!(d.user&&d.user.role==='user');
      const isOwner=!!(d.user&&d.user.role==='owner');
      fbNote.textContent=isOwner?'Owner view: customer feedback for this product.':feedbackUser?'Your comment will be sent to the PawCare owner.':'Sign in to leave a comment for the owner.';
      fbText.disabled=!feedbackUser; fbSend.disabled=!feedbackUser;
      if(feedbackUser||isOwner) return fetch('api/product_feedback.php?product_id='+encodeURIComponent(p.id),{credentials:'same-origin'}).then(r=>r.json()).then(x=>{x.__owner=isOwner;return x});
    }).then(d=>{
      if(!d||!d.feedback)return;
      fbReplies.innerHTML=d.feedback.map(x=>`<div class="feedback-note" style="margin-top:10px"><b>${d.__owner?'Customer: '+String(x.user_name||'Customer'):'Your comment:'}</b> ${String(x.comment).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}${x.owner_reply?`<br><b>Owner reply:</b> ${String(x.owner_reply).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}`:''}</div>`).join('');
    }).catch(()=>{});
    fbSend.onclick=async()=>{if(!feedbackUser){fbNote.textContent='Please sign in first.';return}const comment=fbText.value.trim();if(!comment){fbNote.textContent='Please write a comment first.';return}fbSend.disabled=true;try{await fetch('api/product_feedback.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_id:p.id,comment})}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'Could not send comment');return d});fbText.value='';fbNote.textContent='Comment sent to the owner. Thank you!';}catch(e){fbNote.textContent=e.message}finally{fbSend.disabled=false}};
    modal.classList.add('open');document.body.classList.add('modal-open'); setTimeout(()=>modal.querySelector('.product-modal__close').focus(),100);
    function close(){modal.classList.remove('open');document.body.classList.remove('modal-open')}
  }
  grid.addEventListener('click',e=>{
    const addBtn=e.target.closest('.product-add-btn');
    if(addBtn){
      e.preventDefault();
      e.stopPropagation();
      const card=addBtn.closest('.product-card');
      if(!card)return;
      const p=data(card);
      apiAdd(p,1).then(()=>toast(`${p.name} added to cart.`)).catch(err=>toast(err.message));
      return;
    }
    const card=e.target.closest('.product-card');
    if(!card)return;
    if(e.target.closest('.product-view-btn')){e.preventDefault();e.stopPropagation();openDetails(card);return;}
    openDetails(card);
  });
  search?.addEventListener('input',e=>{query=e.target.value;render()}); sort?.addEventListener('change',render); renderSidebar(); render();
})();
