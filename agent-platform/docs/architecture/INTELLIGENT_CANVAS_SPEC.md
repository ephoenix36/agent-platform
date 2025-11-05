# 🎨 Intelligent Canvas with Voice Control - Design Document

## Vision

Create the world's most intelligent workflow canvas where users can:
- Search and add agents/workflows/tools by voice
- Configure everything visually with drag-and-drop
- Connect agents with triggers and data flows
- Chat with an AI assistant built into the canvas
- Save, share, and monetize workflows

---

## Core Features

### 1. Voice-Controlled Agent Placement

**Commands:**
```
"Add a website builder agent"
→ Searches marketplace, shows top 3, places selected one

"Create a marketing funnel"
→ Suggests pre-built workflow, adds all connected agents

"Connect this to Stripe"
→ Finds Stripe payment tool, creates connection

"Configure the email agent to send daily"
→ Opens config panel, sets schedule to daily

"Delete the research agent"
→ Removes agent and connections
```

**Implementation:**
```typescript
interface VoiceCommand {
  type: 'add' | 'configure' | 'connect' | 'delete' | 'search';
  entity: 'agent' | 'workflow' | 'tool' | 'connection' | 'trigger';
  details: Record<string, any>;
}

const processVoiceCommand = async (transcript: string): Promise<VoiceCommand> => {
  // Use LLM to parse intent
  const intent = await parseIntent(transcript);
  
  // Execute appropriate action
  switch (intent.type) {
    case 'add':
      return await searchAndAddEntity(intent);
    case 'configure':
      return await openConfiguration(intent);
    case 'connect':
      return await createConnection(intent);
    // ...
  }
};
```

### 2. Inline Marketplace Search

**Location:** Floating search bar in canvas (Cmd+K / Ctrl+K)

**Features:**
- **Instant Search:** Type to filter agents/workflows/tools
- **Visual Preview:** Hover to see capabilities
- **Drag to Add:** Drag search result directly to canvas
- **Smart Suggestions:** Based on existing agents
- **Recent & Favorites:** Quick access to commonly used

**UI Design:**
```tsx
<FloatingSearchBar>
  <SearchInput 
    placeholder="Search marketplace or type '/' for commands..."
    onSearch={handleSearch}
  />
  
  <SearchResults>
    {results.map(result => (
      <SearchResultCard
        key={result.id}
        draggable
        onDragStart={() => prepareForCanvasDrop(result)}
        onHover={() => showPreview(result)}
      >
        <Icon>{result.icon}</Icon>
        <Name>{result.name}</Name>
        <Type>{result.type}</Type>
        <SecurityBadge score={result.security.score} />
      </SearchResultCard>
    ))}
  </SearchResults>
  
  <QuickActions>
    <Tab>Agents</Tab>
    <Tab>Workflows</Tab>
    <Tab>Tools</Tab>
    <Tab>My Library</Tab>
  </QuickActions>
</FloatingSearchBar>
```

### 3. Visual Agent Configuration

**Click any agent → Opens configuration panel**

**Configurable Properties:**

**A. Model Parameters**
```typescript
interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'google';
  model: string;
  temperature: number; // 0-2
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}
```

**UI Component:**
```tsx
<ModelConfigPanel>
  <ModelSelector
    provider={config.provider}
    model={config.model}
    onSelect={updateModel}
  />
  
  <SliderGroup>
    <Slider
      label="Temperature"
      value={config.temperature}
      min={0}
      max={2}
      step={0.1}
      tooltip="Controls randomness. Lower = more focused, Higher = more creative"
    />
    
    <Slider
      label="Max Tokens"
      value={config.maxTokens}
      min={100}
      max={4000}
      step={100}
    />
    
    {/* More sliders... */}
  </SliderGroup>
</ModelConfigPanel>
```

**B. System Instructions**
```tsx
<SystemInstructionsEditor>
  <TemplateSelector>
    <Option>Customer Support</Option>
    <Option>Code Generation</Option>
    <Option>Creative Writing</Option>
    <Option>Data Analysis</Option>
    <Option>Custom</Option>
  </TemplateSelector>
  
  <CodeEditor
    language="markdown"
    value={systemInstructions}
    onChange={updateInstructions}
    height="300px"
  />
  
  <VariableInjector>
    <Button onClick={() => insertVariable('{{user.name}}')}>
      Insert User Name
    </Button>
    <Button onClick={() => insertVariable('{{context}}')}>
      Insert Context
    </Button>
  </VariableInjector>
  
  <TestButton onClick={testInstructions}>
    Test Instructions
  </TestButton>
</SystemInstructionsEditor>
```

**C. Tools & Connectors**
```tsx
<ToolsConfiguration>
  <AvailableTools>
    {marketplaceTools.map(tool => (
      <ToolCard
        key={tool.id}
        tool={tool}
        onAdd={() => addToolToAgent(tool)}
      />
    ))}
  </AvailableTools>
  
  <EnabledTools>
    {agent.tools.map(tool => (
      <EnabledToolCard
        key={tool.id}
        tool={tool}
        onConfigure={() => openToolConfig(tool)}
        onRemove={() => removeTool(tool)}
      />
    ))}
  </EnabledTools>
</ToolsConfiguration>
```

**D. Data Connectors**
```tsx
<DataConnectors>
  <ConnectorList>
    <Connector type="database">
      <Icon>🗄️</Icon>
      <Name>PostgreSQL</Name>
      <Status connected={true} />
      <Config onClick={() => configureDB()}>
        Configure
      </Config>
    </Connector>
    
    <Connector type="api">
      <Icon>🔌</Icon>
      <Name>REST API</Name>
      <URLInput placeholder="https://api.example.com" />
      <AuthSelector>
        <Option>API Key</Option>
        <Option>OAuth 2.0</Option>
        <Option>Basic Auth</Option>
      </AuthSelector>
    </Connector>
    
    <Connector type="file">
      <Icon>📁</Icon>
      <Name>File Upload</Name>
      <FileUploader
        accept=".csv,.json,.xlsx"
        onUpload={handleFileUpload}
      />
    </Connector>
  </ConnectorList>
  
  <AddConnectorButton>
    + Add Data Source
  </AddConnectorButton>
</DataConnectors>
```

**E. Evaluators & Mutators (for agent optimization)**
```tsx
<EvaluatorConfiguration>
  <EvaluatorList>
    <Evaluator>
      <Name>Response Quality</Name>
      <Metric>Coherence, Relevance, Accuracy</Metric>
      <Threshold>
        <Slider min={0} max={100} value={80} />
        <Label>Minimum Score: 80%</Label>
      </Threshold>
    </Evaluator>
    
    <Evaluator>
      <Name>Execution Time</Name>
      <Threshold>
        <Input type="number" value={5} />
        <Label>Max: 5 seconds</Label>
      </Threshold>
    </Evaluator>
    
    <Evaluator>
      <Name>Cost per Run</Name>
      <Threshold>
        <Input type="number" value={0.10} step={0.01} />
        <Label>Max: $0.10</Label>
      </Threshold>
    </Evaluator>
  </EvaluatorList>
  
  <MutatorSettings>
    <Toggle
      label="Auto-optimize prompts"
      enabled={agent.autoOptimize}
      onToggle={toggleAutoOptimize}
    />
    
    <Frequency>
      <Label>Optimization Frequency</Label>
      <Select>
        <Option>After every 10 runs</Option>
        <Option>After every 100 runs</Option>
        <Option>Daily</Option>
        <Option>Weekly</Option>
      </Select>
    </Frequency>
  </MutatorSettings>
</EvaluatorConfiguration>
```

### 4. Connection Flows & Triggers

**Creating Connections:**

**Visual Flow:**
```
[Agent A] ---> Click output port
            ---> Drag to [Agent B] input port
                ---> Configure data mapping
                    ---> Set trigger conditions
```

**Trigger Types:**

1. **Event Triggers**
   - Agent completes
   - New data available
   - Error occurs
   - Time-based (schedule)

2. **Conditional Triggers**
   - If output contains X
   - If confidence > Y
   - If cost < Z
   - Custom conditions

**Connection Configuration UI:**
```tsx
<ConnectionConfig>
  <DataMapping>
    <SourceField>
      <Label>Output from: Website Builder</Label>
      <Select>
        <Option>website_url</Option>
        <Option>html_content</Option>
        <Option>screenshot</Option>
      </Select>
    </SourceField>
    
    <Arrow>→</Arrow>
    
    <TargetField>
      <Label>Input to: SEO Analyzer</Label>
      <Select>
        <Option>url</Option>
        <Option>content</Option>
      </Select>
    </TargetField>
    
    <TransformButton onClick={openTransformer}>
      Add Transformation
    </TransformButton>
  </DataMapping>
  
  <TriggerConditions>
    <Condition>
      <Select>
        <Option>When Agent A completes</Option>
        <Option>When output contains</Option>
        <Option>When confidence > threshold</Option>
        <Option>On schedule</Option>
      </Select>
      
      {/* Conditional inputs based on selection */}
    </Condition>
    
    <AddConditionButton>
      + Add Condition (AND/OR)
    </AddConditionButton>
  </TriggerConditions>
  
  <ErrorHandling>
    <Select>
      <Option>Stop workflow on error</Option>
      <Option>Continue with fallback</Option>
      <Option>Retry 3 times</Option>
      <Option>Alert user</Option>
    </Select>
  </ErrorHandling>
</ConnectionConfig>
```

### 5. Built-in Canvas AI Assistant

**Activation:** Click assistant icon or say "Hey Canvas"

**Capabilities:**

```typescript
interface CanvasAssistant {
  // Understanding context
  analyzeCurrentWorkflow(): WorkflowAnalysis;
  suggestOptimizations(): Suggestion[];
  detectIssues(): Issue[];
  
  // Building workflows
  createWorkflowFromDescription(desc: string): Workflow;
  addMissingConnections(): void;
  suggestNextAgent(): AgentSuggestion[];
  
  // Answering questions
  explainAgent(agentId: string): Explanation;
  howToConnect(fromId: string, toId: string): Tutorial;
  troubleshootError(error: Error): Solution;
}
```

**Conversation Examples:**

```
User: "This workflow is slow, how can I speed it up?"
Assistant: "I see 3 agents running sequentially. I can parallelize the 
research and content agents since they don't depend on each other. 
This would cut time from 45s to 25s. Should I do that?"

User: "Yes, do it"
Assistant: "Done! I've also noticed you're using GPT-4 for simple tasks.
Switching to GPT-3.5-turbo for the summarization step would save 80%
on costs with minimal quality impact. Want me to try that?"

User: "Show me the difference first"
Assistant: "Here's a side-by-side comparison..."
```

**UI Component:**
```tsx
<CanvasAssistant>
  <AssistantAvatar
    status="listening"
    onClick={toggleAssistant}
  />
  
  <ChatInterface>
    <MessageList>
      {messages.map(msg => (
        <Message
          key={msg.id}
          from={msg.from}
          content={msg.content}
          suggestions={msg.suggestions}
        />
      ))}
    </MessageList>
    
    <InputArea>
      <VoiceButton
        active={isListening}
        onClick={toggleVoice}
      />
      <TextInput
        placeholder="Ask me anything about this workflow..."
        value={input}
        onChange={setInput}
        onEnter={sendMessage}
      />
      <SendButton onClick={sendMessage} />
    </InputArea>
    
    <QuickActions>
      <Action onClick={() => ask('Optimize this workflow')}>
        ⚡ Optimize
      </Action>
      <Action onClick={() => ask('Find issues')}>
        🔍 Find Issues
      </Action>
      <Action onClick={() => ask('Explain this agent')}>
        💡 Explain
      </Action>
    </QuickActions>
  </ChatInterface>
</CanvasAssistant>
```

### 6. Save, Share & Monetize

**Saving Workflows:**
```tsx
<SaveMenu>
  <SaveButton onClick={saveToCloud}>
    💾 Save to Cloud
  </SaveButton>
  
  <SaveButton onClick={saveToDevice}>
    📥 Download JSON
  </SaveButton>
  
  <VersionHistory onClick={showVersions}>
    🕐 Version History (12 versions)
  </VersionHistory>
</SaveMenu>
```

**Sharing:**
```tsx
<ShareMenu>
  <ShareLink>
    <Input value={shareUrl} readonly />
    <CopyButton onClick={copyLink}>Copy</CopyButton>
  </ShareLink>
  
  <Permissions>
    <Select>
      <Option>View only</Option>
      <Option>Can edit</Option>
      <Option>Can run</Option>
    </Select>
  </Permissions>
  
  <PublishToMarketplace>
    <Checkbox checked={publishable}>
      Publish to marketplace
    </Checkbox>
    
    {publishable && (
      <PricingConfig>
        <PriceInput
          label="Price"
          type="select"
          options={['Free', 'One-time', 'Subscription', 'Usage-based']}
        />
        {/* Additional pricing fields */}
      </PricingConfig>
    )}
  </PublishToMarketplace>
</ShareMenu>
```

**Monetization Options:**

1. **Free with Credit**
   - Creators get attribution
   - Users can tip
   
2. **One-time Purchase**
   - $5-$500 depending on complexity
   - Lifetime access
   
3. **Subscription**
   - Monthly fee for premium workflows
   - Includes updates and support
   
4. **Usage-based**
   - Pay per execution
   - Good for high-value workflows

---

## Technical Implementation

### State Management

```typescript
interface CanvasState {
  // Nodes (agents, workflows, tools)
  nodes: Record<string, CanvasNode>;
  
  // Edges (connections)
  edges: Record<string, CanvasEdge>;
  
  // Selection
  selectedNodes: string[];
  selectedEdges: string[];
  
  // Viewport
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  
  // Execution
  executionState: Record<string, ExecutionStatus>;
  
  // Assistant
  assistantActive: boolean;
  assistantMessages: Message[];
}

// React Flow for canvas rendering
import ReactFlow, { 
  Node, 
  Edge, 
  Connection,
  addEdge,
  useNodesState,
  useEdgesState 
} from 'reactflow';

// Custom hooks
const useCanvasState = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const addNodeFromMarketplace = (offering: MarketplaceOffering) => {
    const newNode = {
      id: generateId(),
      type: 'agent',
      position: { x: 100, y: 100 },
      data: { offering }
    };
    setNodes((nds) => [...nds, newNode]);
  };
  
  // ... more canvas operations
};
```

### Voice Control Integration

```typescript
import { useSpeechRecognition } from 'react-speech-recognition';

const useVoiceCanvas = () => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();
  
  useEffect(() => {
    if (transcript) {
      processVoiceCommand(transcript);
      resetTranscript();
    }
  }, [transcript]);
  
  const processVoiceCommand = async (command: string) => {
    // Parse intent with LLM
    const intent = await parseCommandIntent(command);
    
    // Execute based on intent
    switch (intent.action) {
      case 'add_agent':
        await searchAndAddAgent(intent.query);
        break;
      case 'configure':
        openConfiguration(intent.nodeId, intent.property);
        break;
      // ... handle other actions
    }
  };
};
```

---

## User Experience Flow

### Scenario: Building a Complete Marketing Automation

**Step 1: Voice Command**
```
User: "Create a marketing funnel workflow"
```

**Canvas Action:**
- Searches marketplace for "marketing funnel"
- Shows top 3 workflow templates
- User selects "Complete Marketing Funnel"
- All agents are added to canvas with connections

**Step 2: Customization**
```
User: "Configure the email agent to use Mailchimp"
```

**Canvas Action:**
- Highlights email agent
- Opens configuration panel
- Shows Mailchimp connector
- User enters API key
- Connection validated ✓

**Step 3: Testing**
```
User: "Run a test with sample data"
```

**Canvas Action:**
- Prompts for test input
- Executes workflow with test data
- Shows execution visualization
- Displays results at each step

**Step 4: Deployment**
```
User: "Activate this workflow to run daily at 9 AM"
```

**Canvas Action:**
- Creates schedule trigger
- Activates workflow
- Shows confirmation
- Adds to active workflows dashboard

---

## Design Principles

1. **Zero Learning Curve**
   - Natural language everywhere
   - Visual, not textual
   - Immediate feedback

2. **Progressive Disclosure**
   - Simple by default
   - Advanced features hidden
   - Reveal complexity as needed

3. **Intelligent Assistance**
   - Proactive suggestions
   - Automatic error detection
   - Smart defaults

4. **Beautiful & Performant**
   - Smooth animations
   - Instant responsiveness
   - Premium aesthetics

---

## Success Metrics

- **Time to First Workflow:** <5 minutes
- **Workflows Created per User:** 10+ average
- **Voice Command Success Rate:** >85%
- **User Satisfaction:** 4.8+ rating
- **Workflow Monetization:** 30% published to marketplace

**This canvas will be the most powerful and intuitive workflow builder ever created.** 🎨
