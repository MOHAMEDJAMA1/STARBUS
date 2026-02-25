"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SignInPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [captcha, setCaptcha] = useState({ num1: 0, num2: 0 });
    const [captchaAnswer, setCaptchaAnswer] = useState("");

    useEffect(() => {
        setCaptcha({
            num1: Math.floor(Math.random() * 20) + 1,
            num2: Math.floor(Math.random() * 10) + 1
        });
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (parseInt(captchaAnswer) !== captcha.num1 + captcha.num2) {
            alert("Lambarka xaqiijinta waa khalad (Incorrect Math Answer)");
            setCaptcha({
                num1: Math.floor(Math.random() * 20) + 1,
                num2: Math.floor(Math.random() * 10) + 1
            });
            setCaptchaAnswer("");
            return;
        }

        setLoading(true);

        // Auto-append domain if missing
        let loginEmail = email.trim();
        if (!loginEmail.includes("@")) {
            loginEmail = `${loginEmail}@som.edu`;
        }

        const formData = new FormData();
        formData.append("email", loginEmail);
        formData.append("password", password);

        // Dynamic import of server action to avoid build issues if not all aligned yet? 
        // No, standard import is fine.
        // We'll use the imported action.

        try {
            // We use a small helper or invoke directly
            // Note: Server actions in client components need to be imported
            const { login } = await import("@/lib/actions/auth");
            const result = await login(formData);

            if (result && result.error) {
                alert(result.error); // Or better UI handling
                setLoading(false);
            }
            // If success, the action redirects, so we don't need to do anything here strictly
            // but we might want to keep loading true.
        } catch (error) {
            console.error("Login error", error);
            alert("An unexpected error occurred.");
            setLoading(false);
        }
    };

    return (
        <div className="font-display bg-background-main text-slate-900 min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden">
            {/* Language Toggle */}
            {/* Language Toggle Removed */}

            <div className="w-full max-w-[420px] relative z-10">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl shadow-blue-500/20 border-2 border-slate-50 mb-8 transition-all duration-500 hover:rotate-3">
                        <img
                            alt="SOMEDU Logo"
                            className="h-28 w-auto object-contain"
                            src="/logo.png"
                        />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
                        SOMEDU SYSTEM
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm font-bold uppercase tracking-widest opacity-60">
                        Student Information System
                    </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl p-10 backdrop-blur-xl bg-white/90">
                    <form onSubmit={handleLogin} className="space-y-8">
                        <div className="space-y-3">
                            <div className="flex flex-col mb-4">
                                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Welcome Back</h2>
                                <p className="text-xs font-medium text-slate-400">Please enter your credentials to access the system.</p>
                            </div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1" htmlFor="email">
                                Username / Email
                            </label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <i className="material-icons text-[22px]">person</i>
                                </span>
                                <input
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium"
                                    id="email"
                                    name="email"
                                    placeholder="Username or email@som.edu"
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1" htmlFor="password">
                                Furaha (Password)
                            </label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <i className="material-icons text-[22px]">lock</i>
                                </span>
                                <input
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium"
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1" htmlFor="captcha">
                                Xaqiijin (Math: {captcha.num1} + {captcha.num2} = ?)
                            </label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <i className="material-icons text-[22px]">calculate</i>
                                </span>
                                <input
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium"
                                    id="captcha"
                                    name="captcha"
                                    placeholder="Geli jawaabta..."
                                    type="number"
                                    value={captchaAnswer}
                                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            className="w-full bg-slate-900 hover:bg-blue-600 text-white font-black py-4.5 rounded-2xl shadow-xl shadow-slate-900/10 hover:shadow-blue-600/20 transition-all flex items-center justify-center gap-3 group disabled:opacity-70 text-sm uppercase tracking-widest"
                            type="submit"
                            disabled={loading}
                        >
                            <span>{loading ? "Galooda..." : "Soo Gal (Sign In)"}</span>
                            {!loading && (
                                <i className="material-icons text-[20px] group-hover:translate-x-1 transition-transform">
                                    arrow_forward
                                </i>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-slate-100">
                        <div className="text-center group cursor-pointer">
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                                Ma tahay macalin ama arday cusub?
                                <span className="text-blue-600 ml-2">La xiriir maamulkaaga</span>
                            </p>
                        </div>
                    </div>
                </div>

                <footer className="mt-16 text-center">
                    <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-[0.3em] font-black opacity-50">
                        © 2026 SOMEDU - PERFORMANCE SYSTEM V1.0.0
                    </p>
                    <div className="flex justify-center gap-10 mt-8">
                        <a className="text-slate-300 hover:text-blue-500 transition-all hover:scale-110" href="#">
                            <i className="material-icons text-[22px]">public</i>
                        </a>
                        <a className="text-slate-300 hover:text-blue-500 transition-all hover:scale-110" href="#">
                            <i className="material-icons text-[22px]">help_outline</i>
                        </a>
                        <a className="text-slate-300 hover:text-blue-500 transition-all hover:scale-110" href="#">
                            <i className="material-icons text-[22px]">contact_support</i>
                        </a>
                    </div>
                </footer>
            </div>

            <div className="fixed top-0 left-0 w-full h-1 bg-primary z-20"></div>
            <div className="fixed -z-10 bottom-[-5%] right-[-5%] w-[30%] h-[40%] bg-blue-100/40 blur-[100px] rounded-full"></div>
            <div className="fixed -z-10 top-[-5%] left-[-5%] w-[25%] h-[35%] bg-blue-100/40 blur-[100px] rounded-full"></div>
        </div>
    );
}
