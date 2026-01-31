#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
配置 matplotlib 中文字体
在 notebook 中导入此模块即可自动配置中文字体
"""

import platform
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm

def setup_chinese_font():
    """配置 matplotlib 中文字体"""
    system = platform.system()
    
    if system == 'Windows':
        # Windows系统：优先使用 SimHei（黑体），备选 Microsoft YaHei（微软雅黑）
        plt.rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei', 'Microsoft JhengHei']
        print("✅ Windows 中文字体配置: SimHei, Microsoft YaHei")
    elif system == 'Darwin':  # macOS
        plt.rcParams['font.sans-serif'] = ['Arial Unicode MS', 'PingFang SC', 'STHeiti']
        print("✅ macOS 中文字体配置完成")
    else:  # Linux
        plt.rcParams['font.sans-serif'] = ['WenQuanYi Micro Hei', 'Noto Sans CJK SC']
        print("✅ Linux 中文字体配置完成")
    
    plt.rcParams['axes.unicode_minus'] = False  # 解决保存图像时负号'-'显示为方块的问题
    
    # 验证字体配置
    print(f"当前字体设置: {plt.rcParams['font.sans-serif']}")
    print("✅ 中文字体配置完成，现在可以正常显示中文了！")
    
    return True

# 自动执行配置
if __name__ == "__main__":
    setup_chinese_font()
else:
    # 在导入时自动配置
    setup_chinese_font()
