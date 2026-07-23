# Infinite History

[readme.en](README.en.md)

## 关于

本扩展将 `chrome://history/` 替换为一个本地优先的浏览历史归档界面。它实时记录新的访问、分批回填 Chrome 当前仍可读取的历史，并将每一次访问独立写入扩展自己的 IndexedDB。只要扩展未卸载且扩展数据未被清除，Chrome 自身的保留期限或清理操作不会直接删除已经归档的记录（详见下方的“安全约束”说明）。

所有归档、搜索、日期浏览和导出都在本机完成；扩展不会上传历史记录，也不提供删除、黑名单或自动清理功能。数据归档思路参考 Bilibili 无限历史记录扩展（[mundane799699/bilibili-history-wxt](https://github.com/mundane799699/bilibili-history-wxt)）。

## 扩展核心作用

- 突破 Chrome/Edge 历史记录上限，避免历史记录在 90 天后自动删除造成的查询中断。

## 搜索关键词 / Search Keywords

无限历史记录、浏览器无限历史记录、Chrome 无限历史记录、Edge 无限历史记录、Chrome/Edge 无限历史记录扩展、unlimited history、unlimited browser history、Chrome unlimited history、Edge unlimited history。

## 功能

- 接管 `chrome://history/`。
- 使用 `history.onVisited` 实时归档访问记录。
- 安装后分批回填 Chrome 当前仍保留的历史。
- IndexedDB 保存每一次访问，并维护“日期 + URL”聚合摘要。
- 提供固定侧栏、日期卡片、日期/小时分组和紧凑记录行。
- 同一网址当天访问多次时合并显示访问次数，原始逐次访问仍完整保存。
- 支持全局搜索、日期浏览、JSON/CSV 全量或日期范围导出。
- 支持浅色、深色、紧凑/舒适密度和日期格式设置。
- 界面首次打开默认中文；侧栏提供独立的中英文切换按钮，语言选择会保存在本机。

## 安全约束

- 仅调用 `history.search`、`history.getVisits` 和监听 `history.onVisited`。
- 不监听 `history.onVisitRemoved`。
- 不实现 `deleteUrl`、`deleteRange`、`deleteAll` 或 `browsingData`。
- 界面中不存在删除、清理、黑名单或自动清理入口。
- Chrome 清理自身历史不会删除 IndexedDB 中的独立归档。

## 开发

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run compile
npm run build
```

Chrome 构建目录为 `.output/chrome-mv3`。

## 主要目录

- `entrypoints/background.ts`：实时采集、近期补漏和旧历史回填。
- `entrypoints/history/`：历史页面入口、状态管理和界面样式。
- `components/`：导航、日期控制、时间线、设置与导出页面。
- `lib/archive-db.ts`：IndexedDB 数据库、幂等写入和分页查询。
- `lib/export-history.ts`：JSON/CSV 流式导出。
- `lib/i18n.ts`：中英文文案、数字格式和语言上下文。

“无限”表示扩展不主动设置条数或时间上限，实际容量仍受本机磁盘空间限制。卸载扩展或清除扩展站点数据会删除 IndexedDB 归档，建议定期导出备份。
