import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { Phone, Home, Wrench, CalendarCheck, UserCircle, Images, Bot, X, MessageCircle, Send, Loader2 } from 'lucide-react';
import logoImg from '../assets/logo.png';
import api from '../services/api';
import '../pages/PublicPortal.css'; // S'assurer que les styles globaux du portal sont chargés

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
}
import '../pages/PublicPortal.css'; // S'assurer que les styles globaux du portal sont chargés

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const PublicLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('accueil');

  // F1 — Chatbot IA
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'bot', text: '👋 Bonjour ! Je suis l\'assistant Luxury Elegance Garage. Comment puis-je vous aider ?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // F1 — Scroll automatique vers le bas du chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    const history = chatMessages.slice(-6).map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await api.post('ai/chatbot/', { message: msg, history });
      setChatMessages(prev => [...prev, { role: 'bot', text: res.data.response }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'bot', text: 'Désolé, je rencontre un problème de connexion. Veuillez réessayer.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);

      // Mettre à jour l'état actif pour le bottom nav
      if (location.pathname === '/') {
        const sections = ['accueil', 'services', 'galerie', 'pourquoi', 'rdv'];
        let current = 'accueil';
        sections.forEach(id => {
          const el = document.getElementById(id);
          if (el && window.scrollY >= el.offsetTop - 120) current = id;
        });
        setActiveSection(current);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

  const handleNavClick = (anchor: string) => {
    if (location.pathname === '/') {
      const el = document.getElementById(anchor);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(anchor);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] font-inter overflow-x-hidden">

      {/* ─── DESKTOP NAVBAR ─── */}
      <nav className={`top-nav ${scrolled || location.pathname !== '/' ? 'scrolled' : ''}`}>
        <div className="logo-wrap cursor-pointer" onClick={() => handleNavClick('accueil')}>
          <img src={logoImg} alt="Luxury Élégance Garage" className="desktop-logo" />
        </div>
        <ul className="nav-links">
          <li><button onClick={() => handleNavClick('services')} className="bg-transparent border-none cursor-pointer">Services</button></li>
          <li><button onClick={() => handleNavClick('galerie')} className="bg-transparent border-none cursor-pointer">Galerie</button></li>
          <li><button onClick={() => handleNavClick('pourquoi')} className="bg-transparent border-none cursor-pointer">À propos</button></li>
          <li><button onClick={() => handleNavClick('rdv')} className="bg-transparent border-none cursor-pointer">Contact</button></li>
          <li>
            <Link 
              to="/espace-client" 
              className={`ml-4 px-3.5 py-1.5 rounded transition-all ${
                location.pathname === '/espace-client'
                  ? 'bg-slate-900 !text-white hover:bg-emerald-600 shadow-sm font-semibold'
                  : 'bg-[rgba(255,255,255,0.1)] text-white hover:bg-[var(--color-green4)] hover:text-[#111]'
              }`}
            >
              Espace Client
            </Link>
          </li>
        </ul>
        <button className="nav-rdv-btn flex items-center gap-2" onClick={() => handleNavClick('rdv')}>
          <CalendarCheck className="w-4 h-4" /> Prendre RDV
        </button>
      </nav>

      {/* ─── MOBILE TOP HEADER ─── */}
      <header className={`mobile-header ${scrolled || location.pathname !== '/' ? 'light' : ''}`}>
        <div className="mh-logo" onClick={() => handleNavClick('accueil')}>
          <img src={logoImg} alt="LEG Parakou" className="mobile-logo" />
        </div>
        <a href="tel:+2290192629860" className="mh-call flex items-center gap-2">
          <Phone className="w-3 h-3" /> Appeler
        </a>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main key={location.pathname} className={`page-transition-wrapper public-portal-body ${location.pathname !== '/' ? 'pt-20 md:pt-24' : ''}`}>
        <Outlet />
      </main>

      {/* ─── BOTTOM NAVIGATION BAR (Mobile Only) ─── */}
      <nav className="bottom-nav">
        <button 
          className={`bn-item ${location.pathname === '/' && activeSection === 'accueil' ? 'active' : ''}`}
          onClick={() => handleNavClick('accueil')}
        >
          <Home className="bn-icon w-5 h-5" />
          <span className="bn-label">Accueil</span>
        </button>
        <button 
          className={`bn-item ${location.pathname === '/' && activeSection === 'services' ? 'active' : ''}`}
          onClick={() => handleNavClick('services')}
        >
          <Wrench className="bn-icon w-5 h-5" />
          <span className="bn-label">Services</span>
        </button>
        
        {/* RDV Button - Centered & Highlighted */}
        <button 
          className="bn-item bn-rdv"
          onClick={() => handleNavClick('rdv')}
        >
          <CalendarCheck className="bn-icon w-6 h-6" />
          <span className="bn-label">RDV</span>
        </button>

        <button 
          className={`bn-item ${location.pathname === '/' && activeSection === 'galerie' ? 'active' : ''}`}
          onClick={() => handleNavClick('galerie')}
        >
          <Images className="bn-icon w-5 h-5" />
          <span className="bn-label">Galerie</span>
        </button>
        <Link 
          to="/espace-client"
          className={`bn-item ${location.pathname === '/espace-client' ? 'active' : ''}`}
        >
          <UserCircle className="bn-icon w-5 h-5" />
          <span className="bn-label">Client</span>
        </Link>
      </nav>

      {/* ─── FLOATING CALL BUTTON (Mobile) ─── */}
      <a href="tel:+2290192629860" className="fab-call" aria-label="Appeler le garage">
        <Phone className="w-5 h-5" />
      </a>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: 'linear-gradient(135deg, #2D7A47 0%, #1F5C35 60%, #174D2C 100%)' }} className="text-white">
        <div className="footer-top">
          <div>
            <img src={logoImg} alt="Luxury Elegance Garage" className="footer-logo" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25)) brightness(1.1)' }} />
            <p className="footer-desc">L'excellence automobile au cœur du Bénin. Rigueur, expertise et professionnalisme.</p>
          </div>
          <div className="footer-col">
            <h4>Services</h4>
            <ul>
              <li><button onClick={() => handleNavClick('services')} className="bg-transparent border-none p-0 cursor-pointer text-left">Mécanique</button></li>
              <li><button onClick={() => handleNavClick('services')} className="bg-transparent border-none p-0 cursor-pointer text-left">Électricité</button></li>
              <li><button onClick={() => handleNavClick('services')} className="bg-transparent border-none p-0 cursor-pointer text-left">Pneumatique</button></li>
              <li><button onClick={() => handleNavClick('services')} className="bg-transparent border-none p-0 cursor-pointer text-left">Lavage</button></li>
              <li><button onClick={() => handleNavClick('services')} className="bg-transparent border-none p-0 cursor-pointer text-left">Entretien</button></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Garage</h4>
            <ul>
              <li><button onClick={() => handleNavClick('pourquoi')} className="bg-transparent border-none p-0 cursor-pointer text-left">À propos</button></li>
              <li><button onClick={() => handleNavClick('galerie')} className="bg-transparent border-none p-0 cursor-pointer text-left">Galerie</button></li>
              <li><button onClick={() => handleNavClick('temoignages')} className="bg-transparent border-none p-0 cursor-pointer text-left">Avis clients</button></li>
              <li><button onClick={() => handleNavClick('rdv')} className="bg-transparent border-none p-0 cursor-pointer text-left">Rendez-vous</button></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Portail Staff</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <ul>
              <li><a href="https://maps.google.com/?q=Okedama+Parakou+Benin" target="_blank" rel="noreferrer">Okedama, Parakou</a></li>
              <li><a href="tel:+2290192629860">+229 01 92 62 98 60</a></li>
              <li><a href="mailto:k29296028@gmail.com">k29296028@gmail.com</a></li>
              <li className="mt-4"><a href="https://wa.me/2290192629860" className="text-[#25D366] font-semibold flex items-center gap-2"><WhatsAppIcon className="w-4 h-4" /> WhatsApp</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">© 2026 Luxury Élégance Garage de Parakou</span>
          <span className="footer-motto">Excellence · Confiance · Expertise</span>
        </div>
      </footer>

      {/* ══ F1 — CHATBOT IA FLOTTANT (Global) ══ */}
      <div className={`chatbot-fab-wrap ${location.pathname === '/espace-client' ? 'client-space-adjust' : ''}`}>
        {/* Fenêtre de chat */}
        {chatOpen && (
          <div className="chatbot-window">
            <div className="chatbot-header">
              <div className="chatbot-header-info">
                <div className="chatbot-avatar"><Bot size={16} /></div>
                <div>
                <div className="chatbot-name">Assistant Luxury Elegance Garage</div>
                  <div className="chatbot-status">● En ligne</div>
                </div>
              </div>
              <button className="chatbot-close" onClick={() => setChatOpen(false)}><X size={18} /></button>
            </div>

            <div className="chatbot-messages">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`chat-msg ${msg.role}`}>
                  {msg.role === 'bot' && <div className="chat-bot-av"><Bot size={13} /></div>}
                  <div className="chat-bubble">{msg.text}</div>
                </div>
              ))}
              {chatLoading && (
                <div className="chat-msg bot">
                  <div className="chat-bot-av"><Bot size={13} /></div>
                  <div className="chat-bubble chat-typing">
                    <Loader2 size={14} className="chat-spin" />
                    <span>En train d'écrire…</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="chatbot-suggestions">
              {['Quels sont vos horaires ?', 'Prendre un RDV', 'Vos services ?'].map(s => (
                <button key={s} className="chat-suggest" onClick={() => { setChatInput(s); }}>
                  {s}
                </button>
              ))}
            </div>

            <div className="chatbot-input-row">
              <input
                className="chatbot-input"
                placeholder="Posez votre question…"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                disabled={chatLoading}
              />
              <button className="chatbot-send" onClick={sendChat} disabled={chatLoading || !chatInput.trim()}>
                <Send size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Bouton flottant */}
        <button
          className={`chatbot-fab ${chatOpen ? 'open' : ''}`}
          onClick={() => setChatOpen(o => !o)}
          aria-label="Assistant virtuel"
        >
          {chatOpen ? <X size={22} /> : <MessageCircle size={22} />}
          {!chatOpen && <span className="chatbot-fab-badge">IA</span>}
        </button>
      </div>

    </div>
  );
};

export default PublicLayout;
