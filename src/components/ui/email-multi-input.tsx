'use client';

import { useEffect, useMemo, useRef, useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

interface EmailMultiInputProps {
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  'aria-describedby'?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export function EmailMultiInput({
  value,
  onChange,
  placeholder = 'person@example.com',
  disabled,
  'aria-describedby': ariaDescribedby
}: EmailMultiInputProps) {
  const normalizedValue = useMemo(
    () => (Array.isArray(value) ? value.filter(Boolean) : []),
    [value]
  );
  const [chips, setChips] = useState<string[]>(normalizedValue);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setChips(normalizedValue);
  }, [normalizedValue]);

  const emitChange = (emails: string[]) => {
    setChips(emails);
    onChange(emails);
  };

  const addEmail = (raw: string) => {
    const email = raw.trim().replace(/,$/, '');
    if (!email) return;
    if (!emailPattern.test(email)) return;
    if (chips.includes(email)) return;
    emitChange([...chips, email]);
    setInputValue('');
  };

  const removeEmail = (email: string) => {
    emitChange(chips.filter((item) => item !== email));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (['Enter', 'Tab', ',', ' '].includes(event.key)) {
      event.preventDefault();
      addEmail(inputValue);
    }

    if (event.key === 'Backspace' && !inputValue && chips.length > 0) {
      event.preventDefault();
      emitChange(chips.slice(0, -1));
    }
  };

  return (
    <div
      className={cn(
        'border-input focus-within:ring-ring bg-background flex min-h-[44px] flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-sm transition focus-within:ring-2 focus-within:ring-offset-2'
      )}
    >
      {chips.map((email) => (
        <span
          key={email}
          className='bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium'
        >
          {email}
          <button
            type='button'
            onClick={() => removeEmail(email)}
            className='hover:text-foreground focus-visible:ring-ring rounded-full p-0.5 focus-visible:ring-2 focus-visible:outline-none'
            aria-label={`Remove ${email}`}
            disabled={disabled}
          >
            <X className='h-3 w-3' />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addEmail(inputValue)}
        disabled={disabled}
        placeholder={chips.length === 0 ? placeholder : ''}
        className='placeholder:text-muted-foreground min-w-[120px] flex-1 border-0 bg-transparent text-sm outline-none focus-visible:outline-none'
        autoComplete='off'
        spellCheck={false}
        aria-describedby={ariaDescribedby}
      />
    </div>
  );
}
