# Benchmark Dataset v2

BrandScope 固定使用 Apple｜中国、Anker｜德国和 Dyson｜中国进行回归验收。

## 规则

- 每个案例至少 8 篇成功提取的具体文章或报告。
- 不把官网首页、联系页、搜索页或 Newsroom 栏目页当作 Evidence。
- 优先官方财报、品牌新闻稿、行业研究和权威媒体。
- 固定评估 Research 六模块、Insight 去留率和 Brief 可讨论程度。

## v2 结果

| 案例 | Evidence | Research | 可保留 Insight | Brief |
|---|---:|---:|---:|---|
| Apple | 8 | 6/6 | 3/6 | B- |
| Anker | 9 | 6/6 | 4/6 | B+ |
| Dyson | 8 | 6/6 | 4/6 | B+ |

详细事实风险和逐模块评分见 [brand-quality-report-v2.md](brand-quality-report-v2.md)。

## 质量统计

- Evidence：25 条（Apple 8、Anker 9、Dyson 8）
- Insights：18 条；可直接保留 11、需修改 6、建议删除 1
- 可直接保留率：61%（11/18）
- Brief：Apple B-、Anker B+、Dyson B+，均为“修改后可以讨论”

## 使用边界

Benchmark 用于回归比较，不代表商业用户规模或普遍行业准确率。结果仍需人工核验，尤其是地域数据映射、渠道建议和模型推断。
