# Deployment

## Local / this VPS

```bash
cd /root/Mneme
cp -n .env.example .env
npm install
npm run seed
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

Health: `curl -s http://127.0.0.1:3011/health`

Do not bind a public nginx vhost until the owner asks. Ports 3010/3011.

## Galileo contracts

Needs Foundry (already on this box at `/root/.foundry/bin/forge`) and a funded key.

```bash
cd /root/Mneme/contracts
export PRIVATE_KEY=0x...
export RPC_URL=https://evmrpc-testnet.0g.ai
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
```

Put the printed `factory` and `snapshot` addresses into `/root/Mneme/.env`:

```
MNEME_FACTORY_ADDRESS=0x...
MNEME_SNAPSHOT_ADDRESS=0x...
OG_PRIVATE_KEY=0x...
```

Restart `mneme-api`. New writes will attempt chain + storage settlement.

## Verify a pool

```bash
cast call $FACTORY "pools(string)(address)" "research-swarm" --rpc-url $RPC_URL
```

## Mainnet

Same script, `RPC_URL=https://evmrpc.0g.ai`, chain 16661. Do not do this without the owner. Update `docs/NETWORK.md` addresses if they have moved.
