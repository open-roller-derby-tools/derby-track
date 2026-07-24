// Minimal Vector2 covering the subset of three's Vector2 used by this package's
// 2D modules. Vendored so the package does not require three.js for 2D usage.
// (packDrawing3D still uses three directly for its 3D shapes.)
export class Vector2 {
	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	set(x, y) {
		this.x = x;
		this.y = y;
		return this;
	}

	copy(v) {
		this.x = v.x;
		this.y = v.y;
		return this;
	}

	clone() {
		return new Vector2(this.x, this.y);
	}

	add(v) {
		this.x += v.x;
		this.y += v.y;
		return this;
	}

	sub(v) {
		this.x -= v.x;
		this.y -= v.y;
		return this;
	}

	multiplyScalar(s) {
		this.x *= s;
		this.y *= s;
		return this;
	}

	length() {
		return Math.hypot(this.x, this.y);
	}

	distanceTo(v) {
		return Math.hypot(this.x - v.x, this.y - v.y);
	}

	angle() {
		return Math.atan2(this.y, this.x);
	}
}
