const view_width = 800;
const view_height = 600;

class Vec {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  add(vec: Vec) {
    this.x += vec.x;
    this.y += vec.y;
  }

  sub(vec: Vec) {
    this.x -= vec.x;
    this.y -= vec.y;
  }

  dot(vec: Vec) {
    this.x *= vec.x;
    this.y *= vec.y;
  }

  scal(s: number) {
    this.x *= s;
    this.y *= s;
  }

  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  norm() {
    let mag = this.mag();
    if (mag != 0) {
      this.x = this.x / mag;
      this.y = this.y / mag;
    }
  }

  copy() {
    return new Vec(this.x, this.y);
  }
}

class Rect {
  points: Array<Vec>;

  constructor(x: number, y: number, width: number, height: number) {
    this.points = [];
    this.points.push(new Vec(x, y));
    this.points.push(new Vec(x + width, y));
    this.points.push(new Vec(x + width, y + height));
    this.points.push(new Vec(x, y + height));
  }

  addVec(vec: Vec) {
    for (let point of this.points) {
      point.add(vec);
    }
  }
}

class Entity {
  rect: Rect;
  paint: Paint;
  velocity: Vec;
  acceleration: Vec;
  mass: number;

  constructor() {
    this.rect = new Rect(0, 0, 40, 40);
    this.paint = new Paint(new Color(255, 255, 255, 1), new Color(255, 255, 255, 1), 1);
    this.velocity = new Vec(0, 0);
    this.acceleration = new Vec(0, 0);
    this.mass = 10.0;
  }

  applyForce(force: Vec) {
    force.scal(1 / this.mass);
    this.acceleration.add(force);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.rect.addVec(this.velocity);
    this.acceleration.scal(0);
  }
}

class Color {
  r: number;
  g: number;
  b: number;
  a: number;

  constructor(r: number, g: number, b: number, a: number) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  toString() {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }
}

class Paint {
  stroke_color: Color;
  fill_color: Color;
  line_width: number;

  constructor(stroke_color: Color, fill_color: Color, line_width: number = 1) {
    this.stroke_color = stroke_color;
    this.fill_color = fill_color;
    this.line_width = line_width;
  }
}

class Canvas {
  canvas_element: HTMLCanvasElement;
  context: CanvasRenderingContext2D;

  constructor(canvas_element) {
    this.canvas_element = canvas_element;
    this.context = this.canvas_element.getContext("2d", {alpha: false});
  }

  clear() {
    // this.context.clearRect(0, 0, view_width, view_height);
    this.context.fillStyle = "rgba(0, 0, 0, 1)";
    this.context.fillRect(0, 0, view_width, view_height);
  }

  drawRect(rect: Rect, paint: Paint) {
    this.context.strokeStyle = paint.stroke_color.toString();
    this.context.fillStyle = paint.fill_color.toString();
    this.context.lineWidth = paint.line_width;
    this.context.beginPath();
    this.context.moveTo(rect.points[0].x, rect.points[0].y);
    this.context.lineTo(rect.points[1].x, rect.points[1].y);
    this.context.lineTo(rect.points[2].x, rect.points[2].y);
    this.context.lineTo(rect.points[3].x, rect.points[3].y);
    this.context.lineTo(rect.points[0].x, rect.points[0].y);
    this.context.fill();
  }
}

class Input {
  keys: { [key: string]: boolean };
  mouse_down: boolean;
  mouse_x: number;
  mouse_y: number;

  constructor() {
    this.keys = {};
    this.mouse_down = false;
    this.mouse_x = 0;
    this.mouse_y = 0;
  }
}

interface Scene {
  update(input: Input, delta: number): void;
  render(canvas: Canvas): void;
}

class TestScene implements Scene {
  player: Entity;
  player_acc: number;
  friction_coef: number
  drag_coef: number;

  constructor() {
    this.player = new Entity();
    this.player_acc = 4;
    this.friction_coef = 0.3;
    this.drag_coef = 0.05;
  }

  update(input: Input, delta: number) {
    if (input.keys["w"]) {
      this.player.applyForce(new Vec(0, -this.player_acc));
    }
    if (input.keys["a"]) {
      this.player.applyForce(new Vec(-this.player_acc, 0));
    }
    if (input.keys["s"]) {
      this.player.applyForce(new Vec(0, this.player_acc));
    }
    if (input.keys["d"]) {
      this.player.applyForce(new Vec(this.player_acc, 0));
    }

    let speed = this.player.velocity.mag();
    let dragMag = this.drag_coef * speed * speed;
    let drag = this.player.velocity.copy();
    drag.scal(-1);
    drag.norm();
    drag.scal(dragMag);
    this.player.applyForce(drag);

    let friction = this.player.velocity.copy();
    friction.scal(-1);
    friction.norm();
    friction.scal(this.friction_coef);
    this.player.applyForce(friction);

    this.player.update();
  }

  render(canvas: Canvas) {
    canvas.clear();
    canvas.drawRect(this.player.rect, this.player.paint);
  }
}

class Game {
  canvas_element: HTMLCanvasElement;
  canvas: Canvas;
  current_scene: Scene;
  input: Input;

  constructor(canvas_element: HTMLCanvasElement) {
    this.canvas_element = canvas_element;
    this.canvas = new Canvas(canvas_element);
    this.input = new Input();
    this.current_scene = new TestScene();
  }

  init() {
    window.addEventListener("keydown", (e) => {
      this.input.keys[e.key] = true;
    });
    window.addEventListener("keyup", (e) => {
      this.input.keys[e.key] = false;
    });
    this.canvas_element.addEventListener("mousedown", (e) => {
      this.input.mouse_down = true;
      this.input.mouse_x = e.offsetX;
      this.input.mouse_y = e.offsetY;
    });
    this.canvas_element.addEventListener("mouseup", (e) => {
      this.input.mouse_down = false;
      this.input.mouse_x = e.offsetX;
      this.input.mouse_y = e.offsetY;
    });
    this.canvas_element.addEventListener("mousemove", (e) => {
      this.input.mouse_x = e.offsetX;
      this.input.mouse_y = e.offsetY;
    });

    window.requestAnimationFrame(this.render.bind(this));
  }

  render(delta: number) {
    this.current_scene.update(this.input, delta);
    this.current_scene.render(this.canvas);
    window.requestAnimationFrame(this.render.bind(this));
  }
}

export function start() {
  const canvas_element = <HTMLCanvasElement> document.getElementById("game");
  let game = new Game(canvas_element);
  game.init();
}