# Expositor Président · 3 versões — apresentação 75LAB

Deck para apresentar ao vivo à Lactalis / Président as três versões do novo expositor de parmesão da rede Festval: MDF, Aramado e Metalon, cada uma comparada ao expositor atual (aramado vermelho).

Publicado em https://projetos.75lab.com.br/president-expositor-versoes/

## Telas (10)

1. Capa com o parmesão (sem as versões)
2. O expositor atual, com 5 pontos fracos marcados na foto
3. O que as três versões têm em comum (anatomia com as zonas, sobre o Metalon)
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
- `assets/img/versoes/`: as versões enviadas pelo cliente (com as cotas 140 × 40 × 30 cm).
- `assets/img/loja/`: fotomontagens geradas no ChatGPT a partir da foto real do ponto na Festval (`atual.webp`) e de cada versão, alinhadas à foto atual por `tools/align.cjs`. Na do MDF, `tools/retoque-mdf.cjs` tira o pé de cima da base preta da gôndola vizinha, com o chão e a base vindos da montagem do Aramado, então a base ali não curva como na foto real. São simulações; produtos e embalagens são ilustrativos.
- `assets/img/ar/`: um QR por versão, apontando para a página de AR.
- Os originais (PNG) ficam fora do repositório (`.gitignore`).

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
