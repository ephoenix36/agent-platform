"""
Multi-format agent parser

Parses agent definitions from various formats (Markdown, JSON, YAML, XML)
and converts them to a unified AgentFormat.
"""

from typing import Dict, Any, List, Optional
import yaml
import json
import xml.etree.ElementTree as ET
import re
from pydantic import BaseModel


class AgentFormat(BaseModel):
    """Unified agent format"""
    name: str
    description: str
    instructions: str
    tools: List[Dict[str, Any]] = []
    model: str = "gpt-4"
    parameters: Dict[str, Any] = {}
    ui_components: Optional[List[Dict[str, Any]]] = None
    protocol: str = "custom"


class MultiFormatParser:
    """Parse various agent definition formats"""
    
    def parse(self, content: str, format_hint: Optional[str] = None) -> AgentFormat:
        """Auto-detect and parse agent format"""
        format_type = format_hint or self.detect_format(content)
        
        if format_type == "markdown":
            return self.parse_markdown(content)
        elif format_type == "json":
            return self.parse_json(content)
        elif format_type == "yaml":
            return self.parse_yaml(content)
        elif format_type == "xml":
            return self.parse_xml(content)
        else:
            raise ValueError(f"Unknown format: {format_type}")
    
    def detect_format(self, content: str) -> str:
        """Auto-detect agent definition format"""
        content = content.strip()
        
        if content.startswith("{"):
            return "json"
        elif content.startswith("---") or re.search(r"^\w+:", content, re.MULTILINE):
            return "yaml"
        elif content.startswith("<?xml") or content.startswith("<agent"):
            return "xml"
        elif content.startswith("#") or "##" in content:
            return "markdown"
        else:
            return "unknown"
    
    def parse_markdown(self, content: str) -> AgentFormat:
        """Parse markdown-based agent definition
        
        Expected format:
        # Agent Name
        
        ## Description
        Agent description here
        
        ## Instructions
        Agent instructions here
        
        ## Tools
        - tool1
        - tool2
        
        ## Model
        gpt-4
        
        ## Parameters
        - temperature: 0.7
        - max_tokens: 1000
        
        ## UI Components
        - card: { title: "Results" }
        """
        sections = self._extract_markdown_sections(content)
        
        return AgentFormat(
            name=sections.get("name", "Unnamed Agent"),
            description=sections.get("description", ""),
            instructions=sections.get("instructions", ""),
            tools=self._parse_tools_section(sections.get("tools", "")),
            model=sections.get("model", "gpt-4").strip(),
            parameters=self._parse_parameters(sections.get("parameters", "")),
            ui_components=self._parse_ui_components(sections.get("ui components", ""))
        )
    
    def _extract_markdown_sections(self, content: str) -> Dict[str, str]:
        """Extract sections from markdown using headers"""
        sections = {}
        current_section = None
        current_content = []
        
        lines = content.split("\n")
        
        # Extract title from first H1
        if lines and lines[0].startswith("# "):
            sections["name"] = lines[0][2:].strip()
            lines = lines[1:]
        
        for line in lines:
            if line.startswith("## "):
                # Save previous section
                if current_section:
                    sections[current_section.lower()] = "\n".join(current_content).strip()
                
                # Start new section
                current_section = line[3:].strip()
                current_content = []
            elif current_section:
                current_content.append(line)
        
        # Save last section
        if current_section:
            sections[current_section.lower()] = "\n".join(current_content).strip()
        
        return sections
    
    def _parse_tools_section(self, tools_text: str) -> List[Dict[str, Any]]:
        """Parse tools from markdown list"""
        tools = []
        for line in tools_text.split("\n"):
            line = line.strip()
            if line.startswith("-") or line.startswith("*"):
                tool_name = line[1:].strip()
                tools.append({"name": tool_name, "type": "custom"})
        return tools
    
    def _parse_parameters(self, params_text: str) -> Dict[str, Any]:
        """Parse parameters from markdown list"""
        params = {}
        for line in params_text.split("\n"):
            line = line.strip()
            if ":" in line:
                # Remove leading dash/asterisk
                if line.startswith("-") or line.startswith("*"):
                    line = line[1:].strip()
                
                key, value = line.split(":", 1)
                key = key.strip()
                value = value.strip()
                
                # Try to convert to appropriate type
                try:
                    if value.lower() == "true":
                        params[key] = True
                    elif value.lower() == "false":
                        params[key] = False
                    elif value.isdigit():
                        params[key] = int(value)
                    elif re.match(r"^\d+\.\d+$", value):
                        params[key] = float(value)
                    else:
                        params[key] = value
                except:
                    params[key] = value
        
        return params
    
    def _parse_ui_components(self, ui_text: str) -> Optional[List[Dict[str, Any]]]:
        """Parse UI components from text"""
        if not ui_text:
            return None
        
        components = []
        for line in ui_text.split("\n"):
            line = line.strip()
            if line.startswith("-") or line.startswith("*"):
                # Simple parsing - can be enhanced
                components.append({"type": "custom", "config": line[1:].strip()})
        
        return components if components else None
    
    def parse_json(self, content: str) -> AgentFormat:
        """Parse JSON agent definition"""
        try:
            data = json.loads(content)
            return AgentFormat(**data)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON: {e}")
    
    def parse_yaml(self, content: str) -> AgentFormat:
        """Parse YAML agent definition (CrewAI style)"""
        try:
            data = yaml.safe_load(content)
            
            # Handle CrewAI format (agents.yaml)
            if isinstance(data, dict) and "role" in data:
                return AgentFormat(
                    name=data.get("role", "Unnamed Agent"),
                    description=data.get("backstory", ""),
                    instructions=data.get("goal", ""),
                    tools=[],  # Tools are separate in CrewAI
                    model="gpt-4",
                    parameters={},
                )
            
            return AgentFormat(**data)
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML: {e}")
    
    def parse_xml(self, content: str) -> AgentFormat:
        """Parse XML agent definition"""
        try:
            root = ET.fromstring(content)
            
            return AgentFormat(
                name=self._get_xml_text(root, "name", "Unnamed Agent"),
                description=self._get_xml_text(root, "description", ""),
                instructions=self._get_xml_text(root, "instructions", ""),
                tools=self._parse_xml_tools(root.find("tools")),
                model=self._get_xml_text(root, "model", "gpt-4"),
                parameters=self._parse_xml_parameters(root.find("parameters")),
                ui_components=self._parse_xml_ui(root.find("ui"))
            )
        except ET.ParseError as e:
            raise ValueError(f"Invalid XML: {e}")
    
    def _get_xml_text(self, root: ET.Element, tag: str, default: str = "") -> str:
        """Get text from XML element"""
        element = root.find(tag)
        return element.text if element is not None and element.text else default
    
    def _parse_xml_tools(self, tools_element: Optional[ET.Element]) -> List[Dict[str, Any]]:
        """Parse tools from XML"""
        if tools_element is None:
            return []
        
        tools = []
        for tool in tools_element.findall("tool"):
            tools.append({
                "name": tool.get("name", ""),
                "type": tool.get("type", "custom"),
            })
        return tools
    
    def _parse_xml_parameters(self, params_element: Optional[ET.Element]) -> Dict[str, Any]:
        """Parse parameters from XML"""
        if params_element is None:
            return {}
        
        params = {}
        for param in params_element:
            params[param.tag] = param.text
        return params
    
    def _parse_xml_ui(self, ui_element: Optional[ET.Element]) -> Optional[List[Dict[str, Any]]]:
        """Parse UI components from XML"""
        if ui_element is None:
            return None
        
        components = []
        for component in ui_element.findall("component"):
            components.append({
                "type": component.get("type", "custom"),
                "props": dict(component.attrib)
            })
        
        return components if components else None


# Example usage
if __name__ == "__main__":
    parser = MultiFormatParser()
    
    # Test markdown format
    markdown_agent = """
# Research Agent

## Description
This agent performs deep research on any topic

## Instructions
1. Analyze the topic
2. Search for relevant information
3. Summarize findings

## Tools
- web_search
- summarizer

## Model
gpt-4

## Parameters
- temperature: 0.7
- max_tokens: 2000
"""
    
    agent = parser.parse(markdown_agent)
    print(f"Parsed agent: {agent.name}")
    print(f"Tools: {agent.tools}")
    print(f"Parameters: {agent.parameters}")
