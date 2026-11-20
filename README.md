# 履历间 · 中文求职工作台

一个桌面优先的求职前端。四个工作台围绕同一份经历材料，串起资料整理、岗位比较、简历编辑与面试准备。

直接在浏览器打开 [web/index.html](web/index.html) 即可体验。也可以在仓库根目录运行下列命令，再访问 `http://127.0.0.1:4398`。

```sh
python -m http.server 4398 --bind 127.0.0.1 --directory web
```

## 代码与技能位置

| 工作台 | 前端代码 | 可替换的技能包 |
| --- | --- | --- |
| 个人经历台 | [web/modules/experience](web/modules/experience/) | [skills/experience](skills/experience/) |
| 岗位匹配台 | [web/modules/match](web/modules/match/) | [skills/match](skills/match/) |
| 简历优化台与版本仓库 | [web/modules/resume](web/modules/resume/) | [skills/resume](skills/resume/) |
| 面试打磨台 | [web/modules/interview](web/modules/interview/) | [skills/interview](skills/interview/) |

方向与任务选择在 [web/modules/start](web/modules/start/)。工作台导航、本机数据读写、共用视图和插画在 [web/shared](web/shared/)。PPTX 导出组件及第三方许可在 [web/vendor](web/vendor/)。页面关系、事实追溯和版本要求见[原始 PRD](docs/PRD-v1.0.md)。

## 协作时怎样换 skill

每项技能独占一个目录。仓库已包含 [chinese-product-manager-cv](skills/resume/chinese-product-manager-cv/SKILL.md)，其余三个插槽可直接放入新包。

- **调整已有方法**可修改包内的 `SKILL.md` 和配套资源。保留模块及 frontmatter 中的 `name`，现有调用方下次读取时就能拿到新内容。
- **增加平行方案**可在同一个模块下新建另一个包，例如 `skills/resume/finance-analyst-cv/SKILL.md`。为它设置独立的 `name`，两种方法可以共存。
- **提交前核对**可以用下列命令检查包名和资源链接。读取器每次从目录发现包，无需手工维护清单。

```sh
node tools/skills.mjs list
node tools/skills.mjs show resume chinese-product-manager-cv
node tools/skills.mjs check
node --test tools/skills.test.mjs
```

调用接口和新增包示例见 [skills/README.md](skills/README.md)。团队成员可用各自的分支提交 skill 修改，在 Pull Request 中附上一组虚构输入和预期变化，方便其他人复核。

## 当前可用的交互

资料支持拖入归档、悬停抽页、原文核对与经历关联。多个 JD 以塔罗暗纹牌呈现，分析后按偏好和经历证据排序。简历可编辑、撤销、预览文字改写，点击定稿后会保存带喷雾动效的版本快照。PPTX 可编辑，PDF 通过浏览器打印保存。面试准备可以绑定指定岗位和简历修订。

前端内置标明来源的演示数据。上传原件保存在当前浏览器的 IndexedDB，工作稿和选项保存在 localStorage。匹配和文字预览目前使用浏览器本地规则。服务端可通过 [tools/skills.mjs](tools/skills.mjs) 的 `loadSkill(module, name)` 读取技能内容，再交给选定的模型。替换 skill 会更新读取结果，模型调用尚待接入。
