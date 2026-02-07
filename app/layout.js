export const metadata = {
  title: 'Minha Carteira AI',
  description: 'Controle financeiro com Gemini',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  )
}
