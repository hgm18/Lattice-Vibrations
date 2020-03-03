//---------------------------------//
// Visualisation Object            //
//---------------------------------//

window.Vis = window.Vis || {};

Vis.init = function() {
    Vis.isRunning = false;

    Vis.setup.initConsts();
    Vis.setup.initVars();

    Vis.setup.initDisplay();

    Vis.setup.initScene();

    Vis.setup.initSliders();

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
        Vis.t = (Date.now() - Vis._then) / 1000; // time since start in seconds

        Vis.core.update();
        Vis.core.animate();

        Vis.animationFrameLoop = window.requestAnimationFrame(Vis.core.frame);
    },

    update: function() {
        Vis.workers.calcParams();
        Vis.workers.calcPos();
        // Vis.workers.calcPhase();
    },

    animate: function() {
        for (let n=0; n<Vis.N; n++) {
            Vis.spheres[n].position.set(Vis.x[n], Vis.y[n], Vis.z[n]);
        }

        Vis.renderer.render(Vis.scene, Vis.camera);
        
    },

    updateSliders: function() {
        Vis.rxRange.value = Vis.rx;
        Vis.rxDisplay.textContent = Number(Vis.rx).toFixed(2);

        Vis.ryRange.value = Vis.ry;
        Vis.ryDisplay.textContent = Number(Vis.ry).toFixed(2);

        Vis.ryRange.value = Vis.rz;
        Vis.ryDisplay.textContent = Number(Vis.rz).toFixed(2);


        Vis.uxRange.value = Vis.ux;
        Vis.uxDisplay.textContent = Number(Vis.ux).toFixed(2);

        Vis.uyRange.value = Vis.uy;
        Vis.uyDisplay.textContent = Number(Vis.uy).toFixed(2);

        Vis.uyRange.value = Vis.uz;
        Vis.uyDisplay.textContent = Number(Vis.uz).toFixed(2);

        Vis.core.updateDisplay();
    },

    updateDisplay: function() {
        Vis.workers.calcParams();

        let ukvec = [Vis.ux, Vis.uy, Vis.uz];
        let kvec = [Vis.kx, Vis.ky, Vis.kz];

        let dotproduct = Math.round(100*Math.abs(math.dot(kvec, ukvec)))/100;
        Vis.dotDisplay.textContent = dotproduct.toString();

        let crossproduct = Math.round(Math.abs(100*Math.pow((Math.pow(math.cross(kvec, ukvec)[0], 2)
                                                           + Math.pow(math.cross(kvec, ukvec)[1], 2)
                                                           + Math.pow(math.cross(kvec, ukvec)[2], 2)), 0.5)))/100;
        Vis.crossDisplay.textContent = crossproduct.toString();
    }
}

Vis.workers = {
    calcParams: function() {
        Vis.k = Math.sqrt(Vis.kx**2 + Vis.ky**2 + Vis.kz**2);
        Vis.kx = Vis.rx * Math.PI / Vis.a;
        Vis.ky = Vis.ry * Math.PI / Vis.a;
        Vis.kz = Vis.rz * Math.PI / Vis.a;

        Vis.w = 2 * Vis.dw * Math.sqrt(Math.sin(Vis.kx * Vis.a / 2)**2 
                                     + Math.sin(Vis.ky * Vis.a / 2)**2
                                     + Math.sin(Vis.kz * Vis.a / 2)**2);

        Vis.dphase = 2*Math.PI/Vis.k; // update spacing of phase tracker 
    },

    calcPos: function() {
        for (let i=0; i < Vis.Nx; i++) {
            for (let j=0; j < Vis.Ny; j++) {
                for (let k=0; k < Vis.Nz; k++) {
                    let n = Vis.Ny*Vis.Nz*i + Vis.Nz*j + k;
                    let offset = Math.cos( Vis.kx*Vis.a*i
                                         + Vis.ky*Vis.a*j
                                         + Vis.kz*Vis.a*k - Vis.w*Vis.t);
    
                    Vis.x[n] = i*Vis.a + Vis.ux * offset;
                    Vis.y[n] = j*Vis.a + Vis.uy * offset;
                    Vis.z[n] = k*Vis.a + Vis.uz * offset;
                }
            }
        }
    },

    calcPhase: function() {
        let v = Vis.w / Vis.k;
        let vx = v * Vis.kx / Vis.k;
        let vy = v * Vis.ky / Vis.k;
        let vz = v * Vis.kz / Vis.k;

        let m = vy / vx;

        if (m >= -1 && m <= 1) {
            // do y processing
            let spacing = Vis.dphase * Vis.ky / Vis.k; // distance between phases 
            var t_space = spacing / vy;
        } else {
            // do x processing
            let spacing = Vis.dphase * Vis.kx / Vis.k;
            var t_space = spacing / vx;
        };

        let t = Vis.t % (Vis.Nx*t_space/2); // heuristic # of time spacings until wrap around 

        for (let i=0; i < Vis.Nphase; i++) {
            let T = t + (i - Vis.Nphase/2)*t_space; // shift each phase particle 

            if (m >= -1 && m <= 1) {
                // do x processing
                Vis.phasex[i] = T*vx;
                Vis.phasey[i] = (m)*(T*vx - Vis.Nx*Vis.a/2) + Vis.Ny*Vis.a/2;
            } else {
                // do y processing
                Vis.phasex[i] = (1/m)*(T*vy - Vis.Ny*Vis.a/2) + Vis.Nx*Vis.a/2;
                Vis.phasey[i] = T*vy;
            }

            
        }
    }
}

Vis.setup = {
    initConsts: function() {
        Vis.a = 1; // atomic spacing
        Vis.dw = 1; // debye wavelength

        Vis.Nx = 10; // # of atoms in x direction
        Vis.Ny = 10; // # of atoms in y direction
        Vis.Nz = 10; // # of atoms in z direction
        Vis.N = Vis.Nx * Vis.Ny * Vis.Nz;

        Vis.Nphase = 2*Vis.Nx;

        Vis.canvasx = 450;
        Vis.canvasy = 450;

        Vis.pointR = 0.10 * Vis.a;
    },

    initVars: function() {
        Vis._then = Date.now();

        Vis.rx = -0.06; // % of max x wavenumber, (-1, 1)
        Vis.ry = 0.07; // % of max y wavenumber, (-1, 1)
        Vis.rz = 0.12; // % of max z wavenumber, (-1, 1)

        Vis.ux = -0.24; // x amplitude
        Vis.uy = 0.37; // y amplitude
        Vis.uz = 0.10; // z amplitude

        Vis.x = new Array(Vis.N);
        Vis.y = new Array(Vis.N);
        Vis.z = new Array(Vis.N);
        Vis.spheres = new Array(Vis.N);

        Vis.phasex = new Array(Vis.Nphase);
        Vis.phasey = new Array(Vis.Nphase);
        Vis.phasez = new Array(Vis.Nphase);
    },

    initGraph: function() {
        Vis.canvas = d3.select('#canvas-div')
                       .append('canvas')
                        .attr('width', Vis.canvasx)
                        .attr('height', Vis.canvasy);
        Vis.context = Vis.canvas.node().getContext('2d');

        Vis.convertCanvasX = d3.scaleLinear()
                                .domain([0, Vis.Nx*Vis.a])
                                .range([0, Vis.canvasx]);
        Vis.convertCanvasY = d3.scaleLinear()
                                .domain([0, Vis.Ny*Vis.a])
                                .range([Vis.canvasy, 0]);
    },

    initScene: function() {
        Vis.scene = new THREE.Scene();
        Vis.scene.background = new THREE.Color( 0xffffff );
        
        Vis.camera = new THREE.PerspectiveCamera( 75, Vis.canvasx/Vis.canvasy, 0.1, 1000 );
        Vis.camera.position.set(-0.8, -0.6, -0.8);
        Vis.camera.lookAt(new THREE.Vector3(0,0,0));

        Vis.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            canvas: document.getElementById('canvas-div')
        });
        Vis.renderer.setSize(Vis.canvasx, Vis.canvasy);
        // document.getElementById('canvas-div').appendChild(Vis.renderer.domElement);

        for (let n=0; n<Vis.N; n++) {
            let geometry = new THREE.SphereBufferGeometry(Vis.pointR, 10, 10);
            let material = new THREE.MeshBasicMaterial( { color: 0xffa000 } );
            let sphere = new THREE.Mesh( geometry, material );
            Vis.spheres[n] = sphere;
            
            Vis.scene.add(sphere);
        }
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

    initSliders: function() {
        // r sliders
        Vis.rxRange = document.getElementById('rx');
        Vis.rxDisplay = document.getElementById('rx-display');

        Vis.rxRange.addEventListener('input', function() {
            Vis.rx = Vis.rxRange.value;
            Vis.rxDisplay.textContent = Vis.rx;

            Vis.core.updateDisplay();
        });

        Vis.ryRange = document.getElementById('ry');
        Vis.ryDisplay = document.getElementById('ry-display');

        Vis.ryRange.addEventListener('input', function() {
            Vis.ry = Vis.ryRange.value;
            Vis.ryDisplay.textContent = Vis.ry;

            Vis.core.updateDisplay();
        });

        Vis.rzRange = document.getElementById('rz');
        Vis.rzDisplay = document.getElementById('rz-display');

        Vis.rzRange.addEventListener('input', function() {
            Vis.rz = Vis.rzRange.value;
            Vis.rzDisplay.textContent = Vis.rz;

            Vis.core.updateDisplay();
        });

        // u sliders
        Vis.uxRange = document.getElementById('ukx');
        Vis.uxDisplay = document.getElementById('ukx-display');

        Vis.uxRange.addEventListener('input', function() {
            Vis.ux = Vis.uxRange.value;
            Vis.uxDisplay.textContent = Vis.ux;

            Vis.core.updateDisplay();
        });

        Vis.uyRange = document.getElementById('uky');
        Vis.uyDisplay = document.getElementById('uky-display');

        Vis.uyRange.addEventListener('input', function() {
            Vis.uy = Vis.uyRange.value;
            Vis.uyDisplay.textContent = Vis.uy;

            Vis.core.updateDisplay();
        });

        Vis.uzRange = document.getElementById('ukz');
        Vis.uzDisplay = document.getElementById('ukz-display');

        Vis.uzRange.addEventListener('input', function() {
            Vis.uz = Vis.uzRange.value;
            Vis.uzDisplay.textContent = Vis.uz;

            Vis.core.updateDisplay();
        });

        Vis.core.updateSliders();
    },

    initDisplay: function() {
        Vis.dotDisplay = document.getElementById("dotproduct");
        Vis.crossDisplay = document.getElementById("crossproduct");
    }
}

document.addEventListener('DOMContentLoaded', Vis.init);