---
name: auto-update-chinese-readme
description: Automates the generation and update of README.md content in Chinese, reflecting recent code changes and project status. Use this skill after significant code modifications or before a release to ensure the README.md is always up-to-date and accurate.
---

# Auto Update Chinese README Skill

This skill assists in keeping your project's `README.md` file up-to-date and in Chinese, based on recent code changes.

## How to Use

To use this skill, you need to explicitly invoke it. Since an AI cannot "know" when a program modification is truly "completed" or fully understand the nuanced impact of every change without explicit guidance, you will need to trigger this skill when you feel the `README.md` needs an update.

The skill will perform the following actions:

1.  **Analyze Git History**: It will use `git log` and `git diff` to understand recent changes since the last `README.md` update or a specified baseline.
2.  **Summarize Changes**: It will generate a concise summary of new features, bug fixes, or significant refactorings in Chinese, based on commit messages and code differences.
3.  **Read Existing README.md**: It will read the current `README.md` to understand its structure and existing content.
4.  **Generate New Chinese README.md Content**: Based on the project's overview (from `AGENTS.md`), the current `README.md` structure, and the summarized changes, it will generate an updated `README.md` content in Chinese.
5.  **Update File**: It will overwrite the old `README.md` with the new, updated content.
6.  **Suggest Commit**: After updating, it will suggest creating a Git commit for the `README.md` changes.

### Triggering the Skill

You can invoke this skill using the `Task` tool. For example:

```python
Task(
    description="Update the Chinese README.md to reflect recent changes.",
    prompt="请使用 auto-update-chinese-readme 技能更新项目的中文 README.md。请分析最近的 Git 提交以识别变更，并将其整合到 README 中。",
    subagent_type="general" # Assuming a general agent can execute skills
)
```

## Considerations

*   **Explicit Trigger**: Remember that you need to explicitly trigger this skill. It does not automatically run after every single file modification.
*   **Git History**: The accuracy of the generated `README.md` content heavily depends on clear and descriptive Git commit messages.
*   **Existing Structure**: The skill will attempt to maintain the existing structure of your `README.md`. Major structural changes might still require manual adjustments.
*   **Review**: Always review the changes made to `README.md` after the skill runs, as AI-generated content might not always perfectly capture your intent.

## Parameters

Currently, this skill does not require any specific parameters when invoked. It operates by analyzing the project's Git history and existing `README.md` and `AGENTS.md` files.
