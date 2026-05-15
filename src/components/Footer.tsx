export default function Footer() {
  return (
    <footer style={{
      padding: '1.25rem',
      textAlign: 'center',
      borderTop: '3px solid var(--jumbo-blue)',
      background: 'var(--jumbo-white)',
      color: 'var(--jumbo-dark)'
    }}>
      <small>© {new Date().getFullYear()} FridgeMatch — Powered by Jumbo</small>
    </footer>
  );
}
