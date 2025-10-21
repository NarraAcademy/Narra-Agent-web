```
content: 推理消息内容
            agent: Agent名称 （Coordinator → CoinGecko → Project → News → Synthesizer System
            category: 分类标签
                - "search": 搜索/查询操作
                - "browse": 浏览网页
                - "analyze": 分析/思考
                - "tool_call": 工具调用
                - "status": 状态更新
                - "info": 一般信息（默认）
            metadata: 额外的元数据，如 {"url": "...", "duration": 1.5}
            step_id: 所属的大步骤ID（可选），用于前端归类到对应步骤下
```
