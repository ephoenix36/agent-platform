#Requires -Version 7.0

<#
.SYNOPSIS
    Sets up persistent storage for MCP Agent Platform
.DESCRIPTION
    Creates .agents directory structure in user's home directory for storing:
    - Agents (JSON, MD with frontmatter)
    - Skills (agent + system instructions + rules)
    - Agent Teams
    - Toolsets (with instructions and rules)
    - Workflows
    - Hooks
    - Collections
    - Evaluation configs
    - Mutation rules
    - Performance metrics
.PARAMETER UserPath
    Optional. Defaults to $env:USERPROFILE (C:\Users\ephoe)
.PARAMETER Force
    Recreate directories if they already exist
.EXAMPLE
    .\setup-persistent-storage.ps1
.EXAMPLE
    .\setup-persistent-storage.ps1 -UserPath "C:\Users\ephoe" -Force
#>

param(
    [string]$UserPath = $env:USERPROFILE,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

# Main storage directory
$AgentsRoot = Join-Path $UserPath ".agents"

Write-Info "==================================================="
Write-Info "  MCP Agent Platform - Storage Setup"
Write-Info "==================================================="
Write-Info ""

# Directory structure
$directories = @{
    # Core agent storage
    "agents" = @{
        "path" = "agents"
        "description" = "Agent definitions (JSON, MD with frontmatter)"
        "subdirs" = @("configured", "marketplace", "custom", "templates")
    }
    
    # Skills database
    "skills" = @{
        "path" = "skills"
        "description" = "Skills with instructions, rules, and linked agents"
        "subdirs" = @("system", "user", "marketplace", "templates")
    }
    
    # Agent teams
    "teams" = @{
        "path" = "teams"
        "description" = "Agent team configurations"
        "subdirs" = @("active", "archived", "templates")
    }
    
    # Toolsets
    "toolsets" = @{
        "path" = "toolsets"
        "description" = "Tool collections with instructions and rules"
        "subdirs" = @("core", "custom", "marketplace", "external-mcp")
    }
    
    # Tools
    "tools" = @{
        "path" = "tools"
        "description" = "Individual tools (local, remote MCP, scripts)"
        "subdirs" = @("builtin", "local", "remote-mcp", "script", "custom")
    }
    
    # Workflows
    "workflows" = @{
        "path" = "workflows"
        "description" = "Workflow definitions and execution history"
        "subdirs" = @("active", "templates", "history")
    }
    
    # Hooks
    "hooks" = @{
        "path" = "hooks"
        "description" = "Lifecycle hooks for tools, agents, workflows"
        "subdirs" = @("tool", "agent", "workflow", "system")
    }
    
    # Collections
    "collections" = @{
        "path" = "collections"
        "description" = "Data collections and knowledge bases"
        "subdirs" = @("documents", "datasets", "knowledge-graphs", "vector-stores")
    }
    
    # Evaluation
    "evaluation" = @{
        "path" = "evaluation"
        "description" = "Evaluation configs and results"
        "subdirs" = @("configs", "results", "metrics", "benchmarks")
    }
    
    # Mutation
    "mutation" = @{
        "path" = "mutation"
        "description" = "Mutation rules and evolution configs"
        "subdirs" = @("strategies", "constraints", "history")
    }
    
    # Performance metrics
    "metrics" = @{
        "path" = "metrics"
        "description" = "Performance tracking and analytics"
        "subdirs" = @("usage", "costs", "performance", "anomalies")
    }
    
    # Project management
    "projects" = @{
        "path" = "projects"
        "description" = "Project management data"
        "subdirs" = @("active", "archived", "templates")
    }
    
    # Cache and temporary
    "cache" = @{
        "path" = "cache"
        "description" = "Cache and temporary storage"
        "subdirs" = @("embeddings", "api-responses", "temp")
    }
    
    # Logs
    "logs" = @{
        "path" = "logs"
        "description" = "System and execution logs"
        "subdirs" = @("agent-execution", "workflow", "errors", "audit")
    }
    
    # Backups
    "backups" = @{
        "path" = "backups"
        "description" = "Automated backups"
        "subdirs" = @("daily", "weekly", "manual")
    }
}

# Check if root directory exists
if (Test-Path $AgentsRoot) {
    if ($Force) {
        Write-Warning "Root directory exists. Force flag set - continuing..."
    } else {
        Write-Warning "Root directory already exists: $AgentsRoot"
        $response = Read-Host "Continue anyway? (y/N)"
        if ($response -ne 'y' -and $response -ne 'Y') {
            Write-Info "Setup cancelled."
            exit 0
        }
    }
} else {
    Write-Info "Creating root directory: $AgentsRoot"
    New-Item -ItemType Directory -Path $AgentsRoot -Force | Out-Null
    Write-Success "✓ Created root directory"
}

Write-Info ""
Write-Info "Creating directory structure..."
Write-Info ""

# Create directories
foreach ($key in $directories.Keys) {
    $config = $directories[$key]
    $mainPath = Join-Path $AgentsRoot $config.path
    
    # Create main directory
    if (-not (Test-Path $mainPath)) {
        New-Item -ItemType Directory -Path $mainPath -Force | Out-Null
        Write-Success "  ✓ $($config.path.PadRight(30)) - $($config.description)"
    } else {
        Write-Info "  → $($config.path.PadRight(30)) - exists"
    }
    
    # Create subdirectories
    foreach ($subdir in $config.subdirs) {
        $subPath = Join-Path $mainPath $subdir
        if (-not (Test-Path $subPath)) {
            New-Item -ItemType Directory -Path $subPath -Force | Out-Null
        }
    }
}

Write-Info ""
Write-Info "Creating configuration files..."
Write-Info ""

# Create main config file
$configPath = Join-Path $AgentsRoot "config.json"
if (-not (Test-Path $configPath) -or $Force) {
    $config = @{
        version = "1.0.0"
        created = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        storage = @{
            root = $AgentsRoot
            format_version = "1.0"
        }
        features = @{
            auto_backup = $true
            backup_interval_days = 7
            cache_enabled = $true
            cache_ttl_hours = 24
            logging_enabled = $true
            log_retention_days = 30
            metrics_enabled = $true
        }
        paths = @{
            agents = "agents"
            skills = "skills"
            teams = "teams"
            toolsets = "toolsets"
            tools = "tools"
            workflows = "workflows"
            hooks = "hooks"
            collections = "collections"
            evaluation = "evaluation"
            mutation = "mutation"
            metrics = "metrics"
            projects = "projects"
            cache = "cache"
            logs = "logs"
            backups = "backups"
        }
    } | ConvertTo-Json -Depth 10
    
    Set-Content -Path $configPath -Value $config
    Write-Success "  ✓ config.json"
}

# Create README
$readmePath = Join-Path $AgentsRoot "README.md"
if (-not (Test-Path $readmePath) -or $Force) {
    $readme = @"
# MCP Agent Platform - Persistent Storage

**Location:** $AgentsRoot
**Created:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Version:** 1.0.0

## Directory Structure

### Core Components

- **agents/** - Agent definitions in JSON and Markdown formats
  - configured/ - Runtime configured agents
  - marketplace/ - Downloaded from marketplace
  - custom/ - User-created agents
  - templates/ - Agent templates

- **skills/** - Skills with instructions, rules, and agent links
  - system/ - System-provided skills
  - user/ - User-created skills
  - marketplace/ - Downloaded skills
  - templates/ - Skill templates

- **teams/** - Agent team configurations
  - active/ - Currently active teams
  - archived/ - Archived teams
  - templates/ - Team templates

- **toolsets/** - Tool collections with instructions and rules
  - core/ - Core platform toolsets
  - custom/ - User-created toolsets
  - marketplace/ - Downloaded toolsets
  - external-mcp/ - External MCP server integrations

- **workflows/** - Workflow definitions and execution history
  - active/ - Active workflows
  - templates/ - Workflow templates
  - history/ - Execution history

- **hooks/** - Lifecycle hooks
  - tool/ - Tool execution hooks
  - agent/ - Agent execution hooks
  - workflow/ - Workflow execution hooks
  - system/ - System-level hooks

### Data & Knowledge

- **collections/** - Data collections and knowledge bases
  - documents/ - Document collections
  - datasets/ - Structured datasets
  - knowledge-graphs/ - Knowledge graph data
  - vector-stores/ - Vector embeddings

### Evolution & Optimization

- **evaluation/** - Evaluation configurations and results
  - configs/ - Evaluator configurations
  - results/ - Evaluation results
  - metrics/ - Performance metrics
  - benchmarks/ - Benchmark definitions

- **mutation/** - Mutation rules and evolution configs
  - strategies/ - Mutation strategies
  - constraints/ - Mutation constraints
  - history/ - Evolution history

### Operations

- **metrics/** - Performance tracking and analytics
  - usage/ - Usage statistics
  - costs/ - Cost tracking
  - performance/ - Performance metrics
  - anomalies/ - Anomaly detection data

- **projects/** - Project management data
  - active/ - Active projects
  - archived/ - Archived projects
  - templates/ - Project templates

- **cache/** - Cache and temporary storage
  - embeddings/ - Cached embeddings
  - api-responses/ - API response cache
  - temp/ - Temporary files

- **logs/** - System and execution logs
  - agent-execution/ - Agent execution logs
  - workflow/ - Workflow execution logs
  - errors/ - Error logs
  - audit/ - Audit logs

- **backups/** - Automated backups
  - daily/ - Daily backups
  - weekly/ - Weekly backups
  - manual/ - Manual backups

## File Formats

See docs/PERSISTENT_STORAGE.md for detailed format documentation.

## Configuration

See config.json for storage configuration options.

## Backup

Automatic backups are enabled by default. See backups/ directory.

## Maintenance

- **Cache cleanup:** Old cache files are automatically cleaned based on TTL
- **Log rotation:** Logs are rotated based on retention policy
- **Backups:** Automated backups run on configured schedule

---

**Generated by:** setup-persistent-storage.ps1
**Last Updated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@
    
    Set-Content -Path $readmePath -Value $readme
    Write-Success "  ✓ README.md"
}

# Create .gitignore
$gitignorePath = Join-Path $AgentsRoot ".gitignore"
if (-not (Test-Path $gitignorePath) -or $Force) {
    $gitignore = @"
# Cache and temporary files
cache/
*.tmp
*.temp

# Logs
logs/
*.log

# Sensitive data
*.env
*.key
secrets/

# Backups (optional - uncomment if you don't want to track backups)
# backups/

# OS files
.DS_Store
Thumbs.db
desktop.ini

# Editor files
.vscode/
.idea/
*.swp
*.swo
*~
"@
    
    Set-Content -Path $gitignorePath -Value $gitignore
    Write-Success "  ✓ .gitignore"
}

# Create example agent template
$exampleAgentPath = Join-Path $AgentsRoot "agents\templates\example-agent.json"
if (-not (Test-Path $exampleAgentPath) -or $Force) {
    $exampleAgent = @{
        id = "example-agent"
        name = "Example Agent"
        version = "1.0.0"
        description = "An example agent template"
        model = "gpt-4o"
        temperature = 0.7
        maxTokens = 2000
        topP = 1.0
        systemPrompt = "You are an example agent. Replace this with your agent's instructions."
        toolkits = @("agent-development", "file-operations")
        skills = @()
        metadata = @{
            category = "example"
            author = "system"
            created = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        }
    } | ConvertTo-Json -Depth 10
    
    Set-Content -Path $exampleAgentPath -Value $exampleAgent
    Write-Success "  ✓ agents/templates/example-agent.json"
}

# Create example skill template
$exampleSkillPath = Join-Path $AgentsRoot "skills\templates\example-skill.json"
if (-not (Test-Path $exampleSkillPath) -or $Force) {
    $exampleSkill = @{
        id = "example-skill"
        name = "Example Skill"
        version = "1.0.0"
        description = "An example skill template"
        toolkits = @("file-operations")
        systemInstructions = "Core instructions for this skill..."
        rules = @(
            "Rule 1: High-value, compact instruction",
            "Rule 2: Another important guideline",
            "Rule 3: Critical constraint or behavior"
        )
        documents = @()
        collections = @()
        agents = @()
        metadata = @{
            category = "example"
            author = "system"
            created = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        }
    } | ConvertTo-Json -Depth 10
    
    Set-Content -Path $exampleSkillPath -Value $exampleSkill
    Write-Success "  ✓ skills/templates/example-skill.json"
}

Write-Info ""
Write-Info "==================================================="
Write-Success "✓ Setup Complete!"
Write-Info "==================================================="
Write-Info ""
Write-Info "Storage Location: $AgentsRoot"
Write-Info ""
Write-Info "Next Steps:"
Write-Info "  1. Review configuration in: $AgentsRoot\config.json"
Write-Info "  2. Read the README: $AgentsRoot\README.md"
Write-Info "  3. Update MCP server to use this storage location"
Write-Info "  4. Create your first agent in: $AgentsRoot\agents\custom\"
Write-Info ""
Write-Info "Directory Summary:"
foreach ($key in $directories.Keys | Sort-Object) {
    $config = $directories[$key]
    Write-Info "  • $($config.path)"
}
Write-Info ""
Write-Success "Storage system ready for use!"
Write-Info ""
