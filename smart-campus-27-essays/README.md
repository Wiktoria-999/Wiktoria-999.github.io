# 智慧校园论文 - GitHub Pages 加速版

本版本和原版内容相同，但按需加载：打开时仅获取首页、当前论文及必要信息，V2/V3 资料第一次打开时才加载。

## 发布方法（GitHub Pages）
1. 在 GitHub 仓库上传 `index.html`、`app.js`、`data/`、`assets/`、`.nojekyll`（保持目录结构不变）。
2. 进入仓库 Settings → Pages，选择 Deploy from a branch，Branch 选 main、/(root)，Save。
3. 部署完成后访问 `https://用户名.github.io/仓库名/`。

**注意**：本版本依赖 `fetch()` 从 `data/` 按需获取内容，直接通过本地文件 file:// 双击打开时受浏览器安全限制，可能无法读取资料。需要本地离线浏览，请使用原来的单文件 HTML；若需本地预览网站版本，可在该目录运行 `python -m http.server 8000` 后访问 `http://localhost:8000/`。

不要只上传 index.html，也不要用 GitHub 仓库的 HTML 源码预览地址代替 GitHub Pages 链接。
