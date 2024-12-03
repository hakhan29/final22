const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const expressionDiv = document.getElementById('expression');

let currentTint = ''; // 현재 틴트를 저장할 변수

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.faceExpressionNet.loadFromUri('./models')
]).then(startVideo);

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => video.srcObject = stream)
        .catch(err => console.error(err));
}

video.addEventListener('play', () => {
    function renderFrame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // 이전 프레임 초기화
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height); // 비디오 그리기

        faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions()
            .then(detections => {
                if (detections.length > 0) {
                    const expressions = detections[0].expressions;
                    const highestExpression = Object.keys(expressions).reduce((a, b) =>
                        expressions[a] > expressions[b] ? a : b
                    );

                    // 감정별 색상 정의 (RGBA로 투명도 포함)
                    const emotionColors = {
                        anger: 'rgba(255, 0, 0, 0.2)',
                        happy: 'rgba(255, 255, 0, 0.2)',
                        sad: 'rgba(0, 0, 255, 0.2)',
                        neutral: 'rgba(128, 128, 128, 0.2)',
                        surprised: 'rgba(255, 165, 0, 0.2)',
                        fear: 'rgba(128, 0, 128, 0.2)',
                    };

                    const newTint = emotionColors[highestExpression] || 'rgba(255, 255, 255, 0)';

                    if (newTint !== currentTint) {
                        currentTint = newTint;
                    }

                    // 색상 틴트 덮어쓰기
                    ctx.fillStyle = currentTint;
                    ctx.fillRect(0, 0, canvas.width, canvas.height); // 투명한 틴트를 덧씌움

                    // 텍스트 업데이트 (페이드 효과)
                    if (expressionDiv.textContent !== `Detected Expression: ${highestExpression}`) {
                        expressionDiv.style.opacity = 0;
                        setTimeout(() => {
                            expressionDiv.textContent = `Detected Expression: ${highestExpression}`;
                            expressionDiv.style.opacity = 1;
                        }, 500);
                    }
                } else {
                    ctx.clearRect(0, 0, canvas.width, canvas.height); // 캔버스 초기화
                    currentTint = ''; // 틴트 초기화
                    if (expressionDiv.textContent !== 'No face detected') {
                        expressionDiv.style.opacity = 0;
                        setTimeout(() => {
                            expressionDiv.textContent = 'No face detected';
                            expressionDiv.style.opacity = 1;
                        }, 500);
                    }
                }
            });

        requestAnimationFrame(renderFrame); // 부드러운 프레임 갱신
    }

    renderFrame(); // 최초 호출
});
