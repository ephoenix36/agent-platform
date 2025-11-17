Testing workflow tool validation issue:

The error: "tool parameters array type must have items"

Looking at the workflow schema structure:
```typescript
steps: z.array(workflowStepSchema)

where workflowStepSchema = z.object({
  id: z.string(),
  type: z.enum([...]),
  config: z.record(z.any()),  // <-- This might be the issue
  onSuccess: z.string().optional(),
  onError: z.string().optional(),
  condition: z.string().optional(),
  skipIf: z.string().optional()
})
```

When using `.shape` to extract the schema, Zod converts this to JSON Schema like:
```json
{
  "steps": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "id": {"type": "string"},
        "type": {"type": "string", "enum": [...]},
        "config": {"type": "object", "additionalProperties": {}},  // <-- z.record(z.any())
        "onSuccess": {"type": "string"},
        ...
      },
      "required": ["id", "type", "config"],
      "additionalProperties": false  // <-- THIS IS THE PROBLEM!
    }
  }
}
```

The `additionalProperties: false` at the object level means optional properties cannot be provided!

**Solution:** The issue is that when you have optional properties in a Zod object and use `.shape`, 
the JSON Schema generator adds `additionalProperties: false` which conflicts with optional fields.

**The REAL issue:** Looking at agent-tools and task-tools, they ALL use the same pattern and work fine.
So the issue must be something else...

Let me check if the problem is the validation happening on the CLIENT side (GitHub Copilot/Claude)
rather than the server side. The error message appears to come from the MCP client validator, not the server.

**Hypothesis:** The MCP SDK validation on the CLIENT is stricter than on the SERVER.
