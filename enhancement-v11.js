/* Planograma VM v0.11 — dimensionamento físico responsivo por visualização */
function viewShelfWidth(){
  const map={1:700,2:475,3:326,4:236,5:176};
  return map[state.visibleModules]||326;
}
function shelfFitV11(items){
  const groups=contiguousGroups(items);
  let nominal=0,facings=0;
  groups.forEach(g=>{const p=products.find(x=>x.id===g.productId);if(!p)return;nominal+=g.items.length*p.width;facings+=g.items.length;});
  const gap=state.visibleModules>=5?.5:state.visibleModules===4?.75:1;
  nominal+=Math.max(0,facings-1)*gap+Math.max(0,groups.length-1)*2;
  const target=viewShelfWidth();
  const scale=Math.min(1,target/Math.max(1,nominal));
  return {groups,nominal,scale,gap,target,valid:scale>=.26};
}
shelfFit=shelfFitV11;

function responsiveDims(p,scale){
  const viewCap={1:1,2:1,3:1,4:.86,5:.72}[state.visibleModules]||1;
  const factor=Math.min(1,scale)*viewCap;
  const w=Math.max(state.visibleModules===5?8:10,Math.round(p.width*factor));
  const maxH={1:82,2:80,3:78,4:65,5:54}[state.visibleModules]||78;
  const h=Math.max(state.visibleModules===5?16:20,Math.min(maxH,Math.round(p.height*factor)));
  const font=Math.max(3.4,Math.min(6,6*factor+.5));
  const sub=Math.max(2.8,Math.min(4.5,4.5*factor+.35));
  return {w,h,font,sub};
}
function responsiveShape(p,d){
  return `<div class="generic-product ${p.shape}" style="--render-w:${d.w}px;--render-h:${d.h}px;width:${d.w}px;height:${d.h}px"><span>${p.short}<small>${p.volume||''}</small></span></div>`;
}

renderGondola=function(){
  ensureFiveModules();
  const stage=$('gondolaStage');stage.className=`gondola-stage v10-stage modules-${state.visibleModules}`;stage.style.transform=`scale(${state.zoom})`;
  const visible=state.modules.slice(0,state.visibleModules);
  stage.innerHTML=visible.map((m,mi)=>`
    <section class="gondola-module v03" style="--shelf-count:${m.shelves.length}">
      <div class="module-head v10-head"><strong>MÓDULO ${String(mi+1).padStart(2,'0')}</strong><div class="module-head-actions"><span class="module-shelf-controls"><button class="module-control remove" data-remove-shelf="${mi}">−</button><span>${m.shelves.length} níveis</span><button class="module-control add" data-add-shelf="${mi}">＋</button></span><button class="structure-menu-btn" data-module-menu="${mi}" title="Planejamento do módulo">⋮</button></div></div>
      <div class="module-body">${m.shelves.map((s,si)=>{ensureShelfMeta(s);const fit=shelfFitV11(s);const single=fit.groups.length===1;const hooks=s.__displayType==='hooks';return `<div class="shelf v03-shelf ${hooks?'hook-shelf':''}" data-mi="${mi}" data-si="${si}"><span class="shelf-type-badge">${hooks?'GANCHEIRA':'PRATELEIRA'}</span><button class="shelf-menu-btn" data-shelf-menu="${mi}:${si}" title="Planejamento deste nível">⋮</button>
        <div class="shelf-products fit-products ${single?'single-sku':''}" style="--facing-gap:${fit.gap}px">${fit.groups.map(group=>{const p=products.find(x=>x.id===group.productId);if(!p)return'';const d=responsiveDims(p,fit.scale);const exposure=group.items.length*d.w+(group.items.length-1)*fit.gap;return `<div class="sku-group ${group.promo?'promo':''}" data-product="${p.id}" style="width:${Math.ceil(exposure)}px;flex:0 0 ${Math.ceil(exposure)}px"><div class="sku-facings">${group.items.map(it=>`<div class="placed v09-facing v11-facing ${state.selected===it.instanceId?'selected':''}" style="--render-w:${d.w}px;--render-h:${d.h}px;--product-font:${d.font}px;--product-subfont:${d.sub}px;width:${d.w}px;flex-basis:${d.w}px" draggable="true" data-instance="${it.instanceId}" title="${p.name}"><div class="product-depth-wrap">${responsiveShape(p,d)}</div></div>`).join('')}</div><div class="price-tag ${group.promo?'pink':''}">${group.promo?'<b>OFERTA</b> ':''}${money(p.price)}</div>${posterMarkup(group,p,exposure)}</div>`}).join('')}</div>${crossTapeMarkup(mi,si,s)}<div class="shelf-metal"></div><div class="orange-profile"></div></div>`}).join('')}</div>
    </section>`).join('');

  stage.querySelectorAll('[data-add-shelf]').forEach(b=>b.onclick=e=>{e.stopPropagation();addShelf(+b.dataset.addShelf)});
  stage.querySelectorAll('[data-remove-shelf]').forEach(b=>b.onclick=e=>{e.stopPropagation();removeShelf(+b.dataset.removeShelf)});
  stage.querySelectorAll('[data-module-menu]').forEach(b=>b.onclick=e=>moduleMenu(+b.dataset.moduleMenu,e));
  stage.querySelectorAll('[data-shelf-menu]').forEach(b=>b.onclick=e=>{const [mi,si]=b.dataset.shelfMenu.split(':').map(Number);shelfMenu(mi,si,e)});
  stage.querySelectorAll('.cross-tape .cross-remove').forEach(b=>b.onclick=e=>{e.stopPropagation();const ct=b.closest('.cross-tape');toggleCrossTape(+ct.dataset.crossMi,+ct.dataset.crossSi,false)});
  stage.querySelectorAll('.shelf').forEach(s=>{s.ondragover=e=>{e.preventDefault();s.classList.add('drop')};s.ondragleave=()=>s.classList.remove('drop');s.ondrop=e=>{e.preventDefault();s.classList.remove('drop');const pid=e.dataTransfer.getData('product'),inst=e.dataTransfer.getData('instance'),mi=+s.dataset.mi,si=+s.dataset.si;if(pid){const test=[...state.modules[mi].shelves[si],{instanceId:'test',productId:pid,promo:state.sector==='Promo'}];if(!shelfFitV11(test).valid){toast('Sem espaço físico neste nível.');return}state.modules[mi].shelves[si].push({instanceId:uid(),productId:pid,promo:state.sector==='Promo'})}if(inst){const source=findInstance(inst);if(!source)return;const test=[...state.modules[mi].shelves[si],source.item];if((source.mi!==mi||source.si!==si)&&!shelfFitV11(test).valid){toast('O produto excederia o limite físico deste nível.');return}moveInstance(inst,mi,si)}renderAll();renderProperties()}});
  stage.querySelectorAll('.placed').forEach(el=>{el.ondragstart=e=>e.dataTransfer.setData('instance',el.dataset.instance);el.onclick=()=>{state.selected=el.dataset.instance;renderAll();renderProperties()};el.ondblclick=()=>openModal(el.dataset.instance)});
};

// Atualiza sem alterar o conteúdo do planograma.
renderAll();renderProperties();
