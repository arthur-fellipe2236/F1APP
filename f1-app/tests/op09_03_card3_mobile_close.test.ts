import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"

test("OP-09.03 [1] DialogContent aplica limite de altura dinamico (100dvh/safe-area), z-[60] e botao de fechar acessivel >= 44px no mobile", () => {
  const dialogSrc = fs.readFileSync(
    new URL("../src/components/ui/dialog.tsx", import.meta.url),
    "utf-8",
  )

  assert.ok(
    dialogSrc.includes("z-[60]"),
    "DialogOverlay e DialogContent devem usar z-[60] acima do header/radio-player (z-50)",
  )
  assert.ok(
    dialogSrc.includes("max-h-[calc(100dvh-2rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))]"),
    "DialogContent deve limitar a altura máxima à viewport dinâmica respeitando safe-area",
  )
  assert.ok(
    dialogSrc.includes("min-h-11 min-w-11") && dialogSrc.includes("bg-black/75"),
    "Botão de fechar superior deve ter alvo mínimo de 44x44px no mobile e fundo de alto contraste",
  )
  assert.ok(
    dialogSrc.includes('aria-label="Fechar visualização"'),
    "Botão de fechar deve possuir aria-label em português",
  )
})

test("OP-09.03 [2] NewsCard possui estrutura flex-col com corpo rolavel, botao Fechar no rodape e sincronizacao com botao Voltar (popstate)", () => {
  const newsSrc = fs.readFileSync(
    new URL("../src/components/race-news-cards.tsx", import.meta.url),
    "utf-8",
  )

  assert.ok(
    newsSrc.includes('data-slot="dialog-body"') &&
      newsSrc.includes("overflow-y-auto") &&
      newsSrc.includes("overscroll-contain"),
    "Corpo do modal de notícia deve permitir rolagem interna isolada (overflow-y-auto overscroll-contain)",
  )
  assert.ok(
    newsSrc.includes('data-testid="news-modal-footer-close"') &&
      newsSrc.includes("Fechar"),
    "Rodapé do modal de notícia deve disponibilizar botão explícito 'Fechar'",
  )
  assert.ok(
    newsSrc.includes("window.history.pushState") &&
      newsSrc.includes('addEventListener("popstate"'),
    "NewsCard deve integrar com History API (pushState/popstate) para fechar ao acionar Voltar no celular",
  )
  assert.ok(
    newsSrc.includes("<DialogDescription"),
    "Modal deve incluir DialogDescription para acessibilidade Radix",
  )
})

test("OP-09.03 [3] index.html habilita viewport-fit=cover para suporte a safe-area em dispositivos moveis", () => {
  const indexHtml = fs.readFileSync(
    new URL("../index.html", import.meta.url),
    "utf-8",
  )
  assert.ok(
    indexHtml.includes("viewport-fit=cover"),
    "meta viewport deve conter viewport-fit=cover",
  )
})
