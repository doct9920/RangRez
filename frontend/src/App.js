import { useEffect, useRef, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Boxes, Check, ChevronRight, CirclePlus, LogOut, Package, Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toaster, toast } from "@/components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Send cookies with every API call so the auth session is recognised.
axios.defaults.withCredentials = true;

const api = {
  collections: () => axios.get(`${API}/collections`),
  createCollection: (data) => axios.post(`${API}/collections`, data),
  createProduct: (data) => axios.post(`${API}/products`, data),
  products: () => axios.get(`${API}/products`),
  me: () => axios.get(`${API}/auth/me`),
  session: (sessionId) => axios.post(`${API}/auth/session`, {}, { headers: { "X-Session-ID": sessionId } }),
  logout: () => axios.post(`${API}/auth/logout`),
};

function Shell({ children, user, onLogout }) {
  const location = useLocation();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" className="brand" data-testid="brand-home">
          <span className="brand-mark"><Sparkles size={16} /></span>
          <span>Rangrez</span>
        </Link>
        <nav>
          <Link className={!location.pathname.includes("collection") ? "active" : ""} to="/" data-testid="nav-products"><Package size={17} />Products</Link>
          <Link className={location.pathname.includes("collection") ? "active" : ""} to="/collections" data-testid="nav-collections"><Boxes size={17} />Collections</Link>
        </nav>
        <div className="sidebar-note">
          <div className="note-icon"><CirclePlus size={16} /></div>
          <p><strong>Keep it together.</strong><br />Organize your Rangrez catalog as you go.</p>
        </div>
        {user && (
          <div className="sidebar-user" data-testid="sidebar-user">
            {user.picture ? <img src={user.picture} alt={user.name} /> : <div className="avatar-placeholder">{(user.name || user.email || "?").charAt(0).toUpperCase()}</div>}
            <div className="user-text">
              <strong data-testid="user-name">{user.name || user.email}</strong>
              <small>{user.email}</small>
            </div>
            <button type="button" className="icon-button" onClick={onLogout} data-testid="logout-button" aria-label="Logout"><LogOut size={16} /></button>
          </div>
        )}
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}

function ProductPage({ user, onLogout }) {
  const [collections, setCollections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => JSON.parse(sessionStorage.getItem("product-draft") || "null") || { name: "", sku: "", price: "", description: "", collection_id: "" });
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.collections(), api.products()])
      .then(([c, p]) => { setCollections(c.data); setProducts(p.data); })
      .catch(() => toast.error("Could not load your catalog"))
      .finally(() => setLoading(false));
  }, []);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const openCollection = () => { sessionStorage.setItem("product-draft", JSON.stringify(form)); navigate("/collections/new"); };
  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.price || Number(form.price) < 0) return toast.error("Add a product name and a valid price");
    setSaving(true);
    try {
      await api.createProduct({ ...form, price: Number(form.price), collection_id: form.collection_id || null });
      sessionStorage.removeItem("product-draft");
      toast.success("Product added to your catalog");
      setForm({ name: "", sku: "", price: "", description: "", collection_id: "" });
      const p = await api.products();
      setProducts(p.data);
    } catch { toast.error("Product could not be saved"); } finally { setSaving(false); }
  };

  return (
    <Shell user={user} onLogout={onLogout}>
      <div className="page-heading">
        <div>
          <p className="eyebrow">RANGREZ / NEW ENTRY</p>
          <h1 data-testid="product-page-heading">Add a product</h1>
          <p className="subhead">Give your next find a home in the Rangrez catalog.</p>
        </div>
        <div className="header-stat"><span>{products.length}</span><small>products<br />in catalog</small></div>
      </div>
      <form className="product-layout" onSubmit={submit}>
        <section className="form-panel">
          <div className="section-label"><span>01</span><div><h2>Product details</h2><p>The essentials customers need to know.</p></div></div>
          <label>Product name <Input data-testid="product-name-input" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Handwoven cotton dupatta" /></label>
          <div className="two-col">
            <label>SKU <Input data-testid="product-sku-input" value={form.sku} onChange={(e) => update("sku", e.target.value)} placeholder="Optional" /></label>
            <label>Price <div className="price-input"><span>$</span><Input data-testid="product-price-input" type="number" min="0" step="0.01" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0.00" /></div></label>
          </div>
          <label>Description <Textarea data-testid="product-description-input" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="A short note about what makes it special..." /></label>
        </section>
        <aside className="form-side">
          <div className="section-label"><span>02</span><div><h2>Collection</h2><p>Where should this product live?</p></div></div>
          <label className="select-label">Choose a collection
            <select data-testid="product-collection-select" value={form.collection_id} onChange={(e) => update("collection_id", e.target.value)} disabled={loading}>
              <option value="">No collection</option>
              {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <button type="button" className="create-collection" data-testid="create-new-collection-button" onClick={openCollection}>
            <span><Plus size={16} /></span>Create new collection <ChevronRight size={16} />
          </button>
          <div className="form-actions">
            <Button type="submit" data-testid="create-product-button" disabled={saving}>{saving ? "Saving…" : "Create product"}<Check size={16} /></Button>
            <button type="button" className="text-button" data-testid="clear-product-form-button" onClick={() => { sessionStorage.removeItem("product-draft"); setForm({ name: "", sku: "", price: "", description: "", collection_id: "" }); }}>Clear form</button>
          </div>
        </aside>
      </form>
    </Shell>
  );
}

function NewCollectionPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const save = async (event) => {
    event.preventDefault();
    if (!name.trim()) return toast.error("Give your collection a name");
    setSaving(true);
    try {
      const { data } = await api.createCollection({ name, description });
      const draft = JSON.parse(sessionStorage.getItem("product-draft") || "null");
      sessionStorage.setItem("product-draft", JSON.stringify({ ...(draft || { name: "", sku: "", price: "", description: "" }), collection_id: data.id }));
      toast.success(`${data.name} is ready`);
      navigate("/products/new");
    } catch { toast.error("Collection could not be saved"); } finally { setSaving(false); }
  };
  return (
    <Shell user={user} onLogout={onLogout}>
      <div className="collection-page">
        <button className="back-button" data-testid="collection-back-button" onClick={() => navigate("/products/new")}><ArrowLeft size={16} />Back to product</button>
        <div className="collection-hero">
          <div className="collection-symbol"><Boxes size={28} /></div>
          <p className="eyebrow">RANGREZ / NEW COLLECTION</p>
          <h1 data-testid="collection-page-heading">Make a little room<br />for more of a good thing.</h1>
          <p className="subhead">Collections make your Rangrez catalog easier to browse, one thoughtful group at a time.</p>
        </div>
        <form className="collection-form" onSubmit={save}>
          <label>Collection name <Input data-testid="collection-name-input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Festive edit" /></label>
          <label>Description <Textarea data-testid="collection-description-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What ties these products together?" /></label>
          <div className="collection-actions">
            <button type="button" className="text-button" data-testid="collection-cancel-button" onClick={() => navigate("/products/new")}><X size={15} />Cancel</button>
            <Button type="submit" data-testid="save-collection-button" disabled={saving}>{saving ? "Saving…" : "Save collection"}<Check size={16} /></Button>
          </div>
        </form>
      </div>
    </Shell>
  );
}

function CollectionsPage({ user, onLogout }) {
  const [collections, setCollections] = useState([]);
  useEffect(() => { api.collections().then((r) => setCollections(r.data)).catch(() => {}); }, []);
  return (
    <Shell user={user} onLogout={onLogout}>
      <div className="page-heading">
        <div>
          <p className="eyebrow">RANGREZ / ORGANIZE</p>
          <h1 data-testid="collections-page-heading">All collections</h1>
          <p className="subhead">A place for every thread in your Rangrez catalog.</p>
        </div>
        <Link to="/collections/new" className="button-link" data-testid="collections-create-button"><Plus size={16} />New collection</Link>
      </div>
      <div className="collection-grid">
        {collections.length === 0 ? (
          <div className="empty-state" data-testid="collections-empty-state">
            <Boxes size={26} />
            <h2>No collections yet</h2>
            <p>Create one while adding your next product.</p>
            <Link to="/collections/new" data-testid="empty-create-collection-link">Create a collection <ChevronRight size={15} /></Link>
          </div>
        ) : collections.map((c) => (
          <article className="collection-card" key={c.id} data-testid={`collection-card-${c.id}`}>
            <div className="card-top"><div className="mini-symbol"><Boxes size={17} /></div><span>{c.product_count} products</span></div>
            <h2>{c.name}</h2>
            <p>{c.description || "A considered collection of your catalog."}</p>
          </article>
        ))}
      </div>
    </Shell>
  );
}

function LoginPage() {
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const signIn = () => {
    const redirectUrl = window.location.origin + "/products/new";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };
  return (
    <div className="login-page" data-testid="login-page">
      <div className="login-card">
        <div className="login-mark"><Sparkles size={22} /></div>
        <p className="eyebrow">RANGREZ / SIGN IN</p>
        <h1>Welcome to your Rangrez catalog.</h1>
        <p className="subhead">Sign in with Google to curate collections and add products.</p>
        <button type="button" className="google-button" onClick={signIn} data-testid="google-signin-button">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 32.4 29.3 35.5 24 35.5c-6.4 0-11.6-5.2-11.6-11.5S17.6 12.5 24 12.5c3 0 5.7 1.1 7.7 2.9l5.7-5.7C33.9 6.3 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.9 19 12.5 24 12.5c3 0 5.7 1.1 7.7 2.9l5.7-5.7C33.9 6.3 29.2 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/><path fill="#4CAF50" d="M24 43.5c5.1 0 9.7-1.9 13.2-5.1l-6.1-5c-2 1.5-4.5 2.4-7.1 2.4-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.1 16.2 43.5 24 43.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.1 4-3.8 5.3l6.1 5c-.4.4 6.4-4.7 6.4-14.3 0-1.2-.1-2.4-.4-3.5z"/></svg>
          Continue with Google
        </button>
        <p className="login-foot">By continuing you agree to the Rangrez catalog preview terms.</p>
      </div>
    </div>
  );
}

function AuthCallback({ onAuthed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const processed = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;
    const hash = location.hash || "";
    const match = hash.match(/session_id=([^&]+)/);
    if (!match) { navigate("/login"); return; }
    const sessionId = decodeURIComponent(match[1]);
    api.session(sessionId)
      .then(({ data }) => {
        window.history.replaceState(null, "", "/products/new");
        onAuthed(data);
        navigate("/products/new", { replace: true, state: { user: data } });
      })
      .catch(() => { setError("Could not sign you in. Please try again."); setTimeout(() => navigate("/login"), 1500); });
  }, [location.hash, navigate, onAuthed]);

  return (
    <div className="login-page" data-testid="auth-callback">
      <div className="login-card">
        <div className="login-mark"><Sparkles size={22} /></div>
        <h1>Signing you in…</h1>
        <p className="subhead">{error || "Just a moment while we open your catalog."}</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ user, loading, children }) {
  if (loading) return <div className="login-page"><div className="login-card"><h1>Loading…</h1></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRouter() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const hasSessionIdInHash = location.hash?.includes("session_id=");

  useEffect(() => {
    if (hasSessionIdInHash) { setLoading(false); return; }
    api.me()
      .then(({ data }) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [hasSessionIdInHash]);

  const handleLogout = async () => {
    try { await api.logout(); } catch { /* ignore */ }
    setUser(null);
    window.location.href = "/login";
  };

  if (hasSessionIdInHash) {
    return <AuthCallback onAuthed={(u) => { setUser(u); }} />;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/products/new" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute user={user} loading={loading}><ProductPage user={user} onLogout={handleLogout} /></ProtectedRoute>} />
      <Route path="/products/new" element={<ProtectedRoute user={user} loading={loading}><ProductPage user={user} onLogout={handleLogout} /></ProtectedRoute>} />
      <Route path="/collections" element={<ProtectedRoute user={user} loading={loading}><CollectionsPage user={user} onLogout={handleLogout} /></ProtectedRoute>} />
      <Route path="/collections/new" element={<ProtectedRoute user={user} loading={loading}><NewCollectionPage user={user} onLogout={handleLogout} /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" />
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </div>
  );
}

export default App;
