angular.module('myApp')
  .controller('Ctrl',
      ['$scope', '$log', '$timeout',
       'gameService', 'gameLogic',
       'resizeGameAreaService', '$translate', 'dragAndDropService',
      function ($scope, $log, $timeout,
        gameService, gameLogic,
        resizeGameAreaService, $translate, dragAndDropService) {
    'use strict';

    $log.info($translate('RULES_OF_CHEAT')); // Example of using $translate

    // TODO: choose your width-to-height ratio (1 means the board is square).
    resizeGameAreaService.setWidthToHeight(1.7);

    var canMakeMove = false;
    var state = null;
    var turnIndex = null;
    // Get the stage objects for convenience
    var STAGE = gameLogic.STAGE;
    var draggingCard;
     // Return true if the card (index) is selected
    $scope.isSelected = function(card) {
      return $scope.middle.indexOf(card) !== -1;
    };

    // Return true if at least one card is selected
    $scope.hasSelectedCards = function() {
      // The cards in the middle area is more than the cards in the state's
      // original middle area
      return $scope.middle.length > $scope.state.middle.length;
    };

    // Return true if the card can be dragged/selected...
    $scope.canDrag = function (card) {
      if ($scope.isYourTurn && $scope.state.stage === STAGE.DO_CLAIM && $scope.state["card" + card] != null) {
        if ($scope.middle.indexOf(card) !== -1) {
          return true;
        } else if ($scope.middle.length - $scope.state.middle.length < 4) {
          return true;
        }
      }

      return false;
    };
    /*
    // Store the card for later use during drag and drop
    $scope.storeDraggingCard = function (card) {
      $scope.draggingCard = parseInt(card);
    };
    */
    // Select a card
    $scope.selectCard = function(card) {
      if ($scope.isYourTurn && $scope.state.stage === STAGE.DO_CLAIM) {
        if ($scope.playMode === 'passAndPlay' && $scope.currIndex == 1) {
          if ($scope.middle.indexOf(card) !== -1) {
            $scope.middle.splice($scope.middle.indexOf(card), 1);
            $scope.playerTwoCards.push(card);
          } else if ($scope.middle.length - $scope.state.middle.length < 4) {
            // Only select at most 4 cards!
            if ($scope.playerTwoCards.indexOf(card) !== -1) {
              $scope.playerTwoCards.splice($scope.playerTwoCards.indexOf(card), 1);
              $scope.middle.push(card);
            }
          }
        } else {
          // Must select in the player's turn
          if ($scope.middle.indexOf(card) !== -1) {
            // The card is already selected, hence cancel the selection
            // First delete the card in the middle area, then add it back
            // to the player one area
            $scope.middle.splice($scope.middle.indexOf(card), 1);
            $scope.playerOneCards.push(card);
          } else if ($scope.middle.length - $scope.state.middle.length < 4) {
            // Only select at most 4 cards!
            if ($scope.playerOneCards.indexOf(card) !== -1) {
              // Select the card.
              // First delete it from player one area, then add it to the
              // middle area
              $scope.playerOneCards.splice($scope.playerOneCards.indexOf(card), 1);
              $scope.middle.push(card);
            }
          }
        }
      }

      sortRanks();

      // In case the board is not updated
      if (!$scope.$$phase) {
        $scope.$apply();
      }

    };

    // Check the current stage
    $scope.checkStage = function(stage) {
      if (angular.isUndefined($scope.state)) {
        return false;
      }
      return $scope.state.stage === stage;
    };

    // Make a claim
    $scope.claim = function(rank) {
      //console.log('la');
      $scope.isClaimModalShown = false;
      var claim = [$scope.middle.length - $scope.state.middle.length, rank];
      var diffM = $scope.middle.clone();
      diffM.selfSubtract($scope.state.middle);
      var operations = gameLogic.getClaimMove($scope.state, $scope.currIndex, claim, diffM);
      gameService.makeMove(operations)
    };

    // Declare a cheater or pass
    $scope.declare = function (declareCheater) {
      $scope.isDeclareModalShown = false;
      var operations = gameLogic.getDeclareCheaterMove($scope.state, $scope.currIndex, declareCheater);
      gameService.makeMove(operations)
    };

    // Get the card data value for css usage
    $scope.getImageSrc = function(i) {
      if ($scope.state['card' + i] !== null) {
        var card = $scope.state['card' + i];
        var suit = card.substring(0, 1);
        var rank = card.substring(1);
      }
      switch(suit){
        case 'D': 
          suit = 'diamonds';
          break;
        case 'H':
          suit = 'hearts';
          break;
        case 'S':
          suit = 'spades';
          break;
        case 'C':
          suit = 'clubs';
          break;
        default:
          suit = '';
      }
      if (suit === ''){
        return 'imgs/cards/PNG-cards-1.3/back.jpg';
      }else{
        return 'imgs/cards/PNG-cards-1.3/'+rank+'_of_'+suit+'.jpg';
      }
    };

    // Sort the cards according to the ranks
    function sortRanks() {
      var sortFunction = function(cardA, cardB) {
        if ($scope.state["card" + cardA] !== null) {
          // Only sort the cards while they are not hidden
          var rankA = $scope.state["card" + cardA].substring(1);
          var rankB = $scope.state["card" + cardB].substring(1);
          var scoreA = gameLogic.getRankScore(rankA);
          var scoreB = gameLogic.getRankScore(rankB);
          return scoreA - scoreB;
        }
        return 1;
      };
      $scope.playerOneCards.sort(sortFunction);
      $scope.playerTwoCards.sort(sortFunction);
    }

    // Update the ranks for claiming
    function updateClaimRanks () {
      if (angular.isUndefined($scope.state.claim)) {
        $scope.claimRanks = gameLogic.getRankArray();
      } else {
        var rank = $scope.state.claim[1];
        $scope.claimRanks = gameLogic.getRankArray(rank);
      }
    }


    // Check the declaration
    function checkDeclaration() {
      var operations = gameLogic.getMoveCheckIfCheated($scope.state, $scope.currIndex);
      gameService.makeMove(operations);
    }

    // Check if there's a winner
    function hasWinner() {
      return gameLogic.getWinner($scope.state) !== -1;
    }

    // Check if the game ends, and if so, send the end game operations
    function checkEndGame() {
      if (hasWinner() && $scope.stage === STAGE.DO_CLAIM) {
        // Only send end game operations in DO_CLAIM stage
        var operation = gameLogic.getWinMove($scope.state);
        gameService.makeMove(operation);
      }
    }

    // Send computer move
    function sendComputerMove() {
      var operations = gameLogic.createComputerMove($scope.state, $scope.currIndex);
      if ($scope.currIndex === 1) {
        gameService.makeMove(operations);
      }
    }

     /**
     * This method update the game's UI.
     */
    function updateUI(params) {
      // If the state is empty, first initialize the board...
      if (gameLogic.isEmptyObj(params.stateAfterMove)) {
        if (params.yourPlayerIndex === 0) {
          gameService.makeMove(gameLogic.getInitialMove());
        }
        return;
      }

      // Get the new state
      $scope.state = params.stateAfterMove;
      // Get the current player index (For creating computer move...)
      $scope.currIndex = params.turnIndexAfterMove;
      $scope.isYourTurn = params.turnIndexAfterMove >= 0 && // game is ongoing
          params.yourPlayerIndex === params.turnIndexAfterMove; // it's my turn
      $scope.isAiMode = $scope.isYourTurn
          && params.playersInfo[params.yourPlayerIndex].playerId === '';
      $scope.playMode = params.playMode;

      // Get the cards for player one area, player two area and middle area
      $scope.middle = $scope.state.middle.clone();
      if (params.playMode === 'playAgainstTheComputer' || params.playMode === 'passAndPlay') {
        // If the game is played in the same device, use the default setting
        $scope.playerOneCards = $scope.state.white.clone();
        $scope.playerTwoCards = $scope.state.black.clone();
      } else {
        // Otherwise, player one area holds the cards for the player self
        if (params.yourPlayerIndex === 0) {
          $scope.playerOneCards =  $scope.state.white.clone();
          $scope.playerTwoCards = $scope.state.black.clone();
        } else {
          $scope.playerOneCards =  $scope.state.black.clone();
          $scope.playerTwoCards = $scope.state.white.clone();
        }
      }

      sortRanks();

      // In case the board is not updated
      if (!$scope.$$phase) {
        $scope.$apply();
      }

      // If the game ends, send the end game operation directly
      checkEndGame();

      if ($scope.isYourTurn) {
        switch($scope.state.stage) {
          case STAGE.DO_CLAIM:
            updateClaimRanks();
            break;
          case STAGE.DECLARE_CHEATER:
            if (params.playMode === 'passAndPlay' || $scope.currIndex == 0) {
              //$('#declareModal').modal('show');
              $scope.isDeclareModalShown = true;
            }
            break;
          case STAGE.CHECK_CLAIM:
            checkDeclaration();
            break;
          default:
        }
      }

      if ($scope.currIndex === 1 && $scope.isAiMode) {
        $scope.isYourTurn = false;
        $timeout(sendComputerMove, 1000);
      }
    }

    function sendUserMove(move) {
      if (!canMakeMove) {
        $log.info('User cannot make a move now! move=', move);
        return;
      }
      gameService.makeMove(move);
    }

    dragAndDropService.addDragListener("gameArea", handleDragEvent);


    var previousIndex = -1;
    var index;
    var holdCardType = 0; // 0 means not holding card, 1 means holding player1 card, 2 means holding player2 card, 3 means holding middle card
    var originalPosition;
    var originalZIndex = 0;
    function handleDragEvent(type, clientX, clientY) {
      // Center point in gameArea
      var x = clientX - gameArea.offsetLeft;
      var y = clientY - gameArea.offsetTop;
      var xPercent = x / gameArea.clientWidth;
      var yPercent = y / gameArea.clientHeight;

      if (type === "touchstart" || type === "touchmove"){
        if (yPercent < 0.93 && yPercent > 0.7 && !holdCardType){
          index = Math.floor(x / (playerOne0.clientWidth / 5));
          if (index >= $scope.playerOneCards.length && index < $scope.playerOneCards.length + 5){
            index = $scope.playerOneCards.length - 1;
          }
          draggingCard = document.getElementById("playerOne" + index);
          if (draggingCard && $scope.canDrag($scope.playerOneCards[index])) {
            originalPosition = {left: draggingCard.style.left, top: draggingCard.style.top};
            draggingCard.style.width = '12%';
            draggingCard.style.top = '66%';
            holdCardType = 1;
          } else {
            index = 0;
            draggingCard = null;
          }
        } else if (yPercent < 0.65 && yPercent > 0.4 && !holdCardType){
          index = Math.floor(x / (playerOne0.clientWidth / 5));
          if (index >= $scope.middle.length && index < $scope.middle.length + 5){
            index = $scope.middle.length - 1;
          }
          draggingCard = document.getElementById("middle" + index);
          if (draggingCard && $scope.canDrag($scope.middle[index])) {
            originalPosition = {left: draggingCard.style.left, top: draggingCard.style.top};
            draggingCard.style.width = '12%';
            draggingCard.style.top = '66%';
            holdCardType = 3;
          } else {
            index = 0;
            draggingCard = null;
          }
        } else if (yPercent < 0.3 && yPercent > 0.05 && !holdCardType){
          index = Math.floor(x / (playerOne0.clientWidth / 5));
          if (index >= $scope.playerTwoCards.length && index < $scope.playerTwoCards.length + 5){
            index = $scope.playerTwoCards.length - 1;
          }
          draggingCard = document.getElementById("playerTwo" + index);
          if (draggingCard && $scope.canDrag($scope.playerTwoCards[index])) {
            originalPosition = {left: draggingCard.style.left, top: draggingCard.style.top};
            draggingCard.style.width = '12%';
            draggingCard.style.top = '66%';
            holdCardType = 2;
          } else {
            index = 0;
            draggingCard = null;
          }
        } else {

        }
        if (draggingCard) {
          draggingCard.style.left = (xPercent - 0.05) * 100 + '%';
          draggingCard.style.top = (yPercent - 0.15) * 100 + '%';
        }
      } else if (type === "touchend") {  
        if (holdCardType === 1){
          if (yPercent < 0.6 && yPercent > 0.4){
            $scope.selectCard($scope.playerOneCards[index]);
          } else {
            draggingCard = document.getElementById("playerOne" + index);
            draggingCard.style.width = '10%';
            draggingCard.style.left = originalPosition.left;
            draggingCard.style.top = originalPosition.top; 
          }
        } else if (holdCardType === 2){
          if (yPercent < 0.6 && yPercent > 0.4){
            $scope.selectCard($scope.playerTwoCards[index]);
          } else {
            draggingCard = document.getElementById("playerTwo" + index);
            draggingCard.style.width = '10%';
            draggingCard.style.left = originalPosition.left;
            draggingCard.style.top = originalPosition.top; 
          }
        } else if (holdCardType === 3){
          if ((yPercent < 0.93 && yPercent > 0.7) || (yPercent < 0.3 && yPercent > 0.05)){
            $scope.selectCard($scope.middle[index]);
          } else {
            draggingCard = document.getElementById("middle" + index);
            draggingCard.style.width = '10%';
            draggingCard.style.left = originalPosition.left;
            draggingCard.style.top = originalPosition.top; 
          }
        } 
        draggingCard = null;
        holdCardType = 0;
      } else {
        return;
      }
      //previousIndex = index;    
      /*
      // Is outside gameArea?
      if (x < 0 || y < 0 || x >= gameArea.clientWidth || y >= gameArea.clientHeight) {
        if (draggingCard) {
          // Drag the piece where the touch is (without snapping to a square).
          var size = getSquareWidthHeight();
          setdraggingCardTopLeft({top: y - size.height / 2, left: x - size.width / 2});
        } else {
          return;
        }
      } else {
        // Inside gameArea. Let's find the containing square's row and col
        var col = Math.floor(colsNum * x / gameArea.clientWidth);
        var row = Math.floor(rowsNum * y / gameArea.clientHeight);
        var r_row = row;
        var r_col = col;

        if ($scope.rotate) {
          r_row = 7 - r_row;
          r_col = 7 - r_col;
        }

        if (type === "touchstart" && !draggingStartedRowCol) {
          // drag started
          var curPiece = $scope.board[r_row][r_col];
          if (curPiece && curPiece.charAt(0) === getTurn($scope.turnIndex)) {            
            draggingStartedRowCol = {row: row, col: col};
            draggingCard = document.getElementById("e2e_test_img_" + 
              $scope.getPieceKindInId(row, col) + '_' + 
              draggingStartedRowCol.row + "x" + draggingStartedRowCol.col);
            if (draggingCard) {
              draggingCard.style['z-index'] = ++nextZIndex;
              draggingCard.style['width'] = '80%';
              draggingCard.style['height'] = '80%';
              draggingCard.style['top'] = '10%';
              draggingCard.style['left'] = '10%';
              draggingCard.style['position'] = 'absolute';
            }

            draggingCardAvailableMoves = getdraggingCardAvailableMoves(r_row, r_col);
            for (var i = 0; i < draggingCardAvailableMoves.length; i++) {
              draggingCardAvailableMoves[i].style['stroke-width'] = '1';
              draggingCardAvailableMoves[i].style['stroke'] = 'purple';
              draggingCardAvailableMoves[i].setAttribute("rx", "10");
              draggingCardAvailableMoves[i].setAttribute("ry", "10");
            }
          }
        }
        if (!draggingCard) {
          return;
        }
        if (type === "touchend") {
          var from = draggingStartedRowCol;
          var to = {row: row, col: col};
          dragDone(from, to);
          
        } else {
          // Drag continue
          setdraggingCardTopLeft(getSquareTopLeft(row, col));
          var centerXY = getSquareCenterXY(row, col);
        }
      }
      if (type === "touchend" || type === "touchcancel" || type === "touchleave") {
        // drag ended
        // return the piece to it's original style (then angular will take care to hide it).
        setdraggingCardTopLeft(getSquareTopLeft(draggingStartedRowCol.row, draggingStartedRowCol.col));    
        draggingCard.style['width'] = '60%';
        draggingCard.style['height'] = '60%';
        draggingCard.style['top'] = '20%';
        draggingCard.style['left'] = '20%';
        draggingCard.style['position'] = 'absolute';
        for (var i = 0; i < draggingCardAvailableMoves.length; i++) {
              draggingCardAvailableMoves[i].style['stroke-width'] = '';
              draggingCardAvailableMoves[i].style['stroke'] = '';
              draggingCardAvailableMoves[i].setAttribute("rx", "");
              draggingCardAvailableMoves[i].setAttribute("ry", "");
        }
        draggingStartedRowCol = null;
        draggingCard = null;
        draggingCardAvailableMoves = null;
      }
      */
    }
    
    $scope.userClickedSomething = function (userChoices) {
      sendUserMove(gameLogic.createMove(state, turnIndex, userChoices));
    };

    gameService.setGame({
      minNumberOfPlayers: 2,
      maxNumberOfPlayers: 2,
      isMoveOk: gameLogic.isMoveOk,
      updateUI: updateUI
    });
  }]);
