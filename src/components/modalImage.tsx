import React from "react";
import { Modal, View, Text, TouchableOpacity, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ImodalImage {
  visible: boolean;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
  onCancel: () => void;
}

export const ModalImage: React.FC<ImodalImage> = ({
  visible,
  onSelectCamera,
  onSelectGallery,
  onCancel,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onCancel}
        className="flex-1 bg-black/50 items-center justify-center px-6"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-[#FFF8F0] rounded-3xl p-6 items-center shadow-2xl border border-orange-200"
        >
          <View className="w-14 h-14 rounded-full bg-orange-100 items-center justify-center mb-3">
            <Ionicons name="images-outline" size={28} color="#FF6B00" />
          </View>

          <Text className="text-lg font-bold text-neutral-900 text-center mb-1">
            Seleccionar Foto
          </Text>
          <Text className="text-xs text-neutral-500 text-center mb-5">
            ¿De dónde querés obtener la imagen?
          </Text>

          <View className="w-full space-y-3 mb-3">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onSelectCamera}
              className="w-full bg-[#FF6B00] py-3.5 px-4 rounded-2xl flex-row items-center justify-center shadow-sm"
            >
              <Ionicons
                name="camera-outline"
                size={20}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text className="text-white font-bold text-sm">Usar Cámara</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onSelectGallery}
              className="w-full bg-white border border-orange-300 py-3.5 px-4 rounded-2xl flex-row items-center justify-center shadow-sm"
            >
              <Ionicons
                name="image-outline"
                size={20}
                color="#FF6B00"
                style={{ marginRight: 8 }}
              />
              <Text className="text-[#FF6B00] font-bold text-sm">
                Abrir Galería
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onCancel}
            className="py-2.5 px-6"
          >
            <Text className="text-neutral-500 font-semibold text-xs">
              Cancelar
            </Text>
          </TouchableOpacity>
        </Pressable>
      </TouchableOpacity>
    </Modal>
  );
};
