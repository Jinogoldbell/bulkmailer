import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';

const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

function Detail({ id, onDeleted }) {
  const [mail, setMail] = useState(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.getMail(id).then((r) => setMail(r.mail)).catch((e) => setError(e.message));
  }, [id]);

  async function remove() {
    if (!window.confirm('Delete this email from history? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.deleteMail(id);
      onDeleted();
    } catch (e) {
      setError(e.message);
      setDeleting(false);
    }
  }

  if (error) return <div className="banner banner-bad" role="alert">{error}</div>;
  if (!mail) return <p className="loading">Loading...</p>;

  return (
    <div className="detail">
      {mail.error && <div className="banner banner-bad">{mail.error}</div>}
      <h3>Message{mail.isHtml ? ' (HTML source)' : ''}</h3>
      <pre className="message">{mail.body}</pre>
      <h3>Recipients</h3>
      <ul className="recips">
        {mail.recipients.map((r) => (
          <li key={r.email}>
            <span>{r.email}</span>
            <StatusBadge status={r.status === 'sent' ? 'sent' : r.status} />
            {r.error && <small className="recip-error">{r.error}</small>}
          </li>
        ))}
      </ul>
      <button className="btn btn-danger" onClick={remove} disabled={deleting}>
        {deleting ? 'Deleting...' : 'Delete from history'}
      </button>
    </div>
  );
}

export default function History() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);

  const load = useCallback(() => {
    setError('');
    api.listMail({ page, status }).then(setData).catch((e) => setError(e.message));
  }, [page, status]);

  useEffect(load, [load]);

  return (
    <>
      <div className="page-head">
        <h1>History</h1>
        <div className="field inline">
          <label htmlFor="filter">Show</label>
          <select id="filter" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); setOpen(null); }}>
            <option value="">All mail</option>
            <option value="sent">Delivered</option>
            <option value="partial">Partly delivered</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {error && <div className="banner banner-bad" role="alert">{error}</div>}
      {!data && !error && <p className="loading">Loading history...</p>}

      {data && data.items.length === 0 && (
        <div className="empty">
          <p>{status ? 'No mail with this status.' : 'Nothing sent yet. Mail you send will be listed here.'}</p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <ul className="list">
          {data.items.map((m) => (
            <li key={m.id} className={open === m.id ? 'row open' : 'row'}>
              <button className="row-head" aria-expanded={open === m.id} onClick={() => setOpen(open === m.id ? null : m.id)}>
                <span className="row-main">
                  <span className="row-subject">{m.subject}</span>
                  <span className="row-date">{fmt.format(new Date(m.createdAt))}</span>
                </span>
                <span className="row-count">
                  {m.sentCount} of {m.totalRecipients} delivered
                </span>
                <StatusBadge status={m.status} />
              </button>
              {open === m.id && <Detail id={m.id} onDeleted={() => { setOpen(null); load(); }} />}
            </li>
          ))}
        </ul>
      )}

      {data && data.pages > 1 && (
        <div className="pager">
          <button className="btn btn-quiet" disabled={page <= 1} onClick={() => { setPage(page - 1); setOpen(null); }}>Previous</button>
          <span>Page {data.page} of {data.pages}</span>
          <button className="btn btn-quiet" disabled={page >= data.pages} onClick={() => { setPage(page + 1); setOpen(null); }}>Next</button>
        </div>
      )}
    </>
  );
}
