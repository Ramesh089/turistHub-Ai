import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SLIDES = [
  {
    title: 'Bharatanatyam – Tamil Nadu',
    subtitle: 'Classical Grace of South India',
    category: 'Tamil Nadu',
    description: 'A timeless classical dance form marked by expressive mudras, rich temple traditions, and elegant storytelling through rhythm and gesture.',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=85',
    link: '/explore?q=Tamil%20Nadu'
  },
  {
    title: 'Kathakali – Kerala',
    subtitle: 'Drama in Motion',
    category: 'Kerala',
    description: 'Theatrical grandeur, vivid costumes, and dramatic expressions come together in one of India’s most iconic classical art forms.',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=85',
    link: '/explore?q=Kerala'
  },
  {
    title: 'Odissi – Odisha',
    subtitle: 'Temple Tradition in Rhythm',
    category: 'Odisha',
    description: 'Graceful movements inspired by temple carvings and devotional storytelling, bringing spiritual energy to every step and pose.',
    image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&q=85',
    link: '/explore?q=Odisha'
  },
  {
    title: 'Manipuri – Manipur',
    subtitle: 'Softness, Devotion, and Beauty',
    category: 'Manipur',
    description: 'A lyrical and devotional dance tradition celebrated for its gentle grace, temple roots, and poetic movement vocabulary.',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=85',
    link: '/explore?q=Manipur'
  },
  {
    title: 'Kuchipudi – Andhra Pradesh',
    subtitle: 'Festive Energy',
    category: 'Andhra Pradesh',
    description: 'Known for its expressive performance style and lively rhythm, Kuchipudi blends spiritual depth with exuberant movement.',
    image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1600&q=85',
    link: '/explore?q=Andhra%20Pradesh'
  },
  {
    title: 'Ghoomar – Rajasthan',
    subtitle: 'Royal Folk Celebration',
    category: 'Rajasthan',
    description: 'Swirling circles, bright costumes, and festive drums transform the desert into a joyful celebration of royal heritage.',
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1600&q=85',
    link: '/explore?q=Rajasthan'
  },
  {
    title: 'Bhangra – Punjab',
    subtitle: 'Vibrant Beats of the North',
    category: 'Punjab',
    description: 'Energetic leaps, symbolic gestures, and loud drum rhythms bring the spirit of harvest, celebration, and community to life.',
    image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=1600&q=85',
    link: '/explore?q=Punjab'
  },
  {
    title: 'Garba – Gujarat',
    subtitle: 'Dance of Celebration',
    category: 'Gujarat',
    description: 'A circular folk dance pulsating with devotional energy, colorful costumes, and joyful community participation during Navratri.',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=85',
    link: '/explore?q=Gujarat'
  },
  {
    title: 'Yakshagana – Karnataka',
    subtitle: 'Mythic Storytelling',
    category: 'Karnataka',
    description: 'A dramatic dance-theatre tradition combining mythic storytelling, expressive dialogue, music, and vibrant costumes.',
    image: 'https://images.unsplash.com/photo-1580835845971-a393b73bf370?auto=format&fit=crop&w=1600&q=85',
    link: '/explore?q=Karnataka'
  },
  {
    title: 'Lavani – Maharashtra',
    subtitle: 'Rhythm & Celebration',
    category: 'Maharashtra',
    description: 'A lively folk dance with contemporary flair, known for its expressive storytelling, bold energy, and vibrant cultural spirit.',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=85',
    link: '/explore?q=Maharashtra'
  },
  {
    title: 'Bihu – Assam',
    subtitle: 'Spring Festival Dance',
    category: 'Assam',
    description: 'Joyful motions, bamboo flute music, and exuberant celebrations make Bihu one of Northeast India’s most beloved dance traditions.',
    image: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1600&q=85',
    link: '/explore?q=Assam'
  },
  {
    title: 'Chhau – West Bengal',
    subtitle: 'Warrior Elegance',
    category: 'West Bengal',
    description: 'A masked folk dance tradition blending martial movement, mythology, and expressive storytelling from Eastern India.',
    image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1600&q=85',
    link: '/explore?q=West%20Bengal'
  }
];

export default function CultureSlider() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  };

  const slide = SLIDES[current];

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: '22px', boxShadow: 'var(--shadow-lg)', background: '#0f172a' }}>
      <div style={{
        position: 'relative',
        minHeight: 'clamp(420px, 60vh, 520px)',
        width: '100%',
        backgroundImage: `linear-gradient(to top, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.5) 50%, rgba(15, 23, 42, 0.2) 100%), url(${slide.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'background-image 0.6s ease-in-out',
        display: 'flex',
        alignItems: 'flex-end',
        padding: 'clamp(20px, 5vw, 50px)'
      }}>
        <div style={{ maxWidth: '760px', color: '#ffffff', zIndex: 2 }} className="animate-fade-in" key={current}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(15, 118, 110, 0.85)',
            backdropFilter: 'blur(6px)',
            color: '#ffffff',
            padding: '5px 14px',
            borderRadius: '30px',
            fontSize: '0.76rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '10px',
            border: '1px solid rgba(255,255,255,0.15)'
          }}>
            <Sparkles size={14} /> {slide.category}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6ee7b7', fontSize: '0.88rem', fontWeight: '600', marginBottom: '6px' }}>
            <MapPin size={15} color="#6ee7b7" /> {slide.subtitle}
          </div>

          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.4rem, 4vw, 2.3rem)',
            fontWeight: '800',
            lineHeight: 1.2,
            marginBottom: '10px',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)'
          }}>
            {slide.title}
          </h2>

          <p style={{
            fontSize: 'clamp(0.88rem, 1.8vw, 1.02rem)',
            color: '#e2e8f0',
            lineHeight: 1.6,
            marginBottom: '18px',
            maxWidth: '650px'
          }}>
            {slide.description}
          </p>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/login', { state: { from: slide.link } });
              } else {
                navigate(slide.link);
              }
            }}
            className="btn btn-green"
            style={{ padding: '10px 22px', fontSize: '0.9rem', cursor: 'pointer' }}
          >
            Explore Cultural Story &rarr;
          </button>
        </div>

        <button
          onClick={prevSlide}
          style={{
            position: 'absolute',
            left: 'clamp(8px, 2vw, 20px)',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 'clamp(36px, 5vw, 46px)',
            height: 'clamp(36px, 5vw, 46px)',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(6px)',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s',
            zIndex: 10
          }}
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={nextSlide}
          style={{
            position: 'absolute',
            right: 'clamp(8px, 2vw, 20px)',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 'clamp(36px, 5vw, 46px)',
            height: 'clamp(36px, 5vw, 46px)',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(6px)',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s',
            zIndex: 10
          }}
        >
          <ChevronRight size={20} />
        </button>

        <div style={{
          position: 'absolute',
          bottom: '24px',
          right: '40px',
          display: 'flex',
          gap: '8px',
          zIndex: 10
        }}>
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              style={{
                width: current === idx ? '28px' : '9px',
                height: '9px',
                borderRadius: '5px',
                background: current === idx ? '#38bdf8' : 'rgba(255, 255, 255, 0.5)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
