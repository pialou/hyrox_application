#!/usr/bin/env python3
"""
Script Template for Execution Layer

This template provides a standardized structure for execution scripts.
Copy and modify for new scripts.

Usage:
    python execution/script_name.py --input "value" --output ".tmp/result.json"

Author: [Your name]
Created: [Date]
"""

import argparse
import json
import logging
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def main(args: argparse.Namespace) -> dict:
    """
    Main function that performs the script's core logic.
    
    Args:
        args: Parsed command-line arguments
        
    Returns:
        dict: Result data to be output
    """
    logger.info(f"Starting script with input: {args.input}")
    
    # ===========================================
    # YOUR LOGIC HERE
    # ===========================================
    
    result = {
        "status": "success",
        "data": {
            "input_received": args.input,
            "message": "Replace this with actual processing"
        }
    }
    
    # ===========================================
    # END LOGIC
    # ===========================================
    
    return result


def save_output(data: dict, output_path: str) -> None:
    """Save result data to the specified output file."""
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    logger.info(f"Output saved to: {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="[Script description here]"
    )
    parser.add_argument(
        "--input", "-i",
        type=str,
        required=True,
        help="Input value or file path"
    )
    parser.add_argument(
        "--output", "-o",
        type=str,
        default=".tmp/output.json",
        help="Output file path (default: .tmp/output.json)"
    )
    
    args = parser.parse_args()
    
    try:
        result = main(args)
        save_output(result, args.output)
        print(json.dumps(result, indent=2))
        sys.exit(0)
    except Exception as e:
        logger.error(f"Script failed: {e}", exc_info=True)
        sys.exit(1)
