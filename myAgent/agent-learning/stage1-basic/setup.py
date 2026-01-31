#!/usr/bin/env python3
"""
快速环境设置脚本
用于配置第一阶段的开发环境
"""

import os
import sys
import subprocess


def install_requirements():
    """安装依赖包"""
    print("📦 正在安装依赖包...")
    try:
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"]
        )
        print("✅ 依赖包安装成功")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ 依赖包安装失败: {e}")
        return False


def setup_env_file():
    """设置环境变量文件"""
    env_file = ".env"
    env_example = ".env.example"

    if os.path.exists(env_file):
        print("✅ .env文件已存在")
        return True

    if not os.path.exists(env_example):
        print("❌ .env.example文件不存在")
        return False

    try:
        with open(env_example, "r", encoding="utf-8") as f:
            content = f.read()

        with open(env_file, "w", encoding="utf-8") as f:
            f.write(content)

        print("✅ 已创建.env文件")
        print("⚠️  请编辑.env文件，填入你的API密钥")
        return True
    except Exception as e:
        print(f"❌ 创建.env文件失败: {e}")
        return False


def print_setup_guide():
    """打印设置指南"""
    print("\n" + "=" * 60)
    print("🎯 第一阶段环境设置完成！")
    print("=" * 60)
    print("\n📝 接下来的步骤：")
    print("1. 编辑 .env 文件，填入你的API密钥")
    print("2. 运行测试: python examples/demo.py")
    print("3. 开始学习: 阅读 README.md")
    print("\n💡 推荐的API服务：")
    print("• 通义千问: https://dashscope.aliyuncs.com")
    print("• DeepSeek: https://platform.deepseek.com")
    print("• OpenAI: https://openai.com")
    print("\n📚 学习顺序：")
    print("1. 运行 demo.py 了解功能")
    print("2. 运行 simple_chat.py 体验基础对话")
    print("3. 运行 memory_chat.py 体验记忆对话")
    print("4. 查看源码理解实现原理")
    print("\n🎉 开始你的Agent学习之旅吧！")


def main():
    """主函数"""
    print("🚀 Agent学习项目 - 第一阶段环境设置")
    print("=" * 50)

    # 检查Python版本
    if sys.version_info < (3, 8):
        print("❌ 需要Python 3.8或更高版本")
        return

    print(f"✅ Python版本: {sys.version}")

    # 安装依赖
    if not install_requirements():
        return

    # 设置环境变量文件
    if not setup_env_file():
        return

    # 打印设置指南
    print_setup_guide()


if __name__ == "__main__":
    main()
