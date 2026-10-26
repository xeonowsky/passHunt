"use client";

import { setUserKey } from "@/lib/crypto/keystore";
import { UnlockGate } from "@/components/vault/UnlockGate";
import { VaultList } from "@/components/vault/VaultList";

export function VaultApp() {
  return (
    <UnlockGate>
      {({ userKey, me, onLogout }) => (
        <VaultList userKey={userKey} email={me.email} onLock={() => setUserKey(null)} onLogout={onLogout} />
      )}
    </UnlockGate>
  );
}
