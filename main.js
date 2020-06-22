/// <reference path="node_modules/@types/p5/global.d.ts" />

function setup() {
    const container = $('#canvas-container');
    const canvas = createCanvas(container.width(), container.height());
    canvas.parent('canvas-container');
    background(0);
}