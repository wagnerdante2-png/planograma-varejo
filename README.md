# Planograma Varejo • MVP

MVP visual para criação, publicação e auditoria de planogramas de gôndola.

## O que já existe

- Editor de gôndola com 3 módulos e 5 prateleiras por módulo.
- Catálogo de produtos genéricos com silhuetas de garrafa, lata, pacote, caixa e pote.
- Arrasta e solta do catálogo para a gôndola e entre prateleiras.
- Estratégias demonstrativas: manual, agrupamento por marca, preço, volume e auto-planejamento.
- Presets de refrigerantes, salgadinhos e mix de conveniência.
- Etiqueta branca padrão e etiqueta rosa promocional.
- Perfil porta-preços e bandejas em laranja.
- Cartazes A3, A4, A5, A6 e A7 com inclusão por módulo.
- Ficha modal do produto com marca, preço, volume, SKU e posição.
- KPIs de frentes, SKUs, ocupação e conformidade.
- Tela de auditoria regional com score por loja.
- Tela de padrões e regras operacionais.
- Conceito de visão computacional/IA para comparação futura entre foto real e layout publicado.
- Salvamento local de rascunho no navegador.

## Executar no Codespaces

Como o MVP é estático, no terminal execute:

```bash
python3 -m http.server 5173
```

Depois abra a porta **5173** na aba **Portas** do Codespaces.

## Estrutura

- `index.html` — interface principal.
- `styles.css` — identidade visual, componentes e gôndola.
- `app.js` — dados mock, editor, presets, auditoria e interações.

> Protótipo sem back-end. Dados de ERP, cadastro, preço, vendas, estoque, auditoria fotográfica e IA são pontos de integração futura.