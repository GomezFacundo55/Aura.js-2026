import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ImageSlotProps } from '../interfaces/ImageSlotProps';

export const ImageSlot: React.FC<ImageSlotProps> = ({ uri, index, onPress }) => {
  return (
    <View className="w-full h-52 rounded-2xl border border-gray-200 shadow-sm overflow-hidden items-center justify-center relative mb-4">
      {uri ? (
        <>
          <Image
            source={{ uri }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onPress(index)}
            className="absolute bottom-3 right-3 bg-black/60 px-3 py-2 rounded-xl flex-row items-center space-x-1"
          >
            <Ionicons name="camera-reverse-outline" size={18} color="#FFFFFF" />
            <Text className="text-white text-xs font-semibold ml-1">Cambiar</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onPress(index)}
          className="bg-orange-100 w-full h-full items-center justify-center  border-2 border-dashed border-gray-300 rounded-2xl"
        >
          <View className="w-12 h-12 rounded-full bg-green-50 items-center justify-center mb-2">
            <Ionicons name="camera-outline" size={26} color="#16A34A" />
          </View>
          <Text className="text-sm font-medium text-gray-700">Cargar Foto {index + 1}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};