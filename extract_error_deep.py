
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
    
    # Check level 1 meta
    meta1 = error_obj.get('meta', {})
    print("Meta1 Keys:", list(meta1.keys()))
    
    if 'meta' in meta1:
        meta2 = meta1['meta']
        print("Meta2 Keys:", list(meta2.keys()))
        if 'body' in meta2:
            body = meta2['body']
            print("Body Keys:", list(body.keys()))
            if 'error' in body:
                print("FINAL ERROR CAUSE:", json.dumps(body['error'], indent=2))
                
    if 'body' in meta1:
        print("Body found in Meta1")
        print("FINAL ERROR CAUSE:", json.dumps(meta1['body'].get('error'), indent=2))

except Exception as e:
    print(f"Error: {e}")
