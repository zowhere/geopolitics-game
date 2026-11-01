const svgNamespace = "http://www.w3.org/2000/svg";

export type Point = {
  x: number;
  y: number;
};

type Particle = {
  element: SVGElement;
  born: number;
  life: number;
  step: (progress: number) => void;
  done?: () => void;
};

type MissileOptions = {
  flight: number;
  arc: number;
  blast: number;
};

const still = { x: 0, y: 0 };

export class StrikeFx {
  private readonly svg: SVGSVGElement;
  private particles: Particle[] = [];
  private frame = 0;

  constructor(svg: SVGSVGElement) {
    this.svg = svg;
  }

  missile(from: Point, to: Point, { flight, arc, blast }: MissileOptions) {
    const bend = {
      x: (from.x + to.x) / 2,
      y: Math.min(from.y, to.y) - Math.max(36, Math.hypot(to.x - from.x, to.y - from.y) * arc),
    };
    const body = this.create("g", { class: "fx-missile" });
    body.innerHTML =
      '<circle class="fx-flame" cx="-13" cy="0" r="3"/>' +
      '<path class="fx-fin" d="M-9 -2.4L-13 -6L-6 -2.4ZM-9 2.4L-13 6L-6 2.4Z"/>' +
      '<path class="fx-body" d="M-10 -2.4H5L11 0L5 2.4H-10Z"/>' +
      '<path class="fx-nose" d="M5 -2.4L11 0L5 2.4Z"/>';
    let lastSmoke = 0;

    this.add(
      body,
      flight,
      (progress) => {
        const eased = 0.35 * progress + 0.65 * progress * progress;
        const rest = 1 - eased;
        const x = rest * rest * from.x + 2 * rest * eased * bend.x + eased * eased * to.x;
        const y = rest * rest * from.y + 2 * rest * eased * bend.y + eased * eased * to.y;
        const angle = Math.atan2(
          2 * rest * (bend.y - from.y) + 2 * eased * (to.y - bend.y),
          2 * rest * (bend.x - from.x) + 2 * eased * (to.x - bend.x),
        );
        body.setAttribute("transform", `translate(${x} ${y}) rotate(${(angle * 180) / Math.PI}) scale(1.1)`);
        if (progress - lastSmoke > 0.015) {
          lastSmoke = progress;
          const tail = { x: x - Math.cos(angle) * 13, y: y - Math.sin(angle) * 13 };
          const drift = { x: (Math.random() - 0.5) * 6, y: -4 - Math.random() * 6 };
          this.puff(tail, 1.6, 9, 1300, "fx-smoke", drift, 0.55);
        }
      },
      () => this.explode(to, blast),
    );
  }

  stop() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.particles = [];
    this.svg.replaceChildren();
  }

  private explode(at: Point, size: number) {
    this.puff(at, 3 * size, 30 * size, 500, "fx-flash");
    this.puff(at, 2 * size, 18 * size, 900, "fx-ember", still, 0.8);

    const ring = this.create("circle", { cx: at.x, cy: at.y, r: 4, class: "fx-ring" });
    this.add(ring, 1100, (progress) => {
      ring.setAttribute("r", String(4 + 56 * size * progress));
      ring.style.strokeWidth = String(6 * (1 - progress));
      ring.style.opacity = String(1 - progress);
    });

    for (let i = 0; i < 30 + 10 * size; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = (20 + Math.random() * 48) * size;
      const drift = { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance + 14 * size };
      this.puff(at, (1.4 + Math.random() * 2.2) * size, 0.3, 900 + Math.random() * 700, i % 4 ? "fx-spark" : "fx-ember", drift);
    }

    for (let i = 0; i < 10; i++) {
      const start = { x: at.x + (Math.random() - 0.5) * 16 * size, y: at.y };
      const drift = { x: (Math.random() - 0.5) * 22 * size, y: -(18 + Math.random() * 26) * size };
      this.puff(start, 4 * size, (14 + Math.random() * 10) * size, 2000 + Math.random() * 900, "fx-smoke", drift, 0.65);
    }
  }

  private puff(at: Point, startRadius: number, endRadius: number, life: number, className: string, drift = still, opacity = 1) {
    const circle = this.create("circle", { cx: at.x, cy: at.y, r: startRadius, class: className });
    this.add(circle, life, (progress) => {
      circle.setAttribute("r", String(startRadius + (endRadius - startRadius) * progress));
      circle.setAttribute("cx", String(at.x + drift.x * progress));
      circle.setAttribute("cy", String(at.y + drift.y * progress));
      circle.style.opacity = String(opacity * (1 - progress));
    });
  }

  private create(tag: string, attributes: Record<string, string | number>) {
    const element = document.createElementNS(svgNamespace, tag);
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value));
    this.svg.append(element);
    return element;
  }

  private add(element: SVGElement, life: number, step: Particle["step"], done?: () => void) {
    this.particles.push({ element, born: performance.now(), life, step, done });
    if (!this.frame) this.frame = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    const finished = this.particles.filter((particle) => now - particle.born >= particle.life);
    this.particles = this.particles.filter((particle) => now - particle.born < particle.life);
    for (const particle of this.particles) particle.step((now - particle.born) / particle.life);
    for (const particle of finished) {
      particle.element.remove();
      particle.done?.();
    }
    this.frame = this.particles.length ? requestAnimationFrame(this.tick) : 0;
  };
}
