# Expositor Président · 3 versões — apresentação 75LAB

Deck para apresentar ao vivo à Lactalis / Président as três versões do novo expositor de parmesão da rede Festval: MDF, Aramado e Metalon, cada uma comparada ao expositor atual (aramado vermelho).

Publicado em https://projetos.75lab.com.br/president-expositor-versoes/

## Telas (10)

1. Capa com o parmesão (sem as versões)
2. O expositor atual, com 5 pontos fracos marcados na foto
3. O que as três versões têm em comum (anatomia com as zonas, sobre o render do Metalon)
4. MDF
5. Aramado
6. Metalon
7. Na loja: antes × depois arrastável na foto real do ponto, com abas para as 3 versões
8. Realidade aumentada: 3D girável na tela e QR por versão para ver no celular em tamanho real
9. Comparativo lado a lado (estrutura, visual, notas de 1 a 5, indicação)
10. Próximos passos + contato da Vanessa Morelli

A tela **Investimento** (`#investimento`) está pronta e oculta com `data-draft`: abra com `?draft` para ver. Para publicar, troque os três "R$ —" pelos valores e remova `data-draft`.

## Navegação

← → ou espaço avançam · clique nas bordas da tela · M índice · F tela cheia · Home/End.
QA: `?static` (sem movimento), `?draft`, `?desktop`, `?ar=2.2`. Ferramentas em `tools/` (`shots.mjs`, `interact.mjs`).

## Imagens

- `assets/img/capa/`: parmesão da capa, gerado no ChatGPT, sem marca nem embalagem.
Desde 06/11/2026 todas as imagens das versões saem dos **mesmos modelos 3D da página de AR** (`pr01`, `pr04`, `pr03`), renderizados com o mesmo visualizador e a mesma luz. O que o cliente vê nas telas é o que ele vê no celular.

- `assets/img/capa/`: parmesão da capa, gerado no ChatGPT, sem marca nem embalagem.
- `assets/img/versoes/`: render de estúdio de cada modelo, com as cotas 140 × 40 × 30 cm desenhadas sobre os cantos reais da caixa (`tools/versoes-ar.mjs`).
- `assets/img/loja/`: `atual.webp` é a foto real do ponto na Festval. As montagens põem o render de cada modelo sobre essa foto, com a câmera encaixada no ponto do expositor atual (`tools/loja-ar.cjs`). A foto fica intacta: só o expositor antigo sai, e onde ele aparece fora do display novo o fundo é refeito com pedaços da própria foto (parede, gôndola de massas, Rap10, chão). Nada é desenhado por IA. A ferramenta confere que, fora do expositor antigo e do display novo, nenhum pixel mudou.
- `assets/img/ar/`: um QR por versão, apontando para a página de AR.
- Os originais (PNG) ficam fora do repositório (`.gitignore`).

Para refazer as imagens (Chrome instalado; `NODE_PATH` aponta para um `node_modules` com `sharp`):

```
node tools/render-ar.mjs tools/tomadas.json     # renders e posição dos cantos em tools/_qa/render/
node tools/versoes-ar.mjs                       # imagens das versões e miniaturas
node tools/loja-ar.cjs                          # montagens na loja
```

## Realidade aumentada

A tela usa o visualizador, o fundo e os modelos da página https://projetos.75lab.com.br/ar/lactalis-president-displays-parmesao/ (outro repositório, mesmo domínio): ajustes feitos lá aparecem aqui. Só carrega ao entrar na tela e precisa de internet. Correspondência entre versão e modelo, em `AR` no `deck.js`:

- MDF = `pr01` (Madeira Curva)
- Aramado = `pr04` (Aramado Preto)
- Metalon = `pr03` (Madeira e Dourado)

## Versão retirada

O ACM (champanhe com acrílico) saiu em 04/11/2026 a pedido da 75LAB. Os arquivos ficam no histórico do git (commit anterior) e os originais em `assets/img/src/` e `assets/img/loja/`. Da página de AR ele saiu no mesmo dia (`pr02`, Champanhe e Acrílico); os arquivos seguem no histórico do repositório `caiquebecker75/ar`.

## Pendências

- Valores de cada versão para a tela de investimento.
- As notas de 1 a 5 do comparativo são avaliação 75LAB entre as versões; revisar se o cliente pedir critérios diferentes.
