# PACSUM ERP - Quick Start Guide

## 🚀 Getting Started (5 minutes)

### Option 1: Using Claude Code (Recommended)

```bash
# 1. Navigate to the project
cd C:\Users\velez\Projects\pacsum-erp

# 2. Invoke an agent directly
claude-code "As GOD MODE v4.1, provide a status update on the project" \
  --file agents/profiles/leadership/01_god_mode_v4.1.md

# 3. Use multiple agents for complex tasks
claude-code "As Devin Codex, design the authentication system with Serena's security review" \
  --file agents/profiles/development/06_devin_codex.md \
  --file agents/profiles/development/09_serena_shield.md
```

### Option 2: Using Python Agent Manager

```bash
# 1. Navigate to agents directory
cd C:\Users\velez\Projects\pacsum-erp\agents\core

# 2. Install anthropic SDK (if not already installed)
pip install anthropic

# 3. Set your Claude API key
$env:ANTHROPIC_API_KEY = "your-api-key-here"

# 4. Run the agent manager
python agent_manager.py "01_god_mode_v4.1" "What's our current project status?"

# 5. Or start interactive conversation
python agent_manager.py
```

### Option 3: Using Claude Web Interface

1. Go to [claude.ai](https://claude.ai)
2. Create a new conversation
3. Upload an agent profile file (e.g., `agents/profiles/leadership/01_god_mode_v4.1.md`)
4. Start your conversation: "Act as this agent and help me with [task]"

## 📁 Project Structure

```
pacsum-erp/
├── agents/                          ← Universal agent system (reusable!)
│   ├── profiles/
│   │   ├── leadership/              ← GOD MODE + Dr. Athena
│   │   ├── planning/                ← Phase 1 agents
│   │   ├── development/             ← Phase 2 agents
│   │   ├── qa/                      ← Phase 3 agents
│   │   └── deployment/              ← Phase 4 agents
│   └── core/
│       ├── agent_loader.py          ← Load agent profiles
│       ├── agent_manager.py         ← Orchestrate agents
│       └── communication.py         ← Inter-agent protocol
│
├── docs/                            ← Documentation
│   └── PHASE_1_PLAN.md              ← Planning & Architecture
│
├── README.md                        ← Main project docs
├── QUICKSTART.md                    ← This file
└── .gitignore                       ← Git configuration
```

## 🤖 Available Agents

### Leadership (Always Active)
- **GOD MODE v4.1** - Project coordination & strategic decisions
- **Dr. Athena Criticus** - Quality gatekeeper & critic

### Planning (Phase 1)
- **Alex Structure** - Enterprise architecture
- **Finley Regulus** - Financial compliance
- **Petra Vision** - Product strategy

### Development (Phase 2)
- **Devin Codex** - Full-stack development
- **Dana Querymaster** - Database engineering
- **Ian Deploy** - DevOps & infrastructure
- **Serena Shield** - Security engineering
- **Isaac Connector** - API integrations

### QA (Phase 3)
- **Quincy Validator** - QA automation
- **Uma Designer** - UX/UI quality
- **Felix Auditor** - Financial validation

### Deployment (Phase 4)
- **Diana Launch** - Deployment automation
- **Morgan Metrics** - Monitoring & analytics
- **Derek Documentor** - Documentation

## 📋 Common Tasks

### Get Project Status
```bash
claude-code "As GOD MODE v4.1, provide comprehensive project status including:
1. Current phase
2. Completed deliverables
3. In-progress work
4. Blockers
5. Timeline status" \
  --file agents/profiles/leadership/01_god_mode_v4.1.md
```

### Design Architecture
```bash
claude-code "As Alex Structure, create the system architecture for PACSUM ERP including:
1. System overview
2. Technology stack
3. Database design
4. API specifications
5. Performance targets" \
  --file agents/profiles/planning/03_alex_structure.md
```

### Define MVP
```bash
claude-code "As Petra Vision, define the MVP with:
1. User personas
2. Feature prioritization
3. User stories
4. Success metrics" \
  --file agents/profiles/planning/05_petra_vision.md
```

### Review Quality
```bash
claude-code "As Dr. Athena Criticus, conduct a brutal quality review of the current work. Find at least 3 critical issues." \
  --file agents/profiles/leadership/02_dr_athena_criticus.md
```

### Setup Development
```bash
claude-code "As Devin Codex, create a development setup guide for:
1. Local environment setup
2. Database initialization
3. Running tests
4. Deployment steps" \
  --file agents/profiles/development/06_devin_codex.md
```

## 🔄 Agent Collaboration

Use multiple agents for complex decisions:

```bash
# Phase 1 architecture planning
claude-code "Collaborate on PACSUM architecture:
1. Alex: Design the system architecture
2. Dana: Optimize database design
3. Serena: Review security architecture
4. Finley: Assess compliance requirements
5. Dr. Athena: Provide critical review

Coordinate your responses and identify any conflicts" \
  --file agents/profiles/planning/03_alex_structure.md \
  --file agents/profiles/development/07_dana_querymaster.md \
  --file agents/profiles/development/09_serena_shield.md \
  --file agents/profiles/planning/04_finley_regulus.md \
  --file agents/profiles/leadership/02_dr_athena_criticus.md
```

## 🛠️ Using Agents for Your Own Project

The agent system is **completely reusable**:

```bash
# 1. Copy agents to your project
cp -r pacsum-erp/agents /path/to/your/project/

# 2. Load agents in your project
python agents/core/agent_manager.py

# 3. Customize agent profiles as needed
# Edit agents/profiles/*/*.md to match your project
```

## 📊 Phase Timeline

- **Weeks 1-2:** Phase 1 - Planning & Architecture
- **Weeks 3-6:** Phase 2 - Development & Implementation
- **Weeks 7-8:** Phase 3 - Quality Assurance
- **Weeks 9-10:** Phase 4 - Deployment & Operations
- **Week 11+:** Production with pilot clients

## 🔑 Key Features

✅ **16 Specialized Agents** - Each with deep expertise
✅ **Inter-Agent Communication** - Agents work together
✅ **Quality Gates** - Mandatory reviews between phases
✅ **Universal Framework** - Use in any project
✅ **No Code Needed** - Works with Claude directly
✅ **Portable** - Copy agents anywhere

## 🚀 Next Steps

1. **Understand the System**
   - Read `/agents/README.md` for agent system details
   - Read `/docs/PHASE_1_PLAN.md` for current phase plan
   - Read individual agent profiles for specific expertise

2. **Start Using Agents**
   - Pick a task from "Common Tasks" above
   - Invoke the appropriate agent with `claude-code`
   - Review the output and iterate

3. **Move to Development**
   - When Phase 1 is complete, Phase 2 agents activate
   - Start building with Devin Codex's guidance
   - Use agent collaboration for complex decisions

4. **Share with Team**
   - This project is ready for GitHub
   - Team members can clone and use agents
   - All agent profiles are in the repo

## 📞 Getting Help

### Understanding an Agent
```bash
# Read the agent's full profile
cat agents/profiles/[phase]/[agent_name].md
```

### Finding the Right Agent
```bash
# Use GOD MODE to recommend agents
claude-code "As GOD MODE v4.1, which agents should I use for [my task]?" \
  --file agents/profiles/leadership/01_god_mode_v4.1.md
```

### Learning Agent Collaboration
See `/agents/README.md` and `docs/orchestration.md` for:
- Communication protocols
- Quality gates
- Phase transitions
- Emergency procedures

## ⚙️ Configuration

### Setting Claude API Key
```bash
# On Windows PowerShell
$env:ANTHROPIC_API_KEY = "sk-ant-..."

# On Command Prompt
set ANTHROPIC_API_KEY=sk-ant-...

# Or add to .env file (see .env.example)
```

### Customizing Agents
Edit agent profiles in `agents/profiles/[phase]/[agent_name].md`:
- Modify personality
- Update expertise areas
- Adjust collaboration protocols
- Change success criteria

## 📦 Distribution

This entire project (including agents) is ready for:
- ✅ GitHub (public or private)
- ✅ Team collaboration
- ✅ CI/CD integration
- ✅ Multiple projects (reuse agents)

## 🎯 Success Metrics

You'll know this is working when:
- ✅ Agents provide high-quality guidance
- ✅ Phase transitions are smooth
- ✅ Quality gates catch issues early
- ✅ Team is aligned on architecture
- ✅ Development progresses on schedule

---

**Ready to build enterprise-grade software with AI agents? Let's go! 🚀**

Questions? Start with GOD MODE or read the comprehensive documentation in `/agents/README.md`

**Next Phase:** Once Phase 1 is complete, Phase 2 (Development) begins with agents like Devin Codex leading implementation.
