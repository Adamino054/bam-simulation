import Link from 'next/link'

export default function AboutPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16 max-w-2xl mx-auto"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      <div className="w-full">
        <p className="label-caps mb-4" style={{ color: 'var(--accent-primary)' }}>
          À propos du projet
        </p>
        <h1
          className="font-editorial-roman mb-6"
          style={{
            fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          Central Bank Simulator
        </h1>

        <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <p>
            Ce serious game est développé dans le cadre d'un Projet de Fin d'Année
            commandité par <strong style={{ color: 'var(--text-primary)' }}>la Banque centrale</strong>
            du Royaume du Maroc.
          </p>
          <p>
            Il constitue la composante jouable d'un moteur de simulation macroéconomique
            destiné à modéliser les mécanismes de transmission de la politique monétaire
            dans le contexte marocain.
          </p>
          <p>
            Le moteur de simulation — entièrement isolé du code d'interface — implémente
            une courbe de Phillips augmentée des anticipations, une courbe IS dynamique,
            un canal du crédit avec ajustement partiel, et un marché monétaire stylisé.
            Les paramètres sont calibrés à partir de la littérature sur les économies
            émergentes à régime de change administré.
          </p>
          <p>
            Cette version web servira de support pédagogique pour illustrer les mécanismes
            de politique monétaire au grand public et aux étudiants.
          </p>
        </div>

        <div className="mt-10">
          <Link
            href="/"
            className="label-caps transition-colors duration-200"
            style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
