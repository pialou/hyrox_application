# Directive Template

> Copy this template to create new directives. Replace all placeholder text.

## Goal
[What this directive accomplishes. One sentence.]

## When to Use
[Conditions that trigger this directive—user request patterns, scheduled tasks, etc.]

## Inputs
| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `param_1` | string | Yes | Description of param_1 |
| `param_2` | list | No | Description of param_2 |

## Execution Steps

1. **Step Name**
   - Script: `execution/script_name.py`
   - Input: What to pass
   - Output: What to expect

2. **Step Name**
   - Script: `execution/another_script.py`
   - Input: Output from step 1
   - Output: Final result

## Outputs
- **Deliverable**: [Where the final output goes—Google Sheet URL, Slides, etc.]
- **Intermediate files**: [What gets saved to `.tmp/`]

## Edge Cases & Error Handling
| Scenario | How to Handle |
|----------|---------------|
| API rate limit | Wait 60s and retry, max 3 attempts |
| Missing data | Log warning, continue with available data |
| Script failure | Check logs in `.tmp/`, retry once |

## Learnings & Notes
<!-- Update this section as you discover constraints, better approaches, or common issues -->
- [Date]: [Learning]
