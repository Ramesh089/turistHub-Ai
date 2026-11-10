import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { MessageCircle, RefreshCw, Send } from 'lucide-react';

export default function PartnerQueriesAdmin() {
  const [queries, setQueries] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const r = await api.get('/partner/admin/queries');
      setQueries(r.data.queries || []);
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load partner questions.');
    }
  };

  useEffect(() => { load(); }, []);

  const reply = async (id) => {
    setBusyId(id);
    setError('');
    try {
      await api.post(`/partner/admin/queries/${id}/reply`, { reply: drafts[id] || '' });
      setDrafts(v => ({ ...v, [id]: '' }));
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Could not send reply.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section style={{ display: 'grid', gap: 14 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>
            <MessageCircle size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Partner Questions
          </h2>
          <p style={{ color: '#64748b' }}>Read partner questions and reply from the admin dashboard.</p>
        </div>
        <button className="btn btn-secondary" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </header>

      {error && (
        <div role="alert" style={{
          padding: 12, background: '#fee2e2', color: '#991b1b', borderRadius: 8,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10
        }}>
          <span>{error}</span>
          {(error.includes('token') || error.includes('Access denied')) && (
            <a href="/login" style={{ background: '#dc2626', color: 'white', padding: '5px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', textDecoration: 'none' }}>
              Log In Again
            </a>
          )}
        </div>
      )}

      {queries.length === 0 ? (
        <p style={{ color: '#64748b' }}>No partner questions are waiting.</p>
      ) : (
        queries.map(q => (
          <article key={q.id} style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 12, background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <strong>{q.subject}</strong>
              <span>{q.status}</span>
            </div>
            <div style={{ color: '#64748b', fontSize: 13 }}>
              {q.businessName || q.partnerName} · {q.partnerEmail}
            </div>
            <p style={{ whiteSpace: 'pre-wrap' }}>{q.question}</p>
            {q.adminReply && (
              <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 8, marginBottom: 10 }}>
                <strong>Current reply</strong>
                <p style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{q.adminReply}</p>
              </div>
            )}
            <textarea
              rows={3}
              maxLength={5000}
              className="form-control"
              placeholder="Write or update a reply"
              value={drafts[q.id] || ''}
              onChange={e => setDrafts(v => ({ ...v, [q.id]: e.target.value }))}
            />
            <button
              className="btn btn-primary"
              disabled={busyId === q.id}
              onClick={() => reply(q.id)}
              style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 7 }}
            >
              <Send size={14} />
              {busyId === q.id ? 'Sending…' : 'Send reply'}
            </button>
          </article>
        ))
      )}
    </section>
  );
}
