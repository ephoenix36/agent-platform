# Voice Recognition Troubleshooting Guide

## Overview
The platform uses the Web Speech API (specifically `webkitSpeechRecognition` or `SpeechRecognition`) for voice commands. This API requires specific conditions to work correctly.

---

## Common Errors

### 1. **Network Error** ❌

**Error Message:** `Speech recognition error: "network"`

**Causes:**
- Page served over HTTP instead of HTTPS
- Browser security policies blocking the API
- Network connectivity issues
- Service temporarily unavailable

**Solutions:**

#### For Development (localhost):
✅ **Works on localhost** - The Web Speech API is allowed on `http://localhost` and `http://127.0.0.1`

Current dev server runs on: `http://localhost:3001`

#### For Production:
⚠️ **HTTPS Required** - The Web Speech API requires HTTPS in production

**Deployment Checklist:**
1. Deploy to a hosting platform with HTTPS (Vercel, Netlify, AWS, etc.)
2. Ensure SSL certificate is valid
3. No mixed content warnings
4. Test voice in incognito mode first

**Quick HTTPS Setup Options:**

```bash
# Option 1: Vercel (Recommended)
npm install -g vercel
cd apps/web
vercel

# Option 2: Netlify
npm install -g netlify-cli
cd apps/web
netlify deploy --prod

# Option 3: Local HTTPS (for testing)
# Install mkcert
mkcert -install
mkcert localhost 127.0.0.1 ::1

# Update package.json
{
  "scripts": {
    "dev:https": "next dev --experimental-https --experimental-https-key=./localhost-key.pem --experimental-https-cert=./localhost.pem"
  }
}
```

---

### 2. **Not-Allowed Error** ❌

**Error Message:** `Speech recognition error: "not-allowed"`

**Cause:** Microphone permissions denied

**Solutions:**
1. Click the microphone icon in browser address bar
2. Select "Always allow" for this site
3. Reload the page
4. Try again

**Browser-Specific Instructions:**

**Chrome/Edge:**
1. Click the lock/info icon in address bar
2. Click "Site settings"
3. Find "Microphone"
4. Change to "Allow"

**Firefox:**
1. Click the microphone icon in address bar
2. Select "Always Allow"
3. Click "Allow"

**Safari:**
1. Safari > Settings > Websites > Microphone
2. Find your site
3. Change to "Allow"

---

### 3. **No-Speech Error** ⚠️

**Error Message:** `Speech recognition error: "no-speech"`

**Cause:** No speech detected within timeout period

**Solutions:**
1. Check microphone is not muted
2. Speak louder and clearer
3. Reduce background noise
4. Check microphone input levels in system settings

---

### 4. **Audio-Capture Error** ❌

**Error Message:** `Speech recognition error: "audio-capture"`

**Cause:** No microphone detected

**Solutions:**
1. Plug in microphone/headset
2. Check system audio settings
3. Restart browser
4. Check device permissions

---

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome (Desktop) | ✅ Full | Best support |
| Edge (Desktop) | ✅ Full | Uses Chromium engine |
| Safari (Desktop) | ⚠️ Limited | Requires macOS 14.3+ |
| Firefox (Desktop) | ❌ No | Not supported |
| Chrome (Android) | ✅ Full | Requires HTTPS |
| Safari (iOS) | ⚠️ Limited | iOS 14.5+ |

**Recommended:** Chrome or Edge on desktop for best experience

---

## Testing Voice Recognition

### Quick Test Checklist

```bash
# 1. Check browser support
# Open browser console and run:
const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
console.log('Supported:', !!SpeechRecognition);

# 2. Test microphone access
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(() => console.log('Microphone OK'))
  .catch(err => console.error('Microphone Error:', err));

# 3. Check HTTPS
console.log('Protocol:', window.location.protocol);
// Should be "https:" or "http:" (only if localhost)
```

### Manual Test Procedure

1. **Navigate to Canvas:**
   - Click "Canvas" tab
   - Verify React Flow loads

2. **Enable Voice:**
   - Click the "Voice" button (🎤)
   - Look for pulsing/animated state

3. **Grant Permission:**
   - Browser will ask for microphone permission
   - Click "Allow"

4. **Speak Command:**
   - Say "Add website builder"
   - Watch for transcript display
   - Verify action occurs

5. **Check Console:**
   - Open DevTools (F12)
   - Look for errors or warnings

---

## Current Implementation

### Error Handling (EnhancedCanvas.tsx)

```typescript
recognition.onerror = (event: any) => {
  console.error('Speech recognition error:', event.error);
  setIsListening(false);
  
  // Handle different error types
  switch (event.error) {
    case 'not-allowed':
      alert('Microphone access denied. Please allow microphone permissions in your browser settings.');
      break;
    case 'network':
      console.warn('Network error in speech recognition. This is often a browser issue. Retrying...');
      // Network errors are often transient, don't show alert
      // The recognition will auto-stop, user can retry manually
      break;
    case 'no-speech':
      console.log('No speech detected. Please try again.');
      break;
    case 'audio-capture':
      alert('No microphone detected. Please check your audio input device.');
      break;
    case 'aborted':
      console.log('Speech recognition aborted.');
      break;
    default:
      console.warn(`Speech recognition error: ${event.error}`);
  }
};
```

### Recommended Enhancements

1. **User-Friendly Notifications:**
   - Replace alerts with toast notifications
   - Show status in UI (not just console)
   - Visual feedback for listening state

2. **Retry Logic:**
   - Auto-retry on network errors (with backoff)
   - Maximum retry attempts
   - User control to cancel retries

3. **Fallback Options:**
   - Text input as alternative
   - Keyboard shortcuts
   - Click-based command palette

4. **Connection Status:**
   - Display HTTPS/HTTP status
   - Warn users on HTTP (production)
   - Link to deployment guide

---

## Production Deployment

### HTTPS Requirement

**The Web Speech API will NOT work in production without HTTPS**

### Deployment Options

#### 1. Vercel (Recommended - Easiest)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to web app
cd Agents/agent-platform/apps/web

# Deploy
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set build command: npm run build
# - Set output directory: .next
# - Deploy!
```

**Benefits:**
- Automatic HTTPS
- Free tier available
- Automatic deployments
- Edge network

#### 2. Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Navigate to web app
cd Agents/agent-platform/apps/web

# Build
npm run build

# Deploy
netlify deploy --prod

# Follow prompts
```

**Benefits:**
- Automatic HTTPS
- Free tier available
- Easy rollbacks

#### 3. Self-Hosted (AWS/DigitalOcean/etc.)

**Requirements:**
- SSL certificate (Let's Encrypt recommended)
- Reverse proxy (nginx/Apache)
- Node.js runtime

**nginx Example:**

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Voice Commands Available

### Canvas Commands

| Command | Action |
|---------|--------|
| "Add website builder" | Search marketplace and add Website Builder agent |
| "Add [agent name]" | Search and add specific agent |
| "Create workflow" | Open workflow builder |
| "Save canvas" | Save current canvas state |
| "Clear canvas" | Remove all nodes |
| "Show tools" | Display available MCP tools |

### Future Commands

- "Connect [node A] to [node B]"
- "Run workflow"
- "Export as JSON"
- "Import workflow"
- "Add comment [text]"

---

## Debugging Tips

### Enable Verbose Logging

Add this to your component:

```typescript
// In EnhancedCanvas.tsx, add after recognition.start():

recognition.onaudiostart = () => console.log('🎤 Audio capture started');
recognition.onaudioend = () => console.log('🎤 Audio capture ended');
recognition.onsoundstart = () => console.log('🔊 Sound detected');
recognition.onsoundend = () => console.log('🔇 Sound ended');
recognition.onspeechstart = () => console.log('🗣️ Speech detected');
recognition.onspeechend = () => console.log('🗣️ Speech ended');
recognition.onnomatch = () => console.log('❌ No match found');
```

### Check Microphone in System

**Windows:**
1. Right-click speaker icon → Sounds
2. Recording tab
3. Speak into microphone
4. Watch level indicator

**macOS:**
1. System Preferences → Sound
2. Input tab
3. Select microphone
4. Watch input level

**Linux:**
1. Settings → Sound
2. Input tab
3. Test microphone

---

## Alternative Input Methods

If voice doesn't work, users can still:

1. **Keyboard Shortcut:** Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux) to open search
2. **Click Search Button:** Click the "Search (⌘K)" button
3. **Direct Selection:** Browse marketplace tab and drag items to canvas

---

## Support & Reporting Issues

If voice recognition still doesn't work:

1. **Check Console:** Press F12 and look for errors
2. **Browser Version:** Ensure browser is up-to-date
3. **Try Incognito:** Test in incognito/private mode
4. **Different Browser:** Try Chrome if using another browser
5. **Report:** Include:
   - Browser & version
   - OS & version
   - HTTP or HTTPS
   - Error message from console
   - Steps to reproduce

---

## Summary

✅ **Works on:**
- `http://localhost:*`
- `https://*` (any HTTPS site)
- Chrome/Edge desktop
- Chrome Android (HTTPS only)

❌ **Does NOT work on:**
- `http://*` (non-localhost HTTP)
- Firefox (any)
- Old browser versions
- Without microphone permissions

🔧 **Solutions:**
1. Development: Use localhost (already working)
2. Production: Deploy to HTTPS (Vercel/Netlify/etc.)
3. Always: Grant microphone permissions
4. Fallback: Use keyboard/click alternatives

---

**Last Updated:** November 1, 2025
**Version:** 1.0.0
