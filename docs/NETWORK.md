# 0G network reference

Copied from https://docs.0g.ai/ai-context on 2026-08-15. Re-check that page before a mainnet deploy — addresses can move on testnet.

## Galileo testnet (default)

| | |
| --- | --- |
| Chain ID | `16602` (`0x40DA`) |
| RPC | `https://evmrpc-testnet.0g.ai` |
| Explorer | https://chainscan-galileo.0g.ai |
| Storage explorer | https://storagescan-galileo.0g.ai |
| Faucet | https://faucet.0g.ai (0.1 0G/day) |
| Storage indexer (turbo) | `https://indexer-storage-testnet-turbo.0g.ai` |
| Storage Flow | `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296` |
| Storage Mine | `0x00A9E9604b0538e06b268Fb297Df333337f9593b` |
| DA Entrance | `0xE75A073dA5bb7b0eC622170Fd268f35E675a957B` |
| Compute Ledger | `0xE70830508dAc0A97e6c087c75f402f9Be669E406` |
| Compute Inference | `0xa79F4c8311FF93C06b8CfB403690cc987c93F91E` |
| ERC-8004 Identity | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| ERC-8004 Reputation | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |

## Aristotle mainnet

| | |
| --- | --- |
| Chain ID | `16661` (`0x4115`) |
| RPC | `https://evmrpc.0g.ai` |
| Explorer | https://chainscan.0g.ai |
| Storage indexer | `https://indexer-storage-turbo.0g.ai` |
| Storage Flow | `0x62D4144dB0F0a6fBBaeb6296c785C71B3D57C526` |
| Compute Ledger | `0x2dE54c845Cd948B72D2e32e39586fe89607074E3` |
| Compute Inference | `0x47340d900bdFec2BD393c626E12ea0656F938d84` |
| ERC-8004 Identity | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| ERC-8004 Reputation | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |

## Compute Router

- API: `https://router-api.0g.ai/v1`
- Keys: https://pc.0g.ai
- OpenAI-compatible `chat/completions`. Try `embeddings` only as a soft probe.

## MetaMask add-chain payloads

See `apps/web/src/lib/chain.ts`.
