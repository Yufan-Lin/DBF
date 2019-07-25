window.onload = () => {

    loadQuizData();

    // resetGame();

    setupMarker('#marker_1', 0);
    setupMarker('#marker_2', 1);
    setupMarker('#marker_3', 2);

    refreshGameProcessUI();
    checkGameProcess();

    navigator.mediaDevices
    .enumerateDevices()
    .then(gotDevices)
    .catch(handleError);

    document.addEventListener('touchstart', (event) => {
        if (event.touches.length > 1) {
           event.preventDefault();
        }
      }, { passive: false });
      
      let lastTouchEnd = 0;
      document.addEventListener('touchend', (event) => {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
          event.preventDefault();
        }
        lastTouchEnd = now;
      }, false);

    showAlertView();

    var input = document.querySelector('input');
    input.value = document.URL;

    var scene = document.querySelector('a-scene');
    bodyScrollLock.disableBodyScroll(scene);
}



let GAME_PROCESS_KEY = "GAME_PROCESS_KEY";

var quizs, currentQuiz, quizAnswer;

var hasSummoned = false; // 是否有招喚吉祥物

var isStarted = false; // 是否可以掃描道題目


function closeQuizCard() {
    let card = document.querySelector('#quiz-card');
    card.classList.add('hidden');

    var hint = document.querySelector('#hint-text');
    hint.classList.add('hidden');

    resetRadioBox();
}

function showQuizCard(quizId) {

    currentQuiz = quizs[quizId];
    quizAnswer = quizs[quizId].ans;

    if (currentQuiz != null && quizAnswer != null) {

        let card = document.querySelector('#quiz-card');
        card.classList.remove('hidden');
    
        setQuiz();

    }
}

function showQuestionClearNote() {

    var note = document.querySelector('#question-clear-note');

    note.classList.remove('hidden')

    setTimeout(() => {
            
        hideQuesetionClearNote();

    }, 3000);
}

function hideQuesetionClearNote() {

    var note = document.querySelector('#question-clear-note');

    animateCSS(note, 'fadeOut', () => {

        note.classList.add('hidden');
    });
}

function loadQuizData() {
    fetch('data/quiz.json', {}).then((response) => {
        return response.json();
    }).then((jsonData) => {
        quizs = jsonData;
    });
}

function setQuiz() {
    var p = document.querySelector('#quiz-question');
    var a1 = document.querySelector('#option-answer_1');
    var a2 = document.querySelector('#option-answer_2');
    var a3 = document.querySelector('#option-answer_3');
    var a4 = document.querySelector('#option-answer_4');

    p.innerText = currentQuiz.question;
    a1.innerText = currentQuiz.options[0].item;
    a2.innerText = currentQuiz.options[1].item;
    a3.innerText = currentQuiz.options[2].item;
    a4.innerText = currentQuiz.options[3].item;
}

function answerQuestion() {

    var radios = document.getElementsByName('answer');

    for (var index in radios) {

        if (radios[index].checked) {

            var answerValue = radios[index].value;

            // 答對
            if (quizAnswer == answerValue) {

                closeQuizCard();

                showQuestionClearNote();

                gameSetting(currentQuiz.id);

                refreshGameProcessUI();

                checkGameProcess();
            } else {
                // 答錯
                var hint = document.querySelector('#hint-text');
                hint.innerText = "答錯囉！請你再選擇一次！";
                hint.classList.remove('hidden');
                shaking(hint);
            }
        }
    }
}

function resetRadioBox() {

    var radios = document.getElementsByName('answer');

    for (var i in radios) {

        let elm = radios[i];
        elm.checked = false;
    }
}

function checkGameProcess() {

    if (typeof(Storage) !== "undefined") {

        var pcs = JSON.parse(localStorage.getItem(GAME_PROCESS_KEY));

        if (pcs !== null) {

            var points = pcs.length

            var summonElm = document.querySelector('summon-mascot');
            var cameraElm = document.querySelector('camera-shot');
            var changeCameraElm = document.querySelector('camera-change');
            console.log('point:' + points);
            // 蒐集到三點，即過關
            if (points == 3) {

                var points = document.querySelectorAll('.point');

                animateCSS(points[0], 'bounce');
                animateCSS(points[1], 'bounce');
                animateCSS(points[2], 'bounce');
    
                var mascotElmBtn = document.querySelector('#summon-mascot');
                mascotElmBtn.classList.remove('hidden');
            }
        }
    }
}

function resetGame() {
    localStorage.removeItem(GAME_PROCESS_KEY);
}

function gameSetting(questionId) {

    if (typeof(Storage) !== "undefined") {

        var pcs = JSON.parse(localStorage.getItem(GAME_PROCESS_KEY));

        if (pcs != null) {

            if (pcs.includes(questionId) == false) {

                pcs.push(questionId);
    
                localStorage.setItem(GAME_PROCESS_KEY, JSON.stringify(pcs));
            }

        } else {

            var answer = [questionId];

            localStorage.setItem(GAME_PROCESS_KEY, JSON.stringify(answer));
        }
    }
}

function refreshGameProcessUI() {

    if (typeof(Storage) !== "undefined") {

        var pcs = JSON.parse(localStorage.getItem(GAME_PROCESS_KEY));

        var points = pcs === null ? 0 : pcs.length;

        var pointElms = document.querySelectorAll('.point');

        for (var index in pointElms) {

            if (pointElms.hasOwnProperty(index)) {

                var pointElm = pointElms[index];
    
                pointElm.classList.remove('point-got');
                pointElm.classList.remove('point-empty');
    
                if (index < points) {
    
                    pointElm.classList.add('point-got');
                    
                    if (index == (points - 1)) {

                        var pointToBeAnimated = document.querySelectorAll('.point-got');

                        animateCSS(pointToBeAnimated[pointToBeAnimated.length - 1], 'bounceIn');
                    }
    
                } else {
    
                    pointElm.classList.add('point-empty');
                }
            }
        }
    }
}

function summonMascot() {

    var screenShotBtn = document.querySelector('#camera-shot');
    screenShotBtn.classList.remove('hidden');

    var changeCameraBtn = document.querySelector('#camera-change');
    changeCameraBtn.classList.remove('hidden');

    var mascotElmBtn = document.querySelector('#summon-mascot');
    mascotElmBtn.classList.add('hidden');

    var mascotElm = document.querySelector('#mascot');
    mascotElm.classList.remove('hidden');

    animateCSS(mascotElm, 'jackInTheBox');

    hasSummoned = true;
}

// Marker Manipulation

function setupMarker(markerSelector, quizId) {
    var marker = document.querySelector(markerSelector);

    marker.addEventListener("markerFound", (e) => {

        // 無招喚才會顯示問題卡
        if (hasSummoned || !isStarted) { return }

        showQuizCard(quizId);
    });
}

// Alert

function showAlertView() {
    setTimeout(() => {
        var alert = document.querySelector('#alert-popover');
        alert.style.display = 'inline-block';
    }, 1000);
}

function hideAlertView() {
    var alert = document.querySelector('#alert-popover');
    alert.style.display = 'none';
    isStarted = true;
}

// Animation

function doAnimation(elm, animation) {
    elm.classList.add(animation);
    setTimeout(() => {
        elm.classList.remove(animation);
    }, 1000);
}

function animateCSS(element, animationName, callback) {
    const node = element
    node.classList.add('animated', animationName)

    function handleAnimationEnd() {
        node.classList.remove('animated', animationName)
        node.removeEventListener('animationend', handleAnimationEnd)

        if (typeof callback === 'function') callback()
    }

    node.addEventListener('animationend', handleAnimationEnd)
}

function shaking(elm) {
    doAnimation(elm, 'shaking')
}

function copyLink() {
    var input = document.querySelector('input');
        input.value = document.URL;

    if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
        // for ios
    
        var oldContentEditable = input.contentEditable
        var oldReadOnly = input.readOnly;
    
        input.contentEditable = true;
        input.readOnly = false;
    
        var range = document.createRange();
        range.selectNodeContents(input);
    
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    
        input.setSelectionRange(0, 999999);
    
        input.contentEditable = oldContentEditable
        input.readOnly = oldReadOnly;

    } else {
        // for other os

        input.select();

    }

    document.execCommand('copy');

    input.blur();

    var copyButton = document.querySelector('#button-copy-link');
    copyButton.className = "btn btn-success";
    copyButton.textContent = "已複製";
}