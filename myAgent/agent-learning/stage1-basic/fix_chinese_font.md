# 解决 matplotlib 中文显示问题

## 问题描述
matplotlib 在显示中文时出现警告：
```
UserWarning: Glyph 31616 (\N{CJK UNIFIED IDEOGRAPH-7B80}) missing from font(s) DejaVu Sans.
```

## 解决方案

### 方法1：在 Notebook 中配置（推荐）

在绘图代码之前，运行以下代码：

```python
import matplotlib.pyplot as plt
import platform

# 配置中文字体
system = platform.system()
if system == 'Windows':
    plt.rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei']
elif system == 'Darwin':  # macOS
    plt.rcParams['font.sans-serif'] = ['Arial Unicode MS', 'PingFang SC']
else:  # Linux
    plt.rcParams['font.sans-serif'] = ['WenQuanYi Micro Hei', 'Noto Sans CJK SC']

plt.rcParams['axes.unicode_minus'] = False  # 解决负号显示问题
```

### 方法2：清除字体缓存

如果方法1不起作用，可以尝试清除 matplotlib 的字体缓存：

```python
import matplotlib.font_manager as fm
fm._rebuild()  # 清除字体缓存
```

然后重新运行字体配置代码。

### 方法3：重启 Kernel

1. 在 Jupyter Notebook 中，点击 `Kernel` -> `Restart & Clear Output`
2. 重新运行所有 cell（按顺序执行）

### 方法4：使用系统字体检查脚本

运行 `check_fonts.py` 检查系统中可用的中文字体：

```bash
python check_fonts.py
```

## 验证字体配置

运行以下代码验证字体是否配置成功：

```python
import matplotlib.pyplot as plt
print("当前字体设置:", plt.rcParams['font.sans-serif'])

# 测试中文显示
import matplotlib.pyplot as plt
plt.figure(figsize=(6, 4))
plt.text(0.5, 0.5, '测试中文显示：简单助手 vs 记忆助手', 
         ha='center', va='center', fontsize=14)
plt.title('中文字体测试')
plt.axis('off')
plt.show()
```

如果图表中能正常显示中文，说明配置成功！

## 注意事项

1. **执行顺序很重要**：字体配置必须在绘图代码之前执行
2. **重启 Kernel**：如果修改了字体配置，建议重启 Kernel 后重新运行
3. **字体名称**：确保使用的字体名称与系统中实际安装的字体名称一致

## 常见问题

### Q: 配置后仍然出现警告？
A: 尝试清除字体缓存：`import matplotlib.font_manager as fm; fm._rebuild()`

### Q: 图表中中文显示为方块？
A: 检查字体名称是否正确，可以使用 `check_fonts.py` 查看可用字体

### Q: 重启 Kernel 后配置失效？
A: 将字体配置代码放在 notebook 的开头，确保每次运行都执行
