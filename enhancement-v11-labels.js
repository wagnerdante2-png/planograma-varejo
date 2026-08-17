/* v0.11-labels — aba técnica de etiquetas */
(function(){
  const tabs=document.querySelector('.tabs');
  if(!tabs||document.getElementById('labelTabBtn'))return;

  const btn=document.createElement('button');
  btn.className='tab';btn.id='labelTabBtn';btn.textContent='Etiquetas';
  tabs.insertBefore(btn,tabs.querySelector('.tab:last-child'));

  const view=document.createElement('section');
  view.id='labelWorkspace';view.className='label-workspace';
  view.innerHTML=`<div class="label-shell">
    <div class="label-page-head"><div><small>PADRÃO DE PRECIFICAÇÃO</small><h1>Anatomia da etiqueta de gôndola</h1><p>Visualização técnica dos campos, hierarquia de informação e leitura operacional da etiqueta.</p></div><div class="label-head-actions"><button id="labelGuidesBtn" class="active">Guias técnicas</button><button id="labelResetBtn">Restaurar exemplo</button></div></div>
    <div class="label-layout">
      <aside class="label-side"><h3>Configuração da etiqueta</h3>
        <div class="label-control"><label>Produto de referência</label><select id="labelProductSelect"></select></div>
        <div class="label-control"><label>Tipo de etiqueta</label><div class="label-type-row"><button id="whiteLabelBtn" class="label-type-btn active">Branca padrão</button><button id="pinkLabelBtn" class="label-type-btn pink">Rosa promoção</button></div></div>
        <div class="label-control"><label>Código ERP</label><input id="labelErpInput" value="48252"></div>
        <div class="label-control"><label>Código de barras</label><input id="labelBarcodeInput" value="7895115544455"></div>
        <div class="label-control"><label>Data de emissão</label><input id="labelDateInput" value="01/01/2026"></div>
        <div class="label-note">Esta aba é um visualizador técnico. A etiqueta continua vinculada ao produto e às regras de posicionamento do planograma.</div>
      </aside>
      <main class="label-main"><div class="label-section-bar">● &nbsp; Componentes Etiqueta Padrão (Branca)</div>
        <div class="label-stage"><div id="labelDiagram" class="label-diagram">
          <div class="erp-bubble">Cód.: <span id="bubbleErp">48252</span></div>
          <div class="callout desc">Descrição Completa do Produto</div><div class="callout erp">Código ERP</div><div class="callout brand">Fornecedor / Marca</div><div class="callout barcode">Código de Barras</div><div class="callout issue">Data de Emissão</div><div class="callout currency">Moeda Corrente</div><div class="callout price">Preço Vigente</div><div class="callout unit">Unidade de medida</div><div class="callout classification">Classificação Mercadológica</div>
          <div id="shelfLabelPreview" class="shelf-label-preview"><div class="label-promo-flag">PROMOÇÃO</div><div id="labelDesc" class="label-desc">GARRAFA FIRENZE MINI 250ML BR</div><div class="label-code-line">+ Código: <span id="labelErp">48252</span><br>+ INVICTA</div><div id="labelBrand" class="label-brand">MARCA GENÉRICA</div><div class="label-barcode"></div><div id="labelBarcode" class="label-barcode-code">7895115544455</div><div class="label-price-currency">R$</div><div id="labelPrice" class="label-price">29,99</div><div id="labelUnit" class="label-unit">UN</div><div id="labelClass" class="label-class">COZINHA / SERVIR</div><div id="labelIssue" class="label-issue">Emissão: 01/01/2026</div></div>
        </div></div>
        <div class="label-field-map"><div class="label-map-card"><span>Identificação</span><strong>Descrição + ERP + Marca</strong></div><div class="label-map-card"><span>Venda</span><strong>Preço + unidade + moeda</strong></div><div class="label-map-card"><span>Rastreabilidade</span><strong>Código de barras + emissão + classificação</strong></div></div>
      </main>
    </div></div>`;
  document.body.appendChild(view);

  const app=document.querySelector('.app');
  const allTabs=[...document.querySelectorAll('.tabs .tab')];
  function openLabels(){allTabs.forEach(t=>t.classList.remove('active'));btn.classList.add('active');app.classList.add('vm-hidden');view.classList.add('active');populateProducts();syncLabel();}
  function closeLabels(tab){view.classList.remove('active');app.classList.remove('vm-hidden');allTabs.forEach(t=>t.classList.remove('active'));tab.classList.add('active');}
  btn.onclick=openLabels;
  allTabs.filter(t=>t!==btn).forEach(t=>t.addEventListener('click',()=>closeLabels(t)));

  function productOptions(){const sectorItems=products.filter(p=>p.sector===state.sector);return sectorItems.length?sectorItems:products.slice(0,10)}
  function populateProducts(){const s=document.getElementById('labelProductSelect');const prev=s.value;s.innerHTML=productOptions().map(p=>`<option value="${p.id}">${p.name} • ${p.brand}</option>`).join('');if(prev&&products.some(p=>p.id===prev))s.value=prev;}
  function selectedProduct(){return products.find(p=>p.id===document.getElementById('labelProductSelect').value)||productOptions()[0]}
  function unitFromVolume(v){if(!v)return'UN';const m=String(v).match(/(kg|g|ml|l|un|pc|m)$/i);return m?m[1].toUpperCase():'UN'}
  function syncLabel(){const p=selectedProduct();if(!p)return;document.getElementById('labelDesc').textContent=p.name.toUpperCase();document.getElementById('labelBrand').textContent=p.brand.toUpperCase();document.getElementById('labelPrice').textContent=p.price.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});document.getElementById('labelUnit').textContent=unitFromVolume(p.volume);document.getElementById('labelClass').textContent=p.sector.toUpperCase();const erp=document.getElementById('labelErpInput').value||'—';document.getElementById('labelErp').textContent=erp;document.getElementById('bubbleErp').textContent=erp;document.getElementById('labelBarcode').textContent=document.getElementById('labelBarcodeInput').value||'—';document.getElementById('labelIssue').textContent='Emissão: '+(document.getElementById('labelDateInput').value||'—');}

  ['labelProductSelect','labelErpInput','labelBarcodeInput','labelDateInput'].forEach(id=>document.getElementById(id).addEventListener('input',syncLabel));
  document.getElementById('whiteLabelBtn').onclick=()=>{document.getElementById('shelfLabelPreview').classList.remove('promo');document.getElementById('whiteLabelBtn').classList.add('active');document.getElementById('pinkLabelBtn').classList.remove('active');document.querySelector('.label-section-bar').textContent='●   Componentes Etiqueta Padrão (Branca)'};
  document.getElementById('pinkLabelBtn').onclick=()=>{document.getElementById('shelfLabelPreview').classList.add('promo');document.getElementById('pinkLabelBtn').classList.add('active');document.getElementById('whiteLabelBtn').classList.remove('active');document.querySelector('.label-section-bar').textContent='●   Componentes Etiqueta Promocional (Rosa)'};
  document.getElementById('labelGuidesBtn').onclick=e=>{const d=document.getElementById('labelDiagram');d.classList.toggle('hide-guides');e.currentTarget.classList.toggle('active');d.querySelectorAll('.callout,.erp-bubble').forEach(x=>x.style.display=d.classList.contains('hide-guides')?'none':'')};
  document.getElementById('labelResetBtn').onclick=()=>{document.getElementById('labelErpInput').value='48252';document.getElementById('labelBarcodeInput').value='7895115544455';document.getElementById('labelDateInput').value='01/01/2026';document.getElementById('whiteLabelBtn').click();populateProducts();syncLabel()};
})();
