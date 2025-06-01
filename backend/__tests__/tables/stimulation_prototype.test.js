import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stimulationItem } from '../../tables/stimulation_prototype.js';
import { corticalSubcorticalItem } from '../../tables/cort_prototype.js';
import { gmAreaItem } from '../../tables/gm_prototype.js';
import { testItem } from '../../tables/test_prototype.js';

// Mock the fetch function and dependencies
vi.mock('../../tables/stimulation_prototype.js', () => {
  const actual = vi.importActual('../../tables/stimulation_prototype.js');
  return {
    ...actual,
    fetch: vi.fn(),
  };
});

vi.mock('../../tables/cort_prototype.js', () => ({
  corticalSubcorticalItem: vi.fn(),
}));

vi.mock('../../tables/gm_prototype.js', () => ({
  gmAreaItem: vi.fn(),
}));

vi.mock('../../tables/test_prototype.js', () => ({
  testItem: vi.fn(),
}));

describe('Stimulation Item', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with provided values', () => {
    const item = new stimulationItem(
      1,
      'Temporal Lobe Epilepsy',
      'cort1',
      'gm1',
      'test1',
      '80%',
      '50Hz',
      '2mA',
      '100ms',
      '30s'
    );

    expect(item.id).toBe(1);
    expect(item.epilepsy_type).toBe('Temporal Lobe Epilepsy');
    expect(item.cort).toBe('cort1');
    expect(item.gm).toBe('gm1');
    expect(item.test).toBe('test1');
    expect(item.disruption_rate).toBe('80%');
    expect(item.frequency).toBe('50Hz');
    expect(item.current).toBe('2mA');
    expect(item.pulse_duration).toBe('100ms');
    expect(item.test_duration).toBe('30s');
  });

  it('should initialize with default values', () => {
    const item = new stimulationItem(1);

    expect(item.id).toBe(1);
    expect(item.epilepsy_type).toBe('');
    expect(item.cort).toBe('');
    expect(item.gm).toBe('');
    expect(item.test).toBe('');
    expect(item.disruption_rate).toBe('');
    expect(item.frequency).toBe('');
    expect(item.current).toBe('');
    expect(item.pulse_duration).toBe('');
    expect(item.test_duration).toBe('');
  });

  it('should load missing values from database', () => {
    const mockData = {
      epilepsy_type: 'Loaded Epilepsy',
      cort: 1,
      gm: 1,
      test: 1,
      disruption_rate: '90%',
      frequency: '60Hz',
      current: '3mA',
      pulse_duration: '150ms',
      test_duration: '45s'
    };

    global.fetch = vi.fn().mockResolvedValue(mockData);
    corticalSubcorticalItem.mockImplementation((id) => ({ id }));
    gmAreaItem.mockImplementation((id) => ({ id }));
    testItem.mockImplementation((id) => ({ id }));

    const item = new stimulationItem(1);
    item.load();

    expect(item.epilepsy_type).toBe(mockData.epilepsy_type);
    expect(item.disruption_rate).toBe(mockData.disruption_rate);
    expect(item.frequency).toBe(mockData.frequency);
    expect(item.current).toBe(mockData.current);
    expect(item.pulse_duration).toBe(mockData.pulse_duration);
    expect(item.test_duration).toBe(mockData.test_duration);
    expect(corticalSubcorticalItem).toHaveBeenCalledWith(mockData.cort);
    expect(gmAreaItem).toHaveBeenCalledWith(mockData.gm);
    expect(testItem).toHaveBeenCalledWith(mockData.test);
  });

  it('should only load missing values', () => {
    const mockData = {
      epilepsy_type: 'Loaded Epilepsy',
      cort: 1,
      gm: 1,
      test: 1,
      disruption_rate: '90%',
      frequency: '60Hz',
      current: '3mA',
      pulse_duration: '150ms',
      test_duration: '45s'
    };

    global.fetch = vi.fn().mockResolvedValue(mockData);
    corticalSubcorticalItem.mockImplementation((id) => ({ id }));
    gmAreaItem.mockImplementation((id) => ({ id }));
    testItem.mockImplementation((id) => ({ id }));

    const item = new stimulationItem(
      1,
      'Original Epilepsy',
      'cort1',
      'gm1',
      'test1',
      '80%',
      '50Hz',
      '2mA',
      '100ms',
      '30s'
    );
    item.load();

    expect(item.epilepsy_type).toBe('Original Epilepsy');
    expect(item.disruption_rate).toBe('80%');
    expect(item.frequency).toBe('50Hz');
    expect(item.current).toBe('2mA');
    expect(item.pulse_duration).toBe('100ms');
    expect(item.test_duration).toBe('30s');
  });

  it('should get epilepsy type and trigger load if empty', () => {
    const mockData = {
      epilepsy_type: 'Loaded Epilepsy',
      cort: 1,
      gm: 1,
      test: 1,
      disruption_rate: '90%',
      frequency: '60Hz',
      current: '3mA',
      pulse_duration: '150ms',
      test_duration: '45s'
    };

    global.fetch = vi.fn().mockResolvedValue(mockData);
    corticalSubcorticalItem.mockImplementation((id) => ({ id }));
    gmAreaItem.mockImplementation((id) => ({ id }));
    testItem.mockImplementation((id) => ({ id }));

    const item = new stimulationItem(1);
    const epilepsyType = item.getEpilepsyType();

    expect(epilepsyType).toBe(mockData.epilepsy_type);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should get epilepsy type without loading if already set', () => {
    const item = new stimulationItem(1, 'Test Epilepsy');
    const epilepsyType = item.getEpilepsyType();

    expect(epilepsyType).toBe('Test Epilepsy');
    expect(global.fetch).not.toHaveBeenCalled();
  });
}); 