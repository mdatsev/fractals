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
const W = 512, H = 512;
const T1 = matrix(1/3 * Math.cos( 0 * rad), -1/3 * Math.sin( 0 * rad),
                  1/3 * Math.sin( 0 * rad),  1/3 * Math.cos( 0 * rad), 0, 0);

const T2 = matrix(1/3 * Math.cos( 60* rad), -1/3 * Math.sin( 60* rad),
                  1/3 * Math.sin( 60* rad),  1/3 * Math.cos( 60* rad), 1/3, 0);

const T3 = matrix(1/3 * Math.cos(-60* rad), -1/3 * Math.sin(-60* rad),
                  1/3 * Math.sin(-60* rad), 1/3 * Math.cos(-60* rad), 1/2, -Math.sqrt(3)/6);

const T4 = matrix(1/3 * Math.cos( 0 * rad), -1/3 * Math.sin( 0 * rad),
                  1/3 * Math.sin( 0 * rad),  1/3 * Math.cos( 0 * rad), 2/3, 0);

const presets = {
    "koch": {
        0: matrix(1/3 * Math.cos( 0 * rad), -1/3 * Math.sin( 0 * rad),
                1/3 * Math.sin( 0 * rad),  1/3 * Math.cos( 0 * rad), 0, 0),
        1: matrix(1/3 * Math.cos( 60* rad), -1/3 * Math.sin( 60* rad),
                1/3 * Math.sin( 60* rad),  1/3 * Math.cos( 60* rad), 1/3, 0),
        2: matrix(1/3 * Math.cos(-60* rad), -1/3 * Math.sin(-60* rad),
                1/3 * Math.sin(-60* rad), 1/3 * Math.cos(-60* rad), 1/2, -Math.sqrt(3)/6),
        3: matrix(1/3 * Math.cos( 0 * rad), -1/3 * Math.sin( 0 * rad),
                1/3 * Math.sin( 0 * rad),  1/3 * Math.cos( 0 * rad), 2/3, 0),
    },
    "sierpinski": {
        0: matrix(0.5, 0, 0, 0.5, 0, 0),
        1: matrix(0.5, 0, 0, 0.5, 0.5, 0),
        2: matrix(0.5, 0, 0, 0.5, 0.25, -0.5),
    },
} 

const matrixes = { 0: T1, 1: T2, 2: T3, 3: T4 };
let matricesSeq = 1;
// const matrices = [T1, T2, T3, T4];
const E = matrix(1, 0, 0, 1, 0, 0);
const leaf = [
    matrix(0,        0,     0, 0.16, 0,     0),
    matrix(0.85,  0.04, -0.04, 0.85, 0,  -1.6),
    matrix(0.2,  -0.26,  0.23, 0.22, 0,  -1.6),
    matrix(-0.15, 0.28,  0.26, 0.24, 0, -0.44)
];

let iterations = 2;
let showControls = true;

function drawBaseImage(t) {
    push();
    applyMatrix(...t);
    image(texture, 0, -1, 1, 1);
    pop();
}

function drawControl(t) {
    push();
    applyMatrix(...t);

    stroke(255, 204, 0, 100);
    strokeWeight(10/500);
    noFill();

    line(0, 0, 1, 0);
    circle(1, 0, 1 / 10);

    line(0, -1, 0, 0);
    circle(0, -1, 1 / 10);

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
    $(document).ready(function(){
        const container = $('#canvas-container');
        const canvas = createCanvas(container.width(), container.height());
        canvas.parent('canvas-container');
        translateX = width / 2;
        translateY = height / 2;

        var div = document.getElementById("canvas-container");

        div.mouseIsOver = false;
        div.onmouseover = function() {
            this.mouseIsOver = true;
        };
        div.onmouseout = function() {
            this.mouseIsOver = false;
        };

        setupDrawing();

        $('#fractal-iterations').on('input', (event) => {
            iterations = event.target.value;
        });

        $('#show-controls').change(function () {
            showControls = this.checked;
        });

        $('#load-preset').change(function () {
            if (presets[this.value]) {
                loadPreset(presets[this.value]);
            }
        });

        for (const m of Object.values(matrixes)) {
            addMatrix(m);
        }
    });
}

function loadPreset(presetMatrices) {
    matricesSeq = 1;

    for (const elem of $("#matrixes-container").children()) {
        elem.parentElement.removeChild(elem);
    }

    for (const m of Object.keys(matrixes)) {
        delete matrixes[m];
    }

    for (const m of Object.keys(presetMatrices)) {
        addMatrix(presetMatrices[m]);
    }
}

function setupMatrixEvents() {
    $('.delete-matrix').on('click', function(event) {
        const matrixId = event.target.attributes['data-matrix'].value;
    
        delete matrixes[matrixId];

        let row = document.getElementById('matrix-row-' + matrixId);
        row.parentElement.removeChild(row);
    });

    $('.matrix-value').on('input', (event) => {
        const matrixId = event.target.parentElement.attributes['data-matrix'].value;
        const matrixField = event.target.attributes['data-matrix-field'].value;

        matrixes[matrixId][matrixField] = event.target.value;
    });
}

function addMatrix(defaultMatrix=[0,0,0,0,0,0]) {
    let matrixesContainer = document.getElementById("matrixes-container");

    let matrixRow = document.createElement("div");
    matrixRow.classList.add("row");
    matrixRow.classList.add("matrix");

    matrixRow.id = "matrix-row-" + matricesSeq;
    matrixRow.innerHTML = `
        <p class="col"> Matrix ${matricesSeq}</p>
        <button class="btn btn-warning delete-matrix" data-matrix="${matricesSeq}">Delete matrix</button> 
        <div class="row matrix-row" data-matrix="${matricesSeq}">
            <label for="matrix-a" class="col matrix-label">a: </label>
            <input value="${defaultMatrix[0]}" class="form-control col matrix-value" data-matrix-field='0' id="matrix-a"></input>
            <label for="matrix-b" class="col matrix-label">b: </label>
            <input value="${defaultMatrix[1]}" class="form-control col matrix-value" data-matrix-field='1' id="matrix-b"></input>
            <label for="matrix-e" class="col matrix-label">e: </label>
            <input value="${defaultMatrix[4]}" class="form-control col matrix-value" data-matrix-field='4' id="matrix-e"></input>
        </div>
        <div class="row matrix-row" data-matrix="${matricesSeq}">
            <label for="matrix-c" class="col matrix-label">c: </label>
            <input value="${defaultMatrix[2]}" class="form-control col matrix-value" data-matrix-field='2' id="matrix-c"></input>
            <label for="matrix-d" class="col matrix-label">d: </label>
            <input value="${defaultMatrix[3]}" class="form-control col matrix-value" data-matrix-field='3' id="matrix-d"></input>
            <label for="matrix-f" class="col matrix-label">f: </label>
            <input value="${defaultMatrix[5]}" class="form-control col matrix-value" data-matrix-field='5' id="matrix-f"></input>
        </div>
    `;
    let new_matrix = defaultMatrix;
    matrixes[matricesSeq++] = new_matrix;
    
    matrixesContainer.appendChild(matrixRow);

    setupMatrixEvents();
}

function iterate(matrices, depth, curr = matrices) {
    for (const m1 of curr) {
        const new_matrices = [];
        for (const m2 of matrices) {
            new_matrices.push(mul(m1, m2));
        }
        if (depth > 0) {
            iterate(matrices, depth - 1, new_matrices);
        } else {
            drawBaseImage(m1);
        }
    }
}

function viewMatrix() {
    return matrix(scaleFactor, 0, 0, scaleFactor, translateX, translateY);
}

function draw() {
    background(0);
    applyMatrix(...viewMatrix());

    const matrices = Object.values(matrixes);

    iterate(matrices, iterations);

    if (showControls) {
        drawControl(E);
        for (const m of matrices) {
            drawControl(m);
        }
    }
    // const [x, y] = getTopControlScreenLoc(T3);
    // circle(x, y, 70);
    // const [x1, y1] = getRightControlScreenLoc(T3);
    // circle(x1, y1, 70);
}

let scaleFactor = 500;
let translateX = 0.0;
let translateY = 0.0;
let zoomSensitivity = 0.001;

function isMouseOverCanvas() {
    return document.getElementById('canvas-container').mouseIsOver;
}

function mouseWheel(event) {
    if (isMouseOverCanvas()) {
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
}

function transform(mat, vec) {
    const result = vec2.create();
    vec2.transformMat2d(result, vec, mat);
    return result;
}

function getRightControlScreenLoc(t) {
    return transform(t, [1, 0]);
}

function getTopControlScreenLoc(t) {
    return transform(t, [0, -1]);
}

function mouseDragged() {
    if (isMouseOverCanvas()) {
        translateX += mouseX - pmouseX;
        translateY += mouseY - pmouseY;
    }
}

function setupDrawing() {
    var drawerPlugins = [
        // Drawing tools
        'Pencil',
        'Eraser',
        'Line',
        'Triangle',
        'Rectangle',
        'Circle',
        'Image',
        'Polygon',

        // Drawing options
        //'ColorHtml5',
        'Color',
        'ShapeBorder',
        'BrushSize',
        'OpacityOption',

        'LineWidth',
        'StrokeWidth',
    ];

    
    var drawingCanvas = new DrawerJs.Drawer(null, {
        plugins: drawerPlugins,
        corePlugins: [
            'Zoom' // use null here if you want to disable Zoom completely
        ],
        pluginsConfig: {
            Image: {
                scaleDownLargeImage: true,
                maxImageSizeKb: 10240, //1MB
                cropIsActive: true
            },
            BackgroundImage: {
                scaleDownLargeImage: true,
                maxImageSizeKb: 10240, 
                imagePosition: 'center',
                acceptedMIMETypes: ['image/jpeg', 'image/png', 'image/gif'] ,
                dynamicRepositionImage: true,
                dynamicRepositionImageThrottle: 100,
                cropIsActive: false
            },
            Text: {
                editIconMode : false,
                editIconSize : 'large',
                defaultValues : {
                  fontSize: 72,
                  lineHeight: 2,
                  textFontWeight: 'bold'
                },
                predefined: {
                  fontSize: [8, 12, 14, 16, 32, 40, 72],
                  lineHeight: [1, 2, 3, 4, 6]
                }
            },
            Zoom: {
                enabled: true, 
                showZoomTooltip: true, 
                useWheelEvents: true,
                zoomStep: 1.05, 
                defaultZoom: 1, 
                maxZoom: 32,
                minZoom: 1, 
                smoothnessOfWheel: 0,
                //Moving:
                enableMove: true,
                enableWhenNoActiveTool: true,
                enableButton: true
            }
        },
        toolbars: {
            drawingTools: {
                position: 'top',         
                positionType: 'outside',
                customAnchorSelector: '#custom-toolbar-here',  
                compactType: 'scrollable',   
                hidden: false,     
                toggleVisibilityButton: false,
                fullscreenMode: {
                    position: 'top', 
                    hidden: false,
                    toggleVisibilityButton: false
                }
            },
            toolOptions: {
                position: 'bottom', 
                positionType: 'inside',
                compactType: 'popup',
                hidden: false,
                toggleVisibilityButton: false,
                fullscreenMode: {
                    position: 'bottom', 
                    compactType: 'popup',
                    hidden: false,
                    toggleVisibilityButton: false
                }
            },
            settings : {
                position : 'right', 
                positionType: 'inside',					
                compactType : 'scrollable',
                hidden: false,	
                toggleVisibilityButton: false,
                fullscreenMode: {
                    position : 'right', 
                    hidden: false,
                    toggleVisibilityButton: false
                }
            }
        },
        contentConfig: {
            saveInHtml: false,
            saveImageData: function(canvasId, imageData) {
                console.log(imageData);
                texture = loadImage(imageData);
            }
        },
        defaultImageUrl: 'images/drawer.jpg',
        defaultActivePlugin : { name : 'Pencil', mode : 'lastUsed'},
        debug: true,
        activeColor: '#a1be13',
        transparentBackground: true,
        align: 'floating',  //one of 'left', 'right', 'center', 'inline', 'floating'
        lineAngleTooltip: { enabled: true, color: 'blue',  fontSize: 15},
        imagesContainer: '#image-container',
    }, 250, 250);


    $('#drawing-container').append(drawingCanvas.getHtml());
    drawingCanvas.onInsert();
}