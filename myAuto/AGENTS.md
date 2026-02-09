# AGENTS.md - Agent Development Guidelines

This file contains guidelines for agentic coding agents working on the 凌一开发 project.

## Project Overview

A minimal Python desktop application for AI-powered subtitle summarization:
- Select subtitle files (.srt, .txt, .vtt, .ass)
- Generate structured Markdown summaries using DeepSeek API
- Modern GUI built with CustomTkinter
- Token-optimized with caching

## Quick Commands

### Environment Setup
```bash
# Activate conda environment
conda activate myAuto

# Install dependencies
pip install -r requirements.txt
```

### Running the Application
```bash
# Using batch script (Windows)
start.bat

# Using Python directly
python main.py
```

### Testing Imports
```bash
python -c "from src.config.settings import Settings; print('OK')"
python -c "from src.summarizer.ai_summarizer import AISummarizer; print('OK')"
python -c "from src.gui.app import App; print('OK')"
```

## Code Style Guidelines

### Import Organization
```python
import os
import sys
from pathlib import Path
from typing import Optional, Dict, Any

from openai import OpenAI
import customtkinter as ctk

from src.config.settings import Settings
from src.utils.logger import get_logger
```

### Formatting
- 4 spaces indentation
- Max line length: 100 characters
- Type hints where possible
- PEP 8 naming conventions

### Error Handling
```python
try:
    result = api_call()
    logger.info("Success")
except Exception as e:
    logger.error(f"Failed: {e}")
    raise
```

### Logging
```python
from src.utils.logger import get_logger
logger = get_logger()
logger.info("Message")
logger.error("Error message")
```

## Project Structure

```
myAuto/
├── src/
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py      # Configuration management
│   ├── gui/
│   │   ├── __init__.py
│   │   └── app.py           # CustomTkinter GUI
│   ├── summarizer/
│   │   ├── __init__.py
│   │   └── ai_summarizer.py # DeepSeek API integration
│   └── utils/
│       ├── __init__.py
│       └── logger.py        # Logging utility
├── data/
│   ├── summaries/           # Generated summaries
│   └── cache/               # API response cache
├── logs/                    # Application logs
├── main.py                  # Entry point
├── start.bat                # Windows launcher
├── requirements.txt         # Dependencies
├── .env                     # Configuration
└── README.md
```

## Key Components

### Settings (src/config/settings.py)
- Loads from config.json and environment variables
- GUI-configurable API key and model
- Validates required settings

### AISummarizer (src/summarizer/ai_summarizer.py)
- DeepSeek API integration
- Response caching for token optimization
- SRT file parsing

### App (src/gui/app.py)
- CustomTkinter-based modern GUI
- File selection dialog
- Settings dialog for API configuration
- Progress tracking and logging

## Important Notes

- Conda environment: `myAuto`
- API key configurable via GUI or .env file
- Caching reduces API costs
- All text files use UTF-8 encoding
