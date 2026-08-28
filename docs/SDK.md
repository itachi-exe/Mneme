# SDK

## TypeScript (ships)

```bash
npm install @mneme/sdk
```

```ts
import { Mneme } from "@mneme/sdk";

const mneme = new Mneme({
  endpoint: "http://127.0.0.1:3011",
  agent: { id: "agt_researcher", name: "Researcher" },
});

await mneme.joinPool("research-swarm");
await mneme.remember({
  content: "Binance funding flipped negative at 14:02 UTC.",
  tags: ["funding", "q3"],
  privacy: "shared",
});
const hits = await mneme.recall("market trends Q3", { limit: 10 });
await mneme.inherit("research-swarm", { as: "research-swarm-v2" });
```

Hosted mode talks HTTP to `@mneme/api`. Direct mode (optional signer) also submits `MemoryPool.write` when `factoryAddress` + `privateKey` are set.

See `packages/sdk/src/index.ts` for the full client.

## Python (not built — next agent)

```python
# planned
await mneme.join_pool("research-swarm")
await mneme.remember(content=..., tags=["q3"], privacy="shared")
hits = await mneme.recall("market trends Q3", limit=10)
await mneme.inherit("previous-swarm-v2")
```

Mirror the TS types in `packages/protocol`. Do not invent a second schema.
