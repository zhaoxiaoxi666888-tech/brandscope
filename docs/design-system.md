# 设计系统

## 原则

冷静、克制、以工作任务为中心。界面只使用黑白灰与低对比状态色，不使用渐变、玻璃拟态、装饰动画或大面积阴影。

## Token

- 颜色：`color-ink #111210`、`color-muted #6f706b`、`color-line #deded8`、`color-paper #f6f6f2`、`color-white #fdfdfb`、`color-soft #ecece6`、`color-success #53685d`、`color-error #8a3931`
- 字体：正文 `Arial / PingFang SC`；编辑标题 `Georgia / Songti SC`
- 字号：10 / 12 / 14 / 18；页面标题按布局使用 38–50
- 行高：标题 1.2；正文 1.72
- 间距：8 / 16 / 24 / 32 / 48 / 64
- 圆角：默认 0；小控件最多 2
- 分割线：1px `color-line`；关键章节使用 `color-ink`
- 阴影：仅弹窗与浮层使用 `shadow-subtle`
- 页面最大宽度：1240px

## 排版层级

页面主标题使用编辑字体；页面说明 14px；模块标题 18–28px；卡片标题 12–14px 加粗；正文 14px/1.72；辅助说明、来源和状态为 10–12px。

## 基础组件

组件位于 `app/components/ui`：Button、ButtonLink、Field、Input、Textarea、StatusBadge、Card、LoadingState、EmptyState、ErrorState、ConfirmDialog。所有可点击元素提供 hover、focus-visible、disabled 反馈；表单提供必填、校验、提交状态与错误反馈。
