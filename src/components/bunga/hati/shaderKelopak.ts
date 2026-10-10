// Potongan GLSL bersama: bentuk kelopak mawar parametrik & pencahayaan lembut.
// Kelopak = permukaan grid (u -1..1 melintang, v 0..1 dari pangkal ke ujung) yang
// dilengkungkan di vertex shader: menangkup (penampang), melengkung memanjang
// dua ruas (pangkal & ujung), tepi menggulung keluar, dan sedikit bergelombang.

export const GLSL_BENTUK = /* glsl */ `
const float PI = 3.141592653589793;

float halus(float x) {
  x = clamp(x, 0.0, 1.0);
  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

// Profil lebar kelopak sepanjang v: pangkal sempit (cakar), terlebar sekitar 70%.
float profilLebar(float v) {
  float a = clamp(v / 0.7, 0.0, 1.0);
  float naik = 0.2 + 0.8 * pow(sin(a * PI * 0.5), 0.8);
  float b = clamp((v - 0.7) / 0.3, 0.0, 1.0);
  return naik * (1.0 - 0.1 * b * b);
}

// Garis kelopak 2D: x melintang (satuan lebar), y memanjang (satuan panjang).
// Ujung membulat dengan lekuk kecil di tengah.
vec2 garisKelopak(vec2 uv, float bulatUjung) {
  float u = uv.x;
  float v = uv.y;
  float bulat = bulatUjung * (1.0 - sqrt(max(1.0 - u * u * 0.985, 0.0))) * smoothstep(0.2, 1.0, v);
  float takik = bulatUjung * 0.1 * exp(-u * u * 26.0) * smoothstep(0.72, 1.0, v);
  return vec2(u * profilLebar(v), v - bulat - takik);
}

// Integral arah (sin psi, cos psi) untuk sudut psi = psi0 + k s.
vec2 busur(float s, float psi0, float k) {
  if (abs(k) < 0.002) {
    float m = psi0 + 0.5 * k * s;
    return s * vec2(sin(m), cos(m));
  }
  float psi1 = psi0 + k * s;
  return vec2(cos(psi0) - cos(psi1), sin(psi1) - sin(psi0)) / k;
}

// Titik kelopak dalam ruang mawar (sumbu mawar = +z).
// a: (phi azimut, L panjang, W setengah lebar, r0 jari-jari pangkal)
// b: (z0 tinggi pangkal, psi0 sudut buka, k1 lengkung pangkal, k2 lengkung ujung) — k per panjang
// c: (kc tangkup penampang, gulung tepi, gelombang, bulat ujung)
vec3 titikKelopak(vec2 uv, vec4 a, vec4 b, vec4 c, float benih) {
  vec2 g = garisKelopak(uv, c.w);
  float L = a.y;
  float x = g.x * a.z;
  float s = max(g.y, 0.0) * L;

  // Penampang menangkup, lebih dalam di pangkal.
  float kc = c.x * mix(1.0, 0.5, uv.y);
  float xc;
  float zc;
  if (abs(kc) < 0.01) {
    xc = x;
    zc = 0.5 * kc * x * x;
  } else {
    float sudut = x * kc;
    xc = sin(sudut) / kc;
    zc = (1.0 - cos(sudut)) / kc;
  }

  // Tepi menggulung keluar (ke sisi belakang kelopak).
  float e = smoothstep(0.42, 1.0, abs(uv.x));
  float gl = c.y * a.z * e * e * smoothstep(0.1, 0.95, uv.y);
  zc -= gl;
  xc -= sign(uv.x) * gl * 0.45;

  // Gelombang halus di tepi atas.
  zc += c.z * a.z * sin(uv.x * 5.0 + benih * 40.0) * uv.y * uv.y;

  // Lengkung memanjang dua ruas.
  float s1 = 0.48 * L;
  float k1 = b.z / L;
  float k2 = b.w / L;
  float sa = min(s, s1);
  vec2 kurva = busur(sa, b.y, k1);
  float psi = b.y + k1 * sa;
  if (s > s1) {
    float sb = s - s1;
    kurva += busur(sb, psi, k2);
    psi += k2 * sb;
  }

  float phi = a.x;
  vec3 O = vec3(cos(phi), sin(phi), 0.0);
  vec3 T = vec3(-sin(phi), cos(phi), 0.0);
  vec3 n = -cos(psi) * O + vec3(0.0, 0.0, sin(psi));
  return O * (a.w + kurva.x) + vec3(0.0, 0.0, b.x + kurva.y) + T * xc + n * zc;
}
`

// Pencahayaan lembut kelopak: wrap diffuse, tembus cahaya palsu (subsurface),
// kilau beludru di sudut miring, dan kilap lebar yang sangat tipis.
export const GLSL_CAHAYA = /* glsl */ `
vec3 bahuLembut(vec3 c) {
  // kompres sorotan agar kuning tidak "terbakar"
  vec3 lebih = max(c - 0.78, 0.0);
  return min(c, 0.78) + 0.22 * (1.0 - exp(-lebih / 0.22));
}

vec3 cahayaKelopak(vec3 alb, vec3 N, vec3 V, float ao, float tipis) {
  vec3 L1 = normalize(vec3(-0.45, 0.75, 0.5));
  vec3 L2 = normalize(vec3(0.8, -0.3, 0.5));
  float w = 0.3;
  float d1 = max((dot(N, L1) + w) / (1.0 + w), 0.0);
  float d2 = max((dot(N, L2) + w) / (1.0 + w), 0.0);
  vec3 langit = vec3(1.0, 0.96, 0.93);
  vec3 tanah = vec3(1.0, 0.8, 0.76);
  vec3 amb = mix(tanah, langit, clamp(N.y * 0.5 + 0.5 + N.z * 0.2, 0.0, 1.0)) * 0.24;
  vec3 dif = amb + vec3(1.0, 0.95, 0.88) * d1 * 1.0 + vec3(1.0, 0.86, 0.84) * d2 * 0.24;

  // Tembus cahaya: warna lebih jenuh & terang ketika cahaya datang dari balik kelopak.
  float puncak = max(max(alb.r, alb.g), max(alb.b, 1e-3));
  vec3 rona = mix(alb, alb / puncak * 0.9, 0.55);
  float tembus = (max(dot(-N, L1), 0.0) * 0.5 + 0.05) * tipis;

  // bayangan hangat: kanal biru & hijau meredup lebih cepat dari merah (seperti cahaya yang menembus kelopak)
  vec3 aoHangat = pow(vec3(ao), vec3(0.85, 1.2, 1.6));
  vec3 warna = alb * dif * aoHangat + rona * tembus * mix(0.45, 1.0, ao);

  // Beludru: kelopak mawar berbulu halus, terang di sudut miring.
  float fr = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  warna += mix(vec3(1.0, 0.95, 0.95), rona, 0.55) * fr * 0.22 * ao;

  // Kilap lebar tipis.
  vec3 H = normalize(L1 + V);
  warna += vec3(1.0, 0.97, 0.94) * pow(max(dot(N, H), 0.0), 28.0) * 0.06 * ao;
  return bahuLembut(warna);
}
`
