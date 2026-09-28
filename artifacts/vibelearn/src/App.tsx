import { useEffect, useRef, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, Show, SignIn, SignUp, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Redirect, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DashboardPage, Landing, LearnPage, LessonPage, ProjectDetailPage, ProjectsPage, ResourcesPage, SettingsPage } from '@/pages/portal';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: 'top' as const,
    socialButtonsVariant: 'blockButton' as const,
  },
  variables: {
    colorPrimary: '#dc6b4f',
    colorForeground: '#203039',
    colorMutedForeground: '#687277',
    colorDanger: '#c94e46',
    colorBackground: '#fbfaf6',
    colorInput: '#f4f1e9',
    colorInputForeground: '#203039',
    colorNeutral: '#d8d2c7',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '0.8rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fbfaf6] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[#d8d2c7] shadow-[0_18px_55px_rgba(32,48,57,.12)]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'font-bold text-[#203039]',
    headerSubtitle: 'text-[#687277]',
    socialButtonsBlockButtonText: 'font-semibold text-[#203039]',
    formFieldLabel: 'font-semibold text-[#203039]',
    footerActionLink: 'font-bold text-[#c95e46]',
    footerActionText: 'text-[#687277]',
    dividerText: 'text-[#687277]',
    formFieldSuccessText: 'text-[#34756c]',
    alertText: 'text-[#c94e46]',
    logoBox: 'h-10',
    logoImage: 'h-10 w-10 rounded-xl',
    socialButtonsBlockButton: 'border-[#d8d2c7] bg-[#f4f1e9] hover:bg-[#ebe6dc]',
    formButtonPrimary: 'bg-[#dc6b4f] hover:bg-[#c95e46] font-bold',
    formFieldInput: 'border-[#d8d2c7] bg-[#f4f1e9] text-[#203039]',
    footerAction: 'border-t border-[#d8d2c7]',
    dividerLine: 'bg-[#d8d2c7]',
    alert: 'border-[#e7b0a5] bg-[#fbebe7]',
    otpCodeFieldInput: 'border-[#d8d2c7] bg-[#f4f1e9]',
    formFieldRow: 'gap-2',
    main: 'gap-5',
  },
};

function AuthPage({ kind }: { kind: 'sign-in' | 'sign-up' }) {
  return <div className="noise-layer grid min-h-[100dvh] place-items-center bg-background px-4 py-8"><div className="w-full"><div className="mx-auto mb-5 flex max-w-[440px] items-center justify-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary font-display text-lg font-bold text-primary-foreground">V</span><span className="font-display text-lg font-bold">Vibe<span className="text-primary">Learn</span></span></div>{kind === 'sign-in' ? <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /> : <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />}</div></div>;
}

function ClerkCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousUser = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const nextUser = user?.id ?? null;
      if (previousUser.current !== undefined && previousUser.current !== nextUser) client.clear();
      previousUser.current = nextUser;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

function HomeRedirect() {
  return <><Show when="signed-in"><Redirect to="/dashboard" /></Show><Show when="signed-out"><Landing /></Show></>;
}

function Protected({ children }: { children: ReactNode }) {
  return <><Show when="signed-in">{children}</Show><Show when="signed-out"><Redirect to="/sign-in" /></Show></>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={HomeRedirect} /><Route path="/sign-in/*?" component={() => <AuthPage kind="sign-in" />} /><Route path="/sign-up/*?" component={() => <AuthPage kind="sign-up" />} /><Route path="/dashboard"><Protected><DashboardPage /></Protected></Route><Route path="/learn"><Protected><LearnPage /></Protected></Route><Route path="/lessons/:id"><Protected><LessonPage /></Protected></Route><Route path="/projects"><Protected><ProjectsPage /></Protected></Route><Route path="/projects/:id"><Protected><ProjectDetailPage /></Protected></Route><Route path="/resources"><Protected><ResourcesPage /></Protected></Route><Route path="/settings"><Protected><SettingsPage /></Protected></Route><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function ClerkRoutes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'Return to your build loop' } }, signUp: { start: { title: 'Start your build loop', subtitle: 'A focused place to learn by making' } } }} routerPush={(to) => setLocation(stripBase(to))} routerReplace={(to) => setLocation(stripBase(to), { replace: true })}><QueryClientProvider client={queryClient}><ClerkCacheInvalidator /><Router /></QueryClientProvider></ClerkProvider>;
}

function App() {
  return <WouterRouter base={basePath}><ClerkRoutes /></WouterRouter>;
}

export default App;