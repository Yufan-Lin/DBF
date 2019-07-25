function changeCamera() {

    if ((selectedIndex + 1) < optionValues.length) {

        videoSelect.value = optionValues[selectedIndex + 1];
        selectedIndex = selectedIndex + 1;

    } else {

        videoSelect.value = optionValues[0];
        selectedIndex = 0;

    }
    console.log("selectedIndex: " + selectedIndex);
    console.log("option: " + optionValues);
    onChange();
}

function screenShot() {

    this.animateCSS(document.querySelector('#camera-shot'), 'heartBeat');

    let aScene = document.querySelector("a-scene").components.screenshot.getCanvas("perspective");
    let frame = captureVideoFrame("video", "png");
    let mascot = {src: 'img/mascot.png', x: 0, y: frame.height / 3.5 };
    aScene = resizeCanvas(aScene, frame.width, frame.height);
    frame = frame.dataUri;
    mergeImages([frame, aScene, mascot]).then(b64 => {

        let link = document.getElementById("download-link", "png");
        link.setAttribute("download", "AR.png");
        // let uri = b64.replace(/^data:image\/[^;]/, 'data:application/octet-stream');
        link.setAttribute("href", b64);
        link.click();

    });
    
}

var selectedIndex = 1;
var videoSelect = document.querySelector("select#videoSource");
var selectors = [videoSelect];
var optionValues = [];
var isFinished = false;

function captureVideoFrame(video, format, width, height) {
    console.log('elm:' + video);
    if (typeof video === 'string') {
        video = document.querySelector(video);
        // console.log('Video:' + video);
    } else {
        video = document.querySelector(video);
        console.log('video:' + video);
    }

    format = format || 'jpeg';

    if (!video || (format !== 'png' && format !== 'jpeg')) {
        return false;
    }

    var canvas = document.createElement("CANVAS");
    canvas.width = width || video.videoWidth;
    canvas.height = height || video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    var dataUri = canvas.toDataURL('image/' + format);
    var data = dataUri.split(',')[1];
    var mimeType = dataUri.split(';')[0].slice(5)
    
    var bytes = window.atob(data);
    var buf = new ArrayBuffer(bytes.length);
    var arr = new Uint8Array(buf);

    for (var i = 0; i < bytes.length; i++) {
        arr[i] = bytes.charCodeAt(i);
    }

    var blob = new Blob([arr], { type: mimeType });
    return { blob: blob, dataUri: dataUri, format: format, width: canvas.width, height: canvas.height };
};

function loadImages(sources, callback) {
    var images = {};
    var loadedImages = 0;
    var numImages = 0;
    // get num of sources
    for (var src in sources) {
        numImages++;
    }
    for (var src in sources) {
        images[src] = new Image();
        images[src].onload = function () {
            if (++loadedImages >= numImages) {
                callback(images);
            }
        };
        images[src].src = sources[src];
    }
}

function gotDevices(deviceInfos) {
    // Handles being called several times to update labels. Preserve values.
    var values = selectors.map(function (select) {
        console.log('select:' + select);
        return select.value;
    });
    selectors.forEach(function (select) {
        while (select.firstChild) {
            select.removeChild(select.firstChild);
        }
    });
    
    for (var i = 0; i !== deviceInfos.length; ++i) {
        var deviceInfo = deviceInfos[i];
        var option = document.createElement("option");
        option.value = deviceInfo.deviceId;
        console.log(deviceInfo);
        if (deviceInfo.kind === "videoinput") {

            if (deviceInfo.deviceId === "") {
                return
            }

            option.text = deviceInfo.label || "camera " + (videoSelect.length + 1);
            videoSelect.appendChild(option);
            console.log('BBBBBB' + deviceInfo);
            if (isFinished == false) {
                console.log('Device Id: ' + deviceInfo.deviceId);
                optionValues.push(deviceInfo.deviceId);
                
            }
            
        }

        selectors.forEach(function (select, selectorIndex) {
            if (
                Array.prototype.slice.call(select.childNodes).some(function (n) {
                    return n.value === values[selectorIndex];
                })
            ) {
                select.value = values[selectorIndex];
            }
        });
    }

    if (optionValues.length > 1) {

        isFinished = true;
    }
    
}

function gotStream(stream) {
    console.log("Got Stream!");
    window.stream = stream;
    var video = document.querySelector('video');
    console.log("------------------video: " + video);
    video.srcObject = stream;
    // Refresh button list in case labels have become available
    return navigator.mediaDevices.enumerateDevices();
}

function start() {

    console.log("Start!");
    if (window.stream) {
        window.stream.getTracks().forEach(function (track) {
            track.stop();
        });
    }

    var videoSource = videoSelect.value;
    var constraints = {
        video: {
            deviceId: videoSource ? { exact: videoSource } : undefined
        }
    };

    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(gotStream)
        .then(gotDevices)
        .catch(handleError);

}

videoSelect.onchange = onChange;

function onChange() {
    start();
}

function handleError(error) {
    console.log("navigator.getUserMedia error: ", error.name);
}

function resizeCanvas(origCanvas, width, height) {
    let resizedCanvas = document.createElement("canvas");
    let resizedContext = resizedCanvas.getContext("2d");

    resizedCanvas.height = height;
    resizedCanvas.width = width;

    if (width > height) {
        // Landscape
        resizedContext.drawImage(origCanvas, 0, 0, width, height);
    } else {
        // Portrait
        var scale = height / width;
        var scaledHeight = origCanvas.width * scale;
        var scaledWidth = origCanvas.height * scale;
        var marginLeft = (origCanvas.width - scaledWidth) / 2;
        resizedContext.drawImage(origCanvas, marginLeft, 0, scaledWidth, scaledHeight);
    }

    return resizedCanvas.toDataURL();
}