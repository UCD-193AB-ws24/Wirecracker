import { describe, it, expect } from 'vitest';
import Contact from '../contact';

describe('Contact', () => {
  it('creates a contact with correct initial values', () => {
    const contact = new Contact('Location 1', 0, false);
    expect(contact.associatedLocation).toBe('Location 1');
    expect(contact.mark).toBe(0);
    expect(contact.surgeonMark).toBe(false);
  });

  it('isMarked returns mark value when mark is non-zero', () => {
    const contact = new Contact('Location 1', 1, false);
    expect(contact.isMarked()).toBe(1);
  });

  it('isMarked returns true when surgeonMark is true', () => {
    const contact = new Contact('Location 1', 0, true);
    expect(contact.isMarked()).toBe(true);
  });

  it('isMarked returns false when both mark is 0 and surgeonMark is false', () => {
    const contact = new Contact('Location 1', 0, false);
    expect(contact.isMarked()).toBe(false);
  });
}); 