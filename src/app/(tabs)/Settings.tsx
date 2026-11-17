import { useClerk, useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Settings() {
  const { signOut } = useClerk();
  const { isLoaded, user } = useUser();
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const email = user?.primaryEmailAddress?.emailAddress;
  const name = user?.fullName?.trim() || user?.username || email || "Your account";
  const initial = Array.from(name)[0].toLocaleUpperCase();

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
      <View className="gap-4 rounded-3xl border border-border bg-card p-4">
        <Text accessibilityRole="header" className="font-sans-bold text-lg text-primary">
          Profile
        </Text>
        {user ? (
          <View className="flex-row items-center gap-4">
            <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-muted">
              <Text className="font-sans-bold text-xl text-primary" accessible={false}>
                {initial}
              </Text>
              {user.hasImage && (
                <Image
                  source={user.imageUrl}
                  style={{ position: "absolute", width: "100%", height: "100%" }}
                  contentFit="cover"
                  accessible={false}
                />
              )}
            </View>
            <View className="flex-1 gap-1">
              <Text className="font-sans-bold text-base text-primary">{name}</Text>
              {email && email !== name && (
                <Text className="font-sans text-sm text-muted-foreground">{email}</Text>
              )}
            </View>
          </View>
        ) : (
          <Text accessibilityLiveRegion="polite" className="font-sans text-muted-foreground">
            {isLoaded ? "Profile unavailable." : "Loading profile…"}
          </Text>
        )}
      </View>
      {error ? <Text accessibilityRole="alert" className="font-sans text-primary">{error}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }}
        disabled={busy} onPress={handleSignOut}
        className="min-h-12 items-center justify-center rounded-xl bg-primary px-4 py-3 disabled:opacity-60">
        <Text className="font-sans-bold text-white">{busy ? "Signing out…" : "Sign out"}</Text>
      </Pressable>
    </SafeAreaView>
  );
}
