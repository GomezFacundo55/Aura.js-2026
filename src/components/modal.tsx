import React from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  action?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  action = false,
  onConfirm,
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
      activeOpacity={0.5}
        onPress={onCancel}
        className="flex-1 items-center justify-center px-6"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-brand-100/95 rounded-3xl p-6 items-center shadow-2xl"
        >
          <View
            className={`w-14 h-14 rounded-full items-center justify-center mb-4 ${
              action ? 'bg-red-100' : 'bg-yellow-100'
            }`}
          >
            <Ionicons
              name={action ? 'trash-outline' : 'help-circle-outline'}
              size={28}
              color={action ? '#DC2626' : '#868a0f'}
            />
          </View>

          <Text className="text-lg font-bold text-gray-700 text-center mb-2">
            {title}
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
            {message}
          </Text>

          <View className="flex-row w-full space-x-3">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onCancel}
              className="flex-1 py-3 rounded-xl border border-orange items-center justify-center"
            >
              <Text className="text-gray-700 font-semibold text-sm">
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onConfirm}
              className={`flex-1 py-3 rounded-xl items-center justify-center shadow-sm ${
                action ? 'bg-red-600' : 'bg-yellow-600'
              }`}
            >
              <Text className="text-white font-semibold text-sm">
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </TouchableOpacity>
    </Modal>
  );
};