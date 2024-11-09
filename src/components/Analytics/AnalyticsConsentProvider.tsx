'use client';

import { GoogleAnalytics } from '@next/third-parties/google';
import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';

import usePageView from '@/Hooks/usePageView'

const AnalyticsConsentProvider: React.FC = () => {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const trackingId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || '';


  useEffect(() => {
    const consent = Cookies.get('analytics-consent');
    console.log(consent, 'consent');
    setAnalyticsEnabled(consent === 'true');
    setConsentGiven(!!consent);
  }, []);

  const handleAccept = () => {
    Cookies.set('analytics-consent', 'true', { expires: 365 });
    setAnalyticsEnabled(true);
    setConsentGiven(true);
  };

  const handleDecline = () => {
    Cookies.set('analytics-consent', 'false', { expires: 7 });
    setAnalyticsEnabled(false);
    setConsentGiven(true);
  };

  usePageView(trackingId, analyticsEnabled);

  return (
    <>
      {!consentGiven && (
        <div className="cookie-notice">
          <p>We use cookies for analytics. Do you accept?</p>
          <button onClick={handleAccept}>Accept</button>
          <button onClick={handleDecline}>Decline</button>
        </div>
      )}
      {analyticsEnabled && (
        <GoogleAnalytics gaId={trackingId} />
      )}
    </>
  );
};

export default AnalyticsConsentProvider;
