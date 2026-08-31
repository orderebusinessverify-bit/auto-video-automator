export const metadata = {
  title: 'Video Automator',
  description: 'Bulk video generation tool',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
