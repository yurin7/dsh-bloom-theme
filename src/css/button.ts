export const BUTTON_CSS = `
/* ═══ composer 发送键 ═══════════════════════════════════════════════════
 *
 * ⚠️ 2026-11-14 owner 连提两次：「发送按钮也不应该是液态玻璃材质的……
 *   应该改成我对应设置的材质」，第一次只改 backdrop-filter 后仍然反馈
 *   「发送按钮没有变化」—— 因为**液态玻璃的观感根本不在滤镜上**。
 *
 * 这颗按钮的「液态感」由三层叠出来，滤镜只是最不起眼的一层：
 *
 *   ① 虹彩描边 —— ::before 的 conic-gradient（白→色→白→色→白 转一圈）。
 *      这是最能一眼认出「液态玻璃」的东西：一圈流动的彩色高光边。
 *   ② 高光气泡 —— background-image 里 3 层：左上椭圆纯白高光、
 *      右下彩色辉光、145° 半透明渐变。纯白高光是玻璃球的球面反光。
 *   ③ 多层内阴影 —— inset 上白下黑，模拟玻璃的厚度与折射。
 *
 * 所以材质必须同时接管这三层，否则「换成毛玻璃」只是把一层看不见的
 * 模糊半径改了，肉眼毫无区别。下面按 [data-bloom-glass] 分档：
 *
 *   liquid（用户显式选）  ①②③ 全开 —— 就是原来那套液态玻璃
 *   frosted（默认 / auto） ② 收敛为柔和单色渐变，① 换成中性细描边，
 *                         ③ 只留一层极浅的内高光 —— 哑光玻璃片
 *   matte（磨砂/亚克力）  ② 去掉高光、留纯色填充 + 纸感，① 无描边，
 *                         ③ 无内阴影 —— 一块磨砂塑料
 *
 * 未命中任何分档（属性缺席且 JS 没解析出来）时退回 liquid，与旧版一致。
 */

/* ── ① 基础尺寸与字形：所有材质共用 ─────────────────────────────────── */
body[data-bloom-variant] div[class*="_composer"] button[class*="_primary"] {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  padding: 0;
  box-sizing: border-box;
  transition: transform .16s var(--bloom-ease, ease), box-shadow .2s ease, background-color .2s ease;
}
body[data-bloom-variant] div[class*="_composer"] button[class*="_primary"]:disabled:not([data-sending]) { opacity: .68; }

/* ══ 液态玻璃（显式选择时才用）══════════════════════════════════════ */
body[data-bloom-variant][data-bloom-glass="liquid"]:not([data-ds-dark-theme]) div[class*="_composer"] button[class*="_primary"] {
  color: color-mix(in oklch, var(--bloom-accent, #666) 70%, #7b7b7b);
  background-color: transparent;
  background-image:
    radial-gradient(ellipse at 28% 13%, rgba(255,255,255,.98), rgba(255,255,255,.45) 28%, transparent 54%),
    radial-gradient(ellipse at 79% 82%, color-mix(in oklch, var(--bloom-motion-3, var(--bloom-accent)) 20%, transparent), transparent 64%),
    linear-gradient(145deg, color-mix(in oklch, var(--bloom-motion-1, var(--bloom-accent)) 7%, rgba(255,255,255,.92)), color-mix(in oklch, var(--bloom-motion-2, var(--bloom-accent)) 14%, rgba(255,255,255,.78)));
  -webkit-backdrop-filter: blur(2px) url("#dsh-bloom-liquid-lens") saturate(1.15);
  backdrop-filter: blur(2px) url("#dsh-bloom-liquid-lens") saturate(1.15);
  box-shadow:
    inset 0 1px 2px rgba(255,255,255,.98),
    inset 0 -2px 3px color-mix(in oklch, var(--bloom-motion-2, var(--bloom-accent)) 18%, transparent),
    0 7px 14px -6px color-mix(in oklch, var(--bloom-motion-1, var(--bloom-accent)) 26%, transparent),
    0 2px 4px rgba(50,50,50,.10);
}
body[data-bloom-variant][data-bloom-glass="liquid"][data-ds-dark-theme] div[class*="_composer"] button[class*="_primary"] {
  color: var(--dsw-alias-label-primary, #eee);
  background-color: transparent;
  background-image:
    radial-gradient(ellipse at 28% 17%, rgba(255,255,255,.26), transparent 62%),
    radial-gradient(ellipse at 79% 82%, color-mix(in oklch, var(--bloom-motion-3, var(--bloom-accent)) 16%, transparent), transparent 64%),
    linear-gradient(145deg, color-mix(in oklch, var(--dsw-alias-bg-layer-2, #343943) 88%, var(--bloom-motion-1)), color-mix(in oklch, var(--dsw-alias-bg-layer-1, #1b2028) 90%, var(--bloom-motion-2)));
  -webkit-backdrop-filter: blur(2px) url("#dsh-bloom-liquid-lens") saturate(1.15);
  backdrop-filter: blur(2px) url("#dsh-bloom-liquid-lens") saturate(1.15);
  box-shadow:
    inset 0 1px 1px rgba(255,255,255,.34),
    inset 0 -2px 3px rgba(0,0,0,.28),
    0 6px 12px -6px rgba(0,0,0,.35);
}
/* 虹彩描边（只有液态玻璃有）*/
@supports ((mask-composite: exclude) or (-webkit-mask-composite: xor)) {
  body[data-bloom-variant][data-bloom-glass="liquid"] div[class*="_composer"] button[class*="_primary"] { position: relative; }
  body[data-bloom-variant][data-bloom-glass="liquid"] div[class*="_composer"] button[class*="_primary"]::before {
    content: '';
    position: absolute;
    inset: 0;
    box-sizing: border-box;
    border-radius: inherit;
    padding: 1px;
    pointer-events: none;
    background: conic-gradient(from -40deg,
      rgba(255,255,255,.88),
      color-mix(in oklch, var(--bloom-motion-2, var(--bloom-accent)) 22%, rgba(255,255,255,.50)),
      rgba(255,255,255,.16),
      color-mix(in oklch, var(--bloom-motion-3, var(--bloom-accent)) 24%, rgba(255,255,255,.35)),
      rgba(255,255,255,.88));
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    mask-composite: exclude;
  }
}

/* ══ 毛玻璃（默认 / auto）：哑光玻璃片，无虹彩、无气泡高光 ═══════════
 * ⚠️ 字形色必须用 label-primary（浅色 oklch 25% / 深色 96%），
 *   **不能**用 --dsw-alias-button-primary-dimmed。后者在 Bloom 里定义为
 *   bgL / bgD（见 tokens.ts:292 / 376），是「填在深色强调块上的前景色」——
 *   浅色档它是近白 96%。而毛玻璃底本身是 bg-layer-2 78%（浅色 ~94%），
 *   近白字压近白底 = 1.05:1，箭头直接看不见（owner 2026-11-14 实拍）。
 *   label-primary 是正文字色，与底色天然成对，明暗都过 AA。 */
body[data-bloom-variant][data-bloom-glass="frosted"]:not([data-ds-dark-theme]) div[class*="_composer"] button[class*="_primary"] {
  color: var(--dsw-alias-label-primary, #222);
  background-color: color-mix(in oklch, var(--dsw-alias-bg-layer-2, #fff) 78%, transparent);
  background-image: none;
  -webkit-backdrop-filter: blur(20px) saturate(1.15);
  backdrop-filter: blur(20px) saturate(1.15);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.72), 0 1px 3px rgba(50,50,50,.10);
}
body[data-bloom-variant][data-bloom-glass="frosted"][data-ds-dark-theme] div[class*="_composer"] button[class*="_primary"] {
  color: var(--dsw-alias-label-primary, #eee);
  background-color: color-mix(in oklch, var(--dsw-alias-bg-layer-2, #343943) 88%, transparent);
  background-image: none;
  -webkit-backdrop-filter: blur(20px) saturate(1.15);
  backdrop-filter: blur(20px) saturate(1.15);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.16), 0 1px 3px rgba(0,0,0,.30);
}

/* ══ 磨砂 / 亚克力：纯色实体块，纸感，无任何玻璃高光 ═════════════════ */
body[data-bloom-variant][data-bloom-glass="matte"]:not([data-ds-dark-theme]) div[class*="_composer"] button[class*="_primary"] {
  color: var(--dsw-alias-label-primary, #222);
  background-color: color-mix(in oklch, var(--dsw-alias-bg-layer-1, #fff) 96%, var(--bloom-accent, #6b8f71));
  background-image: none;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
  box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--dsw-alias-label-primary, #222) 10%, transparent);
}
body[data-bloom-variant][data-bloom-glass="matte"][data-ds-dark-theme] div[class*="_composer"] button[class*="_primary"] {
  color: var(--dsw-alias-label-primary, #eee);
  background-color: color-mix(in oklch, var(--dsw-alias-bg-layer-2, #343943) 92%, var(--bloom-accent, #6b8f71));
  background-image: none;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
  box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--dsw-alias-label-primary, #eee) 14%, transparent);
}

/* ══ auto（属性缺席）= 毛玻璃，与 glass.ts / surfaces.ts 保持一致 ═══════
 * CSS 不能只靠「不是 liquid / 不是 matte」来兜底 —— 那样一旦属性缺席，
 * 命中的是液态那套，又回到「默认就是液态」。所以这里显式钉一份。
 * 降低透明度 / 高对比的无障碍降级仍由下面的媒体查询接管。
 * 字形色同样用 label-primary（理由同上面的毛玻璃段）。 */
body[data-bloom-variant]:not([data-bloom-glass="liquid"]):not([data-bloom-glass="matte"]):not([data-bloom-glass="solid"]):not([data-ds-dark-theme]) div[class*="_composer"] button[class*="_primary"] {
  color: var(--dsw-alias-label-primary, #222);
  background-color: color-mix(in oklch, var(--dsw-alias-bg-layer-2, #fff) 78%, transparent);
  background-image: none;
  -webkit-backdrop-filter: blur(20px) saturate(1.15);
  backdrop-filter: blur(20px) saturate(1.15);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.72), 0 1px 3px rgba(50,50,50,.10);
}
body[data-bloom-variant]:not([data-bloom-glass="liquid"]):not([data-bloom-glass="matte"]):not([data-bloom-glass="solid"])[data-ds-dark-theme] div[class*="_composer"] button[class*="_primary"] {
  color: var(--dsw-alias-label-primary, #eee);
  background-color: color-mix(in oklch, var(--dsw-alias-bg-layer-2, #343943) 88%, transparent);
  background-image: none;
  -webkit-backdrop-filter: blur(20px) saturate(1.15);
  backdrop-filter: blur(20px) saturate(1.15);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.16), 0 1px 3px rgba(0,0,0,.30);
}

/* ══ 无障碍降级：一律实体块，去掉全部玻璃效果 ═══════════════════════ */
@media (prefers-reduced-transparency: reduce) {
  html body[data-bloom-variant] div[class*="_composer"] button[class*="_primary"]::before { display: none !important; }
  html body[data-bloom-variant] div[class*="_composer"] button[class*="_primary"] {
    background: var(--dsw-alias-bg-layer-1, #fff) !important;
    background-image: none !important;
    color: var(--dsw-alias-label-primary, #222) !important;
    border: 1px solid currentColor;
    box-shadow: none !important;
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
  }
}
@media (prefers-contrast: more), (forced-colors: active) {
  html body[data-bloom-variant] div[class*="_composer"] button[class*="_primary"]::before { display: none !important; }
  html body[data-bloom-variant] div[class*="_composer"] button[class*="_primary"] {
    background: var(--dsw-alias-bg-layer-1, Canvas) !important;
    background-image: none !important;
    color: var(--dsw-alias-label-primary, CanvasText) !important;
    border: 1px solid currentColor;
    box-shadow: none !important;
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
  }
}
`
