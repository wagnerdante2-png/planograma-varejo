const products=[
{id:'p1',name:'Refrigerante Cola 2L',short:'Refrigerante',brand:'Marca Alfa',category:'bebidas',shape:'bottle',price:8.99,volume:'2 L',width:34,height:72,color:'dark'},
{id:'p2',name:'Refrigerante Guaraná 2L',short:'Guaraná',brand:'Marca Beta',category:'bebidas',shape:'bottle',price:7.49,volume:'2 L',width:34,height:72,color:'dark'},
{id:'p3',name:'Refrigerante Laranja 2L',short:'Laranja',brand:'Marca Gama',category:'bebidas',shape:'bottle',price:6.99,volume:'2 L',width:34,height:72,color:'dark'},
{id:'p4',name:'Refrigerante Cola Lata',short:'Cola lata',brand:'Marca Alfa',category:'bebidas',shape:'can',price:4.79,volume:'350 ml',width:37,height:60,color:'dark'},
{id:'p5',name:'Energético Lata',short:'Energético',brand:'Marca Delta',category:'bebidas',shape:'can',price:9.49,volume:'473 ml',width:37,height:60,color:'dark'},
{id:'p6',name:'Água Mineral',short:'Água',brand:'Marca Fonte',category:'bebidas',shape:'bottle',price:2.49,volume:'500 ml',width:28,height:60,color:'dark'},
{id:'p7',name:'Salgadinho Queijo',short:'Salgadinho',brand:'Marca Croc',category:'mercearia',shape:'bag',price:6.49,volume:'90 g',width:50,height:63,color:'dark'},
{id:'p8',name:'Salgadinho Churrasco',short:'Salgadinho',brand:'Marca Croc',category:'mercearia',shape:'bag',price:6.99,volume:'90 g',width:50,height:63,color:'dark'},
{id:'p9',name:'Biscoito Recheado',short:'Biscoito',brand:'Marca Doce',category:'mercearia',shape:'bag',price:4.29,volume:'120 g',width:48,height:60,color:'dark'},
{id:'p10',name:'Caixa de Bombons',short:'Bombons',brand:'Marca Cacau',category:'mercearia',shape:'box',price:12.90,volume:'250 g',width:46,height:60,color:'dark'},
{id:'p11',name:'Café Tradicional',short:'Café',brand:'Marca Serra',category:'mercearia',shape:'bag',price:17.90,volume:'500 g',width:48,height:64,color:'dark'},
{id:'p12',name:'Maionese',short:'Maionese',brand:'Marca Casa',category:'mercearia',shape:'jar',price:8.39,volume:'500 g',width:43,height:53,color:'dark'}
];

const state={
 selected:null,zoom:1,filter:'all',search:'',name:'Bebidas • Refrigerantes 2L',
 modules:Array.from({length:3},()=>({poster:null,shelves:Array.from({length:5},()=>[])}))
};

function uid(){return Math.random().toString(36).slice(2,9)}
function byId(id){return document.getElementById(id)}
function money(v){return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function toast(msg){const t=byId('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}

function productShape(p,label=true){return `<div class="generic-product ${p.shape}" style="width:${p.width}px;height:${p.height}px"><span>${label?p.short:''}</span></div>`}

function renderCatalog(){
 const wrap=byId('productCatalog');
 const q=state.search.toLowerCase();
 wrap.innerHTML=products.filter(p=>(state.filter==='all'||p.category===state.filter)&&(!q||`${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(q))).map(p=>`
 <div class="catalog-item" draggable="true" data-product-id="${p.id}">
   <div class="catalog-visual">${productShape(p)}</div><strong>${p.short}</strong><span>${p.brand}</span>
 </div>`).join('');
 wrap.querySelectorAll('.catalog-item').forEach(el=>{
   el.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/product',el.dataset.productId);e.dataTransfer.effectAllowed='copy'});
   el.addEventListener('dblclick',()=>addToFirstSpace(el.dataset.productId));
 });
}

function makePlaced(p,item){
 return `<div class="placed-item ${state.selected===item.instanceId?'selected':''}" draggable="true" data-instance="${item.instanceId}" data-product-id="${p.id}" title="${p.name}">
 ${productShape(p)}<div class="price-tag ${item.promo?'pink':''}">${item.promo?'OFERTA ':''}${money(p.price)}</div></div>`;
}

function renderGondola(){
 const stage=byId('gondolaStage');
 stage.style.transform=`scale(${state.zoom})`;
 stage.innerHTML=state.modules.map((m,mi)=>`
 <div class="gondola-module" data-module="${mi}"><div class="module-title">MÓDULO ${String(mi+1).padStart(2,'0')}</div>
 ${m.poster?`<div class="module-poster" data-poster="${mi}"><div>${m.poster.type}<strong>${m.poster.size}</strong>Preço em destaque</div></div>`:''}
 ${m.shelves.map((items,si)=>`<div class="shelf" data-module="${mi}" data-shelf="${si}">${items.map(it=>makePlaced(products.find(p=>p.id===it.productId),it)).join('')}</div>`).join('')}
 </div>`).join('');

 stage.querySelectorAll('.shelf').forEach(shelf=>{
  shelf.addEventListener('dragover',e=>{e.preventDefault();shelf.classList.add('drop-hover')});
  shelf.addEventListener('dragleave',()=>shelf.classList.remove('drop-hover'));
  shelf.addEventListener('drop',e=>{
   e.preventDefault();shelf.classList.remove('drop-hover');
   const mi=+shelf.dataset.module,si=+shelf.dataset.shelf;
   const pid=e.dataTransfer.getData('text/product');
   const instance=e.dataTransfer.getData('text/instance');
   if(pid){state.modules[mi].shelves[si].push({instanceId:uid(),productId:pid,promo:false});}
   else if(instance){moveInstance(instance,mi,si)}
   renderAll();
  });
 });
 stage.querySelectorAll('.placed-item').forEach(el=>{
  el.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/instance',el.dataset.instance);e.dataTransfer.effectAllowed='move'});
  el.addEventListener('click',e=>{e.stopPropagation();state.selected=el.dataset.instance;renderAll();renderProperties();});
  el.addEventListener('dblclick',e=>{e.stopPropagation();openProductModal(el.dataset.instance)});
 });
 stage.querySelectorAll('.module-poster').forEach(el=>el.addEventListener('click',()=>toast('Cartaz selecionado • use Padrões & Regras para conferir conformidade.')));
 updateKpis();
}

function moveInstance(instance,mi,si){
 let moved=null;
 state.modules.forEach(m=>m.shelves.forEach(s=>{const idx=s.findIndex(i=>i.instanceId===instance);if(idx>=0)moved=s.splice(idx,1)[0]}));
 if(moved)state.modules[mi].shelves[si].push(moved);
}

function addToFirstSpace(pid){
 let target=state.modules.flatMap((m,mi)=>m.shelves.map((s,si)=>({s,mi,si}))).sort((a,b)=>a.s.length-b.s.length)[0];
 target.s.push({instanceId:uid(),productId:pid,promo:false});renderAll();toast('Produto adicionado ao planograma');
}

function findInstance(instance){
 for(let mi=0;mi<state.modules.length;mi++)for(let si=0;si<state.modules[mi].shelves.length;si++){const idx=state.modules[mi].shelves[si].findIndex(i=>i.instanceId===instance);if(idx>=0)return{mi,si,idx,item:state.modules[mi].shelves[si][idx]}}
 return null;
}

function renderProperties(){
 const target=byId('propertiesContent');
 if(!state.selected){target.innerHTML=`<div class="properties-empty">Selecione um produto da gôndola para editar posição, etiqueta, frente e dados do SKU.</div><div class="property-group"><h4>Estrutura da gôndola</h4><div class="property-grid"><div class="property-item"><span>Módulos</span><strong>3</strong></div><div class="property-item"><span>Prateleiras</span><strong>5 / módulo</strong></div><div class="property-item"><span>Perfil</span><strong>Laranja</strong></div><div class="property-item"><span>Fundo</span><strong>Branco</strong></div></div></div>`;return}
 const f=findInstance(state.selected);if(!f)return;
 const p=products.find(x=>x.id===f.item.productId);
 target.innerHTML=`<div class="property-group"><h4>${p.name}</h4><div class="property-grid"><div class="property-item"><span>Marca</span><strong>${p.brand}</strong></div><div class="property-item"><span>Preço</span><strong>${money(p.price)}</strong></div><div class="property-item"><span>Volume</span><strong>${p.volume}</strong></div><div class="property-item"><span>Posição</span><strong>M${f.mi+1} • P${f.si+1}</strong></div></div></div>
 <div class="property-group"><h4>Etiqueta</h4><div class="property-actions"><button class="secondary-btn" id="whiteTagBtn">Branca</button><button class="secondary-btn" id="pinkTagBtn">Rosa promocional</button></div></div>
 <div class="property-group"><h4>Frentes</h4><div class="property-actions"><button class="secondary-btn" id="duplicateBtn">＋ Duplicar frente</button></div><p style="font-size:8px;color:#8a95a3">A duplicação representa novas frentes físicas do mesmo SKU. A etiqueta continua vinculada ao início da exposição.</p></div>
 <div class="property-actions"><button class="danger-btn" id="removeBtn">Remover do layout</button></div>`;
 byId('whiteTagBtn').onclick=()=>{f.item.promo=false;renderAll()};
 byId('pinkTagBtn').onclick=()=>{f.item.promo=true;renderAll()};
 byId('duplicateBtn').onclick=()=>{state.modules[f.mi].shelves[f.si].splice(f.idx+1,0,{...f.item,instanceId:uid()});renderAll()};
 byId('removeBtn').onclick=()=>{state.modules[f.mi].shelves[f.si].splice(f.idx,1);state.selected=null;renderAll();renderProperties()};
}

function updateKpis(){
 const all=state.modules.flatMap(m=>m.shelves.flat());
 const skus=new Set(all.map(i=>i.productId)).size;
 const capacity=75,faces=all.length;
 byId('facesKpi').textContent=faces;
 byId('skuKpi').textContent=skus;
 byId('fillKpi').textContent=`${Math.min(100,Math.round(faces/capacity*100))}%`;
 const audit=runAudit(false);byId('complianceKpi').textContent=`${audit.score}%`;
}

function seedPreset(type){
 state.modules.forEach(m=>{m.poster=null;m.shelves.forEach(s=>s.splice(0))});
 const pool=type==='snacks'?['p7','p8','p9','p10','p11','p12']:type==='mixed'?['p1','p4','p5','p7','p9','p10','p11','p12']:['p1','p2','p3','p4','p5','p6'];
 state.modules.forEach((m,mi)=>m.shelves.forEach((s,si)=>{
   const base=pool[(si+mi)%pool.length];const count=si===4?4:5;
   for(let i=0;i<count;i++)s.push({instanceId:uid(),productId:i<count-1?base:pool[(si+mi+1)%pool.length],promo:(mi===1&&si===2)});
 }));
 if(type==='softdrinks')state.modules[1].poster={size:'A4',type:'OFERTA'};
 renderAll();
}

function applyStrategy(){
 const type=byId('strategySelect').value;
 if(type==='manual'){toast('Modo manual ativo: arraste os produtos diretamente para as prateleiras.');return}
 let all=state.modules.flatMap(m=>m.shelves.flat());
 const key={brand:(it)=>products.find(p=>p.id===it.productId).brand,price:(it)=>products.find(p=>p.id===it.productId).price,size:(it)=>parseFloat(products.find(p=>p.id===it.productId).volume),auto:(it)=>products.find(p=>p.id===it.productId).brand}[type];
 all.sort((a,b)=>{const av=key(a),bv=key(b);return typeof av==='number'?av-bv:String(av).localeCompare(String(bv))});
 state.modules.forEach(m=>m.shelves.forEach(s=>s.splice(0)));
 all.forEach((it,i)=>{const mi=Math.floor(i/25)%3,si=Math.floor((i%25)/5);state.modules[mi].shelves[si].push(it)});
 if(type==='auto')balanceAuto();
 renderAll();toast(type==='auto'?'Auto-planejamento aplicado com balanceamento de frentes.':'Estratégia aplicada ao planograma.');
}

function balanceAuto(){
 state.modules.forEach(m=>m.shelves.forEach(s=>{
  const unique=[...new Map(s.map(x=>[x.productId,x])).values()];
  while(s.length<5&&unique.length)s.push({...unique[s.length%unique.length],instanceId:uid()});
 }));
}

function runAudit(show=true){
 const all=state.modules.flatMap(m=>m.shelves.flat());
 const issues=[];
 if(!all.length)issues.push('Planograma sem produtos');
 const posters=state.modules.filter(m=>m.poster).length;
 if(posters>3)issues.push('Excesso de cartazes');
 const missingLabels=0;
 const promoCount=all.filter(i=>i.promo).length;
 let score=Math.max(72,100-issues.length*12-(missingLabels*4));
 if(promoCount>0)score-=2;
 const rows=[
 {ok:all.length>0,text:'Produtos possuem posição definida por módulo e prateleira'},
 {ok:true,text:'Perfil porta-preços configurado na cor laranja'},
 {ok:posters<=3,text:'Limite de até 3 cartazes por módulo'},
 {ok:true,text:'Etiqueta associada ao início da exposição do SKU'},
 {ok:true,text:'Cartaz não substitui a etiqueta de gôndola'}
 ];
 byId('auditChecklist').innerHTML=rows.map(r=>`<div class="audit-row ${r.ok?'ok':'warn'}"><i>${r.ok?'✓':'!'}</i>${r.text}</div>`).join('');
 if(show)toast(`Auditoria simulada concluída • ${score}% de conformidade`);
 return{score,issues};
}

function renderInsights(){
 byId('insightList').innerHTML=[
  ['↔','Boa distribuição horizontal de frentes entre os módulos.'],
  ['◫','Produtos promocionais destacados com etiqueta rosa neon.'],
  ['⌁','Espaços vazios permanecem visíveis para ajuste manual do VM.'],
  ['◎','Clique duas vezes em um item para abrir ficha detalhada.']
 ].map(x=>`<div class="insight-row"><i>${x[0]}</i>${x[1]}</div>`).join('');
}

function openProductModal(instance){
 const f=findInstance(instance);if(!f)return;const p=products.find(x=>x.id===f.item.productId);
 byId('modalTitle').textContent=p.name;
 byId('productModalBody').innerHTML=`<div class="product-modal-grid"><div class="product-hero">${productShape(p)}</div><div><div class="detail-grid"><div class="detail-cell"><span>MARCA</span><strong>${p.brand}</strong></div><div class="detail-cell"><span>PREÇO</span><strong>${money(p.price)}</strong></div><div class="detail-cell"><span>VOLUME</span><strong>${p.volume}</strong></div><div class="detail-cell"><span>POSIÇÃO</span><strong>Módulo ${f.mi+1} / Prateleira ${f.si+1}</strong></div><div class="detail-cell"><span>SKU</span><strong>GEN-${p.id.toUpperCase()}</strong></div><div class="detail-cell"><span>ETIQUETA</span><strong>${f.item.promo?'Rosa promocional':'Branca padrão'}</strong></div></div><p style="font-size:9px;color:#778493;line-height:1.55;margin-top:12px">Produto genérico para prototipação. Em produção, dimensões, preço, EAN, estoque, giro, margem e cadastro podem ser alimentados pelo ERP.</p></div></div>`;
 byId('productModal').classList.remove('hidden');
}

function renderAuditDashboard(){
 const stores=[['ML01','Campinas Centro',98,1,0],['ML05','Jundiaí',94,3,1],['ML12','Sorocaba',88,7,2],['ML18','Itu',96,2,0],['ML26','Indaiatuba',91,4,1],['ML34','Campinas Norte',83,9,3]];
 byId('auditDashboard').innerHTML=stores.map(s=>`<article class="store-card"><div class="store-card-head"><div><h3>${s[0]}</h3><p>${s[1]} • Layout v0.1</p></div><div class="score-ring" style="--score:${s[2]}%"><strong>${s[2]}%</strong></div></div><div class="store-metrics"><div><span>DIVERGÊNCIAS</span><strong>${s[3]}</strong></div><div><span>CRÍTICAS</span><strong>${s[4]}</strong></div><div><span>ÚLTIMA AUDITORIA</span><strong>Hoje</strong></div></div></article>`).join('');
}

function renderStandards(){
 const rules=[
 ['Etiqueta padrão branca','Modelo institucional principal para a maior parte dos perfis de gôndola. Deve preservar identificação clara do produto e do preço.'],
 ['Etiqueta promocional rosa','Uso restrito a produtos contemplados por dinâmica promocional vigente, com forte destaque visual.'],
 ['Posicionamento da etiqueta','A etiqueta fica no início da exposição, diretamente à esquerda. Quando a prateleira tiver somente um produto, o preço pode ser centralizado.'],
 ['Cartaz + etiqueta','Todo produto cartazeado mantém etiqueta correspondente. O cartaz complementa e não substitui a etiqueta.'],
 ['Limite de cartazes','O cartaz deve ficar dentro da área do produto e o módulo trabalha com mínimo de 1 e máximo de 3 cartazes quando aplicável.'],
 ['Formatos oficiais','A3 para grandes volumes/móveis; A4 para módulos e terminais; A5 para laterais e módulos menores; A6/A7 para frentes reduzidas e gancheiras.']
 ];
 byId('standardsGrid').innerHTML=rules.map((r,i)=>`<article class="standard-card"><div class="num">${String(i+1).padStart(2,'0')}</div><h3>${r[0]}</h3><p>${r[1]}</p></article>`).join('');
}

function save(){localStorage.setItem('planograma-mvp',JSON.stringify({name:state.name,modules:state.modules}));toast('Rascunho salvo neste navegador')}
function load(){try{const x=JSON.parse(localStorage.getItem('planograma-mvp'));if(x){state.name=x.name||state.name;state.modules=x.modules||state.modules;byId('planogramName').textContent=state.name}}catch(e){console.warn(e)}}

function renderAll(){renderGondola();renderInsights();renderProperties();runAudit(false)}

function setupNav(){
 document.querySelectorAll('.nav-item').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));btn.classList.add('active');
  ['builder','audit','standards','ai'].forEach(v=>byId(`${v}View`).classList.toggle('hidden',v!==btn.dataset.view));
  const showBuilder=btn.dataset.view==='builder';document.querySelector('.left-panel').classList.toggle('hidden',!showBuilder);byId('rightPanel').classList.toggle('hidden',!showBuilder);
 }));
}

function setupEvents(){
 byId('productSearch').addEventListener('input',e=>{state.search=e.target.value;renderCatalog()});
 document.querySelectorAll('.filter-pill').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.filter-pill').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.filter=b.dataset.filter;renderCatalog()}));
 byId('presetSelect').addEventListener('change',e=>{if(e.target.value!=='custom')seedPreset(e.target.value)});
 byId('applyStrategyBtn').onclick=applyStrategy;
 byId('saveBtn').onclick=save;
 byId('publishBtn').onclick=()=>toast('Layout publicado em modo demonstrativo • pronto para auditoria regional');
 byId('runAuditBtn').onclick=()=>runAudit(true);
 byId('zoomInBtn').onclick=()=>{state.zoom=Math.min(1.25,state.zoom+.1);byId('zoomLabel').textContent=`${Math.round(state.zoom*100)}%`;renderGondola()};
 byId('zoomOutBtn').onclick=()=>{state.zoom=Math.max(.65,state.zoom-.1);byId('zoomLabel').textContent=`${Math.round(state.zoom*100)}%`;renderGondola()};
 byId('clearBtn').onclick=()=>{state.modules.forEach(m=>{m.poster=null;m.shelves.forEach(s=>s.splice(0))});state.selected=null;renderAll();toast('Área de planograma limpa')};
 byId('renamePlanogramBtn').onclick=()=>{const n=prompt('Nome do planograma',state.name);if(n){state.name=n;byId('planogramName').textContent=n}};
 byId('closeProductModal').onclick=()=>byId('productModal').classList.add('hidden');
 byId('closePosterModal').onclick=()=>byId('posterModal').classList.add('hidden');
 byId('confirmPosterBtn').onclick=()=>{const mi=+byId('posterModule').value;state.modules[mi].poster={size:byId('posterSize').value,type:byId('posterType').value};byId('posterModal').classList.add('hidden');renderAll();toast('Cartaz incluído no módulo')};
 document.querySelector('[data-action="poster"]').onclick=()=>byId('posterModal').classList.remove('hidden');
 document.querySelector('[data-action="label-white"]').onclick=()=>{if(!state.selected)return toast('Selecione um produto na gôndola');const f=findInstance(state.selected);f.item.promo=false;renderAll()};
 document.querySelector('[data-action="label-pink"]').onclick=()=>{if(!state.selected)return toast('Selecione um produto na gôndola');const f=findInstance(state.selected);f.item.promo=true;renderAll()};
 document.querySelector('[data-action="separator"]').onclick=()=>toast('Separador visual reservado para a próxima iteração do MVP');
 byId('newProductBtn').onclick=()=>toast('Cadastro manual de SKU reservado para integração futura com ERP');
 byId('aiUploadZone').onclick=()=>toast('Protótipo conceitual: reconhecimento de imagem será conectado em fase futura.');
 window.addEventListener('keydown',e=>{if(e.key==='Delete'&&state.selected){const f=findInstance(state.selected);if(f){state.modules[f.mi].shelves[f.si].splice(f.idx,1);state.selected=null;renderAll()}}});
}

load();renderCatalog();seedPreset('softdrinks');renderAuditDashboard();renderStandards();setupNav();setupEvents();