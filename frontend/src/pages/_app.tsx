import type { AppProps } from 'next/app';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css';
import { Navbar } from '../components/Navbar';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Component {...pageProps} />
      </main>
      <ToastContainer position="bottom-right" theme="dark" />
    </div>
  );
}
