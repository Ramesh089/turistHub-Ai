import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { MessageCircle, RefreshCw, Send } from 'lucide-react';

export default function PartnerQueries() {
  const [queries, setQueries] = useState([]);
  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const load = async () => { setLoading(true); try { const r = await api.get('/partner/my/queries'); setQueries(r.data.queries || []); } catch (e) { setNotice(e.response?.data?.message || 'Could not load questions.'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const submit = async e => { e.preventDefault(); setBusy(true); setNotice(''); try { await api.post('/partner/my/queries', { subject, question }); setSubject(''); setQuestion(''); setNotice('Your question was sent to the admin team.'); await load(); } catch (err) { setNotice(err.response?.data?.message || 'Could not send your question.'); } finally { setBusy(false); } };
  return <section style={{ display: 'grid', gap: 18 }}>
    <header><h2 style={{ margin: 0, color: '#0f172a' }}><MessageCircle size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />Questions to Admin</h2><p style={{ color: '#64748b' }}>Send a question about your account, application, or service listings and read admin replies here.</p></header>
    <form onSubmit={submit} style={{ display: 'grid', gap: 10, padding: 16, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12 }}>
      <label>Subject<input required maxLength={160} className="form-control" value={subject} onChange={e => setSubject(e.target.value)} /></label>
      <label>Your question<textarea required maxLength={5000} rows={4} className="form-control" value={question} onChange={e => setQuestion(e.target.value)} /></label>
      <button className="btn btn-primary" disabled={busy} style={{ justifySelf: 'start', display: 'inline-flex', alignItems: 'center', gap: 8 }}><Send size={15}/>{busy ? 'Sending…' : 'Send to Admin'}</button>
    </form>
    {notice && <div role="status" style={{ padding: 12, borderRadius: 8, background: '#eff6ff', color: '#1e40af' }}>{notice}</div>}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h3 style={{ margin: 0 }}>Your questions</h3><button className="btn btn-secondary" onClick={load}><RefreshCw size={14}/> Refresh</button></div>
    {loading ? <p>Loading questions…</p> : queries.length === 0 ? <p style={{ color: '#64748b' }}>You have not sent a question yet.</p> : queries.map(q => <article key={q.id} style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 12, background: 'white' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong>{q.subject}</strong><span>{q.status}</span></div><p style={{ whiteSpace: 'pre-wrap' }}>{q.question}</p>{q.adminReply ? <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 8 }}><strong>Admin reply</strong><p style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{q.adminReply}</p></div> : <small style={{ color: '#92400e' }}>Waiting for an admin reply</small>}</article>)}
  </section>;
}
