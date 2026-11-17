import { useClerk } from "@clerk/expo";
import { useRef, useState } from "react";
import { Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Settings() {
  const { signOut } = useClerk();
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSignOut() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      await signOut();
    } catch {
      setError("We couldn’t sign you out. Check your connection and try again.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 gap-4 bg-background p-5">
      <Text accessibilityRole="header" className="font-sans-bold text-3xl text-primary">Settings</Text>
      {error ? <Text accessibilityRole="alert" className="font-sans text-primary">{error}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }}
        disabled={busy} onPress={handleSignOut}
        className="min-h-12 items-center justify-center rounded-xl bg-primary px-4 py-3 disabled:opacity-60">
        <Text className="font-sans-bold text-white">{busy ? "Signing out…" : "Sign out"}</Text>
      </Pressable>
    </SafeAreaView>
  );
}
