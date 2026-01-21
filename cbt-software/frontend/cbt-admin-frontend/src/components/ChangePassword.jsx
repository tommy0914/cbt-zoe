import React, { useState } from 'react';
import api from '../services/api';

export default function ChangePassword({ token, onPasswordChanged }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        '/api/auth/change-password',
        {
          currentPassword,
          newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(response.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Call callback if provided
      if (onPasswordChanged) {
        setTimeout(() => onPasswordChanged(), 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '480px', margin: '40px auto' }}>
      <h3>🔐 Change Your Password</h3>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
        Please create a new password for your account. You must change your temporary password before continuing.
      </p>

      <form onSubmit={handleChangePassword}>
        <div style={{ marginTop: 12 }}>
          <label>Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter your temporary password"
            required
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password (min 6 characters)"
            required
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your new password"
            required
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: '#ffe0e0', color: '#d32f2f', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: '#e0ffe0', color: '#2e7d32', borderRadius: '4px' }}>
            {success}
          </div>
        )}
      </form>
    </div>
  );
}
