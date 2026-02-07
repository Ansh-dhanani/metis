'use client';

import { useEffect, useState } from 'react';

interface CandidateEntry {
    rank: number;
    candidate_id: string;
    candidate_name: string;
    weighted_score: number;
    integrity_score: number;
    final_score: number;
    shortlist_status: string;
    model1_score?: number;
    model2_score?: number;
}

interface LeaderboardData {
    job_title: string;
    total_applicants: number;
    round_2_count: number;
    round_1_count: number;
    rejected_count: number;
    entries: CandidateEntry[];
}

export default function LeaderboardPage() {
    const [data, setData] = useState<LeaderboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/scoring/demo');
            const json = await res.json();
            if (json.success) {
                setData(json.leaderboard);
            } else {
                setError(json.error || 'Failed to load leaderboard');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'round_2': return 'bg-emerald-500/20 text-emerald-400';
            case 'round_1': return 'bg-amber-500/20 text-amber-400';
            default: return 'bg-red-500/20 text-red-400';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 75) return 'text-emerald-400';
        if (score >= 55) return 'text-amber-400';
        return 'text-red-400';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <div className="text-4xl mb-4">⏳</div>
                    <p className="text-slate-400">Loading leaderboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <div className="text-4xl mb-4">⚠️</div>
                    <p className="text-red-400">{error}</p>
                    <button
                        onClick={fetchLeaderboard}
                        className="mt-4 px-4 py-2 bg-primary rounded-lg hover:bg-primary-light transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold gradient-text mb-2">🏆 Candidate Leaderboard</h1>
                <p className="text-slate-400">{data?.job_title || 'Position'}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="card p-4 text-center">
                    <div className="text-3xl font-bold text-white">{data?.total_applicants || 0}</div>
                    <div className="text-sm text-slate-400">Total Applicants</div>
                </div>
                <div className="card p-4 text-center">
                    <div className="text-3xl font-bold text-emerald-400">{data?.round_2_count || 0}</div>
                    <div className="text-sm text-slate-400">Round 2</div>
                </div>
                <div className="card p-4 text-center">
                    <div className="text-3xl font-bold text-amber-400">{data?.round_1_count || 0}</div>
                    <div className="text-sm text-slate-400">Round 1</div>
                </div>
                <div className="card p-4 text-center">
                    <div className="text-3xl font-bold text-red-400">{data?.rejected_count || 0}</div>
                    <div className="text-sm text-slate-400">Rejected</div>
                </div>
            </div>

            {/* Leaderboard Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Rank</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Candidate</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-300">Weighted</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-300">Integrity</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-300">Final Score</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-300">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {data?.entries.map((entry, idx) => (
                                <tr key={entry.candidate_id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <span className={`text-lg font-bold ${idx < 3 ? 'text-amber-400' : 'text-slate-400'}`}>
                                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${entry.rank}`}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-white">{entry.candidate_name}</div>
                                        <div className="text-xs text-slate-500">{entry.candidate_id}</div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={getScoreColor(entry.weighted_score)}>
                                            {entry.weighted_score.toFixed(1)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={getScoreColor(entry.integrity_score)}>
                                            {entry.integrity_score.toFixed(0)}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`text-xl font-bold ${getScoreColor(entry.final_score)}`}>
                                            {entry.final_score.toFixed(1)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(entry.shortlist_status)}`}>
                                            {entry.shortlist_status.replace('_', ' ')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
