import { useHardwareStore } from '../store/hardwareStore';

describe('Hardware Store (Printers & Digital Weighing Scale)', () => {
  beforeEach(() => {
    useHardwareStore.setState({
      printerWidth: '58mm',
      connectionType: 'system',
      printerName: 'Generic 58mm Thermal',
      autoCut: true,
      autoKickDrawer: true,
      isPrinterConnected: true,
      isScaleConnected: false,
      scaleWeight: 0.0,
      isScaleStable: true,
      isSimulatedScale: false,
    });
  });

  describe('Thermal Printer Settings', () => {
    it('updates printer width between 58mm and 80mm', () => {
      useHardwareStore.getState().setPrinterWidth('80mm');
      expect(useHardwareStore.getState().printerWidth).toBe('80mm');

      const settings = useHardwareStore.getState().getPrinterSettings();
      expect(settings.width).toBe('80mm');
    });

    it('toggles auto-cut and auto-kick drawer settings', () => {
      useHardwareStore.getState().setAutoCut(false);
      useHardwareStore.getState().setAutoKickDrawer(false);

      expect(useHardwareStore.getState().autoCut).toBe(false);
      expect(useHardwareStore.getState().autoKickDrawer).toBe(false);
    });

    it('updates connection type between Bluetooth, USB, and System', () => {
      useHardwareStore.getState().setConnectionType('bluetooth');
      expect(useHardwareStore.getState().connectionType).toBe('bluetooth');
    });
  });

  describe('Digital Weighing Scale (Taraju)', () => {
    it('sets live scale weight and records stable reading', () => {
      useHardwareStore.getState().setScaleWeight(1.455, true);

      expect(useHardwareStore.getState().scaleWeight).toBe(1.455);
      expect(useHardwareStore.getState().isScaleStable).toBe(true);
      expect(useHardwareStore.getState().lastScaleReading?.weight).toBe(1.455);
    });

    it('tares scale back to 0.000 kg', () => {
      useHardwareStore.getState().setScaleWeight(2.35);
      expect(useHardwareStore.getState().scaleWeight).toBe(2.35);

      useHardwareStore.getState().tareScale();
      expect(useHardwareStore.getState().scaleWeight).toBe(0.0);
    });

    it('enables simulated scale and populates initial weight', () => {
      useHardwareStore.getState().setSimulatedScale(true);

      expect(useHardwareStore.getState().isSimulatedScale).toBe(true);
      expect(useHardwareStore.getState().isScaleConnected).toBe(true);
      expect(useHardwareStore.getState().scaleWeight).toBe(1.25);
    });
  });
});
