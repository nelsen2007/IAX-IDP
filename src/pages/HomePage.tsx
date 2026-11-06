import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  UserPlus,
} from "lucide-react";
import { Button } from "../components/ui";
import { currentMember } from "../data/members";
export default function Home() {
  const reduced = useReducedMotion();
  const member = currentMember();
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
          {member && <div className="member-welcome">WELCOME, {member.name}</div>}
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
            {!member && <Button to="/register" secondary><UserPlus size={17} /> Daftar Member</Button>}
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
    </>
  );
}
