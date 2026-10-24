# 系统规划与管理师 · 111 题 Github Pages 极速版

完整保留原 HTML 的 111 道题、答案、数量、逻辑解释、口诀、13 章星级、筛选、遮挡答案、掌握标记和 29 页原文对照。

## 部署 GitHub Pages

1. 下载并解压这个 ZIP。把其中的 **index.html、.nojekyll 和 assets 文件夹**一起上传到 GitHub 仓库根目录（不要只上传 index.html）。
2. 打开仓库 `Settings → Pages`，选择 `Deploy from a branch`，然后选择 `main` 分支及 `/(root)`，保存。
3. 在 Pages 页面打开发布后的网站（通常是 `https://你的用户名.github.io/仓库名/`）。
4. 点任意题目的「📖 对照原文」检查能否打开对应页。

## 为什么加载快

原版 HTML 约 5.9 MiB，所有 29 页原文 WebP 图片以内嵌 Base64 形式写进同一个 HTML；新版 index.html 约 90 KiB，图片拆为 `assets/pages/p01.webp` ~ `p29.webp`，只有点击「对照原文」才请求一页，不再强制初次加载 29 页。

## 目录结构

```
index.html
.nojekyll
assets/
  pages/
    p01.webp
    ...
    p29.webp
```

## 注意

- 不需要构建步骤、Node.js、外部 CDN 或后端，纯静态资源。
- 每道题的“已掌握”状态存储在浏览器本地。换设备或域名后不自动同步。
- 浏览器直接用 `file://` 打开 index.html，只要 assets 文件夹完整，原文浏览也可以使用。
- 如果想只上传一个 HTML，另见「111题单文件轻量背诵版.html」；该版保留全部题目但不包含 PDF 原文图片。

### 手机端导航

在手机打开网页时点击顶部「☰ 章节目录（13）」即可展开全部章节与星级，点章节会跳转并自动收起目录。
