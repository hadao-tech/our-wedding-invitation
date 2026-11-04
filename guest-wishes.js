(()=>{
 const host=document.querySelector('#wishes');if(!host)return;
 host.hidden=false;host.replaceChildren();host.className='shared-wishes';
 const title=document.createElement('h3');title.textContent='Lời chúc yêu thương';
 const note=document.createElement('p');note.setAttribute('role','status');note.textContent='Đang đón những lời chúc…';
 const card=document.createElement('article');card.className='shared-wish-card';card.setAttribute('aria-hidden','true');
 const name=document.createElement('strong'),message=document.createElement('p');card.append(name,message);card.hidden=true;
 const button=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;return b};
 let wishes=[],index=0,timer,request=null,frame,timeout,script,callback;
 const activeCards=[];
 let streamFrame=null,lastFrame=0,nextArrival=0;
 const streamSpeed=42;
 function clearStream(){if(streamFrame!==null)cancelAnimationFrame(streamFrame);streamFrame=null;lastFrame=0;nextArrival=0;activeCards.splice(0).forEach(c=>c.el.remove())}
 function addWish(){
  const w=wishes[index];index=(index+1)%wishes.length;
  const item=document.createElement('article');item.className='shared-wish-card wish-stream-item';item.setAttribute('aria-hidden','true');
  const n=document.createElement('strong'),m=document.createElement('p');n.textContent=w.name;m.textContent=w.message;item.append(n,m);floating.append(item);
  const height=item.offsetHeight||130;
  activeCards.push({el:item,y:floating.clientHeight||380,height});
  nextArrival=(height+18)/streamSpeed;
 }
 function animateStream(now){
  if(document.hidden||dialog.open||!wishes.length){clearStream();return}
  const dt=lastFrame?Math.min((now-lastFrame)/1000,.08):0;lastFrame=now;
  nextArrival-=dt;
  if(nextArrival<=0)addWish();
  for(let j=activeCards.length-1;j>=0;j--){const c=activeCards[j];c.y-=streamSpeed*dt;
   const opacity=Math.max(0,Math.min(1,((floating.clientHeight||380)-c.y)/25,(c.y+c.height)/80));
   c.el.style.transform='translate3d(0,'+c.y.toFixed(2)+'px,0)';c.el.style.opacity=String(opacity);
   if(c.y < -c.height){c.el.remove();activeCards.splice(j,1)}
  }
  streamFrame=requestAnimationFrame(animateStream);
 }
 function show(i){
  if(!wishes.length||document.hidden||dialog.open)return;
  if(streamFrame!==null)return;
  index=(i+wishes.length)%wishes.length;floating.hidden=false;lastFrame=0;nextArrival=0;streamFrame=requestAnimationFrame(animateStream);
 }
 document.addEventListener('visibilitychange',()=>{clearTimeout(timer);if(document.hidden){floating.hidden=true;clearStream()}else show(index)});
 const recent=document.createElement('div');recent.className='wish-recent';
 const dialog=document.createElement('dialog');dialog.className='wish-list-dialog';dialog.setAttribute('aria-labelledby','wishListTitle');
 const heading=document.createElement('h2');heading.id='wishListTitle';heading.textContent='Lời chúc yêu thương';
 const list=document.createElement('div');list.className='wish-modal-list';
 const modalHeader=document.createElement('header');modalHeader.className='wish-modal-header';
 const close=button('×',()=>dialog.close());close.className='wish-modal-close';close.setAttribute('aria-label','Đóng danh sách lời chúc');modalHeader.append(heading,close);dialog.append(modalHeader,list);document.body.append(dialog);
 let bodyOverflow='';
 const openAll=button('Đọc tất cả lời chúc',()=>{rendered=0;list.replaceChildren();renderMore();bodyOverflow=document.body.style.overflow;document.body.style.overflow='hidden';clearTimeout(timer);floating.hidden=true;clearStream();dialog.showModal()});openAll.className='wish-open-all';openAll.hidden=true;
 dialog.addEventListener('close',()=>{document.body.style.overflow=bodyOverflow;show(index)});
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
 function wishArticle(w){const a=document.createElement('article'),n=document.createElement('strong'),m=document.createElement('p');a.className='wish-list-item';n.textContent=w.name;m.textContent=w.message;a.append(n,m);return a}
 let rendered=0;const more=button('Xem thêm lời chúc',renderMore);
 function renderMore(){more.remove();wishes.slice(rendered,rendered+30).forEach(w=>list.append(wishArticle(w)));rendered=Math.min(rendered+30,wishes.length);if(rendered<wishes.length)list.append(more)}
 const retry=button('Thử lại',load);retry.hidden=true;host.append(title,note,recent,openAll,retry);
 const floating=document.createElement('aside');floating.className='floating-wishes';floating.setAttribute('aria-label','Lời chúc gửi Đại và Hà');floating.hidden=true;
 document.body.append(floating);

 function cleanup(){clearTimeout(timeout);frame?.remove();script?.remove();if(callback)delete window[callback];frame=null;script=null;callback=null;request=null}
 function fail(){cleanup();note.textContent=wishes.length?'Chưa cập nhật được lời chúc mới.':'Chưa tải được lời chúc. Nếu vừa cập nhật thiệp, chủ thiệp cần triển khai phiên bản Apps Script mới.';retry.hidden=false}
 function load(){
  if(request)return;
  const endpoint=window.DAIHA_GUEST_CONFIG?.endpoint||'';
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(endpoint)){fail();return}
  retry.hidden=true;note.textContent='Đang tải lời chúc…';
  request=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
  callback='daihaWishes_'+request.replace(/[^a-zA-Z0-9_]/g,'');
  window[callback]=receive;
  script=document.createElement('script');script.src=endpoint+'?action=wishes&requestId='+encodeURIComponent(request)+'&callback='+callback;
  let fallbackStarted=false;
  function fallback(){if(!request||fallbackStarted)return;fallbackStarted=true;clearTimeout(timeout);frame=document.createElement('iframe');frame.hidden=true;frame.title='Tải lời chúc';frame.src=endpoint+'?action=wishes&requestId='+encodeURIComponent(request);timeout=setTimeout(fail,20000);document.body.append(frame)}
  script.onerror=fallback;timeout=setTimeout(fallback,8000);document.body.append(script);
 }
 window.addEventListener('message',e=>{
  if(!/^https:\/\/(?:script\.google\.com|[a-z0-9-]+\.googleusercontent\.com)$/.test(e.origin))return;
  receive(e.data);
 });
 function receive(d){
  if(!request||!d||d.type!=='daiha-wishes'||d.requestId!==request)return;
  if(!d.ok||!Array.isArray(d.wishes)){fail();return}cleanup();
  const oldCurrent=wishes[index];wishes=d.wishes.filter(w=>w&&typeof w.name==='string'&&typeof w.message==='string'&&w.message.trim()).map(w=>({name:w.name.slice(0,80),message:w.message.slice(0,1000)}));
  note.textContent=wishes.length?'Những yêu thương gửi đến Đại & Hà':'Hãy là người đầu tiên gửi lời chúc đến Đại & Hà!';
  openAll.hidden=!wishes.length;recent.replaceChildren();wishes.slice(0,3).forEach(w=>recent.append(wishArticle(w)));if(dialog.open){const scroll=list.scrollTop;list.replaceChildren();rendered=0;renderMore();list.scrollTop=scroll;}
  if(!wishes.length){clearTimeout(timer);clearStream();floating.hidden=true;return}
  const keep=oldCurrent?wishes.findIndex(w=>w.name===oldCurrent.name&&w.message===oldCurrent.message):-1;
  if(!oldCurrent||keep<0||floating.hidden)show(keep>=0?keep:0);else index=keep;
 }
 window.addEventListener('daiha-wish-sent',()=>{cleanup();load()});
 setInterval(()=>{if(!document.hidden)load()},60000);load();
})();
