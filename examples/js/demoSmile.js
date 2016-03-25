var video, canvas, context, outContext, orange, fruitBack,
        mouthDetector, smileDetector, eyeDetector, faceDetector,
        mouthRect, leftEyeRect, rightEyeRect,
        lastScore,
        lastTopLeft,
        neutralExpression,
        lastFiveScores = [],
        topScore = 0;

var orange = {
    'mouth': [1.5/10, 5.5/10, 7/10, 7/10],
    'leftEye': [0/10, 1.5/10, 4/10, 4/10],
    'rightEye': [5/10, 1.5/10, 4/10, 4/10],
    'mouthOut': [125, 430-87, 350, 220],
    'rightEyeOut': [270, 295-87, 150, 150],
    'leftEyeOut': [135, 295-87, 150, 150]
}

var fruit = orange;

window.addEventListener('DOMContentLoaded', function() {
    video = document.createElement('video'),
    outCanvas = document.getElementById('outCanvas'),
    outContext = outCanvas.getContext('2d'),
    fruitFront = document.getElementById('orange'),
    fruitBack = document.getElementById('orange_back'),
    mouthDetector = new objectdetect.detector(~~(25*1.5), ~~((15 + 6)*1.5), 1.05, objectdetect.mouth),
    smileDetector = new objectdetect.detector(~~(25*1.5), ~~((15 + 6)*1.5), 1.05, objectdetect.smile),

    eyeDetector = new objectdetect.detector(20*1.5, 20*1.5, 1.1, objectdetect.eye),
    faceDetector;
    
    outCanvas.width = 524;
    outCanvas.height = 593;
    
    // Capture the camera stream:
    try {
        compatibility.getUserMedia({video: true}, function(stream) {
            try {
                video.src = compatibility.URL.createObjectURL(stream);
            } catch (error) {
                video.src = stream;
            }
            compatibility.requestAnimationFrame(frame);
        }, function (error) {
            alert('WebRTC ist nicht verfügbar. Versuche es mit einem WebRTC-kompatiblen Browser wie Firefox, Chrome oder Opera auf PC oder Android.');
        });
    } catch (error) {
        alert(error);
    }
    
    document.getElementById('setBaseline').addEventListener('click', setNeutralExpression, false);
});

function inRect(rect, x, y, width, height) {
    var rx = rect[0], ry = rect[1], rwidth = rect[2], rheight = rect[3];
    return rx > 0 && rx < width && ry > 0 && ry < height && rx + rwidth < width &&  ry + rheight < height;
}

// Animation frame:
function frame() {
    compatibility.requestAnimationFrame(frame);
    if (video.paused) video.play();
    if (video.readyState !== video.HAVE_ENOUGH_DATA || !video.videoWidth) return;
    
    // Prepare the detector once the video dimensions are known:
    var width = ~~(60 * video.videoWidth / video.videoHeight);
    if (!faceDetector || faceDetector.canvas.width != width) {
        faceDetector = new objectdetect.detector(width, 60, 1.1, objectdetect.frontalface);
    }

    // Draw the fruit:
    outContext.globalCompositeOperation = "copy";
    outContext.drawImage(fruitBack, 0, 0, outCanvas.width, outCanvas.height);
    outContext.globalCompositeOperation = "source-over";
    outContext.globalCompositeOperation = "hard-light";

    // Perform the actual detection:
    var faceRects = faceDetector.detect(video, 1);
    if (faceRects[0]) {
        var faceRect = faceRects[0];
        
        // Rescale faceRectinates from detector to video faceRectinate space:
        faceRect[0] *= video.videoWidth / faceDetector.canvas.width;
        faceRect[1] *= video.videoHeight / faceDetector.canvas.height;
        faceRect[2] *= video.videoWidth / faceDetector.canvas.width;
        faceRect[3] *= video.videoHeight / faceDetector.canvas.height;
        
        // Mouth:
        var rectROI = [~~(faceRect[0] + faceRect[2] * fruit.mouth[0]), ~~(faceRect[1] + faceRect[3] * fruit.mouth[1]), ~~(faceRect[2] * fruit.mouth[2]), ~~(faceRect[2] * fruit.mouth[3] * mouthDetector.canvas.height / mouthDetector.canvas.width)];
        var mouthRects = inRect(rectROI, 0, 0, video.videoWidth, video.videoHeight) && mouthDetector.detect(video, 1, 1, rectROI);
        if (mouthRects[0]) {

            mouthRect = mouthRects[0];
            
            mouthRect[0] = rectROI[0] + mouthRect[0] * rectROI[2] / mouthDetector.canvas.width;
            mouthRect[1] = rectROI[1] + mouthRect[1] * rectROI[3] / mouthDetector.canvas.height;
            mouthRect[2] = mouthRect[2] * rectROI[2] / mouthDetector.canvas.width;
            mouthRect[3] = mouthRect[3] * rectROI[3] / mouthDetector.canvas.height;
        }
        
        // Eye Right:
        var rectROI = [~~(faceRect[0] + faceRect[2] * fruit.rightEye[0]), ~~(faceRect[1] + faceRect[3] * fruit.rightEye[1]), ~~(faceRect[2] * fruit.rightEye[2]), ~~(faceRect[2] * fruit.rightEye[3] * eyeDetector.canvas.height / eyeDetector.canvas.width)];
        var rightEyeRects = inRect(rectROI, 0, 0, video.videoWidth, video.videoHeight) && eyeDetector.detect(video, 1, 1, rectROI);
        if (rightEyeRects[0]) {
            rightEyeRect = rightEyeRects[0];
            
            rightEyeRect[0] = rectROI[0] + rightEyeRect[0] * rectROI[2] / eyeDetector.canvas.width;
            rightEyeRect[1] = rectROI[1] + rightEyeRect[1] * rectROI[3] / eyeDetector.canvas.height;
            rightEyeRect[2] = rightEyeRect[2] * rectROI[2] / eyeDetector.canvas.width;
            rightEyeRect[3] = rightEyeRect[3] * rectROI[3] / eyeDetector.canvas.height;
        }
        
        // Eye Left:
        var rectROI = [~~(faceRect[0] + faceRect[2] * fruit.leftEye[0]), ~~(faceRect[1] + faceRect[3] * fruit.leftEye[1]), ~~(faceRect[2] * fruit.leftEye[2]), ~~(faceRect[2] * fruit.leftEye[3] * eyeDetector.canvas.height / eyeDetector.canvas.width)];
        var leftEyeRects = inRect(rectROI, 0, 0, video.videoWidth, video.videoHeight) && eyeDetector.detect(video, 1, 1, rectROI);
        if (leftEyeRects[0]) {
            leftEyeRect = leftEyeRects[0];
            
            leftEyeRect[0] = rectROI[0] + leftEyeRect[0] * rectROI[2] / eyeDetector.canvas.width;
            leftEyeRect[1] = rectROI[1] + leftEyeRect[1] * rectROI[3] / eyeDetector.canvas.height;
            leftEyeRect[2] = leftEyeRect[2] * rectROI[2] / eyeDetector.canvas.width;
            leftEyeRect[3] = leftEyeRect[3] * rectROI[3] / eyeDetector.canvas.height;
        }
    }
    
    if (mouthRect) { // Draw mouth on video overlay:
            outContext.drawImage(video, mouthRect[0], mouthRect[1], mouthRect[2], mouthRect[3], fruit.mouthOut[0] , fruit.mouthOut[1], fruit.mouthOut[2], fruit.mouthOut[3]);
    }

    if (mouthRects && mouthRects[0]) {
        checkSmileScore(mouthRects);
    }
        
    if (rightEyeRect) // Draw rightEye on video overlay:
            outContext.drawImage(video, rightEyeRect[0], rightEyeRect[1], rightEyeRect[2], rightEyeRect[3], fruit.leftEyeOut[0], fruit.leftEyeOut[1], fruit.leftEyeOut[2], fruit.leftEyeOut[3]);
        
    if (leftEyeRect) // Draw leftEye on video overlay:
            outContext.drawImage(video, leftEyeRect[0], leftEyeRect[1], leftEyeRect[2], leftEyeRect[3], fruit.rightEyeOut[0], fruit.rightEyeOut[1], fruit.rightEyeOut[2], fruit.rightEyeOut[3]);
        
    outContext.globalCompositeOperation = "normal";
    outContext.globalCompositeOperation = "source-over";
    outContext.drawImage(fruitFront, 0, 0, outCanvas.width, outCanvas.height);
}

function checkSmileScore(mouthRects) {
    var smileData = smileDetector.findEdges(video, mouthRects[0], outContext);
    lastScore = smileData.totalEdgePoints;
    lastTopLeft = smileData.topLeft;

    if (neutralExpression) {
        var processedScoreX = (neutralExpression.x - lastTopLeft.x);
        var processedScoreY = (neutralExpression.y - lastTopLeft.y);
        var processedScore = processedScoreX + processedScoreY;
        
        lastFiveScores.push(processedScore);
        if (lastFiveScores.length > 10) {
            lastFiveScores.shift();
        }
        var averageScore = lastFiveScores.reduce(function (sum, score) {
            return sum + score;
        }, 0) / lastFiveScores.length;
        document.querySelector('#lastScore').innerHTML = 'Current score: ' + processedScore;        

        var message = 'You call that a smile? Come on - smile for the camera!';

        if (averageScore >= 15) {
            message = 'Awesome! Looking good:) Your smile score is ' + processedScore + '.';
            if (processedScore > topScore) {
                topScore = processedScore;
                var highScore = document.getElementById('highScore');
                highScore.textContent = 'Woot! New high score! ' + topScore;
                setTimeout(function() {
                  highScore.textContent = '';
                }, 2500);
            }
        } else if (averageScore < 0) {
            message = 'Aww you look sad :( Your smile score is ' + processedScore + '.';
        }

        message += ' Your highest score was ' + topScore;

        document.querySelector('#totalEdges').innerHTML = message;
    }
}

function setNeutralExpression() {
    console.log('setting neutral expression to ', lastScore);
    neutralExpression = lastTopLeft;
}