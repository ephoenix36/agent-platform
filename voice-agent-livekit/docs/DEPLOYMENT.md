# Deployment Guide

Production deployment guide for Voice Agent LiveKit.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Systemd Service](#systemd-service)
- [Monitoring](#monitoring)
- [Security](#security)
- [Scaling](#scaling)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Services

1. **LiveKit Server**
   - Self-hosted or LiveKit Cloud
   - WebSocket endpoint (wss://)
   - API credentials

2. **Gemini API Access**
   - Google AI API key
   - Appropriate quota/limits

3. **Node.js Runtime**
   - Version 20.0.0 or higher
   - npm or pnpm

### Optional Services

4. **MCP Servers** (for tools)
   - Agent platform MCP server
   - Advisor agents
   - Custom tools

5. **Monitoring Stack**
   - Prometheus for metrics
   - Grafana for dashboards
   - ELK/Loki for logs

---

## Environment Setup

### Production Environment Variables

Create a `.env.production` file:

```env
# Node Environment
NODE_ENV=production

# LiveKit (Required)
LIVEKIT_URL=wss://your-livekit.livekit.cloud
LIVEKIT_API_KEY=your_production_api_key
LIVEKIT_API_SECRET=your_production_secret

# Gemini (Required)
GEMINI_API_KEY=your_production_gemini_key

# Agent Configuration
AGENT_NAME=VoiceAssistant
AGENT_DESCRIPTION="Production voice assistant"
DEFAULT_LANGUAGE=en-US

# Performance (Tuned for Production)
ENABLE_PRE_BUFFERING=true
PRE_BUFFER_SIZE=5
MAX_LATENCY_MS=300
STREAM_CHUNK_SIZE=8192
ENABLE_STREAMING=true

# MCP Configuration
MCP_SERVERS_CONFIG_PATH=/etc/voice-agent/mcp-servers.json
MCP_TOOL_TIMEOUT=15000

# Collaboration
ENABLE_EXPERT_ADVISORS=true
ADVISOR_AGENT_ENDPOINT=https://advisors.yourdomain.com/api/v1/agents
VALIDATOR_TIMEOUT_MS=5000
INVESTIGATION_DEPTH=3

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/voice-agent/voice-agent.log

# Monitoring
METRICS_PORT=9090
HEALTH_CHECK_PORT=8080
```

### Security Best Practices

1. **Never commit `.env` files**
2. **Use secrets management**:
   - AWS Secrets Manager
   - HashiCorp Vault
   - Kubernetes Secrets
3. **Rotate credentials regularly**
4. **Use least-privilege API keys**

---

## Docker Deployment

### Dockerfile

```dockerfile
# Multi-stage build for smaller image
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY mcp-servers.json ./

# Create non-root user
RUN addgroup -g 1001 -S voiceagent && \
    adduser -S voiceagent -u 1001

# Create log directory
RUN mkdir -p /var/log/voice-agent && \
    chown -R voiceagent:voiceagent /var/log/voice-agent

USER voiceagent

EXPOSE 8080 9090

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node dist/healthcheck.js

CMD ["node", "dist/index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  voice-agent:
    build: .
    container_name: voice-agent
    restart: unless-stopped
    
    environment:
      - NODE_ENV=production
    
    env_file:
      - .env.production
    
    ports:
      - "8080:8080"  # Health check
      - "9090:9090"  # Metrics
    
    volumes:
      - ./logs:/var/log/voice-agent
      - ./config/mcp-servers.json:/app/mcp-servers.json:ro
    
    networks:
      - voice-agent-network
    
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

networks:
  voice-agent-network:
    driver: bridge
```

### Build and Run

```bash
# Build image
docker build -t voice-agent:latest .

# Run container
docker-compose up -d

# View logs
docker-compose logs -f voice-agent

# Check health
curl http://localhost:8080/health

# Stop
docker-compose down
```

---

## Kubernetes Deployment

### Deployment YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: voice-agent
  labels:
    app: voice-agent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: voice-agent
  template:
    metadata:
      labels:
        app: voice-agent
    spec:
      containers:
      - name: voice-agent
        image: your-registry/voice-agent:latest
        ports:
        - containerPort: 8080
          name: health
        - containerPort: 9090
          name: metrics
        
        env:
        - name: NODE_ENV
          value: "production"
        
        envFrom:
        - secretRef:
            name: voice-agent-secrets
        - configMapRef:
            name: voice-agent-config
        
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        
        volumeMounts:
        - name: config
          mountPath: /app/mcp-servers.json
          subPath: mcp-servers.json
        - name: logs
          mountPath: /var/log/voice-agent
      
      volumes:
      - name: config
        configMap:
          name: voice-agent-config
      - name: logs
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: voice-agent
spec:
  selector:
    app: voice-agent
  ports:
  - name: health
    port: 8080
    targetPort: 8080
  - name: metrics
    port: 9090
    targetPort: 9090
  type: ClusterIP
---
apiVersion: v1
kind: Secret
metadata:
  name: voice-agent-secrets
type: Opaque
stringData:
  LIVEKIT_API_KEY: "your_api_key"
  LIVEKIT_API_SECRET: "your_api_secret"
  GEMINI_API_KEY: "your_gemini_key"
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: voice-agent-config
data:
  mcp-servers.json: |
    {
      "mcpServers": {
        "agent-platform": {
          "command": "node",
          "args": ["/mcp/agent-platform/index.js"],
          "description": "Main agent platform",
          "enabled": true
        }
      }
    }
```

### Deploy to Kubernetes

```bash
# Apply configuration
kubectl apply -f k8s/

# Check deployment
kubectl get deployments
kubectl get pods

# View logs
kubectl logs -f deployment/voice-agent

# Scale
kubectl scale deployment voice-agent --replicas=5

# Rolling update
kubectl set image deployment/voice-agent voice-agent=voice-agent:v2
```

---

## Systemd Service

For traditional VPS/dedicated servers.

### Service File

Create `/etc/systemd/system/voice-agent.service`:

```ini
[Unit]
Description=Voice Agent LiveKit
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=voiceagent
Group=voiceagent
WorkingDirectory=/opt/voice-agent
ExecStart=/usr/bin/node /opt/voice-agent/dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=voice-agent

# Environment
Environment=NODE_ENV=production
EnvironmentFile=/opt/voice-agent/.env.production

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/log/voice-agent

# Resource limits
LimitNOFILE=65536
MemoryLimit=2G
CPUQuota=200%

[Install]
WantedBy=multi-user.target
```

### Setup

```bash
# Create user
sudo useradd -r -s /bin/false voiceagent

# Create directories
sudo mkdir -p /opt/voice-agent
sudo mkdir -p /var/log/voice-agent
sudo chown -R voiceagent:voiceagent /opt/voice-agent /var/log/voice-agent

# Deploy application
sudo cp -r dist node_modules package.json /opt/voice-agent/
sudo cp .env.production /opt/voice-agent/
sudo chown -R voiceagent:voiceagent /opt/voice-agent

# Install service
sudo cp voice-agent.service /etc/systemd/system/
sudo systemctl daemon-reload

# Enable and start
sudo systemctl enable voice-agent
sudo systemctl start voice-agent

# Check status
sudo systemctl status voice-agent

# View logs
sudo journalctl -u voice-agent -f
```

---

## Monitoring

### Health Check Endpoint

Create `src/healthcheck.ts`:

```typescript
import http from 'http';

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', timestamp: new Date() }));
  } else if (req.url === '/ready') {
    // Check if agent is ready (MCP connected, etc.)
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ready' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const port = process.env.HEALTH_CHECK_PORT || 8080;
server.listen(port, () => {
  console.log(`Health check running on port ${port}`);
});
```

### Prometheus Metrics

Add metrics endpoint:

```typescript
import promClient from 'prom-client';

const register = new promClient.Registry();

// Metrics
const requestDuration = new promClient.Histogram({
  name: 'voice_agent_request_duration_seconds',
  help: 'Request duration',
  labelNames: ['type'],
  registers: [register],
});

const cacheHits = new promClient.Counter({
  name: 'voice_agent_cache_hits_total',
  help: 'Cache hits',
  registers: [register],
});

// Expose metrics
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

---

## Security

### HTTPS/TLS

Always use HTTPS in production. Use a reverse proxy (Nginx, Caddy):

```nginx
server {
    listen 443 ssl http2;
    server_name voice-agent.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## Scaling

### Horizontal Scaling

- Multiple instances behind load balancer
- Session affinity for LiveKit rooms
- Shared cache (Redis) for response caching

### Vertical Scaling

- Increase CPU/memory limits
- Tune Node.js heap size
- Optimize MCP tool timeout

---

## Troubleshooting

### Common Issues

**Issue: High latency**
- Check `MAX_LATENCY_MS` setting
- Enable pre-buffering
- Verify network connectivity to LiveKit/Gemini

**Issue: Out of memory**
- Increase memory limits
- Check for memory leaks
- Clear conversation history periodically

**Issue: Tool execution fails**
- Verify MCP server connectivity
- Check tool timeout settings
- Review MCP server logs

**Issue: Connection drops**
- Verify LiveKit credentials
- Check network stability
- Review LiveKit server status

### Logs

```bash
# Docker
docker logs voice-agent

# Kubernetes
kubectl logs -f deployment/voice-agent

# Systemd
journalctl -u voice-agent -f

# File
tail -f /var/log/voice-agent/voice-agent.log
```

---

## Next Steps

- Set up monitoring dashboards
- Configure alerts for errors
- Implement backup/restore
- Plan disaster recovery
- Performance tuning
