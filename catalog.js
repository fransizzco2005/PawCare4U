/* PawCare static catalog interactions. Images intentionally stay in HTML. */
(function(){
  const hero=document.querySelector('.hero');
  if(hero && !hero.querySelector('.catalog-hero-visual')){
    const animalMap={
      'page-dog':{label:'DOGS',src:'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=900&q=85'},
      'page-cat':{label:'CATS',src:'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=85'},
      'page-bird':{label:'BIRDS',src:'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=900&q=85'},
      'page-fish':{label:'FISH',src:'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?auto=format&fit=crop&w=900&q=88'},
      'page-rodent':{label:'SMALL PETS',src:'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&w=900&q=85'}
    };
    const animal=Object.keys(animalMap).find(name=>document.body.classList.contains(name));
    const art=animalMap[animal];
    if(art){
      const visual=document.createElement('div');
      visual.className='catalog-hero-visual';
      visual.innerHTML=`<div class="catalog-hero-orbit"></div><div class="catalog-hero-frame"><img src="${art.src}" alt="${art.label.toLowerCase()} care collection"><span>${art.label}</span></div>`;
      hero.appendChild(visual);
      const frame=visual.querySelector('.catalog-hero-frame');
      hero.addEventListener('pointermove',e=>{
        if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
        const rect=hero.getBoundingClientRect();
        const x=(e.clientX-rect.left)/rect.width-.5;
        const y=(e.clientY-rect.top)/rect.height-.5;
        frame.style.transform=`rotateY(${-7+x*8}deg) rotateX(${2-y*7}deg) translate3d(${x*7}px,${y*7}px,24px)`;
      });
      hero.addEventListener('pointerleave',()=>{frame.style.transform='';});
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
  function data(card){return {id:Number(card.dataset.productId),name:card.dataset.name,price:Number(card.dataset.price),oldPrice:card.dataset.oldPrice?Number(card.dataset.oldPrice):null,rating:Number(card.dataset.rating||4.5),reviews:Number(card.dataset.reviews||0),description:card.dataset.description||'A practical PawCare essential for everyday pet care.',category:animalKey,subcategory:card.dataset.subcategory,stock:Number(card.dataset.stock??100),image:card.querySelector('img')?.getAttribute('src')||''};}
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
  function syncCatalog(){
    fetch('api/products.php',{credentials:'same-origin'}).then(async response=>{if(!response.ok)throw Error('Could not refresh product stock and prices.');return response.json()}).then(products=>{
      const byId=new Map(products.map(product=>[Number(product.id),product]));
      cards.forEach(card=>{
        const product=byId.get(Number(card.dataset.productId));if(!product)return;
        card.dataset.price=product.price;card.dataset.stock=product.stock;card.dataset.name=product.name;card.dataset.oldPrice=product.oldPrice||'';
        const price=card.querySelector('.product-price');if(price)price.innerHTML=(product.oldPrice?`<span class="card-old-price">${money(product.oldPrice)}</span> `:'')+money(product.price);
        let stockNote=card.querySelector('.product-stock-note');
        if(!stockNote){stockNote=document.createElement('small');stockNote.className='product-stock-note';price?.after(stockNote)}
        if(stockNote){stockNote.textContent=Number(product.stock)>0?`${Number(product.stock)} left in stock`:'Out of stock · preorder available';stockNote.classList.toggle('is-out-of-stock',Number(product.stock)<=0)}
      });
    }).catch(error=>toast(error.message));
  }
  async function apiAdd(product,qty){
    const payload={product_id:product.id,qty,product:{name:product.name,category:product.category,subcategory:product.subcategory,price:product.price,old_price:product.oldPrice,rating:product.rating,reviews:product.reviews,tag:'',stock:product.stock,image_url:product.image}};
    const r=await fetch('api/cart.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const d=await r.json(); if(!r.ok) throw new Error(d.error||'Could not add item');
    document.querySelectorAll('.icon-badge').forEach(b=>b.textContent=(d.items||[]).reduce((n,i)=>n+Number(i.qty||0),0));
    return d;
  }
  function openDetails(card){
    const p=data(card); let modal=document.getElementById('productModal');
    if(!modal){
      modal=document.createElement('div');modal.id='productModal';modal.className='product-modal';
      modal.innerHTML=`<div class="product-modal__backdrop" data-close-product></div><div class="product-modal__dialog" role="dialog" aria-modal="true" aria-label="Product details">
        <button class="product-modal__close" type="button" data-close-product aria-label="Close">×</button>
        <div class="product-modal__media"><button class="modal-zoom-button" type="button" aria-label="Zoom product image">⌕</button><img id="modalProductImg" alt=""><div class="modal-thumbnail-strip" aria-label="Product image views"><button class="active" type="button" data-view="0"></button><button type="button" data-view="1"></button><button type="button" data-view="2"></button></div></div>
        <div class="product-modal__body"><div class="modal-product-category" id="modalProductCategory"></div><h2 id="modalProductName"></h2><div id="modalProductRating" class="product-rating"></div><p id="modalProductDescription"></p><div class="modal-stock-label" id="modalProductStock"></div><div id="modalProductPrice" class="product-price"></div>
          <div class="modal-qty"><button type="button" id="modalQtyMinus" aria-label="Decrease quantity">−</button><span id="modalQty">1</span><button type="button" id="modalQtyPlus" aria-label="Increase quantity">+</button></div>
          <div class="modal-actions"><button class="btn btn-primary" id="modalAdd">Add to Cart</button><button class="btn btn-secondary" id="modalCheckout">Checkout</button><button class="btn btn-secondary" id="modalPreorder" hidden>Request preorder</button></div>
          <div class="product-feedback-box"><h3>Rate and review</h3><p class="feedback-note" id="modalFeedbackNote">Sign in to rate or comment for the owner.</p><div class="feedback-rating"><span>Choose a rating</span><div class="feedback-stars" id="modalFeedbackStars" role="radiogroup" aria-label="Product rating"></div><span class="feedback-rating-label" id="modalFeedbackRatingLabel">Select 1 to 5 stars</span></div><textarea id="modalFeedbackText" placeholder="Add an optional comment..." maxlength="1000" aria-label="Optional product comment"></textarea><button type="button" class="feedback-send" id="modalFeedbackSend">Send rating</button></div>
        </div><aside class="product-modal__reviews"><div id="modalReviewSummary"></div><div id="modalProductReviews" class="modal-product-reviews"></div></aside></div>`;
      document.body.appendChild(modal);modal.addEventListener('click',e=>{if(e.target.closest('[data-close-product]'))close()});
    }
    const img=modal.querySelector('#modalProductImg'); const source=card.querySelector('img').getAttribute('src'); img.src=source; img.alt=p.name;
    const thumbs=[...modal.querySelectorAll('.modal-thumbnail-strip button')];
    thumbs.forEach((thumb,index)=>{
      thumb.style.backgroundImage=`url("${source}")`;
      thumb.classList.toggle('active',index===0);
      thumb.onclick=()=>{
        thumbs.forEach(t=>t.classList.remove('active'));thumb.classList.add('active');
        img.classList.remove('zoomed');
        img.style.objectPosition=['center','35% 50%','65% 50%'][index];
        img.style.filter=['none','saturate(1.08)','contrast(1.04) brightness(1.03)'][index];
      };
    });
    const zoomButton=modal.querySelector('.modal-zoom-button');
    zoomButton.onclick=()=>{
      img.classList.toggle('zoomed');
      modal.classList.toggle('is-zoomed',img.classList.contains('zoomed'));
      zoomButton.textContent=img.classList.contains('zoomed')?'−':'⌕';
    };
    img.onclick=()=>zoomButton.click();
    img.onpointermove=e=>{
      if(!img.classList.contains('zoomed'))return;
      const rect=img.getBoundingClientRect();
      const x=((e.clientX-rect.left)/rect.width)*100;
      const y=((e.clientY-rect.top)/rect.height)*100;
      img.style.transformOrigin=`${x}% ${y}%`;
    };
    modal.querySelector('#modalProductCategory').textContent=p.subcategory; modal.querySelector('#modalProductName').textContent=p.name; modal.querySelector('#modalProductRating').textContent=`★ ${p.rating.toFixed(1)} (${p.reviews} reviews)`; modal.querySelector('#modalProductDescription').textContent=p.description; modal.querySelector('#modalProductPrice').innerHTML=(p.oldPrice?`<span class="card-old-price">${money(p.oldPrice)}</span> `:'')+money(p.price);
    const outOfStock=p.stock<=0,stockLabel=modal.querySelector('#modalProductStock');
    stockLabel.textContent=outOfStock?'Out of stock · request a preorder':`${p.stock} left in stock`;
    stockLabel.classList.toggle('is-out-of-stock',outOfStock);
    modal.querySelector('#modalAdd').hidden=outOfStock;modal.querySelector('#modalCheckout').hidden=outOfStock;modal.querySelector('#modalPreorder').hidden=!outOfStock;
    let qty=1; const qtyEl=modal.querySelector('#modalQty'); qtyEl.textContent=qty; const setQty=n=>{qty=Math.max(1,Math.min(p.stock,n));qtyEl.textContent=qty}; modal.querySelector('#modalQtyMinus').onclick=()=>setQty(qty-1); modal.querySelector('#modalQtyPlus').onclick=()=>setQty(qty+1);
    modal.querySelector('#modalAdd').onclick=async()=>{try{await apiAdd(p,qty);toast(`${p.name} added to cart.`)}catch(e){toast(e.message)}};
    modal.querySelector('#modalCheckout').onclick=async()=>{try{await apiAdd(p,qty);close();sessionStorage.setItem('pawcareSkipHomeGalaxy','1');location.href='index.html#cart'}catch(e){toast(e.message)}};
    modal.querySelector('#modalPreorder').onclick=async()=>{try{const response=await fetch('api/product_conversations.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_id:p.id,kind:'preorder',quantity:qty})});const result=await response.json();if(!response.ok)throw Error(result.error||'Could not submit preorder request.');toast('Preorder request sent to the owner.');}catch(e){toast(e.message)}};
    const fbNote=modal.querySelector('#modalFeedbackNote'),fbText=modal.querySelector('#modalFeedbackText'),fbSend=modal.querySelector('#modalFeedbackSend'),fbStars=modal.querySelector('#modalFeedbackStars'),fbRatingLabel=modal.querySelector('#modalFeedbackRatingLabel');
    fbText.value='';
    const renderReviews=response=>{
      const summary=response.summary||{},reviewList=modal.querySelector('#modalProductReviews');
      modal.querySelector('#modalReviewSummary').innerHTML=`<h3>Customer reviews</h3><strong>★ ${Number(summary.average||0).toFixed(2)} / 5</strong><span>${Number(summary.count||0)} ratings</span>`;
      reviewList.innerHTML=(response.feedback||[]).map(x=>`<article class="modal-review"><b>${escapeHtml(x.user_name||'Customer')}</b><span class="feedback-entry-rating">${x.rating?`${'★'.repeat(Number(x.rating))}${'☆'.repeat(5-Number(x.rating))}`:'No rating'}</span><p>${escapeHtml(x.comment||'Rating only; no comment.')}</p><small>${escapeHtml(new Date(x.created_at).toLocaleDateString())}</small></article>`).join('')||'<p class="modal-review-empty">No customer reviews yet.</p>';
    };
    let selectedRating=0;
    fbStars.innerHTML=Array.from({length:5},(_,i)=>`<button type="button" class="feedback-star" role="radio" aria-checked="false" aria-label="${i+1} star${i?'s':''}" data-rating="${i+1}">★</button>`).join('');
    const setRating=value=>{
      selectedRating=value;
      fbStars.querySelectorAll('.feedback-star').forEach(star=>{
        const active=Number(star.dataset.rating)<=value;
        star.classList.toggle('is-selected',active);
        star.setAttribute('aria-checked',Number(star.dataset.rating)===value?'true':'false');
      });
      fbRatingLabel.textContent=`${value} out of 5 stars`;
    };
    fbStars.querySelectorAll('.feedback-star').forEach(star=>star.addEventListener('click',()=>setRating(Number(star.dataset.rating))));
    let feedbackUser=false;
    fetch('api/session.php',{credentials:'same-origin'}).then(r=>r.json()).then(d=>{
      feedbackUser=!!(d.user&&(d.user.role==='user'||d.user.role==='owner'));
      const isOwner=!!(d.user&&d.user.role==='owner');
      fbNote.textContent=isOwner?'Your owner review will be visible in the dashboard.':feedbackUser?'Your rating and optional comment will be sent to the PawCare owner.':'Sign in to leave a rating or comment for the owner.';
      fbText.disabled=!feedbackUser; fbSend.disabled=!feedbackUser;
      fbStars.querySelectorAll('button').forEach(star=>star.disabled=!feedbackUser);
      return fetch('api/product_feedback.php?product_id='+encodeURIComponent(p.id),{credentials:'same-origin'}).then(async r=>{const x=await r.json();if(!r.ok)throw Error(x.error||'Could not load product feedback.');return x});
    }).then(d=>{
      if(!d||!d.feedback)return;
      renderReviews(d);
    }).catch(error=>{fbNote.textContent=error.message||'Could not load product feedback.'});
    fbSend.onclick=async()=>{
      if(!feedbackUser){fbNote.textContent='Please sign in first to add a rating.';return}
      if(!selectedRating){fbNote.textContent='Please select a rating from 1 to 5 stars.';return}
      const comment=fbText.value.trim();
      fbSend.disabled=true;fbSend.textContent='Sending...';
      try{
        const response=await fetch('api/product_feedback.php',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({product_id:p.id,rating:selectedRating,comment})});
        const text=await response.text();let result={};
        try{result=text?JSON.parse(text):{}}catch(_){throw new Error('The server returned an invalid response.')}
        if(!response.ok)throw new Error(result.error||'Could not send comment');
        fbText.value='';
        fbNote.textContent='Rating sent to the owner. Thank you!';
        const refreshed=await fetch(`api/product_feedback.php?product_id=${encodeURIComponent(p.id)}&v=${Date.now()}`,{credentials:'same-origin',cache:'no-store',headers:{'Accept':'application/json'}});
        const refreshedData=await refreshed.json();
        if(!refreshed.ok)throw new Error(refreshedData.error||'Could not reload product feedback.');
        if(refreshedData.feedback)renderReviews(refreshedData);
        selectedRating=0;
        fbStars.querySelectorAll('.feedback-star').forEach(star=>{star.classList.remove('is-selected');star.setAttribute('aria-checked','false')});
        fbRatingLabel.textContent='Select 1 to 5 stars';
      }catch(e){fbNote.textContent=e.message||'Could not send comment.'}
      finally{fbSend.disabled=false;fbSend.textContent='Send rating'}
    };
    modal.classList.add('open');document.body.classList.add('modal-open'); setTimeout(()=>modal.querySelector('.product-modal__close').focus(),100);
    function close(){
      modal.classList.remove('open');
      modal.classList.remove('is-zoomed');
      document.body.classList.remove('modal-open');
      img.classList.remove('zoomed');
      img.style.transformOrigin='50% 50%';
      img.style.objectPosition='center';
      img.style.filter='none';
      const zoomButton=modal.querySelector('.modal-zoom-button');
      if(zoomButton) zoomButton.textContent='⌕';
    }
  }
  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
  syncCatalog();
  setInterval(syncCatalog,30000);
  grid.addEventListener('click',e=>{
    const addBtn=e.target.closest('.product-add-btn');
    if(addBtn){
      e.preventDefault();
      e.stopPropagation();
      const card=addBtn.closest('.product-card');
      if(!card)return;
      const p=data(card);
      if(p.stock<=0){openDetails(card);return}
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
