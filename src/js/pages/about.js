/**
 * About Page Component - EcoDaily Campus
 */
class AboutPage {
  constructor() {
    this.container = document.getElementById('app');
    this.render();
    window.scrollTo(0, 0);
  }

  render() {
    this.container.innerHTML = `
      <div class="about-page container section">
        <!-- Hero Section -->
        <div class="about-hero">
          <img src="about_hero_image_1776873457483.png" alt="Eco Campus Life">
          <div class="about-hero-overlay"></div>
          <div class="about-hero-content">
            <h1>Untuk Masa Depan <span class="highlight">Lebih Hijau</span></h1>
            <p>Membangun komunitas kampus yang berkelanjutan melalui aksi nyata dan gaya hidup ramah lingkungan.</p>
          </div>
        </div>

        <!-- Mission Section -->
        <div class="about-section">
          <div class="about-text">
            <h2>Misi Kami</h2>
            <p>EcoDaily Campus lahir dari visi sederhana: menjadikan keberlanjutan sebagai bagian tak terpisahkan dari kehidupan mahasiswa sehari-hari. Kami percaya bahwa perubahan besar dimulai dari pilihan kecil yang konsisten di lingkungan terdekat kita—kampus.</p>
            <p>Melalui platform ini, kami menghubungkan mahasiswa dengan produk-produk pilihan yang ramah lingkungan dan memberikan insentif melalui Eco Challenges untuk setiap aksi positif yang dilakukan.</p>
          </div>
          <div class="about-image">
             <img src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600" alt="Sustainability" style="width: 100%; border-radius: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
          </div>
        </div>

        <!-- Stats Section -->
        <div class="about-stats">
          <div class="about-stat-item">
            <h3>5K+</h3>
            <p>Eco Points Diberikan</p>
          </div>
          <div class="about-stat-item">
            <h3>200+</h3>
            <p>Produk Berkelanjutan</p>
          </div>
          <div class="about-stat-item">
            <h3>1.2K</h3>
            <p>Anggota Komunitas</p>
          </div>
        </div>

        <!-- Values Section -->
        <div class="about-values">
          <h2 class="text-center mb-5" style="font-size: 2.5rem; font-weight: 900; color: var(--color-secondary);">Nilai Inti Kami</h2>
          <div class="values-grid">
            <div class="value-card">
              <span class="value-icon">🌱</span>
              <h4>Eco-Friendly</h4>
              <p>Setiap produk dan tantangan di kurasi ketat untuk memastikan dampak lingkungan yang minimal dan manfaat maksimal bagi bumi.</p>
            </div>
            <div class="value-card">
              <span class="value-icon">🏫</span>
              <h4>Campus-Centric</h4>
              <p>Didesain khusus untuk kebutuhan mahasiswa, memberikan solusi praktis untuk gaya hidup hijau di tengah kesibukan akademik.</p>
            </div>
            <div class="value-card">
              <span class="value-icon">🤝</span>
              <h4>Community-Driven</h4>
              <p>Kami percaya pada kekuatan kolektif. Bersama-sama, kita membangun ekosistem yang saling mendukung dalam menjaga lingkungan.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

export default AboutPage;
