
import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ToastProvider } from './components/ui/Toast'
import { SyncProvider } from './contexts/SyncContext'
import BackgroundProvider from './components/ui/BackgroundProvider'
import ErrorBoundary from './components/ErrorBoundary'
import MainPage from './components/MainPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AuthenticatedLayout from './components/layout/AuthenticatedLayout'

// Lazy load components for better initial load time
const AdminHome = lazy(() => import('./components/admin/AdminHome'))
const AdminParticipants = lazy(() => import('./components/admin/AdminParticipants'))
const AdminSubmissions = lazy(() => import('./components/admin/AdminSubmissions'))
const AdminSettings = lazy(() => import('./components/admin/AdminSettings'))
const ParticipantHome = lazy(() => import('./components/participant/ParticipantHome'))
const ProfilePage = lazy(() => import('./components/participant/SimpleProfilePage'))
const EditProfilePage = lazy(() => import('./components/participant/EditProfilePage'))
const JudgeHome = lazy(() => import('./components/judge/JudgeHome'))
const JudgeQueue = lazy(() => import('./components/judge/JudgeQueue'))
const JudgeScores = lazy(() => import('./components/judge/JudgeScores'))
const Projects = lazy(() => import('./components/pages/Projects'))
const Teams = lazy(() => import('./components/pages/Teams'))
const Submissions = lazy(() => import('./components/pages/Submissions'))
const PublicLeaderboard = lazy(() => import('./components/pages/PublicLeaderboard'))
const JudgeSubmit = lazy(() => import('./components/pages/JudgeSubmit'))
const TeamRegistration = lazy(() => import('./components/admin/TeamRegistration'))
const LogsViewer = lazy(() => import('./components/admin/LogsViewer'))
const RewardManagement = lazy(() => import('./components/admin/RewardManagement'))
const HackathonManagement = lazy(() => import('./components/admin/HackathonManagement'))
const JoinHackathon = lazy(() => import('./components/pages/JoinHackathon'))
const ManualReview = lazy(() => import('./components/judge/ManualReview'))
const CreateTeam = lazy(() => import('./components/pages/CreateTeam'))
const AcceptInvitation = lazy(() => import('./components/pages/AcceptInvitation'))
const AcceptJudgeInvitation = lazy(() => import('./components/pages/AcceptJudgeInvitation'))
const HackaAgent = lazy(() => import('./components/agent/HackaAgent'))
import HealthWidget from './components/ui/HealthWidget'
import KeyboardShortcutsModal from './components/ui/KeyboardShortcutsModal'

// Suspense fallback for lazy-loaded routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0D1128] to-[#15193B]">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-white/60">Loading page...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <SyncProvider>
              <ToastProvider>
                <BackgroundProvider useStarfield={true} useGradient={true}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<MainPage />} />
                  <Route path="/leaderboard" element={
                    <Suspense fallback={<PageLoader />}>
                      <PublicLeaderboard />
                    </Suspense>
                  } />
                  <Route path="/invite/accept" element={
                    <Suspense fallback={<PageLoader />}>
                      <AcceptInvitation />
                    </Suspense>
                  } />
                  <Route path="/judge/accept" element={
                    <Suspense fallback={<PageLoader />}>
                      <AcceptJudgeInvitation />
                    </Suspense>
                  } />

                  {/* Admin Routes */}
                  <Route path="/admin" element={
                    <ProtectedRoute requiredRole="admin">
                      <AuthenticatedLayout>
                        <Suspense fallback={<PageLoader />}>
                          <AdminHome />
                        </Suspense>
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/participants" element={
                    <ProtectedRoute requiredRole="admin">
                      <AuthenticatedLayout>
                        <Suspense fallback={<PageLoader />}>
                          <AdminParticipants />
                        </Suspense>
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/submissions" element={
                    <ProtectedRoute requiredRole="admin">
                      <AuthenticatedLayout>
                        <Suspense fallback={<PageLoader />}>
                          <AdminSubmissions />
                        </Suspense>
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/settings" element={
                    <ProtectedRoute requiredRole="admin">
                      <AuthenticatedLayout>
                        <Suspense fallback={<PageLoader />}>
                          <AdminSettings />
                        </Suspense>
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/register-team" element={
                    <ProtectedRoute requiredRole="admin">
                      <AuthenticatedLayout>
                        <Suspense fallback={<PageLoader />}>
                          <TeamRegistration />
                        </Suspense>
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/hackathons" element={
                    <ProtectedRoute requiredRole="admin">
                      <AuthenticatedLayout>
                        <Suspense fallback={<PageLoader />}>
                          <HackathonManagement />
                        </Suspense>
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  } />

                  {/* Participant Routes */}
                  <Route path="/app" element={
                    <ProtectedRoute requiredRole="participant">
                      <AuthenticatedLayout>
                        <Suspense fallback={<PageLoader />}>
                          <ParticipantHome />
                        </Suspense>
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/app/teams" element={
                    <ProtectedRoute requiredRole="participant">
                      <AuthenticatedLayout>
                        <Suspense fallback={<PageLoader />}>
                          <Teams />
                        </Suspense>
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/app/submissions" element={
                    <ProtectedRoute requiredRole="participant">
                      <AuthenticatedLayout>
                        <Suspense fallback={<PageLoader />}>
                          <Submissions />
                        </Suspense>
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/app/profile" element={
                    <ProtectedRoute requiredRole="participant">
                      <AuthenticatedLayout>
                        <Suspense fallback={<PageLoader />}>
                          <ProfilePage />
                        </Suspense>
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/app/profile/edit" element={
                    <ProtectedRoute requiredRole="participant">
                      <AuthenticatedLayout>
                        <Suspense fallback={<PageLoader />}>
                          <EditProfilePage />
                        </Suspense>
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/join-hackathon" element={
                    <ProtectedRoute requiredRole="participant">
                      <AuthenticatedLayout>
                        <Suspense fallback={<PageLoader />}>
                          <JoinHackathon />
                        </Suspense>
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/create-team/:hackathonId" element={
                    <ProtectedRoute requiredRole="participant">
                      <AuthenticatedLayout>
                        <Suspense fallback={<PageLoader />}>
                          <CreateTeam />
                        </Suspense>
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  } />

                  {/* Judge Routes */}
                  <Route path="/judge" element={
                    <ProtectedRoute requiredRole="judge">
                      <AuthenticatedLayout>
                        <Suspense fallback={<PageLoader />}>
                          <JudgeHome />
                        </Suspense>
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/judge/queue" element={
                    <ProtectedRoute requiredRole="judge">
                      <AuthenticatedLayout>
                        <Suspense fallback={<PageLoader />}>
                          <JudgeQueue />
                        </Suspense>
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/judge/scores" element={
                    <ProtectedRoute requiredRole="judge">
                      <AuthenticatedLayout>
                        <Suspense fallback={<PageLoader />}>
                          <JudgeScores />
                        </Suspense>
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/judge/manual-review" element={
                    <ProtectedRoute requiredRole="judge">
                      <AuthenticatedLayout>
                        <Suspense fallback={<PageLoader />}>
                          <ManualReview />
                        </Suspense>
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  } />

                  {/* HackaAgent Route */}
                  <Route path="/hacka-agent" element={
                    <ProtectedRoute>
                      <AuthenticatedLayout>
                        <Suspense fallback={<PageLoader />}>
                          <HackaAgent />
                        </Suspense>
                      </AuthenticatedLayout>
                    </ProtectedRoute>
                  } />

                </Routes>
            
            
                 <HealthWidget />
                 <KeyboardShortcutsModal />
               </BackgroundProvider>
             </ToastProvider>
           </SyncProvider>
         </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
