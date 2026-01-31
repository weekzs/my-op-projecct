import os
import dotenv
from openai import OpenAI

# 加载环境变量
dotenv.load_dotenv()


class SimpleChatAgent:
    """
    最简单的对话助手
    每次对话都是独立的，没有记忆功能
    """

    def __init__(self):
        """初始化客户端"""
        self.client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY"), base_url=os.getenv("OPENAI_BASE_URL")
        )

    def chat(self, message):
        """
        进行对话
        Args:
            message (str): 用户消息
        Returns:
            str: 助手回复
        """
        try:
            response = self.client.chat.completions.create(
                model=os.getenv("MODEL_NAME", "qwen-max"),  # 默认使用qwen-max
                messages=[
                    {"role": "system", "content": "你是一个友好的助手"},
                    {"role": "user", "content": message},
                ],
                temperature=0.3,  # 降低随机性，让回复更稳定
                max_tokens=500,  # 限制回复长度
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"抱歉，出错了：{str(e)}"


def main():
    """主函数 - 交互式对话"""
    print("🤖 简单对话助手 (输入 'exit' 退出)")
    print("=" * 50)

    agent = SimpleChatAgent()

    while True:
        try:
            user_input = input("\n你: ").strip()

            if user_input.lower() in ["exit", "退出", "quit"]:
                print("👋 再见！")
                break

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
