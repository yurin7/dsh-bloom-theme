/**
 * DOM 工具层：样式注入、变体读写、宿主查找、<think> 标签收拾。
 *
 * injectCSS 用 data-plugin-css 属性做幂等标记 —— DSH 的 cordis materialize
 * 可能多次调用 apply，重复注入会让同一份 CSS 叠好几份。
 */
import { PLUGIN_ID, STORAGE_KEY } from './meta.js'
import { VARIANTS } from './palette.js'


/**
 * 收拾裸露的 <think> 标签。
 *
 * ⚠️ 这是 workaround，不是根治。根因在 LLM 适配层：某些模型（如 MiniMax-M3）把思考
 * 内容内联在 content 里输出 <think>…</think>，而 DSH 的推理解析没识别它，于是整段
 * 当普通 markdown 渲染，标签就露在正文里。正解是在 provider 适配层解析成 reasoning
 * 字段，交给 DSH 原生的 ReasoningRow 渲染。
 *
 * 之所以敢在主题层做：实测这些标签**各自独占一个段落元素**（56/56，无一混在正文中），
 * 所以只标记、不改任何文本内容 —— 隐藏它们不会丢字。
 * 只加 data-* 属性，不动 DOM 结构，React 重渲染最多是属性丢失，observer 会补回来。
 */
export const THINK_OPEN = '<think>'

export const THINK_CLOSE = '</think>'

/**
 * 收拾裸露的 <think> 标签。
 *
 * ⚠️ 性能（2026-11-14 owner：「打开右边侧边栏之后动效卡顿」）：
 * 这个函数对 body 做**全量** TreeWalker，每次 DOM 变动后 300ms 跑一次。
 * 右侧栏展开文件列表 / 渲染大文件时，文本节点数量会翻几倍，
 * 而旧实现对每个文本节点都做 `trim()` + `parentElement` + `dataset` 三个操作，
 * 等于每帧都在扫几十万个字符 —— 动画自然掉帧。
 *
 * 现在三道闸：
 *   ① 根节点收窄：只在**对话区域**里找。`<think>` 只可能出现在模型输出的
 *      消息正文里，而侧栏 / 右侧栏 / 文件预览都不可能。找不到对话容器时
 *      退回 body（宁慢不漏）。
 *   ② 长度预筛：`<think>` / `</think>` 都是 7~8 字符，节点值长度不在
 *      6~10 的直接跳过，**不 trim 不出 parentElement / closest**
 *      （省掉每节点最贵的两项）。
 *   ③ 子树过滤：Bloom 自己的浮层与右侧栏整块 reject，连进都不进。
 * 判据只在命中长度窗口后才用，所以漏判风险为零。
 */
const THINK_SCAN_ROOT = [
  '[class*="_scrollBody"]',      // 消息流主体
  '[class*="_conversation"]',
  '[class*="_centerCol"]',
].join(', ')

export function markThinkTags() {
  if (!document.body) return
  // ① 收窄扫描根
  const root = (document.querySelector(THINK_SCAN_ROOT) as HTMLElement | null) ?? document.body
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    // ③ 子树过滤：这些容器里的文本不可能是模型思考标记
    acceptNode(node) {
      const p = node.parentElement
      if (!p) return NodeFilter.FILTER_REJECT
      if (p.closest('.dsh-bloom-overlay, .dsh-bloom-switcher, [class*="_rightbar"], [class*="_preview"]')) {
        return NodeFilter.FILTER_REJECT
      }
      return NodeFilter.FILTER_ACCEPT
    },
  })
  const tags = []
  let n
  while ((n = walker.nextNode())) {
    const raw = n.nodeValue
    // ① 廉价预筛：长度对不上就直接跳过，不做 trim / parentElement
    if (!raw || raw.length < 6 || raw.length > 10) continue
    const t = raw.trim()
    if (t !== THINK_OPEN && t !== THINK_CLOSE) continue
    const el = n.parentElement
    if (!el || el.dataset.bloomThink) continue
    el.dataset.bloomThink = t === THINK_OPEN ? 'open' : 'close'
    tags.push(el)
  }
  if (!tags.length) return
  // 配对：把开闭标签之间的兄弟节点标成思考内容（降权显示，不隐藏 —— 信息不丢）
  for (const el of tags) {
    if (el.dataset.bloomThink !== 'open') continue
    for (let sib = el.nextElementSibling; sib; sib = sib.nextElementSibling) {
      if (sib.dataset.bloomThink === 'close') break
      if (sib.dataset.bloomThink === 'open') break // 未配对，停手
      sib.dataset.bloomThinkBody = 'true'
    }
  }
}

export function watchThinkTags() {
  if (window.__dshBloomThinkObserver__) return
  let timer: ReturnType<typeof setTimeout> | undefined
  let disposed = false
  const schedule = () => {
    if (disposed) return
    // 流式输出会高频触发，节流到 300ms
    if (timer) return
    timer = setTimeout(() => {
      timer = undefined
      if (!disposed) { markThinkTags(); markLiveTurn() }
    }, 300)
  }
  const obs = new MutationObserver(schedule)
  // ⚠️ 2026-11-14：这里原来是 `subtree + characterData` 全量监听，右侧栏展开
  // 文件列表时会灌进成百上千条记录，回调被反复唤醒，与动画抢主线程。
  // 现在：
  //   · 去掉 characterData —— 思考标记是独立段落节点，靠 childList 就能看到；
  //     流式输出也主要走 childList（文本追加会表现为节点插入/替换）。
  //   · 保留 subtree，但把真正的重活（全量 TreeWalker）留在 300ms 节流里，
  //     且扫描根已收窄到对话容器（见 markThinkTags）。
  obs.observe(document.body, { childList: true, subtree: true })
  window.__dshBloomThinkObserver__ = obs
  window.__dshBloomThinkOff__ = () => {
    disposed = true
    obs.disconnect()
    if (timer !== undefined) clearTimeout(timer)
    if (liveTurnTimer !== undefined) clearTimeout(liveTurnTimer)
    liveTurnTimer = undefined
    lastRowText = new WeakMap()
    window.__dshBloomThinkObserver__ = undefined
    window.__dshBloomThinkOff__ = undefined
  }
  markThinkTags()
  markLiveTurn()
}

/**
 * 标出「正在跑」的那一行轮次状态 —— "深度求索中，用时 1分30秒"。
 *
 * ## 为什么需要 JS 标
 *
 * 这行字现在由 DSH 渲染成 `<button data-turn-process>` 里的一个 label，
 * **跑完和跑着是同一个元素**：跑完是 "用时 7分11秒"，跑着是 "深度求索中，用时
 * 1分30秒"，两者在 DOM 上只差文本内容，没有状态属性可挂。
 * （实测三种状态：跑完折叠 `data-open`+disabled、跑完展开 `aria-expanded`、
 * 正在跑 `data-open`+disabled —— disabled / data-open 都不能当「在跑」的判据。）
 *
 * 唯一稳定的信号是**文本在变**：计时每 ~1s 跳一次，跑完就不动了。
 * 所以：同一个 row 的文本相比上一次扫描变了 → 标上；2.5s 内没等到下一次变化
 * → 摘掉。切会话时新 row 第一次被看到不算「变过」（WeakMap 里没有旧值），
 * 所以切过去不会先闪一下再停。
 *
 * ## 为什么复用 watchThinkTags 的 observer
 *
 * 两者要的都是「DOM 变了就重扫一遍」，而计时文本本身就是 characterData 变更，
 * 已经在那个 observer 的射程里。再挂一个 observer 只是把同样的事做两遍。
 * 代价是函数名比做的事多一点 —— 已在调用处注明。
 */
const LIVE_TURN_ATTR = 'data-bloom-live-turn'
let lastRowText = new WeakMap<Element, string>()
let liveTurnTimer: ReturnType<typeof setTimeout> | undefined

export function markLiveTurn() {
  const rows = document.querySelectorAll('[data-turn-process]')
  if (!rows.length) return
  // DOM 顺序就是时间顺序，最后一个 = 当前这一轮
  const row = rows[rows.length - 1]
  const label = row.querySelector('[class*="_label"]') || row
  const text = (label.textContent || '').trim()
  if (!text) return
  const prev = lastRowText.get(row)
  lastRowText.set(row, text)
  if (prev === undefined || text === prev) return      // 初次见到 / 没变 → 不算在跑
  row.setAttribute(LIVE_TURN_ATTR, '')
  if (liveTurnTimer) clearTimeout(liveTurnTimer)
  liveTurnTimer = setTimeout(() => {
    if (lastRowText.get(row) === text) row.removeAttribute(LIVE_TURN_ATTR)
  }, 2500)
}

/* v0.5.0：氛围层（壁纸 / 玻璃开关 / 主题包）整体移除，玻璃改为默认常开。 */

export function readVariant() {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    return VARIANTS.includes(v) ? v : 'mist'
  } catch { return 'mist' }
}

export function injectCSS(css, idSuffix) {
  const tagId = PLUGIN_ID + '/' + idSuffix
  if (document.querySelector<HTMLElement>('style[data-plugin-css="' + tagId + '"]')) return
  const tag = document.createElement('style')
  tag.dataset.plugin = PLUGIN_ID
  tag.dataset.pluginCss = tagId
  tag.textContent = css
  document.head.appendChild(tag)
}

/**
 * 给「浮层」打标记 `data-bloom-popup`，让 CSS 能稳定地选中它们。
 *
 * ## 为什么需要 JS 打标，而不是纯 CSS 选
 *
 * 会话统计、模型选择这些浮层的类名是 `<hash>_panel` / `<hash>_menu`，
 * hash 随构建变化，只能靠 `[class*="_panel"]` 这类子串匹配。但子串会连
 * 设置面板一起命中，而两者的**定位要求相反**：
 *
 *   · 设置面板（在 _overlay 里）→ 要 position:relative + ::before 配方
 *   · 会话统计浮层（直接挂 body）→ 绝不能碰 position，宿主自己 fixed 定位
 *
 * CSS 里想区分它们，要么写 `body > [class*="_panel"]`（拼接后变成双 body
 * 非法选择器，实测被浏览器整条丢弃），要么用 `:not(_overlay *)`（旧版
 * 浏览器对复杂 :not 支持不一）。所以改成运行时判断一次结构，落成属性。
 *
 * 判定规则：**直接挂在 body 下、且是定位元素** = 浮层。
 * 这个判据不依赖任何哈希类名。
 */
export const POPUP_ATTR = 'data-bloom-popup'

function markPopups(): void {
  if (typeof document === 'undefined' || !document.body) return
  for (const el of Array.from(document.body.children)) {
    if (!(el instanceof HTMLElement)) continue
    if (el.dataset.bloomPopup === 'true') continue
    const cs = getComputedStyle(el)
    // 浮层一定是脱离文档流的；普通内容块是 static。
    if (cs.position !== 'fixed' && cs.position !== 'absolute') continue
    // 自身要是块状可见容器（排除 script/style 之类）
    if (el.getBoundingClientRect().width === 0) continue
    el.dataset.bloomPopup = 'true'
  }
}

let popupObserver: MutationObserver | undefined

/**
 * 装上浮层标记：首帧扫一次，之后 DOM 变化时补标。返回卸载函数。
 *
 * ⚠️ 性能（2026-11-14 owner：「打开右边侧边栏之后动效卡顿」）：
 * markPopups 里对每个候选元素做 `getComputedStyle` + `getBoundingClientRect`，
 * 这两个都是**强制同步布局**，在 DOM 变动回调里跑会把刚排好的布局再推倒一次。
 * 右侧栏展开文件列表时 body 子树频繁变动，旧实现每个 rAF 都重扫一遍，
 * 于是和动画抢主线程。
 *
 * 现在两处收紧：
 *   ① 只监听 `childList` 且**不挂 subtree** —— 浮层永远是 body 的直接子节点，
 *      没必要监听整棵树，右侧栏内部的变动直接不触发回调；
 *   ② 额外比一次 body 子节点数量：数量没变就跳过（浮层增删必然改变数量）。
 */
export function watchPopups(): () => void {
  if (typeof document === 'undefined') return () => {}
  markPopups()
  if (popupObserver) popupObserver.disconnect()
  let queued = false
  let lastCount = document.body ? document.body.children.length : 0
  popupObserver = new MutationObserver(() => {
    if (queued) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      const now = document.body ? document.body.children.length : 0
      if (now === lastCount) return   // ② 数量没变 → 不可能新增浮层
      lastCount = now
      markPopups()
    })
  })
  popupObserver.observe(document.body, { childList: true })
  return () => {
    popupObserver?.disconnect()
    popupObserver = undefined
    document.querySelectorAll(`[${POPUP_ATTR}]`).forEach((n) => n.removeAttribute(POPUP_ATTR))
  }
}
