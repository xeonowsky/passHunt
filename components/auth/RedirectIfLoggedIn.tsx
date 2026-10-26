"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isLoggedInHint } from "@/lib/auth/session-hint";

/** Zalogowany użytkownik nie musi oglądać formularzy logowania i rejestracji. */
export function RedirectIfLoggedIn() {
  const router = useRouter();
  useEffect(() => {
    if (isLoggedInHint()) router.replace("/vault");
  }, [router]);
  return null;
}
