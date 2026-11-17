'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money = value => `NT$ ${Number(value).toLocaleString('zh-TW')}`;
const image = id => `${id}.jpg`;
const storedPhoto = value => typeof value === 'string' && /^assets\/photo-[a-z0-9-]+\.jpg$/.test(value) ? value.slice(7) : value;
const categories = { sofa:'沙發', chair:'椅子', table:'桌子', storage:'櫃子・收納', bed:'床架', lamp:'燈具' };
const locations = ['台北市','新北市','桃園市','台中市','高雄市'];
const catalog = [
  {id:'rh-01',title:'北歐織品三人沙發',brand:'北歐風格',category:'sofa',price:6800,original:15900,city:'台北市',district:'大安區',condition:'狀況良好',age:2,dimensions:'200 × 88 × 80 cm',photo:image('photo-1555041469-a586c61ea9bc'),badge:'精選好物',description:'沉穩綠色織品搭配俐落木腳，適合想為客廳添一點色彩的你。坐墊保持良好，扶手有輕微日常使用痕跡。此為情境示範商品，照片僅供展示。'},
  {id:'rh-02',title:'弧線造型單人休閒椅',brand:'設計選品',category:'chair',price:3200,original:7800,city:'新北市',district:'板橋區',condition:'近全新',age:1,dimensions:'72 × 76 × 82 cm',photo:image('photo-1567538096630-e0c55bd6374c'),badge:'近全新',description:'柔和弧線與舒適座面，放在窗邊就是一個人的閱讀角落。示範設定為使用約一年、無明顯污漬。此為情境示範商品，照片僅供展示。'},
  {id:'rh-03',title:'簡約生活工作桌',brand:'生活選品',category:'table',price:2400,original:5900,city:'台中市',district:'西區',condition:'狀況良好',age:2,dimensions:'120 × 60 × 74 cm',photo:image('photo-1518455027359-f3f8164ba6bd'),badge:'小資好選擇',description:'把工作與生活整理得剛剛好。簡約桌面適合筆電、閱讀與日常書寫，邊角有正常使用痕跡。此為情境示範商品，照片僅供展示。'},
  {id:'rh-04',title:'自然木色收納高櫃',brand:'原木選品',category:'storage',price:4500,original:9800,city:'桃園市',district:'中壢區',condition:'狀況良好',age:3,dimensions:'100 × 42 × 180 cm',photo:image('photo-1595428774223-ef52624120d2'),badge:'收納提案',description:'溫潤木色為空間帶來安定感，收起生活雜物，也留一點空間給喜歡的擺飾。櫃體結構穩固，表面有細微刮痕。此為情境示範商品，照片僅供展示。'},
  {id:'rh-05',title:'暖光設計立燈',brand:'燈光選品',category:'lamp',price:1800,original:4200,city:'台北市',district:'松山區',condition:'近全新',age:1,dimensions:'35 × 35 × 150 cm',photo:image('photo-1507473885765-e6ed057f782c'),badge:'溫暖角落',description:'讓光線陪伴每一個舒服的夜晚。燈具開關及電線在示範設定中均正常，適合客廳或臥室角落。此為情境示範商品，照片僅供展示。'},
  {id:'rh-06',title:'焦糖棕皮面三人沙發',brand:'居家選品',category:'sofa',price:8800,original:22000,city:'高雄市',district:'左營區',condition:'近全新',age:1,dimensions:'205 × 90 × 78 cm',photo:image('photo-1540574163026-643ea20ade25'),badge:'精選好物',description:'暖棕色皮面與柔軟坐感，為客廳留一個放鬆的位置。使用約一年，因搬家釋出。此為情境示範商品，照片僅供展示。'},
  {id:'rh-07',title:'米色繃布雙人床架',brand:'自然選品',category:'bed',price:5200,original:12500,city:'新北市',district:'新店區',condition:'狀況良好',age:3,dimensions:'155 × 195 × 110 cm',photo:image('photo-1505693416388-ac5ce068fe85'),badge:'臥室好選',description:'回到家，好好休息。繃布床頭搭配柔和米色，示範商品不包含床墊與寢具。購買前請再次確認尺寸與樓梯轉角。此為情境示範商品，照片僅供展示。'},
  {id:'rh-08',title:'極簡白色日常餐桌',brand:'日常選品',category:'table',price:3600,original:9000,city:'台中市',district:'北屯區',condition:'有使用痕跡',age:4,dimensions:'140 × 80 × 75 cm',photo:image('photo-1617806118233-18e1de247200'),badge:'循環好物',description:'一起吃飯、聊天，把日常慢慢過成喜歡的樣子。桌面有可見使用刮痕，售價已反映狀況；不包含餐椅。此為情境示範商品，照片僅供展示。'}
];

function readStorage(key, fallback, validate) {
  try { const value = JSON.parse(localStorage.getItem(key)); return validate(value) ? value : fallback; }
  catch { return fallback; }
}
const validListing = item => item && typeof item.id === 'string' && typeof item.title === 'string' && Object.hasOwn(categories,item.category) && Number.isFinite(item.price) && item.price > 0 && typeof item.photo === 'string' && /^(data:image\/(jpeg|png|webp);base64,|(?:assets\/)?photo-[a-z0-9-]+\.jpg$)/.test(item.photo);
let listings = readStorage('rehome-listings', [], value => Array.isArray(value) && value.every(validListing)).map(item=>({...item,photo:storedPhoto(item.photo)}));
let favorites = new Set(readStorage('rehome-favorites', [], value => Array.isArray(value) && value.every(id => typeof id === 'string')));
let orders = readStorage('rehome-orders', [], value => Array.isArray(value) && value.every(item => item && typeof item.productId === 'string' && Number.isFinite(item.total) && typeof item.title === 'string')).map(item=>({...item,photo:storedPhoto(item.photo)}));
const state = {category:'all',search:'',region:'all',price:'all',condition:'all',sort:'recommended',favoritesOnly:false};
const dialog = $('#main-dialog');
const dialogContent = $('#dialog-content');
let sellerDraft = null;
let uploadGeneration = 0;
let checkoutProduct = null;
let toastTimer;
const allProducts = () => [...listings, ...catalog];
const findProduct = id => allProducts().find(product => product.id === id);
function persist(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { showToast('瀏覽器儲存空間不足；本次操作仍有效，重新整理後可能不會保留。'); return false; }
}
function showToast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3300);
}
function favoriteMarkup(id) { return `${icon('heart')}`; }
function renderProducts() {
  const query = state.search.trim().toLocaleLowerCase();
  let products = allProducts().filter(p =>
    (state.category === 'all' || p.category === state.category) &&
    (!query || `${p.title} ${p.brand} ${p.city} ${p.description} ${categories[p.category]}`.toLocaleLowerCase().includes(query)) &&
    (state.region === 'all' || p.city === state.region) &&
    (state.price === 'all' || p.price <= Number(state.price)) &&
    (state.condition === 'all' || p.condition === state.condition) &&
    (!state.favoritesOnly || favorites.has(p.id))
  );
  if (state.sort === 'price-asc') products.sort((a,b) => a.price-b.price);
  if (state.sort === 'price-desc') products.sort((a,b) => b.price-a.price);
  if (state.sort === 'newest') products = [...products.filter(p=>p.id.startsWith('local-')), ...products.filter(p=>!p.id.startsWith('local-')).reverse()];
  $('#result-count').innerHTML = `${state.favoritesOnly ? '我的收藏・' : '找到 '}<strong>${products.length}</strong> 件好家具`;
  $('#market-title').textContent = state.favoritesOnly ? '把喜歡的，先留在這裡。' : '為生活，添一點剛剛好。';
  $('#favorite-count').textContent = favorites.size;
  $('#favorite-count').hidden = favorites.size === 0;
  $('.favorite-nav').setAttribute('aria-pressed', String(state.favoritesOnly));
  const filtered = state.category !== 'all' || query || state.region !== 'all' || state.price !== 'all' || state.condition !== 'all' || state.favoritesOnly;
  $('#reset-filters').hidden = !filtered;
  $$('.category').forEach(button => { const active = button.dataset.category === state.category; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  $('#product-grid').innerHTML = products.length ? products.map(p => `
    <article class="product-card"><div class="product-image-wrap"><button class="product-open" type="button" data-product="${escapeHtml(p.id)}" aria-label="查看${escapeHtml(p.title)}"><img src="${escapeHtml(p.photo)}" alt="${escapeHtml(p.title)}" loading="lazy"><span class="product-badge">${p.id.startsWith('local-') ? icon('check') : icon('leaf')}${escapeHtml(p.badge || '新上架')}</span><span class="product-condition">${escapeHtml(p.condition)}</span></button><button class="icon-button card-favorite ${favorites.has(p.id)?'is-saved':''}" type="button" data-favorite="${escapeHtml(p.id)}" aria-label="${favorites.has(p.id)?'取消收藏':'收藏'}${escapeHtml(p.title)}" aria-pressed="${favorites.has(p.id)}">${favoriteMarkup(p.id)}</button></div><div class="product-details"><div class="product-meta"><span>${escapeHtml(p.brand)} · ${escapeHtml(categories[p.category])}</span><span class="product-location">${icon('pin')}${escapeHtml(p.city)}</span></div><h3 class="product-title"><button type="button" data-product="${escapeHtml(p.id)}">${escapeHtml(p.title)}</button></h3><div class="product-price-row"><span class="product-price"><small>NT$</small>${p.price.toLocaleString('zh-TW')}${p.original>p.price?`<span class="product-original">${p.original.toLocaleString('zh-TW')}</span>`:''}</span><span class="product-shipping">${icon('truck')}可試算配送</span></div></div></article>`).join('') : `<div class="empty-state">${icon(state.favoritesOnly?'heart':'search')}<h3>${state.favoritesOnly?'還沒有符合條件的收藏':'還沒找到剛剛好的家具'}</h3><p>${state.favoritesOnly?'點選商品右上角的愛心，留住你喜歡的家具。':'試試其他關鍵字，或放寬地區與價格條件。'}</p><button type="button" class="button button-outline" data-reset>看看全部家具 ${icon('arrow')}</button></div>`;
}
function resetFilters() {
  Object.assign(state,{category:'all',search:'',region:'all',price:'all',condition:'all',sort:'recommended',favoritesOnly:false});
  $('#search').value=''; ['region','price','condition'].forEach(id=>$('#'+id).value='all'); $('#sort').value='recommended'; renderProducts();
}
function toggleFavorite(id) {
  if(favorites.has(id)) { favorites.delete(id); showToast('已從收藏移除'); }
  else { favorites.add(id); showToast('已收藏，喜歡的家具先替你留著'); }
  persist('rehome-favorites',[...favorites]); renderProducts();
  $$('[data-modal-favorite]').forEach(button => { if(button.dataset.modalFavorite === id) { button.innerHTML=`${icon('heart')}${favorites.has(id)?'已收藏':'收藏'}`; button.setAttribute('aria-pressed',String(favorites.has(id))); } });
}
function showDialog(markup) {
  dialogContent.innerHTML = markup;
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop=0;
}
function openProduct(id) {
  const p = findProduct(id); if(!p) return;
  showDialog(`<div class="detail-layout"><img class="detail-image" src="${escapeHtml(p.photo)}" alt="${escapeHtml(p.title)}"><div class="detail-info"><div class="eyebrow">${escapeHtml(categories[p.category])} · ${escapeHtml(p.condition)}</div><h2 id="dialog-title">${escapeHtml(p.title)}</h2><div class="detail-price"><small>NT$</small> ${p.price.toLocaleString('zh-TW')}</div><p class="detail-description">${escapeHtml(p.description)}</p><dl class="specs"><div><dt>品牌／風格</dt><dd>${escapeHtml(p.brand)}</dd></div><div><dt>家具尺寸（長 × 寬 × 高）</dt><dd>${escapeHtml(p.dimensions)}</dd></div><div><dt>使用年限</dt><dd>${p.age} 年</dd></div><div><dt>取貨地點</dt><dd>${escapeHtml(p.city)} ${escapeHtml(p.district || '')}</dd></div></dl><div class="detail-action-row"><button class="button button-primary" type="button" data-checkout="${escapeHtml(p.id)}">配送試算與下單 ${icon('arrow')}</button><button class="button button-outline" type="button" data-modal-favorite="${escapeHtml(p.id)}" aria-pressed="${favorites.has(p.id)}">${icon('heart')}${favorites.has(p.id)?'已收藏':'收藏'}</button></div></div></div><h3 class="modal-section-title">把搬運的事，也一起想好。</h3><div class="delivery-preview">${icon('truck')}<div><strong>可選自行取貨或大件配送試算</strong><p>費用依跨區距離、樓層、電梯與拆裝需求估算，正式服務需由合作物流報價。</p></div></div><div class="modal-demo-note">此為平台原型。示範商品無實際庫存，下單不會扣款、保留商品或通知物流。</div>`);
}

function openSeller() {
  sellerDraft = {photo:null,isSample:false};
  uploadGeneration++;
  showDialog(`<div class="modal-heading"><div class="eyebrow">GIVE IT A SECOND HOME</div><h2 id="dialog-title">好家具，從一張照片開始。</h2><p>填寫家具資料，先看看建議價格，再決定要不要上架。</p></div><form id="seller-form"><div class="form-grid"><div class="span-2"><label class="upload-box"><span id="upload-icon">${icon('upload')}</span><span id="upload-label"><strong>選擇一張家具照片</strong><small>JPG、PNG、WebP · 10 MB 以內</small></span><input id="furniture-photo" type="file" accept="image/jpeg,image/png,image/webp" aria-label="上傳家具照片"></label><button type="button" class="text-button" id="use-sample" style="margin-top:8px">沒有照片？先用範例體驗</button></div><label class="form-field span-2">家具名稱 *<input name="title" required maxlength="50" placeholder="例如：陪我度過兩年的北歐三人沙發"></label><label class="form-field">家具類型 *<select name="category" required><option value="">請選擇類型</option>${Object.entries(categories).map(([key,name])=>`<option value="${key}">${name}</option>`).join('')}</select></label><label class="form-field">品牌或風格 *<input name="brand" required maxlength="35" placeholder="例如：IKEA、無品牌"></label><label class="form-field">使用年限（年）*<input name="age" type="number" min="0" max="50" step="0.5" required placeholder="例如：2"></label><label class="form-field">商品狀況 *<select name="condition" required><option value="">請選擇狀況</option><option>近全新</option><option>狀況良好</option><option>有使用痕跡</option></select></label><label class="form-field span-2">家具尺寸（cm，長 × 寬 × 高）*<span class="dimensions"><input name="length" type="number" min="1" max="1000" required placeholder="長"><span>×</span><input name="width" type="number" min="1" max="1000" required placeholder="寬"><span>×</span><input name="height" type="number" min="1" max="1000" required placeholder="高"></span></label><label class="form-field">取貨地區 *<select name="city" required><option value="">請選擇地區</option>${locations.map(city=>`<option>${city}</option>`).join('')}</select></label><label class="form-field">原購入價格（選填）<input name="original" type="number" min="1" max="10000000" placeholder="NT$"><small>填寫後可提供較貼近原價的估算</small></label><label class="form-field span-2">商品描述與瑕疵說明 *<textarea name="description" required maxlength="800" placeholder="分享材質、使用情況與需要留意的細節。"></textarea></label></div><div id="seller-error" class="form-error" role="alert" hidden></div><div class="form-actions"><p>示範估價採規則計算，未執行 AI 影像辨識或查詢真實歷史成交資料。</p><button class="button button-primary" id="estimate-button" type="submit">${icon('spark')}取得建議價格</button></div></form><div id="estimate-output"></div>`);
  $('#seller-form').addEventListener('submit', estimateFurniture);
  $('#furniture-photo').addEventListener('change', handleUpload);
  $('#use-sample').addEventListener('click', useSample);
  $('#seller-form').addEventListener('input', () => { $('#estimate-output').innerHTML=''; });
}
function sellerError(message) { const output=$('#seller-error'); if(output){output.textContent=message;output.hidden=!message;} }
async function handleUpload(event) {
  const file=event.target.files[0]; if(!file) return;
  const generation=++uploadGeneration;
  $('#estimate-output').innerHTML='';
  sellerDraft.photo=null;
  sellerDraft.isSample=false;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>10*1024*1024) { sellerError('請選擇 10 MB 以內的 JPG、PNG 或 WebP 照片。'); event.target.value=''; return; }
  $('#estimate-button').disabled=true;
  $('#upload-label').innerHTML='<strong>正在準備照片…</strong><small>會將圖片縮小後保留於此瀏覽器</small>';
  try {
    const bitmap=await createImageBitmap(file);
    const scale=Math.min(1,900/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
    const context=canvas.getContext('2d');context.fillStyle='#faf9f6';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    const photo=canvas.toDataURL('image/jpeg',.78);
    if(generation!==uploadGeneration || !$('#seller-form')) return;
    sellerDraft.photo=photo;
    $('#upload-icon').innerHTML=`<img class="upload-preview" src="${photo}" alt="已上傳的家具照片">`;
    $('#upload-label').innerHTML=`<strong>${escapeHtml(file.name)}</strong><small>已準備完成 · 點選可更換</small>`; sellerError('');
  } catch { if(generation===uploadGeneration) {sellerError('無法讀取這張照片，請換一張有效的圖片。');$('#upload-icon').innerHTML=icon('upload');$('#upload-label').innerHTML='<strong>重新選擇家具照片</strong><small>JPG、PNG、WebP · 10 MB 以內</small>';}}
  finally {if(generation===uploadGeneration && $('#estimate-button')) $('#estimate-button').disabled=false;}
}
function useSample() {
  uploadGeneration++;
  const form=$('#seller-form');
  const values={title:'北歐織品三人沙發',category:'sofa',brand:'北歐風格',age:2,condition:'狀況良好',length:200,width:88,height:80,city:'台北市',original:15900,description:'森林綠織品、木質椅腳，使用兩年。坐墊狀況良好，扶手有輕微使用痕跡。這是一件示範商品。'};
  Object.entries(values).forEach(([key,value])=>form.elements.namedItem(key).value=value);
  sellerDraft.photo=catalog[0].photo;sellerDraft.isSample=true;
  $('#furniture-photo').value='';
  $('#upload-icon').innerHTML=`<img class="upload-preview" src="${catalog[0].photo}" alt="範例家具照片">`;
  $('#upload-label').innerHTML='<strong>已使用範例家具</strong><small>你可以修改資料，或上傳自己的照片</small>';
  $('#estimate-button').disabled=false;$('#estimate-output').innerHTML='';sellerError('');
}
function estimateFurniture(event) {
  event.preventDefault();
  const form=event.currentTarget;
  if(!form.reportValidity()) return;
  if(!sellerDraft.photo) {sellerError('請先上傳家具照片，或點選「先用範例體驗」。');return;}
  const data=Object.fromEntries(new FormData(form));
  if(!data.title.trim() || !data.brand.trim() || !data.description.trim()){sellerError('家具名稱、品牌與描述不可只填寫空白。');return;}
  const reference={sofa:18000,chair:6500,table:9000,storage:10000,bed:14000,lamp:4000};
  const original=Number(data.original)||reference[data.category];
  const conditionRatio={'近全新':.78,'狀況良好':.62,'有使用痕跡':.4}[data.condition];
  const depreciation=Math.pow(.86,Number(data.age));
  const central=Math.max(100,original*conditionRatio*depreciation);
  const low=Math.max(100,Math.round(central*.85/100)*100);
  const high=Math.max(low+100,Math.round(central*1.15/100)*100);
  sellerDraft={...sellerDraft,...data,original:Number(data.original)||0,price:Math.round((low+high)/2/100)*100,age:Number(data.age)};
  sellerError('');
  $('#estimate-output').innerHTML=`<section class="estimate-result"><h3>${icon('spark')}示範智慧估價結果</h3><div class="estimate-range"><small>NT$</small> ${low.toLocaleString('zh-TW')} – ${high.toLocaleString('zh-TW')}</div><p>依${data.original?'你提供的原價':'類型參考新品價 '+money(original)}、使用 ${escapeHtml(data.age)} 年及「${escapeHtml(data.condition)}」狀況計算。照片僅用於上架展示，未執行影像辨識。</p><p>這是原型的規則估算，並非真實成交資料或售價保證。你可以自行調整開價。</p><form id="publish-form"><div class="form-field estimate-fields"><label for="listing-price">我的售價（NT$）</label><input id="listing-price" name="price" type="number" min="1" max="10000000" step="1" required value="${sellerDraft.price}"></div><div class="form-actions"><p>上架資料與照片僅儲存在此瀏覽器，供原型展示使用。</p><button class="button button-primary" type="submit">確認示範上架 ${icon('arrow')}</button></div></form></section>`;
  $('#publish-form').addEventListener('submit', publishListing);
  $('#estimate-output').scrollIntoView({block:'nearest',behavior:'smooth'});
}
function publishListing(event) {
  event.preventDefault(); if(!event.currentTarget.reportValidity()) return;
  const data=sellerDraft;
  const price=Number($('#listing-price').value);
  const product={id:'local-'+crypto.randomUUID(),title:data.title.trim(),category:data.category,brand:data.brand.trim(),price,original:data.original,condition:data.condition,city:data.city,district:'',age:data.age,dimensions:`${data.length} × ${data.width} × ${data.height} cm`,photo:data.photo,description:data.description.trim(),badge:'剛剛上架',createdAt:new Date().toISOString()};
  const saved=persist('rehome-listings',[product,...listings]);listings.unshift(product);resetFilters();
  showDialog(`<div class="success-state"><div class="success-icon">${icon('check')}</div><div class="eyebrow" style="justify-content:center">HELLO, SECOND HOME.</div><h2 id="dialog-title">你的家具，已準備好出發。</h2><p>「${escapeHtml(product.title)}」已完成示範上架。</p><div class="success-summary"><div class="cost-row"><span>你的開價</span><strong>${money(price)}</strong></div><div class="cost-row"><span>取貨地區</span><span>${escapeHtml(product.city)}</span></div></div><p>${saved?'資料保留於此瀏覽器，不會公開給其他使用者。':'瀏覽器空間不足，本次上架只會保留到重新整理前。'}</p><button type="button" class="button button-primary" data-view-listing="${product.id}">查看我的家具 ${icon('arrow')}</button><button type="button" class="button button-outline" data-close>繼續逛逛</button></div>`);
}

function openCheckout(id) {
  const product=findProduct(id);if(!product)return;checkoutProduct=product;
  showDialog(`<div class="modal-heading"><div class="eyebrow">ONE STEP CLOSER TO HOME</div><h2 id="dialog-title">安排家具的新旅程</h2><p>選擇取貨方式，預先看看配送費用。</p></div><div class="checkout-summary"><img src="${escapeHtml(product.photo)}" alt="${escapeHtml(product.title)}"><div><strong>${escapeHtml(product.title)}</strong><small>${escapeHtml(product.city)}出貨 · ${escapeHtml(product.dimensions)}</small><span>${money(product.price)}</span></div></div><form id="checkout-form"><h3 class="modal-section-title">選擇取貨方式</h3><div class="radio-options"><label class="radio-option"><input type="radio" name="delivery" value="delivery" checked><span><strong>大件配送試算</strong><small>估算搬運與運送費用</small></span></label><label class="radio-option"><input type="radio" name="delivery" value="pickup"><span><strong>自行取貨</strong><small>自行安排搬運，免運費</small></span></label></div><div id="shipping-fields" class="form-grid"><label class="form-field">送達地區<select name="destination">${locations.map(city=>`<option${city===product.city?' selected':''}>${city}</option>`).join('')}</select></label><label class="form-field">收貨樓層<input name="floor" type="number" min="1" max="60" value="1" required></label><label class="form-field">是否有可容納家具的電梯<select name="elevator"><option value="yes">有電梯／位於一樓</option><option value="no">無電梯，需走樓梯</option></select></label><label class="form-field">家具拆裝<select name="assembly"><option value="no">不需要拆裝</option><option value="yes">需要拆裝（+ NT$ 600）</option></select></label></div><div class="modal-demo-note" id="pickup-note" hidden>請於正式交易時與賣家約定取貨時間、確認家具尺寸，並自行備妥車輛與搬運人力。</div><div class="delivery-breakdown" id="delivery-breakdown" aria-live="polite"></div><label class="consent"><input type="checkbox" name="consent" required><span>我了解這是示範訂單，不會收取款項、實際保管資金或派送物流；運費僅供試算。</span></label><button class="button button-primary" type="submit" style="width:100%">${icon('shield')}建立模擬訂單</button></form>`);
  $('#checkout-form').addEventListener('input', renderDelivery);
  $('#checkout-form').addEventListener('change', renderDelivery);
  $('#checkout-form').addEventListener('submit', placeOrder);
  renderDelivery();
}
function calculateDelivery(form, product) {
  if(form.elements.delivery.value==='pickup') return {base:0,stairs:0,assembly:0,fee:0,description:'自行取貨'};
  const destination=form.elements.destination.value;
  const north=['台北市','新北市','桃園市'];
  const sameArea=north.includes(destination) && north.includes(product.city);
  const sizeBase={sofa:1200,chair:600,table:900,storage:1200,bed:1200,lamp:500}[product.category];
  const base=sizeBase + (destination===product.city?0:sameArea?400:1800);
  const floor=Math.min(60,Math.max(1,Number(form.elements.floor.value)||1));
  const stairs=form.elements.elevator.value==='no'?(floor-1)*180:0;
  const assembly=form.elements.assembly.value==='yes'?600:0;
  return {base,stairs,assembly,fee:base+stairs+assembly,description:`大件配送至${destination}（${floor}樓）`};
}
function renderDelivery() {
  const form=$('#checkout-form'); if(!form || !checkoutProduct)return;
  const pickup=form.elements.delivery.value==='pickup';
  $('#shipping-fields').hidden=pickup;$('#pickup-note').hidden=!pickup;
  $$('input,select',$('#shipping-fields')).forEach(input=>input.disabled=pickup);
  const estimate=calculateDelivery(form,checkoutProduct);
  $('#delivery-breakdown').innerHTML=`<div class="cost-row"><span>家具售價</span><span>${money(checkoutProduct.price)}</span></div>${pickup?'<div class="cost-row"><span>自行取貨</span><span>免運費</span></div>':`<div class="cost-row"><span>預估基本運費（含同區裝車）</span><span>${money(estimate.base)}</span></div><div class="cost-row"><span>收貨樓層搬運費</span><span>${money(estimate.stairs)}</span></div><div class="cost-row"><span>家具拆裝費</span><span>${money(estimate.assembly)}</span></div>`}<div class="cost-row total"><span>預估合計</span><strong>${money(checkoutProduct.price+estimate.fee)}</strong></div><p class="fee-hint">${pickup?'本原型不安排實際取貨，亦不提供線上付款。':'示範費率，非物流商報價。不含出貨樓層、偏遠地區、吊掛與特殊搬運；正式金額須經合作業者確認。'}</p>`;
}
function placeOrder(event) {
  event.preventDefault();const form=event.currentTarget;if(!form.reportValidity() || !checkoutProduct)return;
  const p=checkoutProduct;const delivery=calculateDelivery(form,p);
  const pickup=form.elements.delivery.value==='pickup';
  const order={id:'RH-'+crypto.randomUUID().slice(0,8).toUpperCase(),productId:p.id,title:p.title,photo:p.photo,price:p.price,fee:delivery.fee,total:p.price+delivery.fee,delivery:delivery.description,deliveryMode:pickup?'pickup':'delivery',origin:`${p.city}${p.district?' '+p.district:''}`,destination:pickup?p.city:form.elements.destination.value,dimensions:p.dimensions,stage:0,createdAt:new Date().toISOString()};
  orders.unshift(order);const saved=persist('rehome-orders',orders);
  showDialog(`<div class="success-state"><div class="success-icon">${icon('check')}</div><div class="eyebrow" style="justify-content:center">A NEW STORY BEGINS</div><h2 id="dialog-title">模擬訂單已建立</h2><p>新的生活想像，又近了一步。</p><div class="success-summary"><div class="cost-row"><span>訂單編號</span><strong>${order.id}</strong></div><div class="cost-row"><span>家具</span><span>${escapeHtml(order.title)}</span></div><div class="cost-row"><span>取貨方式</span><span>${escapeHtml(order.delivery)}</span></div><div class="cost-row total"><span>預估合計</span><strong>${money(order.total)}</strong></div></div><p>這是示範流程，未付款，也不會派送物流。${saved?'':'此訂單未能儲存，重新整理後將不保留。'}</p><button type="button" class="button button-primary" data-orders>查看我的訂單 ${icon('arrow')}</button><button type="button" class="button button-outline" data-close>繼續探索</button></div>`);
}
function openOrders() {
  const stages=['模擬付款託管','安排搬運','家具已送達','確認收貨與撥款'];
  const actions=['模擬安排搬運','查看配送與送達','確認收貨與模擬撥款'];
  const cards=orders.map(order=>{
    const stage=Number.isInteger(order.stage)?order.stage:0;
    return `<article class="order-card">
      <div class="order-item">${order.photo?`<img src="${escapeHtml(order.photo)}" alt="${escapeHtml(order.title)}">`:''}<div><strong>${escapeHtml(order.title)}</strong><small>${escapeHtml(order.id)} · ${escapeHtml(new Date(order.createdAt).toLocaleDateString('zh-TW',{timeZone:'Asia/Taipei'}))}</small><small>${escapeHtml(order.delivery)}</small><small class="order-status">${stage===3?'示範交易完成':'流程模擬中'}・未實際付款</small></div><span>${money(order.total)}</span></div>
      <ol class="order-timeline">${stages.map((name,index)=>`<li class="${index<=stage?'reached':''}"><span>${index<stage?'✓':index+1}</span>${name}</li>`).join('')}</ol>
      ${stage<3?`<div class="order-next"><small>${order.schedule?`${escapeHtml(order.schedule.date)} · ${escapeHtml(order.schedule.slot)}`:'開啟步驟畫面，體驗完整交易流程。'}</small><button type="button" class="button button-outline" data-advance-order="${escapeHtml(order.id)}">${actions[stage]} ${icon('arrow')}</button></div>`:'<div class="order-complete">收貨及撥款流程已模擬完成。未發生實際資金移轉。<button class="text-button" type="button" data-order-screen="complete" data-order-id="'+escapeHtml(order.id)+'">查看完成明細 '+icon('arrow')+'</button></div>'}
      <div class="order-record-actions"><button type="button" class="button order-delete" data-delete-order="${escapeHtml(order.id)}" aria-label="刪除${escapeHtml(order.title)}的訂單紀錄">${icon('trash')}刪除紀錄</button></div>
    </article>`;
  }).join('');
  showDialog(`<div class="modal-heading"><div class="eyebrow">YOUR NEXT CHAPTER</div><h2 id="dialog-title">我的示範訂單</h2><p>體驗從下單到確認收貨的流程；各步驟均為模擬，不會扣款、保管資金或安排搬運。</p></div>${orders.length?`<div class="order-list">${cards}</div>`:`<div class="empty-state">${icon('bag')}<h3>你的新生活，還有很多可能。</h3><p>挑一件喜歡的家具，體驗配送試算與模擬下單。</p><button type="button" class="button button-primary" data-close>探索家具 ${icon('arrow')}</button></div>`}`);
}
function confirmDeleteOrder(id) {
  const order=orders.find(item=>item.id===id);if(!order)return;
  showDialog(`<div class="modal-heading"><div class="eyebrow">MANAGE YOUR RECORDS</div><h2 id="dialog-title">刪除這筆示範訂單？</h2><p>將移除此筆訂單紀錄，刪除後無法復原。</p></div><div class="checkout-summary">${order.photo?`<img src="${escapeHtml(order.photo)}" alt="${escapeHtml(order.title)}">`:''}<div><strong>${escapeHtml(order.title)}</strong><small>${escapeHtml(order.id)}</small><span>${money(order.total)}</span></div></div><div class="form-actions"><button type="button" class="button button-outline" data-orders>保留紀錄</button><button type="button" class="button button-danger" data-confirm-delete-order="${escapeHtml(order.id)}">${icon('trash')}確認刪除</button></div>`);
}
function deleteOrder(id) {
  if(!orders.some(order=>order.id===id))return;
  const remaining=orders.filter(order=>order.id!==id);
  if(!persist('rehome-orders',remaining)) {showToast('無法儲存變更，訂單紀錄尚未刪除，請再試一次。');return;}
  orders=remaining;
  openOrders();
  showToast('已刪除此筆示範訂單紀錄');
}
function advanceOrder(id) {
  openOrderFlow(id);
}
function openAbout(type) {
  const content={
    about:{title:'關於 Save and Earn',body:'<h3>讓好家具，遇見下一個家。</h3><p>Save and Earn 二手家具平台 是一份二手家具交易平台的互動原型。希望透過影像辨識、智慧價格建議、安全付款與物流媒合，減少二手家具交易的麻煩，延續家具的使用價值。</p><h3>從提案到可操作的體驗</h3><p>本原型提供商品搜尋、收藏、規則估價、示範上架、配送試算與模擬訂單。正式營運仍需建置帳號及商品後端、AI 辨識模型、歷史成交資料、第三方金流與合作物流服務。</p><p>商品名稱、價格與狀況均為展示資料；商品與情境照片來自 Unsplash，並非照片中實物的出售邀約。</p>'},
    guide:{title:'交易須知',body:'<h3>購買前，先確認適合你的家</h3><p>請確認家具長寬高、實際瑕疵與配件，並量測門寬、電梯與樓梯轉角。照片與描述應呈現真實商品狀況。</p><h3>配送與付款</h3><p>本原型採示範費率試算，未接入物流業者。實際運費需依兩端地址、出入樓層、拆裝與特殊搬運另行報價。原型不收集付款資料、不扣款、不保管資金，也不提供真實交易保障。</p><h3>上架與估價</h3><p>目前估價僅依類型、原價、使用年限與狀況進行規則計算，未分析照片、品牌行情或歷史成交資料。你可以自行調整開價。</p>'},
    privacy:{title:'原型隱私說明',body:'<h3>資料保存在你的瀏覽器</h3><p>收藏、示範上架資料、縮小後的家具照片與模擬訂單，僅透過 localStorage 儲存於此裝置與瀏覽器，不會同步至其他使用者。請勿在公開裝置填寫敏感資訊。</p><h3>清除資料</h3><p>你可以透過下方按鈕清除此原型的收藏、上架商品與模擬訂單；操作不影響裝置上其他網站的資料。</p><h3>圖片與外部字型</h3><p>示範圖片來自 Unsplash，並已隨網站儲存。字型由 Google Fonts 提供，載入時瀏覽器會向 Google 請求字型資源。使用者上傳的照片只保留於此瀏覽器。</p><button type="button" class="button button-outline" id="clear-demo-data">清除此原型的瀏覽器資料</button>'}
  }[type];
  if(!content)return;
  showDialog(`<div class="modal-heading"><div class="eyebrow">SAVE AND EARN, WITH CARE</div><h2 id="dialog-title">${content.title}</h2></div><div class="prose">${content.body}</div>`);
}
document.addEventListener('click',event=>{
  const target=event.target.closest('button,a');if(!target)return;
  if(target.hasAttribute('data-sell')){event.preventDefault();openSeller();}
  else if(target.hasAttribute('data-favorites')){state.favoritesOnly=!state.favoritesOnly;renderProducts();$('#marketplace').scrollIntoView({behavior:'smooth'});}
  else if(target.hasAttribute('data-category')){state.category=target.dataset.category;renderProducts();}
  else if(target.hasAttribute('data-product'))openProduct(target.dataset.product);
  else if(target.hasAttribute('data-favorite'))toggleFavorite(target.dataset.favorite);
  else if(target.hasAttribute('data-modal-favorite'))toggleFavorite(target.dataset.modalFavorite);
  else if(target.hasAttribute('data-checkout'))openCheckout(target.dataset.checkout);
  else if(target.hasAttribute('data-orders'))openOrders();
  else if(target.hasAttribute('data-order-screen'))openOrderFlow(target.dataset.orderId,target.dataset.orderScreen);
  else if(target.hasAttribute('data-start-transport'))startOrderTransport(target.dataset.startTransport);
  else if(target.hasAttribute('data-resolve-order-issue'))resolveOrderIssue(target.dataset.resolveOrderIssue);
  else if(target.hasAttribute('data-delete-order'))confirmDeleteOrder(target.dataset.deleteOrder);
  else if(target.hasAttribute('data-confirm-delete-order'))deleteOrder(target.dataset.confirmDeleteOrder);
  else if(target.hasAttribute('data-advance-order'))advanceOrder(target.dataset.advanceOrder);
  else if(target.hasAttribute('data-about'))openAbout(target.dataset.about);
  else if(target.hasAttribute('data-close') || target.classList.contains('dialog-close'))dialog.close();
  else if(target.hasAttribute('data-reset') || target.id==='reset-filters')resetFilters();
  else if(target.hasAttribute('data-home')){if(state.favoritesOnly){state.favoritesOnly=false;renderProducts();}}
  else if(target.hasAttribute('data-view-listing')){dialog.close();resetFilters();openProduct(target.dataset.viewListing);}
  else if(target.id==='clear-demo-data'){
    showDialog(`<div class="modal-heading"><h2 id="dialog-title">清除原型資料？</h2><p>將刪除此瀏覽器中的 ${favorites.size} 筆收藏、${listings.length} 件示範上架商品與 ${orders.length} 筆模擬訂單。清除後無法復原。</p></div><div class="form-actions"><button class="button button-outline" type="button" data-about="privacy">保留資料</button><button class="button button-primary" type="button" id="confirm-clear-data">確認清除</button></div>`);
  }
  else if(target.id==='confirm-clear-data'){
    try{['rehome-favorites','rehome-listings','rehome-orders'].forEach(key=>localStorage.removeItem(key));favorites=new Set();listings=[];orders=[];resetFilters();dialog.close();showToast('已清除此原型的瀏覽器資料');}catch{showToast('瀏覽器無法清除資料，請透過瀏覽器設定移除。');}
  }
});
dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{uploadGeneration++;});
$('#search').addEventListener('input',event=>{state.search=event.target.value;renderProducts();});
['region','price','condition','sort'].forEach(id=>$('#'+id).addEventListener('change',event=>{state[id]=event.target.value;renderProducts();}));
renderProducts();
