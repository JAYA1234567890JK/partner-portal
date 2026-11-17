import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import Onboarding from '../pages/onboarding/Onboarding';
import PartnerDashboard from '../pages/dashboard/PartnerDashboard';
import { AvailabilityPage, BookingsPage, BusinessProfilePage, GalleryPage, HelpPage, PaymentsPage, PropertiesPage, ReviewsPage, RoomsPage, VerificationPage } from '../pages/portal/PortalPages';
import { getActiveEmail, getPartnerStatus } from '../services/partnerData';

function PartnerEntry({ children, onboarding = false }) {
  const location = useLocation(); const email = getActiveEmail(); const status = getPartnerStatus();
  if (!email) return <Navigate to="/partner/login" replace />;
  if (onboarding) {
    if (status !== 'onboarding' && new URLSearchParams(location.search).get('new') !== '1') return <Navigate to="/partner/dashboard" replace />;
    return children;
  }
  return status === 'onboarding' ? <Navigate to="/partner/onboarding" replace /> : children;
}

function AppRoutes() {
  return <Routes>
    <Route path="/" element={<Navigate to="/partner/login" replace />} />
    <Route path="/partner/login" element={<Login />} />
    <Route path="/partner/register" element={<Register />} />
    <Route path="/partner/forgot-password" element={<ForgotPassword />} />
    <Route path="/partner/onboarding" element={<PartnerEntry onboarding><Onboarding /></PartnerEntry>} />
    <Route path="/partner/application-status" element={<Navigate to="/partner/dashboard" replace />} />
    <Route path="/partner/dashboard" element={<PartnerEntry><PartnerDashboard /></PartnerEntry>} />
    <Route path="/partner/properties" element={<PartnerEntry><PropertiesPage /></PartnerEntry>} />
    <Route path="/partner/rooms" element={<PartnerEntry><RoomsPage /></PartnerEntry>} />
    <Route path="/partner/bookings" element={<PartnerEntry><BookingsPage /></PartnerEntry>} />
    <Route path="/partner/gallery" element={<PartnerEntry><GalleryPage /></PartnerEntry>} />
    <Route path="/partner/availability" element={<PartnerEntry><AvailabilityPage /></PartnerEntry>} />
    <Route path="/partner/pricing" element={<Navigate to="/partner/availability" replace />} />
    <Route path="/partner/payments" element={<PartnerEntry><PaymentsPage /></PartnerEntry>} />
    <Route path="/partner/revenue" element={<Navigate to="/partner/payments" replace />} />
    <Route path="/partner/verification" element={<PartnerEntry><VerificationPage /></PartnerEntry>} />
    <Route path="/partner/reviews" element={<PartnerEntry><ReviewsPage /></PartnerEntry>} />
    <Route path="/partner/settings" element={<PartnerEntry><BusinessProfilePage /></PartnerEntry>} />
    <Route path="/partner/business" element={<Navigate to="/partner/settings" replace />} />
    <Route path="/partner/help" element={<PartnerEntry><HelpPage /></PartnerEntry>} />
    <Route path="/partner/offers" element={<PartnerEntry><AvailabilityPage /></PartnerEntry>} />
    <Route path="/partner/notifications" element={<PartnerEntry><VerificationPage /></PartnerEntry>} />
    <Route path="*" element={<Navigate to="/partner/login" replace />} />
  </Routes>;
}
export default AppRoutes;
