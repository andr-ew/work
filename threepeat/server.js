// Adapted from this _WikiBooks OpenGL Programming Video Capture article_.
// re-adapted from http://fhtr.blogspot.com/2014/02/saving-out-video-frames-from-webgl-app.html by @andr-ew

var port = 3999;
var http = require('http');
var fs = require('fs');
const cp = require('child_process');

var child;

var spawnff = function(name) {
    var child = cp.spawn('ffmpeg', [ '-f', 'image2pipe', '-framerate', '60', '-i', '-', '-c:v', 'libx264', '-vf', 'format=yuv420p', '-r', '60',
        '-movflags', '+faststart', '../' + name + '.mp4' ]);

    child.stdin.on('close', (code) => {
        console.log('child.stdin close: ' + code)
    });
    child.stdin.on('spawn', (code) => {
        console.log('child.stdin spawn: ' + code)
    });
    child.stdin.on('exit', (code) => {
        console.log('child.stdin exit: ' + code)
    });
    child.stdin.on('error', (e) => {
        console.log('child.stdin error: ' + e.message)
    });

    child.stderr.on('data', (data) => {
      console.error(`ffmpeg stderr: ${data}`);
    });

    child.stdout.on('data', function(chunk) {
        cnonsole.log("ffmpeg:")
        console.log(chunk);
    });
    child.stdout.on('error', (e) => {
        console.log('child.stdout error: ' + e.message)
    });

    return child;
}


http.createServer(function (req, res) {
    res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With'
    });
    if (req.method === 'OPTIONS') {
        // Handle OPTIONS requests to work with JQuery and other libs that cause preflighted CORS requests.
        res.end();
        return;
    }
    var idx = req.url.split('/').pop();
    var img = Buffer.from('');
    req.on('data', function(chunk) {
        if(idx != 'end' && child == null) {
            console.log('start ffmpeg');

            child = spawnff(idx);
        }

        img = Buffer.concat([img, chunk]);
    });
    req.on('end', function() {
        child.stdin.write(img);

        if(idx == 'end') {
            console.log('End Frame');

            child.stdin.end();
        }

        res.end();
    });
}).listen(port, '127.0.0.1');
console.log('Server running at http://127.0.0.1:'+port+'/');
