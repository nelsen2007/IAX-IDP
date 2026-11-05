import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  Car,
  ScanLine,
  ClipboardCheck,
  Headphones,
  UserPlus,
  FileCheck2,
  ChevronDown,
} from "lucide-react";
import { Button } from "../components/ui";
const features = [
  {
    icon: Car,
    title: "Kendaraan Terbaru",
    text: "Model dan varian terbaru dari berbagai brand ternama.",
  },
  {
    icon: ScanLine,
    title: "Spesifikasi Lengkap",
    text: "Kenali setiap detail. Temukan yang paling sesuai.",
  },
  {
    icon: ClipboardCheck,
    title: "Pemesanan Mudah",
    text: "Ajukan kendaraan pilihanmu, langsung secara online.",
  },
  {
    icon: Headphones,
    title: "Dibantu Sales",
    text: "Tim sales resmi siap menemani setiap langkahmu.",
  },
];
export default function Home() {
  const reduced = useReducedMotion();
  return (
    <>
      <section className="hero">
        <div className="hero-image" />
        <div className="hero-shade" />
        <div className="hero-topline">
          <span>
            <i /> THE AUTOMOTIVE EXPERIENCE
          </span>
          <span>INDOPRIDE ROLEPLAY / 2026</span>
        </div>
        <motion.div
          className="hero-copy"
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="eyebrow">
            <span />
            INDOPRIDE AUTO EXPO
          </div>
          <h1>
            IAX <em>2026</em>
            <span className="title-dot">.</span>
          </h1>
          <h2>“YANG PENTING ADA”</h2>
          <p>
            Panggung otomotif terbesar di INDOPRIDE.
            <br />
            Jelajahi kendaraan impian, kenali setiap detail,
            <br className="desktop-br" /> dan mulai perjalanan berikutnya di
            sini.
          </p>
          <div className="hero-buttons">
            <Button to="/vehicles">
              Jelajahi Kendaraan <ArrowUpRight size={19} />
            </Button>
            <Button to="/register" secondary>
              <UserPlus size={17} /> Daftar Member
            </Button>
          </div>
          <div className="hero-meta">
            <span className="mini-line" />
            Satu panggung. Beragam karakter. Tanpa batas.
          </div>
        </motion.div>
        <div className="hero-caption">
          <span>THE NEXT CHAPTER OF DRIVING</span>
          <b>
            Crafted for the streets.
            <br />
            Presented for you.
          </b>
          <span className="caption-line" />
        </div>
        <div className="hero-bottom">
          <a href="#experience" className="scroll-link">
            <span>
              <ChevronDown size={16} />
            </span>
            SCROLL TO EXPLORE
          </a>
          <div className="slide-indicator">
            <b>01</b>
            <span />
            03
          </div>
          <div className="hero-coordinate">
            EST. 2026 <span>•</span> LOS SANTOS
          </div>
        </div>
      </section>
      <section className="experience" id="experience">
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, text }, i) => (
            <div className="feature" key={title}>
              <div className="feature-top">
                <Icon size={25} strokeWidth={1.4} />
                <span>0{i + 1}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="journey">
        <div className="journey-heading">
          <span className="eyebrow">YOUR NEXT MOVE</span>
          <h2>
            Dari pilihan,
            <br />
            jadi perjalanan.
          </h2>
          <p>Alur singkat pemesanan di IAX 2026.</p>
        </div>
        <div className="journey-steps">
          {[
            {
              icon: UserPlus,
              title: "Daftar Member",
              text: "Mulai dengan identitasmu",
              to: "/register",
            },
            {
              icon: Car,
              title: "Pilih Kendaraan",
              text: "Temukan karakter berkendaramu",
              to: "/vehicles",
            },
            {
              icon: ClipboardCheck,
              title: "Ajukan Pemesanan",
              text: "Tentukan pilihan terbaikmu",
              to: "/vehicles",
            },
            {
              icon: FileCheck2,
              title: "Sales & SPK",
              text: "Kami bantu langkah selanjutnya",
              to: "/member/dashboard",
            },
          ].map(({ icon: Icon, title, text, to }, i) => (
            <Link to={to} key={title} className="journey-step">
              <span className="step-no">0{i + 1}</span>
              <Icon size={23} />
              <h3>{title}</h3>
              <p>{text}</p>
              {i < 3 && <ArrowRight className="step-arrow" size={17} />}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
