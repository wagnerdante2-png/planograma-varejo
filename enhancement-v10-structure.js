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
  menu.style.top=Math.min(y,window.innerHeight-300)+'px';
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
  renderAll();renderProperties();toast(s.__crossTape?'Fita Cross inserida neste nível.':'Fita Cross removida.');
}
function vmInsertShelf(mi,si,where){
  const m=state.modules[mi];if(m.shelves.length>=7){toast('Limite do MVP: 7 níveis por módulo.');return}
  const n=[];vmEnsureShelfMeta(n);m.shelves.splice(where==='above'?si:si+1,0,n);renderAll();renderProperties();
}
function vmRemoveShelf(mi,si){
  const m=state.modules[mi];if(m.shelves.length<=2){toast('O módulo deve manter ao menos 2 níveis.');return}
  const removed=m.shelves[si];const target=m.shelves[si>0?si-1:1];if(removed.length)target.push(...removed);m.shelves.splice(si,1);state.selected=null;renderAll();renderProperties();
}
function vmModuleMenu(mi,e){
  e.stopPropagation();const m=state.modules[mi];vmEnsureAllMeta();
  const hooks=m.shelves.filter(s=>s.__displayType==='hooks').length,cross=m.shelves.filter(s=>s.__crossTape).length;
  const menu=vmOpenMenu(`<div class="vm-menu-title">Módulo ${String(mi+1).padStart(2,'0')} • Estrutura</div>
    <button data-a="add">＋ Adicionar nível ao final</button>
    <button data-a="hooks">⌗ Converter todos os níveis em gancheiras</button>
    <button data-a="shelf">▤ Restaurar todas as prateleiras</button>
    <button data-a="clearCross">│ Remover todas as Fitas Cross</button>
    <hr><div class="vm-menu-note">${m.shelves.length} níveis • ${hooks} gancheiras • ${cross} Fitas Cross. Use o menu ⋮ de cada nível para ajustes pontuais.</div>`,e.clientX,e.clientY);
  menu.querySelector('[data-a="add"]').onclick=()=>vmInsertShelf(mi,m.shelves.length-1,'below');
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
    <div class="vm-menu-note">Gancheiras usam suporte frontal com etiqueta reduzida. Fita Cross mantém uma única etiqueta reduzida no topo.</div>`,e.clientX,e.clientY);
  menu.querySelector('[data-a="shelf"]').onclick=()=>vmSetShelfType(mi,si,'shelf');
  menu.querySelector('[data-a="hooks"]').onclick=()=>vmSetShelfType(mi,si,'hooks');
  menu.querySelector('[data-a="cross"]').onclick=()=>vmToggleCross(mi,si);
  menu.querySelector('[data-a="above"]').onclick=()=>vmInsertShelf(mi,si,'above');
  menu.querySelector('[data-a="below"]').onclick=()=>vmInsertShelf(mi,si,'below');
  menu.querySelector('[data-a="remove"]').onclick=()=>vmRemoveShelf(mi,si);
}
function vmCrossMarkup(mi,si,s){
  if(!s.__crossTape)return'';
  const p=s.length?products.find(x=>x.id===s[0].productId):null;
  const label=p?.short||'PRODUTO';
  return `<div class="vm-cross-tape" data-mi="${mi}" data-si="${si}" title="Fita Cross"><div class="vm-cross-track"></div><div class="vm-cross-label">${label}<br>${p?money(p.price):'R$'}</div><div class="vm-cross-unit u1">${label}</div><div class="vm-cross-unit u2">${label}</div><div class="vm-cross-unit u3">${label}</div><button class="vm-cross-remove" title="Remover Fita Cross">×</button></div>`;
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
      const old=shelf.querySelector('.vm-cross-tape');if(old)old.remove();
      if(meta.__crossTape){shelf.insertAdjacentHTML('beforeend',vmCrossMarkup(mi,si,meta));const cross=shelf.querySelector('.vm-cross-tape');cross.querySelector('.vm-cross-remove').onclick=e=>{e.stopPropagation();vmToggleCross(mi,si,false)}}
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
  c.insertAdjacentHTML('beforeend',`<div class="property-group"><h4>Planejamento estrutural</h4><div class="vm-structure-summary"><div class="vm-structure-card"><span>Módulos</span><strong>${state.modules.length}</strong></div><div class="vm-structure-card"><span>Gancheiras</span><strong>${hooks}</strong></div><div class="vm-structure-card"><span>Fitas Cross</span><strong>${cross}</strong></div><div class="vm-structure-card"><span>Base visual</span><strong>v0.9</strong></div></div><div class="vm-structure-note">Use ⋮ no cabeçalho do módulo para ações gerais e ⋮ em cada nível para alterar somente aquela prateleira/gancheira ou inserir Fita Cross.</div></div>`);
};

renderAll();renderProperties();
