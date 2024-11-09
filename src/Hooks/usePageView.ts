import { useRouter } from 'next/router';
import { useEffect } from 'react';

const usePageView = (trackingId: string, enabled: boolean) => {
  const router = useRouter();

  useEffect(() => {
    if (!enabled || !trackingId) return;

    const handleRouteChange = (url: string) => {
      window.gtag('config', trackingId, {
        page_path: url,
      });
    };

    // Trigger the initial page view
    handleRouteChange(router.asPath);

    // Listen for route changes to send subsequent page views
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [enabled, trackingId, router.events, router.asPath]);
};

export default usePageView;
