import { useState, useEffect } from 'react';
import {
  collection, addDoc, onSnapshot,
  orderBy, query, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const COLORS = [
  { bg: '#1a0533', accent: '#c084fc', text: '#f3e8ff' },
  { bg: '#0c1a3a', accent: '#60a5fa', text: '#eff6ff' },
  { bg: '#0f2d1a', accent: '#4ade80', text: '#f0fdf4' },
  { bg: '#2d1a0f', accent: '#fb923c', text: '#fff7ed' },
  { bg: '#2d0f1a', accent: '#f472b6', text: '#fdf2f8' },
  { bg: '#1a1a0f', accent: '#facc15', text: '#fefce8' },
  { bg: '#0f1a2d', accent: '#34d399', text: '#ecfdf5' },
  { bg: '#1f0a0a', accent: '#f87171', text: '#fef2f2' },
];

function Star({ top, left, size, delay, dur }) {
  return (
    <div style={{
      position: 'absolute', borderRadius: '50%', background: 'white',
      top, left, width: size, height: size,
      animation: `twinkle ${dur}s ease-in-out ${delay}s infinite`,
      pointerEvents: 'none',
    }} />
  );
}

function WishCard({ wish, index }) {
  const c = COLORS[index % COLORS.length];
  const [hov, setHov] = useState(false);
  const date = wish.createdAt?.toDate
    ? wish.createdAt.toDate().toLocaleDateString('fr-HT', {
        day: '2-digit', month: 'short', year: '2-digit',
      })
    : '—';
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: c.bg, border: `1.5px solid ${c.accent}33`,
        borderRadius: 16, padding: 20,
        breakInside: 'avoid', marginBottom: 16,
        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hov ? 'translateY(-6px) scale(1.02)' : 'none',
        boxShadow: hov
          ? `0 20px 40px ${c.accent}44,0 0 0 1px ${c.accent}66`
          : '0 4px 20px rgba(0,0,0,.4)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 80, height: 80, borderRadius: '50%',
        background: `radial-gradient(circle,${c.accent}22,transparent)`,
        pointerEvents: 'none',
      }} />
      <div style={{ fontSize: 20, marginBottom: 10 }}>✨</div>
      <p style={{
        color: c.text, fontFamily: "'Lora',Georgia,serif",
        fontSize: 14, lineHeight: 1.7, margin: '0 0 14px', fontStyle: 'italic',
      }}>
        "{wish.text}"
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: c.accent, fontFamily: "'Space Mono',monospace", fontSize: 11, fontWeight: 'bold' }}>
          — {wish.author || 'Anonyme'}
        </span>
        <span style={{ color: `${c.text}66`, fontSize: 10, fontFamily: "'Space Mono',monospace" }}>
          {date}
        </span>
      </div>
    </div>
  );
}

export default function App() {
  const [wishes, setWishes]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [wishText, setWishText]         = useState('');
  const [author, setAuthor]             = useState('');
  const [posting, setPosting]           = useState(false);
  const [error, setError]               = useState('');
  const [successFlash, setSuccessFlash] = useState(false);
  const [stars] = useState(() =>
    Array.from({ length: 70 }, (_, i) => ({
      id: i,
      top:   `${Math.random() * 100}%`,
      left:  `${Math.random() * 100}%`,
      size:  `${Math.random() * 2 + 1}px`,
      delay: Math.random() * 4,
      dur:   Math.random() * 3 + 2,
    }))
  );

  useEffect(() => {
    const q = query(collection(db, 'wishes'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setWishes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const handlePost = async () => {
    if (!wishText.trim()) { setError('Écris ton vœu d\'abord ✨'); return; }
    setPosting(true);
    try {
      await addDoc(collection(db, 'wishes'), {
        text:      wishText.trim(),
        author:    author.trim() || null,
        createdAt: serverTimestamp(),
      });
      setWishText(''); setAuthor(''); setError('');
      setShowForm(false);
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 3000);
    } catch {
      setError('Erreur réseau — réessaie.');
    }
    setPosting(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Lora:ital,wght@0,400;1,400&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes twinkle { 0%,100%{opacity:.2;transform:scale(1)} 50%{opacity:.9;transform:scale(1.5)} }
        @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes pop     { 0%{transform:translateX(-50%) scale(.8);opacity:0} 100%{transform:translateX(-50%) scale(1);opacity:1} }
        textarea:focus, input:focus { outline: none; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 20% 20%, #1a0533 0%, #0a0a12 40%, #000510 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {stars.map(s => <Star key={s.id} {...s} />)}

        {successFlash && (
          <div style={{
            position: 'fixed', top: 24, left: '50%',
            background: 'linear-gradient(135deg,#7c3aed,#c026d3)',
            color: 'white', padding: '12px 28px', borderRadius: 50,
            fontFamily: "'Space Mono',monospace", fontSize: 13,
            boxShadow: '0 8px 30px #7c3aed88', zIndex: 200,
            animation: 'pop .4s ease both', whiteSpace: 'nowrap',
          }}>
            ✨ Vœu posté !
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '60px 20px 40px', animation: 'fadeUp .8s ease both' }}>
          <div style={{ fontSize: 50, marginBottom: 4, animation: 'float 4s ease-in-out infinite', display: 'inline-block' }}>
            🌠
          </div>
          <div style={{ color: '#c084fc', fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: '.2em', marginBottom: 12 }}>
            TK DESIGN
          </div>
          <h1 style={{
            fontFamily: "'Cinzel',serif", fontSize: 'clamp(28px,6vw,52px)', fontWeight: 700,
            background: 'linear-gradient(135deg,#c084fc,#818cf8,#c084fc)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            animation: 'shimmer 4s linear infinite',
            margin: '0 0 10px', letterSpacing: '.05em',
          }}>
            Make a Wish
          </h1>
          <p style={{ color: '#a78bfa99', fontFamily: "'Lora',serif", fontStyle: 'italic', fontSize: 15, margin: '0 0 32px' }}>
            Pose ton vœu. Le ciel t'écoute.
          </p>
          <button
            onClick={() => { setShowForm(!showForm); setError(''); }}
            style={{
              background: showForm ? 'transparent' : 'linear-gradient(135deg,#7c3aed,#c026d3)',
              border: showForm ? '1px solid #7c3aed' : 'none',
              color: 'white', padding: '14px 32px', borderRadius: 50,
              fontFamily: "'Cinzel',serif", fontSize: 14, letterSpacing: '.1em',
              cursor: 'pointer', boxShadow: showForm ? 'none' : '0 4px 30px #7c3aed55',
              transition: 'all .3s ease',
            }}
          >
            {showForm ? '✕ Annuler' : '✨ Poster un vœu'}
          </button>
        </div>

        {showForm && (
          <div style={{ maxWidth: 520, margin: '0 auto 40px', padding: '0 20px', animation: 'fadeUp .4s ease both' }}>
            <div style={{ background: '#0d0d1a', border: '1px solid #7c3aed44', borderRadius: 20, padding: 28, boxShadow: '0 0 40px #7c3aed22' }}>
              <textarea
                value={wishText}
                onChange={e => setWishText(e.target.value)}
                placeholder="Quel est ton vœu ? Tout est permis..."
                maxLength={300} rows={4}
                style={{
                  width: '100%', background: '#0a0a14', border: '1px solid #374151',
                  borderRadius: 12, padding: '14px 16px', color: '#f3e8ff',
                  fontFamily: "'Lora',serif", fontStyle: 'italic', fontSize: 15,
                  resize: 'none', lineHeight: 1.7, marginBottom: 12, display: 'block',
                }}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e  => e.target.style.borderColor = '#374151'}
              />
              <input
                value={author}
                onChange={e => setAuthor(e.target.value)}
                placeholder="Ton prénom (optionnel)"
                maxLength={30}
                style={{
                  width: '100%', background: '#0a0a14', border: '1px solid #374151',
                  borderRadius: 10, padding: '11px 16px', color: '#f3e8ff',
                  fontFamily: "'Space Mono',monospace", fontSize: 13,
                  marginBottom: 16, display: 'block',
                }}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e  => e.target.style.borderColor = '#374151'}
              />
              {error && <p style={{ color: '#f87171', fontSize: 12, fontFamily: 'monospace', marginBottom: 12, textAlign: 'center' }}>{error}</p>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280', fontSize: 11, fontFamily: 'monospace' }}>{wishText.length}/300</span>
                <button
                  onClick={handlePost} disabled={posting}
                  style={{
                    background: posting ? '#4b5563' : 'linear-gradient(135deg,#7c3aed,#c026d3)',
                    border: 'none', color: 'white', padding: '11px 28px',
                    borderRadius: 50, fontFamily: "'Space Mono',monospace",
                    fontSize: 12, fontWeight: 'bold', cursor: posting ? 'default' : 'pointer',
                    boxShadow: '0 4px 20px #7c3aed44',
                  }}
                >
                  {posting ? '⏳ Envoi...' : 'Poster ✨'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: 32, color: '#6b7280', fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: '.1em' }}>
          {loading ? '...' : wishes.length === 0 ? 'Sois le premier à poster un vœu ✨' : `${wishes.length} vœu${wishes.length > 1 ? 'x' : ''} posté${wishes.length > 1 ? 's' : ''}`}
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 80px', columns: 'clamp(270px,30%,340px)', columnGap: 16 }}>
          {!loading && wishes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#2d2d3a', fontFamily: "'Lora',serif", fontStyle: 'italic', fontSize: 16 }}>
              Le ciel attend tes vœux...
            </div>
          )}
          {wishes.map((w, i) => <WishCard key={w.id} wish={w} index={i} />)}
        </div>
      </div>
    </>
  );
}
