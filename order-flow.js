'use strict';

const flowSlots=['09:00–12:00','13:00–16:00','16:00–19:00'];
const flowStage=order=>Number.isInteger(order.stage)?Math.max(0,Math.min(3,order.stage)):0;
const flowPickup=order=>order.deliveryMode==='pickup' || (!order.deliveryMode && order.delivery==='自行取貨');
const flowDate=(offset=0)=>new Date(Date.now()+offset*86400000).toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'});
function flowTime(value) {
  const date=new Date(value);
  return value && Number.isFinite(date.getTime())?date.toLocaleString('zh-TW',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}):'先前版本未記錄時間';
}
function flowAmounts(order) {
  const price=Number.isFinite(order.price)?order.price:findProduct(order.productId)?.price ?? Math.max(0,order.total-(order.fee||0));
  return {price,fee:Number.isFinite(order.fee)?order.fee:Math.max(0,order.total-price),total:order.total};
}
function flowRoute(order) {
  const product=findProduct(order.productId);
  return {origin:order.schedule?.origin || order.origin || product?.city || '賣家示範取貨點',destination:order.schedule?.destination || order.destination || locations.find(city=>String(order.delivery).includes(city)) || '買家示範收貨點'};
}
function flowError(message) {
  const error=$('#flow-error');if(!error)return;
  error.textContent=message;error.hidden=!message;
  if(message)error.scrollIntoView({block:'nearest'});
}
function saveOrderFlow(id,changes) {
  const current=orders.find(order=>order.id===id);if(!current)return false;
  const next=orders.map(order=>order.id===id?{...order,...changes}:order);
  if(!persist('rehome-orders',next)){flowError('無法儲存這一步，資料尚未更新。請釋放瀏覽器空間後再試一次。');return false;}
  orders=next;return true;
}
function flowButton(order,screen,label,primary=false) {
  return `<button type="button" class="button ${primary?'button-primary':'button-outline'}" data-order-screen="${screen}" data-order-id="${escapeHtml(order.id)}">${label}${primary?' '+icon('arrow'):''}</button>`;
}
function flowHeader(order,screen,title,description) {
  const stage=flowStage(order);
  const current=screen==='schedule'?0:screen==='tracking'||screen==='arrival'?1:2;
  const steps=[['schedule','安排搬運'],['tracking','家具送達'],[stage===3?'complete':'receipt','收貨與撥款']];
  return `<div class="order-flow"><span class="flow-demo-badge">${icon('shield')}全程模擬 · 不會扣款或派車</span><div class="flow-heading"><div class="eyebrow">YOUR FURNITURE, ON ITS WAY</div><h2 id="dialog-title">${title}</h2><p>${description}</p></div><ol class="flow-step-nav" aria-label="訂單流程">${steps.map(([name,label],index)=>`<li><button type="button" data-order-screen="${name}" data-order-id="${escapeHtml(order.id)}" ${index>stage?'disabled':''} ${current===index?'aria-current="step"':''}><span>${index<current?'✓':index+1}</span>${label}</button></li>`).join('')}</ol><div class="flow-product">${order.photo?`<img src="${escapeHtml(order.photo)}" alt="${escapeHtml(order.title)}">`:''}<div><strong>${escapeHtml(order.title)}</strong><small>${escapeHtml(order.id)} · ${escapeHtml(order.dimensions || findProduct(order.productId)?.dimensions || '尺寸以商品資料為準')}</small></div><span style="text-align:right"><small>訂單試算合計</small>${money(flowAmounts(order).total)}</span></div>`;
}
function flowFooter() { return '<p id="flow-error" class="form-error" role="alert" hidden></p></div>'; }
function scheduleDetails(order) {
  const route=flowRoute(order);const schedule=order.schedule;
  return `<dl class="flow-info"><div><dt>取貨日期與時段（台灣時間）</dt><dd>${schedule?`${escapeHtml(schedule.date)}<br>${escapeHtml(schedule.slot)}`:'先前版本未填寫預約日期'}</dd></div><div><dt>搬運方式</dt><dd>${flowPickup(order)?'自行取貨（模擬）':'家具專車搬運（模擬服務）'}</dd></div><div><dt>取貨地點</dt><dd>${escapeHtml(route.origin)}</dd></div><div><dt>${flowPickup(order)?'取貨後安排':'送達地點'}</dt><dd>${flowPickup(order)?'由買家自行搬運':escapeHtml(route.destination)}</dd></div>${schedule?.notes?`<div class="span-2"><dt>搬運備註</dt><dd>${escapeHtml(schedule.notes)}</dd></div>`:''}</dl>`;
}
function renderScheduleScreen(order) {
  const pickup=flowPickup(order);const route=flowRoute(order);const stage=flowStage(order);
  let content=flowHeader(order,'schedule',pickup?'約好取貨的日子。':'安排家具的新旅程。','選擇日期與時段，把搬運細節先準備好。');
  if(order.schedule || stage>=2) {
    content+=`<div class="flow-notice">${icon('check')}<div><strong>${order.schedule?'搬運安排已儲存（模擬）':'這筆訂單已完成搬運步驟'}</strong><p>${order.schedule?'你的示範預約資料已保留，可以隨時回來查看。':'此為先前版本的訂單，未保存預約資料。'}</p></div></div>${scheduleDetails(order)}<div class="flow-actions"><button type="button" class="button button-outline" data-orders>返回我的訂單</button>${flowButton(order,'tracking','查看配送紀錄',true)}</div>`;
  } else {
    content+=`<div class="flow-service">${icon(pickup?'bag':'truck')}<div><strong>${pickup?'自行取貨':'家具專車搬運'} · 模擬服務</strong><p>${pickup?'由你與賣家約定時間，自行安排人力與車輛。':'示範搬運服務，沒有實際派車或業者預約。'}</p></div><span>${pickup?'免運費':`運費試算 ${money(flowAmounts(order).fee)}`}</span></div><form id="order-schedule-form" data-order-id="${escapeHtml(order.id)}"><div class="form-grid"><label class="form-field">${pickup?'取貨日期':'搬運日期'} *<input type="date" name="date" min="${flowDate()}" value="${flowDate(1)}" required></label><label class="form-field">希望時段（台灣時間）*<select name="slot" required>${flowSlots.map(slot=>`<option>${slot}</option>`).join('')}</select></label><label class="form-field ${pickup?'span-2':''}">取貨地點（示範）*<input name="origin" maxlength="80" required value="${escapeHtml(route.origin)}・示範取貨點"></label>${pickup?'':`<label class="form-field">送達地點（示範）*<input name="destination" maxlength="80" required value="${escapeHtml(route.destination)}・示範收貨點"></label>`}<label class="form-field span-2">搬運備註（選填）<textarea name="notes" maxlength="200" placeholder="例如：沙發可拆腳，請攜帶保護毯。"></textarea><small>用示範地點即可，不需要真實地址或聯絡資料。</small></label></div><label class="consent"><input type="checkbox" name="scheduleConsent" required><span>我了解這是模擬預約，資料只儲存在此瀏覽器，不會通知搬運業者。</span></label><div class="flow-actions"><button type="button" class="button button-outline" data-orders>稍後再安排</button><button class="button button-primary" type="submit">確認模擬${pickup?'取貨':'搬運'} ${icon('arrow')}</button></div></form>`;
  }
  showDialog(content+flowFooter());
  $('#order-schedule-form')?.addEventListener('submit',submitOrderSchedule);
}
function submitOrderSchedule(event) {
  event.preventDefault();const form=event.currentTarget;
  const order=orders.find(item=>item.id===form.dataset.orderId);if(!order)return;
  if(order.schedule || flowStage(order)>=2){openOrderFlow(order.id);return;}
  if(!form.reportValidity())return;
  const data=Object.fromEntries(new FormData(form));
  const validDate=/^\d{4}-\d{2}-\d{2}$/.test(data.date || '') && Number.isFinite(Date.parse(data.date+'T00:00:00Z')) && new Date(data.date+'T00:00:00Z').toISOString().slice(0,10)===data.date;
  if(!validDate || data.date<flowDate()){flowError('請選擇今天或之後的有效搬運日期。');return;}
  if(!flowSlots.includes(data.slot) || !data.origin?.trim() || (!flowPickup(order) && !data.destination?.trim())){flowError('請填寫取貨與送達地點，並選擇一個搬運時段。');return;}
  if(!form.elements.scheduleConsent?.checked){flowError('請勾選模擬預約說明。');return;}
  const schedule={date:data.date,slot:data.slot,origin:data.origin.trim().slice(0,80),destination:flowPickup(order)?'自行搬運':data.destination.trim().slice(0,80),notes:String(data.notes||'').trim().slice(0,200),bookedAt:new Date().toISOString()};
  if(saveOrderFlow(order.id,{stage:1,schedule}))openOrderFlow(order.id,'tracking');
}
function renderTrackingScreen(order) {
  const stage=flowStage(order);const moving=!!order.shipping?.startedAt;const arrived=stage>=2;const route=flowRoute(order);const pickup=flowPickup(order);
  const title=arrived?'家具已抵達新的家。':moving?(pickup?'正在完成取貨點交。':'家具正在前往新家。'):'搬運安排好了，準備出發。';
  let content=flowHeader(order,'tracking',title,'查看示範進度，逐步體驗取貨、運送與送達點交。');
  content+=`<div class="flow-route ${arrived?'is-arrived':moving?'is-moving':''}"><div class="flow-route-top"><strong>${pickup?'自行取貨紀錄':'家具配送進度'}</strong><span>模擬物流單號 DEMO-${escapeHtml(order.id)}</span></div><div class="flow-route-visual"><span class="flow-route-end">${icon('pin')}</span><div class="flow-route-road"><span class="flow-route-truck">${icon(pickup?'bag':'truck')}</span></div><span class="flow-route-end">${icon('check')}</span></div><div class="flow-route-labels"><div><small>FROM · 取貨點</small>${escapeHtml(route.origin)}</div><div><small>${pickup?'TO · 完成取貨':'TO · 收貨點'}</small>${pickup?'買家自行搬運':escapeHtml(route.destination)}</div></div><div class="flow-route-note">路線為視覺示意，無即時定位或真實車輛資訊。</div></div>`;
  const events=[['預約安排完成',order.schedule?`${order.schedule.date} · ${order.schedule.slot}`:'沿用先前版本的示範進度',true],['取件與搬運開始',order.shipping?.startedAt?flowTime(order.shipping.startedAt):'等待你啟動模擬搬運',moving||arrived],['家具送達並完成點交',order.arrival?.deliveredAt?flowTime(order.arrival.deliveredAt):arrived?'先前版本已標示送達':'等待模擬送達確認',arrived]];
  const current=arrived?2:moving?1:0;
  content+=`<ol class="delivery-events" aria-label="配送紀錄">${events.map(([label,detail,done],index)=>`<li class="${done?'done':''} ${index===current?'current':''}"><span></span><div><strong>${label}</strong><small>${escapeHtml(detail)}</small></div></li>`).join('')}</ol>${!order.schedule?`<p class="flow-caption">此為先前版本的訂單，未記錄預約明細。${stage===1?'<button class="text-button" type="button" data-order-screen="schedule" data-order-id="'+escapeHtml(order.id)+'">補填搬運資料</button>':''}</p>`:''}<div class="flow-actions"><button type="button" class="button button-outline" data-orders>返回我的訂單</button>${arrived?flowButton(order,'arrival','查看送達紀錄',true):moving?flowButton(order,'arrival',pickup?'模擬完成取貨':'模擬送達點交',true):`<button type="button" class="button button-primary" data-start-transport="${escapeHtml(order.id)}">${pickup?'模擬開始取貨':'模擬開始搬運'} ${icon('arrow')}</button>`}</div><p class="flow-caption">你可以直接推進模擬進度，不需等待預約日期；這些操作不會安排真實運送。</p>`;
  showDialog(content+flowFooter());
}
function startOrderTransport(id) {
  const order=orders.find(item=>item.id===id);if(!order || flowStage(order)!==1)return;
  if(order.shipping?.startedAt){openOrderFlow(id,'tracking');return;}
  if(saveOrderFlow(id,{shipping:{startedAt:new Date().toISOString(),trackingId:'DEMO-'+id}}))openOrderFlow(id,'tracking');
}
function renderArrivalScreen(order) {
  const arrived=flowStage(order)>=2;const pickup=flowPickup(order);
  let content=flowHeader(order,'arrival',arrived?(pickup?'家具已完成取貨。':'家具已送達。'):'完成這一站的點交。',arrived?'接下來，仔細驗收家具，再確認模擬撥款。':'填寫示範點交資料，讓配送紀錄完整留下來。');
  if(arrived) {
    content+=`<div class="flow-success"><span class="success-icon">${icon('check')}</span><h3>${pickup?'取貨完成':'送達完成'} · 模擬紀錄</h3><p>家具的新生活，從這一刻開始。</p></div><dl class="flow-info"><div><dt>${pickup?'取貨時間':'送達時間'}</dt><dd>${escapeHtml(flowTime(order.arrival?.deliveredAt))}</dd></div><div><dt>點交對象</dt><dd>${escapeHtml(order.arrival?.receiver || '先前版本未記錄點交對象')}</dd></div><div class="span-2"><dt>點交備註</dt><dd>${escapeHtml(order.arrival?.notes || '未填寫點交備註')}</dd></div></dl><div class="flow-notice">${icon('shield')}<div><strong>送達紀錄與收貨驗收分開確認</strong><p>你可以先檢查商品；確認收貨後才會顯示模擬撥款結果。</p></div></div><div class="flow-actions">${flowButton(order,'tracking','查看配送進度')}${flowButton(order,flowStage(order)===3?'complete':'receipt',flowStage(order)===3?'查看完成明細':'前往收貨驗收',true)}</div>`;
  } else {
    content+=`<div class="flow-notice">${icon('truck')}<div><strong>示範搬運已開始</strong><p>這個頁面模擬家具送達時的交接，不會通知任何物流業者。</p></div></div><form id="order-arrival-form" data-order-id="${escapeHtml(order.id)}"><div class="form-grid"><label class="form-field span-2">點交對象（示範）*<input name="receiver" value="示範收件人" required maxlength="30"></label><label class="form-field span-2">點交備註（選填）<textarea name="notes" maxlength="200" placeholder="例如：家具放置於客廳指定位置，配件隨附。"></textarea></label></div><label class="consent"><input type="checkbox" name="arrivalConsent" required><span>我確認此為家具到達指定地點的模擬點交，接下來仍需驗收商品。</span></label><div class="flow-actions">${flowButton(order,'tracking','返回配送進度')}<button class="button button-primary" type="submit">確認模擬${pickup?'取貨完成':'送達'} ${icon('check')}</button></div></form>`;
  }
  showDialog(content+flowFooter());$('#order-arrival-form')?.addEventListener('submit',submitOrderArrival);
}
function submitOrderArrival(event) {
  event.preventDefault();const form=event.currentTarget;const order=orders.find(item=>item.id===form.dataset.orderId);
  if(!order || flowStage(order)!==1 || !order.shipping?.startedAt)return;
  if(!form.reportValidity())return;const data=Object.fromEntries(new FormData(form));
  if(!data.receiver?.trim() || !form.elements.arrivalConsent?.checked){flowError('請填寫示範點交對象，並勾選點交確認。');return;}
  const arrival={receiver:data.receiver.trim().slice(0,30),notes:String(data.notes||'').trim().slice(0,200),deliveredAt:new Date().toISOString()};
  if(saveOrderFlow(order.id,{stage:2,arrival}))openOrderFlow(order.id,'arrival');
}
function renderReceiptScreen(order) {
  const amount=flowAmounts(order);const issueOpen=order.issue?.status==='open';
  let content=flowHeader(order,'receipt','確認剛剛好的新日常。','核對家具與配件，再完成收貨及模擬撥款。');
  if(issueOpen)content+=`<div class="flow-notice warning">${icon('shield')}<div><strong>已記錄商品問題，暫停模擬撥款</strong><p>${escapeHtml(order.issue.description)}</p></div></div><div class="flow-actions"><button class="button button-outline" type="button" data-orders>返回我的訂單</button><button class="button button-primary" type="button" data-resolve-order-issue="${escapeHtml(order.id)}">模擬問題已處理，重新驗收</button></div>`;
  else {
    content+=`${order.issue?.status==='resolved'?'<div class="flow-notice">'+icon('check')+'<div><strong>問題已標示為模擬處理完成</strong><p>請重新核對下列項目，再確認收貨。</p></div></div>':''}<form id="order-receipt-form" data-order-id="${escapeHtml(order.id)}"><h3 class="flow-section-title">收貨檢查清單</h3><label class="flow-check"><input name="itemMatch" type="checkbox" required><span><strong>商品與訂單相符</strong><small>確認家具種類、尺寸及數量符合預期。</small></span></label><label class="flow-check"><input name="conditionMatch" type="checkbox" required><span><strong>商品狀況已確認</strong><small>檢查外觀、結構與描述中的使用痕跡。</small></span></label><label class="flow-check"><input name="accessoriesMatch" type="checkbox" required><span><strong>配件與點交已完成</strong><small>確認約定的螺絲、椅腳或其他配件已齊全。</small></span></label><div class="flow-total"><div class="cost-row"><span>家具售價</span><span>${money(amount.price)}</span></div><div class="cost-row"><span>物流試算費</span><span>${money(amount.fee)}</span></div><div class="cost-row total"><span>賣家模擬撥款金額</span><strong>${money(amount.price)}</strong></div><div class="flow-zero"><span>本次實際扣款</span><strong>NT$ 0</strong></div><p class="flow-caption">模擬撥款至「示範賣家錢包」。物流費不計入賣家撥款，原型未設定平台手續費。</p></div><label class="consent"><input name="releaseConsent" type="checkbox" required><span>我了解確認後只會產生模擬收貨與撥款紀錄，不會扣款或轉帳。</span></label><div class="flow-actions">${flowButton(order,'arrival','查看送達紀錄')}<button class="button button-primary" type="submit">確認收貨並模擬撥款 ${icon('shield')}</button></div></form><details class="flow-issue"><summary>商品有問題？先記錄，暫停模擬撥款</summary><form id="order-issue-form" data-order-id="${escapeHtml(order.id)}"><label class="form-field">問題說明 *<textarea name="description" maxlength="300" required placeholder="例如：少了一顆椅腳螺絲，需要補件。"></textarea></label><button class="button button-outline" type="submit">儲存問題紀錄</button><p class="flow-caption">問題紀錄只保存在此瀏覽器，不會發送給賣家或客服。</p></form></details>`;
  }
  showDialog(content+flowFooter());$('#order-receipt-form')?.addEventListener('submit',submitOrderReceipt);$('#order-issue-form')?.addEventListener('submit',submitOrderIssue);
}
function submitOrderReceipt(event) {
  event.preventDefault();const form=event.currentTarget;const order=orders.find(item=>item.id===form.dataset.orderId);
  if(!order || flowStage(order)!==2)return;
  if(order.issue?.status==='open'){flowError('商品問題尚未處理，模擬撥款仍暫停。');return;}
  if(!form.reportValidity())return;
  const checks=['itemMatch','conditionMatch','accessoriesMatch','releaseConsent'];
  if(!checks.every(name=>form.elements[name]?.checked)){flowError('請完成收貨檢查清單，並勾選模擬撥款說明。');return;}
  const confirmedAt=new Date().toISOString();
  const receipt={confirmedAt,itemMatch:true,conditionMatch:true,accessoriesMatch:true};
  const payout={reference:'SIM-'+order.id,amount:flowAmounts(order).price,currency:'TWD',status:'simulated',confirmedAt,actualCharge:0};
  if(saveOrderFlow(order.id,{stage:3,receipt,payout}))openOrderFlow(order.id,'complete');
}
function submitOrderIssue(event) {
  event.preventDefault();const form=event.currentTarget;const order=orders.find(item=>item.id===form.dataset.orderId);
  if(!order || flowStage(order)!==2 || !form.reportValidity())return;
  const data=Object.fromEntries(new FormData(form));
  if(!data.description?.trim()){flowError('請填寫問題說明。');return;}
  if(saveOrderFlow(order.id,{issue:{status:'open',description:data.description.trim().slice(0,300),reportedAt:new Date().toISOString()}}))openOrderFlow(order.id,'receipt');
}
function resolveOrderIssue(id) {
  const order=orders.find(item=>item.id===id);if(!order || flowStage(order)!==2 || order.issue?.status!=='open')return;
  if(saveOrderFlow(id,{issue:{...order.issue,status:'resolved',resolvedAt:new Date().toISOString()}}))openOrderFlow(id,'receipt');
}
function renderCompleteScreen(order) {
  const amount=flowAmounts(order);const payout=order.payout;
  let content=flowHeader(order,'complete','這段旅程，圓滿完成。','家具找到了新家，也完成了收貨與撥款的模擬體驗。');
  content+=`<div class="flow-success"><span class="success-icon">${icon('check')}</span><h3>收貨確認，模擬撥款完成</h3><p>讓好家具繼續陪伴下一段日常。</p></div><div class="flow-receipt"><div class="eyebrow">SIMULATED PAYOUT · 模擬撥款金額</div><div class="flow-receipt-amount"><small>NT$</small>${(payout?.amount ?? amount.price).toLocaleString('zh-TW')}</div><div class="flow-receipt-body"><div class="cost-row"><span>撥款對象</span><span>示範賣家錢包</span></div><div class="cost-row"><span>明細參考編號</span><span>${escapeHtml(payout?.reference || 'SIM-'+order.id)}</span></div><div class="cost-row"><span>收貨確認時間</span><span>${escapeHtml(flowTime(order.receipt?.confirmedAt))}</span></div><div class="cost-row"><span>紀錄狀態</span><span>模擬完成 · 無資金移轉</span></div><div class="flow-zero"><span>本次實際扣款／轉帳</span><strong>NT$ 0</strong></div></div></div>${!payout?'<p class="flow-caption">此訂單來自先前版本，未保存收貨時間；上方為依訂單金額產生的示範明細。</p>':''}<div class="flow-notice">${icon('shield')}<div><strong>這是一份模擬完成紀錄</strong><p>未發生實際資金移轉，亦未建立銀行交易；不需提供信用卡或銀行帳號。</p></div></div><div class="flow-actions">${flowButton(order,'tracking','查看配送紀錄')}<button class="button button-primary" type="button" data-orders>返回我的訂單 ${icon('arrow')}</button></div>`;
  showDialog(content+flowFooter());
}
function openOrderFlow(id,requested) {
  const order=orders.find(item=>item.id===id);if(!order)return;
  const stage=flowStage(order);const defaultScreen=['schedule','tracking','receipt','complete'][stage];
  const available={schedule:true,tracking:stage>=1,arrival:stage>=2 || stage===1 && !!order.shipping?.startedAt,receipt:stage===2,complete:stage===3};
  const screen=Object.hasOwn(available,requested)&&available[requested]?requested:defaultScreen;
  const renderers={schedule:renderScheduleScreen,tracking:renderTrackingScreen,arrival:renderArrivalScreen,receipt:renderReceiptScreen,complete:renderCompleteScreen};
  renderers[screen](order);
}
