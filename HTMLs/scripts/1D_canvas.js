//---------------------------------//
// Visualisation Object            //
//---------------------------------//

window.Vis = window.Vis || {};

Vis.init = function() {
    Vis.isRunning = false;

    Vis.setup.initConsts();
    Vis.setup.initVars();

    Circle.init(); // init circle

    Vis.setup.initGraph();
    //Vis.setup.initButton();
    Vis.setup.initSlider();

    Vis.start();
};

Vis.start = function() {
    if (Vis._stoptime) {
        Vis._then += Date.now() - Vis._stoptime; // add stopped time
    };

    if (!Vis.isRunning) {
        Vis.core.frame();
        Vis.isRunning = true;
    };
};

Vis.stop = function() {
    window.cancelAnimationFrame(Vis.animationFrameLoop);
    Vis.isRunning = false;
    Vis._stoptime = Date.now(); // record when animation paused
}

Vis.core = {
    frame: function() {
        Vis.t = (Date.now() - Vis._then) / 250; // time since start in seconds

        Vis.core.update();
        Vis.core.animate();

        Vis.animationFrameLoop = window.requestAnimationFrame(Vis.core.frame);
    },

    update: function() {
        Vis.workers.calcParams();
        Vis.workers.calcPos();
    },

    animate: function() {
        Vis.context.clearRect(0, 0, Vis.canvasx, Vis.canvasy);
        
        Vis.context.fillStyle = 'orange';
        for (let i=0; i < Vis.N; i++) {
            Vis.context.beginPath();
            Vis.context.arc(Vis.convertCanvasX(Vis.x[i]), Vis.convertCanvasY(Vis.y[i])
                                , Vis.convertCanvasX(Vis.pointR), 0, 2*Math.PI);
            Vis.context.fill();
        }
        
        // pick the middle particle to track with a black dot 
        Vis.context.fillStyle = 'black';
        Vis.context.beginPath();
        Vis.context.arc(Vis.convertCanvasX(Vis.x[Math.round(Vis.N/2)])
                            , Vis.convertCanvasY(Vis.y[Math.round(Vis.N/2)])
                            , Vis.convertCanvasX(Vis.pointR*1.03), 0, 2*Math.PI);
        Vis.context.fill();

    },

    updateSliders: function() {
        Vis.rRange.value = Vis.r;
        Vis.rDisplay.textContent = Number(Vis.r).toFixed(2);
        Vis.rBox.value = Number(Vis.r).toFixed(2);

        Vis.uRange.value = Vis.u;
        Vis.uDisplay.textContent = Number(Vis.u).toFixed(2);


    },
};

Vis.workers = {
    calcParams: function() {
        Vis.k = Vis.r * Math.PI / Vis.a;
        Vis.w = Math.sqrt(4*Vis.dw*(Math.pow(Math.sin(Vis.k*Vis.a/2), 2)));
    },

    calcPos: function() {
        for (let i=0; i < Vis.N; i++) {
                let offset = Math.cos(Vis.k*Vis.a*i - Vis.w*Vis.t);

                Vis.x[i] = i*Vis.a + Vis.u * offset;
                Vis.y[i] = Vis.N*Vis.a/2;
        }
    },
}

Vis.setup = {
    initConsts: function() {
        Vis.a = 1; // atomic spacing
        Vis.dw = 1; // debye wavelength

        Vis.N = 20; // # of atoms in x direction


        Vis.canvasx = 450;
        Vis.canvasy = 450;

        Vis.pointR = 0.20 * Vis.a;
    },

    initVars: function() {
        Vis._then = Date.now();

        Vis.r = 0.10; // % of max x wavenumber, (-1, 1)

        Vis.u = -0.50; // x amplitude

        Vis.x = new Array(Vis.N);
        Vis.y = new Array(Vis.N);

    },

    initGraph: function() {
        Vis.canvas = d3.select('#canvas-div')
                       .append('canvas')
                        .attr('width', Vis.canvasx)
                        .attr('height', Vis.canvasy);
        Vis.context = Vis.canvas.node().getContext('2d');

        Vis.convertCanvasX = d3.scaleLinear()
                                .domain([0, Vis.N*Vis.a])
                                .range([0, Vis.canvasx]);
        Vis.convertCanvasY = d3.scaleLinear()
                                .domain([0, Vis.N*Vis.a])
                                .range([Vis.canvasy, 0]);
    },

    initButton: function() {
        Vis.button = document.getElementById('start-stop');

        Vis.button.addEventListener('click', function() {
            if (Vis.isRunning) {
                Vis.stop();
            } else {
                Vis.start();
            };
        });
    },

    initSlider: function() {
        // r sliders
        Vis.rRange = document.getElementById('r-range');
        Vis.rDisplay = document.getElementById('r-display');
        Vis.rBox = document.getElementById('r-box');

        Vis.rRange.addEventListener('input', function() {
            Vis.r = Vis.rRange.value;
            Vis.rDisplay.textContent = Vis.r;
            Vis.rBox.value = Vis.r;

            Circle.rCircle.x = parseFloat(0.8*Math.sin(Vis.r*Math.PI));
            Circle.core.draw();

            Circle.rCircle.y = parseFloat(0.8*Math.cos(Vis.r*Math.PI));
            Circle.core.draw();

        });

        Vis.rBox.addEventListener('input', function() {
            Vis.r = Vis.rBox.value;
            Vis.rDisplay.textContent = Vis.r;
            Vis.rBox.textContent = Vis.r;

            Circle.rCircle.x = parseFloat(0.8*Math.sin(Vis.r*Math.PI));
            Circle.core.draw();

            Circle.rCircle.y = parseFloat(0.8*Math.cos(Vis.r*Math.PI));
            Circle.core.draw();

        });

        // u sliders
        Vis.uRange = document.getElementById('uk-range');
        Vis.uDisplay = document.getElementById('uk-display');

        Vis.uRange.addEventListener('input', function() {
            Vis.u = Vis.uRange.value;
            Vis.uDisplay.textContent = Vis.u;

        });

        Vis.core.updateSliders();
    },

};

window.Circle = window.Circle || {};

Circle.init = function() {
    Circle.setup.initConst();
    Circle.setup.initObjects();

};

Circle.core = {
    draw: function() {
        Circle.core.drawCircle(Circle.rCircle);
    },

    drawCircle: function(circle) {
        Circle.helpers.updateCircle(circle);
    }
}

Circle.helpers = {
    updateCircle: function(circle) {
        let tipx = (circle.x + 1)*Circle.width/2;
        let tipy = (1 - circle.y)*Circle.height/2;

        circle.body.attr('x2', tipx)
                  .attr('y2', tipy);
        circle.tip.attr('cx', tipx)
                 .attr('cy', tipy);

        circle.text.attr('x', tipx + 5)
                    .attr('y', tipy - 5)
                    .text(circle.stext + ' =' + Number(Vis.r%2).toFixed(2));
    },

    convertCoords: function(sx, sy) {
        x = 2*sx/Circle.width - 1;
        y = 1 - 2*sy/Circle.height;
        return [x, y]
    },

    updateAPP: function() {
        Vis.r = 2*Math.atan2(Circle.rCircle.y/Circle.rCircle.x);

    }
}

Circle.setup = {
    initConst: function() {
        Circle.width = window.innerHeight*0.35;
        Circle.height = window.innerHeight*0.35;

        Circle.strokeWidth = 2;
        Circle.tipRadius = 5;
    },

    initObjects: function() {
        Circle.svg = d3.select('#interactive-Circle');
        Circle.svg.attr('width', Circle.width)
                 .attr('height', Circle.height)
                 .attr('style', 'border: 10px grey');

        Circle.rCircle = {
            x: 0.8*Math.sin(Vis.r*Math.PI),
            y: 0.8*Math.cos(Vis.r*Math.PI),
            stext: 'r'
        };

        Circle.setup.initCircle(Circle.rCircle);
    },

    initCircle: function(circle) {
        circle.container = Circle.setup.createCircleContainer();
        circle.body = Circle.setup.createCircleBody(circle);
        circle.tip = Circle.setup.createCircleTip(circle);
        circle.text = Circle.setup.createCircleText(circle);
        Circle.helpers.updateCircle(circle);
    },

    createCircleContainer: function() {
        return Circle.svg.append('svg')
                        .attr('width', Circle.width)
                        .attr('height', Circle.height)
    },

    createCircleBody: function(circle) {
        return circle.container.append('line')
                                  .attr('x1', Circle.width/2).attr('y1', Circle.width/2)
                                  .attr('stroke-width', Circle.strokeWidth)
                                  .attr('stroke', 'black');
    },

    createCircleTip: function(circle) {
        return circle.container.append('circle')
                              .attr('r', Circle.tipRadius);
    },

    createCircleText: function(circle) {
        return circle.container.append('text');
    }
};

document.addEventListener('DOMContentLoaded', Vis.init);