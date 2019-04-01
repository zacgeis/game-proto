define("game", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var view_width = 800;
    var view_height = 600;
    var Vec = /** @class */ (function () {
        function Vec(x, y) {
            this.x = x;
            this.y = y;
        }
        Vec.prototype.add = function (vec) {
            this.x += vec.x;
            this.y += vec.y;
        };
        Vec.prototype.sub = function (vec) {
            this.x -= vec.x;
            this.y -= vec.y;
        };
        Vec.prototype.dot = function (vec) {
            this.x *= vec.x;
            this.y *= vec.y;
        };
        Vec.prototype.scal = function (s) {
            this.x *= s;
            this.y *= s;
        };
        Vec.prototype.mag = function () {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        };
        Vec.prototype.norm = function () {
            var mag = this.mag();
            if (mag != 0) {
                this.x = this.x / mag;
                this.y = this.y / mag;
            }
        };
        Vec.prototype.rotate = function (origin, radians) {
            this.sub(origin);
            var rx = this.x * Math.cos(radians) - this.y * Math.sin(radians);
            var ry = this.y * Math.cos(radians) + this.x * Math.sin(radians);
            this.x = rx;
            this.y = ry;
            this.add(origin);
        };
        Vec.prototype.copy = function () {
            return new Vec(this.x, this.y);
        };
        return Vec;
    }());
    var Rect = /** @class */ (function () {
        function Rect(x, y, width, height) {
            this.points = [];
            this.points.push(new Vec(x, y));
            this.points.push(new Vec(x + width, y));
            this.points.push(new Vec(x + width, y + height));
            this.points.push(new Vec(x, y + height));
        }
        Rect.prototype.rotate = function (origin, radians) {
            for (var _i = 0, _a = this.points; _i < _a.length; _i++) {
                var point = _a[_i];
                point.rotate(origin, radians);
            }
        };
        return Rect;
    }());
    var Entity = /** @class */ (function () {
        function Entity() {
            this.radians = 0;
            this.width = 40;
            this.height = 40;
            this.offset = new Vec(this.width / 2, this.height / 2);
            this.position = new Vec(view_width / 2, view_height / 2);
            this.velocity = new Vec(0, 0);
            this.acceleration = new Vec(0, 0);
            this.mass = 1;
            this.paint = new Paint(new Color(255, 255, 255, 1), new Color(255, 255, 255, 1), 1);
        }
        Entity.prototype.lookAt = function (x, y) {
            this.radians = Math.atan2(y - this.position.y, x - this.position.x);
        };
        Entity.prototype.applyForce = function (force) {
            force.scal(1 / this.mass);
            this.acceleration.add(force);
        };
        Entity.prototype.update = function () {
            this.velocity.add(this.acceleration);
            this.position.add(this.velocity);
            this.acceleration.scal(0);
        };
        Entity.prototype.makeRect = function () {
            var x = this.position.x - this.offset.x;
            var y = this.position.y - this.offset.y;
            var rect = new Rect(x, y, this.width, this.height);
            rect.rotate(this.position, this.radians);
            return rect;
        };
        Entity.prototype.draw = function (canvas) {
            var rect = this.makeRect();
            canvas.drawRect(rect, this.paint);
        };
        return Entity;
    }());
    var Color = /** @class */ (function () {
        function Color(r, g, b, a) {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
        }
        Color.prototype.toString = function () {
            return "rgba(" + this.r + ", " + this.g + ", " + this.b + ", " + this.a + ")";
        };
        return Color;
    }());
    var Paint = /** @class */ (function () {
        function Paint(stroke_color, fill_color, line_width) {
            if (line_width === void 0) { line_width = 1; }
            this.stroke_color = stroke_color;
            this.fill_color = fill_color;
            this.line_width = line_width;
        }
        return Paint;
    }());
    var Canvas = /** @class */ (function () {
        function Canvas(canvas_element) {
            this.canvas_element = canvas_element;
            this.context = this.canvas_element.getContext("2d", { alpha: false });
        }
        Canvas.prototype.clear = function () {
            // this.context.clearRect(0, 0, view_width, view_height);
            this.context.fillStyle = "rgba(0, 0, 0, 1)";
            this.context.fillRect(0, 0, view_width, view_height);
        };
        Canvas.prototype.drawRect = function (rect, paint) {
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
        };
        return Canvas;
    }());
    var Input = /** @class */ (function () {
        function Input() {
            this.keys = {};
            this.mouse_down = false;
            this.mouse_x = 0;
            this.mouse_y = 0;
        }
        return Input;
    }());
    var TestScene = /** @class */ (function () {
        function TestScene() {
            this.player = new Entity();
            this.player_acc = 4;
            this.friction_coef = 0.08;
            this.drag_coef = 0.05;
        }
        TestScene.prototype.update = function (input, delta) {
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
            var speed = this.player.velocity.mag();
            var dragMag = this.drag_coef * speed * speed;
            var drag = this.player.velocity.copy();
            drag.scal(-1);
            drag.norm();
            drag.scal(dragMag);
            this.player.applyForce(drag);
            var friction = this.player.velocity.copy();
            friction.scal(-1);
            friction.norm();
            friction.scal(this.friction_coef);
            this.player.applyForce(friction);
            this.player.update();
            this.player.lookAt(input.mouse_x, input.mouse_y);
        };
        TestScene.prototype.render = function (canvas) {
            canvas.clear();
            this.player.draw(canvas);
        };
        return TestScene;
    }());
    var Game = /** @class */ (function () {
        function Game(canvas_element) {
            this.canvas_element = canvas_element;
            this.canvas = new Canvas(canvas_element);
            this.input = new Input();
            this.current_scene = new TestScene();
        }
        Game.prototype.init = function () {
            var _this = this;
            window.addEventListener("keydown", function (e) {
                _this.input.keys[e.key] = true;
            });
            window.addEventListener("keyup", function (e) {
                _this.input.keys[e.key] = false;
            });
            this.canvas_element.addEventListener("mousedown", function (e) {
                _this.input.mouse_down = true;
                _this.input.mouse_x = e.offsetX;
                _this.input.mouse_y = e.offsetY;
            });
            this.canvas_element.addEventListener("mouseup", function (e) {
                _this.input.mouse_down = false;
                _this.input.mouse_x = e.offsetX;
                _this.input.mouse_y = e.offsetY;
            });
            this.canvas_element.addEventListener("mousemove", function (e) {
                _this.input.mouse_x = e.offsetX;
                _this.input.mouse_y = e.offsetY;
            });
            window.requestAnimationFrame(this.render.bind(this));
        };
        Game.prototype.render = function (delta) {
            this.current_scene.update(this.input, delta);
            this.current_scene.render(this.canvas);
            window.requestAnimationFrame(this.render.bind(this));
        };
        return Game;
    }());
    function start() {
        var canvas_element = document.getElementById("game");
        var game = new Game(canvas_element);
        game.init();
    }
    exports.start = start;
});
//# sourceMappingURL=game.js.map