import clsx from "clsx";
import { Image, Pressable, Text, View } from "react-native";
import { formatStatusLabel, formatSubscriptionDateTime } from "../utils/Utils";

const SubscriptionCard = ({
  name,
  price,
  icon,
  billing,
  color,
  category,
  renewalDate,
  plan,
  expanded,
  onPress,
  startDate,
  paymentMethod,
  status,
}: SubscriptionCardProps) => {
  return (
    <Pressable
      onPress={onPress}
      className={clsx("sub-card", expanded ? "sub-card-expanded" : "bg-card")}
      style={!expanded && color ? { backgroundColor: color } : undefined}
    >
      <View className="sub-head">
        <View className="sub-main">
          <Image source={icon} className="sub-icon" />
          <View className="sub-copy">
            <Text numberOfLines={1} className="sub-title">
              {name}
            </Text>
            <Text numberOfLines={1} ellipsizeMode="tail" className="sub-meta">
              {category?.trim() ||
                plan?.trim() ||
                (renewalDate ? formatSubscriptionDateTime(renewalDate) : "")}
            </Text>
          </View>
        </View>
        <View className="sub-price-box">
          <Text className="sub-price">${price}</Text>
          <Text className="sub-billing">{billing}</Text>
        </View>
      </View>

      {expanded && (
        <View className="sub-bdy">
          <View className="sub-details">
            <View className="sub-row">
              <View className="sub-row-copy">
                <Text className="sub-label">Payment :</Text>
                <Text
                  className="sub-value"
                  ellipsizeMode="tail"
                  numberOfLines={1}
                >
                  {paymentMethod?.trim() ?? "Not Provided"}
                </Text>
              </View>
            </View>
            <View className="sub-row">
              <View className="sub-row-copy">
                <Text className="sub-label">Category :</Text>
                <Text
                  className="sub-value"
                  ellipsizeMode="tail"
                  numberOfLines={1}
                >
                  {category?.trim() ?? "Not Provided"}
                </Text>
              </View>
            </View>
            <View className="sub-row">
              <View className="sub-row-copy">
                <Text className="sub-label">Started :</Text>
                <Text
                  className="sub-value"
                  ellipsizeMode="tail"
                  numberOfLines={1}
                >
                  {startDate ? formatSubscriptionDateTime(startDate) : ""}
                </Text>
              </View>
            </View>
            <View className="sub-row">
              <View className="sub-row-copy">
                <Text className="sub-label">Renewal Date :</Text>
                <Text
                  className="sub-value"
                  ellipsizeMode="tail"
                  numberOfLines={1}
                >
                  {renewalDate ? formatSubscriptionDateTime(renewalDate) : ""}
                </Text>
              </View>
            </View>
            <View className="sub-row">
              <View className="sub-row-copy">
                <Text className="sub-label">Status :</Text>
                <Text
                  className="sub-value"
                  ellipsizeMode="tail"
                  numberOfLines={1}
                >
                  {status ? formatStatusLabel(status) : ""}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
};

export default SubscriptionCard;
