
import re
try:
    with open('debug_api_error.log', 'rb') as f:
        content = f.read().decode('utf-16le', 'ignore')
        
    start = content.find('FULL ERROR DETAILS:')
    if start == -1:
        print("Marker not found")
        exit(1)
        
    segment = content[start:start+5000]
    
    # Clean newlines for easier regex
    clean_segment = segment.replace('\r', ' ').replace('\n', ' ')
    
    # aggressive inner match
    # looking for "type": "some_exception" 
    type_match = re.search(r'"type"\s*:\s*"([^"]+)"', clean_segment)
    reason_match = re.search(r'"reason"\s*:\s*"([^"]+)"', clean_segment)
    
    print("--- EXTRACTED ERROR ---")
    if type_match:
        print(f"Type: {type_match.group(1)}")
    if reason_match:
        print(f"Reason: {reason_match.group(1)}")
        
    # Also dump raw chunk if regex fails
    if not type_match and not reason_match:
        print("RAW CHUNK (cleaned):")
        print(clean_segment[:500])
        
except Exception as e:
    print(f"Script Error: {e}")
