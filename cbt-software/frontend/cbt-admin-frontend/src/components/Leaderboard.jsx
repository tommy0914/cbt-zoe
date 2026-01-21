import { useState, useEffect } from 'react';
import api from '../services/api';
import './Leaderboard.css';

export default function Leaderboard({ classId, studentId, isStudent }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [studentRank, setStudentRank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showMedal, setShowMedal] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [classId, studentId]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/quickwins/leaderboard/class/${classId}?limit=15`);
      setLeaderboard(res.data);

      if (isStudent && studentId) {
        const res2 = await api.get(
          `/quickwins/leaderboard/student/${studentId}/class/${classId}`
        );
        setStudentRank(res2.data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  };

  const getMedalColor = (rank) => {
    switch (rank) {
      case 1:
        return '#fbbf24'; // gold
      case 2:
        return '#d1d5db'; // silver
      case 3:
        return '#d97706'; // bronze
      default:
        return '#e5e7eb'; // light gray
    }
  };

  if (loading) {
    return <div className="leaderboard-loading">Loading leaderboard...</div>;
  }

  return (
    <div className="leaderboard-section">
      <div className="leaderboard-header">
        <h3>🏆 Class Leaderboard</h3>
        <button
          className="btn-refresh"
          onClick={fetchLeaderboard}
          title="Refresh leaderboard"
        >
          🔄
        </button>
      </div>

      {studentRank && isStudent && (
        <div className="student-rank-card">
          <div className="rank-stat">
            <span className="rank-label">Your Rank</span>
            <span className="rank-value">{studentRank.rank || '-'}</span>
          </div>
          <div className="rank-stat">
            <span className="rank-label">Avg Score</span>
            <span className="rank-value">{studentRank.averageScore?.toFixed(1)}%</span>
          </div>
          <div className="rank-stat">
            <span className="rank-label">Tests</span>
            <span className="rank-value">{studentRank.testsAttempted || 0}</span>
          </div>
          <div className="rank-stat">
            <span className="rank-label">Streak</span>
            <span className="rank-value">{studentRank.streak || 0} 🔥</span>
          </div>
        </div>
      )}

      <div className="leaderboard-table">
        <div className="leaderboard-header-row">
          <div className="col-rank">Rank</div>
          <div className="col-name">Name</div>
          <div className="col-score">Avg Score</div>
          <div className="col-tests">Tests</div>
          <div className="col-points">Points</div>
          <div className="col-streak">Streak</div>
        </div>

        {leaderboard.map((entry) => (
          <div
            key={entry._id}
            className={`leaderboard-row ${entry._id === studentRank?._id ? 'current-student' : ''}`}
            style={{
              borderLeftColor: getMedalColor(entry.rank),
              borderLeftWidth: entry.rank <= 3 ? '4px' : '2px'
            }}
          >
            <div className="col-rank">
              {showMedal && entry.rank <= 3 ? getMedalEmoji(entry.rank) : entry.rank}
            </div>
            <div className="col-name">
              <span className="student-name">{entry.studentName}</span>
              <small className="student-email">{entry.studentEmail}</small>
            </div>
            <div className="col-score">
              <span className="score-badge">{entry.averageScore?.toFixed(1)}%</span>
            </div>
            <div className="col-tests">{entry.testsAttempted || 0}</div>
            <div className="col-points">
              <span className="points-badge">⭐ {entry.points || 0}</span>
            </div>
            <div className="col-streak">
              {entry.streak > 0 ? `${entry.streak}🔥` : '-'}
            </div>
          </div>
        ))}
      </div>

      <div className="leaderboard-footer">
        <small>Scores updated in real-time • Top 15 shown</small>
      </div>
    </div>
  );
}
