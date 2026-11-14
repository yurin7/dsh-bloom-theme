export const BACKGROUND_CSS = `
/* [LES-04][LES-10][LES-12][LES-17][LES-27]
 *
 * ⚠️ 2026-11-14 owner：「把下面那些背景和自动换色的功能全部去掉，这些设计太丑了」。
 * 氛围背景（对角漫染 / 漫天星辰 / 斜光流转 / 水彩晕染 …）整组下架。
 *
 * 做法是**把唯一的出口变量钉成 none**，而不是逐条删规则：
 *   --bloom-ambience 是所有背景图（html::after、composerSeat::before、
 *   壁纸层）共同的引用源，置空后全部自然失效，一处收口、不可能漏。
 * 下面各段仍保留定义（历史存档值照旧可读，diagnostics 也在读），
 * 但没有任何一处会再把它们画出来。要恢复时把下面这条改成注释即可。 */
body[data-bloom-variant] {
  /* !important 是必须的：下面历史配方里有 body[data-bloom-variant][data-ds-dark-theme]
     这类更高特异性的声明（属性多一个），不加 important 会被它们盖掉 ——
     实测暗色下仍然是四角渐变（2026-11-14）。 */
  --bloom-ambience: none !important;
  --bloom-fog-glaze: none !important;
  --bloom-fog-mask: none !important;
}
/* 粒子装饰层（星光 / 流星 / 萤火）同步关掉 —— 它们属于同一套背景设计。 */
body[data-bloom-variant] .dsh-bloom-sparkles,
body[data-bloom-variant] #dsh-bloom-starlight,
body[data-bloom-variant] #dsh-bloom-sparkles { display: none !important; }

/* ── 以下为历史氛围配方，已不再被引用（--bloom-ambience 恒为 none）───── */
/* The desktop host clears html[data-platform] body later in the cascade. */
html body[data-bloom-variant]:is([data-ds-dark-theme], :not([data-ds-dark-theme])) {
  background-attachment: fixed;
  background-image: var(--bloom-ambience);
}

/* Restore the four-corner colour distribution from the released visual reference. */
body[data-bloom-variant][data-ds-dark-theme] {
  --bloom-ambience:
    radial-gradient(1400px circle at 6% -4%, color-mix(in oklch, var(--bloom-accent, #6b8f71), transparent 80%), transparent 50%),
    radial-gradient(1100px circle at 100% 8%, color-mix(in oklch, var(--bloom-aurora-stream-2), transparent 50%), transparent 60%),
    radial-gradient(900px circle at 96% 100%, color-mix(in oklch, var(--bloom-aurora-stream-3), transparent 50%), transparent 62%),
    radial-gradient(1000px circle at 2% 96%, color-mix(in oklch, var(--bloom-aurora-stream-1), transparent 50%), transparent 60%);
}

body[data-bloom-variant]:not([data-ds-dark-theme]) {
  /* [LES-33] */
  --bloom-companion-3: var(--bloom-motion-3, var(--bloom-accent));
  --bloom-tint-1: color-mix(in oklch, var(--bloom-motion-1, var(--bloom-accent)) 22%, #fff);
  --bloom-tint-2: color-mix(in oklch, var(--bloom-motion-2, var(--bloom-accent)) 18%, #fff);
  --bloom-tint-3: color-mix(in oklch, var(--bloom-companion-3) 18%, #fff);
  --bloom-veil: linear-gradient(to bottom, transparent 0%, rgba(255,255,255,.05) 28%, rgba(255,255,255,.30) 58%, rgba(255,255,255,.72) 84%, #fff 100%);
  --bloom-fog-mask: url("#dsh-bloom-fog-stream");
  --bloom-fog-glaze: linear-gradient(rgba(255,255,255,.92), rgba(255,255,255,.92));
  --bloom-ambience:
    var(--bloom-veil),
    linear-gradient(125deg,
      var(--bloom-tint-1) 0%,
      var(--bloom-tint-2) 48%,
      var(--bloom-tint-3) 100%);
}
@supports (color: oklch(from red l c h)) {
  body[data-bloom-variant]:not([data-ds-dark-theme]) {
    --bloom-companion-3: color-mix(in oklch, var(--bloom-motion-3, var(--bloom-accent)) 50%, oklch(from var(--bloom-motion-1, var(--bloom-accent)) l c calc(h + 150)));
  }
}
body[data-bloom-variant]:not([data-ds-dark-theme])[data-bloom-ambience-light="wash"] {
  --bloom-fog-mask: url("#dsh-bloom-fog-wash");
  --bloom-veil: linear-gradient(to bottom, transparent 0%, rgba(255,255,255,.06) 30%, rgba(255,255,255,.34) 60%, rgba(255,255,255,.76) 86%, #fff 100%);
  --bloom-ambience:
    var(--bloom-veil),
    radial-gradient(96% 78% at 50% 6%, var(--bloom-tint-1), transparent 68%),
    radial-gradient(86% 70% at 6% 22%, var(--bloom-tint-2), transparent 70%),
    radial-gradient(86% 70% at 94% 26%, var(--bloom-tint-3), transparent 70%);
}

body[data-bloom-variant]:not([data-ds-dark-theme])[data-bloom-ambience-light="clear"] {
  --bloom-fog-mask: url("#dsh-bloom-fog-clear");
  --bloom-veil: linear-gradient(to bottom, transparent 0%, rgba(255,255,255,.10) 34%, rgba(255,255,255,.46) 66%, #fff 100%);
  --bloom-ambience:
    var(--bloom-veil),
    linear-gradient(180deg, var(--bloom-tint-1) 0%, var(--bloom-tint-2) 16%, var(--bloom-tint-3) 32%, rgba(255,255,255,0) 62%);
}
body[data-bloom-variant]:not([data-ds-dark-theme])[data-bloom-ambience-light="off"],
body[data-bloom-variant][data-ds-dark-theme][data-bloom-ambience-dark="off"] { --bloom-ambience: none; --bloom-fog-mask: none; --bloom-fog-glaze: none; }


body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  
  background-image: var(--bloom-ambience);
}
/* Dark colour is painted once on the body; the fixed seat repeats that same image. */
body[data-bloom-variant][data-ds-dark-theme]::before { background-image: none; }
body[data-bloom-variant]:not([data-ds-dark-theme]):not([data-bloom-ambience-light="off"])::after {
  content: '';
  display: block;
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image: var(--bloom-fog-glaze);
  -webkit-mask-image: var(--bloom-fog-mask);
  mask-image: var(--bloom-fog-mask);
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
}

body[data-bloom-variant] [class*="_root"] [class*="_composerSeat"] {
  background-image: none;
  /* Keep the fixed backdrop aligned to the viewport. */
  will-change: auto;
}
body[data-bloom-variant] [class*="_root"] [class*="_composerSeat"]::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  /* ⚠️ 这里原来是**不透明**的 var(--dsw-alias-bg-layer-1)（无 alpha），
     等于在输入卡背后糊了一块实色挡板。卡片自己的 backdrop-filter 只能模糊
     「背后能看见的东西」，背后是纯色就什么都采不到 —— 表现是毛玻璃/磨砂/
     液态三种材质看起来一样、而且完全不透（owner 2026-11-14 实拍「另一个
     对话就是毛玻璃而且貌似也不透」）。
     改成半透明后，卡片才能真正透出下面的氛围层与消息流。 */
  background-color: color-mix(in oklch, var(--dsw-alias-bg-layer-1, #101010) 62%, transparent);
  background-image: var(--bloom-ambience);
  background-attachment: fixed;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 56px);
  mask-image: linear-gradient(to bottom, transparent 0, #000 56px);
}


body[data-bloom-variant]:not([data-ds-dark-theme]) [class*="_root"] [class*="_composerSeat"]::before {
  background: rgba(255, 255, 255, .28);
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000);
  mask-image: linear-gradient(to bottom, transparent, #000);
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px);
}
@media (prefers-contrast: more), (forced-colors: active) {
  html body[data-bloom-variant]:is([data-ds-dark-theme],:not([data-ds-dark-theme])) [class*="_root"] [class*="_composerSeat"]::before {
    background: none;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    -webkit-mask-image: none;
    mask-image: none;
  }
}
@media (prefers-reduced-transparency: reduce) {
  html body[data-bloom-variant]:not([data-bloom-glass]):is([data-ds-dark-theme],:not([data-ds-dark-theme])) [class*="_root"] [class*="_composerSeat"]::before {
    background: none;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    -webkit-mask-image: none;
    mask-image: none;
  }
}
body[data-bloom-variant="aurora"]::after,
body[data-bloom-variant="cinnabar"]::after { display: none; }
@media (prefers-reduced-motion: reduce) {
  body[data-bloom-variant="aurora"]::after,
  body[data-bloom-variant="cinnabar"]::after { display: none; }
}
`
