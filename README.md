# @holylabs/chat-sdk

Drop-in chat infrastructure for marketplace and delivery apps.

- Order chat (group chat per order: customer ↔ driver ↔ admin)
- Admin / support chat
- Per-conversation billing with soft-gate enforcement
- Firestore-backed, framework-agnostic core

## Install

```sh
npm install @holylabs/chat-sdk firebase
```

## Quick start

```ts
import { initChatSDK, useOrderChat } from '@holylabs/chat-sdk';
import { db, storage } from './firebase';

initChatSDK({
  firestore: db,
  storage,
  tenantId: 'acme-deliveries',
  currentUser: { id: 'user_123', name: 'Alice', role: 'customer' },
  billing: {
    plan: 'starter',
    onQuotaExceeded: (used, limit) => console.warn(`Over quota: ${used}/${limit}`),
  },
});

function OrderChatRoom({ orderId }) {
  const { messages, sendMessage, loading } = useOrderChat(orderId);
  // render however you like — bring your own UI
}
```

## Pricing tiers (default)

| Plan | Conversations / month | Behavior at quota |
|---|---|---|
| Starter | 1,000 | Read-only on new orders |
| Growth | 10,000 | Read-only on new orders |
| Scale | 100,000 | Read-only on new orders |

Active conversations are **never hard-stopped** mid-order — they continue to receive messages until completion. Only new conversations gate.
