"""
Inter-Agent Communication Protocol Handler
Standardized communication between agents
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List
from enum import Enum
import json


class Priority(Enum):
    """Priority levels for agent requests"""
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class Status(Enum):
    """Status of agent requests/responses"""
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    BLOCKED = "Blocked"


@dataclass
class AgentRequest:
    """Standardized request format between agents"""
    from_agent: str
    to_agent: str
    priority: Priority
    context: str
    request: str
    deliverable: str
    timeline: str

    def to_markdown(self) -> str:
        """Export request as markdown"""
        return f"""=== AGENT REQUEST ===
FROM: {self.from_agent}
TO: {self.to_agent}
PRIORITY: {self.priority.value}
CONTEXT: {self.context}
REQUEST: {self.request}
DELIVERABLE: {self.deliverable}
TIMELINE: {self.timeline}
=== END REQUEST ==="""

    def to_json(self) -> str:
        """Export request as JSON"""
        return json.dumps({
            'from_agent': self.from_agent,
            'to_agent': self.to_agent,
            'priority': self.priority.value,
            'context': self.context,
            'request': self.request,
            'deliverable': self.deliverable,
            'timeline': self.timeline,
            'created_at': datetime.now().isoformat()
        }, indent=2)


@dataclass
class AgentResponse:
    """Standardized response format between agents"""
    from_agent: str
    to_agent: str
    status: Status
    estimated_completion: str
    questions: Optional[str] = None
    notes: Optional[str] = None

    def to_markdown(self) -> str:
        """Export response as markdown"""
        md = f"""=== AGENT RESPONSE ===
FROM: {self.from_agent}
TO: {self.to_agent}
STATUS: {self.status.value}
ESTIMATED_COMPLETION: {self.estimated_completion}"""

        if self.questions:
            md += f"\nQUESTIONS: {self.questions}"

        if self.notes:
            md += f"\nNOTES: {self.notes}"

        md += "\n=== END RESPONSE ==="
        return md

    def to_json(self) -> str:
        """Export response as JSON"""
        return json.dumps({
            'from_agent': self.from_agent,
            'to_agent': self.to_agent,
            'status': self.status.value,
            'estimated_completion': self.estimated_completion,
            'questions': self.questions,
            'notes': self.notes,
            'created_at': datetime.now().isoformat()
        }, indent=2)


class CommunicationHandler:
    """Handle inter-agent communication"""

    def __init__(self):
        self.requests: List[AgentRequest] = []
        self.responses: List[AgentResponse] = []

    def create_request(
        self,
        from_agent: str,
        to_agent: str,
        priority: Priority,
        context: str,
        request: str,
        deliverable: str,
        timeline: str
    ) -> AgentRequest:
        """Create a new agent request"""
        req = AgentRequest(
            from_agent=from_agent,
            to_agent=to_agent,
            priority=priority,
            context=context,
            request=request,
            deliverable=deliverable,
            timeline=timeline
        )
        self.requests.append(req)
        return req

    def create_response(
        self,
        from_agent: str,
        to_agent: str,
        status: Status,
        estimated_completion: str,
        questions: Optional[str] = None,
        notes: Optional[str] = None
    ) -> AgentResponse:
        """Create a new agent response"""
        resp = AgentResponse(
            from_agent=from_agent,
            to_agent=to_agent,
            status=status,
            estimated_completion=estimated_completion,
            questions=questions,
            notes=notes
        )
        self.responses.append(resp)
        return resp

    def get_requests_for_agent(self, agent_id: str) -> List[AgentRequest]:
        """Get all pending requests for an agent"""
        return [req for req in self.requests if req.to_agent == agent_id]

    def get_requests_from_agent(self, agent_id: str) -> List[AgentRequest]:
        """Get all requests sent by an agent"""
        return [req for req in self.requests if req.from_agent == agent_id]

    def export_communication_log(self, filepath: str = "communication_log.json"):
        """Export all communications"""
        log = {
            'requests': [json.loads(req.to_json()) for req in self.requests],
            'responses': [json.loads(resp.to_json()) for resp in self.responses],
            'exported_at': datetime.now().isoformat()
        }

        with open(filepath, 'w') as f:
            json.dump(log, f, indent=2)

        print(f"Communication log exported to {filepath}")

    def print_pending_requests(self, agent_id: str):
        """Print all pending requests for an agent"""
        requests = self.get_requests_for_agent(agent_id)
        if not requests:
            print(f"No pending requests for {agent_id}")
            return

        print(f"\n📋 PENDING REQUESTS FOR {agent_id}")
        print("=" * 80)
        for i, req in enumerate(requests, 1):
            print(f"\nRequest #{i}")
            print(f"From: {req.from_agent}")
            print(f"Priority: {req.priority.value}")
            print(f"Context: {req.context}")
            print(f"Request: {req.request}")
            print(f"Deliverable: {req.deliverable}")
            print(f"Timeline: {req.timeline}")
            print("-" * 80)


# Example usage and standard templates
AGENT_REQUEST_TEMPLATE = """=== AGENT REQUEST ===
FROM: [Your Agent Name]
TO: [Target Agent Name]
PRIORITY: [Critical/High/Medium/Low]
CONTEXT: [Brief description of situation]
REQUEST: [Specific help needed]
DELIVERABLE: [What you expect back]
TIMELINE: [When needed by]
=== END REQUEST ==="""

AGENT_RESPONSE_TEMPLATE = """=== AGENT RESPONSE ===
FROM: [Target Agent Name]
TO: [Requesting Agent]
STATUS: [Accepted/Rejected/Need More Info]
ESTIMATED_COMPLETION: [Timeline]
QUESTIONS: [Any clarifying questions]
NOTES: [Additional context]
=== END RESPONSE ==="""

PROJECT_LEAD_DIRECTIVE_TEMPLATE = """=== PROJECT LEAD DIRECTIVE ===
FROM: GOD MODE v4.1
TO: [Agent Name(s)]
PRIORITY: [Critical/High/Medium/Low]
CONTEXT: [Brief situation description]
ACTION REQUIRED: [Specific deliverable needed]
DEADLINE: [When needed by]
DEPENDENCIES: [What's blocking this]
SUCCESS CRITERIA: [How to measure completion]
=== END DIRECTIVE ==="""


if __name__ == "__main__":
    # Example usage
    handler = CommunicationHandler()

    # Create sample request
    request = handler.create_request(
        from_agent="Devin Codex",
        to_agent="Dana Querymaster",
        priority=Priority.HIGH,
        context="Client dashboard is slow",
        request="Optimize queries and add indexes",
        deliverable="Query performance <50ms",
        timeline="End of day"
    )

    print(request.to_markdown())

    # Create sample response
    response = handler.create_response(
        from_agent="Dana Querymaster",
        to_agent="Devin Codex",
        status=Status.ACCEPTED,
        estimated_completion="3 hours",
        notes="Adding indexes on client_id and created_at columns"
    )

    print("\n" + response.to_markdown())
