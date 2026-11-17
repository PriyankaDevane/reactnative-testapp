import {
  HOME_BALANCE,
  HOME_USER,
  UPCOMING_SUBSCRIPTIONS,
} from "@/constants/data";
import { icons } from "@/constants/icons";
import images from "@/constants/images";
import CreateSubscriptionModal from "@/src/components/CreateSubscriptionModal";
import ListHeading from "@/src/components/ListHeading";
import SubscriptionCard from "@/src/components/SubscriptionCard";
import { useSubscriptions } from "@/src/components/SubscriptionsProvider";
import UpcomingSubscriptionCard from "@/src/components/UpcomingSubscriptionCard";
import dayjs from "dayjs";
import { useState } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function App() {
  const [expandedID, setExpandedID] = useState<string | null>(null);
  const { subscriptions, addSubscription } = useSubscriptions();
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const now = dayjs();
  const windowEnd = now.add(7, "day");
  const upcoming = [...UPCOMING_SUBSCRIPTIONS];
  for (const subscription of subscriptions) {
    if (subscription.status !== "active" || !subscription.renewalDate) continue;

    const renewal = dayjs(subscription.renewalDate);
    if (!renewal.isValid() || renewal.isBefore(now) || renewal.isAfter(windowEnd)) continue;

    upcoming.push({
      ...subscription,
      daysLeft: Math.ceil(renewal.diff(now, "day", true)),
    });
  }
  upcoming.sort((first, second) => first.daysLeft - second.daysLeft);

  return (
    <SafeAreaView className="flex-1 bg-background p-5 ">
      <FlatList
        ListHeaderComponent={() => (
          <>
            <View className="home-header">
              <View className="home-user">
                <Image source={images.avatar} className="home-avatar" />
                <Text className="home-user-name">{HOME_USER.name} </Text>
              </View>

              <Pressable
                accessibilityLabel="Add subscription"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setCreateModalVisible(true)}
              >
                <Image source={icons.add} className="home-add-icon" />
              </Pressable>
            </View>

            <View className="home-balance-card">
              <Text className="home-balance-label">Balance</Text>

              <View className="home-balance-row">
                <Text className="home-balance-amount">
                  ${HOME_BALANCE.amount}
                </Text>
                <Text className="home-balance-date">
                  {dayjs(HOME_BALANCE.nextRenewalDate).format("MM/DD")}
                </Text>
              </View>
            </View>
            <View className="mb-5">
              <ListHeading title="Upcoming" />
              <FlatList
                data={upcoming}
                renderItem={({ item }) => (
                  <UpcomingSubscriptionCard {...item} />
                )}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={
                  <Text className="home-empty-state">
                    No upcoming renewals yet
                  </Text>
                }
              />
            </View>
            <ListHeading title="All Subscriptions" />
          </>
        )}
        style={{ flex: 1 }}
        data={subscriptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedID === item.id}
            onPress={() =>
              setExpandedID((currentId) =>
                currentId === item.id ? null : item.id,
              )
            }
          />
        )}
        extraData={expandedID}
        ItemSeparatorComponent={() => <View className="h-4" />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text className="home-empty-state">No subscriptions yet</Text>
        }
        contentContainerClassName="pb-20"
      />
      <CreateSubscriptionModal
        visible={isCreateModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreate={addSubscription}
      />
    </SafeAreaView>
  );
}
