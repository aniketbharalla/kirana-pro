import { parseScaleWeight } from '../utils/scaleParser';

describe('Electronic Weighing Scale Serial Parser', () => {
  it('parses Essae/Toledo continuous weight string (stable)', () => {
    const reading = parseScaleWeight('ST,GS,+001.250kg\r\n');
    expect(reading).toBeDefined();
    expect(reading?.weight).toBe(1.25);
    expect(reading?.unit).toBe('kg');
    expect(reading?.isStable).toBe(true);
  });

  it('parses Essae/Toledo unstable weight string (user placing item on pan)', () => {
    const reading = parseScaleWeight('US,GS,+000.450kg\r\n');
    expect(reading).toBeDefined();
    expect(reading?.weight).toBe(0.45);
    expect(reading?.unit).toBe('kg');
    expect(reading?.isStable).toBe(false);
  });

  it('parses grams and converts to kilograms', () => {
    const reading = parseScaleWeight('ST,GS,+0750g\r\n');
    expect(reading).toBeDefined();
    expect(reading?.weight).toBe(0.75);
    expect(reading?.unit).toBe('kg');
  });

  it('parses weight label formats (Phoenix / Avery)', () => {
    const reading = parseScaleWeight('WT: 002.500 KG  TARE: 000.000 KG\r\n');
    expect(reading).toBeDefined();
    expect(reading?.weight).toBe(2.5);
    expect(reading?.isStable).toBe(true);
  });

  it('parses simple numeric ASCII weight string', () => {
    const reading = parseScaleWeight('  3.400 kg\r\n');
    expect(reading).toBeDefined();
    expect(reading?.weight).toBe(3.4);
    expect(reading?.unit).toBe('kg');
  });

  it('returns null on invalid or empty string', () => {
    expect(parseScaleWeight('')).toBeNull();
    expect(parseScaleWeight('   ')).toBeNull();
    expect(parseScaleWeight('ERROR_NO_SENSOR')).toBeNull();
  });
});
