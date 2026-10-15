import { useState } from 'react';
import SocialDirectory from './SocialDirectory';
import useContent from '../hooks/useContent';
import { apiService } from '../services/apiService';

export default function Contact() {
  const { content: profile } = useContent('profile');
  const [status, setStatus] = useState({ kind: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setStatus({ kind: '', message: '' });
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    try {
      await apiService.messages.submit(values);
      setStatus({ kind: 'success', message: 'Your message was submitted successfully.' });
      form.reset();
    } catch (error) {
      setStatus({ kind: 'error', message: `${error.message} You can contact me directly by email instead.` });
    } finally {
      setSubmitting(false);
    }
  };
  const phone = profile.phone || '';
  return <section id="contact" className="py-6 bg-blush"><div className="container"><div className="row g-5"><div className="col-lg-5"><p className="eyebrow"><span /> Say hello</p><h2 className="display-5 serif-title">Let&apos;s make room<br />for a <em>good idea.</em></h2><p className="text-secondary mt-4">I&apos;m open to conversations, creative collaborations, and opportunities to keep learning.</p><div className="contact-details mt-4">{profile.email && <a href={`mailto:${profile.email}`}><small>Email</small>{profile.email}</a>}{phone && <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}><small>Phone</small>{phone}</a>}</div><SocialDirectory /></div><div className="col-lg-6 ms-auto"><form className="bg-white rounded-4 shadow-sm p-4 p-lg-5" onSubmit={handleSubmit}><p className="small text-secondary">Contact form preview. Messages are only sent when a backend endpoint is configured.</p><div className="mb-3"><label className="form-label" htmlFor="contact-name">Your name</label><input className="form-control" id="contact-name" name="name" required autoComplete="name" placeholder="e.g. Amina" /></div><div className="mb-3"><label className="form-label" htmlFor="contact-email">Your email</label><input className="form-control" id="contact-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" /></div><div className="mb-3"><label className="form-label" htmlFor="contact-subject">Subject</label><input className="form-control" id="contact-subject" name="subject" required maxLength="120" placeholder="What would you like to discuss?" /></div><div className="mb-4"><label className="form-label" htmlFor="contact-message">Your message</label><textarea className="form-control" id="contact-message" name="message" rows="4" required maxLength="5000" placeholder="Tell me a little about your idea..." /></div><button className="btn btn-primary px-4" type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Send message'} <i className="bi bi-arrow-up-right ms-2" aria-hidden="true" /></button>{status.message && <div className={`alert ${status.kind === 'success' ? 'alert-success' : 'alert-warning'} mt-3 mb-0`} role={status.kind === 'error' ? 'alert' : 'status'}>{status.message}</div>}</form></div></div></div></section>;
}
