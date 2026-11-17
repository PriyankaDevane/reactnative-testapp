import { icons } from "@/constants/icons";
import { colors } from "@/constants/theme";
import clsx from "clsx";
import dayjs from "dayjs";
import { useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const frequencies = ["Monthly", "Yearly"] as const;
type Frequency = (typeof frequencies)[number];

const categoryColors = {
  Entertainment: "#f8d6df",
  "AI Tools": "#b8d4e3",
  "Developer Tools": "#e8def8",
  Design: "#f5c542",
  Productivity: "#b8e8d0",
  Cloud: "#cbe5fb",
  Music: "#f9d7b8",
  Other: colors.muted,
};
type Category = keyof typeof categoryColors;
type NewSubscription = Subscription & { frequency: Frequency };

interface CreateSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (subscription: NewSubscription) => void;
}

export default function CreateSubscriptionModal({
  visible,
  onClose,
  onCreate,
}: CreateSubscriptionModalProps) {
  const { bottom } = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("Monthly");
  const [category, setCategory] = useState<Category>("Other");
  const sequence = useRef(0);
  const submitted = useRef(false);

  const amountText = price.trim().replace(",", ".");
  const amount = Number(amountText);
  const validPrice =
    /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(amountText) &&
    Number.isFinite(amount) &&
    amount > 0;
  const canSubmit = name.trim().length > 0 && validPrice;

  function close() {
    Keyboard.dismiss();
    setName("");
    setPrice("");
    setFrequency("Monthly");
    setCategory("Other");
    onClose();
  }

  function submit() {
    if (!visible || !canSubmit || submitted.current) return;
    submitted.current = true;

    const start = dayjs();
    onCreate({
      id: `subscription-${start.valueOf()}-${++sequence.current}`,
      name: name.trim(),
      price: amount,
      frequency,
      category,
      status: "active",
      startDate: start.toISOString(),
      renewalDate: start.add(1, frequency === "Monthly" ? "month" : "year").toISOString(),
      icon: icons.wallet,
      billing: frequency,
      color: categoryColors[category],
    });
    close();
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={close}
      onShow={() => { submitted.current = false; }}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="modal-overlay"
      >
        <Pressable accessible={false} className="absolute inset-0" onPress={close} />
        <View accessibilityViewIsModal className="modal-container" style={{ paddingBottom: bottom }}>
          <View className="modal-header">
            <Text accessibilityRole="header" className="modal-title">New Subscription</Text>
            <Pressable
              accessibilityLabel="Close new subscription form"
              accessibilityRole="button"
              className="modal-close"
              hitSlop={8}
              onPress={close}
            >
              <Text className="modal-close-text">×</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerClassName="modal-body" keyboardShouldPersistTaps="handled">
            <View className="auth-field">
              <Text className="auth-label">Name</Text>
              <TextInput
                accessibilityLabel="Name"
                className="auth-input"
                onChangeText={setName}
                placeholder="e.g. Spotify"
                placeholderTextColor={colors.mutedForeground}
                value={name}
              />
            </View>
            <View className="auth-field">
              <Text className="auth-label">Price</Text>
              <TextInput
                accessibilityLabel="Price"
                className="auth-input"
                keyboardType="decimal-pad"
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                value={price}
              />
              {!!price.trim() && !validPrice && (
                <Text className="auth-error">Enter a price greater than zero.</Text>
              )}
            </View>
            <View className="auth-field">
              <Text className="auth-label">Frequency</Text>
              <View className="picker-row">
                {frequencies.map((option) => (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected: frequency === option }}
                    className={clsx("picker-option", frequency === option && "picker-option-active")}
                    onPress={() => setFrequency(option)}
                  >
                    <Text className="auth-label">{option}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View className="auth-field">
              <Text className="auth-label">Category</Text>
              <View className="flex-row flex-wrap gap-2">
                {(Object.keys(categoryColors) as Category[]).map((option) => (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected: category === option }}
                    className={clsx(
                      "min-h-11 justify-center rounded-full border px-3 py-2",
                      category === option ? "border-accent bg-accent/10" : "border-border bg-background",
                    )}
                    onPress={() => setCategory(option)}
                  >
                    <Text className="auth-label">{option}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmit }}
              className={clsx("auth-button", !canSubmit && "auth-button-disabled")}
              disabled={!canSubmit}
              onPress={submit}
            >
              <Text className="auth-button-text">Add subscription</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
