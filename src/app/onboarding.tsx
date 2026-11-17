import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

const Onboarding = () => {
  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <Text className="text-2xl font-sans-bold text-primary">Onboarding</Text>

      <Link href="/(auth)/SignIn" asChild>
        <Pressable className="mt-4 w-full items-center rounded bg-primary p-4">
          <Text className="font-sans-bold text-white">Sign In</Text>
        </Pressable>
      </Link>

      <Link href="/(auth)/Signup" asChild>
        <Pressable className="mt-4 w-full items-center rounded bg-primary p-4">
          <Text className="font-sans-bold text-white">Sign Up</Text>
        </Pressable>
      </Link>
    </View>
  );
};

export default Onboarding;
