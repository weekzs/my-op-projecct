# 导入操作系统相关模块，用于路径、环境变量等操作
import os
# 导入sys模块，用于操作Python环境
import sys
# 导入dotenv模块，便于加载.env环境变量
import dotenv

# 将项目根目录添加到Python的模块查找路径中，便于导入项目内部模块
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 从simple_chat.py中导入SimpleChatAgent类（基础对话代理）
from simple_chat import SimpleChatAgent
# 从memory_chat.py中导入MemoryChatAgent类（带记忆功能的对话代理）
from memory_chat import MemoryChatAgent


def demo_basic_usage():
    """
    演示基础使用方法。
    本demo示例会自动调用OpenAI API（需要联网和有效API Key），
    以展示无记忆/有记忆对话代理的行为差异和调用流程。
    
    具体流程如下：
    1. 从.env文件加载OPENAI_API_KEY环境变量。
    2. 创建SimpleChatAgent和MemoryChatAgent实例（内部集成api调用）。
    3. 循环向agent对象调用 .chat(question)，每次调用都会自动发起API请求给OpenAI。
    4. 展示无记忆/有记忆情况下API回复的差异。
    5. 最后获取并展示记忆Agent的内部统计（如已缓存的消息条数）。
    """

    print("🎯 Agent基础功能演示")
    print("=" * 50)

    # 步骤1：加载API_KEY
    dotenv.load_dotenv()
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ 请先配置.env文件中的OPENAI_API_KEY")
        print("📝 参考.env.example文件进行配置")
        return

    # 步骤2：演示无记忆助手（每轮chat都会发起API调用，不会用历史上下文）
    print("\n1️⃣ 简单对话助手演示")
    print("-" * 30)
    simple_agent = SimpleChatAgent()

    test_questions = [
        "你好！",
        "我是奥特曼",
        "你知道我叫什么名字吗？",  # 预期API只能根据这次输入直接作答，无法“记忆”
    ]

    print("（下面每问一次，都会发起一次API调用，可能产生延迟或计费）")
    for i, question in enumerate(test_questions, 1):
        print(f"问题{i}: {question}")
        try:
            response = simple_agent.chat(question)  # 此处会发起API远程请求
            print(f"回答{i}: {response}")
            print()
        except Exception as e:
            print(f"错误: {e}")

    print("🔍 观察：简单助手无法记住之前的对话内容（每次都只用当前输入调用API）")
    print("\n" + "=" * 50 + "\n")

    # 步骤3：演示有记忆的Agent（API调用时会带上有限历史上下文）
    print("2️⃣ 记忆对话助手演示")
    print("-" * 30)
    memory_agent = MemoryChatAgent(window_size=3)
    print("（每一次chat 也会调用API，但本地会话窗口保存有限历史消息）")
    for i, question in enumerate(test_questions, 1):
        print(f"问题{i}: {question}")
        try:
            response = memory_agent.chat(question)  # 发起API调用，带记忆窗口
            print(f"回答{i}: {response}")
            print()
        except Exception as e:
            print(f"错误: {e}")

    print("🔍 观察：记忆助手能够记住之前的对话内容（API调用时包含历史消息）")

    # 步骤4：记忆窗口的统计信息（不会再额外请求API）
    print("\n📊 记忆统计信息:")
    stats = memory_agent.get_memory_stats()
    for key, value in stats.items():
        print(f"  {key}: {value}")


def demo_window_size_comparison():
    """演示不同窗口大小的效果"""
    # 打印窗口对比演示标题
    print("\n🔄 窗口大小对比演示")
    # 打印分隔线
    print("=" * 50)

    # 定义一组较长的对话，用于测试记忆窗口大小的影响
    long_conversation = [
        "我叫小明",
        "我住在上海",
        "我是一名程序员",
        "我喜欢编程",
        "我也喜欢音乐",
        "我问你，我叫什么名字？",  # 这时小窗口可能已经忘记名字了
        "我住在哪里？",  # 这时小窗口可能忘记地址了
    ]

    # 设定要进行对比测试的不同窗口大小
    window_sizes = [2, 5]

    # 分别用不同窗口大小进行测试
    for window_size in window_sizes:
        # 打印本轮测试窗口大小
        print(f"\n📏 窗口大小: {window_size}")
        print("-" * 30)

        # 实例化记忆对话代理，传入当前的窗口大小
        agent = MemoryChatAgent(window_size=window_size)

        # 循环进行每一步对话
        for i, question in enumerate(long_conversation, 1):
            # 打印本轮对话内容
            print(f"对话{i}: {question}")
            # 向代理发送当前问题，拿到回复
            response = agent.chat(question)
            # 打印部分回复（防止回复过长，最多显示50个字符）
            print(f"回答{i}: {response[:50]}{'...' if len(response) > 50 else ''}")

            # 如果本轮为关于姓名或住址的问题，则查看当前记忆中的消息数量
            if "名字" in question or "住" in question:
                stats = agent.get_memory_stats()
                print(f"   (当前记忆消息数: {stats['total_messages']})")
        # 每种窗口大小后换行分隔
        print()


def test_api_connection():
    """测试API连接"""
    print("🔌 API连接测试")
    print("=" * 30)

    # 加载.env文件
    dotenv.load_dotenv()

    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL")
    model_name = os.getenv("MODEL_NAME") or os.getenv("OPENAI_MODEL") or "gpt-3.5-turbo"

    print(f"API Key: {'✅ 已配置' if api_key else '❌ 未配置'}")
    print(f"Base URL: {base_url or 'https://api.openai.com/v1'}")
    print(f"Model: {model_name}")

    if not api_key:
        print("❌ 请先配置API密钥")
        return

    try:
        # 明确指定模型名称（如simple_chat.py支持传参，否则可移除model_name参数）
        agent = SimpleChatAgent(model=model_name) if "model" in SimpleChatAgent.__init__.__code__.co_varnames else SimpleChatAgent()
        response = agent.chat("测试连接，请回复'连接成功'")
        print(f"✅ 连接成功: {response}")
    except Exception as e:
        print(f"❌ 连接失败: {e}")


# 只有当本文件作为主程序执行时才会运行以下代码
if __name__ == "__main__":
    # 打印主程序标题和分隔线
    print("🎓 Agent学习项目 - 第一阶段示例")
    print("=" * 60)

    # 检查（并打印）环境变量和API接口连接情况
    test_api_connection()

    # 打印一个输出分隔区
    print("\n" + "=" * 60)

    # 提示用户选择将要运行的演示
    print("\n请选择要运行的演示:")
    print("1. 基础使用演示")
    print("2. 窗口大小对比演示")
    print("3. 全部演示")

    # 从用户输入中获取选择内容，去除前后空格
    choice = input("\n请输入选择 (1/2/3): ").strip()

    # 根据用户选择运行不同演示函数
    if choice == "1":
        demo_basic_usage()
    elif choice == "2":
        demo_window_size_comparison()
    elif choice == "3":
        demo_basic_usage()
        demo_window_size_comparison()
    else:
        # 当输入无效时，默认运行基础演示
        print("❌ 无效选择，运行基础演示")
        demo_basic_usage()

    # 打印演示结束提示
    print("\n🎉 演示完成！")
    print("💡 提示：可以运行 simple_chat.py 或 memory_chat.py 进行交互式对话")
