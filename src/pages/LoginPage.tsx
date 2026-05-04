import { Shield, Mail, Github, Chrome } from 'lucide-react';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Shield className="w-12 h-12 text-indigo-500 mx-auto" />
          <h1 className="text-3xl font-bold tracking-tight">SentraAI SOC</h1>
          <p className="text-slate-400">Welcome back. Secure your operations.</p>
        </div>

        <div className="bg-slate-900 border border-white/5 p-8 rounded-2xl shadow-2xl space-y-6">
          <button 
            onClick={handleGoogleLogin}
            className="w-full h-12 bg-white text-slate-950 font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-slate-200 transition-colors"
          >
            <Chrome className="w-5 h-5 text-indigo-600" />
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5"></span></div>
            <div className="relative flex justify-center text-xs uppercase bg-transparent"><span className="px-2 text-slate-500 bg-slate-900">Or continue with mail</span></div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Work Email</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="analyst@company.com"
                className="w-full h-12 bg-slate-950 border border-white/10 rounded-xl px-4 text-slate-100 placeholder:text-slate-700 focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 bg-slate-950 border border-white/10 rounded-xl px-4 text-slate-100 placeholder:text-slate-700 focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            <button 
              type="submit"
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all"
            >
              Sign In
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600">
          Secure, zero-trust authentication. <br />
          Enterprise SSO available for Core+ plans.
        </p>
      </div>
    </div>
  );
}
