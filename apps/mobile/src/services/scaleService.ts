import { parseScaleWeight } from '@kirana-pro/shared';
import { useHardwareStore } from '../store/hardwareStore';

let serialPort: any = null;
let reader: any = null;
let simulationInterval: any = null;

/**
 * Connects to physical scale via Web Serial API or Web Bluetooth
 */
export const connectSerialScale = async (): Promise<{ success: boolean; message: string }> => {
  if (typeof navigator !== 'undefined' && (navigator as any).serial) {
    try {
      serialPort = await (navigator as any).serial.requestPort();
      await serialPort.open({ baudRate: 9600 });

      useHardwareStore.getState().setScaleConnected(true);

      // Start continuous background read loop
      (async () => {
        try {
          while (serialPort.readable) {
            reader = serialPort.readable.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              if (value) {
                buffer += decoder.decode(value);
                const lines = buffer.split('\r\n');
                if (lines.length > 1) {
                  const lastLine = lines[lines.length - 2];
                  buffer = lines[lines.length - 1];

                  const reading = parseScaleWeight(lastLine);
                  if (reading) {
                    useHardwareStore.getState().setScaleWeight(reading.weight, reading.isStable);
                  }
                }
              }
            }
          }
        } catch (readErr) {
          console.warn('Scale serial reading stopped:', readErr);
        }
      })();

      return { success: true, message: 'Connected to Electronic Weighing Scale (9600 baud)' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Could not connect to serial scale' };
    }
  }

  // Fallback: start simulated scale
  startSimulatedScale(1.25);
  return {
    success: true,
    message: 'Serial port unavailable in this browser. Simulated scale started (1.250 kg)',
  };
};

/**
 * Starts automatic weight simulation with realistic sensor updates
 */
export const startSimulatedScale = (baseWeightKg: number = 1.25) => {
  stopSimulatedScale();
  const store = useHardwareStore.getState();
  store.setSimulatedScale(true);
  store.setScaleWeight(baseWeightKg, true);

  // Subtle fluctuation every 2 seconds to simulate live scale continuous streaming
  simulationInterval = setInterval(() => {
    const current = useHardwareStore.getState().scaleWeight;
    if (current > 0) {
      // micro fluctuation ±0.005 kg
      const jitter = (Math.random() - 0.5) * 0.005;
      const newWeight = Math.max(0, Math.round((current + jitter) * 1000) / 1000);
      useHardwareStore.getState().setScaleWeight(newWeight, true);
    }
  }, 2000);
};

export const stopSimulatedScale = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
};

/**
 * Disconnects electronic weighing scale
 */
export const disconnectScale = async () => {
  stopSimulatedScale();
  useHardwareStore.getState().setScaleConnected(false);
  useHardwareStore.getState().setSimulatedScale(false);

  try {
    if (reader) {
      await reader.cancel();
      reader = null;
    }
    if (serialPort) {
      await serialPort.close();
      serialPort = null;
    }
  } catch {}
};
