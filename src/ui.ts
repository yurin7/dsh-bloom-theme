import { mountSwitcherInline } from './switcher.js'
import { buildLiquidLens } from './liquid-lens.js'
import { buildFogDefinitions } from './fog.js'

/** React comes from the host loader; no second React copy is bundled. */
export interface HostReact {
  createElement(type: string | (() => unknown), props: Record<string, unknown>): unknown
  useRef<T>(initial: T): { current: T }
  useEffect(setup: () => void | (() => void), deps: unknown[]): void
}

/**
 * Both containers belong to Bloom's Slots. The menu escapes clipped host headers.
 *
 * ⚠️ 2026-11-14：配色切换器已从顶栏（`conversation.header.leading`）挪到设置面板
 * （src/settings-section.ts），所以这里不再有 `Switcher` 组件。`overlay` 的
 * 变更订阅保留，因为更新横幅仍然挂在 `shell.overlay` 上。
 */
export function createBloomComponents(React: HostReact, installUpdateCheck: (host: HTMLElement) => () => void) {
  let overlay: HTMLElement | null = null
  const onOverlayChange = new Set<() => void>()

  function Decorations() {
    const host = React.useRef<HTMLDivElement | null>(null)
    React.useEffect(() => {
      const container = host.current
      if (!container) return
      // ⚠️ 2026-11-14：不再创建星光粒子层（buildSparkles）。
      //
      // owner 反馈「打开右边侧边栏之后动效卡顿」。实测右侧栏展开时页面里
      // 有 **270 个 s-amb / s-galaxy-edge / s-tr / s-bl 元素，每个都挂着
      // `will-change: transform, opacity` 和两个 `infinite` 关键帧动画**。
      // 它们虽然被 CSS 的 display:none 藏起来（背景氛围功能已下架），
      // 但浏览器仍然为每个元素维护动画时间线与合成层候选；右侧栏一打开，
      // 合成树变复杂，这批「僵尸动画」就开始真正参与合成，动画随之掉帧。
      //
      // 背景/氛围功能已经整组下架（见 css/background.ts 把
      // --bloom-ambience 钉成 none），粒子层没有任何视觉产出，
      // 所以直接在源头不生成 —— 这是唯一彻底的修法。
      // 想恢复氛围时，把下面这行解注释即可（粒子本身没被删）。
      // const sparkles = buildSparkles(container.ownerDocument)
      const lens = buildLiquidLens(container.ownerDocument)
      const fog = buildFogDefinitions(container.ownerDocument)
      container.append(lens, fog)
      const stopUpdates = installUpdateCheck(container)
      overlay = container
      onOverlayChange.forEach((sync) => sync())
      return () => {
        overlay = null
        onOverlayChange.forEach((sync) => sync())
        stopUpdates()
        lens.remove()
        fog.remove()
      }
    }, [])
    return React.createElement('div', { ref: host, className: 'dsh-bloom-overlay', 'data-bloom-slot': 'decorations' })
  }

  return { Decorations }
}
