import { useState } from "react";

export default function Landing({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const endpoint = mode === "login" ? "/api/login" : "/api/register";
    const payload = {
      email: email.trim().toLowerCase(),
      password,
    };

    // Registration validation
    if (mode === "register") {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const message = data.error?.message || `${mode === "login" ? "Login" : "Registration"} failed.`;
        setError(message);
        setLoading(false);
        return;
      }

      setSuccess(`${mode === "login" ? "Welcome back" : "Welcome"}! Redirecting...`);

      // Call the onLogin prop with the token
      onLogin(data.data.token, data.data.user);
    } catch (fetchError) {
      const message = fetchError.message || "Network error. Please try again.";
      setError(message);
      setLoading(false);
    }
  }

  function resetForm() {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
  }

  function switchMode(newMode) {
    if (newMode !== mode) {
      setMode(newMode);
      resetForm();
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-slate/5 flex flex-col items-center justify-center px-4 py-8 text-charcoal">
      <main className="w-full max-w-md">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-1 w-6 bg-gradient-to-r from-oxblood to-teal rounded-full"></div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-slate via-oxblood to-slate bg-clip-text text-transparent mb-4">
            Daarkin
          </h1>
          <p className="text-lg text-muted leading-relaxed">
            Track every job application with precision and insight
          </p>
        </div>

        {/* Auth Container */}
        <div className="rounded-lg border border-slate/15 bg-gradient-to-br from-white to-slate/2 p-8 shadow-md-soft">
          {/* Mode Switcher */}
          <div className="mb-8 flex gap-2 rounded-lg bg-slate/5 p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 rounded-md py-2 px-3 text-sm font-bold uppercase tracking-wider transition ${
                mode === "login"
                  ? "bg-white text-slate shadow-sm-soft"
                  : "text-muted hover:text-slate"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`flex-1 rounded-md py-2 px-3 text-sm font-bold uppercase tracking-wider transition ${
                mode === "register"
                  ? "bg-white text-slate shadow-sm-soft"
                  : "text-muted hover:text-slate"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="space-y-2 text-sm">
              <span className="font-bold text-slate">Email Address</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate/15 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-slate focus:ring-2 focus:ring-slate/10 focus:shadow-md-soft placeholder:text-muted/50 disabled:opacity-60"
                placeholder="you@example.com"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-bold text-slate">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate/15 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-slate focus:ring-2 focus:ring-slate/10 focus:shadow-md-soft placeholder:text-muted/50 disabled:opacity-60"
                placeholder="••••••••"
              />
              {mode === "register" && (
                <p className="text-xs text-muted/70 mt-1">Minimum 8 characters</p>
              )}
            </label>

            {mode === "register" && (
              <label className="space-y-2 text-sm">
                <span className="font-bold text-slate">Confirm Password</span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate/15 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-slate focus:ring-2 focus:ring-slate/10 focus:shadow-md-soft placeholder:text-muted/50 disabled:opacity-60"
                  placeholder="••••••••"
                />
              </label>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-red-50/30 px-4 py-3 text-sm font-medium text-red-700 shadow-sm-soft">
                ✗ {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-teal/30 bg-gradient-to-r from-teal/10 to-slate/5 px-4 py-3 text-sm font-medium text-teal shadow-sm-soft">
                ✓ {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-slate to-slate px-4 py-3.5 text-sm font-bold text-white transition hover:shadow-lg-soft shadow-md-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (mode === "login" ? "Logging in..." : "Creating account...") : (mode === "login" ? "Login" : "Create Account")}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-8 rounded-lg bg-gradient-to-br from-teal/5 to-slate/5 border border-teal/20 p-4">
            <p className="text-xs text-muted leading-relaxed">
              {mode === "login" ? (
                <>No account yet? <span className="font-medium">Click "Sign Up" to get started.</span></>
              ) : (
                <>Already have an account? <span className="font-medium">Click "Login" to access your tracker.</span></>
              )}
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate uppercase tracking-wide">Why Daarkin?</h3>
            <ul className="space-y-2 text-xs text-muted">
              <li className="flex items-center justify-center gap-2">
                <span className="h-1 w-1 rounded-full bg-teal"></span>
                <span>Organized tracking of every application</span>
              </li>
              <li className="flex items-center justify-center gap-2">
                <span className="h-1 w-1 rounded-full bg-teal"></span>
                <span>Progress notes for each opportunity</span>
              </li>
              <li className="flex items-center justify-center gap-2">
                <span className="h-1 w-1 rounded-full bg-teal"></span>
                <span>Pipeline visibility at a glance</span>
              </li>
            </ul>
          </div>
          <div className="h-px bg-gradient-to-r from-slate/10 via-slate/5 to-transparent"></div>
          <p className="text-xs text-muted/60">
            Data is securely stored and never shared.
          </p>
        </div>
      </main>
    </div>
  );
}
