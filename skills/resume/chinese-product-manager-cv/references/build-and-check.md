# 制作与检查

## 分享与调用

分享完整 ZIP，接收者将其中的 `chinese-product-manager-cv` 文件夹放到自己的 `~/.codex/skills/` 下。保持 `SKILL.md`、参考规范、脚本和示例资源的相对位置。

在 Codex 中调用 `$chinese-product-manager-cv`，提供本人简历、目标岗位及当次要求。只发送 `SKILL.md` 可以阅读核心规则，但不能完整复用配套规范和模板。

## 输入结构

复制 `assets/example-resume.json`，以用户真实资料替换内容。路径相对当前 JSON 所在目录解析，不依赖某台电脑的桌面路径。

- `name`、`contacts`：姓名和一整行联系方式；联系方式过长时精简字段，不减字号。
- `photo`：可选照片路径，保持原图比例；不提供则不绘制。
- `education`：数组，各项 `title`、`date`、可选 `details`。`details` 是紧凑正文，可含 `<b>加粗</b>`。
- `internships`、`projects`：数组，各项 `title`、`date`、`bullets`；每条为 `label`（不超过 12 个可见字符，不含冒号）、`text`（正文，可含 `<b>`）。按最终展示顺序输入。
- `awards`：数组，各项 `title`（比赛全称）、`result`（级别和奖项）。
- `skills`、`languages`：可选字符串，拼在最末行；语言分数缺失就省略，不使用示例分数。

除 `<b>`、`</b>` 外，字符串均当作普通文字处理。标题、日期不使用 HTML。技能行只写内容，脚本补“技能：”“语言：”。

## 执行

依赖 Python 3、`reportlab`。检查 PDF 可用 `pypdf` / `pdfplumber`；渲染可用 Poppler 的 `pdftoppm`。复用运行环境已有的依赖即可。

```text
python scripts/build_resume.py --input my-resume.json --output output/My_Product_Manager_CV.pdf
```

Windows 默认读取系统 `msyh.ttc`、`msyhbd.ttc`、`arial.ttf`、`arialbd.ttf`。其他平台或非默认字体目录可显式指定：

```text
python scripts/build_resume.py --input my-resume.json --output output/My_Product_Manager_CV.pdf --cn-regular /fonts/msyh.ttc --cn-bold /fonts/msyhbd.ttc --latin-regular /fonts/arial.ttf --latin-bold /fonts/arialbd.ttf
```

TTC 默认第 0 个字形集，可通过 `--cn-index`、`--cn-bold-index` 调整。字体文件不包含在分享包中；使用者自行提供合法字体。

## 脚本输出的含义

- PDF：单页，固定字号 / 行距，只有通过宽度、溢出与概括长度等检查后才写入。
- 同名 `.layout.json`：含字体文件、页面 / 行距、各块坐标、尾行占比、页底留白和预警。文件包含简历文字，属于使用者的工作文件，不要自动打包分享。
- 阻止输出：概括超 12 字、标题与日期碰撞、联系方式超宽、技能语言超过一行、文字超出底部边界、任一完整单词 / 字形片段超出可用宽度。出错时修改内容再运行，不自动缩字号。
- 提醒人工检查：条目尾行不足一半、多于 3 行、奖项不在 3–4 项、页底留白明显较大。这些不是编造内容或硬凑条数的理由。
- 如目标 PDF 已存在且新输入检查失败，旧 PDF 会保留；不可把它当成这次的新输出。仅在命令成功后检查文件更新时间并渲染。

## 视觉检查

```text
pdftoppm -singlefile -scale-to 2105 -png output/My_Product_Manager_CV.pdf output/preview
```

打开新生成的 `preview.png`。看全页层次和留白，再放大标题、密集经历、底部荣誉与技能。检查所有页面，确认 PDF 的页数为 1。中文字体、英文字体及加粗均需目视核对，不能仅凭 JSON 推断。

示例刻意不绑定具体学校、雇主、奖项或工具组合。更换岗位时调整内容重点，保留排版参数；用户明确要求更换样式时才更改版式。
