"""
Agent Manager - Orchestrate agents and manage their lifecycle
Universal agent system for any project
"""

import os
from typing import Dict, List, Optional
from anthropic import Anthropic
from agent_loader import AgentLoader


class AgentManager:
    """Manage agents, invoke them, and handle inter-agent communication"""

    def __init__(self, profiles_dir: str = "./agents/profiles", api_key: Optional[str] = None):
        self.loader = AgentLoader(profiles_dir)
        self.agents = {}
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        self.client = Anthropic(api_key=self.api_key) if self.api_key else None
        self.conversation_history = []

    def load_agents(self):
        """Load all agents from profiles"""
        self.agents = self.loader.load_all_agents()
        print(f"✅ Loaded {len(self.agents)} agents")

    def invoke_agent(self, agent_id: str, task: str, model: str = "claude-opus-4-1") -> str:
        """
        Invoke an agent with a specific task

        Args:
            agent_id: Agent identifier (filename without .md)
            task: Task/prompt for the agent
            model: Claude model to use

        Returns:
            Agent response
        """
        if not self.client:
            raise ValueError("Claude API key not configured. Set ANTHROPIC_API_KEY environment variable.")

        if agent_id not in self.agents:
            raise ValueError(f"Agent not found: {agent_id}")

        agent_profile = self.agents[agent_id]

        # Create system prompt with agent profile
        system_prompt = f"""You are an AI agent with the following profile:

{agent_profile}

Follow the instructions and personality defined in your profile. Maintain consistency with your role, expertise, and communication style."""

        # Invoke Claude with agent profile as system context
        response = self.client.messages.create(
            model=model,
            max_tokens=4096,
            system=system_prompt,
            messages=[
                {"role": "user", "content": task}
            ]
        )

        return response.content[0].text

    def invoke_multiple_agents(self, agents: List[str], task: str) -> Dict[str, str]:
        """
        Invoke multiple agents on the same task for collaboration

        Args:
            agents: List of agent IDs
            task: Task for all agents

        Returns:
            Dictionary with responses from each agent
        """
        responses = {}
        for agent_id in agents:
            try:
                response = self.invoke_agent(agent_id, task)
                responses[agent_id] = response
            except Exception as e:
                responses[agent_id] = f"Error: {str(e)}"

        return responses

    def get_phase_agents(self, phase: str) -> List[str]:
        """Get agent IDs for a specific phase"""
        agents = self.loader.get_agent_by_phase(phase)
        return [agent['id'] for agent in agents]

    def get_agent_profile(self, agent_id: str) -> str:
        """Get the full profile of an agent"""
        if agent_id not in self.agents:
            raise ValueError(f"Agent not found: {agent_id}")
        return self.agents[agent_id]

    def list_agents(self, phase: Optional[str] = None) -> List[Dict]:
        """List all agents or agents for a specific phase"""
        if phase:
            return self.loader.get_agent_by_phase(phase)
        return self.loader.get_agent_registry()

    def collaborative_task(self, primary_agent: str, supporting_agents: List[str], task: str) -> Dict:
        """
        Execute a task with a primary agent and supporting agents for collaboration

        Args:
            primary_agent: Main agent to lead the task
            supporting_agents: Other agents to provide input
            task: Task description

        Returns:
            Dictionary with primary response and supporting agent inputs
        """
        results = {
            'primary_agent': primary_agent,
            'supporting_agents': supporting_agents,
            'task': task,
            'primary_response': None,
            'supporting_responses': {}
        }

        # Get inputs from supporting agents first
        for agent_id in supporting_agents:
            try:
                response = self.invoke_agent(agent_id, task)
                results['supporting_responses'][agent_id] = response
            except Exception as e:
                results['supporting_responses'][agent_id] = f"Error: {str(e)}"

        # Primary agent sees all supporting input
        supporting_context = "\n\n".join([
            f"Input from {agent_id}:\n{response}"
            for agent_id, response in results['supporting_responses'].items()
        ])

        combined_task = f"""{task}

Supporting agent inputs:
{supporting_context}

Please provide your response as the primary agent, integrating the supporting input."""

        try:
            primary_response = self.invoke_agent(primary_agent, combined_task)
            results['primary_response'] = primary_response
        except Exception as e:
            results['primary_response'] = f"Error: {str(e)}"

        return results

    def start_conversation(self):
        """Start an interactive conversation with an agent"""
        print("\n🤖 AGENT CONVERSATION MODE")
        print("=" * 80)

        # List available agents
        self.loader.print_registry()

        agent_id = input("\nChoose an agent (e.g., 01_god_mode_v4.1): ").strip()

        if agent_id not in self.agents:
            print(f"❌ Agent not found: {agent_id}")
            return

        print(f"\n✅ Starting conversation with {agent_id}")
        print("Type 'exit' to end conversation\n")

        self.conversation_history = []

        while True:
            user_input = input("You: ").strip()
            if user_input.lower() == 'exit':
                print("Conversation ended.")
                break

            if not user_input:
                continue

            try:
                response = self.invoke_agent(agent_id, user_input)
                print(f"\n{agent_id}: {response}\n")
            except Exception as e:
                print(f"❌ Error: {str(e)}\n")


def main():
    """Example usage"""
    import sys

    # Initialize manager
    manager = AgentManager()
    manager.load_agents()

    if len(sys.argv) < 2:
        # Start interactive conversation
        manager.start_conversation()
    else:
        # Command line invocation
        agent_id = sys.argv[1]
        task = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else "Hello"

        try:
            response = manager.invoke_agent(agent_id, task)
            print(f"\n{agent_id} Response:\n{response}")
        except Exception as e:
            print(f"Error: {str(e)}")


if __name__ == "__main__":
    main()
