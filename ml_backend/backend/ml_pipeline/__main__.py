"""CLI runner: python -m ml_pipeline [input.json]"""
import json
import sys
import time
from pathlib import Path

from ml_pipeline.controller.resume_controller import handle_request

if len(sys.argv) > 1:
    raw = Path(sys.argv[1]).read_text(encoding="utf-8")
else:
    raw = sys.stdin.read()

data = json.loads(raw)

print("Step 1: Extracting skills from job description...", file=sys.stderr)
output = handle_request(data)
print("Step 2: Resume rewrite complete.", file=sys.stderr)

out_dir = Path(__file__).resolve().parent / "outputs"
out_dir.mkdir(exist_ok=True)
out_path = out_dir / f"resume_{int(time.time() * 1000)}.json"
out_path.write_text(json.dumps(output, indent=2), encoding="utf-8")
print(f"Output saved to {out_path}", file=sys.stderr)

print(json.dumps(output))
