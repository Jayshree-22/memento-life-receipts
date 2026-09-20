import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	ArrowDownRight,
	ArrowUpRight,
	Camera,
	CalendarDays,
	ChevronRight,
	Film,
	MapPin,
	Menu,
	MessageCircle,
	Music2,
	Search,
	ShoppingBag,
	Sparkles,
	StickyNote,
	X,
} from 'lucide-react'
import {
	Area,
	AreaChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'
import { activityData, categories, receipts } from './data/receipts'

const iconMap = {
	Music: Music2,
	Movies: Film,
	Places: MapPin,
	Purchases: ShoppingBag,
	Photos: Camera,
	Messages: MessageCircle,
	Searches: Search,
	Events: CalendarDays,
	Notes: StickyNote,
}

const accents = {
	Music: 'violet', Movies: 'rose', Places: 'sage', Purchases: 'amber', Photos: 'coral',
	Messages: 'blue', Searches: 'lavender', Events: 'gold', Notes: 'mint',
}

const threadIds = [1, 2, 3, 4, 5]
const chapters = [
	{ number: '01', title: 'Late night energy', description: 'Your nights seem to have stories of their own.', ids: [1, 3, 4] },
	{ number: '02', title: 'Weekend escapes', description: 'Places, photos and moments that clustered around your weekends.', ids: [10, 11, 23] },
	{ number: '03', title: 'Things you kept coming back to', description: 'Recurring places, songs and interests across your receipts.', ids: [15, 20, 30] },
]

const formatDate = (date) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`))

function ReceiptIcon({ category, size = 18 }) {
	const Icon = iconMap[category] || Sparkles
	return <Icon size={size} strokeWidth={1.7} />
}

function Reveal({ children, delay = 0, className = '' }) {
	return (
		<motion.div
			className={className}
			initial={{ opacity: 0, y: 22 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, amount: 0.15 }}
			transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
		>{children}</motion.div>
	)
}

function Navbar({ onMenu }) {
	return <nav className="navbar">
		<a className="brand" href="#top" aria-label="Memento home"><span className="brand-mark">M</span><span>Memento</span></a>
		<div className="nav-links">
			<a href="#overview">Overview</a><a href="#receipts">Receipts</a><a href="#threads">Threads</a><a href="#chapters">Chapters</a>
		</div>
		<button className="mobile-menu" onClick={onMenu} aria-label="Open navigation"><Menu size={20} /></button>
		<a className="nav-status" href="#threads"><span className="status-dot" />Live archive <ArrowUpRight size={14} /></a>
	</nav>
}

function Hero() {
	const floating = [
		{ category: 'Music', title: 'Die With A Smile', meta: '23:42 / Park Street', className: 'float-card-one' },
		{ category: 'Photos', title: 'IMG_2847', meta: '00:06 / Park Street', className: 'float-card-two' },
		{ category: 'Purchases', title: 'Late Night Coffee', meta: '00:43 / Blue Tokai', className: 'float-card-three' },
		{ category: 'Messages', title: 'Good night ✦', meta: '00:51 / Messages', className: 'float-card-four' },
	]
	return <section className="hero" id="top">
		<div className="hero-orbit orbit-a" /><div className="hero-orbit orbit-b" />
		{floating.map((item, index) => <motion.div key={item.title} className={`floating-receipt ${item.className}`}
			initial={{ opacity: 0, y: 18, rotate: index % 2 ? 4 : -4 }} animate={{ opacity: 1, y: 0, rotate: index % 2 ? 3 : -3 }} transition={{ delay: 0.45 + index * 0.12, duration: 0.8 }}>
			<div className={`receipt-icon ${accents[item.category]}`}><ReceiptIcon category={item.category} /></div>
			<span className="eyebrow">{item.category}</span><strong>{item.title}</strong><small>{item.meta}</small>
		</motion.div>)}
		<div className="hero-content">
			<motion.p className="eyebrow hero-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>Memento <span>/</span> your digital life</motion.p>
			<motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}>Your life,<br /><em>in receipts.</em></motion.h1>
			<motion.p className="hero-copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>Your digital life is made of hundreds of tiny moments.<br />Memento finds the story hiding between them.</motion.p>
			<motion.div className="hero-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}><a href="#overview" className="button button-primary">Explore my life <ArrowDownRight size={17} /></a><span className="hero-note">9 categories <i /> hundreds of moments <i /> countless stories</span></motion.div>
		</div>
		<div className="hero-footer"><span>Digital archive / 2026</span><span className="scroll-cue">Scroll to remember <ArrowDownRight size={14} /></span><span>Made for the moments between</span></div>
	</section>
}

function SectionIntro({ eyebrow, title, description, id }) {
	return <div className="section-intro" id={id}><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{description && <p className="section-description">{description}</p>}</div>
}

function CategoryFilter({ selected, onSelect }) {
	return <div className="filter-row" role="tablist">{categories.map((category) => <button key={category} className={selected === category ? 'filter active' : 'filter'} onClick={() => onSelect(category)}>{category}</button>)}</div>
}

function ActivityChart() {
	return <div className="chart-wrap"><div className="chart-header"><div><span className="eyebrow">Pulse of the archive</span><strong>Activity over time</strong></div><span className="chart-total">+24% <ArrowUpRight size={14} /></span></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={activityData} margin={{ top: 10, right: 4, left: -25, bottom: 0 }}><defs><linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#dcb795" stopOpacity={0.35} /><stop offset="100%" stopColor="#dcb795" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#8f8a80', fontSize: 11 }} /><YAxis hide /><Tooltip contentStyle={{ background: '#26251f', border: '1px solid #4a483d', borderRadius: 8, color: '#f7f2e8' }} cursor={{ stroke: '#827d70' }} /><Area type="monotone" dataKey="receipts" stroke="#dcb795" strokeWidth={2} fill="url(#activityFill)" /></AreaChart></ResponsiveContainer></div></div>
}

function Overview() {
	return <section className="section overview-section" id="overview"><SectionIntro eyebrow="01 / the archive" title="The big picture" description="Before the story, there are the moments." /><div className="stats-grid">{[['36', 'Total receipts'], ['24', 'Active days'], ['09', 'Categories'], ['12', 'Connections']].map(([value, label], index) => <Reveal key={label} delay={index * 0.06}><div className="stat"><strong>{value}</strong><span>{label}</span><small>{index === 0 ? '+8 this week' : index === 3 ? 'waiting to be found' : 'since May 18, 2026'}</small></div></Reveal>)}</div><ActivityChart /></section>
}

function ReceiptCard({ receipt, onClick, compact = false }) {
	return <motion.button className={`receipt-card ${compact ? 'compact' : ''}`} onClick={() => onClick(receipt)} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}><div className="card-top"><div className={`receipt-icon ${accents[receipt.category]}`}><ReceiptIcon category={receipt.category} /></div><span className="eyebrow">{receipt.category}</span><ArrowUpRight className="card-arrow" size={16} /></div><div className="card-copy"><h3>{receipt.title}</h3><p>{receipt.description}</p></div><div className="card-meta"><span>{formatDate(receipt.date)}</span><span>{receipt.time}</span>{receipt.location && <span><MapPin size={12} /> {receipt.location}</span>}</div></motion.button>
}

function ReceiptModal({ receipt, onClose }) {
	if (!receipt) return null
	return <AnimatePresence><motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}><motion.div className="receipt-modal" initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }} onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label="Close receipt"><X size={18} /></button><div className={`modal-icon receipt-icon ${accents[receipt.category]}`}><ReceiptIcon category={receipt.category} size={24} /></div><span className="eyebrow">{receipt.category} / receipt {String(receipt.id).padStart(2, '0')}</span><h2>{receipt.title}</h2><p className="modal-description">{receipt.detail}</p><div className="modal-details"><span><strong>Date</strong>{formatDate(receipt.date)}</span><span><strong>Time</strong>{receipt.time}</span><span><strong>Where</strong>{receipt.location || 'Everywhere'}</span></div><div className="tag-list">{receipt.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div></motion.div></motion.div></AnimatePresence>
}

function ReceiptExplorer({ selectedCategory, onCategoryChange, onSelect }) {
	const [query, setQuery] = useState('')
	const filtered = receipts.filter((receipt) => (selectedCategory === 'All' || receipt.category === selectedCategory) && [receipt.title, receipt.category, receipt.description, receipt.location, receipt.date].join(' ').toLowerCase().includes(query.toLowerCase()))
	return <section className="section explorer-section" id="receipts"><SectionIntro eyebrow="02 / the details" title="Every moment leaves a receipt." description="Look closer. The ordinary is where the archive gets interesting." /><div className="explorer-tools"><CategoryFilter selected={selectedCategory} onSelect={onCategoryChange} /><label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your memories..." /><span>{filtered.length}</span></label></div><div className="receipt-grid">{filtered.map((receipt, index) => <Reveal key={receipt.id} delay={(index % 4) * 0.04}><ReceiptCard receipt={receipt} onClick={onSelect} /></Reveal>)}</div>{filtered.length === 0 && <div className="empty-state"><Sparkles size={20} /> No memories found.</div>}</section>
}

function MemoryThreads({ onSelect }) {
	const [thread, setThread] = useState([])
	const discover = () => setThread(threadIds.map((id) => receipts.find((receipt) => receipt.id === id)))
	return <section className="threads-section" id="threads"><div className="thread-glow" /><div className="thread-heading"><div><p className="eyebrow">03 / the connection</p><h2>Some moments<br /><em>belong together.</em></h2></div><div className="thread-copy"><p>Memento connects receipts that happened close together, revealing memories hidden inside your digital trail.</p><button className="button button-light" onClick={discover}>Discover a memory <Sparkles size={16} /></button></div></div><AnimatePresence mode="wait">{thread.length === 0 ? <motion.div key="empty" className="thread-placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><div className="placeholder-line"><span /><span /><span /><span /><span /></div><span>Five receipts are waiting to become a story</span></motion.div> : <motion.div key="thread" className="thread-reveal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><div className="thread-result-head"><div><span className="eyebrow">A discovered memory / June 14—15</span><h3>One moment.<br /><em>Five receipts.</em></h3></div><p>These receipts happened within the same evening, revealing a connected memory.</p></div><div className="thread-list">{thread.map((receipt, index) => <motion.div className="thread-step" key={receipt.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.12 }}><button onClick={() => onSelect(receipt)} className="thread-card"><span className={`thread-number ${accents[receipt.category]}`}>0{index + 1}</span><div className={`receipt-icon ${accents[receipt.category]}`}><ReceiptIcon category={receipt.category} /></div><div><span className="eyebrow">{receipt.category}</span><strong>{receipt.title}</strong></div><time>{receipt.time}</time><ChevronRight size={16} /></button>{index < thread.length - 1 && <div className="thread-connector"><span /></div>}</motion.div>)}</div><div className="thread-foot"><span><span className="status-dot" /> connected by time, place & feeling</span><button onClick={() => setThread([])}>Clear thread <X size={14} /></button></div></motion.div>}</AnimatePresence></section>
}

function LifeChapters({ onSelect }) {
	return <section className="section chapters-section" id="chapters"><SectionIntro eyebrow="04 / the pattern" title="Your life has chapters." description="Some patterns are too meaningful to be just statistics." /><div className="chapters-grid">{chapters.map((chapter, index) => <Reveal key={chapter.number} delay={index * 0.08}><article className={`chapter chapter-${index + 1}`}><div className="chapter-head"><span>{chapter.number}</span><ArrowUpRight size={17} /></div><h3>{chapter.title}</h3><p>{chapter.description}</p><div className="chapter-receipts">{chapter.ids.map((id) => { const receipt = receipts.find((item) => item.id === id); return <button key={id} onClick={() => onSelect(receipt)} className="mini-receipt"><span className={`receipt-icon ${accents[receipt.category]}`}><ReceiptIcon category={receipt.category} size={15} /></span><span>{receipt.title}</span><ArrowUpRight size={13} /></button> })}</div></article></Reveal>)}</div></section>
}

function Footer() {
	return <footer className="footer-cta"><p className="eyebrow">Memento / keep the good parts</p><h2>Data remembers.<br /><em>You just have to<br />connect it.</em></h2><p className="footer-copy">Memento turns scattered digital moments into stories worth remembering.</p><a className="button button-primary" href="#top">Explore again <ArrowUpRight size={17} /></a><div className="footer-bottom"><span>© 2026 Memento</span><span>Built from the little things</span><span>Back to top ↑</span></div></footer>
}

function App() {
	const [selectedCategory, setSelectedCategory] = useState('All')
	const [selectedReceipt, setSelectedReceipt] = useState(null)
	const [mobileNav, setMobileNav] = useState(false)
	return <div className="app-shell"><Navbar onMenu={() => setMobileNav(!mobileNav)} />{mobileNav && <div className="mobile-nav"><button onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={20} /></button><a href="#overview" onClick={() => setMobileNav(false)}>Overview</a><a href="#receipts" onClick={() => setMobileNav(false)}>Receipts</a><a href="#threads" onClick={() => setMobileNav(false)}>Threads</a><a href="#chapters" onClick={() => setMobileNav(false)}>Chapters</a></div>}<main><Hero /><Overview /><ReceiptExplorer selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} onSelect={setSelectedReceipt} /><MemoryThreads onSelect={setSelectedReceipt} /><LifeChapters onSelect={setSelectedReceipt} /><Footer /></main><ReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} /></div>
}

export default App
