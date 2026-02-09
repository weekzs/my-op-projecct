"""
AI Summarizer module.
Handles subtitle text summarization using DeepSeek API.
Optimized for minimal token usage with caching and efficient chunking.
"""

import time
import hashlib
import json
from pathlib import Path
from typing import Optional, Dict, Any
from openai import OpenAI

from src.utils.logger import get_logger
from src.config.settings import Settings


class AISummarizer:
    """AI-powered text summarizer with token optimization."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.client: Optional[OpenAI] = None
        self._cache_dir = settings.data_dir / "cache"
        self._cache_dir.mkdir(parents=True, exist_ok=True)
        self.logger = get_logger()

    def _init_client(self) -> bool:
        """Initialize OpenAI client."""
        if not self.settings.api_key:
            self.logger.error("API key not configured")
            return False

        try:
            self.client = OpenAI(
                api_key=self.settings.api_key,
                base_url=self.settings.api_base_url,
            )
            return True
        except Exception as e:
            self.logger.error(f"Failed to initialize API client: {e}")
            return False

    def _get_cache_key(self, text: str) -> str:
        """Generate cache key from text content."""
        return hashlib.md5(text.encode()).hexdigest()

    def _get_cached(self, cache_key: str) -> Optional[str]:
        """Get cached summary if exists."""
        cache_file = self._cache_dir / f"{cache_key}.json"
        if cache_file.exists():
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.logger.info("Using cached summary")
                    return data.get("summary")
            except Exception:
                pass
        return None

    def _save_cache(self, cache_key: str, summary: str):
        """Save summary to cache."""
        cache_file = self._cache_dir / f"{cache_key}.json"
        try:
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump({"summary": summary, "timestamp": time.time()}, f)
        except Exception:
            pass

    def summarize(self, text: str, title: str = "") -> Dict[str, Any]:
        """
        Summarize text content.

        Args:
            text: The subtitle/transcript text to summarize
            title: Optional title for context

        Returns:
            Dict with success status, summary, and metadata
        """
        result = {
            "success": False,
            "summary": "",
            "error": None,
            "tokens_used": 0,
            "cached": False,
            "processing_time": 0,
        }

        start_time = time.time()

        # Check cache first (token optimization)
        cache_key = self._get_cache_key(text)
        cached = self._get_cached(cache_key)
        if cached:
            result["success"] = True
            result["summary"] = cached
            result["cached"] = True
            result["processing_time"] = time.time() - start_time
            return result

        # Initialize client
        if not self.client and not self._init_client():
            result["error"] = "Failed to initialize API client"
            return result

        try:
            # Prepare prompt with text
            prompt = self.settings.get_summary_prompt().format(text=text)

            # Add title context if provided
            if title:
                prompt = f"视频标题: {title}\n\n{prompt}"

            self.logger.info(f"Sending request to API (text length: {len(text)} chars)")

            # Make API call with optimized parameters
            response = self.client.chat.completions.create(
                model=self.settings.model,
                messages=[
                    {
                        "role": "system",
                        "content": "你是一个专业的学习笔记生成助手，能够将视频字幕转换为结构化的学习笔记。请直接输出笔记内容，不要有多余的开场白。",
                    },
                    {"role": "user", "content": prompt},
                ],
                max_tokens=4000,
                temperature=self.settings.temperature,
            )

            if response.choices:
                summary = response.choices[0].message.content.strip()
                result["success"] = True
                result["summary"] = summary
                result["tokens_used"] = (
                    response.usage.total_tokens if response.usage else 0
                )

                # Cache the result
                self._save_cache(cache_key, summary)

                self.logger.info(
                    f"Summary generated successfully (tokens: {result['tokens_used']})"
                )
            else:
                result["error"] = "Empty response from API"

        except Exception as e:
            result["error"] = str(e)
            self.logger.error(f"API call failed: {e}")

        result["processing_time"] = time.time() - start_time
        return result

    def summarize_file(
        self, file_path: Path, output_dir: Path = None
    ) -> Dict[str, Any]:
        """
        Summarize a subtitle file and save the result.

        Args:
            file_path: Path to the subtitle file (.srt, .txt, etc.)
            output_dir: Directory to save the summary (default: settings.output_dir)

        Returns:
            Dict with success status and output path
        """
        result = {
            "success": False,
            "output_path": None,
            "error": None,
        }

        if not file_path.exists():
            result["error"] = f"File not found: {file_path}"
            return result

        # Read file content
        try:
            text = self._read_subtitle_file(file_path)
        except Exception as e:
            result["error"] = f"Failed to read file: {e}"
            return result

        if not text.strip():
            result["error"] = "File is empty"
            return result

        # Get title from filename
        title = file_path.stem

        # Summarize
        summary_result = self.summarize(text, title)

        if not summary_result["success"]:
            result["error"] = summary_result["error"]
            return result

        # Save summary
        output_dir = output_dir or self.settings.output_dir
        output_dir.mkdir(parents=True, exist_ok=True)

        timestamp = time.strftime("%Y%m%d_%H%M%S")
        output_file = output_dir / f"{title}_summary_{timestamp}.md"

        try:
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(summary_result["summary"])

            result["success"] = True
            result["output_path"] = output_file
            self.logger.info(f"Summary saved to: {output_file}")

        except Exception as e:
            result["error"] = f"Failed to save summary: {e}"

        return result

    def _read_subtitle_file(self, file_path: Path) -> str:
        """Read and clean subtitle file content."""
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # If it's an SRT file, extract just the text
        if file_path.suffix.lower() == ".srt":
            return self._parse_srt(content)

        return content

    def _parse_srt(self, content: str) -> str:
        """Parse SRT format and extract text only."""
        lines = content.strip().split("\n")
        text_lines = []

        i = 0
        while i < len(lines):
            line = lines[i].strip()

            # Skip sequence numbers
            if line.isdigit():
                i += 1
                continue

            # Skip timestamp lines
            if "-->" in line:
                i += 1
                continue

            # Skip empty lines
            if not line:
                i += 1
                continue

            # This is actual subtitle text
            text_lines.append(line)
            i += 1

        return "\n".join(text_lines)

    def test_connection(self) -> bool:
        """Test API connection."""
        if not self._init_client():
            return False

        try:
            response = self.client.chat.completions.create(
                model=self.settings.model,
                messages=[{"role": "user", "content": "Hi"}],
                max_tokens=5,
            )
            return bool(response.choices)
        except Exception as e:
            self.logger.error(f"Connection test failed: {e}")
            return False
