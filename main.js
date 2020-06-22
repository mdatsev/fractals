/// <reference path="node_modules/@types/p5/global.d.ts" />

let texture;
function preload() {
    texture = loadImage('texture.png');
}

const rad = Math.PI / 180;


function matrix(a, b, c, d, e, f) {
    const m = mat2d.fromValues(a, b, c, d, e, f);
    return m;
}

const T1 = matrix(1/3 * Math.cos( 0 * rad), -1/3 * Math.sin( 0 * rad),
                  1/3 * Math.sin( 0 * rad),  1/3 * Math.cos( 0 * rad), 0, 0);

const T2 = matrix(1/3 * Math.cos( 60* rad), -1/3 * Math.sin( 60* rad),
                  1/3 * Math.sin( 60* rad),  1/3 * Math.cos( 60* rad), 1/3, 0);

const T3 = matrix(1/3 * Math.cos(-60* rad), -1/3 * Math.sin(-60* rad),
                  1/3 * Math.sin(-60* rad), 1/3 * Math.cos(-60* rad), 1/2, -Math.sqrt(3)/6);

const T4 = matrix(1/3 * Math.cos( 0 * rad), -1/3 * Math.sin( 0 * rad),
                  1/3 * Math.sin( 0 * rad),  1/3 * Math.cos( 0 * rad), 2/3, 0);

const coch = [T1, T2, T3, T4];
const leaf = [
    matrix(0,        0,     0, 0.16, 0,     0),
    matrix(0.85,  0.04, -0.04, 0.85, 0,  -1.6),
    matrix(0.2,  -0.26,  0.23, 0.22, 0,  -1.6),
    matrix(-0.15, 0.28,  0.26, 0.24, 0, -0.44)
];

function drawWithMatrix(t) {
    push();
    const [a, b, c, d, e, f] = t;
    applyMatrix(a, b, c, d, e * 512, f * 512);
    image(texture, 0, -512);
    pop();
}

function mul(m1, m2) {
    const r = mat2d.create();
    mat2d.mul(r, m1, m2);
    return r;
}

function rot(m1, a) {
    const r = mat2d.create();
    mat2d.rotate(r, m1, a);
    return r;
}

function setup() {
    const container = $('#canvas-container');
    const canvas = createCanvas(container.width(), container.height());
    canvas.parent('canvas-container');
    translateX = width / 2;
    translateY = height / 2;
}

function iterate(matrices, depth, curr = matrices) {
    for (const m1 of curr) {
        const new_matrices = [];
        for (const m2 of matrices) {
            new_matrices.push(rot(mul(m1, m2), Date.now() / 1000));
            // new_matrices.push(mul(m1, m2));
        }
        if (depth > 0) {
            iterate(matrices, depth - 1, new_matrices);
        } else {
            drawWithMatrix(m1);
        }

    }
}

function draw() {
    background(0);
    scale(1, 1);
    translate(translateX, translateY);
    scale(scaleFactor);

    iterate(leaf, 6)
}

let scaleFactor = 1.0;
let translateX = 0.0;
let translateY = 0.0;
let zoomSensitivity = 0.001;
function mouseWheel(event) {
    event.preventDefault();
    translateX -= mouseX;
    translateY -= mouseY;
    let delta = 1 - event.delta * zoomSensitivity;
    scaleFactor *= delta;
    translateX *= delta;
    translateY *= delta;
    translateX += mouseX;
    translateY += mouseY;
}

function mouseDragged() {
    translateX += mouseX - pmouseX;
    translateY += mouseY - pmouseY;
}