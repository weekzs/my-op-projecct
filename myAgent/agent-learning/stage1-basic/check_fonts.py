#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查系统中可用的中文字体
"""

import matplotlib.font_manager as fm
import platform

print("=" * 60)
print("检查系统中可用的中文字体")
print("=" * 60)

# 获取所有字体
all_fonts = [f.name for f in fm.fontManager.ttflist]
all_fonts = sorted(set(all_fonts))

# 常见中文字体关键词
chinese_keywords = ['SimHei', 'YaHei', 'Microsoft', '黑体', '宋体', '楷体', '微软', 
                    'PingFang', 'Arial Unicode', 'WenQuanYi', 'Noto Sans CJK']

# 查找中文字体
chinese_fonts = []
for font in all_fonts:
    for keyword in chinese_keywords:
        if keyword in font:
            chinese_fonts.append(font)
            break

print(f"\n系统: {platform.system()}")
print(f"\n找到 {len(chinese_fonts)} 个可能的中文字体:\n")
for i, font in enumerate(sorted(set(chinese_fonts)), 1):
    print(f"{i}. {font}")

# 推荐字体
print("\n" + "=" * 60)
print("推荐使用的字体:")
print("=" * 60)

system = platform.system()
if system == 'Windows':
    recommended = ['SimHei', 'Microsoft YaHei', 'Microsoft YaHei UI']
elif system == 'Darwin':
    recommended = ['Arial Unicode MS', 'PingFang SC', 'STHeiti']
else:
    recommended = ['WenQuanYi Micro Hei', 'Noto Sans CJK SC']

for font in recommended:
    if font in all_fonts:
        print(f"✅ {font} - 可用")
    else:
        print(f"❌ {font} - 不可用")

print("\n" + "=" * 60)
print("所有可用字体列表（前20个）:")
print("=" * 60)
for i, font in enumerate(all_fonts[:20], 1):
    print(f"{i}. {font}")
