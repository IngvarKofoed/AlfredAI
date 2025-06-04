# AI Personality System

The AI Personality System allows you to create, manage, and switch between different AI personalities that customize how the assistant behaves and responds to your queries.

## Overview

Each personality defines:
- **Communication style** (friendly, professional, casual, etc.)
- **Tone and formality level**
- **Areas of expertise**
- **Custom greetings and farewells**
- **Error handling approach**
- **Verbosity and creativity levels**
- **Custom system prompts**

## Quick Start

### List Available Presets
```bash
# See what personality presets are available
personalityManager action=list-presets
```

### Create Your First Personality
```bash
# Create a personality from a preset
personalityManager action=create-from-preset presetName="Friendly Coding Buddy" name="My Coding Assistant"

# Or create a completely custom personality
personalityManager action=create name="My Assistant" description="A helpful coding assistant" tone=friendly communicationStyle=conversational expertise="programming,debugging" greeting="Let's code together!"
```

### Activate a Personality
```bash
# List your personalities to get the ID
personalityManager action=list

# Activate one by ID
personalityManager action=activate personalityId=personality_1234567890_abcdef123
```

## Available Actions

| Action | Description | Required Parameters |
|--------|-------------|-------------------|
| `list` | List all created personalities | None |
| `list-presets` | List available personality presets | None |
| `get` | Get detailed info about a personality | `personalityId` |
| `get-active` | Get the currently active personality | None |
| `create` | Create a new personality | `name`, `description`, `tone`, `communicationStyle` |
| `create-from-preset` | Create from a preset | `presetName` |
| `update` | Update an existing personality | `personalityId` + fields to update |
| `delete` | Delete a personality | `personalityId` |
| `activate` | Set a personality as active | `personalityId` |
| `deactivate` | Deactivate current personality | None |
| `search` | Search personalities by keywords | `query` |
| `export` | Export personality as JSON | `personalityId` |
| `import` | Import personality from JSON | `personalityData` |

## Personality Traits

### Tone Options
- `professional` - Business-like, formal approach
- `friendly` - Warm, approachable manner
- `casual` - Relaxed, informal style
- `enthusiastic` - Energetic, excited demeanor
- `calm` - Peaceful, measured responses
- `authoritative` - Confident, expert-like
- `supportive` - Encouraging, helpful attitude
- `witty` - Clever, humorous responses
- `serious` - Focused, no-nonsense approach
- `playful` - Fun, lighthearted interaction

### Communication Styles
- `direct` - Straight to the point
- `conversational` - Natural, flowing dialogue
- `explanatory` - Detailed explanations
- `concise` - Brief, compact responses
- `detailed` - Thorough, comprehensive answers
- `socratic` - Teaching through questions
- `collaborative` - Working together approach
- `mentoring` - Guiding and teaching style

### Error Handling Styles
- `apologetic` - Says sorry, takes responsibility
- `solution-focused` - Immediately provides fixes
- `educational` - Explains what went wrong and why
- `reassuring` - Calms fears, builds confidence
- `direct` - Factual, straightforward error reporting
- `encouraging` - Motivational, positive spin on errors

## Examples

### Creating a Custom Coding Assistant
```bash
personalityManager action=create \
  name="Code Mentor" \
  description="Patient coding teacher" \
  tone=calm \
  communicationStyle=mentoring \
  expertise="programming,architecture,best-practices" \
  greeting="Welcome! What would you like to learn about coding today?" \
  farewell="Keep practicing, you're doing great!" \
  errorHandling=educational \
  verbosity=comprehensive \
  formality=semi-formal \
  creativity=balanced \
  systemPrompt="You are a patient coding mentor. Always explain the reasoning behind your suggestions and help the user understand fundamental concepts." \
  tags="coding,mentor,education" \
  author="Your Name"
```

### Creating a Quick Problem Solver
```bash
personalityManager action=create \
  name="Quick Solver" \
  description="Fast, efficient problem solver" \
  tone=professional \
  communicationStyle=direct \
  expertise="problem-solving,efficiency" \
  greeting="Ready to solve problems quickly and effectively." \
  farewell="Problem solved! Anything else?" \
  errorHandling=solution-focused \
  verbosity=minimal \
  formality=formal \
  creativity=conservative \
  tags="efficiency,problem-solving"
```

### Searching and Managing
```bash
# Search for coding-related personalities
personalityManager action=search query="coding"

# Get details about a specific personality
personalityManager action=get personalityId=personality_1234567890_abcdef123

# Update a personality's greeting
personalityManager action=update personalityId=personality_1234567890_abcdef123 greeting="Hey there, coder!"

# Export a personality for sharing
personalityManager action=export personalityId=personality_1234567890_abcdef123
```

## Built-in Presets

The system comes with several ready-to-use presets:

1. **Professional Assistant** - Business-focused, efficient, formal
2. **Friendly Coding Buddy** - Casual programming helper with emojis
3. **Wise Mentor** - Patient teacher using Socratic method
4. **Creative Collaborator** - Imaginative brainstorming partner

## File Storage

Personalities are stored in `backend/ai-personalities.json`. This file:
- Is automatically created when you first use the system
- Contains all your custom personalities and active selection
- Is excluded from git to protect your personal configurations
- Can be backed up manually if desired

Example structure:
```json
{
  "activePersonalityId": "personality_1234567890_abcdef123",
  "personalities": {
    "personality_1234567890_abcdef123": {
      "id": "personality_1234567890_abcdef123",
      "name": "My Assistant",
      "description": "...",
      // ... personality configuration
    }
  },
  "presets": [
    // ... built-in presets
  ]
}
```

## Integration with AI Responses

When a personality is active, the system can use:
- The `systemPrompt` to influence AI behavior
- `greeting` and `farewell` for session starts/ends
- Personality traits to adjust response style
- `contextualPrompts` for specific scenarios
- `expertise` areas to focus knowledge

## Tips

1. **Start with presets** - Modify existing presets rather than starting from scratch
2. **Use descriptive tags** - Makes searching easier later
3. **Test personalities** - Activate and try them with different types of questions
4. **Export favorites** - Share good personalities with team members
5. **Backup configurations** - Save your `ai-personalities.json` file periodically

## Troubleshooting

### "Personality not found" errors
- Check the personality ID is correct with `personalityManager action=list`
- Ensure the personality wasn't accidentally deleted

### Changes not taking effect
- Verify the personality is actually activated with `personalityManager action=get-active`
- Check that your updates were saved with `personalityManager action=get personalityId=...`

### Configuration file issues
- Check file permissions on `backend/ai-personalities.json`
- Verify JSON syntax if editing manually
- Delete the file to reset to defaults (you'll lose custom personalities)

## Advanced Usage

### Contextual Prompts
You can define specialized prompts for different scenarios:

```json
{
  "contextualPrompts": {
    "debugging": "Let's debug this step by step...",
    "code-review": "Here's my feedback on your code...",
    "learning": "Great question! Let me explain..."
  }
}
```

### Custom System Prompts
Override the default AI behavior with detailed instructions:

```json
{
  "systemPrompt": "You are a senior software architect with 15 years of experience. Always consider scalability, maintainability, and performance. Provide concrete examples and suggest best practices. When reviewing code, focus on design patterns and architectural concerns."
}
```

### Version Control
Each personality has version tracking:
- `version` - Semantic version (e.g., "1.0.0")
- `createdAt` - When it was first created
- `updatedAt` - Last modification time

This helps track changes over time and understand personality evolution. 