import { colors } from "@/constants/theme";
import SubscriptionCard from "@/src/components/SubscriptionCard";
import { useSubscriptions } from "@/src/components/SubscriptionsProvider";
import { useState } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Subscriptions() {
  const { subscriptions } = useSubscriptions();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const query = search.trim().toLowerCase();
  const filteredSubscriptions = subscriptions.filter(({ name, category, plan }) =>
    [name, category, plan].some((value) => value?.toLowerCase().includes(query)),
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <SafeAreaView className="flex-1 gap-4 bg-background p-5">
        <Pressable accessible={false} onPress={Keyboard.dismiss}>
          <Text accessibilityRole="header" className="font-sans-bold text-3xl text-primary">
            Subscriptions
          </Text>
        </Pressable>
        <TextInput
          accessibilityLabel="Search subscriptions"
          autoCorrect={false}
          className="min-h-12 rounded-xl border border-border bg-card px-4 font-sans text-base text-primary"
          onChangeText={setSearch}
          placeholder="Search by name, category, or plan"
          placeholderTextColor={colors.mutedForeground}
          returnKeyType="search"
          value={search}
        />
        <FlatList
          className="flex-1"
          contentContainerClassName="pb-20"
          data={filteredSubscriptions}
          extraData={expandedId}
          ItemSeparatorComponent={() => <View className="h-4" />}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text accessibilityLiveRegion="polite" className="home-empty-state">
              {query ? "No subscriptions match your search." : "No subscriptions yet."}
            </Text>
          }
          renderItem={({ item }) => (
            <SubscriptionCard
              {...item}
              expanded={expandedId === item.id}
              onPress={() => {
                Keyboard.dismiss();
                setExpandedId((currentId) => currentId === item.id ? null : item.id);
              }}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
