import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gmAreaItem } from '../../tables/gm_prototype.js';
import { functionItem } from '../../tables/function_prototype.js';
import { corticalSubcorticalItem } from '../../tables/cort_prototype.js';
import { referenceItem } from '../../tables/reference_prototype.js';

// Mock the fetch function and dependencies
vi.mock('../../tables/gm_prototype.js', () => {
  const actual = vi.importActual('../../tables/gm_prototype.js');
  return {
    ...actual,
    fetch: vi.fn(),
  };
});

vi.mock('../../tables/function_prototype.js', () => ({
  functionItem: vi.fn(),
}));

vi.mock('../../tables/cort_prototype.js', () => ({
  corticalSubcorticalItem: vi.fn(),
}));

vi.mock('../../tables/reference_prototype.js', () => ({
  referenceItem: vi.fn(),
}));

describe('Gray Matter Area Item', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with provided values', () => {
    const item = new gmAreaItem(1, 'Test Area', 'TA', 'func1,func2', 'cort1,cort2');

    expect(item.id).toBe(1);
    expect(item.name).toBe('Test Area');
    expect(item.acronym).toBe('TA');
    expect(item.functions).toBe('func1,func2');
    expect(item.corts).toBe('cort1,cort2');
  });

  it('should initialize with default values', () => {
    const item = new gmAreaItem(1);

    expect(item.id).toBe(1);
    expect(item.name).toBe('');
    expect(item.acronym).toBe('');
    expect(item.functions).toBe('');
    expect(item.corts).toBe('');
  });

  it('should load missing name and acronym from database', () => {
    const mockData = {
      name: 'Loaded Area',
      acronym: 'LA'
    };

    global.fetch = vi.fn().mockResolvedValue(mockData);

    const item = new gmAreaItem(1);
    item.load();

    expect(item.name).toBe(mockData.name);
    expect(item.acronym).toBe(mockData.acronym);
  });

  it('should only load missing name and acronym', () => {
    const mockData = {
      name: 'Loaded Area',
      acronym: 'LA'
    };

    global.fetch = vi.fn().mockResolvedValue(mockData);

    const item = new gmAreaItem(1, 'Original Area', 'OA');
    item.load();

    expect(item.name).toBe('Original Area');
    expect(item.acronym).toBe('OA');
  });

  it('should load functions from database', () => {
    const mockFunctions = [
      { function_id: 1, reference_id: 1 },
      { function_id: 2, reference_id: 2 }
    ];

    global.fetch = vi.fn().mockResolvedValue(mockFunctions);
    functionItem.mockImplementation((id) => ({ id }));
    referenceItem.mockImplementation((id) => ({ id }));

    const item = new gmAreaItem(1);
    item.load();

    expect(item.functions).toHaveLength(2);
    expect(functionItem).toHaveBeenCalledTimes(2);
    expect(referenceItem).toHaveBeenCalledTimes(2);
  });

  it('should load corts from database', () => {
    const mockCorts = [
      { cort_id: 1, reference_id: 1 },
      { cort_id: 2, reference_id: 2 }
    ];

    global.fetch = vi.fn().mockResolvedValue(mockCorts);
    corticalSubcorticalItem.mockImplementation((id) => ({ id }));
    referenceItem.mockImplementation((id) => ({ id }));

    const item = new gmAreaItem(1);
    item.load();

    expect(item.corts).toHaveLength(2);
    expect(corticalSubcorticalItem).toHaveBeenCalledTimes(2);
    expect(referenceItem).toHaveBeenCalledTimes(2);
  });

  it('should get name and trigger load if empty', () => {
    const mockData = {
      name: 'Loaded Area',
      acronym: 'LA'
    };

    global.fetch = vi.fn().mockResolvedValue(mockData);

    const item = new gmAreaItem(1);
    const name = item.getName();

    expect(name).toBe(mockData.name);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should get name without loading if already set', () => {
    const item = new gmAreaItem(1, 'Test Area');
    const name = item.getName();

    expect(name).toBe('Test Area');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should get acronym and trigger load if empty', () => {
    const mockData = {
      name: 'Loaded Area',
      acronym: 'LA'
    };

    global.fetch = vi.fn().mockResolvedValue(mockData);

    const item = new gmAreaItem(1);
    const acronym = item.getAcronym();

    expect(acronym).toBe(mockData.acronym);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should get acronym without loading if already set', () => {
    const item = new gmAreaItem(1, '', 'TA');
    const acronym = item.getAcronym();

    expect(acronym).toBe('TA');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should get functions and trigger load if empty', () => {
    const mockFunctions = [
      { function_id: 1, reference_id: 1 }
    ];

    global.fetch = vi.fn().mockResolvedValue(mockFunctions);
    functionItem.mockImplementation((id) => ({ id }));
    referenceItem.mockImplementation((id) => ({ id }));

    const item = new gmAreaItem(1);
    const functions = item.getFunctions();

    expect(functions).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should get corts and trigger load if empty', () => {
    const mockCorts = [
      { cort_id: 1, reference_id: 1 }
    ];

    global.fetch = vi.fn().mockResolvedValue(mockCorts);
    corticalSubcorticalItem.mockImplementation((id) => ({ id }));
    referenceItem.mockImplementation((id) => ({ id }));

    const item = new gmAreaItem(1);
    const corts = item.getCorts();

    expect(corts).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalled();
  });
}); 