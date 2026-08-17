/* Planograma VM v0.10 — menus X/Y + 1-5 módulos + gancheiras + fita cross */
state.visibleModules=state.visibleModules||3;

function ensureFiveModules(){
  while(state.modules.length<5){
    state.modules.push({shelves:Array.from({length:5},()=>[])});
  }
}
ensureFiveModules();

function moduleRenderWidth(){
  const map={1:760,2:520,3:350,4:265,5:210};
  return map[state.visibleModules]||350;
}
function shelfInnerWidth(){return Math.max(145,moduleRenderWidth()-34)}
function shelfFitV10(items){
  const groups=contiguousGroups(items);
  let nominal=0,facings=0;
  groups.forEach(g=>{const p=products.find(x=>x.id===g.productId);if(!p)return;nominal+=g.items.length*p.width;facings+=g.items.length;});
  nominal+=Math.max(0,facings-1)*2+Math.max(0,groups.length-1)*4;
  const scale=Math.min(1,shelfInnerWidth()/Math.max(1,nominal));
  return {groups,nominal,scale,valid:scale>=.42};
}
shelfFit=shelfFitV10;

function ensureShelfMeta(s){
  if(!s.__displayType)s.__displayType='shelf';
  if(typeof s.__crossTape==='undefined')s.__crossTape=false;
}
state.modules.forEach(m=>m.shelves.forEach(ensureShelfMeta));

function addEmptyModule(){
  state.modules.push({shelves:Array.from({length:5},()=>[])});
}

function openFloatingMenu(html,x,y){
  let menu=document.getElementById('planFloatingMenu');
  if(!menu){menu=document.createElement('div');menu.id='planFloatingMenu';menu.className='plan-menu';document.body.appendChild(menu)}
  menu.innerHTML=html;menu.style.left=Math.min(x,window.innerWidth-235)+'px';menu.style.top=Math.min(y,window.innerHeight-280)+'px';menu.classList.add('open');
  setTimeout(()=>{document.addEventListener('click',closeFloatingMenu,{once:true})},0);
  return menu;
}
function closeFloatingMenu(){const m=document.getElementById('planFloatingMenu');if(m)m.classList.remove('open')}

function toggleShelfType(mi,si,type){
  const s=state.modules[mi].shelves[si];ensureShelfMeta(s);s.__displayType=type;renderAll();renderProperties();
  toast(type==='hooks'?'Prateleira convertida em gancheira. Etiqueta reduzida aplicada no suporte frontal.':'Prateleira restaurada para exposição convencional.');
}
function toggleCrossTape(mi,si,on){
  const s=state.modules[mi].shelves[si];ensureShelfMeta(s);s.__crossTape=typeof on==='boolean'?on:!s.__crossTape;renderAll();renderProperties();
  toast(s.__crossTape?'Fita Cross inserida. Etiqueta reduzida no topo conforme padrão.':'Fita Cross removida.');
}
function addShelfAt(mi,afterSi){
  const m=state.modules[mi];if(m.shelves.length>=7){toast('Limite do MVP: 7 prateleiras por módulo.');return}
  const s=[];ensureShelfMeta(s);m.shelves.splice(afterSi+1,0,s);renderAll();renderProperties();
}
function removeShelfAt(mi,si){
  const m=state.modules[mi];if(m.shelves.length<=2){toast('O módulo deve manter pelo menos 2 níveis.');return}
  const removed=m.shelves[si];const target=m.shelves[Math.max(0,si-1)];if(removed.length)target.push(...removed);m.shelves.splice(si,1);renderAll();renderProperties();
}

function moduleMenu(mi,e){
  e.stopPropagation();
  const m=state.modules[mi];
  const hooks=m.shelves.filter(s=>s.__displayType==='hooks').length;
  const cross=m.shelves.filter(s=>s.__crossTape).length;
  const menu=openFloatingMenu(`<div class="menu-title">Módulo ${String(mi+1).padStart(2,'0')} • Eixo X</div>
    <button data-act="addShelf">＋ Adicionar prateleira</button>
    <button data-act="cross">│ Inserir Fita Cross</button>
    <button data-act="hooks">⌗ Transformar todas em gancheiras</button>
    <button data-act="normal">▤ Restaurar prateleiras convencionais</button>
    <hr><div class="menu-title">Estrutura atual: ${m.shelves.length} níveis • ${hooks} gancheiras • ${cross} fitas cross</div>`,e.clientX,e.clientY);
  menu.querySelector('[data-act="addShelf"]').onclick=()=>addShelfAt(mi,m.shelves.length-1);
  menu.querySelector('[data-act="cross"]').onclick=()=>{const si=m.shelves.findIndex(s=>!s.__crossTape);toggleCrossTape(mi,si<0?0:si,true)};
  menu.querySelector('[data-act="hooks"]').onclick=()=>{m.shelves.forEach(s=>s.__displayType='hooks');renderAll();renderProperties()};
  menu.querySelector('[data-act="normal"]').onclick=()=>{m.shelves.forEach(s=>s.__displayType='shelf');renderAll();renderProperties()};
}
function shelfMenu(mi,si,e){
  e.stopPropagation();const s=state.modules[mi].shelves[si];ensureShelfMeta(s);
  const menu=openFloatingMenu(`<div class="menu-title">M${mi+1} • Nível ${si+1} • Eixo Y</div>
    <button data-act="normal">▤ Prateleira convencional</button>
    <button data-act="hooks">⌗ Transformar em gancheira</button>
    <button data-act="cross">│ ${s.__crossTape?'Remover':'Inserir'} Fita Cross</button>
    <hr><button data-act="above">↑ Inserir nível acima</button>
    <button data-act="below">↓ Inserir nível abaixo</button>
    <button class="danger" data-act="remove">⌫ Remover este nível</button>`,e.clientX,e.clientY);
  menu.querySelector('[data-act="normal"]').onclick=()=>toggleShelfType(mi,si,'shelf');
  menu.querySelector('[data-act="hooks"]').onclick=()=>toggleShelfType(mi,si,'hooks');
  menu.querySelector('[data-act="cross"]').onclick=()=>toggleCrossTape(mi,si);
  menu.querySelector('[data-act="above"]').onclick=()=>{const m=state.modules[mi];const n=[];ensureShelfMeta(n);m.shelves.splice(si,0,n);renderAll();renderProperties()};
  menu.querySelector('[data-act="below"]').onclick=()=>addShelfAt(mi,si);
  menu.querySelector('[data-act="remove"]').onclick=()=>removeShelfAt(mi,si);
}

function crossTapeMarkup(mi,si,s){
  if(!s.__crossTape)return'';
  const label=s.length?products.find(p=>p.id===s[0].productId)?.short||'PRODUTO':'PRODUTO';
  return `<div class="cross-tape" data-cross-mi="${mi}" data-cross-si="${si}" title="Fita Cross • etiqueta reduzida no topo"><div class="cross-tape-track"></div><div class="cross-tape-label">${label}<br>R$</div>${[20,47,74].map((top,i)=>`<div class="cross-tape-unit" style="top:${top}%">${label}</div>`).join('')}<button class="cross-remove" title="Remover Fita Cross">×</button></div>`;
}

renderGondola=function(){
  ensureFiveModules();
  const stage=$('gondolaStage');stage.className=`gondola-stage v10-stage modules-${state.visibleModules}`;stage.style.transform=`scale(${state.zoom})`;
  const visible=state.modules.slice(0,state.visibleModules);
  stage.innerHTML=visible.map((m,mi)=>`
    <section class="gondola-module v03" style="--shelf-count:${m.shelves.length}">
      <div class="module-head v10-head"><strong>MÓDULO ${String(mi+1).padStart(2,'0')}</strong><div class="module-head-actions"><span class="module-shelf-controls"><button class="module-control remove" data-remove-shelf="${mi}">−</button><span>${m.shelves.length} níveis</span><button class="module-control add" data-add-shelf="${mi}">＋</button></span><button class="structure-menu-btn" data-module-menu="${mi}" title="Planejamento do módulo">⋮</button></div></div>
      <div class="module-body">${m.shelves.map((s,si)=>{ensureShelfMeta(s);const fit=shelfFitV10(s);const single=fit.groups.length===1;const hooks=s.__displayType==='hooks';return `<div class="shelf v03-shelf ${hooks?'hook-shelf':''}" data-mi="${mi}" data-si="${si}"><span class="shelf-type-badge">${hooks?'GANCHEIRA':'PRATELEIRA'}</span><button class="shelf-menu-btn" data-shelf-menu="${mi}:${si}" title="Planejamento deste nível">⋮</button>
        <div class="shelf-products fit-products ${single?'single-sku':''}">${fit.groups.map(group=>{const p=products.find(x=>x.id===group.productId);if(!p)return'';const exposure=group.items.length*p.width*fit.scale+(group.items.length-1)*2;return `<div class="sku-group ${group.promo?'promo':''}" data-product="${p.id}" style="width:${Math.ceil(exposure)}px"><div class="sku-facings">${group.items.map(it=>`<div class="placed v09-facing ${state.selected===it.instanceId?'selected':''}" style="width:${Math.ceil(p.width*fit.scale)}px" draggable="true" data-instance="${it.instanceId}" title="${p.name}"><div class="product-depth-wrap">${scaledShape(p,fit.scale)}</div></div>`).join('')}</div><div class="price-tag ${group.promo?'pink':''}">${group.promo?'<b>OFERTA</b> ':''}${money(p.price)}</div>${posterMarkup(group,p,exposure)}</div>`}).join('')}</div>${crossTapeMarkup(mi,si,s)}<div class="shelf-metal"></div><div class="orange-profile"></div></div>`}).join('')}</div>
    </section>`).join('');

  stage.querySelectorAll('[data-add-shelf]').forEach(b=>b.onclick=e=>{e.stopPropagation();addShelf(+b.dataset.addShelf)});
  stage.querySelectorAll('[data-remove-shelf]').forEach(b=>b.onclick=e=>{e.stopPropagation();removeShelf(+b.dataset.removeShelf)});
  stage.querySelectorAll('[data-module-menu]').forEach(b=>b.onclick=e=>moduleMenu(+b.dataset.moduleMenu,e));
  stage.querySelectorAll('[data-shelf-menu]').forEach(b=>b.onclick=e=>{const [mi,si]=b.dataset.shelfMenu.split(':').map(Number);shelfMenu(mi,si,e)});
  stage.querySelectorAll('.cross-tape .cross-remove').forEach(b=>b.onclick=e=>{e.stopPropagation();const ct=b.closest('.cross-tape');toggleCrossTape(+ct.dataset.crossMi,+ct.dataset.crossSi,false)});
  stage.querySelectorAll('.shelf').forEach(s=>{s.ondragover=e=>{e.preventDefault();s.classList.add('drop')};s.ondragleave=()=>s.classList.remove('drop');s.ondrop=e=>{e.preventDefault();s.classList.remove('drop');const pid=e.dataTransfer.getData('product'),inst=e.dataTransfer.getData('instance'),mi=+s.dataset.mi,si=+s.dataset.si;if(pid){const test=[...state.modules[mi].shelves[si],{instanceId:'test',productId:pid,promo:state.sector==='Promo'}];if(!shelfFitV10(test).valid){toast('Sem espaço físico neste nível.');return}state.modules[mi].shelves[si].push({instanceId:uid(),productId:pid,promo:state.sector==='Promo'})}if(inst){const source=findInstance(inst);if(!source)return;const test=[...state.modules[mi].shelves[si],source.item];if((source.mi!==mi||source.si!==si)&&!shelfFitV10(test).valid){toast('O produto excederia o limite físico deste nível.');return}moveInstance(inst,mi,si)}renderAll();renderProperties()}});
  stage.querySelectorAll('.placed').forEach(el=>{el.ondragstart=e=>e.dataTransfer.setData('instance',el.dataset.instance);el.onclick=()=>{state.selected=el.dataset.instance;renderAll();renderProperties()};el.ondblclick=()=>openModal(el.dataset.instance)});
};

function installViewSelector(){
  const right=document.querySelector('.canvas-toolbar>div:last-child');if(!right||document.getElementById('moduleViewSelect'))return;
  const wrap=document.createElement('div');wrap.className='view-controls';wrap.innerHTML=`<span class="view-caption">VISUALIZAÇÃO</span><select id="moduleViewSelect" class="view-select">${[1,2,3,4,5].map(n=>`<option value="${n}" ${state.visibleModules===n?'selected':''}>${n} módulo${n>1?'s':''}</option>`).join('')}</select>`;right.prepend(wrap);$('moduleViewSelect').onchange=e=>{state.visibleModules=+e.target.value;renderAll();renderProperties();toast(`Visualização alterada para ${state.visibleModules} módulo${state.visibleModules>1?'s':''}.`)};
}

const previousRenderPropertiesV10=renderProperties;
renderProperties=function(){
  previousRenderPropertiesV10();
  const c=$('propertiesContent');if(!c)return;
  if(!state.selected){
    const hooks=state.modules.slice(0,state.visibleModules).reduce((n,m)=>n+m.shelves.filter(s=>s.__displayType==='hooks').length,0);
    const cross=state.modules.slice(0,state.visibleModules).reduce((n,m)=>n+m.shelves.filter(s=>s.__crossTape).length,0);
    c.insertAdjacentHTML('beforeend',`<div class="property-group"><h4>Planejamento estrutural</h4><div class="structure-summary"><div class="structure-card"><span>Módulos visíveis</span><strong>${state.visibleModules}</strong></div><div class="structure-card"><span>Gancheiras</span><strong>${hooks}</strong></div><div class="structure-card"><span>Fitas Cross</span><strong>${cross}</strong></div><div class="structure-card"><span>Escala física</span><strong>2,20 m</strong></div></div><div class="planner-note">Use ⋮ no cabeçalho do módulo para ações no eixo X e ⋮ em cada nível para ações no eixo Y. Gancheiras usam suporte/etiqueta reduzida; Fita Cross mantém uma etiqueta reduzida centralizada no topo.</div></div>`);
  }
};

installViewSelector();renderAll();renderProperties();
