import { getStatusStyles, getExactStatusStyles } from '../statusColors';

describe('getStatusStyles', () => {
  it('buckets positive statuses into the forest tint', () => {
    expect(getStatusStyles('New').backgroundColor).toBe('#cfebba');
    expect(getStatusStyles('Customer').backgroundColor).toBe('#cfebba');
    expect(getStatusStyles('Accepted').backgroundColor).toBe('#cfebba');
  });

  it('buckets negative statuses into the red tint', () => {
    expect(getStatusStyles('Lost').color).toBe('#ba1a1a');
    expect(getStatusStyles('Declined').color).toBe('#ba1a1a');
    expect(getStatusStyles('Expired').color).toBe('#ba1a1a');
  });

  it('buckets in-progress statuses into the pink tint', () => {
    expect(getStatusStyles('Contacted').backgroundColor).toBe('#ffd8ed');
    expect(getStatusStyles('Sent').backgroundColor).toBe('#ffd8ed');
  });

  it('falls back to gray for unknown or missing statuses', () => {
    expect(getStatusStyles('Something Else').backgroundColor).toBe('#eeeeec');
    expect(getStatusStyles(null).backgroundColor).toBe('#eeeeec');
  });
});

describe('getExactStatusStyles', () => {
  it('uses white text on dark backgrounds and black on light', () => {
    expect(getExactStatusStyles('New', '#000000').color).toBe('#ffffff');
    expect(getExactStatusStyles('New', '#ffffff').color).toBe('#000000');
  });

  it('keeps the exact background color', () => {
    expect(getExactStatusStyles('New', '#123456').backgroundColor).toBe('#123456');
  });

  it('falls back to semantic styles for invalid colors', () => {
    expect(getExactStatusStyles('Lost', 'red')).toEqual(getStatusStyles('Lost'));
    expect(getExactStatusStyles('Lost', null)).toEqual(getStatusStyles('Lost'));
  });
});
