import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  Image,
  View,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";

type ImageCarouselProps = {
  uris: string[];
  height?: number;
};

export function ImageCarousel({ uris, height = 220 }: ImageCarouselProps) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const fotos = uris.filter(Boolean);

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    const siguiente = Math.round(x / width);
    setIndex(siguiente);
  };

  if (fotos.length === 0) {
    return (
      <View style={{ width, height }} className="items-center justify-center bg-white">
        <Ionicons name="image-outline" size={40} color="#9CA3AF" />
      </View>
    );
  }

  return (
    <View>
      <FlatList
        data={fotos}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(uri, i) => `${uri}-${i}`}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={{ width, height }} className="items-center justify-center bg-white">
            <Image
              source={{ uri: item }}
              style={{ width, height }}
              resizeMode="contain"
            />
          </View>
        )}
      />

      {fotos.length > 1 ? (
        <View className="mt-2 flex-row justify-center gap-1.5">
          {fotos.map((_, i) => (
            <View
              key={i}
              className={`h-2 rounded-full ${i === index ? "w-4 bg-brand-500" : "w-2 bg-neutral-400"}`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
