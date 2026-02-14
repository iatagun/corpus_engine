
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

    # Find the starting brace of the JSON
    json_start = content.find('{', start_pos)
    if json_start == -1:
        print("JSON start not found")
        sys.exit(1)

    # Simple brace counting to extract the JSON object
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
    
    if json_end == -1:
        print("JSON end not found or malformed")
        # Fallback: try to grab a chunk and see if it's parsable or just print it
        chunk = content[json_start:json_start+2000]
        print("RAW CHUNK (partial):", chunk[:500].replace('\n', ' '))
        sys.exit(1)

    json_str = content[json_start:json_end]
    
    try:
        error_obj = json.loads(json_str)
        
        # Navigate availability of error details
        # Structure usually: error -> meta -> body -> error -> root_cause
        meta = error_obj.get('meta', {})
        body = meta.get('body', {})
        root_error = body.get('error', {})
        
        print("--- PARSED ERROR DETAILS ---")
        if 'type' in root_error:
            print(f"Error Type: {root_error.get('type')}")
        if 'reason' in root_error:
            print(f"Error Reason: {root_error.get('reason')}")
        if 'root_cause' in root_error:
            print(f"Root Cause: {root_error.get('root_cause')}")
            
        # Fallback if structure is different
        if not root_error:
             print("Full Meta Body Error:", body.get('error'))

    except json.JSONDecodeError as e:
        print(f"JSON Parse Error: {e}")
        print("Raw JSON string (partial):", json_str[:500].replace('\n', ' '))

except Exception as e:
    print(f"Script Error: {e}")
