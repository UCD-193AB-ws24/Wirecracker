import { describe, it, expect, vi, beforeEach } from 'vitest';
import { corticalSubcorticalItem } from '../../tables/cort_prototype.js';

// Mock the fetch function
vi.mock('../../tables/cort_prototype.js', () => {
  const actual = vi.importActual('../../tables/cort_prototype.js');
  return {
    ...actual,
    fetch: vi.fn(),
  };
});

describe('Cortical Subcortical Item', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with provided values', () => {
    const item = new corticalSubcorticalItem(
      1,
      'Test Name',
      'TN',
      'EL1',
      'Left',
      'Frontal'
    );

    expect(item.id).toBe(1);
    expect(item.name).toBe('Test Name');
    expect(item.acronym).toBe('TN');
    expect(item.electrode_label).toBe('EL1');
    expect(item.hemisphere).toBe('Left');
    expect(item.lobe).toBe('Frontal');
  });

  it('should initialize with default values', () => {
    const item = new corticalSubcorticalItem(1);

    expect(item.id).toBe(1);
    expect(item.name).toBe('');
    expect(item.acronym).toBe('');
    expect(item.electrode_label).toBe('');
    expect(item.hemisphere).toBe('');
    expect(item.lobe).toBe('');
  });

  it('should load missing values from database', () => {
    const mockData = {
      name: 'Loaded Name',
      acronym: 'LN',
      electrode_label: 'EL2',
      hemisphere: 'Right',
      lobe: 'Temporal'
    };

    global.fetch = vi.fn().mockResolvedValue(mockData);

    const item = new corticalSubcorticalItem(1);
    item.load();

    expect(item.name).toBe(mockData.name);
    expect(item.acronym).toBe(mockData.acronym);
    expect(item.electrode_label).toBe(mockData.electrode_label);
    expect(item.hemisphere).toBe(mockData.hemisphere);
    expect(item.lobe).toBe(mockData.lobe);
  });

  it('should only load missing values', () => {
    const mockData = {
      name: 'Loaded Name',
      acronym: 'LN',
      electrode_label: 'EL2',
      hemisphere: 'Right',
      lobe: 'Temporal'
    };

    global.fetch = vi.fn().mockResolvedValue(mockData);

    const item = new corticalSubcorticalItem(
      1,
      'Original Name',
      'ON',
      'EL1',
      'Left',
      'Frontal'
    );
    item.load();

    expect(item.name).toBe('Original Name');
    expect(item.acronym).toBe('ON');
    expect(item.electrode_label).toBe('EL1');
    expect(item.hemisphere).toBe('Left');
    expect(item.lobe).toBe('Frontal');
  });

  it('should get name and trigger load if empty', () => {
    const mockData = {
      name: 'Loaded Name',
      acronym: 'LN',
      electrode_label: 'EL2',
      hemisphere: 'Right',
      lobe: 'Temporal'
    };

    global.fetch = vi.fn().mockResolvedValue(mockData);

    const item = new corticalSubcorticalItem(1);
    const name = item.getName();

    expect(name).toBe(mockData.name);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should get name without loading if already set', () => {
    const item = new corticalSubcorticalItem(1, 'Test Name');
    const name = item.getName();

    expect(name).toBe('Test Name');
    expect(global.fetch).not.toHaveBeenCalled();
  });
}); 