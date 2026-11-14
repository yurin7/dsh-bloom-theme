const ACC = 'var(--bloom-accent, #6b8f71)'
const FLOAT = '0 2px 4px -2px rgba(24,38,54,.14), 0 12px 28px -20px rgba(24,38,54,.22)'
const BLUR = 'blur(3px) url("#dsh-bloom-liquid-lens") saturate(1.2)'

export function liquidSurfaces(s: string, dark = false): string {
  const base = 'var(--dsw-alias-bg-layer-1, #17202b)'
  const PANE = dark
    ? `linear-gradient(145deg, color-mix(in oklch, ${base} 52%, transparent), color-mix(in oklch, ${base} 18%, transparent) 42%, color-mix(in oklch, ${base} 34%, transparent))`
    : 'linear-gradient(145deg, rgba(255,255,255,.46), rgba(255,255,255,.08) 42%, rgba(255,255,255,.22))'
  const MENU = dark
    ? `linear-gradient(145deg, color-mix(in oklch, ${base} 94%, transparent), color-mix(in oklch, ${base} 90%, transparent))`
    : 'linear-gradient(145deg, rgba(255,255,255,.90), rgba(255,255,255,.84))'
  const RIM = dark
    ? 'inset 0 1px 0 rgba(255,255,255,.24), inset 1px 0 0 rgba(255,255,255,.12), inset 0 -1px 0 rgba(0,0,0,.24), inset -1px 0 0 rgba(0,0,0,.12), inset 0 4px 5px -4px rgba(255,255,255,.3)'
    : 'inset 0 1px 0 rgba(255,255,255,.98), inset 1px 0 0 rgba(255,255,255,.72), inset 0 -1px 0 rgba(60,75,90,.10), inset -1px 0 0 rgba(60,75,90,.06), inset 0 4px 5px -4px #fff'
  const highlight = dark ? 'rgba(255,255,255,.20)' : 'rgba(255,255,255,.8)'
  const css = `
/* [LES-27] */
${s} header[class*="_header"],
${s} [class*="_sidebarCol"],
${s} div[class*="_composer"] div[class*="_card"] {
  position: relative;
  background: transparent;
  border-color: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: ${RIM}, ${FLOAT};
}
${s} header[class*="_header"]::before,
${s} [class*="_sidebarCol"]::before,
${s} div[class*="_composer"] div[class*="_card"]::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border: 0;
  border-radius: inherit;
  pointer-events: none;
  background: ${PANE};
  backdrop-filter: ${BLUR};
  -webkit-backdrop-filter: ${BLUR};
  box-shadow: none;
}
${s} [class*="_sidebarCol"],
${s} header[class*="_header"] {
  box-shadow: none;
}
${s} [class*="_centerCol"] {
  border-left-color: transparent;
}
${s} [class*="_sidebarCol"]::before,
${s} header[class*="_header"]::before {
  inset: 6px;
  border-radius: 14px;
  box-shadow: ${RIM}, ${FLOAT};
}
${s} [class*="_sidebarCol"] [class*="_root"]:has(> [class*="_regionArea"]),
${s} [class*="_sidebarCol"] :is([class*="_regionArea"], [class*="_listArea"], [class*="_treeBody"], [class*="_list"]) {
  background: none;
}
${s} [class*="_sidebarCol"] [class*="_fade"] {
  background: none;
}
${s} [class*="_sidebarCol"] [class*="_footerActions"] {
  box-shadow: none;
}

/* [LES-25] */
${s} header[class*="_header"]::before {
  bottom: 0;
}
${s} header[class*="_header"] > div[class*="_tabs"] {
  background: transparent;
  border-color: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: none;
}
${s} .dsh-bloom-menu {
  position: absolute;
  background: ${MENU};
  border-color: transparent;
  backdrop-filter: ${BLUR};
  -webkit-backdrop-filter: ${BLUR};
  box-shadow: ${RIM}, 0 12px 32px -14px rgba(24,38,54,.2);
}
${s} .dsh-bloom-head { box-shadow: none; }
/* ⚠️ 2026-11-14：排队条（_dock:has(>_preview)）已从这一组里摘出来单独处理。
   它原来跟着气泡/菜单一起吃 background: PANE + backdrop-filter: none，
   于是无论在哪种材质下都长成同一副液态玻璃面板 —— owner 要求
   「排队消息也应用一下材质」，而这条规则的特异性高于 component.ts 里那条，
   必须在这里一并改成读材质变量，否则永远被它盖住。 */
/* ⚠️ 2026-11-14：排队条（_dock:has(>_preview)）与代码块（.md-code-block）
   都已从这一组里摘出来单独处理。
   - 排队条：见下方独立规则（要跟随材质变量）。
   - 代码块：owner 实拍「代码块没有边框，只有圆角是白色的」。
     病因就是它原来吃这一组的 border-color: transparent + box-shadow: ${RIM}：
     RIM 里的第一段是 inset 0 1px 0 rgba(255,255,255,.16)（顶部一条白色内高光），
     而边框被设成透明 —— 于是剩下"白边的圆角、没有框"的怪样子。
     代码块是内容容器、不是浮层，不该套浮层那套高光。 */
${s} div[class*="_bubble"],
${s} [class*="_menu"]:not([class*="_menuAnchor"]),
${s} [class*="_selector"] {
  background: ${PANE};
  border-color: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: ${RIM};
}
/* 代码块：实色淡底 + 明确描边，不要白色内高光。 */
${s} .md-code-block {
  background: var(--bloom-surface-fill, ${PANE});
  background-image: var(--bloom-surface-image, none);
  border: 1px solid var(--bloom-hairline-strong, var(--dsw-alias-border-l1)) !important;
  backdrop-filter: var(--bloom-surface-filter, ${BLUR});
  -webkit-backdrop-filter: var(--bloom-surface-filter, ${BLUR});
  box-shadow: var(--bloom-shadow-sm, none) !important;
}
/* 排队条：跟随用户选的材质（与 surfaces.ts 同一套变量）。
   ⚠️ 真实结构是 _dock > _panel > (_panel::before 画背景)，_preview 只是行内文本。
   所以材质必须写到 _panel::before 上，并且 :has 不能用子组合器。 */
${s} div[class*="_dock"]:has([class*="_preview"]) > div[class*="_panel"]::before {
  background: var(--bloom-surface-fill, ${PANE});
  background-image: var(--bloom-surface-image, none);
  backdrop-filter: var(--bloom-surface-filter, ${BLUR});
  -webkit-backdrop-filter: var(--bloom-surface-filter, ${BLUR});
  box-shadow: ${RIM};
}

${s} [class*="_composerSeat"] [class*="_dock"] > [class*="_bar"],
${s} [class*="_composerSeat"] [class*="_dock"] > [class*="_preview"] {
  background: transparent;
  border-color: transparent;
  box-shadow: inset 0 1px 0 ${highlight};
}
${s} [class*="_composerSeat"] [class*="_dock"] > [class*="_bar"]::before,
${s} [class*="_composerSeat"] [class*="_dock"] > [class*="_preview"]::before {
  background: ${PANE};
  backdrop-filter: ${BLUR};
  -webkit-backdrop-filter: ${BLUR};
  box-shadow: none;
}

/* [LES-21] */
${s} div[class*="_composer"] div[class*="_card"]:hover,
${s} div[class*="_composer"] div[class*="_card"]:focus-within {
  border-color: transparent;
  box-shadow: ${RIM}, ${FLOAT};
}
${s} div[class*="_composer"] div[class*="_card"]:has(:focus-visible) {
  box-shadow: inset 0 0 0 1px color-mix(in oklch, ${ACC} 42%, #fff), ${FLOAT};
}

${s} .dsh-bloom-trigger,
${s} :is(.dsh-bloom-appearance__btn, .dsh-bloom-ambience__btn, .dsh-bloom-glass__choice)[data-active="true"] {
  background: ${dark ? PANE : 'linear-gradient(150deg, rgba(255,255,255,.8), rgba(255,255,255,.36))'};
  border-color: transparent;
  box-shadow: ${RIM}, 0 2px 6px -4px rgba(24,38,54,.2);
}
`
  return css
}
