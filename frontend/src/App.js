import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Boxes, Check, ChevronRight, CirclePlus, Package, Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toaster, toast } from "@/components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = { collections: () => axios.get(`${API}/collections`), createCollection: (data) => axios.post(`${API}/collections`, data), createProduct: (data) => axios.post(`${API}/products`, data), products: () => axios.get(`${API}/products`) };

function Shell({ children }) {
  const location = useLocation();
  return <div className="app-shell"><aside className="sidebar"><Link to="/" className="brand" data-testid="brand-home"><span className="brand-mark"><Sparkles size={16}/></span><span>form & found</span></Link><nav><Link className={location.pathname === "/" ? "active" : ""} to="/" data-testid="nav-products"><Package size={17}/>Products</Link><Link className={location.pathname.includes("collection") ? "active" : ""} to="/collections" data-testid="nav-collections"><Boxes size={17}/>Collections</Link></nav><div className="sidebar-note"><div className="note-icon"><CirclePlus size={16}/></div><p><strong>Keep it together.</strong><br/>Organize your catalog as you go.</p></div></aside><main className="main-content">{children}</main></div>;
}

function ProductPage() {
  const [collections, setCollections] = useState([]); const [products, setProducts] = useState([]); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => JSON.parse(sessionStorage.getItem("product-draft") || "null") || { name: "", sku: "", price: "", description: "", collection_id: "" });
  const navigate = useNavigate();
  useEffect(() => { Promise.all([api.collections(), api.products()]).then(([c, p]) => { setCollections(c.data); setProducts(p.data); }).catch(() => toast.error("Could not load your catalog")).finally(() => setLoading(false)); }, []);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const openCollection = () => { sessionStorage.setItem("product-draft", JSON.stringify(form)); navigate("/collections/new"); };
  const submit = async (event) => { event.preventDefault(); if (!form.name.trim() || !form.price || Number(form.price) < 0) return toast.error("Add a product name and a valid price"); setSaving(true); try { await api.createProduct({ ...form, price: Number(form.price), collection_id: form.collection_id || null }); sessionStorage.removeItem("product-draft"); toast.success("Product added to your catalog"); setForm({ name: "", sku: "", price: "", description: "", collection_id: "" }); const p = await api.products(); setProducts(p.data); } catch { toast.error("Product could not be saved"); } finally { setSaving(false); } };
  return <Shell><div className="page-heading"><div><p className="eyebrow">CATALOG / NEW ENTRY</p><h1>Add a product</h1><p className="subhead">Give your next find a home in the catalog.</p></div><div className="header-stat"><span>{products.length}</span><small>products<br/>in catalog</small></div></div><form className="product-layout" onSubmit={submit}><section className="form-panel"><div className="section-label"><span>01</span><div><h2>Product details</h2><p>The essentials customers need to know.</p></div></div><label>Product name <Input data-testid="product-name-input" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Alpine wool blanket" /></label><div className="two-col"><label>SKU <Input data-testid="product-sku-input" value={form.sku} onChange={(e) => update("sku", e.target.value)} placeholder="Optional" /></label><label>Price <div className="price-input"><span>$</span><Input data-testid="product-price-input" type="number" min="0" step="0.01" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0.00" /></div></label></div><label>Description <Textarea data-testid="product-description-input" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="A short note about what makes it special..." /></label></section><aside className="form-side"><div className="section-label"><span>02</span><div><h2>Collection</h2><p>Where should this product live?</p></div></div><label className="select-label">Choose a collection <select data-testid="product-collection-select" value={form.collection_id} onChange={(e) => update("collection_id", e.target.value)} disabled={loading}><option value="">No collection</option>{collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}</select></label><button type="button" className="create-collection" data-testid="create-new-collection-button" onClick={openCollection}><span><Plus size={16}/></span>Create new collection <ChevronRight size={16}/></button><div className="form-actions"><Button type="submit" data-testid="create-product-button" disabled={saving}>{saving ? "Saving…" : "Create product"}<Check size={16}/></Button><button type="button" className="text-button" data-testid="clear-product-form-button" onClick={() => { sessionStorage.removeItem("product-draft"); setForm({ name: "", sku: "", price: "", description: "", collection_id: "" }); }}>Clear form</button></div></aside></form></Shell>;
}

function NewCollectionPage() {
  const navigate = useNavigate(); const [name, setName] = useState(""); const [description, setDescription] = useState(""); const [saving, setSaving] = useState(false);
  const save = async (event) => { event.preventDefault(); if (!name.trim()) return toast.error("Give your collection a name"); setSaving(true); try { const { data } = await api.createCollection({ name, description }); const draft = JSON.parse(sessionStorage.getItem("product-draft") || "null"); sessionStorage.setItem("product-draft", JSON.stringify({ ...(draft || { name: "", sku: "", price: "", description: "" }), collection_id: data.id })); toast.success(`${data.name} is ready`); navigate("/products/new"); } catch { toast.error("Collection could not be saved"); } finally { setSaving(false); } };
  return <Shell><div className="collection-page"><button className="back-button" data-testid="collection-back-button" onClick={() => navigate("/products/new")}><ArrowLeft size={16}/>Back to product</button><div className="collection-hero"><div className="collection-symbol"><Boxes size={28}/></div><p className="eyebrow">NEW COLLECTION</p><h1>Make a little room<br/>for more of a good thing.</h1><p className="subhead">Collections make your catalog easier to browse, one thoughtful group at a time.</p></div><form className="collection-form" onSubmit={save}><label>Collection name <Input data-testid="collection-name-input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Winter essentials" /></label><label>Description <Textarea data-testid="collection-description-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What ties these products together?" /></label><div className="collection-actions"><button type="button" className="text-button" data-testid="collection-cancel-button" onClick={() => navigate("/products/new")}><X size={15}/>Cancel</button><Button type="submit" data-testid="save-collection-button" disabled={saving}>{saving ? "Saving…" : "Save collection"}<Check size={16}/></Button></div></form></div></Shell>;
}

function CollectionsPage() { const [collections, setCollections] = useState([]); useEffect(() => { api.collections().then((r) => setCollections(r.data)); }, []); return <Shell><div className="page-heading"><div><p className="eyebrow">YOUR CATALOG / ORGANIZE</p><h1>All collections</h1><p className="subhead">A place for every thread in your catalog.</p></div><Link to="/collections/new" className="button-link" data-testid="collections-create-button"><Plus size={16}/>New collection</Link></div><div className="collection-grid">{collections.length === 0 ? <div className="empty-state" data-testid="collections-empty-state"><Boxes size={26}/><h2>No collections yet</h2><p>Create one while adding your next product.</p><Link to="/collections/new" data-testid="empty-create-collection-link">Create a collection <ChevronRight size={15}/></Link></div> : collections.map((collection) => <article className="collection-card" key={collection.id} data-testid={`collection-card-${collection.id}`}><div className="card-top"><div className="mini-symbol"><Boxes size={17}/></div><span>{collection.product_count} products</span></div><h2>{collection.name}</h2><p>{collection.description || "A considered collection of your catalog."}</p></article>)}</div></Shell>; }

function App() {
  return (
    <div className="App"><Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProductPage />} />
          <Route path="/products/new" element={<ProductPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/collections/new" element={<NewCollectionPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
