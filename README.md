# 2026 系规案例最后押题｜GitHub Pages 加速版

这是从原来的单文件离线背诵网页调整的 GitHub Pages 部署版。

## 优化点

- 原文件约 9.5 MB：29 张 PDF 原文扫描图以 Base64 放在 HTML 内，访问首页就得下载全部图片文本。
- 加速版 `index.html` 约 100 KB，首页只加载页面结构、13 个专题和 111 道题的文字数据。
- 原文扫描图位于 `assets/pages/`，**仅在点击“原文第 X 页”时按需请求**，方便浏览器缓存。
- 视觉、专题筛选、答案展开、抽背、背诵状态记录等功能保留。

## 部署方法

1. 把整个压缩包解压到本地文件夹，**不要只上传 index.html**。
2. 新建或打开 GitHub 仓库，将 `index.html`、`.nojekyll`、`assets/` 整个目录上传到仓库根目录并提交。
3. 打开仓库 **Settings → Pages**。
4. 在 **Build and deployment** 中选择 **Deploy from a branch**，Branch 选 `main`，Folder 选 `/ (root)`，保存。
5. 等 GitHub Pages 构建完成，打开 `https://<你的用户名>.github.io/<仓库名>/`。

注意：以上链接是格式示例，不是已创建的网站。若使用用户名.github.io 类型的仓库，根目录站点一般是 `https://<用户名>.github.io/`。

## 文件结构

```text
index.html
.nojekyll
assets/
  pages/
    page-01.webp
    ...
    page-29.webp
```

## 注意事项

- 从磁盘直接双击 `index.html` 时，必须保留同目录下的 `assets/` 文件夹，原文阅读器才会显示图像。
- 学习进度仍保存在浏览器 `localStorage` 中；不同域名/浏览器及本地旧版与 GitHub Pages 在线版的学习记录不会自动同步。
- GitHub Pages 内容公开可访问，不要把含个人敏感信息的文件放到公开仓库。
- 如果在线仍无法打开，检查仓库的 Pages 部署状态、浏览器 Console 与 Network 里的网络请求，不要直接把 GitHub 仓库的 `blob` 地址当作网站地址。
