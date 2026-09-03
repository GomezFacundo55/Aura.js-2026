import { CameraView, useCameraPermissions } from "expo-camera";
import { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type QRScannerDNIProps = {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
  onError: (message: string) => void;
};

export function QRScannerDNI({ visible, onClose, onScan, onError }: QRScannerDNIProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) {
      setScanned(false);
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    setScanned(false);
    onClose();
  }, [onClose]);

  const handleRetryPermission = async () => {
    const result = await requestPermission();

    if (!result.granted) {
      onError(
        "No pudimos acceder a la cámara. Activá el permiso en la configuración del dispositivo o cargá los datos manualmente.",
      );
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned || !data) {
      return;
    }

    setScanned(true);
    onScan(data);
    handleClose();
  };

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={handleClose}>
      {/* El Modal abre otra ventana nativa: necesita su propio SafeAreaProvider. */}
      <SafeAreaProvider>
        <QRScannerBody
          permission={permission}
          onRetryPermission={handleRetryPermission}
          onBarcodeScanned={handleBarcodeScanned}
          onClose={handleClose}
        />
      </SafeAreaProvider>
    </Modal>
  );
}

type PermissionState = ReturnType<typeof useCameraPermissions>[0];

type QRScannerBodyProps = {
  permission: PermissionState;
  onRetryPermission: () => void;
  onBarcodeScanned: (result: { data: string }) => void;
  onClose: () => void;
};

function QRScannerBody({
  permission,
  onRetryPermission,
  onBarcodeScanned,
  onClose,
}: QRScannerBodyProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000000" }} edges={["top"]}>
      {!permission ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-base text-white">
            Verificando permisos de cámara...
          </Text>
        </View>
      ) : !permission.granted ? (
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text className="text-center text-lg font-semibold text-white">
            Necesitamos acceso a la cámara
          </Text>
          <Text className="text-center text-base text-neutral-300">
            Para escanear el DNI, permití el uso de la cámara o cargá los datos manualmente.
          </Text>
          <Pressable
            accessibilityRole="button"
            className="rounded-xl bg-brand-500 px-6 py-4"
            onPress={onRetryPermission}
          >
            <Text className="text-base font-semibold text-white">Permitir cámara</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onClose}>
            <Text className="text-base font-medium text-brand-300">Cargar manualmente</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* El dorso del DNI usa PDF417; algunas versiones también traen QR. */}
          <CameraView
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr", "pdf417"] }}
            onBarcodeScanned={onBarcodeScanned}
            style={{ flex: 1 }}
          />

          <View
            className="absolute inset-x-0 bottom-0 gap-3 bg-black/70 px-6 pt-4"
            style={{ paddingBottom: Math.max(insets.bottom, 24) }}
          >
            <Text className="text-center text-base text-white">
              Apuntá la cámara al código del dorso del DNI
            </Text>
            <Pressable
              accessibilityRole="button"
              className="rounded-xl border border-white px-6 py-3"
              onPress={onClose}
            >
              <Text className="text-center text-base font-medium text-white">Cancelar</Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
