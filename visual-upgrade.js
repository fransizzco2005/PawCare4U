(() => {
  const catalogFallbacks = {
    dog: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=900&q=88',
    cat: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=88',
    bird: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=900&q=88',
    fish: 'https://images.unsplash.com/photo-1522069169874-c58ec4b4bb49?auto=format&fit=crop&w=900&q=88',
    'small-pets': 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&w=900&q=88'
  };
  const animal = Object.keys(catalogFallbacks).find(name =>
    document.body.classList.contains(name === 'small-pets' ? 'page-small-pets' : `page-${name}`)
  ) || 'cat';
  const fallback = catalogFallbacks[animal];

  document.querySelectorAll('.product-thumb img, .catalog-hero-frame img').forEach((img) => {
    const applyFallback = () => {
      if (img.dataset.pawcareFallbackApplied) return;
      img.dataset.pawcareFallbackApplied = '1';
      img.src = fallback;
    };
    img.addEventListener('error', applyFallback, { once: true });
    if (img.complete && img.naturalWidth === 0) applyFallback();
  });

  if (document.querySelector('.page-dog,.page-cat,.page-bird,.page-fish,.page-small-pets') && !document.querySelector('.catalog-scroll-cue')) {
    const products = document.querySelector('.products-section') || document.querySelector('.filters-grid');
    if (products) {
      const cue = document.createElement('a');
      cue.className = 'catalog-scroll-cue';
      cue.href = '#';
      cue.setAttribute('aria-label', 'Scroll to products');
      cue.innerHTML = '<span>Explore products</span><i aria-hidden="true">⌄</i>';
      cue.addEventListener('click', (event) => {
        event.preventDefault();
        products.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      document.querySelector('.hero')?.appendChild(cue);
    }
  }

  if (!document.querySelector('.pc-motion-bg')) {
    const bg=document.createElement('div');
    bg.className='pc-motion-bg';
    bg.innerHTML='<canvas aria-hidden="true"></canvas>';
    document.body.prepend(bg);
    const canvas=bg.querySelector('canvas'), ctx=canvas.getContext('2d');
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let points=[];
    function resize(){
      const d=Math.min(devicePixelRatio||1,2); canvas.width=innerWidth*d; canvas.height=innerHeight*d; canvas.style.width=innerWidth+'px'; canvas.style.height=innerHeight+'px'; ctx.setTransform(d,0,0,d,0,0);
      points=Array.from({length:Math.min(70,Math.floor(innerWidth/22))},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,vx:(Math.random()-0.5)*.14,vy:(Math.random()-0.5)*.14,r:Math.random()*1.8+.5}));
    }
    function draw(){
      ctx.clearRect(0,0,innerWidth,innerHeight);
      for(const p of points){
        if(!reduced){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>innerWidth)p.vx*=-1;if(p.y<0||p.y>innerHeight)p.vy*=-1}
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle='rgba(111,190,255,.45)';ctx.fill();
      }
      ctx.strokeStyle='rgba(85,155,255,.055)';
      for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){const a=points[i],b=points[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<110){ctx.globalAlpha=1-d/110;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.globalAlpha=1}}
      if(!reduced)requestAnimationFrame(draw);
    }
    addEventListener('resize',resize);resize();draw();
  }
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.nav-menu a,.main-nav a').forEach(link=>{
      link.addEventListener('pointermove',e=>{
        const r=link.getBoundingClientRect();
        const x=(e.clientX-r.left)/r.width-.5;
        const y=(e.clientY-r.top)/r.height-.5;
        link.style.transform=`translateY(-2px) perspective(700px) rotateY(${x*10}deg) rotateX(${y*-8}deg) translateZ(10px)`;
      });
      link.addEventListener('pointerleave',()=>link.classList.contains('active')
        ? link.style.transform='translateY(-1px) translateZ(5px)'
        : link.style.transform='');
    });
    document.querySelectorAll('.product-card,.service-card,.feature-card,.category-card,.profile-card,.store-result-card').forEach(card=>{
      card.addEventListener('pointermove',e=>{
        const r=card.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;
        card.style.transform=`translateY(-6px) perspective(900px) rotateY(${x*4}deg) rotateX(${y*-4}deg)`;
      });
      card.addEventListener('pointerleave',()=>card.style.transform='');
    });
  }

  if (document.body.classList.contains('home-page') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const shop=document.getElementById('shopView');
    const hero=shop?.querySelector('.hero');
    if (hero && !hero.querySelector('.homepage-scroll-cue')) {
      const next=hero.nextElementSibling;
      const cue=document.createElement('a');
      cue.className='homepage-scroll-cue';
      cue.href='#';
      cue.setAttribute('aria-label','Scroll to discover more PawCare care');
      cue.innerHTML='<span>Scroll to discover</span><span aria-hidden="true">↓</span>';
      cue.addEventListener('click',event=>{
        event.preventDefault();
        (next||shop)?.scrollIntoView({behavior:'smooth',block:'start'});
      });
      hero.appendChild(cue);
    }

    const revealed=[...document.querySelectorAll('#shopView > section:not(.hero)')];
    revealed.forEach(section=>section.classList.add('pc-reveal-ready'));
    const revealObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('pc-is-visible');
        }else{
          entry.target.classList.remove('pc-is-visible');
        }
      });
    },{threshold:.12,rootMargin:'0px 0px -8% 0px'});
    revealed.forEach(section=>revealObserver.observe(section));

    const depthTargets=document.querySelectorAll(
      '#shopView .feature-card,#shopView .need-card,#shopView .pet-tile,' +
      '#shopView .category-banner,#shopView .care-banner,#shopView .business-proof__item,' +
      '#shopView .trust-item,#shopView .life-stage-card,#shopView .guide-card,' +
      '#shopView .testimonial-card,#shopView .promo-strip,#shopView .service-card'
    );
    depthTargets.forEach(target=>{
      target.style.transformStyle='preserve-3d';
      target.addEventListener('pointermove',event=>{
        if(matchMedia('(pointer: coarse)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const rect=target.getBoundingClientRect();
        const x=(event.clientX-rect.left)/rect.width-.5;
        const y=(event.clientY-rect.top)/rect.height-.5;
        target.style.transform=`translateY(-8px) perspective(1100px) rotateX(${y*-4.5}deg) rotateY(${x*5}deg) translateZ(5px)`;
      });
      target.addEventListener('pointerleave',()=>{
        target.style.transform='';
      });
    });

    let ticking=false;
    const updateHero=()=>{
      ticking=false;
      if(!hero) return;
      const rect=hero.getBoundingClientRect();
      if(rect.bottom>0 && rect.top<innerHeight){
        const progress=Math.max(0,Math.min(1,(innerHeight-rect.top)/(innerHeight+rect.height)));
        hero.style.setProperty('--pc-hero-parallax',`${(progress-.25)*18}px`);
      }
    };
    addEventListener('scroll',()=>{
      if(!ticking){ticking=true;requestAnimationFrame(updateHero)}
    },{passive:true});
    updateHero();
  } else if (document.body.classList.contains('home-page')) {
    document.querySelectorAll('#shopView > section:not(.hero)').forEach(section=>section.classList.add('pc-is-visible'));
  }
})();
