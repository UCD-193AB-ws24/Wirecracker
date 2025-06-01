import { describe, it, expect, vi, beforeEach } from 'vitest';
import { referenceItem } from '../../tables/reference_prototype.js';

// Mock the fetch function
vi.mock('../../tables/reference_prototype.js', () => {
  const actual = vi.importActual('../../tables/reference_prototype.js');
  return {
    ...actual,
    fetch: vi.fn(),
  };
});

describe('Reference Item', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with provided values', () => {
    const item = new referenceItem(
      'ISBN123',
      'Test Title',
      'Test Authors',
      'Test Publisher',
      '2024-01-01',
      '2024-03-20'
    );

    expect(item.isbn_issn_doi).toBe('ISBN123');
    expect(item.title).toBe('Test Title');
    expect(item.authors).toBe('Test Authors');
    expect(item.publisher).toBe('Test Publisher');
    expect(item.publication_date).toBe('2024-01-01');
    expect(item.access_date).toBe('2024-03-20');
  });

  it('should initialize with default values', () => {
    const item = new referenceItem('ISBN123');

    expect(item.isbn_issn_doi).toBe('ISBN123');
    expect(item.title).toBe('');
    expect(item.authors).toBe('');
    expect(item.publisher).toBe('');
    expect(item.publication_date).toBe('');
    expect(item.access_date).toBe('');
  });

  it('should load missing values from database', () => {
    const mockData = {
      title: 'Loaded Title',
      authors: 'Loaded Authors',
      publisher: 'Loaded Publisher',
      publication_date: '2024-01-01',
      access_date: '2024-03-20'
    };

    global.fetch = vi.fn().mockResolvedValue(mockData);

    const item = new referenceItem('ISBN123');
    item.load();

    expect(item.title).toBe(mockData.title);
    expect(item.authors).toBe(mockData.authors);
    expect(item.publisher).toBe(mockData.publisher);
    expect(item.publication_date).toBe(mockData.publication_date);
    expect(item.access_date).toBe(mockData.access_date);
  });

  it('should only load missing values', () => {
    const mockData = {
      title: 'Loaded Title',
      authors: 'Loaded Authors',
      publisher: 'Loaded Publisher',
      publication_date: '2024-01-01',
      access_date: '2024-03-20'
    };

    global.fetch = vi.fn().mockResolvedValue(mockData);

    const item = new referenceItem(
      'ISBN123',
      'Original Title',
      'Original Authors',
      'Original Publisher',
      '2023-01-01',
      '2023-03-20'
    );
    item.load();

    expect(item.title).toBe('Original Title');
    expect(item.authors).toBe('Original Authors');
    expect(item.publisher).toBe('Original Publisher');
    expect(item.publication_date).toBe('2023-01-01');
    expect(item.access_date).toBe('2023-03-20');
  });

  it('should get title and trigger load if empty', () => {
    const mockData = {
      title: 'Loaded Title',
      authors: 'Loaded Authors',
      publisher: 'Loaded Publisher',
      publication_date: '2024-01-01',
      access_date: '2024-03-20'
    };

    global.fetch = vi.fn().mockResolvedValue(mockData);

    const item = new referenceItem('ISBN123');
    const title = item.getTitle();

    expect(title).toBe(mockData.title);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should get title without loading if already set', () => {
    const item = new referenceItem('ISBN123', 'Test Title');
    const title = item.getTitle();

    expect(title).toBe('Test Title');
    expect(global.fetch).not.toHaveBeenCalled();
  });
}); 