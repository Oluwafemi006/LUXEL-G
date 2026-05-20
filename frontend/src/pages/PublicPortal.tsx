import React, { useState, useEffect, useRef } from 'react';
import {
  Wrench,
  Bolt, /* Électricité */
  CircleDot, /* Pneus */
  Droplets, /* Lavage */
  Settings, /* Entretien */
  Phone,
  CalendarCheck,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Award,
  Search,
  Clock,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import './PublicPortal.css';
import hero1 from '../assets/garage_images/hero/hero_1.jpg';
import hero2 from '../assets/garage_images/hero/hero_2.jpg';
import galerie1 from '../assets/garage_images/galeries/galerie_1.jpg';


const SERVICES = [
  { id: 'mec', icon: Wrench, title: 'Mécanique Générale', desc: 'Diagnostic, réparation et maintenance de tous types de véhicules. Moteur, transmission, suspension.' },
  { id: 'elec', icon: Bolt, title: 'Électricité Auto', desc: 'Diagnostic électronique avancé, câblage, batterie, alternateur, démarreur.' },
  { id: 'pneu', icon: CircleDot, title: 'Pneumatique', desc: 'Montage, équilibrage, permutation et réparation de pneumatiques.' },
  { id: 'lav', icon: Droplets, title: 'Lavage Complet', desc: 'Nettoyage intérieur et extérieur, lavage moteur, aspiration, traitement surfaces.' },
  { id: 'ent', icon: Settings, title: 'Entretien Général', desc: 'Vidange, filtres, bougies, freins, liquides — entretien complet du véhicule.' },
];

const TESTIMONIALS = [
  { stars: '★★★★★', text: "Un service irréprochable. Mon véhicule pris en charge avec un professionnalisme remarquable. Je recommande vivement.", author: 'Abdoul Karim', detail: 'Toyota RAV4', av: 'AK' },
  { stars: '★★★★★', text: "L'adresse qu'il faut à Parakou. Rapidité, qualité et transparence. Une équipe vraiment au top niveau.", author: 'Mireille Badou', detail: 'Mercedes', av: 'MB' },
  { stars: '★★★★★', text: "Diagnostic a résolu un problème que d'autres garages n'arrivaient pas à identifier. Du vrai travail sérieux.", author: 'Roland Sagbo', detail: 'Honda CR-V', av: 'RS' },
  { stars: '★★★★★', text: "Lavage complet parfait, voiture rendue comme neuve. Accueil chaleureux et service rapide. Mon garage de confiance.", author: 'Fatima Kone', detail: 'Hyundai i10', av: 'FK' },
  { stars: '★★★★★', text: "Pneus changés en moins d'une heure avec équilibrage parfait. Très satisfait de la prestation.", author: 'Augustin Dossou', detail: 'Suzuki Swift', av: 'AD' },
  { stars: '★★★★★', text: "Entretien réalisé avec sérieux. Ils expliquent chaque intervention. C'est rare et ça se respecte.", author: 'Pierre Soulé', detail: 'Peugeot 308', av: 'PS' },
];

const PublicPortal: React.FC = () => {
  // ─── STATE ───
  const [hIdx, setHIdx] = useState(0);
  const [gIdx, setGIdx] = useState(0);
  const [tIdx, setTIdx] = useState(0);
  const [bookingData, setBookingData] = useState({ nom: '', telephone: '', vehicule: '', service: '', date: '', heure: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // ─── REFS ───
  const hTrackRef = useRef<HTMLDivElement>(null);
  const gTrackRef = useRef<HTMLDivElement>(null);
  const tTrackRef = useRef<HTMLDivElement>(null);

  // ─── HERO CAROUSEL ───
  useEffect(() => {
    const timer = setInterval(() => setHIdx(p => (p + 1) % 3), 5500);
    return () => clearInterval(timer);
  }, []);

  // ─── TESTIMONIALS CAROUSEL ───
  useEffect(() => {
    const timer = setInterval(() => setTIdx(p => (p + 1) % 2), 6500);
    return () => clearInterval(timer);
  }, []);

  // ─── SCROLL REVEAL ───
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });

    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // ─── HANDLERS ───
  const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const hNext = () => setHIdx(p => (p + 1) % 3);
  const hPrev = () => setHIdx(p => (p - 1 + 3) % 3);

  const gTotal = 6;
  // Approximation simple pour la galerie, sur mobile on voit 1 par 1, sur desktop 3
  const gNext = () => setGIdx(p => (p + 1) % gTotal);
  const gPrev = () => setGIdx(p => (p - 1 + gTotal) % gTotal);

  const submitRDV = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        nom_client_public: bookingData.nom,
        telephone_client_public: bookingData.telephone,
        vehicule_client_public: bookingData.vehicule,
        service_demande: bookingData.service,
        date_rdv: `${bookingData.date}T${bookingData.heure.split(' ')[0] || '08'}:00Z`,
        notes: bookingData.notes
      };
      await api.post('appointments/', payload);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4500);
      setBookingData({ nom: '', telephone: '', vehicule: '', service: '', date: '', heure: '', notes: '' });
    } catch {
      alert('Erreur lors de la réservation. Veuillez réessayer ou nous appeler.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* ══ HERO CAROUSEL ══ */}
      <section className="hero" id="accueil">
        <div className="hero-track" ref={hTrackRef} style={{ transform: `translateX(-${(hIdx * 100) / 3}%)` }}>
          
          <div className={`hero-slide ${hIdx === 0 ? 'active' : ''}`}>
            <div className="hs-img">
              <img src={hero1} alt="Atelier mécanique" loading="eager" />
            </div>
            <div className="hs-content">
              <div>
                <div className="hs-tag">Garage Auto · Parakou</div>
                <h2>VOTRE VÉHICULE<br/>ENTRE <span>BONNES</span><br/>MAINS.</h2>
                <p>Expertise, rigueur et professionnalisme depuis plus de 10 ans.</p>
                <div className="hero-ctas">
                  <button className="btn-white" onClick={() => goTo('rdv')}><CalendarCheck className="w-4 h-4 mr-2 inline" />Réserver maintenant</button>
                  <button className="btn-ghost" onClick={() => goTo('services')}>Nos services <ArrowRight className="w-4 h-4 ml-2 inline" /></button>
                </div>
              </div>
            </div>
          </div>

          <div className={`hero-slide ${hIdx === 1 ? 'active' : ''}`}>
            <div className="hs-img">
              <img src={hero2} alt="Technicien" loading="lazy" />
            </div>
            <div className="hs-content">
              <div>
                <div className="hs-tag">Mécanique & Électricité</div>
                <h2>TECHNICIENS<br/><span>QUALIFIÉS</span><br/>& FORMÉS.</h2>
                <p>Du diagnostic à la réparation, chaque intervention réalisée avec précision.</p>
                <div className="hero-ctas">
                  <button className="btn-white" onClick={() => goTo('services')}><Wrench className="w-4 h-4 mr-2 inline" />Découvrir nos services</button>
                  <button className="btn-ghost" onClick={() => goTo('rdv')}>Nous contacter <ArrowRight className="w-4 h-4 ml-2 inline" /></button>
                </div>
              </div>
            </div>
          </div>

          <div className={`hero-slide ${hIdx === 2 ? 'active' : ''}`}>
            <div className="hs-img">
              <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80" alt="Entretien" loading="lazy" />
            </div>
            <div className="hs-content">
              <div>
                <div className="hs-tag">Entretien & Lavage</div>
                <h2>PROPRE,<br/>RÉVISÉ,<br/><span>PRÊT.</span></h2>
                <p>Lavage complet, entretien général, pneumatique — tout sous un même toit.</p>
                <div className="hero-ctas">
                  <button className="btn-white" onClick={() => goTo('rdv')}><CalendarCheck className="w-4 h-4 mr-2 inline" />Réserver maintenant</button>
                  <button className="btn-ghost" onClick={() => goTo('galerie')}>Voir la galerie <ArrowRight className="w-4 h-4 ml-2 inline" /></button>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="hero-controls">
          <div className="hero-dots">
            {[0, 1, 2].map(i => (
              <button key={i} className={`h-dot ${hIdx === i ? 'active' : ''}`} onClick={() => setHIdx(i)} />
            ))}
          </div>
          <div className="hero-arrows">
            <button className="h-arrow" onClick={hPrev}><ArrowLeft className="w-4 h-4" /></button>
            <button className="h-arrow" onClick={hNext}><ArrowRight className="w-4 h-4" /></button>
          </div>
        </div>
      </section>

      {/* ══ QUICK ACTIONS (mobile) ══ */}
      <div className="quick-actions">
        <div className="qa-grid">
          <a href="tel:+2290192629860" className="qa-btn">
            <Phone className="w-5 h-5 mb-1" />
            <span>Appeler</span>
          </a>
          <button className="qa-btn qa-rdv" onClick={() => goTo('rdv')}>
            <CalendarCheck className="w-5 h-5 mb-1" />
            <span>Prendre RDV</span>
          </button>
          <a href="https://maps.google.com/?q=Okedama+Parakou+Benin" target="_blank" rel="noreferrer" className="qa-btn">
            <MapPin className="w-5 h-5 mb-1" />
            <span>Itinéraire</span>
          </a>
        </div>
      </div>

      {/* ══ STATS ══ */}
      <div className="stats">
        <div className="stat-item reveal"><div className="stat-num">500+</div><div className="stat-lbl">Clients satisfaits</div></div>
        <div className="stat-item reveal rd1"><div className="stat-num">10+</div><div className="stat-lbl">Ans d'expertise</div></div>
        <div className="stat-item reveal rd2"><div className="stat-num">98%</div><div className="stat-lbl">Satisfaction</div></div>
        {/* Stat ajustée pour être plus honnête (au lieu de 24h) */}
        <div className="stat-item reveal rd3"><div className="stat-num">100%</div><div className="stat-lbl">Transparence</div></div>
      </div>

      {/* ══ SERVICES ══ */}
      <section className="section section-white" id="services">
        <div className="svc-header">
          <div className="reveal">
            <div className="sec-eyebrow">Ce que nous faisons</div>
            <h2 className="sec-title">NOS <span>SERVICES</span></h2>
          </div>
          <p className="svc-intro reveal rd2">Chaque prestation réalisée par des techniciens qualifiés, avec le matériel adapté et un diagnostic précis.</p>
        </div>
        
        <div className="svc-grid-wrap">
          <div className="svc-grid">
            {SERVICES.map((s, i) => (
              <div key={s.id} className={`svc-card reveal rd${i % 4}`}>
                <div className="svc-icon-w"><s.icon /></div>
                <div className="svc-name">{s.title}</div>
                <p className="svc-desc">{s.desc}</p>
              </div>
            ))}
            <div className="svc-card svc-card-cta reveal rd5" onClick={() => goTo('rdv')}>
              <div>
                <div className="svc-icon-w"><CalendarCheck /></div>
                <div className="svc-name">Prendre Rendez-vous</div>
                <p className="svc-desc">Réservez votre créneau en quelques instants. Nous vous contactons rapidement.</p>
              </div>
              <button className="cta-arrow">Réserver <ArrowRight /></button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ GALERIE ══ */}
      <section className="section section-pale" id="galerie">
        <div className="reveal" style={{ marginBottom: '2rem' }}>
          <div className="sec-eyebrow">Notre espace</div>
          <h2 className="sec-title">LE GARAGE EN <span>IMAGES</span></h2>
        </div>

        <div className="gallery-outer reveal">
          <div 
            className="gallery-track" 
            ref={gTrackRef}
            style={{ 
              transform: `translateX(-${gIdx * (window.innerWidth < 768 ? 85 : 33.33)}%)`,
              // L'ajustement exact du translateX en react nécessiterait un hook ResizeObserver complet.
              // Ici on fait simple: la classe CSS gère le layout flex, on scrolle via transform.
              // Sur mobile (min-width 80vw), sur desktop (min-width 33.33%)
            }}
          >
            {[
              { src: galerie1, lbl: "Atelier principal" },
              { src: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80", lbl: "Mécanique" },
              { src: "https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=600&q=80", lbl: "Techniciens" },
              { src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", lbl: "Entretien" },
              { src: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=600&q=80", lbl: "Lavage complet" },
              { src: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&q=80", lbl: "Pneumatique" }
            ].map((img, i) => (
              <div key={i} className="gallery-item">
                <img src={img.src} alt={img.lbl} loading="lazy" />
                <div className="gallery-item-overlay"><span className="gallery-item-label">{img.lbl}</span></div>
              </div>
            ))}
          </div>
          
          <div className="gallery-nav">
            <div className="g-dots">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <button key={i} className={`g-dot ${gIdx === i ? 'active' : ''}`} onClick={() => setGIdx(i)} />
              ))}
            </div>
            <div className="g-arrows">
              <button className="g-arrow" onClick={gPrev}><ArrowLeft /></button>
              <button className="g-arrow" onClick={gNext}><ArrowRight /></button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ POURQUOI NOUS ══ */}
      <section className="section section-white" id="pourquoi">
        <div className="why-grid">
          <div className="why-img-wrap reveal">
            <img className="why-img" src="https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=800&q=80" alt="Équipe garage" loading="lazy" />
            <div className="why-badge">
              <div className="why-badge-n">10+</div>
              <div className="why-badge-l">Ans d'expérience</div>
            </div>
          </div>
          <div>
            <div className="reveal">
              <div className="sec-eyebrow">Notre engagement</div>
              <h2 className="sec-title">POURQUOI NOUS <span>CHOISIR</span> ?</h2>
            </div>
            <div className="why-points">
              <div className="why-point reveal rd1">
                <div className="why-icon"><Award /></div>
                <div>
                  <div className="why-point-title">Expertise certifiée</div>
                  <p className="why-point-desc">Techniciens formés, capables d'intervenir sur tous types de véhicules avec précision.</p>
                </div>
              </div>
              <div className="why-point reveal rd2">
                <div className="why-icon"><Search /></div>
                <div>
                  <div className="why-point-title">Transparence totale</div>
                  <p className="why-point-desc">Diagnostic clair avant toute intervention. Aucune surprise sur la facture.</p>
                </div>
              </div>
              <div className="why-point reveal rd3">
                <div className="why-icon"><Clock /></div>
                <div>
                  <div className="why-point-title">Délais respectés</div>
                  <p className="why-point-desc">Chaque intervention planifiée dans les délais convenus, sans compromis sur la qualité.</p>
                </div>
              </div>
              <div className="why-point reveal rd4">
                <div className="why-icon"><UserCheck /></div>
                <div>
                  <div className="why-point-title">Service personnalisé</div>
                  <p className="why-point-desc">Nous adaptons notre service à vos besoins avec un suivi client attentif.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TÉMOIGNAGES ══ */}
      <section className="section section-pale" id="temoignages">
        <div className="reveal" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="sec-eyebrow" style={{ justifyContent: 'center' }}>Ils nous font confiance</div>
          <h2 className="sec-title">AVIS DE NOS <span>CLIENTS</span></h2>
        </div>
        <div className="testi-wrap reveal">
          <div className="testi-track" ref={tTrackRef} style={{ transform: `translateX(-${tIdx * 100}%)` }}>
            
            {/* Slide 1 */}
            <div className="testi-slide">
              {TESTIMONIALS.slice(0, 3).map((t, i) => (
                <div key={i} className="testi-card">
                  <div className="testi-stars">{t.stars}</div>
                  <p className="testi-text">{t.text}</p>
                  <div className="testi-author">
                    <div className="testi-av">
                      {/* Avatar placeholder, ideally real photos */}
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt={t.author} />
                    </div>
                    <div><div className="author-name">{t.author}</div><div className="author-detail">{t.detail}</div></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Slide 2 */}
            <div className="testi-slide">
              {TESTIMONIALS.slice(3, 6).map((t, i) => (
                <div key={i} className="testi-card">
                  <div className="testi-stars">{t.stars}</div>
                  <p className="testi-text">{t.text}</p>
                  <div className="testi-author">
                    <div className="testi-av">
                      <img src={`https://i.pravatar.cc/100?img=${i+20}`} alt={t.author} />
                    </div>
                    <div><div className="author-name">{t.author}</div><div className="author-detail">{t.detail}</div></div>
                  </div>
                </div>
              ))}
            </div>

          </div>
          <div className="testi-nav">
            <button className={`t-dot ${tIdx === 0 ? 'active' : ''}`} onClick={() => setTIdx(0)} />
            <button className={`t-dot ${tIdx === 1 ? 'active' : ''}`} onClick={() => setTIdx(1)} />
          </div>
        </div>
      </section>

      {/* ══ RDV + CONTACT ══ */}
      <div className="rdv-grid" id="rdv">
        <div className="rdv-left">
          <div className="reveal">
            <div className="sec-eyebrow">Nous trouver</div>
            <h2 className="sec-title">CONTACTEZ<br/>NOTRE <span>ÉQUIPE</span></h2>
          </div>
          <div className="rdv-contact reveal rd1">
            <div className="rdv-ci">
              <div className="rdv-ci-icon"><MapPin /></div>
              <div>
                <div className="rdv-ci-label">Adresse</div>
                <div className="rdv-ci-val">Quartier Okedama, Von Hôpital Ahmadiyya<br/>Parakou, Bénin</div>
                <a href="https://maps.google.com/?q=Okedama+Parakou+Benin" target="_blank" rel="noreferrer" className="map-link"><MapPin /> Voir sur Google Maps</a>
              </div>
            </div>
            <div className="rdv-ci">
              <div className="rdv-ci-icon"><Phone /></div>
              <div>
                <div className="rdv-ci-label">Téléphone</div>
                <div className="rdv-ci-val"><a href="tel:+2290192629860">+229 01 92 62 98 60</a></div>
              </div>
            </div>
            <div className="rdv-ci">
              <div className="rdv-ci-icon"><CalendarCheck /></div>
              <div>
                <div className="rdv-ci-label">Horaires</div>
                <div className="rdv-ci-val">Lun – Ven · 08h00 – 18h30<br/>Samedi · 09h00 – 14h00</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rdv-right reveal">
          <div className="sec-eyebrow">Réservation</div>
          <h3>PRENDRE RENDEZ-VOUS</h3>
          <p className="rdv-sub">Remplissez le formulaire, notre équipe vous contacte sous 24h.</p>
          
          <form onSubmit={submitRDV} className="form-grid">
            <div className="fg">
              <label>Prénom & Nom</label>
              <input type="text" placeholder="Votre nom complet" required value={bookingData.nom} onChange={e => setBookingData({...bookingData, nom: e.target.value})} />
            </div>
            <div className="fg">
              <label>Téléphone</label>
              <input type="tel" placeholder="+229 …" required value={bookingData.telephone} onChange={e => setBookingData({...bookingData, telephone: e.target.value})} />
            </div>
            <div className="fg">
              <label>Véhicule</label>
              <input type="text" placeholder="Ex: Toyota Corolla" required value={bookingData.vehicule} onChange={e => setBookingData({...bookingData, vehicule: e.target.value})} />
            </div>
            <div className="fg">
              <label>Prestation</label>
              <select required value={bookingData.service} onChange={e => setBookingData({...bookingData, service: e.target.value})}>
                <option value="">Sélectionner…</option>
                <option value="Mécanique générale">Mécanique générale</option>
                <option value="Électricité auto">Électricité auto</option>
                <option value="Pneumatique">Pneumatique</option>
                <option value="Lavage complet">Lavage complet</option>
                <option value="Entretien général">Entretien général</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div className="fg">
              <label>Date souhaitée</label>
              <input type="date" required value={bookingData.date} onChange={e => setBookingData({...bookingData, date: e.target.value})} />
            </div>
            <div className="fg">
              <label>Créneau horaire</label>
              <select value={bookingData.heure} onChange={e => setBookingData({...bookingData, heure: e.target.value})}>
                <option value="">Sélectionner…</option>
                <option value="08:00">08h00 – 10h00</option>
                <option value="10:00">10h00 – 12h00</option>
                <option value="12:00">12h00 – 14h00</option>
                <option value="14:00">14h00 – 16h00</option>
                <option value="16:00">16h00 – 18h30</option>
              </select>
            </div>
            <div className="fg full">
              <label>Description (optionnel)</label>
              <textarea placeholder="Décrivez brièvement le problème…" value={bookingData.notes} onChange={e => setBookingData({...bookingData, notes: e.target.value})} />
            </div>
            <div className="fg full">
              <button type="submit" disabled={isSubmitting} className="btn-submit">
                <CalendarCheck /> {isSubmitting ? 'Traitement…' : 'Confirmer le Rendez-vous'}
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* ══ TOAST ══ */}
      <div className={`toast ${showToast ? 'show' : ''}`}>
        <CheckCircle2 />
        Rendez-vous enregistré ! Nous vous contacterons sous peu.
      </div>
    </>
  );
};

export default PublicPortal;
