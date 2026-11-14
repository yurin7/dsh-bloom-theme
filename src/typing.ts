/**
 * 输入区聚焦光（2026-11-14 owner）：
 *
 *   「触发时机不应该是我打字的时候触发，而是在聊天框被聚焦时才触发，
 *     退出聊天框后再播放动效退出而不是定时器检测我一段时间没打字退出」
 *
 * 所以状态只有两种，由**焦点**决定，和打字与否无关：
 *
 *   · composer 里的输入框拿到焦点  → `<body data-bloom-typing="true">`，光带常驻
 *   · 焦点离开整个 composer        → 撤掉属性，CSS 用 transition 播放淡出
 *
 * 没有 `input` 监听，也没有 idle 定时器。旧实现每次敲键都重排一个 900ms 的
 * `setTimeout`，于是「连续打字 → 反复开合 → 光带反复重启」，这正是晃眼的来源：
 * 动画是 `infinite` 的，只要属性在就一直在扫；停手 900ms 属性撤掉再敲又重来，
 * 视觉上就是一次又一次的闪。
 *
 * 为什么用 body 属性而不是给卡片加 class：
 *   - 卡片是 DSH 自己的 DOM（[class*="_card"] 靠类名片段匹配），我们不改它；
 *   - body 上的属性是插件自己的状态，不与 DSH 的渲染逻辑打架。
 *
 * 为什么退出时是「焦点离开 composer」而不是「输入框 blur」：
 *   点发送键、点卡片里的附件按钮，焦点都会先离开输入框 —— 按 blur 算会闪断。
 *   这里用 focusout + relatedTarget 判断「新焦点是否还在 composer 子树里」，
 *   在内部移动就当没离开。
 */

const TYPING_ATTR = 'data-bloom-typing'

/**
 * composer 的判定：DSH 的输入区类名是 `<hash>_composer*`，只能用子串匹配。
 * 同时接受 `[data-composer-input]`（宿主给 contenteditable 的显式标记）——
 * 类名片段随构建变化，这个属性是宿主自己写的语义标记，更稳。
 */
const COMPOSER_SELECTOR = '[class*="_composer"], [data-composer-input]'

let disposeCurrent: (() => void) | undefined

function isInComposer(el: EventTarget | null): boolean {
  if (!(el instanceof Element)) return false
  return el.closest(COMPOSER_SELECTOR) !== null
}

/** 当前焦点是否落在某个 composer 输入控件上。 */
function composerHasFocus(): boolean {
  const active = document.activeElement
  if (!isInComposer(active)) return false
  if (!(active instanceof HTMLElement)) return false
  const tag = active.tagName
  if (tag === 'TEXTAREA') return true
  if (tag === 'INPUT') {
    const type = (active as HTMLInputElement).type
    return type === 'text' || type === 'search' || type === 'email'
  }
  // Lexical 的 contenteditable 宿主 div
  return active.isContentEditable || active.hasAttribute('data-composer-input')
}

function setTyping(on: boolean): void {
  const body = document.body
  if (!body) return
  if (on) body.setAttribute(TYPING_ATTR, 'true')
  else body.removeAttribute(TYPING_ATTR)
}

/**
 * 装上监听，返回卸载函数。
 *
 * 必须可卸载：apply(ctx) 会被 cordis 多次调用（materialize / HMR / 插件停用），
 * 重复调用先卸载上一份；调用方把返回值交给 ctx.effect 即可随插件回收。
 */
export function initTypingGlow(): () => void {
  if (typeof document === 'undefined') return () => {}
  disposeCurrent?.()

  /**
   * 只在 composer 内部进出焦点时改状态。
   *
   * `focusin` / `focusout` 都要用，且必须监听**捕获阶段**：
   * DSH 可能对输入框做过 stopPropagation，冒泡阶段收不到。
   */
  const sync = () => { setTyping(composerHasFocus()) }

  const onFocusIn = (e: Event) => {
    if (!isInComposer(e.target)) return
    sync()
  }
  const onFocusOut = (e: Event) => {
    if (!isInComposer(e.target)) return
    // 焦点在 composer 内部移动（输入框 → 发送键 → 附件）时不算离开。
    // relatedTarget 为 null 表示焦点跑到了 document 之外（切窗口 / 点到非可聚焦区），
    // 那也算离开，由下一个异步检查兜住 —— 用微任务而不是定时器，
    // 因为焦点变化在任何渲染帧之前就已确定。
    const next = (e as FocusEvent).relatedTarget
    if (next && isInComposer(next)) return
    queueMicrotask(sync)
  }

  document.addEventListener('focusin', onFocusIn, true)
  document.addEventListener('focusout', onFocusOut, true)

  // 首帧对齐：插件可能是在输入框已经聚焦之后才装上（HMR / 热重载）。
  sync()

  const dispose = () => {
    document.removeEventListener('focusin', onFocusIn, true)
    document.removeEventListener('focusout', onFocusOut, true)
    setTyping(false)
    if (disposeCurrent === dispose) disposeCurrent = undefined
  }
  disposeCurrent = dispose
  return dispose
}
