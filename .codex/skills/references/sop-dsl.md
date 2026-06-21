# SOP DSL Reference

## File Format

SOP rules are YAML files stored in `.sop-graph/` at the repo root.

```yaml
version: "1.0"
domains:
  - domain: <domain-name>
    rules:
      - action: require    # or "forbid"
        target: "<pattern>"
        reason: "<why>"
```

## Rule Actions

| Action | Meaning |
|---|---|
| `require` | ✅ MUST follow this rule |
| `forbid`  | 🚫 MUST NOT do this |

## CLI Commands

```bash
# Initialize .sop-graph/ with example
runtime context sop-init

# Add a domain
runtime context sop-add security --rules '[
  {"action":"forbid","target":"any-type","reason":"Use explicit types"},
  {"action":"require","target":"strict-mode","reason":"Enable strict type checking"}
]'

# List domains
runtime context sop-list
```

## Matching Logic

When `sop_match` is called with a file path, it matches against domain names:
- `src/payment.ts` → matches `payment` domain
- `src/api/auth.ts` → matches `api` and `auth` domains
