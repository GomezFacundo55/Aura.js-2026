import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type QrScannerModalProps = {
  visible: boolean;
  onClose: () => void;
  onScanned: (data: string) => void;
  title?: string;
};

export default function QrScannerModal({
  visible,
  onClose,
  onScanned,
  title = "Escanear Código QR",
}: QrScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const insets = useSafeAreaInsets();

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned || !data) return;
    setScanned(true);
    onScanned(data);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => setScanned(false)}
      transparent={false}
    >
      <View className="flex-1 bg-black">
        {!permission?.granted ? (
          <View className="flex-1 items-center justify-center p-6">
            <Ionicons name="camera-outline" size={64} color="#FFF" />
            <Text className="text-white text-lg font-bold text-center mt-4 mb-2">
              Se necesita permiso para usar la cámara
            </Text>
            <Text className="text-neutral-400 text-sm text-center mb-6">
              Permití el acceso a la cámara para poder escanear los códigos QR del local.
            </Text>
            <TouchableOpacity
              onPress={requestPermission}
              className="bg-[#FF6B00] px-6 py-3.5 rounded-xl mb-4"
            >
              <Text className="text-white font-bold text-base">Conceder Permiso</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} className="py-2">
              <Text className="text-white text-sm">Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1 relative">
            {/* Cámara en pantalla completa */}
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            <View 
              pointerEvents="box-none" 
              style={[
                StyleSheet.absoluteFill, 
                { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 24) }
              ]} 
              className="justify-between"
            >
              <View className="px-6 py-3 flex-row justify-between items-center bg-black/40">
                <Text className="text-white text-lg font-bold">{title}</Text>
                <TouchableOpacity
                  onPress={onClose}
                  className="w-10 h-10 bg-black/60 rounded-full items-center justify-center"
                >
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}