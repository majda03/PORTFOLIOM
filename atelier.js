'use strict';
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if(!reduce.matches)document.querySelectorAll('.hero-line>span').forEach((line,row)=>{const fragment=document.createDocumentFragment();[...line.textContent].forEach((char,index)=>{const span=document.createElement('span');span.className='glyph';span.style.setProperty('--delay',`${row*.13+index*.024}s`);span.textContent=char===' '?'\u00a0':char;fragment.append(span);});line.replaceChildren(fragment);});
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#navigation');
  function closeMenu(restoreFocus=false) { if (!menu || !nav) return; const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');nav.classList.remove('is-open');if(restoreFocus&&open)menu.focus(); }
  menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');nav.classList.toggle('is-open',open);});
  nav?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu(true);});
  document.addEventListener('pointerdown',e=>{if(nav&&!nav.contains(e.target)&&!menu.contains(e.target))closeMenu();});
  addEventListener('resize',()=>{if(innerWidth>760)closeMenu();},{passive:true});
  if ('IntersectionObserver' in window && !reduce.matches) {
    const reveal = new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');reveal.unobserve(entry.target);}}),{threshold:.04,rootMargin:'0px 0px -15px 0px'});
    document.querySelectorAll('[data-reveal]').forEach(el=>{el.classList.add('reveal-prepared');reveal.observe(el);});
    reduce.addEventListener('change',()=>{if(reduce.matches){document.querySelectorAll('.reveal-prepared').forEach(el=>el.classList.add('is-visible'));reveal.disconnect();}});
  }
  const progress=document.querySelector('.reading-progress'); let scrollPending=false;
  function updateProgress(){scrollPending=false;const max=document.documentElement.scrollHeight-innerHeight;progress?.style.setProperty('transform',`scaleX(${max>0?scrollY/max:0})`);}
  addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(updateProgress);}},{passive:true});updateProgress();
  const filters=[...document.querySelectorAll('[data-filter]')];
  filters.forEach(button=>button.addEventListener('click',()=>{filters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));let count=0;document.querySelectorAll('[data-category]').forEach(card=>{card.hidden=button.dataset.filter!=='all'&&card.dataset.category!==button.dataset.filter;if(!card.hidden){count++;card.classList.add('is-visible');}});const status=document.querySelector('.filter-status');if(status)status.textContent=`${count} projects shown`;updateProgress();}));
  const form=document.querySelector('#project-enquiry');
  form?.addEventListener('submit',async event=>{event.preventDefault();if(!form.reportValidity()||form.elements._gotcha.value)return;const button=form.querySelector('[type=submit]'),status=form.querySelector('.form-status'),original=button.innerHTML;button.disabled=true;button.textContent='Sending…';status.hidden=false;status.textContent='Sending your enquiry…';const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),20000);try{const response=await fetch(form.action,{method:'POST',body:new FormData(form),headers:{Accept:'application/json'},signal:controller.signal});if(!response.ok)throw new Error('Enquiry could not be sent');form.reset();status.textContent='Thank you. Your enquiry has been sent. I’ll reply personally.';}catch{status.replaceChildren(document.createTextNode('Your message could not be sent. Please email me at '));const link=document.createElement('a');link.href='mailto:majda.tech10@gmail.com';link.textContent='majda.tech10@gmail.com';status.append(link);}finally{clearTimeout(timeout);button.disabled=false;button.innerHTML=original;}});
  /* Instinct: an original parametric ribbon. Software 3D deliberately keeps
     the same rendered experience available on devices without WebGL. No
     external scripts, model downloads, or GPU-dependent loading screens. */
  const canvas=document.querySelector('#ribbon'); if(!canvas)return;
  const stage=canvas.closest('.sculpture'),ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
  const motionButton=stage.querySelector('.motion-toggle');
  let paused=reduce.matches,visible=true,raf=0,last=0,time=0,width=0,height=0,dpr=1;
  let targetX=0,targetY=0,turnX=0,turnY=0;
  const segments=innerWidth<760?144:220,bands=12,verts=[],faces=[];
  function sub(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]];}
  function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
  function norm(v){const l=Math.hypot(...v)||1;return v.map(n=>n/l);}
  function center(u){const r=1+.25*Math.cos(3*u);return[r*Math.cos(2*u),r*Math.sin(2*u),.53*Math.sin(3*u)];}
  for(let i=0;i<=segments;i++){
    const u=i/segments*Math.PI*2,c=center(u),t=norm(sub(center(u+.001),center(u-.001))),radial=norm(cross(t,[0,0,1])),binormal=norm(cross(t,radial));
    const twist=u*1.5+.4;
    for(let j=0;j<=bands;j++){
      const v=(j/bands-.5)*.53,bulge=Math.cos((j/bands-.5)*Math.PI)*.035;
      verts.push(c.map((n,k)=>n+v*(radial[k]*Math.cos(twist)+binormal[k]*Math.sin(twist))+bulge*(-radial[k]*Math.sin(twist)+binormal[k]*Math.cos(twist))));
    }
  }
  for(let i=0;i<segments;i++)for(let j=0;j<bands;j++){const a=i*(bands+1)+j,b=a+bands+1;faces.push([a,b,b+1,a+1,j]);}
  const normals=verts.map((v,k)=>{const i=Math.floor(k/(bands+1)),j=k%(bands+1);const a=verts[Math.max(0,i-1)*(bands+1)+j],b=verts[Math.min(segments,i+1)*(bands+1)+j],c=verts[i*(bands+1)+Math.max(0,j-1)],d=verts[i*(bands+1)+Math.min(bands,j+1)];return norm(cross(sub(b,a),sub(d,c)));});
  const transformed=new Array(verts.length),projected=new Array(verts.length),colors=new Array(verts.length);
  function transform(v,ax,ay,az){let x=v[0],y=v[1],z=v[2];let n=y*Math.cos(ax)-z*Math.sin(ax);z=y*Math.sin(ax)+z*Math.cos(ax);y=n;n=x*Math.cos(ay)+z*Math.sin(ay);z=-x*Math.sin(ay)+z*Math.cos(ay);x=n;n=x*Math.cos(az)-y*Math.sin(az);y=x*Math.sin(az)+y*Math.cos(az);return[n,y,z];}
  function resize(){const rect=stage.getBoundingClientRect();width=rect.width;height=rect.height;dpr=Math.min(devicePixelRatio||1,1.65);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);render();}
  function shade(n,edge){if(n[2]<0)n=n.map(v=>-v);const r=[2*n[2]*n[0],2*n[2]*n[1],2*n[2]*n[2]-1];
    const lightA=Math.exp(-Math.pow((r[0]+.43)/.17,2))*Math.exp(-Math.pow((r[1]+.18)/1.2,2));
    const lightB=Math.exp(-Math.pow((r[0]-.52)/.09,2))*.8;
    const top=Math.pow(Math.max(0,r[1]),3)*.32;
    const diffuse=Math.max(0,n[0]*-.3+n[1]*-.45+n[2]*.55)*.22;
    const darkStripe=1-Math.exp(-Math.pow((r[0]+.03)/.075,2))*.65;
    const b=(.12+lightA*.85+lightB*.55+top+diffuse)*darkStripe;
    const warm=Math.max(0,-r[1])*.16,edgeDark=(edge===0||edge===bands-1)?.82:1;
    return [Math.min(255,(b*230+warm*90)*edgeDark)|0,Math.min(255,(b*211+warm*20)*edgeDark)|0,Math.min(255,(b*205+warm*40)*edgeDark)|0];
  }
  function render(){if(!width||!height)return;ctx.clearRect(0,0,width,height);const ax=.56+turnY*.3,ay=-.38+turnX*.45+Math.sin(time*.13)*.22,az=-.38+time*.055;const scale=Math.min(width*.36,height*.38);const cx=width*.5,cy=height*.49;
    for(let i=0;i<verts.length;i++){const p=transform(verts[i],ax,ay,az);transformed[i]=p;const perspective=5/(5-p[2]);projected[i]=[cx+p[0]*scale*perspective,cy+p[1]*scale*perspective];colors[i]=shade(transform(normals[i],ax,ay,az),-1);}
    const ordered=faces.map(f=>({f,z:(transformed[f[0]][2]+transformed[f[1]][2]+transformed[f[2]][2]+transformed[f[3]][2])*.25})).sort((a,b)=>a.z-b.z);
    ctx.lineWidth=.6;ctx.lineJoin='round';for(const {f} of ordered){
      const indices=f.slice(0,4),points=indices.map(i=>projected[i]),cols=indices.map(i=>colors[i]);
      const centerP=[0,1].map(k=>points.reduce((sum,p)=>sum+p[k],0)/4),centerC=[0,1,2].map(k=>cols.reduce((sum,c)=>sum+c[k],0)/4);
      const u=[0,1].map(k=>(points[1][k]+points[2][k]-points[0][k]-points[3][k])/2),v=[0,1].map(k=>(points[3][k]+points[2][k]-points[0][k]-points[1][k])/2),det=u[0]*v[1]-u[1]*v[0];
      let fill=`rgb(${centerC.map(Math.round).join(',')})`;
      if(Math.abs(det)>.001){const slopes=[0,1,2].map(k=>{const du=(cols[1][k]+cols[2][k]-cols[0][k]-cols[3][k])/2,dv=(cols[3][k]+cols[2][k]-cols[0][k]-cols[1][k])/2;return[(du*v[1]-dv*u[1])/det,(u[0]*dv-v[0]*du)/det];});
        const length=Math.hypot(...slopes[0]);if(length>.03){const dir=slopes[0].map(n=>n/length),t=points.map(p=>(p[0]-centerP[0])*dir[0]+(p[1]-centerP[1])*dir[1]),lo=Math.min(...t),hi=Math.max(...t);
          fill=ctx.createLinearGradient(centerP[0]+dir[0]*lo,centerP[1]+dir[1]*lo,centerP[0]+dir[0]*hi,centerP[1]+dir[1]*hi);
          for(const [stop,distance] of [[0,lo],[1,hi]]){const color=centerC.map((c,k)=>Math.max(0,Math.min(255,Math.round(c+(slopes[k][0]*dir[0]+slopes[k][1]*dir[1])*distance))));fill.addColorStop(stop,`rgb(${color.join(',')})`);}
        }
      }
      ctx.beginPath();for(let k=0;k<4;k++){const p=projected[f[k]];if(k)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);}ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=fill;ctx.stroke();}
    stage.classList.add('ready');
  }
  function frame(stamp){raf=0;if(paused||!visible||document.hidden)return;if(stamp-last>=40){const dt=last?Math.min((stamp-last)/1000,.08):0;last=stamp;time+=dt;turnX+=(targetX-turnX)*.055;turnY+=(targetY-turnY)*.055;render();}raf=requestAnimationFrame(frame);}
  function start(){if(!raf&&!paused&&visible&&!document.hidden){last=0;raf=requestAnimationFrame(frame);}}
  function setPaused(value){paused=value;document.documentElement.classList.toggle('motion-paused',paused);motionButton.setAttribute('aria-pressed',String(paused));motionButton.textContent=paused?'Play motion':'Pause motion';if(paused){cancelAnimationFrame(raf);raf=0;render();}else start();}
  motionButton.addEventListener('click',()=>setPaused(!paused));reduce.addEventListener('change',()=>setPaused(reduce.matches));
  const hero=document.querySelector('.hero');hero.addEventListener('pointermove',e=>{if(reduce.matches||paused)return;const b=hero.getBoundingClientRect();targetX=(e.clientX-b.left)/b.width*2-1;targetY=(e.clientY-b.top)/b.height*2-1;});hero.addEventListener('pointerleave',()=>{targetX=0;targetY=0;});
  // Pointer movement is optional. The pause/play control works by keyboard and touch.
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else{cancelAnimationFrame(raf);raf=0;}},{threshold:0}).observe(stage);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else start();});
  if('ResizeObserver'in window)new ResizeObserver(resize).observe(stage);else addEventListener('resize',resize,{passive:true});resize();setPaused(paused);
})();
