import os
import sys
from pathlib import Path

# Ensure server root is on sys.path for test discovery
SERVER_ROOT = Path(__file__).resolve().parent.parent
if str(SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVER_ROOT))
