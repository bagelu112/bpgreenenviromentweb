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

  // Connectors
  const arrowResidueToMachine = document.getElementById('arrowResidueToMachine');
  const arrowMachineToProduct = document.getElementById('arrowMachineToProduct');
  const arrowWaterToSteril = document.getElementById('arrowWaterToSteril');
  const arrowSterilToPolish = document.getElementById('arrowSterilToPolish');
  const arrowPolishToServer = document.getElementById('arrowPolishToServer');

  // Scanner Lasers
  const laserAI1 = document.getElementById('laserAI1');
  const laserAI3 = document.getElementById('laserAI3');
  const laserAI4 = document.getElementById('laserAI4');

  // Buttons
  const btnPour = document.getElementById('btnPourWaste');
  const btnSeparate = document.getElementById('btnSeparate');
  const btnResidueBranch = document.getElementById('btnBranchResidue');
  const btnWaterBranch = document.getElementById('btnBranchWater');
  const btnReset = document.getElementById('btnResetSim');
  const btnSound = document.getElementById('btnToggleSound');
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnZoomReset = document.getElementById('btnZoomReset');

  // Modals
  const modalAI1 = document.getElementById('modalAI1');
  const modalAI2 = document.getElementById('modalAI2');
  const modalAI3 = document.getElementById('modalAI3');
  const modalAI4 = document.getElementById('modalAI4');

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
    if (labelSludgeRatio) labelSludgeRatio.textContent = `↗ Residu (${state.customSolidRatio}%)`;
    if (labelWaterRatio) labelWaterRatio.textContent = `↘ Filtrat (${state.customLiquidRatio}%)`;
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
      labelSludgeRatio.textContent = `↗ Residu (${state.customSolidRatio}%)`;
      labelWaterRatio.textContent = `↘ Filtrat (${state.customLiquidRatio}%)`;

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
      
      // Sludge (UP) and Water (DOWN) pipes activate in fork junction with profile colors
      pipeSludgeFlow.style.stroke = profile.pipeSludgeColor;
      pipeWaterFlow.style.stroke = profile.pipeWaterColor;
      pipeSludgeFlow.classList.add('flowing');
      pipeWaterFlow.classList.add('flowing');
      
      // Sludge and water tank fill heights accurately calculate from user's ratio
      const sludgeFillHeight = Math.round(20 + (state.customSolidRatio / 100) * 60);
      const waterFillHeight = Math.round(20 + (state.customLiquidRatio / 100) * 60);

      tankResidueLiquid.className = `liquid-layer ${profile.sludgeClass}`;
      tankResidueLiquid.style.height = `${sludgeFillHeight}%`;

      tankWaterLiquid.className = `liquid-layer ${profile.waterClass}`;
      tankWaterLiquid.style.height = `${waterFillHeight}%`;

      state.separated = true;
      state.residueInTank = true;
      state.waterInTank = true;
      centrifuge.classList.remove('spinning');

      btnSeparate.textContent = `✓ Terpisah (${state.customSolidRatio}:${state.customLiquidRatio})`;
      sfx.success();

      // Enable branch switcher
      btnResidueBranch.classList.add('active');

      questBadge.textContent = 'PILIHAN JALUR';
      questText.innerHTML = `Pemisahan selesai! <strong>${state.customSolidRatio}% Residu Padat</strong> naik ke Jalur Atas, <strong>${state.customLiquidRatio}% Filtrat Cair</strong> turun ke Jalur Bawah.`;
      
      // Auto prompt AI-1 sensor trigger after short delay
      setTimeout(() => {
        triggerAI1ResidueScan();
      }, 1000);

    }, 1500);
  });

  // --- Branch Focus Handlers ---
  btnResidueBranch.addEventListener('click', () => {
    state.activeBranch = 'residue';
    btnResidueBranch.classList.add('active');
    btnWaterBranch.classList.remove('active');
    panToUnit('unitResidueTank');
    sfx.click();

    questBadge.textContent = 'JALUR 1: RESIDU';
    questText.innerHTML = 'Fokus Jalur Atas (Residu Padat): Sensor <strong>AI-1</strong> menganalisis mineral ampas untuk rekomendasi produk upcycling.';
  });

  btnWaterBranch.addEventListener('click', () => {
    state.activeBranch = 'water';
    btnWaterBranch.classList.add('active');
    btnResidueBranch.classList.remove('active');
    panToUnit('unitWaterTank');
    sfx.click();

    questBadge.textContent = 'JALUR 2: AIR';
    questText.innerHTML = 'Fokus Jalur Bawah (Air & Coolant): <strong>Klik air di dalam tangki</strong> untuk uji lab & formula dosis AI-2.';
  });

  // ==========================================================================
  // JALUR 1: RESIDU PADAT (TOP ROW: AI-1 -> MESIN MEKANIKAL -> PRODUK JADI)
  // ==========================================================================

  function triggerAI1ResidueScan() {
    if (!state.residueInTank) return;
    panToUnit('unitResidueTank');
    sfx.laserScan();
    laserAI1.classList.add('active');

    const profile = getActiveProfile();

    setTimeout(() => {
      laserAI1.classList.remove('active');
      
      // Populate AI-1 Modal with profile telemetry
      document.getElementById('ai1ModalTitle').textContent = profile.ai1Title;
      document.getElementById('ai1SilicaDisplay').textContent = profile.silicaDisplay;
      document.getElementById('ai1IronDisplay').textContent = profile.ironDisplay;
      document.getElementById('ai1MetalsDisplay').textContent = profile.metalsDisplay;
      document.getElementById('ai1TclpDisplay').textContent = profile.tclpDisplay;
      document.getElementById('ai1RecommendationText').innerHTML = 
        `<strong>Hasil Analisis Sensor AI-1:</strong><br>${profile.recommendation}`;

      updateProductModalCards(profile);
      openModal(modalAI1);
      state.ai1Scanned = true;
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
      questText.innerHTML = `Sukses! Residu berhasil diolah menjadi <strong>${currentProductSpec.title}</strong>. Sekarang periksa <strong>Jalur 2: Air & Coolant (Bawah)</strong>!`;
      
      btnWaterBranch.classList.add('active');
    }, 2000);
  });

  // ==========================================================================
  // JALUR 2: FILTRASI AIR & AI COOLANT DATA CENTER (BOTTOM ROW)
  // ==========================================================================

  // Interactive Click on Water in Tank
  const clickWaterArea = document.getElementById('clickableWaterArea');
  clickWaterArea.addEventListener('click', () => {
    if (!state.waterInTank) {
      alert('Jalankan pemisahan limbah pada tombol Tahap 2 terlebih dahulu!');
      return;
    }
    sfx.laserScan();

    const profile = getActiveProfile();

    // Populate AI-2 Modal
    document.getElementById('ai2ModalTitle').textContent = `Uji Laboratorium & Resep Reaktan AI-2 (${profile.name})`;
    document.getElementById('ai2PhDisplay').textContent = `pH ${state.customPh.toFixed(1)}`;
    document.getElementById('ai2PhDisplay').style.color = (state.customPh < 6.5) ? '#f87171' : ((state.customPh > 8.0) ? '#c084fc' : '#38bdf8');
    document.getElementById('ai2TdsDisplay').textContent = state.customTds;
    document.getElementById('ai2MetalsDisplay').textContent = state.customMetals;
    document.getElementById('ai2CodDisplay').textContent = state.customCod;

    // Generate Adaptive 3-Reagent Recipe based on exact live pH
    const dosingData = profile.ai2DosingGenerator(state.customPh);
    const recipeContainer = document.getElementById('ai2RecipeList');
    
    let recipeHtml = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid rgba(0,210,255,0.25); padding-bottom:4px;">
        <strong style="color:#00d2ff;">Formula Injeksi Dosis Presisi AI-2:</strong>
        <span style="background:rgba(0,210,255,0.2); color:#00d2ff; font-family:var(--font-mono); font-size:10px; padding:2px 6px; border-radius:4px; font-weight:700;">
          Total Reaktan: ${dosingData.totalPct}
        </span>
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

    recipeHtml += `</div>
      <p style="font-size:10px; color:#94a3b8; margin-top:8px;">
        *Algoritma AI-2 secara otomatis menghitung volume penambahan kimia teroptimasi untuk meminimalkan lumpur sekunder dan menghemat biaya reagen hingga 34%.
      </p>`;

    recipeContainer.innerHTML = recipeHtml;

    openModal(modalAI2);
  });

  // Apply Chemical Dosing (AI-2 Formulation Confirmation)
  document.getElementById('btnApplyChemicalDosing').addEventListener('click', () => {
    closeModal(modalAI2);
    panToUnit('unitWaterTank');
    sfx.chemicalReact();

    const waterLiquid = document.getElementById('tankWaterLiquid');
    const reagentInjector = document.getElementById('reagentInjector');
    const profile = getActiveProfile();
    const dosingData = profile.ai2DosingGenerator(state.customPh);

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

  // AI-3 Evaluation Modal Trigger
  function triggerAI3Evaluation() {
    panToUnit('unitSterilTank');
    sfx.laserScan();
    laserAI3.classList.add('active');

    const profile = getActiveProfile();

    setTimeout(() => {
      laserAI3.classList.remove('active');

      // Populate AI-3 Modal
      document.getElementById('ai3EcDisplay').textContent = `${profile.ai3Ec} (Toleransi < 5.0)`;
      document.getElementById('ai3SilicaDisplay').textContent = `${profile.ai3Silica} (Anti Kerak Server)`;
      document.getElementById('ai3ExplanationText').innerHTML = 
        `<strong>Hasil Analisis Sensor AI-3:</strong><br>${profile.ai3Explanation}`;

      openModal(modalAI3);
    }, 1200);
  }

  document.getElementById('btnRecheckAI3').addEventListener('click', triggerAI3Evaluation);

  // Scenario A: Directly Qualified
  document.getElementById('btnAI3Pass').addEventListener('click', () => {
    closeModal(modalAI3);
    state.ai3Status = 'qualified';
    panToUnit('unitServerCoolant');
    sfx.success();

    tankSterilLiquid.style.height = '12%';
    if (arrowSterilToPolish) arrowSterilToPolish.classList.add('flowing');
    if (arrowPolishToServer) arrowPolishToServer.classList.add('flowing');
    
    activateServerCoolingLoop();

    questBadge.textContent = 'COOLANT AKTIF';
    questText.innerHTML = '✓ Air lolos standar AI-3! Mengalir langsung ke pendingin server AI dengan efisiensi PUE 1.12.';
  });

  // Scenario B: Needs Secondary Neutralization Tank 8 + AI-4
  document.getElementById('btnAI3Fail').addEventListener('click', () => {
    closeModal(modalAI3);
    state.ai3Status = 'unqualified';
    sfx.alert();

    const profile = getActiveProfile();

    panToUnit('unitPolishTank');
    state.secondaryPolishActive = true;
    if (arrowSterilToPolish) arrowSterilToPolish.classList.add('flowing');

    tankSterilLiquid.style.height = '12%';
    tankPolishLiquid.style.height = '75%';

    const polishStatus = document.getElementById('polishStatusText');
    polishStatus.innerHTML = `<span style="color:#f59e0b;">Memproses:</span> ${profile.ai4PolishNote}...`;

    questBadge.textContent = 'PENETRALAN LANJUTAN';
    questText.innerHTML = `Air dialihkan ke <strong>Penetral Tambahan</strong>. Resin mixed-bed aktif melakukan ${profile.ai4PolishNote}.`;

    // After polishing completes, AI-4 (located at the exit of Tank 8) certifies the coolant!
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

  // AI-4 Final Certification Confirmation
  document.getElementById('btnConfirmAI4').addEventListener('click', () => {
    closeModal(modalAI4);
    state.ai4Certified = true;
    panToUnit('unitServerCoolant');
    sfx.success();

    tankPolishLiquid.style.height = '10%';
    if (arrowPolishToServer) arrowPolishToServer.classList.add('flowing');

    activateServerCoolingLoop();

    questBadge.textContent = '100% COOLANT PURIFIED';
    questText.innerHTML = '✓ <strong>AI-4</strong> telah mensertifikasi air 100% ultra-pure! Loop pendingin Data Center AI beroperasi optimal.';
  });

  function activateServerCoolingLoop() {
    state.coolantInServer = true;
    serverCoolantFill.style.height = '100%';
    
    document.getElementById('serverTempDisplay').innerHTML = `
      <span style="color:#00f59b; font-weight:700;">36.2 °C</span>
    `;
    document.getElementById('serverPueDisplay').innerHTML = `
      <span style="color:#00d2ff; font-weight:700;">1.12 (Top 5%)</span>
    `;
    sfx.success();
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
