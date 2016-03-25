window.onload = function() {
    
    var smoother = new Smoother([0.9999999, 0.9999999, 0.999, 0.999], [0, 0, 0, 0]),
        video = document.getElementById('video'),
        pain = document.getElementById('pain'),
        postureAlarm = document.getElementById('postureAlarm'),
        glasses = document.getElementById('glasses'),
        postureStatus = document.querySelector('#postureStatus'),
        goodPostureTimeEl = document.querySelector('#goodPostureTime'),
        THRESHOLD = 20,
        goodPostureStartTime = 0,
        shouldUpdateGoodPostureStartTime = false,
        goodPostureTotalTime = 0,
        startTime,
        detector,
        goodPostureY,
        goodPostureX,
        lastHeadTopY,
        lastHeadTopX;
            
    try {
        compatibility.getUserMedia({video: true}, function(stream) {
            try {
                video.src = compatibility.URL.createObjectURL(stream);
            } catch (error) {
                video.src = stream;
            }
            compatibility.requestAnimationFrame(play);
        }, function (error) {
            alert('WebRTC not available');
        });
    } catch (error) {
        alert(error);
    }
    
    function play() {
        compatibility.requestAnimationFrame(play);
        if (video.paused) {
            video.play();
        }
        
        if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
            
            // Prepare the detector once the video dimensions are known:
            if (!detector) {
                var width = ~~(60 * video.videoWidth / video.videoHeight);
                var height  =60;
                detector = new objectdetect.detector(width, height, 1.1, objectdetect.frontalface);
            }
            
            // Perform the actual detection:
            var coords = detector.detect(video, 1);
            if (coords[0]) {
                var coord = coords[0];
                coord = smoother.smooth(coord);

                // Rescale coordinates from detector to video coordinate space:
                coord[0] *= video.videoWidth / detector.canvas.width;
                coord[1] *= video.videoHeight / detector.canvas.height;
                coord[2] *= video.videoWidth / detector.canvas.width;
                coord[3] *= video.videoHeight / detector.canvas.height;

                lastHeadTopY = coord[1];
                checkPosture(coord);
                
            } else {
                var opacity = glasses.style.opacity - 0.2;
                glasses.style.opacity = opacity > 0 ? opacity : 0;
            }
        }
    }

    function checkPosture(coord) {
        if (goodPostureY) {
            if (Math.abs(coord[1] - goodPostureY) > THRESHOLD || Math.abs(coord[0] - goodPostureX) > THRESHOLD) {
                postureStatus.style.backgroundColor = 'red';
                postureStatus.innerText = 'Bad Posture!';
                shouldUpdateGoodPostureStartTime = true;
                
                superimposeImage(pain, coord);
                postureAlarm.play();
                glasses.style.display = 'none';
            } else {
                updateGoodPostureTimeCount();

                postureStatus.style.backgroundColor = 'green';
                postureAlarm.pause();
                postureStatus.innerText = 'Good Posture!';
                superimposeImage(glasses, coord);
                pain.style.display = 'none';
            }
        }
    }

    function updateGoodPostureTimeCount() {
        if (shouldUpdateGoodPostureStartTime) {
            shouldUpdateGoodPostureStartTime = false;
            goodPostureStartTime = new Date();
        }
        var curTime = new Date();
        goodPostureTotalTime += curTime - goodPostureStartTime;
        goodPostureStartTime = new Date();

        goodPostureTimeEl.innerHTML = 'Good posture total time: ' + (goodPostureTotalTime / 1000 / 60).toFixed(1) + ' minutes<br>' +
            'Total time: ' + ((curTime - startTime) / 1000 / 60).toFixed(1) + ' minutes';
    }

    function superimposeImage(imageEl, coord) {
        // Display glasses overlay: 
        imageEl.style.left    = ~~(coord[0] + coord[2] * 1.0/8 + video.offsetLeft) + 'px';
        imageEl.style.top     = ~~(coord[1] + coord[3] * 0.8/8 + video.offsetTop) + 'px';
        imageEl.style.width   = ~~(coord[2] * 6/8) + 'px';
        imageEl.style.height  = ~~(coord[3] * 6/8) + 'px';
        imageEl.style.opacity = 1;
        imageEl.style.display = 'block';
    }
    
    document.querySelector('#setGoodPosture').addEventListener('click', function (e) {
        goodPostureY = lastHeadTopY;
        goodPostureX = lastHeadTopX;
        startTime = new Date();
        goodPostureStartTime = new Date();
    });
};
