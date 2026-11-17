import { colors } from "@/constants/theme";
import { useAuth, useSignIn, useSignUp } from "@clerk/expo";
import { Link } from "expo-router";
import { useRef, useState } from "react";
import {
  Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Step = "credentials" | "signupCode" | "deviceCode" | "resetEmail" | "resetCode" | "newPassword" | "finish";
type Result = { error: unknown };

function check({ error }: Result) {
  if (error) throw error;
}

function feedback(error: unknown, fallback: string) {
  const code = error as { code?: string; errors?: { code?: string }[] } | null;
  switch (code?.errors?.[0]?.code ?? code?.code) {
    case "form_code_incorrect": return "That code is incorrect. Check your email and try again.";
    case "verification_expired": return "That code expired. Request a new one.";
    case "too_many_requests": return "Too many attempts. Wait a moment and try again.";
    case "form_password_pwned": return "Choose a different password. This one appeared in a data breach.";
    case "form_password_length_too_short": return "Choose a longer password.";
    default: return fallback;
  }
}

export default function AuthForm({ creating = false }: { creating?: boolean }) {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { isLoaded } = useAuth();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const inFlight = useRef(false);
  const nextResendAt = useRef(0);

  const verifying = step === "signupCode" || step === "deviceCode" || step === "resetCode";
  const showEmail = step === "credentials" || step === "resetEmail";
  const showPassword = step === "credentials" || step === "newPassword";
  const newPassword = creating || step === "newPassword";

  async function run(action: () => Promise<void>, fallback: string) {
    if (!isLoaded || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (error) {
      setError(feedback(error, fallback));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  async function sendCode(target: "signupCode" | "deviceCode" | "resetCode") {
    if (Date.now() < nextResendAt.current) {
      setError("Wait 30 seconds between code requests.");
      return;
    }
    if (target === "signupCode") check(await signUp.verifications.sendEmailCode());
    if (target === "deviceCode") check(await signIn.mfa.sendEmailCode());
    if (target === "resetCode") check(await signIn.resetPasswordEmailCode.sendCode());
    nextResendAt.current = Date.now() + 30000;
    setSent(true);
  }

  async function finish() {
    setStep("finish");
    setPassword("");
    setCode("");
    const options = {
      navigate: ({ session }: { session?: { currentTask?: unknown } | null }) => {
        if (session?.currentTask) {
          setError("Your account requires an additional step before you can continue. Contact support for help.");
        }
      },
    };
    check(creating ? await signUp.finalize(options) : await signIn.finalize(options));
  }

  async function continueSignIn() {
    if (signIn.status === "complete") return finish();

    if (
      (signIn.status === "needs_client_trust" || signIn.status === "needs_second_factor") &&
      signIn.supportedSecondFactors?.some((factor) => factor.strategy === "email_code")
    ) {
      setPassword("");
      setStep("deviceCode");
      await sendCode("deviceCode");
      return;
    }
    setError("This account requires an additional sign-in step. Contact support for help.");
  }

  function submit() {
    const address = email.trim();
    if (showEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setError("Enter a valid email address.");
      return;
    }
    if (showPassword && (!password || (newPassword && password.length < 8))) {
      setError(newPassword ? "Use at least 8 characters for your password." : "Enter your password.");
      return;
    }
    if (verifying && !/^\d{6}$/.test(code)) {
      setError("Enter the six-digit code from your email.");
      return;
    }

    const fallback = verifying
      ? "We couldn’t verify that code. Check it and try again."
      : step === "credentials" && !creating
        ? "We couldn’t sign you in. Check your email and password and try again."
        : "We couldn’t complete this step. Check your details and connection, then try again.";

    void run(async () => {
      switch (step) {
        case "credentials":
          if (creating) {
            check(await signUp.password({ emailAddress: address, password }));
            if (signUp.status === "complete") return finish();
            setPassword("");
            setStep("signupCode");
            await sendCode("signupCode");
          } else {
            check(await signIn.password({ emailAddress: address, password }));
            await continueSignIn();
          }
          break;
        case "resetEmail":
          check(await signIn.create({ identifier: address }));
          setStep("resetCode");
          await sendCode("resetCode");
          break;
        case "signupCode":
          check(await signUp.verifications.verifyEmailCode({ code }));
          if (signUp.status === "complete") return finish();
          setError("Your account requires additional information. Contact support for help.");
          break;
        case "deviceCode":
          check(await signIn.mfa.verifyEmailCode({ code }));
          if (signIn.status === "complete") return finish();
          setError("A further verification step is required. Contact support for help.");
          break;
        case "resetCode":
          check(await signIn.resetPasswordEmailCode.verifyCode({ code }));
          setCode("");
          setStep("newPassword");
          break;
        case "newPassword":
          check(await signIn.resetPasswordEmailCode.submitPassword({ password }));
          await continueSignIn();
          break;
        case "finish":
          await finish();
          break;
      }
    }, fallback);
  }

  function startOver() {
    void run(async () => {
      check(creating ? await signUp.reset() : await signIn.reset());
      setStep("credentials");
      setCode("");
      setPassword("");
      setVisible(false);
      setSent(false);
    }, "We couldn’t restart. Try again.");
  }

  const title = verifying ? "Check your email"
    : step === "resetEmail" ? "Reset your password"
    : step === "newPassword" ? "Choose a new password"
    : step === "finish" ? "Finish signing in"
    : creating ? "Create your account" : "Welcome back";
  const description = verifying ? (sent ? "Enter the six-digit code sent to your email." : "Request a code to verify your email.")
    : step === "resetEmail" ? "Enter your account email to request a reset code."
    : step === "newPassword" ? "Use at least 8 characters."
    : step === "finish" ? undefined
    : creating ? "Track your subscriptions and see what renews next."
    : "Sign in to manage your subscriptions.";
  const action = verifying ? "Verify code"
    : step === "resetEmail" ? "Send reset code"
    : step === "newPassword" ? "Update password"
    : step === "finish" ? "Continue"
    : creating ? "Create account" : "Sign in";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
          <View className="mx-auto w-full max-w-md flex-1 justify-center px-5 py-8">
            <View className="mb-8 flex-row items-center justify-center gap-3">
              <Image source={require("@/assets/icons/logo.png")} className="h-14 w-14" resizeMode="contain" />
              <Text className="font-sans-extrabold text-3xl text-primary">Recurly</Text>
            </View>
            <Text accessibilityRole="header" className="text-center font-sans-extrabold text-3xl text-primary">{title}</Text>
            {description && <Text className="mt-2 text-center font-sans text-base text-muted-foreground">{description}</Text>}
            <View className="mt-6 gap-4 rounded-3xl border border-border bg-card p-5">
              {showEmail && (
                <View className="gap-2">
                  <Text className="font-sans-semibold text-primary">Email</Text>
                  <TextInput accessibilityLabel="Email" value={email} onChangeText={setEmail}
                    editable={!busy} autoCapitalize="none" autoCorrect={false} autoComplete="email" keyboardType="email-address"
                    placeholder="you@example.com" placeholderTextColor={colors.mutedForeground}
                    className="min-h-12 rounded-xl border border-border bg-background px-3 font-sans text-base text-primary" />
                </View>
              )}
              {showPassword && (
                <View className="gap-2">
                  <Text className="font-sans-semibold text-primary">{newPassword ? "New password" : "Password"}</Text>
                  <View className="flex-row items-center rounded-xl border border-border bg-background">
                    <TextInput accessibilityLabel={newPassword ? "New password" : "Password"}
                      value={password} onChangeText={setPassword} editable={!busy} secureTextEntry={!visible}
                      autoCapitalize="none" autoCorrect={false} autoComplete={newPassword ? "new-password" : "current-password"}
                      placeholder={newPassword ? "At least 8 characters" : "Enter your password"} placeholderTextColor={colors.mutedForeground}
                      className="min-h-12 flex-1 px-3 font-sans text-base text-primary" />
                    <Pressable accessibilityRole="button" accessibilityLabel={visible ? "Hide password" : "Show password"}
                      onPress={() => setVisible(!visible)} className="min-h-12 justify-center px-3">
                      <Text className="font-sans-semibold text-primary">{visible ? "Hide" : "Show"}</Text>
                    </Pressable>
                  </View>
                </View>
              )}
              {verifying && (
                <View className="gap-2">
                  <Text className="font-sans-semibold text-primary">Verification code</Text>
                  <TextInput accessibilityLabel="Verification code" value={code}
                    onChangeText={(value) => setCode(value.replace(/\D/g, ""))}
                    editable={!busy} keyboardType="number-pad" autoComplete="one-time-code" maxLength={6}
                    className="min-h-12 rounded-xl border border-border bg-background px-3 font-sans text-base text-primary" />
                </View>
              )}
              {!!error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="font-sans text-primary">{error}</Text>}
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy || !isLoaded, busy }}
                disabled={busy || !isLoaded} onPress={submit}
                className="min-h-12 items-center justify-center rounded-xl bg-primary px-4 py-3 disabled:opacity-60 active:opacity-80">
                <Text className="font-sans-bold text-base text-white">{busy ? "Please wait…" : action}</Text>
              </Pressable>
              {verifying && (
                <Pressable accessibilityRole="button" disabled={busy}
                  onPress={() => void run(() => sendCode(step), "We couldn’t send a code. Try again.")}
                  className="min-h-12 items-center justify-center">
                  <Text className="font-sans-semibold text-primary">{sent ? "Resend code" : "Send code"}</Text>
                </Pressable>
              )}
              {step === "credentials" ? (
                <>
                  {!creating && (
                    <Pressable accessibilityRole="button" disabled={busy} className="min-h-12 items-center justify-center"
                      onPress={() => { setError(""); setPassword(""); setVisible(false); setStep("resetEmail"); }}>
                      <Text className="font-sans-semibold text-primary">Forgot password?</Text>
                    </Pressable>
                  )}
                  {!busy && (
                    <Link replace href={creating ? "/(auth)/SignIn" : "/(auth)/Signup"}
                      className="py-3 text-center font-sans-bold text-primary">
                      {creating ? "Already have an account? Sign in" : "New to Recurly? Create an account"}
                    </Link>
                  )}
                </>
              ) : (
                <Pressable accessibilityRole="button" disabled={busy} onPress={startOver}
                  className="min-h-12 items-center justify-center">
                  <Text className="font-sans-semibold text-primary">{creating ? "Change email" : "Back to sign in"}</Text>
                </Pressable>
              )}
              {creating && Platform.OS === "web" && <View nativeID="clerk-captcha" />}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
