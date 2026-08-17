/* v0.10-structure — gancheiras + fita cross + menus X/Y preservando render v0.9 */

function vmEnsureShelfMeta(s){
  if(!s.__displayType)s.__displayType='shelf';
  if(typeof s.__crossTape==='undefined')s.__crossTape=false;
}
function vmEnsureAllMeta(){state.modules.forEach(m=>m.shelves.forEach(vmEnsureShelfMeta))}
vmEnsureAllMeta();

function vmOpenMenu(html,x,y){
  let menu=document.getElementById('vmPlanMenu');
  if(!menu){menu=document.createElement('div');menu.id='vmPlanMenu';menu.className='vm-plan-menu';document.body.appendChild(menu)}
  menu.innerHTML=html;
  menu.style.left=Math.min(x,window.innerWidth-245)+'px';
  menu.style.top=Math.min(y,window.innerHeight-330)+'px';
  menu.classList.add('open');
  setTimeout(()=>document.addEventListener('click',vmCloseMenu,{once:true}),0);
  return menu;
}
function vmCloseMenu(){const m=document.getElementById('vmPlanMenu');if(m)m.classList.remove('open')}

function vmSetShelfType(mi,si,type){
  const s=state.modules[mi].shelves[si];vmEnsureShelfMeta(s);s.__displayType=type;
  renderAll();renderProperties();
  toast(type==='hooks'?'Nível convertido em gancheira.':'Nível restaurado para prateleira convencional.');
}
function vmToggleCross(mi,si,on){
  const s=state.modules[mi].shelves[si];vmEnsureShelfMeta(s);s.__crossTape=typeof on==='boolean'?on:!s.__crossTape;
  renderAll();renderProperties();toast(s.__crossTape?'Fita Cross inserida na divisória do módulo.':'Fita Cross removida.');
}
function vmInsertShelf(mi,si,where){
  const m=state.modules[mi];if(m.shelves.length>=7){toast('Limite do MVP: 7 níveis por módulo.');return}
  const n=[];vmEnsureShelfMeta(n);m.shelves.splice(where==='above'?si:si+1,0,n);renderAll();renderProperties();
}
function vmAddHookLevel(mi){
  const m=state.modules[mi];if(m.shelves.length>=7){toast('Limite do MVP: 7 níveis por módulo.');return}
  const n=[];vmEnsureShelfMeta(n);n.__displayType='hooks';m.shelves.push(n);renderAll();renderProperties();toast(`Gancheira adicionada ao Módulo ${String(mi+1).padStart(2,'0')}.`);
}
function vmAddCrossToModule(mi){
  const m=state.modules[mi];
  let si=m.shelves.findIndex(s=>{vmEnsureShelfMeta(s);return !s.__crossTape});
  if(si<0){toast('Este módulo já atingiu o limite de Fitas Cross configuradas no MVP.');return}
  m.shelves[si].__crossTape=true;renderAll();renderProperties();toast(`Fita Cross adicionada à divisória do Módulo ${String(mi+1).padStart(2,'0')}.`);
}
function vmRemoveShelf(mi,si){
  const m=state.modules[mi];if(m.shelves.length<=2){toast('O módulo deve manter ao menos 2 níveis.');return}
  const removed=m.shelves[si];const target=m.shelves[si>0?si-1:1];if(removed.length)target.push(...removed);m.shelves.splice(si,1);state.selected=null;renderAll();renderProperties();
}
function vmModuleMenu(mi,e){
  e.stopPropagation();const m=state.modules[mi];vmEnsureAllMeta();
  const hooks=m.shelves.filter(s=>s.__displayType==='hooks').length,cross=m.shelves.filter(s=>s.__crossTape).length;
  const menu=vmOpenMenu(`<div class="vm-menu-title">Módulo ${String(mi+1).padStart(2,'0')} • Estrutura</div>
    <button data-a="add">＋ Adicionar prateleira</button>
    <button data-a="addHook">⌗ Adicionar gancheira</button>
    <button data-a="addCross">│ Adicionar Fita Cross</button>
    <hr>
    <button data-a="hooks">⌗ Converter todos os níveis em gancheiras</button>
    <button data-a="shelf">▤ Restaurar todas as prateleiras</button>
    <button data-a="clearCross">│ Remover todas as Fitas Cross</button>
    <hr><div class="vm-menu-note">${m.shelves.length} níveis • ${hooks} gancheiras • ${cross} Fitas Cross. A Fita Cross é posicionada na divisória vertical do módulo, sem ocupar a frente da prateleira.</div>`,e.clientX,e.clientY);
  menu.querySelector('[data-a="add"]').onclick=()=>vmInsertShelf(mi,m.shelves.length-1,'below');
  menu.querySelector('[data-a="addHook"]').onclick=()=>vmAddHookLevel(mi);
  menu.querySelector('[data-a="addCross"]').onclick=()=>vmAddCrossToModule(mi);
  menu.querySelector('[data-a="hooks"]').onclick=()=>{m.shelves.forEach(s=>{vmEnsureShelfMeta(s);s.__displayType='hooks'});renderAll();renderProperties()};
  menu.querySelector('[data-a="shelf"]').onclick=()=>{m.shelves.forEach(s=>{vmEnsureShelfMeta(s);s.__displayType='shelf'});renderAll();renderProperties()};
  menu.querySelector('[data-a="clearCross"]').onclick=()=>{m.shelves.forEach(s=>{vmEnsureShelfMeta(s);s.__crossTape=false});renderAll();renderProperties()};
}
function vmShelfMenu(mi,si,e){
  e.stopPropagation();const s=state.modules[mi].shelves[si];vmEnsureShelfMeta(s);
  const menu=vmOpenMenu(`<div class="vm-menu-title">M${mi+1} • Nível ${si+1} • Planejamento Y</div>
    <button data-a="shelf">▤ Prateleira convencional</button>
    <button data-a="hooks">⌗ Transformar em gancheira</button>
    <button data-a="cross">│ ${s.__crossTape?'Remover':'Inserir'} Fita Cross</button>
    <hr><button data-a="above">↑ Inserir nível acima</button><button data-a="below">↓ Inserir nível abaixo</button>
    <button class="danger" data-a="remove">⌫ Remover este nível</button>
    <div class="vm-menu-note">A Fita Cross fica fisicamente na divisória vertical do módulo e desce pela gôndola; este nível serve como vínculo do produto/etiqueta.</div>`,e.clientX,e.clientY);
  menu.querySelector('[data-a="shelf"]').onclick=()=>vmSetShelfType(mi,si,'shelf');
  menu.querySelector('[data-a="hooks"]').onclick=()=>vmSetShelfType(mi,si,'hooks');
  menu.querySelector('[data-a="cross"]').onclick=()=>vmToggleCross(mi,si);
  menu.querySelector('[data-a="above"]').onclick=()=>vmInsertShelf(mi,si,'above');
  menu.querySelector('[data-a="below"]').onclick=()=>vmInsertShelf(mi,si,'below');
  menu.querySelector('[data-a="remove"]').onclick=()=>vmRemoveShelf(mi,si);
}
function vmCrossMarkup(mi,si,s,index,side){
  if(!s.__crossTape)return'';
  const p=s.length?products.find(x=>x.id===s[0].productId):null;
  const label=p?.short||'PRODUTO';
  return `<div class="vm-cross-tape vm-cross-${side}" data-mi="${mi}" data-si="${si}" data-cross-index="${index}" title="Fita Cross • divisória do módulo"><div class="vm-cross-track"></div><div class="vm-cross-label">${label}<br>${p?money(p.price):'R$'}</div><div class="vm-cross-unit u1">${label}</div><div class="vm-cross-unit u2">${label}</div><div class="vm-cross-unit u3">${label}</div><div class="vm-cross-unit u4">${label}</div><div class="vm-cross-unit u5">${label}</div><button class="vm-cross-remove" title="Remover Fita Cross">×</button></div>`;
}
function vmDecorateGondola(){
  vmEnsureAllMeta();const stage=$('gondolaStage');if(!stage)return;
  const modules=[...stage.querySelectorAll('.gondola-module')];
  modules.forEach((mod,mi)=>{
    const head=mod.querySelector('.module-head');
    if(head&&!head.querySelector('.vm-structure-trigger')){
      const b=document.createElement('button');b.className='vm-structure-trigger';b.title='Planejamento estrutural do módulo';b.textContent='⋮';b.onclick=e=>vmModuleMenu(mi,e);head.appendChild(b);
    }
    const shelves=[...mod.querySelectorAll('.shelf')];
    shelves.forEach((shelf,si)=>{
      const meta=state.modules[mi]?.shelves[si];if(!meta)return;vmEnsureShelfMeta(meta);
      shelf.classList.toggle('vm-hooks',meta.__displayType==='hooks');
      let badge=shelf.querySelector('.vm-level-badge');if(!badge){badge=document.createElement('span');badge.className='vm-level-badge';shelf.appendChild(badge)}
      badge.textContent=meta.__displayType==='hooks'?'GANCHEIRA':'PRATELEIRA';
      if(!shelf.querySelector('.vm-level-trigger')){const b=document.createElement('button');b.className='vm-level-trigger';b.title='Planejamento deste nível';b.textContent='⋮';b.onclick=e=>vmShelfMenu(mi,si,e);shelf.appendChild(b)}
      shelf.querySelectorAll('.vm-cross-tape').forEach(x=>x.remove());
    });

    /* A Fita Cross pertence visualmente à DIVISÓRIA do módulo, não à prateleira. */
    mod.querySelectorAll(':scope > .vm-cross-tape').forEach(x=>x.remove());
    const crossShelves=state.modules[mi].shelves.map((s,si)=>({s,si})).filter(x=>{vmEnsureShelfMeta(x.s);return x.s.__crossTape});
    crossShelves.forEach(({s,si},index)=>{
      const side='right';
      mod.insertAdjacentHTML('beforeend',vmCrossMarkup(mi,si,s,index,side));
    });
    mod.querySelectorAll(':scope > .vm-cross-tape .vm-cross-remove').forEach(b=>b.onclick=e=>{
      e.stopPropagation();const cross=b.closest('.vm-cross-tape');vmToggleCross(+cross.dataset.mi,+cross.dataset.si,false);
    });
  });
}

/* Wrap em vez de substituir o render da v0.9: geometria visual permanece intocada. */
const vmBaseRenderGondola=renderGondola;
renderGondola=function(){vmBaseRenderGondola();vmDecorateGondola()};

const vmBaseRenderProperties=renderProperties;
renderProperties=function(){
  vmBaseRenderProperties();const c=$('propertiesContent');if(!c||state.selected)return;
  const hooks=state.modules.reduce((n,m)=>n+m.shelves.filter(s=>{vmEnsureShelfMeta(s);return s.__displayType==='hooks'}).length,0);
  const cross=state.modules.reduce((n,m)=>n+m.shelves.filter(s=>{vmEnsureShelfMeta(s);return s.__crossTape}).length,0);
  c.insertAdjacentHTML('beforeend',`<div class="property-group"><h4>Planejamento estrutural</h4><div class="vm-structure-summary"><div class="vm-structure-card"><span>Módulos</span><strong>${state.modules.length}</strong></div><div class="vm-structure-card"><span>Gancheiras</span><strong>${hooks}</strong></div><div class="vm-structure-card"><span>Fitas Cross</span><strong>${cross}</strong></div><div class="vm-structure-card"><span>Base visual</span><strong>v0.9</strong></div></div><div class="vm-structure-note">A Fita Cross agora é representada na divisória vertical do módulo e percorre a altura útil da gôndola, sem sobrepor as frentes de produtos.</div></div>`);
};

renderAll();renderProperties();
