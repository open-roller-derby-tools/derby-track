// Minimal Vector2 covering the subset of three's Vector2 used by this package's
// 2D modules. Vendored so the package does not require three.js for 2D usage.
// (packDrawing3D still uses three directly for its 3D shapes.)
export class Vector2 {
	constructor(public x = 0, public y = 0) {}

	set(x: number, y: number): this {
		this.x = x;
		this.y = y;
		return this;
	}

	copy(v: Vector2): this {
		this.x = v.x;
		this.y = v.y;
		return this;
	}

	clone(): Vector2 {
		return new Vector2(this.x, this.y);
	}

	add(v: Vector2): this {
		this.x += v.x;
		this.y += v.y;
		return this;
	}

	sub(v: Vector2): this {
		this.x -= v.x;
		this.y -= v.y;
		return this;
	}

	multiplyScalar(s: number): this {
		this.x *= s;
		this.y *= s;
		return this;
	}

	length(): number {
		return Math.hypot(this.x, this.y);
	}

	distanceTo(v: Vector2): number {
		return Math.hypot(this.x - v.x, this.y - v.y);
	}

	angle(): number {
		return Math.atan2(this.y, this.x);
	}
}
