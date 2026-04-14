import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader } from "../components/Loader";
import { useAuthStore } from "../features/auth/store";
import { useUIStore } from "../store/uiStore";
import { AlertCircle, Mail, Lock, Eye, EyeOff, User } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

// ─── Validation ─────────────────────────────────────────────────────────────

function validate(values: RegisterForm): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Name is required";
  } else if (values.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  } else if (values.name.trim().length > 100) {
    errors.name = "Name must be less than 100 characters";
  }

  if (!values.email) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email address";
  }

  if (!values.password) {
    errors.password = "Password is required";
  } else if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  } else if (!/[A-Z]/.test(values.password)) {
    errors.password = "Password must contain at least 1 uppercase letter";
  } else if (!/\d/.test(values.password)) {
    errors.password = "Password must contain at least 1 digit";
  } else if (!/[@$!%*?&]/.test(values.password)) {
    errors.password =
      "Password must contain at least 1 special character (@$!%*?&)";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your password";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
}

// ─── RegisterPage component ────────────────────────────────────────────────────

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading, error, clearError } =
    useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    const newErrors = validate({ name, email, password, confirmPassword });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronizing touched state to derived error display
    setErrors((prev) => ({
      ...prev,
      name: touched.name ? newErrors.name : undefined,
      email: touched.email ? newErrors.email : undefined,
      password: touched.password ? newErrors.password : undefined,
      confirmPassword: touched.confirmPassword
        ? newErrors.confirmPassword
        : undefined,
      general:
        !newErrors.name &&
        !newErrors.email &&
        !newErrors.password &&
        !newErrors.confirmPassword
          ? prev.general
          : prev.general,
    }));
  }, [name, email, password, confirmPassword, touched]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      ...validate({ name, email, password, confirmPassword }),
      general: undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const fieldErrors = validate({ name, email, password, confirmPassword });
    setErrors(fieldErrors);
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (
      fieldErrors.name ||
      fieldErrors.email ||
      fieldErrors.password ||
      fieldErrors.confirmPassword
    )
      return;

    try {
      await register(name, email, password);
      useUIStore.getState().pushToast({
        message: "Account created! Welcome! You can now start chatting.",
        type: "success",
      });
      navigate("/");
    } catch {
      // error is synced via useEffect above
    }
  };

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          Create an account
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Join RAG Assistant to access your knowledge base
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* General API error */}
        {errors.general && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Name field */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur("name")}
              className={`w-full rounded-md border bg-background py-2 pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                errors.name ? "border-destructive" : "border-input"
              }`}
            />
          </div>
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>

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
              autoComplete="new-password"
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
          <p className="text-xs text-muted-foreground">
            Min 8 chars with uppercase, digit, and special char (@$!%*?&)
          </p>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password field */}
        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => handleBlur("confirmPassword")}
              className={`w-full rounded-md border bg-background py-2 pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                errors.confirmPassword ? "border-destructive" : "border-input"
              }`}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading && <Loader variant="spinner" className="h-4 w-4" />}
          {isLoading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
