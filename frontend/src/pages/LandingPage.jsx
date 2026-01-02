import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, FileText, Users } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse"></div>
                <div className="absolute bottom-[0%] right-[0%] w-[40%] h-[60%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 max-w-5xl w-full text-center">
                <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-6 tracking-tight">
                    Cochin United Consultancy
                </h1>

                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('adminUser');
                        window.location.href = '/';
                    }}
                    className="absolute top-6 right-6 text-slate-400 hover:text-white px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-500 transition text-sm font-medium z-50">
                    Logout
                </button>
                <p className="text-slate-400 text-lg md:text-xl mb-16 max-w-2xl mx-auto">
                    Your Comprehensive Solution for Legal Expertise and Financial Management
                </p>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Legal Card */}
                    <Link to="/legal" className="group">
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-10 rounded-3xl hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 h-full flex flex-col items-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-blue-500/50 transition-all duration-500">
                                <Scale className="text-white w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">Legal Expert</h2>
                            <p className="text-slate-400 text-center">
                                Access professional legal consultancy, case tracking, and expert advice.
                            </p>
                        </div>
                    </Link>

                    {/* Billing Card */}
                    <Link to="/billing" className="group">
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-10 rounded-3xl hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 h-full flex flex-col items-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-purple-500/50 transition-all duration-500">
                                <FileText className="text-white w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">Billing Software</h2>
                            <p className="text-slate-400 text-center">
                                Manage invoices, quotations, and financial records with ease.
                            </p>
                        </div>
                    </Link>

                    {/* Client Data Card */}
                    <Link to="/clients" className="group">
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-10 rounded-3xl hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/20 h-full flex flex-col items-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-emerald-500/50 transition-all duration-500">
                                <Users className="text-white w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">Client Data</h2>
                            <p className="text-slate-400 text-center">
                                Manage client details, contact information, and records.
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
