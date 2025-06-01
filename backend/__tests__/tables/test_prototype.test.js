import { describe, it, expect, vi, beforeEach } from 'vitest';
import { testItem } from '../../tables/test_prototype.js';
import { functionItem } from '../../tables/function_prototype.js';
import { referenceItem } from '../../tables/reference_prototype.js';

// Mock the fetch function and dependencies
vi.mock('../../tables/test_prototype.js', () => {
  const actual = vi.importActual('../../tables/test_prototype.js');
  return {
    ...actual,
    fetch: vi.fn(),
  };
});

vi.mock('../../tables/function_prototype.js', () => ({
  functionItem: vi.fn(),
}));

vi.mock('../../tables/reference_prototype.js', () => ({
  referenceItem: vi.fn(),
}));

describe('Test Item', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with provided values', () => {
    const item = new testItem(1, 'Test Name', 'Test Description', 'tag1,tag2', 'func1,func2');

    expect(item.id).toBe(1);
    expect(item.name).toBe('Test Name');
    expect(item.description).toBe('Test Description');
    expect(item.tags).toBe('tag1,tag2');
    expect(item.functions).toBe('func1,func2');
  });

  it('should initialize with default values', () => {
    const item = new testItem(1);

    expect(item.id).toBe(1);
    expect(item.name).toBe('');
    expect(item.description).toBe('');
    expect(item.tags).toBe('');
    expect(item.functions).toBe('');
  });

  it('should load missing name and description from database', () => {
    const mockData = {
      name: 'Loaded Test',
      description: 'Loaded Description'
    };

    global.fetch = vi.fn().mockResolvedValue(mockData);

    const item = new testItem(1);
    item.load();

    expect(item.name).toBe(mockData.name);
    expect(item.description).toBe(mockData.description);
  });

  it('should only load missing name and description', () => {
    const mockData = {
      name: 'Loaded Test',
      description: 'Loaded Description'
    };

    global.fetch = vi.fn().mockResolvedValue(mockData);

    const item = new testItem(1, 'Original Test', 'Original Description');
    item.load();

    expect(item.name).toBe('Original Test');
    expect(item.description).toBe('Original Description');
  });

  it('should load tags from database', () => {
    const mockTags = [
      { test_id: 1, tag_id: 1 },
      { test_id: 1, tag_id: 2 }
    ];

    const mockTagData = [
      { id: 1, name: 'Tag 1' },
      { id: 2, name: 'Tag 2' }
    ];

    global.fetch = vi.fn()
      .mockResolvedValueOnce(mockTags)
      .mockResolvedValueOnce(mockTagData[0])
      .mockResolvedValueOnce(mockTagData[1]);

    const item = new testItem(1);
    item.load();

    expect(item.tags).toHaveLength(2);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('should load functions from database', () => {
    const mockFunctions = [
      { function_id: 1, reference_id: 1 },
      { function_id: 2, reference_id: 2 }
    ];

    global.fetch = vi.fn().mockResolvedValue(mockFunctions);
    functionItem.mockImplementation((id) => ({ id }));
    referenceItem.mockImplementation((id) => ({ id }));

    const item = new testItem(1);
    item.load();

    expect(item.functions).toHaveLength(2);
    expect(functionItem).toHaveBeenCalledTimes(2);
    expect(referenceItem).toHaveBeenCalledTimes(2);
  });

  it('should get name and trigger load if empty', () => {
    const mockData = {
      name: 'Loaded Test',
      description: 'Loaded Description'
    };

    global.fetch = vi.fn().mockResolvedValue(mockData);

    const item = new testItem(1);
    const name = item.getName();

    expect(name).toBe(mockData.name);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should get name without loading if already set', () => {
    const item = new testItem(1, 'Test Name');
    const name = item.getName();

    expect(name).toBe('Test Name');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should get description and trigger load if empty', () => {
    const mockData = {
      name: 'Loaded Test',
      description: 'Loaded Description'
    };

    global.fetch = vi.fn().mockResolvedValue(mockData);

    const item = new testItem(1);
    const description = item.getDescription();

    expect(description).toBe(mockData.description);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should get description without loading if already set', () => {
    const item = new testItem(1, '', 'Test Description');
    const description = item.getDescription();

    expect(description).toBe('Test Description');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should get tags and trigger load if empty', () => {
    const mockTags = [
      { test_id: 1, tag_id: 1 }
    ];

    const mockTagData = [
      { id: 1, name: 'Tag 1' }
    ];

    global.fetch = vi.fn()
      .mockResolvedValueOnce(mockTags)
      .mockResolvedValueOnce(mockTagData[0]);

    const item = new testItem(1);
    const tags = item.getTags();

    expect(tags).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should get functions and trigger load if empty', () => {
    const mockFunctions = [
      { function_id: 1, reference_id: 1 }
    ];

    global.fetch = vi.fn().mockResolvedValue(mockFunctions);
    functionItem.mockImplementation((id) => ({ id }));
    referenceItem.mockImplementation((id) => ({ id }));

    const item = new testItem(1);
    const functions = item.getFunctions();

    expect(functions).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalled();
  });
}); 