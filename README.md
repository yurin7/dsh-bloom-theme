# Bloom for DSH — 定制版

<p align="center"><strong>给 DeepSeek Harness 一套耐看的中国风玻璃主题。</strong><br/>15 套莫兰迪配色 · 三种玻璃质感 · 全局统一材质</p>

> **这是 [webkubor/dsh-bloom-theme](https://github.com/webkubor/dsh-bloom-theme) 的定制版本（v0.28.0）。**
> 原项目采用 MIT 许可，版权归原作者 webkubor 所有。
> 本仓库在原版基础上做了较大幅度的交互与视觉调整，见下方 [相对原版的改动](#相对原版的改动)。

## 安装

```bash
dsh plugin --profile <你的 profile 名> add github:yurin7/dsh-bloom-theme
```

或用本地包（本仓库 Releases 页可下载 `.tgz`）：

```bash
dsh plugin --profile <你的 profile 名> add ./dsh-bloom-theme-0.28.0.tgz
```

桌面端也可以在侧栏「插件」管理中安装。

安装后重启 DSH，主题自动生效。外观设置在 **设置 → Bloom 外观**。

## 相对原版的改动

### 外观设置挪进 DSH 设置

原版在顶栏挂一颗配色胶囊。本版改为注册 `settings.section`，在「设置 → Bloom 外观」中提供完整面板，顶栏不再占用横向空间。

### 全局材质统一

原版只有部分容器跟随玻璃材质。本版把材质接管延伸到：

- 设置面板及其内部卡片
- 各类弹窗 / 下拉（会话统计、模型选择、任务面板、排队条）
- 交付物 / 改动文件卡片（含 hover 与 focus 态）
- 发送按钮（按所选材质切换，不再是固定的液态玻璃）

关键实现是把宿主成对使用的 token 绑到材质变量上，而不是逐个类写选择器：

```css
--dsw-specific-menu:        var(--bloom-surface-fill, …);
--dsw-menu-backdrop-filter: var(--bloom-surface-filter, …);
--dsw-alias-settings-card-fill: var(--bloom-surface-fill, …);
--changes-fill / --changes-hover: var(--bloom-surface-fill, …);
```

### 输入区光效改为聚焦驱动

原版每次敲键都会重置一个 900ms 定时器，属性反复开合，配合 `infinite` 动画会持续闪烁。

本版改为**焦点驱动**：composer 获得焦点时常驻光晕，失去焦点后淡出；进场只扫一次，不做循环。同时用 `relatedTarget` 判断焦点是否仍在 composer 内，输入框 → 发送键 → 附件之间移动不会闪断。

### 移除背景氛围与自动换色

移除了氛围背景（对角漫染 / 漫天星辰 / 斜光流转 / 水彩晕染等）、流星颜色选项与自动换色。

同时删除了星光粒子层（约 270 个带 `infinite` 动画的元素）。它们虽被 `display:none` 隐藏，但浏览器仍为其维护动画时间线与合成层候选，展开右侧栏时会导致明显掉帧。

### 质感新增「自动」档

`auto` 原先解析为液态玻璃且没有 UI 入口，一旦点过其他材质就再也回不去。本版新增「自动」按钮，默认解析为毛玻璃，并在面板上说明当前解析结果。

### 其他修复

- 浅色模式下发送键箭头不可见（前景 token 与底色都近白，对比度约 1.05:1）
- 悬停弹窗内卡片时材质被 5% 透明色覆盖而消失
- 排队条、任务条与输入卡宽度公式不一致，导致三条左右边缘参差不齐（原为 4/2/0 个 `dock-inset` 的差异，现已统一）

## 素材与致谢

- 原项目：[webkubor/dsh-bloom-theme](https://github.com/webkubor/dsh-bloom-theme)
- 配色灵感：typora-Bloom-theme
- 许可证：[MIT](./LICENSE)（版权归原作者 webkubor，本仓库保留原许可声明）

## 许可

MIT。按许可证要求，`LICENSE` 中的原始版权声明保持原样。本仓库的修改部分同样以 MIT 发布。
