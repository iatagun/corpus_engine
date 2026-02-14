
import json
import sys

try:
    with open('debug_api_error.log', 'rb') as f:
        content = f.read().decode('utf-16le', 'ignore')

    start_marker = 'FULL ERROR DETAILS:'
    start_pos = content.find(start_marker)
    
    if start_pos == -1:
        print("Marker not found")
        sys.exit(1)

    json_start = content.find('{', start_pos)
    brace_count = 0
    json_end = -1
    
    for i, char in enumerate(content[json_start:]):
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0:
                json_end = json_start + i + 1
                break
    
    json_str = content[json_start:json_end]
    error_obj = json.loads(json_str)
    
    print("Top Level Keys:", list(error_obj.keys()))
    
    if 'meta' in error_obj:
        print("Meta Dump:")
        print(json.dumps(error_obj['meta'], indent=2)[:2000])

except Exception as e:
    print(f"Error: {e}")
