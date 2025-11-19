import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '../store/authSlice';
import ProfileForm from '../components/auth/ProfileForm';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    // Fetch latest profile data
    if (!user) {
      dispatch(getProfile());
    }
  }, [isAuthenticated, user, dispatch, navigate]);

  if (loading && !user) {
    return (
      <div className="profile-page">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>My Profile</h1>
        <div className="user-info">
          <p><strong>Role:</strong> {user.role || 'customer'}</p>
          <p><strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
        <ProfileForm />
      </div>
    </div>
  );
};

export default ProfilePage;
