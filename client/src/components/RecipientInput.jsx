import { useState } from 'react';
import { isValidEmail, splitTokens } from '../emails.js';

export default function RecipientInput({ value, onChange, id, describedBy }) {
  const [text, setText] = useState('');
  const [note, setNote] = useState('');

  const invalidCount = value.filter((v) => !isValidEmail(v)).length;

  function commit(raw) {
    const tokens = splitTokens(raw);
    if (!tokens.length) return;
    const seen = new Set(value.map((v) => v.toLowerCase()));
    const next = [...value];
    let dupes = 0;
    for (const t of tokens) {
      const key = t.toLowerCase();
      if (seen.has(key)) {
        dupes += 1;
        continue;
      }
      seen.add(key);
      next.push(t);
    }
    onChange(next);
    setNote(dupes ? `${dupes} duplicate${dupes > 1 ? 's' : ''} skipped.` : '');
    setText('');
  }

  function onKeyDown(e) {
    if ([',', ';', ' ', 'Enter'].includes(e.key) && text.trim()) {
      e.preventDefault();
      commit(text);
    } else if (e.key === 'Backspace' && !text && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div>
      <div className="chips" onClick={(e) => e.currentTarget.querySelector('input')?.focus()}>
        {value.map((email) => {
          const ok = isValidEmail(email);
          return (
            <span key={email} className={`chip ${ok ? '' : 'chip-invalid'}`} title={ok ? '' : 'This is not a valid email address'}>
              {email}
              <button type="button" aria-label={`Remove ${email}`} onClick={() => onChange(value.filter((v) => v !== email))}>
                &times;
              </button>
            </span>
          );
        })}
        <input
          id={id}
          aria-describedby={describedBy}
          value={text}
          placeholder={value.length ? '' : 'name@example.com, paste a list, or type and press Enter'}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => commit(text)}
          onPaste={(e) => {
            e.preventDefault();
            commit(text + ' ' + e.clipboardData.getData('text'));
          }}
        />
      </div>
      <div className="chips-meta">
        <span>{note}</span>
        {invalidCount > 0 && (
          <button type="button" className="link" onClick={() => onChange(value.filter(isValidEmail))}>
            Remove {invalidCount} invalid
          </button>
        )}
        {value.length > 0 && (
          <button type="button" className="link" onClick={() => onChange([])}>
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
