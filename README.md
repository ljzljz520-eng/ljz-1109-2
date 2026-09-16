# 景泰蓝工艺志 · 铜胎掐丝珐琅工艺网站

一个介绍**景泰蓝（铜胎掐丝珐琅）**传统工艺的纯静态响应式网站，无构建步骤、无运行时框架依赖。

## 页面

| 页面 | 文件 | 内容 |
| --- | --- | --- |
| 首页 | `index.html` | 掐丝 → 点蓝 → 烧制 → 磨光 四道工序，每个节点带**材料 / 温度 / 时长**元数据；材料带；精选器物 |
| 案例列表 | `cases.html` | 八件器物，可按**年代 / 釉色 / 器型**组合筛选 |
| 案例详情 | `detail.html?id=<id>` | 大图 + **纹样（构成与寓意）/ 釉色（配色色点）/ 年代（断代背景）** 三面板 |
| 设计规范 | `design-spec.html` | 主题 token、真实组件引用、动效、懒加载、低性能降级、断点、无障碍 |

## 运行

```bash
# 任意静态服务器即可
python3 -m http.server 8066
# 打开 http://localhost:8066/index.html
```

- 低性能模式：页眉开关，或访问 `?perf=low` / `?perf=high`；选择会写入 `localStorage`；也会按 `hardwareConcurrency / deviceMemory / saveData` 自动探测。
- 系统开启“减少动态效果”（`prefers-reduced-motion`）时动效同样降级。

## 关键实现

- **主题 token**：全部视觉取值集中在 `assets/css/tokens.css`（颜色 / 字体 / 间距 / 圆角 / 阴影 / 动效 / 布局），`html[data-perf="low"]` 下 token 级降级（阴影置空、时长 1ms）。
- **滚动显现**：IntersectionObserver + `.reveal` / `data-reveal="left|right|zoom"` / `data-delay`；渐进增强——仅在能力可用时给 `<html>` 加 `.js-anim` 才隐藏元素，无 JS / 低性能下内容默认可见。
- **懒加载**：器物 SVG 以 `data-lazy-art` 标记，骨架屏 + 160px 预读 + 淡入；低性能时同步渲染、无骨架屏。
- **筛选与详情共享快照**：筛选状态同时写入 URL（可分享）与 `sessionStorage`（`ct_filter_snapshot`）。从列表进入详情、再返回时自动恢复筛选并提示；详情页“返回列表”链接携带筛选参数。
- **器物图**：`assets/js/svg.js` 纯函数生成内联 SVG（8 种器型轮廓 × 6 类掐丝纹样），列表与详情共用同一渲染器，保证视觉一致且零图片请求。
- **数据唯一来源**：`assets/js/data.js`（工序元数据 + 八件器物资料），列表与详情共享。

## 目录

```
assets/css/tokens.css   设计 token（含低性能覆盖）
assets/css/style.css    组件、布局、响应式、降级
assets/js/data.js       工序与器物数据
assets/js/svg.js        器物 SVG 生成器
assets/js/app.js        性能模式 / 导航 / 滚动显现 / 懒加载 / 筛选快照 / 详情
index.html cases.html detail.html design-spec.html
```

## 测试

- `_test-site.js`：jsdom 单元/交互测试（渲染、筛选、快照、降级），55 项。
- `_e2e.js`：Playwright 真实浏览器端到端，20 项（含移动端菜单与筛选往返）。
- 器物为教学示意，并非馆藏著录。
