"use client";

import { useEffect, useRef } from "react";

const vertexShader = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragmentShader = `
precision highp float;
varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_grain;
uniform vec3 u_colors[3];
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
  vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.); vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod289(i);
  vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
  vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.); m=m*m; m=m*m;
  vec3 x=2.*fract(p*C.www)-1.; vec3 h=abs(x)-.5; vec3 ox=floor(x+.5); vec3 a0=x-ox;
  m*=1.79284291400159-.85373472095314*(a0*a0+h*h); vec3 g;
  g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw; return 130.*dot(m,g);
}
void main(){
  vec2 uv=vUv; float ratio=u_resolution.x/u_resolution.y; vec2 p=uv*vec2(ratio,1.); float t=u_time*.2;
  float n1=snoise(p*.5+t); float n2=snoise(p*.9-t*.5+n1); float light=pow(abs(n2),2.5)*.5;
  vec3 col=vec3(.015,.004,.008); col+=u_colors[0]*smoothstep(.1,1.,n1)*.5; col+=u_colors[1]*light;
  float grain=fract(sin(dot(uv,vec2(12.9898,78.233)))*43758.5453+u_time); col+=(grain-.5)*u_grain*.5;
  col*=smoothstep(1.2,.2,length(uv-.5)); gl_FragColor=vec4(col,1.);
}`;

export default function Auralis({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: true });
    if (!gl) return;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("WebGL shader unavailable");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "Shader compile failed");
      return shader;
    };
    const program = gl.createProgram();
    if (!program) return;
    const vertex = compile(gl.VERTEX_SHADER, vertexShader);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentShader);
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program); gl.useProgram(program);
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position"); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const resolution = gl.getUniformLocation(program, "u_resolution");
    const time = gl.getUniformLocation(program, "u_time");
    const grain = gl.getUniformLocation(program, "u_grain");
    const colors = gl.getUniformLocation(program, "u_colors");
    const resize = () => { const dpr=Math.min(devicePixelRatio,1.5); canvas.width=canvas.clientWidth*dpr; canvas.height=canvas.clientHeight*dpr; gl.viewport(0,0,canvas.width,canvas.height); };
    const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const render = (now: number) => {
      gl.uniform2f(resolution, canvas.width, canvas.height); gl.uniform1f(time, now*.00018); gl.uniform1f(grain, .22);
      gl.uniform3fv(colors, new Float32Array([.94,.08,.15,.72,.02,.08,.38,.01,.04])); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      if (!reduceMotion) frame=requestAnimationFrame(render);
    };
    render(0);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); gl.deleteShader(vertex); gl.deleteShader(fragment); gl.deleteProgram(program); };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full bg-[#080104] ${className}`} />;
}
