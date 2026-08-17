/* Planograma VM v0.5 — fidelidade visual à arte conceitual */
function findInstance(id){
  for(let mi=0;mi<state.modules.length;mi++)for(let si=0;si<state.modules[mi].shelves.length;si++){
    const idx=state.modules[mi].shelves[si].findIndex(x=>x.instanceId===id);
    if(idx>=0)return{mi,si,idx,item:state.modules[mi].shelves[si][idx]};
  }
  return null;
}

function addShelf(mi){
  const module=state.modules[mi];
  if(module.shelves.length>=7){toast('Limite visual do MVP: 7 prateleiras por módulo.');return;}
  module.shelves.push([]);state.selected=null;rebalanceModule(mi);renderAll();renderProperties();
  toast(`Prateleira adicionada ao Módulo ${String(mi+1).padStart(2,'0')}`);
}
function removeShelf(mi){
  const module=state.modules[mi];
  if(module.shelves.length<=2){toast('O módulo deve manter pelo menos 2 prateleiras.');return;}
  const removed=module.shelves.pop();if(removed.length)module.shelves[module.shelves.length-1].push(...removed);
  state.selected=null;renderAll();renderProperties();toast(`Prateleira removida do Módulo ${String(mi+1).padStart(2,'0')}`);
}
function rebalanceModule(mi){
  const m=state.modules[mi],all=m.shelves.flat();m.shelves.forEach(s=>s.splice(0));if(!all.length)return;
  all.forEach((it,i)=>m.shelves[Math.floor(i/9)%m.shelves.length].push(it));
}

function groupShelfItems(items){
  const groups=[];
  items.forEach(item=>{
    const last=groups[groups.length-1];
    if(last&&last.productId===item.productId&&last.promo===item.promo)last.items.push(item);
    else groups.push({productId:item.productId,promo:item.promo,items:[item]});
  });
  return groups;
}

function posterForModule(mi){
  if(state.sector!=='Alimentos'||mi!==1)return'';
  return `<div class="vm-poster" title="Cartaz promocional">
    <div class="poster-ribbon">OFERTA</div><strong>AZEITE<br>EXTRA VIRGEM</strong><small>500ml</small><b>R$ 29,90</b><em>preço destaque</em>
  </div>`;
}

function renderGondola(){
  const stage=$('gondolaStage');stage.style.transform=`scale(${state.zoom})`;
  stage.innerHTML=state.modules.map((m,mi)=>`
    <section class="gondola-module v03" style="--shelf-count:${m.shelves.length}">
      <div class="module-head"><strong>MÓDULO ${String(mi+1).padStart(2,'0')}</strong>
        <div class="module-shelf-controls">
          <button class="module-control remove" data-remove-shelf="${mi}" title="Remover prateleira">−</button>
          <span>${m.shelves.length} prateleiras</span>
          <button class="module-control add" data-add-shelf="${mi}" title="Inserir prateleira">＋</button>
        </div>
      </div>
      ${posterForModule(mi)}
      <div class="module-body">${m.shelves.map((s,si)=>{
        const groups=groupShelfItems(s);
        return `<div class="shelf v03-shelf" data-mi="${mi}" data-si="${si}">
          <div class="shelf-products">${groups.map(group=>{
            const p=products.find(x=>x.id===group.productId);if(!p)return'';
            return `<div class="sku-group ${group.promo?'promo':''}" data-product="${p.id}">
              <div class="sku-facings">${group.items.map(it=>`<div class="placed ${state.selected===it.instanceId?'selected':''}" draggable="true" data-instance="${it.instanceId}" title="${p.name}"><div class="product-depth-wrap">${shape(p)}</div></div>`).join('')}</div>
              <div class="price-tag ${group.promo?'pink':''}">${group.promo?'<b>OFERTA</b> ':''}${money(p.price)}</div>
            </div>`;
          }).join('')}</div>
          <div class="shelf-metal"></div><div class="orange-profile" aria-hidden="true"></div>
        </div>`;
      }).join('')}</div>
    </section>`).join('');

  stage.querySelectorAll('[data-add-shelf]').forEach(b=>b.onclick=e=>{e.stopPropagation();addShelf(+b.dataset.addShelf)});
  stage.querySelectorAll('[data-remove-shelf]').forEach(b=>b.onclick=e=>{e.stopPropagation();removeShelf(+b.dataset.removeShelf)});
  stage.querySelectorAll('.shelf').forEach(s=>{
    s.ondragover=e=>{e.preventDefault();s.classList.add('drop')};s.ondragleave=()=>s.classList.remove('drop');
    s.ondrop=e=>{e.preventDefault();s.classList.remove('drop');const pid=e.dataTransfer.getData('product'),inst=e.dataTransfer.getData('instance');const mi=+s.dataset.mi,si=+s.dataset.si;if(pid)state.modules[mi].shelves[si].push({instanceId:uid(),productId:pid,promo:state.sector==='Promo'});if(inst)moveInstance(inst,mi,si);renderAll()};
  });
  stage.querySelectorAll('.placed').forEach(el=>{el.ondragstart=e=>e.dataTransfer.setData('instance',el.dataset.instance);el.onclick=()=>{state.selected=el.dataset.instance;renderAll();renderProperties()};el.ondblclick=()=>openModal(el.dataset.instance)});
}

function moveInstance(id,mi,si){let moved;state.modules.forEach(m=>m.shelves.forEach(s=>{const i=s.findIndex(x=>x.instanceId===id);if(i>=0)moved=s.splice(i,1)[0]}));if(moved)state.modules[mi].shelves[si].push(moved)}

function updateKpis(){
  const all=state.modules.flatMap(m=>m.shelves.flat());const shelfTotal=state.modules.reduce((n,m)=>n+m.shelves.length,0);const capacity=Math.max(1,shelfTotal*9);
  $('facesKpi').textContent=all.length;$('skuKpi').textContent=new Set(all.map(x=>x.productId)).size;$('fillKpi').textContent=`${Math.min(100,Math.round(all.length/capacity*100))}%`;$('complianceKpi').textContent=all.length?'98%':'100%';
}

function seedSector(){
  state.selected=null;const pool=currentProducts();
  state.modules.forEach((m,mi)=>m.shelves.forEach((s,si)=>{
    s.splice(0);if(!pool.length)return;
    const a=pool[(mi*2+si)%pool.length],b=pool[(mi*2+si+1)%pool.length],c=pool[(mi*2+si+2)%pool.length];
    const counts=mi===1&&si===0?[4,3,2]:[4,3,2];
    [a,b,c].forEach((p,gi)=>{for(let i=0;i<counts[gi];i++)s.push({instanceId:uid(),productId:p.id,promo:state.sector==='Promo'||(state.sector==='Alimentos'&&mi===1&&si===3&&gi<2)})});
  }));
  renderAll();renderProperties();toast(`Gôndola carregada: ${state.sector}`);
}

function applyStrategy(type){
  let all=state.modules.flatMap(m=>m.shelves.flat());if(type==='manual'){toast('Modo manual: arraste e solte produtos.');return;}
  const fn=type==='brand'?x=>products.find(p=>p.id===x.productId).brand:type==='price'?x=>products.find(p=>p.id===x.productId).price:type==='size'?x=>parseFloat(products.find(p=>p.id===x.productId).volume):x=>products.find(p=>p.id===x.productId).short;
  all.sort((a,b)=>{const av=fn(a),bv=fn(b);return typeof av==='number'?av-bv:String(av).localeCompare(String(bv))});
  state.modules.forEach(m=>m.shelves.forEach(s=>s.splice(0)));const slots=state.modules.flatMap((m,mi)=>m.shelves.map((s,si)=>({s,mi,si})));all.forEach((it,i)=>slots[Math.floor(i/9)%slots.length].s.push(it));renderAll();toast(type==='auto'?'Auto-planejamento aplicado':'Estratégia aplicada');
}

const dupButton=$('duplicateModuleBtn');if(dupButton)dupButton.onclick=()=>{state.modules[2]={shelves:state.modules[1].shelves.map(s=>s.map(x=>({...x,instanceId:uid()})))};renderAll();renderProperties();toast('Módulo 02 duplicado para o módulo 03')};
renderAll();renderProperties();