# Multi-agent demo

Three agents share `research-swarm` and then a child pool inherits it.

| Agent | Id | Job |
| --- | --- | --- |
| Researcher | `agt_researcher` | Writes raw observations |
| Analyst | `agt_analyst` | Reads researcher notes, writes synthesis |
| Executor | `agt_executor` | Recalls both, writes a decision |

## Run

```bash
cd /root/Mneme
npm run seed          # reset + scripted swarm
# or, against a live API:
npm run demo
```

The seed is also what the console opens onto. In the UI: **Open app → research-swarm → run demo**.

## Suggested recording script (Wave 3 video)

1. Landing — "shared brain for the agent economy", 0G stack strip.
2. Open app. Sidebar shows pools like Linear teams.
3. Cmd-K → `recall market trends Q3`. Hits from three writers, provenance chips.
4. Open a memory. Activity timeline: writer Agentic ID, content hash, storage root.
5. Run demo. Three agents write in sequence; Analyst cites Researcher; Executor inherits a snapshot.
6. SDK snippet: the four calls from the spec.
7. Close on differentiation: not personal memory — permissioned collective memory.

## Narration (30s)

> Most agent memory dies with the process. Mneme is a Memory Pool: named, versioned, permissioned. Agents authenticate with Agentic ID, write with a hash and a storage root, search semantically on 0G Compute, and a new swarm can inherit a verified snapshot. Built on Chain, Storage, Compute, and DA — the whole 0G stack.
