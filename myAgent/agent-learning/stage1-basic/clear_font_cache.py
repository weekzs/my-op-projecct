#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
清除 matplotlib 字体缓存
如果字体配置不生效，可以运行此脚本清除缓存
"""

import matplotlib.font_manager as fm
import os

print("=" * 60)
print("清除 matplotlib 字体缓存")
print("=" * 60)

try:
    # 清除字体缓存
    print("正在清除字体缓存...")
    fm._rebuild()
    print("✅ 字体缓存已清除！")
    print("\n请重新运行字体配置代码，然后重启 kernel。")
except Exception as e:
    print(f"❌ 清除缓存时出错: {e}")
    print("\n可以尝试手动删除缓存目录:")
    cache_dir = fm.get_cachedir()
    print(f"缓存目录: {cache_dir}")

print("\n" + "=" * 60)
print("完成！")
print("=" * 60)
