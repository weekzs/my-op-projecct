import os
import dotenv
from openai import OpenAI

# 加载环境变量
dotenv.load_dotenv()


class SlidingWindowMemory:
    """
    滑动窗口记忆管理
    只保留最近N轮对话，避免上下文过长
    """

    def __init__(self, window_size=5):
        """
        初始化记忆管理器
        Args:
            window_size (int): 保留的对话轮数，默认5轮
        """
        self.window_size = window_size
        # 初始化上下文，包含系统提示
        self.context = [
            {
                "role": "system",
                "content": "你是一个有记忆的友好助手，能够记住之前的对话内容。",
            }
        ]

    def update(self, role, content):
        """
        更新对话上下文
        Args:
            role (str): 角色 (user/assistant/system)
            content (str): 消息内容
        """
        self.context.append({"role": role, "content": content})

        # 超过窗口大小，删除最早的对话对
        # 系统消息(1) + N轮对话(2*N) = 总共 1 + 2*N 条消息
        max_messages = self.window_size * 2 + 1

        while len(self.context) > max_messages:
            # 删除最早的用户消息（索引1，因为索引0是system）
            if self.context[1]["role"] == "user":
                self.context.pop(1)
            # 删除对应的助手回复
            if self.context[1]["role"] == "assistant":
                self.context.pop(1)

    def get_context(self):
        """获取当前上下文"""
        return self.context.copy()

    def clear(self):
        """清空记忆（保留系统提示）"""
        self.context = [self.context[0]]  # 只保留系统消息

    def get_stats(self):
        """获取记忆统计信息"""
        user_msgs = sum(1 for msg in self.context if msg["role"] == "user")
        assistant_msgs = sum(1 for msg in self.context if msg["role"] == "assistant")
        total_tokens = sum(len(msg["content"]) for msg in self.context)

        return {
            "total_messages": len(self.context),
            "user_messages": user_msgs,
            "assistant_messages": assistant_msgs,
            "estimated_tokens": total_tokens,
        }


class MemoryChatAgent:
    """
    带记忆功能的对话助手
    使用滑动窗口策略管理对话历史
    """

    def __init__(self, window_size=5):
        """
        初始化记忆对话助手
        Args:
            window_size (int): 记忆窗口大小
        """
        self.client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY"), base_url=os.getenv("OPENAI_BASE_URL")
        )
        self.memory = SlidingWindowMemory(window_size)

    def chat(self, message):
        """
        进行对话，自动管理记忆
        Args:
            message (str): 用户消息
        Returns:
            str: 助手回复
        """
        try:
            # 1. 将用户消息添加到记忆中
            self.memory.update("user", message)

            # 2. 获取完整上下文并调用模型
            context = self.memory.get_context()
            response = self.client.chat.completions.create(
                model=os.getenv("MODEL_NAME", "qwen-max"),
                messages=context,
                temperature=0.3,
                max_tokens=500,
            )

            # 3. 将助手回复添加到记忆中
            assistant_msg = response.choices[0].message.content
            self.memory.update("assistant", assistant_msg)

            return assistant_msg

        except Exception as e:
            return f"抱歉，出错了：{str(e)}"

    def get_memory_stats(self):
        """获取记忆统计信息"""
        return self.memory.get_stats()

    def clear_memory(self):
        """清空记忆"""
        self.memory.clear()
        return "记忆已清空"


def main():
    """主函数 - 交互式对话"""
    print("🤖 记忆对话助手 (输入 'exit' 退出)")
    print("=" * 50)
    print("可用命令:")
    print("  /stats - 查看记忆统计")
    print("  /clear - 清空记忆")
    print("  /exit  - 退出程序")
    print("=" * 50)

    agent = MemoryChatAgent(window_size=5)

    while True:
        try:
            user_input = input("\n你: ").strip()

            if user_input.lower() in ["/exit", "exit", "退出", "quit"]:
                print("👋 再见！")
                break

            if user_input.lower() in ["/clear", "清空"]:
                print(agent.clear_memory())
                continue

            if user_input.lower() in ["/stats", "统计"]:
                stats = agent.get_memory_stats()
                print(f"📊 记忆统计:")
                print(f"  总消息数: {stats['total_messages']}")
                print(f"  用户消息: {stats['user_messages']}")
                print(f"  助手消息: {stats['assistant_messages']}")
                print(f"  估算Token: {stats['estimated_tokens']}")
                continue

            if not user_input:
                print("请输入一些内容...")
                continue

            print("助手正在思考...")
            response = agent.chat(user_input)
            print(f"助手: {response}")

        except KeyboardInterrupt:
            print("\n\n👋 再见！")
            break
        except Exception as e:
            print(f"❌ 发生错误: {e}")


if __name__ == "__main__":
    main()
