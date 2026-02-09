---
name: bat-english-formatter
description: Standardizes the content of .bat files by replacing specified non-English strings with English equivalents. Use when you need to enforce English formatting or specific naming conventions within batch scripts.
---

# BAT English Formatter Skill

This skill helps you enforce English formatting within your batch (.bat) scripts by replacing specific non-English strings with their English counterparts.

## Usage

To use this skill, provide the `old_string` (the non-English text to be replaced) and the `new_string` (the English text to replace it with). The skill will automatically find all `.bat` files in the current project and perform the replacement.

### Parameters

- `old_string`: The string to search for in `.bat` files.
- `new_string`: The string to replace `old_string` with.

### Example

Let's say you want to replace "凌一开发" with "Subtitle Summarizer" in all your `.bat` files. You would invoke the skill like this:

```
Task(
    description="Standardize .bat files to English",
    prompt="Use the bat-english-formatter skill to replace '凌一开发' with 'Subtitle Summarizer' in all .bat files.",
    subagent_type="general", # Assuming a general agent can execute skills
    parameters={
        "old_string": "凌一开发",
        "new_string": "Subtitle Summarizer"
    }
)
```

## Workflow

1.  The skill will glob for all `**/*.bat` files in the project.
2.  For each found `.bat` file:
    a.  It will read the file content.
    b.  It will replace all occurrences of `old_string` with `new_string`.
    c.  It will write the modified content back to the file.
3.  A summary of the changes made will be provided.
