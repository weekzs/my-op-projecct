#!/usr/bin/env python3
"""
凌一开发 - AI-powered video subtitle summarization tool.

A minimal, modern application for:
- Selecting subtitle files (.srt, .txt, .vtt)
- Generating AI-powered summaries using DeepSeek API
- Saving structured Markdown notes

Author: OpenCode Assistant
Version: 2.0.0
"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from src.gui.app import App


def main():
    """Application entry point."""
    try:
        app = App()
        app.run()
    except Exception as e:
        print(f"Error: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
