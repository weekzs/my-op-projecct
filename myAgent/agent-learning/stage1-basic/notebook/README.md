# 🎯 Jupyter Notebook版本 - Agent学习第一阶段

## 📚 Notebook说明

这个目录包含了第一阶段的Jupyter Notebook版本，更适合交互式学习和实验。

### 📂 文件结构

```
notebook/
├── 01-agent-basics.ipynb           # 基础概念和简单对话实现
├── 02-memory-optimization.ipynb    # 记忆优化和策略对比
└── README.md                       # 使用说明
```

## 🚀 使用方法

### 1. 环境准备

```bash
# 确保在myAgent环境中
cd agent-learning/stage1-basic

# 安装Jupyter和相关依赖
pip install jupyter matplotlib pandas notebook

# 启动Jupyter Notebook
jupyter notebook
```

### 2. 或者使用JupyterLab（推荐）

```bash
pip install jupyterlab
jupyter lab
```

### 3. 在浏览器中打开Notebook

访问 `http://localhost:8888`，然后点击notebook目录下的文件。

## 🎯 学习路径

### 📖 Note 1: 01-agent-basics.ipynb
- Agent核心概念讲解
- 简单对话助手实现
- 滑动窗口记忆管理
- 基础参数调优
- 互动实验

### 📊 Note 2: 02-memory-optimization.ipynb
- 高级记忆策略
- 关键信息提取
- 三种策略性能对比
- 可视化分析
- 自定义实验

## 💡 Notebook优势

相比传统的Python文件，Notebook版本有以下优势：

1. **🔄 交互式学习**：可以逐个Cell运行，立即看到结果
2. **📊 可视化展示**：内置图表和统计分析
3. **🧝 实验友好**：方便修改参数、重复实验
4. **📝 文档结合**：代码、解释、结果在一个地方
5. **🎮 互动实验**：可以自定义实验内容

## 🎯 特色功能

### 📈 内置可视化
- Token使用对比图
- 响应时间分析
- 记忆策略效果对比
- 参数影响可视化

### 🧪 实验模块
- 不同Temperature效果测试
- 窗口大小优化实验
- 记忆策略对比
- 自定义对话测试

### 💾 数据保存
- 实验结果自动保存
- 性能指标记录
- 可导出实验报告

## 🔧 环境配置

### 必需依赖
```bash
pip install openai python-dotenv jupyter matplotlib pandas
```

### 可选依赖（用于高级功能）
```bash
pip install jupyterlab ipywidgets plotly seaborn
```

## 🎮 使用技巧

### 1. 逐步执行
- 按Shift+Enter执行当前Cell
- 按Ctrl+Enter执行但不跳转
- 按Alt+Enter执行并插入新Cell

### 2. 实验修改
- 修改代码后重新执行Cell
- 使用Kernel → Restart & Clear Output重置环境
- 可以保存实验状态供后续分析

### 3. 自定义实验
- 在互动实验区添加自己的代码
- 测试不同的对话场景
- 对比不同参数的效果

## 📝 学习建议

1. **先学习理论**：仔细阅读Markdown说明
2. **逐步执行代码**：理解每个部分的作用
3. **动手实验**：修改参数，观察效果变化
4. **对比分析**：运行不同的记忆策略对比
5. **记录发现**：在实验区记录你的发现

## 🚨 注意事项

1. **API密钥安全**：不要在Notebook中直接写入密钥
2. **Token消耗**：注意API调用的Token消耗
3. **保存工作**：定期保存Notebook文件
4. **环境重置**：遇到问题时重启Kernel

## 🎉 开始学习！

现在你可以：

1. 启动Jupyter Notebook或JupyterLab
2. 打开 `01-agent-basics.ipynb` 开始学习
3. 按照Notebook中的指引逐步学习
4. 完成后继续 `02-memory-optimization.ipynb`

祝你学习愉快！🚀

## 📈 完成标准

完成Notebook学习后，你应该能够：

- ✅ 理解Agent的三大核心能力
- ✅ 独立实现LLM API调用
- ✅ 掌握滑动窗口记忆管理
- ✅ 对比不同记忆策略的效果
- ✅ 优化Agent的参数设置
- ✅ 进行自主的实验和分析

完成第一阶段后，就可以进入第二阶段：工具调用！🔧