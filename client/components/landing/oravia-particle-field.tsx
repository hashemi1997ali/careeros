"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import styles from "@/app/landing.module.css";

const vertexShader = `
  uniform float uTime;
  uniform float uDistortion;
  uniform float uSize;
  uniform vec2 uMouse;
  varying float vNoise;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0 / 7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m *= m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vec3 pos = position;
    float noise = snoise(vec3(pos.x * 0.5 + uTime * 0.15, pos.y * 0.5, pos.z * 0.5));
    vNoise = noise;
    vec3 newPos = pos + normal * noise * uDistortion;
    float dist = distance(uMouse * 10.0, newPos.xy);
    float interaction = 1.0 - smoothstep(0.0, 6.0, dist);
    newPos.z += interaction * 1.5;
    vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uSize * (20.0 / -mvPosition.z);
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  varying float vNoise;
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    if (length(center) > 0.45) discard;
    vec3 tint = vec3(0.25, 0.35, 0.45);
    gl_FragColor = vec4(mix(uColor, tint, vNoise * 0.5 + 0.5), 0.86);
  }
`;

export function OraviaParticleField() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 20);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);
    const geometry = new THREE.BoxGeometry(9, 9, 9, 40, 40, 40);
    const uniforms = {
      uTime: { value: 0 },
      uDistortion: { value: 0 },
      uSize: { value: 1.8 },
      uColor: { value: new THREE.Color("#3c5759") },
      uMouse: { value: new THREE.Vector2(0, 0) },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
    });
    group.add(new THREE.Points(geometry, material));
    const syncTheme = () => {
      uniforms.uColor.value.set(document.documentElement.dataset.theme === "dark" ? "#ffffff" : "#202124");
    };
    syncTheme();
    const themeObserver = new MutationObserver(syncTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    let mouseX = 0;
    let mouseY = 0;
    const onPointerMove = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect();
      mouseX = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      mouseY = -(((event.clientY - bounds.top) / bounds.height) * 2 - 1);
    };
    let baseY = 2.5;
    const resize = () => {
      const width = host.clientWidth || 1;
      const height = host.clientHeight || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      const compact = window.innerWidth < 1024;
      baseY = compact ? 5 : 2.5;
      group.position.set(compact ? 4 : 0, baseY + window.scrollY * 0.005, compact ? -8 : 0);
      group.scale.setScalar(0.65);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let frame = 0;
    let time = 0;
    group.rotation.x = 0.48;
    group.rotation.y = 0.55;
    const draw = () => {
      frame = requestAnimationFrame(draw);
      if (!reduced.matches && !document.hidden) {
        time += 0.008;
        group.rotation.y = time * 0.2;
        group.rotation.z = window.scrollY * 0.0005;
        group.position.y = baseY + window.scrollY * 0.005;
        uniforms.uTime.value = time;
        uniforms.uMouse.value.x += (mouseX - uniforms.uMouse.value.x) * 0.03;
        uniforms.uMouse.value.y += (mouseY - uniforms.uMouse.value.y) * 0.03;
        camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.02;
        camera.position.y += (mouseY * 0.5 - camera.position.y) * 0.02;
      }
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    draw();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      observer.disconnect();
      themeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className={styles.particleField} data-particle-field="true" aria-hidden="true" />;
}
