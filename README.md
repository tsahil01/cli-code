# CLI Code

> **Interact with your codebase using a conversational AI agent**

CLI Code is a powerful command-line interface that bridges your development workflow with AI-powered assistance. Chat with your codebase, execute commands, and get contextual help directly from your terminal.

🌐 **[Visit our website](https://web-cli-code.vercel.app)** | 📚 **[View Documentation](https://web-cli-code.vercel.app/docs/quickstart)**

![CLI Code Interface](/docs/imgs/screenshot_1.png)

*CLI Code in action: Beautiful terminal interface with AI-powered tool execution and real-time editor integration*

## Features

### Core Functionality
- **Conversational AI Integration** - Chat with multiple AI models (Anthropic Claude, OpenAI GPT, Google Gemini, etc.)
- **Codebase Interaction** - Execute commands, read files, and manipulate your project through natural language
- **Editor Integration** - Seamless integration with VS Code through WebSocket bridge
- **Real-time Context** - Access active files, selections, diagnostics, and diffs from your editor
- **Tool Execution** - Run system commands, search files, and perform operations with AI assistance

### User Experience
- **Rich Terminal UI** - Beautiful React/Ink-based interface with syntax highlighting
- **Session Management** - Create, save, and switch between different chat sessions
- **Configuration Management** - Easy setup and management of API keys and settings
- **Multiple Usage Modes** - Choose between 'lite' and 'full' modes with optional add-ons
- **Command System** - Built-in slash commands for quick actions

### AI Model Support
- **Anthropic Claude** - Claude 3.5 Haiku, Sonnet, and other models
- **OpenAI GPT (soon)** - GPT-4, GPT-4o, and other OpenAI models  
- **Google Gemini** - Gemini Pro and other Google models
- **Moonshot Kimi** - Moonshot Kimi 2.0
- **Flexible Configuration** - Easy API key management and model switching
- Will add more models in the future

## 🚀 Revolutionary Plan Mode System

**What makes CLI Code different from other AI coding tools?**

CLI Code introduces a unique **Plan Mode** system that dramatically reduces AI costs while maintaining exceptional performance - something no other tool offers.

### Two Modes, Maximum Efficiency

#### 🔥 **Lite Mode** (Recommended)
- **Cost Savings**: Up to **80% cheaper** than traditional AI coding tools
- **Smart Context Management**: Only sends relevant code context, not entire files
- **Selective Add-ons**: Choose only what you need
  - `memory` - Conversation history and learning
  - `github` - Repository integration and PR analysis  
  - `advanced-context` - Enhanced code understanding
- **Perfect for**: Daily coding, debugging, code reviews

#### ⚡ **Full Mode** 
- **Complete Access**: All features enabled
- **Maximum Context**: Full file contents and comprehensive analysis
- **Enterprise Ready**: For complex codebases and team collaboration
- **Best for**: Large refactoring, architecture decisions, complex debugging



**Switch between modes instantly** with `/mode` command based on your current task complexity.

## Installation

### Global Installation
```bash
npm install -g @tsahil01/cli-code
```

### Run the CLI
```bash
cli-code
```

## Quick Start

1. **Website Login**: Sign in at [web-cli-code.vercel.app](https://web-cli-code.vercel.app) to get your authentication token
2. **First Launch**: The tool will guide you through initial setup with your login token
3. **API Key Setup**: Configure your API keys for AI providers
4. **Model Selection**: Choose your preferred AI model
5. **Start Chatting**: Begin interacting with your codebase

📖 **For detailed setup instructions, visit our [Quickstart Guide](https://web-cli-code.vercel.app/docs/quickstart)**

## Usage

### Basic Commands

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/model` | Switch between AI models |
| `/api` | Manage API keys |
| `/mode` | Change usage mode (lite/full) |
| `/settings` | Edit configuration file |
| `/sessions` | Manage chat sessions |
| `/new` | Start a new session |
| `/exit` | Exit the application |

### Example Interactions

```bash
# Ask about your codebase
> What files are in my project?

# Get help with code
> How can I optimize this function?

# Execute commands
> Create a new React component

# File operations
> Show me the contents of package.json
```

## Configuration

The tool stores configuration in `~/.config/cli-code/config.json`:

```json
{
  "accessToken": "your-access-token-from-website",
  "refreshToken": "your-refresh-token-from-website",
  "ANTHROPIC_API_KEY": "your-anthropic-key",
  "OPENAI_API_KEY": "your-openai-key",
  "GEMINI_API_KEY": "your-gemini-key",
  "selectedModel": {
    "provider": "anthropic",
    "model": "claude-3-5-haiku-20241022"
  },
  "plan": {
    "mode": "lite",
    "addOns": ["memory", "github"]
  },
  "acceptAllToolCalls": false
}
```

## Architecture

### Components

- **Frontend**: React/Ink terminal interface
- **Web Portal**: Authentication and account management at [web-cli-code.vercel.app](https://web-cli-code.vercel.app)
- **Backend**: Local development servers (ports 3000, 4000)
- **Editor Bridge**: WebSocket connection to VS Code extension
- **Configuration**: JSON-based settings management
- **Authentication**: Web-based login with JWT tokens for CLI access

### Key Modules

- **`src/lib/auth.ts`** - Authentication and token management
- **`src/lib/chat.ts`** - AI model communication and streaming
- **`src/lib/editor.ts`** - VS Code integration and context
- **`src/lib/tools.ts`** - Tool execution and command handling
- **`src/lib/configMngt.ts`** - Configuration file management
- **`src/ui/agent.tsx`** - Main chat interface component

### Editor Integration

The tool integrates with VS Code through the `SahilTiwaskar.vscode-context-bridge` extension, providing:

- Active file information
- Text selections
- Open tabs
- Git diffs
- Diagnostic information
- Command execution capabilities

## Development

### Setup
```bash
# Clone the repository
git clone https://github.com/tsahil01/cli-code.git
cd cli-code

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Link for local testing
npm link
```

### Project Structure
```
cli-code/
├── src/
│   ├── index.tsx              # Main entry point
│   ├── types.ts               # Type definitions
│   ├── lib/                   # Core libraries
│   │   ├── auth.ts           # Authentication
│   │   ├── chat.ts           # AI chat functionality
│   │   ├── editor.ts         # Editor integration
│   │   ├── tools.ts          # Tool execution
│   │   └── configMngt.ts     # Configuration management
│   └── ui/                   # UI components
│       ├── agent.tsx         # Main chat interface
│       └── components/       # Reusable components
├── package.json
└── tsconfig.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues and questions:
- GitHub Issues: [https://github.com/tsahil01/cli-code/issues](https://github.com/tsahil01/cli-code/issues)
- Repository: [https://github.com/tsahil01/cli-code](https://github.com/tsahil01/cli-code)

---

**Made with ❤️ by developers, for developers**
