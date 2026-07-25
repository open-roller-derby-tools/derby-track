// Shared skater/data types. These were previously hand-written in module.d.ts;
// in the TS build they are emitted from source.

export type Position = {
	x: number;
	y: number;
};

export type Rotation = {
	rotation: number;
};

export type SkaterDataType = {
	id: string | number;
	team: string;
	isPivot?: boolean;
	isJammer?: boolean;
} & Position &
	Rotation;

export type SkaterWDPPivotLineDistance = {
	pivotLineDist: number;
};

export type SkatersWDPInPlay = {
	inPlay: boolean;
};

export type SkatersWDPPackSkater = {
	packSkater: boolean;
};

export type SkaterWDPInBounds = {
	inBounds: boolean;
};
