import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile, clearError } from '../../store/authSlice';
import http from '../../api/http';

const ProfileForm = () => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    }
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        address: {
          line1: user.address?.line1 || '',
          line2: user.address?.line2 || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          postalCode: user.address?.postalCode || '',
          country: user.address?.country || ''
        }
      });
    }
  }, [user]);

  const validateProfileForm = () => {
    const errors = {};
    
    if (!formData.name) {
      errors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain uppercase, lowercase, and number';
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    // Clear messages when user starts typing
    if (error) {
      dispatch(clearError());
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }

    const result = await dispatch(updateProfile(formData));
    
    if (updateProfile.fulfilled.match(result)) {
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    setPasswordLoading(true);
    try {
      await http.put('/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setSuccessMessage('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setPasswordErrors({
        submit: err.response?.data?.message || 'Failed to change password'
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="profile-forms">
      <div className="profile-section">
        <h3>Profile Information</h3>
        <form onSubmit={handleProfileSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={validationErrors.name ? 'error' : ''}
              disabled={loading}
            />
            {validationErrors.name && (
              <span className="error-message">{validationErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={validationErrors.email ? 'error' : ''}
              disabled={loading}
            />
            {validationErrors.email && (
              <span className="error-message">{validationErrors.email}</span>
            )}
          </div>

          <h4>Address</h4>
          
          <div className="form-group">
            <label htmlFor="address.line1">Address Line 1</label>
            <input
              type="text"
              id="address.line1"
              name="address.line1"
              value={formData.address.line1}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="address.line2">Address Line 2</label>
            <input
              type="text"
              id="address.line2"
              name="address.line2"
              value={formData.address.line2}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address.city">City</label>
              <input
                type="text"
                id="address.city"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="address.state">State</label>
              <input
                type="text"
                id="address.state"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address.postalCode">Postal Code</label>
              <input
                type="text"
                id="address.postalCode"
                name="address.postalCode"
                value={formData.address.postalCode}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="address.country">Country</label>
              <input
                type="text"
                id="address.country"
                name="address.country"
                value={formData.address.country}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="success-banner">
              {successMessage}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>

      <div className="profile-section">
        <h3>Change Password</h3>
        {!showPasswordForm ? (
          <button 
            onClick={() => setShowPasswordForm(true)} 
            className="btn-secondary"
          >
            Change Password
          </button>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className={passwordErrors.currentPassword ? 'error' : ''}
                disabled={passwordLoading}
              />
              {passwordErrors.currentPassword && (
                <span className="error-message">{passwordErrors.currentPassword}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className={passwordErrors.newPassword ? 'error' : ''}
                disabled={passwordLoading}
              />
              {passwordErrors.newPassword && (
                <span className="error-message">{passwordErrors.newPassword}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className={passwordErrors.confirmPassword ? 'error' : ''}
                disabled={passwordLoading}
              />
              {passwordErrors.confirmPassword && (
                <span className="error-message">{passwordErrors.confirmPassword}</span>
              )}
            </div>

            {passwordErrors.submit && (
              <div className="error-banner">
                {passwordErrors.submit}
              </div>
            )}

            <div className="button-group">
              <button type="submit" disabled={passwordLoading} className="btn-primary">
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                  setPasswordErrors({});
                }} 
                className="btn-secondary"
                disabled={passwordLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfileForm;
