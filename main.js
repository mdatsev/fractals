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

const matrices = [T1, T2, T3, T4];
const matrixes = {};
let matricesSeq = 1;
let iterations = 2;

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
        }

        setupDrawing();

        $('#fractal-iterations').on('input', (event) => {
            iterations = event.target.value;
            draw();
        });
    });
}

function setupMatrixEvents() {
    $('.delete-matrix').on('click', function(event) {
        const matrixId = event.target.attributes['data-matrix'].value;
    
        delete matrixes[matrixId];

        let row = document.getElementById('matrix-row-' + matrixId);
        row.parentElement.removeChild(row);

        draw();
    });

    $('.matrix-value').on('input', (event) => {
        const matrixId = event.target.parentElement.attributes['data-matrix'].value;
        const matrixField = event.target.attributes['data-matrix-field'].value;

        matrixes[matrixId][matrixField] = event.target.value;

        draw();
    });
}

function addMatrix() {
    let matrixesContainer = document.getElementById("matrixes-container");

    let matrixRow = document.createElement("div");
    matrixRow.classList.add("row");
    matrixRow.id = "matrix-row-" + matricesSeq;
    matrixRow.innerHTML = `
        <p class="col"> Matrix ` +  matricesSeq + `</p>
        <button class="btn btn-warning delete-matrix" data-matrix="` + matricesSeq + `">Delete matrix</button> 
        <div class="row matrix-row" data-matrix="` + matricesSeq + `">
            <label for="matrix-a" class="col matrix-label">a: </label>
            <input value="0" class="form-control col matrix-value" data-matrix-field='0' id="matrix-a"></input>
            <label for="matrix-b" class="col matrix-label">b: </label>
            <input value="0" class="form-control col matrix-value" data-matrix-field='1' id="matrix-b"></input>
            <label for="matrix-e" class="col matrix-label">e: </label>
            <input value="0" class="form-control col matrix-value" data-matrix-field='2' id="matrix-e"></input>
        </div>
        <div class="row matrix-row" data-matrix="` + matricesSeq + `">
            <label for="matrix-c" class="col matrix-label">c: </label>
            <input value="0" class="form-control col matrix-value" data-matrix-field='3' id="matrix-c"></input>
            <label for="matrix-d" class="col matrix-label">d: </label>
            <input value="0" class="form-control col matrix-value" data-matrix-field='4' id="matrix-d"></input>
            <label for="matrix-f" class="col matrix-label">f: </label>
            <input value="0" class="form-control col matrix-value" data-matrix-field='5' id="matrix-f"></input>
        </div>
    `;
    let new_matrix = matrix(0, 0, 0, 0, 0, 0);
    matrixes[matricesSeq++] = new_matrix;
    
    matrixesContainer.appendChild(matrixRow);

    setupMatrixEvents();
}

function iterate(mcs, depth) {
    for (const m1 of mcs) {
        const new_matrices = [];
        for (const m2 of matrices) {
            new_matrices.push(mul(m1, m2));
        }
        if (depth > 0) {
            iterate(new_matrices, depth - 1);
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

    iterate(matrices, iterations)
}

let scaleFactor = 1.0;
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
        'Text',
        'Line',
        'ArrowOneSide',
        'ArrowTwoSide',
        'Triangle',
        'Rectangle',
        'Circle',
        'Image',
        'BackgroundImage',
        'Polygon',
        'ImageCrop',

        // Drawing options
        //'ColorHtml5',
        'Color',
        'ShapeBorder',
        'BrushSize',
        'OpacityOption',

        'LineWidth',
        'StrokeWidth',

        'Resize',
        'ShapeContextMenu',
        'CloseButton',
        'OvercanvasPopup',
        'OpenPopupButton',
        'MinimizeButton',
        'ToggleVisibilityButton',
        'MovableFloatingMode',
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
                draw();
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
    }, 512, 512);


    $('#drawing-container').append(drawingCanvas.getHtml());
    drawingCanvas.onInsert();
}