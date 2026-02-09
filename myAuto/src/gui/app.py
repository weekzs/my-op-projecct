"""
现代化GUI应用 - 使用CustomTkinter
简洁、美观的字幕总结工具界面
"""

import os
import sys
import threading
import subprocess
from pathlib import Path
from tkinter import filedialog, messagebox
import customtkinter as ctk

from src.config.settings import Settings
from src.summarizer.ai_summarizer import AISummarizer
from src.utils.logger import get_logger, setup_logger


# 设置窗口背景色
ctk.set_appearance_mode("light")
ctk.set_default_color_theme("blue")


class App(ctk.CTk):
    """主应用窗口"""

    def __init__(self):
        super().__init__()

        # 初始化设置和日志
        self.settings = Settings()
        self.logger = setup_logger(self.settings.logs_dir)
        self.summarizer = AISummarizer(self.settings)

        # 窗口设置
        self.title(f"{Settings.APP_NAME} v{Settings.APP_VERSION}")
        self.geometry("900x700")
        self.minsize(800, 600)
        self.configure(fg_color="#edf2f7")  # 浅灰色背景

        # 状态
        self.selected_files: list[Path] = []
        self.is_processing = False

        # 构建界面
        self._create_ui()

        self.logger.info("应用程序已启动")

    def _create_ui(self):
        """创建用户界面"""
        # 配置网格
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        # 头部
        self._create_header()

        # 主内容区
        self._create_main_content()

        # 底部状态栏
        self._create_footer()

    def _create_header(self):
        """创建头部标题和设置按钮"""
        header = ctk.CTkFrame(self, fg_color="#f0f4f8", corner_radius=10)
        header.grid(row=0, column=0, sticky="ew", padx=20, pady=(20, 10))
        header.grid_columnconfigure(1, weight=1)

        # 标题
        title = ctk.CTkLabel(
            header,
            text="凌一开发",
            font=ctk.CTkFont(size=28, weight="bold"),
            text_color="#1a365d",
        )
        title.grid(row=0, column=0, sticky="w", padx=20, pady=(15, 5))

        # 设置按钮
        settings_btn = ctk.CTkButton(
            header,
            text="⚙️ 设置",
            width=100,
            command=self._open_settings,
            fg_color="#3182ce",
            hover_color="#2c5aa0",
        )
        settings_btn.grid(row=0, column=2, rowspan=2, padx=20)

    def _create_main_content(self):
        """创建主内容区域"""
        main = ctk.CTkFrame(self, fg_color="#ffffff", corner_radius=10)
        main.grid(row=1, column=0, sticky="nsew", padx=20, pady=10)
        main.grid_columnconfigure(0, weight=1)
        main.grid_rowconfigure(2, weight=1)

        # 文件选择区
        self._create_file_section(main)

        # 操作按钮区
        self._create_action_buttons(main)

        # 日志输出区
        self._create_log_section(main)

    def _create_file_section(self, parent):
        """创建文件选择区域"""
        frame = ctk.CTkFrame(parent, fg_color="transparent")
        frame.grid(row=0, column=0, sticky="ew", pady=10)
        frame.grid_columnconfigure(1, weight=1)

        # 选择文件按钮
        select_btn = ctk.CTkButton(
            frame,
            text="📂 选择字幕文件",
            width=180,
            height=40,
            font=ctk.CTkFont(size=14),
            command=self._select_files,
        )
        select_btn.grid(row=0, column=0, padx=(0, 10))

        # 已选文件标签
        self.files_label = ctk.CTkLabel(
            frame,
            text="未选择文件",
            font=ctk.CTkFont(size=13),
            text_color="#718096",
        )
        self.files_label.grid(row=0, column=1, sticky="w")

        # 清除按钮
        clear_btn = ctk.CTkButton(
            frame,
            text="✕",
            width=40,
            height=40,
            fg_color="transparent",
            hover_color="#e2e8f0",
            text_color="#718096",
            command=self._clear_files,
        )
        clear_btn.grid(row=0, column=2)

    def _create_action_buttons(self, parent):
        """创建操作按钮区域"""
        frame = ctk.CTkFrame(parent, fg_color="transparent")
        frame.grid(row=1, column=0, sticky="ew", pady=10)

        # 生成总结按钮
        self.summarize_btn = ctk.CTkButton(
            frame,
            text="🚀 生成总结",
            width=200,
            height=45,
            font=ctk.CTkFont(size=15, weight="bold"),
            command=self._start_summarize,
        )
        self.summarize_btn.pack(side="left", padx=(0, 10))

        # 进度条
        self.progress = ctk.CTkProgressBar(frame, width=300)
        self.progress.pack(side="left", padx=10)
        self.progress.set(0)

        # 打开输出目录按钮
        open_btn = ctk.CTkButton(
            frame,
            text="📁 打开输出目录",
            width=140,
            command=self._open_output_folder,
        )
        open_btn.pack(side="right", padx=(10, 0))

        # 打开日志按钮
        logs_btn = ctk.CTkButton(
            frame,
            text="📋 查看日志",
            width=100,
            fg_color="#718096",
            hover_color="#4a5568",
            command=self._open_logs_folder,
        )
        logs_btn.pack(side="right")

    def _create_log_section(self, parent):
        """创建日志输出区域"""
        frame = ctk.CTkFrame(parent, fg_color="#f7fafc", corner_radius=8)
        frame.grid(row=2, column=0, sticky="nsew", pady=10)
        frame.grid_columnconfigure(0, weight=1)
        frame.grid_rowconfigure(1, weight=1)

        # 标签
        label = ctk.CTkLabel(
            frame,
            text="运行日志",
            font=ctk.CTkFont(size=14, weight="bold"),
            text_color="#2d3748",
        )
        label.grid(row=0, column=0, sticky="w", padx=10, pady=(10, 5))

        # 文本框
        self.log_text = ctk.CTkTextbox(
            frame,
            font=ctk.CTkFont(family="Consolas", size=12),
            wrap="word",
            fg_color="#ffffff",
            text_color="#2d3748",
        )
        self.log_text.grid(row=1, column=0, sticky="nsew", padx=10, pady=(0, 10))

        self._log("就绪。请选择字幕文件开始处理。")

    def _create_footer(self):
        """创建底部状态栏"""
        footer = ctk.CTkFrame(self, fg_color="transparent", height=30)
        footer.grid(row=2, column=0, sticky="ew", padx=20, pady=(0, 10))

        self.status_label = ctk.CTkLabel(
            footer, text="就绪", font=ctk.CTkFont(size=12), text_color="#718096"
        )
        self.status_label.pack(side="left")

        # API状态指示器
        self.api_status = ctk.CTkLabel(
            footer,
            text="● API: 未配置",
            font=ctk.CTkFont(size=12),
            text_color="#ed8936",
        )
        self.api_status.pack(side="right")

        self._update_api_status()

    def _log(self, message: str):
        """添加日志消息"""
        self.log_text.insert("end", f"{message}\n")
        self.log_text.see("end")

    def _update_status(self, text: str):
        """更新状态栏"""
        self.status_label.configure(text=text)

    def _update_api_status(self):
        """更新API状态指示器"""
        if self.settings.api_key:
            self.api_status.configure(text="● API: 已配置", text_color="#48bb78")
        else:
            self.api_status.configure(text="● API: 未配置", text_color="#ed8936")

    def _select_files(self):
        """打开文件选择对话框"""
        files = filedialog.askopenfilenames(
            title="选择字幕文件",
            filetypes=[
                ("字幕文件", "*.srt *.txt *.vtt *.ass"),
                ("SRT字幕", "*.srt"),
                ("文本文件", "*.txt"),
                ("所有文件", "*.*"),
            ],
        )

        if files:
            self.selected_files = [Path(f) for f in files]
            count = len(self.selected_files)
            names = ", ".join(f.name for f in self.selected_files[:3])
            if count > 3:
                names += f" ... (还有{count - 3}个)"
            self.files_label.configure(
                text=f"已选择 {count} 个文件: {names}", text_color="#2d3748"
            )
            self._log(f"已选择 {count} 个文件")

    def _clear_files(self):
        """清除已选文件"""
        self.selected_files = []
        self.files_label.configure(text="未选择文件", text_color="#718096")

    def _start_summarize(self):
        """开始总结处理"""
        if not self.selected_files:
            messagebox.showwarning("提示", "请先选择字幕文件")
            return

        errors = self.settings.validate()
        if errors:
            messagebox.showerror("配置错误", "\n".join(errors))
            self._open_settings()
            return

        if self.is_processing:
            return

        self.is_processing = True
        self.summarize_btn.configure(state="disabled", text="处理中...")
        self.progress.set(0)

        # 在后台线程中运行
        thread = threading.Thread(target=self._process_files, daemon=True)
        thread.start()

    def _process_files(self):
        """后台处理文件"""
        total = len(self.selected_files)
        success = 0

        for i, file_path in enumerate(self.selected_files):
            self._log(f"\n[{i + 1}/{total}] 正在处理: {file_path.name}")
            self._update_status(f"处理中 {i + 1}/{total}...")

            result = self.summarizer.summarize_file(file_path)

            if result["success"]:
                success += 1
                self._log(f"✓ 总结已保存: {result['output_path'].name}")
            else:
                self._log(f"✗ 错误: {result['error']}")

            # 更新进度
            progress = (i + 1) / total
            self.after(0, lambda p=progress: self.progress.set(p))

        # 完成
        self._log(f"\n{'=' * 50}")
        self._log(f"处理完成: {success}/{total} 个文件成功")

        self.after(0, self._on_process_complete)

    def _on_process_complete(self):
        """处理完成回调"""
        self.is_processing = False
        self.summarize_btn.configure(state="normal", text="🚀 生成总结")
        self._update_status("就绪")
        messagebox.showinfo("完成", "总结生成完成！")

    def _open_output_folder(self):
        """打开输出目录"""
        path = self.settings.output_dir
        path.mkdir(parents=True, exist_ok=True)
        self._open_folder(path)

    def _open_logs_folder(self):
        """打开日志目录"""
        path = self.settings.logs_dir
        path.mkdir(parents=True, exist_ok=True)
        self._open_folder(path)

    def _open_folder(self, path: Path):
        """在文件管理器中打开目录"""
        try:
            if sys.platform == "win32":
                os.startfile(str(path))
            elif sys.platform == "darwin":
                subprocess.run(["open", str(path)])
            else:
                subprocess.run(["xdg-open", str(path)])
        except Exception as e:
            self._log(f"打开目录失败: {e}")

    def _open_settings(self):
        """打开设置对话框"""
        SettingsDialog(self, self.settings, self._on_settings_saved)

    def _on_settings_saved(self):
        """设置保存回调"""
        self._update_api_status()
        self._log("设置已更新")

    def run(self):
        """运行应用程序"""
        self.mainloop()


class SettingsDialog(ctk.CTkToplevel):
    """设置对话框"""

    def __init__(self, parent, settings: Settings, on_save_callback=None):
        super().__init__(parent)

        self.settings = settings
        self.on_save_callback = on_save_callback

        self.title("设置")
        self.geometry("550x520")
        self.resizable(False, False)
        self.configure(fg_color="#edf2f7")

        # 模态窗口
        self.transient(parent)
        self.grab_set()

        self._create_ui()

        # 居中显示
        self.update_idletasks()
        x = parent.winfo_x() + (parent.winfo_width() - self.winfo_width()) // 2
        y = parent.winfo_y() + (parent.winfo_height() - self.winfo_height()) // 2
        self.geometry(f"+{x}+{y}")

    def _create_ui(self):
        """创建设置界面"""
        self.grid_columnconfigure(0, weight=1)

        # 标题
        title = ctk.CTkLabel(
            self, text="⚙️ API 设置", font=ctk.CTkFont(size=20, weight="bold")
        )
        title.grid(row=0, column=0, pady=20)

        # 表单区域
        form = ctk.CTkFrame(self, fg_color="transparent")
        form.grid(row=1, column=0, sticky="ew", padx=30)
        form.grid_columnconfigure(1, weight=1)

        # API密钥
        ctk.CTkLabel(form, text="API 密钥:", font=ctk.CTkFont(size=13)).grid(
            row=0, column=0, sticky="w", pady=10
        )
        self.api_key_entry = ctk.CTkEntry(form, width=300, show="*")
        self.api_key_entry.grid(row=0, column=1, sticky="ew", pady=10)
        self.api_key_entry.insert(0, self.settings.api_key)

        # 显示/隐藏按钮
        self.show_key = ctk.CTkButton(
            form, text="👁", width=40, command=self._toggle_key_visibility
        )
        self.show_key.grid(row=0, column=2, padx=(5, 0))

        # API地址
        ctk.CTkLabel(form, text="API 地址:", font=ctk.CTkFont(size=13)).grid(
            row=1, column=0, sticky="w", pady=10
        )
        self.api_url_entry = ctk.CTkEntry(form, width=300)
        self.api_url_entry.grid(row=1, column=1, columnspan=2, sticky="ew", pady=10)
        self.api_url_entry.insert(0, self.settings.api_base_url)

        # 模型
        ctk.CTkLabel(form, text="模型:", font=ctk.CTkFont(size=13)).grid(
            row=2, column=0, sticky="w", pady=10
        )
        self.model_entry = ctk.CTkEntry(form, width=300)
        self.model_entry.grid(row=2, column=1, columnspan=2, sticky="ew", pady=10)
        self.model_entry.insert(0, self.settings.model)

        # 输出目录
        ctk.CTkLabel(form, text="输出目录:", font=ctk.CTkFont(size=13)).grid(
            row=3, column=0, sticky="w", pady=10
        )
        self.output_dir_entry = ctk.CTkEntry(form, width=250)
        self.output_dir_entry.grid(row=3, column=1, sticky="ew", pady=10)
        self.output_dir_entry.insert(0, str(self.settings.output_dir))

        # 浏览按钮
        browse_btn = ctk.CTkButton(
            form, text="📁", width=40, command=self._browse_output_dir
        )
        browse_btn.grid(row=3, column=2, padx=(5, 0))

        # 预设按钮
        presets = ctk.CTkFrame(form, fg_color="transparent")
        presets.grid(row=4, column=0, columnspan=3, pady=10)

        ctk.CTkLabel(presets, text="快速预设:", font=ctk.CTkFont(size=12)).pack(
            side="left", padx=(0, 10)
        )

        ctk.CTkButton(
            presets,
            text="DeepSeek",
            width=100,
            command=lambda: self._apply_preset("deepseek"),
        ).pack(side="left", padx=5)

        ctk.CTkButton(
            presets,
            text="OpenAI",
            width=100,
            command=lambda: self._apply_preset("openai"),
        ).pack(side="left", padx=5)

        # 测试连接按钮
        test_btn = ctk.CTkButton(
            self, text="🔌 测试连接", command=self._test_connection
        )
        test_btn.grid(row=2, column=0, pady=20)

        # 底部按钮
        btn_frame = ctk.CTkFrame(self, fg_color="transparent")
        btn_frame.grid(row=3, column=0, pady=20)

        ctk.CTkButton(btn_frame, text="保存", width=100, command=self._save).pack(
            side="left", padx=10
        )

        ctk.CTkButton(
            btn_frame,
            text="取消",
            width=100,
            fg_color="#718096",
            hover_color="#4a5568",
            command=self.destroy,
        ).pack(side="left", padx=10)

    def _toggle_key_visibility(self):
        """切换密钥可见性"""
        current = self.api_key_entry.cget("show")
        self.api_key_entry.configure(show="" if current else "*")

    def _browse_output_dir(self):
        """浏览选择输出目录"""
        directory = filedialog.askdirectory(
            title="选择输出目录", initialdir=str(self.settings.output_dir)
        )
        if directory:
            self.output_dir_entry.delete(0, "end")
            self.output_dir_entry.insert(0, directory)

    def _apply_preset(self, preset: str):
        """应用预设配置"""
        presets = {
            "deepseek": ("https://api.deepseek.com/v1", "deepseek-chat"),
            "openai": ("https://api.openai.com/v1", "gpt-4o-mini"),
        }

        if preset in presets:
            url, model = presets[preset]
            self.api_url_entry.delete(0, "end")
            self.api_url_entry.insert(0, url)
            self.model_entry.delete(0, "end")
            self.model_entry.insert(0, model)

    def _test_connection(self):
        """测试API连接"""
        # 临时更新设置
        self.settings.api_key = self.api_key_entry.get().strip()
        self.settings.api_base_url = self.api_url_entry.get().strip()
        self.settings.model = self.model_entry.get().strip()

        summarizer = AISummarizer(self.settings)

        if summarizer.test_connection():
            messagebox.showinfo("成功", "API连接成功！")
        else:
            messagebox.showerror("失败", "API连接失败，请检查设置。")

    def _save(self):
        """保存设置"""
        self.settings.api_key = self.api_key_entry.get().strip()
        self.settings.api_base_url = self.api_url_entry.get().strip()
        self.settings.model = self.model_entry.get().strip()

        # 保存输出目录
        output_dir = self.output_dir_entry.get().strip()
        if output_dir:
            self.settings.set_output_dir(output_dir)

        self.settings.save()

        if self.on_save_callback:
            self.on_save_callback()

        self.destroy()
