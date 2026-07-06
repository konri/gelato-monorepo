import { Carousel } from "@/components/atoms/Carousel";
import { RewardCard } from "@/components/molecules/RewardCard";
import React, { useCallback } from "react";
import { Pressable, View } from "react-native";
import { CollapsibleSection } from "../CollapsibleSection";
import type { CarouselRewardItem, RewardCarouselProps } from "./types";

export const RewardCarousel = ({
  rewards,
  stampsLabel,
  title,
  defaultExpanded = true,
  onRewardPress,
}: RewardCarouselProps) => {
  const renderRewardSlide = useCallback(
    (item: CarouselRewardItem) => {
      const card = (
        <RewardCard
          title={item.title}
          cost={item.cost}
          stampsLabel={stampsLabel}
          imageUrl={item.imageUrl ?? undefined}
          logoUrl={item.logoUrl ?? undefined}
        />
      );

      if (onRewardPress) {
        return (
          <Pressable
            onPress={() => onRewardPress(item)}
            className="items-center"
          >
            {card}
          </Pressable>
        );
      }

      return <View className="items-center">{card}</View>;
    },
    [onRewardPress, stampsLabel],
  );

  return (
    <CollapsibleSection title={title} defaultExpanded={defaultExpanded}>
      <Carousel
        data={rewards}
        keyExtractor={(item) => item.id}
        renderItem={renderRewardSlide}
      />
    </CollapsibleSection>
  );
};
