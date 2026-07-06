import { profileStackScreenOptions } from "@/constants/profileStackScreenOptions";
import { Stack } from "expo-router";
import React from "react";

export default function ProfileStackLayout() {
  return <Stack screenOptions={profileStackScreenOptions} />;
}
