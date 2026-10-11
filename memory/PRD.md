# Frostfish

## Original problem statement
User wants a Web3 fishing settlement game with ComputersRH-style isometric lo-fi/Minecraft visuals and Whiteout Survival-inspired map/gameplay. PLAY in lower-left opens wallet connection, followed by three fishermen: rod, net, boat. Place fishermen, catch fish into buckets, deliver to market, NPC customers buy fish, increment token earnings. Entry initially free.

## Confirmed requirements
- All in-game UI in English; communicate with user in Turkish.
- Name: Frostfish.
- RainbowKit on Robinhood Chain testnet, chain ID 46630; browser-injected wallet and free demo entry.
- Only virtual demo FROST now; future mainnet token details to be provided by user. No transfers or signatures.
- Three free fishermen with different catch capacities and estimated daily yields.
- Target: casual cozy idle/settlement players and Web3 users.

## Architecture
React19/CRA, Three.js + React Three Fiber custom voxel scene, shadcn dialogs/buttons, RainbowKit/wagmi2/viem, FastAPI, MongoDB via existing environment config. Request-driven server-authoritative active simulation; no scheduled job. Opaque bearer-token anonymous sessions, hashed in MongoDB, localStorage client token. Connected wallet is not authenticated backend identity. Actual wallet integration uses RainbowKit connectorsForWallets with injectedWallet, no WalletConnect.

## Implemented 2026-10-11
- Original compact floating winter island, custom lowpoly models, river, market, buildings, snow, fishermen and customers, 3D canvas.
- English start/wallet/crew selection/placement/market/guide/reset flows.
- Rod/net/boat yields100/250/600 per24h at1x, capacities5/8/12.
-30s simulated production cycle, 1x/2x/4x, pause, backend sales, persistent demo balance, market activity, browser-session restore, reset confirmation.
- Responsive desktop1920x800 and mobile390x844 verified no horizontal overflow.
- Camera pan/zoom/reset, ambience, no-wallet help.
- Fixed R3F visual-edit metadata issue in Models.jsx with explicit fiber module import.
- Backend regression7/7 passed. Initial QA report /app/test_reports/iteration_1.json. Wallet checked using a simulated EIP1193 fixture, not a real extension.

## Outstanding test finding / P0
- Test agent observed intermittent second-worker net placement failure twice. Backend API passes and revision updates are protected. Main agent must reproduce full UI three-worker flow, investigate actual response/error; add deterministic action error state and retry/reconciliation for recoverable conflicts if confirmed. Do not claim complete until fixed and verified. Report /app/test_reports/iteration_1.json. Test agent added /app/backend/tests/test_game_api.py (read before changes).

## Latest user direction 2026-10-11 — awaiting visual selection
User: "Oyunun map genişliği görseldeki gibi olacak. Grafik olarak biraz daha gelişmiş olmalı. Gökyüzü ve bulutlar olsun boşluk olmasın oyunda. Boşluk kısımlar deniz göl olabilir. Grafik ise daha gelişmiş olmalı. Minecraft Stardew Valley karışımı görseinde lofu olacak. Hava gün batımı pembemsi tarzı bir oyun görsellerde attım map geniş olsun yani. Bana örnek grafik görselleri sun ben seçecem"

Do not implement the redesign until user selects a concept. They want a much broader playable settlement filling the viewport, more developed Minecraft/Stardew lo-fi visuals, pink sunset sky and clouds, surrounding ocean/lake instead of empty void. Three concept images generated using their new reference screenshots. These are visual-direction concepts, not actual screenshots or guaranteed identical real-time renders.

### Concept A — detailed voxel sunset coast
https://static.prod-images.emergentagent.com/jobs/d3a18122-7a4a-46f4-97b3-3b2b0df01a7f/images/fe0c97f7c51cb3c25fb1f32494b64c5fb5bc57297a87c1ee1d0cb2b57c0325fc.jpeg

### Concept B — Stardew-like isometric pixel sunset lake
https://static.prod-images.emergentagent.com/jobs/d3a18122-7a4a-46f4-97b3-3b2b0df01a7f/images/b5dc82e16599c067c5beaacd1e78caa8f2c924af2277362d5c46a248023e3804.jpeg

### Concept C — more dimensional stylized3D sunset fjord
https://static.prod-images.emergentagent.com/jobs/d3a18122-7a4a-46f4-97b3-3b2b0df01a7f/images/29802929def664d29128be7331d1cb8a762c421a7a6db7556d515595098ea850.jpeg

## Prioritized backlog
- P0: Reproduce/fix reported placement issue; test all three workers desktop/mobile.
- P1: User-selected extensive map and graphical redesign, pink sunset clouds/sky, surrounding water, richer assets.
- P1: More coherent boat-to-market traversal and NPC visual synchronization with authoritative sales.
- P2: Mainnet/token integration only after user supplies token information and authorizes scope; signed wallet authentication before associating backend identity.
- P2: Buildings/upgrades, expanded progression and island customization after approved art direction.