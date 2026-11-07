(() => {
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
    document.querySelectorAll('.product-card,.service-card,.feature-card,.category-card,.profile-card,.store-result-card').forEach(card=>{
      card.addEventListener('pointermove',e=>{
        const r=card.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;
        card.style.transform=`translateY(-6px) perspective(900px) rotateY(${x*4}deg) rotateX(${y*-4}deg)`;
      });
      card.addEventListener('pointerleave',()=>card.style.transform='');
    });
  }
})();
