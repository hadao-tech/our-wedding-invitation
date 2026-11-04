const SPREADSHEET_ID = '1QM6rdU7xkaI_IjWbU8tjLrqV6sKRpIyvvBu8LTK_-vY';
const HEADERS = ['Thời gian gửi','Nhà','Loại phản hồi','Họ và tên','Tham dự','Số người','Lời nhắn','Mã phản hồi'];
function setup() {
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);ss.setSpreadsheetTimeZone('Asia/Ho_Chi_Minh');
  const sheet=ss.getSheetByName('Phản hồi');
  if(!sheet || sheet.getRange(1,1,1,8).getValues()[0].join('|')!==HEADERS.join('|'))throw new Error('Tiêu đề bảng không khớp.');
  if(sheet.getMaxRows()<20001)sheet.insertRowsAfter(sheet.getMaxRows(),20001-sheet.getMaxRows());
  sheet.setFrozenRows(1);if(!sheet.getFilter())sheet.getRange(1,1,20001,8).createFilter();
  sheet.getRange('A2:A20001').setNumberFormat('dd/MM/yyyy HH:mm:ss');
  sheet.getRange('F2:F20001').setNumberFormat('0');
  ss.getSheetByName('Tổng hợp').getRange('B10').setValue('Đã cấp quyền, chờ gửi thử');
}
function doGet(e){if(e&&e.parameter.action==='wishes')return wishesReply_(e.parameter.requestId,e.parameter.callback);return ContentService.createTextOutput(JSON.stringify({ok:true,service:'daiha-rsvp',version:3,features:['public-wishes']})).setMimeType(ContentService.MimeType.JSON);}
function normalize_(raw){
  if(!raw||typeof raw!=='object'||raw.website)throw new Error('Yêu cầu không hợp lệ.');
  const id=String(raw.requestId||'');if(!/^[a-zA-Z0-9_-]{20,80}$/.test(id))throw new Error('Mã phản hồi không hợp lệ.');
  const side=String(raw.side||'');if(!['Nhà trai','Nhà gái'].includes(side))throw new Error('Thiệp không hợp lệ.');
  const kind=String(raw.kind||'');if(!['Xác nhận','Lời chúc'].includes(kind))throw new Error('Loại phản hồi không hợp lệ.');
  const name=String(raw.name||'').trim();if(!name||name.length>80)throw new Error('Vui lòng nhập tên tối đa 80 ký tự.');
  const message=String(raw.message||'').trim();if(message.length>1000||(kind==='Lời chúc'&&!message))throw new Error('Vui lòng kiểm tra lời nhắn (tối đa 1.000 ký tự).');
  let coming='',count=0;
  if(kind==='Xác nhận'){
    coming=String(raw.coming||'');if(!['Có','Không'].includes(coming))throw new Error('Vui lòng chọn có tham dự hay không.');
    count=Number(raw.count);if(coming==='Có'&&(!Number.isInteger(count)||count<1||count>20))throw new Error('Số người tham dự cần từ 1 đến 20.');
    if(coming==='Không')count=0;
  }
  return {id,side,kind,name,message,coming,count};
}
function safeText_(value){return /^\s*[=+\-@\t\r]/.test(value)?"'"+value:value;}
function record_(p){
 const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sheet=ss.getSheetByName('Phản hồi');
 if(!sheet||sheet.getRange(1,1,1,8).getValues()[0].join('|')!==HEADERS.join('|'))throw new Error('Bảng nhận phản hồi chưa sẵn sàng.');
 const last=sheet.getLastRow();let row=0;
 if(last>1){const ids=sheet.getRange(2,8,last-1,1).getValues();for(let i=0;i<ids.length;i++)if(ids[i][0]===p.id){row=i+2;break;}}
 if(row&&p.kind==='Lời chúc')return;
 if(!row){if(last>=20001)throw new Error('Bảng đã đủ 20.000 phản hồi.');row=last+1;}
 sheet.getRange(row,1,1,8).setValues([[new Date(),p.side,p.kind,safeText_(p.name),p.coming,p.count,safeText_(p.message),p.id]]);
 ss.getSheetByName('Tổng hợp').getRange('B10').setValue('Đang nhận phản hồi');SpreadsheetApp.flush();
}
function reply_(requestId,ok,error){
 const result={type:'daiha-reply',requestId:String(requestId||''),ok:!!ok,error:error||''};
 const json=JSON.stringify(result).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
 return HtmlService.createHtmlOutput('<!doctype html><meta charset="utf-8"><script>window.top.postMessage('+json+',"*");</script>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function doPost(e){
 let raw={},lock;
 try{raw=JSON.parse(e.parameter.payload||'{}');const p=normalize_(raw);lock=LockService.getScriptLock();lock.waitLock(20000);record_(p);return reply_(p.id,true);}
 catch(err){return reply_(raw.requestId,false,err&&err.message?err.message:'Chưa lưu được phản hồi.');}
 finally{if(lock&&lock.hasLock())lock.releaseLock();}
}

// Public feed: only names and explicit wishes, never RSVP messages or guest counts.
function wishesReply_(requestId,callback){
 let wishes=[],ok=true;
 try {
  const sheet=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Phản hồi');
  if(!sheet)throw new Error('Missing sheet');
  const last=sheet.getLastRow();
  if(last>1)wishes=sheet.getRange(2,1,last-1,8).getValues().filter(r=>r[2]==='Lời chúc'&&String(r[6]).trim()).reverse().map(r=>({name:String(r[3]).slice(0,80),message:String(r[6]).slice(0,1000)}));
 }catch(err){ok=false;}
 const result={type:'daiha-wishes',requestId:String(requestId||''),ok,wishes};
 if(callback&&/^daihaWishes_[a-zA-Z0-9_]+$/.test(callback))return ContentService.createTextOutput(callback+'('+JSON.stringify(result).replace(/</g,'\\u003c')+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
 const json=JSON.stringify(result).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
 return HtmlService.createHtmlOutput('<!doctype html><meta charset="utf-8"><script>window.top.postMessage('+json+',"*");</script>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
