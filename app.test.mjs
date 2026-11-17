import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,access} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';

const source=(await Promise.all(['dist/app.js','dist/order-flow.js'].map(file=>readFile(new URL(file,import.meta.url),'utf8')))).join('\n');
// Minimal DOM boundary for business and rendering tests. This is not a browser layout test.
function setup(initial={}) {
  const nodes=new Map();
  function node() { return {value:'',innerHTML:'',textContent:'',hidden:false,disabled:false,dataset:{},attributes:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},setAttribute(key,value){this.attributes[key]=value;},scrollIntoView(){},showModal(){this.open=true;},close(){this.open=false;}}; }
  function get(selector){if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector);}
  const categoryNodes=['all','sofa','chair','table','storage','bed','lamp'].map(category=>Object.assign(node(),{dataset:{category}}));
  const storage=new Map(Object.entries(initial));
  const document={querySelector:get,querySelectorAll:selector=>selector==='.category'?categoryNodes:[],addEventListener(){}};
  const context=vm.createContext({document,console,crypto:webcrypto,localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},setTimeout:()=>0,clearTimeout(){},FormData:class{constructor(form){this.data=form.values;}[Symbol.iterator](){return Object.entries(this.data)[Symbol.iterator]();}}});
  vm.runInContext(source,context);
  return {run:code=>vm.runInContext(code,context),get,storage};
}
const productIds=html=>[...new Set([...html.matchAll(/data-product="([^"]+)"/g)].map(match=>match[1]))];
const formSource=values=>`({reportValidity:()=>true,elements:${JSON.stringify(Object.fromEntries(Object.entries(values).map(([key,value])=>[key,{value}])))} })`;
const eventSource=form=>`({preventDefault(){},currentTarget:${form}})`;
const receiptChecks={itemMatch:true,conditionMatch:true,accessoriesMatch:true,releaseConsent:true};
function flowSubmit(app,handler,id,values={},checks={}) {
  const elements=Object.fromEntries(Object.entries(checks).map(([name,checked])=>[name,{checked}]));
  const form=`({dataset:{orderId:${JSON.stringify(id)}},values:${JSON.stringify(values)},elements:${JSON.stringify(elements)},reportValidity:()=>true})`;
  app.run(`${handler}(${eventSource(form)})`);
}
function makeFlowOrder(app,mode='delivery') {
  app.run('checkoutProduct=catalog[0]');app.run(`placeOrder(${eventSource(formSource({delivery:mode,destination:'新北市',floor:'1',elevator:'yes',assembly:'no'}))})`);
  return app.run('orders[0].id');
}
function arrangeFlow(app,id,overrides={}) {
  flowSubmit(app,'submitOrderSchedule',id,{date:app.run('flowDate(1)'),slot:'09:00–12:00',origin:'台北市・示範取貨點',destination:'新北市・示範收貨點',notes:'沙發可拆腳',...overrides},{scheduleConsent:true});
}
function deliverFlow(app,id) {
  app.run(`startOrderTransport(${JSON.stringify(id)})`);
  flowSubmit(app,'submitOrderArrival',id,{receiver:'示範收件人',notes:'已放置指定位置'},{arrivalConsent:true});
}

test('initial catalog, categories and combined filters return matching products',()=>{
  const app=setup();assert.equal(productIds(app.get('#product-grid').innerHTML).length,8);
  app.run("state.category='sofa';state.region='台北市';state.price='8000';state.condition='狀況良好';renderProducts()");
  assert.deepEqual(productIds(app.get('#product-grid').innerHTML),['rh-01']);
  app.run("state.search='不存在的家具';renderProducts()");
  assert.match(app.get('#product-grid').innerHTML,/還沒找到剛剛好的家具/);
  app.run('resetFilters()');assert.equal(productIds(app.get('#product-grid').innerHTML).length,8);
});
test('keyword search matches brand, type and location; price sorting is numeric',()=>{
  const app=setup();app.run("state.search='台中市';renderProducts()");
  assert.deepEqual(productIds(app.get('#product-grid').innerHTML),['rh-03','rh-08']);
  app.run("resetFilters();state.sort='price-asc';renderProducts()");
  assert.equal(productIds(app.get('#product-grid').innerHTML)[0],'rh-05');
  app.run("state.sort='price-desc';renderProducts()");
  assert.equal(productIds(app.get('#product-grid').innerHTML)[0],'rh-06');
});
test('favorites survive reload and can be removed from favorites view',()=>{
  const app=setup();app.run("toggleFavorite('rh-02');state.favoritesOnly=true;renderProducts()");
  assert.deepEqual(productIds(app.get('#product-grid').innerHTML),['rh-02']);
  const reloaded=setup(Object.fromEntries(app.storage));
  assert.equal(reloaded.run("favorites.has('rh-02')"),true);
  reloaded.run("state.favoritesOnly=true;toggleFavorite('rh-02')");
  assert.deepEqual(productIds(reloaded.get('#product-grid').innerHTML),[]);
});
test('corrupt local storage does not prevent startup',()=>{
  const app=setup({'rehome-favorites':'{broken','rehome-listings':'[{"id":"unsafe"}]','rehome-orders':'null'});
  assert.equal(productIds(app.get('#product-grid').innerHTML).length,8);
  assert.equal(app.run('favorites.size+listings.length+orders.length'),0);
});
test('delivery covers pickup, nearby and distant destinations, stairs and assembly',()=>{
  const app=setup();
  const estimate=values=>JSON.parse(app.run(`JSON.stringify(calculateDelivery(${formSource({delivery:'delivery',destination:'台北市',floor:'1',elevator:'yes',assembly:'no',...values})},catalog[0]))`));
  assert.equal(estimate({delivery:'pickup'}).fee,0);
  assert.equal(estimate({}).fee,1200);
  assert.equal(estimate({destination:'新北市'}).fee,1600);
  assert.equal(estimate({destination:'高雄市'}).fee,3000);
  assert.equal(estimate({floor:'5',elevator:'no',assembly:'yes'}).fee,2520);
  assert.equal(estimate({floor:'5',elevator:'yes'}).fee,1200);
});
test('estimation requires a photo and rejects whitespace-only details',()=>{
  const app=setup();const values={title:'示範沙發',brand:'無品牌',category:'sofa',age:'2',condition:'狀況良好',original:'15900',city:'台北市',length:'200',width:'88',height:'80',description:'完整商品描述'};
  const form=`({reportValidity:()=>true,values:${JSON.stringify(values)}})`;
  app.run('sellerDraft={photo:null}');app.run(`estimateFurniture(${eventSource(form)})`);
  assert.match(app.get('#seller-error').textContent,/照片/);
  app.run("sellerDraft={photo:catalog[0].photo}");
  const emptyForm=`({reportValidity:()=>true,values:${JSON.stringify({...values,title:'   '})}})`;
  app.run(`estimateFurniture(${eventSource(emptyForm)})`);assert.match(app.get('#seller-error').textContent,/空白/);
});
test('estimation produces a range with explicit demo disclosure and allows a custom listing price',()=>{
  const app=setup();
  const values={title:'我的沙發 <script>',brand:'自有品牌',category:'sofa',age:'2',condition:'狀況良好',original:'15900',city:'台北市',length:'200',width:'88',height:'80',description:'完整商品描述'};
  app.run("sellerDraft={photo:catalog[0].photo}");
  app.run(`estimateFurniture(${eventSource(`({reportValidity:()=>true,values:${JSON.stringify(values)}})`)})`);
  assert.match(app.get('#estimate-output').innerHTML,/6,200 – 8,400/);
  assert.match(app.get('#estimate-output').innerHTML,/未執行影像辨識/);
  app.get('#listing-price').value='7500';
  app.run(`publishListing(${eventSource('({reportValidity:()=>true})')})`);
  assert.equal(app.run('listings[0].price'),7500);
  assert.match(app.get('#product-grid').innerHTML,/我的沙發 &lt;script&gt;/);
  assert.doesNotMatch(app.get('#product-grid').innerHTML,/<script>/);
  const reloaded=setup(Object.fromEntries(app.storage));
  assert.equal(reloaded.run('listings.length'),1);
});
test('changing an estimate to older furniture lowers its suggested price',()=>{
  const app=setup();
  const values={title:'我的椅子',brand:'無品牌',category:'chair',age:'0',condition:'狀況良好',original:'8000',city:'台北市',length:'50',width:'50',height:'80',description:'狀況良好'};
  const estimate=age=>{app.run("sellerDraft={photo:catalog[1].photo}");app.run(`estimateFurniture(${eventSource(`({reportValidity:()=>true,values:${JSON.stringify({...values,age:String(age)})}})`)})`);return app.run('sellerDraft.price');};
  const newer=estimate(0);const older=estimate(4);assert.ok(older<newer);
});
test('mock order records the quoted total and survives reload',()=>{
  const app=setup();app.run('checkoutProduct=catalog[0]');
  app.run(`placeOrder(${eventSource(formSource({delivery:'delivery',destination:'台北市',floor:'5',elevator:'no',assembly:'yes'}))})`);
  assert.equal(app.run('orders[0].total'),9320);
  assert.match(app.get('#dialog-content').innerHTML,/未付款，也不會派送物流/);
  const reloaded=setup(Object.fromEntries(app.storage));assert.equal(reloaded.run('orders.length'),1);
  reloaded.run('openOrders()');assert.match(reloaded.get('#dialog-content').innerHTML,/9,320/);
});
test('all static image references are packaged and all SVG references have symbols',async()=>{
  const ids=[...source.matchAll(/image\('(photo-[^']+)'\)/g)].map(match=>match[1]);
  const html=await readFile(new URL('dist/index.html',import.meta.url),'utf8');
  const staticRefs=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match=>match[1]).filter(ref=>!ref.startsWith('#')&&!ref.startsWith('http'));
  for(const ref of staticRefs)await access(new URL('dist/'+ref,import.meta.url));
  for(const id of ids)await access(new URL(`dist/assets/${id}.jpg`,import.meta.url));
  await access(new URL('dist/assets/photo-1600210492486-724fe5c67fb0.jpg',import.meta.url));
  const symbols=new Set([...html.matchAll(/symbol id="([^"]+)"/g)].map(match=>match[1]));
  const refs=[...html.matchAll(/use href="#([^"]+)"/g)].map(match=>match[1]);
  const jsIcons=[...source.matchAll(/icon\('([^']+)'\)/g)].map(match=>'i-'+match[1]);
  for(const ref of [...refs,...jsIcons])assert.ok(symbols.has(ref),`Missing SVG ${ref}`);
});
test('order buttons open real step screens and completed forms advance to a zero-charge payout',()=>{
  const app=setup();app.run('checkoutProduct=catalog[0]');
  app.run(`placeOrder(${eventSource(formSource({delivery:'pickup'}))})`);
  const id=app.run('orders[0].id');
  assert.equal(app.run('orders[0].stage'),0);
  app.run(`advanceOrder(${JSON.stringify(id)})`);
  assert.equal(app.run('orders[0].stage'),0);assert.match(app.get('#dialog-content').innerHTML,/order-schedule-form/);
  arrangeFlow(app,id);assert.equal(app.run('orders[0].stage'),1);
  deliverFlow(app,id);assert.equal(app.run('orders[0].stage'),2);assert.match(app.get('#dialog-content').innerHTML,/取貨完成 · 模擬紀錄/);
  app.run(`openOrderFlow(${JSON.stringify(id)},'receipt')`);
  flowSubmit(app,'submitOrderReceipt',id,{},receiptChecks);
  assert.equal(app.run('orders[0].stage'),3);
  assert.equal(app.run('orders.length'),1);
  assert.match(app.get('#dialog-content').innerHTML,/未發生實際資金移轉/);assert.match(app.get('#dialog-content').innerHTML,/NT\$ 0/);
  const reloaded=setup(Object.fromEntries(app.storage));assert.equal(reloaded.run('orders[0].payout.actualCharge'),0);
});
test('deletion requires confirmation and keeping the record does not change orders',()=>{
  const app=setup();app.run('checkoutProduct=catalog[0]');
  app.run(`placeOrder(${eventSource(formSource({delivery:'pickup'}))})`);
  const id=app.run('orders[0].id');const before=app.storage.get('rehome-orders');
  app.run('openOrders()');assert.match(app.get('#dialog-content').innerHTML,/data-delete-order=/);
  app.run(`confirmDeleteOrder(${JSON.stringify(id)})`);
  assert.match(app.get('#dialog-content').innerHTML,/確認刪除/);
  assert.match(app.get('#dialog-content').innerHTML,/保留紀錄/);
  assert.equal(app.storage.get('rehome-orders'),before);
  app.run('openOrders()');assert.equal(app.run('orders.length'),1);
});
test('deleting a completed order preserves other orders, favorites and listings after reload',()=>{
  const app=setup();
  app.run("toggleFavorite('rh-01');listings=[{...catalog[2],id:'local-test'}];persist('rehome-listings',listings)");
  for(const index of [0,1]){app.run(`checkoutProduct=catalog[${index}]`);app.run(`placeOrder(${eventSource(formSource({delivery:'pickup'}))})`);}
  const id=app.run('orders[1].id');app.run('orders[1].stage=3;openOrders()');
  assert.match(app.get('#dialog-content').innerHTML,new RegExp(`data-delete-order="${id}"`));
  app.run(`deleteOrder(${JSON.stringify(id)})`);
  assert.equal(app.run('orders.length'),1);assert.equal(app.run('orders[0].productId'),'rh-02');
  const reloaded=setup(Object.fromEntries(app.storage));
  assert.equal(reloaded.run('orders.length'),1);assert.equal(reloaded.run('orders[0].productId'),'rh-02');
  assert.equal(reloaded.run("favorites.has('rh-01')"),true);assert.equal(reloaded.run('listings.length'),1);
});
test('deleting the last order shows the empty state and cannot restore it on reload',()=>{
  const app=setup();app.run('checkoutProduct=catalog[0]');app.run(`placeOrder(${eventSource(formSource({delivery:'pickup'}))})`);
  app.run('deleteOrder(orders[0].id)');assert.equal(app.run('orders.length'),0);
  assert.match(app.get('#dialog-content').innerHTML,/你的新生活，還有很多可能/);
  assert.doesNotMatch(app.get('#dialog-content').innerHTML,/data-delete-order=/);
  assert.equal(setup(Object.fromEntries(app.storage)).run('orders.length'),0);
});
test('failed storage leaves the order intact and reports that deletion did not happen',()=>{
  const app=setup();app.run('checkoutProduct=catalog[0]');app.run(`placeOrder(${eventSource(formSource({delivery:'pickup'}))})`);
  const before=app.storage.get('rehome-orders');
  app.run("localStorage.setItem=()=>{throw new Error('Storage unavailable')};deleteOrder(orders[0].id)");
  assert.equal(app.run('orders.length'),1);assert.equal(app.storage.get('rehome-orders'),before);
  assert.match(app.get('#toast').textContent,/尚未刪除/);
});
test('requested screens cannot skip scheduling, delivery, or receipt confirmation',()=>{
  const app=setup();const id=makeFlowOrder(app);
  for(const screen of ['tracking','arrival','receipt','complete']){
    app.run(`openOrderFlow(${JSON.stringify(id)},${JSON.stringify(screen)})`);
    assert.match(app.get('#dialog-content').innerHTML,/order-schedule-form/);
  }
  flowSubmit(app,'submitOrderReceipt',id,{},receiptChecks);
  assert.equal(app.run('orders[0].stage'),0);assert.equal(app.run('orders[0].payout'),undefined);
  app.run('openOrders()');assert.equal(app.run('orders[0].schedule'),undefined);
});
test('schedule validates the calendar and keeps route and Taiwan timeslot after reload',()=>{
  const app=setup();const id=makeFlowOrder(app);app.run(`openOrderFlow(${JSON.stringify(id)})`);
  arrangeFlow(app,id,{date:'2000-01-01'});assert.equal(app.run('orders[0].stage'),0);
  arrangeFlow(app,id,{date:'2099-02-30'});assert.equal(app.run('orders[0].stage'),0);
  arrangeFlow(app,id,{slot:'不合法時段'});assert.equal(app.run('orders[0].stage'),0);
  arrangeFlow(app,id);assert.equal(app.run('orders[0].stage'),1);
  const reloaded=setup(Object.fromEntries(app.storage));
  assert.equal(reloaded.run('orders[0].schedule.origin'),'台北市・示範取貨點');
  assert.equal(reloaded.run('orders[0].schedule.slot'),'09:00–12:00');
  assert.match(app.get('#dialog-content').innerHTML,/data-start-transport=/);
});
test('transport has a distinct moving state and repeated starts keep the first timestamp',()=>{
  const app=setup();const id=makeFlowOrder(app);arrangeFlow(app,id);
  flowSubmit(app,'submitOrderArrival',id,{receiver:'示範收件人'},{arrivalConsent:true});
  assert.equal(app.run('orders[0].stage'),1);assert.equal(app.run('orders[0].arrival'),undefined);
  app.run(`startOrderTransport(${JSON.stringify(id)})`);
  const first=app.run('orders[0].shipping.startedAt');
  assert.match(app.get('#dialog-content').innerHTML,/家具正在前往新家/);
  app.run(`startOrderTransport(${JSON.stringify(id)})`);assert.equal(app.run('orders[0].shipping.startedAt'),first);
  app.run(`openOrderFlow(${JSON.stringify(id)},'arrival')`);assert.match(app.get('#dialog-content').innerHTML,/order-arrival-form/);
});
test('arrival requires handover acknowledgement, records details, and does not release funds',()=>{
  const app=setup();const id=makeFlowOrder(app);arrangeFlow(app,id);app.run(`startOrderTransport(${JSON.stringify(id)})`);
  flowSubmit(app,'submitOrderArrival',id,{receiver:'   '},{arrivalConsent:true});assert.equal(app.run('orders[0].stage'),1);
  flowSubmit(app,'submitOrderArrival',id,{receiver:'示範收件人'},{arrivalConsent:false});assert.equal(app.run('orders[0].stage'),1);
  flowSubmit(app,'submitOrderArrival',id,{receiver:'示範收件人',notes:'<img src=x onerror=alert(1)>'},{arrivalConsent:true});
  assert.equal(app.run('orders[0].stage'),2);assert.equal(app.run('orders[0].payout'),undefined);
  assert.match(app.get('#dialog-content').innerHTML,/家具已送達/);
  assert.match(app.get('#dialog-content').innerHTML,/&lt;img src=x/);
  const reloaded=setup(Object.fromEntries(app.storage));assert.ok(reloaded.run('orders[0].arrival.deliveredAt'));
});
test('receipt requires every inspection item and payout excludes logistics fees',()=>{
  const app=setup();const id=makeFlowOrder(app);arrangeFlow(app,id);deliverFlow(app,id);
  flowSubmit(app,'submitOrderReceipt',id,{}, {...receiptChecks,conditionMatch:false});
  assert.equal(app.run('orders[0].stage'),2);assert.equal(app.run('orders[0].payout'),undefined);
  flowSubmit(app,'submitOrderReceipt',id,{},receiptChecks);
  assert.equal(app.run('orders[0].payout.amount'),6800);assert.equal(app.run('orders[0].fee'),1600);
  assert.equal(app.run('orders[0].payout.actualCharge'),0);assert.equal(app.run('orders[0].payout.status'),'simulated');
  const before=app.storage.get('rehome-orders');flowSubmit(app,'submitOrderReceipt',id,{},receiptChecks);
  assert.equal(app.storage.get('rehome-orders'),before);
});
test('a product issue pauses the mock payout until it is marked resolved and rechecked',()=>{
  const app=setup();const id=makeFlowOrder(app);arrangeFlow(app,id);deliverFlow(app,id);
  flowSubmit(app,'submitOrderIssue',id,{description:'少了一顆椅腳螺絲'});
  assert.match(app.get('#dialog-content').innerHTML,/暫停模擬撥款/);
  flowSubmit(app,'submitOrderReceipt',id,{},receiptChecks);assert.equal(app.run('orders[0].stage'),2);
  app.run(`resolveOrderIssue(${JSON.stringify(id)})`);
  assert.equal(app.run('orders[0].issue.status'),'resolved');assert.equal(app.run('orders[0].payout'),undefined);
  flowSubmit(app,'submitOrderReceipt',id,{},receiptChecks);assert.equal(app.run('orders[0].stage'),3);
});
test('previous-version orders retain their stages and open usable step screens',()=>{
  for(const stage of [0,1,2,3]){
    const legacy={id:'RH-LEGACY',productId:'rh-01',title:'舊版沙發訂單',price:6800,fee:1200,total:8000,delivery:'大件配送至台北市（1樓）',stage,createdAt:'2026-11-15T00:00:00Z'};
    const app=setup({'rehome-orders':JSON.stringify([legacy])});app.run("openOrderFlow('RH-LEGACY')");
    assert.equal(app.run('orders[0].stage'),stage);
    assert.match(app.get('#dialog-content').innerHTML,new RegExp(['order-schedule-form','家具配送進度','收貨檢查清單','模擬撥款金額'][stage]));
    if(stage===3)assert.match(app.get('#dialog-content').innerHTML,/先前版本/);
  }
});
test('failed workflow storage keeps the previous stage and displays an inline error',()=>{
  const app=setup();const id=makeFlowOrder(app);app.run(`openOrderFlow(${JSON.stringify(id)})`);
  const before=app.storage.get('rehome-orders');app.run("localStorage.setItem=()=>{throw new Error('Quota exceeded')}");
  arrangeFlow(app,id);assert.equal(app.run('orders[0].stage'),0);assert.equal(app.storage.get('rehome-orders'),before);
  assert.match(app.get('#flow-error').textContent,/資料尚未更新/);assert.equal(app.get('#flow-error').hidden,false);
});
