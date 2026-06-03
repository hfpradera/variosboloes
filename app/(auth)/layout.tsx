export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">⚽</div>
          <h1 className="text-3xl font-black">
            <span className="text-primary">Bolão</span>{' '}
            <span className="text-secondary">Copa 2026</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            EUA · Canadá · México
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
