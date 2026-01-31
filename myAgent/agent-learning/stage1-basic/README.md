# 🎯 第一阶段：基础概念与简单LLM调用

欢迎开始Agent学习之旅！在这个阶段，你将：

- 理解Agent的核心概念和三大能力
- 掌握LLM API的基础使用
- 实现一个简单的对话助手
- 添加记忆管理功能

## 📚 前置知识

在学习代码之前，请先理解这些核心概念：

### 1. 什么是AI Agent？
Agent具备三大核心能力：
- **环境感知**：获取外部信息
- **自主决策**：将复杂任务拆解为可执行步骤  
- **执行反馈**：调用工具完成操作，根据结果调整策略

### 2. Agent基础架构
```
用户需求 → 感知模块 → 决策模块 → 执行模块 → 反馈模块 → 输出结果
```

## 🚀 快速开始

### 📁 两种学习方式

你可以选择传统Python文件或Jupyter Notebook方式学习：

#### 🐍 方式1：传统Python文件（推荐初学者）

```bash
# 1. 环境准备
pip install -r requirements.txt

# 2. 配置API密钥
cp .env.example .env
# 编辑.env文件，填入API密钥

# 3. 运行示例
python examples/demo.py        # 功能演示
python simple_chat.py          # 简单对话助手
python memory_chat.py          # 记忆对话助手
```

#### 📓 方式2：Jupyter Notebook（推荐实验者）

```bash
# 1. 启动Jupyter
python start_jupyter.py
# 或者
pip install jupyter jupyterlab
jupyter lab

# 2. 在浏览器中打开
# 访问 http://localhost:8888
# 进入 notebook/ 目录
# 打开 01-agent-basics.ipynb 开始学习
```

## 📖 学习步骤

### 第1步：理解简单对话助手
- 运行 `simple_chat.py`
- 观察每次对话都是独立的，没有记忆
- 代码很简单，就是直接调用LLM API

### 第2步：体验记忆管理
- 运行 `memory_chat.py`
- 尝试多轮对话，比如：
  - "我叫小明"
  - "我叫什么名字？" 
  - "我刚才说了什么？"
- 观察Agent能够记住之前的对话内容

### 第3步：深入理解代码
- 阅读 `sliding_window_memory.py` 的实现
- 理解滑动窗口是如何工作的
- 尝试修改 `window_size` 参数，观察效果变化

## 🔧 核心代码解析

### SimpleChatAgent
最基础的LLM调用，每次对话都是独立的：
```python
response = self.client.chat.completions.create(
    model="qwen-max",
    messages=[
        {"role": "system", "content": "你是一个友好的助手"},
        {"role": "user", "content": message}
    ]
)
```

### MemoryChatAgent  
添加了滑动窗口记忆管理：
```python
# 更新记忆
self.memory.update("user", message)

# 使用完整的上下文对话
response = self.client.chat.completions.create(
    model="qwen-max",
    messages=self.memory.context  # 包含历史对话
)

# 记录助手回复
self.memory.update("assistant", response)
```

### 滑动窗口策略
- 只保留最近N轮对话
- 超过窗口时删除最早的对话
- 平衡记忆完整性和Token成本

## 🎯 练习建议

1. **基础练习**：
   - 尝试不同的系统提示词
   - 调整temperature参数，观察回复变化
   - 修改window_size，找到最佳值

2. **进阶练习**：
   - 添加对话持久化（保存到文件）
   - 实现关键词提取记忆（更智能的记忆策略）
   - 添加对话统计功能

3. **思考题**：
   - 为什么需要记忆管理？
   - 滑动窗口策略有什么优缺点？
   - 在什么场景下应该用大的window_size？

## 🔍 常见问题

### Q: API调用失败怎么办？
A: 检查以下几点：
- API密钥是否正确
- base_url是否正确
- 网络连接是否正常
- 是否有足够的余额

### Q: Token消耗很快怎么办？
A: 可以：
- 减小window_size
- 使用更便宜的模型
- 添加对话缓存

### Q: 如何获取API密钥？
A: 推荐几个选择：
- **通义千问**：访问阿里云官网，便宜好用
- **DeepSeek**：访问deepseek.com，性价比很高
- **OpenAI**：官方API，需要科学上网

## 🎉 完成标准

当你能回答以下问题时，说明已经掌握第一阶段：

1. ✅ 能清楚解释Agent的三大核心能力
2. ✅ 能够独立调用LLM API进行对话
3. ✅ 理解为什么需要记忆管理
4. ✅ 能够修改和优化滑动窗口参数
5. ✅ 能够独立运行和调试代码

## 📈 下一步预告

完成第一阶段后，你将进入：
- **第二阶段**：添加工具调用能力，让Agent能查询天气和调用API
- **第三阶段**：集成RAG，给Agent添加知识库检索能力
- **第四阶段**：构建完整的多工具智能旅行助手

祝你学习愉快！有问题随时查看代码注释或调试探索。