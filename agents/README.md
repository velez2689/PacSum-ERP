# 🤖 Universal AI Agent System

This is a **portable, reusable agent framework** that works with any project, not just PACSUM ERP.

## Overview

This agent system provides:
- 16 specialized AI agents with distinct roles and expertise
- Inter-agent communication protocols
- Quality gate management
- Phase transition workflows
- Project orchestration framework

## 🎯 Using This Agent System

### For PACSUM ERP
These agents are integrated into the PACSUM ERP development process.

### For Other Projects
You can use these agents for ANY project:

```bash
# Copy the agents folder to your project
cp -r agents/ /path/to/your/project/

# Or use as a git submodule
git submodule add https://github.com/velez2689/pacsum-erp.git agents
```

### Agent Structure

Each agent is defined by a markdown profile file:

```
agents/
├── profiles/
│   ├── leadership/
│   │   ├── 01_god_mode_v4.1.md
│   │   └── 02_dr_athena_criticus.md
│   ├── planning/
│   │   ├── 03_alex_structure.md
│   │   ├── 04_finley_regulus.md
│   │   └── 05_petra_vision.md
│   ├── development/
│   │   ├── 06_devin_codex.md
│   │   ├── 07_dana_querymaster.md
│   │   ├── 08_ian_deploy.md
│   │   ├── 09_serena_shield.md
│   │   └── 10_isaac_connector.md
│   ├── qa/
│   │   ├── 11_quincy_validator.md
│   │   ├── 12_uma_designer.md
│   │   └── 13_felix_auditor.md
│   └── deployment/
│       ├── 14_diana_launch.md
│       ├── 15_morgan_metrics.md
│       └── 16_derek_documentor.md
│
├── core/
│   ├── agent-loader.py         # Load agents from profiles
│   ├── agent-manager.py        # Manage agent lifecycle
│   ├── communication.py        # Inter-agent communication
│   └── orchestrator.py         # Coordinate multiple agents
│
└── README.md                    # This file
```

## 🚀 Quick Start

### Option 1: Using Claude Code (Recommended)

```bash
cd pacsum-erp

# Use an agent directly
claude-code "As GOD MODE v4.1, assess the current project status" \
  --file agents/profiles/leadership/01_god_mode_v4.1.md

# Combine multiple agents for complex tasks
claude-code "As Devin Codex, implement user authentication" \
  --file agents/profiles/development/06_devin_codex.md \
  --file agents/profiles/development/09_serena_shield.md
```

### Option 2: Using Agent Manager (Python)

```python
from agents.core.agent_manager import AgentManager

# Initialize the agent system
manager = AgentManager(profiles_dir="agents/profiles")

# Load an agent
god_mode = manager.load_agent("01_god_mode_v4.1")

# Use the agent (requires Claude API key)
result = god_mode.invoke("What is our current project status?")
```

### Option 3: Using Claude Web Interface

1. Go to [claude.ai](https://claude.ai)
2. Upload an agent profile file
3. Prompt: "Act as this agent and help me with [task]"

## 🔌 Integration Guide

### Adding Agents to Your Project

1. Copy the `agents/` folder to your project root
2. Create an agent configuration file (agents.config.json)
3. Use the Agent Manager to load agents as needed

### Agent Configuration

```json
{
  "project_name": "Your Project",
  "agents_enabled": [
    "01_god_mode_v4.1",
    "06_devin_codex",
    "09_serena_shield"
  ],
  "phases": {
    "planning": ["03_alex_structure", "04_finley_regulus", "05_petra_vision"],
    "development": ["06_devin_codex", "07_dana_querymaster", "08_ian_deploy"],
    "qa": ["11_quincy_validator", "12_uma_designer", "13_felix_auditor"],
    "deployment": ["14_diana_launch", "15_morgan_metrics", "16_derek_documentor"]
  }
}
```

### Using Agents Programmatically

```python
# Load a specific agent
from agents.core.agent_manager import AgentManager
from anthropic import Anthropic

manager = AgentManager()
agent_profile = manager.load_agent("06_devin_codex")

# Use with Claude API
client = Anthropic(api_key="your-api-key")
response = client.messages.create(
    model="claude-opus-4-1",
    max_tokens=4096,
    system=f"You are Devin Codex. {agent_profile}",
    messages=[
        {
            "role": "user",
            "content": "Implement the authentication system"
        }
    ]
)
```

## 📋 Agent Registry

### Leadership Agents
| Agent | ID | Use For |
|-------|-----|---------|
| GOD MODE v4.1 | 01_god_mode_v4.1 | Project coordination, phase management |
| Dr. Athena Criticus | 02_dr_athena_criticus | Quality review, critical issue detection |

### Planning Agents
| Agent | ID | Use For |
|-------|-----|---------|
| Alex Structure | 03_alex_structure | System architecture, tech stack |
| Finley Regulus | 04_finley_regulus | Compliance, security requirements |
| Petra Vision | 05_petra_vision | Product strategy, user stories |

### Development Agents
| Agent | ID | Use For |
|-------|-----|---------|
| Devin Codex | 06_devin_codex | Full-stack development |
| Dana Querymaster | 07_dana_querymaster | Database design, optimization |
| Ian Deploy | 08_ian_deploy | DevOps, CI/CD, infrastructure |
| Serena Shield | 09_serena_shield | Security, authentication |
| Isaac Connector | 10_isaac_connector | API integrations, third-party |

### QA Agents
| Agent | ID | Use For |
|-------|-----|---------|
| Quincy Validator | 11_quincy_validator | Testing, QA automation |
| Uma Designer | 12_uma_designer | UI/UX review, accessibility |
| Felix Auditor | 13_felix_auditor | Financial validation |

### Deployment Agents
| Agent | ID | Use For |
|-------|-----|---------|
| Diana Launch | 14_diana_launch | Production deployment |
| Morgan Metrics | 15_morgan_metrics | Monitoring, analytics |
| Derek Documentor | 16_derek_documentor | Documentation, user guides |

## 🔄 Inter-Agent Communication

Agents communicate using a standardized protocol:

```
=== AGENT REQUEST ===
FROM: Devin Codex
TO: Dana Querymaster
PRIORITY: High
CONTEXT: Client dashboard query is slow (800ms)
REQUEST: Optimize query and add appropriate indexes
DELIVERABLE: Query <50ms, explain plan showing index usage
TIMELINE: End of day
=== END REQUEST ===
```

See `/docs/orchestration.md` for detailed communication protocols.

## 📊 Quality Gates

Each agent has built-in quality checks:

- **Self-Check Function**: Each agent validates their own work
- **Peer Review**: Related agents review critical components
- **Critic AI**: Dr. Athena Criticus performs independent quality audit

Quality gates exist between phases to ensure:
- Phase 1 → 2: Architecture approved
- Phase 2 → 3: Code coverage >90%
- Phase 3 → 4: All critical bugs resolved
- Phase 4 → Production: Deployment tested

## 🛠️ Customization

### Creating Custom Agent Profiles

1. Copy an existing agent profile as a template
2. Modify the role, expertise, and collaboration protocols
3. Save to the appropriate phase folder
4. Update the agent registry

### Extending Agent Capabilities

Agent profiles are markdown files that define:
- Role and responsibilities
- Expertise areas
- Collaboration protocols
- Self-check functions
- Success criteria

Simply edit the markdown file to customize an agent's behavior.

## 📚 Documentation

- **ORCHESTRATION.md** - Inter-agent workflows and communication
- **PROFILES.md** - Detailed description of each agent
- **INTEGRATION.md** - How to integrate agents into your project

## 🔐 Environment Setup

Set the following environment variables to use agents with Claude API:

```bash
export ANTHROPIC_API_KEY="your-api-key"
export AGENT_PROFILES_DIR="./agents/profiles"
```

## 📞 Support

For questions about using agents in your project:
1. Check the agent profile for detailed instructions
2. Review inter-agent communication protocols
3. Consult project documentation
4. Create an issue on GitHub

## 🎯 Best Practices

1. **Always load full agent profiles** - Not just the agent ID
2. **Follow communication protocols** - Use standardized request/response formats
3. **Respect quality gates** - Don't skip phases or reviews
4. **Collaborate early and often** - Agents are designed to work together
5. **Document decisions** - Other agents need context

## 📦 Distributing Agents

To use this agent system in other projects:

```bash
# Option 1: Copy the folder
cp -r agents/ /path/to/other/project/

# Option 2: Git submodule (recommended)
cd /path/to/other/project
git submodule add https://github.com/velez2689/pacsum-erp.git agents

# Option 3: Package as npm module
npm install @velez2689/universal-agent-system
```

---

**Version:** 1.0
**Status:** Production Ready
**Universal:** Works with any project
**Reusable:** Copy to any codebase

*A complete AI agent system for coordinated project development.*
