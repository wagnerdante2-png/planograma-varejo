/* Planograma VM v0.8 — composição de alimentos alinhada à arte conceitual */

// Enriquece a face dos produtos com volume/peso e mantém o produto genérico.
shape = function(p){
  return `<div class="generic-product ${p.shape}" style="width:${p.width}px;height:${p.height}px"><span>${p.short}<small>${p.volume||''}</small></span></div>`;
};

function productByShort(short){return products.find(p=>p.sector===state.sector&&p.short===short) || currentProducts()[0];}
function fillShelf(shelf,spec){
  shelf.splice(0);
  spec.forEach(([short,count,promo=false])=>{
    const p=productByShort(short); if(!p)return;
    for(let i=0;i<count;i++) shelf.push({instanceId:uid(),productId:p.id,promo});
  });
}

const originalSeedSectorV08 = seedSector;
seedSector = function(){
  state.selected=null;
  if(state.sector!=='Alimentos'){
    originalSeedSectorV08();
    return;
  }
  // Mantém exatamente 5 níveis no preset de alimentos e usa blocos densos como a referência visual.
  state.modules.forEach(m=>{while(m.shelves.length<5)m.shelves.push([]);while(m.shelves.length>5)m.shelves.pop();});
  const layout=[
    [
      [['Óleo',10]],
      [['Arroz',5]],
      [['Feijão',8]],
      [['Macarrão',6]],
      [['Maionese',6]]
    ],
    [
      [['Óleo',5],['Açúcar',2]],
      [['Açúcar',5]],
      [['Café',6]],
      [['Leite',5,true]],
      [['Molho',6]]
    ],
    [
      [['Óleo',6],['Açúcar',2]],
      [['Farinha',5]],
      [['Feijão',4],['Café',3]],
      [['Macarrão',5]],
      [['Molho',7]]
    ]
  ];
  state.modules.forEach((m,mi)=>m.shelves.forEach((s,si)=>fillShelf(s,layout[mi][si])));
  renderAll();renderProperties();toast('Gôndola Alimentos carregada em composição VM v0.8');
};

// Atualiza o preset atual após a nova composição ser registrada.
seedSector();
