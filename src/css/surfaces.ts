/**
 * One material recipe for the content-bearing shell surfaces.
 *
 * 2026-11-14 owner：「我希望质感可以应用到全局，不只是对话框，还要包括设置」，
 * 随后又补一句：「我想要这些小弹窗也应用相同的质感」（会话统计 / 模型选择）。
 *
 * ## 两类容器，必须分开处理
 *
 * ① HOSTS —— 有自己内容层的容器（侧栏 / 输入卡 / 设置面板）。
 *    用 `${scope()}` + `::before`（absolute, z-index:-1）那套配方，
 *    会强制 `position: relative` 并清空自身背景，把观感交给伪元素。
 *
 * ② POPUP_SHELLS —— 浮层外壳，只该改「长什么样」（背景/模糊），
 *    **绝不能碰 position**。它们本来就参与宿主的浮层定位，
 *    一旦被改成 relative 就会脱出定位上下文（实测弹窗被推到 y=1212，视口外）。
 *
 * `Class_material` 是宿主写死的纯装饰层（aria-hidden、height:0、inset:0），
 * 它同样只接受背景覆盖。
 */
const ROOT = 'html body[data-bloom-variant]:is([data-bloom-glass],:not([data-bloom-glass])):is([data-ds-dark-theme],:not([data-ds-dark-theme]))'

/**
 * 真正的弹出容器：宿主浮层壳 / 菜单 / 选择器。
 * ⚠️ `[class*="_surface_"]` 不能裸用：主界面容器
 * `<div class="_surface_123xe_127" data-dockkit-surface="true">` 也带这个片段，
 * 裸匹配会把整块主区域涂成实色（2026-11-14 实测：右侧出现大灰板）。
 */
const POPUP_SHELLS = [
  '[class*="_surface_"]:not([data-dockkit-surface])',
  '[class*="_menu"]:not([class*="_menuAnchor"])',
  '[class*="_selector"]',
  '[role="menu"]',
  '[role="listbox"]',
  '[role="tooltip"]',
  '[class*="_material_"]',
  /* 会话统计等"直接挂在 body 上"的浮层：由 src/dom.ts 的 watchPopups()
     运行时打上 data-bloom-popup（判据是「body 直接子元素 + 非 static 定位」，
     不依赖哈希类名）。见 dom.ts 里 POPUP_ATTR 上方的说明。 */
  '[data-bloom-popup="true"]',
  /* 会话条目悬浮预览卡（_card_l6gf9_9，宿主写死 rgb(44,44,46)）。 */
  '[class*="_exits_"] [class*="_card"]',
]

const HOSTS = [
  '[class*="_sidebarCol"]',
  'header[class*="_header"]',
  'div[class*="_composer"] div[class*="_card"]',
  '[class*="_composerSeat"] [class*="_dock"] > [class*="_bar"]',
  // 设置面板本体（DSH 的 <div class="AnXs9G_panel">）—— 材质只由这一层承担。
  //
  // ⚠️ 2026-11-14（owner 实拍「这个条纹框怎么修复？」）：
  // 这里曾经还有一条 [class*="_overlay"] [class*="_card"]，想给面板内的卡片
  // 也上材质。后果是设置面板里**所有带 _card 前缀的元素**都被命中 ——
  // Agent 预设页实测 37 个：cardMain / cardHead / cardIdentity / cardName /
  // cardId / cardDesc / cardFoot / cardHelp / cardActive ……
  // 每个都多长出一层 `::before`（背景渐变 + 1px 描边 + 圆角），
  // 层层嵌套叠加，就渲染成屏幕上那一堆"条纹空心框"。
  //
  // 结论：设置面板内部保持干净，**不要再给内层 _card 上材质**。
  // 面板本体已经有材质底，内部卡片本来就该是透明的。
  '[class*="_overlay"] > [class*="_panel"]',
]
const scope = (suffix = '') => HOSTS.map(selector => `${ROOT} ${selector}${suffix}`).join(',\n')
const grain = (light: boolean) => {
  const color = light ? '0' : '1'
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 ' + color + ' 0 0 0 0 ' + color + ' 0 0 0 0 ' + color + ' 0 0 0 .05 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>'
  return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")'
}

export const SURFACES_CSS = `
${ROOT} {
  /* auto（body 上没有 data-bloom-glass）的默认材质 = 毛玻璃。
     ⚠️ 必须和 glass.ts 的 effectiveGlassMode() 保持一致 —— 后者 auto 也返回
     'frosted'（2026-11-14 owner：「液态玻璃这个太丑了」）。两处一起改，
     否则面板看起来是毛玻璃、JS 报告的却是液态。 */
  --bloom-surface-filter: blur(24px) saturate(1.15);
  --bloom-btn-filter: blur(20px) saturate(1.15);
  --bloom-surface-fill: color-mix(in oklch, var(--dsw-alias-bg-layer-1, #fff) 58%, transparent);
  --bloom-surface-edge: inset 0 0 0 1px color-mix(in oklch, var(--dsw-alias-label-primary, #222) 16%, transparent);
  --bloom-surface-image: none;
}
${ROOT}[data-ds-dark-theme] {
  --bloom-surface-image: radial-gradient(120% 85% at 12% -28%, rgba(255,255,255,.16), transparent 65%), linear-gradient(150deg, rgba(255,255,255,.06), transparent 32%, transparent 75%, rgba(255,255,255,.04));
}
${ROOT}[data-bloom-glass="frosted"] {
  --bloom-surface-filter: blur(24px) saturate(1.15);
  --bloom-btn-filter: blur(20px) saturate(1.15);
  --bloom-surface-fill: color-mix(in oklch, var(--dsw-alias-bg-layer-1, #fff) 58%, transparent);
  --bloom-surface-edge: inset 0 0 0 1px color-mix(in oklch, var(--dsw-alias-label-primary, #222) 16%, transparent);
  --bloom-surface-image: none;
}
${ROOT}[data-bloom-glass="liquid"] {
  --bloom-surface-filter: blur(3px) url("#dsh-bloom-liquid-lens") saturate(1.2);
  --bloom-btn-filter: blur(2px) url("#dsh-bloom-liquid-lens") saturate(1.15);
  --bloom-surface-fill: color-mix(in oklch, var(--dsw-alias-bg-layer-1, #fff) 25%, transparent);
  --bloom-surface-edge: inset 0 0 0 1px color-mix(in oklch, var(--dsw-alias-label-primary, #222) 12%, transparent);
  --bloom-surface-image: radial-gradient(120% 85% at 12% -28%, rgba(255,255,255,.28), transparent 65%), linear-gradient(150deg, rgba(255,255,255,.10), transparent 32%, transparent 75%, rgba(255,255,255,.06));
}
${ROOT}[data-bloom-glass="matte"] {
  --bloom-surface-filter: blur(12px) saturate(1.02);
  --bloom-btn-filter: blur(10px) saturate(1.02);
  --bloom-surface-fill: color-mix(in oklch, var(--dsw-alias-bg-layer-1, #fff) 48%, transparent);
  --bloom-surface-edge: inset 0 0 0 1px color-mix(in oklch, var(--dsw-alias-label-primary, #222) 8%, transparent);
  --bloom-surface-image: ${grain(true)};
}
${ROOT}[data-bloom-glass="matte"][data-ds-dark-theme] { --bloom-surface-image: ${grain(false)}; }
${scope()} {
  position: relative;
  z-index: 0;
  background: transparent;
  background-image: none;
  border-color: transparent;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
${scope('::before')} {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  border: 0;
  border-radius: inherit;
  background-color: var(--bloom-surface-fill);
  background-image: var(--bloom-surface-image);
  box-shadow: var(--bloom-surface-edge);
  backdrop-filter: var(--bloom-surface-filter);
  -webkit-backdrop-filter: var(--bloom-surface-filter);
}
${scope(':hover')},
${scope(':focus-within')} { border-color: transparent; box-shadow: none; }
${ROOT} div[class*="_bubble"] { backdrop-filter: none; -webkit-backdrop-filter: none; }

/* ── 弹窗：只上背景与模糊，绝不改 position / z-index ──────────────────
 * 浮层由宿主自己定位（position:absolute + 计算好的 top/left）。上面那套
 * scope() 配方会写 position: relative，对浮层是致命的 ——
 * 实测模型弹窗被推到 y=1212（视口外），用户根本点不开。
 *
 * 所以这里只做"涂材质"这一件事，并且用 !important 压过宿主写死的
 * rgba(48,49,54,.64) + blur(40px)。
 */
${POPUP_SHELLS.map(s => `${ROOT} ${s}`).join(',\n')} {
  background-color: var(--bloom-surface-fill) !important;
  background-image: var(--bloom-surface-image) !important;
  backdrop-filter: var(--bloom-surface-filter) !important;
  -webkit-backdrop-filter: var(--bloom-surface-filter) !important;
  border-color: transparent !important;
}
/* 装饰材质层不承重、不吃事件，除材质外不施加任何布局约束。 */
${ROOT} [class*="_material_"] { pointer-events: none; }

/* ── 输入区下方的状态条（轮次 / token / 缓存命中）─────────────────────
 * owner 2026-11-14：「下面变透明之后跟其它文字重叠在一起不好分辨文字了」。
 *
 * 那一条是 GRgSLq_dock 里的若干 hNGZaa_pill，宿主本来就没给底色
 * （实测 backgroundColor 全是 rgba(0,0,0,0)），它靠坐在 composerSeat 的
 * 实色坐垫上才看得清。而我把坐垫改成半透明后（那是为了让输入卡透气），
 * 这里就失去了靠山 —— 滚动的内容直接透上来，字压字。
 *
 * 修法：给这条 dock 自己补一层与材质一致的不透明底座 + 模糊，
 * 既恢复可读性，又保持和全局材质统一。这条是「承载信息」的横条，
 * 用它自己的一层底比给每颗 pill 各加一层更干净（pill 之间不会割裂）。
 */
${ROOT} [class*="_composerSeat"] [class*="_dock"] {
  border-radius: 12px;
  background-color: color-mix(in oklch, var(--dsw-alias-bg-layer-1, #101010) 78%, transparent) !important;
  backdrop-filter: blur(18px) saturate(1.2) !important;
  -webkit-backdrop-filter: blur(18px) saturate(1.2) !important;
}
/* 状态条内部再压一层，保证文字始终压在不透明底上（窄屏换行也不漏字）。 */
${ROOT} [class*="_composerSeat"] [class*="_dock"] [class*="_pill"] {
  background-color: color-mix(in oklch, var(--dsw-alias-bg-layer-1, #101010) 55%, transparent) !important;
  border-radius: 8px;
}

/* ── 弹窗内部：分组标题（吸顶标签）─────────────────────────────────────
 * owner 2026-11-14：「模型选择貌似还没有（质感）」。
 *
 * 弹窗本体（_surface_ + _material_）早就拿到材质了，实测两层都是
 * oklch(.../0.58) + blur(24px)。真正糊住观感的是**列表里的分组标题**：
 *   <div class="_heading_121p8_19">  bg rgba(48,49,54,.94)
 * 0.94 的不透明度等于一块实心板，把弹窗的磨砂底整片盖掉，
 * 于是整块看起来「有颜色、没磨砂」。
 *
 * 它必须保留一点底色（否则滚动时上一行文字会从标题下面穿过去），
 * 所以给一层与材质同源、但足够透的底 + 同款模糊：
 * 既盖得住滚动内容，又透得出弹窗的磨砂。
 */
${ROOT} [data-bloom-popup="true"] [class*="_heading_"],
${ROOT} [class*="_menu"]:not([class*="_menuAnchor"]) [class*="_heading_"] {
  background-color: color-mix(in oklch, var(--dsw-alias-bg-layer-1, #101010) 62%, transparent) !important;
  backdrop-filter: var(--bloom-surface-filter) !important;
  -webkit-backdrop-filter: var(--bloom-surface-filter) !important;
}
/* 选中项的高亮底也压薄一点，别把材质盖死（原值约 10% 覆盖的不透明混合）。 */
${ROOT} [class*="_menu"]:not([class*="_menuAnchor"]) [class*="_option"][data-active="true"],
${ROOT} [class*="_menu"]:not([class*="_menuAnchor"]) [class*="_option"][aria-selected="true"] {
  background-color: color-mix(in oklch, var(--bloom-accent, #6b8f71) 14%, transparent) !important;
}
/* ── 设置面板内的卡片：补上材质模糊 ────────────────────────────────────
 * tokens.ts 已把 --dsw-alias-settings-card-fill 绑到 --bloom-surface-fill，
 * 但这些卡片（实测 6 类：Agent 预设 .Wsg8iW_card、插件版本面板 .V7pFBG_versionPanel、
 * 余额卡 ._6qcDqa_balanceCard、模型行卡 .jrmgQW_rowCard、插件清单 .qgYWUG_card 等）
 * **宿主本来一个 backdrop-filter 都没有**。只改填充色会让它们变成半透明，
 * 背后内容透出来却没被模糊 —— 比原来更脏。所以这里补 backdrop-filter。
 *
 * ⚠️ 为什么不用 --dsw-alias-bg-module-platform 统一接管：
 *    实测该 token 被 **34 个类**使用，其中绝大多数是窄小的控件
 *    （.CDP_Dq_selector 语言下拉、.St8tea_keyBadge 快捷键徽章、
 *      ._7qxJPq_stepper 步进器、.Iwzhua_selected 主题色块 …），
 *    它们全都是不透明小色块、且没有 backdrop-filter。
 *    绑定材质会把下拉框和徽章一起变成毛玻璃，属于过度扩散 —— 不动它。
 *
 * ⚠️ 上一轮给 _overlay [class*="_card"] 加整套材质配方（含 ::before）时，
 *    命中面板里 37 个嵌套 _card 元素、叠出满屏条纹框。
 *    这次只加 backdrop-filter 这一条属性，没有新增任何伪元素/背景层，结构上不会重复叠加。
 */
/* ⚠️ 这里不能用 div[class*="_card"]：Agent 预设的卡片实际是 <li> 元素
   （实测 cardActive 的 tagName = LI），加了 div 前缀就恒不匹配 —— 
   上一版就是这么失效的。只写 class 片段，不限标签名。 */
${ROOT} [class*="_overlay"] [class*="_card"] {
  backdrop-filter: var(--bloom-surface-filter, none);
  -webkit-backdrop-filter: var(--bloom-surface-filter, none);
}
/* 设置面板里「被选中的卡片」用的是另一个 token
   （.Wsg8iW_cardActive { background: var(--dsw-alias-bg-module-platform) }），
   那个 token 被 34 个控件共用、不能全局改（见上）。
   这里只针对**面板内的卡片元素**局部换成材质填充。 */
${ROOT} [class*="_overlay"] [class*="_card"][class*="Active"],
${ROOT} [class*="_overlay"] [class*="_card"][class*="Selected"] {
  background-color: var(--bloom-surface-fill, var(--dsw-alias-bg-module-platform)) !important;
}

/* ── 交付物 / 文件卡片（.HOHHba_header）───────────────────────────────
 * owner 2026-11-14：「这个文件（dsh-bloom-theme-0.28.0.tgz）的样式好像也没有应用到材质」。
 *
 * 它的背景来自 --changes-fill → var(--dsw-static-neutral-850) = #212123（不透明深灰），
 * 已在 tokens.ts 里把 --changes-fill 绑到材质。但它**没有 backdrop-filter**
 * （实测 .HOHHba_header 的两条规则都没有），只改背景会变成半透明却不模糊。
 *
 * ⚠️ --changes-fill 实测只被这 1 个类使用，所以绑定它是安全的；
 *    对比 --dsw-alias-bg-module-platform 被 34 个控件共用、绝不能绑。
 *
 * ⚠️ 但只在 :root/body 上重定义 --changes-fill **不生效**：
 *    宿主在 .HOHHba_card 元素自身声明了 --changes-fill: var(--dsw-static-neutral-850)，
 *    元素级自定义属性优先级高于继承值（实测此时背景仍是 #212123）。
 *    必须在同一个元素上再覆盖一次。
 *
 * ⚠️ 还有 --changes-hover（2026-11-14 owner：「我聚焦文件的时候还是没有材质」）：
 *    .HOHHba_card 同时声明了 --changes-fill 与 --changes-hover 两个变量，
 *    宿主的交互规则是
 *        .HOHHba_header:hover:not(:disabled) { background: var(--changes-hover) }
 *        .HOHHba_header:focus-visible        { background: var(--changes-hover) }
 *    只绑 --changes-fill 的话，鼠标悬停/键盘聚焦一瞬间背景就切回
 *    --dsw-static-neutral-800（不透明 #2a2a2c），材质直接消失。
 *    两个变量必须一起绑 —— 只改一半等于没改。
 */
html body[data-bloom-variant] [class*="HOHHba_card"] {
  --changes-fill: var(--bloom-surface-fill, var(--dsw-static-neutral-850));
  /* hover/focus 态也用材质填充；不再用 neutral-800 那种「更亮一档的实色」 */
  --changes-hover: var(--bloom-surface-fill, var(--dsw-static-neutral-800));
}
${ROOT} [class*="HOHHba_header"] {
  backdrop-filter: var(--bloom-surface-filter, none);
  -webkit-backdrop-filter: var(--bloom-surface-filter, none);
  /* 这张卡片的 header 宿主没设 background-image，与任务条/输入卡
     的 --bloom-surface-image 渐变不一致；补上让质感统一。 */
  background-image: var(--bloom-surface-image, none);
}

/* ⚠️ 这一条不能丢：HOSTS 里每个容器都要清掉自身背景/阴影，
   把观感交给 ::before 那层绘制。删掉它会导致容器出现双重底色。 */
${scope()} {
  background-color: transparent;
  background-image: none;
}
/* [LES-36] */
${ROOT} [class*="_sidebarCol"],
${ROOT} [class*="_composerSeat"] {
  border-right-color: transparent;
  border-left-color: transparent;
}
/* [LES-36] */
html body[data-bloom-variant][data-ds-dark-theme] [class*="_frame"]:not([data-sidebar-drawer]) [class*="_sidebarCol"] {
  background: transparent;
}
@media (prefers-reduced-transparency: reduce) {
  ${ROOT}:not([data-bloom-glass]) {
    --bloom-surface-filter: none;
    --bloom-surface-fill: var(--dsw-alias-bg-layer-1, #fff);
    --bloom-surface-image: none;
  }
}
@media (prefers-contrast: more), (forced-colors: active), print {
  ${ROOT}:is([data-bloom-glass],:not([data-bloom-glass])):is([data-ds-dark-theme],:not([data-ds-dark-theme])) {
    --bloom-surface-filter: none;
    --bloom-surface-fill: var(--dsw-alias-bg-layer-1, #fff);
    --bloom-surface-image: none;
  }
}
`
