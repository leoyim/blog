# 把 HTML 页面发布为博客文章


## 前言

这个博客一直只支持写 Markdown。但 AI 生成的内容越来越常是完整的 HTML —— 交互式图表、可视化报告、小工具、自带设计风格的页面，这些用 Markdown 都表达不出来。

于是给博客加了一种新的内容类型：**直接把 HTML 文档当作一篇文章发布**。

技术上只有一个核心约束值得先说清楚：一份完整的 HTML 文档自带 `<!DOCTYPE>`、`<head>` 和自己的全局样式（`*`、`body`、`h1` 这类选择器）。如果直接粘贴进 Markdown 正文，会同时发生两件坏事：

- 提前闭合博客模板的 DOM 结构，整页布局错乱；
- 全局样式与主题互相覆盖，导航栏、字体、代码块样式都可能被改掉。

所以关键不是"怎么把 HTML 塞进去"，而是**怎么隔离**。隔离做对了，剩下的都是细节。

## 三种发布方式

| 方式 | 适用场景 | 进文章列表 | 评论区 / 目录 | 独立 URL |
| --- | --- | --- | --- | --- |
| ① 嵌入文章（iframe shortcode） | 文章主体是文字，HTML 是配图或配工具 | 是 | 正常 | 有，位于文章目录下 |
| ② `raw` 布局整页输出 | HTML 本身就是那篇文章 | 是（需手写 `summary`） | 无 | 有，就是文章 URL |
| ③ 放进 `static/` | 纯工具页，不打算进文章系统 | 否 | 无 | 有 |

三种方式可以混用，日常用得最多的是 ①。

## 方式一：嵌入到文章里

### 目录结构

把文章做成 page bundle，HTML 与正文平级放：

```text
content/posts/publish-html-as-blog-post/
├── index.zh-cn.md      # 文章正文
└── demo.html           # AI 生成的 HTML，原样保存，不做任何修改
```

与 `index.zh-cn.md` 同目录的所有文件都会成为这个页面的**资源（page resources）**，随文章一起发布。HTML 文件不需要改后缀、不需要剥掉 `<head>`、不需要把 CSS 内联化。

### 在正文中调用

```markdown
{{</* rawhtml "demo.html" */>}}
```

下面是本篇文章自带的一个真实示例：示例内部可以点击交互，右下角的图标按钮可以打开完整页面。

{{< rawhtml src="demo.html" >}}

### 参数说明

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| 第 1 个位置参数 / `src` | 是 | 资源文件名；或 `/html/xxx.html` 站内路径；或完整外链 URL |
| `height` | 否 | 固定高度（px）。传了就关闭高度自适应 |
| `label` | 否 | 右下角悬浮按钮的提示文案（tooltip 与无障碍标签），默认"在新标签页中打开" |
| `title` | 否 | iframe 的 `title`，用于无障碍，默认取文章标题 |

行为细节：

- 参数是**文件名**时只在当前文章的资源里查找，找不到会让 Hugo 构建直接失败，避免出现死链；
- 默认自适应高度：同源 iframe 可以读取内部 `scrollHeight`，并用 `ResizeObserver` 跟随内容变化；底部兜底 `min-height: 480px`；
- 如果 HTML 是 `html, body { height: 100% }` 的整屏应用，内部高度恒等于视口高度，自适应没有意义，请显式传 `height="800"` 这类固定值；
- 嵌入外链（跨域）时读不到内部高度，会保留 `min-height`。

### 独立页面展示

每个页面资源都有自己的 URL，iframe 右下角会自动浮现一个"在新标签页打开"的图标按钮，点开就是原样的 HTML 页面：

```text
https://leoyim.cn/publish-html-as-blog-post/demo.html
```

相对路径引用的图片、字体等资源都能正常工作，因为它们和 HTML 在同一目录下一起发布。

## 方式二：raw 布局，让 HTML 就是文章本身

方式一的文章 URL 打开时是套着主题外壳的（导航栏、标题、目录、评论）。如果希望这篇文章的正文**完全由 HTML 决定**，比如整屏的交互体验，就用 `layout: "raw"`。

新建 `content/posts/my-report/index.html`（注意后缀是 `.html`，不是 `.md`）：

```html
---
title: "一份交互式报告"
date: 2026-09-22T14:00:00+08:00
layout: "raw"
summary: "这里是列表页显示的摘要，因为正文是 HTML，Hugo 自动生成的摘要通常不可读，建议手写。"
hiddenFromSearch: true
---

<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <title>一份交互式报告</title>
    <style>/* 你/ AI 自己的全局样式 */</style>
</head>
<body>
    <!-- 整个页面的内容 -->
</body>
</html>
```

要点：

- `index.html` 里 front matter 之后的内容，Hugo 不做 Markdown 渲染，原样输出；
- `layout: "raw"` 对应新增的 `layouts/posts/raw.html` —— 一个只有一行 `{{ .Content }}` 的极简布局，不套导航栏、页脚、目录、评论；
- 文章 URL 就是这份 HTML，所以是干净的独立地址，而不是 `xxx.html` 这样的资源地址；
- 由于正文是 HTML，列表页摘要和搜索索引都会受影响，建议手写 `summary` 并设置 `hiddenFromSearch: true`。

## 方式三：放进 `static/` 的独立页面

如果这个 HTML 只是工具页，不希望它出现在文章列表、RSS、搜索里：

```text
static/html/tool.html  →  https://leoyim.cn/html/tool.html
```

`static/` 下的文件会被原样复制到站点根目录，零配置。适合"临时给别人看一个页面"的场景。

## 注意事项

- **样式隔离是单向的**：iframe 里的样式出不来，主题样式也进不去。iframe 内部不继承博客的字体和深色模式，HTML 必须自带完整样式；
- **深色模式**：iframe 默认设置了白色底（`background: #fff`），避免透明底的 HTML 在主题深色背景下文字看不清；
- **搜索**：iframe 里的内容不会被 Algolia 索引（索引来自渲染后的文字），也不会进目录 TOC。建议在正文里补一段文字摘要；
- **RSS**：`rssFullText = true` 时，阅读器里无法渲染 iframe，订阅者只会看到正文文字，必要时注明"访问原文查看交互内容"；
- **评论与分享**：方式一下完全正常，指向的是文章 URL 本身；
- **安全**：iframe 没有加 `sandbox`，因为需要执行脚本。只嵌入自己生成或可信来源的 HTML，不要嵌入来路不明的文档；
- **字数统计**：iframe 内容不计入 `WordCount`，正文太短时文章列表上的"阅读时间"会失真。

## 小结

整个改造只涉及三个文件：

| 文件 | 作用 |
| --- | --- |
| `layouts/shortcodes/rawhtml.html` | iframe 嵌入一篇 HTML，含高度自适应与独立页面链接 |
| `layouts/posts/raw.html` | `layout: "raw"` 时整页原样输出 |
| `content/posts/<slug>/xxx.html` | HTML 与 `index.<lang>.md` 平级放置即成为页面资源 |

日常使用只有两步：把 AI 生成的 HTML 存成与 `index.md` 同目录的文件，然后在正文里写一行 `{{</* rawhtml "xxx.html" */>}}`。样式、脚本、`<!DOCTYPE>` 全都不用动。
