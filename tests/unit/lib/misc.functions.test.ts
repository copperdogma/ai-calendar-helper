/**
 * @jest-environment node
 */

import { classNames, cleanDbData } from '@/lib/utils';
import { buildEventDescription } from '@/lib/utils/calendarLinks';
import { getDatabaseErrorType, isUniqueConstraintError } from '@/lib/db/utils';
import { createCorrelationId } from '@/lib/auth-logging';

describe('Misc utility function smoke tests', () => {
  it('classNames joins truthy strings', () => {
    expect(classNames('a', undefined, 'c')).toBe('a c');
  });

  it('buildEventDescription concatenates fields', () => {
    expect(buildEventDescription('foo', 'bar')).toContain('foo');
  });

  it('cleanDbData removes password field', () => {
    const sanitized = cleanDbData({ id: 1, password: 'secret' });
    expect((sanitized as any).password).toBeUndefined();
  });

  it('getDatabaseErrorType returns UNKNOWN for non-prisma error', () => {
    const type = getDatabaseErrorType(new Error('x'));
    expect(type).toBe('Unknown');
  });

  it('isUniqueConstraintError returns false for generic error', () => {
    expect(isUniqueConstraintError(new Error('y'))).toBe(false);
  });

  it('createCorrelationId generates prefixed id', () => {
    expect(createCorrelationId('test')).toMatch(/^test-/);
  });
}); 