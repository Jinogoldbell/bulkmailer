import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { isValidEmail } from '../emails.js';
import RecipientInput from '../components/RecipientInput.jsx';

export default function Compose() {
  const [recipients, setRecipients] = useState([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isHtml, setIsHtml] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null); // { kind: 'ok'|'warn'|'bad', message }

  const valid = recipients.filter(isValidEmail);
  const invalid = recipients.length - valid.length;

  const errors = {
    recipients: !valid.length ? 'Add at least one valid recipient.' : invalid ? `Fix or remove ${invalid} invalid address${invalid > 1 ? 'es' : ''}.` : '',
    subject: !subject.trim() ? 'Enter a subject.' : '',
    body: !body.trim() ? 'Write a message.' : '',
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const show = (k) => (submitted && errors[k] ? <p className="error" id={`${k}-error`}>{errors[k]}</p> : null);

  async function send(e) {
    e.preventDefault();
    setSubmitted(true);
    setResult(null);
    if (hasErrors) return;

    setSending(true);
    try {
      const { message, mail } = await api.sendMail({ subject, body, isHtml, recipients: valid });
      setResult({ kind: mail.status === 'sent' ? 'ok' : mail.status === 'partial' ? 'warn' : 'bad', message });
      if (mail.status === 'sent') {
        setRecipients([]);
        setSubject('');
        setBody('');
        setSubmitted(false);
      }
    } catch (err) {
      setResult({ kind: 'bad', message: err.message });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <h1>New mail</h1>
      <p className="lede">Each recipient gets their own copy, so nobody sees who else received it.</p>

      {result && (
        <div className={`banner banner-${result.kind}`} role={result.kind === 'bad' ? 'alert' : 'status'}>
          <span>{result.message}</span>
          {result.kind !== 'bad' && <Link to="/history">View in history</Link>}
        </div>
      )}

      <form className="card" onSubmit={send} noValidate>
        <div className="stripe" aria-hidden="true" />
        <div className="card-body">
          <div className="field">
            <label htmlFor="to">To</label>
            <RecipientInput id="to" value={recipients} onChange={setRecipients} describedBy="recipients-error" />
            {show('recipients')}
          </div>

          <div className="field">
            <label htmlFor="subject">Subject</label>
            <input id="subject" value={subject} maxLength={200} onChange={(e) => setSubject(e.target.value)} aria-describedby="subject-error" />
            {show('subject')}
          </div>

          <div className="field">
            <label htmlFor="body">Message</label>
            <textarea id="body" rows={10} value={body} onChange={(e) => setBody(e.target.value)} aria-describedby="body-error" />
            {show('body')}
            <label className="check">
              <input type="checkbox" checked={isHtml} onChange={(e) => setIsHtml(e.target.checked)} />
              Send as HTML
            </label>
          </div>
        </div>

        <div className="card-foot">
          <p className="count" aria-live="polite">
            <strong>{valid.length}</strong> recipient{valid.length === 1 ? '' : 's'}
            {invalid > 0 && <span className="count-bad"> {invalid} invalid</span>}
          </p>
          <button className="btn btn-primary" disabled={sending}>
            {sending ? `Sending to ${valid.length}...` : valid.length ? `Send to ${valid.length}` : 'Send'}
          </button>
        </div>
      </form>
    </>
  );
}
