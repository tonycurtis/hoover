var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var simulation_data = {}

console.log('Canvas = ' + canvas.width + ' x ' + canvas.height);

var min_x = null;
var min_y = null;
var max_x = null;
var max_y = null;

var curr_simulation_step = 1000000;

var label_colors = {};

//Helper function to get a random color - but not too dark
function GetRandomColor() {
    var r = 0, g = 0, b = 0;
    while (r < 100 && g < 100 && b < 100) {
        r = Math.floor(Math.random() * 256);
        g = Math.floor(Math.random() * 256);
        b = Math.floor(Math.random() * 256);
    }

    return "rgb(" + r + "," + g + ","  + b + ")";
}

function addLabel(label) {
    if (label in label_colors) {
        return;
    }
    label_colors[label] = GetRandomColor();
}

function getLabelColor(label) {
    return label_colors[label];
}

//Particle object with random starting position, velocity and color
var Particle = function (set_x, set_y, set_label) {
    this.x = set_x;
    this.y = set_y;
    this.Color = getLabelColor(set_label);
}

function readSingleFile(e) {
    var fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', function(e) {
        curr_simulation_step = 1000000;
        label_colors = {};
        min_x = null; max_x = null;
        min_y = null; max_y = null;
        simulation_data = {};

        var file = fileInput.files[0];

        var reader = new FileReader();
        reader.onload = function(e) {
            var contents = e.target.result;
            var lines = contents.split(',,');
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].split(',');
                var id = parseInt(line[0]);
                var nfeatures = parseInt(line[1]);
                var timestep = parseInt(line[2]);
                var pe = parseInt(line[3]);

                var features = {};
                for (var j = 0; j < nfeatures; j++) {
                    features[parseInt(line[4 + 2 * j])] =
                        parseFloat(line[4 + 2 * j + 1]);
                }

                // var label = pe; // Label by PE
                var label = features[2]; // Label by infection state

                addLabel(label);

                var x = features[0];
                var y = features[1];
                if (min_x === null || x < min_x) min_x = x;
                if (min_y === null || y < min_y) min_y = y;
                if (max_x === null || x > max_x) max_x = x;
                if (max_y === null || y > max_y) max_y = y;

                if (!(timestep in simulation_data)) {
                    simulation_data[timestep] = {};
                }
                simulation_data[timestep][id] = new Particle(x, y, label);

                if (timestep < curr_simulation_step) {
                    curr_simulation_step = timestep;
                }
            }

            console.log('min = (' + min_x + ', ' + min_y + ') max = (' +
                        max_x + ', ' + max_y + ')');
            console.log('labels = ' + JSON.stringify(label_colors));

            var curr_timestep = curr_simulation_step + 1;
            while (curr_timestep in simulation_data) {
                var particles = simulation_data[curr_timestep];
                var last_particles = simulation_data[curr_timestep - 1];
                for (var id in last_particles) {
                    if (!(id in particles)) {
                        particles[id] = last_particles[id];
                    }
                }
                curr_timestep += 1;
            }

            // curr_timestep = curr_simulation_step;
            // while (curr_timestep in simulation_data) {
            //     console.log('Loaded ' + Object.keys(simulation_data[curr_timestep]).length + ' actors for timestep ' + curr_timestep);
            //     curr_timestep += 1;
            // }

            loop();
        };
        reader.readAsText(file);
    });
}

//Ading two methods
Particle.prototype.Draw = function (ctx) {
    ctx.fillStyle = this.Color;

    var normalize_x = this.x - min_x;
    normalize_x = normalize_x / (max_x - min_x);
    normalize_x = normalize_x * canvas.width;

    var normalize_y = this.y - min_y;
    normalize_y = normalize_y / (max_y - min_y);
    normalize_y = normalize_y * canvas.height;

    ctx.fillRect(normalize_x, normalize_y, 2, 2);
}

function loop() {
    if (!(curr_simulation_step in simulation_data)) {
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var particle_data = simulation_data[curr_simulation_step];
    // console.log('Drawing time ' + curr_simulation_step + ' w/ ' + Object.keys(particle_data).length + ' particles.');
    for (var key in particle_data) {
        particle_data[key].Draw(ctx);
    }
    curr_simulation_step += 1;

    requestAnimationFrame(loop);
}

readSingleFile();