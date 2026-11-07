/* PawCare navigation, home entrance, account persistence and tab loading. */
(function(){
  'use strict';
  const body=document.body;
  const loader=document.getElementById('pageLoader');
  const isHome=body.classList.contains('home-page');

  function api(path, options={}){
    return fetch(path,{credentials:'same-origin',headers:{'Content-Type':'application/json'},...options})
      .then(async r=>{const raw=await r.text();let d={};try{d=raw?JSON.parse(raw):{}}catch(_){throw new Error('Server returned invalid JSON.')}if(!r.ok)throw new Error(d.error||`Request failed (${r.status})`);return d;});
  }

  /* HOME ONLY: cinematic entrance. It never runs for product/cart/auth actions. */
  function runSpacePortal(onDone,duration=2100){
    if(!isHome || body.classList.contains('space-transition-active')){onDone?.();return;}
    body.classList.add('space-transition-active');
    const portal=document.createElement('div'); portal.className='space-portal'; portal.setAttribute('aria-hidden','true');
    portal.innerHTML=`<div class="space-portal__vignette"></div><div class="space-portal__nebula space-portal__nebula--a"></div><div class="space-portal__nebula space-portal__nebula--b"></div><div class="space-portal__starfield space-portal__stars--far"></div><div class="space-portal__starfield space-portal__stars--near"></div><div class="space-portal__warp-ring space-portal__warp-ring--1"></div><div class="space-portal__warp-ring space-portal__warp-ring--2"></div><div class="space-portal__warp-ring space-portal__warp-ring--3"></div><div class="space-portal__accretion"></div><div class="space-portal__blackhole"></div><div class="space-portal__lens"></div><div class="space-portal__flash"></div>`;
    document.body.appendChild(portal);

    /* Galaxy entrance SFX.
       IMPORTANT: browsers may block audible autoplay on a fresh page. We use
       Web Audio and also unlock the audio context from the same user gesture
       that unlocks the site's music. This removes MP3 decode/start latency.
    */
    let galaxyAudioCtx=null;
    function unlockGalaxyAudio(){
      try{
        const AC=window.AudioContext||window.webkitAudioContext;
        if(!AC) return null;
        if(!galaxyAudioCtx) galaxyAudioCtx=new AC();
        if(galaxyAudioCtx.state==='suspended') galaxyAudioCtx.resume().catch(()=>{});
        return galaxyAudioCtx;
      }catch(_){return null}
    }
    ['pointerdown','keydown','touchstart'].forEach(ev=>{
      window.addEventListener(ev,()=>{unlockGalaxyAudio();},{once:false,passive:true});
    });
    function playGalaxyEntranceSfx(){
      const ctx=unlockGalaxyAudio();
      if(!ctx || ctx.state==='suspended') return;
      const t=ctx.currentTime+0.005;
      const master=ctx.createGain();
      master.gain.setValueAtTime(0.0001,t);
      master.gain.exponentialRampToValueAtTime(0.18,t+0.025);
      master.gain.exponentialRampToValueAtTime(0.0001,t+1.65);
      master.connect(ctx.destination);

      const bass=ctx.createOscillator(), bg=ctx.createGain();
      bass.type='sine'; bass.frequency.setValueAtTime(62,t);
      bass.frequency.exponentialRampToValueAtTime(27,t+1.55);
      bg.gain.setValueAtTime(0.0001,t);
      bg.gain.exponentialRampToValueAtTime(0.65,t+0.08);
      bg.gain.exponentialRampToValueAtTime(0.0001,t+1.55);
      bass.connect(bg); bg.connect(master); bass.start(t); bass.stop(t+1.7);

      const sweep=ctx.createOscillator(), sg=ctx.createGain();
      sweep.type='triangle'; sweep.frequency.setValueAtTime(150,t);
      sweep.frequency.exponentialRampToValueAtTime(1550,t+1.0);
      sweep.frequency.exponentialRampToValueAtTime(650,t+1.55);
      sg.gain.setValueAtTime(0.0001,t);
      sg.gain.exponentialRampToValueAtTime(0.16,t+0.09);
      sg.gain.exponentialRampToValueAtTime(0.0001,t+1.5);
      sweep.connect(sg); sg.connect(master); sweep.start(t); sweep.stop(t+1.6);

      const hit=ctx.createOscillator(), hg=ctx.createGain();
      hit.type='sine'; hit.frequency.setValueAtTime(760,t+0.98);
      hit.frequency.exponentialRampToValueAtTime(170,t+1.42);
      hg.gain.setValueAtTime(0.0001,t+0.98);
      hg.gain.exponentialRampToValueAtTime(0.15,t+1.03);
      hg.gain.exponentialRampToValueAtTime(0.0001,t+1.52);
      hit.connect(hg); hg.connect(master); hit.start(t+0.98); hit.stop(t+1.58);

      const buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*1.35),ctx.sampleRate);
      const data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++){
        const x=i/data.length;
        data[i]=(Math.random()*2-1)*Math.pow(1-x,0.72);
      }
      const noise=ctx.createBufferSource(), nf=ctx.createBiquadFilter(), ng=ctx.createGain();
      noise.buffer=buffer; nf.type='bandpass';
      nf.frequency.setValueAtTime(520,t);
      nf.frequency.exponentialRampToValueAtTime(3800,t+0.8);
      nf.Q.value=0.7;
      ng.gain.setValueAtTime(0.0001,t);
      ng.gain.exponentialRampToValueAtTime(0.20,t+0.04);
      ng.gain.exponentialRampToValueAtTime(0.0001,t+1.22);
      noise.connect(nf); nf.connect(ng); ng.connect(master);
      noise.start(t); noise.stop(t+1.3);
    }
    playGalaxyEntranceSfx();

    const makeStars=(host,count,near)=>{const frag=document.createDocumentFragment();for(let i=0;i<count;i++){const star=document.createElement('i');star.style.setProperty('--angle',(Math.random()*Math.PI*2)+'rad');star.style.setProperty('--radius',(4+Math.random()*47)+'vw');star.style.setProperty('--delay',(Math.random()*.35)+'s');star.style.setProperty('--length',(near?(24+Math.random()*100):(8+Math.random()*42))+'px');star.style.setProperty('--thickness',(near?(1+Math.random()*2.5):(.5+Math.random()*1.2))+'px');star.style.setProperty('--opacity',(near?(0.42+Math.random()*.58):(.18+Math.random()*.48)).toFixed(2));frag.appendChild(star)}host.appendChild(frag)};
    makeStars(portal.querySelector('.space-portal__stars--far'),120,false); makeStars(portal.querySelector('.space-portal__stars--near'),90,true);
    requestAnimationFrame(()=>portal.classList.add('is-active'));
    setTimeout(()=>portal.classList.add('is-reveal'),Math.max(0,duration-620));
    setTimeout(()=>{portal.remove();body.classList.remove('space-transition-active');onDone?.()},duration);
  }

  /* Loader rules:
     - fresh/reloaded HOME: 4.5s loader, then galaxy entrance
     - top-nav arrival: 2s loader only
     - checkout/cart/product/auth: no loader, no galaxy */
  if(loader){
    const navLoad=sessionStorage.getItem('pawcareTabNavigation')==='1'; sessionStorage.removeItem('pawcareTabNavigation');
    const skipHome=sessionStorage.getItem('pawcareSkipHomeGalaxy')==='1'; sessionStorage.removeItem('pawcareSkipHomeGalaxy');
    if(isHome && !navLoad && !skipHome && !location.hash){
      const duration=Number(body.dataset.loaderDuration||4500);
      setTimeout(()=>runSpacePortal(()=>{loader.classList.add('is-done');setTimeout(()=>loader.remove(),420)},2100),duration);
    }else if(navLoad){
      setTimeout(()=>{loader.classList.add('is-done');setTimeout(()=>loader.remove(),420)},2000);
    }else{ loader.remove(); }
  }

  /* ONLY these top-nav links can trigger the 2-second page loader. */
  const navLinks=[...document.querySelectorAll('.main-nav a, .nav-menu a')];
  navLinks.forEach(a=>a.addEventListener('click',async e=>{
    if(e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||a.target==='_blank')return;
    const href=a.getAttribute('href'); if(!href||href.startsWith('#')||href.startsWith('mailto:')||href.startsWith('tel:'))return;
    try{const u=new URL(href,location.href);if(u.origin!==location.origin)return;if(u.pathname===location.pathname&&!u.hash)return}catch(_){return}
    const shopPage=/^(dogs|cats|birds|fish|smallpets)\.html$/i.test(new URL(href,location.href).pathname.split('/').pop()||'');
    if(shopPage && !currentUser){
      e.preventDefault();
      try{
        const session=await api('api/session.php');
        if(session.user){
          setAccount(session.user);
          sessionStorage.setItem('pawcareTabNavigation','1');
          location.assign(href);
          return;
        }
      }catch(_){}
      openAuth('signin');
      toast('Please sign in or create an account to access the shop.');
      return;
    }
    e.preventDefault(); sessionStorage.setItem('pawcareTabNavigation','1'); location.assign(href);
  }));
  navLinks.forEach(a=>{try{const u=new URL(a.href,location.href),cur=location.pathname.split('/').pop().toLowerCase()||'index.html',tar=u.pathname.split('/').pop().toLowerCase()||'index.html';a.classList.toggle('active',cur===tar)}catch(_){}});

  /* Account UI: persistent session + visible greeting. */
  const wrap=document.getElementById('accountWrap'), btn=document.getElementById('accountBtn'), menu=document.getElementById('accountMenu');
  const greeting=document.getElementById('accountGreeting'), hello=document.getElementById('accountHello'), nameEl=document.getElementById('accountName');
  const signedOut=document.getElementById('accountSignedOut'), signedIn=document.getElementById('accountSignedIn');
  let currentUser=null;
  function applyHeaderAvatar(user){
    if(!btn)return;
    let img=btn.querySelector('.pawcare-header-avatar');
    if(user && user.avatar_url){
      if(!img){img=document.createElement('img');img.className='pawcare-header-avatar';img.alt='Profile';btn.appendChild(img)}
      img.src=user.avatar_url;
      btn.classList.add('has-profile-photo');
      const svg=btn.querySelector('svg'); if(svg)svg.style.display='none';
    }else{
      if(img)img.remove();
      btn.classList.remove('has-profile-photo');
      const svg=btn.querySelector('svg'); if(svg)svg.style.display='';
    }
  }
  function setAccount(user){
    currentUser=user||null;
    const display=(currentUser&&(currentUser.nickname||currentUser.profile_name||currentUser.name))||'';
    const first=String(display).split(' ')[0]||'there';
    if(nameEl) nameEl.textContent=first;
    if(hello) hello.textContent=currentUser?`Hello, ${first}!`:'Hello!';
    if(signedOut) signedOut.hidden=!!currentUser;
    if(signedIn) signedIn.hidden=!currentUser;
    if(greeting){greeting.hidden=!currentUser;greeting.textContent=currentUser?`Hello, ${first}`:'';}
    const innerGreeting=document.getElementById('innerAccountGreeting'); if(innerGreeting){innerGreeting.hidden=!currentUser;innerGreeting.textContent=currentUser?`Hello, ${first}`:'';}
    if(btn){btn.title=currentUser?`Account: ${display}`:'Sign in';btn.setAttribute('aria-label',currentUser?`Account: ${display}`:'Sign in');}
    applyHeaderAvatar(currentUser);
    const legacyOwnerIndicator=document.getElementById('ownerIndicator');
    if(legacyOwnerIndicator) legacyOwnerIndicator.remove();
    const roleIndicator=document.getElementById('headerRoleIndicator');
    if(roleIndicator){ roleIndicator.hidden=!currentUser; roleIndicator.textContent=currentUser?(currentUser.role==='owner'?'👑 OWNER':'● USER'):''; roleIndicator.classList.toggle('is-owner',!!currentUser&&currentUser.role==='owner'); }
    const ownerLabel=document.getElementById('ownerAccountLabel');
    if(ownerLabel) ownerLabel.hidden=!(currentUser&&currentUser.role==='owner');
    document.body.classList.toggle('owner-session',!!currentUser&&currentUser.role==='owner');
  }
  window.addEventListener('pawcare:profile-updated',e=>{if(e.detail)setAccount({...currentUser,...e.detail});});
  // Inner pages have a compact account button; add the same visible greeting used on Home.
  if(!isHome && !greeting){
    const headerActions=document.querySelector('.header-actions');
    const accountButton=document.querySelector('.account-btn');

    if(headerActions && accountButton){
      const g=document.createElement('span');
      g.className='account-greeting account-greeting-standalone';
      g.id='innerAccountGreeting';
      g.hidden=true;

      const role=document.createElement('span');
      role.className='header-role-indicator';
      role.id='headerRoleIndicator';
      role.hidden=true;

      headerActions.insertBefore(g,accountButton);
      headerActions.insertBefore(role,accountButton);
    }
}
  function closeMenu(){if(menu)menu.hidden=true}
  if(wrap && btn && menu && !isHome){
    btn.addEventListener('click',e=>{e.stopPropagation();menu.hidden=!menu.hidden});
    document.addEventListener('click',e=>{if(!wrap.contains(e.target))closeMenu()});
  }
  if(!isHome){
    /* Inner pages use the same real PHP authentication session. */
    api('api/session.php').then(async d=>{
      let user=d.user||null;
      if(user){try{const p=await api('api/profile.php');user={...user,...p.profile};}catch(_){} }
      setAccount(user);window.PawCareOwnerMode?.init(user);
      const page=location.pathname.split('/').pop().toLowerCase();
      const isShopPage=/^(dogs|cats|birds|fish|smallpets)\.html$/.test(page);
      if(isShopPage && !user){
        sessionStorage.setItem('pawcareSkipHomeGalaxy','1');
        sessionStorage.setItem('pawcareRequireSignIn','1');
        location.replace('index.html');
        return { items: [] };
      }
      return api('api/cart.php')
    }).then(d=>{
      const count=(d.items||[]).reduce((n,i)=>n+Number(i.qty||0),0);document.querySelectorAll('.icon-badge').forEach(x=>x.textContent=count);
    }).catch(()=>setAccount(null));
  } else {
    /* HOME: read the real PHP session immediately so Owner/User mode is correct on first paint. */
    const syncHome=async()=>{try{const d=await api('api/session.php');let u=d.user||null;if(u){try{const p=await api('api/profile.php');u={...u,...p.profile};if(window.state)window.state.user=u;}catch(_){} }setAccount(u);window.PawCareOwnerMode?.init(u);}catch(_){setAccount(null)}};
    syncHome(); setTimeout(syncHome,350); setTimeout(syncHome,900);
    if(sessionStorage.getItem('pawcareRequireSignIn')==='1'){
      sessionStorage.removeItem('pawcareRequireSignIn');
      setTimeout(()=>{if(typeof openAuth==='function')openAuth('signin');},200);
    }
  }

  function ensureAuthModal(){
    let modal=document.getElementById('authOverlay'); if(modal)return modal;
    modal=document.createElement('div');modal.id='authOverlay';modal.className='modal-overlay pawcare-auth-generated';
    modal.innerHTML=`<div class="modal-card auth-card" role="dialog" aria-modal="true" aria-label="PawCare account"><button class="modal-close" type="button" data-auth-close>✕</button><div class="auth-tabs"><button class="auth-tab active" data-auth-mode="signin" type="button">Sign in</button><button class="auth-tab" data-auth-mode="signup" type="button">Create account</button></div><form class="auth-form" id="generatedSigninForm"><label>Email<input type="email" name="email" required autocomplete="email"></label><label>Password<input type="password" name="password" required autocomplete="current-password"></label><p class="auth-error" id="generatedSigninError" hidden></p><button class="btn btn-primary btn-full" type="submit">Sign in</button></form><form class="auth-form" id="generatedSignupForm" hidden><label>Full name<input type="text" name="name" required autocomplete="name"></label><label>Email<input type="email" name="email" required autocomplete="email"></label><label>Password<input type="password" name="password" minlength="6" required autocomplete="new-password"></label><p class="auth-error" id="generatedSignupError" hidden></p><button class="btn btn-primary btn-full" type="submit">Create account</button></form></div>`;
    document.body.appendChild(modal);
    const switchMode=mode=>{modal.querySelector('#generatedSigninForm').hidden=mode!=='signin';modal.querySelector('#generatedSignupForm').hidden=mode!=='signup';modal.querySelectorAll('.auth-tab').forEach(t=>t.classList.toggle('active',t.dataset.authMode===mode))};
    modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('[data-auth-close]'))modal.classList.remove('open');const t=e.target.closest('[data-auth-mode]');if(t)switchMode(t.dataset.authMode)});
    modal.querySelector('#generatedSigninForm').addEventListener('submit',async e=>{e.preventDefault();const form=e.target,err=modal.querySelector('#generatedSigninError');err.hidden=true;try{const d=await api('api/login.php',{method:'POST',body:JSON.stringify({email:form.email.value,password:form.password.value})});setAccount(d.user);window.PawCareOwnerMode?.init(d.user);const c=await api('api/cart.php');document.querySelectorAll('.icon-badge').forEach(x=>x.textContent=(c.items||[]).reduce((n,i)=>n+Number(i.qty||0),0));modal.classList.remove('open');closeMenu();toast(`Welcome back, ${d.user.name.split(' ')[0]}.`)}catch(ex){err.textContent=ex.message==='Request failed'?'The server rejected this login request. Deploy PawCare on a PHP host or enable PHP on the current host.':ex.message;err.hidden=false}});
    modal.querySelector('#generatedSignupForm').addEventListener('submit',async e=>{e.preventDefault();const form=e.target,err=modal.querySelector('#generatedSignupError');err.hidden=true;try{const d=await api('api/register.php',{method:'POST',body:JSON.stringify({name:form.name.value,email:form.email.value,password:form.password.value})});setAccount(d.user);window.PawCareOwnerMode?.init(d.user);const c=await api('api/cart.php');document.querySelectorAll('.icon-badge').forEach(x=>x.textContent=(c.items||[]).reduce((n,i)=>n+Number(i.qty||0),0));modal.classList.remove('open');closeMenu();toast(`Account created — welcome, ${d.user.name.split(' ')[0]}.`)}catch(ex){err.textContent=ex.message;err.hidden=false}});
    return modal;
  }
  function openAuth(mode='signin'){
    if(isHome && typeof window.openAuth==='function'){window.openAuth(mode);return}
    const modal=ensureAuthModal();modal.classList.add('open');
    const tabs=modal.querySelectorAll('[data-auth-mode]');tabs.forEach(t=>t.classList.toggle('active',t.dataset.authMode===mode));modal.querySelector('#generatedSigninForm').hidden=mode!=='signin';modal.querySelector('#generatedSignupForm').hidden=mode!=='signup';
  }
  if(wrap && signedOut){
    document.getElementById('openSignIn')?.addEventListener('click',e=>{e.stopPropagation();openAuth('signin')});
    document.getElementById('openSignUp')?.addEventListener('click',e=>{e.stopPropagation();openAuth('signup')});
    document.getElementById('logoutBtn')?.addEventListener('click',async e=>{e.stopPropagation();try{await api('api/logout.php',{method:'POST'})}catch(_){}setAccount(null);closeMenu();document.querySelectorAll('.icon-badge').forEach(x=>x.textContent='0');toast('Signed out.')});
    document.getElementById('viewAccountBtn')?.addEventListener('click',()=>{sessionStorage.setItem('pawcareSkipHomeGalaxy','1');location.href='account.html#profile';});
    document.getElementById('accountOrdersMenuBtn')?.addEventListener('click',()=>{sessionStorage.setItem('pawcareSkipHomeGalaxy','1');location.href='account.html#orders';});
    document.getElementById('accountReservationsMenuBtn')?.addEventListener('click',()=>{sessionStorage.setItem('pawcareSkipHomeGalaxy','1');location.href='account.html#reservations';});
    document.getElementById('accountMessagesMenuBtn')?.addEventListener('click',()=>{sessionStorage.setItem('pawcareSkipHomeGalaxy','1');location.href='account.html#messages';});
  }
  window.toggleAuth=()=>{if(menu){menu.hidden=!menu.hidden}else openAuth('signin')};

  if(!isHome){
    const overlay=document.createElement('div');
    overlay.className='drawer-overlay';
    overlay.id='innerCartOverlay';
    const drawer=document.createElement('aside');
    drawer.className='cart-drawer';
    drawer.id='innerCartDrawer';
    drawer.setAttribute('role','dialog');
    drawer.setAttribute('aria-modal','true');
    drawer.setAttribute('aria-label','Your cart');
    drawer.innerHTML='<div class="cart-drawer__head"><h2>Your cart</h2><button class="close-btn" id="innerCartClose" type="button" aria-label="Close cart">✕</button></div><div class="cart-items" id="innerCartItems"></div><p class="empty-state" id="innerCartEmpty" hidden>Your cart is empty.</p><p class="inner-cart-error" id="innerCartError" hidden></p><div class="cart-drawer__footer"><div class="cart-total-row"><span>Subtotal</span><strong id="innerCartSubtotal">₱0.00</strong></div><button class="btn-primary btn-full" id="innerCartCheckout" type="button">Checkout</button></div>';
    document.body.append(overlay,drawer);

    const cartItems=drawer.querySelector('#innerCartItems');
    const emptyState=drawer.querySelector('#innerCartEmpty');
    const cartError=drawer.querySelector('#innerCartError');
    const subtotal=drawer.querySelector('#innerCartSubtotal');
    const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    const money=value=>'₱'+Number(value||0).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
    const closeCart=()=>{
      drawer.classList.remove('active');
      overlay.classList.remove('active');
    };
    const renderCart=items=>{
      const count=items.reduce((sum,item)=>sum+Number(item.qty||0),0);
      document.querySelectorAll('.icon-badge').forEach(badge=>badge.textContent=count);
      emptyState.hidden=items.length>0;
      cartItems.innerHTML=items.map(item=>`<div class="cart-item inner-cart-item"><div class="cart-item__thumb"><img src="${escapeHTML(item.image_url||'pawcare-logo.png')}" alt=""></div><div class="inner-cart-item__details"><strong>${escapeHTML(item.name)}</strong><span>${money(item.price)} each</span><div class="inner-cart-item__controls"><button type="button" data-cart-action="decrease" data-product-id="${Number(item.product_id)}" aria-label="Decrease ${escapeHTML(item.name)} quantity">−</button><span>${Number(item.qty)}</span><button type="button" data-cart-action="increase" data-product-id="${Number(item.product_id)}" aria-label="Increase ${escapeHTML(item.name)} quantity">+</button><button type="button" class="inner-cart-item__remove" data-cart-action="remove" data-product-id="${Number(item.product_id)}">Remove</button></div></div><strong>${money(Number(item.price)*Number(item.qty))}</strong></div>`).join('');
      subtotal.textContent=money(items.reduce((sum,item)=>sum+Number(item.price)*Number(item.qty),0));
    };
    const loadCart=async()=>{
      cartError.hidden=true;
      try{
        const data=await api('api/cart.php');
        renderCart(data.items||[]);
      }catch(error){
        cartItems.innerHTML='';
        emptyState.hidden=true;
        cartError.textContent=error.message;
        cartError.hidden=false;
      }
    };
    const openCart=()=>{
      drawer.classList.add('active');
      overlay.classList.add('active');
      loadCart();
      drawer.querySelector('#innerCartClose').focus();
    };
    window.togglePawCareCart=()=>drawer.classList.contains('active')?closeCart():openCart();
    drawer.querySelector('#innerCartClose').addEventListener('click',closeCart);
    overlay.addEventListener('click',closeCart);
    document.addEventListener('keydown',event=>{if(event.key==='Escape')closeCart()});
    cartItems.addEventListener('click',async event=>{
      const button=event.target.closest('[data-cart-action]');
      if(!button)return;
      const productId=Number(button.dataset.productId);
      const item=button.closest('.inner-cart-item');
      const currentQty=Number(item?.querySelector('.inner-cart-item__controls span')?.textContent||0);
      button.disabled=true;
      cartError.hidden=true;
      try{
        const action=button.dataset.cartAction;
        const data=action==='remove'
          ? await api('api/cart.php',{method:'DELETE',body:JSON.stringify({product_id:productId})})
          : await api('api/cart.php',{method:'POST',body:JSON.stringify({product_id:productId,qty:currentQty+(action==='increase'?1:-1)})});
        renderCart(data.items||[]);
      }catch(error){
        cartError.textContent=error.message;
        cartError.hidden=false;
        button.disabled=false;
      }
    });
    drawer.querySelector('#innerCartCheckout').addEventListener('click',()=>{
      sessionStorage.setItem('pawcareSkipHomeGalaxy','1');
      location.href='index.html#cart';
    });
  }

  function toast(msg){let t=document.getElementById('pawcareEnhanceToast');if(!t){t=document.createElement('div');t.id='pawcareEnhanceToast';t.className='catalog-toast';document.body.appendChild(t)}t.textContent=msg;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),2200)}

  /* Music persists between pages and autoplays without needing a click.
     Browsers block audible autoplay, but they always allow MUTED autoplay,
     and they do NOT require a gesture just to unmute media that is already
     playing. So: start muted immediately, then unmute the instant we see
     ANY sign of activity (even a mouse move) rather than waiting for a
     click specifically on the music icon. */
  const audio=document.getElementById('pawcareMusic')||document.querySelector('audio[data-pawcare-music]');
  if(audio){
    audio.volume=.18;
    const getTime=()=>Number(localStorage.getItem('pawcareMusicTime')||0);
    const getSavedAt=()=>Number(localStorage.getItem('pawcareMusicSavedAt')||Date.now());
    const resumeTime=()=>{
      const base=getTime(), age=(Date.now()-getSavedAt())/1000, d=audio.duration;
      return Number.isFinite(d)&&d>0&&age>=0&&age<=30 ? (base+age)%d : base;
    };
    let applied=false;
    const setTime=()=>{if(applied)return;try{audio.currentTime=resumeTime();applied=true}catch(_){}};
    if(audio.readyState>=1)setTime();else audio.addEventListener('loadedmetadata',setTime,{once:true});
    const save=()=>{try{localStorage.setItem('pawcareMusicTime',String(audio.currentTime));localStorage.setItem('pawcareMusicSavedAt',String(Date.now()))}catch(_){}};

    /* Enabled by default now — music turns itself on unless the visitor
       explicitly muted it with the toggle (that choice still follows them
       across pages via localStorage). */
    const isEnabled=()=>localStorage.getItem('pawcareMusicEnabled')!=='0';
    const enable=()=>localStorage.setItem('pawcareMusicEnabled','1');
    const disable=()=>localStorage.setItem('pawcareMusicEnabled','0');
    const tryPlay=()=>{if(!isEnabled())return;setTime();audio.play().catch(()=>{})};

    audio.muted=true;
    tryPlay();

    let unmuted=false;
    const unmute=()=>{
      if(unmuted||!isEnabled())return;
      unmuted=true;
      audio.muted=false;
      tryPlay();
    };
    ['pointerdown','keydown','touchstart','mousemove','wheel','scroll'].forEach(ev=>
      document.addEventListener(ev,unmute,{once:true,passive:true})
    );
    setTimeout(unmute,300); // some browsers allow it outright, no need to wait

    audio.addEventListener('timeupdate',save);audio.addEventListener('pause',save);
    window.addEventListener('pagehide',save);window.addEventListener('beforeunload',save);

    /* Switching browser tabs never pauses <audio> on its own, but some
       mobile browsers suspend background media — resume it as soon as
       this tab is visible again. */
    document.addEventListener('visibilitychange',()=>{
      if(!document.hidden && isEnabled() && audio.paused) tryPlay();
    });

    let b=document.getElementById('musicToggle');if(!b){b=document.createElement('button');b.id='musicToggle';b.type='button';b.className='music-toggle';b.textContent='♫';document.body.appendChild(b)}
    b.onclick=()=>{
      if(audio.paused||audio.muted){enable();unmuted=true;audio.muted=false;tryPlay();}
      else{disable();audio.pause();save();}
    };
  }
})();

/* =========================================================
   GRID / LIST VIEW TOGGLE — shop listing pages
   ========================================================= */
(function(){
  const grid=document.querySelector('.products-grid');
  const toggle=document.querySelector('.view-toggle');
  if(!grid||!toggle) return;
  toggle.addEventListener('click',e=>{
    const btn=e.target.closest('.view-btn');
    if(!btn) return;
    toggle.querySelectorAll('.view-btn').forEach(b=>b.classList.toggle('active',b===btn));
    grid.classList.toggle('is-list-view',btn.dataset.view==='list');
  });
})();

/* =========================================================
   PRODUCT CLICK SOUND — subtle UI feedback, no navigation
   ========================================================= */
(function(){
  let ctx;
  function clickSound(){
    try{
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if(ctx.state === 'suspended') ctx.resume();
      const o=ctx.createOscillator(), g=ctx.createGain();
      o.type='sine'; o.frequency.setValueAtTime(720,ctx.currentTime); o.frequency.exponentialRampToValueAtTime(980,ctx.currentTime+.055);
      g.gain.setValueAtTime(.0001,ctx.currentTime); g.gain.exponentialRampToValueAtTime(.035,ctx.currentTime+.008); g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.075);
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+.08);
    }catch(_){ }
  }
  document.addEventListener('click',function(e){
    const product=e.target.closest && e.target.closest('.product-card');
    if(product){ clickSound(); }
  },true);
})();

/* =========================================================
   OWNER / ORDER ACCOUNT EXTRAS
   ========================================================= */
(function(){
  'use strict';
  const api=(u,o={})=>fetch(u,{credentials:'same-origin',headers:{'Content-Type':'application/json'},...o}).then(async r=>{const t=await r.text();let d={};try{d=t?JSON.parse(t):{}}catch(e){}if(!r.ok)throw Error(d.error||'Request failed');return d;});
  async function getUser(){try{const d=await api('api/session.php');return d.user||null}catch(_){return null}}
  function addButtons(user){
    const signedIn=document.getElementById('accountSignedIn'); if(!signedIn)return;
    if(!document.getElementById('pawcareOrdersBtn') && !document.getElementById('accountOrdersMenuBtn')){
      const b=document.createElement('button');b.id='pawcareOrdersBtn';b.className='account-menu-btn';b.type='button';b.textContent=user&&user.role==='owner'?'📦 All Orders':'📦 My Orders';b.onclick=()=>{sessionStorage.setItem('pawcareSkipHomeGalaxy','1');location.href='account.html#orders'};signedIn.insertBefore(b,signedIn.firstChild);
    }
    if(!document.getElementById('pawcareReservationsBtn') && !document.getElementById('accountReservationsMenuBtn')){
      const b=document.createElement('button');b.id='pawcareReservationsBtn';b.className='account-menu-btn';b.type='button';b.textContent=user&&user.role==='owner'?'🗓️ All Reservations':'🗓️ My Reservations';b.onclick=()=>{sessionStorage.setItem('pawcareSkipHomeGalaxy','1');location.href='account.html#reservations'};signedIn.insertBefore(b,signedIn.firstChild);
    }
    if(!document.getElementById('accountMessagesMenuBtn')){
      const b=document.createElement('button');b.id='accountMessagesMenuBtn';b.className='account-menu-btn';b.type='button';b.textContent='💬 Product Messages';b.onclick=()=>{sessionStorage.setItem('pawcareSkipHomeGalaxy','1');location.href='account.html#messages'};signedIn.insertBefore(b,signedIn.firstChild);
    }
    if(user&&user.role==='owner'){
      document.body.classList.add('owner-session');
      const greeting=document.getElementById('accountGreeting')||document.getElementById('innerAccountGreeting');
        const ordersBtn=document.getElementById('accountOrdersMenuBtn'); if(ordersBtn){ordersBtn.textContent='📦 All Orders';}
      const resBtn=document.getElementById('accountReservationsMenuBtn'); if(resBtn){resBtn.textContent='🗓️ All Reservations';}
      const profileBtn=document.getElementById('viewAccountBtn'); if(profileBtn){profileBtn.textContent='👤 My Profile';}
      const ownerLabel=document.getElementById('ownerAccountLabel'); if(ownerLabel){ownerLabel.hidden=false;ownerLabel.textContent='👑 OWNER ACCOUNT · OWNER MODE';}
    }
  }
  async function watch(){ const user=await getUser(); if(user) addButtons(user); }
  watch(); setTimeout(watch,500); setTimeout(watch,1600);
  /* Owner accounts remain on the same PawCare website. */
})();

/* =========================================================
   OWNER MODE — same PawCare UI, extra controls only
   ========================================================= */
(function(){
'use strict';
const api=(url,opt={})=>fetch(url,{credentials:'same-origin',headers:{'Content-Type':'application/json'},...opt}).then(async r=>{const t=await r.text();let d={};try{d=t?JSON.parse(t):{}}catch(_){throw Error('Server returned invalid JSON.')}if(!r.ok)throw Error(d.error||'Request failed');return d;});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'₱'+Number(n||0).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
const labels={placed:'Order placed',processing:'Packed / processing',shipped:'On the way',delivered:'Delivered',cancelled:'Cancelled'};
function ownerUI(user){
 const isOwner=!!user&&user.role==='owner';
 document.body.classList.toggle('owner-mode',isOwner);
 document.body.classList.toggle('owner-session',isOwner);
 const wrap=document.getElementById('accountWrap');
 if(wrap) wrap.classList.toggle('owner-mode-clean',isOwner);
 const label=document.getElementById('ownerAccountLabel');
 if(label) label.hidden=!isOwner;
}
window.PawCareOwnerMode={init:ownerUI};
})();
