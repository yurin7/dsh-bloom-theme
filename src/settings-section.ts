/**
 * Bloom 设置区 —— 把原本挂在顶栏（`conversation.header.leading`）的那颗配色胶囊
 * 挪进 DSH 的「设置」面板。
 *
 * owner 2026-11-14：「当前这个主题的设置居然放在主界面顶部（图2 黛蓝的位置），
 * 应该放设置里」。顶栏那颗胶囊占了主界面最贵的横向空间，却是低频操作。
 *
 * ## 做法
 *
 * 注册一个 `settings.section`（设置面板左栏条目），区块内容**复用**现有的面板
 * DOM —— `buildSwitcherEl` 已经产出一整套完整、可交互、有键盘支持、有语言切换
 * 重绘的面板。这里不重写一套 React 控件，而是：
 *
 *   1. React 只渲染一个空的宿主 div；
 *   2. `useEffect` 里交给 `mountSwitcherInline` 塞进去并置为常驻展开；
 *   3. 内联形态的样式由 css/switcher.ts 的 `[data-inline]` 段接管：
 *      去掉浮层定位、隐藏 trigger 胶囊、把下拉改成文档流内的一整块。
 *
 * 为什么不直接复用 `mountSwitcher`：那个函数是为顶栏算绝对定位用的
 * （每帧读 anchor 的 rect、监听 scroll/resize、被弹窗遮挡时隐藏）。
 * 设置面板里它在文档流里，不需要也不应该跑那套定位循环。
 */
import { mountSwitcherInline } from './switcher.js'

export interface BloomSettingsReact {
  createElement(type: unknown, props: Record<string, unknown>, ...children: unknown[]): unknown
  useRef<T>(initial: T): { current: T }
  useEffect(setup: () => void | (() => void), deps: unknown[]): void
}

export function createSettingsSection(React: BloomSettingsReact) {
  return function BloomSettingsSection() {
    const host = React.useRef<HTMLDivElement | null>(null)

    React.useEffect(() => {
      const container = host.current
      if (!container) return
      // 每次进设置都按当前配色重建一份，避免复用上一次挂载留下的陈旧选中态。
      return mountSwitcherInline(container)
    }, [])

    return React.createElement('div', {
      className: 'dsh-bloom-settings',
      'data-bloom-settings': 'section',
      ref: host,
    })
  }
}
