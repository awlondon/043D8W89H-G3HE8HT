import { CameraView, type BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const jobIdPattern = /^[A-Za-z0-9-_]+$/;
const payloadPrefix = 'rebar://job/';

type Props = {
  onJobScanned?: (jobId: string) => void;
};

const parseJobIdFromPayload = (payload: string) => {
  if (typeof payload !== 'string' || payload.trim().length === 0) {
    throw new Error('QR value must be a non-empty string.');
  }

  if (!payload.startsWith(payloadPrefix)) {
    throw new Error('Invalid QR code');
  }

  const jobId = payload.replace(payloadPrefix, '');

  if (!jobIdPattern.test(jobId)) {
    throw new Error('Job ID must match [A-Za-z0-9-_]+.');
  }

  return jobId;
};

export function ScanQRCodeScreen({ onJobScanned }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [lastJobId, setLastJobId] = useState<string | null>(null);

  const handleQRCodeScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      const jobId = parseJobIdFromPayload(data);
      setLastJobId(jobId);
      onJobScanned?.(jobId);
    },
    [onJobScanned]
  );

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
        <Text style={styles.statusTextDark}>Loading camera permissions…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.statusTextDark}>Camera access is required to scan QR codes.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant camera access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleQRCodeScanned}
      />
      <View style={styles.statusBar}>
        <Text style={styles.statusTextLight}>
          {lastJobId ? `Scanned job: ${lastJobId}` : 'Scan a rebar job QR code.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  camera: {
    flex: 1
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: '#fff'
  },
  statusBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#111'
  },
  statusTextDark: {
    color: '#111',
    fontSize: 16,
    textAlign: 'center'
  },
  statusTextLight: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center'
  },
  permissionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1f6feb'
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '600'
  }
});
