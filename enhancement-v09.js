/* Planograma VM v0.9 — regras físicas + etiquetas + cartazes conforme manual */

const POSTER_SIZES={
  A3:{w:297,h:420,use:'Cestos, pilhas de alto volume e móveis'},
  A4:{w:210,h:297,use:'Módulos com mais de uma altura, terminais e aéreos'},
  A5:{w:148,h:210,use:'Módulos, laterais e terminais'},
  A6:{w:105,h:148,use:'Módulos menores, laterais e gancheiras'},
  A7:{w:74,h:105,use:'Gancheiras de pequena frente ou produto unitário'}
};
const GONDOLA_MM=2200;
const GONDOLA_RENDER_PX=560;
const PX_PER_MM=GONDOLA_RENDER_PX/GONDOLA_MM;
const SHELF_INNER_PX=326;
const MIN_PRODUCT_SCALE=.56;

function contiguousGroups(items){
  const groups=[];
  items.forEach(item=>{
    const last=groups[groups.length-1];
    if(last&&last.productId===item.productId&&last.promo===item.promo) last.items.push(item);
    else groups.push({productId:item.productId,promo:item.promo,items:[item]});
  });
  return groups;
}

function shelfFit(items){
  const groups=contiguousGroups(items);
  let nominal=0,facings=0;
  groups.forEach(g=>{
    const p=products.find(x=>x.id===g.productId); if(!p)return;
    nominal+=g.items.length*p.width;
    facings+=g.items.length;
  });
  nominal+=Math.max(0,facings-1)*2+Math.max(0,groups.length-1)*4;
  const scale=Math.min(1,SHELF_INNER_PX/Math.max(1,nominal));
  return {groups,nominal,scale,valid:scale>=MIN_PRODUCT_SCALE};
}

function scaledShape(p,scale){
  const w=Math.max(17,Math.round(p.width*scale));
  const h=Math.max(24,Math.round(p.height*scale));
  return `<div class="generic-product ${p.shape}" style="width:${w}px;height:${h}px"><span>${p.short}<small>${p.volume||''}</small></span></div>`;
}

function posterCountInModule(mi){
  let n=0;
  state.modules[mi].shelves.forEach(s=>s.forEach(it=>{if(it.poster)n++}));
  return n;
}
function clearPostersForGroup(f){
  const shelf=state.modules[f.mi].shelves[f.si];
  shelf.forEach(it=>{if(it.productId===f.item.productId)delete it.poster});
}
function assignPoster(size){
  const f=findInstance(state.selected);if(!f)return;
  const shelf=state.modules[f.mi].shelves[f.si];
  const groupItems=shelf.filter(it=>it.productId===f.item.productId);
  const already=groupItems.some(it=>it.poster);
  if(!already&&posterCountInModule(f.mi)>=3){toast('Regra VM: máximo de 3 cartazes por módulo.');return;}
  const p=products.find(x=>x.id===f.item.productId);
  const fit=shelfFit(shelf);
  const group=fit.groups.find(g=>g.productId===p.id);
  const exposure=(group?group.items.length:1)*p.width*fit.scale;
  const physical=POSTER_SIZES[size];
  const posterW=physical.w*PX_PER_MM;
  if(posterW>exposure+8){toast(`${size} excede a largura desta exposição. Escolha um cartaz menor ou aumente as frentes.`);return;}
  clearPostersForGroup(f);
  groupItems[0].poster={size};
  renderAll();renderProperties();
  if(size==='A3'||size==='A7')toast(`${size} atribuído. Atenção: em módulos de gôndola o manual prioriza A5/A6 e condiciona A4.`);
  else toast(`Cartaz ${size} atribuído à exposição de ${p.short}.`);
}
function removePoster(){
  const f=findInstance(state.selected);if(!f)return;
  clearPostersForGroup(f);renderAll();renderProperties();toast('Cartaz removido da exposição.');
}

function posterMarkup(group,p,exposureWidth){
  const owner=group.items.find(it=>it.poster);if(!owner)return'';
  const size=owner.poster.size;
  return `<div class="product-poster poster-${size.toLowerCase()}" style="max-width:${Math.max(18,Math.floor(exposureWidth))}px" title="Cartaz ${size} • ${POSTER_SIZES[size].use}">
    <div class="poster-ribbon">OFERTA</div>
    <div class="poster-name">${p.short}</div>
    <div class="poster-volume">${p.volume||''}</div>
    <div class="poster-price">${money(p.price)}</div>
  </div>`;
}

renderGondola=function(){
  const stage=$('gondolaStage');stage.style.transform=`scale(${state.zoom})`;
  stage.innerHTML=state.modules.map((m,mi)=>`
    <section class="gondola-module v03" style="--shelf-count:${m.shelves.length}">
      <div class="module-head"><strong>MÓDULO ${String(mi+1).padStart(2,'0')}</strong>
        <div class="module-shelf-controls"><button class="module-control remove" data-remove-shelf="${mi}" title="Remover prateleira">−</button><span>${m.shelves.length} prateleiras</span><button class="module-control add" data-add-shelf="${mi}" title="Inserir prateleira">＋</button></div>
      </div>
      <div class="module-body">${m.shelves.map((s,si)=>{
        const fit=shelfFit(s);const single=fit.groups.length===1;
        return `<div class="shelf v03-shelf" data-mi="${mi}" data-si="${si}">
          <div class="shelf-products fit-products ${single?'single-sku':''}">${fit.groups.map(group=>{
            const p=products.find(x=>x.id===group.productId);if(!p)return'';
            const exposure=group.items.length*p.width*fit.scale+(group.items.length-1)*2;
            return `<div class="sku-group ${group.promo?'promo':''}" data-product="${p.id}" style="width:${Math.ceil(exposure)}px">
              <div class="sku-facings">${group.items.map(it=>`<div class="placed v09-facing ${state.selected===it.instanceId?'selected':''}" style="width:${Math.ceil(p.width*fit.scale)}px" draggable="true" data-instance="${it.instanceId}" title="${p.name}"><div class="product-depth-wrap">${scaledShape(p,fit.scale)}</div></div>`).join('')}</div>
              <div class="price-tag ${group.promo?'pink':''}">${group.promo?'<b>OFERTA</b> ':''}${money(p.price)}</div>
              ${posterMarkup(group,p,exposure)}
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
    s.ondrop=e=>{
      e.preventDefault();s.classList.remove('drop');
      const pid=e.dataTransfer.getData('product'),inst=e.dataTransfer.getData('instance');const mi=+s.dataset.mi,si=+s.dataset.si;
      if(pid){
        const test=[...state.modules[mi].shelves[si],{instanceId:'test',productId:pid,promo:state.sector==='Promo'}];
        if(!shelfFit(test).valid){toast('Sem espaço físico nesta prateleira. Remova uma frente ou use outra prateleira.');return;}
        state.modules[mi].shelves[si].push({instanceId:uid(),productId:pid,promo:state.sector==='Promo'});
      }
      if(inst){
        const source=findInstance(inst);if(!source)return;
        const moved=source.item;
        const test=[...state.modules[mi].shelves[si],moved];
        if((source.mi!==mi||source.si!==si)&&!shelfFit(test).valid){toast('O produto excederia o limite físico do módulo/prateleira.');return;}
        moveInstance(inst,mi,si);
      }
      renderAll();renderProperties();
    };
  });
  stage.querySelectorAll('.placed').forEach(el=>{el.ondragstart=e=>e.dataTransfer.setData('instance',el.dataset.instance);el.onclick=()=>{state.selected=el.dataset.instance;renderAll();renderProperties()};el.ondblclick=()=>openModal(el.dataset.instance)});
};

renderProperties=function(){
  const c=$('propertiesContent');
  if(!state.selected){c.innerHTML=`<div class="properties-empty">Selecione um produto da gôndola para editar posição, etiqueta, frentes e cartaz.</div><div class="property-group"><h4>Setor ativo</h4><div class="property-item"><span>Classificação mercadológica</span><strong>${state.sector}</strong></div></div>`;return;}
  const f=findInstance(state.selected);if(!f)return;const p=products.find(x=>x.id===f.item.productId);
  const shelf=state.modules[f.mi].shelves[f.si];const posterOwner=shelf.find(it=>it.productId===p.id&&it.poster);const posterSize=posterOwner?.poster?.size;
  c.innerHTML=`<div class="property-group"><h4>${p.name}</h4><div class="property-grid"><div class="property-item"><span>Marca</span><strong>${p.brand}</strong></div><div class="property-item"><span>Preço</span><strong>${money(p.price)}</strong></div><div class="property-item"><span>Volume</span><strong>${p.volume}</strong></div><div class="property-item"><span>Posição</span><strong>M${f.mi+1} • P${f.si+1}</strong></div></div></div>
  <div class="property-group"><h4>Etiqueta</h4><div class="property-actions"><button id="whiteTag" class="propbtn">Branca</button><button id="pinkTag" class="propbtn">Rosa promocional</button></div><div class="poster-hint">Regra: etiqueta no início esquerdo da variedade. Se a prateleira tiver um único SKU, o preço é centralizado. Uma única etiqueta por SKU na mesma prateleira.</div></div>
  <div class="property-group"><h4>Frentes</h4><div class="property-actions"><button id="dupFront" class="propbtn">＋ Duplicar frente</button><button id="removeItem" class="propbtn danger">Remover</button></div></div>
  <div class="property-group"><h4>Cartaz</h4><div class="poster-control"><div class="poster-control-title">Atribuir tamanho</div><div class="poster-size-grid">${Object.keys(POSTER_SIZES).map(size=>`<button class="poster-size-btn ${posterSize===size?'active':''}" data-poster-size="${size}" title="${POSTER_SIZES[size].w} × ${POSTER_SIZES[size].h} mm • ${POSTER_SIZES[size].use}">${size}</button>`).join('')}</div>${posterSize?`<button id="removePoster" class="poster-remove-btn">Remover cartaz ${posterSize}</button>`:''}<div class="poster-hint">Escala visual proporcional a uma gôndola de 2,20 m. Em módulos, o manual prioriza A5/A6; A4 é condicionado. Máximo de 3 cartazes por módulo, sempre dentro da largura da exposição, e o cartaz não substitui a etiqueta.</div></div></div>`;
  $('whiteTag').onclick=()=>{shelf.filter(it=>it.productId===p.id).forEach(it=>it.promo=false);renderAll();renderProperties()};
  $('pinkTag').onclick=()=>{shelf.filter(it=>it.productId===p.id).forEach(it=>it.promo=true);renderAll();renderProperties()};
  $('dupFront').onclick=()=>{const clone={...f.item,instanceId:uid()};delete clone.poster;const test=[...shelf];test.splice(f.idx+1,0,clone);if(!shelfFit(test).valid){toast('Sem espaço físico para outra frente nesta prateleira.');return;}shelf.splice(f.idx+1,0,clone);renderAll();renderProperties()};
  $('removeItem').onclick=()=>{shelf.splice(f.idx,1);state.selected=null;renderAll();renderProperties()};
  c.querySelectorAll('[data-poster-size]').forEach(b=>b.onclick=()=>assignPoster(b.dataset.posterSize));
  if($('removePoster'))$('removePoster').onclick=removePoster;
};

renderAudit=function(){
  const rows=[];
  state.modules.forEach((m,mi)=>{
    const posterCount=posterCountInModule(mi);
    rows.push({ok:posterCount<=3,text:`Módulo ${mi+1}: ${posterCount}/3 cartazes`});
    m.shelves.forEach((s,si)=>{const fit=shelfFit(s);rows.push({ok:fit.valid,text:`M${mi+1} P${si+1}: produtos dentro do limite físico`})});
  });
  rows.push({ok:true,text:'Etiqueta vinculada ao início esquerdo de cada SKU'});
  rows.push({ok:true,text:'Cartaz complementa a etiqueta; não a substitui'});
  $('auditList').innerHTML=rows.slice(0,9).map(r=>`<div class="audit-row ${r.ok?'ok':''}"><i>${r.ok?'✓':'!'}</i>${r.text}</div>`).join('');
};

// Reaplica a tela com as regras da v0.9 sem alterar o layout atual.
renderAll();renderProperties();
