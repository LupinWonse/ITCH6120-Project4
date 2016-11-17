
// WebGL Objects
var canvas;
var gl;
var program;

// Data
var points = [];
var colors = [];

// Temporary Current Color variable
var currentColor = [];

// Vertex Buffer
var vBuffer;
var cBuffer;

// Proejction variables
var near = 1.0;
var far = 100.0;
var right = 2;
var left = -2;
var pTop = 3;
var pBottom = -1;

// ModelView Transformation variables

var lookAlpha = 90/180*Math.PI;
var lookBeta = 90/180*Math.PI; ;
// First Person View
var eye = vec3(90.0, 550.0, -4.0);
var at = vec3(91.0, 550.0, -4.0);
var up = vec3(0.0, 0.0, -1.0);

//Top Down View
//var eye = vec3(90.0, 550.0, -50.0);
//var at = vec3(90.0, 550.0, -49.0);
//var up = vec3(0.0, -1.0, 0.0);

var mvLocation, pLocation;
var modelView, projection;

// Option Flags
var showCeilings = false;
var showFloors = true;

window.onload = function init() {
    "use strict";
    canvas = document.getElementById("gl-canvas");
    
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { this.alert("WebGL isn't available"); }
    
    // Setup webgl
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.5, 0.5, 1.0, 1.0);
    // Enable depth test
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    // Create the vertex color buffer
    // This might have to removed / changed when implementing lighting / shading models
    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    var cPosition = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(cPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(cPosition);
    

    // Load uniform locations
    mvLocation = gl.getUniformLocation(program,"modelViewMatrix");
    pLocation = gl.getUniformLocation(program,"projectionMatrix");

    
    // Generate model data
    generateRoomsFromData();
    // Upload model data to GPU
    updateModel();
    // Start rendering
    render();
};

// Upload model data to the GPU
function updateModel () {
    // Update vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    
    //Update colors
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
}

// Main render function
function render() {
    gl.clear( gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT);

    // Setup model-view and projection matrices
    mvMatrix = lookAt(eye, at, up);
    pMatrix = perspective();
    


    
    // Update the matrices in the shaders
    gl.uniformMatrix4fv(mvLocation, false, flatten(mvMatrix));
    gl.uniformMatrix4fv(pLocation, false, flatten(pMatrix));
    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, points.length);

    // Redraw
    requestAnimationFrame(render);
}

function perspective() {
    // Simply constructthe 4x4 Perspective matrix using the calculated formula
    var result = mat4();
    result[0][0] = 2 * near / (right - left);
    result[0][2] = (right + left) / (right - left);
    result[1][1] = 2 * near / (pTop - pBottom);
    result[1][2] = (pTop + pBottom) / (pTop - pBottom);
    result[2][2] = - (far + near) / (far - near);
    result[2][3] = - (2 *far * near) / (far - near);
    result[3][2] = -1;
    return result;
}

// Data handling functions
function generateRoomsFromData(){
    for (room in data.rooms) {
        polygon(data.rooms[room].polygon);
    }
}


// Modelling functions

function polygon(vertices){
    // This function generates a room from the given polygon
    // Polygon is provided as an array of vertices
    
    // If a vertex has 3 elements instead of two then this vertex is a DOOR
    
    var polygonVertices = [], elevatedVertices = [], floorVertices = [];
    for (var i = 0 ; i < vertices.length; i++){
        // If this vertex is a door vertex
            polygonVertices.push(vec4(vertices[i][0],vertices[i][1],0));
            elevatedVertices.push(vec4(vertices[i][0],vertices[i][1],-12)); 
        
        // Generate suitable 
        floorVertices.push(vertices[i][0]);
        floorVertices.push(vertices[i][1]);
        
    }
    // Triangulate the floor
    
    currentColor = [0,0,0,1];
    
    var floorTriangles = PolyK.Triangulate(floorVertices);
    // Create triangles for the polygon triangulation
     for (var i = 0 ; i < floorTriangles.length; i = i + 3){
         
         // Floor
         if (showFloors) {
            var a = polygonVertices[floorTriangles[i]];
            var b = polygonVertices[floorTriangles[i+1]];
            var c = polygonVertices[floorTriangles[i+2]]; 
            triangle(a,b,c); 
         }
         
         if (showCeilings) {
         var d = elevatedVertices[floorTriangles[i]];
         var e = elevatedVertices[floorTriangles[i+1]];
         var f = elevatedVertices[floorTriangles[i+2]];
         
         triangle(d,e,f);             
         }

     }
    
    currentColor = [0.5,0.5,0.5,1]
    
    for (var i = 0 ; i < vertices.length; i++){
        if (i == vertices.length - 1) {
            next = 0
        } else {
            next = i+1;
        }
        
        var a = polygonVertices[i].slice(0);
        var b = elevatedVertices[i].slice(0);
        var c = elevatedVertices[next].slice(0);
        var d = polygonVertices[next].slice(0);
        
        // Door CASE
        if ( vertices[i].length == 3 ){
            console.log("Door");
            a[2] = -8;
            d[2] = -8;
        }
        triangle(a,b,c);
        triangle(a,d,c);
    }   
}

function triangle(a, b, c) {
    points.push(a);
    points.push(b);
    points.push(c);
    
     //normals.push(vec4(a[0],a[1],a[2],0.0));
     //normals.push(vec4(b[0],b[1],b[2],0.0));
     //normals.push(vec4(c[0],c[1],c[2],0.0));
    
    colors.push(currentColor);
    colors.push(currentColor);
    colors.push(currentColor);

     //index += 3;
}

// Movement controller functions

window.onkeydown = function () {
   // console.log(event.keyCode);
    
    
    
    if (event.key == "a") {
        moveLeft();
    } else if (event.key == "d") {
        moveRight();
    } else if (event.key == "s") {
        moveBackwards();
    } else if (event.key == "w") {
        moveForward();
    } else if (event.keyCode == 37){
        lookLeft();
    } else if (event.keyCode == 38){
        lookUp();
    } else if (event.keyCode == 39){
        lookRight();
    } else if (event.keyCode == 40){
        lookDown();
    }
}



function moveForward(){
    var forward = subtract(at , eye);
    move(forward);
}

function moveLeft(){
    var forward = subtract(at , eye);
    var left = cross(up , forward);
    move(left);
}

function moveRight(){
    var forward = subtract(at , eye);
    var right = cross(forward , up);
    move(right);
}

function moveBackwards(){
    var backwards = subtract(eye,at);
    move(backwards);
}

function move(direction){
    eye = add(eye, direction);
    at = add(at, direction);
}

function lookUp(){
    lookBeta =  lookBeta + 5/180*Math.PI;
    look();
}

function lookDown(){
    lookBeta =  lookBeta - 5/180*Math.PI;
    look();
}

function lookRight(){
    lookAlpha =  lookAlpha + 5/180*Math.PI;
    look();
    
}

function lookLeft(){
    lookAlpha =  lookAlpha - 5/180*Math.PI;
    look();
}

function look(){
    var x = eye[0] + Math.cos(lookAlpha) * Math.sin(lookBeta)
    var y = eye[1] + Math.sin(lookAlpha) * Math.sin(lookBeta)
    var z = eye[2] + Math.cos(lookBeta)

    at = vec3(x,y,z);
}



