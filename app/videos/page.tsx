'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, ExternalLink, Landmark, PlayCircle } from 'lucide-react'
import { ThemeToggle } from '@/components/shell/ThemeToggle'

const PLAYLISTS = [
  {
    id: 'PLUiQ2wy2F2cOjqR0lEDJ7wvVt3Ki_L95z',
    title: 'Éducation financière',
  },
  {
    id: 'PLUiQ2wy2F2cMUh_XOCxWqCl3XoNrhfmAq',
    title: 'Stabilité des prix',
  },
  {
    id: 'PLUiQ2wy2F2cO-BDcTD68lAgcyD14GjbVT',
    title: 'Missions de BAM',
  },
]

const VIDEOS = [
  {
    id: 'nrg-FWQ-Cdg',
    title: "Global Money Week : Différence entre le taux directeur, le taux d'intérêt et le taux de change",
    duration: '3:34',
    language: 'Français',
    playlistTitle: 'Éducation financière',
    watchUrl: 'https://www.youtube.com/watch?v=nrg-FWQ-Cdg',
  },
  {
    id: 'uig1eWzEvuY',
    title: 'أيام الثقافة المالية: ما الفرق بين سعر الفائدة، سعر الفائدة الرئيسي و سعر الصرف ؟',
    duration: '3:34',
    language: 'العربية',
    playlistTitle: 'Éducation financière',
    watchUrl: 'https://www.youtube.com/watch?v=uig1eWzEvuY',
  },
  {
    id: 'U1CnKB1jdpA',
    title: "Qu'est ce que la monnaie?",
    duration: '2:16',
    language: 'Français',
    playlistTitle: 'Éducation financière',
    watchUrl: 'https://www.youtube.com/watch?v=U1CnKB1jdpA',
  },
  {
    id: '0unQAPLO730',
    title: 'Quel est le rôle du réseau de Bank Al-Maghrib ?',
    duration: '6:12',
    language: 'Français',
    playlistTitle: 'Éducation financière',
    watchUrl: 'https://www.youtube.com/watch?v=0unQAPLO730',
  },
  {
    id: 'HjyRQg0W_dI',
    title: "Qu'est ce que la stabilité des prix?",
    language: 'Français',
    playlistTitle: 'Stabilité des prix',
    watchUrl: 'https://www.youtube.com/watch?v=HjyRQg0W_dI',
  },
  {
    id: 'DWui4MSYcsk',
    title: 'ما هو استقرار الأسعار',
    language: 'العربية',
    playlistTitle: 'Stabilité des prix',
    watchUrl: 'https://www.youtube.com/watch?v=DWui4MSYcsk',
  },
  {
    id: 'RtigizTy-18',
    title: 'What is price stability?',
    language: 'English',
    playlistTitle: 'Stabilité des prix',
    watchUrl: 'https://www.youtube.com/watch?v=RtigizTy-18',
  },
  {
    id: 'FhmSWB0svvg',
    title: 'Quelles sont les missions de Bank-Al-Maghrib',
    language: 'Français',
    playlistTitle: 'Missions de BAM',
    watchUrl: 'https://www.youtube.com/watch?v=FhmSWB0svvg',
  },
  {
    id: 'w0bfStlP-Fw',
    title: 'ما هي مهام بنك المغرب',
    language: 'العربية',
    playlistTitle: 'Missions de BAM',
    watchUrl: 'https://www.youtube.com/watch?v=w0bfStlP-Fw',
  },
  {
    id: 'M9pQrm5k-U0',
    title: 'بام كيدز 🙋‍♀️🙋‍♂️ BAM KIDS : لنكتشف مهام بنك المغرب !',
    language: 'العربية',
    playlistTitle: 'Missions de BAM',
    watchUrl: 'https://www.youtube.com/watch?v=M9pQrm5k-U0',
  },
]

function VideoPlayer({ id, title }: { id: string; title: string }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const origin = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return window.location.origin
  }, [])

  if (isPlaying) {
    const params = new URLSearchParams({
      autoplay: '1',
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
      enablejsapi: '1',
    })
    if (origin) params.set('origin', origin)

    return (
      <iframe
        src={`https://www.youtube.com/embed/${id}?${params.toString()}`}
        title={title}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setIsPlaying(true)}
      aria-label={`Lire la vidéo ${title}`}
      className="group relative w-full h-full overflow-hidden"
      style={{ border: 'none', padding: 0, cursor: 'pointer', backgroundColor: '#101010' }}
    >
      <span
        className="absolute inset-0"
        style={{
          backgroundImage: `url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          filter: 'brightness(0.78)',
        }}
      />
      <span
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.35))' }}
      >
        <span
          className="inline-flex items-center justify-center rounded-full"
          style={{ width: 64, height: 64, backgroundColor: 'rgba(180,25,35,0.95)', color: '#fff', boxShadow: '0 12px 36px rgba(0,0,0,0.35)' }}
        >
          <PlayCircle size={34} />
        </span>
      </span>
    </button>
  )
}

export default function VideosPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <nav
        className="px-6 py-4"
        style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-overlay)', backdropFilter: 'blur(8px)' }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
            <Landmark size={18} />
            <span className="font-editorial" style={{ fontSize: '1.15rem' }}>CBS</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/" className="label-caps hidden sm:flex items-center gap-1.5" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '12px' }}>
              <ArrowLeft size={13} />
              Accueil
            </a>
            <a href="/courses" className="label-caps" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '12px' }}>
              Cours
            </a>
            <a href="/dashboard" className="label-caps" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '12px' }}>
              Simulation
            </a>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <section className="px-6 py-14">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-10">
            <div className="max-w-2xl">
              <h1 className="font-editorial-roman text-4xl sm:text-5xl mb-4" style={{ lineHeight: 1, color: 'var(--text-primary)' }}>
                Vidéos
              </h1>
              <p className="text-base" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Une sélection pédagogique issue des playlists officielles de Bank Al-Maghrib pour expliquer la monnaie, le taux directeur, la stabilité des prix,
                les missions de la Banque centrale et le rôle du réseau bancaire. Ces vidéos complètent les cours du simulateur avec des notions simples et
                directement utiles pour comprendre les décisions du joueur.
              </p>
            </div>
            <div className="flex flex-wrap lg:justify-end gap-2">
              {PLAYLISTS.map(playlist => (
                <a
                  key={playlist.id}
                  href={`https://www.youtube.com/playlist?list=${playlist.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="label-caps inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md"
                  style={{ backgroundColor: 'var(--bg-panel)', color: 'var(--accent-primary)', border: '1px solid var(--border-default)', textDecoration: 'none', fontSize: '12px' }}
                >
                  {playlist.title}
                  <ExternalLink size={14} />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {VIDEOS.map((video, index) => (
              <article
                key={video.id}
                className="rounded-lg overflow-hidden"
                style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
              >
                <div style={{ aspectRatio: '16 / 9', backgroundColor: '#000' }}>
                  <VideoPlayer id={video.id} title={video.title} />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="label-caps" style={{ color: 'var(--accent-cool)', fontSize: '11px' }}>
                      Vidéo {String(index + 1).padStart(2, '0')} · {video.playlistTitle}
                    </span>
                    {video.duration && (
                      <span className="label-caps inline-flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>
                        <PlayCircle size={13} />
                        {video.duration}
                      </span>
                    )}
                  </div>
                  <h2 className="font-semibold text-lg mb-3" style={{ color: 'var(--text-primary)', lineHeight: 1.35 }} dir={video.language === 'العربية' ? 'rtl' : 'ltr'}>
                    {video.title}
                  </h2>
                  <div className="flex items-center justify-between gap-4">
                    <span className="label-caps" style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                      {video.language}
                    </span>
                    <a
                      href={video.watchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="label-caps inline-flex items-center gap-1.5 text-right"
                      style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '11px' }}
                    >
                      Regarder sur YouTube
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
