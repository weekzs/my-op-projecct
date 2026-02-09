"""
Simple logging utility.
"""

import logging
import sys
from pathlib import Path
from datetime import datetime

_logger = None


def setup_logger(log_dir: Path = None) -> logging.Logger:
    """Setup and return the application logger."""
    global _logger

    if _logger is not None:
        return _logger

    _logger = logging.getLogger("SubtitleSummarizer")
    _logger.setLevel(logging.DEBUG)

    # Console handler
    console = logging.StreamHandler(sys.stdout)
    console.setLevel(logging.INFO)
    console.setFormatter(
        logging.Formatter(
            "%(asctime)s | %(levelname)-7s | %(message)s", datefmt="%H:%M:%S"
        )
    )
    _logger.addHandler(console)

    # File handler
    if log_dir:
        log_dir.mkdir(parents=True, exist_ok=True)
        log_file = log_dir / f"app_{datetime.now().strftime('%Y%m%d')}.log"
        file_handler = logging.FileHandler(log_file, encoding="utf-8")
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(
            logging.Formatter("%(asctime)s | %(levelname)-7s | %(name)s | %(message)s")
        )
        _logger.addHandler(file_handler)

    return _logger


def get_logger() -> logging.Logger:
    """Get the application logger."""
    global _logger
    if _logger is None:
        _logger = setup_logger()
    return _logger
