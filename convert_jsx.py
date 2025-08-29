#!/usr/bin/env python3
import re
import sys

def convert_jsx_to_createElement(content):
    """Convert JSX syntax to React.createElement calls."""
    
    # First, protect JavaScript expressions in curly braces
    protected_expressions = []
    def protect_expression(match):
        idx = len(protected_expressions)
        protected_expressions.append(match.group(0))
        return f"__PROTECTED_{idx}__"
    
    # Protect expressions but not JSX inside them
    content = re.sub(r'\{[^{}]*\}', protect_expression, content)
    
    # Find all return statements with JSX
    def convert_return_jsx(match):
        indent = match.group(1)
        jsx_content = match.group(2)
        
        # Convert the JSX to createElement
        converted = convert_jsx_element(jsx_content.strip(), indent + "  ")
        
        return f"{indent}return {converted};"
    
    # Match return statements with JSX
    content = re.sub(
        r'^(\s*)return\s+\(\s*\n?\s*(<[\s\S]*?>[\s\S]*?<\/[^>]+>)\s*\);',
        convert_return_jsx,
        content,
        flags=re.MULTILINE
    )
    
    # Also handle inline returns
    content = re.sub(
        r'^(\s*)return\s+(<[^;]+>);',
        lambda m: f"{m.group(1)}return {convert_jsx_element(m.group(2).strip(), m.group(1) + '  ')};",
        content,
        flags=re.MULTILINE
    )
    
    # Restore protected expressions
    for idx, expr in enumerate(protected_expressions):
        content = content.replace(f"__PROTECTED_{idx}__", expr)
    
    return content

def convert_jsx_element(jsx, indent=""):
    """Convert a single JSX element to React.createElement."""
    
    # Handle self-closing tags
    self_closing_match = re.match(r'^<(\w+)([^>]*?)\/>\s*$', jsx.strip())
    if self_closing_match:
        tag = self_closing_match.group(1)
        attrs = self_closing_match.group(2)
        props = parse_attributes(attrs)
        return f"React.createElement('{tag}', {props})"
    
    # Handle elements with children
    element_match = re.match(r'^<(\w+)([^>]*?)>([\s\S]*)<\/\1>\s*$', jsx.strip())
    if element_match:
        tag = element_match.group(1)
        attrs = element_match.group(2)
        children = element_match.group(3)
        
        props = parse_attributes(attrs)
        
        if children.strip():
            # Convert children
            children_elements = convert_children(children.strip(), indent + "  ")
            if children_elements:
                return f"React.createElement(\n{indent}  '{tag}',\n{indent}  {props},\n{indent}  {children_elements}\n{indent})"
        
        return f"React.createElement('{tag}', {props})"
    
    # Return as-is if not JSX
    return jsx

def parse_attributes(attrs_str):
    """Parse JSX attributes into object literal."""
    if not attrs_str.strip():
        return "null"
    
    attrs = []
    
    # Match attribute patterns
    attr_pattern = r'(\w+(?:-\w+)*)(?:=(?:\{([^}]*)\}|"([^"]*)"|\'([^\']*)\'))?'
    
    for match in re.finditer(attr_pattern, attrs_str):
        name = match.group(1)
        
        # Get the value
        if match.group(2):  # {expression}
            value = match.group(2)
        elif match.group(3):  # "string"
            value = f"'{match.group(3)}'"
        elif match.group(4):  # 'string'
            value = f"'{match.group(4)}'"
        else:  # boolean true
            value = "true"
        
        # Convert HTML attributes to React props
        if name == "class":
            name = "className"
        elif name == "for":
            name = "htmlFor"
        elif "-" in name:
            name = f"'{name}'"
        
        attrs.append(f"{name}: {value}")
    
    return "{ " + ", ".join(attrs) + " }" if attrs else "null"

def convert_children(children_str, indent):
    """Convert JSX children to createElement calls."""
    # Simple text content
    if not '<' in children_str:
        return f"'{children_str.strip()}'"
    
    # Multiple elements or mixed content
    elements = []
    
    # This is simplified - a full parser would be more complex
    # For now, just return the children as-is in quotes
    return f"'{children_str}'"

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python convert_jsx.py <file.tsx>")
        sys.exit(1)
    
    filepath = sys.argv[1]
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    converted = convert_jsx_to_createElement(content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(converted)
    
    print(f"Converted JSX in {filepath}")