"""
Agent Loader - Load agent profiles from markdown files
Universal agent system for any project
"""

import os
import json
from pathlib import Path
from typing import Dict, List, Optional


class AgentLoader:
    """Load agent profiles from markdown files"""

    def __init__(self, profiles_dir: str = "./agents/profiles"):
        self.profiles_dir = Path(profiles_dir)
        self.agents: Dict = {}
        self.agent_registry: List[Dict] = []

    def load_agent(self, agent_filename: str) -> str:
        """
        Load a single agent profile from markdown file

        Args:
            agent_filename: Name of the agent file (e.g., '01_god_mode_v4.1.md')

        Returns:
            Content of the agent profile
        """
        # Search for agent in all phase directories
        for phase_dir in ['leadership', 'planning', 'development', 'qa', 'deployment']:
            agent_path = self.profiles_dir / phase_dir / agent_filename
            if agent_path.exists():
                with open(agent_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    self.agents[agent_filename] = {
                        'path': str(agent_path),
                        'phase': phase_dir,
                        'content': content
                    }
                    return content

        raise FileNotFoundError(f"Agent file not found: {agent_filename}")

    def load_all_agents(self) -> Dict[str, str]:
        """Load all agent profiles"""
        agents = {}

        for phase_dir in ['leadership', 'planning', 'development', 'qa', 'deployment']:
            phase_path = self.profiles_dir / phase_dir
            if phase_path.exists():
                for agent_file in phase_path.glob('*.md'):
                    agent_name = agent_file.stem
                    try:
                        content = self.load_agent(agent_file.name)
                        agents[agent_name] = content
                        self.agent_registry.append({
                            'id': agent_name,
                            'filename': agent_file.name,
                            'phase': phase_dir,
                            'path': str(agent_file)
                        })
                    except Exception as e:
                        print(f"Error loading agent {agent_name}: {e}")

        return agents

    def get_agent_by_phase(self, phase: str) -> List[Dict]:
        """Get all agents for a specific phase"""
        return [agent for agent in self.agent_registry if agent['phase'] == phase]

    def get_agent_registry(self) -> List[Dict]:
        """Get the full agent registry"""
        return self.agent_registry

    def extract_agent_metadata(self, agent_content: str) -> Dict:
        """
        Extract metadata from agent profile markdown

        Returns:
            Dictionary with agent metadata
        """
        metadata = {
            'role': None,
            'tier': None,
            'specialty': None,
            'personality': None,
            'collaborates_with': []
        }

        lines = agent_content.split('\n')
        for i, line in enumerate(lines):
            if 'Role:' in line and '**' in line:
                metadata['role'] = line.split('**')[-2]
            elif 'Tier:' in line and '**' in line:
                metadata['tier'] = line.split('**')[-2]
            elif 'Specialty:' in line and '**' in line:
                metadata['specialty'] = line.split('**')[-2]
            elif 'PERSONALITY' in line:
                if i + 1 < len(lines):
                    metadata['personality'] = lines[i + 1].strip()

        return metadata

    def export_registry_json(self, output_file: str = "agent_registry.json"):
        """Export agent registry as JSON"""
        registry_data = {
            'agents': self.agent_registry,
            'total_agents': len(self.agent_registry),
            'phases': {
                'leadership': self.get_agent_by_phase('leadership'),
                'planning': self.get_agent_by_phase('planning'),
                'development': self.get_agent_by_phase('development'),
                'qa': self.get_agent_by_phase('qa'),
                'deployment': self.get_agent_by_phase('deployment')
            }
        }

        with open(output_file, 'w') as f:
            json.dump(registry_data, f, indent=2)

        print(f"Agent registry exported to {output_file}")

    def print_registry(self):
        """Print agent registry in a readable format"""
        print("\n🤖 AGENT REGISTRY")
        print("=" * 80)

        phases = {
            'leadership': 'Leadership (Always Active)',
            'planning': 'Phase 1: Planning & Architecture',
            'development': 'Phase 2: Development & Implementation',
            'qa': 'Phase 3: Quality Assurance',
            'deployment': 'Phase 4: Deployment & Operations'
        }

        for phase_key, phase_name in phases.items():
            agents = self.get_agent_by_phase(phase_key)
            if agents:
                print(f"\n{phase_name}")
                print("-" * 80)
                for agent in agents:
                    print(f"  • {agent['id']}")
                    print(f"    File: {agent['filename']}")
                    print()


if __name__ == "__main__":
    # Example usage
    loader = AgentLoader()

    # Load all agents
    print("Loading all agents...")
    agents = loader.load_all_agents()
    print(f"✅ Loaded {len(agents)} agents\n")

    # Print registry
    loader.print_registry()

    # Export registry
    loader.export_registry_json()
