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
const E = matrix(1, 0, 0, 1, 0, 0);
const presets = {
    koch: {
        0: matrix(1/3 * Math.cos( 0 * rad), -1/3 * Math.sin( 0 * rad),
                1/3 * Math.sin( 0 * rad),  1/3 * Math.cos( 0 * rad), 0, 0),
        1: matrix(1/3 * Math.cos( 60* rad), -1/3 * Math.sin( 60* rad),
                1/3 * Math.sin( 60* rad),  1/3 * Math.cos( 60* rad), 1/3, 0),
        2: matrix(1/3 * Math.cos(-60* rad), -1/3 * Math.sin(-60* rad),
                1/3 * Math.sin(-60* rad), 1/3 * Math.cos(-60* rad), 1/2, -Math.sqrt(3)/6),
        3: matrix(1/3 * Math.cos( 0 * rad), -1/3 * Math.sin( 0 * rad),
                1/3 * Math.sin( 0 * rad),  1/3 * Math.cos( 0 * rad), 2/3, 0),
    },
    sierpinski: {
        0: matrix(0.5, 0, 0, 0.5, 0, 0),
        1: matrix(0.5, 0, 0, 0.5, 0.5, 0),
        2: matrix(0.5, 0, 0, 0.5, 0.25, -0.5),
    },
    leaf: {
        0: matrix(0.01,     0,     0, 0.16, 0,     0),
        1: matrix(0.85, -0.04,  0.04, 0.85, 0,  -1.6),
        2: matrix(0.2,   0.23, -0.26, 0.22, 0,  -1.6),
        3: matrix(-0.15, 0.26,  0.28, 0.24, 0, -0.44)
    }
} 

let matrices = [];
Object.defineProperty(matrices, 'E', {
    value: E,
    writable: true,
    enumerable: false,
    configurable: true
});
let matricesSeq = 1;
// const matrices = [T1, T2, T3, T4];

const angles = [];
angles.E = 0.0002;

let iterations = 2;
let showControls = true;
let animate = false;
let animation_speed = 10;
let trails = 255;

function drawBaseImage(t) {
    push();
    applyMatrix(...t);
    fill(255, 255, 255, 255);
    image(texture, 0, -1, 1, 1);
    pop();
}

function drawControl(t, action) {
    push();
    applyMatrix(...t);
    
    if (t == E) {
        stroke(255, 255, 255, action ? 255 : 60);
    } else {
        stroke(255, 204, 0, action ? 255 : 60);
    }
    strokeWeight(10/500);
    noFill();

    if (action == 'right') {
        fill(255, 204, 0);
    } else {
        noFill();
    }

    line(0, 0, 1, 0);
    circle(1, 0, 1 / 10);

    if (action == 'top') {
        fill(255, 204, 0);
    } else {
        noFill();
    }

    line(0, -1, 0, 0);
    circle(0, -1, 1 / 10);

    pop();
}


function mul(...matrices) {
    const r = mat2d.create();
    for (const m of matrices) {
        mat2d.mul(r, r, m);
    }
    return r;
}

function rot(m1, a) {
    const r = mat2d.create();
    mat2d.rotate(r, m1, a);
    return r;
}

function setup() {
    oncontextmenu = () => false // disable context meny
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

        $('#animate').change(function() {
            animate = this.checked;
        });

        $('#enable-trails').change(function() {
            trails = this.checked ? 10 : 255;
        });

        for (const m of Object.values(matrices)) {
            addMatrix(m);
        }

        //aniamtionspeed slider
        const valueSpan = $('.valueSpan2');
        const value = $('#customRange11');
        valueSpan.html(value.val());
        value.on('input change', () => {
            animation_speed = value.val();
            valueSpan.html(value.val());
        });
        loadPreset(presets.sierpinski);
    });
}

function loadPreset(presetMatrices) {
    matricesSeq = 1;

    console.log(presetMatrices);

    for (const elem of $("#matrices-container").children()) {
        elem.parentElement.removeChild(elem);
    }

    for (const m of Object.keys(matrices)) {
        delete matrices[m];
    }

    for (const m of Object.keys(presetMatrices)) {
        addMatrix(presetMatrices[m]);
    }
}

function setupMatrixEvents() {
    $('.delete-matrix').off();
    $('.delete-matrix').on('click', function(event) {
        const matrixId = event.target.attributes['data-matrix'].value;
    
        delete matrices[matrixId];

        let row = document.getElementById('matrix-row-' + matrixId);
        row.parentElement.removeChild(row);
    });
    $('.matrix-value').off();
    $('.matrix-value').on('input', (event) => {
        const matrixId = event.target.attributes['data-matrix'].value;
        const matrixField = event.target.attributes['data-matrix-field'].value;
        if (matrixField == -1) {
            angles[matrixId] = event.target.value;
        } else {
            matrices[matrixId][matrixField] = event.target.value;
        }
    });
}

function addMatrix(addedMatrix=[1,0,0,1,0,0]) {
    let matricesContainer = document.getElementById("matrices-container");

    let matrixRow = document.createElement("div");
    matrixRow.classList.add("row");
    matrixRow.classList.add("matrix");

    let new_matrix = $.extend(true, [], addedMatrix);
    matrices[matricesSeq] = new_matrix;
    angles[matricesSeq] = Math.random() * 10;

    matrixRow.id = "matrix-row-" + matricesSeq;
    matrixRow.innerHTML = `
        <h5 class="col"> Matrix ${matricesSeq}</h5>
        
            <label class="col matrix-label">rotation:
                <input value="${angles[matricesSeq]}" class="form-control col matrix-value" data-matrix-field='-1' data-matrix="${matricesSeq}"></input>
            </label>
        <button class="btn btn-warning delete-matrix" data-matrix="${matricesSeq}" >Delete matrix</button> 
        <div class="row matrix-row" data-matrix="${matricesSeq}">
            <label class="col matrix-label">a: 
                <input value="${addedMatrix[0]}" class="form-control matrix-value" data-matrix-field='0' data-matrix="${matricesSeq}"></input>
            </label>
            <label class="col matrix-label">b: 
                <input value="${addedMatrix[1]}" class="form-control col matrix-value" data-matrix-field='1' data-matrix="${matricesSeq}"></input>
            </label>
            
            <label for="matrix-e" class="col matrix-label">tx:
                <input value="${addedMatrix[4]}" class="form-control col matrix-value" data-matrix-field='4' data-matrix="${matricesSeq}"></input>
            </label>
        </div>
        <div class="row matrix-row" data-matrix="${matricesSeq}">
            <label class="col matrix-label">c:
                <input value="${addedMatrix[2]}" class="form-control col matrix-value" data-matrix-field='2' data-matrix="${matricesSeq}"></input>
            </label>
            
            <label class="col matrix-label">d:
                <input value="${addedMatrix[3]}" class="form-control col matrix-value" data-matrix-field='3' data-matrix="${matricesSeq}"></input>
            </label>
            
            <label class="col matrix-label">ty:
                <input value="${addedMatrix[5]}" class="form-control col matrix-value" data-matrix-field='5' data-matrix="${matricesSeq}"></input>
            </label>
        </div>
    `;

    matricesSeq++;
    
    matricesContainer.appendChild(matrixRow);

    setupMatrixEvents();
}

function changeMatrix(indx) {
    let matrixDiv = $(`#matrix-row-${indx}`)

    for(i = 0; i < matrices[indx].length; i++) {
        matrixDiv.find(`input[data-matrix-field=${i}]`).attr("value", matrices[indx][i]);
    }
}

function iterate(matrices, depth, curr = matrices) {
    for (const m1 of curr) {
        const new_matrices = [];
        for (const m2 of matrices) {
            const new_matrix = mul(m1,inv(E),  m2);

            // new_matrices.push(( animate ? rot(new_matrix, new Date() / (10000 / animation_speed)) : new_matrix ));
            new_matrices.push(new_matrix);
        }
        if (depth > 1) {
            iterate(matrices, depth - 1, new_matrices);
        } else {
            drawBaseImage(m1);
        }
    }
}

function viewMatrix() {
    return matrix(scaleFactor, 0, 0, scaleFactor, translateX, translateY);
}

function inv(m) {
    const r = mat2d.create();
    mat2d.invert(r, m);
    return r;
}

function distSq(x1, y1, x2, y2) {
    return (x1 - x2) ** 2 + (y1 - y2) ** 2;
}

function distToSegmentSq(x, y, x1, y1, x2, y2) {
  let l2 = distSq(x1, y1, x2, y2);
  if (l2 == 0) return distSq(x, y, x1, y1);
  let t = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return distSq(x, y, x1 + t * (x2 - x1), y1 + t * (y2 - y1));
}


let closestOwner = -1;
let closestAction;

function draw() {
    background(0, 0, 0, trails);
    applyMatrix(...viewMatrix());

    iterate(Object.values(matrices), iterations);

    if (showControls) {
        drawControl(E);
        for (const k in {E, ...matrices}) {
            drawControl(matrices[k], closestOwner == k ? closestAction : null);
        }
    }
    if (animate) {
        for (const k in {E, ...matrices}) {
            mat2d.rotate(matrices[k], matrices[k], angles[k] / 10000 * animation_speed );
        }
    }
}

let scaleFactor = 500;
let translateX = 0.0;
let translateY = 0.0;
let zoomSensitivity = 0.01;

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

function transform(...args) {
    const vec = args.pop();
    const matrices = args;
    const result = vec2.create();
    vec2.transformMat2d(result, vec, mul(...matrices));
    return result;
}

function getRightControlScreenLoc(t) {
    return transform(viewMatrix(), t, [1, 0]);
}

function getTopControlScreenLoc(t) {
    return transform(viewMatrix(), t, [0, -1]);
}

function getOriginControlScreenLoc(t) {
    return transform(viewMatrix(), t, [0, 0]);
}

function mousePressed() {
    let closestPointDistSq = Infinity;
    let closestLineDistSq = Infinity;
    for (const k in {E, ...matrices}) {
        const m = matrices[k];
        const [tx, ty] = getTopControlScreenLoc(m);
        const [rx, ry] = getRightControlScreenLoc(m);
        const [ox, oy] = getOriginControlScreenLoc(m);

        const topDistSq = distSq(tx, ty, mouseX, mouseY);
        if (topDistSq < closestPointDistSq) {
            closestPointDistSq = topDistSq;
        }

        const rightDistSq = distSq(rx, ry, mouseX, mouseY);
        if (rightDistSq < closestPointDistSq) {
            closestPointDistSq = rightDistSq;
        }

        const td = distToSegmentSq(mouseX, mouseY, tx, ty, ox, oy);
        const rd = distToSegmentSq(mouseX, mouseY, rx, ry, ox, oy);
        const maxd = Math.min(td, rd);
        if (closestLineDistSq > maxd) {
            closestLineDistSq = maxd;
        }
        
        const isInCircle = Math.sqrt(closestPointDistSq) < scaleFactor / 50;
        console.log(closestPointDistSq)
        if (topDistSq == closestPointDistSq && isInCircle) {
            if (mouseButton == RIGHT) {
                closestAction = 'top';
                closestOwner = k;
            } else {
                closestAction = 'rotate';
                closestOwner = k;
            }
        }
        if (rightDistSq == closestPointDistSq && isInCircle) {
            if (mouseButton == RIGHT) {
                closestAction = 'right';
                closestOwner = k;
            } else {
                closestAction = 'rotate';
                closestOwner = k;
            }
        }
        if (!closestAction && closestLineDistSq == maxd && Math.sqrt(closestLineDistSq) < scaleFactor / 70) {
            closestAction = 'origin';
            closestOwner = k;
        }
    }
    console.log(closestAction);
}

function mouseReleased() {
    closestOwner = -1;
    closestAction = null;
}

function mouseDragged() {
    if (isMouseOverCanvas()) {
        const [tX, tY] = transform(inv(viewMatrix()), [mouseX, mouseY])
        const [fX, fY] = transform(inv(viewMatrix()), [pmouseX, pmouseY])
        const [dX, dY] = [tX - fX, tY - fY];
        const currMatrix = matrices[closestOwner];
        if (closestAction == 'origin') {
            currMatrix[4] += dX;
            currMatrix[5] += dY;
            changeMatrix(closestOwner);
        } else if (closestAction == 'right') {
            currMatrix[0] += dX;
            currMatrix[1] += dY;
            changeMatrix(closestOwner);
        } else if (closestAction == 'top') {
            currMatrix[2] -= dX;
            currMatrix[3] -= dY;
            changeMatrix(closestOwner);
        } else if (closestAction == 'rotate') {
            const [oX, oY] = transform(currMatrix, [0, 0]);

            const p12sq = distSq(oX, oY, tX, tY);
            const p13sq = distSq(oX, oY, fX, fY);
            const p23sq = distSq(tX, tY, fX, fY);
    
            const cross = (tX - oX) * (fY - oY) - (tY - oY) * (fX - oX);
            const det = currMatrix[0] * currMatrix[3] - currMatrix[1] * currMatrix[2];
            const angle = - Math.sign(det) * Math.sign(cross) * Math.acos((p12sq + p13sq - p23sq) / (2 * Math.sqrt(p12sq) * Math.sqrt(p13sq)));
            if (isNaN(angle)) {
                return;
            }
            mat2d.rotate(currMatrix, currMatrix, angle);
            const sc = Math.sqrt(p12sq) / Math.sqrt(p13sq);
            currMatrix[0] *= sc;
            currMatrix[1] *= sc;
            currMatrix[2] *= sc;
            currMatrix[3] *= sc;
            changeMatrix(closestOwner);
        } else {
            translateX += mouseX - pmouseX;
            translateY += mouseY - pmouseY;
        }
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
        
                    'ShapeContextMenu',
                    'CloseButton',
                    'OvercanvasPopup',
                    'OpenPopupButton',
                    'MinimizeButton',
                    'ToggleVisibilityButton',
                    'MovableFloatingMode',
                    'FullscreenModeButton',
        
                    'TextLineHeight',
                    'TextAlign',
        
                    'TextFontFamily',
                    'TextFontSize',
                    'TextFontWeight',
                    'TextFontStyle',
                    'TextDecoration',
                    'TextColor',
                    'TextBackgroundColor'
    ];

    
    var drawingCanvas = new DrawerJs.Drawer(null, {
        plugins: drawerPlugins,
        corePlugins: [
            'Zoom',
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

    // hack for toni
    $('#drawing-container > img')[0].style.removeProperty('position');
}