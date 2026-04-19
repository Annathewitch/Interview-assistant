export const metadata = {
  title: "Interview Assistant",
  description: "Job tracking app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
