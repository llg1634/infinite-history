# Infinite History

使用 WXT、React 和 TypeScript 编写的浏览器无限历史扩展。界面结构参考 Better History，数据归档思路参考 Bilibili 无限历史记录扩展。

## 功能

- 接管 `chrome://history/`。
- 使用 `history.onVisited` 实时归档访问记录。
- 安装后分批回填 Chrome 当前仍保留的历史。
- IndexedDB 保存每一次访问，并维护“日期 + URL”聚合摘要。
- Better History 风格的固定侧栏、日期卡片、日期/小时分组和紧凑记录行。
- 同一网址当天访问多次时合并显示访问次数，原始逐次访问仍完整保存。
- 支持全局搜索、日期浏览、JSON/CSV 全量或日期范围导出。
- 支持浅色、深色、紧凑/舒适密度和日期格式设置。

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
- `entrypoints/history/`：历史页面入口、状态管理和 Better History 风格样式。
- `components/`：导航、日期控制、时间线、设置与导出页面。
- `lib/archive-db.ts`：IndexedDB 数据库、幂等写入和分页查询。
- `lib/export-history.ts`：JSON/CSV 流式导出。

“无限”表示扩展不主动设置条数或时间上限，实际容量仍受本机磁盘空间限制。卸载扩展或清除扩展站点数据会删除 IndexedDB 归档，建议定期导出备份。
