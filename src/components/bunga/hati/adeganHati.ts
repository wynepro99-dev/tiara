// Adegan WebGL rangkaian mawar berbentuk hati (dimuat dinamis bersama three.js).
// Semua animasi mekar terjadi di GPU: tiap frame hanya dua uniform waktu yang berubah.

import {
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
} from 'three'
import { PILIHAN_KELUARGA, WARNA_DAUN, WARNA_MAWAR, WARNA_PENGISI, pilihBerbobot, type NamaWarna } from './palet'
import { GLSL_BENTUK, GLSL_CAHAYA } from './shaderKelopak'
import { RASIO_TINGGI_HATI as RASIO_TINGGI } from '../tipe'
import { bacaTataLetak, buatAcak, type PosMawar } from './tataLetak'

export interface OpsiAdeganHati {
  ukuran: number
  gerakDikurangi: boolean
  /** Dipanggil sekali ketika seluruh mawar selesai mekar. */
  onSelesai: () => void
  /** Dipanggil setelah frame pertama tergambar (untuk memudarkan kanvas masuk). */
  onSiap: () => void
  /** Dipanggil bila WebGL bermasalah (shader gagal dikompilasi / konteks hilang permanen). */
  onGagal: () => void
}

export interface AdeganHati {
  mekar(): void
  ubahUkuran(ukuran: number): void
  hancurkan(): void
}

const LEBAR_DUNIA = 2.34
const JUMLAH_KELOPAK = 22
const FOV = 22

// ————————————————————————————————————————— shader

const VERT_KELOPAK = /* glsl */ `
${GLSL_BENTUK}
attribute vec4 aKelopak; // phi, lapisan (0 dalam .. 1 luar), skala, benih
attribute vec4 aMawar;   // mulai, durasi, bukaMaks, benihMawar
attribute vec4 aWarnaA;  // pangkal.rgb, semu
attribute vec3 aWarnaB;  // badan
attribute vec3 aWarnaC;  // tepi
uniform float uWaktu;
uniform float uHidup;
uniform float uGerak;
varying vec2 vUV;
varying vec3 vN;
varying vec3 vPos;
varying float vAO;
varying float vT;
varying vec4 vWarnaA;
varying vec3 vWarnaB;
varying vec3 vWarnaC;

// Sudut buka kelopak lapisan t untuk kemajuan mekar p (kelopak luar membuka lebih dulu).
float bukaan(float t, float p) {
  float mulai = (1.0 - t) * 0.42;
  return halus((p - mulai) / (1.0 - mulai));
}

// Parameter bentuk kelopak menurut lapisan t (0 dalam .. 1 luar) dan bukaan o (0 kuncup .. 1 mekar).
void paramKelopak(float t, float o, float skala, float benih, float phi, out vec4 A, out vec4 B, out vec4 C) {
  float L = mix(0.3, 0.72, pow(t, 0.85)) * skala * mix(0.8, 1.0, o);
  float r0 = mix(0.03, 0.13, t) * mix(0.75, 1.0, o);
  // kelopak terdalam sempit & tinggi, menggulung konsentris membentuk pusat spiral
  float lebarBuka = min(L * mix(0.85, 0.62, smoothstep(0.0, 0.6, t)), 2.2 * r0 + 0.03 + t * 0.6);
  // saat kuncup tiap kelopak menjadi cangkang konsentris (jari-jari = r0) agar spiralnya rapi
  float W = mix(min(lebarBuka, 2.5 * r0), lebarBuka, o);
  float z0 = mix(0.03, -0.05, t);
  float acakSudut = (fract(benih * 7.13) - 0.5) * 0.16 * t * o;
  // kuncup: kelopak menggembung lalu ujungnya kembali ke jari-jari pangkal (tidak saling menembus)
  float psiTutup = mix(0.16, 0.4, t);
  float psi0 = mix(psiTutup, mix(0.1, 1.42, pow(t, 0.95)), o) + acakSudut;
  float k1 = mix(-2.0 * psiTutup, mix(-0.6, 0.12, t), o);
  float k2 = mix(-2.0 * psiTutup, mix(0.9, 2.5, t * t) - 2.8 * t * (1.0 - t), o);
  float kcDalam = min(1.0 / (r0 + 0.01), 2.4 / lebarBuka);
  float kc = mix(1.0 / r0, mix(kcDalam, 1.25, smoothstep(0.12, 0.7, t)), o);
  float gulung = mix(0.12, 0.36, smoothstep(0.3, 1.0, t)) * o;
  float gelombang = 0.035 * t * o;
  float bulat = mix(0.08, 0.34, smoothstep(0.1, 0.6, t));
  A = vec4(phi, L, W, r0);
  B = vec4(z0, psi0, k1, k2);
  C = vec4(kc, gulung, gelombang, bulat);
}

void main() {
  float t = aKelopak.y;
  float benih = aKelopak.w;
  float p = clamp((uWaktu - aMawar.x) / aMawar.y, 0.0, 1.0);
  float napas = sin(uHidup * 0.75 + aMawar.w * 6.2831 + t * 1.7) * 0.012 * p * uGerak;
  float o = bukaan(t, p) * aMawar.z + napas;

  vec4 A;
  vec4 B;
  vec4 C;
  paramKelopak(t, o, aKelopak.z, benih, aKelopak.x, A, B, C);

  vec2 uv = position.xy;
  if (t < 0.0) {
    // dasar bunga: cakram gelap kecil agar pusat tidak tembus ke latar
    float sudut = uv.x * PI;
    float oDasar = bukaan(0.5, p) * aMawar.z;
    vec3 P = vec3(cos(sudut), sin(sudut), 0.0) * uv.y * mix(0.05, 0.15, oDasar);
    mat4 m0 = modelMatrix * instanceMatrix;
    vec4 dunia0 = m0 * vec4(P, 1.0);
    vPos = dunia0.xyz;
    vN = normalize(mat3(m0) * vec3(0.0, 0.0, 1.0));
    vUV = vec2(0.0);
    vT = 0.0;
    vAO = 0.12;
    vWarnaA = aWarnaA;
    vWarnaB = aWarnaA.rgb;
    vWarnaC = aWarnaA.rgb;
    gl_Position = projectionMatrix * viewMatrix * dunia0;
    return;
  }
  float du = uv.x > 0.9 ? -0.02 : 0.02;
  float dv = uv.y > 0.95 ? -0.02 : 0.02;
  vec3 P = titikKelopak(uv, A, B, C, benih);
  vec3 Pu = titikKelopak(uv + vec2(du, 0.0), A, B, C, benih);
  vec3 Pv = titikKelopak(uv + vec2(0.0, dv), A, B, C, benih);
  vec3 N = normalize(cross(Pv - P, Pu - P)) * sign(du) * sign(dv);

  // Oklusi palsu:
  // 1) pangkal kelopak & kelopak dalam gelap,
  float aoPangkal = smoothstep(0.0, mix(0.75, 0.42, t), uv.y);
  float aoDalam = mix(0.4, 1.0, smoothstep(0.0, 0.7, t + uv.y * 0.25));
  // 2) bagian yang menyelusup ke bawah mawar tetangga,
  float aoBawah = mix(0.55, 1.0, smoothstep(-0.22, 0.02, P.z));
  // 3) pita bayangan di bawah ujung lapisan kelopak di atasnya (celah antar lapisan).
  float aoCincin = 1.0;
  float tAtas = t - 0.18;
  if (tAtas > 0.0) {
    vec4 A2;
    vec4 B2;
    vec4 C2;
    paramKelopak(tAtas, bukaan(tAtas, p) * aMawar.z, 1.0, benih, 0.0, A2, B2, C2);
    vec3 ujung = titikKelopak(vec2(0.0, 0.9), A2, B2, C2, benih);
    float rhoAtas = length(ujung.xy);
    float terbuka = smoothstep(rhoAtas - 0.03, rhoAtas + 0.15, length(P.xy));
    float diAtas = smoothstep(ujung.z - 0.06, ujung.z + 0.04, P.z);
    aoCincin = mix(0.4, 1.0, max(terbuka, diAtas));
  }
  vAO = mix(0.2, 1.0, aoPangkal) * aoDalam * aoBawah * aoCincin;

  mat4 m = modelMatrix * instanceMatrix;
  vec4 dunia = m * vec4(P, 1.0);
  vPos = dunia.xyz;
  vN = normalize(mat3(m) * N);
  vUV = uv;
  vT = t;
  vWarnaA = aWarnaA;
  vWarnaB = aWarnaB;
  vWarnaC = aWarnaC;
  gl_Position = projectionMatrix * viewMatrix * dunia;
}
`

const FRAG_KELOPAK = /* glsl */ `
${GLSL_CAHAYA}
varying vec2 vUV;
varying vec3 vN;
varying vec3 vPos;
varying float vAO;
varying float vT;
varying vec4 vWarnaA;
varying vec3 vWarnaB;
varying vec3 vWarnaC;

void main() {
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vPos);
  float v = vUV.y;
  float au = abs(vUV.x);
  // kira-kira kedekatan ke garis tepi kelopak
  float tepi = clamp(max(au * mix(0.8, 1.0, v), (v - 0.2) / 0.8 + au * au * 0.25), 0.0, 1.0);

  vec3 alb = mix(vWarnaA.rgb, vWarnaB, smoothstep(0.0, 0.6, v));
  alb = mix(alb, vWarnaC, smoothstep(0.4, 1.0, tepi) * vWarnaA.a * mix(0.7, 1.0, vT));
  // urat tipis memanjang
  float urat = 0.5 + 0.5 * sin(vUV.x * 42.0 + sin(v * 8.0 + vUV.x * 3.0) * 0.7);
  alb *= 1.0 - 0.07 * urat * (1.0 - smoothstep(0.15, 0.95, v));
  // sisi belakang kelopak lebih pucat
  if (!gl_FrontFacing) alb = mix(alb, vWarnaC, 0.2);
  // butiran halus beludru (juga mencegah banding gradasi)
  float butir = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  alb *= 0.975 + 0.05 * butir;

  vec3 warna = cahayaKelopak(alb, N, V, vAO, mix(0.6, 1.3, tepi));
  gl_FragColor = vec4(warna, 1.0);
  #include <colorspace_fragment>
}
`

const VERT_DAUN = /* glsl */ `
${GLSL_BENTUK}
attribute vec4 aDaun; // mulai, benih, lebar, -
uniform float uWaktu;
uniform float uHidup;
uniform float uGerak;
varying vec2 vUV;
varying vec3 vN;
varying vec3 vPos;

vec3 titikDaun(vec2 uv, float W, float lipat, float lengkung, float benih) {
  float v = uv.y;
  float prof = pow(sin(PI * pow(v, 0.72)), 0.85);
  // gerigi menghadap ujung
  float gig = fract(v * 11.0 + benih);
  prof *= 1.0 - 0.09 * gig * smoothstep(0.12, 0.3, v) * smoothstep(0.98, 0.8, v);
  float x = uv.x * prof * W;
  float z = abs(x) * lipat - lengkung * v * v + 0.02 * sin(v * 7.0 + benih * 20.0) * uv.x;
  return vec3(x, v, z);
}

void main() {
  float p = halus((uWaktu - aDaun.x) / 1.6);
  float lipat = mix(1.4, 0.38, p);
  float lengkung = mix(0.05, 0.14, p);
  float benih = aDaun.y;
  vec2 uv = position.xy;
  float du = uv.x > 0.9 ? -0.03 : 0.03;
  float dv = uv.y > 0.95 ? -0.02 : 0.02;
  vec3 P = titikDaun(uv, aDaun.z, lipat, lengkung, benih);
  vec3 Pu = titikDaun(uv + vec2(du, 0.0), aDaun.z, lipat, lengkung, benih);
  vec3 Pv = titikDaun(uv + vec2(0.0, dv), aDaun.z, lipat, lengkung, benih);
  vec3 N = normalize(cross(Pu - P, Pv - P)) * sign(du) * sign(dv);
  float s = mix(0.3, 1.0, p);
  float goyang = sin(uHidup * 0.6 + benih * 9.0) * 0.012 * uGerak * p;
  P = vec3(P.x + goyang * P.y, P.y, P.z) * s;
  mat4 m = modelMatrix * instanceMatrix;
  vec4 dunia = m * vec4(P, 1.0);
  vPos = dunia.xyz;
  vN = normalize(mat3(m) * N);
  vUV = uv;
  gl_Position = projectionMatrix * viewMatrix * dunia;
}
`

const FRAG_DAUN = /* glsl */ `
uniform vec3 uGelap;
uniform vec3 uTerang;
uniform vec3 uTulang;
uniform vec3 uSemu;
varying vec2 vUV;
varying vec3 vN;
varying vec3 vPos;

void main() {
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vPos);
  float au = abs(vUV.x);
  float v = vUV.y;
  vec3 alb = mix(uGelap, uTerang, (1.0 - au) * 0.55 + v * 0.15);
  float tulang = 1.0 - smoothstep(0.015, 0.07, au);
  float lateral = 1.0 - smoothstep(0.0, 0.07, abs(fract(v * 7.0 - au * 1.5) - 0.5) * 2.0 - 0.86);
  lateral *= smoothstep(0.95, 0.15, au) * smoothstep(0.05, 0.2, v);
  alb = mix(alb, uTulang, tulang * 0.75 + lateral * 0.18);
  alb = mix(alb, uSemu, smoothstep(0.82, 1.0, au) * 0.3);
  if (!gl_FrontFacing) alb = mix(alb, uTerang * 1.1, 0.35);
  float ao = mix(0.45, 1.0, smoothstep(0.0, 0.45, v));

  vec3 L1 = normalize(vec3(-0.5, 0.62, 0.72));
  float d = max((dot(N, L1) + 0.35) / 1.35, 0.0);
  vec3 amb = vec3(0.9, 0.86, 0.8) * 0.32;
  vec3 warna = alb * (amb + vec3(1.0, 0.96, 0.9) * d * 0.95) * ao;
  vec3 H = normalize(L1 + V);
  warna += vec3(1.0, 0.98, 0.92) * pow(max(dot(N, H), 0.0), 42.0) * 0.2 * ao;
  warna += uTerang * max(dot(-N, L1), 0.0) * 0.18;
  gl_FragColor = vec4(warna, 1.0);
  #include <colorspace_fragment>
}
`

const VERT_PENGISI = /* glsl */ `
attribute vec4 aIsi; // mulai, benih, skala, -
uniform float uWaktu;
varying vec3 vN;
varying vec3 vPos;
varying float vH;

float halusIsi(float x) { x = clamp(x, 0.0, 1.0); return x * x * (3.0 - 2.0 * x); }

void main() {
  float p = halusIsi((uWaktu - aIsi.x) / 0.9);
  vec3 P = position * aIsi.z * p;
  mat4 m = modelMatrix * instanceMatrix;
  vec4 dunia = m * vec4(P, 1.0);
  vPos = dunia.xyz;
  vN = normalize(mat3(m) * normal);
  vH = position.z;
  gl_Position = projectionMatrix * viewMatrix * dunia;
}
`

const FRAG_PENGISI = /* glsl */ `
uniform vec3 uWarna;
uniform vec3 uPusat;
varying vec3 vN;
varying vec3 vPos;
varying float vH;

void main() {
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 L1 = normalize(vec3(-0.5, 0.62, 0.72));
  float d = max((dot(N, L1) + 0.5) / 1.5, 0.0);
  // pusat kuntum sedikit kehijauan/gelap, tepi terang
  vec3 alb = mix(uPusat, uWarna, smoothstep(-0.25, 0.1, vH));
  vec3 warna = alb * (vec3(0.42, 0.38, 0.36) + vec3(1.0, 0.96, 0.9) * d * 0.72);
  gl_FragColor = vec4(min(warna, vec3(1.0)), 1.0);
  #include <colorspace_fragment>
}
`

const VERT_BAYANG = /* glsl */ `
attribute vec2 aBayang; // mulai, kekuatan
uniform float uWaktu;
varying vec2 vUV;
varying float vKuat;
void main() {
  float p = clamp((uWaktu - aBayang.x) / 2.0, 0.0, 1.0);
  vKuat = aBayang.y * p * p * (3.0 - 2.0 * p);
  vUV = uv;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
}
`

const FRAG_BAYANG = /* glsl */ `
varying vec2 vUV;
varying float vKuat;
void main() {
  float r = length(vUV - 0.5) * 2.0;
  float a = exp(-r * r * 3.2) * (1.0 - smoothstep(0.8, 1.0, r)) * vKuat;
  gl_FragColor = vec4(0.2, 0.02, 0.05, a);
}
`

const FRAG_BAYANG_HATI = /* glsl */ `
uniform sampler2D uPeta;
uniform float uKuat;
uniform float uWaktu;
varying vec2 vUV;
void main() {
  float a = texture2D(uPeta, vUV).a * uKuat * smoothstep(0.2, 3.2, uWaktu);
  gl_FragColor = vec4(0.32, 0.05, 0.09, a);
}
`

const VERT_POLOS = /* glsl */ `
varying vec2 vUV;
void main() {
  vUV = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

// ————————————————————————————————————————— geometri

/** Grid (u -1..1, v 0..1). Urutan segitiga dibuat agar sisi depan = sisi dalam kelopak. */
function buatGrid(nu: number, nv: number): BufferGeometry {
  const pos: number[] = []
  const indeks: number[] = []
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) pos.push((i / nu) * 2 - 1, j / nv, 0)
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i
      const b = a + 1
      const c = a + nu + 1
      const d = c + 1
      indeks.push(a, c, b, b, c, d)
    }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setIndex(indeks)
  return g
}

/** Bunga kecil baby's breath: cawan lima lekuk. */
function buatKuntum(): BufferGeometry {
  const pos: number[] = [0, 0, -0.25]
  const nor: number[] = [0, 0, 1]
  const indeks: number[] = []
  const seg = 30
  for (let cincin = 1; cincin <= 2; cincin++) {
    for (let i = 0; i < seg; i++) {
      const th = (i / seg) * Math.PI * 2
      const r = cincin === 1 ? 0.5 : 1 + 0.22 * Math.cos(th * 5)
      const z = 0.35 * r * r - 0.25
      pos.push(Math.cos(th) * r, Math.sin(th) * r, z)
      const n = new Vector3(-Math.cos(th) * 0.7 * r, -Math.sin(th) * 0.7 * r, 1).normalize()
      nor.push(n.x, n.y, n.z)
    }
  }
  for (let i = 0; i < seg; i++) {
    const a = 1 + i
    const b = 1 + ((i + 1) % seg)
    indeks.push(0, a, b)
    const c = 1 + seg + i
    const d = 1 + seg + ((i + 1) % seg)
    indeks.push(a, c, d, a, d, b)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new Float32BufferAttribute(nor, 3))
  g.setIndex(indeks)
  return g
}

function teksturBayangHati(garis: [number, number][]): CanvasTexture {
  const S = 256
  const kanvas = document.createElement('canvas')
  kanvas.width = S
  kanvas.height = S
  const ctx = kanvas.getContext('2d')!
  // Gambar hati jauh di luar kanvas; hanya bayangannya (shadowOffset) yang masuk — sekali saat awal.
  const geser = S * 4
  ctx.shadowColor = 'rgba(0,0,0,1)'
  ctx.shadowBlur = S * 0.07
  ctx.shadowOffsetX = geser
  ctx.beginPath()
  garis.forEach(([x, y], i) => {
    const px = S / 2 + x * S * 0.4 - geser
    const py = S / 2 - y * S * 0.4
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  })
  ctx.closePath()
  ctx.fill()
  const t = new CanvasTexture(kanvas)
  t.needsUpdate = true
  return t
}

// ————————————————————————————————————————— susunan

interface DataMawar {
  pos: PosMawar
  z: number
  sumbu: Vector3
  putar: number
  skala: number
  mulai: number
  durasi: number
  bukaMaks: number
  warna: NamaWarna
}

function susunMawar() {
  const tata = bacaTataLetak()
  const acak = buatAcak(29)
  let yMin = Infinity
  let yMax = -Infinity
  for (const m of tata.mawar) {
    yMin = Math.min(yMin, m.y)
    yMax = Math.max(yMax, m.y)
  }
  const rentangY = Math.max(yMax - yMin, 1e-3)

  const daftar: DataMawar[] = tata.mawar.map((m) => {
    const jarak = Math.min(1, Math.hypot(m.x, (m.y - 0.05) * 1.1))
    const z = 0.2 * (1 - jarak * jarak) + (m.tepi ? -0.02 : 0)
    // sumbu mawar condong keluar dari pusat hati
    const arah = Math.atan2(m.y - 0.05, m.x)
    const condong = (m.tepi ? 0.42 : 0.22) * jarak + acak() * 0.1
    const sumbu = new Vector3(Math.cos(arah) * Math.sin(condong), Math.sin(arah) * Math.sin(condong), Math.cos(condong)).normalize()
    const kuncup = m.r < 0.1
    const kel = m.keluarga
    let warna = pilihBerbobot(PILIHAN_KELUARGA[kel], acak())
    if (kuncup && kel === 'merah' && acak() < 0.5) warna = 'anggur'
    return {
      pos: m,
      z,
      sumbu,
      putar: acak() * Math.PI * 2,
      skala: m.r / 0.6,
      // gelombang mekar: dari ujung bawah naik ke dua lengkung atas
      mulai: ((m.y - yMin) / rentangY) * 1.3 + acak() * 0.3,
      durasi: 1.9 + acak() * 0.4,
      bukaMaks: kuncup ? 0.42 + acak() * 0.18 : m.tepi ? 0.8 + acak() * 0.15 : 0.9 + acak() * 0.1,
      warna,
    }
  })
  return { tata, daftar, acak }
}

// ————————————————————————————————————————— adegan

export function buatAdeganHati(wadah: HTMLElement, opsi: OpsiAdeganHati): AdeganHati {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setClearColor(0x000000, 0)
  const kanvas = renderer.domElement
  kanvas.style.width = '100%'
  kanvas.style.height = '100%'
  kanvas.style.display = 'block'
  wadah.appendChild(kanvas)

  const scene = new Scene()
  const kamera = new PerspectiveCamera(FOV, 1 / RASIO_TINGGI, 0.1, 50)
  const sumberDaya: { dispose(): void }[] = []
  const seragam = { uWaktu: { value: 0 }, uHidup: { value: 0 }, uGerak: { value: opsi.gerakDikurangi ? 0 : 1 } }

  const { tata, daftar, acak } = susunMawar()
  let tSelesai = 0

  // —— kelopak mawar (satu InstancedMesh untuk semua mawar)
  // Segmen grid kelopak: kanvas HP cukup 12×10 (beban vertex −35%), layar besar 16×12.
  const geoKelopak = opsi.ukuran < 420 ? buatGrid(12, 10) : buatGrid(16, 12)
  const n = daftar.length * (JUMLAH_KELOPAK + 1)
  const aKelopak = new Float32Array(n * 4)
  const aMawar = new Float32Array(n * 4)
  const aWarnaA = new Float32Array(n * 4)
  const aWarnaB = new Float32Array(n * 3)
  const aWarnaC = new Float32Array(n * 3)
  const matKelopak = new ShaderMaterial({
    vertexShader: VERT_KELOPAK,
    fragmentShader: FRAG_KELOPAK,
    uniforms: seragam,
    side: DoubleSide,
  })
  const kelopak = new InstancedMesh(geoKelopak, matKelopak, n)
  kelopak.frustumCulled = false
  const m4 = new Matrix4()
  const q = new Quaternion()
  const qPutar = new Quaternion()
  const sumbuZ = new Vector3(0, 0, 1)
  const v3 = new Vector3()
  const skalaV = new Vector3()
  const cPangkal = new Color()
  const cBadan = new Color()
  const cTepi = new Color()
  const SUDUT_EMAS = Math.PI * (3 - Math.sqrt(5))
  let k = 0
  for (const d of daftar) {
    q.setFromUnitVectors(sumbuZ, d.sumbu)
    qPutar.setFromAxisAngle(sumbuZ, d.putar)
    q.multiply(qPutar)
    m4.compose(v3.set(d.pos.x, d.pos.y, d.z), q, skalaV.setScalar(d.skala))
    const w = WARNA_MAWAR[d.warna]
    // variasi rona kecil tiap mawar agar tidak terlihat salin-tempel
    const geserL = (acak() - 0.5) * 0.08
    cPangkal.set(w.pangkal).offsetHSL(0, 0, geserL * 0.5)
    cBadan.set(w.badan).offsetHSL((acak() - 0.5) * 0.012, 0, geserL)
    cTepi.set(w.tepi).offsetHSL(0, 0, geserL)
    const benihMawar = acak()
    tSelesai = Math.max(tSelesai, d.mulai + d.durasi)
    for (let i = -1; i < JUMLAH_KELOPAK; i++, k++) {
      kelopak.setMatrixAt(k, m4)
      // i = -1: cakram dasar bunga
      const t = i < 0 ? -1 : i / (JUMLAH_KELOPAK - 1)
      aKelopak.set([i * SUDUT_EMAS + (acak() - 0.5) * 0.18, t, 0.94 + acak() * 0.12, acak()], k * 4)
      aMawar.set([d.mulai, d.durasi, d.bukaMaks, benihMawar], k * 4)
      aWarnaA.set([cPangkal.r, cPangkal.g, cPangkal.b, w.semu], k * 4)
      aWarnaB.set([cBadan.r, cBadan.g, cBadan.b], k * 3)
      aWarnaC.set([cTepi.r, cTepi.g, cTepi.b], k * 3)
    }
  }
  geoKelopak.setAttribute('aKelopak', new InstancedBufferAttribute(aKelopak, 4))
  geoKelopak.setAttribute('aMawar', new InstancedBufferAttribute(aMawar, 4))
  geoKelopak.setAttribute('aWarnaA', new InstancedBufferAttribute(aWarnaA, 4))
  geoKelopak.setAttribute('aWarnaB', new InstancedBufferAttribute(aWarnaB, 3))
  geoKelopak.setAttribute('aWarnaC', new InstancedBufferAttribute(aWarnaC, 3))
  kelopak.instanceMatrix.needsUpdate = true
  scene.add(kelopak)
  sumberDaya.push(geoKelopak, matKelopak)

  // Waktu mulai bagian lain mengikuti mawar terdekat.
  const mulaiTerdekat = (x: number, y: number) => {
    let terbaik = daftar[0]
    let jarak = Infinity
    for (const d of daftar) {
      const j = Math.hypot(d.pos.x - x, d.pos.y - y)
      if (j < jarak) {
        jarak = j
        terbaik = d
      }
    }
    return terbaik ? terbaik.mulai : 0
  }

  // —— daun
  if (tata.daun.length) {
    const geoDaun = buatGrid(6, 14)
    const jumlahDaun = tata.daun.length * 2
    const aDaun = new Float32Array(jumlahDaun * 4)
    const matDaun = new ShaderMaterial({
      vertexShader: VERT_DAUN,
      fragmentShader: FRAG_DAUN,
      side: DoubleSide,
      uniforms: {
        ...seragam,
        uGelap: { value: new Color(WARNA_DAUN.gelap) },
        uTerang: { value: new Color(WARNA_DAUN.terang) },
        uTulang: { value: new Color(WARNA_DAUN.tulang) },
        uSemu: { value: new Color(WARNA_DAUN.semu) },
      },
    })
    const daun = new InstancedMesh(geoDaun, matDaun, jumlahDaun)
    daun.frustumCulled = false
    const qa = new Quaternion()
    const qb = new Quaternion()
    const sumbuX = new Vector3(1, 0, 0)
    let j = 0
    for (const d of tata.daun) {
      const mulai = mulaiTerdekat(d.x, d.y) + 0.15
      for (let s = 0; s < 2; s++, j++) {
        const sudut = d.sudut + (s === 0 ? 0 : (acak() < 0.5 ? -1 : 1) * (0.5 + acak() * 0.25))
        const panjang = d.panjang * (s === 0 ? 1 : 0.72)
        qa.setFromAxisAngle(sumbuZ, sudut - Math.PI / 2)
        qb.setFromAxisAngle(sumbuX, 0.22 + acak() * 0.15)
        qa.multiply(qb)
        m4.compose(v3.set(d.x, d.y, -0.1 - s * 0.02), qa, skalaV.setScalar(panjang))
        daun.setMatrixAt(j, m4)
        aDaun.set([mulai + s * 0.12, acak(), 0.36 + acak() * 0.05, 0], j * 4)
      }
    }
    geoDaun.setAttribute('aDaun', new InstancedBufferAttribute(aDaun, 4))
    scene.add(daun)
    sumberDaya.push(geoDaun, matDaun)
  }

  // —— pengisi: baby's breath putih & titik kuning
  const buatPengisi = (jenis: 'putih' | 'kuning', geo: BufferGeometry, warna: string, pusat: string, ukuran: number) => {
    const titik = tata.pengisi.filter((p) => p.jenis === jenis)
    if (!titik.length) return
    const aIsi = new Float32Array(titik.length * 4)
    const mat = new ShaderMaterial({
      vertexShader: VERT_PENGISI,
      fragmentShader: FRAG_PENGISI,
      side: DoubleSide,
      uniforms: { uWaktu: seragam.uWaktu, uWarna: { value: new Color(warna) }, uPusat: { value: new Color(pusat) } },
    })
    const mesh = new InstancedMesh(geo, mat, titik.length)
    mesh.frustumCulled = false
    titik.forEach((p, i) => {
      const jarak = Math.min(1, Math.hypot(p.x, (p.y - 0.05) * 1.1))
      const z = 0.2 * (1 - jarak * jarak) - 0.02 + acak() * 0.05
      q.setFromAxisAngle(v3.set(acak() - 0.5, acak() - 0.5, 0).normalize(), acak() * 0.6)
      m4.compose(v3.set(p.x, p.y, z), q, skalaV.setScalar(1))
      mesh.setMatrixAt(i, m4)
      aIsi.set([mulaiTerdekat(p.x, p.y) + 0.9 + acak() * 0.5, acak(), ukuran * (0.75 + acak() * 0.5), 0], i * 4)
    })
    geo.setAttribute('aIsi', new InstancedBufferAttribute(aIsi, 4))
    scene.add(mesh)
    sumberDaya.push(geo, mat)
  }
  buatPengisi('putih', buatKuntum(), WARNA_PENGISI.putih, WARNA_PENGISI.putihPusat, 0.02)
  buatPengisi('kuning', new IcosahedronGeometry(1, 1), WARNA_PENGISI.kuning, WARNA_PENGISI.kuningGelap, 0.014)

  // —— bayangan kontak di bawah tiap mawar (oklusi antar bunga)
  {
    const geo = new PlaneGeometry(1, 1)
    const aBayang = new Float32Array(daftar.length * 2)
    const mat = new ShaderMaterial({
      vertexShader: VERT_BAYANG,
      fragmentShader: FRAG_BAYANG,
      uniforms: { uWaktu: seragam.uWaktu },
      transparent: true,
      depthWrite: false,
    })
    const mesh = new InstancedMesh(geo, mat, daftar.length)
    mesh.frustumCulled = false
    daftar.forEach((d, i) => {
      m4.compose(v3.set(d.pos.x, d.pos.y - 0.02, d.z - 0.12), q.identity(), skalaV.set(d.pos.r * 2.5, d.pos.r * 2.5, 1))
      mesh.setMatrixAt(i, m4)
      aBayang[i * 2] = d.mulai
      aBayang[i * 2 + 1] = 0.42
    })
    geo.setAttribute('aBayang', new InstancedBufferAttribute(aBayang, 2))
    mesh.renderOrder = 1
    scene.add(mesh)
    sumberDaya.push(geo, mat)
  }

  // —— bayangan lembut seluruh hati di "halaman"
  {
    const tekstur = teksturBayangHati(tata.garis)
    const geo = new PlaneGeometry(2.5, 2.5)
    const mat = new ShaderMaterial({
      vertexShader: VERT_POLOS,
      fragmentShader: FRAG_BAYANG_HATI,
      uniforms: { uPeta: { value: tekstur }, uKuat: { value: 0.18 }, uWaktu: seragam.uWaktu },
      transparent: true,
      depthWrite: false,
    })
    const mesh = new Mesh(geo, mat)
    mesh.position.set(0.02, -0.06, -0.45)
    mesh.renderOrder = 0
    scene.add(mesh)
    sumberDaya.push(geo, mat, tekstur)
  }

  // ————————————————————————————————————————— ukuran & loop

  const aturUkuran = (ukuran: number) => {
    const lebar = Math.max(1, Math.round(ukuran))
    const tinggi = Math.max(1, Math.round(ukuran * RASIO_TINGGI))
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(lebar, tinggi, false)
    kamera.aspect = lebar / tinggi
    const jarak = LEBAR_DUNIA / 2 / Math.tan(((FOV / 2) * Math.PI) / 180) / kamera.aspect
    kamera.position.set(0, 0, jarak)
    kamera.lookAt(0, 0, 0)
    kamera.updateProjectionMatrix()
  }
  aturUkuran(opsi.ukuran)

  // Loop hanya berjalan selama mekar. Sebelum dan sesudahnya gambar tidak berubah, jadi cukup
  // satu frame (render sesuai permintaan) — GPU & baterai HP bebas untuk animasi lain.
  const SISA_MEKAR = 0.25
  let idRaf = 0
  let tPasang = performance.now()
  let tMekar = -1
  let tBerhenti = 0
  let idGagal = 0
  let selesai = false
  let siap = false
  let dikompilasi = false
  let terlihat = true
  let konteksHilang = false
  let dihancurkan = false

  const waktuMekar = (sekarang: number) => (tMekar < 0 ? 0 : (sekarang - tMekar) / 1000)
  const sedangMekar = (sekarang: number) =>
    tMekar >= 0 && !opsi.gerakDikurangi && waktuMekar(sekarang) < tSelesai + SISA_MEKAR

  const gambar = (sekarang: number) => {
    const waktu = waktuMekar(sekarang)
    seragam.uWaktu.value = opsi.gerakDikurangi && tMekar >= 0 ? tSelesai + 1 : Math.min(waktu, tSelesai + SISA_MEKAR)
    seragam.uHidup.value = (sekarang - tPasang) / 1000
    renderer.render(scene, kamera)
    if (!siap) {
      siap = true
      opsi.onSiap()
    }
    if (!selesai && tMekar >= 0 && (waktu >= tSelesai || opsi.gerakDikurangi)) {
      selesai = true
      if (opsi.gerakDikurangi) window.setTimeout(() => !dihancurkan && opsi.onSelesai(), 600)
      else opsi.onSelesai()
    }
  }

  const bingkai = (sekarang: number) => {
    idRaf = 0
    gambar(sekarang)
    if (sedangMekar(sekarang)) jadwal()
  }

  /** Minta satu frame (loop berlanjut sendiri selama mekar). */
  function jadwal() {
    if (dihancurkan || !dikompilasi || idRaf || konteksHilang || !terlihat || document.hidden) return
    idRaf = requestAnimationFrame(bingkai)
  }

  const berhenti = () => {
    if (idRaf) cancelAnimationFrame(idRaf)
    idRaf = 0
    if (!tBerhenti) tBerhenti = performance.now()
  }
  const lanjutkan = () => {
    if (!terlihat || document.hidden || konteksHilang) return
    // geser jam agar animasi melanjutkan dari titik terakhir, bukan melompat
    if (tBerhenti) {
      const jeda = performance.now() - tBerhenti
      tPasang += jeda
      if (tMekar >= 0) tMekar += jeda
      tBerhenti = 0
    }
    jadwal()
  }

  const padaVisibilitas = () => (document.hidden ? berhenti() : lanjutkan())
  document.addEventListener('visibilitychange', padaVisibilitas)
  const pengamat = new IntersectionObserver(([e]) => {
    terlihat = e.isIntersecting
    if (terlihat) lanjutkan()
    else berhenti()
  })
  pengamat.observe(wadah)

  // Konteks hilang (mis. GPU HP sibuk): tunggu pemulihan sebentar, bila tidak pulih pakai cadangan.
  const padaHilang = (e: Event) => {
    e.preventDefault()
    konteksHilang = true
    berhenti()
    window.clearTimeout(idGagal)
    idGagal = window.setTimeout(() => !dihancurkan && opsi.onGagal(), 2500)
  }
  const padaPulih = () => {
    konteksHilang = false
    window.clearTimeout(idGagal)
    lanjutkan()
  }
  kanvas.addEventListener('webglcontextlost', padaHilang)
  kanvas.addEventListener('webglcontextrestored', padaPulih)
  renderer.debug.onShaderError = () => {
    if (!dihancurkan) opsi.onGagal()
  }

  // Kompilasi shader dulu (paralel bila didukung) agar tidak tersendat di frame pertama.
  renderer
    .compileAsync(scene, kamera)
    .catch(() => undefined)
    .then(() => {
      if (dihancurkan) return
      dikompilasi = true
      tPasang = performance.now()
      if (tMekar >= 0) tMekar = tPasang
      jadwal()
    })

  return {
    mekar() {
      if (tMekar >= 0) return
      tMekar = performance.now()
      jadwal()
    },
    ubahUkuran(ukuran: number) {
      aturUkuran(ukuran)
      // gambar langsung: mengubah ukuran kanvas mengosongkannya, jangan sampai sempat tampil kosong
      if (siap && !konteksHilang) gambar(performance.now())
    },
    hancurkan() {
      dihancurkan = true
      berhenti()
      window.clearTimeout(idGagal)
      document.removeEventListener('visibilitychange', padaVisibilitas)
      pengamat.disconnect()
      kanvas.removeEventListener('webglcontextlost', padaHilang)
      kanvas.removeEventListener('webglcontextrestored', padaPulih)
      renderer.debug.onShaderError = null
      for (const s of sumberDaya) s.dispose()
      scene.clear()
      renderer.dispose()
      renderer.forceContextLoss()
      kanvas.remove()
    },
  }
}
