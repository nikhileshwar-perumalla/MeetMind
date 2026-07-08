import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Landing page for the Google OAuth redirect — stores the token and enters the app. */
export default function OAuthCallback() {
  const [params] = useSearchParams();
  const { acceptOAuthToken } = useAuth();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = params.get('token');
    if (!token) {
      navigate('/login?error=oauth', { replace: true });
      return;
    }
    acceptOAuthToken(token).then(() => navigate('/', { replace: true }));
  }, [params, acceptOAuthToken, navigate]);

  return <div className="page-loading">Signing you in…</div>;
}
