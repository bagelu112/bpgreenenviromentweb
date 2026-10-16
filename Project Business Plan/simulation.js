/**
 * RECHEMON - Interactive Horizontal Flowchart Plant Simulator
 * Features:
 * - 2-Line Horizontal Flowchart Layout (Line 1: Solid Residue Upcycling, Line 2: Water Coolant)
 * - Strict Bounded Canvas (Cannot overscroll into empty black void)
 * - Diverse Waste Characteristics: Customizable Waste Profiles & Sliders (Solid/Liquid Ratio & pH)
 * - Full Adaptive Cascading Effect:
 *   * Separator ratio & fill heights adapt to chosen input
 *   * SVG pipe flow colors reflect waste nature
 *   * AI-1 mineral analysis & recommended product options adapt
 *   * Mechanical reactor text & final output specs adapt
 *   * AI-2 chemical dosing percentages calculated live based on pH & pollutants
 *   * AI-3 coolant qualification & AI-4 final certification adapt
 * - Data Center Server AI cooling loop with real-time PUE and temperature
 */

(() => {
  'use strict';

  // =========================================================================
  // 🔑 KONFIGURASI API KEY GOOGLE GEMINI (AI PENGOLAHAN LIMBAH B3)
  // =========================================================================
  // TARUH API KEY GEMINI ANDA DI BAWAH INI (di dalam tanda kutip ""):
  const GEMINI_API_KEY = "sk-exEamhG0ZNXUgxsl7IIdnMzJAnT3JC6lv891m2ykxC6GDdpk"; // <-- Taruh Google Gemini API Key Anda di sini (harus diawali AIzaSy...)
  //
  // PANDUAN PENGGUNAAN:
  // 1. Dapatkan API Key Google Gemini gratis di: https://aistudio.google.com/app/apikey
  // 2. Anda dapat menaruh API Key di variabel GEMINI_API_KEY di atas, ATAU memasukkannya
  //    secara langsung melalui tombol "🔑 API Key AI" di antarmuka web (tersimpan di browser).
  // 3. Jika API Key belum diisi, simulator tetap berfungsi 100% menggunakan Mesin Pakar
  //    Cerdas Rekayasa Lingkungan (Expert Rule Engine) bawaan RECHEMON.
  // =========================================================================

  // --- Audio Synthesizer (Zero External Dependencies) ---
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx && typeof AudioContext !== 'undefined') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playTone(freq, type = 'sine', duration = 0.2, gainVal = 0.1) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // Audio error fallback
      }
    }

    click() { this.playTone(800, 'sine', 0.08, 0.05); }
    laserScan() {
      this.playTone(550, 'sawtooth', 0.4, 0.04);
      setTimeout(() => this.playTone(880, 'sine', 0.2, 0.05), 150);
    }
    chemicalReact() {
      this.playTone(320, 'triangle', 0.5, 0.08);
      setTimeout(() => this.playTone(440, 'sine', 0.4, 0.06), 200);
      setTimeout(() => this.playTone(660, 'sine', 0.3, 0.05), 400);
    }
    machineChug() {
      this.playTone(140, 'square', 0.3, 0.06);
      setTimeout(() => this.playTone(180, 'square', 0.25, 0.05), 180);
    }
    success() {
      this.playTone(523.25, 'sine', 0.2, 0.08);
      setTimeout(() => this.playTone(659.25, 'sine', 0.2, 0.08), 120);
      setTimeout(() => this.playTone(783.99, 'sine', 0.35, 0.1), 240);
    }
    alert() {
      this.playTone(400, 'sawtooth', 0.2, 0.08);
      setTimeout(() => this.playTone(300, 'sawtooth', 0.25, 0.08), 150);
    }
  }

  const sfx = new SoundEngine();

  // --- DIVERSE WASTE PROFILES DATA DICTIONARY ---
  const wasteProfiles = {
    electroplating: {
      name: 'Elektroplating Logam B3',
      label: '1. Elektroplating Nikel (Asam / Ni-Cr)',
      sludgeClass: 'sludge-electro',
      waterClass: 'dirty-electro',
      pipeSludgeColor: '#855b25',
      pipeWaterColor: '#0284c7',
      defaultRatio: 40, // 40% solid, 60% liquid
      defaultPh: 4.2,
      metals: '70.4 mg/L',
      cod: '240 mg/L',
      tds: '850 mg/L',
      silicaDisplay: '68.4 % (Tinggi)',
      ironDisplay: '8.2 % (Stabil)',
      metalsDisplay: '1.8 % (Inert terikat)',
      tclpDisplay: 'TCLP PASS (Aman)',
      ai1Title: 'Residu Padat: Sludge Logam Elektroplating B3',
      recommendation: 'Residu padat kaya akan prekursor geopolimer silika terikat ion logam bivalen. Sangat direkomendasikan dikonversi menjadi <strong>Semen Hijau Geopolimer</strong> untuk enkapsulasi kristal mikro logam berat secara permanen (Zero Leaching).',
      preferredProduct: 'semen',
      productSpecs: {
        semen: {
          title: 'Semen Hijau Geopolimer',
          desc: 'Green Geopolymer Binder',
          badge: '★ Rekomendasi Optimal AI-1',
          fullCard: `
            <div style="font-size:24px; margin-bottom:4px;">🏢</div>
            <strong style="color:#fbbf24; font-size:11px; display:block;">Semen Hijau Geopolimer</strong>
            <span style="font-size:9px; color:#94a3b8; display:block; margin-top:2px;">Kuat Tekan 38.5 MPa</span>
            <span style="font-size:9px; color:#00f59b;">TCLP Non-Toxic Pass (Enkapsulasi Logam)</span>`
        },
        bata: {
          title: 'Batu Bata Interlocking Logam',
          desc: 'Heavy-Duty Eco-Brick',
          badge: 'Alternatif Pilihan',
          fullCard: `
            <div style="font-size:24px; margin-bottom:4px;">🧱</div>
            <strong style="color:#fbbf24; font-size:11px; display:block;">Batu Bata Interlocking Logam</strong>
            <span style="font-size:9px; color:#94a3b8; display:block; margin-top:2px;">Kuat Tekan 24.0 MPa</span>
            <span style="font-size:9px; color:#00f59b;">Cold-Curing Press 200 Bar</span>`
        },
        kerikil: {
          title: 'Kerikil Agregat Lapisan Paving',
          desc: 'Synthetic Base Aggregate',
          badge: 'Alternatif Pilihan',
          fullCard: `
            <div style="font-size:24px; margin-bottom:4px;">🛣️</div>
            <strong style="color:#fbbf24; font-size:11px; display:block;">Kerikil Agregat Lapisan Paving</strong>
            <span style="font-size:9px; color:#94a3b8; display:block; margin-top:2px;">Gradasi 10-20mm (CBR > 90%)</span>
            <span style="font-size:9px; color:#00f59b;">Substitusi Batu Split Alam</span>`
        }
      },
      machineAction: 'Stabilisasi & Solidifikasi Geopolimer Logam...',
      ai2DosingGenerator: (ph) => {
        const naohPct = ph < 6.5 ? (2.8 - (ph - 2.0) * 0.25).toFixed(1) : '1.5';
        const total = (parseFloat(naohPct) + 1.8 + 0.8).toFixed(1);
        return {
          totalPct: total + ' %',
          recipes: [
            { name: 'Buffer Pengatur pH (NaOH 30%)', pct: naohPct + ' %', role: `Menaikkan pH asam ${ph.toFixed(1)} → 7.2 Netral` },
            { name: 'Koagulan Polyaluminium Chloride (PAC)', pct: '1.8 %', role: 'Flokulasi partikel logam berat tersuspensi' },
            { name: 'Adsorben Karbon Aktif Mikro', pct: '0.8 %', role: 'Menyerap trace ion Ni/Cr terlarut residual' }
          ]
        };
      },
      ai3Ec: '4.8 µS/cm',
      ai3Silica: '0.08 mg/L',
      ai3Explanation: 'AI-3 mengonfirmasi ion logam bivalen telah tereliminasi 99.8%. Konduktivitas listrik 4.8 µS/cm memenuhi toleransi pendingin chiller.',
      ai4PolishNote: 'Deionisasi Kation/Anion Logam Berat Residual'
    },

    textile: {
      name: 'Tekstil & Zat Pewarna',
      label: '2. Tekstil & Pewarna (Basa / COD Tinggi)',
      sludgeClass: 'sludge-textile',
      waterClass: 'dirty-textile',
      pipeSludgeColor: '#4c1d95',
      pipeWaterColor: '#6366f1',
      defaultRatio: 25, // 25% solid, 75% liquid
      defaultPh: 9.8,
      metals: '8.6 mg/L',
      cod: '1280 mg/L',
      tds: '1420 mg/L',
      silicaDisplay: '52.1 % (Sedang)',
      ironDisplay: '3.4 % (Rendah)',
      metalsDisplay: '0.4 % (Organik Dominan)',
      tclpDisplay: 'TCLP PASS (Organik Aman)',
      ai1Title: 'Residu Padat: Lumpur Serat Tekstil & Selulosa',
      recommendation: 'Lumpur mengandung serat selulosa halus dan pigmen organik berdensitas rendah. Sangat ideal dicetak menjadi <strong>Batu Bata Ringan Interlocking (Eco-Brick)</strong> atau Paving Ekologis dengan daya redam akustik dan insulasi termal prima.',
      preferredProduct: 'bata',
      productSpecs: {
        semen: {
          title: 'Semen Campuran Binder Ringan',
          desc: 'Lightweight Pozzolanic Binder',
          badge: 'Alternatif Pilihan',
          fullCard: `
            <div style="font-size:24px; margin-bottom:4px;">🏢</div>
            <strong style="color:#fbbf24; font-size:11px; display:block;">Semen Campuran Binder Ringan</strong>
            <span style="font-size:9px; color:#94a3b8; display:block; margin-top:2px;">Kuat Tekan 28.0 MPa</span>
            <span style="font-size:9px; color:#00f59b;">Plesteran Dinding Non-Struktural</span>`
        },
        bata: {
          title: 'Batu Bata Ringan Interlocking (Eco-Brick)',
          desc: 'Insulated Lightweight Eco-Brick',
          badge: '★ Rekomendasi Optimal AI-1',
          fullCard: `
            <div style="font-size:24px; margin-bottom:4px;">🧱</div>
            <strong style="color:#fbbf24; font-size:11px; display:block;">Batu Bata Ringan Interlocking</strong>
            <span style="font-size:9px; color:#94a3b8; display:block; margin-top:2px;">Kuat Tekan 26.5 MPa • Bobot 40% Lebih Ringan</span>
            <span style="font-size:9px; color:#00f59b;">Insulasi Termal 0.18 W/mK (Hemat Energi AC)</span>`
        },
        kerikil: {
          title: 'Paving Block Resapan Ekologis (Permeable)',
          desc: 'Porous Urban Drainage Paving',
          badge: 'Alternatif Pilihan',
          fullCard: `
            <div style="font-size:24px; margin-bottom:4px;">🛣️</div>
            <strong style="color:#fbbf24; font-size:11px; display:block;">Paving Block Resapan Ekologis</strong>
            <span style="font-size:9px; color:#94a3b8; display:block; margin-top:2px;">Infiltrasi Air 2.5 mm/detik</span>
            <span style="font-size:9px; color:#00f59b;">Ramah Lingkungan untuk Resapan Hujan</span>`
        }
      },
      machineAction: 'Homogenisasi Serat & Cold-Curing Hydraulic Press...',
      ai2DosingGenerator: (ph) => {
        const acidPct = ph > 7.0 ? (1.5 + (ph - 7.0) * 0.28).toFixed(1) : '1.0';
        const total = (parseFloat(acidPct) + 2.4 + 1.5).toFixed(1);
        return {
          totalPct: total + ' %',
          recipes: [
            { name: 'Netralisator Asam Sulfat (H₂SO₄)', pct: acidPct + ' %', role: `Menetralkan basa pH ${ph.toFixed(1)} → 7.0` },
            { name: 'Decolorant Polielektrolit Kationik', pct: '2.4 %', role: 'Memecah ikatan cincin zat warna sintetis' },
            { name: 'Koagulan PAC Organik', pct: '1.5 %', role: 'Flokulasi pengotor COD tinggi 1280 mg/L' }
          ]
        };
      },
      ai3Ec: '3.9 µS/cm',
      ai3Silica: '0.04 mg/L',
      ai3Explanation: 'AI-3 mengonfirmasi zat pewarna terdegradasi 99.9% dan transmisi cahaya 100%. Air jernih dan bebas busa untuk saluran pendingin.',
      ai4PolishNote: 'Penghilangan Residu Kromofor & Karbon Organik Trace'
    },

    mineral: {
      name: 'Semen & Mineral',
      label: '3. Semen & Mineral (Slurry Silika 84%)',
      sludgeClass: 'sludge-mineral',
      waterClass: 'dirty-mineral',
      pipeSludgeColor: '#71717a',
      pipeWaterColor: '#0ea5e9',
      defaultRatio: 65, // 65% solid, 35% liquid
      defaultPh: 11.4,
      metals: '14.2 mg/L',
      cod: '85 mg/L',
      tds: '1890 mg/L',
      silicaDisplay: '84.6 % (Ultra-Tinggi)',
      ironDisplay: '12.1 % (Aluminosilikat)',
      metalsDisplay: '0.9 % (Mineral Alam)',
      tclpDisplay: 'TCLP PASS (Non-B3 Inert)',
      ai1Title: 'Residu Padat: Slurry Silika Amorf Murni',
      recommendation: 'Kandungan silika aktif amorf mencapai 84.6% dengan rasio Si/Al superior! Ini adalah bahan baku emas untuk <strong>Semen Geopolimer Ultra-High Performance (UHPC)</strong> dengan kuat tekan ekstrem 48.5 MPa dan tahan zat kimia keras.',
      preferredProduct: 'semen',
      productSpecs: {
        semen: {
          title: 'Semen Geopolimer Ultra-High Performance (UHPC)',
          desc: 'Extreme-Strength Geopolymer Cement',
          badge: '★ Rekomendasi Optimal AI-1',
          fullCard: `
            <div style="font-size:24px; margin-bottom:4px;">🏢</div>
            <strong style="color:#fbbf24; font-size:11px; display:block;">Semen Geopolimer UHPC</strong>
            <span style="font-size:9px; color:#94a3b8; display:block; margin-top:2px;">Kuat Tekan Ekstrem 48.5 MPa</span>
            <span style="font-size:9px; color:#00f59b;">Ketahanan Asam Tinggi (Silika 84.6%)</span>`
        },
        bata: {
          title: 'Bata Silika Tahan Api & Gempa',
          desc: 'Refractory Silica Brick',
          badge: 'Alternatif Pilihan',
          fullCard: `
            <div style="font-size:24px; margin-bottom:4px;">🧱</div>
            <strong style="color:#fbbf24; font-size:11px; display:block;">Bata Silika Tahan Api & Gempa</strong>
            <span style="font-size:9px; color:#94a3b8; display:block; margin-top:2px;">Kuat Tekan 34.0 MPa • Tahan Suhu 650°C</span>
            <span style="font-size:9px; color:#00f59b;">Kepadatan Mikro-Struktur Maksimal</span>`
        },
        kerikil: {
          title: 'Kerikil Agregat Kasar Struktural High-Grade',
          desc: 'Class-A Concrete Coarse Aggregate',
          badge: 'Alternatif Pilihan',
          fullCard: `
            <div style="font-size:24px; margin-bottom:4px;">🛣️</div>
            <strong style="color:#fbbf24; font-size:11px; display:block;">Kerikil Agregat Kasar High-Grade</strong>
            <span style="font-size:9px; color:#94a3b8; display:block; margin-top:2px;">Ketahanan Aus Los Angeles < 18%</span>
            <span style="font-size:9px; color:#00f59b;">Standar Beton Bertulang Mutu Tinggi</span>`
        }
      },
      machineAction: 'Kalsinasi Termal 450°C & Aktivasi Alkali...',
      ai2DosingGenerator: (ph) => {
        const acidPct = ph > 7.0 ? (1.8 + (ph - 7.0) * 0.23).toFixed(1) : '1.2';
        const total = (parseFloat(acidPct) + 1.4 + 1.0).toFixed(1);
        return {
          totalPct: total + ' %',
          recipes: [
            { name: 'Buffer Asam Organik Lemah', pct: acidPct + ' %', role: `Menetralkan alkalinitas kuat pH ${ph.toFixed(1)} → 7.2` },
            { name: 'Flokulan Polimer Anionik Silika', pct: '1.4 %', role: 'Sedimentasi cepat partikel koloid silika' },
            { name: 'Anti-Scalant Silika Polifosfonat', pct: '1.0 %', role: 'Mencegah pembentukan kerak silika pada membran RO' }
          ]
        };
      },
      ai3Ec: '5.2 µS/cm',
      ai3Silica: '0.14 mg/L',
      ai3Explanation: '⚠️ PERINGATAN AI-3: Silika terlarut 0.14 mg/L terdeteksi (mendekati ambang batas). Sangat direkomendasikan mengalihkan air ke Tangki 4 (Penetral Tambahan) untuk pembersihan resin mixed-bed!',
      ai4PolishNote: 'Pembersihan Koloid Silika Mikro 100% (Anti-Kerak Server)'
    },

    petrochemical: {
      name: 'Kilang Petrokimia',
      label: '4. Kilang Petrokimia (Oli & Hidrokarbon)',
      sludgeClass: 'sludge-petro',
      waterClass: 'dirty-petro',
      pipeSludgeColor: '#1e3a1f',
      pipeWaterColor: '#059669',
      defaultRatio: 35, // 35% solid, 65% liquid
      defaultPh: 6.2,
      metals: '22.8 mg/L',
      cod: '950 mg/L',
      tds: '1120 mg/L',
      silicaDisplay: '44.2 % (Komposit Bitumen)',
      ironDisplay: '9.6 % (Stabil)',
      metalsDisplay: '2.1 % (Inert)',
      tclpDisplay: 'TCLP PASS (Terikat Matriks)',
      ai1Title: 'Residu Padat: Karbonat Bitumen & Sludge Aspal',
      recommendation: 'Residu kaya akan polimer bitumen berat dan fraksi mineral aspal alami. Paling unggul diolah menjadi <strong>Kerikil Agregat Aspal Modifikasi (Cold-Mix Paving)</strong> dengan fleksibilitas dan ketahanan beban gandar berat.',
      preferredProduct: 'kerikil',
      productSpecs: {
        semen: {
          title: 'Semen Modifikasi Hidrofobik Tahan Air',
          desc: 'Hydrophobic Water-Repellent Cement',
          badge: 'Alternatif Pilihan',
          fullCard: `
            <div style="font-size:24px; margin-bottom:4px;">🏢</div>
            <strong style="color:#fbbf24; font-size:11px; display:block;">Semen Modifikasi Hidrofobik</strong>
            <span style="font-size:9px; color:#94a3b8; display:block; margin-top:2px;">Kuat Tekan 32.0 MPa • Efek Daun Talas</span>
            <span style="font-size:9px; color:#00f59b;">Tahan Air Tanah & Garam Korosif</span>`
        },
        bata: {
          title: 'Bata Fondasi Kedap Air Bawah Tanah',
          desc: 'Underground Moisture-Proof Brick',
          badge: 'Alternatif Pilihan',
          fullCard: `
            <div style="font-size:24px; margin-bottom:4px;">🧱</div>
            <strong style="color:#fbbf24; font-size:11px; display:block;">Bata Kedap Air Bawah Tanah</strong>
            <span style="font-size:9px; color:#94a3b8; display:block; margin-top:2px;">Kuat Tekan 28.5 MPa • Porositas < 3%</span>
            <span style="font-size:9px; color:#00f59b;">Sempurna untuk Dinding Basemen & Kolam</span>`
        },
        kerikil: {
          title: 'Kerikil Agregat Aspal Modifikasi (Cold-Mix)',
          desc: 'Heavy-Duty Bitumen Modified Aggregate',
          badge: '★ Rekomendasi Optimal AI-1',
          fullCard: `
            <div style="font-size:24px; margin-bottom:4px;">🛣️</div>
            <strong style="color:#fbbf24; font-size:11px; display:block;">Kerikil Aspal Modifikasi</strong>
            <span style="font-size:9px; color:#94a3b8; display:block; margin-top:2px;">Stabilitas Marshall > 1200 kg</span>
            <span style="font-size:9px; color:#00f59b;">Tahan Beban Gandar Berat & Anti Deformasi</span>`
        }
      },
      machineAction: 'Termo-Stabilisasi 280°C & Modifikasi Polimer Bitumen...',
      ai2DosingGenerator: (ph) => {
        const demulsifierPct = '2.2 %';
        const carbonPct = '2.5 %';
        const coagPct = '1.3 %';
        const total = (2.2 + 2.5 + 1.3).toFixed(1);
        return {
          totalPct: total + ' %',
          recipes: [
            { name: 'De-emulsifier Non-Ionik & Pemecah Minyak', pct: demulsifierPct, role: 'Memecah emulsi minyak dalam air' },
            { name: 'Adsorben Nano Karbon Aktif', pct: carbonPct, role: 'Menyerap hidrokarbon aromatik & COD 950 mg/L' },
            { name: 'Koagulan Polimer Kationik', pct: coagPct, role: 'Pengikatan mikro-flok minyak & hidrokarbon' }
          ]
        };
      },
      ai3Ec: '4.1 µS/cm',
      ai3Silica: '0.05 mg/L',
      ai3Explanation: 'AI-3 mengonfirmasi indeks hidrokarbon bebas < 0.1 ppm. Emulsi minyak telah terurai 100%, sirkulasi pipa chiller terjamin steril.',
      ai4PolishNote: 'Deionisasi & Filtrasi Karbon Akhir Bebas Residu Hidrokarbon'
    }
  };

  // --- Simulator State Machine ---
  const state = {
    wastePoured: false,
    separated: false,
    activeBranch: 'overview', // 'overview', 'residue', 'water'

    // Waste Characteristic State
    selectedWasteProfile: 'electroplating',
    customSolidRatio: 40,
    customLiquidRatio: 60,
    customPh: 4.2,
    customMetals: '70.4 mg/L',
    customCod: '240 mg/L',
    customTds: '850 mg/L',

    // Residue Branch State
    residueInTank: false,
    ai1Scanned: false,
    selectedResidueProduct: 'semen', // 'semen', 'bata', 'kerikil'
    residueProcessing: false,
    residueCompleted: false,

    // Water Branch State
    waterInTank: false,
    ai2Formulated: false,
    waterDosed: false,
    waterSterilized: false,
    ai3Status: 'idle', // 'idle', 'evaluating', 'qualified', 'unqualified'
    secondaryPolishActive: false,
    ai4Certified: false,
    coolantInServer: false,

    // Camera & Zoom
    zoomLevel: 1.0,
    currentFocusedTank: null
  };

  // --- DOM References ---
  const track = document.getElementById('panoramicTrack');
  const container = document.getElementById('canvasContainer');
  const questText = document.getElementById('questText');
  const questBadge = document.getElementById('questBadge');

  // Waste Selector & Sliders
  const selectWasteProfile = document.getElementById('selectWasteProfile');
  const rangeSolidRatio = document.getElementById('rangeSolidRatio');
  const rangeWastePh = document.getElementById('rangeWastePh');
  const labelRatioValue = document.getElementById('labelRatioValue');
  const sublabelSolid = document.getElementById('sublabelSolid');
  const sublabelLiquid = document.getElementById('sublabelLiquid');
  const labelPhValue = document.getElementById('labelPhValue');
  const wasteTelePh = document.getElementById('wasteTelePh');
  const wasteTeleMetals = document.getElementById('wasteTeleMetals');
  const wasteTeleCod = document.getElementById('wasteTeleCod');
  const labelSludgeRatio = document.getElementById('labelSludgeRatio');
  const labelWaterRatio = document.getElementById('labelWaterRatio');

  // Tanks & Liquids
  const tankRaw = document.getElementById('tankRawLiquid');
  const centrifuge = document.getElementById('centrifugeDisk');
  const pipeSludgeFlow = document.getElementById('pipeSludgeFlow');
  const pipeWaterFlow = document.getElementById('pipeWaterFlow');
  const tankResidueLiquid = document.getElementById('tankResidueLiquid');
  const tankWaterLiquid = document.getElementById('tankWaterLiquid');
  const tankSterilLiquid = document.getElementById('tankSterilLiquid');
  const tankPolishLiquid = document.getElementById('tankPolishLiquid');
  const serverCoolantFill = document.getElementById('serverCoolantFill');

  // Connectors & Manifold
  const arrowResidueToMachine = document.getElementById('arrowResidueToMachine');
  const arrowMachineToProduct = document.getElementById('arrowMachineToProduct');
  const arrowWaterToSteril = document.getElementById('arrowWaterToSteril');
  const pipeSteril1To2 = document.getElementById('pipeSteril1To2');
  const conduitSterilReroute = document.getElementById('conduitSterilReroute');
  const arrowSteril1ToServer = document.getElementById('arrowSteril1ToServer');
  const arrowPolishToServer = document.getElementById('arrowPolishToServer');

  // Scanner Lasers
  const laserAI1 = document.getElementById('laserAI1');
  const laserAI3 = document.getElementById('laserAI3');
  const laserAI4 = document.getElementById('laserAI4');

  // Buttons & Controls
  const btnPour = document.getElementById('btnPourWaste');
  const btnSeparate = document.getElementById('btnSeparate');
  const btnResidueBranch = document.getElementById('btnBranchResidue');
  const btnWaterBranch = document.getElementById('btnBranchWater');
  const btnReset = document.getElementById('btnResetSim');
  const btnSound = document.getElementById('btnToggleSound');
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnZoomReset = document.getElementById('btnZoomReset');
  const btnHudApiKey = document.getElementById('btnHudApiKey');

  // Modals & AI Advisor Elements
  const modalAI1 = document.getElementById('modalAI1');
  const modalAI2 = document.getElementById('modalAI2');
  const modalAI3 = document.getElementById('modalAI3');
  const modalAI4 = document.getElementById('modalAI4');
  const modalResidueAiSolver = document.getElementById('modalResidueAiSolver');
  const btnOpenAiResidueSolver = document.getElementById('btnOpenAiResidueSolver');
  const btnOpenAiFromModalAI1 = document.getElementById('btnOpenAiFromModalAI1');

  // AI Hazardous Waste Advisor Inputs
  const inputGeminiApiKey = document.getElementById('inputGeminiApiKey');
  const btnSaveApiKey = document.getElementById('btnSaveApiKey');
  const btnClearApiKey = document.getElementById('btnClearApiKey');
  const geminiKeyStatusBadge = document.getElementById('geminiKeyStatusBadge');
  const wastePresetChips = document.querySelectorAll('#wastePresetChips .preset-chip');
  const aiWastePromptInput = document.getElementById('aiWastePromptInput');
  const btnRunAiWasteAnalysis = document.getElementById('btnRunAiWasteAnalysis');
  const aiResultsContainer = document.getElementById('aiResultsContainer');
  const aiResultsLoading = document.getElementById('aiResultsLoading');
  const aiResultsContent = document.getElementById('aiResultsContent');

  // --- Dynamic Waste Adaptation Controller ---
  function getActiveProfile() {
    return wasteProfiles[state.selectedWasteProfile] || wasteProfiles.electroplating;
  }

  function updatePhBadge(ph) {
    labelPhValue.textContent = `pH ${ph.toFixed(1)}`;
    labelPhValue.classList.remove('ph-badge-acid', 'ph-badge-neutral', 'ph-badge-base');
    if (ph < 6.5) {
      labelPhValue.classList.add('ph-badge-acid');
    } else if (ph > 8.0) {
      labelPhValue.classList.add('ph-badge-base');
    } else {
      labelPhValue.classList.add('ph-badge-neutral');
    }
  }

  function applyWasteProfile(profileKey) {
    state.selectedWasteProfile = profileKey;
    const profile = getActiveProfile();

    // Sync sliders and telemetry to profile defaults
    if (profileKey !== 'custom') {
      state.customSolidRatio = profile.defaultRatio;
      state.customLiquidRatio = 100 - profile.defaultRatio;
      state.customPh = profile.defaultPh;
      state.customMetals = profile.metals;
      state.customCod = profile.cod;
      state.customTds = profile.tds;

      if (rangeSolidRatio) rangeSolidRatio.value = profile.defaultRatio;
      if (rangeWastePh) rangeWastePh.value = profile.defaultPh;
    }

    // Update UI Labels
    if (labelRatioValue) labelRatioValue.textContent = `${state.customSolidRatio}% : ${state.customLiquidRatio}%`;
    if (sublabelSolid) sublabelSolid.textContent = `${state.customSolidRatio}%`;
    if (sublabelLiquid) sublabelLiquid.textContent = `${state.customLiquidRatio}%`;
    if (labelWaterRatio) labelWaterRatio.textContent = `↖ Filtrat (${state.customLiquidRatio}%)`;
    if (labelSludgeRatio) labelSludgeRatio.textContent = `↙ Residu (${state.customSolidRatio}%)`;
    if (wasteTelePh) wasteTelePh.textContent = state.customPh.toFixed(1);
    if (wasteTeleMetals) wasteTeleMetals.textContent = state.customMetals;
    if (wasteTeleCod) wasteTeleCod.textContent = state.customCod;

    updatePhBadge(state.customPh);

    // Update Step 1 Liquid appearance
    if (tankRaw) {
      tankRaw.className = `liquid-layer ${profile.sludgeClass}`;
    }

    // Update product choices cards in Modal 1 preview
    updateProductModalCards(profile);
  }

  function updateProductModalCards(profile) {
    const specs = profile.productSpecs;
    const optTitleSemen = document.getElementById('optTitleSemen');
    const optDescSemen = document.getElementById('optDescSemen');
    const badgeOptSemen = document.getElementById('badgeOptSemen');

    const optTitleBata = document.getElementById('optTitleBata');
    const optDescBata = document.getElementById('optDescBata');
    const badgeOptBata = document.getElementById('badgeOptBata');

    const optTitleKerikil = document.getElementById('optTitleKerikil');
    const optDescKerikil = document.getElementById('optDescKerikil');
    const badgeOptKerikil = document.getElementById('badgeOptKerikil');

    if (optTitleSemen && specs.semen) optTitleSemen.textContent = specs.semen.title;
    if (optDescSemen && specs.semen) optDescSemen.textContent = specs.semen.desc;
    if (optTitleBata && specs.bata) optTitleBata.textContent = specs.bata.title;
    if (optDescBata && specs.bata) optDescBata.textContent = specs.bata.desc;
    if (optTitleKerikil && specs.kerikil) optTitleKerikil.textContent = specs.kerikil.title;
    if (optDescKerikil && specs.kerikil) optDescKerikil.textContent = specs.kerikil.desc;

    // Recommendation badge visibility
    if (badgeOptSemen) badgeOptSemen.style.display = (profile.preferredProduct === 'semen') ? 'inline-block' : 'none';
    if (badgeOptBata) badgeOptBata.style.display = (profile.preferredProduct === 'bata') ? 'inline-block' : 'none';
    if (badgeOptKerikil) badgeOptKerikil.style.display = (profile.preferredProduct === 'kerikil') ? 'inline-block' : 'none';

    // Highlight preferred product card by default
    state.selectedResidueProduct = profile.preferredProduct;
    document.querySelectorAll('.product-option-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.product === profile.preferredProduct);
    });
  }

  // Event Listeners for Adaptive Waste Configuration
  if (selectWasteProfile) {
    selectWasteProfile.addEventListener('change', (e) => {
      sfx.click();
      const val = e.target.value;
      if (val !== 'custom') {
        applyWasteProfile(val);
      }
    });
  }

  if (rangeSolidRatio) {
    rangeSolidRatio.addEventListener('input', (e) => {
      state.customSolidRatio = parseInt(e.target.value, 10);
      state.customLiquidRatio = 100 - state.customSolidRatio;

      labelRatioValue.textContent = `${state.customSolidRatio}% : ${state.customLiquidRatio}%`;
      sublabelSolid.textContent = `${state.customSolidRatio}%`;
      sublabelLiquid.textContent = `${state.customLiquidRatio}%`;
      labelWaterRatio.textContent = `↖ Filtrat (${state.customLiquidRatio}%)`;
      labelSludgeRatio.textContent = `↙ Residu (${state.customSolidRatio}%)`;

      // Select dropdown shifts to custom indicator
      if (selectWasteProfile && selectWasteProfile.value !== 'custom') {
        selectWasteProfile.value = 'custom';
      }
    });
  }

  if (rangeWastePh) {
    rangeWastePh.addEventListener('input', (e) => {
      state.customPh = parseFloat(e.target.value);
      wasteTelePh.textContent = state.customPh.toFixed(1);
      updatePhBadge(state.customPh);

      if (selectWasteProfile && selectWasteProfile.value !== 'custom') {
        selectWasteProfile.value = 'custom';
      }
    });
  }

  // --- Pan & Zoom Controls with Strict Bounds ---
  function updateZoom(newZoom) {
    state.zoomLevel = Math.max(0.8, Math.min(1.5, newZoom));
    track.style.transform = `scale(${state.zoomLevel})`;
    document.getElementById('zoomDisplay').textContent = `${Math.round(state.zoomLevel * 100)}%`;
  }

  function panToUnit(unitId) {
    const el = document.getElementById(unitId);
    if (!el) return;

    document.querySelectorAll('.plant-unit').forEach(u => u.classList.remove('active-focus'));
    el.classList.add('active-focus');
    state.currentFocusedTank = unitId;

    const rect = el.getBoundingClientRect();
    const cRect = container.getBoundingClientRect();
    const currentScroll = container.scrollLeft;

    // Center offset strictly bounded between 0 and maxScroll
    let targetScroll = currentScroll + (rect.left - cRect.left) - (cRect.width / 2) + (rect.width / 2);
    const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
    targetScroll = Math.max(0, Math.min(maxScroll, targetScroll));

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });

    sfx.click();
    updateMiniMapActive(unitId);
  }

  function updateMiniMapActive(unitId) {
    document.querySelectorAll('.minimap-station').forEach(btn => {
      btn.classList.toggle('current-pos', btn.dataset.target === unitId);
    });
  }

  // --- Drag to Scroll & Wheel Scroll with Strict Boundary Clamping ---
  let isDragging = false;
  let startX = 0;
  let scrollLeft = 0;

  container.addEventListener('mousedown', (e) => {
    if (e.target.closest('button, select, input, .clickable-tank, .holo-modal-card')) return;
    isDragging = true;
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
  });

  window.addEventListener('mouseup', () => { isDragging = false; });

  container.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.3;
    const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
    container.scrollLeft = Math.max(0, Math.min(maxScroll, scrollLeft - walk));
  });

  container.addEventListener('wheel', (e) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
      const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
      const nextScroll = container.scrollLeft + e.deltaY * 1.1;
      container.scrollLeft = Math.max(0, Math.min(maxScroll, nextScroll));
    }
  }, { passive: false });

  window.addEventListener('keydown', (e) => {
    const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
    if (e.key === 'ArrowRight') container.scrollLeft = Math.min(maxScroll, container.scrollLeft + 140);
    if (e.key === 'ArrowLeft') container.scrollLeft = Math.max(0, container.scrollLeft - 140);
  });

  // --- Step 1: Pour Raw Waste ---
  btnPour.addEventListener('click', () => {
    if (state.wastePoured) return;
    sfx.chemicalReact();
    btnPour.disabled = true;
    btnPour.innerHTML = `Menuangkan...`;

    // Lock selector & sliders while processing
    if (selectWasteProfile) selectWasteProfile.disabled = true;
    if (rangeSolidRatio) rangeSolidRatio.disabled = true;
    if (rangeWastePh) rangeWastePh.disabled = true;

    setTimeout(() => {
      tankRaw.style.height = '82%';
      state.wastePoured = true;
      btnPour.textContent = '✓ Limbah Terisi';
      btnSeparate.disabled = false;

      const p = getActiveProfile();
      questBadge.textContent = 'TAHAP 2';
      questText.innerHTML = `Limbah <strong>${p.name}</strong> masuk! Klik <strong>"Jalankan Separator"</strong> untuk memecah (${state.customSolidRatio}% Padat : ${state.customLiquidRatio}% Cair).`;
      sfx.success();
    }, 700);
  });

  // --- Step 2: Separate Solid & Liquid into 2 Flowchart Lines with Cascading Ratios ---
  btnSeparate.addEventListener('click', () => {
    if (!state.wastePoured || state.separated) return;
    sfx.machineChug();
    btnSeparate.disabled = true;
    btnSeparate.innerHTML = `Menyaring...`;

    panToUnit('unitCentrifuge');
    centrifuge.classList.add('spinning');

    const profile = getActiveProfile();

    setTimeout(() => {
      tankRaw.style.height = '18%';

      // Water (UP - Row 1) and Sludge (DOWN - Row 2) pipes activate in fork junction with profile colors
      pipeWaterFlow.style.stroke = profile.pipeWaterColor;
      pipeSludgeFlow.style.stroke = profile.pipeSludgeColor;
      pipeWaterFlow.classList.add('flowing');
      pipeSludgeFlow.classList.add('flowing');

      // Tank fill heights accurately calculate from user's ratio
      const sludgeFillHeight = Math.round(20 + (state.customSolidRatio / 100) * 60);
      const waterFillHeight = Math.round(20 + (state.customLiquidRatio / 100) * 60);

      tankWaterLiquid.className = `liquid-layer ${profile.waterClass}`;
      tankWaterLiquid.style.height = `${waterFillHeight}%`;

      tankResidueLiquid.className = `liquid-layer ${profile.sludgeClass}`;
      tankResidueLiquid.style.height = `${sludgeFillHeight}%`;

      state.separated = true;
      state.residueInTank = true;
      state.waterInTank = true;
      centrifuge.classList.remove('spinning');

      btnSeparate.textContent = `✓ Terpisah (${state.customLiquidRatio}% Air : ${state.customSolidRatio}% Residu)`;
      sfx.success();

      // Enable branch switchers
      btnWaterBranch.classList.add('active');
      btnResidueBranch.classList.add('active');

      questBadge.textContent = 'PILIHAN JALUR';
      questText.innerHTML = `Pemisahan selesai! <strong>${state.customLiquidRatio}% Filtrat Air</strong> naik ke Jalur 1 (Atas), <strong>${state.customSolidRatio}% Residu Padat</strong> turun ke Jalur 2 (Bawah).`;

      // Auto prompt user to explore Jalur 1 or Jalur 2
      setTimeout(() => {
        panToUnit('unitWaterTank');
      }, 1000);

    }, 1500);
  });

  // --- Branch Focus Handlers ---
  btnWaterBranch.addEventListener('click', () => {
    state.activeBranch = 'water';
    btnWaterBranch.classList.add('active');
    btnResidueBranch.classList.remove('active');
    panToUnit('unitWaterTank');
    sfx.click();

    questBadge.textContent = 'JALUR 1: AIR & COOLANT';
    questText.innerHTML = 'Fokus Jalur 1 (Air & Coolant AI): <strong>Klik air di dalam tangki</strong> untuk uji lab & formula dosis AI-2.';
  });

  btnResidueBranch.addEventListener('click', () => {
    state.activeBranch = 'residue';
    btnResidueBranch.classList.add('active');
    btnWaterBranch.classList.remove('active');
    panToUnit('unitResidueTank');
    sfx.click();

    questBadge.textContent = 'JALUR 2: RESIDU PADAT';
    questText.innerHTML = 'Fokus Jalur 2 (Residu Padat): Pindai ampas dengan <strong>AI-1</strong> untuk material konstruksi, atau gunakan <strong>✨ Solusi AI</strong> jika limbah tidak layak untuk paving block.';
  });

  // ==========================================================================
  // JALUR 2: RESIDU PADAT (BOTTOM ROW: AI-1 -> MESIN MEKANIKAL -> PRODUK JADI)
  // ==========================================================================

  function showAiLoadingBadge(elId, text = '🤖 Kalkulasi Gemini...') {
    const el = document.getElementById(elId);
    if (el) el.innerHTML = `<span style="color:#38bdf8; font-style:italic;">${text}</span>`;
  }

  function triggerAI1ResidueScan() {
    if (!state.residueInTank) return;
    panToUnit('unitResidueTank');
    sfx.laserScan();
    laserAI1.classList.add('active');

    const profile = getActiveProfile();

    setTimeout(async () => {
      laserAI1.classList.remove('active');

      // Pre-fill modal with loading indicators then open immediately
      document.getElementById('ai1ModalTitle').textContent = profile.ai1Title;
      showAiLoadingBadge('ai1SilicaDisplay');
      showAiLoadingBadge('ai1IronDisplay');
      showAiLoadingBadge('ai1MetalsDisplay');
      showAiLoadingBadge('ai1TclpDisplay', '🤖 Menganalisis TCLP...');
      document.getElementById('ai1RecommendationText').innerHTML =
        '<span style="color:#38bdf8; font-style:italic;">⏳ Gemini AI sedang menganalisis karakteristik mineral residu padat...</span>';
      updateProductModalCards(profile);
      openModal(modalAI1);
      state.ai1Scanned = true;

      // Fetch from Gemini, fallback to static profile data
      let ai1 = null;
      try {
        ai1 = await generateAI1Analysis(profile, state.customSolidRatio);
      } catch (err) {
        console.info('[AI-1] Gemini tidak tersedia, fallback ke data profil statis:', err.message);
      }

      if (ai1) {
        document.getElementById('ai1SilicaDisplay').textContent = ai1.silicaDisplay || profile.silicaDisplay;
        document.getElementById('ai1IronDisplay').textContent = ai1.ironDisplay || profile.ironDisplay;
        document.getElementById('ai1MetalsDisplay').textContent = ai1.metalsDisplay || profile.metalsDisplay;
        document.getElementById('ai1TclpDisplay').textContent = ai1.tclpDisplay || profile.tclpDisplay;
        document.getElementById('ai1RecommendationText').innerHTML =
          `<strong>Hasil Analisis Sensor AI-1 (Gemini Real-Time):</strong><br>${ai1.recommendation || profile.recommendation}
          <div style="margin-top:5px; font-size:9px; color:#00d2ff; text-align:right;">⚡ Dikalkulasi oleh Google Gemini 2.0 Flash secara real-time</div>`;
        if (ai1.preferredProduct && ['semen', 'bata', 'kerikil'].includes(ai1.preferredProduct)) {
          state.selectedResidueProduct = ai1.preferredProduct;
          document.querySelectorAll('.product-option-card').forEach(c => c.classList.remove('selected'));
          const preferred = document.querySelector(`.product-option-card[data-product="${ai1.preferredProduct}"]`);
          if (preferred) preferred.classList.add('selected');
        }
        if (ai1.machineAction) state.aiMachineAction = ai1.machineAction;
      } else {
        document.getElementById('ai1SilicaDisplay').textContent = profile.silicaDisplay;
        document.getElementById('ai1IronDisplay').textContent = profile.ironDisplay;
        document.getElementById('ai1MetalsDisplay').textContent = profile.metalsDisplay;
        document.getElementById('ai1TclpDisplay').textContent = profile.tclpDisplay;
        document.getElementById('ai1RecommendationText').innerHTML =
          `<strong>Hasil Analisis Sensor AI-1:</strong><br>${profile.recommendation}`;
        updateProductModalCards(profile);
      }
      sfx.success();
    }, 1200);
  }

  document.getElementById('btnScanResidueManual').addEventListener('click', triggerAI1ResidueScan);

  // Residue Product Selection in Modal
  document.querySelectorAll('.product-option-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.product-option-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.selectedResidueProduct = card.dataset.product;
      sfx.click();
    });
  });

  // Confirm Residue Choice & Send to Mechanical Machine
  document.getElementById('btnConfirmResidueAI').addEventListener('click', () => {
    closeModal(modalAI1);
    panToUnit('unitMechanicalMachine');
    sfx.machineChug();

    const profile = getActiveProfile();
    const machineStatus = document.getElementById('machineStatusText');
    const machineGear = document.getElementById('machineGear');
    const showcaseContent = document.getElementById('productShowcaseContent');

    if (arrowResidueToMachine) arrowResidueToMachine.classList.add('flowing');
    machineStatus.textContent = profile.machineAction;
    machineGear.classList.add('spinning');

    state.residueProcessing = true;
    tankResidueLiquid.style.height = '12%'; // Transferred to machine

    setTimeout(() => {
      machineGear.classList.remove('spinning');
      machineStatus.innerHTML = `✓ Selesai Dicetak`;
      state.residueCompleted = true;
      if (arrowMachineToProduct) arrowMachineToProduct.classList.add('flowing');
      sfx.success();

      // Show Final Product Card tailored to profile & selected option
      const currentProductSpec = profile.productSpecs[state.selectedResidueProduct];
      if (currentProductSpec) {
        showcaseContent.innerHTML = currentProductSpec.fullCard;
      }
      panToUnit('unitProductShowcase');

      questBadge.textContent = 'RESIDU SELESAI';
      questText.innerHTML = `Sukses! Residu berhasil diolah menjadi <strong>${currentProductSpec.title}</strong>. Sekarang periksa <strong>Jalur 1: Air & Coolant (Atas)</strong>!`;

      btnWaterBranch.classList.add('active');
    }, 2000);
  });

  // ==========================================================================
  // JALUR 1: FILTRASI AIR & AI COOLANT DATA CENTER (TOP ROW)
  // ==========================================================================

  // Interactive Click on Water in Tank
  const clickWaterArea = document.getElementById('clickableWaterArea');
  clickWaterArea.addEventListener('click', async () => {
    if (!state.waterInTank) {
      alert('Jalankan pemisahan limbah pada tombol Tahap 2 terlebih dahulu!');
      return;
    }
    sfx.laserScan();

    const profile = getActiveProfile();
    const recipeContainer = document.getElementById('ai2RecipeList');
    const provLabel = getActiveProviderLabel();

    // Show thinking window BEFORE the modal so user sees feedback immediately
    showAiThinkingWindow('AI menghitung formula dosis reaktan kimia presisi...', provLabel);

    // Show modal immediately with loading state
    document.getElementById('ai2ModalTitle').textContent = `Uji Laboratorium & Resep Reaktan AI-2 (${profile.name})`;
    document.getElementById('ai2PhDisplay').textContent = `pH ${state.customPh.toFixed(1)}`;
    document.getElementById('ai2PhDisplay').style.color = (state.customPh < 6.5) ? '#f87171' : ((state.customPh > 8.0) ? '#c084fc' : '#38bdf8');
    document.getElementById('ai2TdsDisplay').textContent = state.customTds;
    document.getElementById('ai2MetalsDisplay').textContent = state.customMetals;
    document.getElementById('ai2CodDisplay').textContent = state.customCod;

    recipeContainer.innerHTML = `<div style="text-align:center; padding:20px; color:#38bdf8;">
      <div style="font-size:20px; animation:spin 1s linear infinite; display:inline-block;">⚙️</div>
      <div style="margin-top:8px; font-size:11px;">AI sedang menghitung formula dosis reaktan yang optimal...</div>
    </div>`;

    openModal(modalAI2);

    // Try multi-provider AI for AI-2 formula
    let dosingData = null;
    let fromGemini = false;
    try {
      const ai2 = await generateAI2Formula(profile, state.customPh, state.customMetals, state.customCod, state.customTds);
      if (ai2 && Array.isArray(ai2.recipes) && ai2.recipes.length >= 3) {
        dosingData = ai2;
        fromGemini = true;
      }
    } catch (err) {
      console.info('[AI-2] AI tidak tersedia, fallback ke rule engine profil:', err.message);
    }
    hideAiThinkingWindow();

    // Fallback to profile rule engine
    if (!dosingData) {
      dosingData = profile.ai2DosingGenerator(state.customPh);
    }

    // Store last dosing for reagent injector
    state.lastDosingData = dosingData;

    const srcLabel = fromGemini
      ? `<span style="background:rgba(0,245,155,0.2); color:#00f59b; font-size:9px; padding:2px 6px; border-radius:4px;">${provLabel}</span>`
      : '<span style="background:rgba(56,189,248,0.15); color:#38bdf8; font-size:9px; padding:2px 6px; border-radius:4px;">🧠 Mesin Pakar RECHEMON</span>';

    let recipeHtml = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid rgba(0,210,255,0.25); padding-bottom:4px;">
        <strong style="color:#00d2ff;">Formula Injeksi Dosis Presisi AI-2:</strong>
        <div style="display:flex; gap:6px; align-items:center;">
          ${srcLabel}
          <span style="background:rgba(0,210,255,0.2); color:#00d2ff; font-family:var(--font-mono); font-size:10px; padding:2px 6px; border-radius:4px; font-weight:700;">Total: ${dosingData.totalPct}</span>
        </div>
      </div>
      <div style="display:flex; flex-direction:column; gap:6px;">`;

    dosingData.recipes.forEach((item, index) => {
      recipeHtml += `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:4px 8px; border-radius:4px;">
          <div>
            <span style="color:#e2e8f0; font-weight:600; font-size:11px;">${index + 1}. ${item.name}</span>
            <small style="display:block; color:#94a3b8; font-size:9px;">${item.role}</small>
          </div>
          <strong style="color:#00d2ff; font-family:var(--font-mono); font-size:11px;">${item.pct}</strong>
        </div>`;
    });

    const noteText = dosingData.note || `Algoritma AI-2 secara otomatis menghitung volume penambahan kimia teroptimasi untuk meminimalkan lumpur sekunder dan menghemat biaya reagen.`;
    recipeHtml += `</div>
      <p style="font-size:10px; color:#94a3b8; margin-top:8px;">*${noteText}</p>`;

    recipeContainer.innerHTML = recipeHtml;
  });

  // Apply Chemical Dosing (AI-2 Formulation Confirmation)
  document.getElementById('btnApplyChemicalDosing').addEventListener('click', () => {
    closeModal(modalAI2);
    panToUnit('unitWaterTank');
    sfx.chemicalReact();

    const waterLiquid = document.getElementById('tankWaterLiquid');
    const reagentInjector = document.getElementById('reagentInjector');
    const profile = getActiveProfile();
    // Use last AI-generated dosing if available, otherwise fallback to rule engine
    const dosingData = state.lastDosingData || profile.ai2DosingGenerator(state.customPh);

    reagentInjector.textContent = `[INJEKSI: ${dosingData.recipes[0].name.split('(')[0].trim()} ${dosingData.totalPct}...]`;
    reagentInjector.style.display = 'block';

    // Water turns from custom dirty color to pure blue
    setTimeout(() => {
      waterLiquid.className = 'liquid-layer pure-water';
      reagentInjector.style.display = 'none';
      state.waterDosed = true;
      if (arrowWaterToSteril) arrowWaterToSteril.classList.add('flowing');
      sfx.success();

      // Pump to Tank 7 (Sterilisasi & Evaluasi Coolant)
      setTimeout(() => {
        panToUnit('unitSterilTank');
        tankWaterLiquid.style.height = '12%';
        tankSterilLiquid.style.height = '75%';
        state.waterSterilized = true;

        questBadge.textContent = 'UJI COOLANT (AI-3)';
        questText.innerHTML = 'Air masuk ke Tangki Steril 1. Sensor <strong>AI-3</strong> siap memeriksa apakah air layak sebagai coolant pendingin server AI!';

        setTimeout(triggerAI3Evaluation, 700);
      }, 1000);

    }, 1500);
  });

  // AI-3 Evaluation Modal Trigger (now async, uses Gemini to compute real EC & silica values)
  async function triggerAI3Evaluation() {
    panToUnit('unitSterilTank');
    sfx.laserScan();
    laserAI3.classList.add('active');

    const profile = getActiveProfile();
    // pH after AI-2 treatment targets neutral ~7.2
    const treatedPh = 7.2;

    // --- Dynamic fallback: compute EC/silica from live TDS slider so values differ per run ---
    function computeFallbackEC() {
      const tdsVal = parseFloat(state.customTds) || 1000;
      // Removal efficiency depends on waste type: electro > textil > petro > mineral
      const removalMap = { electroplating: 0.0030, textile: 0.0025, mineral: 0.0045, petrochemical: 0.0028 };
      const factor = removalMap[state.selectedWasteProfile] || 0.0032;
      const ec = (tdsVal * factor + (Math.random() * 0.4 - 0.2)).toFixed(1);
      const silica = ((parseFloat(profile.ai3Silica) || 0.1) * (0.85 + Math.random() * 0.3)).toFixed(2);
      const qualified = parseFloat(ec) < 5.0 && parseFloat(silica) < 0.1;
      return { ec: `${ec} µS/cm`, silica: `${silica} mg/L`, qualified };
    }

    setTimeout(async () => {
      laserAI3.classList.remove('active');

      const provLabel3 = getActiveProviderLabel();
      showAiThinkingWindow('AI-3 mengevaluasi konduktivitas & kualitas coolant...', provLabel3);

      // Open modal immediately with loading state
      showAiLoadingBadge('ai3EcDisplay', '🤖 Mengukur konduktivitas...');
      showAiLoadingBadge('ai3SilicaDisplay', '🤖 Mengukur silika terlarut...');
      document.getElementById('ai3ExplanationText').innerHTML =
        '<span style="color:#38bdf8; font-style:italic;">⏳ AI sedang mengevaluasi kualitas coolant berdasarkan proses netralisasi AI-2...</span>';
      openModal(modalAI3);

      let ai3 = null;
      let fromGemini = false;
      try {
        ai3 = await generateAI3Evaluation(profile, treatedPh);
        fromGemini = true;
      } catch (err) {
        console.info('[AI-3] Fallback ke kalkulasi dinamis lokal:', err.message);
      }
      hideAiThinkingWindow();

      // If Gemini unavailable, use dynamic local computation instead of static profile values
      if (!ai3) {
        const fb = computeFallbackEC();
        ai3 = {
          ec: fb.ec,
          silica: fb.silica,
          qualified: fb.qualified,
          explanation: `AI-3 mendeteksi konduktivitas listrik ${fb.ec} dan silika terlarut ${fb.silica} setelah netralisasi AI-2. ${fb.qualified ? 'Air memenuhi spesifikasi coolant Data Center AI.' : '⚠️ Kadar silika atau EC masih di atas ambang — disarankan dialihkan ke Steril 2 untuk deionisasi resin mixed-bed.'}`
        };
      }

      document.getElementById('ai3EcDisplay').textContent = `${ai3.ec} (Toleransi < 5.0)`;
      document.getElementById('ai3SilicaDisplay').textContent = `${ai3.silica} (Anti Kerak Server)`;

      const srcBadge = fromGemini
        ? `<span style="background:rgba(0,245,155,0.2); color:#00f59b; font-size:9px; padding:2px 6px; border-radius:4px; margin-left:6px;">${provLabel3}</span>`
        : '<span style="background:rgba(56,189,248,0.15); color:#38bdf8; font-size:9px; padding:2px 6px; border-radius:4px; margin-left:6px;">🧠 Kalkulasi Dinamis Lokal</span>';

      document.getElementById('ai3ExplanationText').innerHTML =
        `<strong>Hasil Analisis Sensor AI-3${srcBadge}:</strong><br>${ai3.explanation}`;

      // Store qualified flag and style Pass/Fail buttons based on AI result
      state.ai3GeminiQualified = ai3.qualified;
      const failBtn = document.getElementById('btnAI3Fail');
      const passBtn = document.getElementById('btnAI3Pass');
      if (failBtn && passBtn) {
        // Reset both first
        failBtn.style.boxShadow = '';
        passBtn.style.boxShadow = '';
        failBtn.style.opacity = '1';
        passBtn.style.opacity = '1';
        failBtn.title = '';
        passBtn.title = '';
        if (!ai3.qualified) {
          failBtn.style.boxShadow = '0 0 12px rgba(239,68,68,0.8)';
          passBtn.style.opacity = '0.45';
          passBtn.title = 'AI merekomendasikan pengalihan ke Steril 2';
        } else {
          passBtn.style.boxShadow = '0 0 12px rgba(0,245,155,0.8)';
          failBtn.style.opacity = '0.45';
        }
      }
    }, 1200);
  }

  document.getElementById('btnRecheckAI3').addEventListener('click', triggerAI3Evaluation);

  // Scenario A: Directly Qualified (Jalur Langsung dari Steril 1)
  document.getElementById('btnAI3Pass').addEventListener('click', () => {
    closeModal(modalAI3);
    state.ai3Status = 'qualified';
    panToUnit('unitServerCoolant');
    sfx.success();

    tankSterilLiquid.style.height = '12%';
    if (arrowSteril1ToServer) arrowSteril1ToServer.classList.add('flowing');
    if (arrowPolishToServer) arrowPolishToServer.classList.remove('flowing');
    if (pipeSteril1To2) pipeSteril1To2.classList.remove('flowing');

    activateServerCoolingLoop();

    questBadge.textContent = 'COOLANT LOLOS AI-3';
    questText.innerHTML = '✓ Air memenuhi baku mutu AI-3! Mengalir via jalur langsung atas ke Server AI Cooling Rack dengan PUE 1.12.';
  });

  // Scenario B: Hubungan Berbalik - Kualitas Kurang Bagus (Disalurkan ke Steril 2 di Bawah)
  document.getElementById('btnAI3Fail').addEventListener('click', () => {
    closeModal(modalAI3);
    state.ai3Status = 'unqualified';
    sfx.alert();

    const profile = getActiveProfile();

    panToUnit('unitPolishTank');
    state.secondaryPolishActive = true;

    // Animate downward re-route flow (Hubungan berbalik ke steril 2 di bawah)
    if (pipeSteril1To2) pipeSteril1To2.classList.add('flowing');
    if (conduitSterilReroute) conduitSterilReroute.classList.add('flowing');
    if (arrowSteril1ToServer) arrowSteril1ToServer.classList.remove('flowing');

    tankSterilLiquid.style.height = '12%';
    tankPolishLiquid.style.height = '75%';

    const polishStatus = document.getElementById('polishStatusText');
    polishStatus.innerHTML = `<span style="color:#f59e0b;">Pengalihan Aktif:</span> Memproses deionisasi ${profile.ai4PolishNote}...`;

    questBadge.textContent = 'PENETRALAN LANJUTAN (STERIL 2)';
    questText.innerHTML = `⚠️ Hasil uji steril 1 belum optimal. Air dialihkan ke bawah menuju <strong>Tangki Steril 2 (Penetral Tambahan)</strong> untuk deionisasi resin mixed-bed & evaluasi AI-4.`;

    // After polishing completes, AI-4 certifies the coolant!
    setTimeout(() => {
      sfx.laserScan();
      laserAI4.classList.add('active');

      setTimeout(() => {
        laserAI4.classList.remove('active');
        openModal(modalAI4);
        sfx.success();
      }, 1200);

    }, 1800);
  });

  // AI-4 Final Certification Confirmation (Jalur Steril 2 ke Server AI)
  document.getElementById('btnConfirmAI4').addEventListener('click', async () => {
    closeModal(modalAI4);
    state.ai4Certified = true;
    panToUnit('unitServerCoolant');
    sfx.success();

    tankPolishLiquid.style.height = '10%';
    if (arrowPolishToServer) arrowPolishToServer.classList.add('flowing');

    // Try to get AI-4 certification data from any available provider
    const profile = getActiveProfile();
    const provLabel4 = getActiveProviderLabel();
    showAiThinkingWindow('AI-4 mensertifikasi kualitas akhir coolant Data Center...', provLabel4);
    let ai4 = null;
    try {
      ai4 = await generateAI4Certification(profile);
    } catch (err) {
      console.info('[AI-4] AI tidak tersedia, fallback ke nilai statis:', err.message);
    }
    hideAiThinkingWindow();

    activateServerCoolingLoop(ai4);

    const certNote = ai4
      ? `✔ <strong>AI-4</strong> mensertifikasi: ${ai4.certification_note}`
      : '✔ <strong>AI-4</strong> telah mensertifikasi air dari Tahap Steril 2 100% ultra-pure! Mengalir via jalur bawah ke Server AI Cooling Rack.';
    questBadge.textContent = '100% COOLANT CERTIFIED';
    questText.innerHTML = certNote;
  });

  function activateServerCoolingLoop(ai4Data = null) {
    state.coolantInServer = true;
    serverCoolantFill.style.height = '100%';

    const temp = ai4Data?.server_temp_estimate || '36.2 °C';
    const pue = ai4Data?.pue_estimate || '1.12';
    const ec = ai4Data?.ec_final || '';
    const pueLabel = ai4Data ? `${pue} (Gemini AI Estimate)` : `${pue} (Top 5%)`;

    document.getElementById('serverTempDisplay').innerHTML = `
      <span style="color:#00f59b; font-weight:700;">${temp}</span>
    `;
    document.getElementById('serverPueDisplay').innerHTML = `
      <span style="color:#00d2ff; font-weight:700;">${pueLabel}</span>
    `;

    if (ai4Data && ec) {
      // Inject extra Gemini-generated coolant specs into the server card
      const specEl = document.createElement('div');
      specEl.style.cssText = 'font-size:9px; color:#94a3b8; text-align:center; margin-top:4px; font-family:var(--font-mono);';
      specEl.innerHTML = `EC: <strong style="color:#38bdf8">${ec}</strong> &nbsp;|&nbsp; Silika: <strong style="color:#38bdf8">${ai4Data.silica_final || ''}</strong><br>` +
        `Kelas: <strong style="color:#00f59b">${ai4Data.purity_class || ''}</strong>`;
      const serverEl = document.getElementById('unitServerCoolant');
      if (serverEl && !serverEl.querySelector('.ai4-gemini-specs')) {
        specEl.className = 'ai4-gemini-specs';
        serverEl.appendChild(specEl);
      }
    }

    sfx.success();
  }

  // =========================================================================
  // 🤖 GEMINI API CORE — Digunakan oleh SEMUA Stasiun AI (AI-1, AI-2, AI-3, AI-4)
  // =========================================================================
  /**
   * Memanggil Google Gemini API dengan prompt yang diberikan dan mengembalikan
   * respons sebagai objek JSON yang sudah di-parse.
   * Jika gagal (tidak ada API key, kuota habis, dll.) melempar Error sehingga
   * pemanggil bisa menjalankan fallback rule-engine bawaan.
   *
   * @param {string} systemPrompt - Instruksi sistem untuk Gemini
   * @param {string} userPrompt  - Konten prompt pengguna
   * @returns {Promise<Object>} - Objek JSON dari respons Gemini
   */
  // ─────────────────────────────────────────────────────────────────────────
  // AI THINKING WINDOW — show/hide floating notification
  // ─────────────────────────────────────────────────────────────────────────
  const _aiThinkWin = () => document.getElementById('aiThinkingWindow');
  const _aiThinkMsg = () => document.getElementById('aiThinkingMsg');
  const _aiThinkProv = () => document.getElementById('aiThinkingProvider');

  function showAiThinkingWindow(message, providerLabel) {
    const win = _aiThinkWin();
    const msg = _aiThinkMsg();
    const prov = _aiThinkProv();
    if (!win) return;
    if (msg) msg.textContent = message || 'Menghitung solusi terbaik...';
    if (prov) prov.textContent = providerLabel || '🧠 Kalkulasi Lokal';
    win.classList.add('visible');
  }

  function hideAiThinkingWindow() {
    const win = _aiThinkWin();
    if (win) win.classList.remove('visible');
  }

  // Wire close button
  const btnAiThinkClose = document.getElementById('btnAiThinkingClose');
  if (btnAiThinkClose) btnAiThinkClose.addEventListener('click', hideAiThinkingWindow);

  // ─────────────────────────────────────────────────────────────────────────
  // MULTI-PROVIDER AI ROUTER
  // Detects key format and routes to the correct backend API:
  //   AIzaSy...  → Google Gemini 2.0 Flash
  //   sk-ant-... → Anthropic Claude 3 Haiku
  //   sk-...     → OpenAI GPT-4o-mini
  // Falls back to local dynamic calculation if no key / call fails.
  // ─────────────────────────────────────────────────────────────────────────

  function detectAIProvider(key) {
    if (!key || key.length < 8) return null;
    if (key.startsWith('AIzaSy')) return 'gemini';
    if (key.startsWith('sk-ant-')) return 'anthropic';
    if (key.startsWith('sk-')) return 'openai';
    return 'gemini'; // unknown format — attempt gemini
  }

  function getProviderLabel(provider) {
    if (provider === 'openai') return '⚡ OpenAI GPT-4o-mini';
    if (provider === 'anthropic') return '⚡ Anthropic Claude 3';
    if (provider === 'gemini') return '⚡ Gemini 2.0 Flash';
    return '🧠 Kalkulasi Lokal';
  }

  // Parse any provider's text response as JSON, stripping markdown fences
  function parseAIJson(raw) {
    const cleaned = (raw || '').replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  }

  async function callGeminiProvider(systemPrompt, userPrompt, apiKey, signal) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const payload = {
      contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: { temperature: 0.25, responseMimeType: 'application/json' }
    };
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `HTTP ${res.status}`); }
    const data = await res.json();
    return parseAIJson(data.candidates?.[0]?.content?.parts?.[0]?.text || '');
  }

  async function callOpenAIProvider(systemPrompt, userPrompt, apiKey, signal) {
    const endpoint = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.25,
      response_format: { type: 'json_object' }
    };
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
      signal
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `HTTP ${res.status}`); }
    const data = await res.json();
    return parseAIJson(data.choices?.[0]?.message?.content || '');
  }

  async function callAnthropicProvider(systemPrompt, userPrompt, apiKey, signal) {
    const endpoint = 'https://api.anthropic.com/v1/messages';
    const payload = {
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    };
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload),
      signal
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `HTTP ${res.status}`); }
    const data = await res.json();
    return parseAIJson(data.content?.[0]?.text || '');
  }

  // Main entry point — all AI functions call this
  async function callGemini(systemPrompt, userPrompt) {
    const apiKey = getEffectiveGeminiKey();
    if (!apiKey) throw new Error('API Key belum dikonfigurasi');

    const provider = detectAIProvider(apiKey);
    if (!provider) throw new Error('Format API Key tidak dikenali');

    // 15-second timeout via AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      let result;
      if (provider === 'openai') {
        result = await callOpenAIProvider(systemPrompt, userPrompt, apiKey, controller.signal);
      } else if (provider === 'anthropic') {
        result = await callAnthropicProvider(systemPrompt, userPrompt, apiKey, controller.signal);
      } else {
        result = await callGeminiProvider(systemPrompt, userPrompt, apiKey, controller.signal);
      }
      clearTimeout(timeoutId);
      return result;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') throw new Error('Timeout 15s — menggunakan data lokal');
      throw err;
    }
  }

  // Convenience: get current provider label for the thinking window
  function getActiveProviderLabel() {
    const key = getEffectiveGeminiKey();
    return getProviderLabel(detectAIProvider(key));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AI-1: Analisis Mineral Residu Padat
  // ─────────────────────────────────────────────────────────────────────────
  /**
   * Meminta Gemini menghasilkan analisis mineral residu sesuai profil limbah.
   * Fallback: nilai statis dari profil di wasteProfiles.
   */
  async function generateAI1Analysis(profile, solidPct) {
    const sys = `Anda adalah sensor mineral AI-1 di pabrik pengolahan limbah industri RECHEMON.
Analisis residu padat dari limbah ini dan hasilkan JSON dengan format PERSIS berikut (tanpa markdown):
{
  "silicaDisplay": "XX.X % (Deskripsi)",
  "ironDisplay": "X.X % (Deskripsi)",
  "metalsDisplay": "X.X % (Deskripsi)",
  "tclpDisplay": "TCLP PASS/FAIL (Alasan)",
  "recommendation": "Kalimat rekomendasi produk terbaik dengan tag HTML <strong> di nama produk.",
  "preferredProduct": "semen | bata | kerikil",
  "machineAction": "Deskripsi singkat proses mesin mekanikal yang tepat"
}
Gunakan satuan yang realistis dan angka sesuai karakteristik limbah. Selalu tulis dalam bahasa Indonesia.`;

    const user = `Profil Limbah: ${profile.name}
Rasio Padat: ${solidPct}%
pH Awal: ${profile.defaultPh}
Logam Terlarut: ${profile.metals}
COD: ${profile.cod}
TDS: ${profile.tds}`;

    return callGemini(sys, user);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AI-2: Formula Dosis Reaktan Kimia
  // ─────────────────────────────────────────────────────────────────────────
  /**
   * Meminta Gemini menghitung resep dosis 3 bahan kimia yang paling tepat
   * berdasarkan pH aktual dan karakteristik limbah saat ini.
   * Fallback: ai2DosingGenerator() dari profil.
   */
  async function generateAI2Formula(profile, currentPh, metals, cod, tds) {
    const sys = `Anda adalah sistem AI-2 RECHEMON — ahli formulasi dosis reaktan kimia untuk pengolahan air limbah industri.
Hitung resep 3 reaktan kimia paling optimal untuk menetralisasi limbah ini dan hasilkan JSON PERSIS format berikut (tanpa markdown):
{
  "totalPct": "X.X %",
  "recipes": [
    { "name": "Nama Kimia (Rumus/Merek)", "pct": "X.X %", "role": "Alasan penggunaan sesuai kondisi limbah" },
    { "name": "Nama Kimia 2", "pct": "X.X %", "role": "Alasan 2" },
    { "name": "Nama Kimia 3", "pct": "X.X %", "role": "Alasan 3" }
  ],
  "note": "Satu kalimat catatan efisiensi pengolahan"
}
totalPct harus sama dengan jumlah ketiga pct. Gunakan kimia yang realistis secara industri. Tulis dalam bahasa Indonesia.`;

    const user = `Limbah: ${profile.name}
pH Aktual: ${currentPh.toFixed(1)}
Logam Terlarut: ${metals}
COD: ${cod}
TDS: ${tds}
Karakteristik: ${profile.label}`;

    return callGemini(sys, user);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AI-3: Evaluasi Kualitas Coolant (Steril 1)
  // ─────────────────────────────────────────────────────────────────────────
  /**
   * Meminta Gemini menghitung parameter EC, silika, dan evaluasi coolant
   * setelah proses netralisasi AI-2 diterapkan.
   * Fallback: nilai statis dari profil.
   */
  async function generateAI3Evaluation(profile, treatedPh) {
    const sys = `Anda adalah sensor AI-3 RECHEMON yang mengevaluasi kualitas air untuk pendingin (coolant) Data Center AI.
Berdasarkan proses netralisasi yang sudah dilakukan, prediksi kualitas air setelah pengolahan dan hasilkan JSON PERSIS format berikut (tanpa markdown):
{
  "ec": "X.X µS/cm",
  "silica": "X.XX mg/L",
  "conductance": "X.X µS/cm",
  "ph_final": "X.X",
  "explanation": "Analisis lengkap 2-3 kalimat tentang kualitas coolant dari Sensor AI-3.",
  "qualified": true
}
"qualified" = true jika EC < 5.0 µS/cm dan silika < 0.1 mg/L, false jika tidak memenuhi.
Gunakan angka realistis berbasis karakteristik limbah yang sudah diolah. Tulis dalam bahasa Indonesia.`;

    const user = `Limbah Asal: ${profile.name}
pH Setelah Netralisasi AI-2: ${treatedPh.toFixed(1)}
Logam Terlarut Awal: ${profile.metals}
COD Awal: ${profile.cod}
TDS Awal: ${profile.tds}
AI-3 Silika Referensi Bawaan: ${profile.ai3Silica}
AI-3 EC Referensi Bawaan: ${profile.ai3Ec}`;

    return callGemini(sys, user);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AI-4: Sertifikasi Akhir Coolant (Steril 2)
  // ─────────────────────────────────────────────────────────────────────────
  /**
   * Meminta Gemini memberikan sertifikasi akhir dan spesifikasi teknis coolant
   * setelah melalui resin mixed-bed di Tangki Steril 2.
   * Fallback: teks statis.
   */
  async function generateAI4Certification(profile) {
    const sys = `Anda adalah sertifikator AI-4 RECHEMON — sistem sertifikasi akhir kualitas air ultra-murni untuk Data Center AI.
Air telah melalui proses resin mixed-bed di Tangki Steril 2. Buat laporan sertifikasi dalam JSON PERSIS format berikut (tanpa markdown):
{
  "ec_final": "X.XX µS/cm",
  "silica_final": "X.XXX mg/L",
  "toc_final": "X.X µg/L",
  "ph_final": "X.X",
  "purity_class": "Kelas Ultra-Pure / Class X",
  "pue_estimate": "X.XX",
  "certification_note": "Kalimat sertifikasi resmi AI-4 yang mencakup proses deionisasi dan nilai akhir.",
  "server_temp_estimate": "XX.X °C"
}
Semua nilai harus lebih baik dari hasil AI-3 (EC lebih rendah, silika lebih rendah). Tulis dalam bahasa Indonesia.`;

    const user = `Limbah Asal: ${profile.name}
Masuk Steril 2 karena: Hasil AI-3 belum memenuhi standar coolant Data Center AI.
Proses di Steril 2: Deionisasi resin mixed-bed kation/anion + filtrasi microporous 0.2µm
ai4PolishNote: ${profile.ai4PolishNote}`;

    return callGemini(sys, user);
  }

  // --- Modal Helpers ---
  function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add('open');
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('open');
    sfx.click();
  }

  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.holo-modal-overlay');
      closeModal(modal);
    });
  });

  document.querySelectorAll('.holo-modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay);
      }
    });
  });

  // =========================================================================
  // 🧠 AI HAZARDOUS WASTE ADVISOR (SOLUSI KHUSUS LIMBAH NON-PAVING)
  // =========================================================================

  const aiWastePresets = {
    mercury_toxic: {
      name: "Sludge Merkuri (Hg) & Kadmium (Cd) Tinggi",
      prompt: "Sludge pengolahan kimia sintetis dengan kandungan Merkuri (Hg 450 ppm), Kadmium (Cd 280 ppm), dan Timbal (Pb 600 ppm). Sangat beracun, dilarang keras dibuat paving block karena risiko pelepasan uap raksa dan pencemaran air tanah lewat lindi (leachate)."
    },
    petro_tar: {
      name: "Ter Minyak Berat & Dioxin Kilang",
      prompt: "Residu dasar tangki kilang minyak bumi (Heavy Oil Tar & Pitch) bercampur Hidrokarbon Aromatik Polisiklik (PAH), fenol pekat, dan trace dioxin. Bersifat termoplastik meleleh pada >35°C, tidak dapat mengeras dengan semen konvensional, serta mengeluarkan gas karsinogenik."
    },
    corrosive_salts: {
      name: "Garam Klorida & Asam Reaktif Ekstrem",
      prompt: "Endapan lumpur garam halida pekat (NaCl 18%, CaCl2 12%) bercampur residu asam fluorida (HF). Jika dicampur semen akan memicu keretakan mikro (Alkali-Silica Reaction parah), melarutkan pasta semen, dan merusak struktur dalam hitungan minggu."
    },
    dioxin_flyash: {
      name: "Fly Ash Insinerator Medis & Abu B3",
      prompt: "Fly ash cerobong insinerator limbah medis berbahaya mengandung senyawa halogen organik persisten (Dioxin/Furan), garam volatil, dan partikulat nano logam berat. Tidak boleh dijadikan paving karena debu gesekan berpotensi terhirup oleh manusia."
    }
  };

  // Helper untuk membaca API Key (dari variabel GEMINI_API_KEY di baris 24 atau dari localStorage browser)
  function getEffectiveGeminiKey() {
    const savedInBrowser = localStorage.getItem('RECHEMON_GEMINI_API_KEY');
    if (savedInBrowser && savedInBrowser.trim().length > 0) {
      return savedInBrowser.trim();
    }
    if (typeof GEMINI_API_KEY === 'string' && GEMINI_API_KEY.trim().length > 0) {
      return GEMINI_API_KEY.trim();
    }
    return '';
  }

  function updateApiKeyStatusUI() {
    if (!geminiKeyStatusBadge || !inputGeminiApiKey) return;
    const key = getEffectiveGeminiKey();
    if (key) {
      const masked = key.length > 10 ? (key.substring(0, 6) + '...' + key.substring(key.length - 4)) : 'Terpasang';
      geminiKeyStatusBadge.textContent = `✓ API Key Aktif (${masked})`;
      geminiKeyStatusBadge.className = 'status-tag tag-ready';
      inputGeminiApiKey.placeholder = `Tersimpan: ${masked}`;
    } else {
      geminiKeyStatusBadge.textContent = '⚙️ Model Pakar RECHEMON Bawaan (Offline Ready)';
      geminiKeyStatusBadge.className = 'status-tag tag-idle';
      inputGeminiApiKey.placeholder = 'Paste Google Gemini API Key di sini (Opsional)...';
    }
  }

  // Event Listener simpan/hapus API Key dari antarmuka
  if (btnSaveApiKey) {
    btnSaveApiKey.addEventListener('click', () => {
      const val = inputGeminiApiKey.value.trim();
      if (!val) {
        alert('Silakan masukkan API Key Gemini yang valid terlebih dahulu.');
        return;
      }
      localStorage.setItem('RECHEMON_GEMINI_API_KEY', val);
      inputGeminiApiKey.value = '';
      updateApiKeyStatusUI();
      sfx.success();
      alert('✓ API Key berhasil disimpan di memori browser Anda! Model Gemini AI sekarang aktif secara online.');
    });
  }

  if (btnClearApiKey) {
    btnClearApiKey.addEventListener('click', () => {
      localStorage.removeItem('RECHEMON_GEMINI_API_KEY');
      inputGeminiApiKey.value = '';
      updateApiKeyStatusUI();
      sfx.click();
      alert('API Key lokal dihapus. Simulator kembali menggunakan Mesin Pakar RECHEMON bawaan.');
    });
  }

  // Tombol buka modal AI Advisor
  if (btnHudApiKey) {
    btnHudApiKey.addEventListener('click', () => {
      updateApiKeyStatusUI();
      openModal(modalResidueAiSolver);
    });
  }

  if (btnOpenAiResidueSolver) {
    btnOpenAiResidueSolver.addEventListener('click', () => {
      updateApiKeyStatusUI();
      openModal(modalResidueAiSolver);
    });
  }

  if (btnOpenAiFromModalAI1) {
    btnOpenAiFromModalAI1.addEventListener('click', () => {
      closeModal(modalAI1);
      updateApiKeyStatusUI();
      openModal(modalResidueAiSolver);
    });
  }

  // Preset Chips Listener
  if (wastePresetChips) {
    wastePresetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        wastePresetChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const key = chip.dataset.preset;
        if (aiWastePresets[key] && aiWastePromptInput) {
          aiWastePromptInput.value = aiWastePresets[key].prompt;
          sfx.click();
        }
      });
    });
  }

  // Mesin Pakar Rekayasa Lingkungan RECHEMON (Rule Engine Bawaan - Offline Fallback Cerdas)
  function generateExpertWasteSolution(promptText) {
    const text = (promptText || '').toLowerCase();

    if (text.includes('merkuri') || text.includes('raksa') || text.includes('hg') || text.includes('kadmium') || text.includes('cd') || text.includes('timbal') || text.includes('pb')) {
      return {
        wasteName: "Sludge Konsentrat Logam Berat Volatil (Hg / Cd / Pb)",
        unfitReason: "Kandungan merkuri dan kadmium memiliki tekanan uap tinggi dan toksisitas akut. Pembuatan paving block sangat dilarang karena radiasi panas matahari akan melepaskan uap raksa beracun (neurotoksik) dan uji lindi TCLP dipastikan gagal dengan konsentrasi Hg > 0.2 mg/L.",
        batTechnology: "Thermal Desorption Vakum & Stabilisasi Khelasi Polimerik Sulfur (SPC)",
        processExplanation: "1. Distilasi termal vakum suhu rendah (350°C) mengkondensasi 99.8% merkuri murni ke tabung recovery tertutup. 2. Abu residu distabilkan menggunakan kopolimer sulfur polimerik (SPC) membentuk kristal kovalen HgS (Cinabarit sintetis) yang kedap air dan tidak larut asam.",
        finalProduct: "Ingot Kaca-Keramik Sulfur Stabil (Inert Sulfur Composite) & Logam Raksa Daur Ulang Industri",
        productSpecs: "Kuat tekan 45.2 MPa, Laju Lindi TCLP Hg < 0.005 mg/L (100x lebih aman dari baku mutu US-EPA), Nol Emisi Uap.",
        safetyCert: "Sertifikasi TCLP Pass (US-EPA Method 1311) & Standar Pengolahan B3 KLHK PP 22/2021"
      };
    }

    if (text.includes('tar') || text.includes('minyak') || text.includes('petro') || text.includes('pitch') || text.includes('fenol') || text.includes('hidrokarbon')) {
      return {
        wasteName: "Residu Berat Dasar Tangki Kilang Minyak (Heavy Oil Tar B3)",
        unfitReason: "Senyawa hidrokarbon berat (PAH) menghambat proses hidrasi semen Portland (inhibitor kalsium silikat hidrat), menyebabkan adonan paving block lembek, mudah meleleh pada suhu >35°C, dan mengeluarkan uap organik karsinogenik.",
        batTechnology: "Pirolisis Termokimia Anaerobik Terkatalisis & Karbonisasi Selektif",
        processExplanation: "1. Dekomposisi termal dalam reaktor pirolisis tanpa oksigen pada suhu 650°C. 2. Fraksi gas hidrokarbon dikondensasi menjadi Syngas & Bio-Oil bahan bakar industri. 3. Residu padatan karbon dimurnikan menjadi karbon hitam teknis berkualitas tinggi.",
        finalProduct: "Karbon Hitam Teraktivasi (High-Surface Area Industrial Carbon) & Syngas Energi",
        productSpecs: "Luas Permukaan BET > 650 m²/g, Bebas hidrokarbon volatil (PAH < 1 ppm), Nilai Kalor Syngas 18.5 MJ/Nm³.",
        safetyCert: "Zero-Landfill Emission Compliant & Basel Convention Annex III Approved"
      };
    }

    if (text.includes('klorida') || text.includes('garam') || text.includes('asam') || text.includes('hf') || text.includes('fluorida') || text.includes('korosif')) {
      return {
        wasteName: "Lumpur Garam Halida Pekat & Asam Fluorida Korosif Ekstrem",
        unfitReason: "Konsentrasi ion klorida (>2%) dan fluorida tinggi merusak matriks semen melalui pembentukan garam Friedel yang mengembang dan memicu keretakan ekspansif (spalling), menghancurkan jalan paving dalam waktu kurang dari 3 bulan.",
        batTechnology: "Netralisasi Hidrotermal Bertekanan & Solidifikasi Kalsium Sulfoaluminat (CSA)",
        processExplanation: "1. Netralisasi bertahap dengan suspensi Ca(OH)2 untuk mengikat ion fluorida menjadi kristal CaF2 (Fluorit stabil). 2. Kristalisasi garam via Mechanical Vapor Recompression (MVR). 3. Residu padat diikat dengan matriks semen sulfoaluminat khusus tahan klorida/sulfat.",
        finalProduct: "Batu Armor Pemecah Gelombang Tahan Air Laut (Marine-Grade Coastal Armor Blocks)",
        productSpecs: "Ketahanan Penetrasi Klorida Sangat Rendah (< 500 Coulombs - ASTM C1202), Kuat Tekan 52.0 MPa, Densitas 2.45 g/cm³.",
        safetyCert: "ASTM C1012 Sulfate Resistance Certified & Standar Konstruksi Bangunan Laut Kelas 1"
      };
    }

    if (text.includes('fly ash') || text.includes('medis') || text.includes('dioxin') || text.includes('insinerator') || text.includes('abu')) {
      return {
        wasteName: "Fly Ash Insinerator Medis (Mengandung Dioxin/Furan & Partikulat Nano B3)",
        unfitReason: "Partikel nano beracun dan senyawa halogen organik persisten (Dioxin/Furan) berisiko lepas ke udara bebas saat paving block aus tergerus ban kendaraan, berpotensi menimbulkan karsinogenik terhirup dan bioakumulasi berbahaya.",
        batTechnology: "Vitrifikasi Plasma Arc Temperatur Ekstrim (1400°C Thermal Vitrification)",
        processExplanation: "1. Pembakaran obor plasma arc bersuhu 1400°C–1600°C memecah total cincin aromatik klorin dioksin menjadi gas atomik sederhana. 2. Pendinginan kejut (quenching) mencegah reformasi senyawa furan. 3. Lelehan silika didinginkan menjadi kaca silikat inert padat.",
        finalProduct: "Matriks Kaca-Keramik Inert Vitrifikasi (Vitrified Slag Architectural Tiles)",
        productSpecs: "Struktur kristal amorf non-porous kedap lindi, Lolos TCLP dengan margin 99.9%, Kekerasan Skala Mohs 7.2 (Setara Granit).",
        safetyCert: "EU Directive on Dioxin Destruction (Destruction Removal Efficiency > 99.9999%) & Green Building Council Approved"
      };
    }

    // Solusi Umum B3 Kompleks
    return {
      wasteName: "Limbah Padat B3 Karakteristik Kimia Kompleks Non-Paving",
      unfitReason: "Karakteristik kontaminan kimia kompleks dan interaksi senyawa spesifik melampaui batas toleransi hidrasi semen Portland standar, berisiko tinggi memicu pelarutan kimia jika digunakan sebagai material paving jalanan.",
      batTechnology: "Enkapsulasi Geokimia Multitahap & Solidifikasi Resin Termoset Komposit",
      processExplanation: "1. Pre-treatment khelasi selektif untuk mengikat radikal bebas dan senyawa reaktif. 2. Mikro-enkapsulasi partikel limbah menggunakan polimer resin vinil ester. 3. Pemadatan tekanan hidrolik 250 Bar membentuk blok komposit padat stabil.",
      finalProduct: "Balok Komposit Enkapsulasi Geokimia Kedap Korosi (Engineered Barrier Composite)",
      productSpecs: "Kuat tekan 42.5 MPa, Porositas < 1.0%, Lolos uji perendaman asam agresif pH 2.0 selama 90 hari tanpa degradasi.",
      safetyCert: "Standar Baku Mutu Pengolahan Limbah B3 PP No. 22 Tahun 2021 & ISO 14001 Compliant"
    };
  }

  // AI Waste Advisor — routes through the shared multi-provider callGemini
  async function callGeminiWasteApi(promptText) {
    const systemInstruction = `Anda adalah AI Ahli Rekayasa Kimia Lingkungan & Pengelolaan Limbah Berbahaya (B3) di platform industri RECHEMON.
Tugas Anda adalah menganalisis karakteristik limbah padat yang TIDAK DAPAT dijadikan paving block atau semen konvensional.
Berikan solusi teknologi terbaik (Best Available Technology / BAT) dalam format JSON valid PERSIS dengan struktur berikut tanpa karakter markdown di luar JSON:
{
  "wasteName": "Nama ringkas limbah",
  "unfitReason": "Penjelasan mengapa tidak boleh dijadikan paving block/semen biasa (risiko lingkungan & struktural)",
  "batTechnology": "Nama teknologi pengolahan terbaik (contoh: Plasma Arc Vitrification, Pyrolysis Katalitik, Hydrometallurgical Leaching, Geochemical Chelation)",
  "processExplanation": "Langkah-langkah proses teknis dari pengolahan ini",
  "finalProduct": "Nama produk akhir yang aman/bernilai jual",
  "productSpecs": "Spesifikasi teknis produk (kekuatan, densitas, uji lolos TCLP, dsb)",
  "safetyCert": "Sertifikasi/Standar lingkungan yang dipenuhi"
}`;
    return callGemini(systemInstruction, `Karakteristik Limbah:\n"${promptText}"`);
  }

  // Tampilkan Hasil Analisis AI
  function renderAiResults(solution, isOnline = false, extraNote = '') {
    if (!aiResultsContent) return;

    const sourceBadge = isOnline
      ? `<span class="status-tag tag-ready" style="font-size:10px;">⚡ Google Gemini 2.0 Flash AI (Online)</span>`
      : `<span class="status-tag tag-ready" style="background:rgba(56,189,248,0.2); color:#38bdf8; border-color:#38bdf8; font-size:10px;">🧠 Sistem Pakar Rekayasa RECHEMON (Best Available Technology)</span>`;

    const noteHtml = extraNote
      ? `<div style="font-size:10px; color:#f59e0b; background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.3); padding:4px 8px; border-radius:4px; margin-bottom:8px;">${extraNote}</div>`
      : '';

    aiResultsContent.innerHTML = `
      ${noteHtml}
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(0,210,255,0.2); padding-bottom:6px;">
        <strong style="color:#ffffff; font-size:12px;">Hasil Diagnosis Rekayasa Khusus AI:</strong>
        ${sourceBadge}
      </div>

      <!-- Card 1: Diagnosis & Larangan Paving -->
      <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.35); border-radius:8px; padding:10px; margin-bottom:10px;">
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
          <span style="font-size:14px;">⚠️</span>
          <strong style="color:#f87171; font-size:11px;">Karakteristik & Alasan Dilarang Dijadikan Paving Block:</strong>
        </div>
        <p style="font-size:11px; color:#fecaca; margin:0 0 6px 0; line-height:1.4;">${solution.unfitReason}</p>
        <div style="font-size:10px; color:#94a3b8;">Jenis Limbah: <strong style="color:#e2e8f0;">${solution.wasteName}</strong></div>
      </div>

      <!-- Card 2: Solusi Teknologi BAT -->
      <div style="background:rgba(0,210,255,0.08); border:1px solid rgba(0,210,255,0.35); border-radius:8px; padding:10px; margin-bottom:10px;">
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
          <span style="font-size:14px;">🔬</span>
          <strong style="color:#00d2ff; font-size:11px;">Teknologi Pengolahan Terbaik (Best Available Technology - BAT):</strong>
        </div>
        <div style="font-size:12px; font-weight:700; color:#38bdf8; margin-bottom:4px;">${solution.batTechnology}</div>
        <p style="font-size:11px; color:#cbd5e1; margin:0; line-height:1.4;">${solution.processExplanation}</p>
      </div>

      <!-- Card 3: Produk Akhir & Spesifikasi -->
      <div style="background:rgba(0,245,155,0.08); border:1px solid rgba(0,245,155,0.35); border-radius:8px; padding:10px; margin-bottom:10px;">
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
          <span style="font-size:14px;">💎</span>
          <strong style="color:#00f59b; font-size:11px;">Produk Akhir Bernilai Tinggi & Ramah Lingkungan:</strong>
        </div>
        <div style="font-size:12px; font-weight:700; color:#4ade80; margin-bottom:4px;">${solution.finalProduct}</div>
        <div style="font-size:10px; color:#94a3b8; margin-bottom:6px;">Spesifikasi: <span style="color:#e2e8f0;">${solution.productSpecs}</span></div>
        <div style="display:inline-block; font-size:9px; color:#00f59b; background:rgba(0,245,155,0.15); border:1px solid rgba(0,245,155,0.3); padding:2px 8px; border-radius:4px; font-weight:600;">
          🛡️ ${solution.safetyCert}
        </div>
      </div>

      <!-- Action Button -->
      <button id="btnApplyAiSolutionToPlant" class="btn btn-primary btn-ai-gradient" style="width:100%; margin-top:8px; padding:10px 16px; font-weight:700; font-size:12px; letter-spacing:0.5px;">
        ⚡ Terapkan Solusi AI ke Mesin Mekanikal & Etalase Pabrik
      </button>
    `;

    // Hook Tombol Terapkan Solusi AI
    const btnApply = document.getElementById('btnApplyAiSolutionToPlant');
    if (btnApply) {
      btnApply.addEventListener('click', () => {
        applyAiCustomSolutionToPlant(solution);
      });
    }
  }

  // Terapkan Solusi AI Khusus ke Mesin dan Etalase
  function applyAiCustomSolutionToPlant(solution) {
    closeModal(modalResidueAiSolver);
    panToUnit('unitMechanicalMachine');
    sfx.machineChug();

    const machineStatus = document.getElementById('machineStatusText');
    const machineGear = document.getElementById('machineGear');
    const showcaseContent = document.getElementById('productShowcaseContent');

    if (arrowResidueToMachine) arrowResidueToMachine.classList.add('flowing');
    machineStatus.innerHTML = `<span style="color:#00d2ff; font-weight:700;">[REAKSI AI: ${solution.batTechnology}]</span>`;
    machineGear.classList.add('spinning');

    state.residueProcessing = true;
    tankResidueLiquid.style.height = '12%';

    setTimeout(() => {
      machineGear.classList.remove('spinning');
      machineStatus.innerHTML = `✓ Pengolahan AI Selesai`;
      state.residueCompleted = true;
      if (arrowMachineToProduct) arrowMachineToProduct.classList.add('flowing');
      sfx.success();

      // Show Custom AI Product Card in Showcase
      showcaseContent.innerHTML = `
        <div class="ai-custom-product-card" style="background:linear-gradient(135deg, rgba(0,210,255,0.15), rgba(168,85,247,0.15)); border:1px solid #00d2ff; border-radius:8px; padding:10px; text-align:center; box-shadow:0 0 15px rgba(0,210,255,0.25);">
          <div style="font-size:24px; margin-bottom:4px;">💎</div>
          <span style="background:rgba(0,210,255,0.25); color:#00f59b; font-size:9px; font-weight:800; padding:2px 6px; border-radius:4px; display:inline-block; margin-bottom:6px;">
            ★ SOLUSI REKAYASA KHUSUS AI
          </span>
          <strong style="color:#ffffff; font-size:12px; display:block; line-height:1.3;">${solution.finalProduct}</strong>
          <small style="color:#38bdf8; font-size:10px; display:block; margin:4px 0;">Teknologi: ${solution.batTechnology}</small>
          <span style="font-size:9px; color:#cbd5e1; display:block; margin-bottom:6px;">${solution.productSpecs}</span>
          <div style="display:inline-block; font-size:9px; color:#00f59b; background:rgba(0,245,155,0.1); border:1px solid rgba(0,245,155,0.3); padding:2px 6px; border-radius:4px;">
            🛡️ ${solution.safetyCert}
          </div>
        </div>
      `;

      panToUnit('unitProductShowcase');

      questBadge.textContent = 'SOLUSI AI KHUSUS SELESAI';
      questText.innerHTML = `Limbah berhasil diolah dengan <strong>${solution.batTechnology}</strong> menjadi <strong>${solution.finalProduct}</strong>. Sekarang periksa <strong>Jalur 1: Pemurnian Air & Coolant (Atas)</strong>!`;

      btnWaterBranch.classList.add('active');
    }, 2200);
  }

  // Eksekusi Analisis Limbah
  if (btnRunAiWasteAnalysis) {
    btnRunAiWasteAnalysis.addEventListener('click', async () => {
      const promptText = aiWastePromptInput ? aiWastePromptInput.value.trim() : '';
      if (!promptText) {
        alert('Silakan tuliskan karakteristik limbah padat atau klik salah satu preset di atas.');
        return;
      }

      sfx.laserScan();
      if (aiResultsLoading) aiResultsLoading.style.display = 'block';
      if (aiResultsContent) aiResultsContent.style.display = 'none';

      const apiKey = getEffectiveGeminiKey();
      const provLabelWaste = getActiveProviderLabel();

      if (apiKey) {
        showAiThinkingWindow('AI menganalisis karakteristik limbah B3 & mencari solusi upcycling...', provLabelWaste);
        try {
          const solution = await callGeminiWasteApi(promptText);
          hideAiThinkingWindow();
          if (aiResultsLoading) aiResultsLoading.style.display = 'none';
          if (aiResultsContent) aiResultsContent.style.display = 'block';
          renderAiResults(solution, true, provLabelWaste);
          sfx.success();
          return;
        } catch (err) {
          hideAiThinkingWindow();
          console.warn('Gagal memanggil Gemini API, beralih ke Mesin Pakar RECHEMON bawaan:', err);
          const fallbackSolution = generateExpertWasteSolution(promptText);
          if (aiResultsLoading) aiResultsLoading.style.display = 'none';
          if (aiResultsContent) aiResultsContent.style.display = 'block';
          renderAiResults(fallbackSolution, false, `Catatan: Gemini API (${err.message}). Menampilkan rekomendasi terverifikasi dari Mesin Pakar Rekayasa RECHEMON.`);
          sfx.success();
          return;
        }
      }

      // Mode Offline / Tanpa API Key: Pakai Mesin Pakar RECHEMON Bawaan
      setTimeout(() => {
        const solution = generateExpertWasteSolution(promptText);
        if (aiResultsLoading) aiResultsLoading.style.display = 'none';
        if (aiResultsContent) aiResultsContent.style.display = 'block';
        renderAiResults(solution, false);
        sfx.success();
      }, 800);
    });
  }

  // Inisialisasi status API Key pada saat start
  updateApiKeyStatusUI();

  // Mini-Map Teleport Buttons
  document.querySelectorAll('.minimap-station').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      panToUnit(targetId);
    });
  });

  // Tank Close-Up Inspect Buttons (Look closer)
  document.querySelectorAll('.zoom-target-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const parentUnit = btn.closest('.plant-unit');
      if (parentUnit) {
        updateZoom(1.3);
        panToUnit(parentUnit.id);
      }
    });
  });

  // Zoom Controls
  btnZoomIn.addEventListener('click', () => updateZoom(state.zoomLevel + 0.15));
  btnZoomOut.addEventListener('click', () => updateZoom(state.zoomLevel - 0.15));
  btnZoomReset.addEventListener('click', () => updateZoom(1.0));

  // Sound Toggle
  btnSound.addEventListener('click', () => {
    sfx.enabled = !sfx.enabled;
    btnSound.textContent = sfx.enabled ? '🔊 Suara: Nyala' : '🔇 Suara: Mati';
    btnSound.classList.toggle('btn-accent', sfx.enabled);
  });

  // Reset Full Simulator
  btnReset.addEventListener('click', () => {
    if (!confirm('Ulangi simulasi pabrik dari awal?')) return;
    location.reload();
  });

  // Initialize Default State
  applyWasteProfile('electroplating');
  panToUnit('unitRawTank');
})();
