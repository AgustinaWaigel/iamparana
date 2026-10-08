// Dibuja la Tierra como un globo de dibujo: un mapa de colores planos (cada continente con su
// color misionero) sobre una esfera, con contorno, sombra de un solo tono y un brillo.
// Usa WebGL directo, sin librerías. El mapa se generó a partir de la foto Blue Marble de la NASA.
//
// La esfera ocupa el 80 % del lienzo y gira con los mismos ángulos (phi, theta) que usa
// `proyectar` en mision-globo.tsx, así los puntos y la flecha caen justo sobre el mapa.

const VERTICES = `
attribute vec2 a;
varying vec2 v;
void main() {
  v = a;
  gl_Position = vec4(a, 0.0, 1.0);
}`;

const PIXELES = `
precision highp float;
uniform sampler2D mapa;
uniform float phi;
uniform float theta;
uniform float px;
uniform float listo;
varying vec2 v;

const float R = 0.8;
const float TRAZO = 0.03;
const float PI = 3.14159265;
const vec3 CONTORNO = vec3(0.227, 0.082, 0.031);
const vec3 MAR = vec3(0.561, 0.847, 0.961);
// Borde del globo, color crema: lo despega del fondo oscuro como una calcomanía.
const vec3 BORDE = vec3(1.0, 0.965, 0.89);

void main() {
  float d = length(v);
  float dentro = smoothstep(R, R - px * 1.5, d);
  float disco = smoothstep(R + TRAZO, R + TRAZO - px * 1.5, d);
  vec3 color = BORDE;

  if (d < R) {
    vec3 n = vec3(v, sqrt(R * R - d * d)) / R;
    float cp = cos(phi), sp = sin(phi), ct = cos(theta), st = sin(theta);
    // Del punto que se ve en pantalla al punto del planeta (rotación inversa).
    vec3 p = vec3(
      cp * n.x + sp * st * n.y - sp * ct * n.z,
      ct * n.y + st * n.z,
      sp * n.x - cp * st * n.y + cp * ct * n.z
    );
    float lat = asin(clamp(p.y, -1.0, 1.0));
    float lon = atan(p.z, -p.x);
    color = mix(MAR, texture2D(mapa, vec2(fract(lon / (2.0 * PI)), 0.5 - lat / PI)).rgb, listo);

    // Meridianos y paralelos cada 30 grados, como en un globo de escuela: solo sobre el mar.
    float paso = PI / 6.0;
    float aMeridiano = abs(fract(lon / paso + 0.5) - 0.5) * paso * cos(lat);
    float aParalelo = abs(fract(lat / paso + 0.5) - 0.5) * paso;
    float linea = 1.0 - smoothstep(0.004, 0.009, min(aMeridiano, aParalelo));
    float esMar = 1.0 - smoothstep(0.03, 0.12, distance(color, MAR));
    color = mix(color, vec3(1.0), linea * esMar * 0.5);

    // Sombra de dibujo: una sola media luna de borde definido, abajo a la derecha.
    float luz = smoothstep(-0.02, 0.02, dot(n, normalize(vec3(-0.5, 0.55, 0.67))));
    color *= mix(0.8, 1.0, luz);

    // Brillo: una mancha blanca alargada, arriba a la izquierda.
    vec2 h = v - vec2(-0.36, 0.44);
    h = vec2(h.x * 0.82 + h.y * 0.57, -h.x * 0.57 + h.y * 0.82) / vec2(0.17, 0.055);
    color = mix(color, vec3(1.0), (1.0 - smoothstep(0.85, 1.0, length(h))) * 0.6);
  }

  // Una línea oscura fina separa el mapa del borde crema.
  float filo = smoothstep(R - 0.012, R - 0.012 + px * 1.5, d) * dentro;
  color = mix(color, CONTORNO, filo);
  gl_FragColor = vec4(mix(BORDE, color, dentro) * disco, disco);
}`;

export interface Tierra {
  dibujar: (phi: number, theta: number) => void;
  redimensionar: (lado: number) => void;
  destruir: () => void;
}

/** Devuelve null si el navegador no tiene WebGL. */
export function crearTierra(canvas: HTMLCanvasElement, urlMapa: string): Tierra | null {
  const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true });
  if (!gl) return null;

  const compilar = (tipo: number, fuente: string) => {
    const shader = gl.createShader(tipo)!;
    gl.shaderSource(shader, fuente);
    gl.compileShader(shader);
    return shader;
  };
  const programa = gl.createProgram()!;
  gl.attachShader(programa, compilar(gl.VERTEX_SHADER, VERTICES));
  gl.attachShader(programa, compilar(gl.FRAGMENT_SHADER, PIXELES));
  gl.linkProgram(programa);
  if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) return null;
  gl.useProgram(programa);

  const cuadro = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cuadro);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(programa, "a");
  gl.enableVertexAttribArray(a);
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);

  const uPhi = gl.getUniformLocation(programa, "phi");
  const uTheta = gl.getUniformLocation(programa, "theta");
  const uPx = gl.getUniformLocation(programa, "px");
  const uListo = gl.getUniformLocation(programa, "listo");

  // Mientras llega el mapa se ve el globo celeste; después aparecen los continentes de a poco.
  const textura = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, textura);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([143, 216, 245, 255]));
  let cargadaAt = 0;
  let viva = true;
  const imagen = new Image();
  imagen.onload = () => {
    if (!viva) return;
    gl.bindTexture(gl.TEXTURE_2D, textura);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imagen);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    cargadaAt = performance.now();
  };
  imagen.src = urlMapa;

  return {
    dibujar(phi, theta) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uPhi, phi);
      gl.uniform1f(uTheta, theta);
      gl.uniform1f(uPx, 2 / Math.max(1, canvas.width));
      gl.uniform1f(uListo, cargadaAt ? Math.min(1, (performance.now() - cargadaAt) / 700) : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    redimensionar(lado) {
      canvas.width = lado;
      canvas.height = lado;
    },
    destruir() {
      viva = false;
      gl.deleteTexture(textura);
      gl.deleteBuffer(cuadro);
      gl.deleteProgram(programa);
    },
  };
}
