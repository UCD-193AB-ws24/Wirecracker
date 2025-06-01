import { describe, it, expect, vi, beforeEach } from 'vitest';
import { functionItem } from '../../tables/function_prototype.js';

// Mock the fetch function
vi.mock('../../tables/function_prototype.js', () => {
  const actual = vi.importActual('../../tables/function_prototype.js');
  return {
    ...actual,
    fetch: vi.fn(),
  };
});

describe('Function Item', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with provided values', () => {
    const item = new functionItem(1, 'Test Function', 'Test Description');

    expect(item.id).toBe(1);
    expect(item.name).toBe('Test Function');
    expect(item.description).toBe('Test Description');
  });

  it('should initialize with default values', () => {
    const item = new functionItem(1);

    expect(item.id).toBe(1);
    expect(item.name).toBe('');
    expect(item.description).toBe('');
  });

  it('should load missing values from database', () => {
    const mockData = {
      name: 'Loaded Function',
      description: 'Loaded Description'
    };

    global.fetch = vi.fn().mockResolvedValue(mockData);

    const item = new functionItem(1);
    item.load();

    expect(item.name).toBe(mockData.name);
    expect(item.description).toBe(mockData.description);
  });

  it('should only load missing values', () => {
    const mockData = {
      name: 'Loaded Function',
      description: 'Loaded Description'
    };

    global.fetch = vi.fn().mockResolvedValue(mockData);

    const item = new functionItem(1, 'Original Function', 'Original Description');
    item.load();

    expect(item.name).toBe('Original Function');
    expect(item.description).toBe('Original Description');
  });

  it('should get name and trigger load if empty', () => {
    const mockData = {
      name: 'Loaded Function',
      description: 'Loaded Description'
    };

    global.fetch = vi.fn().mockResolvedValue(mockData);

    const item = new functionItem(1);
    const name = item.getName();

    expect(name).toBe(mockData.name);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should get name without loading if already set', () => {
    const item = new functionItem(1, 'Test Function');
    const name = item.getName();

    expect(name).toBe('Test Function');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should get description and trigger load if empty', () => {
    const mockData = {
      name: 'Loaded Function',
      description: 'Loaded Description'
    };

    global.fetch = vi.fn().mockResolvedValue(mockData);

    const item = new functionItem(1);
    const description = item.getDescription();

    expect(description).toBe(mockData.description);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should get description without loading if already set', () => {
    const item = new functionItem(1, '', 'Test Description');
    const description = item.getDescription();

    expect(description).toBe('Test Description');
    expect(global.fetch).not.toHaveBeenCalled();
  });
}); 