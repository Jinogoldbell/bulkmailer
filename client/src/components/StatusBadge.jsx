const LABELS = { sent: 'Delivered', partial: 'Partly delivered', failed: 'Failed', sending: 'Sending', pending: 'Pending' };

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{LABELS[status] || status}</span>;
}
