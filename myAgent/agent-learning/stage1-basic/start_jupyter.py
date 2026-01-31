# 🚀 快速启动Jupyter Notebook

print("🎯 Agent学习项目 - Jupyter版本")
print("=" * 50)

# 安装必要的依赖
import subprocess
import sys


def install_jupyter():
    """安装Jupyter和相关包"""
    packages = [
        "jupyter",
        "matplotlib",
        "pandas",
        "notebook",
        "ipywidgets",  # 交互式组件
    ]

    for package in packages:
        try:
            print(f"📦 安装 {package}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"✅ {package} 安装成功")
        except subprocess.CalledProcessError as e:
            print(f"❌ {package} 安装失败: {e}")


# 检查是否已安装
try:
    import jupyter

    print("✅ Jupyter已安装")
except ImportError:
    print("📦 正在安装Jupyter...")
    install_jupyter()

# 启动选项
print("\n🚀 启动选项:")
print("1. 启动Jupyter Notebook (经典版)")
print("2. 启动JupyterLab (推荐)")
print("3. 仅打开特定Notebook")

# 自动启动推荐选项
print("\n💡 自动启动JupyterLab...")
try:
    subprocess.run([sys.executable, "-m", "jupyter", "lab", "--no-browser"], check=True)
except:
    print("如果自动启动失败，请手动运行:")
    print("jupyter lab")
