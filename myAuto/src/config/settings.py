"""
Configuration management module.
Handles application settings with GUI-configurable API key and model.
"""

import os
import json
from pathlib import Path
from typing import Any


class Settings:
    """Application settings with file persistence."""

    APP_NAME = "凌一开发"
    APP_VERSION = "2.0.0"

    def __init__(self):
        """Initialize settings."""
        self.base_dir = Path(__file__).parent.parent.parent
        self.data_dir = self.base_dir / "data"
        self.logs_dir = self.base_dir / "logs"
        self.output_dir = self.data_dir / "summaries"
        self.config_file = self.data_dir / "config.json"

        # Ensure directories exist
        for d in [self.data_dir, self.logs_dir, self.output_dir]:
            d.mkdir(parents=True, exist_ok=True)

        # Default configuration
        self._config = {
            "api_key": "",
            "api_base_url": "https://api.deepseek.com/v1",
            "model": "deepseek-chat",
            "temperature": 0.3,
            "language": "zh-CN",
            "chunk_size": 10000,  # Large chunks to minimize API calls
            "output_dir": str(self.output_dir),  # Custom output directory
        }

        # Load saved config
        self._load()

        # Environment variables override (highest priority)
        self._load_env()

    def _load(self):
        """Load config from file."""
        if self.config_file.exists():
            try:
                with open(self.config_file, "r", encoding="utf-8") as f:
                    saved = json.load(f)
                    self._config.update(saved)
                    # Update output_dir if custom path is set
                    if "output_dir" in saved:
                        self.output_dir = Path(saved["output_dir"])
            except Exception:
                pass

    def _load_env(self):
        """Load from environment variables."""
        env_map = {
            "DEEPSEEK_API_KEY": "api_key",
            "DEEPSEEK_BASE_URL": "api_base_url",
            "DEEPSEEK_MODEL": "model",
        }
        for env_key, config_key in env_map.items():
            val = os.environ.get(env_key)
            if val:
                self._config[config_key] = val

    def save(self):
        """Save config to file."""
        try:
            with open(self.config_file, "w", encoding="utf-8") as f:
                json.dump(self._config, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Failed to save config: {e}")

    def get(self, key: str, default: Any = None) -> Any:
        """Get config value."""
        return self._config.get(key, default)

    def set(self, key: str, value: Any):
        """Set config value."""
        self._config[key] = value

    @property
    def api_key(self) -> str:
        return self._config.get("api_key", "")

    @api_key.setter
    def api_key(self, value: str):
        self._config["api_key"] = value

    @property
    def api_base_url(self) -> str:
        return self._config.get("api_base_url", "")

    @api_base_url.setter
    def api_base_url(self, value: str):
        self._config["api_base_url"] = value

    @property
    def model(self) -> str:
        return self._config.get("model", "")

    @model.setter
    def model(self, value: str):
        self._config["model"] = value

    @property
    def temperature(self) -> float:
        return self._config.get("temperature", 0.3)

    @property
    def language(self) -> str:
        return self._config.get("language", "zh-CN")

    @property
    def chunk_size(self) -> int:
        return self._config.get("chunk_size", 10000)

    def set_output_dir(self, path: str):
        """Set custom output directory."""
        self.output_dir = Path(path)
        self._config["output_dir"] = str(path)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def validate(self) -> list:
        """Validate required settings."""
        errors = []
        if not self.api_key:
            errors.append("API密钥未配置，请在设置中配置。")
        return errors

    def get_summary_prompt(self) -> str:
        """Get the AI summary prompt template."""
        return """请将以下视频字幕/转录文本总结成一篇详细的学习笔记。

要求：
1. 只提取有价值的学习内容、知识点、技术要点
2. 忽略闲聊、广告、无关内容
3. 使用Markdown格式，结构清晰
4. 对重要知识点包含"Q&A"帮助理解

格式：

# 📚 [主题标题]

## 📖 内容概述
[2-3句话概括主要内容]

## 🎯 核心知识点

### 1. [知识点名称]
**说明：** [详细解释]

**Q&A：**
- **Q:** [关键问题]
- **A:** [详细回答]

### 2. [知识点名称]
...

## 💡 关键见解
[重要见解和思考]

## 📝 总结
[核心收获要点]

---

文本内容：
{text}
"""
