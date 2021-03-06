//globals

var globalAccel = {y:50,x:0.5};
/*****************CLASSES*******************/

function BulkAnimator() {

    this.timeout = null;
    this.functionsToCall = [];

    this.interval = 1000 * 1/40;

    this.animating = false;
};

BulkAnimator.prototype.add = function(functionToAdd) {
    this.functionsToCall.push(functionToAdd);

    this.checkOrSetTimeout();
};

BulkAnimator.prototype.checkOrSetTimeout = function() {
    if(this.animating)
    {
        return;
    }
    this.animating = true;

    var _this = this;

    var toCall = function() {
        _this.animateAll();
    };

    //now we can add functions to this for the next interval amount of time
    //and they will all be updated at once. I'm hoping this severely improves performance, because
    //it will essentially be more like "frame draws" than all this sync drawing. So it's going
    //Async particles -> async animating -> collection into bulkAnimator -> sync drawing

    this.timeout = setTimeout(toCall,this.interval);
};

BulkAnimator.prototype.stopAnimating = function() {
    this.animating = false;
    this.functionsToCall = [];
};

BulkAnimator.prototype.animateAll = function() {

    //we have to reset our vars here because the functions we call might
    //start adding new functions

    var functions = this.functionsToCall;

    this.animating = false;
    this.functionsToCall = [];

    for(var i = 0; i < functions.length; i++)
    {
        functions[i]();
    }
};

function GravityArrow() {
    var height = $j(window).height();
    var pos = vecMake(40,height-60);

    this.pos = pos;
    this.rArrow = new rArrow(pos,globalAccel);
    this.text = p.text(pos.x,pos.y + 40,"Gravity");
    this.text.attr({
        'fill':'#FFF',
        'stroke':'#FFF',
        'stroke-width':0,
        'font-size':20
    });
};

GravityArrow.update

function GravityTweener(gStart,gEnd,time,doneFunction) {

    //the "rotationLayer" is the HTML node we need to rotate to show the gravity direction.

    if(!gStart || !gEnd || !time)
    {
        throw new Error("bad args in gravity tweener");
    }

    //check for bad vectors
    if( String(gStart.x) == 'NaN' || String(gEnd.x) == 'NaN')
    { throw new Error("NAN in gt"); }

    this.doneFunction = doneFunction;
    this.totalTime = time;
    this.gEnd = gEnd;

    var startSituation = rotationLayerRad;

    //lets compare the start and end situations to avoid "snapping" the grid. first, we need to understand
    //how gravity directions correspond to their "angles" of rotation. In this situation, an angle of rotation
    //of 0 corresponds to a gravity direction of "down" when viewing the screen. unfortunately, the screen
    //coordinates are flipped so this acceleration vector is actually pointing up! so the
    //atan2 of the acceleration vector is + Pi / 2, and the rotation angle is just 0
    this.direction = -1;

    //hence, in order to get a gravity vector for a rotation angle, we add Math.PI * 0.5
    var currentGravDirection = this.degToVec(startSituation - Math.PI * 0.5);

    //then we get our normalize gravity vector
    var gStartN = vecNormalize(vecMake(gStart.x,-gStart.y));

    //now we can see if the current degree of rotation of the grid
    //corresponds to our starting gravity direction:
    if(vecDot(gStartN,currentGravDirection) < 0.98)
    {
        console.warn("Current situation and our starting grav direction don't agree!!");
    }

    //ok, lets get some values here
    this.startAngle = this.gToDeg(gStart);
    this.endAngle = this.gToDeg(gEnd);

    //there is one tricky situation with wraparound of angles where we might rotate in the wrong direction.
    //this is why we can't use Tween.js because it doesn't recognize trig wraparounds. so, if we are animating
    //between two vectors like this:
    //
    //        n |
    //         \|
    //  --------+---------
    //         /|
    //        v |
    //

    //we will accidentally rotate way more degrees than necessary. to detect this...
    if(Math.abs(this.endAngle - this.startAngle) > Math.PI)
    {
        //we are rotating too much. there are a couple of situations here....

        //we want to modify one of the angles by 2 pi to wrap it around so a linear interp
        //or cubic easeinout works correctly.
        if(this.startAngle > Math.PI)
        {
            this.startAngle -= Math.PI * 2;
        }
        else if(this.endAngle > Math.PI)
        {
            this.endAngle -= Math.PI * 2;
        }
        else if(this.startAngle < -1*Math.PI)
        {
            this.startAngle += Math.PI * 2;
        }
        else if(this.endAngle < -1 * Math.PI)
        {
            this.endAngle += Math.PI * 2;
        }
    }

    //wraparound should be good, go interp between these two angles
};

GravityTweener.prototype.start = function() {

    this.animateStep(0);
};

GravityTweener.prototype.degToVec = function(deg) {
    return vecMake(Math.cos(deg),Math.sin(deg));
};

GravityTweener.prototype.gToDeg = function(vector) {
    var angle = Math.atan2(-vector.y,vector.x);
    angle += Math.PI * 0.5;
    return angle;
};

GravityTweener.prototype.cubicEaseInOut = function(x) {
    //here x is just between 0 and 1... b = 0, c = 1, etc
    var t = x / 0.5;
    if(t < 1)
    {
        return 0.5 * t * t * t;
    }
    t -= 2;
    return 0.5 * (t * t * t + 2);
};

GravityTweener.prototype.animateStep = function(timeVal) {

    var progressX = timeVal / this.totalTime;

    if(progressX > 1)
    {
        rotationLayerRad = this.gToDeg(this.gEnd);
        globalAccel = this.gEnd;
        if(this.doneFunction) {
            this.doneFunction();
        }
        return;
    }

    var progressY = this.cubicEaseInOut(progressX);

    var rotAngleNow = this.startAngle + progressY * (this.endAngle - this.startAngle);

    var gVec = this.degToVec(rotAngleNow + Math.PI * 0.5);
    if(gArrow)
    {
        gArrow.rArrow.remove();
        gArrow.rArrow = new rArrow(gArrow.pos,vecScale(gVec,vecLength(globalAccel)));
    }

    var toSet = 'rotate3d(0,0,1,' + String(rotAngleNow) + 'rad)';
    //set it
    $j(rotationLayer).css('-webkit-transform',toSet);
    $j(rotationLayer).css('-moz-transform',toSet);

    //add ourselves :D
    var _this = this;
    var f = function() {
        _this.animateStep(timeVal + globalAnimateSpeed);
    };

    bAnimator.add(f);
};


function uiControl(parentObj) {
    this.active = false;
    this.UIbutton = null;
    this.parentObj = parentObj;

    //we have to bind the "this" scope to our object for the
    //event handlers

    var _this = this;

    var cc = function(e) {
        _this.canvasClick(e);
    };
    var cm = function(e) {
        _this.canvasMove(e);
    };
    var crc = function(e) {
        _this.canvasRightClick(e);
    };
    var mu = function(e) {
        _this.canvasMouseUp(e);
    };
    var kd = function(e) {
        _this.canvasKeyDown(e);
    };

    //register event handlers
    $j('#canvasHolder').bind('mousedown',cc);
    $j('#canvasHolder').bind('mousemove',cm);
    $j('#canvasHolder').bind('contextmenu',crc);
    $j('#canvasHolder').bind('mouseup',mu);
    $j(document).bind('keydown',kd);
};

uiControl.prototype.canvasKeyDown = function(e) {
    if(this.parentObj.active)
    {
        var which = e.which;
        this.parentObj.keyDown(which,e);
    }
};

uiControl.prototype.canvasRightClick = function(e) {
    if(this.parentObj.active)
    {
        e.preventDefault();
    }
};

uiControl.prototype.canvasMouseUp = function(e) {
    if(this.parentObj.active)
    {
        this.parentObj.mouseUp(e.offsetX,e.offsetY);
    }
};

uiControl.prototype.canvasMove = function(e) {
    if(this.parentObj.active)
    {
        var x = e.offsetX; var y = e.offsetY;
        if(!x) { x = e.pageX; y = e.pageY; } //FF

        this.parentObj.mouseMove(x,y,e);
    }
};

uiControl.prototype.canvasClick = function(e) {

    if(!this.parentObj.active)
    {
        return;
    }

    var x = e.offsetX;
    var y = e.offsetY;

    if(!x) //FF
    {
        x = e.pageX;
        y = e.pageY;
    }

    if(e.which == 1)
    {
        this.parentObj.leftClick(x,y);
    }
    else
    {
        this.parentObj.rightClick(x,y);
    }
};

//stubs
uiControl.prototype.mouseUp = function(x,y) {
    return;
};

uiControl.prototype.rightClick = function(x,y) {
    return;
};

uiControl.prototype.mouseMove = function(x,y) {
    return;
};

uiControl.prototype.leftClick = function(x,y) {
    return;
};

uiControl.prototype.keyDown = function(which) {
    return;
};

function UIButton(parentObj,id,text,activeText,buttonsToShow) {

    this.active = false;
    this.parentObj = parentObj;

    this.text = text;
    this.activeText = activeText;
    this.id = id;

    if(buttonsToShow) {
        var buttons = buttonsToShow.map(function(id) { return "#" + id; });
        this.buttonsToShow = buttons.join(',');
    } else {
        this.buttonsToShow = "";
    }

    this.mainButtons = ['addPolyButton','traceButton','editPolyButton',
                        'importExportButton','clearButton','solveButton'];
    this.mainButtons = this.mainButtons.map(function(id) { return "#" + id; });
    this.mainButtons = this.mainButtons.join(",");

    var _this = this;
    var cHandler = function(e) {
        _this.anchorClick();
    };

    $j('#' + this.id).click(cHandler);
};

UIButton.prototype.hideAllButtons = function() {
    $j('.uiButton').slideUp();
};

UIButton.prototype.showMainButtons = function() {
    $j(this.mainButtons).slideDown();
};

UIButton.prototype.anchorClick = function() {

    var nots = ":not(#" + this.id + ")";

    if(!this.active)
    {
        this.parentObj.activate();
        $j('#' + this.id).text(this.activeText);

        $j('.uiButton').filter(nots).slideUp();

        $j(this.buttonsToShow).slideDown();
    }
    else
    {
        this.parentObj.deactivate();
        $j('#' + this.id).text(this.text);

        $j(this.buttonsToShow).slideUp();
        $j(this.mainButtons).filter(nots).slideDown();
    }
};


function rArrow(pos,vel) {
    if(!pos || !vel) { throw new Error("null arguments!"); }
    //ok so we want to essentially make a path that looks like an arrow

    //this consists of making a path. first we start at our position, and then
    //we move some fraction of our velocity in the velocity direction to get our second point.

    //then we draw the arrow heads. this is done by doing some vector rotations and the like
    this.pos = pos;
    this.vel = vel;

    this.path = null;

    this.buildPath();
};

rArrow.prototype.buildPath = function() {
    //ok get the first point, that's easy
    var points = [];

    var tail = this.pos;
    points.push(tail);

    //now get the head
    var fraction = 0.5;

    var velScaled = vecScale(this.vel,fraction); 
    var head = vecAdd(velScaled,tail);
    points.push(head);

    //ok so we need to do something simple. first get the angle from the head to the tail
    //aka, the atan2 of the negated velocity
    var fromHeadToTail = vecNegate(this.vel);

    var angle = vecAtan2(fromHeadToTail);

    //now add 45 to get chevron1 (i know these aren't chevrons but i dont have a good name
    //for the little dangly things off the arrow head).
    //and subtract 45 to get chevron2

    var chev1Angle = angle + Math.PI * 0.25;
    var chev2Angle = angle - Math.PI * 0.25;

    //get these vectors
    var chev1Vec = vecScale(angleToVec(chev1Angle),vecLength(this.vel) * 0.1);
    var chev2Vec = vecScale(angleToVec(chev2Angle),vecLength(this.vel) * 0.1);

    //get these points
    var chev1point = vecAdd(head,chev1Vec);
    var chev2point = vecAdd(head,chev2Vec);

    points.push(chev1point,head,chev2point,head);

    //now the path. god this is a long process
    var pathStr = constructPathStringFromCoords(points);

    var velMag = vecLength(this.vel);

    var extra = map(velMag,0,1000,0,10);
    var strokeWidth = 2 + Math.round(extra);

    this.path = p.path(pathStr);
    this.path.attr({
        'stroke-width':strokeWidth,
        'stroke':velocityHue(this.vel),
         'stroke-linecap':'round',
        'stroke-linejoin':'round'
    });
};

rArrow.prototype.update = function(pos,vel) {
    if(this.path)
    {
        this.path.remove();
    }

    this.pos = pos;
    this.vel = vel;

    this.buildPath();
};

rArrow.prototype.remove = function() {
    if(this.path)
    {
        this.path.remove();
    }
};

rArrow.prototype.highlight = function() {
    if(this.path)
    {
        this.path.attr({
            'stroke':'#F00',
            'stroke-width':5
        });
    }
};






/*^^^^^ general UI classes ^^^^*/
/*

 *->    specific UI classes <- */


function polygonUIControl() {

    this.uiPoints = [];
    this.uiPath = null;
    this.currentPoint = null;
    this.firstTime = true;
    this.active = false;

    this.prototype = new uiControl(this);
    this.UIbutton = new UIButton(this,'addPolyButton','Add Polygon','Stop Adding Polygons');
};

polygonUIControl.prototype.deactivate = function() {
    //remove our path and points from the screen
    $j.each(this.uiPoints,function(index,point) {
        point.remove();
    });

    if(this.uiPath) { this.uiPath.remove(); }
    if(this.currentPoint) { this.currentPoint.remove(); }

    this.active = false;
    //set our button as well
    this.UIbutton.active = false;
    $j('#canvasHolder').css('cursor','default');
};

polygonUIControl.prototype.activate = function() {
    //just reset some variables
    this.uiPoints = [];
    this.currentPoint = null;
    this.uiPath = null;

    if(this.firstTime)
    {
        //explain what to do if its our first time
        topNotifyTemp("Left Click to Add, Right Click / Space to close",5000);
        this.firstTime = false;
    }

    this.active = true;
    this.UIbutton.active = true;
    $j('#canvasHolder').css('cursor','crosshair');
};

polygonUIControl.prototype.keyDown = function(which,e) {

    if(!this.currentPoint || which != 32)
    {
        //we aren't inserting, dont do anything. or hit wrong button
        return;
    }

    var x = this.currentPoint.attr('cx');
    var y = this.currentPoint.attr('cy');

    //if it's a space, then go close the polygon?
    this.rightClick(x,y);
};

polygonUIControl.prototype.rightClick = function(x,y) {

    var shouldAdd = true;
    //check if we should add this, this is a UI thing where users make
    //mistakes
    for(var i = 0; i < this.uiPoints.length; i++)
    {
        var uX = this.uiPoints[i].attr('cx');
        var uY = this.uiPoints[i].attr('cy');
        var dist = distBetween(vecMake(uX,uY),vecMake(x,y));
        if(dist < 5)
        {
            shouldAdd = false;
        }
    }

    if(shouldAdd)
    {
        //close the path basically and make a polygon with this
        var c = cuteSmallCircle(x,y);
        this.uiPoints.push(c);
    }


    var aPathString = constructPathStringFromPoints(this.uiPoints,true);

    //to dump this
    var polyPath = cutePath(aPathString,true);
    
    var clonedPoints = [];
    for(var i = 0; i < this.uiPoints.length; i++ ) { clonedPoints.push(this.uiPoints[i].clone()); }

    var results = polyController.makePolygon(clonedPoints,polyPath);

    //dump the ui stuff
    this.resetUIVars();
};

polygonUIControl.prototype.resetUIVars = function() {
    this.uiPath.remove();
    this.currentPoint.remove();

    $j.each(this.uiPoints,function(i,point) {
        point.remove();
    });

    this.uiPoints = [];
    this.uiPath = null;
    this.currentPoint = null;
};

polygonUIControl.prototype.leftClick = function(x,y) {

    var c = cuteSmallCircle(x,y);

    if(this.uiPath)
    {
        this.uiPath.remove();
    }
    this.uiPoints.push(c);

    //do a move to restore the path so it doesn't flicker when we are clicking
    this.mouseMove(x,y);
};

polygonUIControl.prototype.mouseUp = function(x,y) {
    return;
};

polygonUIControl.prototype.mouseMove = function(x,y) {
    //only do this when there is already one point
    if(!this.uiPoints.length) { return; }

    if(this.currentPoint)
    {
        this.currentPoint.remove();
    }

    //make a point underneath the mouse
    this.currentPoint = cuteSmallCircle(x,y,true);

    //append this point to the current points we have created
    var pointsCopy = this.uiPoints.slice(0);
    pointsCopy.push(this.currentPoint);

    //construct a path from this and draw it
    var pathString = constructPathStringFromPoints(pointsCopy,true);

    if(this.uiPath) { this.uiPath.remove(); }
    this.uiPath = cutePath(pathString);
};

function SolveUIControl() {

    this.active = false;
    this.firstTime = true;
    this.isAnimating = false;

    this.prototype = new uiControl(this);
    this.UIbutton = new UIButton(this,'solveButton','Solve!','Stop Solving');
};

//for some reason the stubs from the prototype dont get inherited
SolveUIControl.prototype.mouseMove = function() { return; }
SolveUIControl.prototype.mouseUp = function() { return; }
SolveUIControl.prototype.leftClick = function() { return; }
SolveUIControl.prototype.keyDown = function() { return; }
SolveUIControl.prototype.rightClick = function() { return; }

SolveUIControl.prototype.vertexClick = function(vertex) {
    if(!vertex.isConcave)
    {
        return;
    }
    if(this.isAnimating)
    {
        topNotifyTemp("One solution at a time!");
        return;
    }

    partController.clearAll();

    searcher = new GraphSearcher(vertex);
    searcher.search();
};

SolveUIControl.prototype.activate = function() {
    if(this.firstTime)
    {
        topNotifyTemp("Click on a concave vertex!",3000);
        this.firstTime = false;
    }

    this.active = true;
    this.UIbutton.active = true;

    //reset all particles
    partController.clearAll();

    this.setCursor('help',true);
};

SolveUIControl.prototype.deactivate = function() {
    this.active = false;
    this.UIbutton.active = false;

    this.setCursor('default',false);
};


SolveUIControl.prototype.setCursor = function(pointType,turningOn) {

    //go make all the polygon rPaths have the right cursor
    for(var i = 0; i < polyController.polys.length; i++)
    {
        var poly = polyController.polys[i];
        var path = poly.rPath;
        var vertices = poly.vertices;

        for(var j = 0; j < vertices.length; j++)
        {
            var v = vertices[j];
            if(turningOn && !v.isConcave)
            {
                $j(v.rPoint.node).css('cursor','not-allowed');
            }
            else
            {
                $j(vertices[j].rPoint.node).css('cursor',pointType);
            }
        }
    }

};


function EditUIControl() {
    //this might be pretty simple

    this.active = false;
    this.firstTime = true;
    
    this.prototype = new uiControl(this);
    this.UIbutton = new UIButton(this,'editPolyButton','Edit Polygons','Stop Editing Polygons');
};

//for some reason the stubs from the prototype dont get inherited
EditUIControl.prototype.mouseMove = function() { return; }
EditUIControl.prototype.mouseUp = function() { return; }
EditUIControl.prototype.leftClick = function() { return; }
EditUIControl.prototype.keyDown = function() { return; }
EditUIControl.prototype.rightClick = function() { return; }

EditUIControl.prototype.activate = function() {
    if(this.firstTime)
    {
        topNotifyTemp("Drag polygons / individual vertices",3000);
        this.firstTime = false;
    }

    this.active = true;
    this.UIbutton.active = true;

    //reset all particles
    partController.clearAll();

    this.setCursor('move','pointer');
};

EditUIControl.prototype.deactivate = function() {
    this.active = false;
    this.UIbutton.active = false;

    this.setCursor('default','default');
};


EditUIControl.prototype.setCursor = function(pathType,pointType) {

    //go make all the polygon rPaths have the right cursor
    for(var i = 0; i < polyController.polys.length; i++)
    {
        var poly = polyController.polys[i];
        var path = poly.rPath;
        var vertices = poly.vertices;

        $j(path.node).css('cursor',pathType);

        for(var j = 0; j < vertices.length; j++)
        {
            $j(vertices[j].rPoint.node).css('cursor',pointType);
        }
    }

};


function TraceUIControl() {
    this.resetVars();
    this.firstTime = true;
    this.accel = globalAccel;

    this.prototype = new uiControl(this);
    this.UIbutton = new UIButton(this,'traceButton',
                'Trace Particle','Stop Tracing Particles',
                ['clearParticlesButton','bombardButton','togglePathsButton']);
};

TraceUIControl.prototype.clearScreen = function() {
    //clear screen
    if(this.startPoint) { this.startPoint.remove(); }
    if(this.endPoint) { this.endPoint.remove(); }
    if(this.parab) { this.parab.removePath(); }
    if(this.path) { this.path.remove(); }
};

TraceUIControl.prototype.deactivate = function() {   
    this.clearScreen();
    this.resetVars();

    this.active = false;
    //set our button as well
    this.UIbutton.active = false;

    $j('#canvasHolder').css('cursor','default');
};

TraceUIControl.prototype.resetVars = function() {

    this.startPoint= null
    this.endPoint = null;
    this.parab = null;
    this.path = null;

    this.s = null;
    this.vel = null;
};


TraceUIControl.prototype.activate = function() {
    this.accel = globalAccel;
    //just reset some variables
    this.resetVars();

    if(this.firstTime)
    {
        this.firstTime = false;
        topNotifyTemp("Left click, drag, and release to shoot",4000);
    }

    this.active = true;
    this.UIbutton.active = true;
    $j('#canvasHolder').css('cursor','crosshair');
};

TraceUIControl.prototype.rightClick = function(x,y) {
    //just return I think? or do a random arc from here
    return;
};

TraceUIControl.prototype.keyDown = function(which,e) {
    return;
};

TraceUIControl.prototype.mouseUp = function(x,y) {
    //make the particle and advance it once
    var k = new KineticState(this.s,this.vel,this.accel);

    var inside = false;
    var polys = polyController.polys;

    for(var j = 0; j < polys.length; j++)
    {
        if(polys[j].rPath.isPointInside(this.s.x,this.s.y))
        {
            inside = true;
            break;
        }
    }
    if(inside)
    {
        this.clearScreen();
        this.resetVars();
        return; //dont launch particles inside polygons
    }

    var particle = partController.makeParticle(k,this.accel);

    //DEBUG
    part = particle;

    //make sure to reset our vars
    this.clearScreen();
    this.resetVars();
};

TraceUIControl.prototype.leftClick = function(x,y) {
    this.accel = globalAccel;

    //this is essentially the mousedown left click
    this.startPoint = cuteSmallCircle(x,y);

    this.s = {
        'x':x,
        'y':y
    };
 
    var now = new Date();
    this.startTime = now.getTime();

    this.mouseMove(x,y);
};

TraceUIControl.prototype.mouseMove = function(x,y,e) { 
    if(e && !e.which)
    {
        this.clearScreen();
        this.resetVars();
        return;
    }

    //only do the moving if our mouse is down
    if(!this.startPoint)
    {
        return;
    }

    var now = new Date();
    var time = now.getTime();

    if(time - this.startTime < 1000 && false)
    {
        return;
    }
    this.startTime = time;

    if(this.parab) { this.parab.removePath(); }
    if(this.path) { this.path.remove(); }
    if(this.endPoint) { this.endPoint.remove(); }

    //for mouse move, set the second point and make the velocity
    this.endPoint = cuteSmallCircle(x,y);

    this.e = {x:x,y:y};

    //make a path connecting them
    var pathString = constructPathStringFromPoints([this.startPoint,this.endPoint],false);
    this.path = cutePath(pathString);

    this.vel = {
        'x':x - this.s.x,
        'y':y - this.s.y
    };

    //now we have start, vel, and accel
    this.parab = new Parabola(this.s,this.vel,this.accel,true);
};


/**********END CLASSES******************/

function cuteSmallCircle(x,y,wantsSameColor) {
    var c = p.circle(x,y,4,4);

    if(!wantsSameColor)
    {
        c.attr("fill","hsba(0.5,0.8,0.7,1)");
    }
    else
    {
        c.attr("fill","hsba(" + String(Math.random()) + ",0.8,0.7,1)");
    }

    c.attr("stroke","#FFF");
    c.attr("stroke-width",2);
    return c;
};

function debugCircle(x,y) {
    var c = cuteSmallCircle(x,y);
    c.attr('stroke','#F00');
    c.attr('stroke-width',3);
    c.glow();
    return c;
}

function constructPathStringFromPoints(points,wantsToClose) {

    var pathString = "M" + String(points[0].attr('cx')) + "," + String(points[0].attr('cy'));
    for(var i = 1; i < points.length; i++)
    {
        var s = "L" + String(points[i].attr('cx')) + "," + String(points[i].attr("cy"));
        pathString = pathString + s;
    }

    if(wantsToClose)
    {
        pathString = pathString + "Z";
    }

    return pathString;
};

function constructPathStringFromCoords(points,wantsToClose) {

    var pathString = "M" + String(Math.round(points[0].x)) + "," + String(Math.round(points[0].y));

    var lp = points[0];

    for(var i = 1; i < points.length; i++)
    {
        var s = " L" + String(Math.round(points[i].x)) + "," + String(Math.round(points[i].y));
        //var s = " l" + String(points[i].x - lp.x) + "," + String(points[i].y - lp.y);
        //lp = points[i];
        pathString = pathString + s;
    }

    if(wantsToClose)
    {
        pathString = pathString + " Z";
    }

    return pathString;
};



function randomHueString() {
    var hue = Math.random();
    var str = 'hsb(' + String(hue) + ',0.7,1)';
    return str;
};

function randomGradient() {
    var hue = Math.random()*0.8;
    var color1 = 'hsb(' + String(hue) + ',0.7,1)';
    var color2 = 'hsb(' + String(hue + 0.2) + ',0.9,1)';

    var gradient = String(Math.round(Math.random()*180)) + '-' + color1 + '-' + color2;

    return gradient;
};

function cutePath(pathString,wantsToFill,strokeColor,fillColor) {
    var path = p.path(pathString);
    if(!strokeColor)
    {
        strokeColor = '#FFF';
    }
    if(!fillColor)
    {
        fillColor = randomGradient();
    }
    path.attr({
        'stroke-width':2,
        'stroke':strokeColor,
        'stroke-linecap':'round',
        'stroke-linejoin':'round'
    });

    if(wantsToFill)
    {
        path.attr('fill',fillColor);
    }
    return path;
};

function windowResize(e) {
    var width = $j('#canvasHolder').width();
    var height = $j('#canvasHolder').height();

    p.setSize(width,height);
};

function onScreen(point,accel) {
    var x = point.x;
    var y = point.y;

    if(!accel)
    {
        throw new Error("no accel specified!");
    }

    var width = $j('#canvasHolder').width() * 3;
    var height = $j('#canvasHolder').height() * 3;

    var minW = 0 - width;
    var minH = 0 - height;

    //ok so there are four boundaries. we can't check the boundary that is OPPOSITE
    //the direction of the acceleration because the particle might come back down!

    var bottomCheck = function(x,y) {
        return y > minH;
    };
    var topCheck = function(x,y) {
        return y < height;
    };
    var leftCheck = function(x,y) {
        return x > minW;
    };
    var rightCheck = function(x,y) {
        return x < width;
    };

    //ok so then nullify the check that corresponds to our accel angle
    var accelAngle = vecAtan2(accel);

    //accel is pointing to the right
    if(accelAngle >= -Math.PI * 0.25 && accelAngle < Math.PI * 0.25)
    {
        leftCheck = null;
    }
    else if(accelAngle >= Math.PI * 0.25 && accelAngle < Math.PI * 0.75) //pointing up
    {
        bottomCheck = null;
    }
    else if(accelAngle >= Math.PI * 0.75 || accelAngle < -Math.PI * 0.75) // left
    {
        rightCheck = null;
    }
    else if(accelAngle < -Math.PI * 0.25 && accelAngle >= -Math.PI * 0.75) // down
    {
        topCheck = null;
    }
    else
    {
        console.warn("bad accel angle ",accelAngle);
    }

    var checks = [leftCheck,bottomCheck,rightCheck,topCheck];

    var checkResult = true;
    for(var i = 0; i < checks.length; i++)
    {
        if(checks[i])
        {
            checkResult = checkResult && checks[i](x,y);
        }
    }

    return checkResult;
    //we dont check for y because particles could come back down
};

function bombard() {
    bombardStep(0);
};

function bombardStep(i) {

    if(i > 10) { return; }

    var polys = polyController.polys;

    var parab = randomParab(false);
    var x = parab.pos.x;
    var y = parab.pos.y;

    var inside = false;
    for(var j = 0; j < polys.length; j++)
    {
        if(polys[j].rPath.isPointInside(x,y))
        {
            inside = true;
            break;
        }
    }

    if(inside)
    {
        bombardStep(i+1);
    }
    else
    {
        //make a particle and advance
        var k = new KineticState(parab.pos,parab.vel,parab.accel);
        var particle = partController.makeParticle(k,parab.accel);
    }
    setTimeout(function() {
        bombardStep(i+1)
    },200);
};

function toggleDebug()
{
    debug = !debug;
    if(debug)
    {
        $j('#debugButton').text('Stop Debugging');
    }
    else
    {
        $j('#debugButton').text('Debug');
    }
};

function toggleImportExport()
{
    $j('#jsonTextArea').val("");
    if($j('#dialogWrapper').hasClass('showing'))
    {
        $j('#dialogWrapper').css('bottom','-200px');
        $j('#dialogWrapper').removeClass('showing');
    }
    else
    {
        $j('#dialogWrapper').css('bottom','100px');
        $j('#dialogWrapper').addClass('showing');
    }
};

function clearAll()
{
    polyController.reset();
    partController.clearAll();
}

function importGeometry()
{

    var width = $j(window).width();
    var height = $j(window).height();

    var scaler = Math.min(width,height);
    width = scaler;
    height = scaler;

    polyController.reset();
    partController.clearAll();

    var furthestWidthPoint = 0;
    var furthestHeightPoint = 0;

    //can't assume min as at zero
    var minX = Number.MAX_VALUE;
    var minY = Number.MAX_VALUE;

    var text = $j('#jsonTextArea').val();
    if(!text)
    {
        text = $j('#jsonTextArea').text();
    }
    
    var importData = null;
    try {
        var importData = JSON.parse(text);
    } catch(e) {
        topNotifyTemp("Error with the JSON you pasted in!");
        console.log(String(e));
        return;
    }

    //succeed so clear out
    toggleImportExport();

    var polys = importData.polys;
    var particles = importData.particles;

    //first do the loop once just to get the maxes
    for(var i = 0; i < polys.length; i++)
    {
        var polyData = polys[i];
        var vertices = polyData.vertices;

        for(var j = 0; j < vertices.length; j++)
        {
            var v = vertices[j];
            
            var vx = v.x * width;
            var vy = v.y * height;

            furthestWidthPoint = Math.max(vx,furthestWidthPoint);
            furthestHeightPoint = Math.max(vy,furthestHeightPoint);

            minX = Math.min(minX,vx);
            minY = Math.min(minY,vy);
        }
    }

    //now actually make them, but we need to offset by the deltas to center the parts in the canvas.
    //man raphael really needs support for stuff like this. originally i was moving the div but then
    //the click events TOTALLY got thrown off and it was a mess. I would make a patch but
    //i think it would need an entire transformation / camera system 

    var windowWidth = $j(window).width();
    var windowHeight = $j(window).height();

    var deltaX = windowWidth - (furthestWidthPoint - minX);
    var deltaY = windowHeight - (furthestHeightPoint - minY);

    for(var i = 0; i < polys.length; i++)
    {
        var polyData = polys[i];
        var color = polyData.fillColor;
        var vertices = polyData.vertices;

        var rPoints = [];
        for(var j = 0; j < vertices.length; j++)
        {
            var v = vertices[j];
            
            var vx = v.x * width + deltaX/2 - minX;
            var vy = v.y * height + deltaY/2 - minY;

            var rPoint = cuteSmallCircle(vx,vy);
            rPoints.push(rPoint);
        }

        var pathStr = constructPathStringFromPoints(rPoints,true);
        var path = cutePath(pathStr,true,'#FFF',color);
        polyController.makePolygon(rPoints,path);
    }

    return; //we don't import particles anymore
    for(var i = 0; i < particles.length; i++)
    {
        var kState = particles[i];
        var keys = ['pos','vel','accel'];
        var scaledState = {};

        for(var j = 0; j < keys.length; j++)
        {
            var k = keys[j];
            scaledState[k] = {};
            scaledState[k].x = kState[k].x * width;
            scaledState[k].y = kState[k].y * height;
        }

        var scaledState = new KineticState(scaledState.pos,
                                scaledState.vel,
                                scaledState.accel
        );

        var pos = scaledState.pos;
        var polys = polyController.polys;
        var inside = false;

        for(var j = 0; j < polys.length; j++)
        {
            if(polys[j].rPath.isPointInside(pos.x,pos.y))
            {
                inside = true;
                break;
            }
        }
        if(inside) { continue; }
    
        partController.makeParticle(scaledState,scaledState.accel);
    }
};

function exportGeometry()
{
    //we need to just get an array of all the polys
    var exportPolys = [];

    var width = $j(window).width();
    var height = $j(window).height();
    var scaler = Math.max(width,height);

    width = scaler;
    height = scaler;

    var minX = Number.MAX_VALUE;
    var minY = Number.MAX_VALUE;

    for(var i = 0; i < polyController.polys.length; i++)
    {
        var poly = polyController.polys[i];

        var color = poly.fillColor;
        var vertices = [];
        for(var j = 0; j < poly.vertices.length; j++)
        {
            var v = poly.vertices[j];

            var vx = v.x / width;
            var vy = v.y / height;

            minX = Math.min(minX,vx);
            minY = Math.min(minY,vy);
        }
    }

    for(var i = 0; i < polyController.polys.length; i++)
    {
        var poly = polyController.polys[i];

        var color = poly.fillColor;
        var vertices = [];
        for(var j = 0; j < poly.vertices.length; j++)
        {
            var v = poly.vertices[j];

            var vx = v.x / width - minX;
            var vy = v.y / height - minY;
     
            vertices.push(vecMake(vx,vy));
        }

        exportPolys.push({
            'fillColor':color,
            'vertices':vertices,
        });
    }

    var particles = [];
    for(var i = 0; i < partController.particles.length; i++)
    {
        var kState = partController.particles[i].startKineticState;

        var scaledState = {};
        var keys = ['pos','vel','accel'];
        for(var j = 0; j < keys.length; j++)
        {
            var k = keys[j];
            scaledState[k] = {};
            scaledState[k].x = kState[k].x / width;
            scaledState[k].y = kState[k].y / height;
        }

        particles.push(scaledState);
    }
    //particles = []; // turn off particle import / export for now

    var exportData = {
        'polys':exportPolys,
        'particles':particles
    };

    var exportString = JSON.stringify(exportData);
    console.log(exportString);
    $j('#jsonTextArea').val(exportString);
};

var s = [];

function testSampling() {
    s = [];
    for(var j = 0; j < polyController.polys.length; j++)
    {
        var poly = polyController.polys[j];

        var vToSample = null;
        for(var i = 0; i < poly.vertices.length; i++)
        {
            if(poly.vertices[i].isConcave)
            {
                vToSample = poly.vertices[i];
                sampler = new ConcaveVertexSampler(vToSample,globalAccel);
                sampler.sampleConnectivity();
                console.log(sampler);
                s.push(sampler);
            }
        }
    }
}
