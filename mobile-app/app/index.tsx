import { useState, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccount, setHasAccount] = useState(false);

  useEffect(() => {
    const promise =
      Platform.OS === "web"
        ? Promise.resolve(localStorage.getItem("seedPhrase"))
        : SecureStore.getItemAsync("seedPhrase");

    promise
      .then((value) => {
        setHasAccount(!!value);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return <Redirect href={hasAccount ? "/home" : "/onboarding"} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
  },
});
