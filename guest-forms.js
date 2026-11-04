(()=>{
 const side=document.body.dataset.invitationSide;
 const config=window.DAIHA_GUEST_CONFIG||{};
 const status=(form,message)=>{let el=form.querySelector('.guest-submit-status');if(!el){el=document.createElement('p');el.className='guest-submit-status';el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.style.cssText='font-size:13px;line-height:1.6;margin-top:12px';form.append(el)}el.textContent=message};
 const uuid=()=>crypto.randomUUID?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(20)),n=>n.toString(16).padStart(2,'0')).join('');
 let rsvpId;try{rsvpId=localStorage.getItem('daiha-online-rsvp-'+side)||uuid();localStorage.setItem('daiha-online-rsvp-'+side,rsvpId)}catch{rsvpId=uuid()}
 const pending=new Map();
 window.addEventListener('message',e=>{
  if(!/^https:\/\/(?:script\.google\.com|[a-z0-9-]+\.googleusercontent\.com)$/.test(e.origin))return;
  const d=e.data;if(!d||d.type!=='daiha-reply'||typeof d.requestId!=='string')return;
  const task=pending.get(d.requestId);if(!task)return;pending.delete(d.requestId);clearTimeout(task.timer);task.finish(d.ok,d.error);setTimeout(()=>{task.form.remove();task.frame.remove()},1000);
 });
 function submit(form,payload,onSuccess){
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(config.endpoint||'')){status(form,'Chưa kết nối nhận phản hồi. Vui lòng liên hệ cô dâu chú rể.');return}
  const button=form.querySelector('button[type="submit"],.submit-btn');if(button?.disabled)return;
  const original=button?.textContent;if(button){button.disabled=true;button.textContent='Đang gửi…'}status(form,'Đang gửi phản hồi…');
  const frame=document.createElement('iframe');frame.name='daiha_'+uuid().replaceAll('-','');frame.hidden=true;frame.title='Gửi phản hồi';document.body.append(frame);
  const post=document.createElement('form');post.method='POST';post.action=config.endpoint;post.target=frame.name;post.hidden=true;
  const input=document.createElement('input');input.name='payload';input.value=JSON.stringify(payload);post.append(input);document.body.append(post);
  const finish=(ok,error)=>{if(button){button.disabled=false;button.textContent=original}if(ok){status(form,payload.kind==='Lời chúc'?'Đã gửi lời chúc. Đại & Hà cảm ơn bạn!':'Đã nhận xác nhận tham dự. Cảm ơn bạn!');onSuccess?.()}else status(form,error||'Chưa xác nhận được việc lưu phản hồi. Vui lòng thử lại; gửi lại sẽ không tạo bản ghi trùng.')};
  const timer=setTimeout(()=>{pending.delete(payload.requestId);finish(false);post.remove();frame.remove()},45000);pending.set(payload.requestId,{timer,finish,form:post,frame});post.submit();
 }
 const rsvp=document.querySelector('#rsvpForm');
 if(rsvp){const b=rsvp.querySelector('.submit-btn');if(b)b.textContent='GỬI XÁC NHẬN';rsvp.onsubmit=e=>{e.preventDefault();if(!rsvp.reportValidity())return;const f=new FormData(rsvp);const coming=String(f.get('coming')).startsWith('Có')?'Có':'Không';submit(rsvp,{requestId:rsvpId,side,kind:'Xác nhận',name:String(f.get('name')||'').trim(),coming,count:coming==='Có'?Number.parseInt(String(f.get('count')),10):0,message:String(f.get('message')||'').trim(),website:''})}}
 const previousWishes=document.querySelector('#wishes');if(previousWishes){previousWishes.replaceChildren();previousWishes.hidden=true;}
 const wish=document.querySelector('#wishForm');let draftWish=null;
 if(wish){const name=wish.querySelector('input'),message=wish.querySelector('textarea'),button=wish.querySelector('button[type="submit"]');name.maxLength=80;message.maxLength=1000;if(button)button.textContent='GỬI LỜI CHÚC';wish.onsubmit=e=>{e.preventDefault();if(!wish.reportValidity())return;const data={side,kind:'Lời chúc',name:name.value.trim(),message:message.value.trim(),website:''};if(!data.name||!data.message)return;const fingerprint=JSON.stringify(data);if(!draftWish||draftWish.fingerprint!==fingerprint)draftWish={fingerprint,id:uuid()};submit(wish,{...data,requestId:draftWish.id},()=>{wish.reset();draftWish=null;window.dispatchEvent(new Event('daiha-wish-sent'))})}}
})();
