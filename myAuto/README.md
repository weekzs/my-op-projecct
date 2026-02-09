# 凌一开发

A minimal, modern AI-powered tool for summarizing video subtitles into structured study notes.

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## Features

- **Subtitle File Selection** - Support for .srt, .txt, .vtt, .ass formats
- **AI Summarization** - Generate structured Markdown notes using DeepSeek API
- **Token Optimization** - Response caching to minimize API costs
- **Modern GUI** - Clean, dark-themed interface built with CustomTkinter
- **Configurable** - Set API key and model directly in the GUI or via environment variables

## Screenshots

```
+--------------------------------------------------+
| 凌一开发 [Settings]|
+--------------------------------------------------+
|  [Select Subtitle Files]  No files selected      |
|                                                  |
|  [Generate Summary]  =========>  [Open Output]   |
|                                                  |
|  Output Log:                                     |
|  > Ready. Select subtitle files to begin.        |
|  > Selected 2 file(s)                            |
|  > Processing: video_subtitle.srt                |
|  > Summary saved: video_subtitle_summary.md      |
+--------------------------------------------------+
```

## Quick Start

### Requirements

- Python 3.8+
- Conda (recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/myAuto.git
cd myAuto

# Create and activate conda environment
conda create -n myAuto python=3.11 -y
conda activate myAuto

# Install dependencies
pip install -r requirements.txt
```

### Running

**Windows (Recommended)**
```bash
start.bat
```

**Manual**
```bash
conda activate myAuto
python main.py
```

## Configuration

### Method 1: GUI Settings (Recommended)

1. Launch the application
2. Click "Settings" button
3. Enter your API key and select model
4. Click "Save"

### Method 2: Environment Variables

Create or edit `.env` file:

```env
DEEPSEEK_API_KEY=your-api-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
```

### Supported API Providers

| Provider | Base URL | Models |
|----------|----------|--------|
| DeepSeek | `https://api.deepseek.com/v1` | deepseek-chat |
| OpenAI | `https://api.openai.com/v1` | gpt-4o-mini, gpt-4o |
| Custom | Any OpenAI-compatible endpoint | - |

## Usage

1. **Launch** - Run `start.bat` or `python main.py`
2. **Configure** - Set API key in Settings (first time only)
3. **Select Files** - Click "Select Subtitle Files" and choose .srt/.txt files
4. **Generate** - Click "Generate Summary" to process
5. **View Results** - Click "Open Output Folder" to see generated summaries

## Project Structure

```
myAuto/
├── src/
│   ├── config/
│   │   └── settings.py       # Configuration management
│   ├── gui/
│   │   └── app.py            # CustomTkinter GUI
│   ├── summarizer/
│   │   └── ai_summarizer.py  # AI summarization with caching
│   └── utils/
│       └── logger.py         # Logging utility
├── data/
│   ├── summaries/            # Generated Markdown summaries
│   └── cache/                # API response cache
├── logs/                     # Application logs
├── main.py                   # Entry point
├── start.bat                 # Windows launcher (conda myAuto)
├── requirements.txt          # Dependencies
├── .env                      # API configuration
├── .gitignore               # Git ignore rules
└── README.md
```

## Output Format

Generated summaries follow this Markdown structure:

```markdown
# Video Title

## Overview
Brief summary of the content...

## Key Knowledge Points

### 1. Topic Name
**Details:** Explanation...

**Q&A:**
- **Q:** Key question?
- **A:** Detailed answer...

## Key Insights
Important takeaways...

## Summary
Core learnings...
```

## Dependencies

```
openai>=1.0.0          # API client
customtkinter>=5.2.0   # Modern GUI
pillow>=10.0.0         # Image support
darkdetect>=0.8.0      # Theme detection
```

## Troubleshooting

**API Connection Failed**
- Verify API key is correct
- Check internet connection
- Test connection in Settings dialog

**No Files Selected**
- Ensure files have supported extensions (.srt, .txt, .vtt, .ass)
- Check file permissions

**Empty Summary**
- Verify subtitle file contains text content
- Check API response in logs

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built with CustomTkinter and DeepSeek API**
