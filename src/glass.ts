/** 玻璃材质偏好、旧值迁移与无障碍降级。 */
import { STORAGE_KEY } from './meta.js'

/** 用户可选的三种具体材质。 */
export type GlassMaterial = 'frosted' | 'matte' | 'liquid'
/**
 * auto 是「让 Bloom 挑」的默认档，解析成毛玻璃（2026-11-14 起，见
 * effectiveGlassMode）。它是**默认存档**，所以面板里必须有对应按钮，
 * 否则用户点过任何一档之后就再也回不到自动。
 */
export type GlassMode = 'auto' | GlassMaterial
/** solid 只用于系统无障碍降级，不是用户选项。 */
export type EffectiveGlassMode = GlassMaterial | 'solid'

const KEY = `${STORAGE_KEY}-glass-mode`

/** 面板里「质感」一行的选项，按显示顺序。auto 排第一（它是默认值）。 */
export const GLASS_MODES: GlassMode[] = ['auto', 'frosted', 'matte', 'liquid']

let cached: GlassMode | undefined
let needsMigration = false

function normalizeGlassMode(value: unknown): GlassMode {
  switch (value) {
    case 'frosted':
    case 'matte':
    case 'liquid': return value
    case 'glass': return 'liquid'
    case 'soft': return 'matte'
    case 'solid': return 'frosted'
    default: return 'auto'
  }
}

/** 读取并解析旧值；不在读取时写入存储。 */
export function readGlassMode(): GlassMode {
  if (cached !== undefined) return cached
  let value: string | null = null
  try { value = localStorage.getItem(KEY) } catch {}
  cached = normalizeGlassMode(value)
  needsMigration = value === 'glass' || value === 'soft' || value === 'solid'
  return cached
}

/** 保存标准材质 ID；存储不可用时仍保留本次会话选择。 */
export function writeGlassMode(mode: GlassMode): void {
  cached = normalizeGlassMode(mode)
  needsMigration = false
  try { localStorage.setItem(KEY, cached) } catch {}
  applyGlassMode()
}

/**
 * 显式材质写入 body；auto 保持"属性缺席"，由 CSS 解析。
 *
 * ⚠️ auto **不要**在这里硬写成一个具体材质。CSS 里 `:not([data-bloom-glass])`
 * 的几条分支各自带媒体查询（降低透明度 → solid、高对比 → solid、否则毛玻璃），
 * 一旦把 auto 提前固化成 `frosted`，无障碍降级就再也进不去了。
 *
 * 「auto 等于毛玻璃」这件事的真源在 CSS：css/surfaces.ts 的默认档和
 * css/adaptive.ts 的 `:not([data-bloom-glass])` 分支，两处都配成毛玻璃配方；
 * JS 侧 effectiveGlassMode() 对 auto 返回 'frosted' 只用于**显示选中态**。
 */
export function applyGlassMode(): void {
  const mode = readGlassMode()
  if (mode === 'auto') {
    document.body.removeAttribute('data-bloom-glass')
  } else {
    document.body.setAttribute('data-bloom-glass', mode)
  }
}

function matchesMedia(query: string): boolean {
  try { return window.matchMedia(query).matches } catch { return false }
}

/**
 * 返回与 CSS 一致的生效材质；高对比和强制颜色优先。
 *
 * ## auto 的默认材质（2026-11-14 从 liquid 改为 frosted）
 *
 * owner：「液态玻璃这个太丑了」。auto 的含义是「让 Bloom 挑」，而 Bloom 之前
 * 挑的是 liquid —— 于是所有**从没主动选过材质**的用户，一装上就是液态玻璃，
 * 大面板和发送键全是折射镜片。现在默认挑 frosted（毛玻璃）：中性、不抢戏，
 * 和 Bloom 的莫兰迪调性一致。想要液态的人可以在设置里显式选。
 *
 * auto 仍不随深浅变（2026-11-07 的结论保留）：材质是**一个与配色方案无关的
 * 用户偏好**，不该切一次深浅就换一种手感。只有系统无障碍降级（强制颜色、
 * 高对比、降低透明度）才强制 solid —— 那是系统要求，不是用户偏好。
 */
export function effectiveGlassMode(): EffectiveGlassMode {
  if (matchesMedia('(forced-colors: active)') || matchesMedia('(prefers-contrast: more)')) return 'solid'
  const mode = readGlassMode()
  if (mode !== 'auto') return mode
  if (systemPrefersReducedTransparency()) return 'solid'
  return 'frosted'
}

/** 系统是否要求降低透明度。 */
export function systemPrefersReducedTransparency(): boolean {
  return matchesMedia('(prefers-reduced-transparency: reduce)')
}

/** 初始化时归一旧存档、应用材质并注册可解绑的系统偏好监听。 */
export function initGlassMode(): () => void {
  const mode = readGlassMode()
  if (needsMigration) {
    try { localStorage.setItem(KEY, mode); needsMigration = false } catch {}
  }
  applyGlassMode()
  let mq: MediaQueryList | null = null
  try { mq = window.matchMedia('(prefers-reduced-transparency: reduce)') } catch {}
  if (!mq) return () => {}
  const onChange = () => {
    if (readGlassMode() === 'auto') applyGlassMode()
  }
  mq.addEventListener('change', onChange)
  return () => mq?.removeEventListener('change', onChange)
}
