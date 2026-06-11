import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organization: '',
    role: 'collection_staff',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { signup } = useAuth()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setError('')
    setLoading(true)

    try {
      await signup({
        email: formData.email,
        password: formData.password,
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        role: formData.role,
        phone: formData.phone,
        organization: formData.organization
      })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Unable to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-header">
          <div
            className="auth-logo"
            style={{
              background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
              <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
            </svg>
          </div>
          <h1>Create Account</h1>
          <p>Join A5X Smart Waste Management</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input type="text" name="firstName" className="form-input" placeholder="John" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input type="text" name="lastName" className="form-input" placeholder="Doe" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" name="email" className="form-input" placeholder="john.doe@example.com" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input type="tel" name="phone" className="form-input" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Organization</label>
            <input type="text" name="organization" className="form-input" placeholder="City Municipality" value={formData.organization} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select name="role" className="form-select" value={formData.role} onChange={handleChange}>
              <option value="collection_staff">Collection Staff</option>
              <option value="municipal_admin">Municipal Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} name="password" className="form-input" placeholder="Create a strong password" value={formData.password} onChange={handleChange} required minLength={8} style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input type="password" name="confirmPassword" className="form-input" placeholder="Confirm your password" value={formData.confirmPassword} onChange={handleChange} required />
          </div>

          <button type="submit" className="btn btn-primary auth-btn" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  )
}

export default Register
