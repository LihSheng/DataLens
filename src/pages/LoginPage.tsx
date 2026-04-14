import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader } from "../components/Loader";
import { useAuthStore } from "../features/auth/store";
import { AlertCircle, Mail, Lock, Eye, EyeOff } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

type Credentials = { email: string; password: string };

// ─── Validation ─────────────────────────────────────────────────────────────

function validate(values: Credentials): FormErrors {
  const errors: FormErrors = {};
  if (!values.email) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email address";
  }
  if (!values.password) {
    errors.password = "Password is required";
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }
  return errors;
}

// ─── LoginPage component ────────────────────────────────────────────────────

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, error, clearError } =
    useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Sync store error to form error
  useEffect(() => {
    if (error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing external error state to local form state
      setErrors((prev) => ({ ...prev, general: error }));
    }
  }, [error]);

  // Clear field errors as user types
  useEffect(() => {
    if (touched.email || touched.password) {
      const newErrors = validate({ email, password });
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing touched state to derived error display
      setErrors((prev) => ({
        ...prev,
        email: touched.email ? newErrors.email : undefined,
        password: touched.password ? newErrors.password : undefined,
        general:
          !newErrors.email && !newErrors.password ? prev.general : prev.general,
      }));
    }
  }, [email, password, touched]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      ...validate({ email, password }),
      general: undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const fieldErrors = validate({ email, password });
    setErrors(fieldErrors);
    setTouched({ email: true, password: true });

    if (fieldErrors.email || fieldErrors.password) return;

    try {
      await login({ provider: "credentials", email, password });
      navigate("/");
    } catch {
      // error is synced via useEffect above
    }
  };

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* General API error */}
        {errors.general && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Email field */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur("email")}
              className={`w-full rounded-md border bg-background py-2 pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                errors.email ? "border-destructive" : "border-input"
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        {/* Password field */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur("password")}
              className={`w-full rounded-md border bg-background py-2 pl-10 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                errors.password ? "border-destructive" : "border-input"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading && <Loader variant="spinner" className="h-4 w-4" />}
          {isLoading ? "Signing in…" : "Sign in"}
        </button>

        {/* Register link */}
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
