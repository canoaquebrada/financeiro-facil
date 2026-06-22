import './globals.css';
import AuthProvider from '../components/AuthProvider';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Financeiro Fácil',
  description: 'Sistema de controle financeiro SaaS'
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
